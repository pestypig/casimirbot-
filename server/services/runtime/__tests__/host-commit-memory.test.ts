import { describe, expect, it } from "vitest";
import {
  parseLinuxCommitMemory,
  parseWindowsVirtualMemoryOutput,
} from "../host-commit-memory";

describe("host commit memory sampling", () => {
  it("normalizes Windows virtual-memory counters as commit headroom", () => {
    const snapshot = parseWindowsVirtualMemoryOutput(
      "FreeVirtualMemory=1839856\r\nTotalVirtualMemorySize=19535160\r\n",
      1234,
    );

    expect(snapshot).toMatchObject({
      status: "available",
      source: "windows_wmic",
      platform: "win32",
      sampledAtMs: 1234,
      freeMiB: 1796.7,
      limitMiB: 19077.3,
      ratio: 0.9058,
    });
  });

  it("normalizes Linux CommitLimit and Committed_AS counters", () => {
    const snapshot = parseLinuxCommitMemory(
      "MemTotal:       16384000 kB\nCommitLimit:    20000000 kB\nCommitted_AS:   17000000 kB\n",
      5678,
    );

    expect(snapshot).toMatchObject({
      status: "available",
      source: "linux_proc_meminfo",
      platform: "linux",
      sampledAtMs: 5678,
      freeMiB: 2929.7,
      limitMiB: 19531.3,
      ratio: 0.85,
    });
  });

  it("rejects incomplete samples instead of inventing commit headroom", () => {
    expect(parseWindowsVirtualMemoryOutput("FreeVirtualMemory=1000\n")).toBeNull();
    expect(parseLinuxCommitMemory("CommitLimit: 1000 kB\n")).toBeNull();
  });
});
