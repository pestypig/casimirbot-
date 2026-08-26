Program gate: G2H-E-S5
Workstream: S5-A / A4
Capability or component: persistent analytic derivative ledgers Fprime, E1prime, E2prime
Current maturity: candidate-neutral implemented and independently audited primitive
Target maturity: source-complete derivative-convolution inputs for the frozen orientations
Required frozen inputs: stable F/E1/E2 ledgers, exact parameter identity, and audited derivative model
Required evidence: coherent three-ledger geometry, all-prefix digest locks, atomic triple commit, stable publication, terminal first failure, corruption replay
Stop/fail criteria: partial append, source or parameter drift, geometry mismatch, resource overrun, candidate ingress, protected-root creation, or authority change
Explicit non-goals: H2/P2 reinterpretation, derivative convolution execution, handler linkage, candidate evaluation, Rust/G3/SI/metric/lane work, or authority promotion
Downstream gate unlocked: frozen E1-diamond-H2, F-diamond-P2, and E2-diamond-H2 orientations after H2/P2 close

# G2H-E-S5 A4 C08 analytic factor derivative-ledgers progress receipt

Date: August 25, 2026

## Result

The candidate-neutral primary C++ persistence component now consumes the three
stable `F/E1/E2` ledgers and atomically publishes three corresponding
`Fprime/E1prime/E2prime` ledgers. It binds unique, source-disjoint identities,
requires exact geometry/order coherence, locks every accepted source prefix by
digest, locks the analytic parameter identity, validates all three pending
outputs before commit, preserves prior publications, and makes the first
finite model/resource failure terminal.

The strict isolated fixture passes 15/15. The independent recursive runtime
audit passes 45/45, including the complete predecessor chain, exact source
inventory, two deterministic isolated executions, executable identity,
source-prefix mutation, parameter mutation, identifier collision, and
protected-root guards.

## Exact identities

| Artifact | SHA-256 |
| --- | --- |
| header | `ebe1a09954f70997b3edbfa9e6eae5a3d7a0be0df561ccb57581a2ca0cafe983` |
| implementation | `296ed9312bc13d2f8e94195b5925244685dadc41f7fad7a61800891f4c69cef9` |
| fixture | `2fcc66989e85c11ccfed364777634cfee0fab0c5c9a9610b6c2875dbc4a86f61` |
| Dockerfile | `62747d26609dac177e182b956e656b52d9b9a78a516f4e7787e8b79e2dd912ea` |
| independent audit | `e4b309e1296e68216297f85cf3550d976ce4a87c6e36091bba984d57c83fb8a2` |
| executable | `5e5af69db6de193f6aadc4cbc35f61372b82f19cb2e6a7445096ddf3c152655e` |
| audit image | `sha256:7bb6922ac42a420585aba1964ce406400e5332bbba27052fd912ecf9613d50ae` |

## Authority boundary

Candidate evaluations and positive parameter samples remain zero. Both
candidate roots, authorization, token, and execution ledgers remain absent.
H2 remains a separate running prerequisite and P2 remains provisional.
No derivative convolution output exists yet, C08-011c remains incomplete, and
the scientific handler remains unlinked. No candidate, proof, geometry/state,
lane, lamp, physical, propulsion, or transport authority changes.
