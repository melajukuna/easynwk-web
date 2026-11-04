/* Im Beratungsraum bleibt nichts im Browser: Die Daten liegen verschlüsselt auf dem Server und kommen über
das Yjs-Dokument des Raums (einbau/abgleichPlugin.ts). Diese Datei liefert nur noch die leeren Anfangswerte. */

import { initNWKRecordAsJSON } from "@/data/NWKRecord";
import { initNWK } from "@/data/NWK";
import { ViewOptions, initDefaultViewOptions } from "@/data/ViewOptions";

export interface IUnReDoState {
  undoCount: number;
  redoCount: number;
}

export function loadNWKStateFromStore(): string {
  return JSON.stringify(initNWK());
}

export function loadNWKRecordStateFromStore(): string {
  return initNWKRecordAsJSON();
}

export function loadViewSettingsFromStore(): ViewOptions {
  return initDefaultViewOptions();
}
