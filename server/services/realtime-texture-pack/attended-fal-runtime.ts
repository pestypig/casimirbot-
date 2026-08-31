import type {
  RealtimeTexturePackProjectionFrameV1,
  RealtimeTexturePackTransformRequestV1,
} from "@shared/realtime-texture-pack";
import type {
  FalFlux2KleinRealtimeProvider,
  FalFlux2KleinRealtimeTrace,
} from "./fal-flux2-klein-realtime-provider";
import {
  attendedFalSessionStore,
  readAttendedFalReadinessFromRuntime,
} from "./attended-fal-session";

export type AttendedFalProviderFactory = (input: {
  profileId: string;
  sessionId: string;
  onTrace: (trace: FalFlux2KleinRealtimeTrace) => void;
}) => Promise<FalFlux2KleinRealtimeProvider> | FalFlux2KleinRealtimeProvider;

type ActiveProvider = {
  sessionId: string;
  provider: FalFlux2KleinRealtimeProvider;
};

/**
 * Server-only provider custody. The factory is deliberately absent until an
 * approved SDK bootstrap installs it; renderer/API callers cannot install one.
 */
export class AttendedFalRuntimeRegistry {
  private factory: AttendedFalProviderFactory | null = null;
  private readonly providers = new Map<string, ActiveProvider>();
  private readonly traces: FalFlux2KleinRealtimeTrace[] = [];

  installServerFactory(factory: AttendedFalProviderFactory): void {
    if (typeof factory !== "function") throw new Error("attended_fal_provider_factory_invalid");
    this.factory = factory;
  }

  sdkAvailable(): boolean {
    return this.factory !== null;
  }

  async transform(input: {
    profileId: string;
    sessionId: string;
    request: RealtimeTexturePackTransformRequestV1;
  }): Promise<RealtimeTexturePackProjectionFrameV1> {
    const active = await this.requireProvider(input.profileId, input.sessionId);
    return active.provider.transform(input.request);
  }

  async close(input: { profileId: string; sessionId?: string | null }): Promise<boolean> {
    const active = this.providers.get(input.profileId) ?? null;
    if (!active || (input.sessionId && active.sessionId !== input.sessionId)) return false;
    this.providers.delete(input.profileId);
    await active.provider.close();
    return true;
  }

  inspectTraceCount(): number {
    return this.traces.length;
  }

  async resetForTests(): Promise<void> {
    const active = [...this.providers.values()];
    this.providers.clear();
    await Promise.allSettled(active.map((entry) => entry.provider.close()));
    this.factory = null;
    this.traces.length = 0;
  }

  private async requireProvider(profileId: string, sessionId: string): Promise<ActiveProvider> {
    const existing = this.providers.get(profileId) ?? null;
    if (existing?.sessionId === sessionId) return existing;
    if (existing) {
      this.providers.delete(profileId);
      await existing.provider.close();
    }
    if (!this.factory) throw new Error("provider_sdk_not_available");
    const provider = await this.factory({
      profileId,
      sessionId,
      onTrace: (trace) => {
        this.traces.push(trace);
        if (this.traces.length > 128) this.traces.splice(0, this.traces.length - 128);
      },
    });
    const active = { sessionId, provider };
    this.providers.set(profileId, active);
    return active;
  }
}

export const attendedFalRuntimeRegistry = new AttendedFalRuntimeRegistry();

export const inspectAttendedFalControlProjection = (profileId: string) => ({
  readiness: readAttendedFalReadinessFromRuntime({
    sdkAvailable: attendedFalRuntimeRegistry.sdkAvailable(),
  }),
  session: attendedFalSessionStore.inspect(profileId),
  provider_selection_authority: "developer_ui_only" as const,
  billing_arm_authority: "developer_ui_only" as const,
  agent_billing_authority: false as const,
  credential_included: false as const,
  prompt_included: false as const,
  pixels_included: false as const,
  assistant_answer: false as const,
  terminal_eligible: false as const,
  raw_content_included: false as const,
});
