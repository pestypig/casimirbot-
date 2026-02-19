# Quake Decision Primitive Extraction → Helix Ask Runtime Map

## Scope & method
Research-only extraction from Quake 3/ioq3 source files requested in task:
- `code/qcommon/common.c`
- `code/qcommon/vm.c`
- `code/client/cl_cgame.c`
- `code/game/ai_main.c` (used as the practical `ai_main.c` location in ioq3)
- `code/botlib/be_ai_weap.c`
- `code/botlib/be_ai_gen.c`

Quake citations below are line-anchored to upstream files (ioq3 mirror).

---

## 1) Event pump / journaling

### Quake primitive
- `Com_InitJournaling()` configures a record/replay mode via `journal` cvar and opens `journal.dat` + `journaldata.dat` for deterministic replay or capture (`journal=2` replay, `journal=1` write). 
  - Source: `common.c` lines 1917–1939.
- `Com_GetRealEvent()` reads from journal during replay and writes live events during capture, preserving event payload bytes.
  - Source: `common.c` lines 2061–2092.
- `Com_Frame()` is the centralized frame/event pump and timing governor.
  - Source: `common.c` lines 3080–3145.

### Helix Ask module mapping
- Deterministic event record shape: `buildEventStableFields(...)` in `server/services/helix-ask/quake-frame-loop.ts`.
- Runtime event spine + adapter verdict emission: `emitEventSpine(...)` usage in `server/routes/agi.adapter.ts`.
- Trace persistence/export path: `recordTrainingTrace`/JSONL export route in `server/services/observability/training-trace-store.ts` and `server/routes/training-trace.ts`.

### Direct adoption primitive
**Primitive:** “Frame-pump emits stable event packet + replayable journal record on every major decision edge.”

---

## 2) VM / syscall boundary

### Quake primitive
- `VM_DllSyscall(...)` marshals VM-side variadic args into a deterministic engine syscall vector (`currentVM->systemCall`).
  - Source: `vm.c` lines 338–355.
- `VM_Create(...)` enforces managed VM instantiation and loading pathway (DLL or `.qvm`) with explicit system call hook.
  - Source: `vm.c` lines 576–627.
- `VM_Call(...)` is the single boundary entrypoint for game module calls, preserving ownership (`currentVM`) and call-level bookkeeping.
  - Source: `vm.c` lines 807–850.
- Client use in `cl_cgame.c`: `VM_Create("cgame", CL_CgameSystemCalls, interpret)` and `VM_Call(...CG_INIT...)` / `VM_Call(...CG_DRAW_ACTIVE_FRAME...)`.
  - Source: `cl_cgame.c` lines 736–746 and 795–797.

### Helix Ask module mapping
- Adapter boundary contract (`/api/agi/adapter/run`) returns explicit machine-readable boundary outputs: `verdict`, `firstFail`, `deltas`, `certificate`, `artifacts`.
  - `server/routes/agi.adapter.ts` lines 515–526.
- Ask runtime deterministic-vs-generative split point is encoded as move selection and stable fallback packet construction in `server/services/helix-ask/quake-frame-loop.ts`.

### Direct adoption primitive
**Primitive:** “All model/tool invocations cross one typed boundary that normalizes side effects and return contract.”

---

## 3) Fixed think cadence

### Quake primitive
- Bot loop constrains `bot_thinktime` (max 200 ms), reschedules on think-time change, accumulates residual time, and executes only when residual crosses cadence threshold.
  - Source: `ai_main.c` lines 1459–1483.
- Per-bot residual scheduler executes `BotAI(...)` at cadence (`botthink_residual >= thinktime`).
  - Source: `ai_main.c` lines 1553–1568.
- Think-time default registration (`bot_thinktime=100`) and tuning cvars are explicit runtime knobs.
  - Source: `ai_main.c` lines 1666–1677.

### Helix Ask module mapping
- “Clocked” decision behavior is represented by deterministic move/policy functions in `server/services/helix-ask/quake-frame-loop.ts`.
- Batch/offline cadence control and quality checks live in sweep/experiment scripts (`scripts/helix-ask-sweep.ts`).

### Direct adoption primitive
**Primitive:** “Split interactive ask loop into fixed-budget tick(s) with residual carry, so deep work doesn’t stall response contract.”

---

## 4) Fuzzy weighted action selection

### Quake primitive
- `BotChooseBestFightWeapon(...)` computes fuzzy weights (`FuzzyWeight(...)`) for each valid weapon and selects max-weight action.
  - Source: `be_ai_weap.c` lines 404–433 (esp. 426–430).
- Weight indices are precomputed (`FindFuzzyWeight`) for fast runtime scoring.
  - Source: `be_ai_weap.c` lines 339–341.

