"use client";

import { useState } from "react";
import { SiteHeader } from "../components/SiteHeader";

const macSteps = [
  ["01", "安装并启动 Ollama", "模型推理原生运行，才能使用 Apple Silicon。Docker 只负责评测脚本。", "brew install ollama\nollama serve"],
  ["02", "准备轻量模型", "M3 16GB 建议先从 3B/4B 开始；7B/8B 量化模型用于小批量实验。", "ollama pull qwen3:4b"],
  ["03", "验证评测器", "先用固定答案模式检查数据、判分和报告链路，不消耗模型资源。", "cd runner\npython3 run_eval.py --mode fixture --repeat 3 --output result.json"],
  ["04", "连接本地模型", "评测器使用 OpenAI-compatible 接口；保留原始响应与环境错误。", "export LLM_BASE_URL=http://localhost:11434/v1\nexport LLM_MODEL=qwen3:4b\npython3 run_eval.py --mode model --repeat 3 --output result.json"],
];

const gpuSteps = [
  ["01", "宿主机准备模型服务", "Windows 可用 Ollama；Linux 也可以使用 Ollama 或后续换成 vLLM。先确保本机能正常对话。", "ollama serve\nollama pull qwen3:8b"],
  ["02", "复制整个项目目录", "网页、案例、Rubric、评测器和容器配置一起复制，避免两台机器出现不同版本。", "llm-eval-lab/"],
  ["03", "先跑固定答案容器", "确认 Docker 挂载、结果目录和 JSON 格式都正确。", "docker compose run --rm eval-runner"],
  ["04", "切换真实模型", "把 compose.yaml 中 eval-runner 的 mode 从 fixture 改成 model；模型仍在宿主机提供服务。", "--mode model --repeat 5"],
  ["05", "运行专项评测", "Judge 校准与 RAG 分层评测均为独立容器，结果统一写入 results。", "docker compose run --rm judge-calibration\ndocker compose run --rm rag-eval"],
];

export default function SetupPage() {
  const [platform, setPlatform] = useState<"mac" | "gpu">("mac");
  const [copied, setCopied] = useState("");
  const steps = platform === "mac" ? macSteps : gpuSteps;
  const copy = (value: string, id: string) => { navigator.clipboard?.writeText(value); setCopied(id); setTimeout(() => setCopied(""), 1400); };
  return <main className="app-page setup-page"><SiteHeader current="/setup" />
    <section className="setup-hero"><p className="section-kicker">LOCAL EXPERIMENT GUIDE</p><h1>一套评测资产，<br />两台机器复用。</h1><p>Mac 负责学习、小模型验证与分析；5060 Ti 负责重复采样和更重的本地推理。两边通过 JSON 文件衔接，不需要复杂后端。</p></section>
    <section className="architecture-map"><div><span>MACBOOK M3</span><b>网页 · 课程 · 工作台</b><small>原生 Ollama / MLX</small></div><i>RESULT.JSON<br />⇄</i><div><span>RTX 5060 Ti</span><b>批量推理 · 重复采样</b><small>Docker 评测器 + 宿主机模型</small></div></section>
    <section className="setup-shell">
      <div className="platform-switch"><button className={platform === "mac" ? "active" : ""} onClick={() => setPlatform("mac")}><span>本机</span><b>MacBook M3 · 16GB</b><small>快速验证与小规模实验</small></button><button className={platform === "gpu" ? "active" : ""} onClick={() => setPlatform("gpu")}><span>实验机</span><b>RTX 5060 Ti</b><small>批量运行与可靠性实验</small></button></div>
      <div className="setup-steps">{steps.map(([number, title, body, command]) => <article key={number}><span>{number}</span><div><h2>{title}</h2><p>{body}</p><pre><code>{command}</code><button onClick={() => copy(command, number)}>{copied === number ? "已复制 ✓" : "复制"}</button></pre></div></article>)}</div>
      <div className="setup-notes"><div><span>为什么 Mac 不把模型放 Docker？</span><p>Mac 上的 Linux 容器不能像原生程序一样直接使用 Metal GPU。模型原生运行，评测器可以原生或容器运行。</p></div><div><span>为什么 5060 Ti 也拆开模型和评测器？</span><p>模型服务与评测逻辑解耦后，可以替换 Ollama、vLLM 或远程 API，而数据格式和报告保持不变。</p></div><div><span>密钥放在哪里？</span><p>只通过环境变量提供给评测进程，不写入网页、测试集、结果文件或版本库。</p></div></div>
      <section className="schema-section"><div><p className="section-kicker">DATA CONTRACT</p><h2>跨设备只约定一种结果格式</h2><p>评测器可以换，模型可以换，网页只读取稳定的字段。records 保留逐条结果，summary 用于总览。</p></div><pre>{`{
  "experiment": "tool-selection-v1",
  "model": "qwen3:8b",
  "summary": {
    "total": 30,
    "passed": 24,
    "avg_latency_ms": 1820,
    "avg_cost_usd": 0
  },
  "failures": {
    "wrong_tool": 4,
    "wrong_arguments": 2
  },
  "records": []
}`}</pre></section>
    </section>
  </main>;
}
