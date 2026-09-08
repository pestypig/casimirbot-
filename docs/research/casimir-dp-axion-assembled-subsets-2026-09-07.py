"""Conditional common-scale contact assembly; not complete UV matching."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
def read(name,digest):
    path=base/(name+'-2026-09-07.json')
    assert hashlib.sha256(path.read_bytes()).hexdigest()==digest
    return json.loads(path.read_text())
path=base/'casimir-dp-axion-tree-companions-2026-09-07.py'
assert hashlib.sha256(path.read_bytes()).hexdigest()=='ef78e9d39deae17717c1d31d8d3b7f47a864fa2d6abafed1a9c0a4b28d95fd93'
t={'__file__':str(path)}
exec(compile(path.read_text().split('\nrows=[]')[0],str(path),'exec'),t)
pdf=read('casimir-dp-axion-pdf-moments','f61f1170f13b4c661b56d217fe55aa4630b24f62766fc1cb6a9e8479bffbb7d7')
tri=read('casimir-dp-axion-scalar-triangle','24111de38ca0319f05d97daf23bef40d8f7798d9d2087f3a9814775bb7ab2844')
ps=read('casimir-dp-axion-triangle-subset','d4e8b433d714fba50cdb10c8d647de8a80c71d1196643b7c1d1e64ae7744639a')
box=read('casimir-dp-axion-dirac-box','9fe74018a72ee93985d9300a65289447d102cd6e2206da0400738e51ced1437a')
p=t['p']; h=t['h']; mass=400.; scale=2.16749
mom=next(r for r in pdf['rows'] if r['Q_GeV']==scale)
# Explicit phenomenological boundary, not a derived UV matching scale.
# Potential coefficients are MINUS the box effective-Lagrangian coefficients.
bp=box['C_u_scalar_GeV_m3']*.017+.75*.939*box['twist_combination_GeV_m3']*mom['up_plus']
bn=box['C_u_scalar_GeV_m3']*.015+.75*.939*box['twist_combination_GeV_m3']*mom['down_plus']
psratio=next(r['triangle_over_tree'] for r in ps['rows'] if r['q_GeV']==0 and r['kappa_A']==0)
spin_scale=((400/294)/1.36)**2
def weight(A,Z,ct,dp,dn,mode):
    a0=A*ct; delta=Z*dp+(A-Z)*dn
    return (a0+delta)**2 if mode=='squared_subset' else a0*a0+2*a0*delta
def xenon(E,ct,dp,dn,halo,mode):
    total=0.
    for A,atomic,f in p['iso']:
        ma=atomic*.93149410242-54*.00051099895; mu=mass*ma/(mass+ma)
        q=math.sqrt(2*ma*E*1e-6)
        total+=f*ma*1e-6*t['form'](q,A)**2*weight(A,54,ct,dp,dn,mode)*t['eta'](q/(2*mu)*t['ckm'],*halo)
    return total/(2*math.pi)*p['conv']*.3/mass*t['ckm']**2*1e5*p['year']*p['xe_atoms']
def local(ct,dp,dn,halo,mode):
    mean=quad(lambda v:v*h['pdf'](v,*halo),0,halo[1]+halo[2],points=[halo[1]-halo[2]])[0]*1e5
    total=0.
    for A,atomic,f in [(12,12.,1-p['f13']),(13,13.00335483507,p['f13'])]:
        ma=atomic*.93149410242-6*.00051099895; mu=mass*ma/(mass+ma)
        total+=p['nc']/p['f13']*f*mu*mu*weight(A,6,ct,dp,dn,mode)
    return 2*total/math.pi*p['conv']*.3/mass*mean*p['d']['hold_time_s']
rows=[]
for tr in tri['rows']:
    lam=tr['lambda_PhiH']; ct=tr['C_tree_GeV_m2']
    common=tr['C_scalar_triangle_GeV_m2']+ct*psratio
    dp=common-bp; dn=common-bn
    for halo_name,halo in h['scenarios'].items():
        old=next(r for r in t['spin'] if r['mchi_GeV']==mass and r['B0_GeV']==2.7 and r['b_C13_fm']==1.7 and r['halo']==halo_name)
        for mode in ['linear_interference','squared_subset']:
            full=quad(lambda E:xenon(E,ct,dp,dn,halo,mode),5.4,269.9,epsabs=1e-10)[0]
            high=quad(lambda E:xenon(E,ct,dp,dn,halo,mode),200,269.9,epsabs=1e-12)[0]
            d=local(ct,dp,dn,halo,mode)
            rows.append(dict(lambda_PhiH=lam,halo=halo_name,mode=mode,Cp_potential_GeV_m2=ct+dp,Cn_potential_GeV_m2=ct+dn,Xe_scalar_full=full,Xe_total_full=full+spin_scale*old['Xe_raw_full'],Xe_total_high=high+spin_scale*old['Xe_raw_high'],D_free_nuclei_upper=d+spin_scale*old['D_upper']))
halo=h['scenarios']['central']; ct=t['C'](.03,mass)
checks={
 'isoscalar_contact_limit':math.isclose(local(ct,0,0,halo,'squared_subset'),t['local_upper'](mass,.03,halo),rel_tol=1e-12),
 'nuclear_amplitude_explicit':math.isclose(weight(131,54,ct,1e-12,-2e-12,'squared_subset'),(54*(ct+1e-12)+77*(ct-2e-12))**2,rel_tol=1e-12),
 'positive_nested_windows':all(0<r['Xe_total_high']<r['Xe_total_full'] and r['D_free_nuclei_upper']>0 for r in rows),
 'squared_minus_linear_is_delta_squared':math.isclose(weight(12,6,ct,1e-12,-2e-12,'squared_subset')-weight(12,6,ct,1e-12,-2e-12,'linear_interference'),(6e-12-12e-12)**2,rel_tol=1e-9)}
assert all(checks.values())
result=dict(scope='Q=0 scalar loop contact assembly; one prescribed hadronic boundary; independent free nuclei only',full_model_admitted=False,matching_scale_GeV=scale,matching_scale_status='assumed LO boundary, not UV-derived',kappa_A=0,box_Lagrangian_proton_GeV_m2=bp,box_Lagrangian_neutron_GeV_m2=bn,exact_gchi_spin_rate_factor=spin_scale,checks=checks,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(result,indent=2)+'\n')
print(json.dumps({**{k:v for k,v in result.items() if k!='rows'},'central_lambda03':[r for r in rows if r['halo']=='central' and r['lambda_PhiH']==.03]},indent=2))
