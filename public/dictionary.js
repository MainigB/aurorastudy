(function(root){
 function entries(book){
  const terms=book.outline.filter(o=>o.level===1&&o.page>=693&&o.page<815);
  const result=[];let current=null;
  for(const page of book.pages.filter(p=>p.number>=693&&p.number<815))for(const block of page.blocks){
   if(block.kind==='heading'){
    const term=terms.find(t=>t.page===page.number&&t.title===block.text);
    current=term?{title:term.title,page:term.page,paragraphs:[]}:null;
    if(current)result.push(current);
   }else if(current)current.paragraphs.push(block.text);
  }
  return result;
 }
 const normalize=s=>s.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 function search(items,query){const q=normalize(query.trim());return items.filter(e=>normalize(e.title+' '+e.paragraphs.join(' ')).includes(q))}
 const api={entries,search};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.AuroraDictionary=api;
})(typeof window==='undefined'?globalThis:window);

let dictionaryDialog,dictionaryRequest=0;
async function openDictionary(){
 if(!AuroraAccount.isReady()){AuroraAccount.open();return}
 if(!dictionaryDialog){dictionaryDialog=document.createElement('dialog');dictionaryDialog.id='dictionary-dialog';document.body.append(dictionaryDialog);dictionaryDialog.addEventListener('close',()=>dictionaryRequest++)}
 const request=++dictionaryRequest;
 dictionaryDialog.innerHTML='<div class="book-reader"><h2>Dicionário do livro</h2><p role="status">Carregando os termos…</p></div>';
 AuroraDialogs.prepare(dictionaryDialog);if(!dictionaryDialog.open)dictionaryDialog.showModal();
 try{
  const book=await loadCompleteBook();if(request!==dictionaryRequest||!dictionaryDialog.open||!AuroraAccount.isReady())return;
  const items=AuroraDictionary.entries(book);
  dictionaryDialog.innerHTML=`<div class="book-reader"><p class="eyebrow">CONSULTA LIVRE · LIVRO 4</p><h2>Dicionário do livro</h2><p>Consulte os termos a qualquer momento. A consulta não altera sua posição nem seu progresso na trilha.</p><label for="dictionary-search">Buscar termo ou definição</label><input id="dictionary-search" type="search" placeholder="Ex.: Ansible, SLO, idempotência" autocomplete="off"><p id="dictionary-count" role="status"></p><div id="dictionary-results"></div></div>`;
  AuroraDialogs.prepare(dictionaryDialog);
  const input=dictionaryDialog.querySelector('#dictionary-search'),results=dictionaryDialog.querySelector('#dictionary-results');
  const update=()=>{const matches=AuroraDictionary.search(items,input.value);dictionaryDialog.querySelector('#dictionary-count').textContent=`${matches.length} de ${items.length} termos`;results.innerHTML=matches.length?matches.map(e=>`<details class="book-reference"><summary>${esc(e.title)} <small>· página ${e.page}</small></summary>${e.paragraphs.map(p=>`<p>${esc(p)}</p>`).join('')}</details>`).join(''):'<p>Nenhum termo encontrado. Tente outra palavra.</p>'};
  input.oninput=update;update();input.focus();
 }catch{if(request!==dictionaryRequest||!dictionaryDialog.open)return;dictionaryDialog.innerHTML='<div class="book-reader"><h2>Dicionário do livro</h2><p role="alert">Não foi possível carregar o dicionário.</p><button class="primary" id="dictionary-retry">Tentar novamente</button></div>';AuroraDialogs.prepare(dictionaryDialog);dictionaryDialog.querySelector('#dictionary-retry').onclick=openDictionary}
}
