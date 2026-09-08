// Inert resource predicate. No SDK, filesystem, process, or cloud operations.
const base = 'https://www.googleapis.com/compute/v1/projects/dark-stratum-455714-h4/zones/us-east1-b';
const originalName = 'nhm2-h2-p8p-r32-e2-4-20260904';
const helperName = 'nhm2-h2-p8p-r39-rescue-e2-small-20260904';
const cloneName = 'nhm2-h2-p8p-r39-evidence-clone-20260904';
export function validateRetainedInstances(original, helper) {
  if (original?.id !== '1893159507643031574' || original.name !== originalName ||
      original.status !== 'TERMINATED' || original.zone !== base ||
      original.selfLink !== `${base}/instances/${originalName}`) throw new Error('original_identity');
  if (helper?.id !== '7129462452423922626' || helper.name !== helperName ||
      helper.status !== 'TERMINATED' || helper.zone !== base ||
      helper.selfLink !== `${base}/instances/${helperName}` ||
      helper.machineType !== `${base}/machineTypes/e2-small`) throw new Error('helper_identity');
  if (!Array.isArray(helper.disks) || helper.disks.length !== 2) throw new Error('disk_inventory');
  const boot = helper.disks.filter(d => d.boot === true);
  const clone = helper.disks.filter(d => d.boot === false);
  if (boot.length !== 1 || boot[0].source !== `${base}/disks/${helperName}` ||
      boot[0].mode !== 'READ_WRITE' || boot[0].diskSizeGb !== '10' ||
      boot[0].type !== 'PERSISTENT') throw new Error('boot_configuration');
  // The attachment alias is NOT the disk resource name. Bind both independently.
  if (clone.length !== 1 || clone[0].source !== `${base}/disks/${cloneName}` ||
      clone[0].deviceName !== 'nhm2-h2-p8p-r39-evidence-clone' ||
      clone[0].mode !== 'READ_ONLY' || clone[0].diskSizeGb !== '30' ||
      clone[0].type !== 'PERSISTENT' || clone[0].autoDelete !== false) throw new Error('clone_configuration');
}
