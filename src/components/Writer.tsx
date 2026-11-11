import { useState } from "react";
import {
  ArrowRight,
  Check,
  FilePenLine,
  Send,
  ShieldCheck,
} from "lucide-react";
import { PAPERS, SECTIONS, VENUES, gameDate } from "../game/data";
import { paperQuality, researchEvidence } from "../game/research";
import type { Section } from "../game/types";
import { Button, Hint, Meter, PageHead, Pill, SectionTitle } from "./shared";
import type { AppProps } from "./shared";
const REVIEW_LABEL = {
  review: "同行评审中",
  reject: "Reject · 拒稿",
  major: "Major Revision · 大修",
  minor: "Minor Revision · 小修",
  accept: "Accept · 已接收",
};
export function Writer({ state: s, dispatch, open }: AppProps) {
  const [section, setSection] = useState<Section>("abstract"),
    [tab, setTab] = useState<"write" | "submit">("write"),
    [venue, setVenue] = useState("workshop");
  const quality = paperQuality(s),
    evidence = researchEvidence(s),
    last = s.submissions.at(-1);
  return (
    <div className="writer-layout">
      <aside className="writer-sidebar">
        <div className="writer-doc">
          <FilePenLine size={24} />
          <b>我的研究论文</b>
          <small>本地文稿 · 自动保存</small>
        </div>
        <span className="nav-label">文稿大纲</span>
        {SECTIONS.map((sec, i) => (
          <button
            key={sec.id}
            className={`nav-item ${section === sec.id && tab === "write" ? "active" : ""}`}
            onClick={() => {
              setSection(sec.id);
              setTab("write");
            }}
          >
            <span className="outline-index">{i + 1}</span>
            {sec.name}
            {s.manuscript.effort[sec.id] >= 65 && <Check size={13} />}
          </button>
        ))}
        <div className="sidebar-line" />
        <button
          className={`nav-item ${tab === "submit" ? "active" : ""}`}
          onClick={() => setTab("submit")}
        >
          <Send size={15} />
          投稿与评审
          {last && <span className="nav-count">{s.submissions.length}</span>}
        </button>
        <div className="writer-score">
          <span>
            <ShieldCheck size={15} />
            研究质量
          </span>
          <b>
            {quality.total}
            <small>/100</small>
          </b>
          <Meter value={quality.total} />
          <p>扎实的证据，比漂亮的措辞更重要。</p>
        </div>
      </aside>
      <main className="writer-main">
        {tab === "write" ? (
          <>
            <div className="editor-toolbar">
              <span>
                <i className="online-dot" />
                文稿已同步
              </span>
              <div>
                <button title="引用文献" onClick={() => open("library")}>
                  引用文献
                </button>
                <button title="插入图表" onClick={() => open("analysis")}>
                  插入图表
                </button>
                <button title="AI 润色" onClick={() => open("ai")}>
                  AI 润色
                </button>
              </div>
            </div>
            <div className="editor-paper">
              <span className="eyebrow">研究论文 · 工作稿</span>
              <h2>{SECTIONS.find((x) => x.id === section)!.name}</h2>
              <div className="editor-meta">
                {s.profile.name} · 计算机与人工智能学院{" "}
                <span>{s.manuscript.sections[section].length} 字</span>
              </div>
              <textarea
                aria-label="论文章节内容"
                className={`manuscript-text ${section === "title" ? "title-text" : ""}`}
                value={s.manuscript.sections[section]}
                onChange={(e) =>
                  dispatch({
                    type: "editSection",
                    section,
                    text: e.target.value,
                  })
                }
                placeholder={
                  section === "abstract"
                    ? "研究的问题是什么？为什么重要？你的实验发现了什么，又有哪些局限？\n\n点击下方「整理证据并完善章节」，将当前真实研究记录写入文稿。"
                    : "在这里写下你的论证，或花时间整理现有研究证据。"
                }
              />
              <div className="editor-effort">
                <span>章节打磨</span>
                <Meter value={s.manuscript.effort[section]} />
                <b>{Math.round(s.manuscript.effort[section])}%</b>
              </div>
              <Button
                onClick={() => dispatch({ type: "writeSection", section })}
                disabled={s.manuscript.effort[section] >= 100}
              >
                <FilePenLine size={14} />
                整理证据并完善章节 · 2h
              </Button>
              <Hint>
                直接编辑保留你的文字；「完善章节」会根据当前研究证据重新整理此章节。写作质量需要时间，可信度需要实验。
              </Hint>
              {section === "related" && (
                <div className="reference-list">
                  <SectionTitle>
                    参考文献 · {s.manuscript.references.length}
                  </SectionTitle>
                  {s.manuscript.references.length ? (
                    s.manuscript.references.map((id, i) => (
                      <p key={id}>
                        [{i + 1}] {PAPERS.find((p) => p.id === id)?.title}
                      </p>
                    ))
                  ) : (
                    <p>请在文献管理器中引用已精读的论文。</p>
                  )}
                </div>
              )}
              {section === "experiments" && (
                <div className="reference-list">
                  <SectionTitle>
                    已插入图表 · {s.manuscript.figures.length}
                  </SectionTitle>
                  {s.manuscript.figures.map((id, i) => {
                    const t = s.tasks.find((t) => t.id === id);
                    return (
                      <div className="embedded-figure" key={id}>
                        <span>
                          图 {i + 1} · {t?.config.name}
                        </span>
                        <b>
                          评测 {t?.result?.score}% · 泛化{" "}
                          {t?.result?.generalization}%
                        </b>
                        <p>原始实验与配置保留，可在数据分析中回溯。</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="page">
            <PageHead
              eyebrow="同行评审"
              title="让你的发现，接受检验。"
              text="评审依据投稿时的证据快照。等待期间补写内容不会改变已投稿件。"
            />
            <div className="quality-grid">
              {Object.entries({
                novelty: "创新性",
                completeness: "实验完整度",
                credibility: "数据可信度",
                argument: "论证严谨性",
                writing: "写作质量",
              }).map(([key, label]) => (
                <Meter
                  key={key}
                  value={quality[key as keyof typeof quality]}
                  label={label}
                />
              ))}
            </div>
            <div className="evidence-checks">
              {[
                { text: "匹配基线", done: evidence.hasBaseline },
                { text: "多种子复现", done: evidence.hasReproduction },
                { text: "泛化证据", done: evidence.hasGeneralization },
              ].map((x) => (
                <Pill key={x.text} tone={x.done ? "teal" : "slate"}>
                  {x.done ? <Check size={12} /> : <span>○</span>}
                  {x.text}
                </Pill>
              ))}
            </div>
            {last && (
              <section className="review-box">
                <div>
                  <Pill
                    tone={
                      last.status === "reject" || last.status === "major"
                        ? "orange"
                        : "teal"
                    }
                  >
                    {REVIEW_LABEL[last.status]}
                  </Pill>
                  <small>
                    第 {last.round} 轮 ·{" "}
                    {VENUES.find((v) => v.id === last.venue)?.short}
                  </small>
                </div>
                {last.status === "review" ? (
                  <>
                    <h3>研究正在被认真阅读。</h3>
                    <p>
                      预计 {gameDate(last.dueAt).date}{" "}
                      {gameDate(last.dueAt).clock} 返回，约剩{" "}
                      {Math.max(0, last.dueAt - s.hour).toFixed(1)}{" "}
                      小时。可以继续其他工作。
                    </p>
                    {last.dueAt > 672 && (
                      <Hint>
                        本次评审晚于四周结束；本周期回顾将保留在审状态。
                      </Hint>
                    )}
                  </>
                ) : (
                  <>
                    <h3>评审意见</h3>
                    {last.feedback.map((f, i) => (
                      <p key={i}>{f}</p>
                    ))}
                    {["major", "minor"].includes(last.status) && (
                      <label className="field">
                        <span>
                          逐点回复{" "}
                          <small>至少 20 字，说明补充的实验和修改位置</small>
                        </span>
                        <textarea
                          value={s.manuscript.response}
                          onChange={(e) =>
                            dispatch({ type: "respond", text: e.target.value })
                          }
                          placeholder="感谢审稿人的建议。针对 R1，我们补充了……并将结果加入实验章节；针对 R2，我们……"
                          rows={5}
                        />
                      </label>
                    )}
                  </>
                )}
              </section>
            )}
            <SectionTitle>选择投稿目标</SectionTitle>
            <div className="venue-options">
              {VENUES.map((v) => (
                <button
                  key={v.id}
                  className={venue === v.id ? "selected" : ""}
                  onClick={() => setVenue(v.id)}
                >
                  <span className="venue-select">
                    {venue === v.id ? <Check size={13} /> : null}
                  </span>
                  <div>
                    <b>
                      {v.name}
                      <em>{v.short}</em>
                    </b>
                    <p>{v.description}</p>
                    <small>
                      学术门槛 {v.threshold}/100 · 审稿约 {v.hours}h ·{" "}
                      {v.direction === "all" ? "综合方向" : "偏好智能体研究"}
                    </small>
                  </div>
                </button>
              ))}
            </div>
            <Button
              disabled={last?.status === "review" || last?.status === "accept"}
              onClick={() => dispatch({ type: "submit", venue })}
            >
              <Send size={14} />
              {last?.status === "accept"
                ? "研究成果已接收"
                : last &&
                    ["major", "minor"].includes(last.status) &&
                    last.venue === venue
                  ? "提交修改稿与回复 · 1h"
                  : "正式投稿 · 1h"}
              <ArrowRight size={14} />
            </Button>
            <Hint>
              时间投入不能保证接收。拒稿或修改意见会指出证据缺口，可以补实验、收窄结论或选择更合适的目标。
            </Hint>
            {s.submissions.length > 1 && (
              <>
                <SectionTitle>投稿历史</SectionTitle>
                {[...s.submissions].reverse().map((sub) => (
                  <div className="submission-history" key={sub.id}>
                    <span>
                      {VENUES.find((v) => v.id === sub.venue)?.short} · 第
                      {sub.round}轮
                    </span>
                    <Pill tone="slate">{REVIEW_LABEL[sub.status]}</Pill>
                    <small>投稿时质量 {sub.score}/100</small>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
