"""Isotope-resolved raw recoil benchmark; efficiency=1, no experimental likelihood."""
import csv,hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.special import erf,spherical_jn
from scipy.optimize import brentq
from scipy.integrate import quad
base=Path('docs/research')
source=base/'casimir-dp-inelastic-local-audit-2026-09-06.json'
data=json.loads(source.read_text())
isotopes=[(124,123.9058920,.000952),(126,125.9042983,.000890),(128,127.9035310,.019102),
 (129,128.9047808611,.264006),(130,129.903509349,.040710),(131,130.90508406,.212324),
 (132,131.9041550856,.269086),(134,133.90539466,.104357),(136,135.907214484,.088573)]
amu=1.66053906892e-27; uGeV=.93149410242; mn=.93956542052; GF=1.1663787e-5
ckm=299792.458; ccm=ckm*1e5; year=365.25*86400; rho=.3; sw2=.23122
mean_u=sum(m*f for _,m,f in isotopes)
atoms=2.84*1000/(mean_u*amu)
def eta(vmin,ve,v0=238.,vesc=544.):
    x=np.asarray(vmin)/v0; y=np.asarray(ve)/v0; z=vesc/v0
    norm=erf(z)-2*z*math.exp(-z*z)/math.sqrt(math.pi)
    low=erf(x+y)-erf(x-y)-4*y/math.sqrt(math.pi)*math.exp(-z*z)
    high=erf(z)-erf(x-y)-2/math.sqrt(math.pi)*(z-x+y)*math.exp(-z*z)
    return np.maximum(0,np.where(x<z-y,low,np.where(x<z+y,high,0))/(2*norm*np.asarray(ve)))

def speed_pdf(v,ve=250.2,v0=238.,vesc=544.):
    if v<=0 or v>=vesc+ve:return 0.
    norm=math.erf(vesc/v0)-2*(vesc/v0)*math.exp(-(vesc/v0)**2)/math.sqrt(math.pi)
    return v/(math.sqrt(math.pi)*v0*ve*norm)*(math.exp(-((v-ve)/v0)**2)-math.exp(-(min(v+ve,vesc)/v0)**2))

class Recast:
    def __init__(self,n=1601,phases=32,v0=238.,vesc=544.,earth=250.2,mod=14.9,radius_scale=1.):
        self.E=np.linspace(5.4,270,n); self.energy=self.E*1e-6
        self.ve=(earth+mod*np.cos(2*np.pi*np.arange(phases)/phases))[:,None]
        self.v0,self.vesc=v0,vesc
        self.targets=[]
        for A,m,f in isotopes:
            mA=m*uGeV-54*.00051099895 # electron binding correction neglected
            q=np.sqrt(2*mA*self.energy)
            c=(1.23*A**(1/3)-.60)*radius_scale
            radius=math.sqrt(c*c+7*math.pi**2*.52**2/3-5*.9**2)
            qr=q*radius/.1973269804; qs=q*.9/.1973269804
            F2=(3*spherical_jn(1,qr)/qr*np.exp(-qs*qs/2))**2
            charge=A-54-(1-4*sw2)*54
            self.targets.append((A,mA,f,F2,charge))
    def spectrum(self,mass,delta_keV,normalization=1.,annual=True):
        mun=mass*mn/(mass+mn)
        sigma=GF*GF*mun*mun/(2*math.pi)*.3893793721e-27*normalization
        result=np.zeros((len(self.ve),len(self.E)))
        for A,mA,f,F2,Q in self.targets:
            reduced=mass*mA/(mass+mA)
            vmin=(mA*self.energy/reduced+delta_keV*1e-6)/np.sqrt(2*mA*self.energy)*ckm
            inverse=eta(vmin[None,:],self.ve,self.v0,self.vesc)
            result+=atoms*f*rho/mass*sigma*mA*Q*Q/(2*mun*mun)*F2*inverse*ccm*ckm*1e-6*year
        return result.mean(axis=0) if annual else result
    def count(self,mass,delta,normalization=1.):
        return float(np.trapezoid(self.spectrum(mass,delta,normalization),self.E))
    def solve(self,mass,normalization=1.,target=1.):
        return brentq(lambda delta:self.count(mass,delta,normalization)-target,0,700,xtol=1e-6)

