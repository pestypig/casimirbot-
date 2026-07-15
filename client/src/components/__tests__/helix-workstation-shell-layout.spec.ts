import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { resolveMobileSurfaceSwipe } from "@/components/workstation/HelixWorkstationShell";

describe("HelixWorkstationShell layout contract", () => {
  it("anchors the desktop workstation grid to the viewport", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/workstation/HelixWorkstationShell.tsx"),
      "utf8",
    );

    expect(source).toContain('className="fixed inset-0 z-10 grid min-h-0 w-full"');
    expect(source).not.toContain('className="relative z-10 grid h-full min-h-0 w-full"');
  });

  it("waits for persisted chat hydration before creating a fallback Ask session", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/workstation/HelixWorkstationShell.tsx"),
      "utf8",
    );

    expect(source).toContain("const chatStoreHydrated = useAgiChatStore((state) => state.hydrated)");
    expect(source).toContain("if (!chatStoreHydrated) return;");
    expect(source).toContain("ensureContextSession(HELIX_ASK_CONTEXT_ID.desktop");
  });

  it("switches mobile surfaces only for intentional horizontal swipes", () => {
    expect(resolveMobileSurfaceSwipe({ surface: "ask", deltaX: 80, deltaY: 10 })).toBe("workstation");
    expect(resolveMobileSurfaceSwipe({ surface: "workstation", deltaX: -80, deltaY: 10 })).toBe("ask");
    expect(resolveMobileSurfaceSwipe({ surface: "ask", deltaX: -80, deltaY: 10 })).toBeNull();
    expect(resolveMobileSurfaceSwipe({ surface: "ask", deltaX: 40, deltaY: 5 })).toBeNull();
    expect(resolveMobileSurfaceSwipe({ surface: "ask", deltaX: 80, deltaY: 70 })).toBeNull();
  });

  it("renders the shared session header and chat switcher inside the mobile workstation", () => {
    const source = fs.readFileSync(
      path.resolve(process.cwd(), "client/src/components/workstation/HelixWorkstationShell.tsx"),
      "utf8",
    );

    expect(source).toContain("const sessionHeaderContent = (");
    expect(source).toContain("const sessionSwitcher = sessionListOpen ? (");
    expect(source).toContain('data-mobile-workstation-session-shell="true"');
    expect(source).toContain('<WorkstationStage layoutVariant="mobile" />');
    expect(source.match(/\{sessionHeaderContent\}/g)).toHaveLength(2);
    expect(source.match(/\{sessionSwitcher\}/g)).toHaveLength(2);
  });
});
