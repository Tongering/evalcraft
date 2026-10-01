FROM python:3.12-slim

WORKDIR /eval
COPY *.py *.jsonl ./
CMD ["python", "run_eval.py", "--cases", "cases.jsonl", "--output", "/results/result.json"]
