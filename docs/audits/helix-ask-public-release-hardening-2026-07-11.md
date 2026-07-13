# Helix Ask public-release hardening audit — 2026-07-11

## Decision

**Repository-wide public release: NO-SHIP.**

**Helix Ask runtime/tool patch: ready for fresh-server and live-UI final validation.** The deterministic Ask, gateway, account-policy, terminal-authority, adversarial prompt, and full Codex provider-wrapper checks listed below pass. The provider-wrapper suite is now 133/133 after resolving real routing/presentation defects and rebaselining only expectations that contradicted the Codex-owned execution boundary. The repository-wide release remains blocked by dependency vulnerabilities, the existing TypeScript baseline, strict runtime-authority findings, production security configuration, and the deferred fresh-server/live validation.

This audit did not start or restart the user-owned server, invoke paid/live LLM wrappers, mutate the live UI, publish externally, or alter dependency versions.

## 2026-07-12 continuation update

The hardening continuation repaired the failure pattern observed in the UI where a valid scholarly observation was followed by either `terminal_authority_missing`, a stale compound typed failure, or an unrelated Theory Badge Graph answer.

Key changes:

1. Route-checked scholarly response modes now retain their exact terminal kind (`scholarly_metadata_answer`, `scholarly_numeric_missing`, `scholarly_recovery_plan`, and related bounded modes) after normalized observation re-entry.
2. Weak scholarly matches remain blocked from generic provider-answer authority while their dedicated exploratory or recovery product can still surface with claim boundaries.
3. Stale `typed_affordance_binding_missing` failures no longer override a current-turn scholarly terminal after the lookup actually executed and normalized evidence exists.
4. Scholarly follow-ups preempt unrelated document/graph products, including the explicit missing-prior-evidence recovery case.
5. Explicit gateway calls and bounded active calculator/workstation observations are represented in tool admission before route commitment. This repaired active calculator and active workstation context turns and restored multi-capability explicit gateway execution.
6. Compound provider route products now win over single workstation evaluations and use their target artifact schema.
7. The terminal single writer now records `terminal_eligible` consistently on synchronized answer authority.
8. Workspace status, calculator, repo, document-open, theory, civilization, and natural compound routes now retain the route product selected by the completed solver path instead of being displaced by stale capability-help, receipt, or compound artifacts.
9. Missing docs/repo/web/scholarly evidence fails closed with source-specific typed failures; failed or blocked observations cannot materialize successful theory or receipt terminals.
10. Prompt-derived civilization admission is clause bounded and suppresses negated, future, historical, screen-visible, and quoted cues while preserving an affirmative current clause in mixed prompts.
11. Scholarly lookup, full-text fetch, PDF rendering, Image Lens parsing, and narration are represented as typed dependent affordances. Helix does not privately auto-execute those dependent steps; Codex owns execution and observation re-entry.
12. The visible transcript and debug terminal projection are synchronized from the final single-writer selection, preventing copied text, UI text, and debug authority from disagreeing.

Current verification added by this continuation:

- Prompt-solving/adversarial benchmark: 25/25 pass in 216.32 seconds (241.23 seconds total runner duration).
- Capability plan, lifecycle, API parity, and terminal equivalence batch: 117/117 pass.
- Golden runtime, negated-tool admission, and readiness matrix: 84/84 pass.
- Scholarly tool plus terminal single-writer: 81/81 pass.
- Provider terminal authority: 9/9 pass.
- Account/session/panel/gateway policy battery: 222/222 pass.
- Static Codex discipline guard: pass.
- Full provider-wrapper suite: 133/133 pass.

## 2026-07-12 live capability-question regression follow-up

A fresh UI debug export for the exact no-tool scholarly capability question exposed a deterministic native-loop defect that the earlier provider-wrapper matrix did not cover. The visible `capability_help_summary` looked successful, but the trace had incorrectly extracted `image_lens.inspect` as a mandatory compound subgoal, applied a live-source phase repair to the unrelated capability-catalog route, attempted `live_env.read_processed_live_source_mail` five times, counted rejected-call bookkeeping as progress, and authorized the terminal while the normalized rail still reported `solver_path_incomplete_before_terminal`.

The follow-up patch:

1. Treats clause-scoped questions about a research-paper tool's workflow as explanatory capability mentions, not Image Lens execution commands.
2. Preserves a later affirmative command such as “Then use Image Lens to inspect the attached page.”
3. Keeps hyphenated `research-paper` wording on the focused scholarly workflow summary instead of the generic catalog dump and omits irrelevant document/note context footers.
4. Limits live-source phase repair to canonical live-source/live-environment goals.
5. Accepts the current-turn `capability_registry_inspect` observation as satisfying the catalog subgoal, preventing duplicate catalog execution after goal satisfaction.
6. Classifies tool-policy rejection as non-retryable and prevents failed-call bookkeeping artifacts from resetting the no-progress guard.

Verification after this repair:

- Exact native E17 route: pass; focused answer, one catalog observation, no Image Lens subgoal, no runtime tool call, no live-mail selection, complete parity rail.
- Full E17 controller: 13/13 pass.
- Focused capability/compound/continuation/summary regressions: 71/71 pass.
- Live-source phase resolver, live-environment loop, and capability intent/summary boundaries: 91/91 pass.
- Full provider-wrapper suite: 133/133 pass.
- API parity matrix: 28/28 pass.
- Prompt-solving/adversarial benchmark: 25/25 pass.
- Capability plan, lifecycle, and terminal equivalence: 89/89 pass.
- Static Codex discipline guard: pass.
- Server build: pass with the same four previously classified unrelated warnings.
- `git diff --check`: pass; line-ending notices only.

### Probability scorecard

These are engineering confidence estimates, not statistical guarantees:

| Surface | Confidence | Basis |
|---|---:|---|
| Deterministic Helix Ask route, evidence, and terminal contracts | 0.98 | Provider 133/133; authority 58/58; plan/lifecycle/parity/equivalence 117/117 |
| Adversarial tool/source admission | 0.97 | Prompt benchmark 25/25 plus provider clause-boundary cases |
| Developer/user gateway and panel boundaries | 0.98 | Account/session/panel/gateway battery 222/222 |
| Fresh keyed-server and UI parity | 0.72 | Strong deterministic evidence, but the user-owned server was intentionally not restarted and the final UI matrix remains outstanding |
| Repository-wide public release | 0.30 | Helix patch is pre-live ready; security, dependency, TypeScript, strict authority-audit, and deployment blockers remain |

### Representative prompt/output/verdict evidence

| Class | Representative prompt | Observed output contract | Verdict |
|---|---|---|---|
| Direct active context | “What is this calculator result?” with `8 * 9 = 72` in active context | Provider terminal: “The calculator is showing 8 * 9 = 72.”; one active-context observation | PASS |
| Explanatory capability question | “Does your research-paper tool … use Image Lens? … Do not retrieve a paper or call a tool.” | Focused lookup → full-text → selective Image Lens explanation; catalog observation only; no Image Lens/live-mail/runtime-tool subgoal | PASS |
| Missing source | Natural repo search without a query | Source-specific typed failure containing `repo.search: missing_query`; no invented repo claim | PASS (fail closed) |
| Multi-tool | Current NHM2 document + `6*7` + scholarly lookup + theory + civilization reflection | Five admitted capability observations and one bounded compound route product | PASS |
| Dependent scholarly work | Find a paper and “show me the science” | Metadata/recovery terminal names full-text fetch as the next step; no false PDF, page, equation, or Image Lens claim | PASS (bounded continuation) |
| Adversarial mutation/admission | Negated, future, historical, quoted, or screen-visible civilization/tool cues | No prompt-derived capability call; a current affirmative mixed clause remains admissible | PASS |
| Failed observation | Failed Theory Badge Graph receipt inside a compound route | Failed artifact cannot materialize a successful theory answer; precise gateway failure remains terminal | PASS (fail closed) |

## Scope and classification

The patch spans:

