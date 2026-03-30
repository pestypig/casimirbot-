# York-Time Morphology and Lane Dependence in CasimirBot's York Diagnostics

## Executive Summary

The repo's declared diagnostic identity `theta = -trK` is, in standard 3+1 language, a kinematical expansion diagnostic tied to a specific observer congruence and slicing: it measures the expansion (or contraction) of infinitesimal volume elements as seen by the Eulerian observers (the observers whose 4-velocity is the unit normal `n^a` to the chosen foliation). Alcubierre explicitly defines the "expansion of the volume elements associated with the Eulerian observers" as `theta = -alpha TrK`. [cite](turn29view0) In Gourgoulhon's 3+1 formalism (with the common numerical-relativity sign convention), the trace of the extrinsic curvature satisfies `K = -nabla·n`. [cite](turn35view2) Together, these make the repo's `theta=-trK` a precise Eulerian, foliation-locked expansion scalar.

York/extrinsic-curvature morphology (the spatial pattern of `theta`, its lobes, extrema, near-zero regions, etc.) is therefore not something you can treat as observer-independent or slicing-independent. It is invariant under mere coordinate reparameterizations that do not change the foliation (e.g., relabeling spatial coordinates on the same slice), but it generally changes if you change the time function (the foliation) or change the observer congruence away from Eulerian normals. Gourgoulhon's definition of a foliation as level sets of a scalar time function makes explicit that the slicing is an extra structure; changing it changes `n`, hence `K`, hence `theta`. [cite](turn35view1) [cite](turn35view2)

Scientifically, the repo's lane approach can still be rigorous: holding a fixed lane means holding fixed (i) foliation, (ii) observer definition, (iii) sign conventions, and (iv) sampling/remapping rules, and then comparing solutions within that gauge. Your contract already encodes this intent: it declares a baseline lane (`lane_a_eulerian_comoving_theta_minus_trk`) and explicitly marks an alternate lane as "pending" and "not yet implemented with honest tensor-path semantics." [filecite](turn13file0#L1) This is good scientific hygiene: it implicitly acknowledges that cross-lane claims are not currently licensed.

