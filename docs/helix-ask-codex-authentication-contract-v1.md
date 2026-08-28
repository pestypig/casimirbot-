# Helix Ask Codex Authentication Contract v1

Status: active G1 supporting contract.

## Work packet

```text
Program gate: G1 — truthful runtime identity and complete public trace
Workstream: Codex provider authentication and runtime-path evidence
Capability or component: native app-server and codex-exec compatibility adapters
Change classification: Codex-owned runtime behavior; evidence normalization; presentation
Runtime owner: Codex for login, credential storage, refresh, and model execution; Helix for auth-mode selection and sanitized evidence
Current closure state: lifecycle-observable; keyed parity not yet proven
Target closure state: keyed parity-proven
Required frozen inputs: current Codex binary, unchanged Helix permissions/tools/sandbox, cached ChatGPT login or API-key availability
Required evidence: deterministic mode-selection tests plus one native and one induced-compatibility live turn
Stop/fail criteria: token exposure, auth-store copying, user-config/tool broadening, mislabeled path, or unequal terminal hashes
Explicit non-goals: private reasoning export, private agent loop, local Codex fork, legacy-path removal
Downstream gate unlocked: G2 differential parity baseline
```

## Product goal

Helix Ask supports the two authentication methods exposed by Codex without
becoming an authentication implementation:

1. A local user signs in to Codex with ChatGPT once. Later Helix turns reuse
   Codex's cached session through the operator's normal Codex credential
   context.
2. A hosted, funded, or CI runtime supplies an OpenAI API key. Helix passes it
   only to an isolated Codex provider process and does not persist it in a Codex
   home.

Helix never reads, copies, logs, exports, or projects credential material. It
may expose only the selected mode, availability, credential-source class,
Codex-home strategy, preflight type, and typed unavailable reason.

## Mode selection

`HELIX_CODEX_AUTH_MODE` accepts `auto`, `chatgpt_session`, or `api_key`.

| Requested mode | Selection |
| --- | --- |
| `auto` | Prefer a valid cached ChatGPT session; otherwise use an available API key; otherwise fail unavailable. |
| `chatgpt_session` | Require `codex login status` to report a ChatGPT login. Never fall through to an API key. |
| `api_key` | Require API-key presence. Never fall through to a personal ChatGPT session. |

The default is `auto`. Explicit modes exist because subscription access and API
access can have different billing, administration, and data-policy boundaries.

## Runtime isolation

ChatGPT-session mode:

- uses the operator-default Codex credential context;
- does not copy an auth file into a Helix directory;
- omits `OPENAI_API_KEY` and a Helix `CODEX_HOME` override from the child;
- ignores user configuration for the compatibility process;
- disables personal apps, plugins, MCP, web, shell, mutation, image, browser,
  computer-use, and subagent features; and
- retains the read-only sandbox, no-approval policy, ephemeral native thread,
  temporary runtime workspace, and Helix dynamic-tool admission.

API-key mode:

- uses the existing isolated Helix Codex home;
- selects the explicit `helix_openai_api` provider;
- passes the key by environment only to the child process; and
- retains the same tool, sandbox, approval, workspace, and terminal-authority
  restrictions.

Changing authentication never changes the Helix account policy, admitted tool
catalog, effect authority, evidence gates, route authority, or terminal
eligibility.

## Automated preflight and user boundary

Goal automation may run the non-interactive, sanitized `codex login status`
preflight. If a cached ChatGPT session is valid, no user action is needed.

If no session exists, Helix reports `codex_chatgpt_session_not_logged_in`. The
initial browser/device sign-in, account choice, MFA, and consent remain a user
boundary. Automation may launch a supported Codex login flow when the operator
requests it, but it must not capture credentials or claim that consent was
granted before Codex reports success.

## Staged acceptance

### Stage A — deterministic contract

- Pure mode-selection cases pass.
- Compatibility arguments preserve isolation in both modes.
- Native configuration omits the API-only provider in ChatGPT-session mode.
- Debug projections contain `helix.codex_auth_resolution.v1` and no credential
  material.

### Stage B — live native authentication

- Start the canonical server only through the approved opaque launcher.
- Require the memory governor to admit the turn without weakening it.
- Run one non-mutating native app-server prompt.
- Verify `selected_mode=chatgpt_session`, actual native path identity, model
  execution, lifecycle completeness, and terminal authority.

### Stage C — induced compatibility evidence

- Freeze the same prompt, model policy, account, permissions, and source state.
- Deliberately induce the retained compatibility path without changing auth.
- Verify the compatibility path is labeled, its downgrade reason is typed, and
  the visible terminal hash matches the native result.

### Stage D — G1 closure audit

- Recheck JSON, SSE, debug export, lifecycle paging, and UI projection.
- Confirm zero duplicate effects on stream-to-JSON replay.
- Close G1 only when both live paths and every deterministic G1 row pass.

## Current live unblock condition

The 2026-08-27 live attempt reached the patched canonical server but failed at
`ask_turn_admission` with `memory_hard_pressure` / `host_memory_limit` before
runtime sampling. The enabled low-memory launcher reserves 768 MiB for an active
turn and requires the projected physical-free ratio to remain at least 4%.
Rerun Stage B after the host has at least approximately 1.5 GiB physically free;
1.8 GiB or more provides safer headroom. Do not disable the governor or terminate
unrelated user workloads to manufacture a pass.
