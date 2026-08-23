Program gate: G2D — fresh replacement-candidate proof attempt
Workstream: authenticated classical control branch
Capability or component: G2D-R2 authorization-readiness checkpoint
Current maturity: independently revalidated decision-ready identity; execution unauthorized
Target maturity: one separately supplied exact user authorization or continued stop
Required frozen inputs: R1 checkpoint, implementation identity and R2 decision packet
Required evidence: five-file rehash, live runtimes, exact token/command and absent root
Stop/fail criteria: any byte/runtime/root/authority drift or inexact acknowledgement
Explicit non-goals: candidate execution/admission, G3, lanes, lamp or physical claims
Downstream gate unlocked: user decision on exactly one immutable G2D attempt

# G2D-R2 authorization-readiness checkpoint

This checkpoint records readiness to ask for a decision. It is not execution
authority and it is not a candidate result.

```text authorization-readiness-inventory
5480ec2ad381ae9f3fc685f1d29f9a2096f5cee8146021f7f1f94b63700d23c1  docs/research/nhm2-spherical-boson-star-v2-g2d-r1-execution-checkpoint.md
21e20f53f33f7517322a1a9d3c2e4290e8cf000617efe445cbebf349bacf81e5  docs/research/nhm2-spherical-boson-star-v2-g2d-implementation.v1.json
7934faf7426cc2c37d6a758a3e353a415853560a68819a9b434b79b784d6f87f  docs/research/nhm2-spherical-boson-star-v2-g2d-r2-authorization-decision.v1.json
7bac8ec0f80f4683e3ad04947d5e129f888550948b1f1dc58685c7de429b9f4b  docs/research/nhm2-spherical-boson-star-v2-g2d-r2-authorization-decision.md
cd69b14ee1df0bd89999c7a5b5f3c9a735241192bbfde0025ad52be1c9cb5df2  tools/nhm2-spherical-boson-star-v2-branch-proof/test_g2d_fluid_star_authorization_readiness.py
```

## Independent audit scope

The R2 audit imports no candidate evaluator or orchestrator. It independently:

- parses the JSON contracts with duplicate-key, floating-number and surrogate
  rejection;
- rehashes the 12-file R1 inventory and the five-file R2 inventory;
- derives the token from the seven frozen fields and domain separator;
- binds the exact future command and exact acknowledgement;
- rehashes every source and runtime manifest;
- checks the live Windows executable, Docker image and offline native binary;
- checks the one-CPU, 2048-MiB, network-none and 600-second ceilings; and
- verifies null authorization evidence, zero observed execution, all-false
  authority and absence of the exclusive future root.

The audit contains no `--execute` argument and performs no candidate math.
Its focused verdict is `6/6 PASS`; the underlying implementation/preexecution
battery remains `13/13 PASS`.

## Decision boundary

Identity capability and user authority remain distinct. The exact acknowledgement
frozen in the R2 decision packet is the only statement eligible to authorize the
one-shot command. A generic continuation instruction cannot do so.

Until that exact statement is separately supplied, candidate executions remain
zero and execution, admission, proof, state, lane, replay, agreement, lamp,
physical, propulsion and transport authority remain false.
