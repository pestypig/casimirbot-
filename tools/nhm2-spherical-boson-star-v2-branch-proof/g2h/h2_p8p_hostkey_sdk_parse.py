"""Installed SDK parser only. Never invokes CLI.Execute or command.Run."""
import json
import os
import pathlib
import sys
import tempfile

sdk=pathlib.Path('C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk')
os.environ['CLOUDSDK_CONFIG']=tempfile.mkdtemp(prefix='nhm2-sdk-parse-')
os.environ['CLOUDSDK_CORE_DISABLE_USAGE_REPORTING']='true'
os.environ['CLOUDSDK_CORE_DISABLE_PROMPTS']='1'
os.environ['CLOUDSDK_COMPONENT_MANAGER_DISABLE_UPDATE_CHECK']='true'

def deny_external(event,args):
    if event in ('socket.connect','socket.getaddrinfo','subprocess.Popen','os.system'):
        raise RuntimeError('offline_parser_external_operation_blocked')
sys.addaudithook(deny_external)
sys.path.insert(0,str(sdk/'lib'))
sys.path.insert(0,str(sdk/'lib/third_party'))
from googlecloudsdk.calliope import cli
from googlecloudsdk.command_lib.util.apis import yaml_command_translator

raw=sys.stdin.buffer.read(16385)
if len(raw)>16384:raise ValueError('input_cap')
commands=json.loads(raw)
if not isinstance(commands,list) or not 1<=len(commands)<=5:raise ValueError('command_count')
loader=cli.CLILoader(name='gcloud',command_root_directory=str(sdk/'lib/surface'),allow_non_existing_modules=True,
    yaml_command_translator=yaml_command_translator.Translator())
generated=loader.Generate()
parser=generated._CLI__parser
results=[]
for argv in commands:
    if not isinstance(argv,list) or not all(isinstance(x,str) for x in argv):raise ValueError('argument_shape')
    args=parser.parse_args(argv)
    results.append({'command':'.'.join(args._GetCommand().GetPath()),'parsed':True})
print(json.dumps({'scope':'installed_sdk_parse_only','results':results,'api_dispatch':False}))
