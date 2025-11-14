import type { PoolClient } from "pg";

export interface MigrationContext {
  enablePgvector: boolean;
}

export interface Migration {
  id: string;
  description: string;
  run: (client: PoolClient, ctx: MigrationContext) => Promise<void>;
}
