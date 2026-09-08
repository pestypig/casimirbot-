import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const files = {
  result: resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r40-long-local-path-result.md"),
  proposal: resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r41-short-path-retrieval-proposal.md"),
  controller: resolve(import.meta.dirname, "h2_p8p_r41_short_path_retrieval_controller_v1.ps1"),
  r40Receipt: resolve(root, "artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r40-stopped-disk-fixture-evidence-v1-20260904/rescue.stdout.txt"),
};
const expected = {
  result: [3126, "d7e3ad7db8d35f3ad0f22714030a444fb795a7d6f111645bb28a41d12b9c8f5a"],
  proposal: [3509, "abcd3bcf0d2fe674ce3e4d3d40772e7b2a717a06b69027240fd9bfe6b392a211"],
  controller: [6666, "6fc5434437e3736c3125e2fb95dfb45e691763f22cecf4d894efc7577ce6f55e"],
  r40Receipt: [107, "6c61247fe3422324d832d9006ae2e084c3340286cc7435054045b4d99f4d4c18"],
};
const checks = [];
const check = (name, value) => checks.push({ name, pass: Boolean(value) });
const bytes = (path) => readFileSync(path);
const text = (path) => bytes(path).toString("utf8");
const sha = (path) => createHash("sha256").update(bytes(path)).digest("hex");
for (const [name, path] of Object.entries(files)) {
  check(`${name}_regular`, statSync(path).isFile());
  check(`${name}_bytes`, statSync(path).size === expected[name][0]);
  check(`${name}_sha256`, sha(path) === expected[name][1]);
}

const result = text(files.result);
const proposal = text(files.proposal);
const controller = text(files.controller);
const receipt = text(files.r40Receipt);
const header = [
  "Program gate:", "Workstream:", "Capability or component:",
  "Current maturity:", "Target maturity:", "Required frozen inputs:",
  "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
  "Downstream gate unlocked:",
];
check("packet_header", header.every((prefix, i) => proposal.split(/\r?\n/)[i].startsWith(prefix)));
check("r40_consumed", result.includes("R40 CONSUMED") && result.includes("LOCAL LONG-PATH SCP FAIL"));
check("remote_archive_exact", receipt.trim() === "P8P_R40_EVIDENCE_READY bytes=12122 sha256=73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922");
check("short_path_exact", controller.includes("$ShortArchive = 'C:\\NHM2-R41\\r40.tgz'"));
check("one_helper_start", (controller.match(/'compute','instances','start',\$Helper/g) || []).length === 1);
check("source_start_absent", !controller.includes("'compute','instances','start',$SourceVm"));
check("one_scp", (controller.match(/'compute','scp'/g) || []).length === 1);
check("one_helper_stop", (controller.match(/'compute','instances','stop'/g) || []).length === 1);
check("no_resource_create", !/'compute','(?:instances|disks|snapshots)','create'/.test(controller));
check("no_ssh_or_mount", !controller.includes("'compute','ssh'") && !/mount|attach-disk/.test(controller));
check("receipt_bound_before_start", controller.indexOf("R40 rescue receipt drift") < controller.indexOf("'compute','instances','start',$Helper"));
check("exact_archive_checks", controller.includes("Length -ne 12122") && controller.match(/73029fde08f14f9fcd01490c4e5d5bc188213eaa2f9a8d857eb5e456b86d0922/g)?.length === 3);
check("two_local_identity_checks", (controller.match(/archive byte mismatch/g) || []).length === 2 && (controller.match(/archive hash mismatch/g) || []).length === 2);
check("no_numerical_surface", !/P=1024|P=65,?536|mini-boson-star/.test(controller));
check("authority_locked", proposal.includes("authority promotion is") && proposal.includes("First failure is terminal"));

for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`);
const passed = checks.filter((item) => item.pass).length;
console.log(`R41_PREEXECUTION_AUDIT ${passed}/${checks.length} ${passed === checks.length ? "PASS" : "FAIL"}`);
if (passed !== checks.length) process.exit(1);
