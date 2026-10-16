import {randomBytes} from 'node:crypto';
import {readFileSync,appendFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const file='.env.local';const text=readFileSync(file,'utf8');
const match=text.match(/^BETTER_AUTH_SECRET="?([^"\r\n]+)/m);
const secret=match?.[1]||randomBytes(48).toString('base64url');
if(!match)appendFileSync(file,`\nBETTER_AUTH_SECRET="${secret}"\nBETTER_AUTH_URL="http://127.0.0.1:4173"\n`);
for(const [key,value] of [['BETTER_AUTH_SECRET',secret],['BETTER_AUTH_URL','https://aurora-sre-academy.vercel.app']]){
 const result=spawnSync('cmd.exe',['/d','/s','/c',`npm.cmd exec --yes --package vercel -- vercel env add ${key} production --force`],{input:value,encoding:'utf8',windowsHide:true});
 if(result.status!==0){console.error(`Falha ao configurar ${key}; código ${result.status}`);process.exit(1)}
 console.log(`${key} configurado na produção.`);
}
