from pathlib import Path
p=Path('public/developer.js');s=p.read_text(encoding='utf-8-sig').replace('let sqlWorker=null;','let sqlWorker=null,sqlTimeout=null;').replace('function stopSql(){','function stopSql(){clearTimeout(sqlTimeout);sqlTimeout=null;').replace('const timeout=setTimeout(', 'const timeout=sqlTimeout=setTimeout(');p.write_text(s,encoding='utf-8')
p=Path('server.cjs');s=p.read_text(encoding='utf-8-sig').replace("'json':'application/json; charset=utf-8'", "'json':'application/json; charset=utf-8','wasm':'application/wasm'");p.write_text(s,encoding='utf-8')
