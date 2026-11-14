import type { Season } from "../features/clock/lib/seasons";

export type Item = "carrot" | "corn" | "berry" | "jam" | "flour";
export type Weather = "sun" | "rain" | "wind" | "snow";
export interface Crop {
  item: Item;
  planted: number;
  growth: number;
  water: number;
  stress: number;
  /** 累计受冻压力（休眠小时数，严寒加倍），解冻后仍保留在档案上 */
  frostStress: number;
  /** 是否处于冬季休眠：保留生长进度，暂停有效生长 */
  dormant: boolean;
  harvests: number;
}
export interface Plot {
  id: number;
  crop: Crop | null;
}
export interface Receipt {
  quality: number;
  sources: readonly string[];
  quantity: number;
}
export interface Batch {
  id: string;
  item: Item;
  quantity: number;
  quality: number;
  source: string;
  /** 剩余保鲜寿命（小时，浮点）：每小时按当前温度的腐坏速率逐批扣减 */
  freshness: number;
}
export interface Allocation {
  batch: string;
  quantity: number;
}
export interface Reservation {
  id: string;
  owner: string;
  allocations: Allocation[];
}
export type ProcessKind = "ferment" | "dry";
export interface Job {
  id: string;
  recipe: string;
  reservation: string;
  receipt?: Receipt;
  /** 配方名义工时（入队时快照） */
  duration: number;
  /** 已累计的有效加工工时，低温暂停时不增长 */
  work: number;
  /** 预计完工时刻，随每小时有效工时动态修正；暂停时保留上次估算 */
  finish: number;
  /** 已完工待领取成品的剩余保鲜寿命 */
  readyFreshness?: number;
  /** 当前小时是否因低温暂停（仅运行时标记，存档可缺省） */
  paused?: boolean;
  status: "queued" | "ready" | "claimed" | "failed";
}
export interface Order {
  id: string;
  item: Item;
  quantity: number;
  reward: number;
  minQuality: number;
  /** 合约生成时锁定的绝对期限时刻，不受后续季节变化影响 */
  deadline: number;
  /** 合约生成时所属季节，履行要求按签约时条款保持不变 */
  season: Season;
  status: "open" | "reserved" | "delivered" | "expired";
  reservation?: string;
}
export interface Tick {
  from: number;
  to: number;
  weather: Weather;
  season: Season;
  /** 该小时的环境温度（摄氏度） */
  temp: number;
}
export type Notice = (message: string) => void;
