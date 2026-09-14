# Initial device-trust status read can recover without consent mutation

Classification: presentation and evidence normalization. This bounded O4/O5
repair is independent of the pending genuine Full Harness trust approval.
The preceding goal turn made progress by independently verifying genuine
[installed-device registration](2026-09-13-device-registration-accepted.md).
This continuation adds source, deterministic and candidate-package evidence;
it does not count waiting for human approval as an executed process wait.

Inspection found that the initial full-harness-trust GET silently ignored
failure, had no response/body deadline, and left fullHarnessTrust null. The
consent button consequently remained disabled with no status-read recovery.
Three isolated regressions reproduced this with a never-settled response,
never-settled body and rejected transport. Before repair all three failed at
the missing recovery status/control; 44 other tests were filtered out.

The status read now has a ten-second response-and-body deadline. Failure keeps
the consent button disabled and offers Recheck device trust. That control only
reads current server status; it never writes trust, retries a consent mutation,
starts transport or grants an environment action. A successful fresh read
restores the appropriate consent control. A timed-out response cannot replace
the newer observation. The request is cancelled and its generation invalidated
on unmount. Diagnostics show fixed copy and exclude private transport messages.

## Executed verification

| Check | Result and scope |
| --- | --- |
| Red component cases | 3 failed, 44 filtered out; 23.38 seconds |
| Complete AgentConnectionSetup suite | 47/47 passed, 19.95 seconds; rendered jsdom component with isolated transport/native dependencies |
| Selected browser recovery cases | 4/4 passed, 9.1 seconds; pointer and keyboard at 375x640 / 1280x640, covering initial read recovery and prior missing-registration guidance |
| Discipline quick | Static checks passed; unrelated dirty-checkout classifications do not qualify this repair |
| Targeted diff check | Passed, with line-ending warnings only |
| Renderer build | Passed, Vite reported 1m25s; existing bundle/externalization warnings retained |
| Desktop directory packaging | Exit 0; candidate only, not launched |

Commands:

```text
npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx -t 'O4 recovers an unavailable initial trust' --pool=forks --maxWorkers=1 --minWorkers=1
npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1
npx playwright test --config=playwright.onboarding.config.ts binding-input.spec.ts -g 'O4 failed trust status|O4 unregistered device recovery'
npm run helix:ask:discipline:quick
npm run build:client
npm --prefix apps/desktop run pack:dir -- --config.directories.output=release-trust-read-recovery-20260913
```

Browser tests import the production component and intercept HTTP/native fixture
dependencies. Recovery uses actual pointer/keyboard inputs, restores an enabled
but unapproved control, and asserts exactly two GETs with zero writes. They
exclude full workstation styling and actual native authentication. Component
tests separately cover hung bodies and late stale completion. No test principal
or production consent control is used against the live EXE. Casimir verification
does not apply to this non-physics UI/status-read patch; no adapter or certificate
claim is made.

## Candidate and retained running package

[Content comparison](2026-09-13-trust-read-recovery-package.json) passed for all
645 runtime files, 635 renderer files and eight host artifacts, without
mismatches/extras. [Renderer identity and fixture-marker checks](2026-09-13-trust-read-renderer.json)
confirm the new recovery control is included and the selected known fixture
markers are absent. This exclusion scan is not a complete production isolation
qualification. The candidate renderer manifest SHA256 is
`f0b1f99d53350c8b6575f446d312b24ad1244b1c9f0d8f49ce4bb193f1eac58d`.

The candidate is `release-trust-read-recovery-20260913`. Its EXE and service
hashes equal the prior package because the changed renderer is packaged as
external runtime resources. EXE hash alone therefore does not identify this
renderer revision; use the content comparison and renderer identity together.

The running package remains `release-trust-recovery-20260913`. The candidate
was not launched while human trust approval is pending. The older
`release-oauth-dispatch-20260913` was recycled only after checking its resolved
absolute parent/name, rejecting a reparse target, verifying no process used it,
and confirming the running package plus status-recovery rollback existed.
The Recycle Bin was not emptied. This follows the three-package retention rule.

At 21:40:31.970 UTC authenticated presence succeeded on the retained service
for exact continuation `codex:thread:01a081e3-1973-76a3-b35b-0bd6d541933d`.
Inspection of `desktop_tunnel_request:32e2bc6f-1a32-4535-a981-1b6b35bfc110`
still showed pending_user_delegation, with no delegation or environment grant.
Native observation also retained the unapproved trust button. No restart,
reconnect, replacement task or new binding was requested.

## Requirement disposition

Retain every CS/O requirement through [the complete inventory chain](2026-09-13-browser-dispatch-recovered.md).
This covers one additional O4/O5 UI failure/recovery case and candidate artifact
identity under CS4.4. It does not qualify unknown trust-mutation outcomes, real
host automatic delivery, live pairing, shared repeated Ready up, durable goal
recovery, scoped prompt display/pickup/acknowledgement, three useful linked
successors, fresh observation re-entry, manual interruption, revocation, stale
rejection or zero duplicate live effects. All CS1-CS4 and O1-O6 full exits remain
incomplete. The CS5 handoff remains a requirement inventory, not acceptance.
ET6 remains unpassed and NAV1 unqualified. The
[work program](../../helix-environment-harness-work-program-v1.md) remains the
sole dependency and maturity authority.
