import { getAuth } from '../lib/auth.mjs';
import { reply, readBody } from '../lib/http.mjs';
const allowed=new Set(['sign-in/email','sign-up/email','get-session','sign-out','change-password','update-user']);
export default async function handler(req,res) {
  try {
    const url=new URL(req.url,'https://aurora-sre-academy.vercel.app');
    const route=url.searchParams.get('route') || url.pathname.replace(/^\/api\/auth\/?/,'');
    if(!allowed.has(route)) return reply(res,404,{error:'Recurso não encontrado.'});
    if(!['GET','POST'].includes(req.method)) return reply(res,405,{error:'Método não permitido.'});
    if(req.method==='POST'&&!String(req.headers['content-type']).startsWith('application/json'))return reply(res,415,{error:'Envie JSON.'});
    const headers=new Headers();
    for(const [k,v] of Object.entries(req.headers))if(v)headers.set(k,Array.isArray(v)?v.join(','):v);
    const base=process.env.BETTER_AUTH_URL || 'https://aurora-sre-academy.vercel.app';
    if(req.headers['x-aurora-user']&&['sign-out','change-password','update-user'].includes(route)){
      const session=await getAuth().api.getSession({headers});
      if(session?.user.id!==req.headers['x-aurora-user'])return reply(res,401,{error:'A conta foi alterada em outra aba. Recarregue antes de continuar.'});
    }
    const request=new Request(`${base}/api/auth/${route}`,{method:req.method,headers,...(req.method==='POST'?{body:JSON.stringify(await readBody(req,16384))}:{})});
    const response=await getAuth().handler(request);
    res.statusCode=response.status;
    for(const [k,v] of response.headers)if(k!=='set-cookie')res.setHeader(k,v);
    const cookies=response.headers.getSetCookie();if(cookies.length)res.setHeader('Set-Cookie',cookies);
    res.setHeader('Cache-Control','no-store');
    res.end(await response.text());
  }catch(e){console.error('Auth request failed:',e.name);reply(res,503,{error:'Não foi possível acessar sua conta. Tente novamente.'});}
}
