# York-Time Lobes in Natário’s Zero-Expansion Warp Drive and Effective 3+1 Visualizations

## Executive summary

The “York-time lobe” graphic used by entity["people","Harold \"Sonny\" White","nasa warp field mechanics"] (his Figure 1) is a visualization of the *expansion/contraction* scalar of the Eulerian congruence in the (canonical) entity["people","Miguel Alcubierre","warp drive metric author"] warp-drive construction, i.e. the trace of the extrinsic curvature (up to sign conventions) on the standard \(t=\)const slicing. In that setting, the trace \(K\) (or \(\theta=-K\)) is nonzero and changes sign front/back, producing “lobes” of contraction ahead and expansion behind the bubble. citeturn2view0turn1view0turn9view0

For the canonical entity["people","José Natário","warp drive paper 2002"] “zero expansion” warp drive, the defining feature is that the Eulerian volume expansion \(\theta\) is \(\nabla\!\cdot\!X\), and Natário then *chooses* a divergenceless shift-generating vector field \(X\) so that \(\theta\equiv 0\). In 3+1 language, this is (again up to sign convention) a *maximal* slice with trace \(K\equiv 0\). Consequently, **you cannot reproduce White-style York-time lobes for the Natário bubble on Natário’s standard Euclidean slicing**—there is no nontrivial scalar field \(K(x^i)\) to plot: it is identically zero. citeturn7view0turn8view1  

However, “no expansion” does **not** mean “no deformation”: Natário’s bubble is driven by **trace-free extrinsic curvature (shear)**. Individual principal components (e.g. a “longitudinal strain rate” like \(K_{rr}\) in Natário’s orthonormal spherical basis) *do* exhibit a front/back sign structure that visually resembles lobes, but the transverse components cancel in the trace so that \(K=0\) everywhere. Therefore, the right 3+1 visualizations for low-expansion warp solutions are based on (i) the trace-free part \(A_{ij}\), (ii) invariants such as \(A_{ij}A^{ij}\) (equivalently \(K_{ij}K^{ij}\) here), (iii) energy density \(\rho\) via the Hamiltonian constraint, (iv) momentum density (Codazzi/momentum constraint), (v) the shift field geometry (streamlines/vorticity), and (vi) optionally coordinate-free 4D curvature invariants. citeturn8view0turn8view1turn7view0turn14search5turn13search0turn13search3

## Natário warp metric and its canonical 3+1 decomposition

Natário defines a broad class of “warp drive spacetimes” on \(\mathbb{R}^4\) by the line element
\[
ds^2 = -dt^2 + \sum_{i=1}^3\bigl(dx^i - X^i(t,\mathbf{x})\,dt\bigr)^2,
\]
where \(X^i\) are bounded smooth functions and \(X=X^i\partial_i\) is a (possibly time-dependent) vector field on Euclidean 3-space. citeturn7view0

Expanding the squares yields
\[
ds^2 = -\bigl(1-\delta_{ij}X^iX^j\bigr)dt^2 - 2\,X_i\,dx^i\,dt + \delta_{ij}\,dx^i dx^j,
\]
so on the \(t=\)const hypersurfaces the induced 3-metric is exactly Euclidean:
\[
\gamma_{ij}=\delta_{ij}\quad\Rightarrow\quad {}^{(3)}R=0.
\]
Natário states this explicitly: “the Riemannian metric induced in the Cauchy surfaces \(\{dt=0\}\) is just the ordinary Euclidean flat metric.” citeturn7view0

### Lapse, shift, spatial metric

Using the standard ADM form
\[
ds^2 = -(\alpha^2-\beta_i\beta^i)dt^2 + 2\beta_i\,dx^i dt + \gamma_{ij}\,dx^idx^j,
\]
one identifies, for Natário’s *canonical* slicing:
\[
\alpha = 1,\qquad \gamma_{ij}=\delta_{ij},\qquad \beta_i = -X_i,\qquad \beta^i=-X^i.
\]
The sign \(\beta=-X\) is consistent with Natário’s unit normal: he gives \(n_a=-dt\) (so \(n^a=\partial_t + X^i\partial_i\)), whereas in standard 3+1 one writes \(n^a=\alpha^{-1}(\partial_t-\beta^i\partial_i)\); with \(\alpha=1\) this implies \(\beta^i=-X^i\). citeturn7view0

