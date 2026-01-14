# Zen Society Reusable Artifact Pack

This directory contains reusable templates aligned to `docs/ethos/ideology.json`
for the Zen Society pillars.

Contents
- `templates/` pillar templates (one per pillar).
- `templates/artifacts/` shared artifact templates (charter, protocol, ledger,
  dashboard).
- `templates/signatory-registry.md` and `templates/decision-log.md` for
  provenance and continuity artifacts.
- `ethos-crosswalk.json` canonical mapping of artifactId -> nodeRefs ->
  requiredChecks.
- `gates.md` standard gates for legal + ethos signoff and verification loops.

Usage
1. Pick a pillar template in `templates/` and fill the fields.
2. Instantiate the shared artifact templates for each pillar deployment.
3. Record evidence links and review cadence in each artifact.
4. Apply `gates.md` and update `ethos-crosswalk.json` if checks change.
