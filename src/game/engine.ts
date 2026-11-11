import {
  DEFAULT_CONFIG,
  RESEARCH_CONTEXT,
  END_HOUR,
  LIFE,
  MENTORS,
  NPCS,
  PAPERS,
  SECTIONS,
  TOPICS,
  VENUES,
} from "./data";
import {
  clamp,
  experimentDuration,
  requiredMemory,
  researchEvidence,
  reviewManuscript,
  validConfig,
} from "./research";
import { log, message, normalize, uid } from "./mutations";
import { advanceTime } from "./time";
import { suggestedSection } from "./writing";
import type { Action, GameState, Section, TrainingTask } from "./types";

export { createGame } from "./state";
export { serverBusyUntil } from "./gpu";
export { advanceTime, suggestedSection };

function canWork(s: GameState, hours: number) {
  if (s.ended) {
    s.lastNotice = "四周周期已经结束。可以查看回顾、导出存档或新建角色。";
    return false;
  }
  if (s.hour + hours > END_HOUR) {
    s.lastNotice = "剩余时间不足以完成此操作。可以推进至周期结束查看回顾。";
    return false;
  }
  if (s.stats.energy < 8) {
    s.lastNotice = "精力不足，先去生活中心休息或睡觉。";
    return false;
  }
  return true;
}
function work(s: GameState, hours: number, stress = 2) {
  advanceTime(s, hours);
  s.stats.energy -= hours * 2;
  s.stats.stress += stress;
  normalize(s);
}
export function reduceGame(state: GameState, action: Action): GameState {
  const s: GameState = structuredClone(state);
  s.lastNotice = "";
  const readOnly = [
    "dismiss",
    "readMessages",
    "readMail",
    "editSection",
    "respond",
  ];
  if (s.ended && !readOnly.includes(action.type)) {
    s.lastNotice = "周期已结束，请在培养系统查看四周回顾。";
    return s;
  }
  switch (action.type) {
    case "advance":
      if (
        Number.isFinite(action.hours) &&
        action.hours >= 0 &&
        action.hours <= END_HOUR
      )
        advanceTime(s, action.hours, action.rest);
      break;
    case "read": {
      const paper = PAPERS.find((p) => p.id === action.id);
      if (!paper || s.read.includes(action.id)) {
        s.lastNotice = "这篇文献已经读过了，可以回顾研究洞察。";
        break;
      }
      if (!canWork(s, 1)) break;
      work(s, 1, 1);
      s.read.push(action.id);
      s.stats.skill += 2 + s.profile.abilities.insight * 0.15;
      log(s, `阅读完成：${paper.title}。已记录方法、局限与研究洞察。`);
      break;
    }
    case "savePaper":
      if (PAPERS.some((p) => p.id === action.id)) {
        if (s.saved.includes(action.id))
          s.saved = s.saved.filter((id) => id !== action.id);
        else s.saved.push(action.id);
        s.lastNotice = s.saved.includes(action.id)
          ? "文献已收藏到知识库。"
          : "已取消收藏。";
      }
      break;
    case "cite":
      if (!s.read.includes(action.id))
        s.lastNotice = "请先阅读并核实文献，再加入参考文献。";
      else if (!s.manuscript.references.includes(action.id)) {
        s.manuscript.references.push(action.id);
        s.lastNotice = "已加入论文参考文献。";
      } else {
        s.manuscript.references = s.manuscript.references.filter(
          (x) => x !== action.id,
        );
        s.lastNotice = "已移除引用。";
      }
      break;
    case "topic": {
      const topic = TOPICS.find(
        (t) => t.id === action.id && t.direction === s.profile.direction,
      );
      if (!topic) break;
      if (s.topicId === topic.id) {
        s.lastNotice = "已经在研究这一问题。";
        break;
      }
      if (!topic.sources.some((id) => s.read.includes(id))) {
        s.lastNotice = "先阅读至少一篇该方向的相关文献，找到选题依据。";
        break;
      }
      if (!canWork(s, s.topicId ? 4 : 1)) break;
      const changing = !!s.topicId;
      work(s, changing ? 4 : 1, 3);
      s.topicId = topic.id;
      if (changing) {
        s.codeQuality = Math.max(15, s.codeQuality - 30);
        s.manuscript.effort = Object.fromEntries(
          SECTIONS.map((x) => [x.id, 0]),
        ) as Record<Section, number>;
        s.manuscript.sections = Object.fromEntries(
          SECTIONS.map((x) => [x.id, ""]),
        ) as Record<Section, string>;
        s.manuscript.figures = [];
      }
      s.manuscript.sections.title = topic.title;
      s.manuscript.effort.title = 70;
      log(
        s,
        `${changing ? "调整研究方向，重置论文论证并承担 4 小时转向成本" : "确定研究问题"}：${topic.title}。`,
      );
      break;
    }
    case "code": {
      if (!s.topicId) {
        s.lastNotice = "先在研究工作台确定一个研究问题。";
        break;
      }
      const hours = action.mode === "ai" ? 0.5 : action.mode === "test" ? 1 : 2;
      if (!canWork(s, hours)) break;
      work(s, hours);
      s.codeQuality = clamp(
        s.codeQuality +
          (action.mode === "test"
            ? 22
            : action.mode === "write"
              ? 28 + s.profile.abilities.coding
              : 36),
      );
      s.stats.engineering += action.mode === "ai" ? 1 : 4;
      if (action.mode === "ai") {
        s.aiIssues.push({
          id: uid(s, "ai"),
          kind: "code",
          text: "下载的第三方代码把验证集参与了参数选择，存在隐性数据泄漏。运行测试并核验后才能安全用于实验。",
          resolved: false,
        });
        log(s, "导入了师兄分享的代码框架，代码进度提升；仍需核验数据隔离。");
      } else if (action.mode === "test") {
        s.aiIssues
          .filter((i) => i.kind === "code")
          .forEach((i) => (i.resolved = true));
        log(
          s,
          "通过数据隔离、维度和随机种子测试；修复第三方代码中的数据泄漏。",
        );
      } else
        log(s, `完成科研代码迭代，代码质量 ${Math.round(s.codeQuality)}%。`);
      break;
    }
    case "experiment": {
      if (!s.topicId) {
        s.lastNotice = "先确定研究问题，再提交实验。";
        break;
      }
      if (s.codeQuality < 25) {
        s.lastNotice = "代码尚不能运行。请先在 IDE 编写实验框架。";
        break;
      }
      if (!validConfig(action.config)) {
        s.lastNotice = "实验参数无效，请检查配置。";
        break;
      }
      if (
        s.tasks.filter((t) => t.status === "running" || t.status === "queued")
          .length >= 6
      ) {
        s.lastNotice = "最多同时保留 6 个待执行任务，请完成或取消部分任务。";
        break;
      }
      if (!canWork(s, 0.25)) break;
      const config = {
        ...DEFAULT_CONFIG,
        ...action.config,
        name:
          action.config.name.trim().slice(0, 60) ||
          `实验 ${s.tasks.length + 1}`,
      };
      work(s, 0.25, 0.5);
      const task: TrainingTask = {
        id: uid(s, "exp"),
        topicId: s.topicId,
        config,
        status: "queued",
        progress: 0,
        duration: experimentDuration(config),
        spent: 0,
        submittedAt: s.hour,
        priority: 1,
        codeQuality: s.codeQuality,
        aiRisk: s.aiIssues.some((i) => i.kind === "code" && !i.resolved),
        logs: [
          `[提交] ${config.name} · seed=${config.seed}`,
          `[配置] ${config.model} / ${config.dataset} / ${config.method}`,
          `[计划] 预计 ${experimentDuration(config)}h，需要 ${requiredMemory(config).toFixed(2)}GB ${RESEARCH_CONTEXT[s.profile.direction].resourceLabel}。`,
        ],
      };
      s.tasks.push(task);
      log(
        s,
        "实验已进入 GPU 队列。你可以切换软件继续其他工作，操作或播放时间会推进训练。",
      );
      break;
    }
    case "cancel": {
      const task = s.tasks.find((t) => t.id === action.id);
      if (task && ["queued", "running"].includes(task.status)) {
        task.status = "cancelled";
        task.finishedAt = s.hour;
        task.logs.push("[取消] 用户终止任务，已消耗算力不退回。");
        s.lastNotice = "已取消任务，释放服务器。";
      }
      break;
    }
    case "priority": {
      const task = s.tasks.find(
        (t) => t.id === action.id && t.status === "queued",
      );
      if (task) {
        if (s.stats.trust < 55) {
          s.lastNotice = "加急需要导师信任达到 55。";
          break;
        }
        task.priority = task.priority === 2 ? 1 : 2;
        s.lastNotice =
          task.priority === 2
            ? "已设置加急，将在当前任务之后优先调度。"
            : "已恢复普通优先级。";
      }
      break;
    }
    case "analyze": {
      const task = s.tasks.find(
        (t) => t.id === action.id && t.status === "done",
      );
      if (!task || s.analyzed.includes(task.id)) break;
      if (!canWork(s, 1)) break;
      work(s, 1, 1);
      s.analyzed.push(task.id);
      s.stats.skill += 3;
      log(s, "结果已导入分析。请结合学习曲线、泛化与诊断调整方案。");
      break;
    }
    case "figure":
      if (
        s.analyzed.includes(action.id) &&
        !s.manuscript.figures.includes(action.id)
      ) {
        s.manuscript.figures.push(action.id);
        s.lastNotice = "图表已插入论文编辑器的实验章节。";
      }
      break;
    case "editSection":
      if (SECTIONS.some((x) => x.id === action.section)) {
        s.manuscript.sections[action.section] = action.text.slice(0, 10000);
      }
      break;
    case "writeSection": {
      if (!s.topicId) {
        s.lastNotice = "请先确定研究问题。";
        break;
      }
      if (s.manuscript.effort[action.section] >= 100) {
        s.lastNotice = "此章节已完成充分打磨。还需用实验和引用支持论证。";
        break;
      }
      if (!canWork(s, 2)) break;
      work(s, 2);
      s.manuscript.sections[action.section] = suggestedSection(
        s,
        action.section,
      );
      s.manuscript.effort[action.section] = clamp(
        s.manuscript.effort[action.section] +
          55 +
          s.profile.abilities.writing * 2,
      );
      log(
        s,
        `完善了「${SECTIONS.find((x) => x.id === action.section)!.name}」，写作时间不能代替实验和引用证据。`,
      );
      break;
    }
    case "submit": {
      const venue = VENUES.find((v) => v.id === action.venue);
      if (!venue) break;
      if (s.submissions.some((x) => x.status === "review")) {
        s.lastNotice = "当前有稿件在审，不能同时向多个目标投稿。";
        break;
      }
      if (
        !s.topicId ||
        researchEvidence(s).analyzed.length < 1 ||
        Object.values(s.manuscript.effort).filter((v) => v > 0).length < 5
      ) {
        s.lastNotice = "投稿需要至少一组已分析实验，以及至少五个已完善章节。";
        break;
      }
      const last = s.submissions.at(-1),
        isRevision =
          last &&
          ["major", "minor"].includes(last.status) &&
          last.venue === venue.id;
      if (isRevision && s.manuscript.response.trim().length < 20) {
        s.lastNotice = "修改重投需要至少 20 字逐点回复，说明补充了什么证据。";
        break;
      }
      if (!canWork(s, 1)) break;
      work(s, 1, 3);
      const round = isRevision ? last.round + 1 : 1,
        id = uid(s, "sub");
      const review = reviewManuscript(s, venue.id, round);
      const unchecked = s.aiIssues.filter((i) => !i.resolved).length;
      if (unchecked) s.stats.reputation -= Math.min(15, unchecked * 5);
      s.submissions.push({
        id,
        venue: venue.id,
        status: "review",
        round,
        dueAt: s.hour + venue.hours,
        submittedAt: s.hour,
        score: review.score,
        feedback: [],
        responded: !!isRevision,
        decision: review,
      });
      s.manuscript.response = "";
      log(
        s,
        `已${isRevision ? "修改重投" : "投稿"}至 ${venue.short}。约 ${venue.hours} 小时后返回独立同行评审。`,
      );
      break;
    }
    case "respond":
      s.manuscript.response = action.text.slice(0, 10000);
      break;
    case "reply": {
      const npc = s.npcs.find((n) => n.id === action.npc);
      if (!npc || !canWork(s, 0.5)) break;
      const texts = {
        progress: "汇报当前真实进展，说明困难和下一步计划。",
        help: "请教实验设计与实现，记录具体建议。",
        collaborate: "讨论合作，先约定分工与署名，再共享工作。",
        resource: "说明实验计划，申请有限的额外算力。",
        calendar: "确认安排，把沟通事项加入日历。",
      };
      work(s, 0.5, -1);
      s.messages.push({
        id: uid(s, "m"),
        from: action.npc,
        text: action.text?.trim().slice(0, 500) || texts[action.choice],
        hour: s.hour,
        read: true,
        player: true,
      });
      npc.relationship = clamp(npc.relationship + 4);
      s.stats.social += 2;
      if (action.choice === "progress") {
        s.stats.trust +=
          s.tasks.some((t) => t.status === "done") || s.read.length > 1 ? 4 : 1;
        message(
          s,
          npc.id,
          s.read.length
            ? "有明确的问题和真实记录就是进展。继续检查你的对照和数据，不必只追求好看的分数。"
            : "先从一两篇核心论文开始，找出局限性，再把问题变成可以验证的实验。",
        );
      }
      if (action.choice === "help") {
        s.stats.skill += 3;
        message(
          s,
          npc.id,
          "建议先用轻量模型、清洗数据、学习率 0.001、8 轮、batch 16 建立基线。之后仅改变方法，对照自适应策略。同方案更换 seed，最后再做跨领域测试。",
        );
      }
      if (action.choice === "collaborate") {
        const flag = `collab-${npc.id}`;
        if (!s.flags.includes(flag)) {
          s.flags.push(flag);
          s.codeQuality = clamp(s.codeQuality + 12);
          s.stats.engineering += 4;
          npc.progress += 5;
          message(
            s,
            npc.id,
            "可以！我们约定各自负责的实现和验证，共享清洗流程。代码质量提高了，也请在成果里记录贡献。",
          );
        } else
          message(s, npc.id, "我们已经建立合作，继续各自推进并共享结果吧。");
      }
      if (action.choice === "resource") {
        const flag = `resource-${Math.floor(s.hour / 168)}`;
        if (s.flags.includes(flag))
          message(
            s,
            npc.id,
            "本周额外额度已经申请过了。先检查任务预算，下周可再次申请。",
          );
        else if (["mentor", "admin"].includes(npc.id)) {
          s.flags.push(flag);
          s.stats.compute += 25;
          message(
            s,
            npc.id,
            "批准 25 GPUh 额外额度。本周仅此一次，请保留实验计划与成本记录。",
          );
        } else
          message(
            s,
            npc.id,
            "额度需要找导师或管理员申请。我的任务结束后会释放服务器。",
          );
      }
      if (action.choice === "calendar") {
        const id = uid(s, "event");
        s.calendar.push({
          id,
          title: `与${npc.id === "mentor" ? MENTORS[s.profile.mentor].name : NPCS.find((n) => n.id === npc.id)!.name}讨论实验`,
          start: Math.min(END_HOUR - 1, s.hour + 24),
          duration: 1,
          type: "task",
          done: false,
          missed: false,
        });
        message(s, npc.id, "已把明天的讨论加入日历。届时带上问题和实验记录。");
      }
      break;
    }
    case "readMessages":
      s.messages
        .filter((m) => m.from === action.npc)
        .forEach((m) => (m.read = true));
      break;
    case "readMail": {
      const mail = s.mails.find((x) => x.id === action.id);
      if (mail) mail.read = true;
      break;
    }
    case "addEvent":
      if (
        action.title.trim() &&
        Number.isFinite(action.start) &&
        action.start >= s.hour &&
        action.start < END_HOUR
      ) {
        s.calendar.push({
          id: uid(s, "event"),
          title: action.title.trim().slice(0, 100),
          start: action.start,
          duration: 1,
          type: "task",
          done: false,
          missed: false,
        });
        s.lastNotice = "已加入日历。";
      } else s.lastNotice = "请选择未来且在四周内的时间，并填写事项。";
      break;
    case "attend": {
      const event = s.calendar.find((e) => e.id === action.id);
      if (!event || event.done || event.missed) break;
      if (s.hour < event.start - 2) {
        s.lastNotice = "活动尚未开放，开始前两小时可以前往。";
        break;
      }
      if (
        event.type === "task" &&
        event.id === "industry" &&
        s.flags.filter((x) => x.startsWith("intern-")).length < 2
      ) {
        s.lastNotice = "横向项目需要先完成两次实习工作。";
        break;
      }
      const duration =
        Math.max(0, event.start - s.hour) +
        Math.min(
          event.duration,
          Math.max(0.25, event.start + event.duration - s.hour),
        );
      if (!canWork(s, duration)) break;
      event.done = true;
      work(s, duration, 1);
      if (event.type === "meeting") {
        const e = researchEvidence(s),
          quality = Math.min(
            100,
            s.read.length * 5 +
              e.analyzed.length * 12 +
              (e.hasBaseline ? 20 : 0) +
              (s.topicId ? 15 : 0),
          );
        s.stats.trust += quality >= 40 ? 8 : -3;
        message(
          s,
          "mentor",
          quality >= 40
            ? `这次汇报把问题和证据讲清楚了（${quality}/100）。下次进一步检查复现和研究边界。`
            : `汇报还缺少明确问题和实验记录（${quality}/100）。先读文献、建立可比较的实验。`,
        );
      } else if (event.type === "course") {
        s.stats.skill += 6;
        log(s, "完成课程学习，科研能力 +6。");
      } else if (event.type === "interview") {
        s.stats.engineering += 10;
        s.stats.social += 7;
        log(s, "完成实习交流，积累了工程与职业信息；未来由你选择。");
      } else {
        s.stats.social += 3;
        log(s, `完成日历事项：${event.title}。`);
      }
      break;
    }
    case "life": {
      const item = LIFE.find((x) => x.id === action.kind)!;
      if (s.ended || s.hour + item.time > END_HOUR) {
        s.lastNotice = "剩余时间不足以完成此活动。";
        break;
      }
      if (["intern", "ta"].includes(action.kind) && !canWork(s, item.time))
        break;
      const cost =
        action.kind === "meal" ? 8 : action.kind === "social" ? 25 : 0;
      if (s.stats.money < cost) {
        s.lastNotice = "余额不足，可以考虑助教或实习工作。";
        break;
      }
      s.stats.money -= cost;
      advanceTime(s, item.time, action.kind === "sleep");
      if (action.kind === "sleep") {
        s.stats.energy += 76;
        s.stats.stress -= 18;
        s.stats.health += 3;
        s.stats.mood += 6;
      }
      if (action.kind === "exercise") {
        s.stats.energy -= 5;
        s.stats.stress -= 18;
        s.stats.health += 7;
        s.stats.mood += 10;
      }
      if (action.kind === "meal") {
        s.stats.energy += 14;
        s.stats.health += 3;
        s.stats.mood += 5;
      }
      if (action.kind === "social") {
        s.stats.social += 8;
        s.stats.mood += 20;
        s.stats.stress -= 12;
        s.npcs.forEach((n) => (n.relationship = clamp(n.relationship + 2)));
      }
      if (action.kind === "intern") {
        s.stats.engineering += 10;
        s.stats.money += 100;
        s.stats.energy -= 15;
        s.stats.stress += 5;
        s.flags.push(`intern-${s.hour}`);
      }
      if (action.kind === "ta") {
        s.stats.skill += 2;
        s.stats.money += 80;
        s.stats.energy -= 8;
      }
      if (action.kind === "leisure") {
        s.stats.mood += 24;
        s.stats.stress -= 20;
        s.stats.energy += 7;
      }
      log(s, `${item.name} · ${item.time}h。生活也是研究生旅程的一部分。`);
      break;
    }
    case "ai": {
      if (!canWork(s, 0.5)) break;
      if (
        (action.kind === "analysis" || action.kind === "polish") &&
        !s.topicId
      ) {
        s.lastNotice = "请先明确研究问题，再用统计脚本整理已有记录。";
        break;
      }
      work(s, 0.5, 0);
      if (action.kind === "summary") {
        s.stats.skill += 1;
        s.aiIssues.push({
          id: uid(s, "ai"),
          kind: "citation",
          text: "BibTeX 批量整理得到一条缺少出版来源的引用；学术库中无法核实，核查原文前请勿引用。",
          resolved: false,
        });
        log(
          s,
          "关键词脚本整理出数据清洗、匹配对照、独立验证等线索；批量导入中有一条来源不明的引用，需要核对原文。",
        );
      }
      if (action.kind === "idea") {
        s.stats.skill += 2;
        log(
          s,
          "实验设计清单：先做匹配基线，仅改变策略；再更换种子复现，最后用独立留出集检验边界。清单不能代替你阅读和思考。",
        );
      }
      if (action.kind === "analysis") {
        s.aiIssues.push({
          id: uid(s, "ai"),
          kind: "claim",
          text: "统计模板把单次实验的提升填成“普遍显著提升”，超出了已有证据。请核对重复实验和独立留出结果。",
          resolved: false,
        });
        log(
          s,
          "统计脚本加快了结果整理，但默认报告模板夸大了单次实验结论，核验后才能用于论文。",
        );
      }
      if (action.kind === "polish") {
        s.manuscript.effort.abstract = clamp(s.manuscript.effort.abstract + 20);
        if (!s.manuscript.sections.abstract)
          s.manuscript.sections.abstract = suggestedSection(s, "abstract");
        s.aiIssues.push({
          id: uid(s, "ai"),
          kind: "claim",
          text: "导入的摘要模板包含“已证明普遍最优”，不被当前实验支持，需要手动改为有限条件下的观测。",
          resolved: false,
        });
        log(
          s,
          "论文模板整理了摘要结构，但不能判断结论强弱；请人工核实表述后采用。",
        );
      }
      break;
    }
    case "verifyAI": {
      const issue = s.aiIssues.find((x) => x.id === action.id && !x.resolved);
      if (!issue || !canWork(s, 1)) break;
      work(s, 1, 0);
      issue.resolved = true;
      s.stats.reputation += 1;
      if (issue.kind === "code") s.codeQuality = clamp(s.codeQuality + 8);
      log(
        s,
        issue.kind === "citation"
          ? "检索核实：批量导入的参考文献无法找到可靠来源，已排除，不计入参考文献。"
          : issue.kind === "code"
            ? "逐项核对并修复了第三方代码的数据隔离问题。"
            : "对照实验记录，收窄模板结论为当前设置下的观测，保留研究局限。",
      );
      break;
    }
    case "dismiss":
      s.notices = s.notices.filter((n) => n.id !== action.id);
      break;
  }
  normalize(s);
  return s;
}
