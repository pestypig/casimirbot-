"""Fold saved weighted exits into raw isotope-summed recoil bands."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import cumulative_trapezoid
base=Path(__file__).parent
receipt=json.loads((base/'casimir-dp-weighted-low-transport-2026-09-07.json').read_text())
archive=base/receipt['archive']
assert hashlib.sha256(archive.read_bytes()).hexdigest()==receipt['archive_sha256']
data=np.load(archive,allow_pickle=False)
source=base/'casimir-dp-slab-transport-2026-09-07.py'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='dcb25aeacd1d563858dfa057b5eb70185c1f92a79d49f00acb82a49bf7635113'
ns={'__file__':str(source.resolve())}
exec(source.read_text().split('def run(')[0],ns)
xe=ns['ns'];vi=xe['v'];bins=[(1,5.4),(5.4,14),(14,50),(50,100),(100,200),(200,220),(220,240),(240,260),(260,269.9)]
tables=[]
for lo,hi in bins:
    grid=np.geomspace(lo,hi,5001);components=[]
    for A,M,f in xe['iso']:
        ma=xe['mass'](M)
        ys=np.array([xe['ds'](float(E),A,ma) for E in grid])
        components.append((ma,f,cumulative_trapezoid(ys,grid,initial=0)))
    tables.append((grid,components))
norm=sum(f*c[-1] for _,components in tables[5:] for ma,f,c in components)
def response(v):
    vals=[]
    for (lo,hi),(grid,components) in zip(bins,tables):
        val=np.zeros(len(v))
        for ma,f,cum in components:
            mu=100*ma/(100+ma);emax=2*mu*mu*v*v/ma*1e6
            val+=f*np.interp(np.clip(emax,lo,hi),grid,cum)
        vals.append(val/norm*(vi/v)**2)
    return np.array(vals)
reference=xe['coefficient'](200,269.9);checks=[]
for speed in [100,250,500,650,776]:
    xe['v']=speed/299792.458
    direct=np.array([xe['coefficient'](lo,hi)/reference for lo,hi in bins])
    tab=response(np.array([xe['v']]))[:,0]
    err=float(np.max(np.abs(tab-direct)/np.maximum(np.abs(direct),1e-12)))
    assert err<1e-4,(speed,err)
    checks.append(dict(speed_kms=speed,max_relative_error=err))
xe['v']=vi
def summary(y):
    return dict(mean=float(y.mean()),se=float(y.std(ddof=1)/np.sqrt(len(y))),
        ess=float(y.sum()**2/(y@y)) if y@y else 0,max_share=float(y.max()/y.sum()) if y.sum() else 0)
rows=[]
for i,r in enumerate(receipt['rows']):
    far=data[f'run{i}_status']==1;v=data[f'run{i}_speed'];cos=data[f'run{i}_cosine'];w=data[f'run{i}_weight']
    K=ns['branch']['unattenuated_reference_count']*ns['a']*r['scale']
    values=np.zeros((len(bins),len(v)))
    assert np.all(cos[far]>0)
    values[:,far]=K*response(v[far])*w[far]/cos[far]
    row=dict(run=i,scale=r['scale'],bins=[summary(y) for y in values],
        low_5p4_200=summary(values[1:5].sum(axis=0)),high_200_269p9=summary(values[5:].sum(axis=0)))
    rows.append(row);print(json.dumps({k:row[k] for k in ['run','scale','low_5p4_200','high_200_269p9']}),flush=True)
out=dict(status='raw_weighted_full_window_screen_not_detector_prediction',bins_keV=bins,
    archive_sha256=receipt['archive_sha256'],interpolation_checks=checks,rows=rows,
    limitations=['Raw true recoil bins; no energy migration or acceptance','Rare weights can invalidate apparent precision',
       'Thin-target planar crossing-to-volume conversion; not finite detector transport',
       'Same slab, Born and material assumptions','No captured population or measurable shared point'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
