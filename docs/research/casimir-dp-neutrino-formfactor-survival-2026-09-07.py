"""Necessary dipion form-factor suppression for a specified survival probability.

No empirical form factor, detector acceptance, or physical lifetime bound supplied.
"""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad

parent=Path(__file__).with_name('casimir-dp-neutrino-dipion-slice-2026-09-07.py')
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='4a4709332a53e58ded508f61f04a75d31c32662d4ecbbdb3bbdb2fb123a47484'
ns={}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),ns)
density=ns['density']; mpi=ns['mpi']; hc=ns['hc']

def width(m,med,formfactor):
    # formfactor returns Gamma_pi(s)/m_pi^2, including its absolute normalization.
    return quad(lambda s:density(s,m,med,.02*med,.02*med)*abs(formfactor(s))**2,
                4*mpi**2,.35**2,epsabs=1e-24,epsrel=1e-10)[0]

def necessary_weight(ell_lo,path,probability):
    if not (ell_lo>0 and path>0 and 0<probability<1):
        raise ValueError('positive lengths and probability strictly between zero and one required')
    return -math.log(probability)*ell_lo/path

rows=[]
for m,med in [(1.,1.),(1.,10.),(2.,10.)]:
    w=width(m,med,lambda s:1.)
    for energy in [10.,100.,10000.]:
        ell=hc/w*math.sqrt((energy-.000248)**2-m*m)/m
        limit=necessary_weight(ell,.1,.5)
        rows.append(dict(mchi_GeV=m,mediator_GeV=med,incident_GeV=energy,
                         LO_slice_lab_length_m=ell,hypothetical_path_m=.1,
                         target_survival=.5,max_weighted_abs_F_squared=limit,
                         max_weighted_rms_abs_F=math.sqrt(limit)))
w0=width(1.,10.,lambda s:1.)
checks={
 'complex_amplitude_squared':math.isclose(width(1.,10.,lambda s:complex(.3,.4))/w0,.25,rel_tol=1e-10),
 'probability_inversion':all(math.isclose(math.exp(-r['hypothetical_path_m']*r['max_weighted_abs_F_squared']/r['LO_slice_lab_length_m']),.5,rel_tol=1e-12) for r in rows),
 'path_scaling':math.isclose(necessary_weight(.001,.2,.5)*2,necessary_weight(.001,.1,.5),rel_tol=1e-12),
 'normalization_separate_from_shape':math.isclose(width(1.,10.,lambda s:1.1*(1+s))/width(1.,10.,lambda s:1+s),1.21,rel_tol=1e-10)
}
assert all(checks.values())
out=dict(scope='Necessary survival condition only, conditional on stated dipion kernel and isospin approximation; no dispersive numerical input admitted',
         full_model_admitted=False,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({'checks':checks,'E10_rows':[r for r in rows if r['incident_GeV']==10.]},indent=2))
