import unittest
from types import SimpleNamespace
from unittest.mock import patch
from h2_p8p_discovery_worker import worker_plan,run_worker,_capture


class Stream:
    def __init__(self,number): self.number=number;self.closed=False
    def fileno(self): return self.number
    def close(self): self.closed=True


class Selector:
    def __init__(self): self.items={};self.closed=False
    def register(self,stream,flags,data): self.items[stream]=SimpleNamespace(fileobj=stream,data=data)
    def unregister(self,stream): del self.items[stream]
    def get_map(self): return self.items
    def select(self,timeout): return [(item,0) for item in list(self.items.values())]
    def close(self): self.closed=True


class WorkerTests(unittest.TestCase):
    def run_fake(self,*,stdout=b'ok',payload=b'',cap=64,exit_code=0,kill_failure=False,timeout=False):
        streams=[Stream(i) for i in range(3)];selector=Selector()
        child=SimpleNamespace(stdin=streams[0],stdout=streams[1],stderr=streams[2],pid=123,
                              wait=lambda timeout:exit_code)
        chunks={1:[stdout,b''],2:[b'']};writes=[];kills=[];tick=0
        def clock():
            nonlocal tick
            tick+=1
            return 0 if tick==1 else 100 if timeout else tick*.001
        def kill(pid,sig):
            kills.append((pid,sig))
            if kill_failure: raise PermissionError()
            if sig==0: raise ProcessLookupError()
        def write(fd,data): writes.append(data[:2]);return min(2,len(data))
        plan={'argv':['fake','--test','a'*64],'seconds':60,'stdout_cap':cap,'stderr_cap':64}
        with (patch('h2_p8p_discovery_worker.subprocess.Popen',return_value=child) as spawn,
             patch('h2_p8p_discovery_worker.selectors.DefaultSelector',return_value=selector),
             patch('h2_p8p_discovery_worker.os.set_blocking'),
             patch('h2_p8p_discovery_worker.os.read',side_effect=lambda fd,cap:chunks[fd].pop(0)),
             patch('h2_p8p_discovery_worker.os.write',side_effect=write),
             patch('h2_p8p_discovery_worker.os.killpg',side_effect=kill,create=True),
             patch('h2_p8p_discovery_worker.signal.SIGKILL',9,create=True),
             patch('h2_p8p_discovery_worker.time.monotonic',side_effect=clock)):
            result=_capture(plan,payload)
        self.assertEqual(spawn.call_count,1)
        self.assertTrue(all(stream.closed for stream in streams));self.assertTrue(selector.closed)
        return result,writes,kills

    def test_closed_roles_and_limits(self):
        self.assertEqual(worker_plan('observe','a'*64)['seconds'],60)
        self.assertEqual(worker_plan('publish','a'*64)['stdout_cap'],4096)
        for role in ['mount','shell','retry']:
            with self.assertRaises(ValueError): worker_plan(role,'a'*64)
        with self.assertRaises(ValueError): worker_plan('observe','../old')
        with self.assertRaises(ValueError): run_worker('observe','a'*64,b'input')

    def test_success_closes_stdin_and_reaps_group(self):
        result,writes,kills=self.run_fake()
        self.assertIsNone(result['failure']);self.assertEqual(result['stdout'],b'ok')
        self.assertTrue(result['leader_reaped']);self.assertTrue(result['group_absent'])

    def test_partial_stdin_writes_are_completed(self):
        result,writes,kills=self.run_fake(payload=b'abcde')
        self.assertEqual(b''.join(writes),b'abcde')
        self.assertEqual(result['input_bytes_sent'],5);self.assertIsNone(result['failure'])

    def test_output_cap_preserves_prefix_and_stops(self):
        result,_,kills=self.run_fake(stdout=b'abcdef',cap=3)
        self.assertEqual(result['stdout'],b'abc');self.assertEqual(result['failure'],'worker_output_cap')
        self.assertTrue(kills)

    def test_timeout_kills_and_preserves_failure(self):
        result,_,kills=self.run_fake(timeout=True)
        self.assertEqual(result['failure'],'worker_timeout');self.assertTrue(result['group_absent'])

    def test_nonzero_is_failure(self):
        result,_,_=self.run_fake(exit_code=2)
        self.assertEqual(result['failure'],'worker_nonzero')

    def test_unconfirmed_cleanup_cannot_succeed(self):
        result,_,_=self.run_fake(kill_failure=True)
        self.assertEqual(result['failure'],'worker_cleanup_unconfirmed')
        self.assertFalse(result['group_absent'])


if __name__=='__main__':unittest.main()
