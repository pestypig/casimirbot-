const fs = require("fs");
const path = require("path");

const ROOTS = [
  "models",
  ".cache",
  "artifacts",
  "datasets",
  "reports",
  "coverage",
  "tmp",
  "test-results",
];

const INDEX_PATH = path.join("server", "_generated", "code-lattice.json");

function removePath(target) {
  if (!fs.existsSync(target)) return;
  fs.rmSync(target, { recursive: true, force: true });
  process.stdout.write(`[deploy-clean] removed ${target}\n`);
}

for (const entry of ROOTS) removePath(entry);

if (process.env.LLM_LOCAL_INDEX_OBJECT_KEY && process.env.KEEP_LOCAL_INDEX !== "1") {
  removePath(INDEX_PATH);
}
