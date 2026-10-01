"use client";

import { useMemo, useRef, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";

type RubricItem = { id: number; name: string; weight: number; score: number; anchor: string };
type ResultData = { experiment: string; model: string; summary: { total: number; passed: number; avg_latency_ms?: number; avg_cost_usd?: number }; failures?: Record<string, number>; records?: unknown[] };

const initialRubric: RubricItem[] = [
  { id: 1, name: "任务正确性", weight: 40, score: 4, anchor: "结论正确，完整完成用户目标" },
  { id: 2, name: "政策合规", weight: 30, score: 5, anchor: "没有越权操作，遵守全部业务约束" },
  { id: 3, name: "依据忠实度", weight: 20, score: 3, anchor: "关键结论可由提供的信息支持" },
  { id: 4, name: "表达效率", weight: 10, score: 4, anchor: "清晰直接，没有影响判断的冗余" },
];

const download = (name: string, content: string, type = "application/json") => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url; link.download = name; link.click(); URL.revokeObjectURL(url);
};

function RubricBuilder() {
  const [items, setItems] = useState(initialRubric);
  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  const weighted = totalWeight ? items.reduce((sum, item) => sum + item.score * item.weight, 0) / totalWeight : 0;
  const patch = (id: number, data: Partial<RubricItem>) => setItems(items.map((item) => item.id === id ? { ...item, ...data } : item));
  const add = () => setItems([...items, { id: Date.now(), name: "新维度", weight: 10, score: 3, anchor: "写下可观察的评分锚点" }]);
  const exportRubric = () => download("rubric.json", JSON.stringify({ version: "1.0", scale: [1, 5], items: items.map(({ score, ...item }) => item) }, null, 2));
  return <div className="tool-content">
    <div className="tool-intro"><div><p className="section-kicker">RUBRIC BUILDER</p><h2>把“感觉不错”变成可执行标准</h2><p>维度尽量互斥，锚点必须描述可观察证据。关键风险建议另设一票否决，不要被平均分掩盖。</p></div><div className="live-score"><span>当前加权分</span><strong>{weighted.toFixed(2)}</strong><small>/ 5.00</small></div></div>
    <div className="rubric-head"><span>评分维度</span><span>权重</span><span>样例评分</span><span>满分锚点</span><span /></div>
    <div className="rubric-list">{items.map((item) => <div className="rubric-row" key={item.id}>
      <input aria-label="维度名称" value={item.name} onChange={(e) => patch(item.id, { name: e.target.value })} />
      <label><b>{item.weight}%</b><input aria-label={`${item.name}权重`} type="range" min="0" max="60" value={item.weight} onChange={(e) => patch(item.id, { weight: Number(e.target.value) })} /></label>
      <div className="score-stepper"><button onClick={() => patch(item.id, { score: Math.max(1, item.score - 1) })}>−</button><b>{item.score}</b><button onClick={() => patch(item.id, { score: Math.min(5, item.score + 1) })}>+</button></div>
      <textarea aria-label={`${item.name}锚点`} rows={2} value={item.anchor} onChange={(e) => patch(item.id, { anchor: e.target.value })} />
      <button className="delete-row" aria-label={`删除${item.name}`} onClick={() => setItems(items.filter((row) => row.id !== item.id))}>×</button>
    </div>)}</div>
    <div className="tool-footer"><span className={totalWeight === 100 ? "weight-ok" : "weight-warning"}>权重合计 {totalWeight}% {totalWeight === 100 ? "✓" : "· 应调整为 100%"}</span><div><button className="secondary-button" onClick={add}>＋ 添加维度</button><button className="primary-button" onClick={exportRubric}>导出 Rubric</button></div></div>
  </div>;
}

