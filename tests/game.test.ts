import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_CONFIG,
  END_HOUR,
  SECTIONS,
  TOPICS,
  gameDate,
} from "../src/game/data";
import { advanceTime, createGame, reduceGame } from "../src/game/engine";
import {
  paperQuality,
  requiredMemory,
  researchEvidence,
  simulateExperiment,
  reviewManuscript,
} from "../src/game/research";
import { parseSave, validateSave } from "../src/game/storage";
import type { ExperimentConfig, GameState, Profile } from "../src/game/types";

const profile: Profile = {
  name: "测试同学",
  gender: "不透露",
  avatar: "🌱",
  direction: "agent",
  mentor: "rigorous",
  abilities: { coding: 4, insight: 5, writing: 3 },
};
function readyGame() {
  let s = createGame(profile);
  for (const id of ["p1", "p2", "p3"]) s = reduceGame(s, { type: "read", id });
  s = reduceGame(s, { type: "topic", id: "agent-safe" });
  s = reduceGame(s, { type: "code", mode: "write" });
  s = reduceGame(s, { type: "code", mode: "write" });
  s = reduceGame(s, { type: "code", mode: "test" });
  return s;
}
function experiment(s: GameState, c: Partial<ExperimentConfig> = {}) {
  s = reduceGame(s, {
    type: "experiment",
    config: { ...DEFAULT_CONFIG, name: `实验${s.tasks.length}`, ...c },
  });
  s = reduceGame(s, { type: "life", kind: "sleep" });
  const task = s.tasks.at(-1)!;
  assert.equal(task.status, "done", task.logs.join("\n"));
  s = reduceGame(s, { type: "analyze", id: task.id });
  return s;
}

test("动作时间、阅读知识和引用门槛相互联动", () => {
  let s = createGame(profile);
  s = reduceGame(s, { type: "cite", id: "p1" });
  assert.equal(s.manuscript.references.length, 0);
  s = reduceGame(s, { type: "topic", id: "agent-safe" });
  assert.equal(s.topicId, null);
  s = reduceGame(s, { type: "read", id: "p1" });
  assert.equal(s.hour, 9);
  s = reduceGame(s, { type: "cite", id: "p1" });
  s = reduceGame(s, { type: "topic", id: "agent-safe" });
  assert.equal(s.hour, 10);
  assert.deepEqual(s.manuscript.references, ["p1"]);
  assert.equal(s.topicId, "agent-safe");
  const again = reduceGame(s, { type: "read", id: "p1" });
  assert.equal(again.hour, s.hour);
  assert.deepEqual(s.read, ["p1"]);
});

test("相同种子和配置完全复现，方法、污染和训练强度产生可解释差异", () => {
  const s = experiment(readyGame());
  const task = s.tasks[0];
  assert.deepEqual(simulateExperiment(task), simulateExperiment(task));
  const baseline = simulateExperiment(task);
  const adaptive = simulateExperiment({
    ...task,
    config: { ...task.config, method: "adaptive" },
  });
  assert.ok(adaptive.generalization > baseline.generalization);
  const raw = simulateExperiment({
    ...task,
    config: { ...task.config, dataset: "raw" },
  });
  assert.ok(raw.score > baseline.score);
  assert.ok(raw.generalization < baseline.generalization);
  const overfit = simulateExperiment({
    ...task,
    config: { ...task.config, epochs: 16 },
  });
  assert.ok(overfit.valLoss.at(-1)! > overfit.valLoss[6]);
  assert.ok(overfit.diagnosis.some((x) => x.includes("过拟合")));
  const unstable = simulateExperiment({
    ...task,
    config: { ...task.config, learningRate: 0.01 },
  });
  assert.ok(unstable.score < baseline.score - 15);
  assert.ok(unstable.diagnosis.some((x) => x.includes("学习率")));
});

