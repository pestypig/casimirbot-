import { __testHelixAskReliabilityGuards } from './server/routes/agi.plan.ts';
const contract = __testHelixAskReliabilityGuards.buildHelixAskTurnContract({
  question: 'Explain how answer_path is populated and useful for diagnostics.',
  intentDomain: 'repo',
  requiresRepoEvidence: true,
  queryConstraints: __testHelixAskReliabilityGuards.deriveHelixAskQueryConstraints('Explain how answer_path is populated and useful for diagnostics.'),
  equationPrompt: false,
  definitionFocus: false,
  equationIntentContract: null,
  plannerMode: 'deterministic',
  plannerValid: true,
  plannerSource: 'debug',
});
console.log(JSON.stringify(contract, null, 2));
