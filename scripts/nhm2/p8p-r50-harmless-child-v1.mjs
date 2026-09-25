// Test-only detached child. It runs the real R49 CLI and R48 safety owner with
// a filesystem fake provider. It refuses every non-temporary control root.
import * as fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {runR49SafetyCli} from 'file:///C:/NHM2-P8P-Workflow-Review/p8p_r49_safety_cli_v1.mjs';
import {runR48SafetyEntry} from 'file:///C:/NHM2-P8P-Workflow-Review/p8p_r48_safety_entry_v1.mjs';

const argv=process.argv.slice(2);
const rootArg=argv.find(value=>value.startsWith('--safety-root='));
if(argv.length!==8 || !rootArg)throw Error('r50_fixture_args');
const safetyRoot=rootArg.slice('--safety-root='.length);
const attemptRoot=path.dirname(safetyRoot);
const controlRoot=path.dirname(attemptRoot);
const temp=await fs.realpath(os.tmpdir());
const realControl=await fs.realpath(controlRoot);
if(!realControl.toLowerCase().startsWith(temp.toLowerCase()+path.sep) ||
   !path.basename(realControl).startsWith('p8p-r50-child-') ||
   path.basename(safetyRoot)!=='safety' ||
   !/^r48-[a-f0-9]{64}$/.test(path.basename(attemptRoot)))
  throw Error('r50_fixture_scope');
const running=path.join(attemptRoot,'fake-provider-running');
const stopped=path.join(attemptRoot,'fake-provider-stopped');
const exists=async file=>{
  try {await fs.lstat(file);return true;}
  catch(error) {if(error?.code==='ENOENT')return false;throw error;}
};

const entry=args=>runR48SafetyEntry({...args,
  apiFactory:()=>({
    readHelper:async()=>{
      if(!await exists(running) && !await exists(stopped))return null;
      const plan=args.plan;
      const zonal=`https://www.googleapis.com/compute/v1/projects/`+
        `${plan.project}/zones/${plan.zone}`;
      return {name:plan.helper,id:'654',
        status:await exists(stopped)?'TERMINATED':'RUNNING',zone:zonal,
        machineType:`${zonal}/machineTypes/e2-small`,
        labels:{'nhm2-r48-a':plan.attempt.slice(0,32),
          'nhm2-r48-b':plan.attempt.slice(32)}};
    },
    sendStop:async()=>{
      await fs.writeFile(stopped,'stopped',{flag:'wx'});
      return {operation:'LOCAL_FAKE_STOP'};
    },
  }),
  sleep:async()=>new Promise(resolve=>setTimeout(resolve,25)),
});

try {
  const result=await runR49SafetyCli({argv,expectedRoot:controlRoot,
    entry,issueToken:async()=>{throw Error('r50_fixture_no_token')},
    fetchImpl:async()=>{throw Error('r50_fixture_no_network')}});
  process.exitCode=['R48_STOP_VERIFIED','R48_HELPER_ABSENT']
    .includes(result?.status)?0:1;
} catch(error) {
  process.stderr.write(`R50_HARMLESS_CHILD_FAILURE ${error?.message}\n`);
  process.exitCode=1;
}