- prompt interpretation and intent arbitration;
- source and tool admission;
- typed argument contracts;
- evidence normalization and re-entry;
- follow-up reasoning;
- committed-route and terminal authority;
- client/debug presentation parity;
- provider continuation behavior;
- developer/user account policy;
- public localization exposure.

Codex-owned model sampling, generic tool execution, approval/sandbox lifecycle, session compaction, and subagent orchestration were not reimplemented.

## Resolved defects

1. Direct conversation and capability-help turns now reach deterministic terminal authority instead of falling into missing-artifact or retrieval-required failures.
2. Provider reasoning resumes no longer derive a second workstation call after a tool observation.
3. Active-document identity preserves the exact current-document job-ready link.
4. Document section/search terminals accept both `matches[]` and `locations[]`, preserve source locations, and supersede contradicted pre-tool commentary.
5. Locate-then-note prompts arbitrate to note mutation, execute at most one mutation, reconcile existing receipts, and retain adversarial suppression for negated, quoted, historical, future, and conditional text.
6. Capability help preserves mixed help/action intent while pure capability questions remain non-executing.
7. Tool-family contracts and typed arguments were completed for scholarly, moral, theory, debug, text-to-speech, image, notes, and related gateway paths.
8. Docs search prefers canonical taxonomy documents and penalizes sidecars.
9. Runtime-evidence/debug provider capabilities remain safe while live-pipeline capability substitution remains blocked.
10. Duplicate Helix debug/terminal object keys were removed from provider, Ask debug export, and slim-debug projection; server bundle warnings fell from eight to four.
11. Public localization is now fail-closed by release status. Public accounts receive English, German, and Arabic; all other catalogs remain developer previews. The UI and gateway enforce the same boundary.
12. Hawaiian `Code Admin` is no longer identical to the English source. Incomplete preview catalogs remain visible in audit output rather than being mislabeled as complete.

## Capability and account inventory

- Gateway manifests: 72 total.
- Modes: 59 read, 11 act, 1 observe, 1 verify.
- Mutating gateway capabilities: `account_session.set_interface_language` only.
- Terminal-eligible gateway capabilities: `account_session.set_interface_language` only; it is a governed workspace-action receipt and still requires post-tool model re-entry.
- Public policy capabilities: 32.
- Public gateway capabilities represented by manifests: 31.
- Explicit route-owned, non-gateway public capability: `postulate.submit_proposal`.
- Developer policy remains a superset through wildcard panels, runtimes, and capabilities.
- No session defaults to `user`; production local sign-in cannot mint a developer account.
- Public maximum gateway permission is `act`; public capabilities in the manifest surface have no shell or code mutation.

## Deterministic verification evidence

### Core Ask and route authority

- E17 general step controller: 13/13 pass.
- Prompt-solving/adversarial benchmark: 25/25 pass.
- API parity matrix: 28/28 pass, repeated after debug-key cleanup.
- Terminal equivalence harness: 6/6 pass.
- Capability lifecycle ledger: 8/8 pass.
- Terminal single-writer: 49/49 pass.
- Agent-provider route: 17/17 pass.
- Golden runtime paths: 53/53 pass.
- Compound live-probe fixtures: 63/63 pass.
- Compound coverage gate: 7/7 pass.
- Capability catalog boundary: 17/17 pass.

### Gateway and capability contracts

- Explicit workstation gateway: 142/142 pass.
- Provider capability contract: 45/45 pass.
- Provider parity: 13/13 pass in isolation. A concurrent batch first hit its 15-second timeout; the isolated rerun passed in 10.89 seconds with no assertion failure.
- Gateway route: 23/23 pass after public/developer language projection tests.
- Tool-family parity: 78/78 pass.
- Capability plans: 75/75 pass.
- Capability itineraries: 24/24 pass.
- Committed routes: 22/22 pass.
- Gateway readiness/account-policy matrix: 4/4 pass.
- Client backend entrypoint policy: 18/18 pass.

### Account, UI, and localization

- Account session API: 19/19 pass.
- Desktop policy source: 2/2 pass.
- Locked-panel host policy: 2/2 pass.
- Account language UI: 7/7 pass.
- Interface catalog integrity: 6/6 pass.
- `npm run i18n:check`: pass; incomplete preview catalogs are warnings.
- `npm run i18n:coverage`: pass for public-release catalogs; preview gaps remain itemized.
- Workstation static-language audit: pass with 0 unresolved static UI and 0 uncataloged shared-data items.

### Build and static checks

- `npm run helix:ask:discipline:quick`: pass.
- Live-debug slim tests and extraction boundary: 2/2 pass.
- `npm run build:server`: pass.
- `npm run build:client`: pass; 8,735 modules transformed.
- Public claim disclaimer check: pass (2 checked).
- `git diff --check`: pass.

## 2026-07-12 capability-help terminal truncation follow-up

Live prompt:

`Does your research-paper tool let you choose papers it can parse, or do you first check which papers are openable and then use Image Lens? Answer only from your capability contract. Do not retrieve a paper or call a tool.`

Observed defect:

- The runtime produced the complete 1,014-character capability answer and executed zero runtime tool calls.
- Goal satisfaction reported `satisfied` and `allow_terminal`, with current-turn `capability_registry` and `capability_help_summary` artifacts.
- An earlier `terminal_not_materialized` single-writer failure remained authoritative after the model selected the answer step.
- The visible answer was therefore the 240-character `terminal_text_preview`, ending mid-token at `scholarly-researc`, while the complete answer remained only in `typed_failure.message`.

Repair:

- Response-boundary terminal authority now refreshes a stale typed-failure writer only when the canonical goal is satisfied, the required non-failure terminal kind is route-approved, the failure is materialization/authority/projection-related, and a current-turn artifact of that exact kind contains terminal text.
- Runtime authority now retains the earlier capability-catalog selection/execution proof from `capability_plan` or `tool_turn_chain_audit` after the model advances to `model.direct_answer`.
- Successful capability-help terminalization removes stale `typed_failure` state and publishes the full summary through `terminal_presentation.concise_text`; the 240-character preview remains diagnostic only.
- Missing or route-forbidden terminal artifacts remain fail-closed.

Verification:

- Terminal authority plus runtime authority: 90/90 pass.
- Client terminal projection: 17/17 pass.
- Exact scholarly/Image Lens capability prompt: pass; answer length greater than 240, full presentation equality, no typed failure.
- Full E17 controller: 13/13 pass.
- API parity matrix: 28/28 pass.
- Capability lifecycle ledger: 8/8 pass.
- Terminal equivalence harness: 6/6 pass.
- `npm run helix:ask:discipline:quick`: static checks pass with the existing advisory warnings.
- `npm run build:server`: pass with the same four unrelated duplicate-key/dead-case warnings recorded below.
- One concurrent exact-route run returned HTTP 503 while API parity was consuming workers; the isolated rerun passed in 45.19 seconds and the subsequent full E17 suite passed 13/13.

Second live trace follow-up:

- A fresh-server retest still stopped at 240 characters. The full 1,014-character draft was present, but the final-answer draft materializer labeled the capability answer as `model_synthesized_answer`; the committed capability route permits only `capability_help_summary`, so terminal authority correctly failed closed and the stale failure preview remained visible.
- Capability-catalog drafts now materialize as `capability_help_summary` only when a current-turn `capability_registry` supports the draft and the route explicitly allows that product.
- The post-tool authority bridge now recognizes `capability_help` as the capability-catalog family, requires `capability_help_summary`, and does not overwrite that specialized route product with a generic model answer.
- Debug export now supplies a synchronized single-writer mirror from terminal authority when an already-authoritative early terminal path did not retain the writer result object.
- Focused capability materialization/bridge tests: 54/54 pass. Terminal/runtime authority aggregate: 118/118 pass. Full E17: 13/13 pass. API parity: 28/28 pass. Prompt-solving benchmark: 25/25 pass. Terminal/UI equivalence: 48/48 pass. Debug-export projection: pass. Server build: pass with the same four unrelated warnings. Discipline quick check: pass with advisory warnings.
- One broader client resolver test remains red in the pre-existing quoted-tool-name legacy-shadow scenario (`legacy_shadow` versus `selected_final_answer`); the 17-test Ask terminal projection suite passes and this failure is outside the capability-help server patch.

