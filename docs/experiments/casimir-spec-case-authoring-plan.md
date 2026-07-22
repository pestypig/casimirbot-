# Casimir Spec Case Authoring Plan

Status: design candidate only. This is not a benchmark case pack, does not
contain held-out gold, and does not authorize parser or prompt tuning.

## Purpose

This plan turns the benchmark contract into an auditable authoring process. It
keeps public examples useful for implementation while assigning calibration and
confirmatory material to an independent evaluator custodian outside the source
checkout.

The benchmark target is the uniform average across 66 cells formed by six
scientific domains and eleven primary challenge strata. Each problem receives
one primary cell and may have secondary hazard tags. The cells are a deliberate
stress-test population, not an estimate of real-world scientific prevalence.

## Roles and visibility

| Role                | May see public/development gold         | May see calibration/held-out prompts or gold        | May tune the candidate     |
| ------------------- | --------------------------------------- | --------------------------------------------------- | -------------------------- |
| System implementer  | Yes                                     | No                                                  | On public/development only |
| Benchmark custodian | Yes                                     | Yes                                                 | No                         |
| Candidate runner    | Tasks and frozen source projection only | Tasks and frozen source projection only at run time | No                         |
| Semantic rater      | Frozen source projection and gold       | Frozen source projection and gold                   | No                         |
| Analysis joiner     | Locked scores and arm map               | Locked scores and arm map                           | No                         |

The runner seals response bytes and metadata before the scorer receives gold or
the analysis service receives arm identity. Human scoring is described as
metadata-blinded, not content-blinded, because formal syntax may reveal the arm.
Opaque rater aliases do not establish real-person identity, qualification,
conflict freedom, or independence. A trusted external resolver must verify those
properties for both initial raters and every third reviewer before any result is
promotion-eligible.

## Seven authoring and freeze steps

1. Write source-grounded problem families and connect all variants in a leakage
   graph using problem, paraphrase, notation, source-variant, template,
   gold-semantic, and discriminating-source identities.
2. Assign each transitive component to one split with the precommitted grouped
   stratifier; never split individual variants.
3. Build the exact task bytes and one source delivery projection containing the
   corpus, chunks, index, and retrieval-tool manifest shared by every
   source-using arm.
4. Have domain authors create arm-neutral gold: required and forbidden
   assertions, unknowns, exclusions, blockers, tolerances, source support,
   false-certification opportunities, and frozen Lean/Lanyon eligibility.
5. Run independent scientific review, near-duplicate/leakage review, and the
   deterministic contract/tamper battery. Corrections occur before hashing.
6. Before candidate implementation, the custodian calibrates raters and
   scorer/run infrastructure with pre-authored arm-neutral response exemplars
   and synthetic execution fixtures for the blinded-calibration cases. No
   candidate or baseline outputs are generated, and no effect or direction
   exists to release. A failed reliability or infrastructure gate requires a
   revised version before implementation tuning.
7. Freeze all byte hashes, keep the restricted bundle and salt off-repo, publish
   the salted aggregate commitment plus an external timestamp, and execute the
   confirmatory run only after the candidate is locked.

## Allocation

For every domain-by-stratum cell, author one public, two development, two
blinded-calibration, and fifteen confirmatory-held-out problem groups. The
held-out groups divide evenly into five direct, five compositional, and five
adversarial tasks. This yields 66 public, 132 development, 132 calibration, and
990 held-out groups.

Version 1 admits exactly one scored evaluation task per problem group. Related
paraphrases, notation choices, and source variants are recorded as leakage
identities for split isolation; they are not counted as additional independent
benchmark rows.

Exactly 528 held-out groups are safety-critical: eight per cell, with two
direct, three compositional, and three adversarial assignments in each cell.
The assignment is fixed in gold. A group-level safety failure is any prohibited
false certification in any of its three replicate slots.

## Case anatomy

Each authored problem must bind:

