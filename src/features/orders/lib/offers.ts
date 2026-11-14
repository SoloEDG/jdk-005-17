import type { Item, Order } from "../../../shared/contracts";
import type { Season } from "../../clock/lib/seasons";

/** 各季节村庄的采购货品：冬季田间停产，合约只收耐储与加工食品 */
const SEASONAL_POOL: Record<Season, Item[]> = {
  spring: ["carrot", "berry", "carrot"],
  summer: ["corn", "berry", "jam"],
  autumn: ["carrot", "corn", "flour"],
  winter: ["jam", "flour", "flour"],
};

function makeOrder(
  serial: number,
  hour: number,
  season: Season,
  item: Item,
  span: number,
): Order {
  return {
    id: `o${serial}`,
    item,
    quantity: 3 + (serial % 3),
    reward: 80 + serial * 4,
    minQuality: serial % 3 === 0 ? 2 : 1,
    // 期限在合约生成时刻绝对锁定，后续季节温度变化不改变条款
    deadline: hour + span,
    season,
    status: "open",
  };
}

export function initialOrders(hour: number, season: Season): Order[] {
  const pool = SEASONAL_POOL[season];
  return [
    makeOrder(1, hour, season, "carrot", 36),
    makeOrder(2, hour, season, "jam", 48),
    makeOrder(3, hour, season, pool[1]!, 60),
  ];
}

/** 季节订单：从当前季节货品池循环挑品，期限与要求在生成时固定 */
export function nextOrder(serial: number, hour: number, season: Season): Order {
  const pool = SEASONAL_POOL[season];
  const item = pool[serial % pool.length]!;
  return makeOrder(serial, hour, season, item, 48);
}
