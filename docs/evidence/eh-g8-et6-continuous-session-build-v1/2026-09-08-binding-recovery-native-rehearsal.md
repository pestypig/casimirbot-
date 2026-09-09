Program gate: G8
Workstream: CS1/CS4 binding recovery
Capability or component: packaged readiness expiry and recovery presentation
Lifecycle stage: presentation
Reaction timescale: deadline observation and five-second recovery checks
Authority owner: authenticated supervisor presence and human binding consent
Current maturity: specified
Target maturity: deterministically verified prerequisite plus packaged rehearsal
Required evidence: native ready, expired and recovered control states
Explicit non-goals: no consent automation, action permission renewal or ET6 acceptance
Downstream gate unlocked: none

The running package is `apps/desktop/release-cs4-binding-recovery-20260908/win-unpacked/CasimirBot.exe`.
Its identity and all 645 runtime comparisons are recorded in
`2026-09-08-cs4-binding-recovery-package.json`. The EXE shell hash alone does
not distinguish renderer changes; the client tree hash is
`721dfa4cfe0050a5653298b5b61f4657acbb10f2f17e362bae9ac1ec57da8ba6`.

The old package was closed normally, then this package launched once. The native
launch helper timed out waiting for a targetable window, but the same launch
subsequently became ready; there was no second launch. The keyed service became
ready at 2026-09-08T21:32:32.800Z on localhost port 53996, service instance
`service_instance:6df67d184fef18cf9e33997fb5fbddbd`. Native accessibility showed
the restored chat title `Continuous session recovery`.

The exact continuation `01a081e3-1973-76a3-b35b-0bd6d541933d` registered through
authenticated supervisor presence. An expired presence initially rejected the
supported transport transition. Refreshing that same presence and executing the
existing trusted-device delegation restored transport. A successful Ready up
`discover_runs` call independently proved the full MCP path and retained run
`run_4dcfd185-c553-420c-b653-d343aed95aa9`, version 2. No user reconnect was needed.

Packaged native rehearsal:

1. Presence refreshed at 21:36:38.198Z with a deliberate 60-second TTL. The server
   verified the retained run and room. Native accessibility subsequently showed
   the enabled exact-run checkbox and enabled Bind current Helix chat button.
2. After expiry at 21:37:38.198Z, the native read at 21:37:47Z showed the unavailable
   continuation explanation, disabled run checkbox and disabled Bind button.
   Recheck connection remained enabled. No manual refresh was performed.
3. Same-task authenticated presence refreshed at 21:37:54.743Z with 180 seconds.
   The next native observation showed the exact-run checkbox and Bind button
   enabled again, automatically, with 2:45 presence remaining. No reconnect,
   rebind, navigation or consent click was used during this recovery sequence.

This is a real packaged rehearsal of readiness expiry and recovery. The hung
request timeout, preserved checked selection and obsolete response rejection
have component-test evidence (41 passing setup/expiry tests), not live injected
network-fault evidence. Native capture/pointer geometry was unavailable earlier;
these observations establish accessibility control states, not a completed
physical consent click. No new claim was issued or consumed during this test.

The environment action permission has expired and was not renewed. Integrated
binding/ingress/movement/recovery acceptance remains outstanding. CS1-CS4 remain
incomplete, CS5 reconciliation remains a handoff of outstanding requirements,
original ET6 remains unpassed and NAV1 remains gated.
