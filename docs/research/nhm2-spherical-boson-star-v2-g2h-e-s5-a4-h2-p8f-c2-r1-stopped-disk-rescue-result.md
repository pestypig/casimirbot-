Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: S5-A/A4 candidate-neutral H2 continuation diagnosis
Capability or component: H2-P8F-C2-R1 stopped-disk terminal-evidence rescue result
Current maturity: authenticated archive recovery; frozen result auditor fail-closed on C2-R1 ABI mismatch
Target maturity: separately frozen C2-R1 result-ABI audit binding; no numerical retry
Required frozen inputs: proposal `288fc634...bebc0a`, rescue procedure `60461d0b...d686e`, archive `60cb3bf0...977ad`, raw recovered evidence, and failed frozen-audit receipt `6f39c2b4...391f`
Required evidence: byte/hash agreement, stopped original/helper VMs, read-only clone/mount evidence, immutable raw files, and an independently audited C2-R1-specific result ABI
Stop/fail criteria: evidence mutation, reinterpretation of the failed frozen audit as PASS, numerical retry/retune, candidate ingress, or authority promotion
Explicit non-goals: candidate evaluation, a second P8F execution, Rust/G3/SI/metric/lane work, or physical/propulsion/transport claims
Downstream gate unlocked: candidate-neutral C2-R1 result-ABI audit-definition repair only; no scientific classification or execution authority

# H2-P8F-C2-R1 stopped-disk rescue result

## Rescue verdict

`RECOVERY_PASS / RESULT_CLASSIFICATION_BLOCKED`

The authorized snapshot, 30 GB `pd-standard` evidence clone and one
`e2-small` helper were created exactly once. The clone was attached in Compute
Engine `READ_ONLY` mode. The exact 2,713-byte rescue procedure matched SHA-256
`60461d0b062a5e439ce83420692f68573fefc4386e4b2ab2f35f2f408a7d686e`,
mounted the clone read-only, unmounted it, and produced a deterministic 28,277-
byte archive with SHA-256
`60cb3bf005cf70ba400a8db6727c88aad99abf54d66aa29359111a0c492977ad`.
The hash agrees on the helper, in Cloud Shell and in the local candidate-neutral
capture. The original VM remained stopped. The helper is `TERMINATED`; all
authorized resources and evidence are retained.

## Recovered process observation

The immutable evidence records one process from `2026-08-31T15:07:29Z` through
`2026-08-31T17:24:37Z`, controller exit `0`, and `timed_out=false`. Its terminal
JSON reports `status=PASS`, all 65,536 panels completed, 32 threads, exact
reconstruction invariants true, one refinement candidate visited, zero width
checks, zero candidate evaluations, zero positive samples, no candidate root,
no scientific handler and no authority promotion.

This is an observed payload, not yet an authenticated P8F result.

## Frozen-auditor boundary

The unchanged frozen P8F auditor returns `12/23 FAIL`, classification
`AUDIT_FAIL`; its result artifact has SHA-256
`6f39c2b4c615f83b643acbbb2aa53620797c31626e9389519b717fc03f46391f`.
It expected the predecessor terminal inventory, identities, schema and a
representative width-failure record. C2-R1 instead persisted
`controller.exit.txt`, a C2-R1 binary/container identity and a successful
outer-accumulation record. Raw evidence was not renamed, normalized or edited.

Therefore the process payload cannot be promoted to an authenticated PASS. The
smallest lawful successor is a separately versioned, candidate-neutral C2-R1
result-ABI audit definition that binds the observed file inventory and exact
scientific identities, replays the reported interval arithmetic, and is frozen
and independently audited before it evaluates the immutable capture. No
numerical retry or candidate work is selected.

## Result-ABI closure

That successor is now complete. The initial exact-interval reader remains an
immutable `20/22 FAIL` at `43e55c50...81fb7`: it omitted FLINT
`arb_get_str`'s documented one-midpoint-ulp decimal conversion uncertainty.
The additive one-ulp reader remains an immutable `20/22 FAIL` at
`cf031c80...6b9ff`: it constructed 80-digit endpoints under Python Decimal's
default 28-digit context. Neither failure selected a lead.

The separately frozen fixed-220-digit-context reader changes only that proven
representational defect. Its self-test passes 4/4 and its independent
definition audit passes 15/15. Applied once to the unchanged capture, it passes
22/22 with receipt SHA-256
`afda5b932d27c7d9c8b37a9782cf85be25b9ea22833448f636dabb14b18f4c5c`
and classifies `P8G_OUTER_ACCUMULATION_ARITHMETIC_LEAD`. The classification is
rigorous because `lower(final_radius) >
upper(total_elementary_radius_sum)`. Boundary dominance is false; slot 3 is
the unique strict slot maximum but is lower priority under the preregistered
decision order.

The next lawful work is a candidate-neutral P8G outer-accumulation arithmetic
definition and bounded diagnostic implementation. It must localize why the
final coefficient radius exceeds the persisted elementary-radius sum without
rerunning C2-R1, changing the rail, or evaluating a candidate.

All candidate, proof, geometry/state, lane, lamp, physical, propulsion and
transport authority remains false.
