"""Pinned DarkELF partial multiphonon coefficient, not a captured density model.
Run python -X utf8 this_file.py /path/to/pinned/DarkELF.
"""
import sys, subprocess, json, hashlib
from pathlib import Path
import numpy as np
source=Path(sys.argv[1]).resolve()
assert subprocess.check_output(['git','-C',str(source),'rev-parse','HEAD'],text=True).strip()=='352149fb53b614adbac6ee242045c56be25aad29'
assert not subprocess.check_output(['git','-C',str(source),'diff','--name-only'],text=True).strip()
sys.path.insert(0,str(source))
from darkelf import darkelf
root=Path(__file__).resolve().parents[2]
cfg=root/'configs/research/casimir-dp-integrated-feasibility-pilot-stage4-2r.v1.json'
assert hashlib.sha256(cfg.read_bytes()).hexdigest()=='5a7c4f26968c5ed800e4b1ef7428aabc94a5bcf14e64599b9779d6f940cd8d11'
design=json.loads(cfg.read_text())['leading_design']
x=darkelf(target='C',mX=1e11,mMed=1e7)
x.rhoX=x.mX  # exactly 1 particle/cm^3, not an inferred density
sig=1e-38
rows=[]
for T in [300.,5000.]:
    v0=np.sqrt(2*8.617333262145e-5*T/x.mX)
    # Untruncated, isotropic Maxwell distribution in target rest frame.
    x.etav=lambda v:2/(np.sqrt(np.pi)*v0)*np.exp(-(v/v0)**2)
    vals=[]
    for n in [128,256,512]:
        qs=np.geomspace(x.qBZ,1e5,n)
        ws=np.linspace(.18,.6,n)
        ds=np.array([x._dR_domega_multiphonons_SI_qrange(w,qs,dark_photon=True,npoints=n,n_min=2) for w in ws])
        rate=float(np.trapezoid(ds,ws)*x._R_multiphonons_prefactor_SI(sig))
        assert rate>0 and np.all(ds>=0)
        vals.append(rate)
    rel=abs(vals[-1]/vals[-2]-1)
    assert rel<.02
    hits=vals[-1]*design['mass_kg']*design['hold_time_s']/x.yeartosec
    rows.append(dict(particle_temperature_K=T,rate_per_kg_year=vals[-1],grid_rates=vals,
                     last_grid_fractional_change=rel,mean_events_in_frozen_hold=hits,
                     density_for_DP_comparator_if_only_this_channel_cm3=.029511464722144533/hits))
out=dict(status='conditional_partial_coefficient_not_allowed_point',source_revision='352149fb53b614adbac6ee242045c56be25aad29',
         mass_eV=x.mX,mediator_eV=x.mMed,reference_proton_cross_section_cm2=sig,density_cm3=1,
         q_interval_eV=[x.qBZ,1e5],omega_interval_eV=[.18,.6],rows=rows,
         limitations=['zero-temperature harmonic material response','untruncated conditional Maxwell particles',
                      'omits other q and energy intervals','not capture or transport','no xenon likelihood',
                      'grid convergence is not material-model uncertainty'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
