"""Archive and unit-check Homestake Honda flux, no event-rate normalization."""
import gzip,hashlib,json,math
from pathlib import Path
import numpy as np
from scipy.interpolate import PchipInterpolator
from scipy.integrate import quad
folder=Path(__file__).with_suffix('')
pins={'hms-ally-01-01-solmin.d.gz':'765f8b46f2c0f5981ae10c37434acb545f394d69a7ee91873c4127478fcea07f','hms-ally-01-01-solmax.d.gz':'44aaa10c5367ad420430381d2858187cb7b12c57bdc37531cb30fd84cc777c36','hms-ally-20-01-solmin.d.gz':'13c399f4476ff93e7e5461b0051ba3abd786db2829c9a600bdb796b8161ee055'}
tables={};manifest=[]
for name,digest in pins.items():
    raw=(folder/name).read_bytes();assert hashlib.sha256(raw).hexdigest()==digest
    content=gzip.decompress(raw).decode(); blocks=[]
    for block in content.split('average flux')[1:]:
        data=[]
        for line in block.splitlines()[2:]:
            cells=line.split()
            if len(cells)==5:data.append([float(x) for x in cells])
        blocks.append(np.array(data))
    tables[name]=np.array(blocks)
    manifest.append(dict(file=name,sha256=digest,bytes=len(raw),url='http://www-rccn.icrr.u-tokyo.ac.jp/mhonda/public/nflx2014/'+name))
avg=tables['hms-ally-01-01-solmin.d.gz'][0]; angular=tables['hms-ally-20-01-solmin.d.gz']
err=float(np.max(np.abs(np.mean(angular[:,:,1:],axis=0)/avg[:,1:]-1)))
rows=[]
for solar in ['solmin','solmax']:
    table=tables['hms-ally-01-01-'+solar+'.d.gz'][0]
    E=table[:,0]; total=table[:,1:].sum(axis=1)*4*math.pi/1e4
    interp=PchipInterpolator(np.log(E),np.log(total),extrapolate=False)
    for threshold in [1.,2.,2.15846619029,8.26464131990,10.,26.9908219039]:
        knots=[float(x) for x in E if threshold<x<E[-1]]
        integral=quad(lambda x:math.exp(float(interp(math.log(x)))),threshold,E[-1],points=knots,epsabs=1e-12,limit=200)[0]
        rows.append(dict(solar=solar,threshold_GeV=threshold,upper_GeV=float(E[-1]),sum_four_species_flux_cm_m2_s_m1=integral))
checks={'angular_blocks_20':angular.shape[0]==20,'positive_ordered_tables':all(np.all(x[:,:,1:]>0) and np.all(np.diff(x[:,:,0],axis=1)>0) for x in tables.values()),'angular_average_reproduces_published':err<1e-4,'solar_tables_same_energy_grid':np.array_equal(tables['hms-ally-01-01-solmin.d.gz'][0,:,0],tables['hms-ally-01-01-solmax.d.gz'][0,:,0])}
checks={k:bool(v) for k,v in checks.items()};assert all(checks.values()),(checks,err)
out=dict(scope='Homestake annual-average no-mountain Honda 2014 tables; four production species; no oscillation or event fold',full_model_admitted=False,transport_provenance='Publisher HTTP endpoint, no TLS authenticity; hashes pin retrieved bytes, not publisher signatures',checks=checks,angular_average_max_relative_difference=err,grid_GeV=[float(avg[0,0]),float(avg[-1,0])],energy_nodes=len(avg),manifest=manifest,rows=rows)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n')
print(json.dumps(out,indent=2))
