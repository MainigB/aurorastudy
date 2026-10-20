let interactiveBook,bookRequest=0;
async function loadInteractiveBook(){if(!interactiveBook){const response=await fetch('interactive-book.json');if(!response.ok)throw Error();interactiveBook=await response.json()}return interactiveBook;}
async function openBookReader(id){
 show('<div class="book-reader"><p role="status">Abrindo o livro…</p></div>');
 const request=bookRequest;
 try{
  const pages=await loadInteractiveBook();if(request!==bookRequest||!$('#lesson-dialog').open)return;
  const index=pages.findIndex(p=>p.id===id);if(index<0)throw Error();
  const page=pages[index],track=curriculum.tracks.find(t=>t.id===page.track),chapter=pages.filter(p=>p.track===page.track),position=chapter.findIndex(p=>p.id===id);
  const text=page.sections.filter(s=>!page.activity||!s.answer).map(s=>AuroraSRE.markdown(s.text)).join('');
  const answers=page.sections.filter(s=>s.answer);
  show(`<div class="book-reader"><nav class="book-top"><button class="text-button" id="reader-chapter">← Capítulos</button><span>CAPÍTULO ${track.chapter} · TRECHO ${position+1} DE ${chapter.length}</span></nav><h2>${esc(page.title)}</h2><p class="book-source">Livro 4 · ${esc(readingPages(page))}</p><div class="book-audio"><div class="book-audio-actions"><button class="primary" id="book-listen">Ouvir trecho</button><button class="outline" id="book-stop" disabled>Parar</button><details><summary>Ajustar voz</summary><label>Voz<select id="book-voice" aria-label="Voz da leitura"></select></label><label>Velocidade<select id="book-rate" aria-label="Velocidade da leitura">${[.5,.75,1,1.25,1.5,1.75,2].map(n=>`<option value="${n}" ${n===1?'selected':''}>${n}×</option>`).join('')}</select></label><p>Algumas vozes usam serviços do navegador. A disponibilidade e a pronúncia variam conforme seu dispositivo.</p></details></div><p id="book-voice-status" role="status"></p></div><article id="book-text" class="book-prose">${text}</article>${page.activity&&answers.length?`<details class="book-reference"><summary>Resposta e critérios do livro · consulte depois da tentativa</summary>${answers.map(s=>AuroraSRE.markdown(s.text)).join('')}</details>`:''}<div class="book-checkpoint">${page.activity?`<h3>Agora, use o que acabou de ler</h3><p>Responda à atividade deste trecho. Seu texto fica salvo na conta.</p><button class="primary" id="reader-exercise">Responder sobre este trecho →</button><p id="reader-auth" role="status"></p>`:`<p>Este trecho é de leitura. Continue para acompanhar a sequência do livro.</p>`}</div><nav class="book-pagination" aria-label="Navegação no livro"><button class="outline" id="reader-previous" ${index===0?'disabled':''}>← Trecho anterior</button><button class="${page.activity?'text-button':'primary'}" id="reader-next" ${index===pages.length-1?'disabled':''}>${page.activity?'Continuar leitura sem responder':'Próximo trecho'} →</button></nav><details class="book-index"><summary>Escolher outro trecho deste capítulo</summary>${chapter.map((p,i)=>`<button class="book-index-item" data-book-page="${p.id}" ${p.id===id?'aria-current="page"':''}>${i+1}. ${esc(p.title)}${p.activity?' · atividade':''}</button>`).join('')}</details></div>`);
  $('#lesson-dialog').classList.add('book-reading');
  if(window.AuroraAccount.isReady()){state.last=id;save();}
  $('#reader-chapter').onclick=()=>openTrack(page.track);
  $('#reader-previous').onclick=()=>openBookReader(pages[index-1].id);
  $('#reader-next').onclick=()=>openBookReader(pages[index+1].id);
  document.querySelectorAll('[data-book-page]').forEach(b=>b.onclick=()=>openBookReader(b.dataset.bookPage));
  $('#reader-exercise')?.addEventListener('click',()=>{if(!window.AuroraAccount.isReady()){$('#reader-auth').textContent='Entre na sua conta para responder e salvar seu progresso.';window.AuroraBookVoice.stop();window.AuroraAccount.open();return;}openBookExercise(id)});
  AuroraBookVoice.bind($('#book-text'));
 }catch{if(request===bookRequest)show('<div class="book-reader"><p>Não foi possível abrir o livro. Feche esta janela e tente novamente.</p></div>');}
}
function openBookExercise(id){
 const l=all.find(l=>l.id===id);if(!l||!AuroraAccount.isReady())return;
 state.last=id;save();openSreLesson(l);$('#lesson-dialog').classList.add('book-exercise');
 const root=$('#lesson-content');root.insertAdjacentHTML('afterbegin','<button class="text-button" id="exercise-read">← Voltar ao trecho do livro</button>');
 $('#exercise-read').onclick=()=>openBookReader(id);
 const practice=$('#sre-practice');practice.querySelector('h3').textContent='Atividade sobre a leitura';
 $('#feedback').insertAdjacentHTML('afterend','<button class="text-button" id="exercise-continue">Continuar leitura sem concluir →</button>');
 $('#exercise-continue').onclick=()=>nextBookPage(id);
}
function nextBookPage(id){const index=interactiveBook?.findIndex(p=>p.id===id)??-1;if(index>=0&&index<interactiveBook.length-1)openBookReader(interactiveBook[index+1].id);else openTrack(all.find(l=>l.id===id)?.track||'PRE');}
