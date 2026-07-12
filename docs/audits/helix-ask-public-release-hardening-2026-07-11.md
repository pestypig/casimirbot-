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
