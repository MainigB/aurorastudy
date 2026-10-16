import {getPool} from '../lib/db.mjs';
const email=process.argv[2]?.trim().toLowerCase();
if(!email||!email.includes('@'))throw new Error('Informe o e-mail exato de uma conta já cadastrada.');
const db=getPool(),client=await db.connect();
try{
 await client.query('BEGIN');
 const result=await client.query('SELECT id,name,email FROM "user" WHERE lower(email)=$1 FOR UPDATE',[email]);
 if(result.rows.length!==1)throw new Error('Conta não encontrada. Cadastre-se no site antes de conceder o perfil.');
 const user=result.rows[0];
 const inserted=await client.query('INSERT INTO aurora_admins(user_id) VALUES($1) ON CONFLICT DO NOTHING RETURNING user_id',[user.id]);
 if(inserted.rowCount)await client.query("INSERT INTO aurora_admin_audit(actor_id,target_id,action) VALUES(NULL,$1,'grant_admin_server')",[user.id]);
 await client.query('COMMIT');console.log(JSON.stringify({email:user.email,name:user.name,role:'admin',newGrant:inserted.rowCount===1}));
}catch(e){await client.query('ROLLBACK');throw e}finally{client.release();await db.end()}
