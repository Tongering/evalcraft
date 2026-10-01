"use client";

import { useEffect, useMemo, useState } from "react";
import { SiteHeader } from "../components/SiteHeader";

const questions = [
  { id: "q1", level: "基础", q: "你会如何评测一个客服大模型？", structure: ["先明确用户、任务、政策与失败成本", "按任务正确性、遵循、事实性、安全、体验拆维度", "设计分层数据、确定判分方法和上线门槛", "用 bad case 归因与回归形成闭环"], trap: "直接罗列准确率、BLEU、ROUGE 等指标，没有业务目标。" },
  { id: "q2", level: "数据", q: "100 条测试数据够吗？", structure: ["先区分方向性诊断还是上线估计", "说明抽样框、关键分层和预期失败率", "报告置信区间，不把点估计当真值", "对高风险和分歧类型追加样本"], trap: "回答固定数字，或只说越多越好。" },
  { id: "q3", level: "数据", q: "如何防止评测集被污染？", structure: ["公开集用于可比性，私有集用于真实判断", "记录来源、时间与去重策略", "定期滚动新题并保留隐藏测试集", "检查异常高分并用语义变体复核"], trap: "只依赖公开 Benchmark 的 leaderboard。" },
  { id: "q4", level: "Rubric", q: "主观质量怎么做到可复现？", structure: ["把抽象质量改写为可观察证据", "每个档位给边界与锚点样例", "多人独立标注并解决分歧", "用一致性数据迭代 Rubric"], trap: "认为交给更强模型打分就自动客观。" },
  { id: "q5", level: "Judge", q: "Judge 和人工一致率 85%，能自动化吗？", structure: ["先看类别分布与混淆矩阵", "计算 Cohen’s kappa 和分维度表现", "重点看高风险漏判 FN", "再做换序、长度和跨模型偏差测试"], trap: "只报 Accuracy，忽略随机一致和关键错误。" },
  { id: "q6", level: "Judge", q: "怎么检测 position bias？", structure: ["同一个 pair 交换 A/B 位置双向运行", "统计偏好翻转的 flip rate", "逐条分析翻转是否集中于质量接近样本", "随机化顺序、双向裁决并保留人工复核"], trap: "只在提示词里要求 Judge 不要偏见。" },
  { id: "q7", level: "统计", q: "新模型总分提高 2 分，可以发布吗？", structure: ["确认评测契约和样本完全可比", "看置信区间与重复运行方差", "检查关键分层和高风险指标是否回退", "结合业务门槛，而非只看统计显著"], trap: "把任何正向变化都说成提升。" },
  { id: "q8", level: "RAG", q: "RAG 回答错了，怎么归因？", structure: ["先检查必要证据是否被召回", "再看噪声、排序与上下文截断", "证据存在时检查回答是否忠实使用", "区分检索、生成、知识库和评测器问题"], trap: "把所有错误都归为模型幻觉。" },
  { id: "q9", level: "Agent", q: "Agent 最终结果正确，为什么还可能失败？", structure: ["终态正确不代表过程合规", "检查工具选择、参数、顺序、权限和政策", "识别重复调用、偶然重试与隐私泄露", "分别报告终态、轨迹、可靠性和成本"], trap: "只检查最终文本或数据库状态。" },
  { id: "q10", level: "Agent", q: "Agent 分数波动很大，先怎么查？", structure: ["拆分模型采样、用户模拟、工具环境、Judge 四类方差", "固定可控变量并重复运行", "把 environment error 与 model error 分开", "根据方差来源决定修环境还是扩样本"], trap: "第一反应只是把 temperature 改成 0。" },
  { id: "q11", level: "工程", q: "怎么把评测接进 CI？", structure: ["选少量高信号回归集作为快速门槛", "固定模型、提示词、Judge 和数据版本", "设置关键风险硬门槛与允许波动范围", "完整评测异步运行并保存可追溯报告"], trap: "每次提交都跑全部昂贵 Benchmark。" },
  { id: "q12", level: "项目", q: "讲一个评测项目，面试官真正想听什么？", structure: ["业务背景和失败风险", "为什么这样拆维度、造数据、定标准", "遇到的分歧、偏差和错误判断", "如何验证可信并推动实际改变", "限制、反思与下一步"], trap: "按工具安装顺序讲流水账。" },
];

const caseOptions = {
  dimensions: ["任务完成", "事实忠实", "政策合规", "工具效率", "表达体验"],
  samples: ["真实流量分层", "主路径", "边界条件", "对抗请求", "历史回归"],
  graders: ["确定性规则", "人工双标", "LLM Judge", "终态检查", "轨迹断言"],
};

