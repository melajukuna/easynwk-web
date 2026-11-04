// Verbindet den Store der Netzwerkkarte mit dem Yjs-Dokument des Raums. Ersetzt im Original localStorage und das
// Rückgängig über wiederholte Änderungen: Das würde die Änderungen der anderen Person mit zurücknehmen.
import * as Y from "yjs";
import { Store } from "vuex";
import type { IStoreState } from "@/store";
import { initNWKRecord } from "@/data/NWKRecord";
import { LOKAL, istLeer, leseRecord, schreibeRecord } from "./abgleich.js";

interface Verbindung {
  doc: Y.Doc;
  schreiben: boolean;
  bereit: boolean;
  anwenden: boolean;
  undo: Y.UndoManager;
}

let verbunden: Verbindung | null = null;

export const abgleichPlugin = (store: Store<IStoreState>): void => {
  store.registerModule("unredo", {
    namespaced: true,
    state: { undoCount: 0, redoCount: 0 },
    mutations: {
      // Rückgängig löst selbst wieder eine Änderung aus, deshalb erst nach dieser hier
      undo() {
        queueMicrotask(() => verbunden?.undo.undo());
      },
      redo() {
        queueMicrotask(() => verbunden?.undo.redo());
      },
      zaehlen(
        state: { undoCount: number; redoCount: number },
        zahlen: { undo: number; redo: number }
      ) {
        state.undoCount = zahlen.undo;
        state.redoCount = zahlen.redo;
      },
    },
  });

  store.subscribe((mutation, state) => {
    const v = verbunden;
    if (!v || !v.bereit || !v.schreiben || v.anwenden) return;
    if (/^(view|session|pseudonym|unredo)\//.test(mutation.type)) return;
    schreibeRecord(v.doc, state.record, state.nwk);
  });
};

export function verbinden(
  store: Store<IStoreState>,
  optionen: { doc: Y.Doc; schreiben: boolean; egoName: string }
): { synchron: () => void; stand: (bytes: ArrayBuffer) => void; trennen: () => void } {
  const { doc, schreiben, egoName } = optionen;
  const versionen = doc.getMap("versionen");
  const meta = doc.getMap("meta");
  const undo = new Y.UndoManager([versionen, meta], {
    trackedOrigins: new Set([LOKAL]),
    captureTimeout: 400,
  });
  const v: Verbindung = { doc, schreiben, bereit: false, anwenden: false, undo };
  verbunden = v;

  const zaehlen = () =>
    store.commit("unredo/zaehlen", {
      undo: undo.undoStack.length,
      redo: undo.redoStack.length,
    });
  undo.on("stack-item-added", zaehlen);
  undo.on("stack-item-popped", zaehlen);

  const anwenden = () => {
    if (istLeer(doc)) return;
    v.anwenden = true;
    try {
      store.commit("einbauAnwenden", leseRecord(doc));
    } finally {
      v.anwenden = false;
    }
  };
  const beobachter = (_: unknown, transaktion: Y.Transaction) => {
    if (v.bereit && transaktion.origin !== LOKAL) anwenden();
  };
  versionen.observeDeep(beobachter);
  meta.observe(beobachter);

  return {
    // Der Server hat den Stand geliefert: Erst jetzt darf geschrieben werden, sonst löschte die leere Karte alles
    synchron() {
      if (v.bereit) return;
      if (istLeer(doc) && schreiben) {
        const record = initNWKRecord();
        record.versions[0].nwk.ego.name = egoName;
        schreibeRecord(doc, record, record.versions[0].nwk, "start");
      }
      v.bereit = true;
      undo.clear();
      anwenden();
      zaehlen();
    },
    stand(bytes: ArrayBuffer) {
      import("./abgleich.js").then(({ spieleStandEin }) =>
        spieleStandEin(doc, bytes)
      );
    },
    trennen() {
      versionen.unobserveDeep(beobachter);
      meta.unobserve(beobachter);
      undo.destroy();
      verbunden = null;
    },
  };
}
