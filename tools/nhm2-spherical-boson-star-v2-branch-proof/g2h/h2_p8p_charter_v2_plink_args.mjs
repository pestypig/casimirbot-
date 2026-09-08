import { resolve } from 'node:path';
import { transferArgs } from './h2_p8p_charter_v2_transfer_args.mjs';
export const commandFile=resolve(import.meta.dirname,'h2_p8p_charter_v2_archive_read.txt');
export function plinkArgs(ip) {
  transferArgs({ip,destination:'C:/NHM2-CV2-R1/download-VALIDATE/r40.tgz'});
  return ['-ssh','-batch','-v','-T','-noagent','-noshare','-a','-x','-no-sanitise-stdout',
    '-i','C:/Users/dan/.ssh/google_compute_engine.ppk','-m',commandFile,`pestypig@${ip}`];
}
