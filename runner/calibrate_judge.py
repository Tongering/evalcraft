#!/usr/bin/env python3
"""Calculate Judge agreement, Cohen's kappa and A/B flip rate."""

import argparse
import json
from pathlib import Path


def load(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--labels", default="judge-labels.jsonl")
    parser.add_argument("--output", default="judge-calibration.json")
    args = parser.parse_args()
    rows = load(Path(args.labels))
    tp = tn = fp = fn = flips = 0
    for row in rows:
        human = bool(row["human_pass"])
        judge = bool(row["judge_pass_ab"])
        tp += human and judge
        tn += (not human) and (not judge)
        fp += (not human) and judge
        fn += human and (not judge)
        flips += row.get("judge_pass_ba", judge) != judge
    n = max(1, len(rows))
    accuracy = (tp + tn) / n
    human_yes = (tp + fn) / n
    judge_yes = (tp + fp) / n
    expected = human_yes * judge_yes + (1 - human_yes) * (1 - judge_yes)
    kappa = (accuracy - expected) / (1 - expected) if expected < 1 else 0
    result = {"samples": len(rows), "matrix": {"tp": tp, "tn": tn, "fp": fp, "fn": fn}, "accuracy": accuracy, "cohen_kappa": kappa, "position_bias": {"flips": flips, "flip_rate": flips / n}}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"accuracy={accuracy:.3f}, kappa={kappa:.3f}, flip_rate={flips / n:.3f} → {args.output}")


if __name__ == "__main__":
    main()
