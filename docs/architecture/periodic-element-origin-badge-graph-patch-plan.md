# Periodic Element Origin Badge Graph Patch Plan

This plan implements the periodic table as theory badges connected to
first-principle physics, nucleosynthesis channels, observables, and bounded
astrochemistry context. The implementation must remain diagnostic: element
origin, spectral identification, and molecular-cloud context do not by
themselves prove life, prebiotic success, consciousness, objective collapse, or
any unrelated physical mechanism.

## Research Basis

Use these sources as the citation floor for patch work:

- Hans Bethe, "Energy Production in Stars," Physical Review 55, 434-456
  (1939), DOI: https://doi.org/10.1103/PhysRev.55.434. This anchors stellar
  hydrogen-burning energy production through proton reactions and the CNO
  cycle.
- Fred Hoyle, "On Nuclear Reactions Occurring in Very Hot Stars. I. The
  Synthesis of Elements from Carbon to Nickel," Astrophysical Journal
  Supplement Series 1, 121-146 (1954), ADS:
  https://adsabs.harvard.edu/full/1954ApJS....1..121H. This anchors advanced
  stellar burning from carbon through iron-peak context.
- E. M. Burbidge, G. R. Burbidge, W. A. Fowler, and F. Hoyle, "Synthesis of the
  Elements in Stars," Reviews of Modern Physics 29, 547-650 (1957), DOI:
  https://doi.org/10.1103/RevModPhys.29.547. This is the canonical B2FH
  reference for stellar nucleosynthesis and neutron-capture origin families.
- A. G. W. Cameron, "Stellar Evolution, Nuclear Astrophysics, and
  Nucleogenesis," Atomic Energy of Canada report CRL-41 (1957), OSTI:
  https://www.osti.gov/biblio/4709881. This is the companion historical
  nucleogenesis foundation covering thermonuclear reactions, neutron capture,
  stellar evolution, and supernova context.
- R. V. Wagoner, W. A. Fowler, and F. Hoyle, "On the Synthesis of Elements at
  Very High Temperatures," Astrophysical Journal 148, 3-49 (1967), DOI:
  https://doi.org/10.1086/149126. This anchors Big Bang nucleosynthesis for the
  lightest nuclei.
- V. E. Viola and G. J. Mathews, "Cosmic Synthesis of Lithium, Beryllium and
  Boron," Scientific American 253, 50-59 (1985), OSTI:
  https://www.osti.gov/biblio/6532243. This anchors cosmic-ray spallation for
  Li-Be-B context.
- F. Kappeler, R. Gallino, S. Bisterzo, and W. Aoki, "The s process: Nuclear
  physics, stellar models, and observations," Reviews of Modern Physics 83,
  157-193 (2011), DOI: https://doi.org/10.1103/RevModPhys.83.157. This anchors
  slow neutron-capture production in AGB and massive-star environments.
- J. J. Cowan, C. Sneden, J. E. Lawler, et al., "Origin of the Heaviest
  Elements: The Rapid Neutron-Capture Process," Reviews of Modern Physics 93,
  015002 (2021), DOI: https://doi.org/10.1103/RevModPhys.93.015002. This
  anchors r-process heavy-element context from iron-group seeds toward uranium.
- C. Kobayashi, A. I. Karakas, and M. Lugaro, "The Origin of Elements from
  Carbon to Uranium," Astrophysical Journal 900, 179 (2020), ADS:
  https://ui.adsabs.harvard.edu/abs/2020ApJ...900..179K/abstract. This anchors
  modern element-by-element origin-family assignments and galactic chemical
  evolution context.
- E. F. van Dishoeck, E. Herbst, and D. A. Neufeld, "Interstellar Water
  Chemistry: From Laboratory to Observations," Chemical Reviews 113, 9043-9085
  (2013), DOI: https://doi.org/10.1021/cr4003177; arXiv:
  https://arxiv.org/abs/1312.4684. This anchors water formation routes in
  molecular-cloud, gas-grain, and gas-phase chemistry.
- A. Kramida, Yu. Ralchenko, J. Reader, and the NIST ASD Team, "NIST Atomic
  Spectra Database," version 5.12, DOI: https://doi.org/10.18434/T4W30F. This
  anchors atomic spectral-line observables for element identification.
- Yu. T. Oganessian and V. K. Utyonkov, "Superheavy elements: Oganesson and
  beyond," Reviews of Modern Physics 91, 011001 (2019), DOI:
  https://doi.org/10.1103/RevModPhys.91.011001. This anchors synthetic
  superheavy element badge boundaries.

## Physics Axioms

Patch work must encode these as graph assumptions and claim boundaries:

- Fusion entrance condition: positively charged nuclei face Coulomb repulsion;
  stellar fusion proceeds when thermal conditions and quantum tunneling allow
  nuclei to enter the range where the strong interaction can bind them. Do not
  write that stars "overcome the strong force."
