import type { Batch } from "../../../shared/contracts";
import { items } from "../../../shared/catalog";

/**
 * 某食品在给定温度下每小时的腐坏速率（相对 20℃ 基准寿命）。
 * 采用 Q10 模型：rate = Q10^((temp-20)/10)。
 * - 冬季 0℃ 时速率约为基准的 1/4~1/5，冷藏显著延长保鲜；
 * - 夏季 30℃ 时速率约为基准的 2 倍，腐坏加快；
 * - 严寒（<0℃）食品冻结，速率继续下降但不会归零（冰晶仍会损伤细胞）。
 * 每个批次按各自当前的 freshness 独立扣减，绝不统一顺延到期日。
 */
export function decayRate(item: Batch["item"], temp: number): number {
  const { q10 } = items[item];
  return Math.pow(q10, (temp - 20) / 10);
}

export function makeBatch(
  item: Batch["item"],
  quantity: number,
  quality: number,
  hour: number,
  id: string,
  source = "收获",
): Batch {
  return {
    id,
    item,
    quantity,
    quality,
    source,
    freshness: items[item].life,
  };
}

export function summarize(batches: readonly Readonly<Batch>[]) {
  return batches.reduce((n, b) => n + b.quantity, 0);
}

/** 批次按当前温度折算的预计剩余小时数（仅用于展示） */
export function remainingHours(batch: Readonly<Batch>, temp: number): number {
  const rate = decayRate(batch.item, temp);
  return rate > 0 ? batch.freshness / rate : batch.freshness;
}
