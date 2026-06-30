import { HelixAskLegacyRuntimeBridge } from "./HelixAskLegacyRuntimeBridge";
import type { HelixAskConsoleProps } from "./HelixAskConsoleState";

export function HelixAskConsole(props: HelixAskConsoleProps) {
  return <HelixAskLegacyRuntimeBridge {...props} />;
}
