import hashlib,json,math
from pathlib import Path
import numpy as np
base=Path(__file__).parent
src=base/'casimir-dp-portal-higgs-decay-screen-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='80b833d29116dbecfd6a8e436af383feb38c003d931349db6a9ca023792685fc'
p=next(r for r in json.loads(src.read_text())['rows'] if r['b_GeV']==100 and r['SM_width_benchmark_GeV']==.0041)
k=p['kappa_upper_GeV_under_assumptions'];v=246.2;mn=.939;yn=.3*mn/v
A=np.array([[1000.**2,100*v],[100*v,p['matched_h_diagonal_GeV']**2]])
K=np.linalg.inv(A);an=-k*yn*K[0,1];achi=k*.1*K[0,0];shift=k*k*K[0,0]/2
hc=1.973269804e-16
# kg/m^3 to GeV^4; nucleon-density approximation nN=rho/mN.
convert=hc**3/1.7826619216279e-27
cfg=base.parent.parent/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design'];rhoC=d['mass_kg']/(4*math.pi*d['radius_m']**3/3)
x2=an*rhoC*convert/mn*(d['radius_m']/hc)**2
rows=[];errors=[]
for rho in [2700.,2900.,3100.]:
    s=an*rho*convert/mn
    for muev in [.0001,.001,.003,.01]:
        mu=muev*1e-9;r=s/mu**2;restored=bool(r>1)
        w=1/math.sqrt(2*r) if restored else None
        wall=math.tanh(mu*1e-5/(math.sqrt(2)*hc)+math.atanh(w)) if restored else None
        if restored:
            # First-integral matching in units mu^4/lambda, no shooting fit.
            errors.append(abs((r-1)*w*w/2+w**4/4-(1-w*w)**2/4))
        rows.append({'density_kg_m3_benchmark':rho,'mu_eV':muev,'density_over_critical':r,'bulk_restored':restored,'bulk_decay_length_m':hc/math.sqrt(s-mu*mu) if restored else None,'single_wall_surface_phi_over_vacuum':w,'phi_over_vacuum_10um_from_single_wall':wall,'vacuum_alpha_at_lambda_1e_minus24':achi*an*mu*mu/1e-24/(4*math.pi),'local_alpha_10um_at_lambda_1e_minus24':achi*an*mu*mu/1e-24/(4*math.pi)*wall**2 if restored else None})
checks={'matching_identity':math.isclose(achi*an,2*shift*p['C_chiN_GeV_inverse_squared'],rel_tol=1e-12),'finite_wall_first_integral':max(errors)<1e-12,'weak_sphere_size_parameter':x2<.1,'surface_and_exterior_ordered':all(0<r['single_wall_surface_phi_over_vacuum']<r['phi_over_vacuum_10um_from_single_wall']<1 for r in rows if r['bulk_restored'])}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out={'checks':checks,'kappa_GeV_at_conditional_Higgs_ceiling':k,'a_N_GeV_inverse':an,'a_chi_GeV_inverse':achi,'M_N_equivalent_GeV':math.sqrt(mn/an),'lambda_threshold_shift':shift,'sphere_density_size_parameter':x2,'Xe_mu_critical_eV_at_2900':math.sqrt(an*2900*convert/mn)*1e9,'rows':rows,'scope':'Tree matching; nucleon-density approximation; semi-infinite single wall with empty exterior, no canonical cavity geometry. Lambda examples illustrative, not admitted; thermal, QCD/species, loop, transport and three-field vacuum corrections unresolved.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in out.items() if k!='rows'},'central_density':[r for r in rows if r['density_kg_m3_benchmark']==2900]},indent=2))

