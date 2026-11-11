import { useRef, useState } from "react";
import {
  ArrowDownToLine,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Coffee,
  FileCode2,
  FileJson2,
  FileText,
  Folder,
  GraduationCap,
  Heart,
  Leaf,
  Save,
  ShieldCheck,
  Sparkles,
  Upload,
} from "lucide-react";
import {
  DIRECTIONS,
  LIFE,
  MENTORS,
  PAPERS,
  TOPICS,
  RESEARCH_CONTEXT,
  gameDate,
} from "../game/data";
import { careerOptions, paperQuality } from "../game/research";
import {
  exportGame,
  loadGame,
  parseSave,
  saveGame,
  getLegacyBackup,
  exportLegacyBackup,
} from "../game/storage";
import type { GameState } from "../game/types";
import {
  Button,
  Hint,
  Meter,
  PageHead,
  Pill,
  SectionTitle,
  PeriodAvatar,
} from "./shared";
import type { AppProps } from "./shared";
export function AI({ state: s, dispatch, open }: AppProps) {
  return (
    <div className="page ai-page">
      <div className="ai-hero">
        <span className="ai-logo">
          <Sparkles size={30} strokeWidth={1.3} />
        </span>
        <Pill tone="purple">本地脚本与桌面工具 · 2012</Pill>
        <h1>
          科研工具箱
          <br />
          文献、统计与格式检查
        </h1>
        <p>
          使用现成脚本整理书目、计算统计量、检查文稿。
          <br />
          工具输出必须对照原文、数据和公式核查。
        </p>
      </div>
      <div className="ai-tools">
        {(
          [
            {
              kind: "summary",
              title: "整理文献索引",
              text: "从导入的题录整理关键词与目录，不代替阅读原文。",
              icon: BookOpen,
            },
            {
              kind: "idea",
              title: "查阅实验设计清单",
              text: "按教材清单检查对照、数据切分与变量设置。",
              icon: Sparkles,
            },
            {
              kind: "analysis",
              title: "运行统计汇总脚本",
              text: "计算均值和差异，仍需人工判断统计假设是否满足。",
              icon: FileJson2,
            },
            {
              kind: "polish",
              title: "检查文稿与引文格式",
              text: "应用参考文献样式与术语表，逐项核对检查建议。",
              icon: FileText,
            },
          ] as const
        ).map((t) => (
          <button
            key={t.kind}
            onClick={() => dispatch({ type: "ai", kind: t.kind })}
          >
            <t.icon size={21} />
            <h3>{t.title}</h3>
            <p>{t.text}</p>
            <span>
              使用 · 0.5h
              <ArrowRight size={13} />
            </span>
          </button>
        ))}
      </div>
      <SectionTitle
        right={
          <Pill tone={s.aiIssues.some((i) => !i.resolved) ? "orange" : "teal"}>
            {s.aiIssues.filter((i) => !i.resolved).length} 项待验证
          </Pill>
        }
      >
        验证工作台
      </SectionTitle>
      {s.aiIssues.length ? (
        <div className="ai-issues">
          {[...s.aiIssues].reverse().map((i) => (
            <div key={i.id} className={i.resolved ? "resolved" : ""}>
              <span>
                {i.resolved ? <Check size={18} /> : <ShieldCheck size={18} />}
              </span>
              <div>
                <b>
                  {i.kind === "code"
                    ? "第三方代码"
                    : i.kind === "citation"
                      ? "参考文献"
                      : "研究结论"}{" "}
                  · {i.resolved ? "已核实并修正" : "需要你的判断"}
                </b>
                <p>{i.text}</p>
              </div>
              <Button
                small
                secondary
                disabled={i.resolved}
                onClick={() => dispatch({ type: "verifyAI", id: i.id })}
              >
                {i.resolved ? "已完成" : "核查并修正 · 1h"}
              </Button>
            </div>
          ))}
        </div>
      ) : (
        <Hint>
          第三方脚本和网上题录可以节省时间，也可能包含导入错误、程序缺陷和不适用的统计假设。未验证的问题会降低论文可信度；核查有真实时间成本。
        </Hint>
      )}
      <div className="button-row">
        <Button secondary onClick={() => open("ide")}>
          <FileCode2 size={14} />在 Vim 中导入与检查代码
        </Button>
        <Button secondary onClick={() => open("writer")}>
          回到论文编辑器
        </Button>
      </div>
    </div>
  );
}
export function Life({ state: s, dispatch }: AppProps) {
  return (
    <div className="page">
      <PageHead
        eyebrow="研究生生活计划 · 2012"
        title="校园生活与个人状态"
        text="你是研究生，也不只是研究生。生活的选择同样有意义。"
        action={
          <Pill tone="orange">
            余额 ¥{Math.round(s.stats.money).toLocaleString()}
          </Pill>
        }
      />
      <div className="life-status">
        {[
          { name: "精力", value: s.stats.energy, icon: Coffee },
          { name: "身心健康", value: s.stats.health, icon: Heart },
          { name: "心情", value: s.stats.mood, icon: Leaf },
          { name: "压力", value: s.stats.stress, icon: Clock3 },
        ].map((x) => (
          <div key={x.name}>
            <x.icon size={17} />
            <span>{x.name}</span>
            <b>{Math.round(x.value)}</b>
            <Meter
              value={x.value}
              color={x.name === "压力" ? "#cf9a70" : undefined}
            />
          </div>
        ))}
      </div>
      <div className="life-hero">
        <span>☀</span>
        <div>
          <h2>实验可以在后台，生活要在场。</h2>
          <p>睡一觉不会让你落后。良好的状态，让研究走得更远。</p>
        </div>
      </div>
      <div className="life-grid">
        {LIFE.map((l) => (
          <button
            key={l.id}
            onClick={() => dispatch({ type: "life", kind: l.id })}
          >
            <span>
              {
                {
                  sleep: "☾",
                  exercise: "◉",
                  meal: "♨",
                  social: "☕",
                  intern: "▣",
                  ta: "✎",
                  leisure: "♫",
                }[l.id]
              }
            </span>
            <div>
              <h3>{l.name}</h3>
              <p>{l.description}</p>
            </div>
            <em>
              {l.time}h<ArrowRight size={13} />
            </em>
          </button>
        ))}
      </div>
      <Hint>
        睡眠期间后台任务、消息与审稿都会继续。长时间不休息会损害健康；过度工作也会挤占社交与其他机会。
      </Hint>
    </div>
  );
}
export function Academic({ state: s, open }: AppProps) {
  const date = gameDate(s.hour),
    quality = paperQuality(s),
    careers = careerOptions(s),
    meetings = s.calendar.filter((e) => e.type === "meeting" && e.done).length;
  return (
    <div className="page academic-page">
      <PageHead
        eyebrow="属于你的成长旅程"
        title={s.ended ? "四周，留下你的答案。" : "成长，从来不止一种。"}
        text={
          s.ended
            ? "这是第一个科研月的回顾。未来的方向，由你的选择慢慢定义。"
            : "你不需要现在决定一生，只需要认真对待今天的选择。"
        }
        action={
          <Pill>研一 · {s.ended ? "四周回顾" : `第 ${date.week} 周`}</Pill>
        }
      />
      <div className="student-card">
        <span className="student-avatar">
          <PeriodAvatar value={s.profile.avatar} />
        </span>
        <div>
          <h2>{s.profile.name}</h2>
          <p>{DIRECTIONS[s.profile.direction].name}</p>
          <span>
            {MENTORS[s.profile.mentor].lab} · 导师{" "}
            {MENTORS[s.profile.mentor].name}
          </span>
        </div>
        <GraduationCap size={65} strokeWidth={0.8} />
      </div>
      <div className="academic-summary">
        <div>
          <b>{s.read.length}</b>
          <span>篇精读文献</span>
        </div>
        <div>
          <b>{s.tasks.filter((t) => t.status === "done").length}</b>
          <span>组完成实验</span>
        </div>
        <div>
          <b>{s.submissions.filter((x) => x.status === "accept").length}</b>
          <span>项接收成果</span>
        </div>
        <div>
          <b>
            {meetings}
            <small>/4</small>
          </b>
          <span>次组会参与</span>
        </div>
      </div>
      <SectionTitle>三年旅程的第一步</SectionTitle>
      <div className="year-track">
        <div className="active">
          <b>研一</b>
          <span>基础 · 文献 · 找到问题</span>
          <Meter value={(s.hour / 672) * 100} />
          <small>本月体验 {Math.min(28, date.day)} / 28 天</small>
        </div>
        <div>
          <b>研二</b>
          <span>实验 · 投稿 · 学术交流</span>
          <small>后续扩展</small>
        </div>
        <div>
          <b>研三</b>
          <span>毕业 · 就业 · 继续探索</span>
          <small>后续扩展</small>
        </div>
      </div>
      <div className="growth-grid">
        <section>
          <SectionTitle>你的成长记录</SectionTitle>
          {[
            { name: "科研能力", value: s.stats.skill },
            { name: "工程实践", value: s.stats.engineering },
            { name: "合作与人际", value: s.stats.social },
            { name: "导师信任", value: s.stats.trust },
            { name: "学术信誉", value: s.stats.reputation },
          ].map((x) => (
            <Meter key={x.name} label={x.name} value={x.value} />
          ))}
        </section>
        <section>
          <SectionTitle>培养要求 · 三年参考</SectionTitle>
          <div className="requirement-item">
            <span>基础课程</span>
            <b>
              {s.calendar.filter((e) => e.type === "course" && e.done).length} /
              2 次体验课
            </b>
          </div>
          <div className="requirement-item">
            <span>组会参与</span>
            <b>{meetings} / 4 次</b>
          </div>
          <div className="requirement-item">
            <span>研究论证</span>
            <b>{quality.total} / 100</b>
          </div>
          <div className="requirement-item">
            <span>论文与成果</span>
            <b>
              {s.submissions.some((x) => x.status === "accept")
                ? "已有接收成果"
                : s.submissions.length
                  ? "评审探索中"
                  : "尚未投稿"}
            </b>
          </div>
          <p className="section-note">
            本期不会模拟真实毕业或发放学位。完整三年培养与毕业答辩将在后续版本扩展。
          </p>
        </section>
      </div>
      <SectionTitle>未来的路，不只有一条</SectionTitle>
      <div className="career-grid">
        {careers.map((c, i) => (
          <div key={c.name}>
            <span className="career-symbol">
              {["⌘", "⌨", "◈", "✳", "⌂"][i]}
            </span>
            <div>
              <b>{c.name}</b>
              <p>{c.reason}</p>
              <Meter value={c.score} />
            </div>
            <em>
              {c.score}
              <small>准备度</small>
            </em>
          </div>
        ))}
      </div>
      <p className="section-note">
        准备度是本周期的积累提示，不是职业录取结果。高校道路需要后续博士培养；不设唯一胜利条件。
      </p>
      {s.ended && (
        <div className="month-reflection">
          <Leaf size={24} />
          <h3>
            {s.stats.health >= 65
              ? "你为研究，也为自己留下了空间。"
              : "下一个月，也给自己多一点照顾。"}
          </h3>
          <p>
            {s.read.length} 篇文献、
            {s.tasks.filter((t) => t.status === "done").length} 次完成的实验、
            {s.flags.filter((f) => f.startsWith("collab-")).length}{" "}
            次合作。那些失败、重来和休息，也都是这段旅程的一部分。
          </p>
          <Button secondary onClick={() => open("settings")}>
            保存这段旅程
            <ArrowRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
export function Files({ state: s, open }: AppProps) {
  const [folder, setFolder] = useState("all"),
    [preview, setPreview] = useState<{ name: string; text: string } | null>(
      null,
    );
  const files = [
    {
      name: "research_plan.md",
      type: "research",
      icon: FileText,
      size: "1.2 KB",
      text:
        TOPICS.find((t) => t.id === s.topicId)?.hypothesis ||
        "尚未确定研究问题，请前往研究工作台。",
      app: "home" as const,
    },
    {
      name: "experiment.py",
      type: "code",
      icon: FileCode2,
      size: `${Math.round(s.codeQuality)}% 完善`,
      text: `实验框架实现质量：${Math.round(s.codeQuality)}%。代码与数据校验会影响训练的可复现性。`,
      app: "ide" as const,
    },
    ...s.read.map((id) => ({
      name: `${PAPERS.find((p) => p.id === id)!.title}.md`,
      type: "literature",
      icon: BookOpen,
      size: "已阅读",
      text: PAPERS.find((p) => p.id === id)!.insight,
      app: "library" as const,
    })),
    ...s.tasks.map((t) => ({
      name: `${t.config.name}.json`,
      type: "data",
      icon: FileJson2,
      size: t.status === "done" ? "结果已生成" : "任务记录",
      text: JSON.stringify(
        {
          config: {
            ...t.config,
            model:
              RESEARCH_CONTEXT[s.profile.direction].modelNames[t.config.model],
            dataset:
              RESEARCH_CONTEXT[s.profile.direction].datasetNames[
                t.config.dataset
              ],
            server:
              RESEARCH_CONTEXT[s.profile.direction].serverNames[
                t.config.server
              ],
          },
          result: t.result || null,
          logs: t.logs,
        },
        null,
        2,
      ),
      app: "analysis" as const,
    })),
    ...(s.topicId
      ? [
          {
            name: "manuscript.md",
            type: "research",
            icon: FileText,
            size: `${Object.values(s.manuscript.sections).join("").length} 字`,
            text: Object.entries(s.manuscript.sections)
              .map(([k, v]) => `## ${k}\n${v}`)
              .join("\n\n"),
            app: "writer" as const,
          },
        ]
      : []),
  ];
  return (
    <div className="files-layout">
      <aside>
        <h3>文件管理</h3>
        {[
          { id: "all", name: "全部文件" },
          { id: "research", name: "研究与论文" },
          { id: "code", name: "实验代码" },
          { id: "literature", name: "阅读笔记" },
          { id: "data", name: "实验数据" },
        ].map((f) => (
          <button
            className={folder === f.id ? "active" : ""}
            key={f.id}
            onClick={() => {
              setFolder(f.id);
              setPreview(null);
            }}
          >
            <Folder size={16} />
            {f.name}
          </button>
        ))}
      </aside>
      <main className="page">
        <PageHead
          title="科研工作目录"
          text={`${s.profile.name} / research-workspace / ${folder === "all" ? "全部文件" : folder}`}
          action={
            <Pill tone="slate">
              {
                files.filter((f) => folder === "all" || f.type === folder)
                  .length
              }{" "}
              个文件
            </Pill>
          }
        />
        {preview ? (
          <>
            <button className="back-link" onClick={() => setPreview(null)}>
              ← 返回文件列表
            </button>
            <h3>{preview.name}</h3>
            <pre className="file-preview">{preview.text}</pre>
          </>
        ) : (
          <div className="file-list">
            {files
              .filter((f) => folder === "all" || f.type === folder)
              .map((f) => (
                <div key={f.name}>
                  <f.icon size={23} />
                  <button
                    onClick={() => setPreview({ name: f.name, text: f.text })}
                  >
                    <b>{f.name}</b>
                    <small>{f.size}</small>
                  </button>
                  <Button small secondary onClick={() => open(f.app)}>
                    打开软件
                    <ArrowRight size={12} />
                  </Button>
                </div>
              ))}
          </div>
        )}
        <Hint>
          文件随文献、代码、实验与论文同步生成。实验配置、日志和结果可追溯，存档包含全部记录。
        </Hint>
      </main>
    </div>
  );
}
export function Settings({
  state: s,
  onLoad,
  onNew,
  toast,
}: AppProps & {
  onLoad: (s: GameState) => void;
  onNew: () => void;
  toast: (text: string) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null),
    [manual, setManual] = useState(loadGame(true));
  return (
    <div className="page settings-page">
      <PageHead
        eyebrow="保存你的每一步"
        title="控制面板 · 存档与恢复"
        text="自动存档持续保存当前进度；手动存档保留一个独立快照。"
      />
      <div className="save-current">
        <span>
          <Save size={26} />
        </span>
        <div>
          <b>
            {s.profile.name} · 第 {gameDate(s.hour).day} 天
          </b>
          <p>
            {DIRECTIONS[s.profile.direction].short} · {gameDate(s.hour).clock} ·{" "}
            {s.tasks.length} 组实验
          </p>
          <small>当前进度已启用本地自动保存</small>
        </div>
        <Pill>
          <Check size={12} />
          自动存档
        </Pill>
      </div>
      <div className="save-options">
        <section>
          <h3>手动存档</h3>
          <p>
            {manual
              ? `${manual.profile.name} · 第 ${gameDate(manual.hour).day} 天 · ${gameDate(manual.hour).clock}`
              : "还没有手动快照，保存一个随时可以回到的节点。"}
          </p>
          <div className="button-row">
            <Button
              onClick={() => {
                try {
                  saveGame(s, true);
                  setManual(s);
                  toast("手动存档已保存。");
                } catch {
                  toast("浏览器存储不可用，请导出存档备份。");
                }
              }}
            >
              <Save size={14} />
              保存快照
            </Button>
            <Button
              secondary
              disabled={!manual}
              onClick={() => {
                const data = loadGame(true);
                if (data) {
                  onLoad(data);
                  toast("已读取手动快照。");
                } else toast("快照无效或已不存在，当前进度未改变。");
              }}
            >
              读取快照
            </Button>
          </div>
        </section>
        <section>
          <h3>导出与导入</h3>
          <p>
            将完整进度保存为 JSON
            文件，在其他浏览器继续。导入会替换当前自动进度。
          </p>
          <div className="button-row">
            <Button secondary onClick={() => exportGame(s)}>
              <ArrowDownToLine size={14} />
              导出存档
            </Button>
            <Button secondary onClick={() => fileInput.current?.click()}>
              <Upload size={14} />
              导入存档
            </Button>
            <input
              ref={fileInput}
              type="file"
              accept="application/json,.json"
              hidden
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  try {
                    if (file.size > 5000000)
                      throw new Error("存档不能超过 5MB。");
                    const data = parseSave(await file.text());
                    onLoad(data);
                    toast("存档导入成功。");
                  } catch (error) {
                    toast(
                      error instanceof Error
                        ? error.message
                        : "导入失败，当前进度未改变。",
                    );
                  }
                  e.target.value = "";
                }
              }}
            />
          </div>
        </section>
      </div>
      {getLegacyBackup() && (
        <section className="legacy-save">
          <SectionTitle>旧版本迁移前的原始存档</SectionTitle>
          <p>
            升级为 2012
            版前的原始进度已在本机单独保留，包含当时的文稿与实验记录。
          </p>
          <Button
            secondary
            onClick={() =>
              toast(
                exportLegacyBackup()
                  ? "已导出迁移前原始存档。"
                  : "原始备份不存在或浏览器存储不可用。",
              )
            }
          >
            导出迁移前原档
          </Button>
        </section>
      )}
      <SectionTitle>重新出发</SectionTitle>
      <p className="section-note">
        新建角色会开始新的四周，并覆盖自动进度。手动快照仍会保留，建议先导出当前存档。
      </p>
      <Button secondary onClick={onNew}>
        创建新研究生档案
        <ArrowRight size={14} />
      </Button>
      <div className="about-grados">
        <GraduationCap size={30} strokeWidth={1.1} />
        <div>
          <b>研究生桌面模拟器：2012</b>
          <p>四周科研周期 · v1.0 · 本地优先</p>
        </div>
        <span>2012 年秋季学期 · 本地科研模拟</span>
      </div>
    </div>
  );
}
