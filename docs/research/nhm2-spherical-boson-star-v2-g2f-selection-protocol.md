Program gate: G2F — fresh classical-control candidate selection
Workstream: authenticated classical control branch
Capability or component: outcome-blind eligibility, scoring and selection protocol
Current maturity: protocol definition; no eligible scientific candidate selected
Target maturity: immutable pre-literature protocol binding for one bounded selection
Required frozen inputs: closed G2C/G2D evidence, G2E result and G2F active packet
Required evidence: protocol digest, primary-source evidence rows and independent replay
Stop/fail criteria: G2D reuse, pool/rubric mutation after search, missing hard minimum or unresolved tie
Explicit non-goals: candidate evaluation or execution, solver implementation, G3, lanes, lamp or physical claims
Downstream gate unlocked: evidence collection and deterministic G2F scoring only

# G2F outcome-blind selection protocol

Status: frozen before the G2F literature assessment.

This packet changes planning and selection semantics only. It changes no field
equation, runtime authority, receipt semantics, candidate admission or physical
claim. The digest stored beside this file binds the exact protocol bytes before
new G2F searches or score assignments begin.

## Immutable exclusions

The following are ineligible regardless of their later score:

1. the closed G2D constant-density perfect-fluid member at `chi=1/4`;
2. any constant-density, interior-Schwarzschild, incompressible-fluid or
   algebraically equivalent rename/reparameterization of that member;
3. its candidate ID, frozen source set, authorization token, command, output
   root or any alternate root intended to reproduce or replace its one shot;
4. any member whose parameters are chosen after observing a new numerical
   result;
5. any family requiring a singular material shell at the matching surface
   unless that shell is part of a primary-source definition and the later
   proof/QFT contracts explicitly include it; and
6. any proposal whose known construction lacks a regular origin, a complete
   exterior through infinity or a credible globally defined quantum-state path.

G2F authorizes literature assessment only. It authorizes zero candidate
evaluations, zero solver invocations and zero scientific output roots.

## Frozen candidate pool

The literature review may score exactly these five identities and may not add,
rename, merge or substitute one after searches begin:

| ID | Frozen family-level interpretation |
| --- | --- |
| `TOLMAN_VII_ISOTROPIC_FLUID_SCALAR_QFT_CONTROL` | Regular Tolman VII isotropic perfect-fluid interior, vacuum exterior and a free scalar Hadamard-state control |
| `BUCHDAHL_GASEOUS_FLUID_SCALAR_QFT_CONTROL` | Buchdahl's finite-radius gaseous perfect-fluid solution, vacuum exterior and a free scalar Hadamard-state control |
| `GROUND_STATE_ELL1_BOSON_STAR_SCALAR_QFT_CONTROL` | Fundamental nodeless spherical `ell=1` boson-star family and a free scalar quantum control on the accepted background |
| `FUNDAMENTAL_SPHERICAL_PROCA_STAR_SCALAR_QFT_CONTROL` | Fundamental nodeless spherical Proca-star family and a free scalar quantum control on the accepted background |
| `QUADRATIC_REAL_SCALAR_OSCILLATON_QFT_CONTROL` | Fundamental spherical real-scalar oscillaton with quadratic potential and a compatible quantum-control path |

The first two are finite-interface analytic-fluid leads, the next two are
independently reproducible solitonic leads, and the oscillaton is retained as a
time-dependent negative control. No score or selection is implied by inclusion.

## Evidence admission

Only primary sources may support a positive score: original peer-reviewed
papers, author manuscripts/preprints, journal articles reporting the authors'
own calculations, or official machine-readable data/code deposited by those
authors. Review papers may locate primary sources but cannot raise a score.

Each positive score requires a source identifier and a precise evidence note.
If a source is inaccessible, ambiguous, or supports only a nearby family, the
claim is unresolved and receives the lower score. Absence from the bounded
search is recorded as `not found`, not as proof that no literature exists.

The result packet must preserve:

- every exact query string and query date;
- every scored primary source with DOI/arXiv/stable URL;
- negative searches and unresolved questions;
- every score reason and rejection reason; and
- the protocol digest and a fresh digest verification.

