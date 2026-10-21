(function(){
const dialog=document.createElement('dialog');dialog.id='admin-dialog';document.body.append(dialog);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let api,query='',page=0;
function date(value){return value?new Date(value).toLocaleDateString('pt-BR'):'Sem atividades'}
async function load(){
 const area=dialog.querySelector('#admin-users'),status=dialog.querySelector('#admin-status');
 status.textContent='Carregando…';area.innerHTML='';
 try{
  const data=await api(`/api/admin?q=${encodeURIComponent(query)}&page=${page}`);
  status.textContent=`${data.total} usuários encontrados · página ${data.page+1}`;
  area.innerHTML=data.users.length?data.users.map(u=>`<article class="admin-user"><div><strong>${safe(u.name)}</strong><span class="admin-role">${u.is_admin?'Administrador':'Aluno'}</span><p>${safe(u.email)}</p><small>${u.pages_read||0} páginas lidas · ${u.completed} atividades · ${u.completed*20} XP · ${u.active_sessions} sessões ativas</small><small>Cadastro: ${date(u.created_at)} · Último progresso: ${date(u.updated_at)}</small></div><div class="admin-user-actions"><button class="outline reset-user" data-id="${safe(u.id)}" data-name="${safe(u.name)}" data-email="${safe(u.email)}">Zerar progresso</button>${u.id!==data.actorId?`<button class="outline revoke-user" data-id="${safe(u.id)}" data-name="${safe(u.name)}" ${u.active_sessions===0?'disabled':''}>Encerrar sessões</button>`:'<span class="muted">Sua conta</span>'}</div></article>`).join(''):'<p class="empty">Nenhum usuário encontrado.</p>';
  dialog.querySelector('#admin-prev').disabled=page===0;
  dialog.querySelector('#admin-next').disabled=(page+1)*20>=data.total;
  area.querySelectorAll('.reset-user').forEach(b=>b.onclick=async()=>{
   if(!confirm(`Zerar todo o progresso de ${b.dataset.name} (${b.dataset.email})?

Isso apaga páginas lidas, exercícios concluídos, XP, revisões e respostas salvas. A conta e a senha serão mantidas. Esta ação não pode ser desfeita pela interface.`))return;
   b.disabled=true;
   try{await api('/api/admin','POST',{action:'reset-progress',userId:b.dataset.id});if(b.dataset.id===data.actorId)await window.AuroraAccount.reload();await load();status.textContent='Progresso zerado e ação registrada. O usuário deve atualizar a página para carregar o novo estado.'}catch(e){status.textContent=e.message;b.disabled=false}
  });
  area.querySelectorAll('.revoke-user').forEach(b=>b.onclick=async()=>{
   if(!confirm(`Encerrar todas as sessões de ${b.dataset.name}? Essa pessoa precisará entrar novamente.`))return;
   b.disabled=true;
   try{await api('/api/admin','POST',{action:'revoke-sessions',userId:b.dataset.id});await load();status.textContent='Sessões encerradas. A ação foi registrada.'}catch(e){status.textContent=e.message;b.disabled=false}
  });
 }catch(e){status.textContent=e.message;dialog.querySelector('#admin-prev').disabled=true;dialog.querySelector('#admin-next').disabled=true}
}
window.AuroraAdmin={open(request){api=request;query='';page=0;
 dialog.innerHTML='<div class="modal-head"><div><span class="eyebrow">ADMINISTRAÇÃO</span><h2>Usuários e aprendizado</h2></div><button class="close" aria-label="Fechar administração">×</button></div><p class="muted">Consulte os cadastros, acompanhe o progresso e gerencie as sessões de acesso.</p><form id="admin-search"><input aria-label="Buscar usuário" placeholder="Nome ou e-mail" maxlength="100"><button class="primary">Buscar</button></form><p id="admin-status" class="muted" role="status"></p><div id="admin-users"></div><div class="actions"><button id="admin-prev" class="text-button" disabled>← Anterior</button><button id="admin-next" class="text-button" disabled>Próxima →</button></div>';
 AuroraDialogs.prepare(dialog);
 dialog.querySelector('#admin-search').onsubmit=e=>{e.preventDefault();query=e.currentTarget.querySelector('input').value.trim();page=0;load()};
 dialog.querySelector('#admin-prev').onclick=()=>{if(page>0){page--;load()}};
 dialog.querySelector('#admin-next').onclick=()=>{page++;load()};
 dialog.showModal();load();
}};
})();
