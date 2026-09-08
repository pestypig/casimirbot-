"""Actual PLINK, loopback-only closed connection; no SSH handshake or credentials."""
import socket, threading, subprocess, pathlib, json
client='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/bin/sdk/plink.exe'
command=str(pathlib.Path(__file__).with_name('h2_p8p_charter_v2_archive_read.txt').resolve())
s=socket.socket();s.bind(('127.0.0.1',0));s.listen(1);s.settimeout(5)
port=s.getsockname()[1]
def close():
    try:
        c,_=s.accept();c.close()
    finally:s.close()
t=threading.Thread(target=close,daemon=True);t.start()
r=subprocess.run([client,'-ssh','-batch','-v','-T','-noagent','-noshare','-a','-x','-no-sanitise-stdout','-P',str(port),'-m',command,'fixture@127.0.0.1'],input=b'',capture_output=True,timeout=10)
t.join(6)
assert not t.is_alive() and r.returncode!=0 and r.stderr
assert b'unknown option' not in r.stderr
print(json.dumps({'scope':'loopback_only_before_handshake','pass':True,'exit':r.returncode,'stdout_bytes':len(r.stdout),'stderr':r.stderr.decode('utf8',errors='replace'),'not_tested':['remote trust','authentication','archive read']},indent=2))