### Helix Ask module mapping
- `selectDeterministicMove(...)` computes weighted scores for four answer actions and deterministically selects max score (with stable tie-break).
  - `server/services/helix-ask/quake-frame-loop.ts` lines 44–63.

### Direct adoption primitive
**Primitive:** “Explicit weighted policy over finite action set with deterministic tie-break; never free-form choose policy path.”

---

## 5) Offline parameter tuning loop

### Quake primitive
- End-match interbreeding pipeline computes rank fitness (`kills*2 - deaths`), selects parent1/parent2/child, interbreeds fuzzy goal logic, then mutates child.
  - Source: `ai_main.c` lines 563–581.
- Parent/child selection uses rank-weighted genetic selection with reversal for child choice.
  - Source: `be_ai_gen.c` lines 90–134.
- Runtime hook `BotInterbreeding()` is invoked in main bot update loop.
  - Source: `ai_main.c` line 1457.

### Helix Ask module mapping
- Offline sweeps and threshold optimization are already represented in experiment harnesses (`scripts/helix-ask-sweep.ts`) and training trace export route for replay datasets (`/training-trace/export`).
- The adapter exposes machine-readable optimization signals (`verdict`, `firstFail`, `deltas`, `certificate`) that can become fitness terms.

### Direct adoption primitive
**Primitive:** “Replay traces feed offline optimizer that tunes thresholds/weights/budgets (not model weights) against explicit fitness.”

---

## Ranked adopt-now list (versatility impact)

### P0 (adopt now)
1. **Deterministic weighted move selector everywhere** (extend current `selectDeterministicMove` usage to all answer-mode forks).
   - Expected versatility impact: **+4–7 pp** ask pass-rate on mixed-domain prompts via reduced policy drift.
2. **Unified decision journal packet at every stage boundary** (pre-retrieval, post-retrieval, post-gate, final render).
   - Expected versatility impact: **+3–5 pp** faster failure recovery / replay-debug closure; lower contradiction regressions.

### P1
1. **Residual fixed-cadence split (interactive/deep tick)** for heavy retrieval and bridge traversal.
   - Expected versatility impact: **+2–4 pp** by reducing timeout/placeholder outcomes under long-context prompts.
2. **Strict syscall-like boundary wrappers for tool/model calls** with normalized return schema.
   - Expected versatility impact: **+2–3 pp** by reducing boundary ambiguity and fallback inconsistency.

### P2
1. **Genetic-style offline tuner over policy parameters** (weights, gate thresholds, traversal budgets) using trace fitness.
   - Expected versatility impact: **+1–3 pp** medium-term; stronger stability across domain shifts.

---

## Compact primitive→module map

| Primitive | Quake anchor | Helix Ask module(s) |
|---|---|---|
| Event pump + journal replay | `common.c` 1917–1939, 2061–2092, 3080–3145 | `server/services/helix-ask/quake-frame-loop.ts`, `server/routes/agi.adapter.ts`, `server/routes/training-trace.ts`, `server/services/observability/training-trace-store.ts` |
| VM/syscall boundary | `vm.c` 338–355, 576–627, 807–850; `cl_cgame.c` 736–746, 795–797 | `server/routes/agi.adapter.ts`, `server/services/helix-ask/quake-frame-loop.ts` |
| Fixed think cadence | `ai_main.c` 1459–1483, 1553–1568, 1666–1677 | `server/services/helix-ask/quake-frame-loop.ts`, `scripts/helix-ask-sweep.ts` |
| Fuzzy weighted action choice | `be_ai_weap.c` 404–433 | `server/services/helix-ask/quake-frame-loop.ts` |
| Offline parameter evolution | `ai_main.c` 563–581, 1457; `be_ai_gen.c` 90–134 | `scripts/helix-ask-sweep.ts`, `server/routes/training-trace.ts`, `server/routes/agi.adapter.ts` |

---

## Upstream source anchors (for reproducibility)
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/qcommon/common.c#L1917-L1939
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/qcommon/common.c#L2061-L2092
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/qcommon/common.c#L3080-L3145
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/qcommon/vm.c#L338-L355
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/qcommon/vm.c#L576-L627
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/qcommon/vm.c#L807-L850
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/client/cl_cgame.c#L736-L746
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/client/cl_cgame.c#L795-L797
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/game/ai_main.c#L563-L581
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/game/ai_main.c#L1459-L1483
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/game/ai_main.c#L1553-L1568
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/game/ai_main.c#L1666-L1677
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/botlib/be_ai_weap.c#L404-L433
- https://raw.githubusercontent.com/ioquake/ioq3/master/code/botlib/be_ai_gen.c#L90-L134
