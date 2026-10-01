"use client";

import { useMemo, useRef, useState } from "react";
import { SiteHeader } from "./components/SiteHeader";

type Stage = {
  id: string;
  eyebrow: string;
  title: string;
  duration: string;
  goal: string;
  deliverable: string;
  questions: string[];
};

const stages: Stage[] = [
  {
    id: "foundation",
    eyebrow: "阶段 00",
    title: "搭起评测地基",
    duration: "2–3 天",
    goal: "把模型输入、输出、参数、延迟与成本保存成可复现记录。",
    deliverable: "一个可重复运行的 JSONL 评测脚本",
    questions: ["同一输入为什么会得到不同答案？", "哪些参数必须固定？", "一次评测记录至少保存什么？"],
  },
  {
    id: "loop",
    eyebrow: "阶段 01",
    title: "完成第一次闭环",
    duration: "5–7 天",
    goal: "从真实需求出发，完成维度、数据、标准、执行和结论。",
    deliverable: "50–100 条样本 + 第一份评测报告",
    questions: ["为什么是这些维度？", "数据覆盖如何证明？", "结论能推动什么改变？"],
  },
  {
    id: "judge",
    eyebrow: "阶段 02",
    title: "验证 Judge 可信度",
    duration: "4–6 天",
    goal: "用人工标注、换序测试和一致性指标证明自动评分可用。",
    deliverable: "Judge 校准报告 + 偏差实验",
    questions: ["Judge 与人工不一致怎么办？", "位置偏差怎么测？", "为什么不能只报一致率？"],
  },
  {
    id: "agent",
    eyebrow: "阶段 03",
    title: "进入 Agent 轨迹",
    duration: "7–10 天",
    goal: "同时判断最终状态、工具选择、参数、顺序和过程合规。",
    deliverable: "工具调用评测集 + 轨迹分析器",
    questions: ["答案对但路径错，算成功吗？", "环境失败和模型失败怎么分？", "如何测重复运行的可靠性？"],
  },
  {
    id: "interview",
    eyebrow: "阶段 04",
    title: "讲成面试故事",
    duration: "3–5 天",
    goal: "把取舍、失败、校准与业务影响讲成能被追问三层的项目。",
    deliverable: "30 分钟项目讲述 + 场景题答题框架",
    questions: ["最大的判断失误是什么？", "如果样本预算减半怎么办？", "上线门槛如何定？"],
  },
];

const loopSteps = [
  ["01", "定义需求", "谁用模型，失败意味着什么"],
  ["02", "拆解维度", "把‘好’变成可观察行为"],
  ["03", "构造数据", "覆盖主路径、边界与对抗样本"],
  ["04", "制定标准", "规则、Rubric、人工或 Judge"],
  ["05", "执行评测", "固定版本、参数、环境和随机性"],
  ["06", "归因闭环", "定位失败，推动产品或模型改变"],
];

const interviewCards = [
  {
    q: "100 条数据够吗？",
    a: "先问目标。做方向性诊断，100 条分层样本可能够；做上线门槛，不够。我要说明抽样框、各层占比、置信区间，并对关键失败类型追加样本。",
    follow: "如果只能标 30 条，你怎么选？",
  },
  {
    q: "Judge 准确率 85%，能上线吗？",
    a: "不能只看准确率。我要看类别不平衡、Cohen’s kappa、分维度混淆矩阵，还要做 A/B 换序与典型分歧复核。Judge 只能在被校准过的任务分布内使用。",
    follow: "人工标注本身不一致怎么办？",
  },
  {
    q: "Agent 最终结果正确，为什么还要看轨迹？",
    a: "正确终态可能来自越权、错误工具、重复调用或偶然重试。生产评测要分别定义终态成功、过程合规和资源效率，否则无法预测真实风险。",
    follow: "过程与结果冲突时如何计分？",
  },
];

const sampleImport = {
  experiment: "tool-use-baseline-v1",
  model: "local-model-7b-q4",
  summary: { total: 80, passed: 61, avg_latency_ms: 1840, avg_cost_usd: 0 },
  failures: { wrong_tool: 7, wrong_arguments: 5, policy_violation: 3, environment: 4 },
};

