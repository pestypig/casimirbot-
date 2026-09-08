// Read-only local package construction. Does not write, upload or execute.
import {readFileSync,lstatSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash} from 'node:crypto';
const sha=b=>createHash('sha256').update(b).digest('hex');
export const sourceNames=Object.freeze([
 'h2_p8p_hostkey_guest.py','h2_p8p_hostkey_guest_linux.py',
 ...['accept','boot','collect','containment','diagnostic','entry','export','guarded_entry',
 'guest','journal','native','publish','receiver','segments','serial','session','startup',
 'supervisor','transport','worker'].map(n=>`h2_p8p_discovery_${n}.py`),
 'h2_p8p_discovery_boot.sh']);

export function discoveryPackage(){
 const files=sourceNames.map(name=>{
  const path=resolve(import.meta.dirname,name),s=lstatSync(path);
  if(!s.isFile()||s.isSymbolicLink()||s.size>32768)throw Error('package_source');
  const b=readFileSync(path);
  if(b.length!==s.size)throw Error('package_source_changed');
  return {name,bytes:b.length,sha256:sha(b),base64:b.toString('base64')};
 });
 if(files.reduce((n,f)=>n+f.bytes,0)>131072)throw Error('package_total');
 const manifest=files.map(({name,bytes,sha256})=>({name,bytes,sha256}));
 const attemptId=sha(JSON.stringify({revision:'discovery-v1',manifest}));
 const encoded=Buffer.from(JSON.stringify(files)).toString('base64');
 const bootstrap=`import base64,hashlib,json,os\nfiles=json.loads(base64.b64decode('${encoded}',validate=True))\nexpected=${JSON.stringify(sourceNames)}\nif [f['name'] for f in files]!=expected: raise ValueError('inventory')\nverified=[]\nfor f in files:\n b=base64.b64decode(f['base64'],validate=True)\n if len(b)!=f['bytes'] or hashlib.sha256(b).hexdigest()!=f['sha256']: raise ValueError('source_hash')\n verified.append((f['name'],b))\nroot='/var/lib/nhm2-discovery-${attemptId}'\nos.mkdir(root,0o700)\nfor name,b in verified:\n with open(root+'/'+name,'xb') as out:\n  if out.write(b)!=len(b): raise OSError('short_write')\n  out.flush()\n  os.fsync(out.fileno())\nfor path in (root,'/var/lib'):\n fd=os.open(path,os.O_RDONLY|os.O_DIRECTORY|os.O_NOFOLLOW)\n try: os.fsync(fd)\n finally: os.close(fd)\nos.execve('/bin/bash',['/bin/bash',root+'/h2_p8p_discovery_boot.sh','${attemptId}'],{'PATH':'/usr/sbin:/usr/bin:/sbin:/bin','LANG':'C.UTF-8','PYTHONNOUSERSITE':'1'})\n`;
 const startup=`#!/bin/bash\nset -u\numask 077\nshutdown_helper() { /usr/bin/timeout --signal=TERM --kill-after=2s 8s /usr/bin/systemctl poweroff --no-block; }\ntrap shutdown_helper EXIT\n/usr/bin/timeout --signal=TERM --kill-after=10s 360s /usr/bin/python3 -B -s - <<'NHM2_DISCOVERY_BOOTSTRAP'\n${bootstrap}NHM2_DISCOVERY_BOOTSTRAP\nstatus=$?\nexit "$status"\n`;
 if(Buffer.byteLength(startup)>200000)throw Error('package_startup_cap');
 return {attemptId,manifest,bootstrap,startup,startupBytes:Buffer.byteLength(startup),startupSha256:sha(startup)};
}
