import type { Direction, Literature, Mentor, Section, Topic } from "./types";

export const DIRECTIONS: Record<
  Direction,
  { name: string; short: string; description: string; icon: string }
> = {
  agent: {
    name: "自然语言处理与信息检索",
    short: "信息检索",
    description: "文本特征、排序学习与语料评测，在点击噪声中寻找可靠证据。",
    icon: "bot",
  },
  ml: {
    name: "机器学习与模式识别",
    short: "机器学习",
    description: "支持向量机、小型卷积网络与图像分类，研究特征和泛化能力。",
    icon: "brain",
  },
  systems: {
    name: "分布式系统与数据处理",
    short: "系统工程",
    description: "MapReduce、任务调度与数据倾斜，改善共享节点上的处理效率。",
    icon: "cpu",
  },
};
export const MENTORS: Record<
  Mentor,
  {
    name: string;
    style: string;
    lab: string;
    description: string;
    quota: number;
    color: string;
  }
> = {
  rigorous: {
    name: "沈知远",
    style: "严谨学术型",
    lab: "智能计算与可信系统实验室",
    description:
      "“先把问题问清楚，再去寻找答案。” 指导细致，重视可复现性，周周检查进展。",
    quota: 120,
    color: "#437d76",
  },
  free: {
    name: "林清禾",
    style: "自由放养型",
    lab: "机器学习与信息处理研究组",
    description:
      "“有意思的方向，值得自己走一走。” 自主空间大，需要独立规划与争取资源。",
    quota: 100,
    color: "#7d79a5",
  },
  resource: {
    name: "周予川",
    style: "项目资源型",
    lab: "计算机应用与软件工程实验室",
    description:
      "“在真实问题里，找到研究的价值。” 算力充裕，横向项目也会占据你的时间。",
    quota: 200,
    color: "#b18b54",
  },
};
export const NPCS = [
  {
    id: "mentor",
    name: "导师",
    role: "课题组负责人",
    avatar: "沈",
    color: "#d7e7e3",
    personality: "重视证据与研究价值",
    direction: "统计学习与实验方法",
    schedule: "工作日 09:00–18:00",
    task: "指导课题与基金评审",
    abilities: { coding: 86, insight: 95 },
    workHours: { start: 9, end: 18 },
  },
  {
    id: "senior",
    name: "陈一鸣",
    role: "博士师兄",
    avatar: "陈",
    color: "#e2e4f3",
    personality: "务实、乐于合作",
    direction: "搜索排序与点击日志",
    schedule: "10:00–23:00",
    task: "复现实验室检索基线",
    abilities: { coding: 94, insight: 88 },
    workHours: { start: 10, end: 23 },
  },
  {
    id: "sister",
    name: "许知意",
    role: "研三师姐",
    avatar: "许",
    color: "#fae3d8",
    personality: "细心、重视署名约定",
    direction: "图像特征与模式识别",
    schedule: "09:00–21:00",
    task: "准备论文补充实验",
    abilities: { coding: 86, insight: 92 },
    workHours: { start: 9, end: 21 },
  },
  {
    id: "peer",
    name: "方予安",
    role: "同级研究生",
    avatar: "方",
    color: "#e1eed3",
    personality: "好奇、竞争意识强",
    direction: "分布式数据处理",
    schedule: "10:00–22:00",
    task: "排队测试 MapReduce 作业",
    abilities: { coding: 85, insight: 72 },
    workHours: { start: 10, end: 22 },
  },
  {
    id: "junior",
    name: "陆星野",
    role: "准入组师弟",
    avatar: "陆",
    color: "#dae9f4",
    personality: "热情、编程经验少",
    direction: "文本分类",
    schedule: "课程后 16:00–20:00",
    task: "学习数据处理",
    abilities: { coding: 46, insight: 55 },
    workHours: { start: 16, end: 20 },
  },
  {
    id: "junior-sis",
    name: "苏小满",
    role: "准入组师妹",
    avatar: "苏",
    color: "#f4deed",
    personality: "严谨、擅长整理资料",
    direction: "数据质量评估",
    schedule: "14:00–20:00",
    task: "清洗评测数据",
    abilities: { coding: 62, insight: 74 },
    workHours: { start: 14, end: 20 },
  },
  {
    id: "admin",
    name: "吴老师",
    role: "实验室管理员",
    avatar: "吴",
    color: "#e8e5db",
    personality: "公平、按规则分配",
    direction: "计算平台维护",
    schedule: "工作日 08:00–17:00",
    task: "维护 GPU 资源队列",
    abilities: { coding: 91, insight: 70 },
    workHours: { start: 8, end: 17 },
  },
];
export const PAPERS: Literature[] = [
  {
    id: "p1",
    title: "点击日志不等于相关性：自适应重加权的排序实验",
    authors: "Y. Chen, Z. Xu, M. Lin",
    year: 2011,
    field: "agent",
    abstract:
      "用户更容易点击排在前面的结果，点击并不等于真实相关性。本文在小规模校园检索语料中，研究对点击样本自适应重加权能否改善线性排序器。",
    method:
      "以 TF-IDF 与线性排序为基线，固定查询划分，降低高曝光但低相关样本的训练权重。",
    result:
      "在虚构的 800 条查询评测中，综合相关性评分从 68 提升到 79；额外统计开销较小。",
    limitation:
      "只在同一栏目新闻中验证，尚未确认跨栏目、词汇变化与稀疏点击下的效果。",
    insight:
      "先保留匹配基线，再单独改变样本权重；需要独立语料验证改进是否稳定。",
    citations: 28,
    related: ["p2", "p3"],
    tag: "排序学习",
  },
  {
    id: "p2",
    title: "先分组，再评测：新闻检索中的近重复样本泄漏",
    authors: "S. Luo, K. Wang",
    year: 2010,
    field: "agent",
    abstract:
      "转载新闻与相近查询可能同时进入训练和测试集合，使离线分数虚高。我们研究先去重、按新闻来源分组再划分数据的实验流程。",
    method:
      "近重复检测、按来源分组、留出不同时间段查询，对照原始语料与清洗语料。",
    result: "原始集分数平均高估约 12 分，清洗后的测试结论更接近真实未知查询。",
    limitation: "严格分组减少训练样本，仍可能遗漏改写转载和隐性重复。",
    insight:
      "数据清洗与测试隔离是选题的前提，不能把重复样本带来的高分当作方法创新。",
    citations: 43,
    related: ["p1", "p7"],
    tag: "语料质量",
  },
  {
    id: "p3",
    title: "一次划分不够：检索实验中的重复抽样验证",
    authors: "J. He, L. Qiu",
    year: 2012,
    field: "agent",
    abstract:
      "小语料上的单次最好结果容易误导研究。本文使用多次随机划分、固定查询分组和配对比较来检查排序策略的可靠性。",
    method:
      "固定实验参数，仅改变随机种子重复测试，报告均值、最差表现和跨栏目测试。",
    result: "同一方案的评分可波动 5 分，严格验证可减少对偶然结果的依赖。",
    limitation: "重复计算增加实验成本，少量查询下置信区间仍较宽。",
    insight: "相同配置换 seed 的复现，与跨栏目评测，是两种不同的证据。",
    citations: 6,
    related: ["p1", "p2"],
    tag: "实验复现",
  },
  {
    id: "p4",
    title: "小样本图像分类中的特征归一化与正则化",
    authors: "Q. Zhao, H. Sun",
    year: 2011,
    field: "ml",
    abstract:
      "有限标注下，复杂分类器不一定优于简单基线。本文以 MNIST 和 CIFAR-10 的小规模子集研究特征归一化、样本重加权与正则化。",
    method:
      "对比线性分类基线和小型卷积网络，控制数据划分，扫描学习率、迭代轮数与正则强度。",
    result:
      "适度训练与合理特征处理在有限计算预算下获得稳定改善，而非依赖不断增大网络。",
    limitation: "只使用少量类别，不能将结果直接推广到所有自然图像任务。",
    insight:
      "先排查数据、学习率与正则化，再考虑扩大网络；2012 年实验机的显存尤其有限。",
    citations: 56,
    related: ["p5", "p2"],
    tag: "模式识别",
  },
  {
    id: "p5",
    title: "训练更久不等于识别更准：小型卷积网络实验",
    authors: "M. Tang, Z. Liu",
    year: 2012,
    field: "ml",
    abstract:
      "卷积网络在手写数字和小图像上的训练误差可以持续下降，但验证误差会在样本不足时回升。本文检查训练强度与泛化之间的关系。",
    method:
      "独立验证集、早停、不同随机初始化，以及旋转和噪声变化下的留出评测。",
    result: "本实验中 16 轮训练的训练损失更低，测试评分反而比 8 轮低 9 分。",
    limitation: "小型网络和有限类别尚不足以代表大规模图像识别。",
    insight:
      "不要只汇报训练损失；验证损失回升意味着过拟合，需要收窄结论或改变方案。",
    citations: 9,
    related: ["p4", "p7"],
    tag: "图像分类",
  },
  {
    id: "p6",
    title: "数据倾斜下的 MapReduce 自适应分区",
    authors: "X. Fang, R. Wu",
    year: 2011,
    field: "systems",
    abstract:
      "固定分区遇到热点键时，少数慢任务会拖延整个数据处理作业。本文在小型共享 CPU 节点上研究按采样结果调整分区。",
    method: "对照固定分区、自适应分区和带结果校验的重复执行，测试不同批大小。",
    result:
      "在清洗后的实验日志负载上，综合吞吐评分提高约 10 分；工作集过大时出现内存压力。",
    limitation: "新负载的键分布可能变化，采样与校验本身也有开销。",
    insight: "控制数据规模和节点配置，才能把方法收益与硬件差异分开。",
    citations: 31,
    related: ["p7", "p8"],
    tag: "MapReduce",
  },
  {
    id: "p7",
    title: "测量之前：共享集群中的可重复性能实验",
    authors: "R. Wu, S. Luo",
    year: 2010,
    field: "systems",
    abstract:
      "机器型号、缓存预热、输入顺序与同门的后台任务都会影响系统性能测量。本文给出小实验室可执行的公平对照流程。",
    method: "固定节点和输入，隔离训练与测试负载，重复测量并记录资源成本。",
    result: "没有控制硬件和数据顺序时，测量噪声足以反转两个方案的排名。",
    limitation: "严格测量需要预留服务器时段，无法完全消除共享节点的干扰。",
    insight: "同设置对照与多种子复现都需要真实计算预算。",
    citations: 24,
    related: ["p6", "p3"],
    tag: "系统评测",
  },
  {
    id: "p8",
    title: "几 GB 也要精打细算：实验工作集与资源预算",
    authors: "L. Qiu, X. Fang",
    year: 2011,
    field: "systems",
    abstract:
      "分类器参数、矩阵统计和批处理工作集共同占用内存。GPU 实验需考虑显存，MapReduce 则应检查 CPU 节点的主存。",
    method:
      "分别测量模型参数、激活或中间数据与批大小的资源占用，再选择实验机。",
    result:
      "大规模方案可能超过 GTX 580 3GB 版的显存，Tesla M2090 6GB 版可提供更大空间；系统实验使用对应 CPU 节点。",
    limitation: "容量模型是教学近似，不代表真实软件栈的精确硬件测量。",
    insight:
      "先算资源需求，再选择服务器；更多显存或主存并不能修复错误的实验设计。",
    citations: 37,
    related: ["p6", "p4"],
    tag: "资源预算",
  },
];
export const TOPICS: Topic[] = [
  {
    id: "agent-safe",
    direction: "agent",
    title: "点击偏差下的新闻检索排序",
    question: "点击样本重加权能否提升未知查询的检索质量？",
    hypothesis:
      "自适应样本权重可降低位置曝光偏差，但必须在独立查询与语料上验证。",
    method: "adaptive",
    risk: 25,
    novelty: 75,
    cost: 18,
    difficulty: 45,
    competition: 68,
    cycle: "1–2 周",
    kind: "稳健改进",
    sources: ["p1", "p2", "p3"],
  },
  {
    id: "agent-frontier",
    direction: "agent",
    title: "跨栏目检索的相关性验证",
    question: "一种排序策略能否迁移到词汇不同的新闻栏目？",
    hypothesis:
      "重复抽样和独立语料校验有助于识别过拟合，但严格测试会增加开销。",
    method: "verified",
    risk: 52,
    novelty: 94,
    cost: 42,
    difficulty: 77,
    competition: 89,
    cycle: "2–3 周",
    kind: "前沿探索",
    sources: ["p1", "p3"],
  },
  {
    id: "ml-efficient",
    direction: "ml",
    title: "有限样本下的图像特征学习",
    question: "有限标注与显存下，怎样训练稳定的图像分类器？",
    hypothesis:
      "特征归一化与自适应样本权重能够改善小样本分类，训练强度仍需验证。",
    method: "adaptive",
    risk: 22,
    novelty: 69,
    cost: 16,
    difficulty: 40,
    competition: 79,
    cycle: "1–2 周",
    kind: "成熟方向",
    sources: ["p4", "p5", "p2"],
  },
  {
    id: "ml-frontier",
    direction: "ml",
    title: "小型卷积网络的跨条件泛化",
    question: "数字或小图像分类器遇到旋转和噪声还能保持效果吗？",
    hypothesis:
      "独立验证选择正则强度，有望改善不同图像条件下的表现，但增加计算成本。",
    method: "verified",
    risk: 49,
    novelty: 91,
    cost: 36,
    difficulty: 73,
    competition: 87,
    cycle: "2–3 周",
    kind: "热门方向",
    sources: ["p5", "p4", "p3"],
  },
  {
    id: "sys-cache",
    direction: "systems",
    title: "数据倾斜下的自适应 MapReduce 分区",
    question: "同样的 CPU 节点，能否减少热点键造成的慢任务？",
    hypothesis:
      "按采样统计调整分区可减少尾部等待，但必须保持输入负载和节点配置一致。",
    method: "adaptive",
    risk: 24,
    novelty: 72,
    cost: 20,
    difficulty: 47,
    competition: 56,
    cycle: "1–2 周",
    kind: "工程研究",
    sources: ["p6", "p7", "p8"],
  },
  {
    id: "sys-frontier",
    direction: "systems",
    title: "变化负载下的结果一致性校验",
    question: "重复执行与结果校验能否同时保证作业可靠性和处理效率？",
    hypothesis:
      "显式校验能避免重复执行造成的错误结果，但额外开销可能抵消吞吐收益。",
    method: "verified",
    risk: 45,
    novelty: 89,
    cost: 35,
    difficulty: 74,
    competition: 30,
    cycle: "2–3 周",
    kind: "小众探索",
    sources: ["p6", "p8", "p2"],
  },
];
export const VENUES = [
  {
    id: "workshop",
    name: "青年计算研究工作坊 2012",
    short: "NCR Workshop",
    threshold: 57,
    hours: 30,
    direction: "all",
    description: "欢迎扎实的小规模研究，强调清晰的问题和可靠的实验。",
  },
  {
    id: "journal",
    name: "计算机应用研究学报",
    short: "JISR",
    threshold: 72,
    hours: 54,
    direction: "all",
    description: "注重实验完整度、可复现性与实际研究价值。",
  },
  {
    id: "topconf",
    name: "计算研究前沿论坛",
    short: "CFR 2012",
    threshold: 87,
    hours: 72,
    direction: "agent",
    description:
      "竞争激烈，偏好信息检索与学习方法创新，需要对照、复现和跨语料测试。",
  },
];
export const SECTIONS: { id: Section; name: string }[] = [
  { id: "title", name: "论文标题" },
  { id: "abstract", name: "摘要" },
  { id: "intro", name: "引言" },
  { id: "related", name: "相关工作" },
  { id: "method", name: "研究方法" },
  { id: "experiments", name: "实验与分析" },
  { id: "conclusion", name: "结论" },
];
// 服务器 ID 沿用旧存档，显示名称与容量统一按 2012 年硬件解释。
export const SERVERS = {
  rtx: {
    name: "EVGA GeForce GTX 580（3GB 版）",
    short: "GTX 580",
    capacity: 3,
    memory: 3,
    rate: 1,
  },
  a100: {
    name: "NVIDIA Tesla M2090",
    short: "Tesla M2090",
    capacity: 6,
    memory: 6,
    rate: 3,
  },
} as const;
export const RESEARCH_CONTEXT = {
  agent: {
    modelNames: {
      compact: "TF-IDF + 线性排序",
      balanced: "Ranking SVM 实验",
      large: "扩展特征排序实验",
    },
    datasetNames: {
      raw: "原始新闻与点击语料",
      clean: "去重新闻与独立查询",
      shift: "跨栏目留出语料",
    },
    metric: "检索综合评分",
    resourceLabel: "节点内存",
    unit: "节点小时",
    serverNames: {
      rtx: "双核实验节点（3GB 主存）",
      a100: "四核共享节点（6GB 主存）",
    },
  },
  ml: {
    modelNames: {
      compact: "线性分类与图像特征",
      balanced: "小型卷积网络",
      large: "扩展卷积特征实验",
    },
    datasetNames: {
      raw: "原始 MNIST / CIFAR-10 子集",
      clean: "清洗图像与独立验证集",
      shift: "旋转与噪声留出集",
    },
    metric: "分类综合评分",
    resourceLabel: "显存",
    unit: "GPUh",
    serverNames: { rtx: SERVERS.rtx.name, a100: SERVERS.a100.name },
  },
  systems: {
    modelNames: {
      compact: "小规模 MapReduce 作业",
      balanced: "标准分区与归并作业",
      large: "大工作集 MapReduce 作业",
    },
    datasetNames: {
      raw: "原始键值日志",
      clean: "清洗与去重日志",
      shift: "变化键分布留出负载",
    },
    metric: "处理效率综合评分",
    resourceLabel: "节点内存",
    unit: "节点小时",
    serverNames: {
      rtx: "双核实验节点（3GB 主存）",
      a100: "四核共享节点（6GB 主存）",
    },
  },
} as const;

