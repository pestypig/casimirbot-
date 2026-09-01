import { readdir, stat } from "node:fs/promises";
import path from "node:path";

const normalize = (value) => value.replaceAll("\\", "/").toLowerCase();

export const classifyForbiddenAgentRuntimePath = (relativePath) => {
  const normalized = normalize(relativePath).replace(/^\.\//u, "");
  if (normalized.startsWith("codex-marketplace/")) return null;
  if (
    normalized.includes("node_modules/@openai/codex/") ||
    normalized.endsWith("node_modules/@openai/codex")
  ) {
    return "bundled_openai_codex_npm_runtime";
  }
  const basename = normalized.split("/").at(-1) ?? "";
  if (["codex.exe", "codex.cmd", "codex.ps1"].includes(basename)) {
    return "bundled_codex_executable";
  }
  if (basename === "codex" && normalized.includes("/bin/")) {
    return "bundled_codex_executable";
  }
  return null;
};

export const assertNoRequiredCodexRuntimePackage = (requiredPackages) => {
  const names = Object.keys(requiredPackages ?? {}).map(normalize);
  if (names.some((name) => name === "@openai/codex")) {
    throw new Error("Base desktop service must not require @openai/codex");
  }
};

export const inspectProviderNeutralRuntimeTree = async (root) => {
  const violations = [];
  let fileCount = 0;
  const visit = async (directory) => {
    const children = await readdir(directory);
    children.sort((left, right) => left.localeCompare(right));
    for (const child of children) {
      const absolute = path.join(directory, child);
      const details = await stat(absolute);
      if (details.isDirectory()) {
        await visit(absolute);
      } else if (details.isFile()) {
        fileCount += 1;
        const relative = path.relative(root, absolute).replaceAll(path.sep, "/");
        const reason = classifyForbiddenAgentRuntimePath(relative);
        if (reason) violations.push({ path: relative, reason });
      }
    }
  };
  await visit(root);
  return { fileCount, violations };
};

export const assertProviderNeutralRuntimeTree = async (root) => {
  const result = await inspectProviderNeutralRuntimeTree(root);
  if (result.violations.length > 0) {
    throw new Error(
      `Forbidden bundled Codex runtime artifact: ${JSON.stringify(result.violations)}`,
    );
  }
  return result;
};
