"""Algebraic portal freedom at fixed heavy Xe coefficient and matter screening."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.optimize import brentq
base=Path(__file__).parent
src=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
p=json.loads(src.read_text());an=p['a_N_GeV_inverse'];achi0=p['a_chi_GeV_inverse'];k0=p['kappa_GeV_at_conditional_Higgs_ceiling'];C=an*.1/k0
force=base/'casimir-dp-portal-classical-force-2026-09-06.json'
assert hashlib.sha256(force.read_bytes()).hexdigest()=='0bf3bee006e44e7d832a8ebaf4a969e65590a8ca48daf91f935b2652e92ca062'
f0=next(r['minimum_harmonic_confinement_frequency_Hz'] for r in json.loads(force.read_text())['rows'] if r['cavity_radius_um']==1000 and r['wall_thickness_um']==1000)
v=246.2;yn=.3*.939/v;mh=125.;mS=1000.
def point(b):
    off=b*v;hh=mh**2+off**2/(mS**2-mh**2);A=np.array([[mS*mS,off],[off,hh]])
    vals,vecs=np.linalg.eigh(A);K=np.linalg.inv(A);kappa=an/(-yn*K[0,1]);ychi=C/(yn*K[0,1]);achi=-kappa*ychi*K[0,0]
    delta=kappa*kappa*K[0,0]/2;scale=achi/achi0;cos2=float(vecs[1,0]**2);width=(kappa*vecs[0,0])**2/(32*math.pi*mh);signal=cos2*width/(cos2*.0041+width)
    return {'b_GeV':b,'kappa_GeV':float(kappa),'y_chi':float(ychi),'a_chi_GeV_inverse':float(achi),'a_N_GeV_inverse_recovered':float(-kappa*yn*K[0,1]),'C_chiN_recovered':float(ychi*yn*K[0,1]),'lambda_threshold_shift':float(delta),'lambda_effective_for_same_light_product':float(1e-24*scale),'force_curvature_relative_to_original':float(1/scale),'required_confinement_frequency_Hz':float(f0/math.sqrt(scale)),'conditional_Higgs_invisible_signal':float(signal),'passes_conditional_Higgs_screen':bool(signal<=.107*(1+1e-12)),'y_squared_over_4pi':float(ychi*ychi/(4*math.pi)),'threshold_over_4pi':float(delta/(4*math.pi))}
bmin=brentq(lambda b:point(b)['y_squared_over_4pi']-1,1.,10.,xtol=1e-12)
rows=[point(b) for b in [100.,30.,10.,3.,bmin]]
checks={'fixed_matter_screening':all(math.isclose(r['a_N_GeV_inverse_recovered'],an,rel_tol=1e-12) for r in rows),'fixed_heavy_Xe_coefficient':all(math.isclose(r['C_chiN_recovered'],C,rel_tol=1e-12) for r in rows),'light_product_preserved':all(math.isclose(r['a_chi_GeV_inverse']/r['lambda_effective_for_same_light_product'],achi0/1e-24,rel_tol=1e-12) for r in rows),'declared_yukawa_boundary_solved':math.isclose(rows[-1]['y_squared_over_4pi'],1,rel_tol=1e-10)}
assert all(checks.values())
out={'checks':checks,'declared_diagnostic_domain':'|ychi|^2 <= 4pi and Delta lambda <= 4pi; heuristic perturbative domain, not a theorem or global experimental bound','rows':rows,'scope':'Fixed b-positive physical-Higgs tree family; CchiN and aN fixed, light vertex product held by lambda rescaling. Same normalized background/operator and tree local scattering potential. Classical force reduces. Coupling boundary is diagnostic; all earlier Higgs, vacuum, loop, transport and apparatus qualifications persist.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
