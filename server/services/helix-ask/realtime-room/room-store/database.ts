import type { PoolClient } from "pg";
import { ensureDatabase, getPool } from "../../../../db/client";
import type { Queryable } from "./types";

export const readSharedRealtimeRoomDatabase = async (): Promise<Queryable> => {
  await ensureDatabase();
  return getPool();
};

export const withSharedRealtimeRoomTransaction = async <T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  await ensureDatabase();
  const client = await getPool().connect();
  try {
    await client.query("BEGIN");
    const result = await run(client);
    await client.query("COMMIT");
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
};