A key geometric feature is that Natário’s Eulerian observers are geodesic (“free-fall”) on this slicing; Natário proves this as his Proposition 1.3. citeturn7view0 This matches the standard 3+1 interpretation: \(\alpha\equiv 1\) implies zero Eulerian acceleration \(a_i=D_i\ln\alpha=0\). citeturn12view0

### Extrinsic curvature in this gauge

Natário computes the extrinsic curvature of the \(t=\)const foliation as
\[
K_{ij}^{(N)}=\tfrac12(\partial_i X_j+\partial_j X_i),
\]
and then defines the Eulerian volume expansion as the trace
\[
\theta = K^{(N)\,i}{}_{i}=\partial_iX^i=\nabla\cdot X.
\]
citeturn7view0

Be aware this differs by a sign from one common numerical-relativity convention (e.g. entity["people","Eric Gourgoulhon","3+1 formalism notes"]), where \(K=-\nabla\cdot n\) and thus the normal congruence expansion is \(\nabla\cdot n=-K\). citeturn12view0turn11view2 In Natário’s coordinates, with \(\beta=-X\) and \(\gamma_{ij}=\delta_{ij}\), the “ADM sign” extrinsic curvature is
\[
K^{(\mathrm{ADM})}_{ij}=\tfrac12(\partial_i\beta_j+\partial_j\beta_i)= -\tfrac12(\partial_iX_j+\partial_jX_i)=-K^{(N)}_{ij},
\]
so the traces satisfy \(K^{(\mathrm{ADM})}=-\theta\). citeturn7view0turn12view0

## York time and White’s figure 1 lobe visualization

### York time as trace of extrinsic curvature

In 3+1 geometry, the trace \(K=\gamma^{ij}K_{ij}\) is (up to conventional factors/sign) the mean curvature of the slicing; Gourgoulhon notes it is proportional to (minus) the mean curvature \(H\) of the hypersurface embedding, \(K=-3H\). citeturn11view2 He also provides the identity \(\nabla_\beta n_\alpha = -K_{\alpha\beta}- a_\alpha n_\beta\); tracing and using \(a\cdot n=0\) gives \(K=-\nabla_\mu n^\mu\), i.e. the trace is (minus) the expansion of the Eulerian normal congruence. citeturn12view0

In the warp-drive literature, “York time” is often used colloquially for the scalar that measures local expansion/contraction of Eulerian volume elements—i.e. \(\theta\equiv\nabla_\mu n^\mu\) or \(\theta\equiv -K\), depending on sign conventions. citeturn9view0turn12view0

### What White actually plotted in Figure 1

White’s NASA report *Warp Field Mechanics 101* explicitly presents “York Time, \(\theta\)” as the “expansion and contraction of space,” provides an expression (his Eq. 2), and states that the region in front experiences contraction while the region behind experiences expansion, with a sign flip across the symmetry surface. citeturn1view0turn2view0

His Figure 1 shows three surface plots of this \(\theta\) field for different bubble wall thickness parameters \(\sigma\), emphasizing that thinner walls increase the magnitude of the York-time extrema. citeturn2view0turn1view0

White’s text and the plotted lobe structure correspond to the standard Alcubierre front/back factor \((x-x_s)/r_s\) (a \(\cos\theta\)-type dependence). In both White’s and Alcubierre’s PDFs the printed numerator appears as \(x_s\) in the displayed equation, but the *context* (sign reversal front/back and Natário’s independent derivation for the Alcubierre choice of \(X\)) indicates the intended quantity is the displacement from the bubble center \((x-x_s)\). I treat this as a notation/typographical issue and follow the geometrically consistent form below. citeturn2view0turn15view0turn7view0

For comparison, Alcubierre’s 3+1 setup chooses \(\alpha=1\), \(\gamma_{ij}=\delta_{ij}\), \(\beta^x=-v_s f(r_s)\) and defines the Eulerian expansion as \(\theta=-\alpha\,\mathrm{Tr}K\). citeturn9view0 Natário re-derives the same expansion scalar for Alcubierre’s choice in his own notation and obtains explicitly
\[
\theta = v_s f'(r_s)\,\frac{x-x_s}{r_s},
\]
which is exactly the front/back lobe factor needed for White-like plots. citeturn7view0

image_group{"layout":"carousel","aspect_ratio":"16:9","query":["Warp Field Mechanics 101 York Time figure 1","Alcubierre warp drive expansion contraction diagram","York time extrinsic curvature warp bubble plot"] ,"num_per_query":1}

