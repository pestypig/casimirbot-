"""Common two-mediator normalization and partial diamond response."""
import hashlib,json,math,sys,subprocess
from pathlib import Path
import numpy as np
base=Path(__file__).parent
source=Path(sys.argv[1]).resolve()
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()=='352149fb53b614adbac6ee242045c56be25aad29'
assert not subprocess.check_output(['git','-C',str(source),'diff','--name-only'],text=True).strip()
sys.path.insert(0,str(source));from darkelf import darkelf
p=base/'casimir-dp-two-mediator-shape-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='fda4336a87e36f61686d361411f167cf9aec0687438c63d2c7fb5a2c110e0621'
shapes=json.loads(p.read_text())
p2=p.with_suffix('.py');n={'__file__':str(p2)};exec(p2.read_text(encoding='utf-8-sig').split('\nrows=[]')[0],n)
xe=n['n'];rho_fast=.003
cfg=base.parents[1]/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
design=json.loads(cfg.read_text())['leading_design']
x=darkelf(target='C',mX=1e11,mMed=1e7);x.rhoX=x.mX
alpha_ref=math.sqrt(3.008770724735438e-35/.3893793721e-27*.01**4/(16*math.pi*xe['muP']**2))
rows=[]
for shape in shapes['rows']:
 masses=shape['masses_GeV']
 if masses[1]!=1.:continue
 c=np.array(shape['relative_products']);H=n['matrix'](200,269.9,masses)
 reference_count=rho_fast*xe['targets']*xe['year']*xe['speed_cm']*float(c@H@c)
 strength=1/reference_count
 assert math.isclose(strength*reference_count,1)
 products=(alpha_ref*np.sqrt(strength)*c).tolist()
 x.Fmed_nucleus_SI=lambda q:(x.q0*x.q0+1e14)*np.sqrt(strength)*sum(ci/(q*q+(mi*1e9)**2) for ci,mi in zip(c,masses))
 thermal=[]
 for T in [300.,5000.]:
  v0=np.sqrt(2*8.617333262145e-5*T/x.mX)
  x.etav=lambda v:2/(np.sqrt(np.pi)*v0)*np.exp(-(v/v0)**2)
  vals=[]
  for count in [256,512]:
   qs=np.geomspace(x.qBZ,1e5,count);ws=np.linspace(.18,.6,count)
   ds=np.array([x._dR_domega_multiphonons_SI_qrange(w,qs,dark_photon=True,npoints=count,n_min=2) for w in ws])
   vals.append(float(np.trapezoid(ds,ws)*x._R_multiphonons_prefactor_SI(1e-38)))
  assert abs(vals[1]/vals[0]-1)<.02
  D=vals[-1]*design['mass_kg']*design['hold_time_s']/x.yeartosec
  thermal.append(dict(T_K=T,grid_rates=vals,partial_D_per_cm3=D,density_for_DP_comparator_cm3=.029511464722144533/D))
 strengths=[]
 for A,Z in [(12,6),(131,54)]:
  ma=A*.93149410242;mu=100*ma/(100+ma)
  strengths.append(dict(A=A,individual_range_strengths=[2*mu*Z*abs(ai)/mi for ai,mi in zip(products,masses)]))
 row=dict(masses_GeV=masses,relative_products=c.tolist(),common_strength=strength,effective_alpha_products=products,thermal=thermal,range_strength_diagnostics=strengths,raw_low_count_at_reference=shape['minimum_low_high_ratio'])
 rows.append(row);print(json.dumps(row),flush=True)
out=dict(status='conditional_common_kernel_partial_response_not_supplied_population',fast_reference=dict(density_cm3=rho_fast,speed_kms=776,normalization='one raw unattenuated high-window event'),rows=rows,
 checks=['frozen config and shape hash','pinned clean DarkELF','one-count normalization','partial response grid refinement'],
 limitations=['no source/overburden or capture solution','conditional Maxwell particles, not apparatus temperature','partial q>=qBZ multiphonon band only','not boundary-contrast visibility prediction','individual range strengths are diagnostics not screening or full Born proof','no detector fit or external constraints'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
