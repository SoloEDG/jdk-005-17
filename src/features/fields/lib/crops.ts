import type { Item, Weather, Crop, Tick } from "../../../shared/contracts";
import { tempFactor } from "../../clock/lib/seasons";

export interface CropDef {
  cost: number;
  duration: number;
  yield: number;
  repeat: number;
  /** 停止生长的下限温度（℃）：低于此温进入休眠 */
  minTemp: number;
  /** 开始受冻的冰点阈值（℃） */
  freezeTemp: number;
  /** 适生温度区间，区间内生长效率达到 100% */
  idealLow: number;
  idealHigh: number;
}

export const crops: Partial<Record<Item, CropDef>> = {
  // 胡萝卜耐寒，近冰点才休眠，适合早春与秋末
  carrot: {
    cost: 5,
    duration: 12,
    yield: 3,
    repeat: 0,
    minTemp: 2,
    freezeTemp: -1,
    idealLow: 10,
    idealHigh: 22,
  },
  // 玉米喜温怕冷，低温季早早休眠
  corn: {
    cost: 9,
    duration: 18,
    yield: 4,
    repeat: 1,
    minTemp: 10,
    freezeTemp: 2,
    idealLow: 18,
    idealHigh: 30,
  },
  // 蓝莓喜凉但畏严寒
  berry: {
    cost: 12,
    duration: 24,
    yield: 3,
    repeat: 2,
    minTemp: 5,
    freezeTemp: 0,
    idealLow: 12,
    idealHigh: 24,
  },
};

/**
 * 逐小时结算一块地里的作物。
 * 休眠规则：
 * - 温度低于作物 minTemp 时进入休眠，growth 完全保留、有效生长为 0；
 * - 休眠期间每小时记录受冻压力，低于 freezeTemp 的严寒小时加倍计；
 * - 温度回升超过 minTemp 自动解冻恢复生长，frostStress 永久留档；
 * - 水分在休眠中冻结、不再蒸发，降雪也不补水。
 */
export function grow(crop: Crop, tick: Tick, hours: number): Crop {
  const def = crops[crop.item];
  const { temp, weather } = tick;
  const dormant = temp < (def?.minTemp ?? Infinity);

  if (dormant) {
    const severe = temp < (def?.freezeTemp ?? -Infinity);
    return {
      ...crop,
      dormant: true,
      frostStress: crop.frostStress + hours * (severe ? 2 : 1),
      // 冻土保水，休眠期水分与生长进度都不变
    };
  }

  const water = Math.max(
    0,
    Math.min(100, crop.water + (weather === "rain" ? 15 : -8) * hours),
  );
  // 温度适生系数：低于适生区间线性减速，进入适生区后满速
  const warmth = def
    ? tempFactor(temp, def.minTemp, def.idealLow)
    : 1;
  const waterRate = water > 0 ? 1 : 0.15;
  const windRate = weather === "wind" ? 0.6 : 1;
  const rate = warmth * waterRate * windRate;

  return {
    ...crop,
    dormant: false,
    water,
    stress: crop.stress + (water === 0 ? hours : 0),
    growth: crop.growth + hours * rate,
  };
}

export function ready(crop: Crop) {
  return crop.growth >= (crops[crop.item]?.duration ?? Infinity);
}

/** 当前温度下的生长效率 0~1，供 UI 展示 */
export function growthEfficiency(crop: Crop, temp: number): number {
  const def = crops[crop.item];
  if (!def || temp < def.minTemp) return 0;
  return Math.min(1, tempFactor(temp, def.minTemp, def.idealLow));
}
