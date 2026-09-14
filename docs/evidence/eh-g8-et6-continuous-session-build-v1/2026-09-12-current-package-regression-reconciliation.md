# Current package regression reconciliation — incomplete

Snapshot supplementing the [earlier full CS5 reconciliation](2026-09-12-cs5-onboarding-reconciliation.md)
under [onboarding O1–O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
All original requirements and unresolved ET6 measurements in that reconciliation
remain required; this snapshot does not replace the work program or narrow them.

The parent packet's five combined regression anchors ran against current source:

`npx vitest run client/src/components/agent-access/__tests__/AgentConnectionSetup.spec.tsx client/src/lib/agent-access/__tests__/reasoningTaskBinding.spec.ts server/routes/__tests__/agent-connections.test.ts server/services/local-supervisor/__tests__/reasoning-task-binding-store.test.ts server/mcp/__tests__/helix-mcp-local-supervisor-coordination.test.ts --pool=forks --maxWorkers=1 --minWorkers=1`

Result: five files, 101 tests passed, exit 0, 37.24 seconds. This is a combined
component/public-handler regression result, not 101 live acceptance scenarios.

[Current package fixture scan](2026-09-12-guidance-package-fixture-scan.json)
checked 826 packaged text files and eight fixture markers, including the process
recovery worker markers. No fixture path/content hit. Positive controls found
all three production pairing tools and steering revision validation in the
service. This establishes known-fixture exclusion only, not complete absence
of authentication bypasses. The exact package's EXE hash is recorded in that scan.

| Requirement area | New evidence since earlier reconciliation | Remaining boundary |
| --- | --- | --- |
| O2/O5 durable prompt identity and acknowledgement | Encrypted repository/public handler regressions; native broker snapshot; independent process recovery and persisted revocation | Full principal/timer/host matrix, power-loss/kill-during-write, production keyring and real PostgreSQL concurrency |
| O4/O5 retained selection and input | Eight real Chromium pointer/keyboard normal/lost-reply/chat-switch/account-cookie-switch cases | Full workstation foreground, timing, focus and clipboard matrix; genuine production consent |
| O4 native guidance | Native typecheck caught and repaired out-of-scope journal/secret references; ordinary empty-pending branch observed | Queued native guidance consumption; complete native workflow |
| O5 isolation | Current-package exclusion scan and existing route/MCP denial regressions | Complete fixture credential/header/unsigned principal negative map |
| O3 provider bridge and tool adoption | Production tools present in exact service; current ALL_TOOLS search has no pairing registration/accept/recover entries or tool_search | Supported actual-host list/send/attestation/accept and durable automatic-delivery outbox; fallback does not close O3 |
| O6 / CS4 artifact and launch | Guidance package built, byte-compared, isolated smoke passed; ordinary launch, existing chat, trust and Agent Access verified | Consent, exact accepted binding, visible prompt, authenticated pickup/ack, idle/restart/revoke unified rehearsal |
| CS1 / CS2 | Current package/keyed service and exact-task MCP presence; combined 101-test regression | Shared Ready up repeats and full exact identity/finite-authority recovery; integrated natural prompt trace |
| CS3 / CS4 environment | No new qualifying movement or intervention evidence | All three linked successors, timing, changed-affordance re-entry, actual interruption/revocation/stale rejection and zero duplicate effects |
| CS5 | Earlier requirement-by-requirement inventory plus these scoped evidence deltas | Full handoff remains incomplete until every original CS1–CS4 exit is evidenced |

No maturity or gate advance. Original ET6 remains unpassed and NAV1 gated.
