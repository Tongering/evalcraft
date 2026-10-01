import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdtemp, readFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { promisify } from "node:util";
import test from "node:test";

const exec = promisify(execFile);
const root = new URL("../", import.meta.url).pathname;
const runner = join(root, "runner");

test("tool evaluator emits repeat reliability", async () => {
  const dir = await mkdtemp(join(tmpdir(), "evalcraft-"));
  const output = join(dir, "result.json");
  await exec("python3", [join(runner, "run_eval.py"), "--cases", join(runner, "cases.jsonl"), "--mode", "fixture", "--repeat", "3", "--output", output]);
  const data = JSON.parse(await readFile(output, "utf8"));
  assert.equal(data.summary.total, 18);
  assert.equal(data.summary.passed, 12);
  assert.equal(data.reliability.repeat, 3);
  assert.equal(data.reliability.fully_reliable_cases, 4);
});

test("judge and RAG evaluators emit bounded metrics", async () => {
  const dir = await mkdtemp(join(tmpdir(), "evalcraft-"));
  const judge = join(dir, "judge.json");
  const rag = join(dir, "rag.json");
  await exec("python3", [join(runner, "calibrate_judge.py"), "--labels", join(runner, "judge-labels.jsonl"), "--output", judge]);
  await exec("python3", [join(runner, "eval_rag.py"), "--cases", join(runner, "rag-cases.jsonl"), "--output", rag]);
  const judgeData = JSON.parse(await readFile(judge, "utf8"));
  const ragData = JSON.parse(await readFile(rag, "utf8"));
  assert.ok(judgeData.cohen_kappa >= -1 && judgeData.cohen_kappa <= 1);
  assert.ok(judgeData.position_bias.flip_rate >= 0 && judgeData.position_bias.flip_rate <= 1);
  for (const value of Object.values(ragData.metrics)) assert.ok(value >= 0 && value <= 1);
});
