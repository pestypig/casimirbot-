"""Local-only installed SDK/PSCP preflight; never uses real credentials or VM."""
import sys
import pathlib
import json
import subprocess
import socket
import threading
import hashlib

SDK = pathlib.Path('C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk')
sys.path.insert(0, str(SDK / 'lib'))
sys.path.insert(0, str(SDK / 'lib/third_party'))
from googlecloudsdk.command_lib.util.ssh import ssh

env = ssh.Environment.Current()
assert env.suite == ssh.Suite.PUTTY, 'unexpected_transfer_suite'
client = pathlib.Path(env.scp)
assert client.is_file()
source = ssh.FileReference.FromPath('fixture@127.0.0.1:/fixture/archive.tgz')
destination = ssh.FileReference.FromPath('C:/NHM2-LOCAL-FIXTURE/archive.tgz')
assert destination.remote is None
command = ssh.SCPCommand(source, destination, extra_flags=['-batch', '-v'])
args = command.Build(env)
assert args[-2:] == ['fixture@127.0.0.1:/fixture/archive.tgz', 'C:/NHM2-LOCAL-FIXTURE/archive.tgz']
assert args.count('-batch') == 1 and args.count('-v') == 1
assert '-legacy-stdio-prompts' not in args and '-i' not in args

# Loopback-only fixture accepts one connection then closes without an SSH
# handshake. No server host key, authentication or filesystem transfer occurs.
server = socket.socket()
server.bind(('127.0.0.1', 0))
server.listen(1)
server.settimeout(8)
port = server.getsockname()[1]
accepted = []
def close_connection():
    try:
        conn, peer = server.accept()
        accepted.append(peer[0])
        conn.close()
    finally:
        server.close()
worker = threading.Thread(target=close_connection, daemon=True)
worker.start()
local_args = ssh.SCPCommand(source, destination, port=str(port), extra_flags=['-batch','-v']).Build(env)
result = subprocess.run(local_args, input=b'', capture_output=True, timeout=10)
worker.join(9)
assert not worker.is_alive() and accepted == ['127.0.0.1']
assert result.returncode != 0
assert result.stderr or result.stdout, 'missing_client_error'
print(json.dumps({
    'scope': 'local_loopback_only_no_credentials_no_cloud',
    'client_sha256': hashlib.sha256(client.read_bytes()).hexdigest(),
    'client': str(client), 'generated_arguments': args,
    'loopback_exit': result.returncode,
    'stdout': result.stdout.decode('utf8', errors='replace'),
    'stderr': result.stderr.decode('utf8', errors='replace'),
    'pass': True,
    'not_tested': ['host-key prompt rejection against real SSH server', 'live cloud connectivity', 'live authentication', 'live archive transfer']
}, indent=2))