The search stops after all frozen identities have at least one classical query,
one domain/matching query and one QFT/Hadamard/RSET/noise query, plus targeted
follow-ups needed to resolve an already found primary-source claim. The search
must not expand the candidate pool.

## Hard eligibility

A row is eligible only if all of the following are true:

- `N=2`: genuinely distinct from G2D under the immutable exclusions;
- `D=2`: the evidence defines or unambiguously supplies the regular origin,
  interior, every interface, exterior and asymptotic/infinity behavior;
- `P>=1`: a finite, falsifiable classical proof program can be specified;
- `Q>=1`: a credible Hadamard-state, renormalized mean-stress and connected
  stress-noise route exists on the same accepted background;
- `B>=1`: at least one independent benchmark or cross-implementation path is
  identifiable; and
- a member-selection rule can be frozen from source-defined quantities without
  executing or inspecting a new candidate.

Failure of any hard condition makes the row ineligible even if its total is
larger than another row's total.

## Frozen score axes

Every axis is an integer in `{0,1,2}`. Unsupported or uncertain evidence is
rounded down, never up.

| Axis | `0` | `1` | `2` |
| --- | --- | --- | --- |
| `N` — nonreuse | excluded/equivalent to G2D | distinctness unresolved | demonstrably different matter profile or field system |
| `D` — domain completeness | missing region/interface/infinity | completion requires a nontrivial unstated construction | primary sources give a regular origin, full interior, matching/exterior and infinity behavior |
| `P` — proof tractability | no bounded proof route | numerical existence/convergence route with substantial interval-proof work | analytic identities or a directly bounded validated-numerics route cover the classical duties |
| `Q` — quantum-state path | no credible same-background route | general Hadamard/RSET/noise machinery is applicable but no same-family full chain is demonstrated | primary sources directly compute or construct same-family state/RSET and provide a direct connected-noise extension or result |
| `B` — independent benchmark | no independent comparator | published profiles/observables permit comparison | independent implementations, convergence data or exact identities permit source-disjoint replay |
| `V` — vacuum/flat connection | absent or incompatible | plausible limit but proof obligations are not directly supplied | explicit continuous limit with controllable boundary/asymptotic behavior |
| `R` — regularity and robustness | known singular/unstable selected regime | regular branch exists but stability/causality margin needs a new bound | primary evidence supplies regularity plus a stable/causal member region |
| `F` — workstation feasibility | clearly exceeds bounded local resources | feasible only after substantial new numerical infrastructure | analytic or bounded spherical computation is credible on the existing workstation |

## Frozen ranking and stop rule

For each eligible row define

```text
minimum = min(D, P, Q, B, V, R, F)
total   = N + D + P + Q + B + V + R + F
rank    = (minimum, total, Q, P, D, B, V, R, F)
```

Ranks compare lexicographically from left to right, larger first. `N` is a hard
gate and contributes to the total but cannot break a tie because every eligible
row has `N=2`.

Selection occurs only if exactly one eligible row has the maximum rank. An exact
rank tie, no eligible row, inadequate evidence for a member-selection rule, or
any protocol-integrity failure produces `NO_SELECTION`. Candidate IDs are not a
tie-breaker. The result may select at most one identity.

## Member-selection rule constraint

The winning family, if any, must use a source-defined branch coordinate and a
pre-result deterministic rule. The G2F result must freeze either an exact member
already tabulated by a primary source or a unique rule such as the lowest listed
member satisfying source-stated regularity/stability margins. It must also
freeze all hard falsifiers and a new candidate identity. Interpolation,
optimization, retuning or choosing the easiest-looking member after a solve is
forbidden.

## Independent replay contract

An independent replay must parse only the frozen protocol plus the final
evidence matrix, independently recompute hard eligibility, ranks, tie handling
and the selected ID/`NO_SELECTION`, and compare every result field. It must not
import or call the primary selector. A one-check document assertion is
insufficient; the replay must exercise exclusions, hard-gate failure, unique
winner and exact-tie stop behavior with synthetic fixtures in addition to the
final matrix.

## Authority locks

Throughout G2F:

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

