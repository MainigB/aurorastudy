import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const curriculum=read('public/curriculum.json'),company=read('public/company.json');
test('chapters and company rotations follow the book table of contents',()=>{
 // Snapshot of the book's chapter order/pages; tests also run in the site-only repository.
 const toc=[['PRE',29],['LID',44],['SYS',72],['AUT',135],['OBS',191],['SLO',232],['RES',268],['CLOUD',332],['IAC',369],['CONT',397],['DATA',443],['CD',487],['SEC',519],['INC',547],['AI',584],['PRA',602],['JOBS',654]];
 assert.deepEqual(curriculum.tracks.map(t=>t.id),toc.map(t=>t[0]));
 assert.deepEqual(company.order,curriculum.tracks.map(t=>t.id));
 curriculum.tracks.forEach((t,i)=>{assert.ok(t.name);assert.equal(t.page,toc[i][1]);assert.equal(t.chapter,i+1);
  const lessons=curriculum.lessons.filter(l=>l.track===t.id);
  assert.deepEqual(lessons.map(l=>l.page),lessons.map(l=>l.page).sort((a,b)=>a-b));
  lessons.forEach((l,j)=>assert.equal(company.missions[l.id].sequence,j+1));
 });
 const lastBook=Math.max(...curriculum.lessons.filter(l=>l.track==='SYS').map(l=>company.missions[l.id].sequence));
 for(const l of read('public/linux.json'))assert.ok(company.missions[l.id].sequence>lastBook);
});