test("GPU 两台服务器并行，同一服务器排队，显存与算力真实约束", () => {
  let s = readyGame();
  for (const server of ["rtx", "a100", "rtx"] as const)
    s = reduceGame(s, {
      type: "experiment",
      config: { ...DEFAULT_CONFIG, server },
    });
  advanceTime(s, 0.25);
  assert.equal(s.tasks.filter((t) => t.status === "running").length, 2);
  assert.equal(s.tasks.filter((t) => t.status === "queued").length, 1);
  const quota = s.stats.compute;
  advanceTime(s, 0.5);
  assert.equal(s.stats.compute, quota - 2);
  let oom = readyGame();
  oom = reduceGame(oom, {
    type: "experiment",
    config: { ...DEFAULT_CONFIG, model: "large", server: "rtx" },
  });
  advanceTime(oom, 0.25);
  assert.ok(requiredMemory(oom.tasks[0].config) > 24);
  assert.equal(oom.tasks[0].status, "failed");
  assert.ok(oom.tasks[0].logs.some((x) => x.includes("out of memory")));
  s.stats.compute = 0;
  const progress = s.tasks.find((t) => t.status === "running")!.progress;
  advanceTime(s, 0.25);
  assert.equal(s.tasks.find((t) => t.status === "running")!.progress, progress);
  s = reduceGame(s, { type: "reply", npc: "admin", choice: "resource" });
  assert.ok(s.stats.compute > 20);
  const computeAfter = s.stats.compute;
  s = reduceGame(s, { type: "reply", npc: "mentor", choice: "resource" });
  assert.ok(s.stats.compute <= computeAfter);
});

test("AI 生产力有收益，未经核验的代码降低可信度，测试后恢复", () => {
  let s = readyGame();
  s = reduceGame(s, { type: "code", mode: "ai" });
  assert.ok(s.aiIssues.some((i) => !i.resolved && i.kind === "code"));
  s = experiment(s);
  const bad = s.tasks.at(-1)!.result!;
  s = reduceGame(s, { type: "code", mode: "test" });
  s = experiment(s);
  const good = s.tasks.at(-1)!.result!;
  assert.ok(good.reproducibility > bad.reproducibility);
  assert.ok(good.score > bad.score);
  assert.ok(s.aiIssues.every((i) => i.resolved));
});

test("证据要求真实匹配，同参数重复但相同 seed 不算独立复现", () => {
  let s = readyGame();
  s = experiment(s);
  s = experiment(s, { method: "adaptive", model: "balanced", server: "a100" });
  assert.equal(researchEvidence(s).hasBaseline, false);
  s = experiment(s, { method: "adaptive" });
  assert.equal(researchEvidence(s).hasBaseline, true);
  s = experiment(s, { method: "adaptive" });
  assert.equal(researchEvidence(s).hasReproduction, false);
  s = experiment(s, { method: "adaptive", seed: 123 });
  assert.equal(researchEvidence(s).hasReproduction, true);
});

test("可游玩闭环：小修意见 → 配对基线、复现、泛化与引用 → 修改重投接收", () => {
  let s = experiment(readyGame(), { method: "adaptive" });
  s = reduceGame(s, { type: "figure", id: s.tasks[0].id });
  for (const id of ["p1", "p2", "p3"]) s = reduceGame(s, { type: "cite", id });
  for (const section of SECTIONS)
    s = reduceGame(s, { type: "writeSection", section: section.id });
  s = reduceGame(s, { type: "submit", venue: "workshop" });
  assert.equal(s.submissions.at(-1)?.status, "review");
  const originalScore = s.submissions.at(-1)!.score;
  s = reduceGame(s, { type: "life", kind: "sleep" });
  advanceTime(s, 30);
  assert.ok(
    ["major", "minor", "reject"].includes(s.submissions.at(-1)!.status),
  );
  assert.equal(s.submissions.at(-1)!.score, originalScore);
  assert.ok(s.submissions.at(-1)!.feedback.some((f) => f.includes("基线")));
  s = reduceGame(s, { type: "life", kind: "sleep" });
  s = experiment(s);
  s = experiment(s, { method: "adaptive", seed: 123 });
  s = experiment(s, { method: "adaptive", dataset: "shift" });
  for (const section of SECTIONS)
    s = reduceGame(s, { type: "writeSection", section: section.id });
  assert.ok(paperQuality(s).total >= 75);
  s = reduceGame(s, {
    type: "respond",
    text: "感谢审稿人的建议。我们补充了匹配基线、独立随机种子复现与跨领域留出实验，并更新实验章节和局限讨论。",
  });
  s = reduceGame(s, { type: "submit", venue: "workshop" });
  advanceTime(s, 32);
  assert.equal(
    s.submissions.at(-1)!.status,
    "accept",
    JSON.stringify(s.submissions.at(-1)),
  );
  assert.ok(s.mails.some((m) => m.kind === "review"));
});

