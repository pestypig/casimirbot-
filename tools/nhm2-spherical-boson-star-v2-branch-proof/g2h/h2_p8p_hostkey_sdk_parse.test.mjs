import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {resolve} from 'node:path';
import {resourceCommand} from './h2_p8p_hostkey_resource_commands.mjs';
import {readArgs} from './h2_p8p_hostkey_api_read.mjs';
test('installed SDK parses proposed commands without executing them',()=>{
 const commands=['snapshot','clone','helper','attach','stop'].map(a=>resourceCommand(a,{startupPath:'C:/NHM2-ATTEST/startup.sh'}));
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const output=execFileSync(python,['-B','-S',resolve(import.meta.dirname,'h2_p8p_hostkey_sdk_parse.py')],
  {input:JSON.stringify(commands),encoding:'utf8',timeout:30000,maxBuffer:65536,windowsHide:true});
 const report=JSON.parse(output);assert.equal(report.api_dispatch,false);assert.equal(report.results.length,5);
 assert.deepEqual(report.results.map(r=>r.command),['gcloud.compute.snapshots.create','gcloud.compute.disks.create',
  'gcloud.compute.instances.create','gcloud.compute.instances.attach-disk','gcloud.compute.instances.stop']);
});
test('installed SDK parses inventory and fixture reads without API dispatch',()=>{
 const commands=['absent_instance','absent_disk','absent_snapshot','fixture'].map(k=>readArgs(k,'nhm2-synthetic'));
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const output=execFileSync(python,['-B','-S',resolve(import.meta.dirname,'h2_p8p_hostkey_sdk_parse.py')],
  {input:JSON.stringify(commands),encoding:'utf8',timeout:30000,maxBuffer:65536,windowsHide:true});
 const report=JSON.parse(output);assert.equal(report.api_dispatch,false);
 assert.deepEqual(report.results.map(r=>r.command),['gcloud.compute.instances.list','gcloud.compute.disks.list',
  'gcloud.compute.snapshots.list','gcloud.compute.instances.get-guest-attributes']);
});
test('installed SDK parses account and startup-policy admission without dispatch',()=>{
 const commands=['account','configuration','projectMetadata'].map(k=>readArgs(k,'dark-stratum-455714-h4'));
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const output=execFileSync(python,['-B','-S',resolve(import.meta.dirname,'h2_p8p_hostkey_sdk_parse.py')],
  {input:JSON.stringify(commands),encoding:'utf8',timeout:30000,maxBuffer:65536,windowsHide:true});
 const report=JSON.parse(output);assert.equal(report.api_dispatch,false);
 assert.deepEqual(report.results.map(r=>r.command),['gcloud.auth.list','gcloud.config.list','gcloud.compute.project-info.describe']);
});
