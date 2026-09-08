# Independent qu matching overlap

Exploratory snapshot, September 7, 2026. Previous turn established a library mass-input mismatch. This packet resolves that mismatch for an isolated comparison without changing the physical reference point.

## Result

The qu1 and qu8 terms in the selected Hamiltonian matching agree with the independent library expression at all three tested scales: 80.379, 173 and 300 GeV. Maximum relative complex-coefficient difference is **1.214e-10**. Both sides use mt=173 GeV, MW=80.379 GeV and v=246.2 GeV for this comparison only. This is numerical overlap of these probes, not a new mass convention for the candidate.

## Convention bridge

The library expression is the authenticated VddLL matching expression extracted in the preceding packet, with its original fixed loop mass. Its general-flavor matching is based on [Dekens and Stoffer](https://arxiv.org/abs/1908.05295). We compare against the qu1/qu8 first bracket in [Endo, Kitahara and Ueda, Eq. 2.24](https://arxiv.org/pdf/1811.04961).

For each probe the only input is Cqu_1133 in the up basis. The right-handed pair is therefore top, while rotating the first pair produces Pu in the down basis. After subtracting the zero-coefficient result, rotate all four external indices of VddLL:

`Ldown_ijkl = sum_abcd V*_ai V_bj V*_ck V_dl Lup_abcd`.

The compared Hamiltonian coefficient is `H_sd=-Ldown_sdsd`. The analytic counterpart is `pref Pt_sd Pu_sd amplitude factor I1`, with pref=g2^2/(16 pi^2) and factor=-4 for qu1 or -2+2/3 for qu8. A separate pure-qq tensor rotation agrees with the expected tree coefficient -amplitude Pu_sd^2 to 1.2e-16 fractionally; no extra factor of two is introduced.

## Numerical controls

The [script](casimir-dp-axion-qu-independent-overlap-2026-09-07.py) authenticates both the extraction script and archived CKM definitions. It records real and imaginary parts and complex ratios in [JSON](casimir-dp-axion-qu-independent-overlap-2026-09-07.json), and asserts all six overlap checks.

An initial 1e-9 GeV^-2 probe suffered cancellation when subtracting the SM tensor, reaching 1.22e-7 relative error. The final **algebraic** probe uses 1e-6 GeV^-2 in an expression linear in this isolated coefficient; it is not a physical allowed point. With the same unchanged acceptance threshold, the residual falls below 1.3e-10. Increasing probe size changes numerical conditioning, not the analytic formula or frozen candidate. No library files are modified.

The physics root-leaf documentation check passes separately. Numerical overlap does not establish a physical uncertainty at this precision.

## Next comparison

This independently supports the qu matching color factors, Hamiltonian sign, scale dependence and flavor rotation on the up-aligned probes. It does not validate arbitrary flavor tensors, the current terms, the qq J/K completion, full SM evolution, high-energy matching, or kaon observable conversion. Next apply this common-input procedure to the current and qq sectors, keeping broader gauge and finite-scheme terms distinct before revising the shared xenon/coherence parameter screen. Goal remains active; no candidate rates or model-admission status change.
