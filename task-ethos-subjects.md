# Ideology Knowledge Subjects - Task List

Purpose: ensure every ideology tree branch is covered by a concept card so Helix Ask can discuss the full ethos graph.

Guidelines for each subject doc:
- One node per file under `docs/knowledge/ethos/`.
- Use frontmatter fields: id, label, aliases, scope, intentHints, topicTags, mustIncludeFiles.
- Keep definitions short and repo-grounded (anchor to `docs/ethos/ideology.json`).

---

## Coverage goals
- [x] Inventory all nodes in `docs/ethos/ideology.json`.
- [x] Generate concept cards for every ideology node under `docs/knowledge/ethos/`.
- [x] Expand ideology topic routing to include `docs/knowledge/ethos/`.
- [x] Expand ideology intent matching to include ideology node titles/slugs.
- [x] Rebuild code lattice to index the new docs.
- [x] Run `npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl`.

---

## Validation checklist
- [ ] Confirm concept registry includes a sample node (e.g., `mission-ethos`).
- [ ] Ask Helix Ask for at least 3 ideology nodes and verify citations anchor to `docs/ethos/ideology.json`.
