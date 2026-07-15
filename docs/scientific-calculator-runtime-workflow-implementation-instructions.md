# Scientific Calculator Runtime Workflow Implementation Instructions

Status: implementation instructions; no implementation is authorized by this document alone.

## Goal

Connect the documentation sidecar workflow to the Scientific Calculator so a
reader can launch either an equation or a registered runtime command from a
document, inspect and run it in the correct calculator workbench, read and copy
the resulting report, and explicitly give that exact result to Helix Ask for an
explanation.

The finished path is:

```text
Docs equation or registered runtime command
-> open/focus Scientific Calculator
-> prefill Scalar or Runtime workbench
-> explicit user Run/Solve
-> durable request with observable status
-> structured persisted result report
-> copy, revisit, or explicitly bind as workstation context
-> model-supported explanation of the admitted result
```

Do not auto-run an equation or runtime command merely because the reader opened
it from Docs. Opening and pre-filling are reversible presentation actions;
execution remains a distinct operator action.

## Patch classification and ownership

This work spans these Helix Ask classifications:

- `presentation`: Docs launch affordances and calculator setup/progress/report UI.
- `tool admission`: only fixed, registered scientific runtime entrypoints may run.
- `source admission`: an exact selected runtime receipt may be bound to an Ask turn.
- `evidence normalization`: runtime output becomes a bounded typed observation.
- `evidence re-entry` and `follow-up reasoning`: “Explain result” must return the
  observation to model reasoning before a visible answer is selected.
- thin domain-runtime orchestration: status and result persistence around the
  existing theory adapters. This is not a private Helix Ask agent loop.

Codex continues to own generic model sampling, tool execution and re-entry,
retries, approvals, sandboxing, session lifecycle, compaction, subagents, and
terminal completion. Do not recreate any of those mechanisms in Helix Ask.
Helix Ask owns source/tool admission, evidence identity and provenance,
route-product contracts, claim gates, terminal eligibility, and debug traces.

Runtime receipts are observations. A direct “show/copy the runtime report”
operation may return the report itself, but an explanatory or scientific claim
must treat the receipt as `evidence_for_synthesis` and complete the solver path.

## Acceptance behavior

### Equation launch

1. A calculator affordance on a rendered equation opens and focuses
   `scientific-calculator`.
2. The Scalar/Theory workbench is selected and receives the exact normalized
   expression plus its document source and claim boundary.
3. Existing equation-action manifests continue to work. A
   `calculator_ingest` action is visibly launchable instead of being silently
   omitted from the action-chip projection.
4. The user chooses Solve/Run. Launching from Docs does not solve automatically.

### Runtime launch

1. Docs decorates only an exact command represented by a shared allowlisted
   runtime registration. It must not infer executable commands from arbitrary
   code fences, prose, copied shell text, or lexical similarity.
2. The launch opens and focuses the Runtime workbench and loads a read-only setup
   card containing the runtime ID, display command, fixed/validated arguments,
   expected outputs, maturity, source, and claim boundary.
3. The user explicitly starts the run. The server returns a durable request ID
   and the UI can recover status/result after panel remount or refresh.
4. The Runtime workbench shows stage text, elapsed time, and a progress surface.
   Show a percentage only when the adapter reports a real fractional measure;
   otherwise show an indeterminate progress bar with the current heartbeat
   stage/message. Never manufacture a percentage from elapsed time.
5. Completion renders a readable structured report. Failure and timeout render
   equally durable reports with deterministic reason codes and any safe partial
   evidence.

### Result report

The selected result report should expose, when present:

- request, run, row, receipt, runtime, and adapter identities;
- lifecycle status, timestamps, duration, heartbeat stage, and terminal reason;
- named scalars with units and uncertainty/provenance where available;
- gate outcomes, first hard failure, missing signals, warnings, and claim boundary;
- bounded stdout/stderr or log preview plus artifact references, never an
  unbounded log copied into workstation context;
- maturity and certificate fields without strengthening their claims;
- Copy report, Copy JSON, Use as context, Explain result, and recent-history
  controls.

History must be capped and must persist bounded metadata/references rather than
duplicating arbitrarily large reports in browser storage.

### Workstation context and explanation

1. “Use as context” binds the exact selected request/run/receipt identity. A
   merely visible or historical result remains `ambient_context`.
2. “Explain result” creates the same explicit binding and asks Helix Ask to
   synthesize an explanation. It must not paste a report-shaped answer directly
   into the chat as terminal authority.
3. The gateway observation is bounded and contains identifiers, status,
   selected scalars/units, gates, missing signals, warning preview, artifact
   references, provenance, duration, and claim boundary. It excludes raw full
   logs and declares:

   ```text
   assistant_answer = false
   raw_content_included = false
   terminal_eligible = false
   post_tool_model_step_required = true
   output_role = evidence_for_synthesis
   ```

