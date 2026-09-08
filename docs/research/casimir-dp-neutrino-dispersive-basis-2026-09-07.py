"""Conditional narrow-slice calculation from normalized archived Omnes samples.

Basis normalization does not verify the upstream integral equation. Sample
spread includes phase input only, with fixed central subtraction parameters.
"""
import hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from numpy.polynomial.legendre import leggauss

parent=Path(__file__).with_name('casimir-dp-neutrino-dispersive-intake-2026-09-07.py')
assert hashlib.sha256(parent.read_bytes()).hexdigest()=='e71265e6d0e2e36e3c586f6c83917e230c6eb264e9a3ce0f306a44fed64ce147'
a={'__file__':str(parent)}
exec(compile(parent.read_text().split('\n# Independently evaluate')[0],str(parent),'exec'),a)
s=a['s']; t=a['tables']; samples=t['c1'][1].shape[0]
raw=np.empty((samples,len(s),2,2),dtype=complex)
raw[:,:,0,0]=t['c1'][1];raw[:,:,0,1]=t['d1'][1]
raw[:,:,1,0]=t['c2'][1];raw[:,:,1,1]=t['d2'][1]
zero=raw[:,0]
normalized=raw@np.linalg.inv(zero)[:,None,:,:]
condition=np.linalg.cond(zero)
assert np.max(np.abs(zero.imag))<1e-14
assert np.max(condition)<10

mhat=(.00216+.00467)/2;hc=1.973269804e-16
def subtraction(mpi):
    mk=.497;meta=.547862;mu=.547862;f=.0803;l85=-.46e-3;l64=.28e-3
    log=lambda mass:mass**2/(32*math.pi**2*f**2)*math.log(mass**2/mu**2)
    gp=mpi**2*(1+mpi**2/f**2*((8/9+math.log(mpi**2/mu**2)-math.log(meta**2/mu**2)/9)/(32*math.pi**2)+8*(l85+2*l64)))
    gk=.5*mpi**2*(1+log(meta)-log(mpi)+8/f**2*((2*mk**2-mpi**2)*l85+4*mk**2*l64+mk**2/(72*math.pi**2)*(1+math.log(meta**2/mu**2))))
    return gp,gk

def form_grid(matrix,mpi,channel_ratio=2/math.sqrt(3)):
    gp,gk=subtraction(mpi)
    return matrix[:,:,0,0]*gp+matrix[:,:,0,1]*channel_ratio*gk

def widths(grid,mpi,m,med,interp='pchip',n=32):
    # Piecewise quadrature respects interpolation knots. No extrapolation.
    lo=4*mpi**2;hi=.35**2
    edges=np.concatenate(([lo],s[(s>lo)&(s<hi)],[hi]))
    x,w=leggauss(n)
    points=((edges[:-1,None]+edges[1:,None])/2+(edges[1:,None]-edges[:-1,None])/2*x).ravel()
    weights=((edges[1:,None]-edges[:-1,None])/2*w).ravel()
    if interp=='pchip':
        values=PchipInterpolator(s,grid.real,axis=1)(points)+1j*PchipInterpolator(s,grid.imag,axis=1)(points)
    else:
        values=np.asarray([np.interp(points,s,r.real)+1j*np.interp(points,s,r.imag) for r in grid])
    y=.02*med
    kernel=3*y**4/(1024*math.pi**3*m**3*mhat**2)*(m*m-points)**2*np.sqrt(1-lo/points)/(med*med-points)**2
    return (abs(values)**2*kernel)@weights

def stats(values):
    return dict(mean=float(np.mean(values)),std_phase_samples_only=float(np.std(values)),minimum=float(np.min(values)),maximum=float(np.max(values)))

rows=[]
for mpi,label in [(.134,'source_common_mass'),(.13957039,'charged_mass_hybrid_sensitivity')]:
    g=form_grid(normalized,mpi)
    for m,med in [(1.,1.),(1.,10.),(2.,10.)]:
        w=widths(g,mpi,m,med)
        wl=widths(g,mpi,m,med,'linear')
        wr=widths(form_grid(raw,mpi),mpi,m,med)
        wc=widths(form_grid(normalized,mpi,math.sqrt(3)/2),mpi,m,med)
        lo=widths(np.full_like(g,mpi**2),mpi,m,med)
        ell=hc/w*math.sqrt((10-.000248)**2-m*m)/m
        rows.append(dict(mass_prescription=label,mpi_GeV=mpi,mchi_GeV=m,mediator_GeV=med,
                         width_GeV=stats(w),ratio_to_same_mass_LO_slice=stats(w/lo),
                         E10_lab_length_m=stats(ell),log_survival_10cm_slice_only=stats(-.1/ell),
                         max_relative_linear_vs_pchip=float(np.max(abs(wl/w-1))),
                         raw_over_normalized_width=stats(wr/w),
                         reciprocal_channel_factor_over_paper=stats(wc/w)))

# An arbitrary real nonsingular change of fundamental columns must cancel.
b=np.array([[1.2,.15],[-.2,.8]])
changed=raw@b
reconstructed=changed@np.linalg.inv(changed[:,0])[:,None,:,:]
gp,gk=subtraction(.134)
g=form_grid(normalized,.134)
w32=widths(g,.134,1.,10.);w64=widths(g,.134,1.,10.,n=64)
quadrature=float(np.max(abs(w64/w32-1)))
checks={
 'zero_identity':bool(np.max(abs(normalized[:,0]-np.eye(2)))<1e-12),
 'real_basis_invariance':bool(np.max(abs(reconstructed-normalized))<1e-10),
 'subtraction_value_recovered':bool(np.max(abs(g[:,0]-gp))<1e-12),
 'quadrature_refinement':quadrature<1e-5,
 'positive_finite_widths':all(r['width_GeV']['minimum']>0 and math.isfinite(r['width_GeV']['maximum']) for r in rows)
}
assert all(checks.values())
out=dict(scope='Conditional normalized fundamental-basis prescription, central NLO subtractions, phase samples only; not a validated dispersive solution or full decay model',
         full_model_admitted=False,checks=checks,condition_number_range=[float(condition.min()),float(condition.max())],
         quadrature_relative_change=quadrature,source_mass_subtractions_GeV2={'GammaPi0':gp,'GammaK0':gk},rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
