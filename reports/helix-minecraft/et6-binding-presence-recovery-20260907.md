# Binding visibility recovery — 2026-09-07

Classification: presentation. No runtime continuation, admission, permission,
or provider wake behavior changed.

First divergence: Agent Access fetched and displayed the existing binding only
after continuation readiness. An expired presence heartbeat therefore hid an
active binding, while the chat destination could still display that binding.

Source repair:

- Inspect the authenticated current binding at the check step without requiring
  an online task heartbeat.
- Keep the binding card and its inspect/revoke controls available at that step.
- Display binding status, AI availability, and the limits of Minecraft readiness
  independently. Run association is not game connectivity or action authority.
- Keep replacement disabled until connection readiness and continuation are
  current. Do not issue claims, revoke, renew permissions, or wake a task as a
  side effect of observation.

Verification: AgentConnectionSetup tests 34/34 passed, including cold-start
recovery with absent task presence and no mutating requests. The discipline
quick static check passed across the dirty checkout; its broad classifications
are not evidence that unrelated edits were verified.

Renderer production build passed (59.16 seconds), with browser-external module,
tree-sitter eval, chunk/import and outdated Browserslist warnings. Scoped diff
check passed. Environment-harness documentation audit passed with zero failures.
The installed/running EXE was not changed by this renderer build.

Remaining: connect a governed session-resume path, verify the complete UI
journey, package and switch the EXE, then resume live ET6 qualification. This
source repair alone does not establish EXE acceptance or ET6 capacity. No new
Minecraft motion, rolling extension, interruption, or revoke proof was obtained.
