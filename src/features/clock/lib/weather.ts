import type { Weather } from "../../../shared/contracts";
import { seasonAt } from "./seasons";

const WARM_CYCLE: Weather[] = ["sun", "rain", "wind", "sun"];
const COLD_CYCLE: Weather[] = ["snow", "sun", "wind", "snow"];

/** 天气按日循环；冬季切换为降雪循环，其它季节沿用晴/雨/风 */
export const weatherAt = (hour: number): Weather => {
  const day = Math.floor(hour / 24);
  return (seasonAt(hour) === "winter" ? COLD_CYCLE : WARM_CYCLE)[day % 4]!;
};

export const weatherInfo = {
  sun: { name: "晴朗", icon: "☀", description: "阳光充沛 · 蒸发较快" },
  rain: { name: "小雨", icon: "☂", description: "雨水自动滋润土地" },
  wind: { name: "大风", icon: "≋", description: "生长减缓 · 注意浇水" },
  snow: { name: "降雪", icon: "❄", description: "天寒地冻 · 作物休眠" },
} as const;
