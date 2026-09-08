"""Threshold-focused extension of the pinned natural-isotope calculation."""
import hashlib
from pathlib import Path
p=Path(__file__).with_name('casimir-dp-natural-xenon-kernel-2026-09-07.py')
assert hashlib.sha256(p.read_bytes()).hexdigest()=='c4b92ddf4409dc191887abd80d0c5eaaeb1d73358efd28fc481a8d351df366fd'
s=p.read_text(encoding='utf-8-sig')
assert s.count('[650,776]')==2
s=s.replace('[650,776]','[602,610]')
s=s.replace("integral=quad(lambda E:x['ds'](E,A,ma)","if r['bands'][name] is None:continue\n    integral=quad(lambda E:x['ds'](E,A,ma)")
s=s.replace("for r in selected) for key in ['exact','born']}","for r in selected if r['bands'][name] is not None) for key in ['exact','born']}",1)
s=s.replace("status='natural_isotope_two_speed_kernel_not_transport_prediction'","status='natural_isotope_threshold_kernel_not_transport_prediction',thresholds=[dict(A=A,number_fraction=f,vmin_200_kms=299792.458*math.sqrt(200e-6*x['mass'](M)/(2*(100*x['mass'](M)/(100+x['mass'](M)))**2))) for A,M,f in x['iso']]")
exec(compile(s,str(p),'exec'),{'__file__':__file__})