Scholarly provider-failure follow-up:

- A live `scholarly-research.lookup_papers` turn correctly reported `semantic_scholar_http_429` and rejected weak fallback matches, but terminal authority projected only the 240-character preview while the UI showed a longer recovery explanation.
- The typed-failure public-mirror synchronizer now prefers the complete typed-failure message/text or `terminal_failure_text`; `terminal_text_preview` remains a bounded diagnostic fallback and is never allowed to replace a full failure artifact.
- Three identical explicit scholarly lookup requests were dispatched in the same turn. Explicit workstation gateway requests now pass through the shared request-key deduplicator before admission, collapsing repeated scholarly lookup requests to one call while preserving distinct non-equivalent requests.
- Verification: terminal-writer plus explicit-gateway suites 195/195 pass; scholarly tool suite 32/32 pass; focused provider recovery 3/3 pass; response-boundary mirrors 9/9 pass; API parity 28/28 pass; capability plan/lifecycle 83/83 pass; prompt-solving benchmark 25/25 pass; server build and discipline quick checks pass. The server retains the same four unrelated warnings.

Direct scholarly full-text routing follow-up:

- A direct operator request for `scholarly-research.fetch_full_text` on an explicit arXiv PDF URL was incorrectly rewritten into `scholarly-research.lookup_papers`. The lookup returned exact metadata, but the required fetch subgoal never executed; metadata was then surfaced even though the full-text requirement remained unsatisfied.
- Explicit direct-source fetches now admit `scholarly-research.fetch_full_text` with the gateway-native `source_url` argument. They do not synthesize a lookup subgoal when lookup is absent or explicitly negated. Prompts that affirmatively request lookup and then fetch retain the lookup-first compound workflow.
- Scholarly capability-chain intent now treats an affirmative named `fetch_full_text` call as a full-text workflow. Direct-source chains begin with fetch, while discovery chains remain lookup then fetch. ArXiv/DOI identity is retained in source-target provenance rather than sent as gateway fields that the fetch manifest does not admit.
- Terminal authority regression coverage confirms that a required dropped full-text subgoal produces a typed `compound_subgoal_dropped` failure and cannot terminate with metadata alone.
- Verification: explicit gateway plus terminal-writer suites 198/198 pass; scholarly intent 7/7 pass; discipline quick static checks pass; server build passes with the same four unrelated warnings. The broader scholarly-tool, prompt-solving benchmark, and API parity Vitest processes were terminated by the Windows paging-file limit before reporting a verdict and remain required on a host with sufficient memory or after the retained local server is safely stopped.

Direct full-text/Image Lens negation collision follow-up:

- The live direct-fetch retest correctly requested, admitted, and executed exactly one `scholarly-research.fetch_full_text` call and selected eight bounded chunks. No lookup or Image Lens call executed.
- Post-observation reasoning was nevertheless preempted by the scientific-image continuity shortcut. Its explicit Image Lens exclusion scanner stopped at the internal dot in the earlier negated capability identifier `scholarly-research.lookup_papers`, so `Do not run scholarly-research.lookup_papers or use Image Lens` was incorrectly treated as an Image Lens continuity request.
- Dotted identifiers are now normalized only for exclusion-clause boundary parsing. Internal capability dots no longer terminate a negation clause, while a real sentence-ending period still ends the clause; the following affirmative sentence can therefore request Image Lens normally.
- Focused routing, terminal, and dotted-negation regressions pass 4/4. Discipline quick static checks pass. The first server build attempt hit the Windows paging-file limit; the bounded `GOMAXPROCS=1` rerun passes with the same four unrelated warnings.

Full-text response-mode negation follow-up:

- The next live retest materialized a valid terminal and again executed only `scholarly-research.fetch_full_text`. The full-text observation was successful: `full_text_usable`, 17 parsed pages, eight bounded selected chunks, and no fetch missing requirements.
- Scholarly response-mode selection still treated the negated phrase `use Image Lens` as a positive `page_image_parse` request. Because page-image depth outranked full-text depth, terminal authority surfaced `scholarly_evidence_escalation_missing` despite already-usable full text.
- Scholarly follow-up mode selection and visual-escalation detection now operate on affirmative operator text with negated clauses removed. Dotted capability identifiers remain clause-internal, contrast boundaries remain usable, and a later affirmative sentence can still request Image Lens.
- Focused negation/mode tests pass 2/2, and the existing equation/scientific-packet plus page-image escalation regressions pass 2/2. The earlier direct-routing/terminal set remains 4/4 green.

Direct full-text terminal-authority follow-up:

- The next live retest retained `full_text_usable` evidence but terminal authority returned `scholarly_answer_synthesis_failed_after_full_text_observed`. The candidate had been rewritten to claim that no `lookup_papers` observation existed, even though the direct `fetch_full_text` observation was current-turn, normalized, and successful.
- Scholarly observation authority now recognizes both lookup observations and direct full-text observations. A successful `full_text_usable` result explicitly selects `scholarly_research_answer`, preserves the model-authored evidence-grounded answer, and admits the full-text capability contract as terminal support without requiring a synthetic lookup.
- Deterministic response-mode coverage and a full provider integration regression both pass 2/2. The integration proves exactly one direct fetch, completed evidence re-entry, granted terminal authority, and `scholarly_research_answer` as both terminal artifact kind and final source.
- Fresh keyed-server validation passed: exactly one `scholarly-research.fetch_full_text` request was requested, admitted, and executed; evidence state was `full_text_usable`; 17 pages and eight bounded chunks were materialized; evidence re-entry completed; terminal authority granted `scholarly_research_answer`; and lookup/Image Lens call counts were both zero. The visible, selected, and authoritative answer reported successful extraction with no failure reason.

### Private Research Library MVP

- Successful scholarly full-text extraction now optionally persists every page-aligned text result when the Ask or gateway request has an authoritative signed-in profile. The compact scholarly observation retains page refs, selected bounded excerpts, and a private library document ref; it does not embed the complete extracted paper.
- Research Library records are profile-keyed, encrypted at rest with the profile-storage key contract, deduplicated by source integrity hash, quota bounded, soft-deletable, and removed with profile deletion. Anonymous/no-session turns remain usable for extraction but do not write into a shared anonymous library.
- Docs Viewer now exposes a separate `My Research Library` section, polls/focus-refreshes its private index, and opens saved page-aligned text with source URL, integrity hash, extraction status, and page boundaries. Canonical repository docs remain separate.
- Focused verification passed: `research-library-store.test.ts` 4/4; `doc-viewer-taxonomy-ui.spec.tsx` 19/19; low-memory server bundle PASS; Docs Viewer syntax bundle PASS; Helix Ask discipline quick static checks PASS.
- Deliberately deferred: library-document translation admission, Image Lens sidecar attachment UI, per-document export/delete controls, and fresh-server live UI validation. These should build on stable `document_id` plus page refs rather than copying source text into sidecars.

### Saved scholarly evidence re-entry repair

