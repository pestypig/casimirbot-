import { EventEmitter } from "node:events";
import type { ProposalSafetyStatus, ProposalStatus } from "@shared/proposals";

export type ProposalProgressEvent = {
  type: "proposal-progress";
  proposalId: string;
  jobId?: string | null;
  status: ProposalStatus;
  safetyStatus: ProposalSafetyStatus;
  safetyScore?: number;
  progress?: number;
  phase?: string;
};

export type ProposalChatEvent = {
  type: "proposal-chat";
  proposalId: string;
  jobId?: string | null;
  role: "builder" | "user";
  message: string;
  ts: string;
};

export type ProposalEvent = ProposalProgressEvent | ProposalChatEvent;

export type CodeLatticeUpdateStats = {
  filesTouched: number;
  addedNodes: number;
  updatedNodes: number;
  removedNodes: number;
  edgeDelta: number;
};

export type CodeLatticeUpdatedEvent = {
  type: "code-lattice:updated";
  version: number;
  stats: CodeLatticeUpdateStats;
};

export type EssenceEvent =
  | { type: "created"; essenceId: string }
  | { type: "updated"; essenceId: string }
  | { type: "remix-progress"; jobId: string; progress: number }
  | { type: "remix-complete"; jobId: string; essenceId: string }
  | ProposalEvent
  | CodeLatticeUpdatedEvent;

type Listener<T extends EssenceEvent["type"]> = (payload: Extract<EssenceEvent, { type: T }>) => void;

class EssenceHub {
  private emitter = new EventEmitter();

  emit<T extends EssenceEvent["type"]>(type: T, payload: Extract<EssenceEvent, { type: T }>): boolean {
    return this.emitter.emit(type, payload);
  }

  on<T extends EssenceEvent["type"]>(type: T, listener: Listener<T>): this {
    this.emitter.on(type, listener as (payload: EssenceEvent) => void);
    return this;
  }

  off<T extends EssenceEvent["type"]>(type: T, listener: Listener<T>): this {
    this.emitter.off(type, listener as (payload: EssenceEvent) => void);
    return this;
  }
}

export const essenceHub = new EssenceHub();
