Program gate: G2F — fresh classical-control candidate selection
Workstream: authenticated classical control branch
Capability or component: closure audit of bounded primary-source selection
Current maturity: deterministic selection complete; candidate unadmitted and unexecuted
Target maturity: independently replayed G2F closure with current evidence bindings
Required frozen inputs: protocol SHA-256 `785d984382f966a6e2811c645e412e29bcd6842f682dbcfb43e833c118d18272`, final evidence matrix and closed G2D/G2E records
Required evidence: protocol rehash, bounded query/source inventory, primary selector, independent replay and repository verification
Stop/fail criteria: protocol drift, G2D alias admission, candidate evaluation, nondeterministic decision, verification failure or authority promotion
Explicit non-goals: candidate execution/admission, G2G proof work, G3, 68-file lanes, lamp or physical claims
Downstream gate unlocked: G2G Tolman-VII candidate preregistration only

# G2F closure audit

Status: `PASS` for selection closure only.

This audit changes evidence and roadmap documentation only. It changes no
mathematical equations, runtime authority, receipt semantics, candidate
admission or physical claim. The selected identity remains a preregistration
input, not an evaluated scientific candidate.

## Requirement-by-requirement result

| Objective requirement | Authoritative evidence | Result |
| --- | --- | --- |
| Freeze the pool, exclusions, eligibility, score axes, ranking and stop rule before assessment | byte-frozen protocol and SHA-256 sidecar | `PASS` |
| Permanently exclude G2D and aliases/rebrands | protocol exclusions plus primary/replay exclusion fixtures | `PASS` |
| Preserve the bounded literature process | evidence matrix contains 34 exact queries, 15 primary-source records, six negative/uncertainty findings and all five scored rows | `PASS` |
| Require complete origin/interior/interface/exterior/infinity definitions | hard `D=2` eligibility gate and row-specific evidence | `PASS` |
| Require proof, benchmark and Hadamard/RSET/noise paths | hard `P`, `B` and `Q` gates; unsupported evidence is rounded down | `PASS` |
| Select at most one family/member rule or stop | deterministic unique-maximum/tie/no-member rules | `PASS` |
| Preserve rejected alternatives and uncertainties | four nonselected rows retain score reasons and explicit dispositions; negative findings forbid absence claims | `PASS` |
| Independently replay the decision | producer-independent script does not import the primary selector and exercises final, exclusion, hard-fail, unique, tie and no-member cases | `PASS` |
| Perform no candidate evaluation or execution | matrix records `candidate_evaluations=0` and `candidate_execution_authorized=false`; neither selector contains a scientific evaluator or solver call | `PASS` |
| Keep every authority lock false | matrix, result, protocol and both selector checks agree | `PASS` |
| Update the canonical dependency roadmap | work program closes G2F and activates definition-only G2G | `PASS` |

## Decision replay

The primary selector passes `10/10` checks. The independent replay passes
`9/9` checks. Both return:

```text
verdict = SELECT_ONE
selected_id = TOLMAN_VII_ISOTROPIC_FLUID_SCALAR_QFT_CONTROL
scientific_identity = G2F_TOLMAN_VII_NATURAL_BETA_1_5_SCALAR_HADAMARD_V1
rank = (1,15,1,2,2,2,2,2,2)
```

The member handoff is exactly `mu=1`, `beta=M/r_b=1/5`, with quadratic
density `rho_c*(1-(r/r_b)^2)` and Schwarzschild exterior through
asymptotically flat infinity. The SI scale remains deferred. No interpolation,
optimization, candidate solve or parameter retuning occurred.

The primary-source member check is definition-only. Raghoonundun and Hobill
define `mu=1` as the natural-star density profile and define compactness as
`M/r_b`; their causal boundary lies above `0.27` for the reported natural-star
range. Neary, Ishak and Lake independently give the natural Tolman-VII exact
relation `r_b/M=5/beta_N^2`, so the source-coordinate choice `beta_N=1` fixes
`M/r_b=1/5` algebraically. This uses no new candidate evaluation and avoids
confusing Neary's radius parameter `beta_N` with the compactness symbol used in
the G2F handoff.

## Repository verification evidence

The applicable verification completed on August 23, 2026:

- math-stage report and validation: `318` registry entries, validation `PASS`;
- root-to-leaf physics manifest validation: `PASS`;
- complete required GR/WARP suite: `18` files and `179/179` tests `PASS`;
- Casimir adapter run `2459`: verdict `PASS`, `firstFail=null`, no deltas,
  certificate `GREEN`, integrity `true`, SHA-256
  `6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`;
- training-trace export: `artifacts/training-trace.jsonl`.

The first request made during this final check returned the fail-closed
`503 api_bootstrapping` response before the API route mount completed. It did
not create a verification result. Run `2459` is the sole successful
current-tree verification result cited here.

This Casimir result verifies applicable repository guardrails; it does not
admit the selected candidate or establish a classical, semiclassical or
physical result.

## Authority closure

```text
candidate_evaluations = 0
candidate_execution_authorized = false
candidate_admitted = false
classical_proof_established = false
geometry_state_accepted = false
lane_execution_authorized = false
independent_replay_ready = false
diagnostic_lamp = false
physical_viability = false
propulsion_authority = false
transport_authority = false
```

G2F is therefore closed. Only the definition-only G2G preregistration packet is
active; it authorizes no evaluator, solver, quantum mode calculation or output
root.
