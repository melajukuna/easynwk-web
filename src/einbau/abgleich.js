// Abgleich zwischen dem Yjs-Dokument des Raums und den Daten der Netzwerkkarte (NWKRecord).
// Bewusst ohne Vue und ohne Store, damit es sich allein testen lässt (node --test).
//
// Aufbau des Dokuments:
//   versionen: Karte je Fassung, Schlüssel = Fassung
//     id, title, date, ego (JSON)
//     alteri: Schlüssel = Person, Wert = JSON
//     connections: Schlüssel = "kleine id-große id", Wert = 1
//   meta: aktuell (gezeigte Fassung), personen (Zahl für die Karte im Raum)
//
// Jede Person liegt einzeln im Dokument. So überschreiben sich zwei Menschen nicht, die gleichzeitig an verschiedenen
// Personen arbeiten. Personen ohne Namen oder ohne Position sind Entwürfe und bleiben im Browser, bis sie fertig sind.
import * as Y from 'yjs';

export const LOKAL = Symbol('nwk-lokal');

export const istGueltig = (alter) => String(alter?.name ?? '').trim().length > 0 && alter.distance > 0;

const kantenSchluessel = (c) => `${Math.min(c.id1, c.id2)}-${Math.max(c.id1, c.id2)}`;

/** Neue Kennung: Zählen geht nicht mehr, wenn zwei Menschen gleichzeitig Personen anlegen */
export const neueId = () => Date.now() * 1000 + Math.floor(Math.random() * 1000);

export const istLeer = (doc) => doc.getMap('versionen').size === 0;

const setze = (map, schluessel, wert) => {
    if (map.get(schluessel) !== wert) map.set(schluessel, wert);
};

/** Das Dokument als NWKRecord. Die Neuesten stehen oben, wie beim Anlegen im Original. */
export function leseRecord(doc) {
    const versions = [];
    doc.getMap('versionen').forEach((v) => {
        if (!(v instanceof Y.Map)) return;
        const alteri = [];
        v.get('alteri')?.forEach((json) => {
            try {
                alteri.push(JSON.parse(json));
            } catch {
                // Eine kaputte Person soll nie die ganze Karte blockieren
            }
        });
        alteri.sort((a, b) => b.id - a.id);
        const ids = new Set(alteri.map((a) => a.id));
        const connections = [];
        v.get('connections')?.forEach((_, schluessel) => {
            const [id1, id2] = schluessel.split('-').map(Number);
            // Jemand hat die Person gelöscht, während jemand anderes sie verbunden hat
            if (ids.has(id1) && ids.has(id2)) connections.push({ id1, id2 });
        });
        let ego;
        try {
            ego = JSON.parse(v.get('ego'));
        } catch {
            ego = { name: '', age: '', currentGender: 'nicht festgelegt', note: '', emoji: '' };
        }
        versions.push({ id: v.get('id'), title: v.get('title') ?? '', date: v.get('date') ?? '', nwk: { ego, alteri, connections } });
    });
    versions.sort((a, b) => a.id - b.id);
    const aktuell = doc.getMap('meta').get('aktuell');

    return {
        versions,
        currentVersion: versions.some((v) => v.id === aktuell) ? aktuell : versions[versions.length - 1]?.id,
        size: '5',
    };
}

/** Nur was sich geändert hat, kommt ins Dokument. nwk ist die gerade gezeigte Fassung, sie kann neuer sein als record. */
export function schreibeRecord(doc, record, nwk, origin = LOKAL) {
    const versionen = doc.getMap('versionen');
    const meta = doc.getMap('meta');
    doc.transact(() => {
        const gewuenscht = new Set(record.versions.map((v) => String(v.id)));
        [...versionen.keys()].forEach((id) => { if (!gewuenscht.has(id)) versionen.delete(id); });

        for (const v of record.versions) {
            let ym = versionen.get(String(v.id));
            if (!(ym instanceof Y.Map)) {
                ym = new Y.Map();
                versionen.set(String(v.id), ym);
                ym.set('id', v.id);
                ym.set('alteri', new Y.Map());
                ym.set('connections', new Y.Map());
            }
            const inhalt = v.id === record.currentVersion && nwk ? nwk : v.nwk;
            setze(ym, 'title', v.title ?? '');
            setze(ym, 'date', v.date ?? '');
            setze(ym, 'ego', JSON.stringify(inhalt.ego));

            const ya = ym.get('alteri');
            const daheim = new Set(inhalt.alteri.map((a) => String(a.id)));
            [...ya.keys()].forEach((id) => { if (!daheim.has(id)) ya.delete(id); });
            for (const a of inhalt.alteri) {
                if (istGueltig(a)) setze(ya, String(a.id), JSON.stringify(a));
            }

            const yc = ym.get('connections');
            const kanten = new Set(inhalt.connections.map(kantenSchluessel));
            [...yc.keys()].forEach((k) => { if (!kanten.has(k)) yc.delete(k); });
            kanten.forEach((k) => setze(yc, k, 1));
        }
        setze(meta, 'aktuell', record.currentVersion);
        const zahl = (nwk ?? record.versions.find((v) => v.id === record.currentVersion)?.nwk)?.alteri.filter(istGueltig).length ?? 0;
        setze(meta, 'personen', zahl);
    }, origin);
}

/** Einen früheren Stand ins laufende Dokument spielen, für alle sichtbar und mit „Rückgängig“ */
export function spieleStandEin(doc, bytes, origin = LOKAL) {
    const alt = new Y.Doc();
    if (bytes?.byteLength) Y.applyUpdate(alt, new Uint8Array(bytes));
    const record = leseRecord(alt);
    if (record.versions.length > 0) schreibeRecord(doc, record, null, origin);
    alt.destroy();
}
