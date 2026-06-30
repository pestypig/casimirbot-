import { HelixAskFinalAnswer } from "./HelixAskFinalAnswer";

export type HelixAskConsoleTurn = {
  id: string;
  finalAnswer: string;
  meta?: string | null;
};

export type HelixAskTurnListProps = {
  turns: HelixAskConsoleTurn[];
};

export function HelixAskTurnList({ turns }: HelixAskTurnListProps) {
  return (
    <div className="relative z-10 min-h-0 space-y-5 overflow-y-auto pr-2">
      {turns.map((turn) => (
        <article key={turn.id} data-testid="helix-ask-console-turn">
          <HelixAskFinalAnswer text={turn.finalAnswer} meta={turn.meta} />
        </article>
      ))}
    </div>
  );
}
