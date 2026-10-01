#!/usr/bin/env python3
"""Compute transparent retrieval and answer-grounding metrics from annotations."""

import argparse
import json
from pathlib import Path


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", default="rag-cases.jsonl")
    parser.add_argument("--output", default="rag-result.json")
    args = parser.parse_args()
    rows = [json.loads(line) for line in Path(args.cases).read_text(encoding="utf-8").splitlines() if line.strip()]
    details = []
    for row in rows:
        relevant = set(row["relevant_doc_ids"])
        retrieved = row["retrieved_doc_ids"]
        hits = relevant.intersection(retrieved)
        precision = len(hits) / max(1, len(retrieved))
        recall = len(hits) / max(1, len(relevant))
        faithfulness = row["supported_claims"] / max(1, row["total_claims"])
        details.append({"id": row["id"], "precision_at_k": precision, "recall_at_k": recall, "faithfulness": faithfulness, "attribution": "retrieval" if recall < .8 else "generation" if faithfulness < .8 else "pass"})
    avg = lambda key: sum(item[key] for item in details) / max(1, len(details))
    result = {"experiment": "rag-layered-eval-v1", "model": "annotated-fixture", "summary": {"total": len(rows), "passed": sum(item["attribution"] == "pass" for item in details), "avg_latency_ms": 0, "avg_cost_usd": 0}, "metrics": {"precision_at_k": avg("precision_at_k"), "recall_at_k": avg("recall_at_k"), "faithfulness": avg("faithfulness")}, "failures": {"retrieval": sum(item["attribution"] == "retrieval" for item in details), "generation": sum(item["attribution"] == "generation" for item in details)}, "records": details}
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"precision={result['metrics']['precision_at_k']:.3f}, recall={result['metrics']['recall_at_k']:.3f}, faithfulness={result['metrics']['faithfulness']:.3f} → {args.output}")


if __name__ == "__main__":
    main()
