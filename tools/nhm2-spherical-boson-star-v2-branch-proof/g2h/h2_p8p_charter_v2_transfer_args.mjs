// Pure client argv. No gcloud SCP, OS Login, metadata helper, or shell.
export function transferArgs({ ip, destination }) {
  const octets = typeof ip === 'string' ? ip.split('.') : [];
  if (octets.length !== 4 || octets.some(x => !/^(0|[1-9][0-9]{0,2})$/.test(x) || Number(x) > 255)) throw new Error('invalid_bound_ip');
  if (!/^C:\/NHM2-CV2-R1\/download-[a-zA-Z0-9]+\/r40\.tgz$/.test(destination)) throw new Error('invalid_destination');
  return ['-batch', '-v', '-noagent', '-i', 'C:/Users/dan/.ssh/google_compute_engine.ppk',
    `pestypig@${ip}:/home/pestypig/nhm2-h2-p8p-r40-fixture-evidence-export-v1.tgz`, destination];
}
