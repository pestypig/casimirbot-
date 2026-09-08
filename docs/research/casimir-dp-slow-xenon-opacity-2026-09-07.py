"""Fixed-speed xenon column diagnostics at the strong transport benchmark."""
import hashlib,json,math
from pathlib import Path
from scipy.integrate import quad
from scipy.special import gammainc
base=Path(__file__).parent
source=base/'casimir-dp-darkelf-xenon-match-2026-09-07.py'
ns={'__file__':str(source)}
exec(source.read_text().split('# Analytic integrated')[0],ns)
p=base/'casimir-dp-coupled-attenuation-branches-2026-09-07.json'
assert hashlib.sha256(p.read_bytes()).hexdigest()=='16e728335769bbfa142a873a44d585de38118fb5a686705517d8866246d7e9f1'
b=json.loads(p.read_text());scale=b['rows'][1]['cross_section_multiplier']*3.9
column=b['rows'][1]['diagnostic_xenon_column_g_cm2']
number_column=column/(sum(M*f for A,M,f in ns['iso'])*1.66053906892e-24)
rows=[]
for speed in [42.5057,98.7743,150,250,400,500,601.1214,650,776]:
    ns['v']=speed/299792.458
    sigmas=[]
    for finite in [True,False]:
        total=0
        for A,M,f in ns['iso']:
            ma=ns['mass'](M);hi=ns['emax'](ma)
            total+=f*quad(lambda E:ns['ds'](E,A,ma,finite),0,hi,epsabs=1e-60,epsrel=1e-9)[0]
        if not finite:
            analytic=sum(f*ns['sigma']*54**2/(4*ns['muP']**2*ns['v']**2)
                *(ns['q0']**2+ns['med']**2)**2*(1/ns['med']**2
                -1/(ns['med']**2+2*ns['mass'](M)*ns['emax'](ns['mass'](M))*1e-6))
                for A,M,f in ns['iso'])
            assert abs(total/analytic-1)<1e-8
        sigmas.append(total*scale)
    tau=number_column*sigmas[0];point=number_column*sigmas[1]
    assert 0<tau<=point*(1+1e-10)
    rows.append(dict(speed_kms=speed,Helm_tau=tau,point_tau=point,
        fixed_speed_P0=math.exp(-tau),fixed_speed_P1=tau*math.exp(-tau),
        fixed_speed_Pge2=float(gammainc(2,tau))))
out=dict(status='conditional_column_opacity_not_detector_selection',column_g_cm2=column,
    scale_relative_old_strong_root=3.9,source_sha256=hashlib.sha256(source.read_bytes()).hexdigest(),
    rows=rows,limitations=['Chosen 300 g/cm2 path column, not actual LZ chord distribution',
      'Fixed speed Poisson diagnostic ignores energy-angle redistribution after collision',
      'Born Helm cross sections, not validated strong scattering amplitude',
      'Total nuclear scattering, not resolvable multiple-S2 efficiency',
      'No selected-count prediction or exclusion'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
