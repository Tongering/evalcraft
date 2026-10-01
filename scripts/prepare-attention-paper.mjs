import { cp, mkdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { spawnSync } from "node:child_process";

const source = process.env.ATTENTION_PAPER_PDF;
if (!source) {
  console.error("Set ATTENTION_PAPER_PDF to a legally obtained 1706.03762v7.pdf before running this script.");
  process.exit(1);
}
if (!existsSync(source)) {
  console.error(`Paper not found: ${source}`);
  process.exit(1);
}

const root = resolve(new URL("..", import.meta.url).pathname);
const output = resolve(root, "public/attention-paper");
await mkdir(output, { recursive: true });
await cp(source, resolve(output, "attention-is-all-you-need.pdf"));
const render = spawnSync("pdftoppm", ["-jpeg", "-r", "110", source, resolve(output, "page")], { stdio: "inherit" });
if (render.error || render.status !== 0) {
  console.error("pdftoppm is required to render the paper pages. Install Poppler, then run this command again.");
  process.exit(render.status || 1);
}
console.log("Prepared local paper assets in public/attention-paper. They are ignored by git by design.");
