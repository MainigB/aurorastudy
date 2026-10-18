import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const {lessons,tracks}=JSON.parse(fs.readFileSync('public/curriculum.json','utf8'));
const find=id=>lessons.find(l=>l.id===id);

test('editorial and answer material cannot appear as website exercises',()=>{
 for(const id of ['u000','u001','u004','u005','u022','u292','u297','u299','u301','u308','u319','u320','u323','u346'])assert.notEqual(find(id).learningMode,'activity',id);
 for(const l of lessons){
  assert.ok(['activity','reading','guide','external-lab','answer'].includes(l.learningMode),l.id);
  assert.ok(l.bookTitle,l.id);
  if(l.learningMode==='activity'){
   assert.ok(['Entrevista simulada','Projeto guiado','Simulado','Caso prático'].includes(l.format),l.id);
   assert.ok(l.responseGuidance,l.id);
   assert.ok(!l.title.match(/^(Q\d+:|Aplicação:)/),l.id);
   assert.ok(!l.questions.some(q=>q.startsWith('Em qual camada o mecanismo deste tópico atua?')),l.id);
  }
  if(l.learningMode==='answer'){
   const exercise=find(l.exerciseId);
   assert.equal(exercise.learningMode,'activity');
   assert.equal(exercise.answerId,l.id);
   assert.ok(exercise.sections.some(s=>s.role==='solution'&&s.title==='Resposta comentada do exercício'));
  }
 }
 for(const t of tracks)assert.ok(lessons.some(l=>l.track===t.id&&l.learningMode==='activity'));
});

test('introductory website tasks supply data, specific questions and explained answers',()=>{
 const units=find('u002'),service=find('u003'),career=find('u322');
 for(const l of [units,service,career]){
  assert.equal(l.learningMode,'activity');
  assert.ok(l.sections.some(s=>s.role==='practice'&&s.body===l.scenario));
  assert.notEqual(l.title,l.bookTitle);
 }
 assert.ok(units.scenario.includes('120 requisições'));
 assert.ok(units.reference.includes('36.000 requisições'));
 assert.ok(service.scenario.includes('250 pedidos'));
 assert.ok(service.reference.includes('HTTP 200'));
 assert.ok(career.scenario.includes('seis sessões'));
});
