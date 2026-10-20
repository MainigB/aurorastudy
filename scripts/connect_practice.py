"""Package the local lab without modifying application source."""
from pathlib import Path
import zipfile
root=Path(__file__).resolve().parents[1]
(root/'public/downloads').mkdir(exist_ok=True)
with zipfile.ZipFile(root/'public/downloads/aurora-operacao.zip','w',zipfile.ZIP_DEFLATED) as z:
    for name in ['lab.py','README.md']:
        info=zipfile.ZipInfo('aurora-operacao/'+name,date_time=(2026,10,20,0,0,0))
        info.compress_type=zipfile.ZIP_DEFLATED
        z.writestr(info,(root/'labs/operacao'/name).read_bytes())
