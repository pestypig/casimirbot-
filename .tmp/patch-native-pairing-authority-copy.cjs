const fs = require('node:fs');
const path = 'client/src/components/agent-access/DurableTaskPairing.tsx';
const before = fs.readFileSync(path);
const source = before.toString('latin1');
const needle = '          : error instanceof Error && error.message === "pairing_environment_unavailable"';
const replacement = [
  '          : error instanceof Error && error.message === "pairing_account_link_required"',
  '            ? "The account link for this exact task could not be verified. Keep this request while account and delegation status is checked, then reconcile it."',
  '          : error instanceof Error && error.message === "pairing_device_identity_mismatch"',
  '            ? "This request does not match the installed device. Keep it until the device and task identity are checked, or cancel it to review again."',
  '          : error instanceof Error && error.message === "pairing_device_trust_required"',
  '            ? "Device trust is not current. Review device trust in Agent Access, then reconcile this same request."',
  needle,
].join(source.includes('\r\n') ? '\r\n' : '\n');
if (source.split(needle).length !== 2) throw new Error('Expected one exact authority-copy insertion point');
fs.writeFileSync(path, Buffer.from(source.replace(needle, replacement), 'latin1'));
process.stdout.write('Updated fixed authority diagnostics; original file bytes preserved outside insertion.\n');