## Can Natário’s zero-expansion bubble produce York-time lobes?

### Canonical answer on Natário’s intended foliation

On Natário’s canonical \(t=\)const Euclidean slicing, the Eulerian expansion scalar is
\[
\theta=\nabla\cdot X.
\]
citeturn7view0

Natário’s “warp drive with zero expansion” is obtained by choosing \(X\) divergenceless, so that
\[
\theta \equiv 0.
\]
He states this both as the general criterion (Corollary 1.5) and then verifies \(\theta=0\) explicitly for his constructed divergenceless \(X\) by showing the diagonal components satisfy \(K_{rr}+K_{\theta\theta}+K_{\phi\phi}=0\) everywhere. citeturn7view0turn8view1

Translating to standard ADM sign conventions, this is \(K^{(\mathrm{ADM})}\equiv 0\). Either way, the scalar whose isosurfaces would form “lobes” in White’s Figure 1 is identically zero. Therefore:

**A White-style York-time lobe visualization is impossible for the Natário zero-expansion solution in Natário’s natural 3+1 split** (flat spatial metric, \(\alpha=1\), \(\beta=-X\)), because the plotted scalar field is constant (\(K=0\) or \(\theta=0\)). citeturn8view1turn7view0

This is not a coordinate singularity or numerical artifact; it is exactly the construction goal: the “warp bubble” propagates by a trace-free deformation (“sliding”), not by net volume expansion behind and contraction ahead. citeturn7view0turn8view1

### What you *can* plot that looks like lobes

