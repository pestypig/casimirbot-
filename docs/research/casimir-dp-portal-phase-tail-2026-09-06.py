"""Conditional far-trajectory eikonal coherence contribution, fixed chamber dipole."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.integrate import simpson
from scipy.special import j0
base=Path(__file__).parent
parent=base/'casimir-dp-portal-chamber-dipole-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='c47cc89412a60df6441dfcd27285ef1a7ebe1d7a7aa89dd1d8403c16e038a613'
mod={'__file__':str(parent)}
exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
source=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(source.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
p=json.loads(source.read_text());cfg=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];B=d['mass_kg']/1.66053906892e-27
speed=776.;v=speed/299792.458;mass=1000.;flux=.3/mass*speed*1e5;t=d['hold_time_s'];sep=d['branch_separation_m']*1e6
alpha=p['a_chi_GeV_inverse']*p['a_N_GeV_inverse']*(.001e-9)**2/1e-24/(4*math.pi)
def calc(bg,cut,nb=801,nt=120):
    sol,ev,edges=mod['dipole'](bg);hc=mod['hc'];mu=mod['mu'];Rmax=edges[-1]*hc/mu*1e6
    b=np.geomspace(cut,Rmax,nb);nodes,weights=np.polynomial.legendre.leggauss(nt)
    # Split the line integral at material interfaces; derivatives need not be smooth there.
    amplitude=np.zeros_like(b)
    for i,impact in enumerate(b[:-1]):
        boundaries=[0.]+[math.acos(impact/(x*hc/mu*1e6)) for x in edges[1:] if x*hc/mu*1e6>impact]
        integ=0.
        for lo,hi in zip(boundaries[:-1],boundaries[1:]):
            theta=lo+(nodes+1)*(hi-lo)/2;r=impact/np.cos(theta)
            vals=np.array([ev(float(rr))[:2] for rr in r]);integ+=(hi-lo)/2*float(np.dot(weights,vals[:,0]*vals[:,1]*np.cos(theta)))
        amplitude[i]=2*alpha*B/v*bg['central_field_fraction']*sep/impact*integ
    loss=1-j0(amplitude)
    # Avoid roundoff cancellation when phase is very small.
    small=abs(amplitude)<1e-3;z=amplitude[small];loss[small]=z*z/4-z**4/64+z**6/2304
    pref=flux*t*2*math.pi*1e-8 # micrometre^2 -> cm^2
    exact=pref*float(simpson(b*loss,x=b))
    upper=pref*float(simpson(b*np.minimum(2,amplitude**2/4),x=b))
    close=2*flux*t*math.pi*(cut*1e-4)**2
    return {'cavity_radius_um':bg['radius_um'],'wall_thickness_um':bg['thickness_um'],'impact_cut_um':cut,'D_far_transverse_leading_dipole':exact,'D_far_any_orientation_leading_dipole_upper':upper,'D_close_geometric_upper':close,'conditional_sum_upper':upper+close,'max_phase_amplitude_rad':float(max(abs(amplitude)))}
rows=[]
for bg in [r for r in mod['p']['rows'] if r['radius_um'] in [250.,1000.] and r['thickness_um']==1000]:
    for cut in [1.,2.,5.]:rows.append(calc(bg,cut))
bg=next(r for r in mod['p']['rows'] if r['radius_um']==1000 and r['thickness_um']==1000)
ref=calc(bg,2.,nb=1601,nt=200);old=next(r for r in rows if r['cavity_radius_um']==1000 and r['impact_cut_um']==2.)
err=abs(ref['D_far_transverse_leading_dipole']/old['D_far_transverse_leading_dipole']-1)
checks={'integration_refinement':err<2e-4,'phase_envelope_bounds_transverse':all(0<=r['D_far_transverse_leading_dipole']<=r['D_far_any_orientation_leading_dipole_upper']*(1+1e-10) for r in rows),'near_ceiling_area_scaling':math.isclose(rows[1]['D_close_geometric_upper']/rows[0]['D_close_geometric_upper'],4,rel_tol=1e-12)}
assert all(checks.values())
out={'checks':checks,'refinement_relative_change':err,'alpha_vacuum':alpha,'speed_km_s':speed,'mass_GeV':mass,'lambda_effective_assumed':1e-24,'rows':rows,'scope':'Mono-speed unattenuated straight trajectories, symmetric branch displacement to first order, static propagator and point-source tail. Near disk has normalized-overlap bound only; no finite-displacement error bound, full transport, halo average or accepted-shot prediction.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
