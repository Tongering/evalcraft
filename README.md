# EvalCraft · LLM 评测学习实验室


面向测试开发的 LLM 评测入门实践：把「测试 + LLM」的结合点拆成可动手的模块。

本地优先、项目驱动。目标不是记住概念，而是完成一套能运行、能解释、经得起追问的评测项目。

> **零配置启动**：本仓库已针对 AI 助手优化 —— 把仓库交给 AI 并让它「启动这个平台」即可。
> 偏好手动操作的话，见下方[快速开始](#快速开始)。


这是一个适合学习和二次开发的开源起点：网页部分不需要模型 API，评测 runner 可以先用 fixture 跑通，再连接本地 Ollama 或其他 OpenAI-compatible 服务。

## 已包含

- `/`：学习路线总览、评测闭环、可靠性与 Agent 轨迹交互示例
- `/learn`：10 个完整课程模块、动手任务、理解检查、设备本地进度
- `/paper`：`Attention Is All You Need` 逐页中文精读，包含原页对照、逐句解释、Q/K/V、多头注意力、位置编码和复杂度实验
- `/workbench`：Rubric、数据集、Judge 校准、RAG 分层、报告工作台
- `/interview`：12 道追问题、自评进度、现场场景题
- `/setup`：Mac M3 与 RTX 5060 Ti 双机实验指南
- `runner/`：工具调用、Judge 校准、RAG 分层和报告生成脚本
- `compose.yaml`：可在实验机复用的容器配置

## 启动网页

```bash
npm install
npm run dev
```

打开 `http://localhost:3000/`。学习进度与面试自评只保存在当前浏览器；评测资产通过下载文件保存。

## 准备论文原页（可选）

论文精读页的中文讲解和交互不依赖 PDF。为了避免把第三方论文文件直接打包进仓库，原 PDF 和渲染出的页面默认被 `.gitignore` 忽略。你可以从合法来源取得论文后运行：

```bash
ATTENTION_PAPER_PDF=/path/to/1706.03762v7.pdf node scripts/prepare-attention-paper.mjs
```

如果不准备 PDF，`/paper` 仍可阅读中文讲解、概念卡、实验和自测；原论文入口会提示你自行打开或准备素材。

## 先跑通无模型闭环

```bash
cd runner
python3 run_eval.py --mode fixture --repeat 3 --output result.json
python3 calibrate_judge.py --output judge-calibration.json
python3 eval_rag.py --output rag-result.json
python3 build_report.py result.json --output report.md
```

把生成的 `result.json` 导入网页的“工作台 → 报告”。

## 连接 Mac 上的 Ollama

模型应原生运行，以使用 Apple Silicon；评测脚本可以直接运行：

```bash
export LLM_BASE_URL=http://localhost:11434/v1
export LLM_MODEL=qwen3:4b
python3 runner/run_eval.py --cases runner/cases.jsonl --mode model --repeat 3 --output result.json
```

评测器也支持任何 OpenAI-compatible 接口。密钥只放环境变量 `LLM_API_KEY`，不要写入网页、数据或结果文件。

## 在 RTX 5060 Ti 电脑运行

先在宿主机启动 Ollama 或其他模型服务，再运行评测容器：

```bash
docker compose run --rm eval-runner
docker compose run --rm judge-calibration
docker compose run --rm rag-eval
```

默认 `eval-runner` 使用 fixture，不调用模型。确认数据与结果格式后，将 `compose.yaml` 中的 `--mode fixture` 改成 `--mode model`，并加入 `--repeat 5` 或更高重复次数。

## 统一结果格式

网页至少需要以下字段：

```json
{
  "experiment": "experiment-name",
  "model": "model-name",
  "summary": {
    "total": 80,
    "passed": 61,
    "avg_latency_ms": 1840,
    "avg_cost_usd": 0
  },
  "failures": {
    "wrong_tool": 7
  },
  "records": []
}
```

## 内容依据

核心定义来自原始论文或官方项目：Transformer、MMLU、GSM8K、HumanEval、SWE-bench、MT-Bench、τ-bench、BFCL、RAGAS 与 Inspect AI。课程页面提供逐项链接。

## 开源说明

- 本项目代码与课程内容按根目录 `LICENSE` 中的 MIT License 发布。
- 论文 PDF 与页面截图不是本项目原创代码资产，默认不进入 Git 提交；使用者应自行确认下载、展示和再分发权限。
- 不要提交 `.env`、API key、模型服务凭据、个人聊天记录或本地实验结果中的敏感数据。
- 课程补充遵循一条主线：业务目标 → 失败模式 → 可观测信号 → 指标 / Rubric → 自动化与人工复核 → 回归决策。
