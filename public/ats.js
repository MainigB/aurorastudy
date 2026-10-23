let atsDialog,atsGeneration=0,atsFileGeneration=0,atsCancel=()=>{};
async function extractResume(file,status){
 if(file.size>10*1024*1024)throw Error('O arquivo deve ter até 10 MB.');
 const bytes=await file.arrayBuffer();
 if(/\.docx$/i.test(file.name))return new Promise((resolve,reject)=>{
  const worker=new Worker('ats-docx-worker.js');
  const finish=(error,result)=>{clearTimeout(timer);worker.terminate();error?reject(Error(error)):resolve(result)};
  const timer=setTimeout(()=>finish('O documento demorou demais para abrir. Tente um arquivo menor ou cole o texto abaixo.'),30000);
  atsCancel=()=>finish('Leitura cancelada.');worker.onerror=()=>finish('Falha ao abrir o DOCX. Tente colar o texto abaixo.');
  worker.onmessage=e=>finish(e.data.error,e.data);worker.postMessage(bytes,[bytes]);
 });
 if(!/\.pdf$/i.test(file.name))throw Error('Escolha um arquivo PDF ou DOCX.');
 const pdfjs=await import('./vendor/ats/pdf.min.mjs');pdfjs.GlobalWorkerOptions.workerSrc='vendor/ats/pdf.worker.min.mjs';
 const task=pdfjs.getDocument({data:new Uint8Array(bytes),isEvalSupported:false,useSystemFonts:true});
 let expired=false;const timer=setTimeout(()=>{expired=true;task.destroy()},30000);atsCancel=()=>task.destroy();
 try{
  const pdf=await task.promise;if(pdf.numPages>30)throw Error('O PDF deve ter até 30 páginas.');
  let text='',blank=0;
  for(let n=1;n<=pdf.numPages;n++){status(`Lendo página ${n} de ${pdf.numPages}…`);const page=await pdf.getPage(n),content=await page.getTextContent();const part=content.items.map(i=>(i.str||'')+(i.hasEOL?'\n':' ')).join('');if(!part.trim())blank++;text+=part+'\n';page.cleanup();if(text.length>200000)throw Error('O texto ultrapassa 200 mil caracteres.')}
  return {text,warnings:blank};
 }catch(e){if(expired)throw Error('O PDF demorou demais para abrir. Tente um arquivo menor.');if(e.name==='PasswordException')throw Error('O PDF está protegido por senha. Use uma cópia desbloqueada.');throw e}
 finally{clearTimeout(timer);await task.destroy()}
}
function openATS(){
 if(!AuroraAccount.isReady()){AuroraAccount.open();return}
 if(atsDialog?.open)return;
 if(!atsDialog){atsDialog=document.createElement('dialog');atsDialog.id='ats-dialog';document.body.append(atsDialog);atsDialog.addEventListener('close',()=>{atsGeneration++;atsFileGeneration++;atsCancel();atsDialog.innerHTML=''})}
 atsDialog.innerHTML=`<div class="book-reader ats-reader"><p class="eyebrow">CARREIRA · COMPARAÇÃO DE CURRÍCULO</p><h2>Seu currículo e a próxima oportunidade</h2><p>Compare as palavras-chave da vaga com seu currículo. O arquivo é processado neste navegador e não é enviado ao servidor nem salvo na sua conta.</p><p class="journey-reader-note">A nota mede cobertura de termos. Não representa chance de contratação nem reproduz a avaliação de um ATS comercial. Não avalia experiência, contexto de negações ou qualidade do currículo.</p><label for="ats-file">1. Seu currículo · PDF ou DOCX, até 10 MB</label><input id="ats-file" type="file" accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"><p id="ats-file-status" role="status">PDF com texto selecionável, até 30 páginas. Arquivos escaneados precisam de OCR antes da análise.</p><details id="ats-preview"><summary>Conferir ou corrigir o texto do currículo</summary><p>Você também pode colar o texto aqui. Confira a extração antes de comparar, especialmente em currículos com colunas, imagens ou cabeçalhos.</p><textarea id="ats-resume" maxlength="200000" aria-label="Texto do currículo" placeholder="Texto extraído do currículo ou colado por você"></textarea></details><label for="ats-job">2. Descrição da vaga</label><textarea id="ats-job" maxlength="50000" placeholder="Cole os requisitos e a descrição completa da vaga"></textarea><details><summary>Adicionar palavras-chave específicas</summary><label for="ats-custom">Termos separados por vírgula (até 30)</label><input id="ats-custom" maxlength="1000" placeholder="Ex.: Datadog, FinOps, OpenShift"><p>Entram no cálculo somente se também aparecerem na descrição da vaga.</p></details><div class="actions"><button class="primary" id="ats-compare">Comparar currículo →</button><button class="text-button" id="ats-clear">Limpar dados</button></div><p id="ats-status" role="status"></p><section id="ats-result" aria-label="Resultado da comparação" hidden></section></div>`;
 AuroraDialogs.prepare(atsDialog);atsDialog.showModal();
 const q=s=>atsDialog.querySelector(s),result=q('#ats-result'),status=q('#ats-status'),button=q('#ats-compare');
 const invalidate=()=>{result.hidden=true;result.innerHTML='';status.textContent=''};
 ['#ats-resume','#ats-job','#ats-custom'].forEach(id=>q(id).oninput=()=>{atsGeneration++;button.disabled=false;invalidate()});
 q('#ats-resume').oninput=()=>{atsFileGeneration++;atsGeneration++;atsCancel();button.disabled=false;invalidate()};
 q('#ats-file').onchange=async e=>{
  atsCancel();const generation=++atsFileGeneration,file=e.target.files[0];atsGeneration++;invalidate();q('#ats-resume').value='';if(!file)return;
  button.disabled=true;q('#ats-file-status').textContent='Extraindo texto localmente…';
  try{const extracted=await extractResume(file,text=>{if(generation===atsFileGeneration)q('#ats-file-status').textContent=text});if(generation!==atsFileGeneration||!atsDialog.open)return;
   if(extracted.text.length>200000)throw Error('O texto ultrapassa 200 mil caracteres.');
   q('#ats-resume').value=extracted.text;
   q('#ats-file-status').textContent=extracted.text.trim().length<30?'Não foi extraído texto suficiente. Use OCR para PDF escaneado ou cole o texto manualmente.':`${extracted.text.length.toLocaleString('pt-BR')} caracteres extraídos. Confira o texto antes de comparar.${extracted.warnings?' Há páginas sem texto ou avisos de extração; revise o conteúdo.':''}`;
   q('#ats-preview').open=true;
  }catch(error){if(generation===atsFileGeneration&&atsDialog.open)q('#ats-file-status').textContent=error.message||'Não foi possível abrir o arquivo. Tente colar o texto.'}
  finally{if(generation===atsFileGeneration&&atsDialog.open)button.disabled=false}
 };
 button.onclick=async()=>{
  invalidate();if(!AuroraAccount.isReady()){atsDialog.close();AuroraAccount.open();return}
  const resume=q('#ats-resume').value.trim(),job=q('#ats-job').value.trim(),custom=q('#ats-custom').value.split(',').map(s=>s.trim()).filter(Boolean);
  if(resume.length<30||job.length<30){status.textContent='Inclua pelo menos 30 caracteres no currículo e na descrição da vaga.';return}
  if(custom.length>30){status.textContent='Use no máximo 30 termos adicionais.';return}
  const generation=++atsGeneration;button.disabled=true;status.textContent='Comparando termos do dicionário e tecnologias…';
  try{const book=await loadCompleteBook();if(generation!==atsGeneration||!atsDialog.open)return;
   const analysis=AuroraATS.compare(resume,job,AuroraDictionary.entries(book).map(e=>e.title),custom);
   const list=terms=>terms.length?`<ul class="ats-tags">${terms.map(t=>`<li>${esc(t)}</li>`).join('')}</ul>`:'<p>Nenhum termo nesta categoria.</p>';
   result.innerHTML=analysis.score===null?'<h3>Sem nota nesta comparação</h3><p>Não identificamos palavras-chave do catálogo na vaga. Confira a descrição ou adicione termos específicos acima.</p>':`<div class="ats-score"><strong>${analysis.score}<small>/100</small></strong><div><h3>Correspondência de palavras-chave</h3><p>${analysis.found.length} de ${analysis.total} termos identificados na vaga aparecem no currículo.</p></div></div><h3>Encontrados no currículo</h3>${list(analysis.found)}<h3>Não encontrados no currículo</h3>${list(analysis.missing)}<details><summary>Como a nota foi calculada</summary><p>Nota = termos encontrados ÷ termos identificados na vaga × 100, arredondada. Cada termo conta uma vez e tem o mesmo peso, mesmo que a vaga o trate como desejável. Repetir palavras não aumenta a nota. Reconhecemos algumas siglas e variações, como AWS e Amazon Web Services. Apenas termos do catálogo e os adicionados por você entram no cálculo.</p></details><p>Revise os termos ausentes e inclua exemplos concretos apenas quando corresponderem à sua experiência. A presença de uma palavra não comprova domínio; frases como “não tenho experiência em Java” ainda contam como ocorrência.</p>`;
   result.hidden=false;status.textContent='Comparação concluída. Os dados serão apagados ao fechar esta janela.';result.scrollIntoView({behavior:'smooth'});
  }catch{if(generation===atsGeneration)status.textContent='Não foi possível carregar o catálogo. Tente novamente.'}
  finally{if(generation===atsGeneration&&atsDialog.open)button.disabled=false}
 };
 q('#ats-clear').onclick=()=>{atsDialog.close();openATS()};
}
