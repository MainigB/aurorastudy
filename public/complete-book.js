let completeBook, completeBookPromise;
async function loadCompleteBook(){
 if(completeBook)return completeBook;
 if(!completeBookPromise)completeBookPromise=fetch('book/complete.json').then(r=>{if(!r.ok)throw Error();return r.json()}).then(b=>completeBook=b).catch(e=>{completeBookPromise=null;throw e});
 return completeBookPromise;
}
function completeBookAudio(){return `<div class="book-audio"><div class="book-audio-actions"><button class="primary" id="book-listen">Ouvir página</button><button class="outline" id="book-stop" disabled>Parar</button><details><summary>Ajustar voz</summary><label>Voz<select id="book-voice" aria-label="Voz da leitura"></select></label><label>Velocidade<select id="book-rate" aria-label="Velocidade da leitura">${[.5,.75,1,1.25,1.5,1.75,2].map(n=>`<option value="${n}" ${n===1?'selected':''}>${n}×</option>`).join('')}</select></label><p>Vozes fornecidas pelo navegador e pelo sistema.</p></details></div><p id="book-voice-status" role="status"></p></div>`}
async function openCompletePage(number=1){
 if(!AuroraAccount.isReady()){AuroraAccount.open();return}
 show('<div class="book-reader"><p role="status">Abrindo a edição integral…</p></div>');
 const request=bookRequest;
 try{
  const book=await loadCompleteBook();if(request!==bookRequest||!$('#lesson-dialog').open)return;
  number=AuroraJourney.resolvePage(number);
  const page=book.pages[number-1];
  const topic=all.filter(l=>/^u\d{3}$/.test(l.id)&&l.page<=number&&l.readingEnd>=number).at(-1);
  const activities=all.filter(l=>/^u\d{3}$/.test(l.id)&&l.learningMode==='activity'&&l.readingEnd===number);
  const chapter=book.outline.filter(o=>o.page<=number&&o.level===0).at(-1);
  show(`<div class="book-reader complete-reader"><nav class="book-top"><button class="text-button" id="complete-index">← Minha trilha</button><span>${AuroraJourney.totalPages} PÁGINAS DE LEITURA</span></nav><p class="book-source">${esc(chapter?.title||book.title)}</p><div class="complete-page-heading"><h2>Página ${number}</h2><button class="text-button" id="complete-original">Ver página original</button></div>${completeBookAudio()}<article id="book-text" class="book-prose">${page.blocks.map(b=>b.kind==='heading'?`<h3>${esc(b.text)}</h3>`:b.kind==='code'?`<pre><code>${esc(b.text)}</code></pre>`:`<p>${esc(b.text)}</p>`).join('')}</article><div id="complete-pdf" hidden><p>Esta é a mesma página no arquivo original, com a diagramação e os links do livro.</p><object type="application/pdf" data-original-url="book/livro-4-completo.pdf#page=${number}" aria-label="Página original do livro"><p>Seu navegador não exibe PDF incorporado. Use o link abaixo.</p></object><a href="book/livro-4-completo.pdf#page=${number}" target="_blank" rel="noopener">Abrir PDF completo nesta página ↗</a></div>${page.links.length?`<details class="book-reference"><summary>Links desta página</summary>${page.links.map(url=>`<p><a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a></p>`).join('')}</details>`:''}${activities.length?`<section class="book-checkpoint"><h3>Pratique o que acabou de ler</h3><p>O trecho terminou. Registre sua análise e compare com a resposta comentada.</p>${activities.map(l=>`<button class="primary" data-complete-exercise="${l.id}">${esc(l.title)} →${state.done[l.id]?' · revisitar':''}</button>`).join('')}<p id="complete-auth" role="status"></p></section>`:''}<nav class="book-pagination" aria-label="Páginas do livro"><button class="outline" id="complete-prev" ${number===1?'disabled':''}>← Página anterior</button><span>${number} / ${book.pageCount}</span><button class="primary" id="complete-next" ${number===book.pageCount?'disabled':''}>${activities.length?'Continuar leitura':'Próxima página'} →</button></nav>${number===book.pageCount?'<p>Você chegou ao final do livro. Retome as atividades e os projetos para aplicar o que leu.</p>':''}<form class="complete-jump" id="complete-jump"><label for="complete-number">Ir para a página</label><input id="complete-number" type="number" min="1" max="${book.pageCount}" value="${number}" required><button class="outline">Ir</button></form><p class="book-source">Texto integral da edição final. Para conferir diagramas, alinhamento de código ou links internos, use “Ver página original”. <a href="book/livro-4-completo.pdf" download>Baixar livro completo</a></p></div>`);
  $('#lesson-dialog').classList.add('book-reading');
  if(AuroraAccount.isReady()){state.bookPage=number;if(topic)state.last=topic.id;save()}
  $('#complete-index').onclick=()=>$('#lesson-dialog').close();
  $('#complete-prev').onclick=()=>openCompletePage(AuroraJourney.previousPage(number));
  $('#complete-next').onclick=()=>openCompletePage(AuroraJourney.nextPage(number));
  $('#complete-jump').onsubmit=e=>{e.preventDefault();openCompletePage(Number($('#complete-number').value))};
  $('#complete-original').onclick=()=>{const original=$('#complete-pdf'),text=$('#book-text');original.hidden=!original.hidden;if(!original.hidden){const pdf=original.querySelector('object');pdf.data=pdf.dataset.originalUrl}text.hidden=!original.hidden;AuroraBookVoice.stop();$('#book-listen').disabled=!original.hidden;$('#book-stop').disabled=true;$('#book-listen').textContent='Ouvir página';$('#book-voice-status').textContent='Áudio parado. Volte à leitura para ouvir esta página.';$('#complete-original').textContent=original.hidden?'Ver página original':'Voltar à leitura';if(original.hidden)AuroraBookVoice.bind(text)};
  document.querySelectorAll('[data-complete-exercise]').forEach(b=>b.onclick=()=>{if(!AuroraAccount.isReady()){$('#complete-auth').textContent='Entre para salvar sua resposta e seu progresso.';AuroraAccount.open();return}openBookExercise(b.dataset.completeExercise)});
  AuroraBookVoice.bind($('#book-text'));mountJourneyPage(number);
 }catch{if(request!==bookRequest||!$('#lesson-dialog').open)return;show('<div class="book-reader"><p>Não foi possível carregar a edição integral.</p><button id="complete-retry" class="primary">Tentar novamente</button><p><a href="book/livro-4-completo.pdf" target="_blank" rel="noopener">Abrir o PDF completo</a></p></div>');$('#complete-retry')?.addEventListener('click',()=>openCompletePage(number))}
}
// Legacy callers return to the trail, which is the course navigation.
function openCompleteIndex(){document.querySelector('#lesson-dialog').close()}
