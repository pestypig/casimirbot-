"""POSIX bounded worker engine, no CLI or automatic dispatch.

Private process groups are not a cgroup containment guarantee. The final guest
startup must supervise the entire worker tree and stop the VM on any ambiguity.
"""
import os
import re
import selectors
import signal
import subprocess
import sys
import time


def worker_plan(role,attempt):
    if not isinstance(attempt,str) or not re.fullmatch(r'[a-f0-9]{64}',attempt):
        raise ValueError('worker_attempt')
    definitions={'observe':('h2_p8p_discovery_entry.py','--observe-once',60,65536),
                 'publish':('h2_p8p_discovery_publish.py','--publish-once',20,4096)}
    if role not in definitions: raise ValueError('worker_role')
    filename,flag,seconds,cap=definitions[role]
    return {'argv':[sys.executable,'-B',os.path.join(os.path.dirname(__file__),filename),flag,attempt],
            'seconds':seconds,'stdout_cap':cap,'stderr_cap':8192}


def run_worker(role,attempt,payload=b''):
    plan=worker_plan(role,attempt)
    if not isinstance(payload,bytes) or len(payload)>65536 or (role=='observe' and payload):
        raise ValueError('worker_input')
    if os.name!='posix': raise RuntimeError('posix_worker_required')
    return _capture(plan,payload)


def _capture(plan,payload):
    started=time.monotonic();child=None;selector=None
    output=[bytearray(),bytearray()];caps=[plan['stdout_cap'],plan['stderr_cap']]
    offset=0;failure=None;exit_code=None;leader_reaped=False;group_absent=False
    try:
        child=subprocess.Popen(plan['argv'],stdin=subprocess.PIPE,stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,shell=False,start_new_session=True)
        selector=selectors.DefaultSelector()
        for stream,index in [(child.stdout,0),(child.stderr,1)]:
            os.set_blocking(stream.fileno(),False)
            selector.register(stream,selectors.EVENT_READ,index)
        if payload:
            os.set_blocking(child.stdin.fileno(),False)
            selector.register(child.stdin,selectors.EVENT_WRITE,2)
        else: child.stdin.close()
        while selector.get_map():
            remaining=started+plan['seconds']-time.monotonic()
            if remaining<=0: raise TimeoutError()
            for key,_ in selector.select(min(.1,remaining)):
                try:
                    if key.data==2:
                        sent=os.write(key.fileobj.fileno(),payload[offset:offset+4096])
                        if sent<=0: raise BrokenPipeError()
                        offset+=sent
                        if offset==len(payload):
                            selector.unregister(key.fileobj);key.fileobj.close()
                    else:
                        chunk=os.read(key.fileobj.fileno(),4096)
                        if not chunk:
                            selector.unregister(key.fileobj);continue
                        free=caps[key.data]-len(output[key.data])
                        output[key.data].extend(chunk[:free])
                        if len(chunk)>free:
                            failure='worker_output_cap';raise RuntimeError()
                except BlockingIOError: continue
        exit_code=child.wait(timeout=max(.001,started+plan['seconds']-time.monotonic()))
        if exit_code!=0: failure='worker_nonzero'
        if offset!=len(payload): failure=failure or 'worker_input_incomplete'
    except (TimeoutError,subprocess.TimeoutExpired): failure='worker_timeout'
    except Exception: failure=failure or 'worker_exception'
    finally:
        if child is not None:
            try:
                try: os.killpg(child.pid,signal.SIGKILL)
                except ProcessLookupError: pass
                exit_code=child.wait(timeout=5);leader_reaped=True
                try: os.killpg(child.pid,0)
                except ProcessLookupError: group_absent=True
            except Exception: failure=failure or 'worker_cleanup_unconfirmed'
            if selector is not None:
                try: selector.close()
                except Exception: failure=failure or 'worker_cleanup_unconfirmed'
            for stream in (child.stdin,child.stdout,child.stderr):
                try: stream.close()
                except Exception: failure=failure or 'worker_cleanup_unconfirmed'
            if not leader_reaped or not group_absent: failure=failure or 'worker_cleanup_unconfirmed'
    return {'role':plan['argv'][-2],'stdout':bytes(output[0]),'stderr':bytes(output[1]),
        'input_bytes_sent':offset,'exit_code':exit_code,'failure':failure,
        'leader_reaped':leader_reaped,'group_absent':group_absent,
        'elapsed_ms':round((time.monotonic()-started)*1000)}
