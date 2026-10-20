import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';import vm from 'node:vm';
const pages=JSON.parse(readFileSync(new URL('../public/interactive-book.json',import.meta.url)));
const lessons=JSON.parse(readFileSync(new URL('../public/curriculum.json',import.meta.url))).lessons;
test('book covers all manuscript units in reading order with separate exercise answers',()=>{
 assert.equal(pages.length,347);assert.equal(new Set(pages.map(p=>p.id)).size,347);
 pages.forEach((p,i)=>{assert.equal(p.id,'u'+String(i).padStart(3,'0'));const l=lessons.find(l=>l.id===p.id);assert.equal(p.track,l.track);assert.equal(p.activity,l.learningMode==='activity');assert.ok(p.sections.length);assert.ok(p.sections.every(s=>typeof s.text==='string'&&typeof s.answer==='boolean'));if(i)assert.ok(p.page>=pages[i-1].page)});
 assert.ok(pages.some(p=>p.activity&&p.sections.some(s=>s.answer)));
});
function speechHarness(){
 const elements=Object.fromEntries(['book-listen','book-stop','book-voice','book-rate','book-voice-status'].map(k=>[k,{value:k==='book-rate'?'1':'',textContent:'',disabled:false,replaceChildren(){},add(){}}]));
 const calls=[],listeners=new Set();const synth={cancel(){calls.push('cancel')},pause(){calls.push('pause')},resume(){calls.push('resume')},speak(u){calls.push(u)},getVoices(){return [{name:'Português',lang:'pt-BR',voiceURI:'pt'}]},addEventListener(t,fn){listeners.add(fn)},removeEventListener(t,fn){listeners.delete(fn)}};
 const window={speechSynthesis:synth,SpeechSynthesisUtterance:function(text){this.text=text},addEventListener(){}};
 const context={window,document:{querySelector:s=>elements[s.slice(1)]},SpeechSynthesisUtterance:window.SpeechSynthesisUtterance,Option:function(){},localStorage:{getItem(){return null},setItem(){}}};vm.runInNewContext(readFileSync(new URL('../public/book-voice.js',import.meta.url),'utf8'),context);
 return {api:window.AuroraBookVoice,elements,calls,listeners};
}
test('voice playback starts only on click, pauses/resumes, and cancels stale callbacks on navigation',()=>{
 const h=speechHarness();h.api.bind({innerText:'Primeira frase. Segunda frase.'});assert.equal(h.calls.filter(c=>typeof c==='object').length,0);
 h.elements['book-listen'].onclick();const utterance=h.calls.find(c=>typeof c==='object');assert.equal(utterance.lang,'pt-BR');assert.equal(h.elements['book-listen'].textContent,'Pausar');
 h.elements['book-listen'].onclick();assert.equal(h.calls.at(-1),'pause');h.elements['book-listen'].onclick();assert.equal(h.calls.at(-1),'resume');
 h.api.stop();const count=h.calls.length;utterance.onend();assert.equal(h.calls.length,count);assert.equal(h.listeners.size,0);
});
test('long passages are queued in bounded chunks and stopping resets controls',()=>{
 const h=speechHarness();h.api.bind({innerText:'Trecho longo '.repeat(120)});h.elements['book-listen'].onclick();let u=h.calls.at(-1);assert.ok(u.text.length<=601);u.onend();assert.ok(h.calls.at(-1).text);h.elements['book-stop'].onclick();assert.equal(h.elements['book-listen'].textContent,'Ouvir trecho');assert.equal(h.elements['book-stop'].disabled,true);
});
