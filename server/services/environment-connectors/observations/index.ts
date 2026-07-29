/**
 * Observation persistence is implemented by the durable probe broker. This
 * compatibility entrypoint gives later observe/probe consumers a neutral
 * namespace without moving the stable broker during the first vertical slice.
 */
export {
  readDurableEnvironmentProbeObservation,
} from "../probe";

