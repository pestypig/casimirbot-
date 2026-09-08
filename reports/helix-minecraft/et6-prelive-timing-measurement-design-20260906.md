# ET6 timing measurement audit

Scope: source inspection and external design research, not live capacity evidence.
No authority, deadline, controller behavior, or accepted maturity changes.

## Finding

`PlayerActionRuntime.pollTemporalSuccessor` currently measures each HTTP call.
`applyReceivedTemporalSuccessor` separately validates and queues the response on
the client thread. The HTTP counters omit earlier evidence/proposal/admission
waiting and do not establish the time to actual scheduler activation.
The offline timing-budget helper requires a single clock origin for its stage
spans, so independently collected Java and Node timestamps cannot simply be
passed to it as a complete trace.

## Measurement approach for the next repair

Use a native monotonic envelope from the exact checkpoint event to the exact
successor's actual controller activation. Both endpoints have the same clock
origin; the interval naturally includes evidence delivery, external proposal,
admission/snapshot, polling and client-thread waiting. Queue acceptance is an
intermediate mark, not proof of scheduler activation or physical motion.

Correlate the envelope with resident request, predecessor plan/hash, checkpoint,
successor request/plan, producer epoch and run. Retain only bounded current-run
records. Missing starts, identity changes, interrupted or unactivated successors
must remain incomplete, not become zero latency or successful pickup.

Server-local stage durations can explain part of that envelope, but must not be
added to it: they are nested and would double-count. Cross-origin stage ordering
requires explicit mapping and uncertainty; native envelope subtraction does not.
Record native remaining-window units at checkpoint and activation as well as
elapsed milliseconds. Do not convert ticks to milliseconds by assuming 20 Hz.

Fault fixtures should cover prompt delay, delayed snapshot, delayed response,
client-thread delay, interruption before activation, duplicate/late response,
epoch replacement and an exhausted native window. A measured isolated fixture
must be labeled fixture timing, not live Minecraft capacity or a latency bound.

## External research and interpretation

- [ROS 2 real-time programming](https://docs.ros.org/en/eloquent/Tutorials/Real-Time-Programming.html)
  explains why nondeterministic or indefinitely blocking operations must be kept
  out of a time-critical execution path. Applied here: provider/network work
  cannot be promoted to a guaranteed movement deadline by collecting a mean.
- [ROS deadline, liveliness and lifespan design](https://design.ros2.org/articles/qos_deadline_liveliness_lifespan.html)
  distinguishes periodic delivery expectations, availability and validity.
  Applied here: the HTTP timeout, evidence freshness and remaining native action
  window are different constraints, not interchangeable timeout settings.
- [ROS 2 executors](https://docs.ros.org/en/rolling/Concepts/Intermediate/About-Executors.html)
  documents scheduling and determinism limitations of general executors.
  Applied here: independent I/O lanes reduce contention but do not prove bounded
  response time or replace native deadline/interruption enforcement.

These are design analogies, not a recommendation to adopt ROS or replace the
existing controller. Completion still requires implementation, correlated
evidence, integration verification and the original separate ET6 live test.
