import assert from 'node:assert/strict';import {randomBytes} from 'node:crypto';import {getPool} from '../lib/db.mjs';
const base=process.env.TEST_BASE_URL||'http://127.0.0.1:4173',suffix=randomBytes(8).toString('hex'),password=randomBytes(24).toString('base64url');
const emails=[`aurora-admin-qa-${suffix}@example.test`,`aurora-student-qa-${suffix}@example.test`];const ids=[];
async function req(path,method='GET',body,cookie='',origin=base){const response=await fetch(base+path,{method,headers:{'Content-Type':'application/json',Origin:origin,...(cookie?{Cookie:cookie}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json(),cookie:response.headers.getSetCookie().map(c=>c.split(';')[0]).join('; ')}}
try{
 assert.equal((await req('/api/admin')).status,401);
 const a=await req('/api/auth/sign-up/email','POST',{name:'Admin QA',email:emails[0],password,role:'admin',isAdmin:true});assert.equal(a.status,200,JSON.stringify(a.data));ids.push(a.data.user.id);
 const b=await req('/api/auth/sign-up/email','POST',{name:'Student QA',email:emails[1],password});assert.equal(b.status,200);ids.push(b.data.user.id);
 assert.equal((await req('/api/admin?action=capabilities','GET',null,a.cookie)).data.isAdmin,false);
 assert.equal((await req('/api/admin','GET',null,a.cookie)).status,403);
 assert.equal((await req('/api/admin','POST',{action:'revoke-sessions',userId:ids[1]},a.cookie)).status,403);
 await req('/api/auth/update-user','POST',{role:'admin',isAdmin:true},a.cookie);
 assert.equal((await req('/api/admin?action=capabilities','GET',null,a.cookie)).data.isAdmin,false);
 await getPool().query('INSERT INTO aurora_admins(user_id) VALUES($1)',[ids[0]]);
 assert.equal((await req('/api/admin?action=capabilities','GET',null,a.cookie)).data.isAdmin,true);
 const listed=await req('/api/admin?q='+encodeURIComponent(suffix),'GET',null,a.cookie);assert.equal(listed.status,200);assert.equal(listed.data.users.length,2);assert.ok(listed.data.users.every(u=>!('password' in u)&&!('state' in u)));
 assert.equal((await req('/api/admin','POST',{action:'revoke-sessions',userId:ids[1]},a.cookie,'https://attacker.invalid')).status,403);
 assert.equal((await req('/api/admin','POST',{action:'revoke-sessions',userId:ids[0]},a.cookie)).status,400);
 assert.equal((await req('/api/admin','POST',{action:'revoke-sessions',userId:ids[1]},a.cookie)).status,200);
 assert.equal((await req('/api/progress','GET',null,b.cookie)).status,401);
 const audit=await getPool().query('SELECT action FROM aurora_admin_audit WHERE actor_id=$1 AND target_id=$2',ids);assert.equal(audit.rows[0].action,'revoke_sessions');
 await getPool().query('DELETE FROM aurora_admins WHERE user_id=$1',[ids[0]]);
 assert.equal((await req('/api/admin','GET',null,a.cookie)).status,403);
 console.log('PASS: bloqueio anônimo/aluno, cadastro sem autoelevação, perfil atribuído no servidor, listagem, CSRF, revogação de sessões, auditoria e remoção imediata de privilégios.');
}finally{
 if(ids.length)await getPool().query('DELETE FROM aurora_admin_audit WHERE actor_id=ANY($1::text[]) OR target_id=ANY($1::text[])',[ids]);
 await getPool().query('DELETE FROM "user" WHERE email=ANY($1::text[])',[emails]);await getPool().end();console.log('Contas fictícias e registros de teste removidos.');
}
