<script setup lang="ts">
import type { Batch } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { decayRate, remainingHours } from "../lib/storage";
defineProps<{
  batches: readonly Readonly<Batch>[];
  hour: number;
  temp: number;
  free: (id: string) => number;
  wasted: number;
}>();
defineEmits<{ sell: [id: string] }>();
</script>
<template>
  <section class="panel warehouse-panel">
    <div class="panel-heading">
      <h2>谷仓库存</h2>
      <span>{{ batches.length }} 批 · 损耗 {{ wasted }}</span>
    </div>
    <div class="inventory-list">
      <div v-for="batch in batches" :key="batch.id" class="inventory-row">
        <b class="item-icon">{{ items[batch.item].icon }}</b>
        <div>
          <strong
            >{{ items[batch.item].name }}
            <em>{{ "★".repeat(batch.quality) }}</em></strong
          ><small
            >{{ batch.id }} · {{ batch.source }}<br />保鲜余量
            {{ batch.freshness.toFixed(1) }}h · 按当前温度约
            {{ remainingHours(batch, temp).toFixed(0) }}h 后耗尽
            <em
              >(腐坏 ×{{ decayRate(batch.item, temp).toFixed(2) }}/h)</em
            ></small
          >
        </div>
        <div class="quantity">
          <strong>×{{ batch.quantity }}</strong
          ><small>可用 {{ free(batch.id) }}</small>
        </div>
        <button :disabled="!free(batch.id)" @click="$emit('sell', batch.id)">
          卖 1
        </button>
      </div>
      <p v-if="!batches.length" class="empty">谷仓空了，去田里收获吧。</p>
    </div>
    <p class="hint">
      逐批按温度结算保鲜 · 冬季冷藏减速、夏季加速 · 先消耗最不新鲜批次
    </p>
  </section>
</template>
