import type { Item } from "./contracts";

export const items: Record<
  Item,
  {
    name: string;
    icon: string;
    /** 20℃ 基准保鲜寿命（小时） */
    life: number;
    value: number;
    /**
     * 温度系数：温度每升高 10℃ 腐坏速度变为 Q10 倍。
     * 生鲜对温度更敏感，密封/干燥食品较稳定。
     */
    q10: number;
  }
> = {
  carrot: { name: "胡萝卜", icon: "🥕", life: 72, value: 8, q10: 2.3 },
  corn: { name: "玉米", icon: "🌽", life: 96, value: 12, q10: 2.1 },
  berry: { name: "蓝莓", icon: "🫐", life: 48, value: 15, q10: 2.6 },
  jam: { name: "莓果酱", icon: "🫙", life: 120, value: 40, q10: 1.6 },
  flour: { name: "玉米粉", icon: "🌾", life: 120, value: 32, q10: 1.5 },
};

export const itemName = (item: Item) => items[item].name;

export const hourLabel = (hour: number) =>
  `第${Math.floor(hour / 24) + 1}天 ${String(hour % 24).padStart(2, "0")}:00`;
