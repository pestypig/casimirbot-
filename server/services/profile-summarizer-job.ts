import { listPersonas } from "../db/agi";
import { summarizeEssenceProfileFromChats } from "./profile-summarizer";
import { createOrUpdateProfilePanelProposal } from "./proposals/profile-panel-proposals";

const DEFAULT_INTERVAL_MIN = 60 * 24;

let timer: NodeJS.Timeout | null = null;

export function startProfileSummarizerJob(): void {
  if (process.env.ENABLE_PROFILE_SUMMARIZER !== "1") {
    return;
  }
  if (timer) {
    return;
  }
  const minutes = Math.max(15, Number(process.env.PROFILE_SUMMARIZER_MINUTES ?? DEFAULT_INTERVAL_MIN));
  const intervalMs = minutes * 60 * 1000;
  const run = async () => {
    try {
      const personas = await listPersonas();
      for (const persona of personas) {
        try {
          const { summary } = await summarizeEssenceProfileFromChats(persona.id, { persist: true });
          if (summary) {
            await createOrUpdateProfilePanelProposal(persona.id);
          }
        } catch (err) {
          console.warn(`[profile-summarizer] failed for ${persona.id}`, err);
        }
      }
    } catch (error) {
      console.warn("[profile-summarizer] persona scan failed", error);
    }
  };
  // kick off immediately then schedule
  void run();
  timer = setInterval(run, intervalMs);
}
