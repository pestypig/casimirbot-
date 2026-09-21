Program gate: G8 — Environment-harness release evaluation
Workstream: CFP-1.POLICY / CFP-2.PUBLIC and ONBOARD handoff
Capability or component: First free personal Codex-to-installed-harness connection profile
Lifecycle stage: admission and recovery specification
Reaction timescale: setup, each MCP request, reconnect and account change
Authority owner: CFP-1 architecture coordinator selects the qualification target; account, desktop and MCP owners must prove implementation; product owner freezes customer support wording
Current maturity: specified
Target maturity: specified acceptance contract, followed by installed qualification in CFP-2
Required evidence: CFP-1—current installed-route and account-policy source, official Codex MCP client contract, selected supported Codex desktop version, Windows baseline and environment/version baseline, frozen ordinary-user positive/denial and cost/outage fixtures; CFP-2—final evaluation-artifact identity, ordinary-user installed traces and actual cost/outage observations
Explicit non-goals: no present customer-support claim, runtime or Codex configuration change, subscription gate, provider-account sharing, remote/web connectivity claim or G8 promotion
Downstream gate unlocked: CFP-2 may implement and test this profile after CFP-1's remaining owner and rights decisions; no stage opens automatically

# First free personal Codex connection profile v1

## Profile selected for qualification

**P1 is the first CFP-2 qualification target:** the current Windows ChatGPT/Codex
desktop client and the signed CasimirBot EXE run on the same user's computer.
The [transport priority decision](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-20-cfp1-p1-stdio-priority-decision-163.md)
selects local Codex stdio to a signed EXE command mode over authenticated local
IPC as the first route to qualify. The existing loopback `/mcp` remains a
server capability, but plain HTTP plus a cached-header helper is a held
candidate until send-time listener authentication is proven. The harness's
first-party setup wizard links the verified CasimirBot
account and installed device, establishes the owner-only
`personal_environment` context, and helps the user configure this MCP server
in the local Codex host. The user supplies their own Codex account; CasimirBot
does not sell, lend or operate that account or include model usage.

This selects **which path to build and test first**, not a currently supported
ordinary-user route. The selected free entitlement does not depend on an
active hosted subscription or trial. An optional open-source Codex CLI or
other MCP client may be qualified later with its own installed evidence;
installing it or entering an API key is not a prerequisite for P1. Hosted
rooms and remote guests need separately admitted connections and never inherit
the local personal client's authority.

The [first-cohort compatibility target](eh-g8-cfp1-first-cohort-compatibility-target-v1.md)
selects Codex desktop AppX `26.915.4065.0` x64 on Windows 11 25H2 x64/build
family 26200 for the first signed P1 qualification. It also selects the
conditional Minecraft/Fabric/Java tuple for the local proof of concept. These
are **test targets**, not current customer support or a promise that other
client/Windows versions fail; updates need requalification before they enter
the supported matrix.

[OpenAI's current MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
confirms local desktop support for stdio and Streamable HTTP MCP and shared host
configuration; its HTTP credential helper is cached and does not apply to
stdio. It also distinguishes
ChatGPT web from local configuration. The
[source dependency checkpoint](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-free-personal-connection-dependency-17.md)
and [client feasibility checkpoint](../evidence/eh-g8-codex-first-paid-product-delivery-v1/cfp-1/2026-09-19-codex-local-mcp-profile-feasibility-25.md)
map the present CasimirBot loopback `/mcp`, changing-port service and bearer
admission. Client support for an address is not proof that CasimirBot has a
working public identity, tool or recovery path.

## Contract CFP-2 must implement and prove

| Boundary | Required behavior and evidence |
| --- | --- |
| Installation and discovery | Declare one signed EXE build, installed service and Codex desktop version. The wizard configures only the user's chosen local stdio MCP entry with explicit consent and a fixed non-secret signed-EXE command mode. It locates the current authenticated local service through reviewed IPC after restart without a manual port edit or connection to an unverified listener. Preserve unrelated Codex configuration and support removal of the entry. |
| Client credential | The [first stdio/IPC qualification contract](eh-g8-cfp1-p1-stdio-local-bridge-qualification-v1.md) requires per-profile/device-generation/client grant, current durable revocation checks, reviewed same-user process boundary and no native desktop secret or bearer in Codex configuration/stdout. Neither command mode nor IPC verifier exists for ordinary users yet. The prior [HTTP-helper candidate](eh-g8-cfp1-p1-local-mcp-credential-and-recovery-contract-v1.md) is held unless it proves server identity at send time; its cached-bearer behavior is not the selected stdio retry contract. |
| Personal authorization | An ordinary `user`, including a never-subscriber or expired hosted sponsor, can reach only their own service-created personal context and admitted full-surface tools. Account link, required scopes, source ownership, subject binding, consent, effect lease and native connector checks remain independent. A tool's presence in `tools/list` is not an effect grant. |
| Setup and use | The first-party wizard provisions only the owner's personal source and local pairing. From Codex, verify the actual full `tools/list`, selected read, one rights-qualified bounded effect, stop/revoke and recovery. Compare the coordination-only shadow catalog and reject any attempt to use shadow names as working personal tools. Every advertised operation needs its own context/version/acceptance row in the CFP-1 supported-offer register. |
| Isolation and recovery | Reject a wrong or switched account, wrong device, stale or revoked token, forged personal mode, cross-owner source, hosted-room operation without eligibility, expired effect lease and uncertain-action replay. Reconnect may recover identity and consent but cannot renew a stale effect authority or duplicate a native effect. Stop/revoke remains available when new effects are denied. |
| Service dependency | Test identity/domain/database outage separately from local service and hosted tunnel outage. Record what remains usable under independently valid local authority and what fails closed. Do not advertise offline personal use from loopback presence alone. Meter any identity, binary/update and support costs attributable to free users. |

CFP-2 implements and records the exact configuration technique, credential broker, supported
client build, observed tool catalog, install/restart traces, negative cases and
per-user cost in an installed evidence packet. If P1 cannot pass its public
`user` cases safely, return to CFP-1 for a selected alternative such as a
send-time-authenticated HTTP route or reviewed remote personal tunnel; do not relabel today's developer-only full
tunnel or coordination surface as P1. The [personal/hosted boundary](eh-g8-cfp1-personal-hosted-capability-boundary-v1.md)
remains the authority for personal context and effect isolation, while the
[CFP-1 offer](eh-g8-cfp1-product-rights-and-offer-contract-v1.md) governs claims,
rights and stage closure.
