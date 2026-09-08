"""One-body Higgs hadronic sensitivity, retaining independent up-box terms."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
path=Path(__file__).with_name('casimir-dp-axion-assembled-subsets-2026-09-07.py')
assert hashlib.sha256(path.read_bytes()).hexdigest()=='d437f10cac13f73de009c96557d2628a43e4335e03915be2faffca2f030930ad'
a={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),a)
tr=next(r for r in a['tri']['rows'] if r['lambda_PhiH']==.03)
spin=next(r for r in a['t']['spin'] if r['mchi_GeV']==400 and r['B0_GeV']==2.7 and r['b_C13_fm']==1.7 and r['halo']=='central')
halo=a['h']['scenarios']['central']; rows=[]
for fn in [.289,.300,.307,.325]:
    ct=tr['C_tree_GeV_m2']*fn/.3
    common=(tr['C_scalar_triangle_GeV_m2']+tr['C_tree_GeV_m2']*a['psratio'])*fn/.3
    dp=common-a['bp']; dn=common-a['bn']
    full=quad(lambda E:a['xenon'](E,ct,dp,dn,halo,'linear_interference'),5.4,269.9,epsabs=1e-10)[0]
    high=quad(lambda E:a['xenon'](E,ct,dp,dn,halo,'linear_interference'),200,269.9,epsabs=1e-12)[0]
    D=a['local'](ct,dp,dn,halo,'linear_interference')
    rows.append(dict(fn_onebody=fn,Xe_total_full=full+a['spin_scale']*spin['Xe_raw_full'],Xe_total_high=high+a['spin_scale']*spin['Xe_raw_high'],D_free_nuclei_upper=D+a['spin_scale']*spin['D_upper']))
# LO ledger for the old .3 convention only; not a decomposition of higher-order .307.
S=(9*.3-2)/7; heavy=2/9*(1-S)
checks={'LO_light_plus_heavy':math.isclose(S+heavy,.3,rel_tol=1e-14),'three_heavy_flavors':math.isclose(3*2/27*(1-S),heavy,rel_tol=1e-14),'baseline_recovered':math.isclose(rows[1]['Xe_total_full'],1.374501642971214,rel_tol=1e-12),'monotone_sensitivity':all(rows[i]['D_free_nuclei_upper']<rows[i+1]['D_free_nuclei_upper'] for i in range(3))}
assert all(checks.values())
out=dict(scope='Published 2017 one-body input sensitivity, fixed box sigma/PDF inputs, not joint confidence interval',full_model_admitted=False,LO_legacy_light_sum=S,LO_legacy_heavy_sum=heavy,erroneous_duplicate_heavy_scalar_rate_factor=((.3+heavy)/.3)**2,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
