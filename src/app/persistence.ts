import { items } from "../shared/catalog";
import type { Batch, Crop, Job, Order, Plot } from "../shared/contracts";
import { recipeById } from "../features/workshop/lib/recipes";
import { seasonAt } from "../features/clock/lib/seasons";

const key = "meadow-post-v1";
const CURRENT_VERSION = 2;

type AnyData = Record<string, any>;

/**
 * v1 → v2 迁移：
 * 旧存档从原时刻继续，并进入该时刻对应的第一年季节；
 * 批次固定到期日换算为保鲜余量、作物补休眠/受冻档案、
 * 工坊任务补有效工时、订单补签约季节，全部按新规则继续演化。
 */
function migrateV1ToV2(data: AnyData): AnyData {
  const hour: number = data.clock?.hour ?? 6;
  const next: AnyData = JSON.parse(JSON.stringify(data));

  // 作物：补齐休眠与受冻字段（旧档作物默认未经历霜冻）
  const plots: Plot[] = next.fields?.plots ?? [];
  for (const plot of plots) {
    const crop = plot.crop as (Crop & { frostStress?: number }) | null;
    if (crop) {
      crop.frostStress = crop.frostStress ?? 0;
      crop.dormant = crop.dormant ?? false;
    }
  }

  // 仓库：旧的绝对到期日 expires 换算为剩余保鲜余量 freshness。
  // 不做统一顺延——按每批自身的剩余寿命独立换算。
  const batches: Batch[] = next.warehouse?.batches ?? [];
  for (const b of batches as Array<Batch & { expires?: number }>) {
    if (typeof b.freshness !== "number") {
      const life = items[b.item]?.life ?? 72;
      b.freshness =
        typeof b.expires === "number"
          ? Math.max(0, b.expires - hour)
          : life;
      delete (b as AnyData).expires;
    }
  }

  // 工坊：名义工时与已投入有效工时从旧排期反推
  const jobs: Job[] = next.workshop?.jobs ?? [];
  for (const job of jobs as Array<Job & { work?: number }>) {
    const r = recipeById(job.recipe);
    job.duration = job.duration ?? r?.duration ?? 1;
    if (typeof job.work !== "number") {
      job.work =
        job.status === "queued"
          ? Math.max(0, job.duration - Math.max(0, job.finish - hour))
          : job.duration;
    }
    if (job.status === "ready" && typeof job.readyFreshness !== "number") {
      job.readyFreshness = items[r?.output ?? "jam"]?.life ?? 120;
    }
  }

  // 订单：按存档时刻补齐签约季节，既有期限/要求保持锁定不变
  const orders: Order[] = next.orders?.orders ?? [];
  for (const o of orders) {
    if (!o.season) o.season = seasonAt(hour);
  }

  return next;
}

export function saveFarm(data: unknown) {
  localStorage.setItem(
    key,
    JSON.stringify({ version: CURRENT_VERSION, data }),
  );
}

export function loadFarm<T>(): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as { version: number; data: AnyData };
  if (!parsed.data) throw new Error("存档版本不支持");
  if (parsed.version === 1) {
    return migrateV1ToV2(parsed.data) as T;
  }
  if (parsed.version === CURRENT_VERSION) return parsed.data as T;
  throw new Error("存档版本不支持");
}
