// Adapted from LeitorOnline: native voices, explicit playback, pause and rate.
(function(){
 const supported='speechSynthesis' in window&&'SpeechSynthesisUtterance' in window;
 const synth=supported?window.speechSynthesis:null;
 let active=null,phase='idle',chunks=[],index=0,token=0,detach=()=>{};
 function stop(){token++;active=null;phase='idle';if(synth)synth.cancel();detach();detach=()=>{};}
 function bind(article){
  stop();const play=document.querySelector('#book-listen'),end=document.querySelector('#book-stop'),voice=document.querySelector('#book-voice'),rate=document.querySelector('#book-rate'),status=document.querySelector('#book-voice-status');
  if(!play)return;
  function ui(message){play.textContent=phase==='speaking'?'Pausar':phase==='paused'?'Continuar áudio':'Ouvir trecho';end.disabled=phase==='idle';voice.disabled=rate.disabled=phase!=='idle'||!supported;if(message)status.textContent=message;}
  if(!supported){play.disabled=end.disabled=voice.disabled=rate.disabled=true;status.textContent='Leitura em voz alta indisponível neste navegador. O texto continua disponível.';return;}
  let voices=[];
  function load(){const previous=voice.value;voices=synth.getVoices().slice().sort((a,b)=>Number(b.lang.startsWith('pt'))-Number(a.lang.startsWith('pt'))||a.name.localeCompare(b.name));voice.replaceChildren(new Option('Voz padrão do navegador',''));voices.forEach(v=>voice.add(new Option(v.name+' · '+v.lang,v.voiceURI)));let preference=previous;try{preference=preference||localStorage.getItem('aurora-book-voice')}catch{}voice.value=(voices.find(v=>v.voiceURI===preference)||voices.find(v=>v.lang==='pt-BR')||voices.find(v=>v.lang.startsWith('pt')))?.voiceURI||'';}
  load();synth.addEventListener('voiceschanged',load);detach=()=>synth.removeEventListener('voiceschanged',load);
  try{const saved=Number(localStorage.getItem('aurora-book-rate'));if(saved>=.5&&saved<=2)rate.value=String(saved)}catch{}
  function speak(run){if(run!==token)return;if(index>=chunks.length){active=null;phase='idle';ui('Trecho concluído. Você pode responder à atividade ou avançar.');return;}active=new SpeechSynthesisUtterance(chunks[index]);const utterance=active;utterance.voice=voices.find(v=>v.voiceURI===voice.value)||null;utterance.lang=utterance.voice?.lang||'pt-BR';utterance.rate=Number(rate.value);utterance.onend=()=>{if(run!==token||active!==utterance)return;index++;speak(run)};utterance.onerror=e=>{if(run!==token)return;active=null;phase='idle';ui(e.error==='not-allowed'?'O navegador bloqueou o áudio. Clique em ouvir novamente.':'Não foi possível ler. Tente outra voz.');};synth.speak(utterance);ui('Lendo bloco '+(index+1)+' de '+chunks.length+'.');}
  play.onclick=()=>{if(phase==='speaking'){synth.pause();phase='paused';ui('Leitura pausada.');return;}if(phase==='paused'){synth.resume();phase='speaking';ui('Leitura retomada.');return;}
   const text=article.innerText.trim();chunks=text.match(/[^.!?\n]+[.!?\n]*/g)?.flatMap(s=>s.match(/[\s\S]{1,600}(?:\s|$)|[\s\S]{1,600}/g)||[])||[];index=0;if(!chunks.length){ui('Nenhum texto disponível para leitura.');return;}token++;synth.cancel();phase='speaking';speak(token);};
  end.onclick=()=>{token++;active=null;synth.cancel();phase='idle';index=0;ui('Leitura parada. Ouvir começa novamente este trecho.');};
  voice.onchange=()=>{try{localStorage.setItem('aurora-book-voice',voice.value)}catch{}};
  rate.onchange=()=>{try{localStorage.setItem('aurora-book-rate',rate.value)}catch{}};
  ui('Ouça o trecho ou leia no seu ritmo. As vozes dependem do navegador e do sistema.');
 }
 window.AuroraBookVoice={bind,stop};window.addEventListener('pagehide',stop);
})();
