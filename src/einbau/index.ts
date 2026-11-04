// Einstieg für den Beratungsraum: hängt die Netzwerkkarte in ein Element und verbindet sie mit dem Yjs-Dokument des Raums.
import { createApp } from "vue";
import type * as Y from "yjs";
import { key, store } from "@/store";
import NetzwerkKarte from "./NetzwerkKarte.vue";
import NwkSymbol from "./Symbol.vue";
import { verbinden } from "./abgleichPlugin";
import "./thema.scss";

export interface KartenOptionen {
  doc: Y.Doc;
  /** coach, client oder view */
  rolle: string;
  /** So heißt die Person in der Mitte, solange noch niemand etwas anderes eingetragen hat */
  egoName: string;
  datei: string;
  aktionen?: { melden?: (format: string) => void; verlauf?: () => void };
}

export function starteNetzwerkkarte(element: Element, optionen: KartenOptionen) {
  const abgleich = verbinden(store, {
    doc: optionen.doc,
    schreiben: optionen.rolle !== "view",
    egoName: optionen.egoName,
  });
  const app = createApp(NetzwerkKarte, {
    rolle: optionen.rolle,
    datei: optionen.datei,
    aktionen: optionen.aktionen ?? {},
  });
  app.component("font-awesome-icon", NwkSymbol);
  app.use(store, key);
  app.mount(element);

  return {
    synchron: abgleich.synchron,
    stand: abgleich.stand,
    destroy() {
      app.unmount();
      abgleich.trennen();
      store.commit("newNWK");
    },
  };
}
