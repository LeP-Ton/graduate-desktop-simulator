import { END_HOUR, MENTORS, NPCS, SECTIONS } from "./data";
import { message } from "./mutations";
import type { GameState, Profile, Section } from "./types";

export function createGame(profile: Profile, seed = 20120903): GameState {
  const sections = Object.fromEntries(
    SECTIONS.map((x) => [x.id, ""]),
  ) as Record<Section, string>;
  const effort = Object.fromEntries(SECTIONS.map((x) => [x.id, 0])) as Record<
    Section,
    number
  >;
  const s: GameState = {
    version: 1,
    era: 2012,
    profile,
    hour: 8,
    rng: seed,
    stats: {
      energy: 92,
      stress: 16,
      mood: 82,
      health: 88,
      money: 1200,
      compute: MENTORS[profile.mentor].quota,
      skill: 22 + profile.abilities.insight * 2,
      engineering: 15 + profile.abilities.coding * 2,
      trust: 62,
      reputation: 70,
      social: 35,
    },
    topicId: null,
    read: [],
    saved: [],
    codeQuality: 10 + profile.abilities.coding * 3,
    tasks: [],
    analyzed: [],
    manuscript: { sections, effort, references: [], figures: [], response: "" },
    submissions: [],
    messages: [],
    npcs: NPCS.map((n) => ({
      id: n.id,
      relationship: n.id === "mentor" ? 62 : 45,
      progress: 8,
      status: "研究中",
      task: n.task,
    })),
    calendar: [
      ...[0, 1, 2, 3].map((w) => ({
        id: `meeting-${w}`,
        title: `第 ${w + 1} 周课题组组会`,
        start: w * 168 + 3 * 24 + 14,
        duration: 2,
        type: "meeting" as const,
        done: false,
        missed: false,
      })),
      {
        id: "course-1",
        title: "高等机器学习 · 课程",
        start: 24 + 10,
        duration: 2,
        type: "course",
        done: false,
        missed: false,
      },
      {
        id: "course-2",
        title: "科研方法与学术规范",
        start: 8 * 24 + 10,
        duration: 2,
        type: "course",
        done: false,
        missed: false,
      },
      {
        id: "deadline",
        title: "四周科研周期总结",
        start: END_HOUR - 10,
        duration: 1,
        type: "deadline",
        done: false,
        missed: false,
      },
    ],
    mails: [
      {
        id: "welcome",
        from: "研究生院",
        subject: "欢迎开启你的研究生生活",
        text: "欢迎来到计算机学院。未来四周，你可以认真做科研，也可以探索工程、合作与生活。周四 14:00 为课题组组会，请提前准备。毕业是一段三年的旅程，本次体验仅记录你的第一个科研月。",
        hour: 8,
        read: false,
        kind: "school",
      },
      {
        id: "workshop-call",
        from: "NCR 工作坊组委会",
        subject: "征稿启事：一个小问题，也值得好好研究",
        text: "青年计算研究工作坊 2012欢迎有明确研究问题、可靠实验与诚实局限性讨论的短论文。本游戏中审稿约需 30 个模拟小时。可从论文编辑器投稿。所有会议均为虚构。",
        hour: 8,
        read: false,
        kind: "conference",
      },
    ],
    aiIssues: [],
    flags: [],
    notices: [],
    history: [],
    ended: false,
    lastNotice: "你的研究生生活，今天开始。",
  };
  message(
    s,
    "mentor",
    profile.mentor === "rigorous"
      ? "欢迎入组。先读几篇核心文献，找出一个能被实验验证的问题。周四组会，我更想看到证据，而不是漂亮的分数。"
      : profile.mentor === "free"
        ? "欢迎。选一个你真正在意的问题吧，方向由你决定。需要讨论时随时来找我，记得给自己留些休息时间。"
        : "欢迎加入实验室！算力已经开通。先熟悉文献与代码，这个月也有一个工程项目需要你参与，可以来聊聊分工。",
  );
  message(
    s,
    "senior",
    "同学，欢迎！我把排序学习、数据清洗和复现相关文献放进了学术搜索。建议先做基线，再一次只改一个变量。实验服务器今天上午有人在用，先读文献正合适。",
  );
  return s;
}
