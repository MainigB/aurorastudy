function journeyProgress(){return AuroraJourney.progress(state,all)}
function renderJourney(){
 formation='SRE';view='catalog';document.body.classList.add('journey-only');
 const p=journeyProgress(),next=p.next;
 $('.formation-picker').hidden=true;$('#formation-intro').hidden=true;$('.right-rail').hidden=true;$('.continue-card').hidden=true;$('.filters').style.display='none';$('.section-title').hidden=true;
 $('.page-intro .eyebrow').textContent='SUA JORNADA DE CONFIABILIDADE';$('.page-intro h1').textContent='Um passo de cada vez.';$('.page-intro>div>p').textContent='Leia, pratique e avance. Seu próximo passo está aqui.';
 $('#formation-breadcrumb').textContent='Trilha SRE';$('#main').dataset.view='journey';$('#extra').innerHTML='';$('#tracks').className='journey-home';
 $('#xp').textContent=p.xp;
 const stages=[{name:'Boas-vindas e guia do livro',page:1},...curriculum.tracks.filter(t=>t.formation==='SRE').map(t=>({name:t.name,page:t.page})),{name:'Referências e dicionário',page:683},{name:'Revisão final · CONFIAR',page:815}];
 const current=Math.max(0,stages.findLastIndex(t=>t.page<=next.page));
 const lesson=next.id?all.find(l=>l.id===next.id):null;
 $('#tracks').innerHTML=`<section class="journey-hero"><div class="journey-emblem" aria-hidden="true">✦</div><div><span class="eyebrow">TRILHA ÚNICA · SRE</span><h2>${next.kind==='finished'?'Jornada concluída!':stages[current].name}</h2><p>${next.kind==='exercise'?`Hora de praticar: ${esc(lesson.title)}`:next.kind==='finished'?'Você concluiu as leituras e atividades desta trilha.':'Seu próximo passo: ler ou ouvir a página '+next.page+'.'}</p><button class="primary" id="journey-follow">${next.kind==='finished'?'Revisitar a trilha':p.read||p.done?'Continuar minha trilha':'Começar minha trilha'} →</button></div><div class="journey-percent"><strong>${p.percent}%</strong><span>da jornada</span></div></section><div class="journey-progress" role="progressbar" aria-label="Progresso da jornada" aria-valuenow="${p.percent}" aria-valuemin="0" aria-valuemax="100"><i style="width:${p.percent}%"></i></div><section class="journey-stats" aria-label="Seu progresso"><div><strong>${p.read}<small> / 817</small></strong><span>páginas lidas</span></div><div><strong>${p.done}<small> / ${p.total}</small></strong><span>exercícios concluídos</span></div><div><strong>${p.xp}</strong><span>XP conquistados</span></div></section><p class="journey-note">Confirme cada página após ler ou ouvir. Abrir uma página não conta como leitura.${AuroraAccount.isReady()?' Seu progresso fica salvo na conta.':' Entre na sua conta ao começar para salvar seu avanço.'}</p><div class="journey-map-heading"><h3>Seu caminho</h3><span>Etapa ${current+1} de ${stages.length}</span></div><ol class="journey-map">${stages.map((t,i)=>`<li class="${i<current?'passed':i===current?'current':'upcoming'}" ${i===current?'aria-current="step"':''}><span class="journey-node">${i<current?'✓':i+1}</span><div><strong>${esc(t.name)}</strong><small>${i<current?'Etapa concluída':i===current?'Você está aqui':'Mais adiante'} · página ${t.page}</small></div>${i===current?'<span class="journey-here">AGORA</span>':''}</li>`).join('')}</ol>`;
 $('#journey-follow').onclick=followJourney;
 document.querySelector('footer').innerHTML='aurora · Sua jornada em SRE <span>Leitura → prática → próximo passo</span>';
 const home=document.querySelector('[data-view="catalog"]');home.innerHTML='<span>◉</span> Minha trilha';home.classList.add('active');
}
function followJourney(){
 if(!AuroraAccount.isReady()){AuroraAccount.open();return}
 const next=journeyProgress().next;
 if(next.kind==='exercise')openJourneyExercise(next.id);else openCompletePage(next.kind==='finished'?1:next.page);
}
function mountJourneyPage(number){
 const p=journeyProgress(),next=p.next,read=AuroraJourney.readings(state).includes(number);
 // Consultation remains available inside the reader, but never skips the next learning step.
 $('#complete-index').textContent='← Minha trilha';$('#complete-index').onclick=()=>$('#lesson-dialog').close();
 document.querySelector('.book-top>span').textContent=`${p.read}/817 PÁGINAS · ${p.done}/${p.total} EXERCÍCIOS`;
 document.querySelectorAll('.book-checkpoint').forEach(el=>el.remove());
 const controls=document.querySelector('.book-pagination');
 controls.innerHTML=`<button class="text-button" id="journey-previous" ${number===1?'disabled':''}>← Reler página anterior</button><span>${number} / 817</span><button class="primary" id="journey-page-next">${read?'Seguir a trilha →':'Li esta página · continuar →'}</button>`;
 $('#journey-previous').onclick=()=>openCompletePage(number-1);
 $('#journey-page-next').onclick=()=>{
  if(!AuroraAccount.isReady()){AuroraAccount.open();return}
  if(next.kind==='finished'){number<817?openCompletePage(number+1):$('#lesson-dialog').close();return}
  if(!read&&next.kind==='reading'&&next.page===number){AuroraJourney.markRead(state,number);save();toast(number%10===0?`${number} páginas confirmadas. Continue assim!`:'Leitura registrada ✓')}
  followJourney();
 };
 if(next.kind==='finished')$('#journey-page-next').textContent=number<817?'Próxima página →':'Voltar à trilha';
 $('#complete-jump')?.remove();
 const label=document.createElement('p');label.className='journey-reader-note';label.textContent=read?'Página já lida. Reler não altera sua contagem.':next.kind==='reading'&&number===next.page?'Leia ou ouça com atenção. Ao confirmar, você seguirá para a leitura ou atividade seguinte.':'Página de consulta. Use “Seguir a trilha” para voltar ao seu ponto atual.';controls.before(label);
 if(!read&&(next.kind!=='reading'||next.page!==number))$('#journey-page-next').textContent='Seguir a trilha →';
}
function openJourneyExercise(id){
 const l=all.find(l=>l.id===id);if(!l||!AuroraAccount.isReady())return;
 if(l.kind==='command'){openSreLesson(l);$('#lesson-dialog').classList.add('journey-exercise')}
 else{openBookExercise(id);$('#lesson-dialog').classList.add('journey-exercise')}
 const back=$('#exercise-read')||$('#back');if(back){back.textContent='← Reler o trecho';back.onclick=()=>openCompletePage(l.page||Math.max(1,journeyProgress().next.page-1))}
 $('#exercise-continue')?.remove();
 const note=document.createElement('p');note.className='journey-reader-note';const p=journeyProgress();note.textContent=`Prática da trilha · ${p.done} de ${p.total} exercícios concluídos. Termine esta atividade para liberar o próximo passo.`;$('#lesson-content').prepend(note);
}
