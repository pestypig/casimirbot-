Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C1 quota-compatible cloud resource correction
Current maturity: exact archive uploaded and cloud-rehashed; C4 creation rejected before resource creation because regional C4 family quota is 24 vCPUs
Target maturity: one unchanged 32-thread C1 process on an available x86-64 32-vCPU VM
Required frozen inputs: parent proposal `58c3b9fb...ec6e4`, archive `c40fda6b...24640`, binary `14140897...1bad6`, controller `940ee74a...db8b2`, N2 regional quota 200 with usage 0, and unchanged 24-hour/$40 ceilings
Required evidence: absent rejected C4 VM/disk, exact Cloud Shell archive hash, exact N2 resource identity, unchanged build/binary/run bindings, one-process evidence and automatic stop
Stop/fail criteria: any numerical/source/archive/controller change, machine smaller than 32 vCPUs, ARM substitution, quota or capacity rejection, retry after numerical start, retune, candidate ingress, evidence deletion or authority promotion
Explicit non-goals: quota increase, IAM mutation, C4 retry, scientific target change, frozen-candidate evaluation, Rust/G3/SI/metric/lane work, or candidate, proof, geometry/state, lamp, physical, propulsion or transport promotion
Downstream gate unlocked: the unchanged P8F-C1 cloud-observable execution; no scientific authority

# H2-P8F-C1 N2 resource correction

The authorized `c4-standard-32` request was rejected before creating a VM or
disk. Google reported `CPUS_PER_VM_FAMILY` limit `24` for C4 in `us-central1`.
Therefore no C4 compute cost began.

Read-only regional quota inspection reports:

- generic CPUs: limit `200`, usage `0`;
- N2 CPUs: limit `200`, usage `0`;
- C3/E2/T2D families: limit `24` each.

The smallest correction retaining 32 physical vCPUs and x86-64 compatibility
is on-demand `n2-standard-32`. Its listed Iowa rate is approximately
`$1.553888/hour`, slightly below the rejected C4 planning rate. The corrected
resource is:

- project: `dark-stratum-455714-h4`;
- zone: `us-central1-a`;
- name: `nhm2-h2-p8f-c1-n2-32-20260831`;
- machine: `n2-standard-32`;
- boot disk: exactly 30 GB `pd-balanced`;
- image: `projects/debian-cloud/global/images/debian-12-bookworm-v20260817`;
- aggregate VM runtime ceiling: `86,400` seconds;
- total compute and prorated-storage ceiling: `$40.00`.

No source, mathematical target, precision, panel count, thread count,
threshold, archive, manifest, controller, base image, executable, evidence
transport or authority lock changes. The already uploaded archive remains
exactly 236,391,936 bytes with SHA-256
`c40fda6b7fca57c34a6eef1f93398bfbc5edb731c58c9b5d70a83dcdb4724640`.
