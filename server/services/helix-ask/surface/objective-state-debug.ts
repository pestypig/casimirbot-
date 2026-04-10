type MutableDebugPayload = Record<string, unknown>;

export const applyObjectiveStateDebugPayload = (args: {
  debugPayload: MutableDebugPayload;
  objectiveLoopState: unknown[];
  objectiveTransitionLog: unknown[];
}): void => {
  args.debugPayload.objective_loop_state = args.objectiveLoopState.slice(0, 16);
  args.debugPayload.objective_transition_log = args.objectiveTransitionLog.slice(-64);
};
