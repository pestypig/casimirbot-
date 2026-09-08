Program gate: G2H-E-S5-A4 — P8P observer progress and turnaround calibration
Workstream: candidate-neutral existing-evidence retrieval
Capability or component: R43 attachment-alias/resource-identity predicate
Current maturity: locally tested inert predicate; not integrated for execution
Target maturity: bounded retrieval successor ready for separate authorization
Required frozen inputs: preserved R42 command receipts 03 and 04; unchanged R40 archive identity
Required evidence: actual-response regression, adversarial resource substitutions, composed successor tests before freezing
Stop/fail criteria: any identity mismatch; no reuse of exhausted R42 authorization
Explicit non-goals: cloud execution, original VM restart, build, numerical execution, candidate evaluation, evidence deletion, scientific authority promotion
Downstream gate unlocked: preparation of an integrated retrieval successor, not scientific execution

# R42 outcome and R43 local correction

R42 executed once and failed at `clone_configuration` before start dispatch.
Its `result.json` reports `startAttempted=false`, `archiveVerified=false`.
Both describe receipts report TERMINATED. No new cloud mutation or download
was issued by R42. Raw receipts remain in
`artifacts/nhm2/g2h-e-s5/candidate-neutral/h2-p8p-r42-retrieval-v1-20260905`.

The clone resource is `nhm2-h2-p8p-r39-evidence-clone-20260904`;
its attachment alias is `nhm2-h2-p8p-r39-evidence-clone`.
R42 wrongly equated these two fields. Its synthetic test fixture repeated
that assumption, so its 26 passing local tests did not cover the actual cloud
response. This is a test-coverage defect, not evidence of changed cloud state
or a scientific failure.

The additive inert `h2_p8p_r43_resource_guard.mjs` binds the resource URL and
attachment alias separately. It also requires full project/zone-qualified
identities, the two-disk inventory, clone read-only mode and retention, and
the observed boot/clone sizes. R42 files and captures remain unchanged.

`h2_p8p_r43_resource_guard.test.mjs` passes 20/20 local tests against the
preserved real JSON responses, including reproduction of the old failure and
18 adversarial mutations. Tests perform no SDK or cloud calls. This is not an
independent audit, complete retrieval verification, or scientific certificate.

Next: integrate this predicate into a separately versioned controller with
fresh output paths, review its actual SCP/cleanup boundary, and test that
composition against the recorded responses before freezing an authorization
packet. No R43 execution proposal is yet frozen; no billable action is
authorized here. The objective remains recovery of existing fixture evidence,
then an evidence-supported build correction, and only afterward a separately
authorized P=1024 calibration and frozen P8Q decision.

This patch changes only an inert infrastructure resource predicate and its
tests/documentation. Scientific math, proof maturity, certificates and
authority locks are untouched; no Casimir verification claim is made.
