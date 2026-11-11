import { END_HOUR } from "./data";
import { tickEvents } from "./events";
import { tickQueue } from "./gpu";
import { tickNpcs } from "./npc";
import { normalize, notify } from "./mutations";
import type { GameState } from "./types";

export function advanceTime(s: GameState, hours: number, rest = false) {
  const steps = Math.min(
    Math.round(Math.max(0, hours) * 4),
    Math.ceil((END_HOUR - s.hour) * 4),
  );
  for (let i = 0; i < steps; i++) {
    const from = s.hour;
    s.hour = Math.min(END_HOUR, s.hour + 0.25);
    if (!rest) {
      s.stats.energy -= 0.42;
      if (s.stats.energy < 15) {
        s.stats.stress += 0.17;
        s.stats.health -= 0.06;
      }
      if (s.hour % 24 < 6) s.stats.stress += 0.05;
    }
    tickQueue(s, 0.25, from);
    tickEvents(s);
    tickNpcs(s);
    normalize(s);
  }
  if (s.hour >= END_HOUR && !s.ended) {
    s.ended = true;
    notify(
      s,
      "四周，留下你的答案",
      "科研周期已完成。查看培养系统中的月度回顾，你的每种选择都有价值。",
      "academic",
    );
  }
}
