import type { Weather } from "../../../shared/contracts";

export type Season = "spring" | "summer" | "autumn" | "winter";

/** 每季长度（小时），四季共 20 天构成一整年 */
export const SEASON_HOURS = 120;
export const YEAR_HOURS = SEASON_HOURS * 4;

export const seasonInfo: Record<
  Season,
  { name: string; icon: string; short: string }
> = {
  spring: { name: "春季", icon: "🌱", short: "春" },
  summer: { name: "夏季", icon: "☀", short: "夏" },
  autumn: { name: "秋季", icon: "🍂", short: "秋" },
  winter: { name: "冬季", icon: "❄", short: "冬" },
};

export const seasonAt = (hour: number): Season =>
  (["spring", "summer", "autumn", "winter"] as Season[])[
    Math.floor(hour / SEASON_HOURS) % 4
  ];

export const yearOf = (hour: number) => Math.floor(hour / YEAR_HOURS) + 1;

/** 季节内第几天（1 起）与小时 */
export const dayOfSeason = (hour: number) =>
  Math.floor((hour % SEASON_HOURS) / 24) + 1;

/**
 * 年度温度关键帧（摄氏度），取每个季节中点的典型日间气温。
 * 冬季中点低于 0℃，保证跨季时逐小时穿过冰点，经历完整冻结/解冻过程。
 */
const TEMP_KEYFRAMES: Record<Season, number> = {
  spring: 14,
  summer: 27,
  autumn: 13,
  winter: -6,
};

const SEASON_ORDER: Season[] = ["spring", "summer", "autumn", "winter"];

/** 天气对气温的修正 */
const WEATHER_TEMP: Record<Weather, number> = {
  sun: 2,
  rain: -3,
  wind: -2,
  snow: -4,
};

function cyclicLerp(hour: number): number {
  // 关键帧位于各季节中点；在相邻中点之间线性插值，年末环绕回年初。
  // 区间索引按中点偏移计算，保证季节整点仍落在上一帧→本帧的插值段内，
  // 温度基准在季节边界连续，入冬/入春不会出现阶跃式跳温。
  const frameAt = (i: number) =>
    i * SEASON_HOURS + SEASON_HOURS / 2;
  const idx = Math.floor((hour - SEASON_HOURS / 2) / SEASON_HOURS);
  const s0 = ((idx % 4) + 4) % 4;
  const s1 = (((idx + 1) % 4) + 4) % 4;
  const f0 = frameAt(idx);
  const f1 = frameAt(idx + 1);
  const t = Math.max(0, Math.min(1, (hour - f0) / (f1 - f0)));
  return (
    TEMP_KEYFRAMES[SEASON_ORDER[s0]!] * (1 - t) +
    TEMP_KEYFRAMES[SEASON_ORDER[s1]!] * t
  );
}

/**
 * 某一小时的环境温度：年度季节趋势 + 昼夜正弦（午后最暖、凌晨最冷）
 * + 天气修正。温度是连续函数，因此大步跨季也会逐小时经过冰点。
 */
export function tempAt(hour: number, weather: Weather): number {
  const base = cyclicLerp(hour);
  const diurnal = 5 * Math.sin(((hour % 24) - 9) / 24 * Math.PI * 2);
  return Math.round((base + diurnal + WEATHER_TEMP[weather]) * 10) / 10;
}

/** 季节进度 0~1，用于 UI 与场景表现 */
export const seasonProgress = (hour: number) =>
  (hour % SEASON_HOURS) / SEASON_HOURS;

/**
 * 线性插值工具：在阈值区间 [lo, hi] 内把温度映射到 0~1，
 * 区间外分别钳制为 0 / 1。
 */
export function tempFactor(temp: number, lo: number, hi: number): number {
  if (temp <= lo) return 0;
  if (temp >= hi) return 1;
  return (temp - lo) / (hi - lo);
}
