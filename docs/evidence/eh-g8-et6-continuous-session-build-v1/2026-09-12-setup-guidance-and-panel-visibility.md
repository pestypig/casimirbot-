# Setup guidance and panel visibility — September 12, 2026

Evidence under the [onboarding plan](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md)
and [work program](../../helix-environment-harness-work-program-v1.md).
Classification: presentation. No authority contract or maturity is advanced.

Following the [ordinary EXE observation](2026-09-12-ordinary-agent-access-presence-boundary.md),
AgentConnectionSetup now distinguishes an online tool_activity_only declaration
from missing presence. Its diagnostic, binding guidance and active-binding
availability explain that repeating that declaration cannot enable steering.
Missing presence retains refresh guidance. Admission and consent controls are
unchanged; client declarations are not provider attestation.

Source inspection also reproduced the structural cause of the obscured panel:
the shell forwarded dock panel navigation without closing its session list.
The common panel callback now closes that list after forwarding navigation,
including desktop dock, mobile dock and conversation navigation. It does not
change the selected chat. This does not prove every guide-overlay interaction.

Validation:

- AgentConnectionSetup.spec.tsx: 39 component tests passed. The updated test
  checks that connected tool-only guidance omits the repeated refresh instruction,
  binding remains disabled, and explicit recheck sends no POST. Existing recovery
  coverage verifies guidance changes when continuation becomes polling.
- helix-workstation-shell-mobile.spec.tsx: 6 component tests passed. Two added
  desktop/mobile cases open the session list, request Agent Access through a mock
  dock callback, verify list closure, preserve exact selected chat and verify
  mobile workstation selection. These test the real shell with a mocked dock,
  not an integrated composer or native pointer/keyboard workflow.
- Initial shell-test failures were fixture issues: an unsupported matcher and
  attempting to access the mobile workstation header while the Ask surface was
  selected. The corrected test navigates the visible surface first.
- Quick discipline check passed after the guidance edit; it inferred no sensitive
  Helix Ask changes and did not run a runtime battery.

These source changes postdate the running replacement EXE. They have not yet been
built into a new package or verified by native interaction. The missing callable
durable tools and actual host delivery remain unresolved. O1–O6 and CS1–CS4 are
not complete; CS5 remains incomplete, ET6 unpassed and NAV1 gated.
