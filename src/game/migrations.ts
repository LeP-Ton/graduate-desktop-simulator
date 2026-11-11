import { NPCS, SERVERS } from "./data";
import { requiredMemory } from "./research";
import type { GameState } from "./types";

export const ERA_MIGRATION_FLAG = "era-2012-migrated";
const replacements: [RegExp, string][] = [
  [/RTX 4090\s*\/\s*24GB/g, "GTX 580 / 3GB"],
  [/A100\s*\/\s*48GB/g, "Tesla M2090 / 6GB"],
  [/RTX 4090/g, "GTX 580"],
  [/\bA100\b/g, "Tesla M2090"],
  [/\bRTX\b/g, "GTX 580"],
  [/FAIC 2026/g, "CFR 2012"],
  [/2026/g, "2012"],
  [/2025/g, "2011"],
  [/计算机与人工智能学院/g, "计算机学院"],
  [/AI 生成代码/g, "第三方实验代码"],
  [/AI 代码/g, "第三方代码"],
  [/\bAI\b/g, "统计脚本"],
  [/智能体/g, "检索系统"],
  [/工具调用/g, "检索排序"],
  [/大模型/g, "实验模型"],
  [/低秩适配/g, "正则化"],
  [/参数高效适配/g, "特征选择"],
  [/14B/g, "大工作集方案"],
  [/7B/g, "标准实验方案"],
  [/1\.5B/g, "小规模基线方案"],
  [/24GB/g, "3GB"],
  [/48GB/g, "6GB"],
];
const periodText = (text: string) =>
  replacements.reduce(
    (value, [pattern, replacement]) => value.replace(pattern, replacement),
    text,
  );

// 只映射系统记录。玩家自由文稿、逐点回复、聊天原文与自定实验名保留，原始 JSON 另行备份。
export function migrate2012(original: GameState): GameState {
  if (original.era === 2012) return original;
  const s = structuredClone(original);
  s.era = 2012;
  s.flags.push(ERA_MIGRATION_FLAG);
  for (const npc of s.npcs) npc.task = NPCS.find((n) => n.id === npc.id)!.task;
  for (const message of s.messages)
    if (!message.player) message.text = periodText(message.text);
  for (const event of s.calendar) event.title = periodText(event.title);
  for (const mail of s.mails) {
    mail.from = periodText(mail.from);
    mail.subject = periodText(mail.subject);
    mail.text = periodText(mail.text);
  }
  for (const issue of s.aiIssues) issue.text = periodText(issue.text);
  for (const notice of s.notices) {
    notice.title = periodText(notice.title);
    notice.text = periodText(notice.text);
  }
  for (const item of s.history) item.text = periodText(item.text);
  for (const sub of s.submissions) {
    sub.feedback = sub.feedback.map(periodText);
    sub.decision.feedback = sub.decision.feedback.map(periodText);
  }
  for (const task of s.tasks) {
    task.logs = task.logs.map(periodText);
    if (task.result) {
      task.result.diagnosis = task.result.diagnosis.map(periodText);
      task.result.evidence = task.result.evidence.map(periodText);
    }
    task.logs.push(
      "[旧档导入] 保留原任务的配置、进度、成本和观测数值；新实验按 2012 年设备容量执行。",
    );
    if (
      task.status === "running" &&
      requiredMemory(task.config) > SERVERS[task.config.server].capacity
    ) {
      task.status = "failed";
      task.finishedAt = s.hour;
      task.logs.push(
        "[停止] 原工作集超过 2012 年设备容量。已消耗额度不重置，请缩小配置或重新分配服务器。",
      );
    }
  }
  s.lastNotice =
    "旧版进度已适配 2012。人物、时间、实验数值和自由文稿保留；旧版原始存档可在控制面板导出。";
  return s;
}