What the current lane can legitimately establish is lane-relative classification and optimization statements ("within lane A, solution X is more low-expansion-like than solution Y"), plus internal consistency checks (e.g., that the stored `theta` channel matches `-K` under the repo's own conventions). The repo's own proof-pack script frames this as a "render/geometry audit ... not a physical warp feasibility claim," and it explicitly avoids fake cross-frame claims by not executing unsupported lanes. [filecite](turn16file0#L1)

Any stronger claim about true contraction/expansion of space without an explicit observer/foliation qualifier is scientifically invalid right now. Natario's central point is exactly that Alcubierre's contraction/expansion picture is contingent: one can construct a warp-drive spacetime where "no contraction/expansion occurs," i.e., where the Eulerian expansion `theta` vanishes for a divergence-free shift field. [cite](turn33view1) [cite](turn33view0) That observation is a direct warning against over-stating invariance from a single York lane.

## Physics of `theta=-trK`

In a 3+1 decomposition, spacetime is foliated by spacelike hypersurfaces `Sigma_t`, with a future-directed unit normal field `n^a` determined by the foliation. [cite](turn35view1) [cite](turn30view0) The extrinsic curvature `K_ij` is the geometric object describing how each slice is embedded in spacetime; it can be written (in one common convention) as the projected gradient of the normal, and its trace `K` is "minus three times the mean curvature." [cite](turn35view2) [cite](turn34view2)

Two primary-source equivalences pin down what `theta=-trK` means:

Alcubierre (warp drive paper) defines the expansion of the volume elements associated with the Eulerian observers in terms of the extrinsic curvature as
`theta = -alpha TrK`,
and in his canonical warp metric he uses `alpha=1`. [cite](turn29view0) [cite](turn29view3) This is an explicitly observer-tagged statement: Eulerian observers are those whose 4-velocity is normal to the hypersurfaces. [cite](turn29view3)

Gourgoulhon gives the geometric identity linking the trace of `K` and the divergence of the unit normal:
`K = -nabla·n`,
derived by tracing the relation between `nabla n` and `K`. [cite](turn35view2) Therefore, under the repo's advertised ADM-style convention, `theta=-trK` corresponds to
`theta := -K = nabla·n`,
i.e., the covariant divergence of the Eulerian 4-velocity field. [cite](turn35view2) [cite](turn29view0)

Natario's paper uses a closely related but sign-sensitive presentation: for his warp drive spacetimes with slices `{dt=0}`, he defines Eulerian observers with 4-velocity `n^a`, computes the extrinsic curvature from the shift-like field `X`, and states that the Eulerian expansion is `theta = nabla·X`, with `theta = K^i_i` in his conventions. [cite](turn35view0) [cite](turn33view0) He also explicitly notes that he is following Wald's conventions (with some index notation differences), which is the standard reason the sign relationship between trace `K` and expansion can appear flipped across references unless you normalize conventions carefully. [cite](turn35view0) [cite](turn35view2)

Physically, once you fix the observer congruence (here: Eulerian `n^a`), `theta` is the instantaneous volumetric expansion rate of a small comoving volume element carried along those observer worldlines: `theta>0` indicates expansion and `theta<0` indicates contraction for that congruence, in the sign convention where `theta=nabla·n`. [cite](turn29view0) [cite](turn35view2)

## Observer/Foliation Dependence

It is crucial to separate coordinate/frame language from foliation/observer language, because invariance behaves very differently for each.

A coordinate change is a re-labeling of events. If you keep the same foliation (the same family of hypersurfaces `Sigma_t` as sets of spacetime points) and merely change coordinates on each slice, then `K_ij` transforms as a tensor on the slice and `K = gamma^ij K_ij` is a scalar on the slice. In that limited sense, theta morphology on the slice is invariant under those coordinate re-labelings. This is the ordinary tensorial notion of coordinate covariance implicit throughout the 3+1 formalism. [cite](turn35view2) [cite](turn35view1)

A foliation choice, by contrast, is not just a coordinate relabeling: it is the choice of a time function whose level sets are the slices. Gourgoulhon defines a foliation by the existence of a smooth scalar field `t` with nonvanishing gradient whose level sets are the hypersurfaces `Sigma_t`. [cite](turn35view1) Changing that scalar field generically changes the hypersurfaces, hence changes their normal `n`, hence changes `K`, hence changes `theta`. This dependence is explicit in Gourgoulhon's derivation: `K` is built from (projected) derivatives of the foliation normal `n`, and its trace is tied directly to `nabla·n`. [cite](turn35view2)

An observer choice is the selection of a timelike unit 4-velocity field `u^a`. The repo's `theta=-trK` is specifically the expansion of the Eulerian observer congruence `u^a=n^a`, not of an arbitrary `u^a`. Both Alcubierre and Natario define Eulerian observers as the normals to the chosen slices and interpret `theta` as their volume-element expansion. [cite](turn29view3) [cite](turn35view0) [cite](turn33view0) If you instead measure expansion with another physically motivated congruence (e.g., observers comoving with some matter flow, or boosted observers relative to `n^a`), the scalar `nabla·u` generally differs from `nabla·n` and is not constrained to equal `-trK`.

Natario supplies a concrete warning about treating Alcubierre's `theta` morphology as an invariant warp mechanism. He states that the usual "space contracted in front / expanded behind" explanation is not necessary, and explicitly constructs a warp drive spacetime where "no contraction/expansion occurs." [cite](turn33view1) [cite](turn33view0) In his construction, choosing a divergence-free field `X` yields `theta=nabla·X=0` for Eulerian observers, and he even checks `theta=0` in an explicit example. [cite](turn33view0) [cite](turn33view3) This is precisely the statement that York-time morphology is contingent on the chosen congruence and slicing, not a uniquely defined spacetime invariant.

## What the Current Repo Lane Means

The repo's contract formalizes one specific York diagnostic lane as the baseline:

- Observer: `eulerian_n`
- Foliation: `comoving_cartesian_3p1`
- Definition: `theta=-trK`
- Sign convention tag: `ADM`
- Classification scope: `diagnostic_local_only`
- Baseline lane ID: `lane_a_eulerian_comoving_theta_minus_trk` [filecite](turn13file0#L1)

Scientifically, that combination means: you are committing to a particular set of simultaneity slices and the associated Eulerian observers, and you are diagnosing the expansion scalar of those observers, expressed via the trace of extrinsic curvature in the chosen sign convention. That is a coherent and standard thing to do in numerical relativity; it becomes problematic only when one forgets that it is a gauge-fixed diagnostic.

Two additional contract features clarify the intended epistemic boundary:

First, the contract declares an alternate lane but explicitly marks it unsupported and pending, citing the absence of honest tensor-path semantics. [filecite](turn13file0#L1) This is a direct repo-level acknowledgment that cross-lane comparisons are not currently mathematically grounded.

Second, the pipeline is built around controls and lane-local classification, not global invariance claims. The contract includes reference controls labeled `alcubierre_control` (expected strong signed fore/aft morphology) and `natario_control` (expected low expansion morphology). [filecite](turn13file0#L1) The proof-pack script that audits these controls states a boundary condition explicitly: it is a "render/geometry audit for York-family interpretation; it is not a physical warp feasibility claim." [filecite](turn16file0#L1) It also encodes a policy of not executing an unsupported lane to avoid fake cross-frame claims. [filecite](turn16file0#L1)

Finally, the repo's own citation-trace doc mirrors the same posture: it labels the mapping as `provided_unverified`, states primary sources only for equation claims, and treats `ThetaAudit` mappings as `proxy_only` unless computed from the appropriate geometric definitions (e.g., divergence of a spatial field or `-TrK` in a declared convention). [filecite](turn15file0#L1)

In short: the current lane is a single, explicit `(observer, foliation, convention)` bundle used for internal diagnostics and classification. It is best interpreted as a one-gauge measurement protocol, not as a gauge-invariant physical observable.

## What the Current Lane Can Legitimately Establish

With exactly one implemented lane, the scientifically valid claim space is within-lane (gauge-fixed) and consistency/traceability, not foliation-independent physics.

Within lane A, the repo can legitimately establish statements of the following forms:

It can correctly report and compare Eulerian expansion fields for that foliation: "In lane A (Eulerian normal to comoving_cartesian_3p1), solution S has `max|theta|` smaller than solution T," and "the sign-lobe structure differs in this specific way." This is exactly what Alcubierre used `theta` for: diagnosing expansion behind and contraction in front relative to the Eulerian observers of his chosen 3+1 slicing. [cite](turn29view0) [cite](turn29view3)

It can meaningfully calibrate diagnostic behavior against control families within the same lane. Natario's work supports the idea that low-expansion controls exist (by choosing a divergence-free shift-like field so that Eulerian expansion vanishes), and so using a Natario-like control to anchor a low expansion end of a lane-local diagnostic axis is physically sensible, so long as you keep stating the observer/slicing context. [cite](turn33view1) [cite](turn33view0) The repo contract encodes this intent directly via lane-local reference controls. [filecite](turn13file0#L1)

It can establish internal correctness properties of the declared contract: e.g., "our published `theta` channel is exactly the negative trace of our published `K_trace` channel (within tolerance)." The proof-pack's explicit `thetaPlusKTrace` congruence logic is structured precisely around validating that the contract `theta=-trK` is being respected by the pipeline. [filecite](turn16file0#L1)

It can also establish that certain statements are not yet licensed, and this is itself scientifically meaningful: the repo already declares the alternate lane as unsupported and states the rationale (`honest tensor-path semantics` not implemented), which is a correct constraint on inference. [filecite](turn13file0#L1)

What it cannot legitimately establish with one lane is any statement whose truth would require invariance under (or robustness across) changes in foliation/observer. Natario's explicit construction of warp drive with zero expansion makes clear that the presence/absence of expansion in Alcubierre's sense is not a unique physical signature of warp drive-ness; it is a feature contingent on the chosen vector field `X` (and, more broadly, the chosen slicing/observers). [cite](turn33view1) [cite](turn33view0) [cite](turn33view3)

## Criteria for an Honest Alternate Lane

The repo's own language (`honest tensor-path semantics` vs. `fake cross-frame claims`) is pointing at a real mathematical distinction: an alternate lane must reflect a different geometric choice, not a cosmetic post-processing change. [filecite](turn13file0#L1) [filecite](turn16file0#L1)

A mathematically honest alternate lane satisfies, at minimum, these criteria:

It must change either the foliation or the observer congruence (or both) in a way that is explicitly represented at the 4D geometry level. In 3+1 terms, a new foliation means a new time function `t'` whose level sets are different hypersurfaces `Sigma'_t'`. Gourgoulhon's definition makes clear that a foliation is not merely a different coordinate label, but a different slicing by level sets of a regular scalar field. [cite](turn35view1) [cite](turn35view2) A new observer congruence means a different timelike unit field `u^a != n^a`, with its own kinematics (expansion, shear, acceleration), of which the Eulerian case is just one special choice. [cite](turn30view0) [cite](turn29view3)

It must recompute `theta` from the new lane's geometry, not transform old outputs. For foliation-based lanes where York diagnostics are defined via extrinsic curvature, that means: compute the lane's ADM variables `(alpha, beta^i, gamma_ij)` for that slicing, compute `K_ij` consistently with the declared sign convention, take the trace, then apply the lane's definition of `theta`. The primary-source equation chain linking expansion and `TrK` is explicit in Alcubierre and Gourgoulhon. [cite](turn29view0) [cite](turn35view2) Natario gives an explicit analogous chain for his warp drive class, with `theta` as a divergence of the defining spatial field under his conventions. [cite](turn33view0) [cite](turn35view0)

It must carry new lane metadata end-to-end (certificate identity and validation). Your proof-pack infrastructure already treats lane identity as something that must be carried and checked (`lane_id`, `observer`, `theta_definition`, `kij_sign_convention`, `unit system`, etc.), and it maps explicit preflight failures for lane mismatch conditions. [filecite](turn16file0#L1) An honest lane is one where those metadata fields correspond to a genuinely distinct computation path.

It must include falsifiers that would catch a fake relabeling. A fake lane looks like: changing color scales, swapping axis labels, applying a fixed scalar transform to `theta`, relabeling time `t->f(t)` without changing the hypersurfaces, or declaring a different observer while still using the same `n^a`-derived `theta`. A falsifier should detect that by checking whether the recomputed `theta` is identical (up to trivial transformations) to lane A on a nontrivial test case where a real foliation/observer change should alter `theta`. Natario's divergence-free example (where `theta` must vanish) is a natural control for this purpose, because it pins down a nontrivial condition `nabla·X=0` that is not achieved by arbitrary rescalings. [cite](turn33view0) [cite](turn33view3)

Finally, an honest alternate lane should be declared with the same epistemic modesty as lane A: any cross-lane comparison is still a comparison of two different gauge-fixed diagnostics, unless you are explicitly computing 4D invariants. Your current repo posture (diagnostic-local scope; explicit "not a feasibility claim"; refusal to run unsupported lanes to avoid fake claims) is aligned with this. [filecite](turn13file0#L1) [filecite](turn16file0#L1)

## Physics Claims Matrix

| claim | primary source | repo anchor | valid now? yes/no | why |
|---|---|---|---|---|
| `theta=-trK` is the expansion (volumetric dilation rate) of Eulerian observers tied to the chosen foliation. | Alcubierre defines Eulerian volume expansion as `theta=-alpha TrK`. [cite](turn29view0) Gourgoulhon links `K` to `nabla·n`. [cite](turn35view2) | `configs/york-diagnostic-contract.v1.json` declares `observer=eulerian_n`, `theta_definition=theta=-trK`, `kij_sign_convention=ADM`. [filecite](turn13file0#L1) | yes | This is a definition-level claim: the lane contract explicitly binds `theta` to `-trK` for Eulerian `n`, matching the 3+1 literature meaning in the stated convention. [cite](turn29view0) [cite](turn35view2) |
| Under the common ADM/NR convention, `theta=-trK` corresponds to `theta=nabla·n` (divergence of the unit normal congruence). | Gourgoulhon derives `K=-nabla·n`. [cite](turn35view2) | Contract tags the convention as `ADM` and defines `theta=-trK`. [filecite](turn13file0#L1) | yes | With `K=-nabla·n`, the contract's `theta=-K` is exactly `nabla·n` for the lane's Eulerian observers. [cite](turn35view2) |
| York-time / mean-curvature diagnostics are foliation-dependent because `K` is built from the foliation normal `n`, and changing the time function changes the slices and `n`. | A foliation is defined as level sets of a regular scalar `t`. [cite](turn35view1) `K` is constructed from `nabla n`, and `K=-nabla·n`. [cite](turn35view2) | Lane declares a specific `foliation=comoving_cartesian_3p1`, and the contract scope is `diagnostic_local_only`. [filecite](turn13file0#L1) | yes | This is a structural fact of 3+1 GR: `theta` is not a 4D-gauge invariant unless you specify a preferred slicing/observer. [cite](turn35view1) [cite](turn35view2) |
| Alcubierre's "expansion behind / contraction ahead" picture is explicitly the Eulerian `theta` pattern in his chosen 3+1 slicing, not a slicing-independent invariant. | Alcubierre defines `theta` for Eulerian observers and shows it produces expansion/contraction regions. [cite](turn29view0) | `docs/alcubierre-alignment.md` treats this sign-lobe structure as an in-lane audit expectation. [filecite](turn14file0#L1) | yes (only as lane-relative) | The repo can assert the Alcubierre sign-lobe expectation within the lane because Alcubierre's own definition is foliation/observer-specific. [cite](turn29view0) [cite](turn29view3) |
| Natario's "zero expansion" warp drive demonstrates that Alcubierre's contraction/expansion is contingent and can be removed by a different construction (divergence-free `X`). | Natario states contraction/expansion is not necessary and constructs a spacetime where it does not occur. [cite](turn33view1) [cite](turn33view0) | Contract includes a `natario_control` described as "Expected low-expansion York morphology under this diagnostic lane." [filecite](turn13file0#L1) | yes (as a caution/inference boundary) | Natario is a primary-source proof that `theta`-morphology is not a universal warp fingerprint; it depends on the chosen data (and therefore on the lane). [cite](turn33view1) [cite](turn33view0) |
| Claims of "solution is expansion-free" without specifying observer/foliation are invalid right now. | Natario ties expansion to Eulerian observers (`theta=nabla·X`). [cite](turn33view0) Gourgoulhon ties `trK` to `nabla·n` of the foliation normal. [cite](turn35view2) | Contract scope is `diagnostic_local_only` and alternate lane is not implemented. [filecite](turn13file0#L1) | no | With one lane, expansion-free can only mean `theta~0` for this lane's Eulerian `n`. Cross-observer/foliation generalization is not licensed. [cite](turn33view0) [cite](turn35view2) |
| The repo can legitimately claim lane-local classifications such as "more Alcubierre-like vs more Natario-like" within the declared lane. | Alcubierre and Natario provide two contrasting lane-interpretable `theta` behaviors (nonzero signed lobes vs divergence-free). [cite](turn29view0) [cite](turn33view0) [cite](turn33view3) | Contract defines reference controls and a lane-local feature/distance policy. [filecite](turn13file0#L1) Proof-pack implements this as a "render/geometry audit." [filecite](turn16file0#L1) | yes | This is exactly fixed lane, compare within it: a stable, reproducible diagnostic protocol, explicitly not promoted to full physical identity. [filecite](turn16file0#L1) |
| The repo cannot claim lane invariance or observer invariance until an honest second lane is implemented and cross-lane comparisons are run. | Foliation changes change `n` and `K` (hence `theta`). [cite](turn35view1) [cite](turn35view2) Natario shows qualitatively different `theta` is achievable. [cite](turn33view1) [cite](turn33view0) | Alternate lane is declared `unsupported` with `honest tensor-path semantics` missing. [filecite](turn13file0#L1) Proof-pack refuses unsupported lanes to avoid fake cross-frame claims. [filecite](turn16file0#L1) | no | Without a second computed lane, you cannot test robustness; any invariance claim would be methodologically false. [filecite](turn13file0#L1) [filecite](turn16file0#L1) |
| A mathematically honest alternate lane must recompute ADM/3+1 data (or observer kinematics) from the underlying 4-geometry for a genuinely different foliation/observer, not re-label or post-process lane A outputs. | Foliation is level-set structure; changing it changes `n`. [cite](turn35view1) [cite](turn35view2) Expansion is defined relative to the chosen Eulerian `n` (Alcubierre/Natario). [cite](turn29view0) [cite](turn33view0) | Contract explicitly distinguishes a future alternate lane and calls out the need for honest tensor-path semantics. [filecite](turn13file0#L1) | no (not yet implemented) | The repo itself says lane B is pending; until it computes `theta` via a genuinely distinct geometric mapping, any lane B would be cosmetic. [filecite](turn13file0#L1) |
| The repo's current diagnostics lane is explicitly scoped as diagnostic-local and framed as not making feasibility claims. | Alcubierre/Natario establish `theta` as kinematic, not sufficient for feasibility. [cite](turn29view0) [cite](turn33view1) | Proof-pack boundary statement: not a physical warp feasibility claim. [filecite](turn16file0#L1) Contract scope: `diagnostic_local_only`. [filecite](turn13file0#L1) | yes | The repo's own governance language correctly limits inference: current York outputs are diagnostics under a declared lane, not physics-proof of achievable warp drives. [filecite](turn16file0#L1) |

## Source Inventory From This Research Run

This appendix records the source list returned by the research run that produced this memo. The point is provenance retention. It does not promote all scanned sources to equal authority. Repo files and primary GR papers remain the sources to prefer for code and equation-level claims.

### Named citations from the run

#### Primary / foundational physics sources

- Miguel Alcubierre, `gr-qc/0009013`
  - `https://studylib.net/doc/27180083/0009013`
- Eric Gourgoulhon, `3+1 formalism and bases of numerical relativity`
  - `https://arxiv.org/pdf/gr-qc/0703035.pdf`
- Jose Natario, `arXiv:gr-qc/0110086 v3 13 Mar 2002`
  - `https://www.ecn.org/cunfi/0110086.pdf`

#### Direct repo sources

- `configs/york-diagnostic-contract.v1.json`
  - `https://github.com/pestypig/casimirbot-/blob/main/configs/york-diagnostic-contract.v1.json`
- `scripts/warp-york-control-family-proof-pack.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/scripts/warp-york-control-family-proof-pack.ts`
- `docs/needle-hull-citation-trace.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/needle-hull-citation-trace.md`
- `docs/alcubierre-alignment.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/alcubierre-alignment.md`

### Connector-scanned repo context reported by the run

- `configs/york-diagnostic-contract.v1.json`
  - `https://github.com/pestypig/casimirbot-/blob/main/configs/york-diagnostic-contract.v1.json`
- `docs/alcubierre-alignment.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/alcubierre-alignment.md`
- `docs/needle-hull-citation-trace.md`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/needle-hull-citation-trace.md`
- `docs/needle-hull-citation-trace.json`
  - `https://github.com/pestypig/casimirbot-/blob/main/docs/needle-hull-citation-trace.json`
- `scripts/warp-york-control-family-proof-pack.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/scripts/warp-york-control-family-proof-pack.ts`
- `scripts/hull-optix-service.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/scripts/hull-optix-service.ts`
- `server/__tests__/hull-render.routes.spec.ts`
  - `https://github.com/pestypig/casimirbot-/blob/main/server/__tests__/hull-render.routes.spec.ts`

### Broader scanned context from the run

The run reported `Sources scanned: 84`. That broader scan included:

- access mirrors and repository copies of Alcubierre, Natario, and Gourgoulhon
- publisher landing pages and Springer metadata pages
- repo-adjacent secondary research such as `warp drive aerodynamics` and `ADM mass in warp drive spacetimes`
- press, forum, and aggregator sources

Useful examples named in the run:

- ResearchGate mirror for Alcubierre:
  - `https://www.researchgate.net/publication/1963139_The_Warp_Drive_Hyper-fast_Travel_Within_General_Relativity`
- ResearchGate mirror for Natario:
  - `https://www.researchgate.net/publication/1964573_Warp_Drive_With_Zero_Expansion`
- Springer landing page for Gourgoulhon's book form:
  - `https://link.springer.com/book/10.1007/978-3-642-24525-1`
- Springer article landing page for `Warp drive aerodynamics`:
  - `https://link.springer.com/article/10.1007/JHEP08%282022%29288`
- Springer article landing page for `ADM mass in warp drive spacetimes`:
  - `https://link.springer.com/article/10.1007/s10714-022-03061-9`

These broader scan sources are useful for discovery and follow-up, but they should not be treated as authoritative over the repo or the primary literature unless they resolve back to those sources cleanly.
