"""Inventory detector response releases without executing their notebooks."""
import json,hashlib,subprocess,sys
from pathlib import Path
import numpy as np
new,old=map(Path,sys.argv[1:3])
def head(p):return subprocess.check_output(['git','-C',str(p),'rev-parse','HEAD'],text=True).strip()
assert head(new)=='dd00e04597a23c07324d41bc9773c0c59ed01337'
assert head(old)=='5a364bc8709f2561e5a013ddea6993a5a7c8e313'
files=list((new/'response').glob('*.csv'))
assert len(files)==21 and all('response_nr_' in p.name for p in files)
assert not list((new/'data/orthonormal_basis').glob('*_er_*'))
p=old/'s2_response_er.csv'
a=np.genfromtxt(p,delimiter=',',names=True)
names=[k for k in a.dtype.names if k.startswith('s2_bin_')]
r=np.column_stack([a[k] for k in names])
assert np.isfinite(r).all() and (r>=0).all() and (r.sum(axis=1)<=1+1e-8).all()
out=dict(status='response_intake_not_folded_prediction',xenonnt_commit=head(new),
 xenonnt_nr_matrices=len(files),xenonnt_er_matrices=0,
 xenon1t_commit=head(old),xenon1t_er_shape=list(r.shape),
 energy_kev=[float(a['energy_kev'].min()),float(a['energy_kev'].max())],
 row_acceptance_range=[float(r.sum(axis=1).min()),float(r.sum(axis=1).max())],
 raw_search_exposure_kg_day=356770,
 hashes={str(p.relative_to(p.parent.parent)):hashlib.sha256(p.read_bytes()).hexdigest() for p in [old/'README.md',old/'s2_response_er.csv',old/'s2_binning_info.csv',new/'README.md']},
 constraints=['XENONnT published ER limits are not arbitrary-spectrum ER response matrices',
 'XENON1T ER matrix includes event selections; do not multiply by a second efficiency',
 'distinguish matrix 50 eV endpoint from analysis 186 eV cutoff',
 'use search exposure, not training exposure or the original LZ diagnostic exposure',
 'no detector inference performed in this intake'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