- Hydrogen burning: main-sequence hydrogen burning primarily makes helium via
  proton-proton chains and/or the CNO cycle. Do not write that oxygen is made
  directly from hydrogen burning.
- Carbon and oxygen: carbon is anchored to helium burning/triple-alpha context;
  oxygen is anchored to helium-burning and alpha-capture context.
- Iron peak: advanced burning and explosive nucleosynthesis can populate
  iron-peak elements, but fusion beyond the iron peak is not an energy-producing
  stellar-burning ladder.
- Heavy elements: s-process and r-process channels are separate origin families
  with different astrophysical sites and evidence. Store ambiguity as metadata
  instead of flattening all heavy elements to one origin.
- Li-Be-B: lithium, beryllium, and boron need special handling because Big Bang
  nucleosynthesis, stellar destruction/production, novae, and cosmic-ray
  spallation are all relevant depending on isotope and context.
- Molecular clouds: molecular species such as water depend on inherited
  elemental abundances plus local density, temperature, radiation field,
  ionization, dust-grain surfaces, and gas/ice chemistry. Element presence is a
  prerequisite, not a guarantee of molecule formation.
- Observables: element badges must connect to spectral, abundance, isotopic, or
  sample-provenance observables before being used in explanation plans.
- Synthetic elements: superheavy elements should be marked as laboratory
  synthesis context unless a source ref explicitly supports a natural-occurrence
  claim.

## Phase 1: Registry Contract

Patch instructions:

- Extend `shared/periodic-table.ts` without breaking `ELEMENT_Z_LOOKUP`.
- Add `ELEMENT_ORIGIN_REGISTRY` or equivalent structured metadata.
- Include all 118 elements.
- For every element, include:
  - `symbol`
  - `name`
  - `Z`
  - `originFamilies`
  - `primaryOrigin`
  - `observableRoutes`
  - `claimBoundaryNotes`
  - `sourceKeys`
- Use these origin-family ids:
  - `big_bang_nucleosynthesis`
  - `hydrogen_burning`
  - `helium_burning_triple_alpha`
  - `alpha_capture`
  - `advanced_stellar_burning`
  - `explosive_nucleosynthesis`
  - `cosmic_ray_spallation`
  - `s_process`
  - `r_process`
  - `p_process_or_photodisintegration`
  - `radioactive_decay_chain`
  - `synthetic_lab`
- The registry must support multiple origin families per element. Avoid
  pretending that a single channel explains every isotope or abundance context.

Acceptance tests:

- `ELEMENT_Z_LOOKUP` still has length 118 and preserves existing shape.
- `ELEMENT_ORIGIN_REGISTRY` has length 118.
- Each registry entry has non-empty `symbol`, `name`, `originFamilies`,
  `primaryOrigin`, `observableRoutes`, `claimBoundaryNotes`, and `sourceKeys`.
- Representative checks:
  - H includes `big_bang_nucleosynthesis`.
  - He includes `big_bang_nucleosynthesis` and `hydrogen_burning`.
  - C includes `helium_burning_triple_alpha`.
  - O includes `alpha_capture`.
  - Fe includes `advanced_stellar_burning` or `explosive_nucleosynthesis`.
  - Li/Be/B include `cosmic_ray_spallation`.
  - Sr/Ba/Pb include `s_process`.
  - Au/U include `r_process`.
  - Og includes `synthetic_lab`.

## Phase 2: Origin Anchor Badges

Patch instructions:

- Add `shared/theory/nucleosynthesis-origin-theory-badges.ts`.
- Hand-author origin-family badges before generating element badges.
- Use `TheoryBadgeV1` with diagnostic claim boundary.
- Add source refs to the papers in the research basis.
- Add noncomputable equations for origin families and calculator payloads only
  where the scalar expression is genuinely executable.

Required anchor badge ids:

- `nucleosynthesis.big_bang.light_elements`
- `nucleosynthesis.hydrogen_burning.helium_production`
- `nucleosynthesis.helium_burning.triple_alpha_carbon`
- `nucleosynthesis.alpha_capture.oxygen_neon_magnesium`
- `nucleosynthesis.advanced_burning.iron_peak`
- `nucleosynthesis.explosive_burning.supernova_yields`
- `nucleosynthesis.spallation.li_be_b`
- `nucleosynthesis.s_process.slow_neutron_capture`
- `nucleosynthesis.r_process.rapid_neutron_capture`
- `nucleosynthesis.synthetic.superheavy_lab`

Acceptance tests:

- Every origin-family id used in the element registry has a matching origin
  anchor badge.
- Every origin anchor has at least one literature source ref.
- No origin anchor permits validation, physical-mechanism, or promotion claims.

## Phase 3: Generated Element Badges

Patch instructions:

- Add `shared/theory/periodic-element-origin-theory-badges.ts`.
- Generate one `TheoryBadgeV1` per element from the registry.
- Use deterministic ids:
  - `element.h.origin`
  - `element.he.origin`
  - `element.c.origin`
  - `element.o.origin`
  - continue through `element.og.origin`
