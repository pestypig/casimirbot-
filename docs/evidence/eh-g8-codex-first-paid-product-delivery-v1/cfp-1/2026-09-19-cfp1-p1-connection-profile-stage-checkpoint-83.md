# CFP-1 P1 connection-profile stage checkpoint — 2026-09-19

The [P1 packet](../../../work-packets/eh-g8-cfp1-free-personal-codex-connection-profile-v1.md)
selects same-host Codex desktop to the signed harness's loopback `/mcp` as
CFP-2's first **installed qualification target** for the free personal offer.
[Current official Codex MCP documentation](https://learn.chatgpt.com/docs/extend/mcp?surface=cli)
supports local desktop Streamable HTTP and shared local configuration. The
existing [source feasibility checkpoint](2026-09-19-codex-local-mcp-profile-feasibility-25.md)
identifies CasimirBot's changing-port and external-client bearer gaps.
Those facts support a test path, not ordinary-user acceptance or customer copy.

The CFP-1 offer and personal/hosted boundary now point to P1, and the
CFP-2.PUBLIC and CFP-2.ONBOARD candidate packets consume its exact client,
identity, port-recovery, catalog and isolation cases. An independent read-only
review found the source claims, authority boundary and links consistent, with
no blocking finding. `npm run helix:environment-harness:docs-audit` returned
`ok: true` with zero failures; changed-file `git diff --check` passed. No
runtime, Codex configuration, account, tunnel, payment or release setting was
changed.

**Stage decision:** CFP-1 remains active (`specified`); CFP-2 and CFP-3 remain
blocked by the remaining owner, rights, cost and acceptance-freeze decisions.
P1 leaves the exact advertised client version, device/offline policy, token
broker and actual signed installed results for their assigned authorities.
