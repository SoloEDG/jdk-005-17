<script setup lang="ts">
import type { Item, Plot } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { crops, growthEfficiency, ready } from "../lib/crops";
defineProps<{
  plots: readonly Readonly<Plot>[];
  selected: Item;
  active: number;
  temp: number;
}>();
defineEmits<{
  select: [item: Item];
  plant: [id: number];
  water: [id: number];
  harvest: [id: number];
}>();
const seeds: Item[] = ["carrot", "corn", "berry"];
</script>
<template>
  <section class="panel seed-panel">
    <div class="panel-heading">
      <h2>土地与种植</h2>
      <span>12 块沃土 · 当前 {{ temp.toFixed(1) }}℃</span>
    </div>
    <div class="seed-list">
      <button
        v-for="item in seeds"
        :key="item"
        :class="{ selected: selected === item }"
        @click="$emit('select', item)"
      >
        <b>{{ items[item].icon }}</b><strong>{{ items[item].name }}</strong
        ><small
          >{{ crops[item]?.duration }}h · ¥{{ crops[item]?.cost }}<br />适生
          {{ crops[item]?.idealLow }}~{{ crops[item]?.idealHigh }}℃ ·
          {{ crops[item]?.minTemp }}℃ 休眠</small
        >
      </button>
    </div>
    <div class="plot-details">
      <strong>土地 {{ active + 1 }}</strong>
      <template v-if="plots[active]?.crop">
        <span
          >生长 {{ plots[active]!.crop!.growth.toFixed(1) }} /
          {{ crops[plots[active]!.crop!.item]?.duration }}h · 水分
          {{ plots[active]!.crop!.water }}%</span
        >
        <p v-if="plots[active]!.crop!.dormant" class="dormant-note">
          ❄ 休眠中：生长进度保留，受冻压力
          {{ plots[active]!.crop!.frostStress }}（回暖自动解冻）
        </p>
        <p v-else class="growing-note">
          当前生长效率
          {{ Math.round(growthEfficiency(plots[active]!.crop!, temp) * 100) }}%
          · 累计受冻 {{ plots[active]!.crop!.frostStress }}
        </p>
        <button
          :disabled="plots[active]!.crop!.dormant"
          @click="$emit('water', active)"
        >
          浇水 +
        </button>
        <button
          :disabled="!ready(plots[active]!.crop!)"
          @click="$emit('harvest', active)"
        >
          收获作物
        </button>
      </template>
      <template v-else>
        <span>翻好的土地，等待新种子</span>
        <button class="primary" @click="$emit('plant', active)">
          播种 {{ items[selected].name }}
        </button>
      </template>
    </div>
  </section>
</template>