function DatasetDesigner() {
  const [budget, setBudget] = useState(100);
  const [mix, setMix] = useState({ happy: 35, boundary: 25, adversarial: 20, regression: 20 });
  const labels: Record<string, [string, string]> = { happy: ["主路径", "验证基础可用"], boundary: ["边界", "寻找能力断点"], adversarial: ["对抗", "检查安全与遵循"], regression: ["回归", "守住已修复问题"] };
  const total = Object.values(mix).reduce((a, b) => a + b, 0);
  const set = (key: keyof typeof mix, value: number) => setMix({ ...mix, [key]: value });
  const exportCases = () => {
    const rows = Object.entries(mix).flatMap(([key, percentage]) => Array.from({ length: Math.round(budget * percentage / Math.max(total, 1)) }, (_, i) => JSON.stringify({ id: `${key}-${String(i + 1).padStart(3, "0")}`, category: key, input: "TODO", expected_behavior: "TODO", risk: key === "adversarial" ? "high" : "normal" })));
    download("cases-template.jsonl", rows.join("\n"), "application/x-ndjson");
  };
  return <div className="tool-content">
    <div className="tool-intro"><div><p className="section-kicker">DATASET DESIGNER</p><h2>先分层，再抽样</h2><p>预算不是平均撒出去。关键风险即使在线上占比低，也要有足够样本支撑判断。</p></div><label className="budget-control"><span>样本预算</span><input type="number" min="20" max="2000" value={budget} onChange={(e) => setBudget(Math.max(1, Number(e.target.value)))} /><small>条</small></label></div>
    <div className="coverage-bars">{Object.entries(mix).map(([key, value], index) => <div key={key} className={`coverage-row color-${index + 1}`}><div><b>{labels[key][0]}</b><small>{labels[key][1]}</small></div><label><input type="range" min="0" max="70" value={value} onChange={(e) => set(key as keyof typeof mix, Number(e.target.value))} /><i style={{ width: `${value / Math.max(total, 1) * 100}%` }} /></label><strong>{Math.round(budget * value / Math.max(total, 1))}</strong></div>)}</div>
    <div className="dataset-guidance"><div><span>覆盖检查</span><b>{total === 100 ? "分配完整" : `当前权重 ${total}%（会自动归一化）`}</b></div><div><span>高风险样本</span><b>{Math.round(budget * mix.adversarial / Math.max(total, 1))} 条</b></div><div><span>最低建议</span><b>每个关键分层 ≥ 20 条</b></div></div>
    <div className="tool-footer"><span>导出后补齐 input 与 expected_behavior</span><button className="primary-button" onClick={exportCases}>导出 JSONL 模板</button></div>
  </div>;
}

function JudgeCalibration() {
  const [matrix, setMatrix] = useState({ tp: 36, tn: 44, fp: 6, fn: 14 });
  const [pairs, setPairs] = useState(100);
  const [flips, setFlips] = useState(7);
  const n = Object.values(matrix).reduce((a, b) => a + b, 0);
  const accuracy = n ? (matrix.tp + matrix.tn) / n : 0;
  const humanYes = n ? (matrix.tp + matrix.fn) / n : 0;
  const judgeYes = n ? (matrix.tp + matrix.fp) / n : 0;
  const expected = humanYes * judgeYes + (1 - humanYes) * (1 - judgeYes);
  const kappa = expected < 1 ? (accuracy - expected) / (1 - expected) : 0;
  const change = (key: keyof typeof matrix, value: number) => setMatrix({ ...matrix, [key]: Math.max(0, value) });
  const kappaLabel = kappa >= .8 ? "很强" : kappa >= .6 ? "可接受" : kappa >= .4 ? "需要重写 Rubric" : "不可用";
  return <div className="tool-content">
    <div className="tool-intro"><div><p className="section-kicker">JUDGE CALIBRATION</p><h2>把 Judge 当测量仪器校准</h2><p>输入 Judge 与人工金标的混淆矩阵。Accuracy 看总体命中，Kappa 扣除随机一致；两者必须一起看。</p></div><div className="dual-score"><div><span>Accuracy</span><strong>{(accuracy * 100).toFixed(1)}%</strong></div><div><span>Cohen’s κ</span><strong>{kappa.toFixed(2)}</strong><small>{kappaLabel}</small></div></div></div>
    <div className="calibration-layout"><div className="matrix"><div className="matrix-corner">Judge ↓ / 人工 →</div><b>通过</b><b>不通过</b><span>通过</span><label className="matrix-good">TP<input type="number" value={matrix.tp} onChange={(e) => change("tp", Number(e.target.value))} /></label><label className="matrix-bad">FP<input type="number" value={matrix.fp} onChange={(e) => change("fp", Number(e.target.value))} /></label><span>不通过</span><label className="matrix-bad">FN<input type="number" value={matrix.fn} onChange={(e) => change("fn", Number(e.target.value))} /></label><label className="matrix-good">TN<input type="number" value={matrix.tn} onChange={(e) => change("tn", Number(e.target.value))} /></label></div>
      <div className="bias-check"><p className="section-kicker">POSITION BIAS</p><h3>A/B 换序测试</h3><label><span>双向评测对数</span><input type="number" min="1" value={pairs} onChange={(e) => setPairs(Math.max(1, Number(e.target.value)))} /></label><label><span>换序后结论翻转</span><input type="number" min="0" max={pairs} value={flips} onChange={(e) => setFlips(Math.max(0, Number(e.target.value)))} /></label><div className="flip-score"><strong>{(flips / pairs * 100).toFixed(1)}%</strong><span>flip rate</span></div><p>{flips / pairs > .05 ? "偏差值得调查：逐条检查翻转样本，并考虑双向运行。" : "换序稳定性较好，但仍需检查其他偏差。"}</p></div></div>
    <div className="tool-footer"><span>优先复核 FN：高风险漏判通常比误报更危险</span><button className="primary-button" onClick={() => download("judge-calibration.json", JSON.stringify({ matrix, accuracy, cohen_kappa: kappa, position_bias: { pairs, flips, flip_rate: flips / pairs } }, null, 2))}>导出校准结果</button></div>
  </div>;
}

