import React from "react";

import {
  HelixAskConsoleRuntimeLayout,
  type HelixAskConsoleRuntimeLayoutProps,
} from "./HelixAskConsoleRuntimeLayout";

export type HelixAskLegacyConsoleViewProps = HelixAskConsoleRuntimeLayoutProps;

export function HelixAskLegacyConsoleView(props: HelixAskLegacyConsoleViewProps) {
  return <HelixAskConsoleRuntimeLayout {...props} />;
}