- opaque case, problem-group, leakage-component, and evaluation-alias IDs;
- one primary domain, one primary challenge stratum, difficulty, and secondary
  tags;
- exact task bytes and exact model-visible source projection;
- source provenance and untrusted-evidence-only authority;
- expected definitions, semantic identities, proposition, quantifiers,
  assumptions, axioms/imports, approximations, error contracts, units, frames,
  observables, bridges, domains, and four-axis statuses as applicable;
- required unknowns, abstentions, blockers, and excluded claims;
- allowlisted deterministic predicates or blinded-human criteria, never
  arbitrary evaluator code or arm-specific regex rewards;
- every false-certification opportunity, including opportunities on which the
  correct answer is silence, abstention, or a blocker; and
- Lean and Lanyon eligibility determined before any candidate output exists.

Correct plain language can satisfy semantic criteria. Casimir syntax, Lean
syntax, verbosity, certificate appearance, or ledger shape is not itself a
scoring criterion.

## Initial AdvectionDiffusion-derived public/development families

These are authoring families, not hidden cases. All variants in a family remain
in one leakage component.

| Family                                                              | Required scientific resolution                                                                   | Prohibited promotion                                      |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------- |
| Missing PDE initial or boundary conditions                          | Block executable/full-solver admission and name the missing contracts                            | Complete simulation or prediction                         |
| Anisotropic tensor with positive diagonal but a negative eigenvalue | Reject diagonal positivity as sufficient; require coercivity or a declared equivalent            | Physically admissible diffusion from diagonal signs alone |
| Zero advection speed with generated division by `abs(a)`            | Surface the runtime-precondition/refinement gap or require a zero-speed branch                   | C safety from the real-valued algebraic theorem           |
| Lean `Real` versus C `double`                                       | Separate exact formal property, generated correspondence, floating-point bound, and runtime test | Implementation correctness from a real-number proof       |
| Local flux/reconstruction theorem with a broad title                | Score the exact proposition and assumptions; treat the title as metadata                         | Solver convergence, stability, or well-posedness          |
| Generated numerical kernels with no driver                          | Identify missing mesh, boundary handling, integrator, CFL, output, and convergence receipts      | End-to-end verified simulation                            |
| Reaction-diffusion request outside the frozen adapter family        | Keep the claim open-world and block Lanyon admission                                             | Silent coercion into supported advection-diffusion        |
| Complete scalar diffusion positive control                          | Admit only the property and backend stages whose prerequisites are actually present              | Physical truth or empirical validation                    |

The broader matrix must also cover detector/latent-observable bridges,
accelerating versus inertial frames, Kelvin/Celsius and diffusivity dimensions,
lexical symbol collisions, hidden choice/import axioms, `noncomputable` versus
unresolved or independence-not-established, empirical-fit mechanism overclaim,
out-of-catalog operators, source prompt injection, altered theorem scope, and
recomputed self-hashes against stale external commitments.

## Review and acceptance

Every cell requires domain review and a second claim-boundary review. The
calibration gate requires at least 90% raw VCR agreement, 95% item agreement,
and fixed binary two-rater Gwet AC1 of 0.80 before adjudication. Reliability is
computed from initial labels, not post-adjudication labels, and must be reported
for overall VCR, pooled items, each gate family, and false-certification
opportunities. Every item disagreement is resolved by a third blinded
adjudicator; a commitment-ranked `ceil(10%)` sample of initially agreed item
keys is also audited. Missing or extra third reviews invalidate the population.

At 990 held-out groups, five-point/80%-power planning is conditional on mean
within-cell problem-level paired-difference variance no greater than 0.315.
Version 1 fixes `n=990` before candidate implementation and does not adapt it
from calibration or candidate outputs. The final report gives the interval and
the relevant sensitivity without retroactively claiming guaranteed power.

No benchmark asset may be called frozen until exact artifacts, the restricted
bundle commitment, model/prompt/tool pins, evaluator implementation, split and
near-duplicate audit receipts, calibration decision, and external timestamp all
verify.
