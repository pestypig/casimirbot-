"""Separate high-energy atmospheric contribution, without Earth transport."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from numpy.polynomial.legendre import leggauss
base=Path(__file__).parent
def definitions(name,sha,split):
    path=base/(name+'-2026-09-07.py')
    assert hashlib.sha256(path.read_bytes()).hexdigest()==sha
    ns={'__file__':str(path)}
    exec(compile(path.read_text().split(split)[0],str(path),'exec'),ns)
    return ns
h=definitions('casimir-dp-neutrino-highflux-intake','025b5bfb740bf495738e5c15b71ad1f6df46d79b1bfe9974ccb86d616dc0b5f8','\n# Deliberately')
j=definitions('casimir-dp-neutrino-flux-survival','c78a708ca9c36287b96c31108bb5b7c159a3bb846dcc69c2dd6fdda3fe650e19','\nrows=[]')
tables=h['tables']['H3a_SIBYLL23C']
zmin=max(f.extents[2] for f in tables.values())
x,w=leggauss(64);z=(1+zmin)/2+(1-zmin)/2*x
def angular(E):
    return sum(f.evaluate(E,z) for f in tables.values())@w*(1-zmin)/2*4*math.pi
lgrid=np.linspace(math.log(1e3),math.log(1e8),1001)
highlog=PchipInterpolator(lgrid,np.log(angular(np.exp(lgrid))),extrapolate=False)
dunelog=j['a']['logflux']
overlap=[]
for E in [1e3,2e3,5e3,1e4]:
    hf=float(angular([E])[0]);df=math.exp(float(dunelog(math.log(E))))
    overlap.append(dict(E_GeV=E,nuflux_off_horizon_all_six=hf,DUNE_all_sky_four_species=df,ratio_nonidentical_support=hf/df))
rows=[];refinement=[]
for r in j['decays']:
    m=r['mchi_GeV'];med=r['mediator_GeV'];width=r['width_GeV']['mean']
    for path in [.001,.01,.1]:
        j['a']['logflux']=dunelog
        low=j['counts'](m,med,width,path)
        j['a']['logflux']=highlog
        bins=[]
        for elo,ehi in [(1e4,1e5),(1e5,1e6),(1e6,1e7),(1e7,1e8)]:
            value=j['counts'](m,med,width,path,elo=elo,ehi=ehi)
            bins.append(dict(Emin_GeV=elo,Emax_GeV=ehi,surviving_unattenuated_both_hemispheres=value))
        high=sum(b['surviving_unattenuated_both_hemispheres'] for b in bins)
        if path==.1:
            fine=j['counts'](m,med,width,path,elo=1e4,ehi=1e8,nT=128,nE=256)
            refinement.append(abs(fine/high-1))
        rows.append(dict(mchi_GeV=m,mediator_GeV=med,path_m=path,
                         DUNE_surviving_below_10TeV=low,
                         NuFlux_surviving_10TeV_to_100PeV_unattenuated=high,
                         NuFlux_downward_half_same_assumptions=high/2,
                         separate_high_over_previous_low=high/low,energy_bins=bins))
# Check interpolation at fresh points against direct angular spline evaluation.
probe=np.geomspace(1.001e4,9.999e7,113)
interp=float(np.max(abs(np.exp(highlog(np.log(probe)))/angular(probe)-1)))
checks={'positive_finite_contributions':all(r['NuFlux_surviving_10TeV_to_100PeV_unattenuated']>0 and math.isfinite(r['separate_high_over_previous_low']) for r in rows),
        'energy_recoil_quadrature':max(refinement)<1e-4,
        'interpolation_direct_comparison':interp<1e-4,
        'longer_path_fewer_survivors':all(rows[i]['NuFlux_surviving_10TeV_to_100PeV_unattenuated']>rows[i+1]['NuFlux_surviving_10TeV_to_100PeV_unattenuated'] for i in [0,1,3,4,6,7])}
assert all(checks.values()),checks
out=dict(scope='Separated atmospheric high-energy contribution, omitted horizon belt, no Earth transport or astrophysical flux; no calibrated splice or accepted-event prediction',
         full_model_admitted=False,checks=checks,max_quadrature_relative=max(refinement),max_interpolation_relative=interp,overlap=overlap,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'overlap':overlap,'path10cm':[r for r in rows if r['path_m']==.1]},indent=2))
