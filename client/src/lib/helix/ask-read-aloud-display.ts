export type MicArmState = "off" | "on";

export type ReadAloudPlaybackState = "idle" | "requesting" | "playing" | "dry-run" | "error";

export function resolveInitialMicArmState(persisted: string | null | undefined): MicArmState {
  return persisted === "off" ? "off" : "on";
}

export function transitionReadAloudState(
  current: ReadAloudPlaybackState,
  event: "request" | "audio" | "dry-run" | "error" | "stop" | "ended",
): ReadAloudPlaybackState {
  if (event === "request") return "requesting";
  if (event === "audio") return "playing";
  if (event === "dry-run") return "dry-run";
  if (event === "error") return "error";
  if (event === "stop" || event === "ended") return "idle";
  return current;
}

export function shouldStopReadAloudOnButtonPress(state: ReadAloudPlaybackState): boolean {
  return state === "requesting" || state === "playing";
}

export function formatReadAloudButtonLabel(state: ReadAloudPlaybackState): string {
  if (shouldStopReadAloudOnButtonPress(state)) return `Stop reading (${state})`;
  if (state === "dry-run") return "Read aloud (dry-run)";
  if (state === "error") return "Read aloud (error)";
  return "Read aloud";
}
