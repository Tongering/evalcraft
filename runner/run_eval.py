#!/usr/bin/env python3
"""Minimal, dependency-free tool-selection evaluator."""

from __future__ import annotations

import argparse
import json
import os
import time
import urllib.request
from collections import Counter
from pathlib import Path


SYSTEM = """You are a tool-routing agent. Return JSON only:
{"tool":"tool_name","arguments":{"key":"value"}}
Available tools: get_order_status(order_id), refund_order(order_id), transfer_to_human(reason).
Follow policy: delivered orders must never be refunded automatically; check status before refunding.
"""


def load_cases(path: Path) -> list[dict]:
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def fixture_answer(case: dict, index: int) -> dict:
    """A deterministic fake model so the pipeline can be learned without a model."""
    if index == 2:
        return {"tool": "refund_order", "arguments": {"order_id": case["input"].split()[-1]}}
    if index == 4:
        return {"tool": case["expected_tool"], "arguments": {"order_id": "WRONG-ID"}}
    return {"tool": case["expected_tool"], "arguments": case["expected_arguments"]}


def model_answer(case: dict, model: str) -> dict:
    base = os.getenv("LLM_BASE_URL", "http://localhost:11434/v1").rstrip("/")
    payload = json.dumps({
        "model": model,
        "temperature": 0,
        "messages": [
            {"role": "system", "content": SYSTEM},
            {"role": "user", "content": case["input"]},
        ],
    }).encode()
    headers = {"Content-Type": "application/json"}
    token = os.getenv("LLM_API_KEY")
    if token:
        headers["Authorization"] = f"Bearer {token}"
    request = urllib.request.Request(f"{base}/chat/completions", data=payload, headers=headers)
    with urllib.request.urlopen(request, timeout=120) as response:
        body = json.load(response)
    text = body["choices"][0]["message"]["content"].strip()
    if text.startswith("```"):
        text = text.split("\n", 1)[1].rsplit("```", 1)[0]
    return json.loads(text)


def evaluate(case: dict, answer: dict) -> tuple[bool, str | None]:
    if answer.get("tool") != case["expected_tool"]:
        return False, "wrong_tool"
    expected = case.get("expected_arguments", {})
    actual = answer.get("arguments", {})
    if any(actual.get(key) != value for key, value in expected.items()):
        return False, "wrong_arguments"
    return True, None


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--cases", default="cases.jsonl")
    parser.add_argument("--output", default="result.json")
    parser.add_argument("--mode", choices=["fixture", "model"], default="fixture")
    parser.add_argument("--model", default=os.getenv("LLM_MODEL", "local-model"))
    parser.add_argument("--repeat", type=int, default=1, help="Trials per case; use >1 to measure reliability")
    args = parser.parse_args()

    cases = load_cases(Path(args.cases))
    failures: Counter[str] = Counter()
    records = []
    latencies = []
    passed = 0

    repeat = max(1, args.repeat)
    per_case: dict[str, list[bool]] = {case["id"]: [] for case in cases}
    for trial in range(repeat):
        for index, case in enumerate(cases):
            started = time.perf_counter()
            try:
                answer = fixture_answer(case, index) if args.mode == "fixture" else model_answer(case, args.model)
                ok, reason = evaluate(case, answer)
            except Exception as exc:  # experiment errors must remain visible in the result
                answer, ok, reason = {"error": str(exc)}, False, "environment"
            latency = round((time.perf_counter() - started) * 1000)
            latencies.append(latency)
            passed += int(ok)
            per_case[case["id"]].append(ok)
            if reason:
                failures[reason] += 1
            records.append({"case_id": case["id"], "trial": trial + 1, "passed": ok, "failure": reason, "latency_ms": latency, "answer": answer, "tags": case.get("tags", [])})

    reliable_cases = sum(all(trials) for trials in per_case.values())

    result = {
        "experiment": f"tool-selection-{args.mode}-v1",
        "model": args.model if args.mode == "model" else "deterministic-fixture",
        "summary": {
            "total": len(cases) * repeat,
            "passed": passed,
            "avg_latency_ms": round(sum(latencies) / max(1, len(latencies))),
            "avg_cost_usd": 0,
        },
        "reliability": {
            "repeat": repeat,
            "pass_power_k": reliable_cases / max(1, len(cases)),
            "fully_reliable_cases": reliable_cases,
            "case_count": len(cases),
        },
        "failures": dict(failures),
        "records": records,
    }
    Path(args.output).write_text(json.dumps(result, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"{passed}/{len(cases) * repeat} runs passed; pass^{repeat}={reliable_cases}/{len(cases)} cases → {args.output}")


if __name__ == "__main__":
    main()
