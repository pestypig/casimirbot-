"""Entrypoint for a future separately authorized fresh attestation helper."""
import json
import os
import re
import signal
import sys
import time
import urllib.request
from h2_p8p_hostkey_guest import collect_key
from h2_p8p_hostkey_guest_linux import LinuxGuestOps


def main(attempt_id, device_alias, *, ops_factory=LinuxGuestOps, collector=collect_key):
    if not re.fullmatch(r'[a-f0-9]{64}', attempt_id):
        raise ValueError('attempt_identity')
    if device_alias != '/dev/disk/by-id/google-nhm2-p8p-cv2-hostkey-clone':
        raise ValueError('device_alias')
    def cancelled(signum, frame):
        raise RuntimeError('guest_deadline_signal')
    signal.signal(signal.SIGTERM, cancelled)
    signal.signal(signal.SIGINT, cancelled)
    class NoRedirect(urllib.request.HTTPRedirectHandler):
        def redirect_request(self, *args, **kwargs):
            raise RuntimeError('metadata_redirect')
    opener=urllib.request.build_opener(urllib.request.ProxyHandler({}), NoRedirect())
    request=urllib.request.Request('http://metadata.google.internal/computeMetadata/v1/instance/id',headers={'Metadata-Flavor':'Google'})
    with opener.open(request,timeout=5) as response:
        if response.status!=200 or response.headers.get('Metadata-Flavor')!='Google':
            raise RuntimeError('instance_metadata')
        instance_id=response.read(65).decode('ascii')
    if not re.fullmatch(r'[1-9][0-9]{0,31}',instance_id):
        raise ValueError('instance_identity')
    # This is waiting for the one authorized attachment, not retrying a mount,
    # command, numerical operation or failed read. One mount attempt only.
    ops=ops_factory(device_alias=device_alias,mountpoint='/mnt/nhm2-hostkey-attestation',
                      instance_id=instance_id,attempt_id=attempt_id)
    try:
        deadline=time.monotonic()+600
        while not os.path.lexists(device_alias):
            if time.monotonic()>=deadline:
                raise TimeoutError('attachment_absent')
            time.sleep(1)
        device,filesystem=ops.discover()
    except Exception as error:
        # No mount has been attempted. One bounded sanitized failure export.
        ops.export({'pass':False,'failure':type(error).__name__,'cleanup_failure':None,
                    'mount_attempted':False,'unmounted':True})
        raise
    result=collector(ops,device,ops.mountpoint,filesystem)
    print(json.dumps({'pass':result['pass'],'unmounted':result['unmounted']}),flush=True)
    return 0 if result['pass'] else 1


if __name__=='__main__':
    if len(sys.argv)!=3:
        raise SystemExit('invalid_invocation')
    raise SystemExit(main(sys.argv[1],sys.argv[2]))
