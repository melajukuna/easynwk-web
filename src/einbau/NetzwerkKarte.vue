<template>
  <div
    class="nwk"
    :class="{ 'nwk-lesen': rolle === 'view', 'nwk-klient': rolle !== 'coach' }"
  >
    <div id="chart" class="nwk-karte" ref="karte">
      <NetworkMap :key="sprache" @map-click="mapclick" />
      <p v-if="fehltPosition" class="nwk-karten-hinweis">{{ t("maptext") }} {{ t("maptext2") }}</p>
    </div>

    <aside class="nwk-seite">
      <div class="panel nwk-kopf">
        <EgoHeader v-if="!egoEditMode" @edit="egoEditMode = true" :key="sprache" />
        <UndoRedo v-if="rolle !== 'view'" />
      </div>
      <EgoEditForm v-if="egoEditMode" @edit-finished="egoEditMode = false" :key="sprache + 'e'" />
      <AlteriPanel v-else :mapclicked="mapclicked" :key="sprache + 'a'" />
      <ViewOptionsPanel :key="sprache + 'v'" />
      <SupportPanel v-if="zeigeQualitaeten" :key="sprache + 's'" />
      <!-- Fassungen, Kennzahlen und Export nur für Berater*innen (Heiner, 04.11.2026) -->
      <template v-if="rolle === 'coach'">
        <ComparisonOptionsPanel :key="sprache + 'c'" />
        <StatisticsPanel :key="sprache + 'k'" />
        <div class="panel">
          <p class="panel-heading" @click="exportOffen = !exportOffen">
            <span>{{ t("exportheading") }}</span>
            <span class="icon clickAble right">
              <font-awesome-icon :icon="exportOffen ? 'chevron-up' : 'chevron-down'" />
            </span>
          </p>
          <div class="panel-block" v-if="exportOffen">
            <div class="buttons">
              <button type="button" class="button is-small" @click="druck">
                <span class="icon"><font-awesome-icon icon="file-pdf" /></span>
                <span>{{ t("createPDF") }}</span>
              </button>
              <button type="button" class="button is-small" @click="png">
                <span class="icon"><font-awesome-icon icon="file-image" /></span>
                <span>{{ t("exportPNG") }}</span>
              </button>
              <button type="button" class="button is-small" @click="csv">
                <span class="icon"><font-awesome-icon icon="file-csv" /></span>
                <span>{{ t("exportkeyfigures") }}</span>
              </button>
              <button type="button" class="button is-small" @click="json">
                <span class="icon"><font-awesome-icon icon="save" /></span>
                <span>{{ t("exportdata") }}</span>
              </button>
              <button v-if="aktionen.verlauf" type="button" class="button is-small" @click="aktionen.verlauf()">
                <span class="icon"><font-awesome-icon icon="undo" /></span>
                <span>{{ t("olderstates") }}</span>
              </button>
            </div>
          </div>
        </div>
      </template>
      <p class="nwk-quelle">{{ t("sourcenote") }}</p>
    </aside>

    <!-- Wird nur zum Drucken in den Fuß der Seite kopiert (druck) -->
    <div class="nwk-druckliste" ref="druckliste" hidden>
      <h1>{{ t("mapof") }} {{ ego.name }}</h1>
      <p v-if="version">{{ version.title }} {{ datum(version.date) }}</p>
      <h2>{{ t("contacts") }}</h2>
      <table class="nwk-drucktabelle">
        <thead>
          <tr>
            <th>{{ t("name") }}</th>
            <th>{{ t("role") }}</th>
            <th>{{ t("age") }}</th>
            <th>{{ t("relationship") }}</th>
            <th>{{ t("note") }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in alteri" :key="a.id">
            <td>{{ anzeigeName(a) }}</td>
            <td>{{ a.role }}</td>
            <td>{{ a.age }}</td>
            <td>{{ beziehung(a) }}</td>
            <td>{{ a.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, PropType, ref } from "vue";
import { useStore } from "@/store";
import de from "@/de";
import en from "@/en";
import { downloadSVGasPNG, downloadText } from "@/assets/utils";
import { statisticsCSV } from "@/data/statisticsCSV";
import AlteriPanel from "@/components/AlteriPanel.vue";
import ComparisonOptionsPanel from "@/components/ComparisonOptionsPanel.vue";
import EgoEditForm from "@/components/EgoEditForm.vue";
import EgoHeader from "@/components/EgoHeader.vue";
import NetworkMap from "@/components/NetworkMap.vue";
import StatisticsPanel from "@/components/StatisticsPanel.vue";
import SupportPanel from "@/components/SupportPanel.vue";
import UndoRedo from "@/components/UndoRedo.vue";
import ViewOptionsPanel from "@/components/ViewOptionsPanel.vue";
import { TAB_BASE } from "@/store/sessionModule";
import type { Alter } from "@/data/Alter";

export default defineComponent({
  name: "NetzwerkKarte",
  mixins: [de, en],
  components: {
    AlteriPanel,
    ComparisonOptionsPanel,
    EgoEditForm,
    EgoHeader,
    NetworkMap,
    StatisticsPanel,
    SupportPanel,
    UndoRedo,
    ViewOptionsPanel,
  },
  props: {
    rolle: { type: String, required: true },
    datei: { type: String, default: "netzwerkkarte" },
    aktionen: {
      type: Object as PropType<{
        melden?: (format: string) => void;
        verlauf?: () => void;
      }>,
      default: () => ({}),
    },
  },
  methods: {
    t(prop: string) {
      return this[document.documentElement.lang][prop];
    },
    datum(wert: string) {
      return wert ? new Date(wert).toLocaleDateString(document.documentElement.lang) : "";
    },
    beziehung(a: Alter) {
      return a.edgeType === 2
        ? this.t("multiplex")
        : a.edgeType === 1
        ? this.t("existing")
        : this.t("nocurrentrelationship");
    },
    /** Karte und Liste kurz in den Fuß der Seite kopieren, alles andere blendet das Druckbild aus (thema.scss) */
    druck() {
      const kopie = document.createElement("div");
      kopie.className = "nwk-druck nwk-hell";
      const liste = (this.$refs.druckliste as HTMLElement).cloneNode(true) as HTMLElement;
      liste.hidden = false;
      const karte = document.querySelector("#nwkmap")?.cloneNode(true);
      kopie.append(liste.querySelector("h1") as Node);
      if (liste.querySelector("p")) kopie.append(liste.querySelector("p") as Node);
      if (karte) kopie.append(karte);
      kopie.append(liste);
      document.body.append(kopie);
      const titel = document.title;
      document.title = this.datei;
      const fertig = () => {
        kopie.remove();
        document.title = titel;
        window.removeEventListener("afterprint", fertig);
      };
      window.addEventListener("afterprint", fertig);
      this.aktionen.melden?.("pdf");
      window.print();
    },
    png() {
      downloadSVGasPNG(this.datei + ".png", "#nwkmap");
      this.aktionen.melden?.("png");
    },
    csv() {
      this.$store.commit("prepareToSaveJSON");
      downloadText(this.datei + ".csv", statisticsCSV(this.$store.state.record.versions));
      this.aktionen.melden?.("csv");
    },
    json() {
      this.$store.commit("prepareToSaveJSON");
      downloadText(this.datei + ".json", JSON.stringify(this.$store.state.record, null, 2));
      this.aktionen.melden?.("json");
    },
  },
  setup() {
    const store = useStore();
    const mapclicked = ref(false);
    const egoEditMode = ref(false);
    const exportOffen = ref(false);
    const version = computed(() =>
      store.state.record.versions.find((v) => v.id === store.state.record.currentVersion)
    );

    return {
      mapclicked,
      egoEditMode,
      exportOffen,
      version,
      fehltPosition: computed(() => {
        const s = store.state.session;
        if (s.editIndex == null || s.editTab !== TAB_BASE) return false;
        return !(store.state.nwk.alteri[s.editIndex]?.distance > 0);
      }),
      sprache: document.documentElement.lang,
      ego: computed(() => store.state.nwk.ego),
      alteri: computed(() => store.state.nwk.alteri),
      anzeigeName: computed(() => store.getters.displayName),
      zeigeQualitaeten: computed(() => store.state.view.qualityRelationship),
      mapclick: () => {
        mapclicked.value = !mapclicked.value;
        // Am Handy kommt die Tastatur erst jetzt, die Stelle ist gesetzt. Das muss noch im Tippen passieren,
        // später öffnet iOS die Tastatur nicht mehr.
        const s = store.state.session;
        if (
          window.matchMedia("(pointer: coarse)").matches &&
          s.editIndex != null &&
          !store.state.nwk.alteri[s.editIndex]?.name
        ) {
          document.querySelector<HTMLInputElement>('.alteriform input[type="text"]')?.focus();
        }
      },
    };
  },
});
</script>
