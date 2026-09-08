import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
test('actual Python path allocation isolates attempts and preserves predecessor directories',()=>{
 const python='C:/Users/dan/AppData/Local/NHM2/p8p-r22-gcloud-583.0.0/sdk/google-cloud-sdk/platform/bundledpython/python.exe';
 const code=`import sys,tempfile,re,ast
from pathlib import Path
sys.path.insert(0,sys.argv[1])
import h2_p8p_cloud_linux_fixture as f
root=Path(tempfile.mkdtemp(prefix='nhm2-fixture-path-regression-'))
# Preserved synthetic directories; no cleanup/deletion.
for name in f.CASES:
 (root/('nhm2-fixture-'+name)).mkdir()
old=set(root.iterdir())
for attempt in ('a'*64,'b'*64):
 paths=[f.fixture_case_path(attempt,name) for name in f.CASES]
 assert len(set(paths))==5
 for path in paths:
  assert re.fullmatch(r'/mnt/nhm2-[a-z0-9-]+',str(path).replace(chr(92),'/'))
  (root/path.name).mkdir()
assert old.issubset(set(root.iterdir())) and len(list(root.iterdir()))==15
try: (root/f.fixture_case_path('a'*64,'size').name).mkdir()
except FileExistsError: pass
else: raise AssertionError('same attempt reused')
for bad in ('', '../escape','A'*64,'a'*63):
 try: f.fixture_case_path(bad,'size')
 except ValueError: pass
 else: raise AssertionError('invalid attempt accepted')
try: f.fixture_case_path('a'*64,'../escape')
except ValueError: pass
else: raise AssertionError('invalid case accepted')
# Every case root allocation in the actual fixture goes through the allocator.
tree=ast.parse(Path(f.__file__).read_text())
body=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name=='_run_fixture')
assert not any(isinstance(n,ast.Call) and isinstance(n.func,ast.Name) and n.func.id=='Path' for n in ast.walk(body))
print('PATH_ISOLATION_PASS; retained synthetic directory='+str(root))`;
 const result=execFileSync(python,['-B','-c',code,import.meta.dirname],{encoding:'utf8',windowsHide:true,timeout:5000,maxBuffer:4096});
 assert.match(result,/PATH_ISOLATION_PASS/);
});
