#!/usr/bin/env python3
"""Turn an EvalCraft result JSON into a concise Markdown report."""

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("result")
    parser.add_argument("--output", default="report.md")
    args = parser.parse_args()
    data = json.loads(Path(args.result).read_text(encoding="utf-8"))
    summary = data["summary"]
    rate = summary["passed"] / max(1, summary["total"])
    failures = "\n".join(f"- {key}: {value}" for key, value in data.get("failures", {}).items()) or "- 未提供分类"
    decision = "达到 90% 候选门槛；发布前仍需检查高风险分层。" if rate >= .9 else "未达到 90% 候选门槛；优先处理主要失败类型。"
    report = f"""# {data['experiment']} 评测报告

## 结论

{data['model']} 在 {summary['total']} 次运行中通过 {summary['passed']} 次，通过率 {rate:.1%}。{decision}

## 运行摘要

- 模型：{data['model']}
- 样本/运行数：{summary['total']}
- 平均延迟：{summary.get('avg_latency_ms', '未记录')} ms
- 平均成本：${summary.get('avg_cost_usd', '未记录')}

## 失败分布

{failures}

## 下一步

1. 复核高风险失败，区分模型、数据、环境与判分错误。
2. 把确认的 bad case 加入版本化回归集。
3. 修复后使用同一评测契约复跑，并报告不确定性。
"""
    Path(args.output).write_text(report, encoding="utf-8")
    print(f"report → {args.output}")


if __name__ == "__main__":
    main()
