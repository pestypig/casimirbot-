export {
  materializeLegacyRoomSourceConnector,
  type MaterializedEnvironmentConnectorBinding,
} from "./legacy-source-bridge";
export { listActiveEnvironmentConnectorBindings } from "./active-binding-store";

export const environmentConnectorBindingTable =
  "helix_environment_connector_bindings" as const;
