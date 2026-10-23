import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import ansible from '../public/ansible.js';
import journey from '../public/journey-engine.js';
import {cleanState,validLesson} from '../lib/progress.mjs';
import vm from 'node:vm';
import engine from '../public/engine.js';
const book=JSON.parse(readFileSync(new URL('../public/curriculum.json',import.meta.url)));
const lessons=[...book.lessons.map(l=>({...l,formation:'SRE'})),...ansible.lessons];
test('Ansible follows IaC reading and preserves its three checkpoints before Kubernetes',()=>{
 const checks=journey.checkpoints(lessons);
 const s={readPages:journey.readingPages.filter(p=>p<=396),done:Object.fromEntries(checks.filter(c=>c.page<=396&&!c.id.startsWith('ansible-')).map(c=>[c.id,{date:'2026-10-23'}]))};
 for(const l of ansible.lessons){assert.equal(journey.progress(s,lessons).next.id,l.id);s.done[l.id]={date:'2026-10-23'}}
 assert.deepEqual(journey.progress(s,lessons).next,{kind:'reading',page:397});
 assert.equal(cleanState(s).done['ansible-03'].date,'2026-10-23');
});
test('Ansible quiz requires all correct decisions and server accepts each stable ID',()=>{
 for(const l of ansible.lessons){assert.ok(validLesson(l.id));const answers=l.questions.map(q=>q.answer);assert.ok(ansible.correct(l,answers));assert.equal(ansible.correct(l,[]),false);for(let i=0;i<answers.length;i++){const wrong=[...answers];wrong[i]=(wrong[i]+1)%l.questions[i].options.length;assert.equal(ansible.correct(l,wrong),false)}}
});
test('lesson UI gates questions, saves completion once and continues the same journey',()=>{
 const nodes=new Map();const $=id=>{if(!nodes.has(id))nodes.set(id,{hidden:true,innerHTML:'',classList:{add(){}},scrollIntoView(){},insertAdjacentHTML(_where,html){this.innerHTML+=html}});return nodes.get(id)};
 let saved=0,continued=0,html='';const state={done:{},days:{},xp:0,review:[]};
 const context={window:{},$,state,AuroraAccount:{isReady:()=>true},Aurora:engine,AuroraSRE:{markdown:s=>s},AuroraBookVoice:{bind(){},stop(){}},esc:s=>String(s),completeBookAudio:()=>'',show:s=>{html=s},save:()=>saved++,render(){},followJourney:()=>continued++,FormData:class{constructor(values){this.values=values}get(k){return this.values[k]}}};
 vm.createContext(context);vm.runInContext(readFileSync(new URL('../public/ansible.js',import.meta.url),'utf8'),context);context.AuroraAnsible=context.window.AuroraAnsible;
 context.openAnsibleLesson('ansible-01');assert.match(html,/COMPLEMENTO DO AURORA/);assert.equal($('#ansible-questions').hidden,true);$('#ansible-practice').onclick();assert.equal($('#ansible-questions').hidden,false);
 const submit=values=>$('#ansible-form').onsubmit({preventDefault(){},target:values});
 submit({'answer-0':'0','answer-1':'0'});assert.equal(saved,0);assert.equal(state.xp,0);
 submit({'answer-0':'1','answer-1':'2'});assert.equal(saved,1);assert.equal(state.xp,20);assert.ok(cleanState(state).done['ansible-01']);
 submit({'answer-0':'1','answer-1':'2'});assert.equal(state.xp,20);$('#ansible-next').onclick();assert.equal(continued,1);
});
