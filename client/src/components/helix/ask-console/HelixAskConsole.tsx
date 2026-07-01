import { HelixAskConsoleRuntimeShell } from "./HelixAskConsoleRuntimeShell";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";

export function HelixAskConsole(props: HelixAskConsoleProps) {
  return <HelixAskConsoleRuntimeShell {...props} />;
}
