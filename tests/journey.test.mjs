import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import journey from '../public/journey-engine.js';import {cleanState} from '../lib/progress.mjs';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const lessons=[...json('../public/curriculum.json').lessons,...json('../public/linux.json')].map(l=>({...l,formation:'SRE'}));
test('bookmark and audio playback alone never count pages as read',()=>{
 const s={bookPage:688,done:{}};assert.equal(journey.progress(s,lessons).read,0);assert.deepEqual(journey.progress(s,lessons).next,{kind:'reading',page:1});
 journey.markRead(s,1);journey.markRead(s,1);assert.equal(journey.progress(s,lessons).read,1);assert.equal(journey.progress(s,lessons).next.page,2);
});
test('reading leads to its activity and cannot skip an unfinished checkpoint',()=>{
 const first=journey.checkpoints(lessons)[0];const s={done:{},readPages:Array.from({length:first.page},(_,i)=>i+1)};
 assert.equal(journey.progress(s,lessons).next.id,first.id);
 journey.markRead(s,first.page+1);assert.equal(journey.progress(s,lessons).next.id,first.id);
 s.done[first.id]={date:'2026-10-20'};assert.notEqual(journey.progress(s,lessons).next.id,first.id);
});
test('single SRE path includes 168 book exercises and 18 labs without DEV XP',()=>{
 const checks=journey.checkpoints([...lessons,{id:'dev-test',formation:'DEV',learningMode:'activity',readingEnd:1}]);assert.equal(checks.length,186);assert.equal(new Set(checks.map(c=>c.id)).size,186);
 const s={readPages:Array.from({length:817},(_,i)=>i+1),done:Object.fromEntries(checks.map(c=>[c.id,{date:'2026-10-20'}]))};s.done['dev-test']={date:'2026-10-20'};
 const p=journey.progress(s,lessons);assert.equal(p.percent,100);assert.equal(p.next.kind,'finished');assert.equal(p.xp,3720);
});
test('server preserves confirmed pages, deduplicates and never turns them into XP',()=>{
 const s=cleanState({readPages:[1,1,2,817,818,-1,'3',4.5],bookPage:200});assert.deepEqual(s.readPages,[1,2,817]);assert.equal(s.xp,0);
 assert.deepEqual(cleanState({bookPage:300}).readPages,[]);assert.throws(()=>cleanState({readPages:{1:true}}));
});