4. The Ask rail must be visible in debug as requested/selected/admitted/executed
   read capability -> observation -> evidence re-entry -> final arbitration ->
   terminal authority -> visible projection.
5. Quoted, negated, contextual, historical, future/conditional, screen-visible,
   and mixed-intent mentions of runtime controls must not execute a runtime.

## Directory and module plan

The existing large files remain composition surfaces. New behavior belongs in
focused modules with colocated tests.

### Shared contracts

Reuse rather than replace:

- `shared/contracts/theory-runtime-run-request.v1.ts`
- `shared/contracts/theory-runtime-receipt.v1.ts`
- `shared/contracts/doc-equation-action-manifest.v1.ts`

Add only the missing boundaries:

```text
shared/contracts/doc-calculator-launch.v1.ts
shared/contracts/theory-runtime-job.v1.ts          # only if a job wrapper is needed
shared/contracts/theory-runtime-context.v1.ts
shared/contracts/__tests__/doc-calculator-launch.v1.spec.ts
shared/contracts/__tests__/theory-runtime-job.v1.spec.ts
shared/contracts/__tests__/theory-runtime-context.v1.spec.ts
```

`doc-calculator-launch.v1` is a discriminated union for `scalar` and `runtime`
launches. `theory-runtime-job.v1` must reference the existing request and receipt
contracts; it must not duplicate their fields. `theory-runtime-context.v1`
defines the bounded context projection and exact identity binding.

### Docs-to-calculator launch

```text
client/src/lib/docs/docCalculatorLaunch.ts
client/src/lib/docs/docRuntimeCommandRegistry.ts
client/src/lib/docs/__tests__/docCalculatorLaunch.spec.ts
client/src/lib/docs/__tests__/docRuntimeCommandRegistry.spec.ts
```

- `docCalculatorLaunch.ts` validates the shared launch payload, emits the
  calculator load event, and requests open/focus. It is the single launch path
  for both generic equation clicks and manifest-backed calculator actions.
- `docRuntimeCommandRegistry.ts` maps exact display forms to shared runtime IDs.
  Prefer a shared/server-owned registration source over a second client
  allowlist. Unknown code remains inert text.
- `client/src/components/DocViewerPanel.tsx` should only add the affordance,
  accessible labels, and event wiring. Do not add registry, execution, polling,
  or report formatting logic to the panel.
- Every rendered equation receives a visible generic calculator sidecar. A
  manifest-backed calculator action replaces that generic sidecar with its
  specialized action; theory actions remain additional, not substitutes for
  calculator access.
- Keep `client/src/lib/docs/docEquationActions.ts` compatible by translating its
  supported action into the shared launch contract.

### Calculator client modules

```text
client/src/lib/theory/runtimeJobsApi.ts
client/src/lib/theory/runtimeReport.ts
client/src/lib/theory/__tests__/runtimeJobsApi.spec.ts
client/src/lib/theory/__tests__/runtimeReport.spec.ts

client/src/store/useTheoryRuntimeJobStore.ts
client/src/store/__tests__/useTheoryRuntimeJobStore.spec.ts

client/src/components/panels/scientific-calculator/
  RuntimeWorkbenchSection.tsx
  RuntimeJobSetupCard.tsx
  RuntimeJobProgressCard.tsx
  RuntimeResultReport.tsx
  RuntimeResultActions.tsx
  RuntimeRunHistory.tsx
  __tests__/
```

- `runtimeJobsApi.ts` owns start/status/result HTTP calls and polling/backoff
  policy. Polling stops on terminal status and is abortable on selection change.
- `runtimeReport.ts` owns safe report normalization and Markdown/plain-text/JSON
  copy projections. UI components do not assemble report semantics ad hoc.
- `useTheoryRuntimeJobStore.ts` owns selected setup, active job, terminal report,
  and capped recent references. Keep it separate from the artifact-backed
  compound-run store until their lifecycle contracts actually match.
- `ScientificCalculatorPanel.tsx` remains the panel shell and workbench
  coordinator. Extract existing runtime rendering if necessary before adding
  the new cards; do not add another large inline section.
- Keep the existing event module as a compatibility edge, or add a small typed
  runtime-launch event beside it. Avoid a second global event vocabulary.
- `client/src/lib/workstation/panelActionAdapters.ts` must only delegate to a
  focused calculator runtime action helper. Do not place new lifecycle or
  report code in that already-large adapter file.

### Server runtime job lifecycle

```text
server/services/theory/runtime-jobs/
  runtime-job-service.ts
  runtime-job-store.ts
  runtime-job-runner.ts
  runtime-job-projection.ts
  runtime-job-finalizer.ts
  __tests__/

server/services/theory/runtime-atomic-json-store.ts

server/routes/helix/theory-runtime.ts
server/routes/helix/__tests__/theory-runtime.spec.ts
```

