import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
import {cleanState} from '../lib/progress.mjs';
const book=JSON.parse(readFileSync(new URL('../public/book/complete.json',import.meta.url)));
const lessons=JSON.parse(readFileSync(new URL('../public/curriculum.json',import.meta.url))).lessons;
test('integral edition contains every final PDF page and an identical source file',()=>{
 assert.equal(book.pageCount,817);assert.equal(book.pages.length,817);
 assert.equal(createHash('sha256').update(readFileSync(new URL('../public/book/livro-4-completo.pdf',import.meta.url))).digest('hex'),book.sha256);
 book.pages.forEach((page,i)=>{assert.equal(page.number,i+1);assert.ok(page.blocks.length);assert.ok(page.blocks.every(b=>b.text.trim()&&['paragraph','heading','code'].includes(b.kind)));assert.ok(page.links.every(l=>/^https?:\/\//.test(l)))});
 assert.ok(book.pages[816].blocks.some(b=>b.text.includes('CONFIAR')));
 assert.ok(book.outline.some(o=>o.title==='Dicionário técnico'&&o.page===688));
 assert.ok(book.outline.some(o=>o.title==='Referências para aprofundamento'&&o.page===683));
 assert.ok(book.outline.every(o=>o.page>=1&&o.page<=817));
});
test('every interactive book activity has a checkpoint inside the integral edition',()=>{
 const activities=lessons.filter(l=>/^u\d{3}$/.test(l.id)&&l.learningMode==='activity');
 assert.equal(activities.length,168);
 activities.forEach(l=>{assert.ok(l.page<=l.readingEnd);assert.ok(book.pages[l.readingEnd-1]);assert.ok(l.readingEnd<817)});
});
test('reading bookmark accepts all pages without awarding XP and rejects invalid positions',()=>{
 for(const bookPage of [1,34,688,817]){const s=cleanState({bookPage});assert.equal(s.bookPage,bookPage);assert.equal(s.xp,0)}
 for(const bookPage of [-1,0,818,2.5,'34',null])assert.equal(cleanState({bookPage}).bookPage,1);
 assert.equal(cleanState({last:'u002'}).bookPage,1);
});
