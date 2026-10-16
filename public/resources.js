/* Shared, optional materials: external links never award XP or alter progress. */
(function(root){
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const safe=url=>{try{return new URL(url).protocol==='https:'}catch{return false}};
 function render(lesson,catalog){
  const item=catalog?.lessons?.[lesson.id];
  if(!item)return '<section class="lesson-resources"><h3>Vídeos e referências</h3><p>Os materiais complementares não estão disponíveis agora. Você pode continuar a aula e atualizar a página depois.</p></section>';
  const videos=item.videos.map(id=>catalog.videos[id]).filter(v=>v&&safe(v.url));
  const refs=item.references.filter(r=>safe(r.url));
  return `<section class="lesson-resources" id="lesson-resources" aria-labelledby="resources-title"><span class="eyebrow">EXPLORE OUTRAS FONTES</span><h3 id="resources-title">Vídeos e referências</h3><p>Materiais de apoio ao tema desta aula. Alguns apresentam fundamentos da trilha; use a documentação para aprofundar os detalhes do desafio.</p><div class="resource-grid">${videos.map(v=>`<article class="resource-card"><div class="resource-meta"><span>▶ YouTube</span><span>${v.language==='pt-BR'?'Português':'Inglês'}</span></div><h4><a href="${escape(v.url)}" target="_blank" rel="noopener noreferrer">${escape(v.title)} ↗</a></h4><small>${escape(v.channel)} · ${escape(v.topic)}</small><p>${escape(v.focus)}</p></article>`).join('')}</div><h4>Leia também</h4><ul class="resource-references">${refs.map(r=>`<li><a href="${escape(r.url)}" target="_blank" rel="noopener noreferrer">${escape(r.title)} ↗</a><small>${escape(new URL(r.url).hostname)}</small></li>`).join('')}</ul><details class="sre-details"><summary>Como aproveitar estes materiais no desafio</summary><p>Depois de estudar, volte a “${escape(lesson.title)}”. Explique com suas palavras um conceito, indique uma evidência para testá-lo e registre uma condição em que ele não se aplica. Nos casos da Aurora, use isso para justificar sua decisão à equipe.</p><p>Os vídeos são opcionais e abrem em outra aba. Assistir não conclui a atividade. Exemplos, interfaces e versões dos materiais externos podem diferir dos usados aqui.</p></details></section>`;
 }
 root.AuroraResources={render};
 if(typeof module!=='undefined')module.exports={render};
})(typeof window!=='undefined'?window:globalThis);
