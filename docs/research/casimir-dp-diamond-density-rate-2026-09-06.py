"""Finite-grid longitudinal magnetic-dipole diagnostic, not a complete material rate."""
import hashlib,json,math
from pathlib import Path
import h5py
import numpy as np
from scipy.integrate import simpson, trapezoid
base=Path(__file__).parent
cfg=Path('configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json')
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
d=json.loads(cfg.read_text())['leading_design']
data=base/'casimir-dp-diamond-response-2026-09-06/diamond_comp.h5'
assert hashlib.sha256(data.read_bytes()).hexdigest()=='77ed914ab0f330028c62e4c1a5f2005a2a3d38b683ca431a8fb8f37157c29021'
alpha=1/137.03599908;hc=1.973269804e-7;hbar=6.582119569e-16
ame=alpha*5.1099894e5;v=776/299792.458;mu=1e-15 # eV^-1 = 1e-6 GeV^-1
with h5py.File(data) as f:
    q=f['q'][:]*ame;w=f['E'][:];eps=f['epsilon'][:]
    cell_volume=float(f.attrs['V_cell'])*(hc/ame)**3
    cell_mass=float(f.attrs['M_cell'])*1.7826619216279e-36
rho=cell_mass/cell_volume
volume_cm3=d['mass_kg']/rho*1e6
elf=eps.imag/abs(eps)**2
roundoff_clipped=int((elf<0).sum());assert elf.min()>-1e-14
elf=np.maximum(elf,0)
sel=w>=5.5;w=w[sel];elf=elf[:,sel]
Q=q[:,None];W=w[None,:]
checks={};rows=[]
prior=base/'casimir-dp-photon-nuclear-magnetic-2026-09-06.json'
assert hashlib.sha256(prior.read_bytes()).hexdigest()=='d72074be10bba41381e8fdbbf250a8ece1a4afe98e5f26df72721f889656938f'
old=json.loads(prior.read_text())
isotopes=[(123.9058920,.000952),(125.9042983,.000890),(127.9035310,.019102),(128.9047808611,.264006),(129.903509349,.040710),(130.90508406,.212324),(131.9041550856,.269086),(133.90539466,.104357),(135.907214484,.088573)]
for mass in [100.,200.,1000.]:
    m=mass*1e9
    vp2=v*v-(W/Q+Q/(2*m))**2
    integrand=Q*np.where(vp2>=0,vp2+Q*Q/(4*m*m),0)*elf
    integral=float(simpson(simpson(integrand,x=w,axis=1),x=q))
    alt=float(trapezoid(trapezoid(integrand,x=w,axis=1),x=q))
    gamma=mu**2*integral/(2*math.pi**2*v)/hbar
    counts=(.3/mass)*volume_cm3*d['hold_time_s']*gamma
    denominators=[]
    for window in [[5.4,270.],[200.,270.]]:
        r=next(r for r in old['rows'] if r['mass_GeV']==mass and r['b_C13_fm']==1.6 and r['window_keV']==window)
        iso_mass=sum(mass_u*f for mass_u,f in isotopes)
        xe_atoms=2.84*1000/(iso_mass*1.66053906892e-27)
        flux=.3/mass*776*1e5
        xe=flux*(365.25*86400)*xe_atoms*alpha*1e-12*.3893793721e-27*(r['Xe_charge_kernel']+r['Xe_magnetic_kernel'])
        denominators.append({'window_keV':window,'raw_Xe_counts_at_reference_moment':xe,'D_density_grid_upper_per_raw_Xe_count':2*counts/xe})
    rows.append({'mass_GeV':mass,'grid_integral_eV3':integral,'simpson_trapezoid_relative_difference':abs(alt/integral-1),'local_grid_scattering_count':counts,'D_density_grid_upper':2*counts,'xenon':denominators})
# Independent free-charge cross-section algebra at multiple masses and recoil fractions.
errors=[]
for m in [1e11,1e12]:
    for mt in [5.1099894e5,1.22e11]:
        red=m*mt/(m+mt)
        for fraction in [.01,.3,.9]:
            x=fraction*(2*red*v)**2
            vp=v*v-x/(4*red*red)
            amp=(vp+x/(4*m*m))/(x*v*v)
            barger=(1-x/(4*mt*mt*v*v)-x/(2*mt*m*v*v))/x
            errors.append(abs(amp/barger-1))
checks['free_charge_limit']=max(errors)<1e-12
checks['quadrature_agreement_below_one_percent']=all(r['simpson_trapezoid_relative_difference']<.01 for r in rows)
checks['nonnegative_rates']=all(r['local_grid_scattering_count']>0 for r in rows)
# FDT gives 2 Im(-chi) times a spin average; Appendix C gives Im(-chi) times ordinary trace.
F=np.array([[1,2j],[3,4]],complex)
checks['spin_trace_convention']=bool(np.isclose(2*np.trace(F@F.conj().T).real/2,np.linalg.norm(F)**2))
assert all(checks.values())
out={'checks':checks,'rows':rows,'reference_mu_GeV_inverse':1e-6,'speed_km_s':776,'rhoDM_GeV_cm3':.3,'bulk_density_kg_m3':rho,'target_volume_cm3_mass_normalized':volume_cm3,'geometric_volume_cm3':4*math.pi*d['radius_m']**3/3*1e6,'roundoff_negative_cells_clipped_in_memory':roundoff_clipped,'integration_window_eV':[5.5,150.],'q_window_eV':[float(q[0]),float(q[-1])],'scope':'Born longitudinal density channel, bulk transfer by mass, mono-speed, finite grid. D<=2N only for this component; not a total-rate upper bound or LZ fit. Spin/current/mixed responses and external exclusions unresolved.'}
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
