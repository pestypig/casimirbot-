# Helix Ask Flow (Grounded)

This note summarizes how Helix Ask answers "how does the system work" questions
using repo-grounded context before the LLM writes.

## Core flow
1) The UI collects the question and opens a Helix Ask session so the exchange
   can be saved to the console. (desktop or HelixAskPill)
2) The client builds a context set:
   - In grounded mode, it requests resonance selections from plan().
   - If search fallback is enabled, it also queries the code lattice.
3) The client builds a grounded prompt that embeds the question and context and
   enforces answer format constraints. (buildGroundedPrompt)
4) The prompt is sent to /api/agi/ask, which invokes the local LLM handler.
5) The response is cleaned (echo removal + formatting) and returned.
6) The UI renders the answer and stores it in the Helix console session.

## Format routing
Helix Ask routes the answer format based on the question:
- Steps: process/implementation questions get 6-9 numbered steps.
- Compare: comparisons use short paragraphs + a small bullet list.
- Brief: short paragraphs for definition/summary questions.
Stage tags (observe/hypothesis/experiment/analysis/explain) are only included
when the question explicitly mentions method/scientific method.

## Two-pass synthesis (optional)
When HELIX_ASK_TWO_PASS=1, the server can do a two-stage reply:
1) Distill context into evidence bullets or steps (small token budget).
2) Expand the scaffold into the chosen format plus a short "In practice"
   paragraph.

## Key files
- client/src/pages/desktop.tsx
- client/src/components/helix/HelixAskPill.tsx
- client/src/lib/agi/api.ts
- server/routes/agi.plan.ts
