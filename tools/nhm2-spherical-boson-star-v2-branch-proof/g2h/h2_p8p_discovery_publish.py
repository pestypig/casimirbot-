"""Single-use guest-attribute publisher; imports perform no I/O.

The outer process supervisor MUST enforce a wall-clock deadline and kill/reap
this worker. urllib timeouts alone only bound socket inactivity. This worker
does not start a VM, mount, execute the diagnostic, or retry a request.
"""
import json
import sys
import urllib.request
from h2_p8p_discovery_diagnostic import INSTANCE
from h2_p8p_discovery_transport import encode_value

PREFIX='http://metadata.google.internal/computeMetadata/v1/instance/'


class NoRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self,*args,**kwargs):
        raise RuntimeError('metadata_redirect')


class SinglePublisher:
    def __init__(self,opener=None):
        self._used=False
        self._opener=opener

    def publish(self,raw,attempt):
        if self._used: raise RuntimeError('publisher_consumed')
        self._used=True  # first failure consumes this object before any I/O
        item=encode_value(raw,attempt)
        opener=self._opener or urllib.request.build_opener(
            urllib.request.ProxyHandler({}),NoRedirect())
        headers={'Metadata-Flavor':'Google'}
        request=urllib.request.Request(PREFIX+'id',headers=headers)
        with opener.open(request,timeout=5) as response:
            if response.status!=200 or response.headers.get('Metadata-Flavor')!='Google':
                raise RuntimeError('metadata_identity_response')
            identity=response.read(65)
        if identity!=INSTANCE.encode('ascii'): raise RuntimeError('metadata_instance_mismatch')
        payload=item['value'].encode('ascii')
        url=PREFIX+'guest-attributes/'+item['namespace']+'/'+item['key']
        request=urllib.request.Request(url,data=payload,method='PUT',
            headers={**headers,'Content-Type':'application/json'})
        with opener.open(request,timeout=5) as response:
            if response.status!=200 or response.headers.get('Metadata-Flavor')!='Google':
                raise RuntimeError('metadata_publish_response')
            if len(response.read(1025))>1024: raise RuntimeError('metadata_publish_response_cap')
        return {'schema':'nhm2-discovery-publication-v1','instance_id':INSTANCE,
            'attempt_id':attempt,'namespace':item['namespace'],'key':item['key'],
            'value_bytes':len(payload),'published':True}


def main():
    if len(sys.argv)!=3 or sys.argv[1]!='--publish-once':
        raise SystemExit('exact_publish_invocation_required')
    raw=sys.stdin.buffer.read(65537)
    result=SinglePublisher().publish(raw,sys.argv[2])
    print(json.dumps(result,separators=(',',':')),flush=True)


if __name__=='__main__': main()