- Put atomic number in `units` or `hintKeys.symbols` as `Z`.
- Include source refs from the registry source keys.
- Use noncomputable reference equations such as:
  - `origin(element)=context(origin_family, abundance, observable_route)`
- Do not add calculator payloads to all elements. Add scalar payloads only for
  shared observable calculations such as wavelength-to-energy through an
  existing spectroscopy badge.

Acceptance tests:

- Exactly 118 generated element badges are exported.
- Every element badge validates under `validateTheoryBadgeGraphV1`.
- Badge ids are stable and lower-case.
- Every element badge includes atomic-line or abundance observable route tags.
- Every element badge carries diagnostic-only claim boundaries.

## Phase 4: Graph Edges

Patch instructions:

- Export `PERIODIC_ELEMENT_ORIGIN_THEORY_EDGES`.
- Connect origin anchors to elements with `derives` only when the origin family
  is a valid production channel for the element family.
- Use `documents` for context-only links and `requires` for observable
  prerequisites.
- Connect element badges to existing graph anchors:
  - `stellar.spectroscopy.atomic_line_identification_context`
  - `starsim.nucleosynthesis.element_yield_prior`
  - `astrochemistry.aromatic_carbon.interstellar_context`
  - `prebiotic.inventory.meteoritic_organics_context`
- Add bounded water/molecular-cloud edges only after Phase 5 badges exist.

Acceptance tests:

- Every element badge has at least one incoming origin-family edge.
- Every element badge has at least one edge to an observable or evidence route.
- No element badge has a direct `derives` edge to life, consciousness, or
  objective-collapse badges.
- C/O/N/P/S may document prebiotic inventory context, but must not derive it.

## Phase 5: Molecular Cloud And Water Context

Patch instructions:

- Add bounded astrochemistry badges:
  - `astrochemistry.molecular_cloud.elemental_inheritance_context`
  - `astrochemistry.dust_grain.surface_reaction_context`
  - `astrochemistry.water.h_o_binding_context`
- Cite van Dishoeck, Herbst, and Neufeld for interstellar water chemistry.
- Connect:
  - H and O element badges to water context with `requires`.
  - molecular-cloud inheritance to water context with `requires`.
  - dust-grain context to water context with `requires` or `documents`,
    depending on the specific badge text.
- Include assumptions that water formation depends on local conditions and is
  not guaranteed by H and O alone.

Acceptance tests:

- Water context has incoming edges from H, O, molecular-cloud inheritance, and
  at least one chemistry-condition badge.
- Water context remains diagnostic-only.
- Tests reject any phrase implying that elemental oxygen plus hydrogen
  guarantees water.

## Phase 6: Integration

Patch instructions:

- Import origin anchors, generated element badges, molecular-cloud badges, and
  edges into `shared/theory/helix-theory-badge-graph.ts`.
- Keep generated exports separate so tests can inspect them without building the
  full graph.
- Add `docs/architecture/theory-badge-graph-contract.md` references to this
  plan.

Acceptance tests:

- Full `buildHelixTheoryBadgeGraphV1()` validates.
- Full graph includes 118 element badges.
- Locator queries for "oxygen origin", "carbon triple alpha", "gold r process",
  "water in molecular clouds", and "NIST atomic line" resolve to the intended
  badges.
- Existing astrochemistry, stellar, root-to-leaf parity, and Casimir checks keep
  passing.

## Phase 7: Guardrails And Prompt Rules

Patch instructions:

- Add tests that fail on forbidden element-origin overclaims:
  - "oxygen is produced from hydrogen during fusion"
  - "water is guaranteed when hydrogen and oxygen exist"
  - "stellar carbon creates life"
  - "periodic table proves consciousness"
  - "superheavy elements are naturally abundant"
- Update prompt/developer guidance for future element patches:

```text
When adding element-origin theory content, route every element through the
periodic element origin registry, origin-family anchor badges, observable routes,
and diagnostic claim boundaries. Use research-paper source refs for production
channels. Treat molecular formation, prebiotic chemistry, biology,
consciousness, and objective-collapse claims as downstream context that requires
separate evidence; do not promote element presence into those claims.
```

Acceptance tests:

- Forbidden phrases are rejected by validator or focused tests.
- New element-origin patches must update both registry metadata and graph-edge
  tests.
- The graph remains useful to Helix Ask as evidence context, not answer
  authority.

## Recommended Patch Order

1. Registry contract and tests.
2. Origin anchor badges and tests.
3. Generated 118 element badges and validation tests.
4. Element-origin edges and observable-route tests.
5. Molecular-cloud/water context badges and guardrails.
6. Full graph integration and locator tests.
7. README or architecture-doc pointer update.

Do not combine all phases into one patch unless the test runtime remains small
and failures are easy to isolate.
