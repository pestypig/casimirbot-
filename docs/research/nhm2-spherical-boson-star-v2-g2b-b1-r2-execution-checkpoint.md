# NHM2 spherical-boson-star v2 G2B-B1-R2 execution checkpoint

Program gate: G2B — replacement classical proof attempt  
Workstream: authenticated classical branch closure  
Capability or component: exact-byte initializer persistence  
Current maturity: implementation frozen and preexecution tests passing  
Target maturity: one exclusive persistence result  
Required frozen inputs: B1-R2 packet/source/spec and B1-R1 result  
Required evidence: exact command output plus complete readback receipt  
Stop/fail criteria: first one-shot error; no retry or cleanup  
Explicit non-goals: candidate solve, numerical change, replay or authority  
Downstream gate unlocked: integrated four-grid execution packet

The B1-R2 implementation is frozen for one command:

```text
python -B -W error \
  tools/nhm2-spherical-boson-star-v2-branch-proof/g2b_b1_r2_initializer_persistence.py \
  --execute-once
```

Frozen implementation bytes:

| Artifact | SHA-256 | Bytes |
| --- | --- | ---: |
| B1-R2 source | `87ee9d2aeb9532a43f48df5a004feb53115b9dab8551a8f5524fb2f622076182` | 10,939 |
| B1-R2 focused spec | `7171a4f541636d20b7d7ad872ea93f4df7595068a954aaa0c5600407dbe0541e` | 5,721 |
| B1-R2 packet | `456389e91a2a488b1065aa6ab825bdf94f5918c70f545f58d874d0ffac85ca11` | 3,434 |
| B1-R1 source | `b96124285781c00a9f884fb162591c5f7bc6817081e6ddd74e2e41cab5ca3e1e` | 14,481 |

Preexecution checks:

- focused Python spec: 9/9 PASS;
- source AST/compile: PASS;
- exact output root absent;
- six expected paths unique and total 2,664 bytes;
- public execution command exact;
- exclusive collision behavior tested;
- no branch solver, cross-grid evaluator, candidate executor, subprocess,
  overwrite, deletion, registry or authority-promotion surface.

The command is the only authorized production invocation. A failure leaves any
partial root untouched and becomes terminal B1-R2 evidence.
