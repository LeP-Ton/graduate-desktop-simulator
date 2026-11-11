import { MODELS, TOPICS, VENUES } from "./data";
import { seededValues } from "./random";
import type {
  ExperimentConfig,
  ExperimentResult,
  GameState,
  TrainingTask,
} from "./types";

export const clamp = (value: number, min = 0, max = 100) =>
  Math.max(min, Math.min(max, value));
export function requiredMemory(c: ExperimentConfig) {
  return (
    MODELS.find((m) => m.id === c.model)!.memory +
    c.batch * 0.18 +
    (c.method === "verified" ? 5 : 0)
  );
}
export function experimentDuration(c: ExperimentConfig) {
  return (
    Math.round(
      ((MODELS.find((m) => m.id === c.model)!.duration * c.epochs) / 8) *
        (c.method === "verified" ? 1.5 : 1) *
        (c.dataset === "shift" ? 1.25 : 1) *
        (c.server === "a100" ? 0.6 : 1) *
        4,
    ) / 4
  );
}
export function simulateExperiment(task: TrainingTask): ExperimentResult {
  const c = task.config,
    topic = TOPICS.find((t) => t.id === task.topicId)!;
  const random = seededValues(c.seed + topic.difficulty * 7, 20);
  const noise = (random[0] - 0.5) * 5;
  const baseline = 68;
  const methodGain =
    c.method === "baseline" ? 0 : c.method === topic.method ? 12 : 7;
  const modelGain = c.model === "large" ? 6 : c.model === "balanced" ? 3 : 0;
  const badRate = c.learningRate >= 0.01,
    slowRate = c.learningRate <= 0.0001;
  const overfit = c.epochs > 10;
  const codePenalty =
    Math.max(0, 65 - task.codeQuality) * 0.16 + (task.aiRisk ? 9 : 0);
  const trainingGain = c.epochs < 5 ? -5 : 2;
  const rawBias = c.dataset === "raw" ? 9 : c.dataset === "shift" ? -4 : 0;
  const score = clamp(
    baseline +
      methodGain +
      modelGain +
      trainingGain +
      rawBias -
      codePenalty -
      (badRate ? 22 : slowRate ? 4 : 0) -
      (overfit ? 8 : 0) +
      noise,
    25,
    97,
  );
  const generalization = clamp(
    score -
      (c.dataset === "raw" ? 18 : c.dataset === "shift" ? 0 : 4) -
      (overfit ? 6 : 0) +
      (c.method === "verified" ? 3 : 0),
    20,
    96,
  );
  const reproducibility = clamp(
    60 +
      task.codeQuality * 0.28 +
      (c.dataset !== "raw" ? 10 : -8) +
      (c.method === "verified" ? 6 : 0) -
      (badRate ? 24 : 0) -
      (task.aiRisk ? 24 : 0),
  );
  const diagnosis: string[] = [],
    evidence: string[] = [];
  if (badRate)
    diagnosis.push(
      "学习率 0.01 过大，梯度震荡导致验证损失不稳定。下一轮尝试 0.001。",
    );
  if (slowRate)
    diagnosis.push(
      "学习率较小，在当前训练轮数内收敛不足。适当调高学习率可节省算力。",
    );
  if (overfit)
    diagnosis.push(
      "训练损失下降但验证损失上升：训练轮数过多，模型在小数据上过拟合。建议使用 8 轮。",
    );
  if (c.dataset === "raw")
    diagnosis.push(
      "原始数据含重复和噪声，表面分数高于真实泛化能力。请使用清洗集或跨领域留出集复核。",
    );
  if (task.codeQuality < 65)
    diagnosis.push(
      "实验代码测试不足，评估边界条件可能有误。先在 IDE 中完善实现和测试。",
    );
  if (task.aiRisk)
    diagnosis.push(
      "未验证的 AI 代码遗漏了验证集隔离，导致数据泄漏。修复代码后重新运行。",
    );
  if (c.method === "baseline")
    evidence.push(
      "已建立对照基线。下一轮保持模型、数据集和随机种子，仅改变研究策略，确认因果增益。",
    );
  if (c.method !== "baseline" && c.dataset !== "raw")
    evidence.push(
      `策略相对理论基线的提升为 ${(score - baseline).toFixed(1)} 个百分点；需配对基线确认。`,
    );
  if (c.dataset === "shift")
    evidence.push("已完成独立的跨领域测试，可用于论文的泛化论证。");
  if (reproducibility > 80)
    evidence.push(
      "实现与数据隔离较完整。改变随机种子重复同一配置可补充稳定性证据。",
    );
  if (!diagnosis.length)
    diagnosis.push(
      "当前配置收敛稳定。建议与同设置基线对比，并更换随机种子复现；不要只报告最好的一次结果。",
    );
  const trainLoss: number[] = [],
    valLoss: number[] = [];
  for (let i = 0; i < c.epochs; i++) {
    const base = 1.8 * Math.exp(-i * (slowRate ? 0.08 : 0.25)) + 0.16;
    trainLoss.push(
      +(
        base + (badRate ? random[i % 20] * 0.7 : random[i % 20] * 0.06)
      ).toFixed(3),
    );
    valLoss.push(
      +(
        base +
        0.12 +
        (overfit && i > 6 ? (i - 6) * 0.15 : 0) +
        (badRate ? random[(i + 2) % 20] * 0.8 : 0.03)
      ).toFixed(3),
    );
  }
  return {
    score: +score.toFixed(1),
    baseline,
    generalization: +generalization.toFixed(1),
    reproducibility: +reproducibility.toFixed(1),
    cost: +task.spent.toFixed(1),
    trainLoss,
    valLoss,
    diagnosis,
    evidence,
    novelty: c.method === "baseline" ? 15 : topic.novelty,
  };
}
export function researchEvidence(s: GameState) {
  const completed = s.tasks.filter(
    (t) => t.topicId === s.topicId && t.status === "done" && t.result,
  );
  const analyzed = completed.filter((t) => s.analyzed.includes(t.id));
  const best = analyzed.reduce<TrainingTask | undefined>(
    (a, b) =>
      !a || b.result!.generalization > a.result!.generalization ? b : a,
    undefined,
  );
  // 对照实验必须匹配模型、数据、学习率与训练强度，避免把配置变化误认作方法改进。
  const hasBaseline = analyzed.some(
    (a) =>
      a.config.method === "baseline" &&
      analyzed.some(
        (b) =>
          b.config.method !== "baseline" &&
          a.config.model === b.config.model &&
          a.config.dataset === b.config.dataset &&
          a.config.epochs === b.config.epochs &&
          a.config.learningRate === b.config.learningRate &&
          a.config.batch === b.config.batch &&
          a.config.server === b.config.server &&
          a.config.seed === b.config.seed,
      ),
  );
  const hasReproduction = analyzed.some((a) =>
    analyzed.some(
      (b) =>
        a.id !== b.id &&
        a.config.seed !== b.config.seed &&
        a.config.method === b.config.method &&
        a.config.model === b.config.model &&
        a.config.dataset === b.config.dataset &&
        a.config.epochs === b.config.epochs &&
        a.config.learningRate === b.config.learningRate &&
        a.config.batch === b.config.batch &&
        a.config.server === b.config.server,
    ),
  );
  const hasGeneralization = analyzed.some(
    (t) =>
      t.config.dataset === "shift" &&
      t.config.method !== "baseline" &&
      t.result!.generalization > 70,
  );
  return {
    completed,
    analyzed,
    best,
    hasBaseline,
    hasReproduction,
    hasGeneralization,
  };
}
export function paperQuality(s: GameState) {
  const e = researchEvidence(s);
  const effort =
    Object.values(s.manuscript.effort).reduce((a, b) => a + b, 0) / 7;
  const writing = clamp(effort * 0.8 + s.profile.abilities.writing * 2);
  const completeness = clamp(
    (e.hasBaseline ? 35 : 0) +
      (e.hasReproduction ? 25 : 0) +
      (e.hasGeneralization ? 25 : 0) +
      Math.min(15, e.analyzed.length * 5),
  );
  const credibility = clamp(
    (e.best?.result?.reproducibility || 0) * 0.65 +
      Math.min(30, s.manuscript.references.length * 10) -
      s.aiIssues.filter((i) => !i.resolved).length * 20,
  );
  const novelty = e.best?.result?.novelty || 0;
  const argument = clamp(
    (s.manuscript.figures.length ? 25 : 0) +
      Math.min(30, s.manuscript.references.length * 10) +
      effort * 0.45,
  );
  const total = Math.round(
    writing * 0.2 +
      completeness * 0.25 +
      credibility * 0.2 +
      novelty * 0.2 +
      argument * 0.15,
  );
  return {
    writing: Math.round(writing),
    completeness: Math.round(completeness),
    credibility: Math.round(credibility),
    novelty: Math.round(novelty),
    argument: Math.round(argument),
    total,
  };
}
export function reviewManuscript(s: GameState, venueId: string, round: number) {
  const venue = VENUES.find((v) => v.id === venueId)!;
  const quality = paperQuality(s),
    e = researchEvidence(s),
    feedback: string[] = [];
  if (!e.hasBaseline)
    feedback.push(
      "R1：缺少与改进方案匹配的对照实验。请固定模型、数据与超参数，仅改变方法，比较基线与改进。",
    );
  if (!e.hasReproduction)
    feedback.push(
      "R2：单次随机种子不足以支持稳定性结论，请更换 seed 重复相同配置并报告差异。",
    );
  if (!e.hasGeneralization)
    feedback.push(
      "R2：对泛化能力的论证不足。请补充跨领域留出集上的实验，或收窄结论边界。",
    );
  if (quality.writing < 65)
    feedback.push(
      "R3：论文各章节需要进一步完善，明确问题、方法以及结果支持的结论。",
    );
  if (s.manuscript.references.length < 2)
    feedback.push("R1：相关工作引用不足，请补充已阅读且核实过的文献。");
  if (s.aiIssues.some((i) => !i.resolved))
    feedback.push(
      "R3：文稿或代码含未核实的 AI 内容，可能影响学术可信度，请先核查。",
    );
  if (!s.manuscript.figures.length)
    feedback.push("R2：请将已分析的实验图表加入论文，明确对应的实验设置。");
  const fit =
    venue.direction === "all" || venue.direction === s.profile.direction
      ? 0
      : -5;
  const score = quality.total + fit;
  // 随机扰动只影响临界稿件，不得绕过最低证据和诚信要求。
  const jitter = (seededValues(s.rng + round * 97, 1)[0] - 0.5) * 4;
  let status: "accept" | "minor" | "major" | "reject";
  if (quality.credibility < 35 || score < venue.threshold - 18)
    status = "reject";
  else if (feedback.length > 2 || score + jitter < venue.threshold - 4)
    status = "major";
  else if (
    feedback.length > 0 ||
    score + jitter < venue.threshold + 2 ||
    (round === 1 && venueId !== "workshop")
  )
    status = "minor";
  else status = "accept";
  if (!feedback.length)
    feedback.push(
      "评审认为研究问题清晰，实验对照充分，复现与泛化证据完整。请保留局限性与计算成本说明。",
    );
  return { score, status, feedback };
}
export function careerOptions(s: GameState) {
  return [
    {
      name: "AI 算法工程师",
      score: Math.round(
        clamp(
          s.stats.skill * 0.5 +
            s.tasks.filter((t) => t.status === "done").length * 6 +
            s.read.length * 3,
        ),
      ),
      reason: "科研能力、实验与文献积累",
    },
    {
      name: "企业研发 / 软件工程师",
      score: Math.round(clamp(s.stats.engineering * 0.8 + s.codeQuality * 0.3)),
      reason: "工程经验、代码质量与实习",
    },
    {
      name: "博士 / 科研院所",
      score: Math.round(
        clamp(
          paperQuality(s).total * 0.65 +
            s.stats.trust * 0.25 +
            s.submissions.filter((x) => x.status === "accept").length * 20,
        ),
      ),
      reason: "研究证据、导师信任与论文",
    },
    {
      name: "创业与独立开发",
      score: Math.round(
        clamp(s.stats.engineering * 0.45 + s.stats.social * 0.55),
      ),
      reason: "工程交付、合作与人际网络",
    },
    {
      name: "高校研究道路",
      score: Math.round(
        clamp(
          s.stats.skill * 0.3 +
            s.stats.reputation * 0.3 +
            paperQuality(s).total * 0.4,
        ),
      ),
      reason: "长期方向，需后续博士培养",
    },
  ];
}

export function validConfig(c: ExperimentConfig) {
  return (
    ["compact", "balanced", "large"].includes(c.model) &&
    ["raw", "clean", "shift"].includes(c.dataset) &&
    ["baseline", "adaptive", "verified"].includes(c.method) &&
    ["rtx", "a100"].includes(c.server) &&
    [0.0001, 0.001, 0.01].includes(c.learningRate) &&
    [3, 8, 16].includes(c.epochs) &&
    [16, 32, 64].includes(c.batch) &&
    Number.isInteger(c.seed) &&
    c.seed >= 0 &&
    c.seed <= 999999
  );
}
