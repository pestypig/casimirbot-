# Docs Retrieval Authority

Status: operational runbook.

CasimirBot retains historical documentation for provenance while exposing a
smaller current corpus to runtime agents. Retrieval authority controls source
admission only. It is not scientific evidence, answer text, or terminal
authority.

## Lifecycle

Each Markdown document has one retrieval status:

- `primary`: maintained authority for a topic family.
- `supporting`: current evidence, supplement, contract, or runbook that may
  support but not silently replace a primary document.
- `archive`: superseded, historical, synthetic, or developmental material.
  It is admitted only by an exact title/path or explicit archive scope.
- `excluded`: generated noise that never enters runtime retrieval.

`docs.search` accepts these scopes:

- `default`: primary and supporting documents, plus one exact archival title
  or path when requested.
- `include_archive`: current and archival documents for an explicit history or
  version comparison.
- `archive_only`: archival documents only.

The runtime chooses whether a user's goal requires archival comparison. Helix
validates that requested scope, applies the taxonomy, preserves provenance, and
reports suppression reasons. The resulting observation must still re-enter the
runtime before an answer can become terminal.

## Topic Admission

Broad natural questions about a topic with a declared `primary` document use
that topic's current Docs corpus by default. The pilot topic families are
`nhm2` and `casimir-dp`. Topic matching is deliberately bounded: every
normalized topic term must be present, so a generic Casimir-effect question
does not become a Casimir-DP document request.

Hard user intent still wins over this default:

- explicit web research remains web research;
- explicit repository/code inspection remains repository inspection;
- explicit scholarly-paper lookup remains scholarly research;
- a conversational follow-up may reuse already materialized document evidence
  without forcing another search.

Versioned archive access remains available. An exact title request is matched
by its significant title tokens, so natural wording such as "the dated NHM2
current status whitepaper" can retrieve the dated file without widening the
whole query to archive scope.

## Taxonomy

Authority metadata lives in `docs/doc-taxonomy.v1.json`:

```json
{
  "retrievalStatus": "primary",
  "topicId": "nhm2",
  "authorityRank": 100,
  "supersededBy": "docs/research/nhm2-current-status-whitepaper.md"
}
```

Document entries override prefix retrieval rules as a complete authority
decision. This lets a topic prefix default to archive while one maintained
whitepaper remains primary. Do not infer authority from modification time
alone.

## Migration Procedure

For each topic family:

1. Identify the maintained document that states the current claim boundary.
2. Mark that document `primary` with the highest family authority rank.
3. Keep only current, uniquely useful evidence or operational material as
   `supporting`.
4. Mark superseded generations `archive` and record `supersededBy` when one
   maintained replacement exists.
5. Mark generated, duplicated, or non-document output `excluded` only after
   confirming no provenance or exact-document use remains.
6. Add tests for a broad current query, an exact archived title/path, and an
   explicit historical comparison.
7. Run natural multi-turn prompts through the keyed Ask server and compare the
   selected document paths, bounded passages, citations, and final answer.

Do not delete or move uncertain files during classification. Physical cleanup
is a separate review after retrieval behavior is proven.

### Corpus migration

Migrate one topic family at a time. Run the audit before and after each batch,
review every new primary assignment manually, and keep ambiguous files as
`archive` rather than deleting them. A family is migration-complete only after
its broad current query, supporting-document query, exact historical query, and
natural follow-up all pass with the expected admission reasons.

## Audit

Run:

```bash
npx tsx scripts/audit-docs-retrieval-authority.ts
```

The JSON report lists corpus totals, topic/status counts, primary documents,
and archival topic documents that still lack a supersession target.

Pilot audit at implementation time classified 3,846 Markdown documents:

- 2 `primary`
- 506 `supporting`
- 3,338 `archive`
- 0 archival NHM2 or Casimir-DP topic documents lacking supersession

These are migration evidence, not permanent expected counts. Future documents
may change the totals while preserving the authority invariants.

## Keyed Evidence

The natural prompt corpus at
`artifacts/helix-ask-docs-retrieval-authority/policy-runs/user-prompt-corpus-1786420905003`
passed 4/4 scenarios: broad NHM2, broad Casimir-DP, explicit dated NHM2, and a
supporting-supplement request. The narrow archive rerun at
`artifacts/helix-ask-docs-retrieval-authority/policy-runs/user-prompt-corpus-1786421300199`
passed 1/1 and recorded `exact_title_requested` for the dated file. The
supporting case recorded `default_supporting` without displacing the primary.

## Required Checks

```bash
npx vitest run server/services/helix-ask/__tests__/docs-search-taxonomy.test.ts --pool=forks
npx vitest run server/services/helix-ask/__tests__/internet-search-intent-doc-continuation.test.ts --pool=forks
npx vitest run server/services/helix-ask/workstation-tool-gateway/__tests__/registry.test.ts -t "NHM2|archive" --pool=forks
npx vitest run client/src/lib/docs/__tests__/docManifest.spec.ts --pool=forks
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npm run helix:ask:discipline:quick
```

Use keyed Ask tests after server-side search or provider observation projection
changes. Do not add retrieval policy to the retired `server/routes/agi.plan.ts`.