The route may instead be a focused sub-router mounted by
`server/routes/helix/theory.ts`, but route handlers must stay thin.

- `runtime-job-service.ts` owns lifecycle transitions and idempotent reads.
- `runtime-job-store.ts` persists request status and receipt references using
  the existing theory request-manifest/artifact conventions. Writes must use
  safe repository-controlled output roots and atomic replacement where
  appropriate.
- `runtime-job-runner.ts` dispatches an exact registered runtime ID to the
  existing `runtime-adapters.ts`, adapter registry, or
  `long-runtime-executor.ts`. Do not duplicate process spawning, timeout,
  output-path validation, or command allowlists.
- `runtime-job-projection.ts` creates bounded client/status projections and does
  not turn a receipt into an explanatory answer.
- `runtime-job-finalizer.ts` commits the validated receipt before publishing a
  terminal manifest, eliminating terminal-without-result polling races. It also
  closes orphaned `running` requests with an explicit interruption receipt and
  resumes durable `queued` requests when a worker next reads them.
- `runtime-atomic-json-store.ts` owns serialized atomic replacement and
  backup-swap recovery, including Windows where renaming over an existing file
  can return `EPERM`. Keep platform replacement details out of lifecycle code.

Proposed API:

```text
POST /api/helix/theory/runtime-jobs
  -> 202 + theory_runtime_job.v1 snapshot

GET /api/helix/theory/runtime-jobs/:requestId
  -> current job snapshot and heartbeat

GET /api/helix/theory/runtime-jobs/:requestId/result
  -> terminal theory runtime receipt/report, or typed not-ready result
```

Cancellation is deferred unless the existing executor can prove ownership of a
live process handle and deterministic cancellation semantics. Do not expose a
decorative Cancel button that cannot stop the actual process.

The service must distinguish static reference loading, artifact reading, quick
execution, and long execution. A static/artifact-backed result must not be
presented as a newly executed runtime.

### Ask context capability

```text
client/src/lib/helix/askTheoryRuntimeContext.ts
client/src/lib/helix/__tests__/askTheoryRuntimeContext.spec.ts

server/services/helix-ask/workstation-tool-gateway/
  scientific-calculator-theory-run-context.ts
  __tests__/scientific-calculator-theory-run-context.test.ts
```

Add a focused read capability such as:

```text
scientific-calculator.read_visible_theory_run_result
```

The focused gateway module defines its manifest, argument validator, and
bounded observation builder. The central
`server/services/helix-ask/workstation-tool-gateway/registry.ts` only imports
and registers it. Do not add another multi-hundred-line implementation there.

`askTheoryRuntimeContext.ts` projects an explicitly selected result into the
workspace snapshot. `ask-workspace-context-snapshot.ts` carries the bounded
projection/reference with minimal wiring. `HelixAskPill.tsx` consumes that
snapshot and does not become the context formatter or admission engine.

Use a versioned observation kind such as
`helix.theory_run_context_observation.v1`. Its source target must contain the
exact request/run/receipt ID, not “latest result” alone. A “latest” UI shortcut
may first resolve to an exact identity, which is then frozen into the turn.

### Account policy

The capability is developer-first. The developer policy already permits the
full surface. Do not add the new runtime execution or receipt-context
capability to `HELIX_USER_ACCOUNT_POLICY` in this patch. No-session inherits
user policy and must therefore remain locked server-side even if launch markup
is visible.

Client locks are presentation guidance; the server runtime route and gateway
must enforce the active account policy. Add the public-user capability only in
a later stabilization patch with its own review.

## Runtime safety and scientific claim rules

- The UI accepts runtime IDs and typed arguments, never arbitrary shell text.
- Runtime ID registration, account policy, argument validation, timeout,
  environment, output path, and log bounds are enforced on the server.
- A client-side allowlist is display metadata, not the security boundary.
- Preserve deterministic failure codes for unknown runtime, invalid arguments,
  policy denial, timeout, process failure, missing artifact, and malformed
  receipt.
- Persist command display text and provenance, but never secret-bearing
  environment values.
- Reports preserve the source receipt's maturity and claim boundary. UI wording
  must not convert exploratory, reduced-order, diagnostic, static, or partial
  evidence into a certified or physically viable claim.
- A Casimir PASS is a verification result at that moment; it is not permission
  for unrelated viability claims and does not replace training-data checks.

## Implementation order

Implement in reviewable slices:

1. Shared launch/context contracts and the Docs launcher, with no runtime
   execution yet.
2. Server job lifecycle and API using a fake executor in tests, then wire the
   existing registered adapters.
3. Calculator Runtime workbench, honest progress, structured report, copy, and
   capped history.
4. Explicit workstation-context binding, read capability, evidence re-entry,
   and Explain result.
