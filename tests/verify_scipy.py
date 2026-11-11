"""Optional independent response evaluator check. Requires Python, NumPy and SciPy."""
import json
import pathlib
import subprocess
import numpy as np
from scipy import signal
root = pathlib.Path(__file__).resolve().parents[1]
script = r'''const D=require('./dist/core.js'); let out=[];
for(const fs of [44100,48000,96000]) for(const type of ['PK','LSC','HSC'])
for(const frequency of [30,1000,16000]) for(const gain of [-12,6]) for(const q of [.3,1,5]) {
 const filter={type,frequency,gain,q},co=D.coefficients(filter,fs);
 const frequencies=D.logGrid(20,Math.min(20000,fs*.49),128);
 out.push({fs,co,frequencies,response:D.response([filter],frequencies,fs)});
} console.log(JSON.stringify(out));'''
rows = json.loads(subprocess.check_output(['node', '-e', script], cwd=root))
maximum = 0.0
for row in rows:
    _, h = signal.freqz(row['co']['b'], row['co']['a'], worN=np.asarray(row['frequencies']), fs=row['fs'])
    maximum = max(maximum, float(np.max(np.abs(20*np.log10(np.abs(h))-row['response']))))
assert maximum < 1e-5, maximum
print(json.dumps({'configurations':len(rows),'frequency_samples':len(rows)*128,'maximum_error_db':maximum,'passed':True}, indent=2))
