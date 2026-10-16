import {fromNodeHeaders} from 'better-auth/node';
import {getAuth} from '../lib/auth.mjs';
import {getPool} from '../lib/db.mjs';
import {reply,readBody,sameOrigin} from '../lib/http.mjs';
export default async function handler(req,res){
 try{
  if(!['GET','POST'].includes(req.method))return reply(res,405,{error:'Método não permitido.'});
  if(req.method==='POST'&&!sameOrigin(req))return reply(res,403,{error:'Origem não permitida.'});
  const session=await getAuth().api.getSession({headers:fromNodeHeaders(req.headers)});
  if(!session)return reply(res,401,{error:'Entre na sua conta.'});
  const actor=session.user.id;
  if(req.headers['x-aurora-user']&&req.headers['x-aurora-user']!==actor)return reply(res,401,{error:'A conta mudou. Recarregue a página.'});
  const db=getPool(),url=new URL(req.url,'https://aurora-sre-academy.vercel.app');
  const role=await db.query('SELECT user_id FROM aurora_admins WHERE user_id=$1',[actor]);
  const isAdmin=role.rowCount===1;
  if(req.method==='GET'&&url.searchParams.get('action')==='capabilities')return reply(res,200,{isAdmin});
  if(!isAdmin)return reply(res,403,{error:'Acesso exclusivo de administradores.'});
  if(req.method==='GET'){
   const q=(url.searchParams.get('q')||'').trim().slice(0,100);
   const page=Math.max(0,Math.min(100000,parseInt(url.searchParams.get('page'),10)||0));
   const filter=`('%'||$1||'%')`;
   const result=await db.query(`SELECT u.id,u.name,u.email,u."createdAt" AS created_at,
     a.user_id IS NOT NULL AS is_admin,
     COALESCE((SELECT count(*) FROM jsonb_object_keys(COALESCE(p.state->'done','{}'::jsonb))),0)::int AS completed,
     p.updated_at,
     (SELECT count(*)::int FROM session s WHERE s."userId"=u.id AND s."expiresAt">now()) AS active_sessions
    FROM "user" u LEFT JOIN aurora_admins a ON a.user_id=u.id LEFT JOIN aurora_progress p ON p.user_id=u.id
    WHERE u.name ILIKE ${filter} OR u.email ILIKE ${filter}
    ORDER BY u."createdAt" DESC,u.id LIMIT 20 OFFSET $2`,[q,page*20]);
   const total=await db.query(`SELECT count(*)::int AS total FROM "user" WHERE name ILIKE ${filter} OR email ILIKE ${filter}`,[q]);
   return reply(res,200,{users:result.rows,total:total.rows[0].total,page,pageSize:20,actorId:actor});
  }
  let body;try{body=await readBody(req,4096)}catch{return reply(res,400,{error:'Solicitação inválida.'})}
  if(body.action!=='revoke-sessions'||typeof body.userId!=='string'||body.userId.length>128)return reply(res,400,{error:'Ação inválida.'});
  if(body.userId===actor)return reply(res,400,{error:'Use Sair da conta para encerrar sua própria sessão.'});
  const client=await db.connect();
  try{
   await client.query('BEGIN');
   const permission=await client.query('SELECT user_id FROM aurora_admins WHERE user_id=$1 FOR SHARE',[actor]);
   if(!permission.rowCount){await client.query('ROLLBACK');return reply(res,403,{error:'Permissão administrativa revogada.'})}
   const target=await client.query('SELECT id FROM "user" WHERE id=$1 FOR UPDATE',[body.userId]);
   if(!target.rowCount){await client.query('ROLLBACK');return reply(res,404,{error:'Usuário não encontrado.'})}
   const deleted=await client.query('DELETE FROM session WHERE "userId"=$1',[body.userId]);
   await client.query("INSERT INTO aurora_admin_audit(actor_id,target_id,action) VALUES($1,$2,'revoke_sessions')",[actor,body.userId]);
   await client.query('COMMIT');return reply(res,200,{revoked:deleted.rowCount});
  }catch(e){await client.query('ROLLBACK');throw e}finally{client.release()}
 }catch(e){console.error('Admin request failed:',e.name);return reply(res,503,{error:'Não foi possível acessar a administração. Tente novamente.'})}
}
