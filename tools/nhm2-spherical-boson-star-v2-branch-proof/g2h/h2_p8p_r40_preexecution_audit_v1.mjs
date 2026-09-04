import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "../../..");
const files = {
  r39Result: resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r39-build-fixture-result.md"),
  proposal: resolve(root, "docs/research/nhm2-spherical-boson-star-v2-g2h-e-s5-a4-h2-p8p-r40-stopped-disk-fixture-evidence-proposal.md"),
  procedure: resolve(import.meta.dirname, "h2_p8p_r40_stopped_disk_fixture_evidence_v1.sh"),
  controller: resolve(import.meta.dirname, "h2_p8p_r40_stopped_disk_fixture_evidence_controller_v1.ps1"),
};
const expected = {
  r39Result: [3929, "c4ff2a4be27d49a44fdaff02cc3e7338c67972e423dbbac069b6f222e5c55238"],
  proposal: [4966, "2116f1f40f33f1c7bfe756c33f5966d7095b4d6c0767e8e417cbe14ac2cece6b"],
  procedure: [3553, "696a99570a4c213940f0580d3d654ca6414386e8daf7d780a24c97fc23d380ba"],
  controller: [8564, "cce6aa2daed863b8da396eede35658c4e56f9e4ff78478db9a84f92ca18cc41c"],
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

const result = text(files.r39Result);
const proposal = text(files.proposal);
const procedure = text(files.procedure);
const controller = text(files.controller);
const header = [
  "Program gate:", "Workstream:", "Capability or component:",
  "Current maturity:", "Target maturity:", "Required frozen inputs:",
  "Required evidence:", "Stop/fail criteria:", "Explicit non-goals:",
  "Downstream gate unlocked:",
];
check("proposal_packet_header", header.every((prefix, i) => proposal.split(/\r?\n/)[i].startsWith(prefix)));
check("r39_consumed", result.includes("R39 CONSUMED") && result.includes("phase=fixture exit=101"));
check("absence_gap_disclosed", result.includes("incorrectly treated") && result.includes("expected `test -e` negative result"));
check("guest_export_bound", proposal.includes("5,155 bytes") && proposal.includes("de12d097b90def46b8d94a8426d8398f7596feb013806d9d8427d4a615c55dcd"));
check("original_restart_absent", !controller.includes("'compute','instances','start',$SourceVm"));
check("one_snapshot_create", (controller.match(/'compute','snapshots','create'/g) || []).length === 1);
check("one_clone_create", (controller.match(/'compute','disks','create'/g) || []).length === 1);
check("one_helper_create", (controller.match(/'compute','instances','create'/g) || []).length === 1);
check("one_readonly_attach", (controller.match(/'compute','instances','attach-disk'/g) || []).length === 1 && controller.includes("'--mode=ro'"));
check("one_procedure_scp", (controller.match(/'compute','scp'/g) || []).length === 2 && controller.includes("'compute','scp',$Procedure"));
check("one_archive_scp", (controller.match(/'compute','scp',\"pestypig@\$\{Helper\}:\$RemoteArchive\"/g) || []).length === 1);
check("one_rescue_ssh", (controller.match(/'compute','ssh'/g) || []).length === 1);
check("helper_stop_present", (controller.match(/'compute','instances','stop'/g) || []).length === 1);
check("read_only_mounts", procedure.includes("mount -o ro,noload") && procedure.includes("mount -o ro,norecovery"));
check("device_ro_gate", procedure.includes('blockdev --getro "$DEV"') && procedure.includes('== 1'));
check("source_limits", procedure.includes("MAX_COPY_BYTES=16777216") && procedure.includes("MAX_FILE_BYTES=8388608"));
check("source_export_exact", procedure.includes('[[ "$EXPORT_BYTES" == 5155 ]]') && procedure.includes("de12d097b90def46b8d94a8426d8398f7596feb013806d9d8427d4a615c55dcd"));
check("no_docker_start", !/systemctl start docker|docker run|docker build/.test(procedure));
check("no_numerical_surface", !/P=1024|P=65,?536|mini-boson-star/.test(controller + procedure));
check("authority_locked", proposal.includes("authority promotion is authorized") && proposal.includes("No retry"));

for (const item of checks) console.log(`${item.pass ? "PASS" : "FAIL"} ${item.name}`);
const passed = checks.filter((item) => item.pass).length;
console.log(`R40_PREEXECUTION_AUDIT ${passed}/${checks.length} ${passed === checks.length ? "PASS" : "FAIL"}`);
if (passed !== checks.length) process.exit(1);
