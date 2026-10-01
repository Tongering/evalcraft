# tool-selection-fixture-v1 评测报告

## 结论

deterministic-fixture 在 18 次运行中通过 12 次，通过率 66.7%。未达到 90% 候选门槛；优先处理主要失败类型。

## 运行摘要

- 模型：deterministic-fixture
- 样本/运行数：18
- 平均延迟：0 ms
- 平均成本：$0

## 失败分布

- wrong_tool: 3
- wrong_arguments: 3

## 下一步

1. 复核高风险失败，区分模型、数据、环境与判分错误。
2. 把确认的 bad case 加入版本化回归集。
3. 修复后使用同一评测契约复跑，并报告不确定性。
