Program gate: G8
Workstream: CS3 scheduled moving-runway prerequisite
Capability or component: compiler-derived exact-tick motion and successor handoff
Lifecycle stage: evidence normalization
Reaction timescale: native ticks
Authority owner: caller plan semantics and unchanged resident gates
Current maturity: specified
Target maturity: deterministically verified prerequisite
Required evidence: compiled scheduled plans, variable arrival, three handoffs and late-start rejection
Explicit non-goals: no simulated live acceptance, idle padding, gameplay or production changes
Downstream gate unlocked: none

The actual temporal compiler now has a retained four-plan test fixture,
`minecraft/helix-fabric-player-agent/src/test/resources/compiled-scheduled-handoff.json`.
The source plans are hash-linked and share an observed source clock. Root motion
starts exactly at tick 8; each plan supplies ten motion ticks (500 ms parameter),
with handoffs at ticks 18, 28 and 38 and final completion at tick 48. Earliest and
latest action starts are equal. The eight-tick launch window is separate from
performed motion; it does not extend a finished route.

The TypeScript fixture test recompiles all four sources and compares the complete
artifacts to the retained JSON. The Java test loads that resource directly, so
its execution does not depend on an ignored generated build file. For first
arrival at source ticks 0, 3 and 8, the real sequence engine verifies forty
continuous input ticks across three handoffs, then terminal release. Arrival at
tick 9 fails without asserting forward input. The fake bridge supplies position
updates; this is simulation, not measured Minecraft displacement or transport.

The first run failed only an overly broad assertion demanding a release call
for late rejection, where no controls had been acquired. The corrected assertion
requires zero forward input for every rejected case and release after every
executed chain. Production behavior was unchanged. The previous unscheduled
one-tick-delayed rejection regression remains in the passing selection.

Verification: TypeScript native-handoff fixture suite 3/3; selected Java scheduled
and compiler-derived walk tests 3/3; scoped whitespace check passed. GameTests
were excluded. No EXE rebuild, application restart, gameplay action or human
binding consent was performed for these tests.

This demonstrates one existing primitive composition that tolerates bounded
pre-motion delivery delay in a deterministic engine fixture. It does not prove
that live observation, semantic planning, broker delivery and queue admission
fit the ten-tick toy runway. A useful course must have a separately frozen,
measured latency envelope and fresh observed affordances; its plans must not
copy the fixture's synthetic positions or treat pre-motion waiting as capacity.
The live three-successor trial, negative perturbations, interruption/revocation,
complete packaged rehearsal and CS5 handoff remain outstanding. ET6 remains
unpassed and NAV1 remains gated.
