<template>
  <g id="coords" v-if="showHorizons">
    <!-- <rect x="-120" y="-120" width="240" height="240" fill="#bcbddc"/> -->
    <circle
      id="horizon-base"
      :cx="egoCoords[0]"
      :cy="egoCoords[1]"
      :r="horiRadii.r3"
    />
    <circle
      id="horizon-overlay"
      :cx="egoCoords[0]"
      :cy="egoCoords[1]"
      :r="horiRadii.r2"
    />
    <circle
      id="horizon-overlay"
      :cx="egoCoords[0]"
      :cy="egoCoords[1]"
      :r="horiRadii.r1"
    />
    <line
      :x1="egoCoords[0]"
      :y1="egoCoords[1] - horiRadii.r3"
      :x2="egoCoords[0]"
      :y2="egoCoords[1] + horiRadii.r3"
    />
    <line
      :x1="egoCoords[0] - horiRadii.r3"
      :y1="egoCoords[1]"
      :x2="egoCoords[0] + horiRadii.r3"
      :y2="egoCoords[1]"
    />
  </g>
  <g id="coords-min" v-else>
    <circle :cx="egoCoords[0]" :cy="egoCoords[1]" :r="horiRadii.r3" />
    <line
      :x1="egoCoords[0]"
      :y1="egoCoords[1] - horiRadii.r3"
      :x2="egoCoords[0]"
      :y2="egoCoords[1] + horiRadii.r3"
    />
    <line
      :x1="egoCoords[0] - horiRadii.r3"
      :y1="egoCoords[1]"
      :x2="egoCoords[0] + horiRadii.r3"
      :y2="egoCoords[1]"
    />
  </g>
</template>

<script lang="ts">
import { defineComponent, computed } from "vue";
import { useStore } from "@/store";

// get Zoom Behavior transform as property
// emit <nothing>

export default defineComponent({
  props: {
    transform: {
      type: Object,
      required: true,
    },
  },
  setup(props) {
    const store = useStore();

    const egoCoords = computed(() => props.transform.apply([0, 0]));

    const horiRadii = computed((): { r1: number; r2: number; r3: number } => {
      // project to viewport using zoomBehaviour's transform
      return {
        r1: 33.33 * props.transform.k,
        r2: 66.67 * props.transform.k,
        r3: 100 * props.transform.k,
      };
    });

    return {
      // egoLabel: computed(
      //   () =>
      //     store.state.nwk.ego.name +
      //     (store.state.nwk.ego.age.length > 0
      //       ? " (" + store.state.nwk.ego.age + "a)"
      //       : "")
      // ),
      // egoShape: computed(() =>
      //   shapeByGender(true, store.state.nwk.ego.currentGender)
      // ),
      egoCoords,
      horiRadii,
      showHorizons: computed(() => store.state.view.horizons),
    };
  },
});
</script>

<style scoped lang="scss">

text {
  font-family: inherit;
  font-size: 4px;
  -webkit-user-select: none; /* Safari */
  user-select: none;
}

circle#horizon-base {
  fill: var(--accent-soft);
}

circle#horizon-overlay {
  fill: color-mix(in srgb, var(--surface) 50%, transparent);
}

#coords line {
  stroke: var(--surface);
  stroke-width: 2;
}

#coords-min line {
  vector-effect: non-scaling-stroke;
  stroke: var(--line);
  stroke-width: 1;
}

#coords-min circle {
  vector-effect: non-scaling-stroke;
  stroke: var(--line);
  stroke-width: 2;
  fill: none;
}
</style>
