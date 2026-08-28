Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P6 parent-ledger binding to the exact-equivalent 16-thread selector
Current maturity: H2/P2 ledger sources implemented; H2-P3 parallel selector exact-equivalent; H2-P5A-R2 turnaround binding PASS; parent still invokes the serial selector
Target maturity: H2 and P2 parent ledgers explicitly bound to the 16-thread prepared selector, fixture-audited without a full selector execution
Required frozen inputs: H2 header `55ef4952...cdb8`, H2 source `cbfcae53...5d7f`, P2 header `37f24731...8e5`, P2 source `d3419563...eabe`, selector header `003baafd...a96`, selector source `060d8b11...bfa`, and P5A-R2 audit `64bd7c16...61f1f`
Required evidence: one fixed 16-thread constant, exact H2/P2 result propagation, parallel-selector call binding, compile/static fixtures, independent source audit, unchanged candidate-neutral locks and no protected root
Stop/fail criteria: selectable or environment-derived thread count, changed arithmetic/schedule/reduction order, serial fallback, nested parallelism, candidate ingress, full-selector execution, retry/retune path, root creation or authority promotion
Explicit non-goals: executing the long H2 parent fixture, running a full selector, frozen-candidate evaluation, positive sampling, authorization/token/output-root creation, handler linkage, G3, SI/metric, lanes, lamp, physical viability, propulsion or transport
Downstream gate unlocked: a separately frozen candidate-neutral H2 parent execution packet using the already authorized machine class and measured turnaround; no VM or execution authority

# H2-P6 parent runtime binding

Status date: August 27, 2026.

This packet changes runtime binding only. It changes no mathematical formula,
precision, jet order, dyadic schedule, width threshold, first-passing rule,
subpanel reduction order, candidate identity or receipt authority.

## Frozen implementation

1. Add exactly one compile-time H2 selector thread count of `16`.
2. Replace the H2 parent's serial `selector::evaluate` call with
   `selector::evaluate_prepared_parallel` using that constant.
3. Record the fixed thread count in H2 results and propagate it through the P2
   adapter.
4. Retain sequential refinement candidates, ordinal subpanel storage, serial
   ordinal reduction, FLINT single-threading inside workers and every existing
   terminal-first-failure rule.
5. Exercise only compile/static linkage and existing bounded manufactured
   fixtures in this packet. The two-selector parent execution remains a later
   separately frozen and authorized action.

## Evidence boundary

H2-P3 already proves exact cross-thread semantic equality, and H2-P5A-R2
measures the exact `P=1024` call surface at 16 threads. P6 therefore binds the
proved implementation into the parent; it does not repeat either experiment
or infer a scientific result.

No cloud resource, selected member, full selector, protected root or authority
is authorized by this packet.
