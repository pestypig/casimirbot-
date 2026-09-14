import { appendFileSync, existsSync, statSync, writeFileSync } from 'node:fs';

export type OAuthDiagnosticEvent =
  | 'received' | 'step_up_handled' | 'rejected' | 'completion_published' | 'transport_failed'
  | 'process_entry' | 'second_instance' | 'callback_unrecognized';

const events = new Set<OAuthDiagnosticEvent>([
  'received', 'step_up_handled', 'rejected', 'completion_published', 'transport_failed',
  'process_entry', 'second_instance', 'callback_unrecognized',
]);

export function appendOAuthDiagnostic(filePath: string, event: OAuthDiagnosticEvent): void {
  if (!events.has(event)) return;
  try {
    // Independent of noisy service output. Only fixed events enter this journal.
    if (existsSync(filePath) && statSync(filePath).size >= 64 * 1024) {
      writeFileSync(filePath, '', { mode: 0o600 });
    }
    appendFileSync(filePath, `${new Date().toISOString()} ${event}\n`, { mode: 0o600 });
  } catch {
    // Diagnostic I/O cannot interrupt authorization handling.
  }
}