export const MODELS = [
  { id: "compact", name: "小规模基线方案", memory: 0.8, duration: 3 },
  { id: "balanced", name: "标准实验方案", memory: 2.2, duration: 5 },
  { id: "large", name: "大工作集方案", memory: 4.4, duration: 8 },
] as const;
export const DATASETS = [
  { id: "raw", name: "原始数据集", note: "已有噪声与重复，分数可能虚高" },
  { id: "clean", name: "清洗数据集", note: "去重并保留独立验证集" },
  { id: "shift", name: "跨领域数据集", note: "更严格的分布外评测" },
] as const;
export const METHODS = [
  { id: "baseline", name: "基线方案", note: "保留对照，确认增益来自方法" },
  { id: "adaptive", name: "自适应策略", note: "按置信度分配有限预算" },
  {
    id: "verified",
    name: "重复抽样与校验",
    note: "严格验证结论，额外计算开销",
  },
] as const;
export const LIFE = [
  {
    id: "sleep",
    name: "好好睡一觉",
    time: 8,
    description: "让大脑重启。后台实验会继续。",
    emoji: "🌙",
  },
  {
    id: "exercise",
    name: "去操场跑步",
    time: 1,
    description: "压力 −18，健康 +7，心情 +10",
    emoji: "🏃",
  },
  {
    id: "meal",
    name: "食堂认真吃饭",
    time: 1,
    description: "精力 +14，健康 +3，花费 ¥8",
    emoji: "🍜",
  },
  {
    id: "social",
    name: "和同门聚餐",
    time: 2,
    description: "人际 +8，心情 +20，花费 ¥25",
    emoji: "🍲",
  },
  {
    id: "intern",
    name: "完成实习项目",
    time: 4,
    description: "工程 +10，收入 ¥100，消耗精力",
    emoji: "💻",
  },
  {
    id: "ta",
    name: "承担助教工作",
    time: 2,
    description: "收入 ¥80，科研能力 +2",
    emoji: "📒",
  },
  {
    id: "leisure",
    name: "给自己放个假",
    time: 3,
    description: "看电影、散步。心情 +24，压力 −20",
    emoji: "🌿",
  },
] as const;
export const DEFAULT_CONFIG = {
  name: "第一次基线实验",
  model: "compact",
  dataset: "clean",
  method: "baseline",
  learningRate: 0.001,
  epochs: 8,
  batch: 16,
  server: "rtx",
  seed: 42,
} as const;
export const END_HOUR = 28 * 24;
export const WEEKDAYS = [
  "星期一",
  "星期二",
  "星期三",
  "星期四",
  "星期五",
  "星期六",
  "星期日",
];
export function gameDate(hour: number) {
  const day = hour === END_HOUR ? 27 : Math.floor(hour / 24);
  const date = new Date(Date.UTC(2012, 8, 3 + day));
  const month = date.getUTCMonth() + 1;
  return {
    year: 2012,
    day: day + 1,
    week: Math.floor(day / 7) + 1,
    weekday: WEEKDAYS[day % 7],
    date: `${month}月${date.getUTCDate()}日`,
    month,
    clock:
      hour === END_HOUR
        ? "24:00"
        : `${String(Math.floor(hour % 24)).padStart(2, "0")}:${String(Math.round((hour % 1) * 60)).padStart(2, "0")}`,
  };
}
