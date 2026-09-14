# Supported MCP native control presentation

Under [onboarding O4/O6](../../work-packets/eh-g8-cs-onboarding-pairing-plan-v1.md).
Presentation-only work; no maturity promotion.

The callable `helix_workstation_human_control_present` first rejected stale
presence with `active_client_presence_required`. After refreshing this exact
task's authenticated presence, the same supported presentation call was accepted:
request `workstation_present_request:b207e55b-3bf8-4f83-bd82-8881847b0604`, exact
bind-current-helix-chat control, no control invocation, consent or authority.
The host journal recorded guidance requested at 18:28:32.331Z.

An initial screenshot was occluded by another app, so it was not treated as
visual proof. After activating the exact CasimirBot window, the screenshot
confirmed the spotlight on the disabled binding button. This is actual native
presentation, not queued pending-item consumption or pairing acceptance.

The direct control target bypassed its parent readiness metadata and displayed
generic “Your action is required” wording despite the missing pickup capability.
The overlay now reads the nearest ancestor readiness label and integration-block
metadata while retaining the exact control's geometry. A nested disabled-control
regression verifies “Connection limitation” and that the control stays disabled.

`npx vitest run client/src/components/workstation/__tests__/WorkstationGuidanceOverlay.spec.tsx --pool=forks --maxWorkers=1 --minWorkers=1`

Result: ten tests passed, exit 0. The change is not yet packaged. Native UI also
reported a five-second Full Harness readiness timeout during presentation;
authenticated MCP succeeded, but this separate readiness path needs diagnosis.
No restart, reconnect, consent activation or game action was performed. Full
O1–O6/CS1–CS4 and CS5 remain open; original ET6 unpassed and NAV1 gated.