5. Exact Docs runtime decoration plus migration/coverage for existing equation
   action manifests.
6. Narrow deterministic verification and build checks.
7. Casimir verification gate for the adapter-contract/GR scope.
8. Keyed-server Helix Ask parity only after the operator confirms the normal
   keyed localhost server is running.

Stop after any slice whose contract tests fail. Fix the first meaningful hard
failure before broadening the patch.

## Deterministic test plan

Add focused tests for:

- scalar and runtime launch validation, open/focus, exact prefill, and no
  auto-run;
- existing equation-action manifest compatibility and visible
  `calculator_ingest` projection;
- exact registered runtime recognition and rejection of arbitrary code,
  aliases, shell metacharacters, quoted commands, and near matches;
- lifecycle success, failure, timeout, persistence/reload, idempotent status,
  honest determinate/indeterminate progress, safe output paths, and bounded logs;
- route start/status/result responses, unknown-runtime rejection, policy denial,
  and typed not-ready/failed results;
- progress/report/history UI, report/JSON copy output, capped persistence, and
  stale-selection cancellation;
- explicit request/run/receipt context identity, bounded observation fields,
  ambient-result non-admission, evidence re-entry, and terminal ineligibility;
- developer access plus user/no-session denial for the new capability;
- contextual, negated, future/conditional, historical,
  quoted/screen-visible, and mixed-intent runtime-control prompts.

Use the narrowest matching commands during development, then run:

```bash
npm run helix:ask:discipline:quick
npx vitest run server/__tests__/helix.ask.prompt-solving-benchmark.test.ts --pool=forks
npx vitest run server/__tests__/helix.ask.api-parity-matrix.test.ts --pool=forks
npx vitest run client/src/lib/helix/__tests__/ask-terminal-projection.spec.ts --pool=forks
npm run check
```

Run the targeted new contract, service, route, store, and component specs in the
same phase. Run client/server builds in proportion to the touched surfaces.
Use `npm run helix:ask:discipline:full` only if the patch actually changes
live-source identity or continuation behavior.

## Casimir verification gate

Because the planned patch changes theory runtime/adapter contracts, treat the
Casimir gate as applicable unless final scope proves those files untouched.
Follow `WARP_AGENTS.md` and the `verify-gr-math` workflow during implementation.

If GR/warp or math-stage files are touched, refresh and validate the math report
and run the required WARP test battery. Then run:

```bash
npm run casimir:verify -- --ci --trace-out artifacts/training-trace.jsonl
```

Use the configured adapter URL/auth/tenant when enabled. A FAIL requires fixing
the first failing HARD constraint and rerunning. Completion reporting must name
the PASS verdict and certificate hash/integrity status when required. If the
gate cannot run, report it as not run/blocked; do not substitute UI or unit-test
success for adapter/certificate integrity.

## Keyed-server phase (last)

Do not start a Helix Ask server from the agent shell. The operator must start
the normal keyed server so provider keys, tenancy, browser/workstation state,
and live-source bindings match the real environment. After the operator
confirms it is running, use the normal endpoint (currently
`http://localhost:1498`) and run the focused live rail plus parity checks.

At minimum, add or select a runtime-result-context scenario that proves:

```text
explicit Explain result request
-> exact selected request/run/receipt binding
-> read capability selected/admitted/executed
-> bounded theory runtime observation
-> observation re-entered into reasoning
-> model explanation grounded in receipt fields
-> terminal authority accepted one final answer
-> UI/API visible projection matches that answer
```

Then run the relevant operator-server probes, for example:

```powershell
$env:HELIX_ASK_BASE_URL='http://localhost:1498'
npm run helix:ask:api-parity
npm run helix:ask:live-spine-smoke
```

Use focused scenario environment variables first; broaden only after the new
rail passes. Report deterministic code regressions, route failures, unavailable
keyed tests, and flakes separately. An unreachable or unkeyed server is a
blocked live-verification condition, not evidence that the patch passed or
failed.

## Completion checklist

- Docs launches the correct calculator workbench with exact typed setup.
- Launch never executes automatically.
- Only registered runtime IDs can execute and policy is enforced server-side.
- Status survives panel lifecycle and progress is honest.
- Terminal success/failure reports are readable, persisted, copyable, and
  bounded.
- History is capped and exact results can be revisited.
- Workstation context requires an explicit exact receipt binding.
- Explain result uses evidence re-entry and model synthesis, not receipt
  short-circuiting.
- Developer access remains a superset; user/no-session remains denied until a
  later stabilization decision.
- Existing large UI, adapter, registry, and Ask files remain thin composition
  points.
- Narrow local tests/static checks pass.
- Applicable Casimir verification reports PASS with certificate integrity.
- Keyed-server parity runs only on the operator-started normal server and its
  result is reported separately.
