// Pure identity enrollment; does not prove initial absence or API provenance.
import {proposedResources as r} from './h2_p8p_hostkey_resource_commands.mjs';
const base=`https://www.googleapis.com/compute/v1/projects/${r.project}`;
const spec=Object.freeze({
 snapshot:{name:r.snapshot,url:`${base}/global/snapshots/${r.snapshot}`},
 clone:{name:r.clone,url:`${base}/zones/${r.zone}/disks/${r.clone}`},
 helper:{name:r.helper,url:`${base}/zones/${r.zone}/instances/${r.helper}`},
});
export function creationTime(value){
 const m=typeof value==='string'&&/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
 if(!m)throw Error('enrollment_timestamp');
 const [y,mo,d,h,mi,s]=m.slice(1,7).map(Number);
 const days=[31,y%4===0&&(y%100!==0||y%400===0)?29:28,31,30,31,30,31,31,30,31,30,31];
 if(y<1970||mo<1||mo>12||d<1||d>days[mo-1]||h>23||mi>59||s>59||
  (m[7]!=='Z'&&(Number(m[7].slice(1,3))>23||Number(m[7].slice(4,6))>59)))throw Error('enrollment_timestamp');
 return Date.parse(value);
}
export function enrollCreatedResource({kind,creation,observation,startedAt,deadline}){
 if(!Object.hasOwn(spec,kind))throw Error('enrollment_kind');
 if(!Number.isFinite(startedAt)||!Number.isFinite(deadline)||startedAt>=deadline)throw Error('enrollment_window');
 const created=Array.isArray(creation)?creation.length===1?creation[0]:null:creation;
 const seen=observation?.data,expected=spec[kind];
 for(const value of [created,seen]){
  if(!value||typeof value!=='object'||Array.isArray(value)||typeof value.id!=='string'||
   !/^[1-9][0-9]*$/.test(value.id)||value.name!==expected.name||value.selfLink!==expected.url)
   throw Error('enrollment_identity');
 }
 if(created.id!==seen.id)throw Error('enrollment_id_mismatch');
 const t=Date.parse(observation.observedAt),born=creationTime(seen.creationTimestamp);
 if(!Number.isFinite(t)||new Date(t).toISOString()!==observation.observedAt||
  !Number.isFinite(born)||born<startedAt||born>t||t>=deadline)throw Error('enrollment_chronology');
 if(created.creationTimestamp!==undefined&&created.creationTimestamp!==seen.creationTimestamp)
  throw Error('enrollment_creation_changed');
 return Object.freeze({id:seen.id,name:expected.name,selfLink:expected.url,
  creationTimestamp:seen.creationTimestamp,enrolledAt:observation.observedAt});
}
