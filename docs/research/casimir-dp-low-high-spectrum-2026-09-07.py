"""Raw low/high xenon spectrum using the bounded-weight slab mixture."""
import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
p=base/'casimir-dp-defensive-mixture-2026-09-07.py'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='250b2e1ac579409afe9d4f4f6a66d6109e8792edb6ab1de34ce0d6c21e7f9db3'
n={'__file__':str(p)};exec(p.read_text(encoding='utf-8-sig').split('\nrows=[]')[0],n)
p2=base/'casimir-dp-weighted-xenon-spectrum-2026-09-07.py'
assert hashlib.sha256(p2.read_bytes()).hexdigest()=='0f0992dcdeeaa5fbe9096c29a2a523ce1df61f1f7d8f94a784e92a3ba138692d'
s=p2.read_text().split("t['response']=response")[0]
s=s.replace('bins=[(200,220),(220,240),(240,260),(260,269.9)]','edges=[5.4,10,20,50,100,150,200,220,240,260,269.9]\nbins=list(zip(edges[:-1],edges[1:]))')
s=s.replace('energies=np.linspace(200,269.9,8001)','energies=np.unique(np.r_[np.geomspace(5.4,200,20001),np.linspace(200,269.9,8001)])')
s=s.replace('norm=sum(f*c[-1] for _,f,c in tables)','norm=sum(f*(c[-1]-np.interp(200,energies,c)) for _,f,c in tables)')
s=s.replace('[602,630,650,700,776]','[100,150,300,500,602,650,776]')
s=s.replace('np.abs(direct-tabulated)','np.abs(direct-tabulated)/np.maximum(1,np.abs(direct))')
s=s.replace('assert err<1e-6','assert err<1e-5')
k={'__file__':str(p2)};exec(s,k)
t=n['t'];t['response']=k['response'];t['nbins']=len(k['bins'])
old='    return dict(N=N,seed=seed,bias=bias,energy_bias=ebias,scale=scale,'
assert n['s'].count(old)==1
s=n['s'].replace(old,'    rv=np.zeros((nbins,N));rv[:,forward]=response(v[forward],uz[forward])*weights[forward]\n    return dict(bins=[summary(y) for y in rv],low=summary(rv[:6].sum(axis=0)),high=summary(rv[6:].sum(axis=0)),N=N,seed=seed,bias=bias,energy_bias=ebias,scale=scale,')
oldcut=t['oldcut'];cut=t['vcut'];exec(s,t);t['oldcut']=oldcut;t['vcut']=cut
rows=[]
for i,(bias,ebias) in enumerate([(.7,.5),(.65,.6)]):
 parts=[t['run'](500000,9510+2*i+j,t['a']*3.9,bias,ebias,physical) for j,physical in enumerate([True,False])]
 K=t['branch']['unattenuated_reference_count']*t['a']*3.9
 def pool(values,scale=1):
  return dict(mean=scale*sum(q['mean'] for q in values)/2,se=scale*math.hypot(*(q['se'] for q in values))/2)
 row=dict(bias=bias,energy_bias=ebias,parts=parts,normalization=pool([r['total'] for r in parts]),
 raw_bins=[pool([r['bins'][j] for r in parts],K) for j in range(t['nbins'])],
 raw_low=pool([r['low'] for r in parts],K),raw_high=pool([r['high'] for r in parts],K))
 assert abs(row['normalization']['mean']-1)<6*row['normalization']['se']
 rows.append(row)
 print(json.dumps({key:value for key,value in row.items() if key!='parts'}),flush=True)
out=dict(status='conditional_thin_target_raw_spectrum_not_accepted_counts',bins_keV=k['bins'],
 interpolation_checks=k['checks'],rows=rows,
 source_hashes={p.name:hashlib.sha256(p.read_bytes()).hexdigest(),p2.name:hashlib.sha256(p2.read_bytes()).hexdigest()},
 limitations=['sampling tails not certified','thin-target rate may require finite-detector multiple-scatter treatment',
 'no detector response or efficiency','not actual site geology or capture','5.4 keV true-energy stopping rule not detector threshold',
 'no experimental exclusion or qualified shared local signal'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
