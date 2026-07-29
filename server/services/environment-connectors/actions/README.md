# Environment connector action lane

This namespace is reserved for a future `room.environment.act` contract.

It intentionally contains no executor, credential, tool registration, REST
route, or MCP projection. Environment observation and probe credentials must
never authorize actions. Until a separate action epic supplies effect classes,
approvals, idempotency, preconditions, cancellation, and before/after
verification, all command requests remain `command_execution_not_enabled`.

