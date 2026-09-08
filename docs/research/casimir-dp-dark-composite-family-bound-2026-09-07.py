"""Conservative elastic Born family bound; raw true recoil counts only."""
import hashlib
import json
import math
from pathlib import Path
from scipy.integrate import quad

base = Path('docs/research')
p = base/'casimir-dp-yukawa-force-screen-2026-09-06.json'
assert hashlib.sha256(p.read_bytes()).hexdigest() == '8d9c3bb9f1adf98b246cbe094bf4fcad6777644fc85f627af640700dcb4a50f4'
data = json.loads(p.read_text())
A, ukg, uGeV = 131.293, 1.66053906892e-27, .93149410242
mA = A*uGeV
atoms = 2840/(A*ukg)
year = 365.25*86400
rho, c, conv = .3, 29979245800., .3893793721e-27
C = (9*math.pi/4)**(1/3)
# For x<=4, |F|<=1 implies xF^2<=4. For x>=4,
# xF^2<=9(1+x)^2/x^5, decreasing, and value at 4 is <4.
assert 9*25/4**5 < 4
rows = []
for r in data['rows']:
    gn = r['maximum_product_at_alpha_DM_one']*math.sqrt(4*math.pi)
    med = r['mediator_eV']*1e-9
    def upper(lo, hi):
        # alpha^2 F_D^2/M <= gN^2/(16pi^2) *4/(Cq).
        # For elastic events v>=q/(2mu)>=q/(2mA).
        # Therefore <Theta/v>/q <= 2mA/q^2 for any normalized speed law.
        pref = atoms*year*rho*c*conv*8*math.pi*mA*A*A*gn*gn/(16*math.pi**2)*4/C
        integral = quad(lambda E:2*mA/((2*mA*E)*(2*mA*E+med*med)**2),
                        lo,hi,epsabs=0,epsrel=1e-10)[0]
        # Independent massless-propagator integral is an upper envelope.
        analytic = (lo**(-2)-hi**(-2))/(8*mA*mA)
        assert integral <= analytic*(1+1e-12)
        assert abs(integral/analytic-1)<1e-10  # masses negligible in these bands
        return pref*integral
    rows.append(dict(mediator_eV=r['mediator_eV'], ordinary_g=gn,
        raw_elastic_200to269p9_upper=upper(200e-6,269.9e-6),
        raw_elastic_5p4to269p9_upper=upper(5.4e-6,269.9e-6)))
out = dict(status='conditional elastic Born family bound, not detector likelihood',
    envelope_xF2=4, screening_coefficient_kappa=1,
    scaling='bounds multiply by kappa^2 if g_d <= kappa N^(-1/3)',
    density_GeV_cm3=rho, exposure_tonne_year=2.84,
    target='mean xenon, nuclear form factor replaced by upper envelope 1',
    velocity='any normalized nonrelativistic speed law satisfying elastic kinematics',rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n',encoding='utf-8')
print(json.dumps(out,indent=2))
