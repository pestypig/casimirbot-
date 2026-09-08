"""Fixed-gu family: potential curvature and heavy-only gluon thresholds."""
import hashlib,json,math
from pathlib import Path
import mpmath as mp
base=Path(__file__).parent
sources={
 'casimir-dp-axion-coupling-flow-scan-2026-09-07.json':'e139d99d6bf85d828c2d42b02b5afa624816a77731c95c107c8f70af02d24555',
 'casimir-dp-axion-kaon-mass-tradeoff-2026-09-07.py':'fdaaf1d2e3b811ca565de12cda2a8f6b0f6c190921c74404eeb998bf745d1f80',
 'casimir-dp-axion-heavy-gluon-threshold-2026-09-07.py':'54ee5f7f3fe1bd32170135cbbe8e0f14db11ef957287b5ef23245f611c0c25eb'}
for name,sha in sources.items():assert hashlib.sha256((base/name).read_bytes()).hexdigest()==sha
scan=json.loads((base/next(iter(sources))).read_text());M=2000.;v=246.2
mp.mp.dps=70
rows=[]
for r in scan['rows']:
    y=r['yL'];yr=r['yR_fixed_gu'];t=M*M+(y*v)**2/2
    curvature=3*yr*yr*M*M/(4*math.pi**2)*(1-math.log(t/(M*M)))
    kaa=yr*yr*M*M/(24*t*t);kh=y*y*v/(24*t)
    ym=mp.mpf(str(y));rm=mp.mpf(str(yr));vm=mp.mpf(str(v));mm=mp.mpf(str(M));b=ym*vm/mp.sqrt(2)
    def eigen(a):
        c=rm*a;tr=mm*mm+b*b+c*c;det=b*b*c*c
        high=(tr+mp.sqrt(tr*tr-4*det))/2
        return high,det/high
    def cw(a):
        def F(x):return 0 if x==0 else x*x*(mp.log(x/(mm*mm))-mp.mpf('1.5'))
        hi,lo=eigen(a);return -3*(F(hi)+F(lo))/(16*mp.pi**2)
    h=mp.mpf('1e-8')
    numeric=2*(cw(h)-cw(0))/(h*h)
    # Heavy fermion determinant: log(m_heavy)/12 multiplies (alpha_s/pi) G^2.
    numeric_kaa=(mp.log(eigen(h)[0])-mp.log(eigen(0)[0]))/(24*h*h)
    err=float(abs(numeric/curvature-1));gerr=float(abs(numeric_kaa/kaa-1))
    assert err<1e-12 and gerr<1e-12
    rows.append(dict(yL=y,yR=yr,conditional_epsilon=r['conditional_epsilon_magnitude'],curvature_GeV2=curvature,Kaa_GeV_minus2=kaa,Kh_GeV_minus1=kh,curvature_derivative_relative_error=err,gluon_derivative_relative_error=gerr))
ref=rows[-1]
for r in rows:
    r['curvature_ratio_reference']=r['curvature_GeV2']/ref['curvature_GeV2']
    r['Kaa_ratio_reference']=r['Kaa_GeV_minus2']/ref['Kaa_GeV_minus2']
    r['Kh_ratio_reference']=r['Kh_GeV_minus1']/ref['Kh_GeV_minus1']
    r['epsilon_curvature_product_GeV2']=r['conditional_epsilon']*r['curvature_GeV2']
out=dict(scope='yu=0; one-loop potential curvature at mu=M and heavy-only zero-momentum gluon threshold. Neither pole mass nor full nucleon scattering amplitude.',operator_convention='L=(alpha_s/pi) G^2 (Kaa a^2 + Kh h)',sources=sources,rows=rows,checks=dict(independent_potential_derivative=True,independent_heavy_log_derivative=True),naturalness_exclusion=False,full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
