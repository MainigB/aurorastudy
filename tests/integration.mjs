import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';import {getPool} from '../lib/db.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173';const suffix=randomBytes(8).toString('hex');const password=randomBytes(24).toString('base64url');const emails=[`aurora-qa-a-${suffix}@example.test`,`aurora-qa-b-${suffix}@example.test`];
async function request(path,method='GET',body,cookie='',origin=base,expectedUser=null){const res=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(expectedUser?{'X-Aurora-User':expectedUser}:{}),...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});let data;try{data=await res.json()}catch{throw new Error('Non-JSON response: '+res.status)}return {status:res.status,data,cookie:res.headers.getSetCookie().map(c=>c.split(';')[0]).join('; '),rawCookies:res.headers.getSetCookie()}}
try{
 assert.equal((await request('/api/progress')).status,401);
 const a=await request('/api/auth/sign-up/email','POST',{email:emails[0],password,name:'QA Aurora A'});assert.equal(a.status,200,JSON.stringify(a.data));assert.ok(a.cookie);assert.ok(a.rawCookies.some(c=>/httponly/i.test(c)));const aid=a.data.user.id;
 const b=await request('/api/auth/sign-up/email','POST',{email:emails[1],password,name:'QA Aurora B'});assert.equal(b.status,200);const bid=b.data.user.id;
 assert.notEqual(aid,bid);
 assert.equal((await request('/api/progress','GET',null,b.cookie,base,aid)).status,401);
 assert.equal((await request('/api/auth/sign-out','POST',{},b.cookie,base,aid)).status,401);
 assert.equal((await request('/api/auth/sign-in/email','POST',{email:emails[0],password:'incorrect-password'})).status,401);
 const initial=await request('/api/progress','GET',null,a.cookie);assert.equal(initial.data.version,0);
 const progress={done:{'linux-0':{date:'2026-10-15'}},drafts:{u001:'Resposta de teste persistida.','practice-pre':JSON.stringify({evidence:'Health 200; ready 503 antes, 200 depois.',repeat:'Porta 8766 testada.',review:'Revisão própria.',criteria:[true,true,true],reviewed:true})},review:['u002'],last:'u001',bookPage:688,xp:999,days:{}};
 const saved=await request('/api/progress','PUT',{state:progress,version:0},a.cookie);assert.equal(saved.status,200,JSON.stringify(saved.data));
 const persisted=await request('/api/progress','GET',null,a.cookie);assert.equal(persisted.data.state.xp,20);assert.equal(persisted.data.state.bookPage,688);assert.equal(persisted.data.state.drafts.u001,progress.drafts.u001);assert.equal(persisted.data.state.drafts['practice-pre'],progress.drafts['practice-pre']);
 assert.equal((await request('/api/progress','GET',null,b.cookie)).data.version,0);assert.equal((await request('/api/progress','GET',null,b.cookie)).data.state.drafts['practice-pre'],undefined);
 assert.equal((await request('/api/progress','PUT',{state:progress,version:0},a.cookie)).status,409);
 assert.equal((await request('/api/progress','PUT',{state:progress,version:1},a.cookie,'https://attacker.invalid')).status,403);
 const login=await request('/api/auth/sign-in/email','POST',{email:emails[0],password});assert.equal(login.status,200);assert.equal((await request('/api/progress','GET',null,login.cookie)).data.state.xp,20);assert.equal((await request('/api/progress','GET',null,login.cookie)).data.state.drafts['practice-pre'],progress.drafts['practice-pre']);
 assert.equal((await request('/api/auth/sign-out','POST',{},login.cookie)).status,200);assert.equal((await request('/api/progress','GET',null,login.cookie)).status,401);
 const changed=await request('/api/auth/change-password','POST',{currentPassword:password,newPassword:password+'-new',revokeOtherSessions:true},a.cookie);assert.equal(changed.status,200,JSON.stringify(changed.data));
 console.log('PASS: cadastro, login, cookie HttpOnly, senha incorreta, persistência, isolamento entre duas contas, conflito de versão, CSRF, logout e alteração de senha.');
}finally{await getPool().query('DELETE FROM "user" WHERE email=ANY($1::text[])',[emails]);await getPool().end();console.log('Contas temporárias de teste removidas.');}
