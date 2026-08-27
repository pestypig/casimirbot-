# Helix Ask / Codex Parity G0 Closure Audit — 2026-08-26

Status: immutable deterministic closure evidence.

Program: `docs/helix-ask-codex-parity-work-program-v1.md`

Gate: G0 — Authority inventory and trapdoor disposition

Verdict: **PASS**

## Closure claim

Every currently identified reachable Helix Ask execution, transport, provider,
terminal, and presentation path has a repository-pinned inventory entry with:

- an entry point and activation predicate;
- a lifecycle stage and authority owner;
- a runtime class;
- explicit runtime or presentation limits;
- an authoritative source and terminal writer where applicable;
- a retain, replace, quarantine, or remove-after-parity disposition; and
- a downstream gate.

The frontend ReCrown inventory contains zero
`unknown_trap_door_quarantined` slices. This does not declare the legacy bridge
safe to remove. Ten behavior-sensitive slices remain quarantined with named
dispositions.

## Principal findings

1. Helix Ask is not detached from `server/routes/agi.plan.ts`. The file remains
   the mounted owner of the JSON, stream, legacy, conversation-preflight, and
   jobs routes, as well as the native-Helix loop and multiple terminal call
   sites.
2. The recrowned client is not the default runtime. The default runtime
   implementation remains `legacy_bridge`, which mounts `HelixAskPill`.
3. Codex is the default provider, but native app-server and compatibility
   `codex exec` are materially different runtime paths.
4. Native app-server has no Helix continuation-step wrapper around a successful
   native cycle. It does have explicit time, protocol, and tool-content limits.
5. Compatibility `codex exec` defaults to a 12-step continuation ceiling and is
   capped at 32, with a 120-second per-step process timeout and 256 KB output
   limit.
6. The visible procedural timeline reads only the first 12 runtime iterations
   and renders only the first 18 assembled rows. These are presentation
   truncations and do not prove the runtime stopped.
7. Known client trapdoors include transport downgrade, scope/multilang retry,
   client workstation execution/answer shortcuts, process-graph answer
   projection, and conversation preflight. They are now classified rather than
   treated as unknown.

## Evidence

- Human-readable packet:
  `docs/work-packets/helix-ask-codex-parity-g0-authority-inventory-v1.md`
- Typed inventory:
  `server/services/helix-ask/runtime/codex-parity-g0-authority-inventory.ts`
- Stable-symbol drift guard:
  `server/__tests__/helix.ask.codex-parity-g0-authority-inventory.test.ts`
- Frontend inventory:
  `client/src/components/helix/ask-console/HelixAskLegacyConsoleInventory.ts`

## Deterministic verification

Passed:

```text
npx vitest run server/__tests__/helix.ask.codex-parity-g0-authority-inventory.test.ts --pool=forks
  4/4 tests passed

npx vitest run client/src/components/__tests__/helix-ask-console-recrown.spec.ts -t "tracks the live legacy console slicing inventory before bridge replacement" --pool=forks
  1/1 selected test passed

npm run helix:ask:discipline:quick
  static checks passed

git diff --check -- <G0 changed files>
  passed
```

No keyed run was performed. G0 is an inventory-only gate; keyed same-state A/B
acceptance begins only after G1 makes actual runtime identity and the complete
public lifecycle observable.

## Unrelated suite state

The complete `helix-ask-console-recrown.spec.ts` file was also sampled. It ran
125 passing tests and reported two failures outside the G0 inventory contract:

- the minimal runtime shell now performs a provider-list fetch while an older
  test still forbids the substring `fetch(`; and
- a user-account runtime-control visibility expectation differs from current
  policy behavior.

Those failures were present in the dirty working tree and were not changed or
reclassified as G0 failures. They require their own ownership and policy review.

## Advancement

G0 is closed. G1 — Truthful runtime identity and complete public trace — is the
sole active program gate.

