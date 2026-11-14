<script setup lang="ts">
import type { Plot } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { growthStage, sceneTrees } from "../lib/scene";
import { ready } from "../lib/crops";
import type { Season } from "../../clock/lib/seasons";
defineProps<{
  plots: readonly Readonly<Plot>[];
  weather: string;
  season: Season;
}>();
defineEmits<{ plot: [id: number] }>();
</script>
<template>
  <div class="farm-scene" :class="[weather, season]">
    <div class="cloud cloud-one"></div>
    <div class="cloud cloud-two"></div>
    <div v-if="weather === 'snow'" class="snowfall">
      <i v-for="n in 18" :key="n" :style="{ left: `${(n * 5.5) % 100}%`, animationDelay: `${(n % 6) * 0.7}s`, animationDuration: `${4 + (n % 5)}s` }"></i>
    </div>
    <div class="mountain"></div>
    <div class="forest">
      <div
        v-for="(tree, i) in sceneTrees"
        :key="i"
        class="pixel-tree"
        :style="{
          left: tree.left,
          top: tree.top,
          transform: `scale(${tree.scale})`,
        }"
      ></div>
    </div>
    <div class="barn">
      <div class="roof"></div>
      <div class="barn-window">✚</div>
      <div class="barn-door"></div>
      <span>MEADOW</span>
    </div>
    <div class="windmill">✣<i></i></div>
    <div class="pond"><i></i></div>
    <div class="fence">╬ ╬ ╬ ╬ ╬ ╬ ╬ ╬ ╬ ╬ ╬ ╬</div>
    <div class="field-grid">
      <button
        v-for="plot in plots"
        :key="plot.id"
        class="plot"
        :class="{
          'is-ready': plot.crop && ready(plot.crop),
          'is-dormant': plot.crop?.dormant,
        }"
        :data-plot="plot.id"
        @click="$emit('plot', plot.id)"
      >
        <span
          v-if="plot.crop"
          class="crop"
          :style="{ fontSize: `${14 + growthStage(plot) * 8}px` }"
          >{{
            growthStage(plot) === 1 ? "🌱" : items[plot.crop.item].icon
          }}</span
        ><span v-else class="empty-plot">+</span
        ><b v-if="plot.crop && ready(plot.crop)" class="ready-mark">!</b
        ><b v-if="plot.crop?.dormant" class="frost-mark" title="冬季休眠中">❄</b
        ><i
          v-if="plot.crop"
          class="water-meter"
          :style="{ width: `${plot.crop.water}%` }"
        ></i>
      </button>
    </div>
    <div class="scene-sign">青禾农场<br /><small>EST. 2026</small></div>
    <span class="scene-flower">✿</span>
  </div>
</template>
