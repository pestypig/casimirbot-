"""Pinned 2026 DUNE flux versus archived Honda Homestake, no rate fit."""
import gzip,hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.integrate import quad
folder=Path(__file__).with_suffix(''); parent=folder.parent
pins={'dune-with.d':'845124b03c3560f9744da35a66095636b38b196d137ba1f2b557af2a03b4dc0b','dune-without.d':'7a030f303e95587ba14ce7b73e2b904f8e4913acabea5f567dd78c07d80d7d71'}
tables={}
for name,digest in pins.items():
    raw=(folder/name).read_bytes();assert hashlib.sha256(raw).hexdigest()==digest
    tables[name]=np.array([[float(x) for x in line.split()] for line in raw.decode().splitlines()[2:] if len(line.split())==5])
raw=(parent/'casimir-dp-neutrino-flux-intake-2026-09-07/hms-ally-01-01-solmin.d.gz').read_bytes()
assert hashlib.sha256(raw).hexdigest()=='765f8b46f2c0f5981ae10c37434acb545f394d69a7ee91873c4127478fcea07f'
tables['Honda2014']=np.array([[float(x) for x in line.split()] for line in gzip.decompress(raw).decode().splitlines()[2:] if len(line.split())==5])
def integral(data,threshold):
    E=data[:,0]; flux=data[:,1:].sum(axis=1)*4*math.pi/1e4
    interp=PchipInterpolator(np.log(E),np.log(flux),extrapolate=False)
    knots=E[(E>threshold)&(E<E[-1])].tolist()
    return quad(lambda x:math.exp(float(interp(math.log(x)))),threshold,E[-1],points=knots,epsabs=1e-12,limit=200)[0]
rows=[]
for threshold in [1.,2.15846619029,8.26464131990,26.9908219039]:
    flux={name:integral(data,threshold) for name,data in tables.items()}
    rows.append(dict(threshold_GeV=threshold,integrated_flux_cm_m2_s_m1=flux,new_over_Honda=flux['dune-with.d']/flux['Honda2014'],with_over_without=flux['dune-with.d']/flux['dune-without.d']))
x=tables['dune-with.d']; y=tables['dune-without.d']; mask=x[:,0]>=1
checks={'new_grids_121_nodes':len(x)==len(y)==121,'same_scenario_energy_grid':np.array_equal(x[:,0],y[:,0]),'positive_ordered':all(np.all(d[:,1:]>0) and np.all(np.diff(d[:,0])>0) for d in tables.values()),'nested_integrated_fluxes':all(rows[i]['integrated_flux_cm_m2_s_m1'][name]>rows[i+1]['integrated_flux_cm_m2_s_m1'][name] for name in tables for i in range(len(rows)-1))}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values())
out=dict(scope='Four-species solar-minimum flux comparison, not oscillated interaction-weighted spectrum',full_model_admitted=False,repository='https://github.com/JIECheng2021/atm_nu_flux_data',commit='f5a8bab508c6ad5874070f0f6b83409baa96d3d2',sha256=pins,checks=checks,max_geV_species_with_without_relative_difference=float(np.max(np.abs(x[mask,1:]/y[mask,1:]-1))),rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
