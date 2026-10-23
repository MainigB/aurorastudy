import test from 'node:test';import assert from 'node:assert/strict';import {readFileSync} from 'node:fs';
import dictionary from '../public/dictionary.js';
const book=JSON.parse(readFileSync(new URL('../public/book/complete.json',import.meta.url)));
test('dictionary preserves all 506 book entries and definitions, excluding the printed index',()=>{
 const entries=dictionary.entries(book),outline=book.outline.filter(o=>o.level===1&&o.page>=693&&o.page<815);
 assert.equal(entries.length,506);assert.deepEqual(entries.map(e=>e.title),outline.map(e=>e.title));
 assert.ok(entries.every(e=>e.paragraphs.length>0));
 assert.match(entries.find(e=>e.title==='Ansible').paragraphs.join(' '),/gestão de configuração/);
 assert.equal(entries.at(-1).title,'YAML');assert.ok(!entries.at(-1).paragraphs.join(' ').includes('RFC 9110'));
});
test('dictionary search ignores accents and case and searches definitions as well as terms',()=>{
 const entries=dictionary.entries(book);
 assert.ok(dictionary.search(entries,'  IDEMPOTENCIA ').some(e=>e.title==='Idempotência'));
 assert.ok(dictionary.search(entries,'gestao de configuracao').some(e=>e.title==='Ansible'));
 assert.equal(dictionary.search(entries,'zzzznonexistent').length,0);
 assert.equal(dictionary.search(entries,'').length,506);
});
