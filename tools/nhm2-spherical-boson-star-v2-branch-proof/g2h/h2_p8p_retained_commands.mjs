// Exact retained-helper operations. No creation/deletion or execution on import.
import {proposedResources as r,resourceCommand} from './h2_p8p_hostkey_resource_commands.mjs';
export const retainedStartupPath='C:/NHM2-CV2-Retained-v1/startup.sh';
export const retainedStartupPathV2='C:/NHM2-CV2-Retained-v2/startup.sh';
export function retainedResourceCommand(action,{startupPath}={}){
 if(action==='attach'||action==='stop')return resourceCommand(action);
 const base=['--account=pestypig@gmail.com',`--project=${r.project}`,'--quiet','compute','instances'];
 const zone=`--zone=${r.zone}`;
 if(action==='startup'){
  if(![retainedStartupPath,retainedStartupPathV2].includes(startupPath))throw Error('retained_startup_path');
  return [...base,'add-metadata',r.helper,zone,`--metadata-from-file=startup-script=${startupPath}`,'--format=json'];
 }
 if(action==='restart')return [...base,'start',r.helper,zone,'--format=json'];
 throw Error('retained_operation_scope');
}
