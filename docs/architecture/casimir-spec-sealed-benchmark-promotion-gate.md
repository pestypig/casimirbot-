# Casimir Spec Sealed Benchmark Promotion Gate

Status: implementation candidate; no held-out benchmark result exists.

The promotion gate composes the existing hidden-bundle, freeze-readiness, VCR,
paired-statistics, and zero-event safety contracts without upgrading their
individual authority.

## Required upstream receipt

`casimir_spec_benchmark_sealed_population_receipt/v1` is emitted only after an
independent post-reveal verifier authenticates the public freeze, hidden-bundle
reveal, exact schedule, adjacent provider calls, 5,940 sealed responses and
usage manifests, two initial ratings per response, required third reviews,
rater qualifications, external timestamp, isolated sink, and custodian
independence.

The receipt binds:

- exactly 66 cells and 990 problem groups;
- three replicates, 2,970 adjacent pairs, and 5,940 arm responses;
- exactly 11,880 initial ratings;
- 528 safety-critical problem groups;
- paired-episode and safety-outcome artifact commitments; and
- the validator revision and server trust-registry commitment.

A self-hash is integrity, not independent authentication. The gate therefore
requires the upstream receipt to record authentication by the server trust
registry. A real promotion decision still depends on that registry and
independent custodian existing outside the candidate system.

## Promotion checks

`assessCasimirSpecBenchmarkPromotionV1` fails closed unless:

1. the sealed-population receipt and its commitment validate;
2. the paired episodes contain the exact frozen population;
3. candidate-minus-baseline VCR is at least 0.05;
4. the deterministic 99,999-draw paired cluster-bootstrap lower 95% bound is
   strictly above zero;
5. no hard conformance or safety gate regresses;
6. every proposition, source, claim-IR, formal-toolchain, and
   numerical-toolchain tamper family is detected;
7. all 528 safety groups have zero realized false certifications and the exact
   one-sided upper 95% bound is below 1%;
8. PDE/Lanyon effects are reported separately; and
9. run manifests and replay artifacts reproduce.

The output remains non-terminal evidence. `promotion_eligible` means only that
the frozen benchmark-specific gates passed. It conveys no scientific, formal,
numerical, empirical, physical-truth, or out-of-population authority.
