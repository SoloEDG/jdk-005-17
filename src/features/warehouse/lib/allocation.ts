import type {
  Batch,
  Reservation,
  Item,
  Allocation,
} from "../../../shared/contracts";

export function available(batch: Batch, reservations: Reservation[]) {
  return (
    batch.quantity -
    reservations
      .flatMap((r) => r.allocations)
      .filter((a) => a.batch === batch.id)
      .reduce((n, a) => n + a.quantity, 0)
  );
}

/**
 * 先消耗最不新鲜的批次（freshness 最低优先），
 * 新鲜度耗尽的批次不可参与配货。
 */
export function allocate(
  batches: Batch[],
  reservations: Reservation[],
  item: Item,
  quantity: number,
  minQuality = 1,
): Allocation[] | null {
  let remaining = quantity;
  const result: Allocation[] = [];
  for (const batch of batches
    .filter((b) => b.item === item && b.freshness > 0 && b.quality >= minQuality)
    .sort((a, b) => a.freshness - b.freshness)) {
    const n = Math.min(remaining, available(batch, reservations));
    if (n > 0) {
      result.push({ batch: batch.id, quantity: n });
      remaining -= n;
    }
    if (!remaining) return result;
  }
  return null;
}
