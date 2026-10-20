"""Aurora educational lab. Standard library only; binds to loopback by default."""
from contextlib import contextmanager
import argparse
import json
import math
import sqlite3
import time
import urllib.request
import urllib.error
from pathlib import Path
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

ROOT = Path(__file__).resolve().parent
DB = ROOT / 'orders.db'

@contextmanager
def database(path):
    conn=sqlite3.connect(path)
    try:
        with conn:
            yield conn
    finally:
        conn.close()

def connect():
    if not DB.exists():
        raise SystemExit('Execute init primeiro.')
    return database(DB)

def init():
    # Never overwrite a learner's work or database.
    if any((ROOT / f).exists() for f in ['orders.db', 'config.json', 'access.jsonl', 'jobs.json']):
        raise SystemExit('Bancada já existe. Extraia uma nova cópia para recomeçar.')
    with database(DB) as conn:
        conn.execute('CREATE TABLE orders(id INTEGER PRIMARY KEY, external_id TEXT NOT NULL, amount_cents INTEGER NOT NULL)')
        conn.executemany('INSERT INTO orders(external_id,amount_cents) VALUES (?,?)', [('order-001',1500),('order-002',2500)])
    (ROOT/'config.json').write_text(json.dumps(dict(maintenance=True, delay_ms=0),indent=2),encoding='utf-8')
    (ROOT/'jobs.json').write_text(json.dumps([dict(external_id='order-003',amount_cents=3500),dict(external_id='order-004',amount_cents=4500)],indent=2),encoding='utf-8')
    events=[]
    for n in range(1,101):
        events.append(dict(request_id=f'req-{n:03}',route='/health' if n%5==0 else '/orders',status=503 if n%13==0 else 200,latency_ms=1200 if n%11==0 else 40+n,token='FAKE-TRAINING-TOKEN'))
    (ROOT/'access.jsonl').write_text('\n'.join(json.dumps(e) for e in events)+'\n',encoding='utf-8')
    print('Bancada criada. Leia config.json e inicie: python lab.py serve')

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        config=self.server.config
        time.sleep(min(max(float(config.get('delay_ms',0)),0),5000)/1000)
        if self.path=='/health': status,body=200,{'alive':True}
        elif self.path in ['/ready','/orders'] and config.get('maintenance'):
            status,body=503,{'error':'maintenance'}
        elif self.path=='/ready':
            try:
                with connect() as conn: conn.execute('SELECT count(*) FROM orders').fetchone()
                status,body=200,{'ready':True}
            except sqlite3.Error: status,body=503,{'ready':False}
        elif self.path=='/orders':
            with connect() as conn:
                body={'orders':[dict(id=r[0],external_id=r[1],amount_cents=r[2]) for r in conn.execute('SELECT * FROM orders ORDER BY id')]}
            status=200
        else: status,body=404,{'error':'not_found'}
        data=json.dumps(body).encode()
        self.send_response(status);self.send_header('Content-Type','application/json');self.send_header('Content-Length',str(len(data)));self.end_headers()
        try: self.wfile.write(data)
        except (BrokenPipeError,ConnectionResetError): pass

def stats():
    with connect() as conn:
        count,total=conn.execute('SELECT count(*),coalesce(sum(amount_cents),0) FROM orders').fetchone()
        duplicates=conn.execute('SELECT external_id,count(*) FROM orders GROUP BY external_id HAVING count(*)>1').fetchall()
    return dict(count=count,total_cents=total,duplicates=duplicates)