- A live follow-up asking to use existing full-text evidence exposed two defects: saved Research Library pages had no gateway read capability, and a comma-separated negative clause still allowed `scholarly-research.lookup_papers` to execute.
- Added `research-library.read_document`, a profile-scoped, read-only, no-network capability that resolves exact saved document id, source URL, or integrity hash and returns bounded page excerpts with exact page refs. Complete decrypted pages remain inside the encrypted profile store.
- Saved/existing full-text prompts now select the Research Library capability before scholarly lookup. ArXiv `/abs`, `/pdf`, and optional `.pdf` variants normalize to the same saved source identity.
- Fresh-server validation exposed a pre-route ordering gap: Codex committed a `model_only` route before the general gateway planner could propose the saved-library read. Pre-route authority now evaluates the same Research Library request builder and gives an exact saved-evidence match sole precedence over negated lookup, refetch, and visual alternatives.
- A second fresh-server validation showed that the default internal Helix runtime took a different path from the explicitly selected Codex provider: golden-path scholarly lookup claimed any prompt containing `arxiv` before the asynchronous saved-library gateway. Saved-evidence intent is now a shared contract signal; golden-path lookup defers it, and the bounded library read is directly admitted without requiring an external agent-runtime selector.
- Fresh keyed-server validation now passes end to end for the saved arXiv paper: `research-library.read_document` was requested, selected, admitted, executed, normalized as `research_library_observation`, re-entered with two current-turn support refs, and materialized as an authoritative `scholarly_research_answer` with the page-1 text ref. Lookup/refetch and Image Lens were not executed; the visual rail remained unobserved and the scholarly rail completed without a broken rail.
- A saved-text occurrence scan then exposed search-result semantics: incidental sentence punctuation inside a natural quoted phrase was retained (`distributionally robust.`), and a completed zero-match scan was mislabeled as missing saved evidence. Natural phrase searches now trim incidental terminal punctuation unless exact/verbatim punctuation is requested, normalize whitespace, center bounded excerpts around matches, allow up to 40 excerpts when every matching page is explicitly requested, and treat zero matches as a successful authoritative scan. Match count/page identities now survive compact model re-entry even when no excerpts exist.
- Fresh keyed-server validation of the repaired occurrence scan passed: the saved 17-page paper reported 55 case-insensitive phrase matches across 15 pages (1, 2, and 4-16), returned one bounded match-centered excerpt per matching page, re-entered the Research Library observation, and materialized an authoritative scholarly answer with two current-turn support refs. No lookup/refetch or visual capability executed.
- Fresh keyed-server validation of the zero-match contract also passed: an absent phrase returned `0 matches; pages: none` from a succeeded, answer-selected, `full_text_usable` Research Library observation. The scholarly rail completed and the visual rail remained unobserved, confirming that an empty result set no longer masquerades as missing evidence.
- Fresh keyed-server page-range validation passed for pages 1-5: the same phrase scan returned 10 matches only on pages 1, 2, 4, and 5 with one bounded excerpt per matching page. The Research Library capability executed and the scholarly rail completed without network or visual execution. The size-controlled debug copy omitted raw page-bound arguments, so the result set plus deterministic range-parser regression provide the retained range evidence.
- Fresh keyed-server document-identity validation passed using `research:y9ICaLw4Mlmuqfcu8DEjszM6` without a source URL: the profile-scoped record resolved, page 8 supplied the requested Wasserstein/P-SDP excerpt and page-grounded text ref, the scholarly rail completed, and no lookup/refetch or visual capability executed.
- Conversational follow-up validation exposed that “that same saved Research Library paper” lost the private document identity and fell to `model_only`. Explicit saved-paper referents now admit a profile-scoped library read without repeating a URL or document id when the signed-in profile has exactly one active saved document. The gateway returns the resolved document id in evidence; profiles with multiple saved documents fail closed as `saved_research_referent_ambiguous` rather than selecting arbitrarily. A future persistent active-document binding can safely relax this singleton boundary.
- Fresh keyed-server validation of that conversational referent passed: without repeating either identifier, “that same saved Research Library paper” resolved page 9, returned the requested multi-frame distributionally robust beamformer equation excerpt with its page-text ref, completed the scholarly rail, and did not invoke lookup/refetch or Image Lens.
- A two-page comparison then exposed an explicit-selection parser gap: `pages 8 and 9` matched neither the contiguous-range nor singular-page forms, so the gateway relevance-ranked pages 1, 5, 11, and 16. Saved-library requests now carry an exact bounded `page_numbers` list through admission and observation. The gateway filters against that identity set and raises its excerpt bound to cover the requested list, so noncontiguous selections cannot silently include intervening pages.
- Fresh keyed-server validation of the repaired two-page comparison returned exactly three page-8/page-9 comparison bullets with both page refs on every bullet. The backend export proved that only `research-library.read_document` was admitted and observed, evidence re-entered, the scholarly route product was selected, and server terminal authority synchronized. It also exposed a solver-debug disagreement: the single writer materialized the route-approved `scholarly_research_answer`, while `ask_turn_solver_trace` still recognized only raw provider candidates and generic `model_synthesized_answer`, leaving `completed_solver_path=false` after a valid provider re-entry.
- The solver now recognizes any provider route product only through the full shared contract: matching materialization kind/ref, candidate-bound route-product identity, overlapping selected support refs, completed provider reasoning re-entry, solver completion, goal compatibility, provider bridge authorization, canonical goal match, synchronized single writer, server terminal authority, and terminal presentation. This is not a scholarly shortcut. A negative regression proves that a materialized-looking product without completed model re-entry remains incomplete and route-unauthorized.
- Fresh exact-search validation exposed two independent quality gaps despite a complete solver rail: the prompt requested exact case-sensitive occurrences, but the prompt-derived read omitted `case_sensitive=true`; the visible answer also replaced the page artifact URL with an unusable `…pdf#page=8&text` abbreviation. Explicit affirmative `find ... exact case-sensitive occurrence` requests now propagate the boolean search contract, while negated/contextual mentions remain at the default case-insensitive behavior. Gateway regression evidence distinguishes one exact `Wasserstein` match from three case-insensitive variants.
- The shared final-answer quality gate now validates requested page evidence links: page refs must be complete `artifact://` locations with `#page=N&text`, any `Page N` label must match the target page, abbreviated locations are rejected, and an explicit every-bullet/exact-reference-count instruction is checked per bullet. Provider route products now pass through this same gate before the single writer can surface them. Failed candidates produce a recoverable `route_requires_synthesis` rejection rather than falling through to visible terminal authority.
- Fresh keyed-server validation proved the quality gate failed closed on the previously accepted abbreviated page location, but exposed a continuation-state contradiction: the rejected candidate was correctly marked retryable while the state retained the pre-rejection `goal=satisfied` value, so `allowed_decisions` collapsed to `answer` and the existing provider recovery bridge (which requires `retry`) never ran. A recoverable terminal-authority rejection now reopens the shared goal as `in_progress`, clears terminal-product allowance, and exposes both `retry` and `answer` until a new model-authored candidate passes or the hard budget closes. This preserves the rejection as a non-terminal observation rather than weakening the evidence-link gate.
- Fresh keyed-server retest passed the repaired recovery path: the exact page-8/page-9 scan returned 7 and 0 occurrences respectively, preserved the complete page-8 `artifact://...#page=8&text` evidence location, and did not invent a page-9 match location. The trace recorded a recoverable terminal rejection followed by continuation sequence 3 with `goal=in_progress` and `allowed_decisions=[retry, answer]`; the subsequent model-authored scholarly route product was selected with two support refs. Evidence re-entry, follow-up reasoning, route authority, poison audit, terminal authority, single-writer projection, and `completed_solver_path` all passed with no risk or short-circuit flags. Only `research-library.read_document` was requested, selected, and executed. Size-controlled debug still omits the raw `case_sensitive` request field, so argument propagation remains covered by the deterministic routing/gateway regressions rather than the copied live trace alone.
- The decisive all-uppercase zero-match live probe exposed a presentation edge case after the retry repair: the Research Library observation completed and terminal recovery ran twice, but both model-authored zero-match candidates were rejected because the page-evidence quality gate required at least one artifact link whenever the prompt requested evidence locations. The gate now permits no match-location links only when every explicitly requested page is individually named and reports zero occurrences. Partial page coverage, any positive count without a complete artifact link, abbreviated/mislabeled links, and explicit per-bullet link requirements remain rejected. Focused positive/zero/partial quality regressions pass 3/3, and the combined continuation/single-writer suite passes 70/70.
- Fresh keyed-server retest of the all-uppercase case-sensitive query passed: pages 8 and 9 each reported zero occurrences and no evidence locations. `research-library.read_document` was the sole requested, selected, and executed capability; its `research_library_observation` re-entered the model, the recoverable `missing_post_tool_model_step` continuation reopened the goal with `[retry, answer]`, and the final `scholarly_research_answer` was selected with two support refs. The tool rail, evidence re-entry, follow-up reasoning, route authority, poison audit, terminal authority, solver completion, and visible single-writer projection all passed with no risk flags, short-circuit flags, terminal error, or rejected final candidate.
- A page-boundary live probe then exposed content-quality evidence truncation despite clean authority rails: the gateway sent only the first 5,000 characters of page 8 and compact model context reduced that excerpt further, so the model returned `8 1 ∼ 6.` as a supposed first sentence and had no evidence for the true end of the page. Exact first/last-nonblank-sentence prompts now request a typed `page_boundary_mode`. The read-only gateway derives textual sentence boundaries from the complete saved page, filters numeric/equation fragments, stores the exact first/last strings in the bounded page observation, and context compaction preserves both strings explicitly. Terminal quality requires the model-authored answer to contain those admitted boundary strings plus the existing page-link contract; a fragment substitution is rejected. Research routing/store/quality coverage passes 27 targeted tests, context/continuation/single-writer coverage passes 78/78, and the low-memory server build plus discipline quick checks pass.
- Fresh keyed-server page-8 boundary retest passed with the prose boundaries `However, note that such complicated approaches are computationally prohibitive in practice when N or M is large.` and `Specifically, if λ is large, W must be close to W ′ ; if λ is small, W can be far away from W ′ .`, followed by the complete page-8 artifact link. The Research Library capability was the sole requested/selected/executed tool, its observation re-entered the model, terminal recovery reopened the goal and completed, and all route/poison/terminal/solver/single-writer rails passed with two support refs, no terminal error, no rejected final candidate, and no risk or short-circuit flags. Size control omits the raw boundary fields from the copied export, but the route product could not pass `missing_requested_page_boundaries` unless both visible strings exactly matched the typed boundary observation.
- The two-page boundary probe passed all authority and exact-boundary gates for pages 8 and 9, but exposed a remaining extraction header artifact: page 9's first admitted sentence began `9 With the result...`, retaining the selected page number even though the following mixed prose/equation sentence was valid machine-readable text. Boundary normalization now strips a leading integer only from the first admitted sentence, only when it exactly equals that selected page number and directly precedes a letter. The rest of the extracted sentence remains verbatim; years, numbered content on later sentences, and equation/prose content are unchanged. Focused Research Library/context/quality coverage passes 23 tests, and the low-memory server build plus discipline quick checks pass.
- Fresh keyed-server two-page boundary retest passed: page 8 retained its validated prose boundaries, while page 9 now begins `With the result in Claim 1...` without the `9 ` header and retains the exact mixed prose/equation sentence body plus its final `Furthermore...` sentence. Both bullets end in complete, correctly mapped page-8/page-9 artifact links. The Research Library read was the sole requested/selected/executed capability; observation, re-entry, follow-up, route, poison, terminal, solver, and single-writer rails all completed with two support refs, no recovery step, no rejected candidate, no terminal error, and no risk or short-circuit flags.
- The first Research Library-to-conditional-Image-Lens probe produced a correct grounded provider answer but was rejected by terminal policy. Saved text located equation (47) and cited page 8; the visual section truthfully said no Image Lens inspection ran and named the exact missing rendered-page `source_id`/`bbox_px` requirement. Because the broad Image Lens prompt classifier saw no active visual source, it replaced the scholarly terminal goal with `active_image_lens_source_missing`, a non-provider terminal kind, even though the prompt explicitly made visual escalation conditional and requested the missing requirement as the answer. Conditional visual fallback may now remain a scholarly answer only when a successful source observation exists, the prompt explicitly says to use Image Lens only if necessary and to report the exact missing requirement when unavailable, and the provider supplies separate Text/Visual sections, states no visual inspection occurred, and names that requirement. Direct crop commands still fail closed without an active source. Conditional/direct classifier regressions pass 2/2; terminal single-writer plus Image Lens authority tests pass 59/59; low-memory server build and discipline quick pass. The first copied UI export was DOM fallback only, but its advertised backend debug endpoint was live and supplied the full trace when fetched directly.
- The first conditional-visual retest still failed because the provider used the equally explicit wording `No Image Lens inspection was performed`, while the new compliance gate accepted only `No visual inspection was performed`. The backend trace again proved a valid equation-(47) text answer, separate visual section, complete page-8 reference, successful Research Library observation, and exact missing rendered-page/source/bounding-box requirement before the terminal override. The compliance matcher now accepts either `visual` or `Image Lens` in that exact no-inspection statement while retaining every other grounding and conditional-prompt requirement. Both accepted wordings are covered; the direct-source-missing and contextual/unsupported variants remain rejected. Focused conditional/direct tests pass 2/2; low-memory build and discipline quick pass.
- The next live retest confirmed that matching provider prose is inherently brittle: the provider truthfully wrote `No visual finding is available` and `The exact missing requirement is...`, again with grounded equation-(47) text and no visual observation, but the wording gate still selected `active_image_lens_source_missing`. Conditional fallback admission now uses structured facts instead of a prescribed disclaimer phrase: at least one successful gateway/source observation, zero visual observations, explicit conditional/missing-requirement prompt form, separate Text/Visual sections, an exact-missing-requirement statement (`:` or `is`), and no affirmative claim that visual/Image-Lens/page-image evidence confirmed, verified, showed, demonstrated, proved, or observed anything. Tests cover all three valid disclaimer phrasings plus zero-source, visual-observation-present, direct-command, quoted/contextual, and unsupported-positive-visual variants. Focused conditional/direct tests pass 2/2; low-memory build and discipline quick pass.
- A further live retest showed the prior repair still mixed route admission with prose validation: the provider supplied separate sections and stated `No page-image evidence could be materialized because this turn contains no rendered page-8 image reference or Image Lens source ID`, but omitted the literal `exact missing requirement` label, so route admission again chose the non-provider missing-source terminal. Responsibilities are now separated. Route admission depends only on structured procedure state (explicit conditional prompt, successful nonvisual source observation, zero visual observations). The shared final-answer quality gate independently requires Text/Visual sections and, when no visual observation exists, a concrete missing/unavailable rendered-page/Image-Lens-source/bbox statement while rejecting unsupported affirmative visual confirmation. Focused route/quality cases pass 3/3; terminal single-writer and Image Lens authority pass 59/59; low-memory build and discipline quick pass.
- Final gateway admission now suppresses runtime, explicit, and prompt-derived lookup, refetch, and Image Lens candidates when they appear inside the same comma-separated negation clause. Reading already-saved profile evidence remains allowed because it performs none of those forbidden operations.
- Added shared capability, tool-family, model-context, evidence-reentry, quality-gate, runtime-authority, terminal-authority, account-policy, and contract-documentation coverage.
- Focused verification passed: Research Library routing, search, referent admission, exact page-list and case-sensitive selection, re-entry, Codex, and internal Helix admission 11/11; encrypted store/gateway including exact case-sensitive versus default case-insensitive counts 10/10; shared continuation-state contracts including satisfied-goal reopening after retryable terminal rejection 17/17; page-evidence link quality 2/2 focused; evidence re-entry/follow-up/route-product solver gates 19/19; terminal single-writer contracts 53/53 plus the focused provider-quality rejection path; targeted golden-path scholarly regressions 2/2; explicit capability arbitration 8/8; provider capability contract 45/45; low-memory server bundle PASS; and discipline quick PASS. The broad prompt-solving benchmark was stopped after remaining silent beyond the bounded low-memory window. The low-memory API parity matrix, agent-provider integration suite, and terminal-equivalence harness each exited after only the Vitest startup banner during the prior repair; they were treated as memory-pressure flakes and not counted as passes.