function ReliabilityLab() {
  const [p, setP] = useState(0.9);
  const [k, setK] = useState(8);
  const passAtK = 1 - Math.pow(1 - p, k);
  const passPowK = Math.pow(p, k);
  return (
    <section className="lab-panel" aria-labelledby="reliability-title">
      <div className="lab-copy">
        <p className="section-kicker">交互实验 01</p>
        <h2 id="reliability-title">“偶尔能做成”不等于可靠</h2>
        <p>拖动单次成功率与重复次数，比较“至少成功一次”和“每次都成功”。</p>
        <label>
          <span>单次成功率 <b>{Math.round(p * 100)}%</b></span>
          <input type="range" min="0.5" max="0.99" step="0.01" value={p} onChange={(e) => setP(Number(e.target.value))} />
        </label>
        <label>
          <span>重复次数 <b>{k} 次</b></span>
          <input type="range" min="1" max="12" step="1" value={k} onChange={(e) => setK(Number(e.target.value))} />
        </label>
      </div>
      <div className="metric-comparison">
        <div className="metric-block optimistic">
          <span>pass@{k}</span>
          <strong>{(passAtK * 100).toFixed(1)}%</strong>
          <small>至少一次成功</small>
          <div className="meter"><i style={{ width: `${passAtK * 100}%` }} /></div>
        </div>
        <div className="metric-block strict">
          <span>pass^{k}</span>
          <strong>{(passPowK * 100).toFixed(1)}%</strong>
          <small>连续每次都成功</small>
          <div className="meter"><i style={{ width: `${passPowK * 100}%` }} /></div>
        </div>
        <p className="lab-insight">单次成功率看着不错，但重复 {k} 次全部成功的概率只有 <b>{(passPowK * 100).toFixed(1)}%</b>。</p>
      </div>
    </section>
  );
}

function JudgeLab() {
  const [swapped, setSwapped] = useState(false);
  const [choice, setChoice] = useState<"A" | "B">("A");
  const answerA = { name: "回答 A", text: "先确认订单状态，再调用退款工具；若已发货则解释限制并转人工。", style: "direct" };
  const answerB = { name: "回答 B", text: "我非常理解您的心情。我们始终重视每位用户的体验，我将立即为您办理退款。", style: "verbose" };
  const shown = swapped ? [answerB, answerA] : [answerA, answerB];
  const preferred = choice === "A" ? shown[0] : shown[1];
  return (
    <section className="judge-lab" aria-labelledby="judge-title">
      <div className="section-heading">
        <div><p className="section-kicker">交互实验 02</p><h2 id="judge-title">亲手发现 Judge 偏差</h2></div>
        <button className="swap-button" onClick={() => { setSwapped(!swapped); setChoice("A"); }}>↔ 交换答案位置</button>
      </div>
      <div className="answers-grid">
        {shown.map((answer, index) => {
          const letter = index === 0 ? "A" : "B";
          return (
            <button key={`${answer.name}-${index}`} onClick={() => setChoice(letter)} className={`answer-card ${choice === letter ? "selected" : ""}`}>
              <span className="answer-label">位置 {letter}</span>
              <p>{answer.text}</p>
              <small>{answer.style === "direct" ? "遵守业务规则 · 可执行" : "语言流畅 · 但可能越权"}</small>
            </button>
          );
        })}
      </div>
      <div className="judge-result">
        <span>当前选择：<b>{choice}</b></span>
        <p>你选中的是“{preferred.name}”。交换后若偏好跟着位置变化，就出现了 position bias；评测时应双向运行并记录 flip rate。</p>
      </div>
    </section>
  );
}

