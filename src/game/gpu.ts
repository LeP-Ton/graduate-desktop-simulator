import { requiredMemory, simulateExperiment } from "./research";
import { notify, once } from "./mutations";
import type { GameState } from "./types";

export function serverBusyUntil(
  s: GameState,
  server: "rtx" | "a100",
  at = s.hour,
) {
  const hour = at % 24,
    day = Math.floor(at / 24);
  if (server === "rtx" && day === 0 && hour < 12) return 12;
  if (server === "a100" && day % 7 === 2 && hour >= 10 && hour < 14)
    return day * 24 + 14;
  if (s.flags.includes(`maintenance-${day}`) && hour >= 3 && hour < 5)
    return day * 24 + 5;
  return at;
}
export function tickQueue(s: GameState, dt: number, from: number) {
  for (const server of ["rtx", "a100"] as const) {
    if (serverBusyUntil(s, server, from) > from) continue;
    let task = s.tasks.find(
      (t) => t.config.server === server && t.status === "running",
    );
    if (!task) {
      task = s.tasks
        .filter((t) => t.config.server === server && t.status === "queued")
        .sort(
          (a, b) => b.priority - a.priority || a.submittedAt - b.submittedAt,
        )[0];
      if (!task) continue;
      task.status = "running";
      task.startedAt = from;
      task.logs.push(
        `[调度] 分配 ${server === "rtx" ? "RTX 4090 / 24GB" : "A100 / 48GB"}，启动训练。`,
      );
      if (requiredMemory(task.config) > (server === "rtx" ? 24 : 48)) {
        task.status = "failed";
        task.finishedAt = s.hour;
        task.logs.push(
          `[错误] CUDA out of memory：需要 ${requiredMemory(task.config).toFixed(1)}GB，超过服务器显存。缩小模型 / batch，或使用 A100。`,
        );
        notify(
          s,
          "实验未能启动",
          `${task.config.name} 显存不足。请在终端查看诊断并修改配置。`,
          "terminal",
        );
        continue;
      }
    }
    const rate = server === "a100" ? 3 : 1;
    if (s.stats.compute < rate * dt) {
      once(s, `budget-${task.id}`, () => {
        task!.logs.push(
          "[等待] 算力额度不足，任务暂停等待资源。可联系管理员或导师。",
        );
        notify(
          s,
          "算力额度不足",
          "训练已暂停。与导师或管理员协商额度后会继续。",
          "gpu",
        );
      });
      continue;
    }
    s.stats.compute -= rate * dt;
    task.spent += rate * dt;
    const before = Math.floor(
      (task.progress / task.duration) * task.config.epochs,
    );
    task.progress = Math.min(task.duration, task.progress + dt);
    const after = Math.min(
      task.config.epochs,
      Math.floor((task.progress / task.duration) * task.config.epochs),
    );
    if (after > before)
      task.logs.push(
        `[训练] epoch ${after}/${task.config.epochs} · 已用算力 ${task.spent.toFixed(2)} GPUh`,
      );
    if (task.progress >= task.duration) {
      task.status = "done";
      task.finishedAt = s.hour;
      task.result = simulateExperiment(task);
      task.logs.push(
        `[完成] 评测分数 ${task.result.score}% · 泛化 ${task.result.generalization}% · 可复现性 ${task.result.reproducibility}%`,
      );
      notify(
        s,
        "实验运行完成",
        `${task.config.name} 已完成。把结果导入数据分析，检查证据与失败原因。`,
        "analysis",
      );
    }
  }
}
