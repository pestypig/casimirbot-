"""Render the saved raw-recoil diagnostic; no model recalculation."""
import csv,json
from pathlib import Path
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
base=Path('docs/research')
d=json.loads((base/'casimir-dp-xe-recoil-recast-2026-09-06.json').read_text())
with (base/'casimir-dp-xe-recoil-recast-spectrum-2026-09-06.csv').open() as f: spectra=list(csv.DictReader(f))
fig,ax=plt.subplots(1,2,figsize=(11,4.5),layout='constrained')
for row in d['rows']:
    group=[r for r in spectra if float(r['mass_GeV'])==row['mass_GeV']]
    ax[0].plot([float(r['recoil_keV']) for r in group],[float(r['raw_counts_per_keV_in_2p84_tonne_year']) for r in group],label=f"{row['mass_GeV']/1000:g} TeV")
ax[0].axvline(248,color='black',ls=':',lw=1,label='248-keV reference')
ax[0].set(xlim=(120,270),xlabel='True xenon recoil energy (keV)',ylabel='Raw counts / keV in 2.84 tonne-years',title='Each curve normalized to one raw count')
ax[0].legend(fontsize=8,ncol=2)
x=[r['mass_GeV']/1000 for r in d['rows']]
ax[1].semilogx(x,[r['raw_one_count_delta_lower_current_keV'] for r in d['rows']],'o--',label='Quarter-strength normalization')
ax[1].semilogx(x,[r['raw_one_count_delta_full_current_keV'] for r in d['rows']],'o-',label='Audited vector normalization')
ax[1].set(xlabel='Dark-matter mass (TeV)',ylabel='Splitting for one raw count (keV)',title='Normalization shift at fixed mass and halo')
ax[1].legend(fontsize=9)
for a in ax:a.grid(alpha=.2)
fig.suptitle('Conditional recoil calculation • unit efficiency • Helm nuclei • annual SHM average',fontsize=12)
fig.savefig(base/'casimir-dp-xe-recoil-recast-2026-09-06.png',dpi=180)