function TraceLab() {
  const [selected, setSelected] = useState(2);
  const events = [
    ["用户", "申请退回已发货订单", "neutral"],
    ["Agent", "查询订单状态", "good"],
    ["工具", "get_order_status · delivered", "good"],
    ["Agent", "直接调用 refund_order", "bad"],
    ["工具", "退款成功", "warn"],
  ];
  const details = [
    "任务目标：处理退款请求，同时遵守业务政策。",
    "工具选择正确，参数包含订单号；延迟 420ms。",
    "环境返回 delivered。此状态不允许自动退款，应解释并转人工。",
    "关键失败：工具本身调用成功，但违反政策。最终结果不能算合格。",
    "数据库终态已改变。若只检查结果，会把越权操作误判为成功。",
  ];
  return (
    <section className="trace-section" aria-labelledby="trace-title">
      <div className="trace-copy">
        <p className="section-kicker">交互实验 03</p>
        <h2 id="trace-title">结果正确，路径可能危险</h2>
        <p>点击轨迹节点，观察“工具成功”为什么不等于“任务合格”。</p>
        <div className="trace-detail"><span>节点 {selected + 1}</span><p>{details[selected]}</p></div>
      </div>
      <div className="trace-line" role="list" aria-label="Agent 运行轨迹">
        {events.map(([who, text, state], i) => (
          <button key={text} role="listitem" className={`trace-event ${state} ${selected === i ? "active" : ""}`} onClick={() => setSelected(i)}>
            <span>{String(i + 1).padStart(2, "0")}</span><b>{who}</b><p>{text}</p>
          </button>
        ))}
      </div>
    </section>
  );
}

function ResultImporter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<typeof sampleImport | null>(null);
  const [error, setError] = useState("");
  const load = (raw: string) => {
    try {
      const parsed = JSON.parse(raw);
      if (!parsed.summary || typeof parsed.summary.total !== "number") throw new Error("missing summary");
      setData(parsed); setError("");
    } catch {
      setError("无法识别：需要包含 summary.total、summary.passed 等字段。")
    }
  };
  const failureEntries = useMemo(() => data ? Object.entries(data.failures || {}) : [], [data]);
  const maxFailure = Math.max(1, ...failureEntries.map(([, v]) => Number(v)));
  return (
    <section className="import-section" aria-labelledby="import-title">
      <div>
        <p className="section-kicker">实验桥梁</p>
        <h2 id="import-title">把真实实验结果带回网页</h2>
        <p>Mac 或 5060 Ti 实验机只需输出同一种 JSON；网页负责分析和展示。</p>
        <div className="import-actions">
          <button className="primary-button" onClick={() => setData(sampleImport)}>载入示例结果</button>
          <button className="secondary-button" onClick={() => inputRef.current?.click()}>导入 JSON</button>
          <input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) file.text().then(load); }} />
        </div>
        {error && <p className="error-text">{error}</p>}
      </div>
      <div className={`result-board ${data ? "loaded" : "empty"}`}>
        {!data ? <><span className="empty-mark">＋</span><p>等待实验结果</p><small>数据只在当前浏览器中读取</small></> : <>
          <div className="result-title"><span>{data.experiment}</span><small>{data.model}</small></div>
          <div className="result-stats">
            <div><strong>{Math.round(data.summary.passed / data.summary.total * 100)}%</strong><span>任务通过率</span></div>
            <div><strong>{data.summary.avg_latency_ms}</strong><span>平均延迟 ms</span></div>
            <div><strong>{data.summary.total}</strong><span>样本数</span></div>
          </div>
          <div className="failure-list">
            {failureEntries.map(([key, value]) => <div key={key}><span>{key.replaceAll("_", " ")}</span><i><b style={{ width: `${Number(value) / maxFailure * 100}%` }} /></i><em>{String(value)}</em></div>)}
          </div>
        </>}
      </div>
    </section>
  );
}

