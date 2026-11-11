import { NPCS, PAPERS, SECTIONS, TOPICS, VENUES } from "./data";
import { validConfig } from "./research";
import { migrate2012 } from "./migrations";
import type { GameState, Stats, ExperimentResult } from "./types";

const AUTO_KEY = "grados-auto-v1";
const MANUAL_KEY = "grados-manual-v1";
const LEGACY_KEY = "grados-v1-before-2012";
const backupHash = (text: string) => {
  let value = 2166136261;
  for (let i = 0; i < text.length; i++)
    value = Math.imul(value ^ text.charCodeAt(i), 16777619) >>> 0;
  return value.toString(16);
};
function rememberLegacySave(text: string) {
  if (typeof localStorage === "undefined") return;
  const existing = localStorage.getItem(LEGACY_KEY);
  if (existing === text) return;
  // 新导入档更新快捷备份入口，原有备份仍按内容摘要保留，避免覆盖另一个旧进度。
  if (existing)
    localStorage.setItem(`${LEGACY_KEY}-${backupHash(existing)}`, existing);
  localStorage.setItem(LEGACY_KEY, text);
}
export function getLegacyBackup(): string | null {
  try {
    return localStorage.getItem(LEGACY_KEY);
  } catch {
    return null;
  }
}
export function exportLegacyBackup(): boolean {
  const raw = getLegacyBackup();
  if (!raw) return false;
  const url = URL.createObjectURL(
    new Blob([raw], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = "研究生桌面模拟器-旧版原始存档.json";
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}
const finite = (n: unknown, min = 0, max = 1e9): n is number =>
  typeof n === "number" && Number.isFinite(n) && n >= min && n <= max;
const record = (x: unknown): x is Record<string, unknown> =>
  !!x && typeof x === "object" && !Array.isArray(x);
const string = (x: unknown, limit = 20000): x is string =>
  typeof x === "string" && x.length <= limit;
const strings = (x: unknown, limit = 4000): x is string[] =>
  Array.isArray(x) && x.length <= limit && x.every((v) => string(v));
const unique = (items: { id: string }[]) =>
  new Set(items.map((x) => x.id)).size === items.length;
const isHour = (x: unknown) => finite(x, 0, 744) && Number.isInteger(x * 4);
const appIds = [
  "home",
  "chat",
  "search",
  "library",
  "ide",
  "terminal",
  "gpu",
  "analysis",
  "writer",
  "calendar",
  "mail",
  "files",
  "academic",
  "ai",
  "life",
  "settings",
];

// 外部导入与自动恢复共用结构和引用校验，不让损坏的存档进入渲染与模拟。
export function validateSave(value: unknown): value is GameState {
  if (!record(value)) return false;
  const s = value as unknown as GameState;
  if (
    s.version !== 1 ||
    (s.era !== undefined && s.era !== 2012) ||
    !isHour(s.hour) ||
    s.hour < 8 ||
    s.hour > 672 ||
    !Number.isInteger(s.rng) ||
    !finite(s.rng, 0, 4294967295) ||
    s.ended !== (s.hour === 672) ||
    !finite(s.codeQuality, 0, 100) ||
    !string(s.lastNotice)
  )
    return false;
  const p = s.profile;
  if (
    !record(p) ||
    !string(p.name, 30) ||
    !p.name.trim() ||
    !string(p.gender, 20) ||
    !string(p.avatar, 20) ||
    !["ml", "agent", "systems"].includes(p.direction) ||
    !["rigorous", "free", "resource"].includes(p.mentor) ||
    !record(p.abilities)
  )
    return false;
  if (
    !["coding", "insight", "writing"].every(
      (k) =>
        Number.isInteger(p.abilities[k as keyof typeof p.abilities]) &&
        finite(p.abilities[k as keyof typeof p.abilities], 1, 8),
    ) ||
    p.abilities.coding + p.abilities.insight + p.abilities.writing > 12
  )
    return false;
  if (
    !record(s.stats) ||
    ![
      "energy",
      "stress",
      "mood",
      "health",
      "skill",
      "engineering",
      "trust",
      "reputation",
      "social",
    ].every((k) => finite(s.stats[k as keyof Stats], 0, 100)) ||
    !finite(s.stats.money) ||
    !finite(s.stats.compute)
  )
    return false;
  if (
    s.topicId !== null &&
    !TOPICS.some((t) => t.id === s.topicId && t.direction === p.direction)
  )
    return false;
  if (
    ![
      "tasks",
      "submissions",
      "messages",
      "npcs",
      "calendar",
      "mails",
      "aiIssues",
      "notices",
      "history",
    ].every(
      (key) =>
        Array.isArray(s[key as keyof GameState]) &&
        (s[key as keyof GameState] as unknown[]).length <= 4000,
    )
  )
    return false;
  if (![s.read, s.saved, s.analyzed, s.flags].every((x) => strings(x)))
    return false;
  const paperIds = new Set(PAPERS.map((p) => p.id));
  if (![...s.read, ...s.saved].every((id) => paperIds.has(id))) return false;
  if (
    !record(s.manuscript) ||
    !record(s.manuscript.sections) ||
    !record(s.manuscript.effort) ||
    !strings(s.manuscript.references) ||
    !strings(s.manuscript.figures) ||
    !string(s.manuscript.response)
  )
    return false;
  if (
    !SECTIONS.every(
      ({ id }) =>
        string(s.manuscript.sections[id]) &&
        finite(s.manuscript.effort[id], 0, 100),
    ) ||
    !s.manuscript.references.every((id) => s.read.includes(id))
  )
    return false;
  if (
    !s.tasks.every(
      (t) =>
        record(t) &&
        string(t.id, 100) &&
        TOPICS.some((topic) => topic.id === t.topicId) &&
        record(t.config) &&
        string(t.config.name, 60) &&
        validConfig(t.config) &&
        ["queued", "running", "done", "failed", "cancelled"].includes(
          t.status,
        ) &&
        finite(t.duration, 0.25, 1000) &&
        finite(t.progress, 0, t.duration) &&
        finite(t.spent) &&
        finite(t.codeQuality, 0, 100) &&
        typeof t.aiRisk === "boolean" &&
        [1, 2].includes(t.priority) &&
        isHour(t.submittedAt) &&
        (t.startedAt === undefined || isHour(t.startedAt)) &&
        (t.finishedAt === undefined || isHour(t.finishedAt)) &&
        strings(t.logs) &&
        (t.result === undefined
          ? t.status !== "done"
          : record(t.result) &&
            [
              "score",
              "baseline",
              "generalization",
              "reproducibility",
              "novelty",
            ].every((k) =>
              finite(t.result![k as keyof ExperimentResult], 0, 100),
            ) &&
            finite(t.result.cost) &&
            strings(t.result.diagnosis) &&
            strings(t.result.evidence) &&
            Array.isArray(t.result.trainLoss) &&
            Array.isArray(t.result.valLoss) &&
            t.result.trainLoss.length === t.config.epochs &&
            t.result.valLoss.length === t.config.epochs &&
            [...t.result.trainLoss, ...t.result.valLoss].every((v) =>
              finite(v, 0, 100),
            )),
    )
  )
    return false;
  if (
    !unique(s.tasks) ||
    !s.analyzed.every((id) =>
      s.tasks.some((t) => t.id === id && t.status === "done"),
    ) ||
    !s.manuscript.figures.every((id) => s.analyzed.includes(id))
  )
    return false;
  const npcIds = new Set(NPCS.map((n) => n.id));
  if (
    s.npcs.length !== NPCS.length ||
    !s.npcs.every(
      (n) =>
        record(n) &&
        npcIds.has(n.id) &&
        finite(n.relationship, 0, 100) &&
        finite(n.progress, 0, 100) &&
        string(n.status, 100) &&
        string(n.task, 100),
    ) ||
    !unique(s.npcs)
  )
    return false;
  if (
    !s.messages.every(
      (m) =>
        record(m) &&
        string(m.id, 100) &&
        npcIds.has(m.from) &&
        string(m.text) &&
        isHour(m.hour) &&
        typeof m.read === "boolean" &&
        (m.player === undefined || typeof m.player === "boolean"),
    )
  )
    return false;
  if (
    !s.calendar.every(
      (e) =>
        record(e) &&
        string(e.id, 100) &&
        string(e.title, 200) &&
        isHour(e.start) &&
        e.start < 672 &&
        finite(e.duration, 0.25, 8) &&
        ["meeting", "course", "deadline", "interview", "task"].includes(
          e.type,
        ) &&
        typeof e.done === "boolean" &&
        typeof e.missed === "boolean",
    ) ||
    !unique(s.calendar)
  )
    return false;
  if (
    !s.submissions.every(
      (sub) =>
        record(sub) &&
        string(sub.id, 100) &&
        VENUES.some((v) => v.id === sub.venue) &&
        ["review", "reject", "major", "minor", "accept"].includes(sub.status) &&
        Number.isInteger(sub.round) &&
        finite(sub.round, 1, 100) &&
        isHour(sub.dueAt) &&
        isHour(sub.submittedAt) &&
        sub.dueAt > sub.submittedAt &&
        finite(sub.score, 0, 100) &&
        strings(sub.feedback) &&
        typeof sub.responded === "boolean" &&
        record(sub.decision) &&
        ["reject", "major", "minor", "accept"].includes(sub.decision.status) &&
        finite(sub.decision.score, 0, 100) &&
        strings(sub.decision.feedback),
    ) ||
    !unique(s.submissions)
  )
    return false;
  if (
    !s.mails.every(
      (m) =>
        record(m) &&
        string(m.id, 100) &&
        string(m.from, 200) &&
        string(m.subject, 500) &&
        string(m.text) &&
        isHour(m.hour) &&
        typeof m.read === "boolean" &&
        ["school", "review", "career", "conference"].includes(m.kind),
    )
  )
    return false;
  if (
    !s.aiIssues.every(
      (i) =>
        record(i) &&
        string(i.id, 100) &&
        ["code", "citation", "claim"].includes(i.kind) &&
        string(i.text) &&
        typeof i.resolved === "boolean",
    )
  )
    return false;
  if (
    !s.notices.every(
      (n) =>
        record(n) &&
        string(n.id, 100) &&
        string(n.title, 200) &&
        string(n.text) &&
        appIds.includes(n.app) &&
        isHour(n.hour),
    )
  )
    return false;
  if (!s.history.every((h) => record(h) && isHour(h.hour) && string(h.text)))
    return false;
  return true;
}
export function saveGame(state: GameState, manual = false) {
  localStorage.setItem(manual ? MANUAL_KEY : AUTO_KEY, JSON.stringify(state));
}
export function loadGame(manual = false): GameState | null {
  try {
    const raw = localStorage.getItem(manual ? MANUAL_KEY : AUTO_KEY);
    return raw ? parseSave(raw) : null;
  } catch {
    return null;
  }
}
export function exportGame(s: GameState) {
  const blob = new Blob([JSON.stringify(s, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `研究生桌面模拟器2012-${s.profile.name}-第${Math.min(28, Math.floor(s.hour / 24) + 1)}天.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function parseSave(text: string) {
  if (text.length > 5_000_000) throw new Error("存档超过 5MB，无法导入。");
  const data: unknown = JSON.parse(text);
  if (!validateSave(data))
    throw new Error("存档格式不正确或版本不兼容，当前进度未受影响。");
  if (data.era !== 2012) rememberLegacySave(text);
  return migrate2012(data);
}
