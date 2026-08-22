# NHM2 Spherical Boson-Star v2 G2B-M1-R2 Proposal

Program gate: G2B-M1-R2 — sole midpoint-screen deletion rerun

Workstream: versioned classical-branch repair review

Capability or component: rerun the unchanged MPFR256 multiple-shooting solve
after deleting one independently disproved screen

Current maturity: R1 repair decision sealed; R2 runner not yet implemented

Target maturity: one immutable center/codec classification or upstream failure

Required frozen inputs: M1 receipt
`e2b1080103f2fe3b9d35e6c5f00bc4bf243b3d48409d649dbe3581c1191f105b`;
R1 receipt
`2b93eaac7c939d2bfc4e7cbdc92873f87b1f233669f3cce71395de6967d63300`;
unchanged engine
`85e60d3b3393630b3b21eb1f9e2e6ebd8c2bd61547e6554e89fa2c01796af6de`;
unchanged proposal physics, mesh, refinements, Newton chronology, thresholds,
exact center duty, and 128-mode classifier

Required evidence: static diff proving the sole semantic deletion; source/spec
hashes; focused tests; absent new output; both independently initialized solves;
complete failure/success receipt; exact center and projection classifications;
no retry and false authority

Stop/fail criteria: any change besides removing the global encoded midpoint
screen and its diagnostic field; input/hash drift; existing output; incomplete
receipt; changed solve or threshold; retry; authority promotion

Explicit non-goals: weakening the `1e-10` core rail; changing mesh, precision,
RK4, Newton, damping, refinement agreement, center encoding, projection, or mode
count; later proof duties; candidate, lamp, physical, propulsion, or transport
authority

Downstream gate unlocked: a codec/mode-count successor if the center passes, a
G2B proof-center attempt if both pass, or a terminal upstream falsifier

Change class: versioned one-defect implementation correction; no authority

## Sole correction

Delete this M1 screen and only this screen:

```text
maximum normalized cubic-Hermite midpoint ODE residual on the encoded output
mesh <= 1/10^10
```

R1 proves that the binary64 evaluator rejects `y=x`, whose true second
derivative is exactly zero. The screen is not replaced with a result-derived
threshold. Every upstream high-precision convergence check and both downstream
exact classifiers remain literal and unchanged.

The exact R2 command remains unauthorized until the additive runner/spec are
hashed in a pre-execution checkpoint.
