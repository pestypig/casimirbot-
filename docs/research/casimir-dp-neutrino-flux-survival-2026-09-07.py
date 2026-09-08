"""Fixed-path flux-weighted survival; not an LZ accepted-event prediction."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from numpy.polynomial.legendre import leggauss
base=Path(__file__).parent
parent=base/'casimir-dp-neutrino-joint-2026-09-07.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='6aba082f04ff4f616161e109df1c642e087656fc61ded72a3f9768d4ef5ecdf3'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),a)
source=base/'casimir-dp-neutrino-dispersive-basis-2026-09-07.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='5f3de5f12ed351d9fef08fa3c16fdc72236dc9caf277398892f3f83fa465b3f5'
decays=[r for r in json.loads(source.read_text())['rows'] if r['mass_prescription']=='source_common_mass']
p=a['p'];hc=1.973269804e-16

def counts(m,med,width,path,lo=202.,hi=269.9,elo=.01,ehi=1e4,nT=80,nE=128):
    tx,tw=leggauss(nT);ex,ew=leggauss(nE)
    Ts=(hi+lo)/2+(hi-lo)/2*tx
    total=0.
    for A,atomic,f in p['iso']:
        M=atomic*.93149410242-54*.00051099895
        for Tk,wT in zip(Ts,tw):
            T=Tk*1e-6;low=max(elo,a['emin'](T,M,m))
            if low>=ehi:continue
            llo=math.log(low);lhi=math.log(ehi)
            lE=(lhi+llo)/2+(lhi-llo)/2*ex;E=np.exp(lE)
            boost=np.sqrt(np.maximum(0.,(E-T)**2-m*m))/m
            survival=np.exp(-path*width/(hc*boost))
            integral=(lhi-llo)/2*np.dot(ew,np.exp(a['logflux'](lE)-lE)*survival)
            total+=f*wT*a['coefficient'](T,M,m,A,54,med)*integral
    return float(total*(hi-lo)/2*1e-6*p['xe_atoms']*p['year'])

rows=[];tails=[];errors=[]
for r in decays:
    m=r['mchi_GeV'];med=r['mediator_GeV'];w=r['width_GeV']
    raw=counts(m,med,0.,0.)
    errors.append(abs(raw/a['xe'](202.,269.9,m,med)-1))
    for path in [0.,.001,.01,.1]:
        c=counts(m,med,w['mean'],path)
        rows.append(dict(mchi_GeV=m,mediator_GeV=med,hypothetical_path_m=path,
                         raw_production=raw,surviving_count_at_mean_slice_width=c,
                         surviving_fraction_at_mean_slice_width=c/raw,
                         count_at_minimum_sample_width=counts(m,med,w['minimum'],path),
                         count_at_maximum_sample_width=counts(m,med,w['maximum'],path)))
    for low,high in [(0.01,10.),(10.,100.),(100.,1000.),(1000.,5000.),(5000.,10000.)]:
        tails.append(dict(mchi_GeV=m,mediator_GeV=med,Emin_GeV=low,Emax_GeV=high,
                          raw_count=counts(m,med,0.,0.,elo=low,ehi=high),
                          surviving_count_path_10cm=counts(m,med,w['mean'],.1,elo=low,ehi=high)))

ref=decays[1];m=ref['mchi_GeV'];med=ref['mediator_GeV'];w=ref['width_GeV']['mean']
coarse=counts(m,med,w,.1);fine=counts(m,med,w,.1,nT=128,nE=256)
refinement=abs(fine/coarse-1)
checks={
 'zero_width_reproduces_parent':max(errors)<1e-5,
 'survival_between_zero_and_production':all(0<=r['surviving_count_at_mean_slice_width']<=r['raw_production']*(1+1e-12) for r in rows),
 'width_ordering':all(r['count_at_maximum_sample_width']<=r['surviving_count_at_mean_slice_width']*(1+1e-12) and r['surviving_count_at_mean_slice_width']<=r['count_at_minimum_sample_width']*(1+1e-12) for r in rows),
 'quadrature_refinement':refinement<1e-4,
 'energy_partition':all(abs(sum(t['surviving_count_path_10cm'] for t in tails if t['mchi_GeV']==r['mchi_GeV'] and t['mediator_GeV']==r['mediator_GeV'])/r['surviving_count_at_mean_slice_width']-1)<1e-4 for r in rows if r['hypothetical_path_m']==.1)
}
assert all(checks.values()),checks
checks={k:bool(v) for k,v in checks.items()}
out=dict(scope='Conditional survival in flight for fixed prescribed paths and narrow-slice widths; source flux truncated at 10 TeV; no detector geometry, secondary transport, acceptance or total hadronic uncertainty',
         full_model_admitted=False,true_recoil_window_keV=[202.,269.9],checks=checks,
         zero_width_parent_max_relative_difference=max(errors),quadrature_relative_difference=refinement,rows=rows,energy_bins=tails)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'refinement':refinement,'path10cm':[r for r in rows if r['hypothetical_path_m']==.1],'energy_bins':tails},indent=2))
