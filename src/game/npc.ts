import { NPCS } from "./data";
import { clamp, researchEvidence } from "./research";
import { message, notify, once } from "./mutations";
import type { GameState } from "./types";

export function tickNpcs(s: GameState) {
  const day = Math.floor(s.hour / 24),
    time = s.hour % 24;
  for (const npc of s.npcs) {
    const config = NPCS.find((n) => n.id === npc.id)!;
    const weekdayOnly = npc.id === "mentor" || npc.id === "admin";
    const working =
      time >= config.workHours.start &&
      time < config.workHours.end &&
      (!weekdayOnly || day % 7 < 5);
    if (!working) {
      npc.status = time >= 23 || time < 8 ? "休息中" : "自主安排";
      continue;
    }
    // 日程、能力与研究阶段共同影响自主行为，不依赖通讯窗口是否打开。
    npc.progress = clamp(
      npc.progress +
        (config.abilities.coding * 0.35 + config.abilities.insight * 0.65) *
          0.0007,
    );
    const phase = Math.floor(npc.progress / 18) % 4;
    npc.status =
      npc.id === "admin"
        ? "维护服务器"
        : npc.id === "mentor"
          ? "指导与评审"
          : ["阅读文献", "实现方案", "实验验证", "分析与写作"][phase];
    npc.task =
      npc.id === "admin" || npc.id === "mentor"
        ? config.task
        : `${config.direction} · ${npc.status}`;
  }
  if (s.hour >= 26)
    once(s, "sister-request", () =>
      message(
        s,
        "sister",
        "我正在补论文实验，明天会用 A100。如果愿意一起做数据检查，可以共享清洗流程。合作前先约定分工与署名哦。",
      ),
    );
  if (day >= 2 && time >= 10)
    once(s, "peer-gpu", () =>
      message(
        s,
        "peer",
        "我今天 10:00–14:00 在 A100 上跑推理评测，RTX 还有空位。晚点我们可以交换一下实验现象。",
      ),
    );
  if (day >= 3 && time >= 11)
    once(s, "junior-question", () =>
      message(
        s,
        "junior",
        "师兄/师姐，为什么训练分数越高，验证效果反而下降？我不太会看学习曲线，能给我一点建议吗？",
      ),
    );
  if (day >= 5 && time >= 10)
    once(s, "junior-sis-data", () =>
      message(
        s,
        "junior-sis",
        "我整理了一份数据去重检查清单，发现原始评测集有重复样本。高分也要仔细检查呀。我们可以一起验证。",
      ),
    );
  if (day >= 7 && time >= 9)
    once(s, "weekly-quota", () => {
      s.stats.compute += 35;
      message(
        s,
        "admin",
        "本周算力额度已补充 35 GPUh。每个服务器同一时刻只能运行一个任务。取消运行中的任务，不会退回已消耗额度。",
      );
    });
  if (day >= 8 && time >= 10)
    once(s, "hr", () => {
      s.mails.unshift({
        id: "career-invite",
        from: "星河科技 · 校园招聘",
        subject: "AI 工程实习交流邀请",
        text: "我们关注工程实践和问题解决能力，欢迎参加第 12 天 14:00 的实习交流。你可以参加，也可以继续科研。本次交流会计入职业积累，不会替你决定未来路线。",
        hour: s.hour,
        read: false,
        kind: "career",
      });
      s.calendar.push({
        id: "interview",
        title: "星河科技 · 实习交流",
        start: 11 * 24 + 14,
        duration: 2,
        type: "interview",
        done: false,
        missed: false,
      });
      notify(s, "一封新的机会", "校园邮箱收到实习交流邀请。", "mail");
    });
  if (day >= 10 && time >= 9 && s.profile.mentor === "resource")
    once(s, "industry-task", () => {
      message(
        s,
        "mentor",
        "合作项目需要一个推理演示，这周帮忙完成两次工程任务吧。我会另外补充 40 GPUh，也请你留意自己的论文时间。",
      );
      s.stats.compute += 40;
      s.calendar.push({
        id: "industry",
        title: "横向项目演示 · 完成两次实习工作",
        start: 15 * 24 + 16,
        duration: 2,
        type: "task",
        done: false,
        missed: false,
      });
    });
  if (day >= 14 && time >= 9)
    once(s, "maintenance", () => {
      s.flags.push(`maintenance-${day + 1}`);
      message(
        s,
        "admin",
        "明天凌晨 03:00–05:00 服务器维护，运行任务会暂停并在维护后继续。请考虑投稿和组会时间。",
      );
      s.stats.compute += 35;
    });
  if (day >= 18 && time >= 10)
    once(s, "npc-cooperate", () => {
      message(
        s,
        "senior",
        "我和知意合作的复现实验跑完了，发现分布外表现下降比预期大。我们在组里共享了失败原因：不同数据切分不能直接比较。你的实验也注意控制变量。",
      );
      s.npcs.find((n) => n.id === "senior")!.progress = clamp(
        s.npcs.find((n) => n.id === "senior")!.progress + 10,
      );
      s.npcs.find((n) => n.id === "sister")!.progress = clamp(
        s.npcs.find((n) => n.id === "sister")!.progress + 8,
      );
    });
  if (day >= 21 && time >= 9)
    once(s, "final-week", () => {
      s.stats.compute += 35;
      message(
        s,
        "mentor",
        "最后一周了。无论论文、工程还是合作，都请总结你真正学到的东西，诚实记录局限性。还没完成的研究，下个月可以继续。",
      );
    });
  if (day % 3 === 1 && time >= 16)
    once(s, `progress-${day}`, () => {
      const evidence = researchEvidence(s);
      message(
        s,
        "mentor",
        evidence.analyzed.length
          ? `我看到了你的 ${evidence.analyzed.length} 组分析。${evidence.hasBaseline ? "对照做得不错，接下来检查复现和泛化。" : "建议优先补齐匹配基线，先回答提升到底来自哪里。"}`
          : "这几天进展如何？阅读、明确问题和建立对照都算有效进展。可以在消息里向我汇报，遇到困难也请说出来。",
      );
    });
}
