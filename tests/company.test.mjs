import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const company=read('public/company.json');
const lessons=[...read('public/linux.json'),...read('public/curriculum.json').lessons];
test('all 365 SRE activities have unique tickets and stay linked only within their rotation',()=>{
 assert.equal(company.order.length,17);
 assert.deepEqual(new Set(Object.keys(company.missions)),new Set(lessons.map(l=>l.id)));
 assert.equal(new Set(Object.values(company.missions).map(m=>m.ticket)).size,365);
 for(const l of lessons){const m=company.missions[l.id];assert.equal(m.subject,l.title);assert.ok(m.request.includes(l.title));assert.ok(m.phase>=0&&m.phase<=2);assert.ok(m.evidence&&m.deliverable);
  for(const direction of ['previous','next'])if(m[direction]){const target=lessons.find(x=>x.id===m[direction]);assert.equal(target.track,l.track);assert.equal(company.missions[target.id][direction==='next'?'previous':'next'],l.id)}
 }
});
test('all rotations have a distinct operational context, three phases and explained decision alternatives',()=>{
 assert.equal(new Set(Object.values(company.arcs).map(a=>a.brief)).size,17);
 for(const id of company.order){const a=company.arcs[id];assert.equal(a.phases.length,3);assert.ok(a.brief.length>150);assert.ok(a.constraints.length>=2);assert.ok(a.deliverable&&a.handoff&&a.owner);assert.equal(a.decision.options.length,a.decision.feedback.length);assert.ok(a.decision.best>=0&&a.decision.best<a.decision.options.length);
  assert.deepEqual(new Set(lessons.filter(l=>l.track===id).map(l=>company.missions[l.id].phase)),new Set([0,1,2]));
 }
 assert.ok(company.arcs.JOBS.brief.includes('não são apresentadas como abertas hoje'));
 assert.ok(company.contract.includes('recorte independente'));
});
test('mission status preserves historical completion and prioritizes review; report uses existing draft IDs',()=>{
 const sandbox={state:{done:{},review:[],drafts:{}},curriculum:{company}};vm.createContext(sandbox);vm.runInContext(fs.readFileSync('public/company.js','utf8'),sandbox);
 const l=lessons.find(l=>l.id==='u180');
 assert.equal(sandbox.companyStatus(l),'A fazer');sandbox.state.drafts[l.id]='Análise';assert.equal(sandbox.companyStatus(l),'Rascunho');
 sandbox.state.done[l.id]={date:'2026-10-16'};assert.equal(sandbox.companyStatus(l),'Concluída');sandbox.state.review.push(l.id);assert.equal(sandbox.companyStatus(l),'Em revisão');
 const report=sandbox.companyReportTemplate(l);assert.ok(report.includes(company.missions[l.id].ticket));assert.ok(report.includes('PASSAGEM DE TURNO'));assert.ok(report.includes(company.arcs.IAC.owner));
});
