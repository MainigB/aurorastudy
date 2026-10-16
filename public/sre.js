function openSreLesson(l){
 const md=AuroraSRE.markdown,isCommand=l.kind==='command';
 const sections=(l.sections||[]),study=sections.filter(s=>s.role==='study'),practice=sections.filter(s=>s.role==='practice');
 const block=s=>`<section class="sre-block"><h4>${esc(s.title)}</h4>${md(s.body)}</section>`;
 show(`<div class="sre-lesson"><div class="modal-head"><div><span class="eyebrow">${isCommand?'LABORATÓRIO LINUX · COMANDO + INTERPRETAÇÃO':'SRE · ESTUDO E RACIOCÍNIO'} · +20 XP</span><h2>${esc(l.title)}</h2></div><button class="close" aria-label="Fechar">×</button></div>
 <button class="text-button" id="back">← Voltar à trilha</button>
 <p class="muted">${l.minutes} min estimados · ${isCommand?'Cenário fictício · terminal simulado, sem execução real. Cada laboratório começa em um ambiente independente.':'Livro 4, página '+l.page+' · respostas abertas com autoavaliação. Os casos do livro são didáticos; a pesquisa de vagas é histórica.'}</p>
 ${state.done[l.id]?'<p class="sre-note">Você já concluiu esta atividade. Revisite a versão aprofundada sem duplicar XP.</p>':''}
 ${companyMissionBrief(l)}
 <nav class="sre-steps" aria-label="Etapas da aula"><button data-jump="sre-study">01 · Entender</button><button data-jump="sre-practice">02 · Aplicar</button><button data-jump="sre-answer">03 · ${isCommand?'Interpretar':'Comparar'}</button></nav>
 <section id="sre-study" class="sre-section"><span class="eyebrow">01 · BASE PARA A DECISÃO</span><h3>${isCommand?'Antes de abrir o terminal':'Estude o mecanismo'}</h3>
 ${isCommand?`<div class="sre-prose">${md(l.theory)}</div><details class="sre-details"><summary>Sintaxe, opções e limites do comando</summary><div class="sre-prose">${md(l.mechanics)}</div></details>`:`<p class="sre-objective"><b>Pergunta-guia:</b> ${esc(l.question)}</p>${l.prerequisite?`<button class="text-button" id="prerequisite">Revisar pré-requisito: ${esc(all.find(x=>x.id===l.prerequisite)?.title||l.prerequisite)} →</button>`:''}<div class="sre-prose">${study.length?study.map(block).join(''):'<p>Esta atividade é um caso prático. Leia as evidências abaixo, responda antes de consultar a solução e use sua cópia do livro para revisar os fundamentos.</p>'}</div>${l.example?`<details class="sre-details"><summary>Exemplo guiado · ${esc(l.example.title)}</summary><div class="sre-prose">${md(l.example.body)}</div></details>`:''}${l.vocabulary.length?`<details class="sre-details"><summary>Vocabulário essencial (${l.vocabulary.length} termos)</summary><dl>${l.vocabulary.map(v=>`<dt>${esc(v.term)}</dt><dd>${esc(v.definition)}</dd>`).join('')}</dl></details>`:''}${pdfLink(l.page)}`}</section>
 <section id="sre-practice" class="sre-section"><span class="eyebrow">02 · APLIQUE AO CENÁRIO</span><h3>${isCommand?'Seu plantão no Aurora':'Construa uma resposta verificável'}</h3>
 <div class="scenario sre-prose">${isCommand?md(l.scenario):practice.length?practice.map(block).join(''):md(l.scenario)}</div>
 ${isCommand?`<p>Digite a consulta pedida. Depois, interprete a saída para concluir a atividade.</p><form id="command-form"><div class="terminal"><small>aurora@laboratorio · SAÍDA SINTÉTICA</small><pre id="terminal-output">Aguardando sua consulta…</pre><label><span>❯</span><input id="command" aria-label="Comando Linux" placeholder="Escreva seu comando" maxlength="1000" autocomplete="off" spellcheck="false" value="${esc((state.drafts[l.id]||'').slice(0,1000))}"></label></div><div class="actions"><button class="primary">Verificar comando →</button><button class="text-button" type="button" id="hint">Dica progressiva</button></div></form><div id="command-feedback" aria-live="polite"></div>`:`<ol class="sre-prompts">${l.questions.map(q=>`<li>${esc(q)}</li>`).join('')}</ol><button class="text-button" id="report-template">Estruturar meu registro de trabalho</button><label for="answer">Sua análise · mecanismo, evidência, decisão e limites</label><textarea id="answer" class="answer" maxlength="20000" placeholder="Organize sua resposta: 1. O que observei; 2. Como explico; 3. O que faria e verificaria; 4. Qual alternativa considerei.">${esc(state.drafts[l.id]||'')}</textarea><p class="muted">Seu rascunho é salvo na conta. A comparação é uma autoavaliação, sem correção semântica automática.</p><div class="actions"><button class="primary" id="compare">Abrir resposta comentada →</button></div>`}
 <button class="text-button" id="later">Guardar para revisar</button></section>
 <section id="sre-answer" class="sre-section"><span class="eyebrow">03 · ${isCommand?'INTERPRETE A EVIDÊNCIA':'COMPARE E APROFUNDE'}</span><h3>${isCommand?'O que a saída permite concluir?':'Reveja sua decisão'}</h3>
 <p id="sre-answer-pending" class="muted">${isCommand?'A interpretação será liberada depois de um comando correto. Acertar apenas a sintaxe ainda não conclui o laboratório.':'Escreva sua análise antes de abrir a referência. Compare o raciocínio e as condições do caso, não apenas palavras iguais.'}</p>
 <div id="comparison"></div><div id="feedback" aria-live="polite"></div></section>
 ${isCommand?`<section class="sre-section"><h3>Leve o raciocínio além</h3><p>${esc(l.transfer)}</p><details class="sre-details"><summary>Conferir o raciocínio da extensão</summary><p>${esc(l.transferAnswer)}</p></details><a class="pdf-link" href="${esc(l.source)}" target="_blank" rel="noopener noreferrer">Manual técnico para aprofundar ↗</a></section>`:''}</div>`);
 $('#back').onclick=()=>openTrack(l.track);$('#mission-board').onclick=()=>openTrack(l.track);
 document.querySelectorAll('[data-jump]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.jump).scrollIntoView({behavior:'smooth',block:'start'}));
 $('.connect-inline')?.addEventListener('click',()=>$('#pdf-input').click());
 $('#prerequisite')?.addEventListener('click',()=>openLesson(l.prerequisite));
 $('#later').onclick=()=>{if(!state.review.includes(l.id))state.review.push(l.id);save();updateStats();toast('Atividade adicionada à revisão.')};
 const incorrect=(selector,message)=>{if(!state.review.includes(l.id))state.review.push(l.id);save();updateStats();refreshMissionStatus(l);$(selector).innerHTML=`<div class="feedback error">${esc(message)}</div>`};
 if(isCommand){
  let hint=0,commandCorrect=false;
  $('#command').oninput=e=>{state.drafts[l.id]=e.target.value;save();refreshMissionStatus(l)};
  $('#hint').onclick=()=>{const hints=[...l.hints,`Comando de referência: ${l.answer}. Consulte a explicação de sintaxe e depois interprete a saída.`];$('#command-feedback').innerHTML=`<div class="feedback"><b>Dica ${Math.min(hint+1,hints.length)} de ${hints.length}</b><p>${esc(hints[Math.min(hint++,hints.length-1)])}</p></div>`};
  $('#command-form').onsubmit=e=>{e.preventDefault();const value=$('#command').value;
   if(!Aurora.checkCommand(l,value)){incorrect('#command-feedback','Este comando não corresponde à consulta pedida. Confira objetivo, caminho, letras maiúsculas e opções. O simulador reconhece somente as variantes previstas; isso não significa que toda outra sintaxe seja inválida no Linux real.');return}
   commandCorrect=true;$('#command').readOnly=true;$('#command-form button.primary').disabled=true;
   $('#terminal-output').textContent=l.id==='linux-12'&&value.includes('+short')?'192.0.2.10':l.output;
   $('#command-feedback').innerHTML='<div class="feedback"><b>Etapa 1 concluída.</b> Agora leia a saída e responda abaixo. O XP será concedido após a interpretação.</div>';
   $('#sre-answer-pending').hidden=true;
   $('#comparison').innerHTML=`<p class="question">${esc(l.question)}</p><form id="interpret-form"><fieldset class="quiz-options"><legend class="sr-only">Interpretação do resultado</legend>${l.options.map((o,i)=>`<label><input type="radio" name="interpret" value="${i}" required><span>${esc(o)}</span></label>`).join('')}</fieldset><button class="primary">Verificar interpretação →</button></form>`;
   $('#interpret-form').onsubmit=event=>{event.preventDefault();const raw=new FormData(event.currentTarget).get('interpret'),choice=raw===null?-1:Number(raw);
    if(AuroraSRE.canComplete(commandCorrect,l,choice)){complete(l,false);$('#feedback .feedback').insertAdjacentHTML('beforeend',`<p>${esc(l.feedback[choice])}</p><p><b>Comando e interpretação concluídos.</b> O exercício verifica esse cenário, não certifica operação em produção.</p>`);$('#interpret-form button').disabled=true;}
    else incorrect('#feedback',l.feedback[choice]||'Selecione uma interpretação.');
   };
   $('#sre-answer').scrollIntoView({behavior:'smooth',block:'start'});
  };
 }else{
  $('#answer').oninput=e=>{state.drafts[l.id]=e.target.value;save();refreshMissionStatus(l)};
  $('#report-template').onclick=()=>{if($('#answer').value.trim()){toast('Seu rascunho foi preservado. Use os campos de observação, hipótese, decisão, verificação e passagem de turno para organizá-lo.');return}$('#answer').value=companyReportTemplate(l);state.drafts[l.id]=$('#answer').value;save();refreshMissionStatus(l);$('#answer').focus()};
  $('#compare').onclick=()=>{
   if($('#answer').value.trim().length<80||$('#answer').value.trim()===companyReportTemplate(l).trim()){incorrect('#feedback','Preencha sua análise, não apenas o modelo, com pelo menos 80 caracteres antes de comparar. Esse limite verifica apenas preenchimento, não qualidade.');$('#feedback').scrollIntoView({behavior:'smooth',block:'center'});return}
   $('#sre-answer-pending').hidden=true;$('#feedback').innerHTML='';
   const solutions=sections.filter(s=>s.role==='solution');
   $('#comparison').innerHTML=`<p class="sre-note">Referência de estudo, não resposta única. Compare hipóteses e critérios; outras decisões podem ser defensáveis quando você explicita as condições.</p><div class="sre-prose">${solutions.length?solutions.map(block).join(''):md(l.reference)}</div><h4>Autoavaliação por evidências</h4><p>Edite sua análise se faltar algum elemento. Marque cada critério somente quando ele aparecer na sua resposta.</p><div class="rubric">${l.rubric.map(r=>`<label><input type="checkbox"> ${esc(r)}</label>`).join('')}</div><button class="primary" id="self-complete" disabled>Registrar minha autoavaliação ✓</button>`;
   document.querySelectorAll('.rubric input').forEach(c=>c.onchange=()=>$('#self-complete').disabled=document.querySelectorAll('.rubric input:checked').length!==l.rubric.length);
   $('#self-complete').onclick=()=>{complete(l,true);$('#self-complete').disabled=true};
   $('#sre-answer').scrollIntoView({behavior:'smooth',block:'start'});
  };
 }
}
