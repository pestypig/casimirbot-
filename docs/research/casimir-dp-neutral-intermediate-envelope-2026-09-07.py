"""Conditional neutral-cell elastic envelopes through the qBZ scale."""
import json,hashlib,math
from pathlib import Path
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-neutral-sphere-envelope-2026-09-07.py')
n={'__file__':str(p)};exec(p.read_text().split('\nrows=[]')[0],n)
hc=n['hc'];rr=n['rr'];d=n['d']['branch_separation_m'];end=3472.823879
rows=[]
for r in json.loads(n['p'].read_text())['rows']:
 vals=[]
 for mode,lo in [('spherical_intermediate',n['qc']),('arbitrary_neutral_all_below_qBZ',0.)]:
  def f(q):
   A=sum(c/(q*q+(m*1e9)**2) for c,m in zip(r['effective_alpha_products'],r['masses_GeV']))
   if mode=='spherical_intermediate':charge=min(2,q*q*rr*rr/(6*hc*hc));branch=min(2,q*q*d*d/(6*hc*hc))
   else:charge=min(2,q*rr/hc);branch=min(2,q*q*d*d/(2*hc*hc))
   return q*A*A*charge**2*branch
  value=quad(f,lo,end,epsabs=1e-65,epsrel=1e-9,limit=300)[0]*n['pref']
  split=2*hc/d
  check=sum(quad(f,a,b,epsabs=1e-66,epsrel=1e-10,limit=500)[0] for a,b in [(lo,split),(split,end)])*n['pref']
  assert abs(value/check-1)<1e-6
  vals.append(dict(model=mode,q_interval_eV=[lo,end],conditional_D_upper=check))
 rows.append(dict(masses_GeV=r['masses_GeV'],envelopes=vals))
out=dict(status='conditional_elastic_charge_envelope_not_total_response',rows=rows,
 assumed_electron_rms_radius_m=rr,input_script_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
 assumptions=['fixed incoming population and mediator products','point nuclei and positive electron density partitioned into neutral cells',
 'each cell rms electron distance from nucleus <=0.1 nm','Born elastic channel and maximal N² positional coherence'],
 limitations=['arbitrary-neutral result permits anisotropy and nonzero cell dipoles but requires local neutrality',
 'not validated charge partition for bonded diamond, charged surface or ionic cells',
 'does not bound inelastic excitations or q above the chosen endpoint',
 'no captured population or full apparatus signal prediction'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
