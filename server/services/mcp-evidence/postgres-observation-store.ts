import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../db/client";
import { HelixMcpEvidenceObservationStore } from "./observation-store";

export const createPostgresHelixMcpEvidenceObservationStore = () =>
  new HelixMcpEvidenceObservationStore({
    poolProvider: async () => {
      await ensureDatabase();
      return getPool();
    },
    persist: persistLocalDatabaseSnapshotIfEnabled,
  });
