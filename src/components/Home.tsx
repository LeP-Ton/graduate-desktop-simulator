import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronRight,
  Circle,
  Clock3,
  FlaskConical,
  Leaf,
  Lightbulb,
  Plus,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import { DIRECTIONS, MENTORS, TOPICS, gameDate } from "../game/data";
import { paperQuality, researchEvidence } from "../game/research";
import type { AppId } from "../game/types";
import { AppIcon, Button, Meter, Pill, SectionTitle } from "./shared";
import type { AppProps } from "./shared";
export function Home({ state: s, dispatch, open }: AppProps) {
  const date = gameDate(s.hour),
    topic = TOPICS.find((t) => t.id === s.topicId),
    evidence = researchEvidence(s),
    quality = paperQuality(s);
  const next = s.calendar
    .filter((e) => !e.done && !e.missed && e.start >= s.hour - e.duration)
    .sort((a, b) => a.start - b.start)
    .slice(0, 3);
  const steps = [
    {
      label: "从文献里找到好问题",
      note: "阅读论文，记录方法与研究局限",
      app: "search",
      done: s.read.length > 0,
    },
    {
      label: "提出一个可以验证的假设",
      note: "选择课题，制定研究计划",
      app: "home",
      done: !!s.topicId,
    },
    {
      label: "让实验给出真实的答案",
      note: "建立基线，运行并分析实验",
      app: "terminal",
      done: evidence.analyzed.length > 0,
    },
    {
      label: "把你的发现写下来",
      note: "组织证据，写作与同行评审",
      app: "writer",
      done: s.submissions.length > 0,
    },
  ] as const;
  return (
    <div className="home-layout">
      <aside className="app-sidebar">
        <div className="sidebar-profile">
          <div>{s.profile.avatar}</div>
          <b>
            {s.profile.name}
            <small>计算机与人工智能学院</small>
          </b>
        </div>
        <span className="nav-label">我的空间</span>
        {(
          [
            { id: "home", label: "研究概览", icon: Target },
            { id: "calendar", label: "我的日程", icon: Clock3 },
            { id: "library", label: "知识库", icon: BookOpen },
            { id: "academic", label: "成长档案", icon: Leaf },
          ] as const
        ).map((i) => (
          <button
            className={i.id === "home" ? "nav-item active" : "nav-item"}
            key={i.id}
            onClick={() => open(i.id)}
          >
            <i.icon size={16} />
            {i.label}
            {i.id === "calendar" && (
              <span className="nav-count">
                {s.calendar.filter((e) => !e.done && !e.missed).length}
              </span>
            )}
          </button>
        ))}
        <div className="sidebar-line" />
        <span className="nav-label">快捷访问</span>
        {(["search", "terminal", "writer", "ai"] as AppId[]).map((id) => (
          <button className="nav-item" onClick={() => open(id)} key={id}>
            <AppIcon id={id} bare size={16} />
            {
              (
                {
                  search: "学术搜索",
                  terminal: "实验终端",
                  writer: "论文编辑器",
                  ai: "AI 科研助手",
                } as Record<string, string>
              )[id]
            }
          </button>
        ))}
        <div className="sidebar-bottom">
          <span className="online-dot" />
          <span>{MENTORS[s.profile.mentor].lab}</span>
          <small>研一 · 第 {date.week} 周</small>
        </div>
      </aside>
      <main className="home-content">
        <div className="home-greeting">
          <div>
            <span className="eyebrow">
              {date.clock < "12:00"
                ? "早上好"
                : date.clock < "18:00"
                  ? "下午好"
                  : "晚上好"}
              ，{s.profile.name}
            </span>
            <h1>今天，也离答案近一点。</h1>
          </div>
          <Pill>
            <span className="online-dot" /> 科研周期 · 第 {date.day} 天
          </Pill>
        </div>
        <div className="home-hero">
          <div className="hero-copy">
            <span>
              <i /> 你的研究，没有标准答案
            </span>
            <h2>
              把好奇心，
              <br />
              变成新的发现。
            </h2>
            <p>
              {topic
                ? topic.question
                : "从一篇论文、一个疑问开始。\n下一次突破，也许就在你的桌面上。"}
            </p>
            <button onClick={() => open(topic ? "terminal" : "search")}>
              {topic ? "继续我的研究" : "开始探索文献"}
              <ArrowRight size={16} />
            </button>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="art-orbit orbit-one" />
            <div className="art-orbit orbit-two" />
            <div className="art-orbit orbit-three" />
            <div className="art-planet" />
            <div className="art-asterisk">✳</div>
            <div className="art-dot" />
            <div className="art-tag">
              <FlaskConical size={15} /> 可能性，正在发生
            </div>
          </div>
          <span className="hero-number">01 — ∞</span>
        </div>
        <div className="overview-cards">
          <div>
            <span>
              <Zap size={15} />
              可用精力
            </span>
            <b>
              {Math.round(s.stats.energy)}
              <small>/ 100</small>
            </b>
            <Meter value={s.stats.energy} />
            <p>
              {s.stats.energy > 40
                ? "状态不错，记得按时休息"
                : "有些疲惫，给自己一点时间"}
            </p>
          </div>
          <div
            onClick={() => open("gpu")}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === "Enter" && open("gpu")}
          >
            <span>
              <FlaskConical size={15} />
              后台实验
            </span>
            <b>
              {
                s.tasks.filter((t) => ["running", "queued"].includes(t.status))
                  .length
              }
              <small>项进行中</small>
            </b>
            <div className="tiny-bars">
              {[
                25, 45, 32, 64, 48, 82, 59, 75, 50, 90, 60, 72, 95, 70, 80, 50,
                68, 75, 87, 65,
              ].map((v, i) => (
                <i key={i} style={{ height: v + "%" }} />
              ))}
            </div>
            <p>
              {s.tasks.some((t) => t.status === "running")
                ? "训练运行中，可以继续其他工作"
                : "让实验在后台推进你的研究"}
            </p>
          </div>
          <div>
            <span>
              <BookOpen size={15} />
              知识积累
            </span>
            <b>
              {s.read.length}
              <small>篇已阅读</small>
            </b>
            <div className="knowledge-dots">
              {Array.from({ length: 8 }, (_, i) => (
                <i key={i} className={i < s.read.length ? "filled" : ""} />
              ))}
            </div>
            <p>
              {s.saved.length} 篇已收藏 · {s.manuscript.references.length}{" "}
              篇已引用
            </p>
          </div>
        </div>
        <div className="home-columns">
          <section>
            <SectionTitle right={<span className="muted">按自己的节奏</span>}>
              研究旅程
            </SectionTitle>
            <div className="journey">
              {steps.map((step, i) => (
                <button
                  key={step.label}
                  onClick={() =>
                    step.app === "home"
                      ? document
                          .getElementById("topic-selection")
                          ?.scrollIntoView({ behavior: "smooth" })
                      : open(step.app)
                  }
                >
                  <span
                    className={`step-mark ${step.done ? "done" : i === steps.findIndex((x) => !x.done) ? "current" : ""}`}
                  >
                    {step.done ? (
                      <Check size={13} />
                    ) : (
                      String(i + 1).padStart(2, "0")
                    )}
                  </span>
                  <div>
                    <b>{step.label}</b>
                    <small>{step.note}</small>
                  </div>
                  <ChevronRight size={15} />
                </button>
              ))}
            </div>
          </section>
          <section>
            <SectionTitle
              right={
                <button
                  className="text-button"
                  onClick={() => open("calendar")}
                >
                  全部
                  <ChevronRight size={13} />
                </button>
              }
            >
              接下来的日程
            </SectionTitle>
            <div className="agenda-mini">
              {next.map((e) => (
                <button key={e.id} onClick={() => open("calendar")}>
                  <span>
                    <b>
                      {gameDate(e.start)
                        .date.replace("月", " / ")
                        .replace("日", "")}
                    </b>
                    <small>{gameDate(e.start).weekday}</small>
                  </span>
                  <i />
                  <div>
                    <b>{e.title}</b>
                    <small>
                      {gameDate(e.start).clock} · {e.duration} 小时
                    </small>
                  </div>
                </button>
              ))}
            </div>
            <button className="gentle-card" onClick={() => open("life")}>
              <span>🌿</span>
              <div>
                <b>别忘了，生活也很重要。</b>
                <small>实验在跑的时候，去吃顿好饭吧。</small>
              </div>
              <ArrowRight size={15} />
            </button>
          </section>
        </div>
        <section id="topic-selection">
          <SectionTitle
            right={
              <Pill tone="slate">{DIRECTIONS[s.profile.direction].short}</Pill>
            }
          >
            我的研究问题
          </SectionTitle>
          {topic ? (
            <div className="active-topic">
              <span className="topic-light">
                <Lightbulb size={23} />
              </span>
              <div>
                <b>{topic.title}</b>
                <p>{topic.hypothesis}</p>
                <span>
                  代码质量 {Math.round(s.codeQuality)}% · 已分析{" "}
                  {evidence.analyzed.length} 组实验 · 论文质量 {quality.total}
                  /100
                </span>
              </div>
              <Button small onClick={() => open("ide")}>
                继续研究
                <ArrowRight size={14} />
              </Button>
            </div>
          ) : (
            <p className="section-note">
              先读一篇相关文献，再选择你想验证的假设。选题可以改变，转向会消耗时间。
            </p>
          )}
          <div className="topic-grid">
            {TOPICS.filter((t) => t.direction === s.profile.direction).map(
              (t) => (
                <div
                  className={`topic-card ${topic?.id === t.id ? "selected" : ""}`}
                  key={t.id}
                >
                  <div>
                    <Pill tone={t.risk > 40 ? "orange" : "teal"}>{t.kind}</Pill>
                    <small>{t.cycle}</small>
                  </div>
                  <h3>{t.title}</h3>
                  <p>{t.question}</p>
                  <div className="topic-metrics">
                    <span>
                      创新 <b>{t.novelty}</b>
                    </span>
                    <span>
                      难度 <b>{t.difficulty}</b>
                    </span>
                    <span>
                      风险 <b>{t.risk}%</b>
                    </span>
                    <span>
                      竞争 <b>{t.competition}</b>
                    </span>
                  </div>
                  <div className="topic-bottom">
                    <span>预计 {t.cost} GPUh 起</span>
                    <Button
                      small
                      secondary={t.id !== s.topicId}
                      disabled={t.id === s.topicId}
                      onClick={() => dispatch({ type: "topic", id: t.id })}
                    >
                      {t.id === s.topicId ? (
                        <>
                          <Check size={13} />
                          当前课题
                        </>
                      ) : (
                        <>
                          {s.topicId ? "调整方向 · 4h" : "确定课题 · 1h"}
                          <Plus size={13} />
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ),
            )}
          </div>
        </section>
        <div className="home-footer">
          <Sparkles size={14} />
          <span>不必每一天都突破。提出一个更好的问题，也是一种进步。</span>
          <Circle size={5} />
          <span>所有论文与机构均为虚构</span>
        </div>
      </main>
    </div>
  );
}
