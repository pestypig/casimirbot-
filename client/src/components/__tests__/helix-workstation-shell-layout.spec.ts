import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

describe("HelixWorkstationShell layout contract", () => {
  it("anchors the desktop workstation grid to the viewport", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/workstation/HelixWorkstationShell.tsx"),
      "utf8",
    );

    expect(source).toContain('className="fixed inset-0 z-10 grid min-h-0 w-full"');
    expect(source).not.toContain('className="relative z-10 grid h-full min-h-0 w-full"');
  });
});
