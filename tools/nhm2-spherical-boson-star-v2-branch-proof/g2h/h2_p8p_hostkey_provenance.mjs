// Structural validation of API observations, not authentication of their origin.
// The future controller must obtain these via the dedicated authenticated SDK.
export function validateResourceChain(observed, frozen) {
  const fail = name => { throw new Error(`hostkey_provenance_${name}`); };
  const equal = (a,b,name) => { if(typeof b!=='string'||b.length===0||a!==b)fail(name); };
  const id = (a,name) => { if(typeof a!=='string'||!(/^[1-9][0-9]*$/).test(a))fail(name); };
  const {sourceVM,sourceDisk,snapshot,clone,helper}=observed;
  for(const [name,r] of Object.entries({sourceVM,sourceDisk,snapshot,clone,helper})) {
    if(!r||typeof r!=='object')fail(name);
    id(r.id,`${name}_id`);
    equal(r.selfLink,frozen[name]?.selfLink,`${name}_url`);
    equal(r.id,frozen[name]?.id,`${name}_id_binding`);
  }
  equal(sourceVM.status,'TERMINATED','source_running');
  equal(sourceDisk.status,'READY','source_disk_not_ready');
  equal(sourceDisk.sizeGb,'10','source_size');
  equal(sourceDisk.type,frozen.sourceDisk.type,'source_type');
  const boot=sourceVM.disks?.filter(d=>d.boot===true);
  if(boot?.length!==1)fail('source_boot_count');
  equal(boot[0].source,sourceDisk.selfLink,'source_boot_binding');
  equal(boot[0].mode,'READ_WRITE','source_boot_mode');
  if(!Array.isArray(sourceDisk.users)||sourceDisk.users.length!==1||sourceDisk.users[0]!==sourceVM.selfLink)fail('source_users');
  equal(snapshot.status,'READY','snapshot_not_ready');
  equal(snapshot.snapshotType,'STANDARD','snapshot_type');
  equal(snapshot.sourceDisk,sourceDisk.selfLink,'snapshot_source');
  equal(snapshot.sourceDiskId,sourceDisk.id,'snapshot_source_id');
  equal(clone.status,'READY','clone_not_ready');
  equal(clone.sourceSnapshot,snapshot.selfLink,'clone_snapshot');
  equal(clone.sourceSnapshotId,snapshot.id,'clone_snapshot_id');
  equal(clone.sizeGb,'10','clone_size');
  equal(clone.type,frozen.clone.type,'clone_type');
  equal(helper.status,'RUNNING','helper_not_running');
  equal(helper.machineType,frozen.helper.machineType,'helper_machine');
  if(!Array.isArray(helper.disks)||helper.disks.length!==2)fail('helper_disk_count');
  const data=helper.disks.filter(d=>d.source===clone.selfLink);
  if(data.length!==1||data[0].boot!==false||data[0].mode!=='READ_ONLY'||data[0].autoDelete!==false)fail('clone_attachment');
  equal(data[0].deviceName,frozen.clone.deviceName,'clone_device');
  const helperBoot=helper.disks.filter(d=>d.boot===true);
  if(helperBoot.length!==1||helperBoot[0].mode!=='READ_WRITE')fail('helper_boot');
  equal(helperBoot[0].source,frozen.helper.bootDisk,'helper_boot_binding');
  if(!Array.isArray(clone.users)||clone.users.length!==1||clone.users[0]!==helper.selfLink)fail('clone_users');
  // Require a fresh snapshot, then a derived disk. API observation timestamps
  // and post-stop cleanup are separate controller obligations.
  const time = value => {
    const m=typeof value==='string'&&/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})(?:\.\d{1,3})?(Z|[+-]\d{2}:\d{2})$/.exec(value);
    if(!m)fail('timestamp');
    const [year,month,day,hour,minute,second]=m.slice(1,7).map(Number);
    const leap=year%4===0&&(year%100!==0||year%400===0);
    const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    if(year<1970||month<1||month>12||day<1||day>days[month-1]||hour>23||minute>59||second>59)fail('timestamp');
    if(m[7]!=='Z'&&(Number(m[7].slice(1,3))>23||Number(m[7].slice(4,6))>59))fail('timestamp');
    if(!Number.isFinite(Date.parse(value)))fail('timestamp');
    return Date.parse(value);
  };
  const start=time(frozen.attemptStartedAt), end=time(frozen.deadline);
  const snapTime=time(snapshot.creationTimestamp), cloneTime=time(clone.creationTimestamp);
  if(!(start<end&&start<=snapTime&&snapTime<=cloneTime&&cloneTime<end))fail('chronology');
  const {sourceBefore,helperBeforeAttach,helperBootDisk,attachmentIntentAt,observedAt}=observed;
  if(!sourceBefore||!helperBeforeAttach||!helperBootDisk)fail('missing_lifecycle_receipt');
  for(const field of ['id','selfLink','status','lastStartTimestamp','lastStopTimestamp'])
    equal(sourceBefore.vm?.[field],sourceVM[field],`source_continuity_${field}`);
  if(!(time(sourceVM.lastStartTimestamp)<time(sourceVM.lastStopTimestamp)&&
       time(sourceVM.lastStopTimestamp)<=time(sourceBefore.observedAt)&&
       start<=time(sourceBefore.observedAt)&&time(sourceBefore.observedAt)<=snapTime))fail('source_stop_chronology');
  if(JSON.stringify(sourceBefore.vm.disks)!==JSON.stringify(sourceVM.disks))fail('source_attachment_changed');
  equal(helperBeforeAttach.vm?.id,helper.id,'boot_receipt_id');
  equal(helperBeforeAttach.vm?.selfLink,helper.selfLink,'boot_receipt_url');
  equal(helperBeforeAttach.vm?.status,'RUNNING','boot_receipt_status');
  const initialDisks=helperBeforeAttach.vm?.disks;
  if(!Array.isArray(initialDisks)||initialDisks.length!==1||initialDisks[0].boot!==true||initialDisks[0].mode!=='READ_WRITE'||
     initialDisks[0].source!==helperBoot[0].source)fail('boot_before_attach_disks');
  equal(helperBeforeAttach.vm.lastStartTimestamp,helper.lastStartTimestamp,'helper_restart');
  if(!(start<=time(helper.lastStartTimestamp)&&time(helper.lastStartTimestamp)<=time(helperBeforeAttach.observedAt)&&
    time(helperBeforeAttach.observedAt)<time(attachmentIntentAt)&&cloneTime<=time(attachmentIntentAt)&&
    time(attachmentIntentAt)<time(observedAt)&&time(observedAt)<end))fail('attach_chronology');
  id(helperBootDisk.id,'helper_boot_disk_id');
  equal(helperBootDisk.id,frozen.helper.bootDiskId,'helper_boot_disk_id_binding');
  equal(helperBootDisk.selfLink,frozen.helper.bootDisk,'helper_boot_disk_url');
  equal(helperBootDisk.status,'READY','helper_boot_disk_status');
  equal(helperBootDisk.sizeGb,'10','helper_boot_disk_size');
  equal(helperBootDisk.type,frozen.clone.type,'helper_boot_disk_type');
  equal(helperBootDisk.sourceImage,frozen.helper.image,'helper_boot_disk_image');
  if(!Array.isArray(helperBootDisk.users)||helperBootDisk.users.length!==1||helperBootDisk.users[0]!==helper.selfLink)fail('helper_boot_disk_users');
  return Object.freeze({structuralChecksPassed:true,sourceDiskId:sourceDisk.id,snapshotId:snapshot.id,cloneId:clone.id,helperId:helper.id});
}
