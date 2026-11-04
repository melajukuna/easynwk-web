import { InjectionKey } from "vue";
import {
  createStore,
  useStore as baseUseStore,
  Store,
} from "vuex";

import { SYMBOL_DECEASED } from "@/assets/utils";
import { Alter, initAlter } from "@/data/Alter";
import { NWK } from "@/data/NWK";
import { NWKRecord } from "@/data/NWKRecord";
import { ViewOptions } from "@/data/ViewOptions";

import { applyAdaptiveNWKDefaults } from "./adaptiveNWKDefaults";

import { IUnReDoState } from "./localStoragePlugin";
import { abgleichPlugin } from "@/einbau/abgleichPlugin";
import { istGueltig, neueId } from "@/einbau/abgleich.js";
import { editAlter, nwkModule } from "./nwkModule";
import { pseudonymPlugin, PseudonymState } from "./pseudonymPlugin";
import { viewOptionsModule } from "./viewSettingsModule";
import { TAB_BASE, sessionModule, SessionState } from "./sessionModule";
import {
  nwkRecordModule,
  nwkRecordMutationsAtRoot,
} from "@/store/nwkRecordModule";

export interface IStoreState {
  nwk: NWK;
  record: NWKRecord;
  view: ViewOptions;
  session: SessionState;
  unredo: IUnReDoState;
  pseudonym: PseudonymState;
}

const getters = {
  editedAlterValid(state: IStoreState): boolean {
    if (state.session.editIndex != null) {
      const alter = state.nwk.alteri[state.session.editIndex];
      return alter.distance > 0 && alter.name.trim().length > 0;
    } else {
      // no alter open to edit --> always valid
      return true;
    }
  },

  displayName(state: IStoreState) {
    return (alter: Alter) =>
      (alter.deceased ? SYMBOL_DECEASED : "") +
      (state.pseudonym.active
        ? store.getters["pseudonym/pseudonize"](alter.id)
        : alter.name);
  },

  // networkAnalysis(state: NWK): NetworkAnalysis {
  //   return analyseNWK(state);
  // },
};

const mutations = {
  ...nwkRecordMutationsAtRoot, // import mutations related to NWKRecord

  /** Stand aus dem Yjs-Dokument übernehmen. Entwürfe ohne Namen oder Position bleiben, das offene Formular auch. */
  einbauAnwenden(state: IStoreState, record: NWKRecord): void {
    const offen =
      state.session.editIndex != null
        ? state.nwk.alteri[state.session.editIndex]?.id
        : null;
    const version =
      record.versions.find((v) => v.id === record.currentVersion) ??
      record.versions[0];
    if (!version) return;
    const drin = new Set(version.nwk.alteri.map((a) => a.id));
    const lokal = new Map(state.nwk.alteri.map((a) => [a.id, a]));
    version.nwk.alteri = [
      ...state.nwk.alteri.filter((a) => !drin.has(a.id) && !istGueltig(a)),
      ...version.nwk.alteri.map((a) => {
        const hier = lokal.get(a.id);
        return hier && !istGueltig(hier) ? hier : a;
      }),
    ];
    state.record = record;
    state.nwk = version.nwk;
    if (offen != null) {
      const index = state.nwk.alteri.findIndex((a) => a.id === offen);
      state.session.editIndex = index >= 0 ? index : null;
      if (index < 0) state.session.editTab = "";
    }
  },

  addAlter(state: IStoreState, initialValues: Partial<Alter> = {}): void {
    // initialize alter with default values and optionally with the passed values
    const newAlter = {
      ...initAlter(),
      ...initialValues,
    };
    applyAdaptiveNWKDefaults(newAlter, initialValues);

    // Zählen geht nicht mehr: Zwei Menschen können im Raum gleichzeitig Personen anlegen
    newAlter.id = neueId();

    // new alter is always added on top of list
    state.nwk.alteri.unshift(newAlter);
    state.session.editIndex = 0;
    state.session.editTab = TAB_BASE;
  },

  // removes a newly added alter from the list
  cancelAddAlter(state: IStoreState, alterIndex: number): void {
    // console.log("cancel " + alterIndex);

    // canceled alter is new and therefore cannot have connections
    // don't delete with index null value (see #97)
    if (alterIndex !== null) {
      state.nwk.alteri.splice(alterIndex, 1);
    }

    state.session.editIndex = null;
    state.session.editTab = "";
  },
  /*cancelAddVersion(state: IStoreState, versionIndex: number): void {
    // canceled alter is new and therefore cannot have connections
    // don't delete with index null value (see #97)
    if (versionIndex !== null) {
      state.nwk.versions.splice(versionIndex, 1);
    }

    state.session.editIndex = null;
    state.session.editTab = "";
  },

   */
  openAlterFormById(
    state: IStoreState,
    payload: { alterId: number; tab?: string }
  ): void {
    const index = state.nwk.alteri.findIndex((a) => a.id === payload.alterId);
    state.session.editIndex = index;
    state.session.editTab = payload.tab ? payload.tab : TAB_BASE;
  },
  editAndCloseAlterForm(
    state: IStoreState,
    payload: { changes: Partial<Alter> }
  ): void {
    const index = state.session.editIndex;

    editAlter(state.nwk, index, payload.changes);

    if (
      index == null ||
      (state.nwk.alteri[index].name.trim().length > 0 &&
        state.nwk.alteri[index].distance > 0)
    ) {
      // only close if the alter is valid (esp. has name)
      state.session.editIndex = null;
      state.session.editTab = "";
    }
  },
};

const plugins = [abgleichPlugin, pseudonymPlugin];

export const store = createStore<IStoreState>({
  modules: {
    nwk: nwkModule,
    record: nwkRecordModule,
    view: viewOptionsModule,
    session: sessionModule,
  },
  getters,
  mutations,
  plugins,
});

// TypeScript support <https://next.vuex.vuejs.org/guide/typescript-support.html#typing-usestore-composition-function>
// define injection key
export const key: InjectionKey<Store<IStoreState>> = Symbol();

// define your own `useStore` composition function
export function useStore(): Store<IStoreState> {
  return baseUseStore(key);
}
