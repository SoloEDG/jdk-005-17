import type { Item, ProcessKind } from "../../../shared/contracts";
export interface Recipe {
  id: string;
  name: string;
  /** 发酵类需要温和稳定的温度；干燥类偏好干爽高温 */
  kind: ProcessKind;
  input: Item;
  amount: number;
  output: Item;
  quantity: number;
  /** 名义工时（适宜温度下的有效工时） */
  duration: number;
  cost: number;
  /** 有效加工的温度窗口（℃）：低于下限暂停，进入适工区间满速 */
  workLow: number;
  workHigh: number;
  /** 严寒温度：低于此值工艺完全暂停（发酵缸结冰 / 无法通风干燥） */
  haltTemp: number;
}
export const recipes: Recipe[] = [
  {
    id: "jam",
    name: "莓果酱",
    kind: "ferment",
    input: "berry",
    amount: 3,
    output: "jam",
    quantity: 2,
    duration: 8,
    cost: 4,
    workLow: 12,
    workHigh: 28,
    haltTemp: 2,
  },
  {
    id: "flour",
    name: "玉米粉",
    kind: "dry",
    input: "corn",
    amount: 4,
    output: "flour",
    quantity: 3,
    duration: 6,
    cost: 3,
    workLow: 8,
    workHigh: 30,
    haltTemp: 0,
  },
];
export const recipeById = (id: string) => recipes.find((r) => r.id === id);
export const kindInfo: Record<ProcessKind, { name: string; icon: string }> = {
  ferment: { name: "发酵", icon: "🫙" },
  dry: { name: "干燥", icon: "🌬" },
};
