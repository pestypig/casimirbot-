import pathlib
import sys
for path in pathlib.Path('.').rglob('*'):
    try:
        text = path.read_text(errors='ignore')
    except Exception:
        continue
    if '/deep-mixing-plan' in text:
        print(path)
