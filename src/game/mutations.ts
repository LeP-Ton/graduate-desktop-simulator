import { MENTORS, NPCS } from "./data";
import { nextRandom } from "./random";
import { clamp } from "./research";
import type { AppId, GameState } from "./types";

export const uid = (s: GameState, prefix: string) => {
  const [, seed] = nextRandom(s.rng);
  s.rng = seed;
  return `${prefix}-${seed.toString(36)}`;
};
export function log(s: GameState, text: string) {
  s.history.unshift({ hour: s.hour, text });
  s.history = s.history.slice(0, 160);
  s.lastNotice = text;
}
export function notify(s: GameState, title: string, text: string, app: AppId) {
  s.notices.unshift({ id: uid(s, "n"), title, text, app, hour: s.hour });
  s.notices = s.notices.slice(0, 24);
  log(s, text);
}
export function message(s: GameState, from: string, text: string) {
  s.messages.push({ id: uid(s, "m"), from, text, hour: s.hour, read: false });
  notify(
    s,
    from === "mentor"
      ? `${MENTORS[s.profile.mentor].name} 导师`
      : NPCS.find((n) => n.id === from)!.name,
    text,
    "chat",
  );
}
export function once(s: GameState, id: string, fn: () => void) {
  if (!s.flags.includes(id)) {
    s.flags.push(id);
    fn();
  }
}
export function normalize(s: GameState) {
  for (const k of [
    "energy",
    "stress",
    "mood",
    "health",
    "skill",
    "engineering",
    "trust",
    "reputation",
    "social",
  ] as const)
    s.stats[k] = clamp(s.stats[k]);
  s.stats.compute = Math.max(0, s.stats.compute);
  s.stats.money = Math.max(0, s.stats.money);
}
