import { reactive, readonly } from "vue";
import type {
  Item,
  Batch,
  Reservation,
  Notice,
  Receipt,
  Tick,
} from "../../../shared/contracts";
import { allocate, available } from "../lib/allocation";
import { decayRate, makeBatch } from "../lib/storage";

export function createWarehouse(now: () => number, notice: Notice) {
  const state = reactive({
    batches: [] as Batch[],
    reservations: [] as Reservation[],
    serial: 0,
    wasted: 0,
  });
  const add = (
    item: Item,
    n: number,
    q = 1,
    _hour = now(),
    source = "田间收获",
    freshness?: number,
  ) => {
    const batch = makeBatch(item, n, q, _hour, `b${++state.serial}`, source);
    if (freshness !== undefined) batch.freshness = freshness;
    state.batches.push(batch);
  };
  add("carrot", 8, 2);
  add("berry", 6, 2);
  add("corn", 8, 1);
  return {
    state: readonly(state),
    add,
    free: (id: string) => {
      const b = state.batches.find((b) => b.id === id);
      return b ? available(b, state.reservations) : 0;
    },
    reserve(owner: string, item: Item, n: number, minQuality = 1) {
      const allocations = allocate(
        state.batches,
        state.reservations,
        item,
        n,
        minQuality,
      );
      if (!allocations) return null;
      const id = `r${++state.serial}`;
      state.reservations.push({ id, owner, allocations });
      return id;
    },
    consume(id: string) {
      const r = state.reservations.find((r) => r.id === id);
      if (!r) return null;
      for (const a of r.allocations) {
        const b = state.batches.find((b) => b.id === a.batch);
        if (!b || b.quantity < a.quantity || b.freshness <= 0) return null;
      }
      const receipt: Receipt = {
        quality: Math.min(
          ...r.allocations.map(
            (a) => state.batches.find((b) => b.id === a.batch)!.quality,
          ),
        ),
        sources: r.allocations.map(
          (a) => state.batches.find((b) => b.id === a.batch)!.source,
        ),
        quantity: r.allocations.reduce((n, a) => n + a.quantity, 0),
      };
      for (const a of r.allocations)
        state.batches.find((b) => b.id === a.batch)!.quantity -= a.quantity;
      state.batches = state.batches.filter((b) => b.quantity > 0);
      state.reservations = state.reservations.filter((r) => r.id !== id);
      return receipt;
    },
    release: (id: string) => {
      state.reservations = state.reservations.filter((r) => r.id !== id);
    },
    sell(id: string, n: number) {
      const b = state.batches.find((b) => b.id === id);
      if (!b || available(b, state.reservations) < n) return null;
      b.quantity -= n;
      if (!b.quantity) state.batches = state.batches.filter((b) => b.id !== id);
      return b.item;
    },
    /**
     * 逐小时结算保鲜消耗：每个批次按当前温度独立扣减 freshness。
     * 被订单/工坊占用的批次同样腐坏；腐坏后自动释放其占用。
     */
    tick(tick: Tick) {
      const spoiled: Batch[] = [];
      for (const b of state.batches) {
        b.freshness = Math.max(0, b.freshness - decayRate(b.item, tick.temp));
        if (b.freshness <= 0) spoiled.push(b);
      }
      if (spoiled.length) {
        state.wasted += spoiled.reduce((n, b) => n + b.quantity, 0);
        const ids = new Set(spoiled.map((b) => b.id));
        state.batches = state.batches.filter((b) => b.freshness > 0);
        state.reservations = state.reservations.filter(
          (r) => !r.allocations.some((a) => ids.has(a.batch)),
        );
        notice(`${spoiled.length} 批库存已耗尽保鲜期`);
      }
    },
    snapshot: () => JSON.parse(JSON.stringify(state)) as typeof state,
    restore: (data: typeof state) => {
      Object.assign(state, data);
    },
  };
}
