"""Fixed published ROI comparison; no optimization on search data."""
import hashlib,json,sys
from pathlib import Path
import numpy as np
from scipy.interpolate import interp1d
from scipy.integrate import quad
p=Path(__file__).with_name('casimir-dp-xenon1t-fold-2026-09-07.json')
root=Path(sys.argv[1]);bp=root/'s2_binning_info.csv'
assert hashlib.sha256(bp.read_bytes()).hexdigest()=='637539acfbb0f568c4a0c185ef2d179bb612f6470fec1e2492067a6b417e2282'
b=np.genfromtxt(bp,delimiter=',',names=True);centers=b['linear_center_pe']
points=centers[(centers>165.3)&(centers<271.7)]
rows=[]
for r in json.loads(p.read_text())['rows']:
 variants=[]
 for x in r['variants']:
  counts=np.array(x['selected_bin_counts']);f=interp1d(centers,counts/(b['end_pe']-b['start_pe']),bounds_error=True)
  expected,error=quad(f,165.3,271.7,points=points,epsabs=1e-15,epsrel=1e-10)
  assert 0<=expected<=counts.sum() and error<max(1e-14,expected*1e-7)
  variants.append(dict(energy_floor_eV=x['energy_floor_eV'],roi_expected=expected,
   quoted_limit_to_prediction_range=[24.6/expected,24.8/expected]))
 rows.append(dict(masses_GeV=r['masses_GeV'],variants=variants))
out=dict(status='fixed_ROI_nominal_comparison_not_new_confidence_limit',
 input_sha256=hashlib.sha256(p.read_bytes()).hexdigest(),roi_pe=[165.3,271.7],
 source_url='https://github.com/XENON1T/s2only_data_release/blob/5a364bc8709f2561e5a013ddea6993a5a7c8e313/example_analysis.ipynb',
 notebook_sha256=hashlib.sha256((root/'example_analysis.ipynb').read_bytes()).hexdigest(),rows=rows,
 limitations=['24.6-24.8 is the released range for reference models, not a recomputed model-specific limit',
 '50 eV variant is below the published energy cutoff',
 'ratios are nominal fixed-shape rate ratios, not allowed coupling or coherence enhancements',
 'same covered atomic response and unattenuated incident flux assumptions; not full-model compatibility'])
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(rows,indent=2))