export default function Home() {
  const [activeStage, setActiveStage] = useState(stages[1]);
  const [openInterview, setOpenInterview] = useState(0);
  return (
    <main>
      <SiteHeader current="/" />

      <section id="top" className="hero">
        <div className="hero-copy">
          <p className="hero-kicker">LLM EVALUATION · INTERACTIVE FIELD GUIDE</p>
          <h1>从“会测模型”<br />到<span>能守住质量。</span></h1>
          <p className="hero-lede">一条以作品为出口的 LLM 评测路线。不是背术语，而是亲手完成数据、标准、Judge、Agent 轨迹与可信结论。</p>
          <div className="hero-actions"><a className="primary-button" href="/learn">开始完整课程</a><a className="text-link" href="/workbench">打开评测工作台 →</a></div>
        </div>
        <div className="hero-system" aria-label="评测系统示意">
          <div className="system-orbit orbit-one"><span>数据</span><span>标准</span><span>执行</span><span>归因</span></div>
          <div className="system-orbit orbit-two" />
          <div className="system-core"><small>EVAL</small><strong>闭环</strong><em>可复现</em></div>
          <div className="system-note note-a">INPUT<br /><b>100 cases</b></div>
          <div className="system-note note-b">CONFIDENCE<br /><b>validated</b></div>
        </div>
      </section>

      <section className="principle-strip">
        <p>面试水平 ≠ 学完知识体系</p><strong>能在一个真实场景里被追问三层不倒</strong><span>项目 → 追问 → 补课 → 再验证</span>
      </section>

      <section id="roadmap" className="roadmap section-shell">
        <div className="section-heading"><div><p className="section-kicker">你的训练主线</p><h2>五个阶段，五件可展示的东西</h2></div><p>选择阶段查看目标与面试追问。</p></div>
        <div className="roadmap-layout">
          <div className="stage-list" role="tablist">
            {stages.map((stage) => <button key={stage.id} role="tab" aria-selected={activeStage.id === stage.id} onClick={() => setActiveStage(stage)} className={activeStage.id === stage.id ? "active" : ""}><span>{stage.eyebrow}</span><b>{stage.title}</b><em>{stage.duration}</em></button>)}
          </div>
          <article className="stage-detail">
            <span className="detail-index">{activeStage.eyebrow.split(" ")[1]}</span>
            <p className="section-kicker">当前任务</p><h3>{activeStage.title}</h3><p className="detail-goal">{activeStage.goal}</p>
            <div className="deliverable"><span>必须产出</span><strong>{activeStage.deliverable}</strong></div>
            <div className="question-list"><span>面试官会问</span>{activeStage.questions.map((q, i) => <p key={q}><i>{i + 1}</i>{q}</p>)}</div>
          </article>
        </div>
      </section>

      <section className="loop-section">
        <div className="section-shell"><div className="section-heading"><div><p className="section-kicker">核心方法</p><h2>任何评测，都要走完这条闭环</h2></div><p>分数不是终点，改变才是。</p></div>
          <div className="loop-grid">{loopSteps.map(([n, title, desc]) => <div key={n} className="loop-card"><span>{n}</span><b>{title}</b><p>{desc}</p></div>)}</div>
        </div>
      </section>

      <div id="labs" className="section-shell labs-stack"><ReliabilityLab /><JudgeLab /><TraceLab /><ResultImporter /></div>

      <section id="interview" className="interview-section section-shell">
        <div className="section-heading"><div><p className="section-kicker">压力测试</p><h2>别背答案，练判断结构</h2></div><p>点击问题，先自己回答，再看参考结构。</p></div>
        <div className="interview-grid">{interviewCards.map((card, i) => <article key={card.q} className={openInterview === i ? "open" : ""}><button onClick={() => setOpenInterview(i)}><span>Q{i + 1}</span><b>{card.q}</b><i>{openInterview === i ? "−" : "+"}</i></button>{openInterview === i && <div><p>{card.a}</p><small>继续追问：{card.follow}</small></div>}</article>)}</div>
      </section>

      <section className="sources-section section-shell">
        <p className="section-kicker">一手资料</p><h2>从定义出发，不从二手结论出发</h2>
        <div className="source-links">
          <a href="https://arxiv.org/abs/2406.12045" target="_blank" rel="noreferrer"><span>τ-bench</span><b>Agent 交互与 pass^k</b><em>论文 ↗</em></a>
          <a href="https://arxiv.org/abs/2306.05685" target="_blank" rel="noreferrer"><span>MT-Bench</span><b>LLM-as-a-Judge 与偏差</b><em>论文 ↗</em></a>
          <a href="https://arxiv.org/abs/2406.07791" target="_blank" rel="noreferrer"><span>Judge Bias</span><b>位置偏差系统研究</b><em>论文 ↗</em></a>
          <a href="https://github.com/openai/human-eval" target="_blank" rel="noreferrer"><span>HumanEval</span><b>代码生成与 pass@k</b><em>官方仓库 ↗</em></a>
        </div>
      </section>

      <footer><div className="brand"><span>∆</span> EVALCRAFT</div><p>本地优先 · 评测结果由你掌控</p><a href="#top">回到顶部 ↑</a></footer>
    </main>
  );
}