central=Recast(); rows=[]
for p in data['electroweak_rows']:
    m=p['mchi_GeV']; lower=central.solve(m,.25); full=central.solve(m)
    rates=np.trapezoid(central.spectrum(m,full,annual=False),central.E,axis=1)
    rows.append({'representation':p['representation'],'mass_GeV':m,'source_delta_keV':p['delta_source_keV'],
      'source_delta_raw_count_full':central.count(m,p['delta_source_keV']),
      'raw_one_count_delta_lower_current_keV':lower,'raw_one_count_delta_full_current_keV':full,
      'normalization_only_delta_shift_keV':full-lower,
      'summer_to_winter_rate_ratio':float(rates[0]/rates[len(rates)//2]) if rates[len(rates)//2]>0 else None,
      'summer_to_winter_ratio_is_infinite':bool(rates[len(rates)//2]==0),
      'winter_rate_per_2p84_tonne_year':float(rates[len(rates)//2]),
      'summer_rate_per_2p84_tonne_year':float(rates[0])})

m=rows[0]['mass_GeV']; root=rows[0]['raw_one_count_delta_full_current_keV']
refined=Recast(n=3201,phases=64)
sensitivity={}
for name,kwargs in [('v0_220',{'v0':220}),('escape_528',{'vesc':528}),('escape_560',{'vesc':560}),
                    ('no_seasonal_average',{'mod':0}),('radius_minus2pct',{'radius_scale':.98}),('radius_plus2pct',{'radius_scale':1.02})]:
    sensitivity[name]=Recast(**kwargs).solve(m)
checks={
 'isotope_amount_fractions_sum_one':abs(sum(f for _,_,f in isotopes)-1)<1e-12,
 'speed_distribution_normalized':abs(quad(speed_pdf,0,794.2,points=[544-250.2],epsabs=1e-12,epsrel=1e-12)[0]-1)<1e-9,
 'eta_matches_independent_speed_integral':all(abs(float(eta(v,250.2))-quad(lambda s:speed_pdf(s)/s,v,794.2,epsabs=1e-13)[0])<1e-10 for v in [50,400,650,780]),
 'eta_closes_above_speed_cap':float(eta(800,250.2))==0.,
 'full_lower_current_rate_ratio_four':abs(central.count(m,root)/central.count(m,root,.25)-4)<1e-12,
 'one_count_roots_replay':all(abs(central.count(z['mass_GeV'],z['raw_one_count_delta_full_current_keV'])-1)<1e-6 for z in rows),
 'grid_phase_refinement_stable':abs(refined.count(m,root)-1)<.002,
 'increased_normalization_increases_selected_splitting':all(z['normalization_only_delta_shift_keV']>0 for z in rows),
}
# Independent dimensional check: elastic point nucleus in one-speed incident shell.
test_mA=131*uGeV; test_mu=m*test_mA/(m+test_mA); test_mun=m*mn/(m+mn)
test_sigmaN=1e-40; test_Q=77.; test_speed=400.; test_N=1000/(131*amu)
test_Emax_keV=2*test_mu**2*(test_speed/ckm)**2/test_mA*1e6
integrated_differential=(test_N*rho/m*test_sigmaN*test_mA*test_Q**2/(2*test_mun**2)
    /test_speed*ccm*ckm*1e-6*test_Emax_keV)
direct_flux_count=test_N*rho/m*(test_speed*1e5)*test_sigmaN*(test_mu/test_mun)**2*test_Q**2
checks['physical_velocity_energy_units_match_flux_times_cross_section']=abs(integrated_differential/direct_flux_count-1)<1e-12
assert all(checks.values()),checks
output={'evidence_class':'raw_isotope_Helm_SHM_recoil_level_benchmark_not_detector_fit',
 'inputs_sha256':hashlib.sha256(source.read_bytes()).hexdigest(),
 'isotopes_columns':['A','atomic_mass_u','amount_fraction'],'isotopes':isotopes,
 'source_isotopes':'https://physics.nist.gov/cgi-bin/Compositions/stand_alone.pl?ele=Xe',
 'assumptions':{'rho_GeV_cm3':rho,'v0_kms':238,'vesc_kms':544,'earth_mean_kms':250.2,
   'earth_harmonic_kms':14.9,'annual_uniform_phase_samples':32,'efficiency':1,
   'energy_band_keV':[5.4,270],'exposure_tonne_year':2.84,'sin2thetaW':sw2,
   'Helm':'c=1.23*A^(1/3)-.60 fm; a=.52 fm; s=.9 fm',
   'nuclear_mass':'atomic mass minus electron rest masses; electronic binding ignored'},
 'rows':rows,'first_mass_sensitivity_raw_one_count_delta_keV':sensitivity,
 'refined_count_at_first_mass_root':refined.count(m,root),'checks':checks,
 'limitations':['unit efficiency; not the published digitized response',
  'Helm is a phenomenological weak-density approximation, not isotope density matrices',
  'one raw count is a normalization contour, not a fitted signal or confidence interval',
  'mass fixed; no thermal trajectory intersection recomputed',
  'sensitivity variations are diagnostics, not probabilistic uncertainties']}
(base/'casimir-dp-xe-recoil-recast-2026-09-06.json').write_text(json.dumps(output,indent=2)+'\n')
with (base/'casimir-dp-xe-recoil-recast-spectrum-2026-09-06.csv').open('w',newline='') as f:
    w=csv.writer(f);w.writerow(['mass_GeV','delta_keV','recoil_keV','raw_counts_per_keV_in_2p84_tonne_year'])
    for r in rows:
        delta=r['raw_one_count_delta_full_current_keV']
        for E,value in zip(central.E,central.spectrum(r['mass_GeV'],delta)):
            w.writerow([r['mass_GeV'],delta,E,value])
print(json.dumps(output,indent=2))
