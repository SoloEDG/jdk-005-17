import type { Job, Tick } from "../../../shared/contracts";
import { tempFactor } from "../../clock/lib/seasons";
import type { Recipe } from "./recipes";

/**
 * 某配方在当前温度下每小时的有效加工系数 0~1。
 * - 温度低于 haltTemp：工艺完全暂停（发酵缸结冰 / 湿冷无法干燥）；
 * - haltTemp 到 workLow 之间：效率随温度线性恢复；
 * - 进入适工区间（≥ workLow）后满速运行。
 * 因此冬季工时会被延长，严寒时段直接暂停但已投入工时保留。
 */
export function workRate(recipe: Recipe, temp: number): number {
  if (temp <= recipe.haltTemp) return 0;
  if (temp >= recipe.workLow) return 1;
  return tempFactor(temp, recipe.haltTemp, recipe.workLow);
}

/** 入队时的名义排期：单机顺序队列，按适宜温度下的名义工时估算 */
export const queueFinish = (
  jobs: readonly Job[],
  hour: number,
  duration: number,
) =>
  Math.max(
    hour,
    ...jobs.filter((j) => j.status === "queued").map((j) => j.finish),
  ) + duration;

/** 实际进度按已累计有效工时计算，暂停时进度条冻结不前移 */
export const jobProgress = (job: Job) =>
  Math.max(0, Math.min(100, (job.work / job.duration) * 100));

/**
 * 动态预计完工：以当前温度的有效系数折算剩余工时。
 * 暂停（系数为 0）时返回 null，由 UI 显示“冬季暂停”。
 */
export function estimateFinish(
  job: Job,
  tick: Tick,
  recipe: Recipe,
): number | null {
  const rate = workRate(recipe, tick.temp);
  if (rate <= 0) return null;
  const remaining = Math.max(0, job.duration - job.work);
  return tick.to + Math.ceil(remaining / rate);
}