def verify():
    """Checks artifacts, not learner identity or professional competence."""
    result=[]
    def check(name,ok,detail): result.append(dict(check=name,passed=bool(ok),detail=detail))
    with connect() as conn:
        rows=conn.execute('SELECT external_id,amount_cents FROM orders ORDER BY external_id').fetchall()
        check('idempotent_dataset',rows==[('order-001',1500),('order-002',2500),('order-003',3500),('order-004',4500)],'Banco deve conter exatamente os quatro pedidos do cenário, sem duplicações ou perda dos originais.')
        plan=conn.execute("EXPLAIN QUERY PLAN SELECT * FROM orders WHERE external_id='order-003'").fetchall()
        check('indexed_lookup',any('SEARCH' in r[3] for r in plan),'A consulta por external_id deve usar um índice; examine EXPLAIN QUERY PLAN.')
    restored=ROOT/'restored.db'
    if restored.exists():
        try:
            with database(restored) as conn:
                integrity=conn.execute('PRAGMA integrity_check').fetchone()[0]
                data=conn.execute('SELECT external_id,amount_cents FROM orders ORDER BY external_id').fetchall()
            check('restore',integrity=='ok' and data==[('order-001',1500),('order-002',2500)],'Restaure o backup inicial: dois pedidos, 4000 centavos, em restored.db.')
        except sqlite3.Error: check('restore',False,'restored.db não contém o schema esperado.')
    else: check('restore',False,'Crie restored.db a partir do backup inicial; preserve orders.db.')
    report=ROOT/'analysis.json'
    expected={}
    logs=[json.loads(line) for line in (ROOT/'access.jsonl').read_text(encoding='utf-8').splitlines() if line.strip()]
    for route in ['/orders','/health']:
        events=[e for e in logs if e['route']==route];lat=sorted(e['latency_ms'] for e in events)
        expected[route]=dict(total=len(events),errors=sum(e['status']>=500 for e in events),p95_ms=lat[math.ceil(.95*len(lat))-1])
    try: actual=json.loads(report.read_text(encoding='utf-8'))
    except (OSError,ValueError): actual=None
    check('log_analysis',actual==expected,'analysis.json: objeto por rota com total, errors (5xx) e p95_ms (nearest-rank). Valores são recalculados a partir dos logs.')
    clean=ROOT/'redacted.jsonl'
    try:
        output=[json.loads(line) for line in clean.read_text(encoding='utf-8').splitlines() if line.strip()]
        ok=len(output)==len(logs) and all(all(out.get(k)==src[k] for k in ['request_id','route','status','latency_ms']) and 'FAKE-TRAINING-TOKEN' not in json.dumps(out) for out,src in zip(output,logs))
    except (OSError,ValueError,AttributeError): ok=False
    check('log_redaction',ok,'Preserve todos os eventos e campos operacionais em redacted.jsonl, removendo o valor sensível fictício.')
    print(json.dumps(dict(scope='Verificação local de artefatos; não é certificação.',checks=result),ensure_ascii=False,indent=2))
    return all(x['passed'] for x in result)

def main():
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('command',choices=['init','serve','probe','stats','ingest','backup','verify'])
    parser.add_argument('--port',type=int,default=8765)
    parser.add_argument('--host',default='127.0.0.1',help='Use 0.0.0.0 apenas dentro de contêiner de laboratório.')
    args=parser.parse_args()
    if args.command=='init': init()
    elif args.command=='serve':
        config=json.loads((ROOT/'config.json').read_text(encoding='utf-8'))
        server=ThreadingHTTPServer((args.host,args.port),Handler);server.config=config
        print(f'Laboratório em http://{args.host}:{args.port}; Ctrl+C encerra. Reinicie após alterar config.json.',flush=True)
        try: server.serve_forever()
        except KeyboardInterrupt: pass
        finally: server.server_close()
    elif args.command=='probe':
        for route in ['/health','/ready','/orders']:
            start=time.monotonic()
            try:
                with urllib.request.urlopen(f'http://127.0.0.1:{args.port}{route}',timeout=6) as r: code,body=r.status,r.read().decode()
            except urllib.error.HTTPError as e: code,body=e.code,e.read().decode()
            except urllib.error.URLError as e: code,body='CONNECTION_ERROR',str(e.reason)
            print(route,code,round((time.monotonic()-start)*1000),'ms',body)
    elif args.command=='stats': print(json.dumps(stats(),indent=2))
    elif args.command=='ingest':
        # Deliberately non-idempotent training baseline. Learner writes their own replacement.
        jobs=json.loads((ROOT/'jobs.json').read_text(encoding='utf-8'))
        with connect() as conn: conn.executemany('INSERT INTO orders(external_id,amount_cents) VALUES (?,?)',[(j['external_id'],j['amount_cents']) for j in jobs])
        print('Lote inserido pela implementação inicial (sem idempotência).')
    elif args.command=='backup':
        target=ROOT/'backup.db'
        if target.exists(): raise SystemExit('backup.db já existe; preserve a cópia inicial.')
        with connect() as src,database(target) as dest: src.backup(dest)
        print('backup.db criado com a API de backup SQLite.')
    elif args.command=='verify': raise SystemExit(0 if verify() else 1)

if __name__=='__main__': main()
