# Paper Binding Source Check: Thermodynamics + Quantum Patch

Date: 2026-03-24

Scope:
- review the thermodynamics/quantum paper-binding patch against web-accessible research or official technical sources
- confirm DAG/tree placement of the new definition nodes
- record the matcher defect and the corrective patch

## Fix applied

Matcher issue:
- `resolveCanonicalFrameworkBindings` previously included the full paper title in per-concept matching text.
- This allowed broad multi-topic titles to contaminate narrow concept bindings.
- Representative failure observed locally before the fix:
  - `decoherence` resolved to `physics-thermodynamics-optical-trapping-definition`
  - intended target was `physics-quantum-semiclassical-decoherence-classicality-definition`

Patch:
- concept binding now tries `term + definition` first
- it falls back to `term + definition + title` only when the concept-local text has no match

Affected file:
- `scripts/paper-framework-binding.ts`

## Source-backed node checks

1. `physics-quantum-semiclassical-decoherence-classicality-definition`
- local anchor: `docs/knowledge/physics/decoherence-classical-limit.md`
- source check:
  - Zurek (2003), Rev. Mod. Phys. 75, 715
  - https://doi.org/10.1103/RevModPhys.75.715
- review result:
  - node placement in the quantum-semiclassical tree is correct
  - definition language about environment-induced decoherence, pointer states, and classical effective observables is congruent with the review

2. `physics-quantum-semiclassical-quantum-statistics-definition`
- local anchor: `docs/knowledge/physics/quantum-statistics.md`
- source check:
  - DeMarco and Jin (1999), Science 285(5434), 1703-1706
  - https://pubmed.ncbi.nlm.nih.gov/10481000/
  - Vinen (2004), "The physics of superfluid helium"
  - https://cds.cern.ch/record/808382
- review result:
  - node placement in the quantum-semiclassical tree is correct
  - definition language about degeneracy onset and special quantum-liquid regimes is directionally correct for a definition anchor

3. `physics-thermodynamics-classical-density-functional-response-definition`
- local anchor: `docs/knowledge/physics/classical-density-functional-theory.md`
- source check:
  - Evans (1979), Advances in Physics 28(2), 143-200
  - https://bytebucket.org/knepley/cdft-git/wiki/papers/The_nature_of_the_liquid-vapour_interface_and_other_topics_in_the_statistical_mechanics_of_non-uniform_classical_fluids__AdvInPhys_1979.pdf?rev=afbbfc3820adb5df0806e7b2e3c54d53c784259e
- review result:
  - node placement in the thermodynamics tree is correct
  - cDFT belongs in the equilibrium many-body/external-potential response branch, not in the quantum-semiclassical tree

4. `physics-thermodynamics-equilibrium-tide-definition`
- local anchor: `docs/knowledge/physics/equilibrium-tide.md`
- source check:
  - Canadian Tidal Manual
  - https://psmsl.org/train_and_info/training/reading/canadian_manual.php
  - Chapter 2 notes defining equilibrium tide as a hydrostatic equipotential limit
  - https://empslocal.ex.ac.uk/people/staff/tej202/docs/chap2pdf.pdf
- review result:
  - node placement in the thermodynamics/external-potential branch is correct
  - definition correctly keeps the equilibrium tide separate from the full forced-dissipative ocean-tide problem

5. `physics-thermodynamics-optical-trapping-definition`
- local anchor: `docs/knowledge/physics/optical-trapping.md`
- source check:
  - Neuman and Block (2004), Rev. Sci. Instrum. 75, 2787
  - https://doi.org/10.1063/1.1785844
- review result:
  - node placement in the thermodynamics/external-potential branch is correct
  - optical trapping is appropriately modeled here as an external-potential redistribution problem

6. `physics-thermodynamics-intermolecular-potential-definition`
- local anchor: `docs/knowledge/physics/intermolecular-potentials.md`
- source check:
  - Born and Oppenheimer (1927), Annalen der Physik 389(20), 457-484
  - https://doi.org/10.1002/andp.19273892002
  - McDaniels and Schmidt (2016), Annu. Rev. Phys. Chem. 67, 467-488
  - https://doi.org/10.1146/annurev-physchem-040215-112047
- review result:
  - node placement in the thermodynamics tree is correct
  - the local definition is congruent with the standard Born-Oppenheimer separation from electronic structure to nuclear-coordinate energy surfaces and with the modern SAPT-style force-field route for effective intermolecular potentials

7. `physics-thermodynamics-structure-response-definition`
- local anchor: `docs/knowledge/physics/pair-correlation-structure-factor.md`
- source check:
  - Salacuse, Denton, and Egelstaff (1996), Phys. Rev. E 53, 2382
  - https://doi.org/10.1103/PhysRevE.53.2382
  - Evans (1979), Advances in Physics 28(2), 143-200
  - https://doi.org/10.1080/00018737900101365
- review result:
  - node placement in the thermodynamics tree is correct
  - the local definition is congruent with the standard use of `g(r)` and `S(k)` as equilibrium structure descriptors and with the thermodynamic-response bridge through compressibility and external-potential response

8. `physics-thermodynamics-virial-equation-of-state-definition`
- local anchor: `docs/knowledge/physics/virial-equation-of-state.md`
- source check:
  - Barbecho et al. (2025), J. Phys. Chem. A
  - https://doi.org/10.1021/acs.jpca.5c04624
  - Potoff, Errington, and Panagiotopoulos (2007), J. Phys. Chem. B 111, 11463-11473
  - https://doi.org/10.1021/jp0710685
- review result:
  - node placement in the thermodynamics tree is correct
  - the local definition is congruent with the low-density virial route, the Mayer `f`-function bridge from pair potentials to `B_2(T)`, and the explicit warning that this lane should not be overstated as a dense-liquid equation of state

9. `physics-thermodynamics-many-body-hamiltonian-definition`
- local anchor: `docs/knowledge/physics/many-body-statistical-mechanics.md`
- source check:
  - Lecture Notes on Statistical Mechanics, Section 4.6
  - https://home.uni-leipzig.de/~tet/wp-content/uploads/2016/02/datei.pdf
  - Evans (1979), Advances in Physics 28(2), 143-200
  - https://doi.org/10.1080/00018737900101365
- review result:
  - node placement in the thermodynamics tree is correct
  - the local definition is congruent with the standard equilibrium many-body route from an interacting Hamiltonian with pair and external potentials to partition functions, free energies, and nonuniform response formalisms

## DAG + tree effect

Positive effects:
- the patch creates explicit definition nodes instead of forcing these concepts through broad concept stacks
- thermodynamic external-potential response and quantum-classical-limit concepts are now separated into the right family trees
- the corrected concept matcher reduces false overlap caused by broad paper titles

Current limits:
- this review now covers the representative matcher failure plus the full thermodynamic/quantum definition chain introduced by the patch
- the remaining limitation is maturity, not placement: these nodes are still definition anchors rather than equation-bound executable claims

## Protocol note

For Tree + DAG protocol purposes, the new definition nodes should be treated as:
- definition anchors for canonical binding
- not proof-grade claims by themselves
- dependent on follow-on claim/equation/falsifier wiring when a runtime lane starts consuming them directly
