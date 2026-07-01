import { HelixAskLegacyRuntimeBridge } from "./HelixAskLegacyRuntimeBridge";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";
import { buildHelixAskConsoleRuntimeBridgeProps } from "./HelixAskConsoleRuntimeShellProps";

export function HelixAskConsoleRuntimeShell(props: HelixAskConsoleProps) {
  return <HelixAskLegacyRuntimeBridge {...buildHelixAskConsoleRuntimeBridgeProps(props)} />;
}
