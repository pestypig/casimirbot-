# Anchors Utility

Small, isolated helpers for grounding recommendations with explicit sources.

## Files
- `anchors.config.json`: defaults and keyword routing.
- `router.ts`: intent routing (architecture, ideology, hybrid, none).
- `retriever.ts`: candidate source selection for retrieval.
- `ideologyIndex.ts`: ideology node ID indexer for verification.
- `verifier.ts`: anchor validation and sanitization.
- `formatter.ts`: stable output formatting for anchors.
- `types.ts`: shared types.

## Typical flow
1. Route intent with `routeIntent`.
2. Build retrieval candidates with `retrieveCandidates`.
3. Call the model with retrieved sources and the JSON response contract.
4. Verify anchors with `verifyAnchoredAnswer`.
5. Format with `formatAnchoredAnswer`.

## Notes
- Chat mode drops missing anchors with warnings; patch mode errors.
- Ideology anchors must match IDs in `docs/ethos/ideology.json`.
