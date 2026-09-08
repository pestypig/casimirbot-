"""Offline installed-SDK formatting probe; synthetic metadata only."""
import sys
import io
import json
sdk='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk'
sys.path[:0]=[sdk+'/lib',sdk+'/lib/third_party']
def deny(event,args):
    if event in ('socket.connect','socket.getaddrinfo','subprocess.Popen','os.system'):
        raise RuntimeError('offline_only')
sys.addaudithook(deny)
from googlecloudsdk.core.resource import resource_printer
sample={'name':'synthetic','commonInstanceMetadata':{'items':[{'key':'ssh-keys','value':'synthetic_value'}]}}
out=io.StringIO()
resource_printer.Print(sample,'json(name,commonInstanceMetadata.items[].key)',out=out,single=True)
assert json.loads(out.getvalue())=={'name':'synthetic','commonInstanceMetadata':{'items':[{'key':'ssh-keys'}]}}
assert 'synthetic_value' not in out.getvalue()
print('SDK_METADATA_PROJECTION_PASS')
