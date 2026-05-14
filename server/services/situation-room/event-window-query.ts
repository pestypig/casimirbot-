import type { HelixEventJournalQuery, HelixEventJournalQueryResult } from "@shared/helix-event-journal-query";
import { queryEventJournal } from "./event-journal-store";

export function queryEventWindow(input: Partial<HelixEventJournalQuery>): HelixEventJournalQueryResult {
  return queryEventJournal({
    ...input,
    include_raw_events: input.include_raw_events === true,
    limit: input.limit ?? 50,
  });
}
