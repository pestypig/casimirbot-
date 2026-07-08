import { HelixAskConsoleRuntimeShell } from "./HelixAskConsoleRuntimeShell";
import { HelixAskOperatorSurfaceParityHarness } from "./HelixAskOperatorSurfaceParityHarness";
import { shouldRenderHelixAskOperatorSurfaceParityHarness } from "./HelixAskOperatorSurfaceParityRoute";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";

export function HelixAskConsole(props: HelixAskConsoleProps) {
  const search = typeof window === "undefined" ? "" : window.location.search;
  if (shouldRenderHelixAskOperatorSurfaceParityHarness(search)) {
    return <HelixAskOperatorSurfaceParityHarness {...props} />;
  }
  return <HelixAskConsoleRuntimeShell {...props} />;
}
