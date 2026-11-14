import type { Tick } from "../../../shared/contracts";
import { weatherAt } from "../lib/weather";
import { seasonAt, tempAt } from "../lib/seasons";

export function createEngine(
  read: () => number,
  write: (hour: number) => void,
  consume: (tick: Tick) => void,
) {
  let running = false;
  return {
    advance(hours: number) {
      if (running || !Number.isInteger(hours) || hours < 1 || hours > 168)
        return;
      running = true;
      try {
        // 始终逐小时推进：即使一次跨越大步时间或读档后补时，
        // 冻结、解冻、保鲜消耗与加工工时也按每小时真实温度结算，不可跳过。
        for (let i = 0; i < hours; i++) {
          const from = read();
          const to = from + 1;
          const weather = weatherAt(from);
          write(to);
          consume({
            from,
            to,
            weather,
            season: seasonAt(to),
            temp: tempAt(from, weather),
          });
        }
      } finally {
        running = false;
      }
    },
  };
}
