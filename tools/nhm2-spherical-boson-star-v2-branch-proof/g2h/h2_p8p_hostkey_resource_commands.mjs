// Proposed command inventory only. This module cannot execute commands.
// Names/settings require inclusion in the separately approved final amendment.
export const proposedResources=Object.freeze({
 project:'dark-stratum-455714-h4',zone:'us-east1-b',region:'us-east1',
 sourceDisk:'nhm2-h2-p8p-r39-rescue-e2-small-20260904',
 snapshot:'nhm2-p8p-cv2-hostkey-snapshot-20260905',
 clone:'nhm2-p8p-cv2-hostkey-clone-20260905',
 helper:'nhm2-p8p-cv2-hostkey-helper-20260905',
 boot:'nhm2-p8p-cv2-hostkey-boot-20260905',
 device:'nhm2-p8p-cv2-hostkey-clone',
 image:'projects/debian-cloud/global/images/debian-12-bookworm-v20260817',
});
export function resourceCommand(action,{startupPath}={}){
 const r=proposedResources;
 const base=['--account=pestypig@gmail.com',`--project=${r.project}`,'--quiet','compute'];
 const zone=`--zone=${r.zone}`;
 switch(action){
 case 'snapshot':return [...base,'snapshots','create',r.snapshot,`--source-disk=${r.sourceDisk}`,
   `--source-disk-zone=${r.zone}`,'--snapshot-type=STANDARD',`--storage-location=${r.region}`,'--format=json'];
 case 'clone':return [...base,'disks','create',r.clone,zone,`--source-snapshot=${r.snapshot}`,
   '--size=10GB','--type=pd-standard','--format=json'];
 case 'helper':
   if(typeof startupPath!=='string'||!/^C:\/NHM2-[A-Za-z0-9-]+\/[A-Za-z0-9_-]+\.sh$/.test(startupPath))throw Error('startup_short_path');
   return [...base,'instances','create',r.helper,zone,'--machine-type=e2-small','--provisioning-model=STANDARD',
     `--create-disk=name=${r.boot},image=${r.image},size=10GB,type=pd-standard,boot=yes,auto-delete=no`,
     '--no-service-account','--no-scopes','--metadata=enable-guest-attributes=TRUE',
     `--metadata-from-file=startup-script=${startupPath}`,
     '--max-run-duration=3600s','--instance-termination-action=STOP','--format=json'];
 case 'attach':return [...base,'instances','attach-disk',r.helper,zone,`--disk=${r.clone}`,
   '--mode=ro',`--device-name=${r.device}`,'--format=json'];
 case 'stop':return [...base,'instances','stop',r.helper,zone,'--format=json'];
 default:throw Error('operation_not_in_proposed_scope');
 }
}
