<script setup lang="ts">
import { computed } from "vue";
import { weatherAt, weatherInfo } from "../lib/weather";
import {
  seasonAt,
  seasonInfo,
  tempAt,
  yearOf,
  dayOfSeason,
  SEASON_HOURS,
} from "../lib/seasons";
import { hourLabel } from "../../../shared/catalog";
const props = defineProps<{ hour: number; paused: boolean }>();
defineEmits<{
  advance: [hours: number];
  toggle: [];
  save: [];
  load: [];
  reset: [];
}>();
const weather = computed(() => weatherInfo[weatherAt(props.hour)]);
const season = computed(() => seasonInfo[seasonAt(props.hour)]);
const temp = computed(() =>
  tempAt(props.hour, weatherAt(props.hour)).toFixed(1),
);
const seasonDay = computed(
  () => `${dayOfSeason(props.hour)}/${SEASON_HOURS / 24} 天`,
);
</script>
<template>
  <section class="clock-bar">
    <div class="date-block">
      <span class="eyebrow">FARM ALMANAC / 01</span
      ><strong>{{ hourLabel(hour) }}</strong
      ><small>第 {{ yearOf(hour) }} 年 · 第 {{ seasonDay }}</small>
    </div>
    <div class="season-chip">
      <b>{{ season.icon }}</b>
      <div>
        {{ season.name }}<small>季节流转 · 跨季逐小时结算</small>
      </div>
    </div>
    <div class="weather">
      <b>{{ weather.icon }}</b>
      <div>
        {{ weather.name }} · {{ temp }}℃<small>{{
          weather.description
        }}</small>
      </div>
    </div>
    <div class="clock-actions">
      <button @click="$emit('toggle')">
        {{ paused ? "▶ 运行" : "Ⅱ 暂停" }}</button
      ><button @click="$emit('advance', 1)">+1 小时</button
      ><button @click="$emit('advance', 6)">+6 小时</button
      ><button @click="$emit('advance', 24)">下一天</button>
    </div>
    <div class="save-actions">
      <button @click="$emit('save')">保存</button
      ><button @click="$emit('load')">恢复</button
      ><button @click="$emit('reset')">新农场</button>
    </div>
  </section>
</template>