test("NPC 自主行动、组会、生活与 28 天上限，刷新与 JSON 读档保持确定性", () => {
  let s = readyGame();
  s = reduceGame(s, { type: "experiment", config: { ...DEFAULT_CONFIG } });
  const clone = parseSave(JSON.stringify(s));
  const a = reduceGame(s, { type: "life", kind: "sleep" });
  const b = reduceGame(clone, { type: "life", kind: "sleep" });
  assert.deepEqual(a, b);
  const progress = a.npcs[1].progress;
  advanceTime(a, 75);
  assert.ok(a.npcs[1].progress > progress);
  assert.ok(a.messages.some((m) => m.from === "sister"));
  assert.ok(a.messages.some((m) => m.from === "peer"));
  assert.ok(a.calendar.some((e) => e.type === "meeting" && e.missed));
  const next = a.calendar.find((e) => e.type === "meeting" && !e.missed)!;
  advanceTime(a, next.start - a.hour);
  s = reduceGame(a, { type: "life", kind: "meal" });
  s = reduceGame(s, { type: "attend", id: next.id });
  assert.ok(s.calendar.find((e) => e.id === next.id)!.done);
  s = reduceGame(s, { type: "advance", hours: END_HOUR });
  assert.equal(s.hour, END_HOUR);
  assert.equal(s.ended, true);
  assert.ok(s.mails.some((m) => m.kind === "career"));
  assert.equal(s.calendar.filter((e) => e.type === "meeting").length, 4);
  assert.ok(validateSave(JSON.parse(JSON.stringify(s))));
  const after = reduceGame(s, { type: "life", kind: "sleep" });
  assert.equal(after.hour, END_HOUR);
});

test("无效存档与越界输入不会破坏游戏", () => {
  assert.equal(validateSave({ version: 1, hour: 8 }), false);
  assert.throws(() => parseSave("{broken"));
  assert.throws(() => parseSave(JSON.stringify({ ...readyGame(), hour: 900 })));
  const s = readyGame();
  assert.equal(reduceGame(s, { type: "advance", hours: NaN }).hour, s.hour);
  assert.equal(
    reduceGame(s, {
      type: "experiment",
      config: { ...DEFAULT_CONFIG, epochs: -4 },
    }).tasks.length,
    0,
  );
});

test("共享资源在释放时间之后开始计费，不提前计算一个时间步", () => {
  let s = createGame(profile);
  s = reduceGame(s, { type: "read", id: "p1" });
  s = reduceGame(s, { type: "topic", id: "agent-safe" });
  s = reduceGame(s, { type: "code", mode: "ai" });
  s = reduceGame(s, { type: "experiment", config: { ...DEFAULT_CONFIG } });
  assert.equal(s.hour, 10.75);
  advanceTime(s, 1.25);
  assert.equal(s.hour, 12);
  assert.equal(s.tasks[0].status, "queued");
  assert.equal(s.tasks[0].spent, 0);
  advanceTime(s, 0.25);
  assert.equal(s.tasks[0].startedAt, 12);
  assert.equal(s.tasks[0].progress, 0.25);
  assert.equal(s.tasks[0].spent, 0.25);
});

