import { useState } from "react";
import {
  ArrowRight,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  Code2,
  Copy,
  Cpu,
  FileCode2,
  FlaskConical,
  Play,
  Plus,
  ShieldCheck,
  Terminal as TerminalIcon,
  X,
} from "lucide-react";
import {
  DATASETS,
  DEFAULT_CONFIG,
  METHODS,
  MODELS,
  TOPICS,
} from "../game/data";
import { serverBusyUntil } from "../game/engine";
import {
  experimentDuration,
  requiredMemory,
  researchEvidence,
} from "../game/research";
import type { ExperimentConfig, TrainingTask } from "../game/types";
import {
  Button,
  Empty,
  Hint,
  Meter,
  PageHead,
  Pill,
  SectionTitle,
} from "./shared";
import type { AppProps } from "./shared";
const STATUS = {
  queued: "排队中",
  running: "运行中",
  done: "已完成",
  failed: "失败",
  cancelled: "已取消",
};
export function IDE({ state: s, dispatch, open }: AppProps) {
  const topic = TOPICS.find((t) => t.id === s.topicId);
  const [tab, setTab] = useState("experiment.py");
  const risk = s.aiIssues.some((i) => i.kind === "code" && !i.resolved);
  const code =
    tab === "experiment.py"
      ? [
          "# 通过控制变量，把研究假设变成实验",
          "from research import Model, Dataset, Evaluator",
          "",
          `# 课题：${topic?.title || "等待确定研究问题"}`,
          "def run_experiment(config):",
          "    dataset = Dataset.load(config.dataset)",
          "    train, validation = dataset.independent_split()",
          "    model = Model.load(config.model)",
          "",
          risk
            ? "    # 待核验：AI 代码未正确隔离验证集"
            : "    # 验证集独立保存，不参与参数选择",
          "    model.fit(train, epochs=config.epochs)",
          "    result = Evaluator.evaluate(model, validation)",
          "    return result.with_seed(config.seed)",
          "",
          'if __name__ == "__main__":',
          "    config = load_experiment_config()",
          "    run_experiment(config)",
        ]
      : [
          "# 实验约束与可复现性检查",
          "def test_data_isolation():",
          "    assert train.ids.isdisjoint(validation.ids)",
          "",
          "def test_random_seed():",
          "    assert result_a.seed == result_b.seed",
          "",
          "def test_output_dimensions():",
          "    assert predictions.shape == labels.shape",
          "",
          "# 点击「运行测试」修复实现中的隐性问题",
        ];
  return (
    <div className="ide-layout">
      <aside className="ide-explorer">
        <span>资源管理器</span>
        <b>
          <ChevronRight size={12} /> research-project
        </b>
        {["experiment.py", "test_research.py"].map((f) => (
          <button
            className={tab === f ? "active" : ""}
            onClick={() => setTab(f)}
            key={f}
          >
            <FileCode2 size={14} />
            {f}
          </button>
        ))}
        <div className="ide-readme">
          <span>README.md</span>
          <p>
            {topic?.hypothesis ||
              "先在研究工作台选择课题，明确一个可以验证的假设。"}
          </p>
          <button onClick={() => open("home")}>
            查看研究问题
            <ArrowRight size={12} />
          </button>
        </div>
      </aside>
      <main className="ide-main">
        <div className="ide-tabs">
          <button>
            <FileCode2 size={14} />
            {tab}
            <span>●</span>
          </button>
          <span>Python 3.12</span>
        </div>
        <div className="code-area">
          {code.map((line, i) => (
            <div key={i}>
              <span>{i + 1}</span>
              <code
                className={
                  line.startsWith("#") || line.trim().startsWith("#")
                    ? "comment"
                    : line.includes("def ") || line.includes("import")
                      ? "keyword"
                      : ""
                }
              >
                {line || " "}
              </code>
            </div>
          ))}
        </div>
        <div className="ide-bottom">
          <div>
            <ShieldCheck size={17} />
            <b>实现质量 {Math.round(s.codeQuality)}%</b>
            <Pill tone={risk ? "orange" : "teal"}>
              {risk ? "AI 代码待核验" : "数据隔离已启用"}
            </Pill>
          </div>
          <Meter value={s.codeQuality} />
          <p>
            代码质量会影响实验的可复现性。编写、测试与合作都能改善实现，AI
            代码需先核验。
          </p>
          <div className="button-row">
            <Button onClick={() => dispatch({ type: "code", mode: "write" })}>
              <Code2 size={14} />
              编写与完善 · 2h
            </Button>
            <Button
              secondary
              onClick={() => dispatch({ type: "code", mode: "test" })}
            >
              <ShieldCheck size={14} />
              运行测试 · 1h
            </Button>
            <Button
              secondary
              onClick={() => dispatch({ type: "code", mode: "ai" })}
            >
              AI 生成 · 0.5h
            </Button>
            <button className="text-button" onClick={() => open("terminal")}>
              配置实验
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
export function TerminalApp({ state: s, dispatch, open }: AppProps) {
  const [config, setConfig] = useState<ExperimentConfig>({ ...DEFAULT_CONFIG }),
    [selected, setSelected] = useState<string | null>(null),
    [mode, setMode] = useState<"new" | "logs">("new");
  const tasks = [...s.tasks].reverse(),
    task = tasks.find((t) => t.id === selected) || tasks[0];
  const memory = requiredMemory(config),
    capacity = config.server === "rtx" ? 24 : 48;
  function update<K extends keyof ExperimentConfig>(
    key: K,
    value: ExperimentConfig[K],
  ) {
    setConfig({ ...config, [key]: value });
  }
  return (
    <div className="page terminal-page">
      <PageHead
        eyebrow="科研实验终端"
        title="把假设，交给实验。"
        text={
          TOPICS.find((t) => t.id === s.topicId)?.title ||
          "先选择研究问题，并在代码编辑器完成实现。"
        }
        action={
          <Button small secondary onClick={() => open("gpu")}>
            <Cpu size={14} />
            算力资源
          </Button>
        }
      />
      <div className="tabs underlined">
        <button
          className={mode === "new" ? "active" : ""}
          onClick={() => setMode("new")}
        >
          <Plus size={14} />
          新建实验
        </button>
        <button
          className={mode === "logs" ? "active" : ""}
          onClick={() => setMode("logs")}
        >
          <TerminalIcon size={14} />
          任务与日志 <b>{s.tasks.length}</b>
        </button>
      </div>
      {mode === "new" ? (
        <>
          <div className="experiment-form">
            <label className="field full">
              <span>实验名称</span>
              <input
                value={config.name}
                maxLength={60}
                onChange={(e) => update("name", e.target.value)}
              />
            </label>
            <label className="field">
              <span>模型规模</span>
              <select
                value={config.model}
                onChange={(e) =>
                  update("model", e.target.value as ExperimentConfig["model"])
                }
              >
                {MODELS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>数据集</span>
              <select
                value={config.dataset}
                onChange={(e) =>
                  update(
                    "dataset",
                    e.target.value as ExperimentConfig["dataset"],
                  )
                }
              >
                {DATASETS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
              <small>
                {DATASETS.find((d) => d.id === config.dataset)?.note}
              </small>
            </label>
            <label className="field full">
              <span>研究方法</span>
              <div className="method-options">
                {METHODS.map((m) => (
                  <button
                    className={config.method === m.id ? "selected" : ""}
                    key={m.id}
                    onClick={() => update("method", m.id)}
                  >
                    <span>
                      {config.method === m.id ? (
                        <Check size={14} />
                      ) : (
                        <FlaskConical size={14} />
                      )}
                      <b>{m.name}</b>
                    </span>
                    <small>{m.note}</small>
                  </button>
                ))}
              </div>
            </label>
            <label className="field">
              <span>学习率</span>
              <select
                value={config.learningRate}
                onChange={(e) => update("learningRate", +e.target.value)}
              >
                {[0.0001, 0.001, 0.01].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>训练轮数（epochs）</span>
              <select
                value={config.epochs}
                onChange={(e) => update("epochs", +e.target.value)}
              >
                {[3, 8, 16].map((v) => (
                  <option key={v} value={v}>
                    {v} 轮
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>批大小（batch size）</span>
              <select
                value={config.batch}
                onChange={(e) => update("batch", +e.target.value)}
              >
                {[16, 32, 64].map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </label>
            <label className="field">
              <span>随机种子（seed）</span>
              <input
                type="number"
                min={0}
                max={999999}
                value={config.seed}
                onChange={(e) => update("seed", +e.target.value)}
              />
            </label>
            <label className="field full">
              <span>计算资源</span>
              <div className="server-options">
                {(["rtx", "a100"] as const).map((id) => (
                  <button
                    className={config.server === id ? "selected" : ""}
                    key={id}
                    onClick={() => update("server", id)}
                  >
                    <Cpu size={22} />
                    <div>
                      <b>{id === "rtx" ? "NVIDIA RTX 4090" : "NVIDIA A100"}</b>
                      <small>
                        {id === "rtx"
                          ? "24 GB 显存 · 1 GPUh / 小时"
                          : "48 GB 显存 · 3 GPUh / 小时"}
                      </small>
                    </div>
                    {config.server === id && <Check size={16} />}
                  </button>
                ))}
              </div>
            </label>
          </div>
          <div
            className={`experiment-estimate ${memory > capacity ? "warning" : ""}`}
          >
            <span>
              {memory > capacity ? (
                <CircleAlert size={18} />
              ) : (
                <Clock3 size={18} />
              )}
              <b>预计 {experimentDuration(config)}h</b> · {memory.toFixed(1)} /{" "}
              {capacity} GB 显存 ·{" "}
              {(
                experimentDuration(config) * (config.server === "a100" ? 3 : 1)
              ).toFixed(1)}{" "}
              GPUh
            </span>
            <small>
              {memory > capacity
                ? "显存不足，提交后将无法启动。缩小模型 / batch，或换用 A100。"
                : `当前额度 ${s.stats.compute.toFixed(1)} GPUh；任务会后台运行。`}
            </small>
          </div>
          <div className="button-row">
            <Button
              onClick={() => {
                dispatch({ type: "experiment", config });
                setMode("logs");
              }}
            >
              <Play size={14} />
              提交实验 · 0.25h
            </Button>
            <Button secondary onClick={() => open("ide")}>
              检查实现
              <ArrowRight size={14} />
            </Button>
          </div>
          <Hint>
            一次只改一个变量，才能知道提升来自哪里。训练期间切换软件或睡觉，实验会继续。
          </Hint>
        </>
      ) : tasks.length ? (
        <div className="task-log-layout">
          <aside>
            {tasks.map((t) => (
              <button
                className={task?.id === t.id ? "active" : ""}
                key={t.id}
                onClick={() => setSelected(t.id)}
              >
                <span className={`task-dot ${t.status}`} />
                <div>
                  <b>{t.config.name}</b>
                  <small>
                    {STATUS[t.status]} ·{" "}
                    {t.config.server === "rtx" ? "RTX 4090" : "A100"}
                  </small>
                </div>
                <ChevronRight size={13} />
              </button>
            ))}
          </aside>
          {task && (
            <main>
              <div className="task-heading">
                <h3>{task.config.name}</h3>
                <Pill tone={task.status === "failed" ? "orange" : "teal"}>
                  {STATUS[task.status]}
                </Pill>
              </div>
              <Meter value={(task.progress / task.duration) * 100} />
              <div className="log-console">
                <span>grados@research-lab:~$ python experiment.py</span>
                {task.logs.map((line, i) => (
                  <p
                    key={i}
                    className={
                      line.includes("错误")
                        ? "error"
                        : line.includes("完成")
                          ? "success"
                          : ""
                    }
                  >
                    {line}
                  </p>
                ))}
                {["running", "queued"].includes(task.status) && (
                  <p className="terminal-cursor">▌</p>
                )}
              </div>
              <div className="button-row">
                {task.status === "done" ? (
                  <Button
                    onClick={() => {
                      dispatch({ type: "analyze", id: task.id });
                      open("analysis");
                    }}
                  >
                    <FlaskConical size={14} />
                    {s.analyzed.includes(task.id)
                      ? "查看分析结果"
                      : "导入数据分析 · 1h"}
                  </Button>
                ) : task.status === "running" || task.status === "queued" ? (
                  <>
                    <Button
                      onClick={() => dispatch({ type: "advance", hours: 1 })}
                    >
                      <Clock3 size={14} />
                      等待 1 小时
                    </Button>
                    <Button
                      secondary
                      onClick={() => dispatch({ type: "cancel", id: task.id })}
                    >
                      终止任务
                    </Button>
                  </>
                ) : null}
                <Button
                  secondary
                  onClick={() => {
                    setConfig({
                      ...task.config,
                      name: `${task.config.name} · 迭代`,
                    });
                    setMode("new");
                  }}
                >
                  <Copy size={13} />
                  复制配置并改进
                </Button>
              </div>
            </main>
          )}
        </div>
      ) : (
        <Empty
          icon={TerminalIcon}
          title="第一个实验，正在等你"
          text="提交配置，训练日志和诊断将保留在这里。"
          action={<Button onClick={() => setMode("new")}>新建实验</Button>}
        />
      )}
    </div>
  );
}
export function GPU({ state: s, dispatch, open }: AppProps) {
  return (
    <div className="page">
      <PageHead
        eyebrow="实验室计算集群"
        title="有限算力，无限想法。"
        text="计算资源按队列共享，运行、排队和维护会真实影响实验进度。"
        action={<Pill>{s.stats.compute.toFixed(1)} GPUh 可用</Pill>}
      />
      <div className="gpu-grid">
        {(["rtx", "a100"] as const).map((server) => {
          const busy = serverBusyUntil(s, server) > s.hour,
            running = s.tasks.find(
              (t) => t.config.server === server && t.status === "running",
            ),
            queued = s.tasks.filter(
              (t) => t.config.server === server && t.status === "queued",
            );
          return (
            <div className="gpu-card" key={server}>
              <div>
                <span className="gpu-chip">
                  <Cpu size={26} />
                </span>
                <Pill tone={busy ? "orange" : running ? "teal" : "slate"}>
                  {busy ? "共享占用" : running ? "训练中" : "空闲"}
                </Pill>
              </div>
              <h3>{server === "rtx" ? "NVIDIA RTX 4090" : "NVIDIA A100"}</h3>
              <p>
                {server === "rtx" ? "24" : "48"} GB 显存 ·{" "}
                {server === "rtx" ? 1 : 3} GPUh / 小时
              </p>
              <div className="gpu-util">
                <b>
                  {busy || running ? "94" : "0"}
                  <small>%</small>
                </b>
                <span>GPU 利用率</span>
                <div className="gpu-spark">
                  {Array.from({ length: 23 }, (_, i) => (
                    <i
                      key={i}
                      style={{
                        height:
                          busy || running ? `${35 + ((i * 13) % 60)}%` : "4%",
                      }}
                    />
                  ))}
                </div>
              </div>
              <Meter
                value={
                  busy
                    ? 80
                    : running
                      ? (requiredMemory(running.config) /
                          (server === "rtx" ? 24 : 48)) *
                        100
                      : 0
                }
                label="显存占用"
                color="#8b89b5"
              />
              <div className="gpu-current">
                {busy ? (
                  <>
                    <Clock3 size={15} />
                    <span>
                      同门任务 / 维护 · 约{" "}
                      {(serverBusyUntil(s, server) - s.hour).toFixed(1)}h 后释放
                    </span>
                  </>
                ) : running ? (
                  <>
                    <FlaskConical size={15} />
                    <span>
                      {running.config.name} · 剩余{" "}
                      {(running.duration - running.progress).toFixed(1)}h
                    </span>
                  </>
                ) : (
                  <>
                    <Check size={15} />
                    <span>资源可用，可以提交实验</span>
                  </>
                )}
              </div>
              <small>{queued.length} 个任务等待 · 不收取排队费用</small>
            </div>
          );
        })}
      </div>
      <SectionTitle
        right={
          <Button small secondary onClick={() => open("terminal")}>
            <Plus size={13} />
            提交任务
          </Button>
        }
      >
        任务队列
      </SectionTitle>
      {s.tasks.length ? (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>实验任务</th>
                <th>服务器</th>
                <th>状态 / 进度</th>
                <th>已用算力</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {[...s.tasks].reverse().map((t) => (
                <tr key={t.id}>
                  <td>
                    <b>{t.config.name}</b>
                    <small>
                      seed {t.config.seed} ·{" "}
                      {requiredMemory(t.config).toFixed(1)} GB
                    </small>
                  </td>
                  <td>{t.config.server === "rtx" ? "RTX 4090" : "A100"}</td>
                  <td>
                    <Pill tone={t.status === "failed" ? "orange" : "teal"}>
                      {STATUS[t.status]}
                      {t.priority > 1 ? " · 加急" : ""}
                    </Pill>
                    {t.status === "running" && (
                      <Meter value={(t.progress / t.duration) * 100} />
                    )}
                  </td>
                  <td>{t.spent.toFixed(1)} GPUh</td>
                  <td>
                    {t.status === "queued" && (
                      <button
                        className="text-button"
                        onClick={() => dispatch({ type: "priority", id: t.id })}
                      >
                        {t.priority > 1 ? "取消加急" : "加急"}
                      </button>
                    )}
                    {["running", "queued"].includes(t.status) && (
                      <button
                        className="icon-button"
                        title="取消任务"
                        onClick={() => dispatch({ type: "cancel", id: t.id })}
                      >
                        <X size={14} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <Empty
          icon={Cpu}
          title="还没有提交实验"
          text="在实验终端选择配置与服务器，这里会同步显示队列。"
        />
      )}
      <Hint>
        两台服务器可同时运行不同任务。训练额度不足时会暂停；可在课题组通讯中向导师或管理员申请额外额度。
      </Hint>
      <Button secondary onClick={() => open("chat")}>
        协商算力资源
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}
function LossChart({ task }: { task: TrainingTask }) {
  const result = task.result!;
  const max = Math.max(...result.trainLoss, ...result.valLoss) * 1.1,
    toPoints = (values: number[]) =>
      values
        .map(
          (v, i) =>
            `${48 + (i / Math.max(1, values.length - 1)) * 500},${198 - (v / max) * 164}`,
        )
        .join(" ");
  return (
    <div className="loss-chart">
      <svg viewBox="0 0 590 235" role="img" aria-label="训练与验证损失曲线">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line
              x1="48"
              x2="548"
              y1={34 + i * 41}
              y2={34 + i * 41}
              stroke="#e7eeeb"
              strokeDasharray="4 4"
            />
            <text x="31" y={38 + i * 41} textAnchor="end">
              {(max * (1 - i / 4)).toFixed(1)}
            </text>
          </g>
        ))}
        <polyline
          points={toPoints(result.trainLoss)}
          stroke="#377e73"
          strokeWidth="2.5"
          fill="none"
        />
        <polyline
          points={toPoints(result.valLoss)}
          stroke="#c99c68"
          strokeWidth="2.5"
          fill="none"
        />
        {result.trainLoss.map((_, i) => (
          <text
            key={i}
            x={48 + (i / Math.max(1, result.trainLoss.length - 1)) * 500}
            y="220"
            textAnchor="middle"
          >
            {i + 1}
          </text>
        ))}
      </svg>
      <div className="chart-legend">
        <span>
          <i />
          训练损失
        </span>
        <span>
          <i />
          验证损失
        </span>
        <small>横轴：训练轮次 · 纵轴：损失（越低越好）</small>
      </div>
    </div>
  );
}
export function Analysis({ state: s, dispatch, open }: AppProps) {
  const tasks = s.tasks.filter((t) => t.status === "done" && t.result),
    [selected, setSelected] = useState(""),
    task = tasks.find((t) => t.id === selected) || tasks.at(-1),
    evidence = researchEvidence(s);
  if (!task)
    return (
      <div className="page">
        <PageHead eyebrow="实验数据工作室" title="让结果，讲出它的故事。" />
        <Empty
          title="数据还在路上"
          text="完成实验后，将结果导入这里，查看学习曲线与因果诊断。"
          action={
            <Button onClick={() => open("terminal")}>
              前往实验终端
              <ArrowRight size={14} />
            </Button>
          }
        />
      </div>
    );
  const result = task.result!,
    analyzed = s.analyzed.includes(task.id);
  return (
    <div className="page">
      <PageHead
        eyebrow="实验数据工作室"
        title="分数之外，还有答案。"
        action={
          <select
            aria-label="选择分析实验"
            value={task.id}
            onChange={(e) => setSelected(e.target.value)}
          >
            {tasks.map((t) => (
              <option key={t.id} value={t.id}>
                {t.config.name}
              </option>
            ))}
          </select>
        }
      />
      {!analyzed ? (
        <div className="import-banner">
          <FlaskConical size={21} />
          <span>结果已生成。花一点时间整理，才能将它变成研究证据。</span>
          <Button
            small
            onClick={() => dispatch({ type: "analyze", id: task.id })}
          >
            导入并分析 · 1h
          </Button>
        </div>
      ) : (
        <Pill>
          <Check size={12} />
          已纳入研究证据
        </Pill>
      )}
      <div className="result-metrics">
        <div>
          <span>评测分数</span>
          <b>
            {result.score}
            <small>%</small>
          </b>
          <em>理论基线 {result.baseline}%</em>
        </div>
        <div>
          <span>泛化表现</span>
          <b>
            {result.generalization}
            <small>%</small>
          </b>
          <em>
            {task.config.dataset === "raw"
              ? "警惕数据污染带来的高估"
              : "独立留出评测"}
          </em>
        </div>
        <div>
          <span>可复现性</span>
          <b>
            {result.reproducibility}
            <small>%</small>
          </b>
          <em>受代码与数据隔离影响</em>
        </div>
        <div>
          <span>计算成本</span>
          <b>
            {result.cost}
            <small>GPUh</small>
          </b>
          <em>所有训练均计入预算</em>
        </div>
      </div>
      <SectionTitle
        right={
          <Button
            small
            secondary
            disabled={!analyzed || s.manuscript.figures.includes(task.id)}
            onClick={() => dispatch({ type: "figure", id: task.id })}
          >
            {s.manuscript.figures.includes(task.id) ? (
              <>
                <Check size={13} />
                已插入论文
              </>
            ) : (
              <>
                插入论文图表
                <ArrowRight size={13} />
              </>
            )}
          </Button>
        }
      >
        学习曲线
      </SectionTitle>
      <LossChart task={task} />
      <div className="diagnosis">
        <LightIcon />
        <div>
          <h3>从现象，走向原因</h3>
          {result.diagnosis.map((d) => (
            <p key={d}>{d}</p>
          ))}
          {result.evidence.map((d) => (
            <p className="evidence-text" key={d}>
              {d}
            </p>
          ))}
        </div>
      </div>
      <SectionTitle>当前证据完整度</SectionTitle>
      <div className="evidence-checks">
        {[
          { name: "匹配对照基线", done: evidence.hasBaseline },
          { name: "多种子复现", done: evidence.hasReproduction },
          { name: "跨领域泛化", done: evidence.hasGeneralization },
        ].map((x) => (
          <span key={x.name} className={x.done ? "done" : ""}>
            {x.done ? <Check size={14} /> : <CircleAlert size={14} />} {x.name}
          </span>
        ))}
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>实验方案</th>
              <th>方法 / 数据</th>
              <th>评分</th>
              <th>泛化</th>
              <th>种子</th>
              <th>分析</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t) => (
              <tr key={t.id} onClick={() => setSelected(t.id)}>
                <td>{t.config.name}</td>
                <td>
                  {METHODS.find((m) => m.id === t.config.method)?.name}
                  <small>
                    {DATASETS.find((d) => d.id === t.config.dataset)?.name}
                  </small>
                </td>
                <td>{t.result!.score}%</td>
                <td>{t.result!.generalization}%</td>
                <td>{t.config.seed}</td>
                <td>
                  {s.analyzed.includes(t.id) ? (
                    <Check size={15} />
                  ) : (
                    <button
                      className="text-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        dispatch({ type: "analyze", id: t.id });
                      }}
                    >
                      分析 · 1h
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Button onClick={() => open("terminal")}>
        调整下一轮实验
        <ArrowRight size={14} />
      </Button>
    </div>
  );
}
function LightIcon() {
  return (
    <span className="diagnosis-icon">
      <FlaskConical size={22} />
    </span>
  );
}
