# Setup entry remains reachable when the observer is unavailable

Presentation repair under [the onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md), following the [ordinary recovery reproduction](2026-09-13-ordinary-recovery-boundary.md). This is a CS4/O4 recovery-path increment and does not change consent, task identity or environment authority.

The Activity & setup drawer contained only the policy-gated AgentRunObserverBindingSurface below its External agent setup summary. That component returns null when observer access is unavailable, producing an expanded empty section in the observed signed-out ordinary EXE.

HelixAskConsoleRuntimeShell now always supplies explanatory account/connection/pairing text and an Open Agent Access button. Activation closes the drawer and invokes the existing workstation guidance route for the Agent Access panel. The observer component and all its policy checks remain intact. Opening the drawer alone does not initiate guidance or consent. The entry has no account credential, claim, grant or execution arguments.

The focused layout suite passed 2/2 tests, including the unavailable-observer case, single guidance event, drawer closure and preserved conversation. These are jsdom component tests using fireEvent and a mocked unavailable observer, not browser hit-testing, keyboard or packaged acceptance. The presentation discipline quick check passed. The client production build passed in 2m9s with existing browser externalization/eval/chunk warnings.

Packaging is tracked separately. Until a new package is launched and inspected, the previously running runtime-recovery EXE still has the original drawer. This repair does not prove that sign-in persisted, MCP reconnected, pairing was accepted, or any original CS1–CS4/O6 exit passed. Those remain required alongside the full CS5 inventory and unchanged original ET6 acceptance.
