# B-L scalar quartic boson-star envelope

Date: September 25, 2026. This packet asks whether the heavy scalar in the B-L LZ proposal could also support the Sgr A*-scale structure motivating the boson-star branch. It is an optimistic scale envelope, not a numerical star solution.

## Model connection

The [2026 B-L inelastic scalar paper](https://arxiv.org/html/2609.06909) includes the self-interaction \(V\supset (\lambda_1/2)|\phi_1|^4\), with \(\phi_1=(S+iP)/\sqrt 2\), and discusses few-TeV \(S\) dark matter. This creates a direct same-field candidate to test against the user’s boson-star motivation. Its splitting notation remains unresolved; see the [separate mass-gap audit](casimir-dp-bminusl-splitting-notation-audit-2026-09-25.md).

For an intentionally favorable comparison, use the standard strong-repulsive-quartic scaling for a minimally coupled complex scalar,
\[
M_{\max}\simeq0.062\sqrt{\lambda_{\rm eff}}\,\frac{M_{\rm Pl}^3}{m_S^2},\qquad
V_{\rm quartic}=\frac{\lambda_{\rm eff}}4|\phi_1|^4.
\]
The paper’s normalization corresponds to \(\lambda_{\rm eff}=2\lambda_1\). This scaling is an upper-envelope diagnostic: it assumes the conserved-charge complex-scalar system for which the scaling was derived, while the B-L theory is gauged, broken to a residual discrete symmetry, and has split real states. Gauge fields, the symmetry-breaking scalar, and the actual S/P dynamics may change or remove the relevant branch. [Colpi, Shapiro & Wasserman](https://doi.org/10.1103/PhysRevLett.57.2485) established the repulsive self-interaction enhancement; this calculation does not transplant their solution as if it were the B-L solution.

## Results

The [reproducible script](casimir-dp-bminusl-quartic-star-envelope-2026-09-25.py) and [JSON output](casimir-dp-bminusl-quartic-star-envelope-2026-09-25.json) use the existing 1–5 TeV grid, a \(4.02\times10^6 M_\odot\) reference mass, and \(\lambda_{\rm eff}=4\pi\) as an explicit perturbativity comparison (not a sharp universal bound).

At this quartic, the idealized upper envelope is about \(1.4\times10^{-8}\)–\(3.6\times10^{-7}M_\odot\), still roughly 13 orders below the reference Sgr A* mass. Matching that reference in the same asymptotic formula requires \(\lambda_{\rm eff}\sim1.6\times10^{27}\) at 1 TeV, rising to \(9.9\times10^{29}\) at 5 TeV. Those values are far outside perturbative control, so the formula cannot be used to claim a viable star there. The free-field Kaup values in this calculation reproduce the prior \(\sim3.4\times10^7\)–\(1.7\times10^8\) kg estimate.

## Disposition

This disfavors the minimal perturbative quartic route to making the *same few-TeV B-L scalar* an Sgr A*-mass free-standing boson star. It does not exclude a compact heavy scalar object at a much smaller mass, a different nonperturbative potential, a gauged soliton with other conserved quantities, a composite/aggregate object, or the separate ultralight-star plus heavy-recoil multicomponent architecture. No stability curve, formation history, or LZ rate is computed here.

The next useful branch is therefore the explicit two-component model already in the overlay: retain the ultralight field for star-scale gravity and the heavy scalar/IDM-like sector for nuclear recoil, but test a microphysical production connector without presuming that the same heavy field forms the star. The notation ambiguity must still be resolved before using the B-L recoil spectrum. The scaling scripts have not solved the exact gauged Einstein-matter equations; any positive same-field star claim needs that solve, not extrapolation of this envelope.
