# Direct account recovery entry

Presentation repair under [the onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md), following [the ordinary setup-entry rehearsal](2026-09-13-setup-entry-package.md). No authority or maturity advancement is claimed.

The signed-out Agent Connections step instructed the user to find a workstation account menu. The observed shell exposed no such menu beside that instruction. The existing registered `account-session` panel supplies the account sign-in choices; the separate AgentAccountBindingReadiness widget only mounts at the later authorize step, and native Auth0 account-link start requires an existing account session. Exposing that later OAuth-link control would therefore not repair this earlier prerequisite.

AgentConnectionSetup now shows Open account sign-in at the account step. It invokes the existing workstation guidance route to `account-session`; it does not activate authentication, submit credentials, change the selected chat, issue a claim or enable transport. Updated copy tells the user to return and retry after sign-in.

Validation: AgentConnectionSetup component suite passed 41/41. Its added 401 case verifies the entry, one navigation event, retained chat and no additional network call or mutation. Two isolated Chromium tests passed using actual production AgentConnectionSetup rendering and an intercepted fixture 401: pointer and keyboard activation emit the account-panel guidance event with zero API mutations. These tests use a disposable loopback fixture and no ordinary account or credentials. They prove input/navigation request behavior, not successful account authentication or full production-handler integration.

Client production build passed in 45.98 seconds; presentation discipline quick check passed. Existing build warnings remain. Package comparison, ordinary launch and actual destination-panel navigation must be recorded separately before this source repair is considered exercised in the EXE. All O1–O6/CS1–CS4 exits and the CS5 handoff remain in scope; ET6/NAV1 are unchanged.
