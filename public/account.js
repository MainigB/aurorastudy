(function(){
let isAdmin=false,freeNavigation=false;
let user=null,version=0,pending=null,sending=false,timer=null,conflict=false,ready=false;
const empty=()=>({done:{},xp:0,days:{},review:[],drafts:{},last:null,bookPage:1,readPages:[]});
const el=s=>document.querySelector(s);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let onState=()=>{},getState=empty,dialogRevision=0;
const dialog=document.createElement('dialog');dialog.id='account-dialog';document.body.append(dialog);
dialog.addEventListener('close',()=>{dialogRevision++});
const accountButton=document.createElement('button');accountButton.className='account-button';accountButton.textContent='Minha conta';document.querySelector('.header-stats').append(accountButton);
const status=document.createElement('small');status.id='sync-status';document.querySelector('.profile').after(status);
function setStatus(text,error=false){status.textContent=text;status.classList.toggle('sync-error',error);}
async function api(path,method='GET',body,expectedUser=user?.id){
 const controller=new AbortController();const timeout=setTimeout(()=>controller.abort(),20000);
 try{
  const res=await fetch(path,{method,credentials:'same-origin',cache:'no-store',headers:{'Content-Type':'application/json',...(expectedUser?{'X-Aurora-User':expectedUser}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{}),signal:controller.signal});
  const data=await res.json();
  if(!res.ok){const error=new Error(data.error||data.message||'Não foi possível concluir.');error.status=res.status;error.code=data.code;throw error}return data;
 }finally{clearTimeout(timeout)}
}
function message(error){
 const messages={INVALID_EMAIL_OR_PASSWORD:'E-mail ou senha incorretos.',USER_ALREADY_EXISTS:'Não foi possível criar a conta com este e-mail. Tente entrar.',USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:'Não foi possível criar a conta com este e-mail. Tente entrar.',PASSWORD_TOO_SHORT:'Use uma senha com pelo menos 12 caracteres.',INVALID_PASSWORD:'A senha atual está incorreta.',PASSWORD_TOO_LONG:'A senha deve ter no máximo 128 caracteres.',INVALID_EMAIL:'Confira o endereço de e-mail.'};
 return error.status===429?'Muitas tentativas. Aguarde um minuto e tente novamente.':messages[error.code]||(error.name==='AbortError'?'A conexão demorou. Tente novamente.':error.status>=500?'O serviço está temporariamente indisponível. Tente novamente.':error.message||'Confira sua conexão e tente novamente.');
}
function identity(){accountButton.textContent=user?user.name.split(' ')[0]:'Entrar';el('.profile').innerHTML=`<span>${user?safe(user.name.slice(0,2).toUpperCase()):'EU'}</span><div>${user?safe(user.name):'Seu espaço pessoal'}<small>${user?'Conta conectada':'Entre para salvar seu progresso'}</small></div>`;}
function showAuth(mode='login'){
 dialogRevision++;
 const signup=mode==='signup';
 dialog.innerHTML=`<div class="modal-head"><div><span class="eyebrow">AURORA · SUA CONTA</span><h2>${signup?'Comece sua jornada':'Bom ter você por aqui'}</h2></div></div><p class="muted">${signup?'Crie sua conta para guardar as atividades, respostas e revisões.':'Entre para continuar seu aprendizado em qualquer dispositivo.'}</p><form id="account-form">${signup?'<label>Seu nome<input name="name" autocomplete="name" required minlength="2" maxlength="80"></label>':''}<label>E-mail<input name="email" type="email" autocomplete="email" required maxlength="254"></label><label>Senha<input name="password" type="password" autocomplete="${signup?'new-password':'current-password'}" required minlength="${signup?12:1}" maxlength="128"></label>${signup?'<small class="muted">Use pelo menos 12 caracteres. Prefira uma frase que você consiga lembrar.</small><label>Confirme a senha<input name="confirm" type="password" autocomplete="new-password" required minlength="12" maxlength="128"></label>':''}<p id="account-error" class="auth-error" role="alert"></p><button class="primary" type="submit">${signup?'Criar minha conta':'Entrar na minha conta'} →</button></form><button class="text-button" id="account-toggle">${signup?'Já tenho uma conta. Entrar':'Ainda não tenho conta. Criar cadastro'}</button>`;
 AuroraDialogs.prepare(dialog);if(!dialog.open)dialog.showModal();
 el('#account-toggle').onclick=()=>showAuth(signup?'login':'signup');
 el('#account-form').onsubmit=async e=>{
  e.preventDefault();const form=e.currentTarget;const values=Object.fromEntries(new FormData(form));
  if(signup&&values.password!==values.confirm){el('#account-error').textContent='As senhas não coincidem.';return}
  const button=form.querySelector('button');button.disabled=true;el('#account-error').textContent='';
  try{await api('/api/auth/'+(signup?'sign-up/email':'sign-in/email'),'POST',{email:values.email.trim(),password:values.password,...(signup?{name:values.name.trim()}:{} )});await loadSession();if(user&&form.isConnected){form.reset();if(dialog.open)dialog.close()}}catch(err){el('#account-error').textContent=message(err)}finally{button.disabled=false}
 };
}
async function loadSession(){
 const previousUser=user?.id,revision=dialogRevision;
 ready=false;const session=await api('/api/auth/get-session');
 if(!session?.user){user=null;isAdmin=false;identity();onState(empty(),{resetStudy:!!previousUser});return}
 const progress=await api('/api/progress','GET',undefined,session.user.id);
 const access=await api('/api/admin?action=capabilities','GET',undefined,session.user.id);
 if(!access.isAdmin||previousUser!==session.user.id)freeNavigation=false;isAdmin=access.isAdmin===true;user=session.user;version=progress.version;pending=null;conflict=false;ready=true;
 onState({...empty(),...progress.state},{resetStudy:!!previousUser&&previousUser!==user.id});identity();setStatus('Progresso sincronizado');
}
async function flush(){
 clearTimeout(timer);
 if(sending||!pending||!user||conflict||!ready)return;
 sending=true;const current=pending;pending=null;setStatus('Salvando na sua conta…');
 try{const result=await api('/api/progress','PUT',{state:current,version});version=result.version;setStatus('Progresso sincronizado');}
 catch(err){pending=pending||current;if(err.status===409){conflict=true;setStatus('Conflito de versão · abra Minha conta',true)}else if(err.status===401){ready=false;onState(getState(),{resetStudy:true});setStatus('Sessão expirada · exporte antes de entrar',true)}else{setStatus('Sem sincronização · alterações nesta aba',true)}}
 finally{sending=false;if(pending&&!conflict&&ready)timer=setTimeout(flush,5000)}
}
function saveState(value){if(!user||!ready)return;pending=JSON.parse(JSON.stringify(value));setStatus('Alterações pendentes…');clearTimeout(timer);timer=setTimeout(flush,700)}
function exportCurrent(){const url=URL.createObjectURL(new Blob([JSON.stringify(getState(),null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='aurora-progresso.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000)}
function settings(){
 dialogRevision++;
 if(!user){showAuth();return}
 const old=localStorage.getItem('aurora-v1');
 dialog.innerHTML=`<div class="modal-head"><div><span class="eyebrow">SUA CONTA</span><h2>${safe(user.name)}</h2></div><button class="close" aria-label="Fechar conta">×</button></div><p class="muted">${safe(user.email)}</p><div class="account-sync">${safe(status.textContent)}<p class="muted">Atividades, respostas e revisões ficam vinculadas à sua conta. Seu PDF continua apenas no navegador.</p></div><div class="actions">${isAdmin?'<button class="primary" id="open-admin">Abrir administração →</button>':''}<button class="outline" id="retry-sync">Tentar sincronizar</button><button class="outline" id="export-pending">Exportar cópia do progresso</button>${conflict||!ready?'<button class="outline" id="reload-account">Recarregar progresso da conta</button>':''}${old?'<button class="outline" id="import-legacy">Importar progresso antigo deste navegador</button>':''}</div><details><summary>Alterar minha senha</summary><form id="password-form"><label>Senha atual<input name="currentPassword" type="password" autocomplete="current-password" required></label><label>Nova senha<input name="newPassword" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><label>Confirme a nova senha<input name="confirm" type="password" autocomplete="new-password" minlength="12" maxlength="128" required></label><button class="primary">Salvar nova senha</button></form></details><p id="account-error" class="auth-error" role="alert"></p><button class="text-button" id="sign-out">Sair da conta</button>`;
 AuroraDialogs.prepare(dialog);if(!dialog.open)dialog.showModal();dialog.querySelector('.close').onclick=()=>dialog.close();
 el('#open-admin')?.addEventListener('click',()=>{dialog.close();window.AuroraAdmin.open(api)});
 el('#export-pending').onclick=exportCurrent;
 el('#retry-sync').onclick=async()=>{if(conflict){el('#account-error').textContent='Exporte suas alterações e recarregue o progresso da conta para resolver o conflito.';return}await flush();el('#account-error').textContent=status.textContent};
 el('#reload-account')?.addEventListener('click',async()=>{if(!confirm('Recarregar o progresso salvo no servidor? Exporte primeiro as alterações pendentes desta aba.'))return;try{await loadSession();if(user)settings()}catch(e){el('#account-error').textContent=message(e)}});
 el('#import-legacy')?.addEventListener('click',()=>{if(!confirm('Importar o progresso antigo deste navegador para ESTA conta? Faça isso apenas se esse progresso for seu.'))return;try{const legacy=JSON.parse(old),current=getState();const next={...current,done:{...legacy.done,...current.done},drafts:{...legacy.drafts,...current.drafts},review:[...new Set([...(legacy.review||[]),...current.review])],days:{}};for(const d of Object.values(next.done))next.days[d.date]=(next.days[d.date]||0)+1;next.xp=Object.keys(next.done).length*20;onState(next);saveState(next);el('#account-error').textContent='Importado. Aguardando sincronização.'}catch{el('#account-error').textContent='Não foi possível importar este progresso.'}});
 el('#password-form').onsubmit=async e=>{e.preventDefault();const f=e.currentTarget,b=f.querySelector('button'),v=Object.fromEntries(new FormData(f));if(v.newPassword!==v.confirm){el('#account-error').textContent='As senhas não coincidem.';return}b.disabled=true;try{await api('/api/auth/change-password','POST',{currentPassword:v.currentPassword,newPassword:v.newPassword,revokeOtherSessions:true});f.reset();el('#account-error').textContent='Senha alterada. As outras sessões foram encerradas.'}catch(err){el('#account-error').textContent=message(err)}finally{b.disabled=false}};
 el('#sign-out').onclick=async()=>{
  await flush();if(sending||pending){el('#account-error').textContent='Há alterações não sincronizadas. Exporte uma cópia ou aguarde a sincronização antes de sair.';return}
  try{await api('/api/auth/sign-out','POST',{});clearTimeout(timer);user=null;isAdmin=false;ready=false;version=0;onState(empty(),{resetStudy:true});identity();setStatus('');dialog.close()}catch(e){el('#account-error').textContent=message(e)}
 };
}

accountButton.onclick=settings;
window.addEventListener('online',flush);
window.addEventListener('beforeunload',e=>{if(pending||sending){e.preventDefault();e.returnValue=''}});
document.querySelectorAll('[data-login]').forEach(button=>button.onclick=()=>showAuth());
window.AuroraAccount={isAdmin:()=>ready&&isAdmin,freeNavigation:()=>ready&&isAdmin&&freeNavigation,setFreeNavigation:enabled=>{if(!ready||!isAdmin)return false;freeNavigation=enabled===true;return true},reload:async()=>{clearTimeout(timer);pending=null;await loadSession()},open:()=>showAuth(),save:saveState,async init(change,get){onState=change;getState=get;identity();const revision=dialogRevision;try{await loadSession()}catch{ready=false;onState(getState(),{resetStudy:true});if(dialogRevision!==revision)return;const target=el('#account-error')||el('#landing-status');if(target)target.textContent='Não foi possível conectar. Tente entrar novamente.'}},isReady:()=>ready};
})();
