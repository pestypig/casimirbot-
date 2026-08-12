# CasimirBot Device Check for Codex

This repository plugin connects Codex to CasimirBot's dedicated OAuth-protected
Streamable HTTP Device Check service at
`https://casimirbot.com/mcp/device-check`. It does not embed or replace the
Codex runtime.

The `helix_environment_device_check` tool is read-only. CasimirBot derives the
owner profile from the verified OAuth principal and returns connector identity,
freshness, and probe-readiness observations. It does not return credentials,
device public keys, raw observations, assistant answers, or terminal-eligible
content.

The endpoint advertises only that one tool. Broader Helix run, room, source,
and command tools are not part of this plugin and require a separate capability
profile and explicit consent.

The connector remains outbound-only: paired environment adapters contact the
CasimirBot service, and Codex contacts the HTTPS MCP endpoint. The desktop
loopback session secret is never copied into this plugin or Codex configuration.

The desktop release carries this plugin inside an integrity-checked local
marketplace. Installation is always an explicit Codex action and OAuth remains
owned by Codex; CasimirBot never edits Codex configuration or copies tokens.

The marketplace currently marks installation `NOT_AVAILABLE` because the
production Device Check protected-resource discovery endpoint and Auth0 flow
have not yet passed deployment conformance. The desktop button therefore fails
closed until the signed package identity and the production `helix.rooms.read`
flow are verified end to end.
