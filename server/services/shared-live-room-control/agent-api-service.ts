import {
  FullHelixAskTurnExecutor,
  type HelixAgentConversationContextReader,
} from "../helix-agent-api/full-ask-turn-executor";
import {
  HelixAgentApiService,
  type HelixAgentApiServiceDependencies,
} from "../helix-agent-api/service";
import { createSharedLiveRoomConversationContextReader } from "./agent-conversation-context";
import { configuredSharedLiveRoomAgentDatabaseScopePolicies } from "./agent-database-scope-policy";

export type SharedLiveRoomAgentApiServiceDependencies =
  HelixAgentApiServiceDependencies & {
    readConversationContext?: HelixAgentConversationContextReader;
  };

const configuredScopeIdsFromEnvironment = (): ReadonlySet<string> =>
  new Set(
    (process.env.HELIX_AGENT_DATABASE_SCOPES ?? "")
      .split(",")
      .map((entry: string) => entry.trim())
      .filter(Boolean),
  );

/**
 * The application-level composition for the frozen durable-run service.
 * Room scope policy and optional chat context are injected into that one
 * service; this does not introduce another loop, run store, or terminal writer.
 */
export const createSharedLiveRoomAgentApiService = (
  dependencies: SharedLiveRoomAgentApiServiceDependencies = {},
): HelixAgentApiService => {
  const configuredScopeIds =
    dependencies.databaseScopeAllowlist ?? configuredScopeIdsFromEnvironment();
  return new HelixAgentApiService({
    ...dependencies,
    executor:
      dependencies.executor ??
      new FullHelixAskTurnExecutor({
        readConversationContext:
          dependencies.readConversationContext ??
          createSharedLiveRoomConversationContextReader(),
      }),
    databaseScopeAllowlist: configuredScopeIds,
    databaseScopePolicies:
      dependencies.databaseScopePolicies ??
      configuredSharedLiveRoomAgentDatabaseScopePolicies(configuredScopeIds),
  });
};

export const sharedLiveRoomAgentApiService =
  createSharedLiveRoomAgentApiService();
