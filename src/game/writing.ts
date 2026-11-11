import { PAPERS, TOPICS } from "./data";
import { researchEvidence } from "./research";
import type { GameState, Section } from "./types";

export function suggestedSection(s: GameState, section: Section) {
  const topic = TOPICS.find((t) => t.id === s.topicId),
    e = researchEvidence(s),
    best = e.best?.result;
  const body: Record<Section, string> = {
    title: topic?.title || "一个尚待回答的研究问题",
    abstract: `本研究关注${topic?.question || "资源受限的科研问题"}。我们检验以下假设：${topic?.hypothesis || "待确定"}。通过${e.analyzed.length}组实验，${best ? `观测到最高泛化评分 ${best.generalization}%` : "仍需补充实验验证"}。本文区分观测证据与推测，并报告计算预算及研究局限。`,
    intro: `在有限的时间与计算资源下，${topic?.question || "如何提出可验证的问题"}具有实际意义。现有方法仍面临数据污染、实验稳定性与泛化不足。我们的目标是用可解释、可复现的对照回答这一问题。`,
    related: `我们比较了${s.manuscript.references.map((id) => PAPERS.find((p) => p.id === id)?.title).join("；") || "待补充的相关文献"}。已有研究启发了方法设计，但其数据范围和计算假设存在边界，本研究尝试进一步验证。`,
    method: `研究假设：${topic?.hypothesis || "待确定"}。我们固定模型、数据与超参数，以基线为对照，逐项改变策略，并保持验证集独立。每组实验记录模型、种子、显存与计算成本。`,
    experiments: `目前完成 ${e.analyzed.length} 组已分析实验。${best ? `最佳观测评分 ${best.score}%，泛化 ${best.generalization}%，复现可信度 ${best.reproducibility}%。` : "尚无充分结果。"}匹配基线：${e.hasBaseline ? "已有" : "仍缺少"}；多种子复现：${e.hasReproduction ? "已有" : "仍缺少"}；跨领域测试：${e.hasGeneralization ? "已有" : "仍缺少"}。失败实验同样保留，避免只汇报最优结果。`,
    conclusion: `本文探索了${topic?.title || "待确定的问题"}。结果${best && best.generalization > 70 ? "初步支持研究假设" : "尚不足以完全支持假设"}，结论仅限于当前数据与设置。未来需要更多样本、独立复现和更广泛的预算分析。`,
  };
  return body[section];
}
