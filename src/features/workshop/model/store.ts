import { reactive, readonly } from "vue";
import type { Job, Item, Notice, Receipt, Tick } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";
import { recipeById } from "../lib/recipes";
import { estimateFinish, queueFinish, workRate } from "../lib/schedule";
interface Ports {
  reserve: (owner: string, item: Item, n: number) => string | null;
  consume: (id: string) => Receipt | null;
  release: (id: string) => void;
  add: (
    item: Item,
    n: number,
    q?: number,
    hour?: number,
    source?: string,
    freshness?: number,
  ) => void;
  spend: (n: number) => boolean;
}
export function createWorkshop(ports: Ports, notice: Notice) {
  const state = reactive({ jobs: [] as Job[], serial: 0 });
  return {
    state: readonly(state),
    enqueue(recipe: string, hour: number) {
      const r = recipeById(recipe);
      if (!r || state.jobs.filter((j) => j.status === "queued").length >= 4) {
        notice("加工队列已满");
        return;
      }
      const reservation = ports.reserve("workshop", r.input, r.amount);
      if (!reservation) {
        notice("加工原料不足");
        return;
      }
      if (!ports.spend(r.cost)) {
        ports.release(reservation);
        notice("加工费不足");
        return;
      }
      state.jobs.push({
        id: `j${++state.serial}`,
        recipe,
        reservation,
        duration: r.duration,
        work: 0,
        finish: queueFinish(state.jobs, hour, r.duration),
        status: "queued",
      });
      notice("原料已锁定，加入加工队列");
    },
    /**
     * 逐小时结算：
     * - 排队中的任务按当前温度累计「有效加工工时」，冬季低温减速或暂停；
     * - 完工时刻 finish 每小时根据剩余工时与当前效率动态修正，
     *   暂停时保留上一次估算并打上 paused 标记；
     * - 已完工待领取的成品同样按仓库温度消耗保鲜寿命。
     */
    tick(tick: Tick) {
      for (const job of state.jobs) {
        const r = recipeById(job.recipe);
        if (!r) continue;
        if (job.status === "queued") {
          const rate = workRate(r, tick.temp);
          job.paused = rate <= 0;
          if (rate > 0) {
            job.work = Math.min(job.duration, job.work + rate);
            const eta = estimateFinish(job, tick, r);
            if (eta !== null) job.finish = eta;
          }
          if (job.work >= job.duration) {
            const receipt = ports.consume(job.reservation);
            if (!receipt) {
              job.status = "failed";
              job.paused = false;
              notice("原料已过期，本批加工终止");
              continue;
            }
            job.receipt = receipt;
            job.status = "ready";
            job.paused = false;
            job.readyFreshness = items[r.output].life;
            notice(`${r.name} ${job.id} 加工完成，可领取成品`);
          }
        } else if (job.status === "ready" && job.readyFreshness !== undefined) {
          // 成品在工坊暂存期间同样按 Q10 温度模型消耗保鲜
          const rate = Math.pow(
            items[r.output].q10,
            (tick.temp - 20) / 10,
          );
          job.readyFreshness = Math.max(0, job.readyFreshness - rate);
          if (job.readyFreshness <= 0) {
            job.status = "failed";
            notice(`${r.name} ${job.id} 成品存放过久，已变质`);
          }
        }
      }
    },
    claim(id: string) {
      const job = state.jobs.find((j) => j.id === id),
        r = job && recipeById(job.recipe);
      if (!job || job.status !== "ready" || !r) return;
      if (!job.receipt || (job.readyFreshness ?? 0) <= 0) {
        job.status = "failed";
        notice("成品已变质，无法领取");
        return;
      }
      ports.add(
        r.output,
        r.quantity,
        job.receipt.quality,
        job.finish,
        `工坊${job.id} · ${job.receipt.sources.join(" / ")}`,
        job.readyFreshness,
      );
      job.status = "claimed";
      notice("成品已入仓");
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      Object.assign(state, data);
    },
  };
}
