import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const paths = {
  proposal: resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r39-file-transport-boundary-proposal.md"),
  controller: resolve(import.meta.dirname, "h2_p8p_r39_file_transport_controller_v1.ps1"),
  guard: resolve(import.meta.dirname, "h2_p8p_r39_remote_guard_v1.sh"),
  launcher: resolve(import.meta.dirname, "h2_p8p_r39_remote_launcher_v1.sh"),
  stagedGuard: "C:/NHM2-R39/h2_p8p_r39_remote_guard_v1.sh",
  stagedLauncher: "C:/NHM2-R39/h2_p8p_r39_remote_launcher_v1.sh",
  archive: "C:/NHM2-R35/p8p.tar",
};

const expected = {
  proposal: [5655, "7b20c0902fe341a535c9f11a1bc752b5d9f1e7d6067efe61bcc1581ec58b59f0"],
  controller: [8104, "5fa0c13e3ca77e1862c9d487423e07c4e5638391edda289a7aa74fc22996b9bc"],
  guard: [770, "cbd1cc51d9108f07f8741a175929a2742039aeb61c6f9997d69d293a836c9861"],
  launcher: [590, "802055c139ef32d462457f3576d0911272a496d7a27be7a972f961eb0899e3bb"],
  archive: [236640768, "3c697fa3e238398d3b4c30a6c379fea8d6d545b2228d0c699dd66594a23670b5"],
};

const checks = [];
function check(name, condition) {
  checks.push({ name, pass: Boolean(condition) });
}
function bytes(path) {
  return readFileSync(path);
}
function sha(path) {
  return createHash("sha256").update(bytes(path)).digest("hex");
}
function identity(name, path, spec) {
  check(`${name}_regular`, statSync(path).isFile());
  check(`${name}_bytes`, statSync(path).size === spec[0]);
  check(`${name}_sha256`, sha(path) === spec[1]);
}

identity("proposal", paths.proposal, expected.proposal);
identity("controller", paths.controller, expected.controller);
identity("guard", paths.guard, expected.guard);
identity("launcher", paths.launcher, expected.launcher);
identity("archive", paths.archive, expected.archive);
identity("staged_guard", paths.stagedGuard, expected.guard);
identity("staged_launcher", paths.stagedLauncher, expected.launcher);

const proposal = bytes(paths.proposal).toString("utf8");
const controller = bytes(paths.controller).toString("utf8");
const guard = bytes(paths.guard);
const launcher = bytes(paths.launcher);
const requiredHeader = [
  "Program gate:",
  "Workstream:",
  "Capability or component:",
  "Current maturity:",
  "Target maturity:",
  "Required frozen inputs:",
  "Required evidence:",
  "Stop/fail criteria:",
  "Explicit non-goals:",
  "Downstream gate unlocked:",
];
check("packet_header", requiredHeader.every((prefix, index) => proposal.split(/\r?\n/)[index].startsWith(prefix)));
check("proposal_inert", proposal.includes("FROZEN INERT / SEPARATE BILLABLE AUTHORIZATION REQUIRED"));
check("r38_superseded_unexecuted", proposal.includes("R38 remains unexecuted and is superseded before execution"));
check("powershell_single_start", (controller.match(/'compute','instances','start'/g) || []).length === 1);
check("powershell_three_ssh", (controller.match(/'compute','ssh'/g) || []).length === 3);
check("powershell_three_scp", (controller.match(/'compute','scp'/g) || []).length === 3);
check("powershell_single_stop", (controller.match(/'compute','instances','stop'/g) || []).length === 1);
check("remote_commands_literal", [
  "--command=test -e $RemoteGuard",
  "--command=bash $RemoteGuard",
  "--command=bash $RemoteLauncher",
].every((value) => controller.includes(value)));
check("no_inline_shell_program", !controller.includes("$guard =") && !controller.includes("$handoff ="));
check("no_numerical_surface", !/P=1024|P=65,?536|mini-boson-star/.test(controller));
check("guard_lf_only", !guard.includes(0) && !guard.includes(13));
check("launcher_lf_only", !launcher.includes(0) && !launcher.includes(13));
check("guard_authenticates_predecessors", bytes(paths.guard).toString("utf8").includes("R39_REMOTE_GUARD_PASS"));
check("launcher_execs_unchanged_wrapper", bytes(paths.launcher).toString("utf8").includes('exec bash "$wrapper"'));
check("authority_locked", proposal.includes("authority remain false"));

for (const item of checks) {
  console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`);
}
const passed = checks.filter((item) => item.pass).length;
console.log(`R39_PREEXECUTION_AUDIT ${passed}/${checks.length} ${passed === checks.length ? "PASS" : "FAIL"}`);
if (passed !== checks.length) process.exit(1);
