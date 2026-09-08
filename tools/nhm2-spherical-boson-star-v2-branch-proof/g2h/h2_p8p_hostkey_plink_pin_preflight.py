"""Installed client option preflight, loopback only; NOT host-key trust proof."""
import base64
import hashlib
import json
import pathlib
import socket
import subprocess
import threading

client = pathlib.Path('C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/bin/sdk/plink.exe')
expected_client = '7308e9d356f14aa1f08cab1af363f71a077bf35dcb49e50b363418044758cd1e'
if hashlib.sha256(client.read_bytes()).hexdigest() != expected_client:
    raise RuntimeError('client_identity_mismatch')
wire = b'\x00\x00\x00\x0bssh-ed25519\x00\x00\x00\x20' + b'x'*32
pin = 'SHA256:' + base64.b64encode(hashlib.sha256(wire).digest()).decode().rstrip('=')
accepted = threading.Event()
listener = socket.socket()
listener.bind(('127.0.0.1', 0))
listener.listen(1)
listener.settimeout(5)
port = listener.getsockname()[1]

def peer():
    try:
        connection, _ = listener.accept()
        accepted.set()
        connection.close()  # No SSH handshake, credential or command exchange.
    except OSError:
        pass
    finally:
        listener.close()

thread = threading.Thread(target=peer, daemon=True)
thread.start()
args = [str(client), '-ssh', '-batch', '-v', '-T', '-noagent', '-noshare',
        '-a', '-x', '-hostkey', pin, '-P', str(port), 'fixture@127.0.0.1']
result = subprocess.run(args, input=b'', capture_output=True, timeout=10,
                        creationflags=subprocess.CREATE_NO_WINDOW)
thread.join(6)
report = {'scope':'installed_client_pin_option_loopback_prehandshake',
          'client_sha256':expected_client, 'accepted_loopback':accepted.is_set(),
          'exit_code':result.returncode, 'stderr':result.stderr.decode('utf8', errors='replace'),
          'not_proved':['host-key mismatch rejection during key exchange',
                       'Linux filesystem behavior', 'production trust', 'archive retrieval']}
report['pass'] = (accepted.is_set() and not thread.is_alive() and result.returncode != 0
                  and b'unknown option' not in result.stderr and len(result.stdout)==0)
print(json.dumps(report, indent=2))
if not report['pass']:
    raise RuntimeError('pin_option_preflight_failed')
