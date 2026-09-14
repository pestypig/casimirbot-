const fs = require('node:fs');
const file = 'client/src/components/agent-access/DurableTaskPairing.tsx';
let source = fs.readFileSync(file).toString('latin1');
const newline = source.includes('\r\n') ? '\r\n' : '\n';
function replaceOnce(before, after) {
  if (source.split(before).length !== 2) throw new Error('Expected one exact edit target');
  source = source.replace(before, after.replaceAll('\n', newline));
}
replaceOnce('  const storageKey = `helix.pairing.review.v1:${JSON.stringify([profileId, chatId])}`;',
  '  const storageKey = `helix.pairing.review.v1:${JSON.stringify([profileId, chatId])}`;\n' +
  '  // Owner/chat-scoped display only; invitation issuance revalidates the run.\n' +
  '  const [lastOfferedEnvironment, setLastOfferedEnvironment] = useState(environment ?? null);\n' +
  '  useEffect(() => {\n' +
  '    if (environment) setLastOfferedEnvironment(environment);\n' +
  '  }, [environment?.roomId, environment?.runId]);');
replaceOnce('  const runChoice = review.environment ?? environment;',
  '  const runChoice = review.environment ?? environment ?? lastOfferedEnvironment;');
replaceOnce('    {(automaticAvailable || review.invitationDelivery === "automatic") && <label className="block">Invitation delivery',
  '    {runChoice && !environment && <p>Last verified run; availability is checked again when you approve. Keeping this choice does not grant permission.</p>}\n' +
  '    {(automaticAvailable || review.invitationDelivery === "automatic") && <label className="block">Invitation delivery');
fs.writeFileSync(file, Buffer.from(source, 'latin1'));
console.log('Applied three exact ASCII edits; preserved all unrelated file bytes.');