export default function InterviewPage() {
  const [active, setActive] = useState(0);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [show, setShow] = useState(false);
  const [selections, setSelections] = useState<Record<string, string[]>>({ dimensions: [], samples: [], graders: [] });
  const question = questions[active];
  useEffect(() => { const saved = JSON.parse(localStorage.getItem("evalcraft-interview") || "{}"); if (saved && typeof saved === "object") setRatings(saved); }, []);
  const rate = (value: number) => { const next = { ...ratings, [question.id]: value }; setRatings(next); localStorage.setItem("evalcraft-interview", JSON.stringify(next)); };
  const toggle = (group: string, value: string) => setSelections({ ...selections, [group]: selections[group].includes(value) ? selections[group].filter((item) => item !== value) : [...selections[group], value] });
  const readiness = useMemo(() => Math.round(Object.values(ratings).reduce((a, b) => a + b, 0) / (questions.length * 3) * 100), [ratings]);
  const selectQuestion = (index: number) => { setActive(index); setShow(false); window.scrollTo({ top: 150, behavior: "smooth" }); };
  return <main className="app-page interview-page"><SiteHeader current="/interview" />
    <section className="interview-hero"><div><p className="section-kicker">INTERVIEW PRESSURE TEST</p><h1>被追问三层，<br />仍然讲得清。</h1><p>先口头回答，再展开结构。按真实掌握程度评分，记录只保存在这台设备。</p></div><div className="readiness"><strong>{readiness}%</strong><span>当前准备度</span><i><b style={{ width: `${readiness}%` }} /></i><small>{Object.keys(ratings).length} / {questions.length} 已自评</small></div></section>
    <section className="interview-practice">
      <aside>{questions.map((item, index) => <button key={item.id} className={`${active === index ? "active" : ""} ${ratings[item.id] ? "rated" : ""}`} onClick={() => selectQuestion(index)}><span>{String(index + 1).padStart(2, "0")}</span><div><small>{item.level}</small><b>{item.q}</b></div><i>{ratings[item.id] ? ["", "△", "◐", "●"][ratings[item.id]] : ""}</i></button>)}</aside>
      <article className="question-stage">
        <div className="question-meta"><span>{question.level}</span><b>QUESTION {String(active + 1).padStart(2, "0")}</b></div>
        <h2>{question.q}</h2>
        <div className="thinking-space"><span>回答前先组织：</span><p>目标与风险 → 评测设计 → 可信验证 → 行动结论</p></div>
        <button className="primary-button reveal-button" onClick={() => setShow(!show)}>{show ? "收起参考结构" : "我答完了，展开结构"}</button>
        {show && <div className="answer-structure"><span>合格回答结构</span><ol>{question.structure.map((item) => <li key={item}>{item}</li>)}</ol><div><b>常见失分点</b><p>{question.trap}</p></div></div>}
        <div className="self-rating"><span>这题能否脱稿讲清？</span><div><button className={ratings[question.id] === 1 ? "active" : ""} onClick={() => rate(1)}>还不会</button><button className={ratings[question.id] === 2 ? "active" : ""} onClick={() => rate(2)}>能答但会卡</button><button className={ratings[question.id] === 3 ? "active" : ""} onClick={() => rate(3)}>能被追问</button></div></div>
        <div className="question-nav"><button disabled={active === 0} onClick={() => selectQuestion(active - 1)}>← 上一题</button><button disabled={active === questions.length - 1} onClick={() => selectQuestion(active + 1)}>下一题 →</button></div>
      </article>
    </section>

    <section className="case-builder">
      <div className="case-title"><p className="section-kicker">现场场景题</p><h2>现在给你一个需求：<br />评测“电商售后 Agent”</h2><p>在 3 分钟内选择你的设计元素，然后用右侧结构讲出来。</p></div>
      <div className="case-canvas">{Object.entries(caseOptions).map(([group, options], index) => <div key={group}><span>0{index + 1} · {group === "dimensions" ? "评测维度" : group === "samples" ? "数据覆盖" : "判分方式"}</span><div>{options.map((option) => <button key={option} className={selections[group].includes(option) ? "selected" : ""} onClick={() => toggle(group, option)}>{selections[group].includes(option) ? "✓ " : "+ "}{option}</button>)}</div></div>)}</div>
      <div className="case-output"><span>你的答题骨架</span><p><b>目标：</b>判断售后 Agent 能否在真实约束下稳定完成任务，并控制越权风险。</p><p><b>维度：</b>{selections.dimensions.join("、") || "尚未选择"}</p><p><b>数据：</b>{selections.samples.join("、") || "尚未选择"}</p><p><b>判分：</b>{selections.graders.join("、") || "尚未选择"}</p><p><b>可信度：</b>分层报告 + 重复运行 + Judge/人工校准 + bad case 复核。</p><button className="secondary-button" onClick={() => navigator.clipboard?.writeText(`目标：判断售后 Agent 能否在真实约束下稳定完成任务，并控制越权风险。\n维度：${selections.dimensions.join("、")}\n数据：${selections.samples.join("、")}\n判分：${selections.graders.join("、")}\n可信度：分层报告 + 重复运行 + Judge/人工校准 + bad case 复核。`)}>复制答题骨架</button></div>
    </section>
  </main>;
}