### 2026-07-12 UI debug-export identity repair

- Classified as debug-export parity and presentation. The copied scholarly answer itself passed backend terminal authority; the remaining failure was that the rendered client ID (`helix-chat-turn:...:ask:<uuid>`) and backend ID (`ask:<uuid>`) were compared as unrelated exact strings after a successful backend fetch.
- Canonical backend-turn comparisons now extract and compare the nested `ask:` ID in backend-target selection, clicked-turn guards, rendered-reply guards, and authoritative-response verification. The full client turn ID remains separately exported through `client_active_turn_id` and `ui_client_active_turn_id`.
- Added an end-to-end client regression proving a DOM fallback with an advertised backend reference becomes `debug_export_source: backend_endpoint`, `backend_debug_response_status: fetched`, retains `ask_turn_solver_trace`, and preserves both identities.
- Verification: complete Helix Ask console regression **123/123 PASS**; discipline quick **PASS**; `git diff --check` clean apart from existing Windows line-ending notices. No keyed server was started or restarted. Live exit check remains one fresh UI turn whose copied export contains the backend solver trace rather than `rendered_reply_dom`.

### 2026-07-12 conditional visual-evidence terminal repair

- The backend trace for `ask:30a6a656-a4e4-4d59-83ec-604539885964` proved that `research-library.read_document` succeeded, evidence re-entry completed, Codex produced a grounded answer, and both the candidate review and provider terminal bridge authorized it. The later route-product quality gate nevertheless rejected it as `route_requires_synthesis` and emitted a typed failure.
- Root cause: the required statement “I cannot verify visual layout without a rendered page” was misclassified both as a general refusal and, through an order-insensitive regex window, as an unsupported affirmative Image Lens verification claim.
- The quality gate now exempts bounded negative visual limitations only when the prompt actually activates the conditional Image Lens contract, and affirmative-claim detection ignores matches containing explicit negative qualifiers such as `no`, `cannot`, or `without`. Unsupported positive claims remain rejected.
- Added the live answer shape to the quality-gate regression and the full terminal single-writer materialization path. Also repaired stale compound typed-failure mirror selection so server-authoritative failure text supersedes an older `terminal_consistency_violation` payload.
- Verification: final-answer quality plus terminal single writer **102/102 PASS**; server bundle **PASS** with the same four unrelated duplicate/dead-case warnings; discipline quick **PASS**; `git diff --check` clean apart from Windows line-ending notices. Live validation requires a user-started fresh keyed server.
- Live keyed-server validation subsequently passed for `ask:b731f1a7-99d7-40c8-aae7-e3d347b341c6`: `scholarly_research_answer`, no terminal error or rejection, completed solver path, route/poison/terminal authority all true, evidence re-entry and follow-up reasoning complete, and no risk or short-circuit flags. The browser copy still emitted `rendered_reply_dom` with `ref_advertised`; the advertised backend export was healthy, so this remaining defect is presentation/debug-copy materialization rather than scholarly routing or terminal authority.

