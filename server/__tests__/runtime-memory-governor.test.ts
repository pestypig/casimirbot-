import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  runtimeMemoryGovernor,
  type RuntimeHostMemoryReader,
  type RuntimeMemoryReader,
} from "../services/runtime/runtime-memory-governor";

const mib = 1024 * 1024;

const memoryReader = (values: Partial<NodeJS.MemoryUsage>): RuntimeMemoryReader => () => ({
  rss: values.rss ?? 200 * mib,
  heapTotal: values.heapTotal ?? 120 * mib,
  heapUsed: values.heapUsed ?? 100 * mib,
  external: values.external ?? 10 * mib,
  arrayBuffers: values.arrayBuffers ?? 2 * mib,
});

const hostReader = (freeRatio = 0.5): RuntimeHostMemoryReader => () => ({
  freeMiB: 8000 * freeRatio,
  totalMiB: 8000,
  freeRatio,
});

describe("runtime memory governor", () => {
  beforeEach(() => {
    delete process.env.RUNTIME_MEMORY_GUARD;
    delete process.env.RUNTIME_MEMORY_MAX_HEAP_USED_MB;
    delete process.env.RUNTIME_MEMORY_MAX_RSS_MB;
    delete process.env.RUNTIME_MEMORY_RESUME_HEAP_USED_MB;
    delete process.env.RUNTIME_MEMORY_RESUME_RSS_MB;
    delete process.env.RUNTIME_MEMORY_HOST_FREE_RATIO_MIN;
    delete process.env.VOICE_TRANSCRIBE_MEMORY_GUARD;
    delete process.env.VOICE_TRANSCRIBE_MAX_HEAP_USED_MB;
    delete process.env.VOICE_TRANSCRIBE_MAX_RSS_MB;
    delete process.env.RUNTIME_TASK_VOICE_STT_BURST_LIMIT;
    delete process.env.RUNTIME_TASK_VOICE_STT_BURST_WINDOW_MS;
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: memoryReader({ heapUsed: 100 * mib, rss: 200 * mib }),
      hostMemoryReader: hostReader(),
    });
  });

  afterEach(() => {
    delete process.env.RUNTIME_MEMORY_GUARD;
    delete process.env.RUNTIME_MEMORY_MAX_HEAP_USED_MB;
    delete process.env.RUNTIME_MEMORY_MAX_RSS_MB;
    delete process.env.RUNTIME_MEMORY_RESUME_HEAP_USED_MB;
    delete process.env.RUNTIME_MEMORY_RESUME_RSS_MB;
    delete process.env.RUNTIME_MEMORY_HOST_FREE_RATIO_MIN;
    delete process.env.VOICE_TRANSCRIBE_MEMORY_GUARD;
    delete process.env.VOICE_TRANSCRIBE_MAX_HEAP_USED_MB;
    delete process.env.VOICE_TRANSCRIBE_MAX_RSS_MB;
    delete process.env.RUNTIME_TASK_VOICE_STT_BURST_LIMIT;
    delete process.env.RUNTIME_TASK_VOICE_STT_BURST_WINDOW_MS;
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests();
  });

  it("admits voice_stt below heap and rss thresholds", () => {
    const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(decision.admitted).toBe(true);
    expect(decision.action).toBe("admit");
    expect(decision.reason).toBe("ok");
    expect(decision.lease).toBeTruthy();
  });

  it("rejects voice_stt above heap threshold", () => {
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: memoryReader({ heapUsed: 600 * mib, rss: 700 * mib }),
      hostMemoryReader: hostReader(),
    });

    const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(decision.admitted).toBe(false);
    expect(decision.action).toBe("reject_memory_pressure");
    expect(decision.reason).toBe("heap_used_limit");
  });

  it("rejects voice_stt above rss threshold", () => {
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: memoryReader({ heapUsed: 300 * mib, rss: 1000 * mib }),
      hostMemoryReader: hostReader(),
    });

    const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(decision.admitted).toBe(false);
    expect(decision.reason).toBe("rss_limit");
  });

  it("uses higher default voice STT headroom in development", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "development";
      runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
        memoryReader: memoryReader({ heapUsed: 1900 * mib, rss: 2400 * mib }),
        hostMemoryReader: hostReader(),
      });

      const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

      expect(decision.admitted).toBe(true);
      expect(decision.limits.maxHeapUsedMiB).toBe(2048);
      expect(decision.limits.maxRssMiB).toBe(3200);
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });

  it("still rejects development voice STT when local runtime headroom is exhausted", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "development";
      runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
        memoryReader: memoryReader({ heapUsed: 2100 * mib, rss: 3300 * mib }),
        hostMemoryReader: hostReader(),
      });

      const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

      expect(decision.admitted).toBe(false);
      expect(decision.reason).toBe("heap_used_limit");
      expect(decision.limits.maxHeapUsedMiB).toBe(2048);
      expect(decision.limits.maxRssMiB).toBe(3200);
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });

  it("keeps explicit voice STT env limits authoritative in development", () => {
    const previousNodeEnv = process.env.NODE_ENV;
    try {
      process.env.NODE_ENV = "development";
      process.env.VOICE_TRANSCRIBE_MAX_HEAP_USED_MB = "480";
      process.env.VOICE_TRANSCRIBE_MAX_RSS_MB = "900";
      runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
        memoryReader: memoryReader({ heapUsed: 600 * mib, rss: 700 * mib }),
        hostMemoryReader: hostReader(),
      });

      const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

      expect(decision.admitted).toBe(false);
      expect(decision.reason).toBe("heap_used_limit");
      expect(decision.limits.maxHeapUsedMiB).toBe(480);
      expect(decision.limits.maxRssMiB).toBe(900);
    } finally {
      if (previousNodeEnv === undefined) {
        delete process.env.NODE_ENV;
      } else {
        process.env.NODE_ENV = previousNodeEnv;
      }
    }
  });

  it("allows guard disabled mode", () => {
    process.env.VOICE_TRANSCRIBE_MEMORY_GUARD = "0";
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: memoryReader({ heapUsed: 900 * mib, rss: 1200 * mib }),
      hostMemoryReader: hostReader(),
    });

    const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(decision.admitted).toBe(true);
    expect(decision.reason).toBe("guard_disabled");
  });

  it("pauses lower priority work under soft pressure", () => {
    let paused = false;
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: memoryReader({ heapUsed: 430 * mib, rss: 760 * mib }),
      hostMemoryReader: hostReader(),
    });
    runtimeMemoryGovernor.registerPausableRuntimeTask({
      id: "stage-play-1",
      taskClass: "stage_play_refresh",
      priority: 35,
      isPaused: () => paused,
      pause: () => {
        paused = true;
      },
      resume: () => {
        paused = false;
      },
    });

    const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(decision.admitted).toBe(true);
    expect(decision.action).toBe("pause_existing_background");
    expect(decision.reason).toBe("background_paused");
    expect(decision.pausedTaskCount).toBe(1);
  });

  it("resumes paused tasks below resume thresholds", async () => {
    let paused = false;
    let currentHeap = 430 * mib;
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: () => memoryReader({ heapUsed: currentHeap, rss: 760 * mib })(),
      hostMemoryReader: hostReader(),
    });
    runtimeMemoryGovernor.registerPausableRuntimeTask({
      id: "repo-index-1",
      taskClass: "repo_indexing",
      priority: 20,
      isPaused: () => paused,
      pause: () => {
        paused = true;
      },
      resume: () => {
        paused = false;
      },
    });
    runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });
    expect(paused).toBe(true);

    currentHeap = 200 * mib;
    const resumed = await runtimeMemoryGovernor.maybeResumePausedTasks();

    expect(resumed).toBe(1);
    expect(paused).toBe(false);
  });

  it("lease release decrements active task count", () => {
    const admitted = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });
    expect(runtimeMemoryGovernor.getRuntimeMemorySnapshot().activeTasks).toHaveLength(1);

    admitted.lease?.release("completed");

    expect(runtimeMemoryGovernor.getRuntimeMemorySnapshot().activeTasks).toHaveLength(0);
  });

  it("rejects a second concurrent voice STT task before allocating another burst", () => {
    const first = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });
    expect(first.admitted).toBe(true);

    const second = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(second.admitted).toBe(false);
    expect(second.action).toBe("reject_runtime_capacity");
    expect(second.reason).toBe("concurrency_limit");
    expect(runtimeMemoryGovernor.getRuntimeTaskSnapshot().classes.find((entry) => entry.taskClass === "voice_stt")).toMatchObject({
      activeCount: 1,
      maxConcurrent: 1,
    });
    first.lease?.release("completed");
  });

  it("applies per-class burst budgets from env", () => {
    process.env.RUNTIME_TASK_VOICE_STT_BURST_LIMIT = "2";
    process.env.RUNTIME_TASK_VOICE_STT_BURST_WINDOW_MS = "60000";

    const first = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });
    expect(first.admitted).toBe(true);
    first.lease?.release("completed");
    const second = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });
    expect(second.admitted).toBe(true);
    second.lease?.release("completed");

    const third = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });

    expect(third.admitted).toBe(false);
    expect(third.action).toBe("reject_runtime_capacity");
    expect(third.reason).toBe("burst_limit");
  });

  it("queues deferrable tasks when their concurrency lane is occupied", () => {
    const first = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "stage_play_refresh" });
    expect(first.admitted).toBe(true);

    const second = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "stage_play_refresh" });

    expect(second.admitted).toBe(false);
    expect(second.action).toBe("queue");
    expect(second.reason).toBe("concurrency_limit");
    first.lease?.release("completed");
  });

  it("reports registered pausable tasks and recent completions in the task snapshot", () => {
    let paused = false;
    runtimeMemoryGovernor.registerPausableRuntimeTask({
      id: "stage-play-service",
      taskClass: "stage_play_refresh",
      priority: 35,
      isPaused: () => paused,
      pause: () => {
        paused = true;
      },
      resume: () => {
        paused = false;
      },
    });
    const admitted = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "voice_stt" });
    admitted.lease?.release("completed");

    const snapshot = runtimeMemoryGovernor.getRuntimeTaskSnapshot();

    expect(snapshot.registeredPausableTasks).toContainEqual({
      id: "stage-play-service",
      taskClass: "stage_play_refresh",
      priority: 35,
      paused: false,
    });
    expect(snapshot.recentCompletions.at(-1)).toMatchObject({
      taskClass: "voice_stt",
      outcome: "completed",
    });
  });

  it("critical_resident bypasses memory pressure", () => {
    runtimeMemoryGovernor.resetRuntimeMemoryGovernorForTests({
      memoryReader: memoryReader({ heapUsed: 900 * mib, rss: 1200 * mib }),
      hostMemoryReader: hostReader(),
    });

    const decision = runtimeMemoryGovernor.admitRuntimeTask({ taskClass: "critical_resident" });

    expect(decision.admitted).toBe(true);
    expect(decision.reason).toBe("critical_bypass");
  });
});
