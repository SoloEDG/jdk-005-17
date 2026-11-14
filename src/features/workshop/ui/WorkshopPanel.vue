<script setup lang="ts">
import type { Job } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { recipes, recipeById, kindInfo } from "../lib/recipes";
import { jobProgress, workRate } from "../lib/schedule";
defineProps<{ jobs: readonly Readonly<Job>[]; hour: number; temp: number }>();
defineEmits<{ enqueue: [recipe: string]; claim: [id: string] }>();
</script>
<template>
  <section class="panel workshop-panel">
    <div class="panel-heading">
      <h2>手作工坊</h2>
      <span>单机顺序加工 · {{ temp.toFixed(1) }}℃</span>
    </div>
    <div class="recipe-list">
      <button v-for="r in recipes" :key="r.id" @click="$emit('enqueue', r.id)">
        <b>{{ items[r.output].icon }}</b
        ><strong
          >{{ r.name }} <em>{{ kindInfo[r.kind].icon }}{{ kindInfo[r.kind].name }}</em></strong
        ><small
          >{{ r.amount }} {{ items[r.input].name }} →
          {{ r.quantity }} 份<br />{{ r.duration }} 有效工时 · ¥{{ r.cost }}
          · 适工 {{ r.workLow }}~{{ r.workHigh }}℃
          <em v-if="workRate(r, temp) <= 0" class="cold-tag">当前低温暂停</em>
          <em v-else class="rate-tag"
            >当前效率 {{ Math.round(workRate(r, temp) * 100) }}%</em
          ></small
        ><span>＋ 制作</span>
      </button>
    </div>
    <div
      v-for="job in jobs.filter((j) => j.status !== 'claimed')"
      :key="job.id"
      class="job-row"
      :class="{ paused: job.paused }"
    >
      <span
        >{{ recipeById(job.recipe)?.name }}
        <small>{{ job.id }} · 有效工时 {{ job.work.toFixed(1) }}/{{ job.duration }}h</small></span
      >
      <template v-if="job.status === 'queued'">
        <progress :value="jobProgress(job)" max="100"></progress>
        <small v-if="job.paused" class="paused-text">❄ 低温暂停，工时保留</small>
        <small v-else>预计还需 {{ Math.max(0, job.finish - hour) }}h</small>
      </template>
      <button
        v-else-if="job.status === 'ready'"
        class="primary"
        @click="$emit('claim', job.id)"
      >
        领取成品
        {{ "★".repeat(job.receipt?.quality ?? 1) }}
        <em v-if="job.readyFreshness !== undefined"
          >（保鲜 {{ job.readyFreshness!.toFixed(0) }}h）</em
        >
      </button>
      <small v-else>加工失败</small>
    </div>
    <p v-if="!jobs.some((j) => j.status !== 'claimed')" class="hint">
      机器空闲中，让丰收多一点价值。
    </p>
  </section>
</template>
