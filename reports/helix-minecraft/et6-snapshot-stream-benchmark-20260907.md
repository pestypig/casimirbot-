# Snapshot stream measurement

Classification: evidence persistence performance; no authority or freshness changes.

Synthetic benchmark `scripts/helix-local-snapshot-stream-benchmark.mjs` wrote 40,000 generated rows (89,028,891 bytes) four times to an isolated temporary directory. No live database contents or credentials were used. Each temporary output was removed after hashing; the empty benchmark directory was removed without recursive deletion.

16 KiB buffer: 792.0655 and 791.3797 ms, 5,000 drains each.
1 MiB buffer: 679.0112 and 690.8367 ms, 84 drains each.
All outputs had identical SHA-256 `4ab7484a5bf250b7a75284a3e7dfbdc4208b3823fc2d8753531aa53ff3f1ef2b`.

Source writer now explicitly uses a bounded 1 MiB high-water mark. Row-at-a-time serialization, stream completion, atomic rename and strict acknowledgement remain unchanged. This modest improvement does not explain or repair the full live backlog; table materialization, repeated full writes and projection delivery still need profiling. No claim of live capacity or delivery repair follows from this benchmark.

Verification after source edit: temporal persistence reopen plus enabled native event/terminal receipt persistence tests, 4/4 passed. Fault-injected write/read failures still withhold executable/receipt responses. Packaged EXE not rebuilt or restarted in this turn. ET6 incomplete, NAV1 gated.
