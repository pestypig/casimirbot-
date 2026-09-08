"""Mass-matched stationary-nucleus single-scatter capture diagnostic."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import spherical_jn
p=Path(__file__).with_name('casimir-dp-two-mediator-common-2026-09-07.json')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='7cca50b92b407b6dc9b247feeeb23febaf2eceea360329d86adc28046d97c0c6'
v=776/299792.458;e=11.2/299792.458;m=100.;X=7e9
rows=[]
for A,Z in [(107,47),(108,48)]:
 M=A*.93149410242;mu=m*M/(m+M);lo=M*m*(v*v-e*e);hi=4*mu*mu*v*v
 assert hi>lo>0
 radius=math.sqrt((1.23*A**(1/3)-.6)**2+7*math.pi**2*.52**2/3-5*.9**2)
 def helm2(y):
  q=math.sqrt(y)/.1973269804;z=q*radius
  return (3*spherical_jn(1,z)/z)**2*math.exp(-(q*.9)**2)
 for r in json.loads(p.read_text())['rows']:
  def f(y):return sum(c/(y+mi*mi) for c,mi in zip(r['effective_alpha_products'],r['masses_GeV']))**2
  pref=4*math.pi*Z*Z/v**2*.3893793721e-27
  point=pref*quad(f,lo,hi,epsabs=1e-60,epsrel=1e-10)[0]
  helm=pref*quad(lambda y:f(y)*helm2(y),lo,hi,epsabs=1e-60,epsrel=1e-10)[0]
  assert 0<=helm<=point
  number_column=X/(A*1.66053906892e-24)
  rows.append(dict(A=A,Z=Z,masses_GeV=r['masses_GeV'],capture_recoil_interval_keV=[lo/(2*M)*1e6,hi/(2*M)*1e6],
   point_nucleus_capture_sigma_cm2=point,Helm_capture_sigma_cm2=helm,
   pure_target_initial_path_capture_optical_depth_upper=number_column*point,
   pure_target_Helm_initial_path_capture_optical_depth=number_column*helm))
out=dict(status='initial_path_single_capture_channel_not_total_capture',rows=rows,
 column_g_cm2=X,local_speed_km_s=776,escape_speed_km_s=11.2,
 assumptions=['fixed products, stationary nuclei and Born elastic scattering',
 'approximate isotope masses A times u, Z=47/48 diagnostic targets',
 'pure isotope column, constant initial speed, no prior collisions'],
 limitations=['point charge result bounds this nuclear form-factor channel, not all atomic transitions',
 'no abundance or actual Earth profile; pure column is deliberately favorable',
 'prior slowing changes capture kinematics; not a total transport bound',
 'no retention, surface density, or common-model validation'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(rows,indent=2))
