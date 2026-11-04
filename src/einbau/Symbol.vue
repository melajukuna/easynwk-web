<template>
  <svg
    class="nwk-i"
    :class="size ? 'nwk-i-' + size : ''"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
    v-html="pfad"
  ></svg>
</template>

<script lang="ts">
// Ersetzt Font Awesome: dieselben Namen wie im Original, die Zeichen im Stil der Plattform.
import { defineComponent } from "vue";

const ZEICHEN: Record<string, string> = {
  bars: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  "file-alt": '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5"/>',
  file: '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4"/>',
  "plus-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M12 8v8M8 12h8"/>',
  "search-plus": '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3M11 8.5v5M8.5 11h5"/>',
  "search-minus": '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.3-4.3M8.5 11h5"/>',
  "pencil-alt": '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="m13.5 6.5 4 4"/>',
  "user-plus": '<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 20c.4-3.6 3-5.5 6.5-5.5 1.6 0 3 .4 4.2 1.1M18.5 14v6M15.5 17h6"/>',
  "user-minus": '<circle cx="10" cy="8.5" r="3.5"/><path d="M3.5 20c.4-3.6 3-5.5 6.5-5.5 1.6 0 3 .4 4.2 1.1M15.5 17h6"/>',
  "map-pin": '<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>',
  "exchange-alt": '<path d="M4 8h14l-3-3M20 16H6l3 3"/>',
  "project-diagram": '<rect x="3.5" y="4" width="6" height="5" rx="1"/><rect x="14.5" y="4" width="6" height="5" rx="1"/><rect x="9" y="15" width="6" height="5" rx="1"/><path d="M9.5 6.5h5M6.5 9l4.5 6M17.5 9 13 15"/>',
  "people-arrows": '<circle cx="6" cy="8" r="2.5"/><circle cx="18" cy="8" r="2.5"/><path d="M3 20c.3-3.5 1.5-6 3-6s2.7 2.5 3 6M15 20c.3-3.5 1.5-6 3-6s2.7 2.5 3 6M10 11h4"/>',
  "exclamation-triangle": '<path d="M12 4 2.8 20h18.4z"/><path d="M12 10v4.5M12 17.2v.1"/>',
  times: '<path d="M6 6l12 12M18 6 6 18"/>',
  "folder-open": '<path d="M3.5 7a2 2 0 0 1 2-2h4l2 2.5h7a2 2 0 0 1 2 2V18a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2z"/>',
  save: '<path d="M12 4v11M7 11l5 5 5-5M5 20h14"/>',
  "file-image": '<rect x="3.5" y="4.5" width="17" height="15" rx="2"/><circle cx="9" cy="10" r="1.6"/><path d="m4 17 5-4 3.5 2.5 3-2.5 5 4"/>',
  "file-csv": '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 12h5M10 16h5M12.5 10v8"/>',
  "file-pdf": '<path d="M7 3h7l4 4v14H7z"/><path d="M14 3v4h4M10 16.5h5M10 13h5"/>',
  "chevron-down": '<path d="m6 9 6 6 6-6"/>',
  "chevron-up": '<path d="m6 15 6-6 6 6"/>',
  undo: '<path d="M9 7 4.5 11.5 9 16"/><path d="M5 11.5h9a5 5 0 0 1 5 5V18"/>',
  redo: '<path d="m15 7 4.5 4.5L15 16"/><path d="M19 11.5h-9a5 5 0 0 0-5 5V18"/>',
  "expand-arrows-alt": '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
  "compress-arrows-alt": '<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>',
  "chart-bar": '<path d="M5 20v-6M12 20V5M19 20v-9"/>',
  "user-secret": '<circle cx="12" cy="9" r="3.5"/><path d="M5 20c.5-3.8 3.3-6 7-6s6.5 2.2 7 6M4 4l16 16"/>',
  rss: '<circle cx="6" cy="18" r="1.5"/><path d="M5 11a8 8 0 0 1 8 8M5 5a14 14 0 0 1 14 14"/>',
  font: '<path d="M5 20 12 4l7 16M8 14h8"/>',
  "trash-alt": '<path d="M4 7h16M9 7V4h6v3M6.5 7l1 13h9l1-13M10 11v5.5M14 11v5.5"/>',
  "info-circle": '<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.1"/>',
  info: '<path d="M12 10.5V20M12 5v.1"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  "arrow-left": '<path d="M19 12H5M11 6l-6 6 6 6"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  unlink: '<path d="M15.7 14 18.7 11a4 4 0 0 0-5.7-5.7l-1 1M8.3 10l-3 3a4 4 0 0 0 5.7 5.7l1-1M4 4l16 16"/>',
  "arrows-alt": '<path d="M12 3v18M3 12h18M12 3 9.5 5.5M12 3l2.5 2.5M12 21l-2.5-2.5M12 21l2.5-2.5M3 12l2.5-2.5M3 12l2.5 2.5M21 12l-2.5-2.5M21 12l-2.5 2.5"/>',
  copy: '<rect x="8.5" y="8.5" width="11.5" height="11.5" rx="2"/><path d="M15.5 8.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7.5a2 2 0 0 0 2 2h2.5"/>',
  heart: '<path d="M12 20s-7.5-4.6-7.5-10A4.2 4.2 0 0 1 12 7.4 4.2 4.2 0 0 1 19.5 10C19.5 15.4 12 20 12 20z"/>',
  "hand-holding-heart": '<path d="M12 11.5S8.5 9.3 8.5 6.8A2 2 0 0 1 12 5.5a2 2 0 0 1 3.5 1.3c0 2.5-3.5 4.7-3.5 4.7z"/><path d="M3 15h4l3 1.5h4a1.5 1.5 0 0 1 0 3H9M14 18l5-2.5a1.5 1.5 0 0 1 1.5 2.5L14 21.5H3"/>',
  toolbox: '<rect x="3.5" y="8" width="17" height="11.5" rx="2"/><path d="M8.5 8V5.5h7V8M3.5 13h17M10.5 13v2M13.5 13v2"/>',
  lightbulb: '<path d="M9 17.5h6M10 20.5h4M12 3.5a6 6 0 0 0-3.5 10.9c.5.4.5 1.1.5 1.6h6c0-.5 0-1.2.5-1.6A6 6 0 0 0 12 3.5z"/>',
  users: '<circle cx="9" cy="8.5" r="3.5"/><path d="M3 20c.4-3.6 2.9-5.5 6-5.5s5.6 1.9 6 5.5"/><path d="M15.5 5.3a3.5 3.5 0 0 1 0 6.4M17.5 14.8c2 .7 3.2 2.5 3.5 5.2"/>',
  icons: '<circle cx="12" cy="12" r="8.5"/><path d="M8.5 14.5a4.2 4.2 0 0 0 7 0M9 9.5v.1M15 9.5v.1"/>',
};

export default defineComponent({
  name: "NwkSymbol",
  props: { icon: { type: String, required: true }, size: String },
  computed: {
    pfad(): string {
      return ZEICHEN[this.icon] ?? "";
    },
  },
});
</script>
