export const HELIX_BOUND_AGENT_STEERING_REQUEST_EVENT =
  "helix:bound-agent-steering-request";
export const HELIX_BOUND_AGENT_STEERING_RESULT_EVENT =
  "helix:bound-agent-steering-result";

export type HelixBoundAgentSteeringRequest = Readonly<{
  requestId: string;
  instructionText: string;
  origin: "typed" | "gpt_live_finalized";
  source: "minecraft_play_activation";
}>;

export type HelixBoundAgentSteeringResult = Readonly<{
  requestId: string;
  deliveryState:
    | "queued"
    | "acknowledged"
    | "rejected"
    | "expired"
    | "superseded"
    | "revoked"
    | "unavailable";
}>;

export type HelixBoundAgentSteeringDispatch = (
  instructionText: string,
  origin: HelixBoundAgentSteeringRequest["origin"],
  requestId: string,
) => Promise<boolean>;

export const requestBoundAgentSteering = (
  request: HelixBoundAgentSteeringRequest,
): void => {
  window.dispatchEvent(
    new CustomEvent<HelixBoundAgentSteeringRequest>(
      HELIX_BOUND_AGENT_STEERING_REQUEST_EVENT,
      { detail: request },
    ),
  );
};

export const publishBoundAgentSteeringResult = (
  result: HelixBoundAgentSteeringResult,
): void => {
  window.dispatchEvent(
    new CustomEvent<HelixBoundAgentSteeringResult>(
      HELIX_BOUND_AGENT_STEERING_RESULT_EVENT,
      { detail: result },
    ),
  );
};

export const publishMinecraftPlaySteeringResult = (
  requestId: string,
  deliveryState: HelixBoundAgentSteeringResult["deliveryState"],
): boolean => {
  if (!requestId.startsWith("minecraft-play:")) return false;
  publishBoundAgentSteeringResult({ requestId, deliveryState });
  return true;
};

export const subscribeBoundAgentSteeringRequests = (
  dispatch: HelixBoundAgentSteeringDispatch,
): (() => void) => {
  const handleRequest = (event: Event): void => {
    const detail = (event as CustomEvent<HelixBoundAgentSteeringRequest>).detail;
    if (
      !detail ||
      detail.source !== "minecraft_play_activation" ||
      !detail.requestId?.trim() ||
      !detail.instructionText?.trim()
    ) return;
    void dispatch(
      detail.instructionText,
      detail.origin,
      detail.requestId,
    ).then((accepted) => {
      publishBoundAgentSteeringResult({
        requestId: detail.requestId,
        deliveryState: accepted ? "queued" : "rejected",
      });
    });
  };
  window.addEventListener(HELIX_BOUND_AGENT_STEERING_REQUEST_EVENT, handleRequest);
  return () => window.removeEventListener(
    HELIX_BOUND_AGENT_STEERING_REQUEST_EVENT,
    handleRequest,
  );
};
