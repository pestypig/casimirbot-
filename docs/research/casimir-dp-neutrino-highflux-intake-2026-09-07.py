"""Read archived NuFlux spline tables and verify against upstream test values."""
import hashlib,json,math
from pathlib import Path
import numpy as np
from astropy.io import fits
from scipy.interpolate import BSpline
from numpy.polynomial.legendre import leggauss
folder=Path(__file__).with_suffix('')
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8-sig'))
assert manifest['commit']=='86e0de529457901dcc42d899a62f2aaab11b3acb'
for r in manifest['files']:
    b=(folder/r['local_name']).read_bytes()
    assert len(b)==r['bytes'] and hashlib.sha256(b).hexdigest()==r['sha256']
    assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==r['git_blob']

class Flux:
    def __init__(self,path):
        with fits.open(path) as f:
            self.c=np.asarray(f[0].data,dtype=float)
            self.knots=[np.asarray(f['KNOTS'+str(i)].data,dtype=float) for i in range(2)]
            self.degree=[int(f[0].header['ORDER'+str(i)]) for i in range(2)]
            self.extents=np.asarray(f['EXTENTS'].data,dtype=float)
        assert self.c.shape==tuple(len(k)-d-1 for k,d in zip(self.knots,self.degree))
    def evaluate(self,energies,cosines,regression=False):
        le=np.log10(np.atleast_1d(energies));z=np.abs(np.atleast_1d(cosines))
        if not regression and (le.min()<self.extents[0] or le.max()>self.extents[1] or z.min()<self.extents[2] or z.max()>self.extents[3]):
            raise ValueError('Outside archived physics extents')
        be=BSpline.design_matrix(le,self.knots[0],self.degree[0],extrapolate=False).toarray()
        bz=BSpline.design_matrix(z,self.knots[1],self.degree[1],extrapolate=False).toarray()
        return 10**(be@self.c@bz.T)

species={'NuE':'nue','NuEBar':'nuebar','NuMu':'numu','NuMuBar':'numubar','NuTau':'nutau','NuTauBar':'nutaubar'}
models=['H3a_SIBYLL23C','H3a_SIBYLL23C_conv','H3a_SIBYLL23C_pr']
tables={}
reference=json.loads((folder/'test_data.json').read_text())['high_energy_data']
errors=[];point_count=0
for model in models:
    tables[model]={}
    for name,suffix in species.items():
        path=folder/(model+'_'+suffix+'.fits')
        if not path.exists():continue
        f=Flux(path);tables[model][name]=f
        expected=np.asarray(reference[model]['none'][name],dtype=float).T[:,[0,1,3,4]]
        actual=f.evaluate(np.logspace(2,9,8),[-1.,-.5,.5,1.])
        errors.append(float(np.max(abs(actual/expected-1))));point_count+=actual.size

# Deliberately omit the narrow horizon region outside stored physics extents.
zmin=max(f.extents[2] for m in tables.values() for f in m.values())
energies=np.array([1e3,1e4,1e5,1e6,1e7,1e8])
def angular(n):
    x,w=leggauss(n);z=(1+zmin)/2+(1-zmin)/2*x
    return {model:sum(f.evaluate(energies,z) for f in fs.values())@w*(1-zmin)/2*4*math.pi for model,fs in tables.items()}
rates=angular(64);refined=angular(128)
refinement=max(float(np.max(abs(refined[m]/rates[m]-1))) for m in models)
rows=[dict(E_GeV=float(E),total_off_horizon=float(rates[models[0]][i]),conventional_off_horizon=float(rates[models[1]][i]),prompt_off_horizon=float(rates[models[2]][i])) for i,E in enumerate(energies)]
rejected=False
try: tables[models[0]]['NuE'].evaluate([1e4],[0.])
except ValueError: rejected=True
checks={'byte_identities':True,'upstream_agreement_within_20ppm':max(errors)<2e-5,
        'angular_refinement':refinement<1e-4,'horizon_extent_guard':rejected}
assert all(checks.values()),(checks,max(errors),refinement)
out=dict(scope='Authenticated atmospheric spline evaluation; off-horizon production flux only, no Earth transport, astrophysical component, or splice to DUNE',
         full_model_admitted=False,checks=checks,strict_1e_minus10_parity=False,regression_points=point_count,max_relative_regression_error=max(errors),
         cosine_lower_extent=float(zmin),omitted_solid_angle_fraction=float(zmin),
         native_extents=list(map(float,tables[models[0]]['NuE'].extents)),
         angular_refinement_relative=refinement,units='cm^-2 s^-1 GeV^-1 integrated over both hemispheres excluding |cos(theta)| < stated extent',rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
