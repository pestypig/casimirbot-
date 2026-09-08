"""Conditional isolated-atom, rigid-sphere vector response; no rate prediction."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

ROOT = Path(__file__).resolve().parents[2]
config = ROOT / 'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(config.read_bytes()).hexdigest() == '5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d = json.loads(config.read_text())['leading_design']
R = d['radius_m']
sep = d['branch_separation_m']
hc = 1.973269804e-7  # eV m
a = [2.31, 1.02, 1.5886, .865]
b = [20.8439, 10.2075, .5687, 51.6512]
c = .2156
f0 = sum(a) + c

def screening(q):
    # s = sin(theta)/lambda = q/(4 pi hbar c), in inverse angstrom.
    s = q / (4 * math.pi * hc) * 1e-10
    # 1 - Fe/Z, with Fe = Z f/f0. Stable and exactly neutral at q=0.
    return sum(ai * -math.expm1(-bi*s*s) for ai, bi in zip(a,b)) / f0

def sphere(x):
    return 1-x*x/10+x**4/280 if abs(x)<.01 else 3*(math.sin(x)-x*math.cos(x))/x**3

def loss(x):
    return x*x/6-x**4/120+x**6/5040 if abs(x)<.01 else 1-math.sin(x)/x

def integral(cut, med, screened, tol):
    # Common mediator^-4 factor removed. Ratio is unchanged.
    # Vector Born d sigma has q dq/(q^2+m^2)^2, not the dipole dq/q.
    def fn(x):
        q=x*hc/R
        return x*sphere(x)**2*loss(x*sep/R)/(1+(q/med)**2)**2*(screening(q)**2 if screened else 1)
    return quad(fn, 0, cut, epsabs=1e-28, epsrel=tol, limit=500)[0]

assert screening(0)==0
assert abs(screening(.02)/screening(.01)/4-1)<1e-9
rows=[]
for med in [1e7,1e8]:
    for cut in [1,10,80]:
        raw=integral(cut,med,False,1e-8)
        scr=integral(cut,med,True,1e-8)
        check=integral(cut,med,True,1e-10)
        assert abs(check/scr-1)<1e-7
        assert 0 < scr/raw <= screening(cut*hc/R)**2
        rows.append(dict(mediator_eV=med,qR_cut=cut,q_max_eV=cut*hc/R,
                         screened_to_bare_integral=scr/raw,
                         endpoint_charge_squared=screening(cut*hc/R)**2))
out=dict(status='conditional_partial_elastic_response_only',config_sha256=hashlib.sha256(config.read_bytes()).hexdigest(),
         a=a,b=b,c=c,raw_f_zero=f0,electron_normalization=6/f0,
         inferred_atomic_rms_m=math.sqrt(6*sum(ai*bi for ai,bi in zip(a,b))/f0)/(4*math.pi)*1e-10,
         assumptions=['isolated neutral carbon fit','point nucleus over this interval','uniform rigid sphere','isotropic momentum directions','kinematic support reaches stated cutoff','Born vector exchange'],
         exclusions=['no bonded-diamond response','no all-q bound','no inelastic response','no capture density','no absolute decoherence rate','no LZ accepted count'],rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
