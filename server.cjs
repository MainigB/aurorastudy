const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
try{process.loadEnvFile('.env.local')}catch{}
process.env.BETTER_AUTH_URL='http://127.0.0.1:4173';
const root=path.join(__dirname,'public');
http.createServer(async(req,res)=>{
 const url=new URL(req.url,'http://127.0.0.1:4173');
 try{
  if(url.pathname.startsWith('/api/auth/'))return (await import('./api/auth.mjs')).default(req,res);
  if(url.pathname==='/api/admin')return (await import('./api/admin.mjs')).default(req,res);
  if(url.pathname==='/api/progress')return (await import('./api/progress.mjs')).default(req,res);
  const p=path.resolve(root,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));
  if(!p.startsWith(root+path.sep)){res.writeHead(403);return res.end()}
  fs.readFile(p,(e,b)=>{if(e){res.writeHead(404);return res.end('Not found')}res.setHeader('Content-Type',({'html':'text/html; charset=utf-8','js':'text/javascript; charset=utf-8','mjs':'text/javascript; charset=utf-8','css':'text/css; charset=utf-8','json':'application/json; charset=utf-8','wasm':'application/wasm','pdf':'application/pdf'})[p.split('.').pop()]||'application/octet-stream');res.end(b)});
 }catch{res.writeHead(500);res.end('Internal error')}
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));
