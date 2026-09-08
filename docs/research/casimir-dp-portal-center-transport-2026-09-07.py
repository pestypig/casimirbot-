"""Collisionless spherical-center mass-well transport diagnostic."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
src=base/'casimir-dp-portal-matched-density-2026-09-06.json'
assert hashlib.sha256(src.read_bytes()).hexdigest()=='2342070b54b1cce63ad4cda9947068d293fb32fd55c07132eaa257df1186d4b8'
p=json.loads(src.read_text());bgsrc=base/'casimir-dp-portal-spherical-chamber-2026-09-06.json'
assert hashlib.sha256(bgsrc.read_bytes()).hexdigest()=='e33690bdcb47b37b8953912893c62337250a99ed4fbeddc692e168e50795f01f'
bg=json.loads(bgsrc.read_text());parent=base/'casimir-dp-photon-shared-halo-2026-09-06.py'
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='23a3cdfd24c5dfe608558285176c9829ec1d0af66b70d451f676d8470cba2542'
mod={'__file__':str(parent)};exec(compile(parent.read_text().split('\nrows=[]')[0],str(parent),'exec'),mod)
h=mod['scenarios']['central'];pdf=mod['pdf'];vmax=(h[1]+h[2])/299792.458;split=(h[1]-h[2])/299792.458
eta=quad(lambda v:float(pdf(v,h))/v,0,vmax,points=[split],epsabs=1e-9)[0]
rows=[];errors=[]
for r in [r for r in bg['rows'] if r['thickness_um']==1000 and r['radius_um'] in [250.,1000.]]:
    u=r['central_field_fraction'];well=.5*p['a_chi_GeV_inverse']*(1-u*u) # phi_vac=1 GeV
    for mass in [100.,200.,1000.]:
        boost=math.sqrt(2*well/mass);wmax=math.sqrt(vmax*vmax+boost*boost)
        enhancement=quad(lambda v:float(pdf(v,h))*math.sqrt(v*v+boost*boost)/v,0,vmax,points=[split],epsabs=1e-10)[0]
        def plocal(w):
            v=math.sqrt(max(0,w*w-boost*boost))
            return float(pdf(v,h))*w*w/(v*v) if v>0 else 0.
        local_eta=quad(lambda w:plocal(w)/w,boost,wmax,points=[math.sqrt(split*split+boost*boost)],epsabs=1e-8)[0]
        errors.append(abs(local_eta/eta-1))
        frac=quad(lambda v:float(pdf(v,h))/v,0,min(boost,vmax),epsabs=1e-10)[0]/eta
        rows.append({'cavity_radius_um':r['radius_um'],'wall_thickness_um':1000,'mass_GeV_at_infinity':mass,'mass_well_keV':well*1e6,'mass_fraction_change':well/mass,'minimum_local_speed_km_s':boost*299792.458,'central_unbound_number_density_over_infinity':enhancement,'unnormalized_local_inverse_speed_over_infinity':local_eta/eta,'normalized_local_inverse_speed_over_infinity':local_eta/(eta*enhancement),'fraction_of_far_inverse_speed_moment_below_boost':frac})
checks={'inverse_speed_invariance_direct_local_integral':max(errors)<1e-7,'density_enhancement':all(r['central_unbound_number_density_over_infinity']>=1 for r in rows),'small_mass_change':all(r['mass_fraction_change']<1e-6 for r in rows),'negative_potential_accelerates':all(r['mass_well_keV']>0 and r['minimum_local_speed_km_s']>0 for r in rows)}
assert all(checks.values())
out={'checks':checks,'max_inverse_speed_relative_error':max(errors),'rows':rows,'scope':'Leading nonrelativistic constant-inertial-mass Hamiltonian, collisionless unbound population, spherical smooth mass well, exact center, vacuum at infinity, no obstruction or reflection barrier above exterior potential. Not full wall transport, off-center lensing, bound population or eikonal validity proof.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
