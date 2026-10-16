import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {markdown,canComplete}=require('../public/sre-learning.js');
const {checkCommand}=require('../public/engine.js');
const curriculum=JSON.parse(fs.readFileSync('public/curriculum.json','utf8'));
const linux=JSON.parse(fs.readFileSync('public/linux.json','utf8'));
test('all SRE topics carry complete structured study, specific questions and valid prerequisites',()=>{
 const ids=new Set(curriculum.lessons.map(l=>l.id));
 for(const l of curriculum.lessons){
  assert.ok(l.sections.length,l.id);
  assert.ok(l.sections.every(s=>s.title&&s.body&&['study','practice','solution'].includes(s.role)),l.id);
  assert.ok(l.questions.every(q=>q.trim().length>0));
  assert.ok(l.questions.length>=3);
  assert.equal(l.rubric.length,4);
  assert.ok(!l.prerequisite||ids.has(l.prerequisite));
 }
 const retries=curriculum.lessons.find(l=>l.id==='u065');
 assert.ok(retries.sections.some(s=>s.body.includes('def espera_retry')));
 assert.ok(retries.example.body.includes('0,9'));
 const lock=curriculum.lessons.find(l=>l.id==='u180');
 assert.ok(lock.sections.some(s=>s.role==='solution'&&s.title==='Aprofundamento do entrevistador'));
 assert.ok(lock.sections.some(s=>s.role==='practice'&&s.body.includes('14h03')));
 const budget=curriculum.lessons.find(l=>l.id==='u104');
 assert.ok(budget.sections.some(s=>s.role==='solution'&&s.body.includes('70%')));
});
test('all 18 Linux labs require both a command and an interpretation; distractors never complete',()=>{
 assert.equal(linux.length,18);
 for(const l of linux){
  assert.ok(l.scenario.length>180,l.id);
  assert.ok(l.theory.length>200,l.id);
  assert.ok(l.mechanics.length>160,l.id);
  assert.equal(l.options.length,l.feedback.length);
  assert.ok(checkCommand(l,l.answer));
  assert.equal(canComplete(false,l,l.correct),false);
  for(let i=0;i<l.options.length;i++)assert.equal(canComplete(true,l,i),i===l.correct);
  assert.equal(canComplete(true,l,null),false);
  assert.equal(canComplete(true,l,String(l.correct)),false);
 }
 assert.ok(checkCommand(linux[0],'pwd -P'));
});
test('study renderer preserves code and escapes HTML, attribute injection and unsafe links',()=>{
 const rendered=markdown('### Mecanismo\n\n**Evidência** e `x < y`\n\n```python\nif x < y:\n    print("ok")\n```\n\n[Manual](https://example.test/doc)');
 assert.ok(rendered.includes('<h4>Mecanismo</h4>'));
 assert.ok(rendered.includes('x &lt; y'));
 assert.ok(rendered.includes('<pre><code>'));
 const unsafe=markdown('<img src=x onerror=alert(1)>\n\n[link](javascript:alert(1))\n\n[x](https://example.test/"onclick="alert)');
 assert.ok(!unsafe.includes('<img'));
 assert.ok(!unsafe.includes('href="javascript:'));
 assert.ok(!unsafe.includes('"onclick="'));
});
