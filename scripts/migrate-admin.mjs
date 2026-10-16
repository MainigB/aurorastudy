import {readFile} from 'node:fs/promises';
import {getPool} from '../lib/db.mjs';
try{await getPool().query(await readFile(new URL('./admin-schema.sql',import.meta.url),'utf8'));console.log('Esquema de administração aplicado.');}finally{await getPool().end();}
