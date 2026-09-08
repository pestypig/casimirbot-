"""Tree scalar-potential reconstruction and unscreened nucleon force map."""
import json
from pathlib import Path
import mpmath as mp
mp.mp.dps=80
v=mp.mpf('246.2');w=mp.mpf('500');mh=mp.mpf('125');GN=mp.mpf('6.708e-39');fN=mp.mpf('.3');mN=mp.mpf('.939');rows=[]
for ms_string in ['1e-9','1e-6']:
 ms=mp.mpf(ms_string)
 for angle_string in ['1e-12','3e-10','1e-8','1e-4']:
  angle=mp.mpf(angle_string);s=mp.sin(angle);c=mp.cos(angle)
  lh=(mh**2*c*c+ms**2*s*s)/(2*v*v);ls=(mh**2*s*s+ms**2*c*c)/(2*w*w);portal=(mh**2-ms**2)*s*c/(v*w)
  H=mp.matrix([[2*lh*v*v,portal*v*w],[portal*v*w,2*ls*w*w]])
  det=mp.det(H);assert abs(det/(mh*mh*ms*ms)-1)<mp.mpf('1e-50')
  eig=mp.eigsy(H,eigvals_only=True);assert abs(eig[0]/(ms*ms)-1)<mp.mpf('1e-45')
  quartic=4*lh*ls-portal**2;assert quartic>0
  gN=fN*mN/v*s;alpha=gN*gN/(4*mp.pi*GN*mN*mN)
  rows.append(dict(ms_GeV=float(ms),theta_rad=float(angle),lambda_H=float(lh),lambda_S=float(ls),lambda_HS=float(portal),determinant_over_diagonal_product=float(det/(H[0,0]*H[1,1])),nucleon_scalar_coupling=float(gN),nucleon_Yukawa_strength_relative_to_gravity=float(alpha),range_m=float(mp.mpf('1.973269804e-16')/ms)))
out=dict(scope='Tree potential -muH^2|H|^2-muS^2|S|^2+lambdaH|H|^4+lambdaS|S|^4+lambdaHS|H|^2|S|^2. Unscreened nucleon-only force proxy with fN=.3; no material composition, loop stability or exclusion claim. Angle values are diagnostic inputs, not allowed benchmark determinations.',vevEW_GeV=float(v),vevDark_GeV=float(w),rows=rows,checks=dict(high_precision_eigenvalues=True,determinant_identity=True,positive_quartic_determinant=True),full_model_admitted=False)
Path(__file__).with_suffix('.json').write_text(json.dumps(out,indent=2)+'\n');print(json.dumps(out,indent=2))
