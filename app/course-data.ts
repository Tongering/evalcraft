export type CourseModule = {
  id: string;
  number: string;
  track: string;
  title: string;
  subtitle: string;
  time: string;
  objective: string;
  concepts: { title: string; body: string; example?: string }[];
  practice: string[];
  checks: { question: string; answer: string }[];
  deliverable: string;
  sources: { label: string; url: string }[];
};

export const courseModules: CourseModule[] = [
  {
    id: "mental-model", number: "00", track: "地基", title: "先建立正确的评测观", subtitle: "从确定性测试切换到统计性质量判断", time: "60 分钟",
    objective: "理解为什么 LLM 评测不是传统测试的换皮，并建立实验记录的最小单位。",
    concepts: [
      { title: "评测对象不是模型名", body: "真正的对象是一个版本化系统：模型、提示词、工具、检索、推理参数和运行环境。任何一项变化，都可能改变结果。", example: "evaluation_target = model + prompt + tools + params + environment" },
      { title: "输出不是确定值", body: "生成包含采样和环境噪声。一次成功只能说明这次成功；要判断可靠性，需要重复运行、分层统计和置信区间。" },
      { title: "分数服务于决策", body: "评测不是为了制造排行榜，而是回答：是否上线、哪里回归、先修什么、风险能否接受。没有决策对象的指标通常没有价值。" },
    ],
    practice: ["固定一条提示词，分别记录两组推理参数的 10 次结果", "为每条结果保存模型版本、参数、时间、延迟和原始输出", "写下这次实验要支持的唯一决策"],
    checks: [
      { question: "为什么 temperature=0 也不代表绝对确定？", answer: "服务端实现、并行计算、模型版本、工具和环境仍可能变化；评测必须记录完整上下文并用重复运行验证。" },
      { question: "模型升级后，旧分数能直接比较吗？", answer: "只有数据、提示词、判分器、环境和采样策略都保持可比时才可以；否则是两套实验。" },
    ],
    deliverable: "experiment-manifest.json：完整记录一次评测运行的版本与参数",
    sources: [{ label: "Attention Is All You Need", url: "https://arxiv.org/abs/1706.03762" }],
  },
  {
    id: "design", number: "01", track: "主线", title: "把需求拆成可测行为", subtitle: "Dimension → Signal → Metric → Decision", time: "90 分钟",
    objective: "面对一句模糊需求，能拆出互不重叠、可以观察、能够指导决策的评测维度。",
    concepts: [
      { title: "先写失败，再写指标", body: "从用户任务、业务政策和失败后果出发。先列出不可接受的行为，再选择能观察这些行为的信号。" },
      { title: "能力维度与产品维度", body: "知识、推理、指令遵循是能力维度；退款、检索、写代码是任务维度。生产评测通常把两者交叉，而不是只用一种分类。" },
      { title: "门槛指标与诊断指标", body: "门槛指标决定是否通过；诊断指标解释为什么失败。总分可以做汇总，但不能替代关键风险的一票否决。", example: "通过率 ≥ 90%，且越权率 = 0%" },
    ],
    practice: ["选择一个客服 Agent 场景，写出 5 个失败模式", "为每个失败模式指定可观察信号", "区分上线门槛和诊断指标"],
    checks: [
      { question: "语言很礼貌但违反退款政策，怎么算？", answer: "过程合规应作为关键门槛；流畅度不能抵消越权。维度之间不应简单加权掩盖高风险失败。" },
      { question: "为什么不能直接沿用通用 Benchmark？", answer: "通用基准测的是抽象能力，不包含你的用户分布、工具、政策和失败成本；它只能提供参考，不能替代业务评测。" },
    ],
    deliverable: "eval-spec.md：目标、失败模式、维度、门槛与决策表",
    sources: [{ label: "MMLU", url: "https://arxiv.org/abs/2009.03300" }, { label: "GSM8K", url: "https://arxiv.org/abs/2110.14168" }],
  },
  {
    id: "black-box", number: "01A", track: "核心补充", title: "闭源模型：把黑盒变成可测行为", subtitle: "不看参数，也能判断系统是否可靠", time: "90 分钟",
    objective: "理解闭源模型评测的边界，并把输入、输出、轨迹和风险信号组织成一套黑盒测试方案。",
    concepts: [
      { title: "先接受看不见内部", body: "闭源 API 通常不给参数、hidden state、Q/K/V 或 attention map。不要假装能解释内部机制，评测重点应转向可观察的输入—输出行为。", example: "prompt → API → response / trace" },
      { title: "设计观测信号", body: "一个‘好回答’要拆成能观察的信号：是否理解意图、是否遵守政策、是否调用正确工具、是否完成目标、是否泄露或越权。" },
      { title: "黑盒不是低级测试", body: "它和传统接口测试一样，关注用户实际拿到的效果。内部不可见反而要求测试集、Rubric、轨迹和失败归因更扎实。" },
    ],
    practice: ["选一个闭源客服 Agent，写出正常、边界、异常、对抗、多轮五类 case", "为每条 case 定义输入、期望行为、可观测信号和风险", "把‘答案对但工具路径错’加入失败案例"],
    checks: [
      { question: "闭源模型不能看 attention，那还怎么测？", answer: "测黑盒行为：任务是否完成、规则是否遵守、工具调用是否正确、输出是否有依据、失败是否稳定，并保留可复现的上下文。" },
      { question: "为什么不能只看最终文本？", answer: "Agent 的错误可能发生在工具选择、参数、顺序或越权上；最终文本漂亮不代表过程合规。" },
    ],
    deliverable: "black-box-eval-spec.md：输入、期望行为、观察信号、风险与归因",
    sources: [{ label: "Inspect AI", url: "https://inspect.aisi.org.uk/" }, { label: "τ-bench", url: "https://arxiv.org/abs/2406.12045" }],
  },
  {
    id: "automation", number: "01B", track: "核心补充", title: "把业务测试集自动跑起来", subtitle: "规则 + 结构化输出 + 轨迹 + Judge + 人工", time: "120 分钟",
    objective: "知道哪些判断应该用确定性规则，哪些适合 LLM Judge，以及如何让自动化结果可审计。",
    concepts: [
      { title: "Case 先结构化", body: "每条业务样本至少包含 input、context、expected、禁止行为和风险等级。结构化后才能批量运行、断言和回归。", example: "input + context + expected + forbidden + risk" },
      { title: "四种评分器组合", body: "固定关键词、格式、工具名和参数用规则；动作和终态用结构化断言；开放式表达用 Judge；高风险和分歧样本保留人工复核。" },
      { title: "自动化不是无人监督", body: "工业流程通常是 10000 条自动跑 → 筛异常 → 人工复核 → 归因 → 把新 bad case 加回回归集。评分器本身也要被校准。" },
    ],
    practice: ["把一条退款业务写成 JSONL case", "分别实现必含信息、禁止信息和工具轨迹检查", "让 Judge 输出 JSON，再与人工金标比较并记录分歧"],
    checks: [
      { question: "什么时候优先用规则？", answer: "当信号是明确、确定、可枚举的，例如工具名、参数字段、状态码、必须出现或禁止出现的内容。" },
      { question: "LLM Judge 可以完全替代人工吗？", answer: "不能。语言有灰色区域，Judge 自身会错和产生偏好；应校准、监控、抽检，并把高风险分歧交给人。" },
    ],
    deliverable: "business-case.jsonl + scorer-report.md：自动评分、人工抽检与失败归因",
    sources: [{ label: "MT-Bench / LLM-as-a-Judge", url: "https://arxiv.org/abs/2306.05685" }, { label: "Judging the Judges", url: "https://arxiv.org/abs/2406.07791" }],
  },
  {
    id: "dataset", number: "02", track: "主线", title: "构造有解释力的数据集", subtitle: "覆盖、分层、难度与污染", time: "120 分钟",
    objective: "设计一套小而精的评测集，并能回答样本从哪里来、覆盖什么、为什么足够。",
    concepts: [
      { title: "先建抽样框", body: "把真实请求按意图、难度、风险、语言、工具路径等维度分层，再决定每层采多少。随机抽样不能自动保证关键风险被覆盖。" },
      { title: "四类样本", body: "主路径验证基础可用性；边界样本寻找能力断点；对抗样本检查安全与遵循；回归样本守住已经修复的缺陷。" },
      { title: "避免数据污染", body: "公开 Benchmark 可能进入训练数据。生产评测要保留私有测试集、定期滚动更新，并把生成数据交给人工审核。" },
    ],
    practice: ["用工作台给 50 条样本分配覆盖预算", "每条样本至少标注意图、风险、难度和期望行为", "从历史 bad case 生成 10 条语义变体"],
    checks: [
      { question: "100 条数据到底够不够？", answer: "取决于用途、失败率和分层。方向性诊断可以先用；严格上线门槛通常要更多数据和不确定性分析。" },
      { question: "模型生成测试数据可靠吗？", answer: "适合扩展表达和边界，但会继承模型盲区。需要人工审核、来源标记、去重和真实流量校准。" },
    ],
    deliverable: "cases.jsonl + dataset-card.md：样本、标签、来源、限制和版本",
    sources: [{ label: "SWE-bench", url: "https://arxiv.org/abs/2310.06770" }],
  },
  {
    id: "rubric", number: "03", track: "主线", title: "把主观判断写成 Rubric", subtitle: "可观察、互斥、带锚点", time: "100 分钟",
    objective: "写出人工和模型 Judge 都能稳定执行的评分标准。",
    concepts: [
      { title: "描述可观察证据", body: "不要写“回答质量高”。要写“结论回答了问题、关键事实有依据、没有引入材料外信息”。" },
      { title: "给每档锚点", body: "评分档位需要边界和例子。先写 1 分与满分，再定义中间状态；无法一致区分的档位应合并。" },
      { title: "关键错误一票否决", body: "隐私泄露、越权调用、伪造依据等高风险失败不能被其他维度的高分抵消。" },
    ],
    practice: ["在工作台创建 3–5 个评分维度", "为每个维度写 1/3/5 分锚点", "让两个人独立标 20 条并记录分歧"],
    checks: [
      { question: "Rubric 越详细越好吗？", answer: "不是。过度细分会增加标注负担和维度重叠。标准应覆盖决策所需的最小集合，并通过一致性验证。" },
      { question: "什么时候用规则，什么时候用 Judge？", answer: "格式、工具名、参数等确定性信号优先用规则；开放式质量再用人工或经校准的 Judge。" },
    ],
    deliverable: "rubric.json + 20 条双人标注样本",
    sources: [{ label: "MT-Bench / LLM-as-a-Judge", url: "https://arxiv.org/abs/2306.05685" }],
  },
  {
    id: "judge", number: "04", track: "专业分界", title: "校准 LLM-as-a-Judge", subtitle: "一致性、偏差与版本契约", time: "150 分钟",
    objective: "不把 Judge 当答案，而是把它当一个需要验证、监控和版本化的测量仪器。",
    concepts: [
      { title: "建立人工金标", body: "先由多人独立标注，再解决分歧。Judge 只在与金标一致性可接受的任务范围内自动化。" },
      { title: "不要只报 Accuracy", body: "类别失衡时准确率会虚高。至少同时看混淆矩阵和 Cohen’s kappa，并逐类分析系统性错误。" },
      { title: "主动测偏差", body: "交换 A/B 顺序测 position bias；控制长度测 verbosity bias；避免用同家族模型生成并裁判；记录 flip rate。" },
      { title: "版本就是契约", body: "Judge 模型、提示词模板和 Rubric 任一变化，都应创建新版本并重新校准。", example: "judge_contract = model_id + rubric_version + prompt_hash" },
    ],
    practice: ["准备 50 条人工金标", "在工作台计算准确率与 kappa", "每个 pair 正反运行并检查 flip rate", "抽查所有高风险分歧"],
    checks: [
      { question: "Judge 与人工一致率 85% 可以上线吗？", answer: "信息不足。还要看 kappa、各类错误、高风险漏判、换序稳定性和样本是否代表线上分布。" },
      { question: "提示 Judge 不要有偏见就够了吗？", answer: "不够。需要实验性检测与流程缓解，例如换序双跑、随机化、不同 Judge 交叉验证和人工复核。" },
    ],
    deliverable: "judge-card.md：适用范围、kappa、flip rate、已知限制和版本",
    sources: [{ label: "Judging the Judges: Position Bias", url: "https://arxiv.org/abs/2406.07791" }, { label: "MT-Bench", url: "https://arxiv.org/abs/2306.05685" }],
  },
  {
    id: "rag", number: "05", track: "拓宽", title: "拆开 RAG 的两层质量", subtitle: "检索失败 ≠ 生成失败", time: "120 分钟",
    objective: "分别判断检索层和生成层，避免把所有错误归咎于模型幻觉。",
    concepts: [
      { title: "检索层", body: "关注需要的证据是否被召回、无关内容有多少、排序是否合理。常用信号包括 Recall@k、Precision@k、MRR 和 nDCG。" },
      { title: "生成层", body: "关注回答是否由检索证据支持、是否完整回答问题、引用是否对应。忠实度与答案正确性不是同一件事。" },
      { title: "归因矩阵", body: "证据没召回是检索问题；证据召回但没使用是生成问题；证据本身错误是知识库问题。" },
    ],
    practice: ["为 10 个问题标注必要证据", "在工作台分别计算检索召回和回答忠实度", "给每个失败分配检索/生成/知识库归因"],
    checks: [
      { question: "答案正确但没有证据支持，算通过吗？", answer: "取决于产品要求。对需要可追溯性的场景，正确但无依据仍是忠实度失败。" },
      { question: "Recall@k 很高为什么回答仍差？", answer: "检索内容可能噪声多、排序差、上下文过长，或生成器没有正确使用证据；需要分层分析。" },
    ],
    deliverable: "rag-eval.jsonl + 检索/生成二维归因报告",
    sources: [{ label: "RAGAS", url: "https://arxiv.org/abs/2309.15217" }],
  },
  {
    id: "agent", number: "06", track: "主攻", title: "评测 Agent 的完整轨迹", subtitle: "终态、过程、政策与可靠性", time: "180 分钟",
    objective: "从单次工具选择扩展到多轮、多步、带环境状态的 Agent 评测。",
    concepts: [
      { title: "四层判定", body: "工具是否选对；参数是否正确；步骤与政策是否合规；最终环境状态是否达到目标。四层要分别记录。" },
      { title: "环境也是被测系统", body: "超时、接口波动、模拟用户变化会污染分数。环境失败要与模型失败分开，保留完整 trace 才能复现。" },
      { title: "可靠性看 pass^k", body: "pass@k 表示多次尝试至少一次成功；pass^k 表示连续 k 次全部成功。生产 Agent 更关心后者。" },
      { title: "成本与效率", body: "成功但调用 20 次工具的 Agent 可能不可用。报告步骤数、token、延迟、重试和无效调用。" },
    ],
    practice: ["运行项目自带的 6 条工具调用案例", "新增拒绝调用与参数边界案例", "重复运行同一任务并计算 pass^k", "检查答案正确但轨迹违规的样本"],
    checks: [
      { question: "最终数据库状态正确，任务就成功了吗？", answer: "不一定。越权、错误工具、泄露信息或依赖偶然重试，都可能得到正确终态但不能上线。" },
      { question: "Agent 分数不稳定先查什么？", answer: "先拆模型采样、模拟用户、工具环境和判分器四类方差来源，再决定增加样本还是修环境。" },
    ],
    deliverable: "trajectory-eval：测试集、执行器、trace、pass^k 与 bad case 报告",
    sources: [{ label: "τ-bench", url: "https://arxiv.org/abs/2406.12045" }, { label: "BFCL", url: "https://gorilla.cs.berkeley.edu/leaderboard" }],
  },
  {
    id: "production", number: "07", track: "收口", title: "做成回归系统与面试故事", subtitle: "成本、CI、报告与三层追问", time: "150 分钟",
    objective: "把一次性实验变成可重复的质量门槛，并把关键判断讲成完整项目。",
    concepts: [
      { title: "基线与门槛", body: "保存基线版本；新版本同时比较总体、关键分层和风险指标。置信区间重叠时，不要把噪声说成提升。" },
      { title: "回归集持续生长", body: "线上 bad case 经过归因和脱敏后进入回归集；修复必须带测试，数据集需要版本和变更说明。" },
      { title: "项目叙事", body: "按背景—风险—设计—困难—验证—结果—反思讲。重点是你的判断与取舍，不是工具清单。" },
    ],
    practice: ["为关键指标写一条 CI 门槛", "用工作台导出实验报告", "完成 12 道面试追问", "把项目讲述压缩为 3 分钟与 30 分钟两个版本"],
    checks: [
      { question: "总分提升 2 分，可以发布吗？", answer: "不能只看总分。要看不确定性、关键分层和高风险指标是否回退，并确认评测契约未变化。" },
      { question: "面试讲工具还是讲方法？", answer: "工具一两句交代即可。核心是为什么这样定义问题、如何验证结果可信、发现了什么、推动了什么改变。" },
    ],
    deliverable: "作品集：可运行代码 + 数据卡 + Judge 卡 + 报告 + 项目讲述",
    sources: [{ label: "OpenAI HumanEval", url: "https://github.com/openai/human-eval" }, { label: "Inspect AI", url: "https://inspect.aisi.org.uk/" }],
  },
];
