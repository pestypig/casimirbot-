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
- [x] Curated concept docs: author the full subject list below under `docs/knowledge/physics/` and `docs/knowledge/warp/`.
- [x] Topic routing + allowlists: add topic tags + allowlist tiers for physics/warp docs in `server/services/helix-ask/topic.ts`.
- [x] Concept cards + aliases: add concept cards with `id` + `aliases` and wire concept matching in `server/services/helix-ask/concepts.ts`.
- [x] Index/retrieval rebuilds: run `npm run build:code-lattice` after docs land.
- [x] Regression tests + gates: add routing tests for 3-5 definition prompts and run `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`.
- [x] Reasoning visibility audit: confirm every ladder stage emits live debug events and trace fields (see below).

---

## Reasoning ladder visibility (required for new runtime features)
- [x] Inventory ladder stages (intent -> topic -> plan pass -> retrieval -> evidence gates -> arbiter -> synthesis -> citation repair -> final envelope).
- [x] Map each stage to a live event + debug payload field (e.g., `logEvent` + `debugPayload.*`).
- [x] Add missing events for:
  - [x] intent match + reason
  - [x] topic tags + must-include status
  - [x] allowlist tier chosen + docs-first outcome
  - [x] coverage/belief/rattling gate decisions
  - [x] arbiter mode + reason
  - [x] final answer mode + citations required/used
- [x] Add a regression check that asserts all stages emit a trace event for a sample Helix Ask request.

---

## A) Foundations (units, constants, math)
- [x] Units systems (SI vs geometrized, c=G=1)
- [x] Dimensional analysis and unit checking
- [x] Fundamental constants used in repo (c, G, hbar, kB)
- [x] Energy, power, mass equivalence (E=mc^2) and conversions
- [x] Scaling laws and order-of-magnitude reasoning

## B) Classical EM + Casimir prerequisites
- [x] Vacuum fluctuations overview (repo-safe, minimal)
- [x] Boundary conditions and mode quantization (parallel plates)
- [x] Casimir force and energy density (baseline formulas)
- [x] Dynamic Casimir effect (qualitative overview)
- [x] Geometry effects (sphere/plate, cavity modes)

## C) Quantum field / negative energy constraints
- [x] Stress-energy tensor basics (T_mu_nu)
- [x] Energy conditions (NEC, WEC, SEC, DEC) with repo context
- [x] Quantum inequality bounds (Ford-Roman)
- [x] Sampling time and duration bounds (tau relationships)
- [x] Negative energy density interpretation limits

## D) Relativity and GR essentials
- [x] Spacetime metric basics (signature, coordinates)
- [x] Connection and curvature (Christoffel, Riemann, Ricci, scalar)
- [x] Einstein field equations (G_mu_nu = 8pi T_mu_nu)
- [x] ADM decomposition / 3+1 split (lapse, shift, spatial metric)
- [x] York time and constraint equations (Hamiltonian/momentum)

## E) Warp bubble theory (repo-aligned)
- [x] Alcubierre metric basics (qualitative)
- [x] Natario zero-expansion warp bubble
- [x] Shift vector and expansion scalar definitions
- [x] Bubble wall thickness and energy density localization
- [x] Van den Broeck compression factor (gamma_VdB)

## F) Casimir-warp pipeline specifics
- [x] Casimir lattice / tile mechanism
- [x] Sector strobes and duty cycle definitions
- [x] Active fraction / burst duty definitions
- [x] Ford-Roman compliance proxy in pipeline
- [x] Power and mass ladders used in UI

## G) Simulation + numerical considerations
- [x] Discretization choices (mesh, grid resolution)
- [x] Stability and timestep considerations
- [x] Numerical error/precision notes
- [x] Visualization mapping (units, scaling)

## H) Safety + maturity framing
- [x] Math maturity stages (exploratory -> certified)
- [x] What "viability" means in this repo
- [x] Certificate and integrity_ok meaning
- [x] What results are *not* claims of feasibility

---

## Optional topic packs (if you plan to add external references)
- [ ] Public-domain GR references (summarized, not copied)
- [ ] Public-domain QFT references (summarized, not copied)
- [ ] Glossary of key symbols used in repo

---

## Deliverable checklist
- [x] Create folder: `docs/knowledge/physics/`
- [x] Author first 10 subjects from sections A-D
- [x] Add topic tag wiring in `server/services/helix-ask/topic.ts`
- [x] Rebuild code lattice after docs: `npm run build:code-lattice`
- [x] Add routing tests for at least 3 physics definition prompts
