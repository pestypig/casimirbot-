Program gate: G2H-E-S5 — inert primary execution-preflight decision
Workstream: candidate-neutral C08 implementation and performance equivalence
Capability or component: H2-P5A-R2 representative-width cloud timing proposal
Current maturity: exact proposal frozen at `34a5af86...84bb`, producer preflight 20/20 and independent audit 26/26; zero upload, VM or numerical action
Target maturity: one separately authorized immutable five-run `P=1024` cloud timing result that decides whether the H2 runtime meets the frozen 24-hour turnaround boundary
Required frozen inputs: R2 archive `e9a2d9ee...37d87`, manifest `2a48f796...ccce`, clean-daemon audit `d01ec559...852c`, binary `aa37562f...13b7`, exact C4 resource, 1/4/8/16/16 sequence and proposal `34a5af86...84bb`
Required evidence: exact resource and archive identity, clean-daemon guard PASS, binary-hash checkpoint, five immutable complete/FAIL/timeout/partial receipts, semantic-digest agreement, timing projection, independent audit, stopped VM and false authority locks
Stop/fail criteria: creation rejection or resource substitution, archive or build-binding mismatch, registry/network access, binary mismatch, any numerical mismatch/timeout/partial/nonempty stderr, aggregate runtime or cost ceiling, retry/retune, evidence mutation or authority promotion
Explicit non-goals: smaller-width calibration, full selector, frozen-candidate evaluation, positive sampling, candidate/output-root/token creation, handler linkage, G3, SI/metric, lanes, lamp, physical viability, propulsion or transport
Downstream gate unlocked: only after a separately authorized execution and independent result audit, either accept the measured runtime binding or return to candidate-neutral H2 performance engineering under a new packet

# H2-P5A-R2 cloud timing proposal

Status date: August 27, 2026.

Status: **FROZEN AND INDEPENDENTLY AUDITED / AWAITING SEPARATE EXACT
AUTHORIZATION**.

This is a candidate-neutral decision packet. Preparing it created no VM,
uploaded no file and ran no numerical calibration. It does not evaluate the
frozen boson-star member and does not promote proof or physical authority.

## Exact frozen proposal

Proposal SHA-256:

`34a5af861a7800370615ce4ba4ab34bc211acbe8e445c17979a18067bcaa84bb`.

The sole proposed resource is:

- Google Compute Engine VM `nhm2-h2-p5a-r2-c4-16-20260827`;
- exactly one creation attempt in `us-central1-a`;
- on-demand `c4-standard-16`;
- exactly 30 GB `hyperdisk-balanced` boot storage;
- planning compute rate approximately `$0.79068/hour`;
- aggregate VM runtime ceiling 7,200 seconds;
- total cost ceiling `$2.00`;
- stop after evidence capture, without deleting its disk, logs or evidence.

The sole permitted upload is the existing 39-entry archive
`h2-p5a-r2-upload-v1.tar`, 236,267,520 bytes, SHA-256
`e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87`.
No additional upload is permitted.

## Build and binary checkpoint

The extracted archive must enter a clean Docker daemon. The exact R2 guard
must load the bundled images, accept only their frozen manifest/config
identities, build with `--pull=false --network=none`, prove identity stability,
and invoke only `sha256sum` before timing. It must reproduce binary SHA-256:

`aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7`.

Any failure ends the attempt before numerical execution. There is no alternate
Dockerfile, online pull, build retry or substitute image.

## Exact five-run decision

Only after the build checkpoint passes, execute one candidate-neutral
`P=1024` calibration at each thread count in this order:

1. 1 thread;
2. 4 threads;
3. 8 threads;
4. 16 threads;
5. one repeated 16-thread run.

Each run has a 3,600-second external timeout. Complete, FAIL, timeout and
partial output are all immutable evidence. There is no numerical retry,
retuning, deletion or alternate output root.

The timing decision passes only if all five runs complete with empty stderr,
identical semantic SHA-256, no numerical mismatch, and the slower of the two
16-thread measurements is at most 337,502 ms. The preregistered linear
projection multiplier is `255.998046875`; that ceiling corresponds to no more
than 24 hours for two selector calls. This is a runtime-turnaround decision,
not a boson-star proof result.

## Proposal evidence

- producer preflight: **20/20 PASS**, SHA-256
  `1265a0a1cae99acd32203165490816cf33bec58b2f8e732cb00633dbb185c457`;
- independent audit: **26/26 PASS**, SHA-256
  `f02cdd1c38474571a46b68a9cccc555e551a0b96c6662757718241c2ffe92510`;
- uploads: 0;
- VM creations or starts: 0;
- numerical runs: 0;
- authority promotion: false.

Current-head verification passes math **323/323**, the complete required
18-file WARP battery **179/179**, and Casimir adapter run **2554**
`PASS/GREEN` with `firstFail=null`, certificate SHA-256
`6e84f965957f63aad452981d2ede72e62f706d32e0a5b6b469899884e12a4e45`
and integrity true. The local adapter was stopped after verification. These
checks certify repository gate integrity only; they do not authorize or execute
the proposal.

## Exact authorization text

No action should be inferred from this packet. If the operator chooses to run
it, the separate authorization is:

> I authorize creation of exactly one temporary on-demand c4-standard-16
> Google Compute Engine VM named nhm2-h2-p5a-r2-c4-16-20260827 in
> us-central1-a with exactly 30 GB hyperdisk-balanced storage, at the planning
> compute rate of approximately $0.79068/hour, a 7,200-second aggregate VM
> runtime ceiling, and a $2.00 total cost ceiling, under H2-P5A-R2 proposal
> SHA-256 34a5af861a7800370615ce4ba4ab34bc211acbe8e445c17979a18067bcaa84bb.
> Upload only the candidate-neutral 39-entry archive h2-p5a-r2-upload-v1.tar,
> 236,267,520 bytes, with SHA-256
> e9a2d9ee23fac2c1ef8a5b2d128ee5690014f96dd0cf781af6a8546404f37d87,
> bound by source manifest SHA-256
> 2a48f796d10e4dd048838eb50f307c066db3cf5dd5a29fc5098509a27c91ccce;
> upload no additional files. Use the frozen R2 clean-daemon guard, build with
> no pull and no network, and require binary SHA-256
> aa37562fe73ecf48b0177b6875aea48a259a0439fdbc24abc0525624acb013b7
> before timing. Execute exactly one candidate-neutral P=1024 calibration at
> 1, 4, 8 and 16 threads plus exactly one repeated 16-thread calibration, in
> that order, each with a 60-minute external timeout. Preserve PASS, FAIL,
> timeout or partial output as immutable evidence, independently audit it, and
> stop the VM afterward without deleting its disk, logs or evidence. I do not
> authorize another creation attempt or any resource substitution, additional
> upload, build or numerical retry, retuning, smaller-width calibration, full
> selector, frozen-candidate evaluation, positive sampling, candidate/output-
> root or token creation, scientific handler linkage, G3/SI/metric/lane work,
> evidence deletion, or any candidate, proof, geometry/state, lane, lamp,
> physical, propulsion or transport authority promotion.
