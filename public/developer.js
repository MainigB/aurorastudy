let sqlWorker=null,sqlTimeout=null;
function stopSql(){clearTimeout(sqlTimeout);sqlTimeout=null;if(sqlWorker){sqlWorker.terminate();sqlWorker=null}}
function openDeveloperLesson(l){
 stopSql();
 show(`<div class="modal-head"><div><span class="eyebrow">DESENVOLVIMENTO · ${l.kind==='sql'?'LABORATÓRIO SQL':'APRENDER E PRATICAR'} · +20 XP</span><h2>${esc(l.title)}</h2></div><button class="close" aria-label="Fechar">×</button></div><button class="text-button" id="back">← Voltar ao módulo</button><div class="lesson-theory"><h3>Entenda o conceito</h3><p>${esc(l.theory)}</p><pre><code>${esc(l.code)}</code></pre><p class="muted">${l.kind==='sql'?'Exemplo em SQLite. O banco é recriado a cada execução.':'Exemplo didático. Trechos de código ilustram o conceito e não são executados.'}</p></div><h3>Seu desafio</h3><div class="scenario">${esc(l.scenario)}</div><p class="question">${esc(l.question)}</p>${l.kind==='quiz'?`<form id="quiz-form"><fieldset class="quiz-options"><legend class="sr-only">Escolha uma resposta</legend>${l.options.map((o,i)=>`<label><input type="radio" name="choice" value="${i}" required><span>${esc(o)}</span></label>`).join('')}</fieldset><div class="actions"><button class="primary">Verificar resposta →</button><button class="text-button" type="button" id="later">Revisar depois</button></div></form>`:`<details><summary>Ver tabelas e dados do laboratório</summary><pre class="sql-schema"><code>${esc(curriculum.sqlSetup)}</code></pre></details><label class="muted" for="sql-code">Escreva seu SQL</label><textarea id="sql-code" class="answer sql-input" spellcheck="false" maxlength="10000" placeholder="SELECT ...">${esc(state.drafts[l.id]||'')}</textarea><div class="actions"><button class="primary" id="run-sql">Executar e verificar →</button><button class="text-button" id="solution">Consultar solução</button><button class="text-button" id="later">Revisar depois</button></div><p class="muted">SQLite isolado no navegador. A correção compara colunas, valores e ordem do resultado final; não avalia desempenho ou a estrutura da consulta.</p><div id="sql-output" aria-live="polite"></div><div id="sql-solution"></div>`}<div id="feedback" aria-live="polite"></div><div class="lesson-source"><a href="${esc(l.source)}" target="_blank" rel="noopener noreferrer">Documentação para aprofundar ↗</a></div>`);
 $('#back').onclick=()=>{stopSql();openTrack(l.track)};
 $('#later').onclick=()=>{if(!state.review.includes(l.id))state.review.push(l.id);save();render();toast('Aula adicionada à revisão.')};
 function incorrect(text){if(!state.review.includes(l.id))state.review.push(l.id);save();updateStats();$('#feedback').innerHTML=`<div class="feedback error">${esc(text)}</div>`}
 if(l.kind==='quiz'){
  $('#quiz-form').onsubmit=e=>{e.preventDefault();const index=Number(new FormData(e.currentTarget).get('choice'));if(AuroraLearning.checkQuiz(l,index)){complete(l,false);$('#feedback .feedback').insertAdjacentHTML('beforeend',`<p>${esc(l.explanation)}</p>`)}else{incorrect('Reveja sua decisão: '+l.explanation)}};
 }else{
  $('#sql-code').oninput=e=>{state.drafts[l.id]=e.target.value;save()};
  $('#solution').onclick=()=>{$('#sql-solution').innerHTML=`<details open><summary>Solução comentada</summary><pre class="sql-schema"><code>${esc(l.solution)}</code></pre><p class="muted">${esc(l.explanation)}</p></details>`};
  $('#run-sql').onclick=()=>{
   const sql=$('#sql-code').value.trim();if(!sql){incorrect('Digite uma consulta antes de executar.');return}
   stopSql();const button=$('#run-sql');button.disabled=true;button.textContent='Executando…';$('#feedback').innerHTML='';
   const worker=sqlWorker=new Worker('sql-worker.js');
   const done=()=>{clearTimeout(timeout);worker.terminate();if(sqlWorker===worker)sqlWorker=null;button.disabled=false;button.textContent='Executar e verificar →'};
   const timeout=sqlTimeout=setTimeout(()=>{done();if($('#sql-code'))incorrect('A execução ultrapassou 12 segundos. Revise a consulta e tente novamente.')},12000);
   worker.onmessage=({data})=>{done();if(!$('#sql-code'))return;if(data.error){$('#sql-output').textContent='';incorrect('O SQLite retornou: '+data.error);return}
    $('#sql-output').innerHTML=`<div class="sql-result"><table><caption>Resultado da sua consulta${data.truncated?' (primeiras 100 linhas)':''}</caption><thead><tr>${data.output.columns.map(c=>`<th>${esc(c)}</th>`).join('')}</tr></thead><tbody>${data.output.values.map(row=>`<tr>${row.map(v=>`<td>${v===null?'<em>NULL</em>':esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table>${!data.output.values.length?'<p class="muted">Nenhuma linha retornada.</p>':''}</div>`;
    if(data.correct)complete(l,false);else incorrect('A consulta executou, mas o resultado difere do esperado. Confira colunas, filtros e ordenação. Você pode consultar a solução.');
   };
   worker.onerror=()=>{done();if($('#sql-code'))incorrect('Não foi possível carregar o laboratório SQL. Confira sua conexão e tente novamente.')};
   worker.postMessage({sql,setup:curriculum.sqlSetup,solution:l.solution,checkQuery:l.checkQuery});
  };
 }
}
document.querySelector('#lesson-dialog').addEventListener('close',stopSql);