For Natário’s explicit divergenceless field, he provides orthonormal spherical-basis components (with the \(x\)-axis as the polar axis) including
\[
K_{rr} = -2 v_s f'(r)\cos\theta,\qquad
K_{\theta\theta}=v_s f'(r)\cos\theta,\qquad
K_{\phi\phi}=v_s f'(r)\cos\theta,
\]
and an off-diagonal term
\[
K_{r\theta}= v_s\sin\theta\Bigl(f'(r)+\tfrac{r}{2}f''(r)\Bigr),
\]
with the trace \(K_{rr}+K_{\theta\theta}+K_{\phi\phi}=0\). citeturn8view0turn8view1

So while **York time / trace** has no lobes, the **principal strain components do**:

* \(K_{rr}\) has a front/back sign change via \(\cos\theta\) (negative ahead, positive behind for \(f'>0\)), i.e. a lobe pattern. citeturn8view0turn8view1  
* The transverse components \(K_{\theta\theta}\) and \(K_{\phi\phi}\) have the opposite sign to \(K_{rr}\) with half the magnitude each, canceling in the trace. citeturn8view0turn8view1

If the goal is a *qualitatively* White-like “two-lobe” visualization but consistent with zero expansion, then plotting \(K_{rr}\) (or a similarly defined “longitudinal strain rate” such as \(K_{ij}\hat{x}^i\hat{x}^j\)) is the closest analogue; you then supplement it with transverse plots to show explicit cancellation in the trace.

### Are York-time lobes possible in another slicing of the same spacetime?

Mathematically, yes in principle: \(K\) is slicing-dependent because the 3+1 split “relies on the somewhat arbitrary choice of a time coordinate.” citeturn10view0 A nontrivial refoliation \(t\mapsto t'(t,x^i)\) changes the hypersurface normal and thus the extrinsic curvature trace \(K\), so one can generally manufacture a spatially varying \(K'(x^i)\)—potentially even with front/back lobe structure.

But that would no longer be a visualization of **Natário’s defining “zero expansion” property**, because that property refers to the expansion of the Eulerian observers associated with Natário’s Euclidean foliation (the one in which \(\theta=\nabla\cdot X\) and is set to zero). In a refoliated gauge, any “York-time lobes” would be **gauge features of the new slicing**, not evidence of physical volume expansion in Natário’s intended congruence. citeturn10view0turn7view0turn12view0

A practically useful middle ground is:

* keep Natário’s foliation (so \(K=0\) remains manifest), and  
* visualize the *trace-free* geometry \(A_{ij}\) and associated invariants that actually encode the warp. citeturn8view1turn7view0

## Effective 3+1 visualizations for low-expansion warp solutions

The core observation is that for Natário’s canonical foliation the “lapse heatmap” and “York time lobes” are trivial (\(\alpha=1\), \(K=0\)), while the geometry resides in the shift gradients and the trace-free extrinsic curvature. citeturn7view0turn8view1 The most informative 3+1 graphics therefore emphasize:

### Trace versus trace-free decomposition

Decompose
\[
K_{ij} = A_{ij} + \tfrac13\gamma_{ij}K,
\]
where \(A_{ij}\) is trace-free. citeturn14search5turn11view2

For Natário zero-expansion, \(K=0\Rightarrow A_{ij}=K_{ij}\); hence all structure is in \(A_{ij}\). citeturn8view1turn7view0

Suggested plots:

* **Signed longitudinal strain**: \(K_{rr}\) (orthonormal spherical) or \(K_{ij}\hat{x}^i\hat{x}^j\) (Cartesian), as a 2D \((x,\rho)\) heatmap + contour lines; produces “lobes” while remaining consistent with \(K=0\). citeturn8view0turn8view1  
* **Transverse strains**: \(K_{\theta\theta}\), \(K_{\phi\phi}\) (same layout) to show compensation. citeturn8view0turn8view1  
* **Off-diagonal shear**: \(K_{r\theta}\) (or Cartesian \(K_{x\rho}\)) to show where deformation is dominated by shear rather than principal compression/expansion. citeturn8view0turn8view1

### Scalar invariants for magnitude and localization

Natário gives the Eulerian energy density in terms of extrinsic curvature:
\[
\rho = \frac{1}{16\pi}\left(\theta^2 - K_{ij}K^{ij}\right),
\]
with \({}^{(3)}R=0\) on the Euclidean slices. citeturn7view0

In the zero-expansion case \(\theta=0\), so \(\rho=-(16\pi)^{-1}K_{ij}K^{ij}\le 0\), and Natário provides an explicit closed form for \(K_{ij}K^{ij}\) (equivalently \(\rho\)) in his spherical construction:
\[
\rho = -\frac{v_s^2}{8\pi}\left[3(f')^2\cos^2\theta + \left(f'+\tfrac{r}{2}f''\right)^2\sin^2\theta\right].
\]
citeturn8view1

Suggested plots:

* **Shear magnitude / “strain energy density proxy”**: \(K_{ij}K^{ij}\) as a 2D heatmap in \((x,\rho)\) and 3D isosurfaces in \((x,y,z)\). (For Natário zero expansion, this equals \(A_{ij}A^{ij}\).) citeturn8view1turn14search5  
* **Energy density** \(\rho\) as a 2D heatmap and as 3D isosurfaces; visually similar to a toroidal “donut” around the bubble wall. citeturn8view1  
* **Low-expansion metric**: a diagnostic ratio
  \[
  \epsilon_K := \frac{|K|}{\sqrt{K_{ij}K^{ij}}+\delta}
  \]
  (with small \(\delta\) to avoid division by zero) as a plot that quickly communicates “how low” the expansion is relative to deformation. This is not in the papers but is a useful numerical diagnostic consistent with the trace/trace-free split. citeturn14search5turn11view2

### Shift-field visualizations that reflect “sliding”

Because \(\gamma_{ij}\) is flat and \(\alpha=1\), the geometry is carried by the shift field (Natário’s \(X\)). citeturn7view0turn9view0 Recommended plots:

* **Shift streamlines**: plot integral curves of \(X\) (or \(\beta=-X\), but label clearly) in a 2D meridional plane; this communicates “bubble sliding through space.” citeturn7view0turn8view0  
* **Quiver/arrow plots of \(X\)** on \((x,\rho)\) slices, overlaid with \(K_{ij}K^{ij}\) contours—shows where “flow gradients” are large. citeturn7view0turn8view1  
* **Divergence check**: a plot of \(\nabla\cdot X\) to verify it is numerically zero (should be near machine error if computed analytically, or near finite-difference error if numerical). citeturn7view0turn8view1

### Horizons and causal features as 3+1 isosurfaces

Natário shows that for constant \(v_s\) and sufficiently large \(|v_s|\), horizons arise and can be visualized in the Euclidean 3-space picture; the condition is tied to where the effective flow speed \(|X|\) reaches 1 (light speed) and the associated “Mach cone” angle. citeturn8view1turn7view0

Suggested plots:

* **Isosurface \(|X|=1\)** (or \(|\beta|=1\)) as a 3D horizon indicator; for axisymmetry, a 2D curve in \((x,\rho)\) revolved around the axis is sufficient. citeturn8view1turn7view0  
* **Null-cone tilting in 3+1 variables**: plot the local coordinate light speeds along \(\pm \hat{x}\) derived from the condition \(ds^2=0\) in the ADM form (effectively showing regions where forward null directions fail to escape). Natário gives the simplified null condition \(\|\tfrac{d\mathbf{x}}{dt}-X\|=1\) in the Euclidean picture. citeturn8view1turn7view0

### Coordinate-free complements

Papers by Mattingly et al. argue that plotting scalar curvature invariants is a robust way to visualize warp-drive curvature “free of coordinate mapping distortions,” and they apply this explicitly to Natário (constant velocity and accelerating cases). citeturn13search0turn13search3turn13search24

Even if your end goal is 3+1/ADM plots, these invariants are excellent *sanity checks* and communication tools:

* 4D invariants such as the Ricci scalar \(R\) (4D), and other independent invariants (e.g. in the Carminati–McLenaghan set) as 2D/3D plots alongside \(K_{ij}K^{ij}\). citeturn13search0turn13search3

## Reproducible plotting recipe with suggested parameters, code, and a comparison table

### Recommended parameter choices and domains

Use units \(c=1\). For “static snapshot” plotting, treat \(v_s\) as constant and work in comoving coordinates so the bubble center is at the origin: Natário notes that shifting \(x\to \xi=x-x_s(t)\) removes explicit \(t\)-dependence from \(r_s\) in the Alcubierre-type construction, and the same strategy is convenient here. citeturn7view0

Practical defaults (dimensionless):

* Bubble radius: \(R=1\)  
* Wall steepness: \(\sigma\in\{4,8,16\}\) (thin wall = larger \(\sigma\))  
* Bubble speed parameter: \(v_s\in\{0.5,1,2\}\) (note: strict stationarity conditions differ; treat \(v_s>1\) as “superluminal parameter regime” and expect horizons/strong features). Natário discusses stationarity and horizon formation in terms of \(|v_s|\) and \(|X|\). citeturn8view1turn7view0

Domains/resolution:

* 2D axisymmetric plots in \((x,\rho)\): \(x\in[-4R,4R]\), \(\rho\in[0,4R]\), resolution \(N_x\times N_\rho \approx 800\times 400\) for smooth contours of thin walls.  
* 3D isosurfaces: cube \([-4R,4R]^3\), resolution \(N^3\approx 256^3\) (or \(192^3\) for faster prototyping). Thin-wall choices may require \(>256\) to avoid aliasing.

Colormaps:

* Signed quantities (e.g. \(K_{rr}\)): a diverging map (e.g. `coolwarm`, `seismic`) centered at 0.  
* Positive magnitudes (e.g. \(K_{ij}K^{ij}\)): perceptually uniform (e.g. `viridis`, `cividis`), optionally log-scaled if \(\sigma\) is large.

### A concrete Natário profile and closed-form fields

A convenient way to implement Natário’s \(f(r)\) is to start from the standard Alcubierre “top-hat” shape function \(s(r)\) (1 inside, 0 outside),
\[
s(r)=\frac{\tanh(\sigma(r+R))-\tanh(\sigma(r-R))}{2\tanh(\sigma R)},
\]
and then map to Natário’s required asymptotics \(f(0)=0\), \(f(\infty)=\tfrac12\) by
\[
f(r)=\frac{1-s(r)}{2}.
\]
This matches Natário’s stated boundary values for his divergenceless construction. citeturn8view0turn9view0turn2view0turn1view0

Then compute derivatives analytically:
\[
s'(r)=\frac{\sigma\left[\operatorname{sech}^2(\sigma(r+R))-\operatorname{sech}^2(\sigma(r-R))\right]}{2\tanh(\sigma R)},\qquad f'(r)=-\tfrac12 s'(r),
\]
\[
s''(r)=\frac{\sigma^2\left[-\operatorname{sech}^2(\sigma(r+R))\tanh(\sigma(r+R))+\operatorname{sech}^2(\sigma(r-R))\tanh(\sigma(r-R))\right]}{\tanh(\sigma R)},\qquad f''(r)=-\tfrac12 s''(r).
\]

With \(x\)-axis as polar axis, define \(r=\sqrt{x^2+y^2+z^2}\), \(\rho=\sqrt{y^2+z^2}\), \(\cos\theta=x/r\), \(\sin\theta=\rho/r\). Natário’s orthonormal-basis extrinsic curvature components are then directly those quoted earlier, and the key scalar invariant is
\[
K_{ij}K^{ij}=2v_s^2\left[3(f')^2\cos^2\theta+\left(f'+\tfrac{r}{2}f''\right)^2\sin^2\theta\right],
\]
and \(\rho=-(16\pi)^{-1}K_{ij}K^{ij}\). citeturn8view1turn7view0

### Minimal NumPy/matplotlib-style pseudocode for 2D slices

```python
import numpy as np
import matplotlib.pyplot as plt

# Parameters (dimensionless)
R = 1.0
sigma = 8.0
vs = 1.0
eps = 1e-12  # avoid division by zero

# 2D axisymmetric grid: x vs rho
Nx, Nr = 800, 400
x = np.linspace(-4*R, 4*R, Nx)
rho = np.linspace(0.0, 4*R, Nr)
X, RHO = np.meshgrid(x, rho, indexing="xy")

r = np.sqrt(X**2 + RHO**2) + eps
costh = X / r
sinth = RHO / r

# Alcubierre top-hat s(r)
def s_of_r(r):
    return (np.tanh(sigma*(r+R)) - np.tanh(sigma*(r-R))) / (2*np.tanh(sigma*R))

def sech2(u):
    return 1.0 / np.cosh(u)**2

def sp_of_r(r):
    num = sigma*(sech2(sigma*(r+R)) - sech2(sigma*(r-R)))
    den = 2*np.tanh(sigma*R)
    return num/den

def spp_of_r(r):
    # derivative of sech^2 = -2 sech^2 tanh
    term_plus  = -sech2(sigma*(r+R)) * np.tanh(sigma*(r+R))
    term_minus =  sech2(sigma*(r-R)) * np.tanh(sigma*(r-R))
    return (sigma**2 / np.tanh(sigma*R)) * (term_plus + term_minus)

s = s_of_r(r)
sp = sp_of_r(r)
spp = spp_of_r(r)

# Natário f(r): 0 inside, 1/2 outside
f  = 0.5*(1.0 - s)
fp = -0.5*sp
fpp = -0.5*spp

# Natário orthonormal components (K trace should be 0)
Krr = -2.0*vs*fp*costh
Ktt =  1.0*vs*fp*costh   # K_theta_theta
Kpp =  1.0*vs*fp*costh   # K_phi_phi
Krt =  vs*sinth*(fp + 0.5*r*fpp)

K_trace = Krr + Ktt + Kpp  # should be ~0 everywhere

K2 = (Krr**2 + Ktt**2 + Kpp**2 + 2.0*Krt**2)  # KijKij in orthonormal basis
rho_energy = -(1.0/(16.0*np.pi))*K2

# Plot: longitudinal strain Krr "lobe-like"
plt.figure()
plt.title("Natário: longitudinal strain K_rr on (x, rho)")
plt.pcolormesh(x, rho, Krr, shading="auto")  # choose a diverging cmap in practice
plt.contour(x, rho, Krr, levels=15, linewidths=0.5)
plt.xlabel("x"); plt.ylabel("rho")
plt.colorbar(label="K_rr")
plt.show()

# Plot: trace check
plt.figure()
plt.title("Natário: trace Krr+Ktt+Kpp (should be ~0)")
plt.pcolormesh(x, rho, K_trace, shading="auto")
plt.xlabel("x"); plt.ylabel("rho")
plt.colorbar(label="K (trace)")
plt.show()

# Plot: energy density
plt.figure()
plt.title("Natário: Eulerian energy density rho = -(16π)^-1 KijKij")
plt.pcolormesh(x, rho, rho_energy, shading="auto")  # use sequential cmap; consider log(|rho|)
plt.xlabel("x"); plt.ylabel("rho")
plt.colorbar(label="rho")
plt.show()
```

### 3D isosurfaces and vector-field overlays

For 3D isosurfaces, the fastest route is typically:

* compute a scalar on a 3D grid (e.g. \(K_{ij}K^{ij}\) or \(\rho\)),  
* extract level sets with marching cubes (`skimage.measure.marching_cubes`) or a VTK wrapper (`pyvista`), and  
* render with semi-transparency plus a cut-plane showing signed quantities like \(K_{rr}\).

If you want shift-vector arrows, compute Natário’s \(X\) in Cartesian form (either by converting the spherical-basis expression Natário gives, or by symbolic differentiation and then sampling). Natário’s construction is axisymmetric and explicitly specified in spherical coordinates with the \(x\)-axis as polar axis. citeturn8view0turn7view0

### Comparison table of visualization types

| Visualization | Quantity shown | What it communicates | Pros | Cons | Needed computations |
|---|---|---|---|---|---|
| York time / trace plot | \(K\) or \(\theta\) | Net Eulerian volume expansion | Directly comparable to White/Alcubierre | Trivial for Natário zero-expansion (\(=0\)) | Trace of \(K_{ij}\) or \(\nabla\cdot X\) |
| Longitudinal “lobe” plot | \(K_{rr}\) or \(K_{ij}\hat{x}^i\hat{x}^j\) | Front/back compression vs expansion *with zero net volume* | Looks like lobes; highlights sliding mechanism | Basis-dependent; must show transverse cancellation too | Components of \(K_{ij}\) |
| Shear magnitude | \(A_{ij}A^{ij}\) (here \(=K_{ij}K^{ij}\)) | Where deformation is concentrated | Gauge-clean within a slicing; positive definite | Needs context to interpret physically | Full \(K_{ij}\) or closed form |
| Energy density | \(\rho\) from Hamiltonian constraint | Exotic matter localization and scaling | Physically interpretable quantity | Sign conventions; sometimes dominated by wall | \(K_{ij}K^{ij}\), \(K\), \({}^{(3)}R\) |
| Momentum density | \(p_i\) or \(S_i\) (momentum constraint) | Directionality / “which way to go” | Breaks left-right ambiguity; dynamic insight | Requires spatial derivatives of \(K_{ij}\) | \(D_jK^j{}_i-D_iK\) |
| Shift streamlines | \(X\) or \(\beta\) field lines | “Sliding” picture; incompressible-flow analogy | Intuitive geometric view | Doesn’t show curvature magnitude alone | Evaluate \(X\) on grid |
| Horizon indicator | \(|X|=1\) isosurface | Causal disconnection / Mach-cone structures | Captures global pathology succinctly | Only relevant in certain regimes | Evaluate \(|X|\), solve level set |
| Curvature invariants | \(R, r_1, r_2, w_2,\dots\) | Coordinate-free curvature “signature” | Avoids slicing/coordinate artifacts | Not purely 3+1; more algebra | 4D curvature contractions |

### Mermaid flowchart for computation and plotting

```mermaid
flowchart TD
  A[Choose warp model] --> B[Pick slicing and coordinates]
  B --> C[Specify lapse α, shift β, spatial metric γ_ij]
  C --> D[Compute K_ij via K_ij = (1/2α)(D_i β_j + D_j β_i - ∂_t γ_ij)]
  D --> E[Compute trace K = γ^ij K_ij and tracefree A_ij = K_ij - (1/3)γ_ij K]
  E --> F[Compute diagnostics: K_ij K^ij, A_ij A^ij, ∇·X, |β|, etc.]
  F --> G[Optional: constraints 3R + K^2 - K_ij K^ij and momentum constraint]
  G --> H[Choose visualizations]
  H --> H1[2D slices: heatmaps + contours (x,ρ)]
  H --> H2[3D isosurfaces: K_ij K^ij, ρ, |β|=1]
  H --> H3[Vector overlays: shift streamlines/quiver]
  H --> H4[Optional: 4D curvature invariants for cross-check]
  H1 --> I[Render, validate (e.g., K≈0 for Natário), iterate resolution]
  H2 --> I
  H3 --> I
  H4 --> I
```

### Notes on assumptions and reference identification

* The exact “White” reference in your prompt was unspecified; the closest match containing “Figure 1: York Time, \(\theta\)” surface plots is White’s NASA report *Warp Field Mechanics 101* (2011). citeturn1view0turn2view0turn3search25  
* The displayed Alcubierre/White York-time formula is treated as representing the standard front/back factor \((x-x_s)/r_s\); this is supported by Natário’s explicit computation for the Alcubierre choice and by the qualitative description and plots in White. citeturn7view0turn2view0turn15view0  
* “York time” is used here in the sense relevant to warp-drive plots: the trace of \(K_{ij}\) (up to sign), i.e. the Eulerian expansion scalar. For general relativity usage (CMC slicing, mean curvature time), see Gourgoulhon’s definitions and the relation of \(K\) to mean curvature. citeturn11view2turn12view0
