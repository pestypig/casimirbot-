Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.COMMERCE / CFP-1.OFFER D07 independent hard-budget review
Capability or component: T10 trial and P50 paid hosted-workload and useful-journey specification
Lifecycle stage: independent specification review before CFP-3 implementation and CFP-4 installed execution
Reaction timescale: each first-party request, five-minute room lease, 120-second native action, seven-day trial and monthly paid term
Authority owner: Independent reviewer assesses the frozen fixture; CFP-3 implements it; CFP-4 executes it; product owner and D11/D12 retain final term authority
Current maturity: specified
Target maturity: bounded-policy input with later deterministic implementation, installed execution and final commercial acceptance
Required evidence: corrected T10/P50 packet, current workload hash, arithmetic, source links, protected-reserve rules and stage boundary
Explicit non-goals: no current enforcement, installed result, final price, customer promise, D07 closure, D11 disposition, provider mutation or stage promotion
Downstream gate unlocked: D07 hosted-workload and T10/P50-usefulness rows may advance from missing to bounded policy only

# CFP-1 D07 T10/P50 hard-budget independent review — 306

Date: 2026-09-21  
Review target: [T10/P50 usefulness and hard-budget freeze](../../../work-packets/eh-g8-cfp1-d07-t10-p50-usefulness-and-hard-budget-freeze-v1.md)

## Review method

An independent reviewer recomputed the request, CPU, memory, compute-unit,
database-union, lease, effect, egress and retained-data ceilings; checked the
ordinary/protected request split and the non-borrowable reserve for every
unresolved effect; inspected the T10/P50 success, denial, waste, restart,
replay, expiry and handoff fixtures; verified stage ownership; and checked the
linked Replit allocation evidence and working-byte identities.

The first review found five material specification defects: binary/decimal
memory units were mixed, the deployment-allocation source was not linked,
ordinary polling could consume the protected pool, per-effect protected
capacity was not reserved, and denial traffic was treated as free. Those
defects were corrected. A subsequent review found one stale D07 workload hash;
that hash was updated and the final bytes were re-reviewed.

Final review target SHA-256:
`55D58E2AC447A3D8AD82B59AE4BCD1BDF543F423E759921DD796E039ED4F86DC`.
The target records the current workload SHA-256
`C51E7DD4A828AEA9CB698BC713EA334AF6D566D8557242DF07362B1F7D2A972C`.

## Final verdict

**PASS for the T10/P50 numerical fixture and stage-correct specification.**
The reviewer independently confirmed the trial ceiling of `53,508` compute
units and the paid ceiling of `147,147` compute units. GiB-to-decimal-GB
conversion, 120/600-minute database-union limits, waste-denial accounting,
useful success cases, protected capacity and handoff-as-denial treatment all
pass.

This review supports changing only the D07 `Hosted workload` and `T10/P50
usefulness` rows from `missing` to `bounded_policy`. It does not make either
row `bounded`, accept `$20/P50/T10` as customer terms, close D07 or CFP-1, or
prove current enforcement. CFP-3 must implement the deterministic counters and
denials; CFP-4 must execute the signed installed fixture. Any execution failure
reopens D07/D12.

