import assert from 'node:assert/strict';
import {getPool} from '../lib/db.mjs';
const base='https://aurora-sre-academy.vercel.app';
const email='aurora-dev-qa-20261015@example.test';
async function req(path,method='GET',body,cookie='') {
  const r=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:base,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});
  return {status:r.status,data:await r.json(),cookie:r.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')};
}
try {
  const login=await req('/api/auth/sign-in/email','POST',{email,password:'Aurora-dev-qa-outubro-2026-temporaria'});
  assert.equal(login.status,200);
  const progress=await req('/api/progress','GET',null,login.cookie);
  assert.equal(progress.status,200);
  for(const id of ['linux-0','dev-api-01','dev-sql-01']) assert.ok(progress.data.state.done[id]);
  assert.equal(progress.data.state.drafts['dev-sql-01'],'SELECT nome FROM clientes ORDER BY nome;');
  const next=progress.data.state;
  next.last='dev-ddd-01';
  next.review=[...new Set([...next.review,'dev-ddd-01'])];
  const saved=await req('/api/progress','PUT',{state:next,version:progress.data.version},login.cookie);
  assert.equal(saved.status,200,JSON.stringify(saved.data));
  const loaded=await req('/api/progress','GET',null,login.cookie);
  assert.equal(loaded.status,200);
  assert.equal(loaded.data.state.xp,60);
  assert.equal(loaded.data.state.last,'dev-ddd-01');
  assert.ok(loaded.data.state.done['linux-0']);
  assert.ok(loaded.data.state.review.includes('dev-ddd-01'));
  const logout=await req('/api/auth/sign-out','POST',{},login.cookie);
  assert.equal(logout.status,200);
  console.log('PASS produção: login, progresso SRE + DEV, rascunho SQL, revisão DDD, XP e persistência.');
} finally {
  const removed=await getPool().query('DELETE FROM "user" WHERE email=$1 AND name=$2',[email,'Teste Formação Dev']);
  console.log('Conta fictícia removida:',removed.rowCount);
  await getPool().end();
}