### 2026-07-12 cached-PDF Image Lens mixed-intent admission repair

- Live turn `ask:76a36c26-fcd4-46da-aae3-e63c1d2083cf` correctly synthesized `visual_analysis.inspect_image_region` from the saved PDF/page-8 command, but suppressed it as `negative_evidence_constraint`. The parser conflated “Do not infer visual layout from extracted text” and “Do not refetch the PDF” with a prohibition on visual/page evidence, then terminalized `scholarly_evidence_escalation_missing` with an incomplete solver path.
- Negative evidence suppression is now punctuation-bounded and requires a family-appropriate operator in the same negated clause. `infer` does not block Image Lens, and `refetch` blocks external retrieval without blocking rendering/inspection of an already saved PDF. Direct commands such as “Do not use Image Lens” and “Do not render or inspect PDF pages” remain suppressive; quoted instructions remain contextual only.
- The exact mixed prompt plus direct-negation, page-negation, quoted, and external-refetch controls are covered by a focused regression, which passes. The full 78-case provider-lane file twice stopped after the Vitest startup banner without a verdict under current memory pressure and is not counted as pass or failure. Server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS**.
- A subsequent live retry (`ask:d5020039-d636-440a-bf53-ffd309b83875`) proved admission was repaired: the Image Lens lane request was emitted, admitted, and no longer negatively suppressed. Execution still failed because the runtime candidate carried only the PDF artifact ID and not inline rendered-page data (`missing_inline_crop_or_source_image_data`).
- Added a narrow Research Library-to-scholarly-workbench bridge. Successful private `research-library.read_document` PDF observations now contribute source PDF, selected-page text/equation refs, and a cache path derived only from a validated 64-character integrity hash under `artifacts/helix/scholarly-pdfs`. The existing page renderer then materializes the requested PNG and supplies inline image data to Image Lens.
- Focused verification now covers both mixed-intent admission and an actual eight-page PDF render from the private Research Library observation: **2/2 PASS**. The render test verifies page 8, inline PNG data, cache path, and page-image artifact ref, then removes its fixture files. Server bundle and discipline quick remain **PASS**.

### 2026-07-12 scientific-workflow browser quota repair

- The next UI attempt reached page-image materialization but raised `QuotaExceededError` while writing `helix:scientific-evidence-workflow-status:v1`. The copied export consequently fell back to `rendered_reply_dom` with zero capability-lane events and showed the generic scholarly terminal-authority failure. This is client response-processing fallout, not proof that PDF extraction or Image Lens failed.
- Scientific workflow persistence now excludes inline `data:image`/`blob:` payloads and overlong references, normalizes before deriving status keys, and treats localStorage as a best-effort recovery layer. A quota exception can no longer escape the persistence adapter or abort the active in-memory Ask workflow.
- Image Lens keeps oversized rendered pages in memory but removes the corresponding localStorage recovery snapshot instead of allowing a multi-megabyte PDF-page data URL to consume the browser quota. Stable source hashes, sidecar refs, page numbers, and bounded evidence refs remain persisted.
- Focused client verification: scientific workflow and document image stores **8/8 PASS**; discipline quick **PASS**; `git diff --check` clean apart from existing Windows line-ending notices. Repository-wide `npm run check` reached the deliberately capped 1 GB Node heap and stopped with an out-of-memory error, so it is not counted as a pass.

### 2026-07-12 scholarly Image Lens re-entry payload repair

- Live turn `ask:8e74c89a-f748-4e26-9bc6-eaf99e915246` proves the saved page was rendered and Image Lens successfully returned OCR/LaTeX observation evidence. Terminal rejection moved to the explicit recoverable reason `missing_post_tool_model_step`.
- Two independent causes were found. The requested output format “separate Text evidence and Visual evidence” was mistaken for a separate-crop command, producing an invented second crop without `source_id`. In parallel, the model re-entry prompt embedded repeated inline PNG payloads; the observation packet alone was about 5.9 MB and the unbounded backend export expanded to about 6.7 MB.
- Multi-region interpretation now requires crop/region/row language near `separate`, while real multi-crop candidates inherit the active page source, page image, source kind, and dimensions. Rendered PNG dimensions are read from the generated page and oversized model-proposed bboxes fall back to the real page bounds.
- Model-visible capability re-entry now replaces inline image payloads with bounded omission markers while preserving OCR, LaTeX, bbox, uncertainty, hashes, and evidence refs. Server debug-export critical-field copying is bounded too, preventing final compaction from reintroducing raw binary fields.
- Verification: capability adapter context **16/16 PASS**; direct scholarly augmentation regression **PASS**; server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS**. The large provider-lane Vitest file again exited after its startup banner without a verdict under current memory pressure and is not counted.

### 2026-07-12 typed Image Lens layout evidence and bounded debug export

