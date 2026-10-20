function renderCourseCatalog(){
 $('#section-heading').textContent='Suas formações';
 $('#section-description').textContent='Escolha uma formação para ver os módulos e continuar seu aprendizado.';
 $('.filters').style.display='none';$('.count').style.display='none';
 $('#extra').innerHTML='<div class="practice-catalog-link"><div><b>SRE: da leitura à operação</b><p>17 projetos, 6 oficinas de cálculo e uma bancada executável.</p></div><button class="primary" id="catalog-practice">Abrir formação prática →</button></div>';$('#catalog-practice').onclick=()=>openPractice();$('#tracks').className='course-catalog';
 const courses=[{id:'SRE',name:'SRE e infraestrutura',label:'CONFIABILIDADE',icon:'>_',description:'Investigue sistemas, resolva incidentes e pratique decisões de engenharia com o Livro 4.',tags:'Linux · Cloud · Operação',tone:'sre'},{id:'DEV',name:'Desenvolvimento',label:'SOFTWARE',icon:'{ }',description:'Construa sua base em APIs, testes, arquitetura e dados com desafios e laboratórios.',tags:'APIs · Arquitetura · SQL',tone:'dev'}];
 $('#tracks').innerHTML=courses.map(c=>{
  const lessons=all.filter(l=>l.formation===c.id&&isPractice(l)),done=lessons.filter(l=>state.done[l.id]).length,percent=Math.round(done/lessons.length*100),modules=curriculum.tracks.filter(t=>t.formation===c.id).length;
  return `<button class="course-cover-card ${c.tone}" data-course="${c.id}"><div class="course-cover" aria-hidden="true"><span>aurora / ${c.label}</span><b>${c.icon}</b><small>${c.tags}</small></div><div class="course-cover-body"><span class="eyebrow">${modules} MÓDULOS · ${lessons.length} ATIVIDADES</span><h2>${c.name}</h2><p>${c.description}</p><div class="course-progress"><span>${done} de ${lessons.length} concluídas</span><strong>${percent}%</strong></div><div class="progress-line"><div style="width:${percent}%"></div></div><span class="course-enter">${done?'Continuar formação':'Explorar formação'} <span aria-hidden="true">→</span></span></div></button>`;
 }).join('');
 document.querySelectorAll('[data-course]').forEach(b=>b.onclick=()=>{
  formation=b.dataset.course;view='learn';filter='all';$('#search').value='';
  try{localStorage.setItem('aurora-formation',formation)}catch{}
  document.querySelectorAll('[data-filter]').forEach(x=>x.classList.toggle('selected',x.dataset.filter==='all'));
  render();$('#main').scrollIntoView({block:'start'});
 });
}

function mountStudyWorkspace(l){
 const dialog=$('#lesson-dialog'),root=$('#lesson-content'),track=curriculum.tracks.find(t=>t.id===l.track);
 dialog.classList.add('study-workspace');root.className='study-layout';
 const article=document.createElement('article');article.className='study-main';article.append(...root.childNodes);
 const outline=document.createElement('aside');outline.className='study-outline';outline.setAttribute('aria-label','Conteúdo do módulo');
 root.append(outline,article);
 const toolbar=dialog.querySelector('.dialog-toolbar'),crumb=document.createElement('nav');
 crumb.className='study-breadcrumb';crumb.setAttribute('aria-label','Caminho da atividade');
 crumb.innerHTML=`<button id="study-courses">Meus cursos</button><span aria-hidden="true">/</span><button id="study-formation">${l.formation==='SRE'?'SRE':'Desenvolvimento'}</button><span aria-hidden="true">/</span><button id="study-chapter">${esc(track.name)}</button>`;
 toolbar.prepend(crumb);
 $('#study-courses').onclick=()=>{dialog.close();view='catalog';render()};
 $('#study-formation').onclick=()=>{dialog.close();formation=l.formation;view='learn';render()};
 $('#study-chapter').onclick=()=>openTrack(l.track);
 updateStudyOutline(l);
 const exercises=all.filter(x=>x.track===l.track&&isPractice(x)),index=exercises.findIndex(x=>x.id===l.id);
 const previous=exercises[index-1],next=exercises[index+1];
 const footer=document.createElement('nav');footer.className='study-navigation';footer.setAttribute('aria-label','Navegação entre atividades');
 footer.innerHTML=`<button class="outline" id="study-previous" ${!previous?'disabled':''}>← Anterior</button><button class="text-button" id="study-module">Ver módulo</button><button class="outline" id="study-next" ${!next?'disabled':''}>Próxima →</button><small>Navegar não marca a atividade como concluída.</small>`;
 article.append(footer);
 $('#study-previous').onclick=()=>previous&&openLesson(previous.id);
 $('#study-next').onclick=()=>next&&openLesson(next.id);
 $('#study-module').onclick=()=>openTrack(l.track);
}

function updateStudyOutline(l){
 const outline=$('.study-outline');if(!outline)return;
 const track=curriculum.tracks.find(t=>t.id===l.track),lessons=all.filter(x=>x.track===l.track),exercises=lessons.filter(isPractice),support=lessons.filter(x=>!isPractice(x)),done=exercises.filter(x=>state.done[x.id]).length;
 const item=(x,index)=>`<button class="study-item ${x.id===l.id?'current':''}" data-study-lesson="${x.id}" ${x.id===l.id?'aria-current="step"':''}><span aria-hidden="true">${!isPractice(x)?'↗':state.done[x.id]?'✓':index+1}</span><span>${esc(x.title)}<small>${!isPractice(x)?'Consulta · sem XP':state.done[x.id]?'Concluída':state.review.includes(x.id)?'Em revisão':x.kind==='command'?'Laboratório Linux':x.kind==='sql'?'Laboratório SQL':esc(x.format||'Desafio interativo')}</small></span></button>`;
 outline.innerHTML=`<details class="study-outline-panel" open><summary>Conteúdo do módulo <span>${done}/${exercises.length}</span></summary><h3>${esc(track.name)}</h3><div class="progress-line"><div style="width:${done/exercises.length*100}%"></div></div><div class="study-items">${exercises.map(item).join('')}</div>${support.length?`<details class="study-support" ${!isPractice(l)?'open':''}><summary>Material de apoio (${support.length})</summary>${support.map(item).join('')}</details>`:''}</details>`;
 outline.querySelectorAll('[data-study-lesson]').forEach(b=>b.onclick=()=>openLesson(b.dataset.studyLesson));
 // On a small screen the content remains reachable through the summary.
 if(window.matchMedia('(max-width:800px)').matches)outline.querySelector('.study-outline-panel').open=false;
}
