import test from 'node:test';import assert from 'node:assert/strict';
import ats from '../public/ats-engine.js';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
test('bundled browser DOCX extractor reads a real synthetic document as plain text',async()=>{
 const mammoth=require('../public/vendor/ats/mammoth.browser.min.js');
 const bytes=readFileSync(new URL('./fixtures/resume.docx',import.meta.url));
 const extracted=await mammoth.extractRawText({arrayBuffer:bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)});
 assert.match(extracted.value,/Linux, Python, AWS e Kubernetes/);
 assert.equal(ats.compare(extracted.value,'Linux, Python, AWS, Kubernetes e Terraform',['Linux']).score,80);
 await assert.rejects(mammoth.extractRawText({arrayBuffer:new Uint8Array([1,2,3]).buffer}));
});
test('keyword score counts unique job requirements, including aliases and accents',()=>{
 const result=ats.compare('Amazon Web Services, K8s, comunicacao. AWS AWS','AWS, Kubernetes, comunicação e Terraform');
 assert.equal(result.score,75);assert.equal(result.total,4);assert.deepEqual(result.missing,['Terraform']);
});
test('unrelated substrings and similar languages do not inflate the score',()=>{
 assert.equal(ats.compare('JavaScript NoSQL C++','Java SQL C#').score,0);
 assert.equal(ats.contains('DevOps','Ops'),false);assert.equal(ats.contains('C++ e C#','.NET'),false);
 assert.equal(ats.compare('C++ C# .NET','C++ C# .NET').score,100);
});
test('no recognized terms yields no score, and repeated terms do not inflate the result',()=>{
 assert.equal(ats.compare('Anything','Vaga sem requisitos tecnicos').score,null);
 assert.equal(ats.compare('Linux Linux Linux','Linux Python Python',['Linux']).score,50);
});
test('dictionary and custom keywords participate only if present in the job',()=>{
 const result=ats.compare('FinOps e idempotência','FinOps, Idempotência e Kubernetes',['Idempotência'],['FinOps','FinOps','Ausente']);
 assert.equal(result.total,3);assert.equal(result.score,67);assert.deepEqual(result.missing,['Kubernetes']);
});
test('aliases do not duplicate dictionary entries and user patterns are escaped',()=>{
 assert.equal(ats.compare('Microserviço','microservices',['Microserviço','Microsserviços']).total,1);
 assert.equal(ats.contains('qualquer coisa','.*'),false);
});
