import {getPool} from '../lib/db.mjs';
const result=await getPool().query('DELETE FROM "user" WHERE email=$1 AND name=$2',['aurora-ui-20261015-qa@example.test','Teste Aurora UI']);
console.log(`Conta fictícia do teste visual removida: ${result.rowCount}.`);await getPool().end();
