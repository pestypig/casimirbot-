# Joint target response of the messenger family

Exploratory snapshot, September 7, 2026. Propagates the selected heavy-gluon terms into the existing common contact-response calculation. The apparatus and reference point remain frozen; family points are conditional alternatives.

## Consistent coupling and scope

The [script](casimir-dp-axion-family-target-response-2026-09-07.py) authenticates the archived insertion script and family loop ledger. It reproduces the archived reference before changing inputs. That archive used gu=5.6e-5 for the spin and open-line box channels. The messenger family holds gu=5.5700260688158226e-5. Both the spin rates and box amplitudes therefore receive the common factor (gu/5.6e-5)^2=0.989323673702. The scalar tree and dark/scalar triangles do not contain this up-quark coupling and are retained. This repairs a rounded-input inconsistency; it is separate from varying yL.

For each family point, the changing aa-gluon and Higgs-gluon coefficients are converted to signed potential insertions and combined with proton/neutron amplitudes before computing interference. The same coefficients feed xenon and carbon. Fixed conditional inputs include ma=1 GeV, mchi=400 GeV, scalar portal 0.03, radial mass 1000 GeV and fTG=0.9. Maintaining the mediator mass requires the independent renormalized mass prescription discussed in the loop-cost packet.

## Results

Central halo, linear interference, raw exposure, xenon window 5.4–269.9 keV:

| yL | Raw xenon events | Raw events at 200–269.9 keV | Independent-nucleus D upper estimate |
|---|---|---|---|
| 0.05 | 1.3680750 | 0.03689404 | 2.1795521e-29 |
| 0.10 | 1.3680953 | 0.03689405 | 2.1796089e-29 |
| 0.15 | 1.3681263 | 0.03689408 | 2.1796957e-29 |
| 0.20 | 1.3681693 | 0.03689411 | 2.1798162e-29 |

The corrected reference differs from the archived 1.3745995 events primarily because of the gu correction. Relative to the corrected reference, the yL=0.10 point changes the total by only about -0.0054%. Thus the lower conditional kaon contribution survives this particular target-response check with almost unchanged leading predictions.

At yL=0.10, the six retained halo scenarios span 1.355–1.388 raw full-window events and 0.0340–0.0392 high-window events. The local estimates span 2.10e-29–2.24e-29. These discrete scenarios are not a probability distribution or a complete uncertainty band. The [JSON](casimir-dp-axion-family-target-response-2026-09-07.json) also retains squared-subset results as an order-truncation diagnostic, not a complete higher-order calculation.

## Interpretation and remaining work

The local number uses independent free nuclei and D<=2N, with the approximate spin response and Q=0 scalar loop contact approximation inherited from the archive. It is not a bound on the full solid, trapped apparatus or every uncomputed channel. Within this approximation it is roughly 7.4e-28 of the frozen DP exponent 0.02951. There is no accessible shared local signal here. A homogeneous attenuation also does not automatically survive the four-cell boundary contrast.

The xenon counts have no detector acceptance or likelihood applied and cannot be called a fit to the anomaly. Missing momentum dependence, full UV/hadronic matching, scalar input conditions, shielding and solid response remain explicit limitations. The flavor improvement alone does not admit a complete model.

Next assess the omitted matching and momentum dependence against the scale of these small selected corrections, and compare the conditional family with the signed kaon constraint. A substantial measured boundary-dependent coherence residual would require a mechanism beyond the independently scattering channels calculated here.

Validation: archived xenon/local reference recovered to relative 1e-12; all scenario windows are nested and positive. Root-leaf documentation validation passes separately. Goal remains active.
