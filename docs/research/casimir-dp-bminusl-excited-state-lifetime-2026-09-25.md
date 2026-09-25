# B−L excited-state lifetime under the splitting-notation fork

The split B−L scalar looked like a possible alternative to IDM because the literal reading of its quoted splitting opens carbon scattering. The source writes both `m_P^2-m_S^2=2 sqrt(2) A v_2` and `sqrt(m_P^2-m_S^2)=O(100 keV)`, while its earlier model uses the physical gap `m_P-m_S`. Those readings imply very different spectra, target kinematics, and state survival. The [2026 preprint](https://arxiv.org/html/2609.06909v1) supplies the off-diagonal `Z'` current and the resonant thermal-relic branch `g_BL≈0.5`, `m_Z'≈2m_S`.

## Calculation

For the off-shell transition `P -> S + nu nu-bar`, I used the source's effective derivative-current coefficient `C=g_BL^2/m_Z'^2` and B−L charge magnitude one for each of three light neutrino flavors. The massless-neutrino three-body spectrum is integrated as

```text
dGamma/dq2 = C^2 |p_S(q2)|^3 / (24 pi^3),
```

with `0 <= q2 <= (m_P-m_S)^2`. The exact finite-mass Kallen function is factorized in the implementation so the very small literal-read gaps are numerically stable. This is a conditional tree-level estimate: it uses the resonance relation and coupling specified by the paper, and does not include a complete neutrino-mixing/sterile-state branching calculation.

## Outcome in each interpretation

If `100–300 keV` is the physical gap `delta=m_P-m_S`, the Xe-131 248-keV recoil needs about `431–705 km/s`, while ground-state endothermic C-12 scattering is closed at the assumed `798 km/s` halo cap. Across the 1–5 TeV mass grid the excited-state lifetime is about `1.36e3` to `2.07e8 years`; even the longest is only 1/67 of the assumed cosmic age, so an un-replenished primordial `P` population is depleted. This reading retains the proposed xenon inelastic spectral shift but not an excited-state carbon bridge.

If instead the paper's literal `q=sqrt(m_P^2-m_S^2)=100–300 keV` is used, the physical gap is only `9.8e-4–4.5e-2 eV`. The calculated `P` lifetime is vastly longer than the Universe's age, and C-12 scattering is kinematically open. However, the xenon speed for 248 keV is then about `309–339 km/s`, effectively the elastic spectrum: the stated mass-squared scale no longer generates the claimed high-recoil inelastic shift. The existing generous independent-carbon event-count bound is still at most `3.72e-27` per frozen hold, less than `6.4e-25` of the registered one-sigma `D` precision.

Applying the stored `S -> P` carbon collision ceiling to inverse `P -> S` assumes the same near-degenerate cross section, halo flux, and maximal per-collision distinguishability; it is an event-count envelope rather than a computed exothermic material response. Thus the notation ambiguity toggles *which* bridge condition fails, but neither reading supplies a measurable common xenon/Casimir-DP channel. This does not exclude a new B−L model with a separate late-time excited-state source or a collective material interaction; either would be a new mechanism requiring a new relic and detector calculation. Resolve the source's intended parameter before using its xenon spectrum.

## Reproduction and limits

Run `python docs/research/casimir-dp-bminusl-excited-state-lifetime-2026-09-25.py`. The script reads and hashes the existing notation audit and carbon screen, evaluates all 24 mass/gap combinations, checks the `delta^5` lifetime split, and writes the companion JSON. Its results change strongly as `g_BL^4/m_Z'^4`; the numerical lifetimes are not model-independent. An order-one Majorana-current normalization change does not alter the qualitative result: eV gaps leave the state long-lived, while the physical 100–300 keV gap depletes it well before the present epoch on this resonant branch.