test("提前到组会需要等待到开始，结束时间与日程一致", () => {
  let s = readyGame();
  const meeting = s.calendar.find((e) => e.type === "meeting")!;
  advanceTime(s, meeting.start - 1 - s.hour);
  s.stats.energy = 80;
  s = reduceGame(s, { type: "attend", id: meeting.id });
  assert.equal(s.hour, meeting.start + meeting.duration);
  assert.equal(s.calendar.find((e) => e.id === meeting.id)!.done, true);
  assert.equal(gameDate(672).clock, "24:00");
  assert.equal(gameDate(744).date, "10月8日");
});

test("所有方向与替代课题都能产生有限、有研究意义的结果", () => {
  for (const topic of TOPICS) {
    let s = createGame({ ...profile, direction: topic.direction });
    s = reduceGame(s, { type: "read", id: topic.sources[0] });
    s = reduceGame(s, { type: "topic", id: topic.id });
    s = reduceGame(s, { type: "code", mode: "write" });
    s = reduceGame(s, { type: "code", mode: "write" });
    s = reduceGame(s, { type: "code", mode: "test" });
    s = experiment(s, {
      method: topic.method as "adaptive" | "verified",
      dataset: "shift",
    });
    assert.ok(s.tasks[0].result!.generalization > 70, topic.title);
    assert.ok(validateSave(JSON.parse(JSON.stringify(s))), topic.title);
  }
});

test("投稿目标和证据质量会产生拒稿、大修、小修和接收", () => {
  let s = experiment(readyGame(), { method: "adaptive" });
  assert.equal(reviewManuscript(s, "topconf", 1).status, "reject");
  for (const id of ["p1", "p2", "p3"]) s = reduceGame(s, { type: "cite", id });
  for (const section of SECTIONS)
    s = reduceGame(s, { type: "writeSection", section: section.id });
  s = reduceGame(s, { type: "figure", id: s.tasks[0].id });
  assert.equal(reviewManuscript(s, "workshop", 1).status, "major");
  s = experiment(s);
  s = experiment(s, { method: "adaptive", seed: 123 });
  s = experiment(s, { method: "adaptive", dataset: "shift" });
  for (const section of SECTIONS)
    s = reduceGame(s, { type: "writeSection", section: section.id });
  assert.equal(reviewManuscript(s, "journal", 1).status, "minor");
  assert.equal(reviewManuscript(s, "workshop", 2).status, "accept");
});

test("损坏的嵌套结构与引用均被拒绝", () => {
  const s = readyGame();
  for (const mutate of [
    (x: GameState) => {
      x.profile.abilities = {} as typeof x.profile.abilities;
    },
    (x: GameState) => {
      x.npcs = [];
    },
    (x: GameState) => {
      x.saved = ["不存在的论文"];
    },
    (x: GameState) => {
      x.analyzed = ["不存在的实验"];
    },
    (x: GameState) => {
      x.messages[0].from = "不存在的角色";
    },
    (x: GameState) => {
      x.manuscript.references = ["p8"];
    },
  ]) {
    const copy = structuredClone(s);
    mutate(copy);
    assert.equal(validateSave(copy), false);
  }
});

test("NPC 根据独立日程和能力行动，非工作时间不会同步增长", () => {
  const s = createGame(profile);
  const junior = () => s.npcs.find((n) => n.id === "junior")!;
  const mentor = () => s.npcs.find((n) => n.id === "mentor")!;
  const juniorBefore = junior().progress;
  advanceTime(s, 1);
  assert.ok(mentor().progress > 8);
  assert.equal(junior().progress, juniorBefore);
  advanceTime(s, 7);
  assert.ok(junior().progress > juniorBefore);
  assert.notEqual(mentor().task, junior().task);
});
