"""Selected heavy-messenger EFT insertions, leading three-flavor trace anomaly."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
def get(name,digest):
    path=base/(name+'-2026-09-07.json')
    assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
    return json.loads(path.read_text())
heavy=get('casimir-dp-axion-heavy-gluon-threshold','a4bb70f393d8a369e3d43bacf4750b16ee4ebf966614b7ebfd764908153f1101')
path=base/'casimir-dp-axion-triangle-subset-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='498c8b3245c6e43cea92e1424a5164df421d6cf04079ce525f75195495a80e8a'
s={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),s)
path=base/'casimir-dp-axion-assembled-subsets-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='d437f10cac13f73de009c96557d2628a43e4335e03915be2faffca2f030930ad'
a={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),a)
fTG=.9; mn=.939; v=246.2
trace=-8/9*mn*fTG
delta_fn=-v*heavy['Kh_GeV_m1']*trace/mn
rows=[]
for q in [0.,.05,.246]:
    # Replacing -g_aa s a^2/2 by +Kaa a^2 OG sets g_aa s=-2Kaa OG.
    Cg=-heavy['Kaa_GeV_m2']*s['g']**2*s['mx']*s['I'](q)/(8*math.pi**2)
    Cpotential=-Cg*trace
    hpotential=s['tree'](q)*delta_fn/.3
    rows.append(dict(Q_GeV=q,Cg_Lagrangian_GeV_m3=Cg,Caa_potential_GeV_m2=Cpotential,Ch_potential_GeV_m2=hpotential,total_over_tree=(Cpotential+hpotential)/s['tree'](q)))
tr=next(r for r in a['tri']['rows'] if r['lambda_PhiH']==.03)
ct=tr['C_tree_GeV_m2']; common=tr['C_scalar_triangle_GeV_m2']+ct*a['psratio']
halo=a['h']['scenarios']['central']
spin=next(r for r in a['t']['spin'] if r['mchi_GeV']==400 and r['B0_GeV']==2.7 and r['b_C13_fm']==1.7 and r['halo']=='central')
forecasts=[]
for include in [False,True]:
    extra=rows[0]['Caa_potential_GeV_m2']+rows[0]['Ch_potential_GeV_m2'] if include else 0.
    dp=common-a['bp']+extra;dn=common-a['bn']+extra
    full=quad(lambda E:a['xenon'](E,ct,dp,dn,halo,'linear_interference'),5.4,269.9,epsabs=1e-10)[0]
    D=a['local'](ct,dp,dn,halo,'linear_interference')
    forecasts.append(dict(include_selected_messenger_terms=include,Xe_total_full=full+a['spin_scale']*spin['Xe_raw_full'],D_free_nuclei_upper=D+a['spin_scale']*spin['D_upper']))
checks={'single_SM_heavy_flavor_trace_normalization':math.isclose(-v*(1/(12*v))*trace/mn,2/27*fTG,rel_tol=1e-14),'Higgs_shift_matches_heavy_fraction':math.isclose(delta_fn,heavy['Kh_over_one_SM_heavy_quark_Higgs_coefficient']*2/27*fTG,rel_tol=1e-14),'opposite_insertion_signs':all(r['Caa_potential_GeV_m2']<0<r['Ch_potential_GeV_m2'] for r in rows),'baseline_recovered':math.isclose(forecasts[0]['Xe_total_full'],1.374501642971214,rel_tol=1e-12)}
assert all(checks.values())
out=dict(scope='Selected messenger EFT insertions with LO scalar trace matching; not full two-loop matching',full_model_admitted=False,fTG_assumed=fTG,delta_fn_messenger=delta_fn,checks=checks,rows=rows,contact_linear_interference_forecasts=forecasts)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
