import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {cleanState} from '../lib/progress.mjs';
const engine=createRequire(import.meta.url)('../public/practice-engine.js');
const projects=JSON.parse(readFileSync(new URL('../public/practice.json',import.meta.url)));
const curriculum=JSON.parse(readFileSync(new URL('../public/curriculum.json',import.meta.url)));
test('operational portfolio covers all chapters without awarding completion XP',()=>{
 assert.deepEqual(projects.map(p=>p.track).sort(),curriculum.tracks.map(p=>p.id).sort());
 for(const p of projects){
  assert.equal(p.steps.length,4);assert.equal(p.criteria.length,3);assert.ok(p.transfer&&p.requires&&p.limit);
  const state=cleanState({drafts:{[p.id]:JSON.stringify({evidence:'comandos e medições',reviewed:true})}});
  assert.equal(state.xp,0);assert.ok(state.drafts[p.id]);
  assert.throws(()=>cleanState({done:{[p.id]:{date:'2026-10-19'}}}));
 }
 assert.throws(()=>cleanState({drafts:{'practice-arbitrary':'bad'}}));
});
test('numeric workshops reject blanks, nonfinite values and wrong units',()=>{
 for(const type of engine.types)for(let v=0;v<5;v++){
  const s=engine.scenario(type,v);
  assert.ok(engine.evaluate(s,s.expected.map(String)).every(Boolean));
  assert.ok(engine.evaluate(s,s.expected.map(x=>String(x).replace('.',','))).every(Boolean));
  assert.ok(engine.evaluate(s,s.expected.map(()=>'' )).every(x=>!x));
  assert.ok(engine.evaluate(s,s.expected.map(()=> 'Infinity')).every(x=>!x));
  assert.ok(engine.evaluate(s,s.expected.map(x=>x+1)).every(x=>!x));
 }
});
test('workshop reference calculations include exhausted budget, ceil capacity and tail rank',()=>{
 assert.deepEqual(engine.scenario('availability').expected,[99.7,10,-20]);
 assert.deepEqual(engine.scenario('burn').expected,[10,72]);
 assert.deepEqual(engine.scenario('capacity').expected,[4,8,1000]);
 assert.deepEqual(engine.scenario('capacity',2).expected,[5,10,1250]);
 assert.deepEqual(engine.scenario('latency').expected,[130,1800]);
 assert.deepEqual(engine.scenario('recovery').expected,[20,12,80]);
 assert.deepEqual(engine.scenario('retries').expected,[400,200,50]);
});
