# Measurability scenarios: the comparator is not a detection threshold

Date: 2026-09-07. Illustrative readout statistics; no measured sensitivity is supplied.

The user's priority is measurable signals in both experiments. Recent calculations compare against the frozen DP forecast D=0.02951146. Failing to reach that forecast does not itself imply an effect is experimentally unmeasurable. Conversely, matching the forecast does not establish sensitivity or attribution. An experimental noise budget and an identifiable control observable are still required. A request for measured visibility, accepted-shot throughput and systematic floor is pending.

For an explicit illustration, assume independent binary readout, equal shot allocation to signal/reference settings, known baseline visibility V, and a control that changes the exponent by D while preserving nuisance parameters. At the fringe extremum the probability difference has magnitude Delta p=V(1-exp(-D))/2. For N total accepted shots, the variance of the difference of sample proportions is at most 1/N. A conservative nominal normal-SNR budget z is therefore

N = 4 z^2 / [V^2 (1-exp(-D))^2].

This is a sufficient variance-based budget in this idealized protocol, not a fundamental minimum number of shots, an exact confidence limit, or a discovery-power calculation. It is not a statement that dark matter can be switched off in the apparatus. A physical control must actually distinguish the proposed signal from backgrounds. Other measurement protocols may have different statistics.

For V=0.5 and z=5:

| Hypothetical D | Conservative accepted shots | Serial hold-only years at 0.25 seconds/shot |
| --- | ---: | ---: |
| 0.02951146 | 4.73003e5 | 0.00375 |
| 5.58344e-4 | 1.28380e9 | 10.17 |
| 1e-5 | 4.00004e12 | 31688 |
| 4.00082e-19 | 2.49897e39 | 1.97969e31 |

The first hold-only duration is about 1.37 days. These durations exclude preparation, reset and rejected shots; they are arithmetic for serial operation, not schedules or experimental feasibility claims. Parallel operation changes elapsed time but not this shot-count calculation. The 5.58e-4 entry is motivated by a prior upper bound, not an expected signal. The very small last entry is a conditional response scale, not a measured effect.

Systematic probability offsets must also be substantially below V(1-exp(-D))/2 to isolate the effect without a nuisance model. Repetition alone cannot remove a persistent bias. The script uses expm1 to preserve tiny fractional losses and checks the resulting SNR algebra.

Decision: retain the DP value as a theoretical comparison only. Future candidate assessments must report their actual D and the sensitivity assumptions needed to observe it, rather than equating below-comparator with undetectable. No new model is admitted, no apparatus input is changed, and no measured sensitivity is claimed.
