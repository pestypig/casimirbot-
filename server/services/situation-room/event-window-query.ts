import type { HelixEventJournalQuery, HelixEventJournalQueryResult } from "@shared/helix-event-journal-query";
import type { HelixRoomSourceAdmission } from "@shared/helix-room-source-ingress";
import { queryEventJournal } from "./event-journal-store";

export function queryEventWindow(
  input: Partial<HelixEventJournalQuery> & {
    sourceAdmission?: HelixRoomSourceAdmission | null;
  },
): HelixEventJournalQueryResult {
  return queryEventJournal({
    ...input,
    include_raw_events: input.include_raw_events === true,
    limit: input.limit ?? 50,
  });
}
