# Physics Knowledge Subjects - Task List

Purpose: define the curated subjects to author (or import with rights) so Helix Ask can answer
very specific physics questions using repo-grounded references.

Guidelines for each subject doc:
- One concept per file.
- Short and factual (2-6 bullets).
- Include frontmatter fields: id, aliases, scope, intentHints, topicTags, mustIncludeFiles.
- Cite repo anchors only (no external citations in the body).
- Prefer docs under `docs/knowledge/physics/` or `docs/knowledge/warp/`.

---

## Long-term solution stack (single build session)
- [ ] Curated concept docs: author the full subject list below under `docs/knowledge/physics/` and `docs/knowledge/warp/`.
- [ ] Topic routing + allowlists: add topic tags + allowlist tiers for physics/warp docs in `server/services/helix-ask/topic.ts`.
- [ ] Concept cards + aliases: add concept cards with `id` + `aliases` and wire concept matching in `server/services/helix-ask/concepts.ts`.
- [ ] Index/retrieval rebuilds: run `npm run build:code-lattice` after docs land.
- [ ] Regression tests + gates: add routing tests for 3-5 definition prompts and run `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`.
- [x] Reasoning visibility audit: confirm every ladder stage emits live debug events and trace fields (see below).

---

## Reasoning ladder visibility (required for new runtime features)
- [x] Inventory ladder stages (intent → topic → plan pass → retrieval → evidence gates → arbiter → synthesis → citation repair → final envelope).
- [x] Map each stage to a live event + debug payload field (e.g., `logEvent` + `debugPayload.*`).
- [x] Add missing events for:
  - [x] intent match + reason
  - [x] topic tags + must-include status
  - [x] allowlist tier chosen + docs-first outcome
  - [x] coverage/belief/rattling gate decisions
  - [x] arbiter mode + reason
  - [x] final answer mode + citations required/used
- [ ] Add a regression check that asserts all stages emit a trace event for a sample Helix Ask request.

---

## A) Foundations (units, constants, math)
- [ ] Units systems (SI vs geometrized, c=G=1)
- [ ] Dimensional analysis and unit checking
- [ ] Fundamental constants used in repo (c, G, hbar, kB)
- [ ] Energy, power, mass equivalence (E=mc^2) and conversions
- [ ] Scaling laws and order-of-magnitude reasoning

## B) Classical EM + Casimir prerequisites
- [ ] Vacuum fluctuations overview (repo-safe, minimal)
- [ ] Boundary conditions and mode quantization (parallel plates)
- [ ] Casimir force and energy density (baseline formulas)
- [ ] Dynamic Casimir effect (qualitative overview)
- [ ] Geometry effects (sphere/plate, cavity modes)

## C) Quantum field / negative energy constraints
- [ ] Stress-energy tensor basics (T_mu_nu)
- [ ] Energy conditions (NEC, WEC, SEC, DEC) with repo context
- [ ] Quantum inequality bounds (Ford-Roman)
- [ ] Sampling time and duration bounds (tau relationships)
- [ ] Negative energy density interpretation limits

## D) Relativity and GR essentials
- [ ] Spacetime metric basics (signature, coordinates)
- [ ] Connection and curvature (Christoffel, Riemann, Ricci, scalar)
- [ ] Einstein field equations (G_mu_nu = 8pi T_mu_nu)
- [ ] ADM decomposition / 3+1 split (lapse, shift, spatial metric)
- [ ] York time and constraint equations (Hamiltonian/momentum)

## E) Warp bubble theory (repo-aligned)
- [ ] Alcubierre metric basics (qualitative)
- [ ] Natario zero-expansion warp bubble
- [ ] Shift vector and expansion scalar definitions
- [ ] Bubble wall thickness and energy density localization
- [ ] Van den Broeck compression factor (gamma_VdB)

## F) Casimir-warp pipeline specifics
- [ ] Casimir lattice / tile mechanism
- [ ] Sector strobes and duty cycle definitions
- [ ] Active fraction / burst duty definitions
- [ ] Ford-Roman compliance proxy in pipeline
- [ ] Power and mass ladders used in UI

## G) Simulation + numerical considerations
- [ ] Discretization choices (mesh, grid resolution)
- [ ] Stability and timestep considerations
- [ ] Numerical error/precision notes
- [ ] Visualization mapping (units, scaling)

## H) Safety + maturity framing
- [ ] Math maturity stages (exploratory -> certified)
- [ ] What "viability" means in this repo
- [ ] Certificate and integrity_ok meaning
- [ ] What results are *not* claims of feasibility

---

## Optional topic packs (if you plan to add external references)
- [ ] Public-domain GR references (summarized, not copied)
- [ ] Public-domain QFT references (summarized, not copied)
- [ ] Glossary of key symbols used in repo

---

## Deliverable checklist
- [ ] Create folder: `docs/knowledge/physics/`
- [ ] Author first 10 subjects from sections A-D
- [ ] Add topic tag wiring in `server/services/helix-ask/topic.ts`
- [ ] Rebuild code lattice after docs: `npm run build:code-lattice`
- [ ] Add routing tests for at least 3 physics definition prompts