function RagEvaluator() {
  const [values, setValues] = useState({ relevantRetrieved: 7, retrieved: 10, allRelevant: 8, supportedClaims: 6, claims: 8 });
  const metric = { precision: values.relevantRetrieved / Math.max(values.retrieved, 1), recall: values.relevantRetrieved / Math.max(values.allRelevant, 1), faithfulness: values.supportedClaims / Math.max(values.claims, 1) };
  const patch = (key: keyof typeof values, value: number) => setValues({ ...values, [key]: Math.max(0, value) });
  return <div className="tool-content">
    <div className="tool-intro"><div><p className="section-kicker">RAG EVALUATOR</p><h2>别把所有错误都叫幻觉</h2><p>先判断证据有没有被找回来，再判断回答有没有忠实使用证据。两层混在一起就无法归因。</p></div><div className="rag-formula">检索质量 <b>×</b> 生成质量</div></div>
    <div className="rag-layers"><section><span>01 · 检索层</span><h3>证据找得怎么样？</h3><label>召回的相关文档<input type="number" value={values.relevantRetrieved} onChange={(e) => patch("relevantRetrieved", Number(e.target.value))} /></label><label>总召回文档<input type="number" value={values.retrieved} onChange={(e) => patch("retrieved", Number(e.target.value))} /></label><label>全部相关文档<input type="number" value={values.allRelevant} onChange={(e) => patch("allRelevant", Number(e.target.value))} /></label><div className="rag-scores"><div><strong>{(metric.precision * 100).toFixed(0)}%</strong><span>Precision@k</span></div><div><strong>{(metric.recall * 100).toFixed(0)}%</strong><span>Recall@k</span></div></div></section>
      <section><span>02 · 生成层</span><h3>回答是否忠于证据？</h3><label>有证据支持的声明<input type="number" value={values.supportedClaims} onChange={(e) => patch("supportedClaims", Number(e.target.value))} /></label><label>回答中的全部声明<input type="number" value={values.claims} onChange={(e) => patch("claims", Number(e.target.value))} /></label><div className="rag-scores single"><div><strong>{(metric.faithfulness * 100).toFixed(0)}%</strong><span>Faithfulness</span></div></div><p className="rag-diagnosis">{metric.recall < .8 ? "优先修检索：关键证据没有进入上下文。" : metric.faithfulness < .8 ? "优先修生成：证据已召回，但回答仍引入无依据内容。" : "两层表现稳定，继续检查答案完整性与引用对应。"}</p></section></div>
    <div className="tool-footer"><span>忠实度高不代表答案完整；还要单独评测 answer relevance</span><button className="primary-button" onClick={() => download("rag-eval.json", JSON.stringify({ inputs: values, metrics: metric }, null, 2))}>导出 RAG 结果</button></div>
  </div>;
}

