"""Recoil-threshold and initial-speed stopping diagnostics, not pulse selection."""
import hashlib,json
from pathlib import Path
from scipy.integrate import quad
base=Path(__file__).parent
p=base/'casimir-dp-slow-xenon-opacity-2026-09-07.py'
ctx={'__file__':str(p.resolve())}
exec(p.read_text().split('rows=[]')[0],ctx)
ns=ctx['ns'];factor=ctx['number_column']*ctx['scale'];rows=[]
for speed in [98.7743,150,250,400,601.1214,776]:
    ns['v']=speed/299792.458
    def integral(threshold,moment=0):
        result=0
        for A,M,f in ns['iso']:
            ma=ns['mass'](M);hi=ns['emax'](ma)
            if hi<=threshold:continue
            result+=f*quad(lambda E:E**moment*ns['ds'](E,A,ma),threshold,hi,
                           epsabs=1e-60,epsrel=1e-9)[0]
        return factor*result
    tau=[integral(lo) for lo in [0,1,5.4,14,50]]
    assert all(a>=b>=0 for a,b in zip(tau,tau[1:]))
    loss=integral(0,1);kinetic=.5*100*ns['v']**2*1e6
    rows.append(dict(speed_kms=speed,tau_above_threshold=tau,
        incident_kinetic_keV=kinetic,initial_speed_loss_keV=loss,
        initial_speed_loss_over_kinetic=loss/kinetic))
out=dict(status='conditional_initial_speed_moments',source_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),
    thresholds_keV=[0,1,5.4,14,50],column_g_cm2=ctx['column'],rows=rows,
    limitations=['Thresholds are diagnostic recoil cuts, not LZ pulse thresholds',
      'Initial-speed loss is not propagated energy loss; values above kinetic energy signal failure of fixed-speed approximation',
      'Same Born model and diagnostic column; no geometry or pulse simulation'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
