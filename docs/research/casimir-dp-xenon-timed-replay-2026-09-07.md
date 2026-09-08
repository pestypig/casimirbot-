# Recoil timing and published pulse-merging inputs

Exploratory S1 response prerequisite, September 7, 2026.

[LZ's ultraheavy-DM study, section II](https://arxiv.org/html/2402.08865v1)
describes a parametric pulse-merging model depending on arrival-time
separation, width and relative area. It quotes approximate scales of 200 ns
for S1 and 2 microseconds for S2. These are descriptive scales, not sharp
acceptance cuts. That SR1 analysis uses different data, selection and an
ultraheavy straight-track model. Its efficiency and collinearity cuts cannot
be imported for the present 100 GeV particles, which deflect and lose energy.

The earlier slab archive recorded recoil energy and depth but not flight
time. The new instrumented replay accumulates, for every free-flight segment,
the traveled fraction of slab thickness divided by particle speed in units
of c. Null collisions are included in elapsed flight time; exit segments are
clipped at the boundary. Collision times are then stored with each recoil.
Physical time is the saved value multiplied by slab thickness/c. No new
liquid density or physical slab thickness is assumed here.

All five archived mono-speed pilot runs replay exactly: terminal states,
speeds, cosines, deposits and every pre-existing recoil field are bitwise
equal. The instrumentation adds no random draws. Per-history recoil times
are nonnegative and monotonic. The compressed archive adds a fifth recoil
column; JSON gives its units and source/archive hashes.

This resolves a missing transport output, not detector calibration. For
S1 arrival times, light propagation and pulse shape remain required. For
S2, collision time must be combined with electron drift time, diffusion,
extraction and electroluminescence. Recoil separation in depth alone is not
arrival-time separation, especially on a slowing or reversing trajectory.
The 5.4 keV recoil predicate remains distinct from a pulse-finder threshold.

Next authenticate the applicable WS2023 response implementation or explicitly
keep any merging calculation as a sensitivity scenario. Do not apply the
two approximate SR1 timing scales as universal WS2023 selection rules. No
accepted count, excluded candidate or measurable shared model follows.