function ReportStudio() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [data, setData] = useState<ResultData | null>(null);
  const [error, setError] = useState("");
  const load = async (file: File) => { try { const parsed = JSON.parse(await file.text()); if (!parsed.summary || typeof parsed.summary.total !== "number") throw new Error(); setData(parsed); setError(""); } catch { setError("文件格式不符合 EvalCraft result schema。请使用项目示例结果。") } };
  const rate = data ? data.summary.passed / Math.max(data.summary.total, 1) : 0;
  const failures = data ? Object.entries(data.failures || {}) : [];
  const report = data ? `# ${data.experiment} 评测报告\n\n## 结论\n\n${data.model} 在 ${data.summary.total} 条样本中通过 ${data.summary.passed} 条，通过率 ${(rate * 100).toFixed(1)}%。${rate >= .9 ? "达到候选门槛，但仍需确认高风险分层。" : "未达到 90% 候选门槛，应优先处理主要失败类型。"}\n\n## 运行摘要\n\n- 模型：${data.model}\n- 样本数：${data.summary.total}\n- 通过率：${(rate * 100).toFixed(1)}%\n- 平均延迟：${data.summary.avg_latency_ms ?? "未记录"} ms\n- 平均成本：$${data.summary.avg_cost_usd ?? "未记录"}\n\n## 失败分布\n\n${failures.map(([key, value]) => `- ${key}: ${value}`).join("\n") || "- 未提供失败分类"}\n\n## 下一步\n\n1. 复核高风险失败，区分模型、数据、环境与判分错误。\n2. 将已确认 bad case 加入回归集。\n3. 修复后使用同一评测契约复跑，并报告置信区间。\n` : "";
  return <div className="tool-content">
    <div className="tool-intro"><div><p className="section-kicker">REPORT STUDIO</p><h2>让数据变成可行动结论</h2><p>导入 Mac 或 5060 Ti 产生的结果。报告会保留总览、失败分布和下一步，不用总分掩盖 bad case。</p></div><div className="report-upload"><button className="primary-button" onClick={() => inputRef.current?.click()}>导入 result.json</button><input ref={inputRef} hidden type="file" accept="application/json,.json" onChange={(e) => { const file = e.target.files?.[0]; if (file) load(file); }} /><button className="text-button" onClick={async () => { const sample = await fetch("/sample-result.json"); setData(await sample.json()); }}>使用示例</button></div></div>
    {error && <p className="error-text">{error}</p>}
    {!data ? <div className="report-empty"><span>RESULT.JSON</span><p>导入后自动生成结构化评测报告</p></div> : <div className="report-preview"><div className="report-summary"><span>{data.experiment}</span><h3>{data.model}</h3><strong>{(rate * 100).toFixed(1)}%</strong><small>{data.summary.passed} / {data.summary.total} 通过</small></div><div className="report-body"><h4>主要结论</h4><p>{rate >= .9 ? "总体达到候选门槛，但发布前仍需确认关键风险分层与 Judge 可信度。" : "总体未达到 90% 候选门槛，应优先处理数量最多或风险最高的失败类型。"}</p><h4>失败分布</h4>{failures.map(([key, value]) => <div className="mini-failure" key={key}><span>{key}</span><b>{value}</b></div>)}<button className="primary-button" onClick={() => download(`${data.experiment}-report.md`, report, "text/markdown")}>导出 Markdown 报告</button></div></div>}
  </div>;
}

const tools = [
  ["rubric", "Rubric", "定义评分标准"], ["dataset", "数据集", "分配覆盖预算"], ["judge", "Judge", "校准自动评分"], ["rag", "RAG", "拆分两层质量"], ["report", "报告", "导入实验结果"],
] as const;

export default function WorkbenchPage() {
  const [active, setActive] = useState<(typeof tools)[number][0]>("rubric");
  return <main className="app-page workbench-page"><SiteHeader current="/workbench" />
    <section className="workbench-hero"><div><p className="section-kicker">EVALUATION WORKBENCH</p><h1>边学，边造<br />你的评测资产。</h1></div><p>所有操作都在浏览器本地完成。导出的 JSON、JSONL 和 Markdown 可以直接进入你的作品集或实验容器。</p></section>
    <nav className="tool-tabs" aria-label="评测工具">{tools.map(([id, label, desc], index) => <button key={id} aria-selected={active === id} onClick={() => setActive(id)}><span>0{index + 1}</span><div><b>{label}</b><small>{desc}</small></div></button>)}</nav>
    <section className="workbench-shell">{active === "rubric" && <RubricBuilder />}{active === "dataset" && <DatasetDesigner />}{active === "judge" && <JudgeCalibration />}{active === "rag" && <RagEvaluator />}{active === "report" && <ReportStudio />}</section>
  </main>;
}
