import type { HelixReasoningTaskBindingStore } from "./reasoning-task-binding-store";

type AwaitableMethod<F> = F extends (...args: infer A) => infer R
  ? (...args: A) => R | Promise<R> : never;

/** Session orchestration must await these checks: durable authority may require
 * fresh encrypted storage access even when legacy bindings are synchronous. */
export type ReasoningTaskAssociationVerifier = {
  verifyTaskAssociation: AwaitableMethod<HelixReasoningTaskBindingStore["verifyTaskAssociation"]>;
};
export type ReasoningPreparationTargetStore = ReasoningTaskAssociationVerifier & {
  resolveOwnedPreparationTarget: AwaitableMethod<HelixReasoningTaskBindingStore["resolveOwnedPreparationTarget"]>;
};