- Live turn `ask:e8142db5-c280-49e7-a6b0-abc0769eaf6f` reached and re-entered two Image Lens observations, but the provider echoed internal capability instructions. The guarded receipt fallback correctly refused that text; however, its observation contract exposed OCR and LaTeX without typed line-count, alignment, structure, or equation-bound evidence, so the fallback could not answer the requested visual-layout comparison.
- Image Lens region inspection now requests, validates, and propagates a typed `visual_layout_candidate`: displayed line count and lines, horizontal alignment, visual structure, crop-local equation bbox, and bounded notes. The fallback observation report renders these fields while continuing to redact inline image data. This remains evidence normalization and presentation after tool execution; it does not create a private sampling or tool-execution loop.
- Final Ask debug export now projects critical rail fields only at the top level and deterministically prunes optional heavy diagnostic fields until the serialized response is at or below the 750,000-character UI ceiling. It preserves the selected answer and terminal-authority projection while reporting omitted paths.
- Focused verification: Image Lens one-shot propagation **PASS**; layout fallback **PASS**; debug-export ceiling **PASS**; server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS** with existing shortcut-risk warnings. Casimir verification does not apply because this patch changes non-physics evidence and presentation contracts.
- Live retry `ask:4f9c03b8-fb12-441d-8cfc-45f6e8b28315` proves the new layout object reached the guarded receipt report: three displayed lines, left alignment, and a multi-line structure were preserved. It also exposed an incomplete bound: `equation_bbox_px` normalized to `null`, while the formatter incorrectly printed four `null` coordinates and the answer did not explicitly name the missing typed field.
- The extraction prompt now requires a finite numeric equation bbox or a single `null` value with an explanatory note; it forbids objects containing null coordinates. The guarded fallback now reports visual-layout completeness and exact missing typed field paths, and renders an absent bbox as `unavailable`. Focused fallback regression **2/2 PASS**; server bundle **PASS**; discipline quick **PASS**. The deterministic API parity matrix did not collect tests because its Vitest worker exited unexpectedly under current memory pressure, so it is recorded as a worker/memory flake rather than a product verdict.
- Live retry `ask:a344b5ab-9a2f-4fb1-8400-9d842e494e01` rendered the corrected Text/Visual sections and honestly reported `visual_layout_candidate` missing. The vision-response recovery path was then found to salvage OCR and LaTeX from malformed outer JSON while dropping a valid nested layout object. Bounded brace-aware recovery now preserves that nested object, and the extraction prompt requires the layout object even when every field must be unknown/null. Parser plus fallback regressions **3/3 PASS**; server bundle **PASS**. The copied export still reports `debug_export_source=rendered_reply_dom` with only an advertised backend debug ref, so backend debug-artifact hydration remains a separate observability repair target.
- Live retry `ask:c99c8858-3d9c-4e28-b89f-54d8709f24c9` proves the nested layout object now survives, but exposed a consistency defect: `displayed_line_count=5` arrived with an empty `displayed_lines` array, while the report called the visual evidence complete even though the crop remained full-page and exact-equation admissibility was only `partial_candidate`. The fallback now treats count/line-array mismatch as the exact missing field `visual_layout_candidate.displayed_lines`, labels typed-field completeness separately from target-evidence admissibility, and keeps the partial equation boundary visible. Parser/fallback regressions **4/4 PASS**; server bundle **PASS**.
- Live retry `ask:8c0207bc-14d8-4735-9495-dcc943d0ba7f` now reports the same mismatch and partial boundary correctly. Its copied export again fell back to `rendered_reply_dom`, preventing inspection of the provider leak/re-entry rail. The client was fetching the authoritative backend export but could subsequently discard it when rendered Markdown/plain-text equality failed at the final clicked-button guard. A fetched `backend_endpoint` payload is now retained when its active or client turn identity matches the clicked control; mismatched turns remain rejected. Focused same-turn Markdown and cross-turn isolation regression **PASS**. The high-memory client production build was not run on this device; the focused Vitest transform/type path is the recorded client check.
- Live retry `ask:c1aa8feb-3f35-4dc2-a4a3-fbfe08a8dec1` remained a safe partial Image Lens report. Read-only in-app inspection recovered the actual rendered rail even though copied debug hydration still projected the DOM: Image Lens was requested, executed, and re-entered; a provider terminal was selected; then a stale synthetic typed-failure terminal appeared before the receipt report projection. The provider re-entry construction exposed the root prompt-leak risk: every post-tool call prepended the entire initial mega-prompt (capability manifests, gateway observations, request-context JSON, policy instructions) before appending the new observation.
- Post-tool capability re-entry calls now use a compact continuation prefix containing only the original user goal, the observation/continuation blocks, and the lane-specific next-step contract. They no longer duplicate the initial capability manifest, gateway-capability dump, or Helix request-context JSON. The focused Image Lens prompt-capture regression **PASS** and server bundle **PASS**. Two shared translation-lane assertions remain independently off baseline (stale contract-version expectation and `ok:false` despite matching answer text); they are not counted as passes and require separate ownership before using that pair as a gate.
- Live retry `ask:3964b1a0-b41f-4c40-bc6b-6fa881e9cccf` proved the compact prefix was active because the provider advanced from the full 1224x1584 page to a narrower 320x240 crop, but the provider still echoed internal instructions on the next reasoning step. The remaining source was nested: `prompt_observation_block` deliberately carried `model_visible_capability_lane_manifest`, lane policy, timeline, and debug summaries, and every compact re-entry appended that block. The adapter now exposes a separate `reentry_observation_block` containing only call results, observation packets, backend selections, receipts, goal/session results, and re-entry status; initial planning still receives the full manifest while all three post-observation prompts use the evidence-only projection. Successive-context regression **17/17 PASS**; focused provider prompt-capture regression **PASS**; server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS**; `git diff --check` is clean apart from line-ending warnings. A fresh keyed-server UI retry remains required because the debugging skill forbids agent-started keyed server replacement.
- Fresh-server retry `ask:6aced558-484a-4024-85d8-e3c1f7fb0d0c` used build commit `6b817435936c4e328205ddc2b143f388d8c843b4` and successfully re-entered both a full page crop and a 1077x87 equation-row crop, but the provider leak guard still recovered to the observation report. The authoritative 611,303-character server export, fetched from the advertised debug endpoint, showed the Image Lens call results alone occupied about 200,970 characters and the observation packets another 103,855 characters. The deterministic two-crop prompt reproduced this duplication at about 341,294 characters even though its compact prompt contained no protected marker. Re-entry now carries one authoritative observation-packet representation plus small call-result summaries that preserve capability-specific scalar outputs while omitting duplicated `observation`, `observation_packet`, `receipt`, and `lane_resolve_trace` objects. The provider guard now records detected output marker IDs and bounded final-prompt diagnostics (length, hash, marker IDs, no raw prompt) so the next live retry distinguishes prompt contamination from provider-generated echo. Adapter regressions **17/17 PASS**; focused prompt-leak regression **PASS** with the two-crop prompt below 200,000 characters; server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS**.
- Fresh-server retry `ask:489977f4-ac21-4fde-ba0a-f71ed63949a4` eliminated the provider leak and returned a coherent bounded text-evidence answer, but executed zero Image Lens calls. The authoritative 862,533-character export showed `negative_evidence_capability_lane_suppression` rejected `visual_analysis.inspect_image_region` because the clause “Do not crop it as a single equation row” was misclassified as a prohibition on visual evidence. Crop-shape clauses using “do not crop ... as/into ...” are now removed only from the visual-family negation audit; an actual prohibition such as “Do not crop the image or use Image Lens” remains suppressive. The exact live prompt and genuine-negative adversary pass the focused admission regression. Server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS**. The required full prompt-solving benchmark started but its Vitest worker remained orphaned and exhausted Node memory without producing a verdict; the three verified benchmark PIDs were stopped without touching the keyed server, and that benchmark is recorded as a worker/memory flake rather than a product result.

