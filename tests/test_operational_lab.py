from contextlib import closing
import importlib.util
import json
import math
import shutil
import sqlite3
import subprocess
import sys
import tempfile
import threading
import unittest
import urllib.request
import urllib.error
from pathlib import Path

SOURCE=Path(__file__).resolve().parents[1]/'labs/operacao/lab.py'
class LabTest(unittest.TestCase):
    def setUp(self):
        self.temp=tempfile.TemporaryDirectory(prefix='aurora-lab-test-')
        self.root=Path(self.temp.name);shutil.copyfile(SOURCE,self.root/'lab.py')
        self.runlab('init');self.runlab('backup')
    def tearDown(self): self.temp.cleanup()
    def runlab(self,command):
        return subprocess.run([sys.executable,str(self.root/'lab.py'),command],capture_output=True,text=True)
    def test_initial_failure_duplicate_ingest_and_overwrite_guard(self):
        self.assertNotEqual(self.runlab('init').returncode,0)
        report=self.runlab('verify');self.assertEqual(report.returncode,1)
        self.assertTrue(all(not c['passed'] for c in json.loads(report.stdout)['checks']))
        self.runlab('ingest');self.runlab('ingest')
        stats=json.loads(self.runlab('stats').stdout)
        self.assertEqual(stats['count'],6);self.assertEqual(len(stats['duplicates']),2)
    def test_real_artifacts_pass_then_content_corruption_fails(self):
        with closing(sqlite3.connect(self.root/'orders.db')) as db, db:
            db.execute('CREATE UNIQUE INDEX order_external ON orders(external_id)')
            jobs=json.loads((self.root/'jobs.json').read_text())
            for _ in range(2): db.executemany('INSERT OR IGNORE INTO orders(external_id,amount_cents) VALUES (?,?)',[(j['external_id'],j['amount_cents']) for j in jobs])
        with closing(sqlite3.connect(self.root/'backup.db')) as src,closing(sqlite3.connect(self.root/'restored.db')) as dst: src.backup(dst)
        logs=[json.loads(s) for s in (self.root/'access.jsonl').read_text().splitlines()]
        analysis={}
        for route in ['/orders','/health']:
            records=[r for r in logs if r['route']==route];lat=sorted(r['latency_ms'] for r in records)
            analysis[route]={'total':len(records),'errors':sum(r['status']>=500 for r in records),'p95_ms':lat[math.ceil(.95*len(lat))-1]}
        (self.root/'analysis.json').write_text(json.dumps(analysis))
        (self.root/'redacted.jsonl').write_text('\n'.join(json.dumps({k:v for k,v in r.items() if k!='token'}) for r in logs))
        result=self.runlab('verify');self.assertEqual(result.returncode,0,result.stdout+result.stderr)
        with closing(sqlite3.connect(self.root/'restored.db')) as db, db: db.execute('UPDATE orders SET amount_cents=0')
        result=self.runlab('verify');self.assertEqual(result.returncode,1)
        self.assertFalse(next(c for c in json.loads(result.stdout)['checks'] if c['check']=='restore')['passed'])
    def test_real_http_health_readiness_and_orders(self):
        spec=importlib.util.spec_from_file_location('training_lab',self.root/'lab.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
        server=mod.ThreadingHTTPServer(('127.0.0.1',0),mod.Handler);server.config={'maintenance':True,'delay_ms':0}
        thread=threading.Thread(target=server.serve_forever,daemon=True);thread.start()
        base=f'http://127.0.0.1:{server.server_port}'
        try:
            with urllib.request.urlopen(base+'/health') as r:self.assertEqual(r.status,200)
            with self.assertRaises(urllib.error.HTTPError) as caught:urllib.request.urlopen(base+'/ready')
            self.assertEqual(caught.exception.code,503)
            server.config['maintenance']=False
            with urllib.request.urlopen(base+'/ready') as r:self.assertEqual(r.status,200)
            with urllib.request.urlopen(base+'/orders') as r:self.assertEqual(len(json.load(r)['orders']),2)
        finally: server.shutdown();server.server_close();thread.join()

if __name__=='__main__':unittest.main()
