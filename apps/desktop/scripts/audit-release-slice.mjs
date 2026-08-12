import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditReleaseSlice } from "./release-slice-audit-lib.mjs";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const desktopRoot = path.resolve(scriptDirectory, "..");
const repoRoot = path.resolve(desktopRoot, "../..");
const manifestPath = path.join(desktopRoot, "release-slice.v1.json");
const report = await auditReleaseSlice({ repoRoot, manifestPath });

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
} else {
  console.log(
    `[desktop-release-slice] ${report.verdict} ` +
    `owned_files=${report.counts.repositoryOwnedFiles} ` +
    `owned_changed=${report.counts.ownedChanged} ` +
    `shared_review=${report.counts.sharedChanged} ` +
    `outside_untouched=${report.counts.outsideChanged} ` +
    `staged=${report.counts.staged}`,
  );
  for (const entry of report.requiresHunkReview) {
    console.log(`[desktop-release-slice] HUNK_REVIEW ${entry.path}: ${entry.purpose}`);
  }
  if (report.outsideChanges.length) {
    console.log(
      `[desktop-release-slice] outside changes are reported but never staged ` +
      `(${report.outsideChanges.length})`,
    );
  }
  for (const violation of report.violations) {
    console.error(`[desktop-release-slice] VIOLATION ${violation}`);
  }
}

if (report.verdict !== "PASS") process.exitCode = 1;