- The next keyed-server retry successfully returned one bounded page-8 crop (`80,120,1060,300`) containing the complete six-line displayed equation (47), its visible label, and no equation (48). Routing, Image Lens execution, typed layout extraction, compact evidence re-entry, and guarded presentation all worked; the only remaining limitation was the legacy exact-row gate, which correctly classified the multi-line crop as a partial candidate. A backward-compatible `exact_block` capture mode now promotes a complete labeled multi-line block only when the displayed-line array is complete, a supported multi-line structure and finite equation bbox are present, the requested label is matched, no neighboring equation label is observed, extraction is complete, and no remaining quality flag applies. Exact-row promotion remains `not_applicable` for this path; receipts, observation packets, sidecars, graph gates, debug fallback, workflow finalization, and the browser workflow ledger carry separate block status/counts and remain observation-only. Focused verification: scientific evidence adaptor **16/16 PASS**; Image Lens exact-block one-shot propagation **PASS**; layout fallback **4/4 PASS**; scientific workflow finalizer **5/5 PASS**; browser workflow ledger **5/5 PASS**; postulate handoff compatibility **4/4 PASS**; server bundle **PASS** with the same four unrelated warnings; discipline quick **PASS** with existing changed-worktree warnings. No keyed server was started or restarted by the agent, and Casimir verification does not apply because this is a non-physics evidence-normalization contract.

## Release blockers

### Resolved P0 — provider-wrapper final-answer and continuation baseline

The full `agent-provider-selection` suite now passes 133/133 cases. Real wrapper defects were repaired across workspace status, calculator, repo, document-open, natural compound synthesis, blocked-action specificity, source-missing guards, transcript synchronization, and route-product precedence. Legacy tests were rebaselined only where they required Helix to privately execute dependent scholarly fetch, Image Lens, PDF-workbench, or narrator steps that belong to the Codex runtime.

Remaining exit gate: run the representative prompt/output/verdict cases below against a fresh keyed server and compare UI, copied text, stream, non-stream, and debug terminal projections. This is a live-validation gate, not an outstanding deterministic wrapper failure.

### P0 — dependency security

`npm audit --omit=dev` reports 32 production dependency vulnerabilities: 16 high, 14 moderate, and 2 low. Directly affected packages include Express, Drizzle ORM, Vite, `ws`, `react-simple-maps`, PostCSS, and Google Cloud Storage. The dry-run lockfile audit proposed no automatic safe change, and several available resolutions require major-version migrations.

Required exit gate: a separately reviewed dependency-upgrade branch, no high/critical production findings (or written exploitability waivers), clean install, full deterministic Ask/account regressions, and production builds.

### P0 — production authentication, tenant, CORS, and headers

- JWT enforcement is opt-in through `ENABLE_AUTH=1`; the fallback secret remains `changeme` when authentication is disabled or misconfigured.
- Tenant enforcement is opt-in through `AGI_TENANT_REQUIRED`, `ENABLE_AUTH`, or `ENABLE_AGI_AUTH`.
- Sensitive adapter/training/mission/voice routes include wildcard CORS behavior.
- No application-wide Helmet/content-security header layer was found.
- Default host binding is `0.0.0.0`.

Required exit gate: an explicit production configuration contract that fails startup when auth/tenant secrets are missing, a deployment-specific origin allowlist, security headers, proxy/TLS assumptions documented and tested, and endpoint-level authorization tests for exports and mutating routes.

### P0 — TypeScript baseline

`npm run check` fails with roughly 24,600 existing diagnostics across CLI, tests, physics tools, audio worklets, client modules, and server code, predominantly implicit-`any` errors. Production bundles and all targeted changed-surface tests pass, but the repository cannot currently use TypeScript as a release gate.

Required exit gate: define a bounded production tsconfig that excludes research/test utilities or reduce the main project to a recorded zero-error baseline; prevent regressions in CI.

### P1 — runtime-authority audit debt

`npm run helix:ask:runtime-authority-audit:strict` reports 1,018 findings: 616 P1 and 402 P2. It reports 0 P0 action-execution risks and 0 real-projection-risk P2 findings, but strict mode still fails. Many findings are serializers, candidates, and legacy projections, so this needs classification/baselining rather than a mechanical rewrite.

Required exit gate: checked-in reviewed baseline by procedural role, eliminate or waive every P1 with an owner/reason, and make strict mode fail only on new/unreviewed findings.

### P1 — build warnings and client size

The server bundle retains four unrelated warnings: duplicate `traceId` in the demonstration route, a duplicate solar switch case, and duplicate `benchmark_target_id` keys in two StarSim lanes. The client bundle reports static/dynamic import collisions, browser externalization warnings, `eval` in `web-tree-sitter`, and a 21.5 MB main chunk.

Required exit gate: resolve duplicate/dead-code warnings, define bundle-size budgets, split the main entry, and review browser externalization/CSP behavior.

### P1 — preview localization debt

Developer previews remain intentionally incomplete:

- Hawaiian: 1,778/5,660; 3,882 missing.
- Spanish: 1,824/5,660; 3,836 missing.
- Wolof: 5,592/5,660; 68 missing and 755 unapproved exact-English strings.
- French, Portuguese, Japanese, Korean, and Chinese are complete by row count but still contain unapproved exact-English strings.

They are no longer public-release options. Each should be promoted individually only after its strict coverage report is clean and a native-language review is complete.

### P1 — fresh-server/live validation deferred

The current server was not restarted, so it does not prove the checked-out patch. Paid/live-provider and live-UI actions were intentionally not run unattended.

## Exact final validation plan

1. Commit or otherwise preserve this working tree, then launch a fresh server from the canonical repository using the configured Codex Action:

   `C:\Users\dan\.local\bin\start-myapp-for-codex.cmd %CD%`

2. Confirm the server process is the fresh build and that its environment explicitly sets production auth/tenant/origin policy. Do not rely on the current process.

3. Point probes at the actual fresh port (the current UI has used `http://localhost:1522`):

   PowerShell environment setting:

   `$env:HELIX_ASK_BASE_URL = "http://127.0.0.1:1522"`

4. Run:

   - `npm run helix:ask:api-parity`
   - `npm run helix:ask:codex-workstation-release-validation`
   - `npm run helix:ask:runtime-goal-probe:providers:both`

5. In the UI, verify these representative turns and export debug packets:

   - “Does your research-paper tool let you choose papers it can parse, or do you first check which papers are openable and then use Image Lens?” Expected: direct capability explanation, no retrieval, no workstation call, terminal artifact present.
   - “Open `docs/research/nhm2-current-status-whitepaper.md` and summarize its current status in three bullets.” Expected: one bounded docs observation, model re-entry, one terminal answer, exact active-doc link.
   - “Within sections 6.7 and 6.8, list exact case-sensitive `alpha` and `Alpha` matches with line numbers.” Expected: complete scoped evidence without truncation or section substitution.
   - “Use `scholarly-research.lookup_papers` for quantum inequality sampling constraints and explain which returned papers are openable for full-text parsing.” Expected: lookup observation, follow-up model answer, typed provider limitation if full text is unavailable—not a missing-terminal message.
   - “Use `scholarly-research.fetch_full_text` directly on `https://arxiv.org/pdf/2401.12345`. Report only whether machine-readable full text was obtained, its extraction status, and any failure reason. Do not run `scholarly-research.lookup_papers` or use Image Lens.” Expected: exactly one full-text fetch call, no lookup call, bounded full-text observation or typed fetch failure, and no metadata-only terminal.
   - “Find the `alpha = 0.995` sentence in section 6.7 and add its location to a note.” Expected: locate evidence, exactly one note mutation receipt, no duplicate action.
   - “The text says `create a note`; explain that phrase, but do not create one.” Expected: no note mutation.
   - Ask the research capability question immediately after a document turn. Expected: no stale document route or evidence leakage.
   - Start a `/goal` that waits for a workstation event, then produce that event. Expected: one continuation, no duplicate gateway action, terminal completion only after re-entry.

6. Compare UI answer, copied text, stream terminal, non-stream terminal, and debug export. They must agree on selected answer, final source, artifact kind, error code, and turn id.

7. Test both account modes:

   - No session/user: developer panels and preview languages remain locked; language gateway advertises only `en`, `de`, `ar`.
   - Developer: full panel/capability superset and all localization previews remain available.

8. Do not promote unless every scenario has a terminal artifact or typed failure, no stale prior-turn artifact is selected, no duplicate mutation occurs, and the dependency/security/typecheck blockers above are resolved or explicitly waived by the release owner.
