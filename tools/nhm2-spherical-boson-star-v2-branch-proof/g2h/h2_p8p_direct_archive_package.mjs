// Local direct-archive startup packaging only; never executes or uploads.
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const names=['h2_p8p_hostkey_guest.py','h2_p8p_hostkey_guest_linux.py','h2_p8p_hostkey_guest_main.py',
 'h2_p8p_direct_archive.py','h2_p8p_direct_archive_linux.py','h2_p8p_cloud_linux_fixture.py','h2_p8p_fixture_transport.py','h2_p8p_direct_archive_main.py'];
const sha=b=>createHash('sha256').update(b).digest('hex');
export function directArchivePackage({revision='original'}={}){
 if(!['original','retained-helper-v1','retained-helper-v2'].includes(revision))throw Error('package_revision');
 const files=names.map(name=>{const bytes=readFileSync(resolve(import.meta.dirname,name));
  if(bytes.length>32768)throw Error('source_cap');
  return {name,bytes:bytes.length,sha256:sha(bytes),base64:bytes.toString('base64')};});
 const manifest=files.map(({name,bytes,sha256})=>({name,bytes,sha256}));
 const attemptId=sha(revision==='original'?JSON.stringify(manifest):JSON.stringify({revision,manifest}));
 const encoded=Buffer.from(JSON.stringify(files)).toString('base64');
 const bootstrap=`import base64,hashlib,json,os\nfiles=json.loads(base64.b64decode('${encoded}',validate=True))\nexpected=${JSON.stringify(names)}\nif [f['name'] for f in files]!=expected: raise ValueError('inventory')\nverified=[]\nfor f in files:\n b=base64.b64decode(f['base64'],validate=True)\n if len(b)!=f['bytes'] or hashlib.sha256(b).hexdigest()!=f['sha256']: raise ValueError('source_hash')\n verified.append((f['name'],b))\nroot='/var/lib/nhm2-direct-archive-v1'\nos.mkdir(root,0o700)\nfor name,b in verified:\n with open(root+'/'+name,'xb') as out: out.write(b)\nos.execv('/usr/bin/python3',['/usr/bin/python3','-B',root+'/h2_p8p_direct_archive_main.py','${attemptId}','/dev/disk/by-id/google-nhm2-p8p-cv2-hostkey-clone'])\n`;
 const startup=`#!/bin/bash\nset -euo pipefail\numask 077\nexec /usr/bin/timeout --signal=TERM --kill-after=60s 900s /usr/bin/python3 -B - <<'NHM2_DIRECT_BOOTSTRAP'\n${bootstrap}NHM2_DIRECT_BOOTSTRAP\n`;
 if(Buffer.byteLength(startup)>200000)throw Error('startup_cap');
 if(revision==='original')return {startup,bootstrap,manifest,attemptId,startupSha256:sha(startup)};
 const oldRoot="root='/var/lib/nhm2-direct-archive-v1'";
 if(bootstrap.split(oldRoot).length!==2)throw Error('exclusive_root_binding');
 const successorBootstrap=bootstrap.replace(oldRoot,`os.environ['NHM2_RECOVERY_REVISION']='${revision}'\nroot='/var/lib/nhm2-direct-archive-${revision}'`);
 const successorStartup=startup.replace(bootstrap,successorBootstrap);
 return {startup:successorStartup,bootstrap:successorBootstrap,manifest,attemptId,startupSha256:sha(successorStartup)};
}
