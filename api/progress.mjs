import { fromNodeHeaders } from 'better-auth/node';
import { getAuth } from '../lib/auth.mjs';
import { getPool } from '../lib/db.mjs';
import { reply,readBody,sameOrigin } from '../lib/http.mjs';
import { cleanState,emptyState } from '../lib/progress.mjs';
export default async function handler(req,res){
 try{
  if(!['GET','PUT'].includes(req.method))return reply(res,405,{error:'Método não permitido.'});
  if(req.method==='PUT'&&!sameOrigin(req))return reply(res,403,{error:'Origem não permitida.'});
  const session=await getAuth().api.getSession({headers:fromNodeHeaders(req.headers)});
  if(!session)return reply(res,401,{error:'Entre na sua conta para continuar.'});
  if(req.headers['x-aurora-user']&&req.headers['x-aurora-user']!==session.user.id)return reply(res,401,{error:'A conta foi alterada em outra aba. Recarregue antes de continuar.'});
  const db=getPool(),id=session.user.id;
  if(req.method==='GET'){
   const {rows}=await db.query('SELECT state, version FROM aurora_progress WHERE user_id=$1',[id]);
   return reply(res,200,rows[0]||{state:emptyState(),version:0});
  }
  let body,next;
  try{body=await readBody(req);next=cleanState(body.state);if(!Number.isInteger(body.version)||body.version<0)throw Error();}catch{return reply(res,400,{error:'Progresso inválido ou muito grande.'});}
  const {rows}=await db.query(`INSERT INTO aurora_progress(user_id,state,version) SELECT $1,$2::jsonb,1 WHERE $3=0
   ON CONFLICT(user_id) DO NOTHING RETURNING version`,[id,JSON.stringify(next),body.version]);
  if(rows.length)return reply(res,200,{version:rows[0].version});
  const updated=await db.query('UPDATE aurora_progress SET state=$2::jsonb,version=version+1,updated_at=now() WHERE user_id=$1 AND version=$3 RETURNING version',[id,JSON.stringify(next),body.version]);
  if(!updated.rows.length)return reply(res,409,{error:'O progresso mudou em outra aba ou dispositivo. Exporte sua cópia local antes de recarregar.'});
  return reply(res,200,{version:updated.rows[0].version});
 }catch(e){console.error('Progress request failed:',e.name);return reply(res,503,{error:'Não foi possível sincronizar. Suas alterações permanecem nesta aba.'});}
}
