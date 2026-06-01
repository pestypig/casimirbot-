import { buildZenGraphLaunchReflectionArtifacts } from "@/lib/zen-graph/fruitionLaunchArtifact";
import ZenGraphPanel from "./ZenGraphPanel";

const { reflection, admission } = buildZenGraphLaunchReflectionArtifacts();

export default function ZenGraphLaunchPanel() {
  return <ZenGraphPanel reflection={reflection} admission={admission} />;
}
