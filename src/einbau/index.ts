/*!
 * easyNWK, egocentered network map for social work
 * https://github.com/fhstp/easynwk-web
 * Angepasst für den Beratungsraum: https://github.com/melajukuna/easynwk-web
 *
 * MIT License
 *
 * Copyright (c) 2020 University of Applied Sciences Sankt Pölten
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
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
