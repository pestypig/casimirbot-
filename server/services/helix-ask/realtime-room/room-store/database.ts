import type { PoolClient } from "pg";
import {
  ensureDatabase,
  getPool,
  persistLocalDatabaseSnapshotIfEnabled,
} from "../../../../db/client";
import type { Queryable } from "./types";

const mutationTableFromTransactionQuery = (
  input: unknown,
): string | null | undefined => {
  const text =
    typeof input === "string"
      ? input
      : input &&
          typeof input === "object" &&
          "text" in input &&
          typeof input.text === "string"
        ? input.text
        : "";
  const mutation =
    /^\s*(insert|update|delete|truncate)\b/i.test(text) ||
    (/^\s*with\b/i.test(text) &&
      /\b(insert\s+into|update|delete\s+from|truncate(?:\s+table)?)\b/i.test(
        text,
      ));
  if (!mutation) {
    return undefined;
  }
  return (
    /\b(?:insert\s+into|update|delete\s+from|truncate(?:\s+table)?)\s+(?:["\w]+\.)?["]?([\w]+)["]?/i.exec(
      text,
    )?.[1]?.toLowerCase() ?? null
  );
};

export const readSharedRealtimeRoomDatabase = async (): Promise<Queryable> => {
  await ensureDatabase();
  return getPool();
};

export const withSharedRealtimeRoomTransaction = async <T>(
  run: (client: PoolClient) => Promise<T>,
): Promise<T> => {
  await ensureDatabase();
  const client = await getPool().connect();
  const touchedTables = new Set<string>();
  let mutationTableUnknown = false;
  const transactionClient = new Proxy(client, {
    get(target, property, receiver) {
      if (property !== "query") {
        return Reflect.get(target, property, receiver);
      }
      return (...args: unknown[]) => {
        const table = mutationTableFromTransactionQuery(args[0]);
        if (table === null) mutationTableUnknown = true;
        else if (table) touchedTables.add(table);
        return target.query(...(args as Parameters<PoolClient["query"]>));
      };
    },
  }) as PoolClient;
  try {
    await client.query("BEGIN");
    const result = await run(transactionClient);
    await client.query("COMMIT");
    await persistLocalDatabaseSnapshotIfEnabled(
      mutationTableUnknown ? undefined : [...touchedTables],
    );
    return result;
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
};
