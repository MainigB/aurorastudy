import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const {render}=createRequire(import.meta.url)('../public/resources.js');
const read=name=>JSON.parse(readFileSync(new URL('../public/'+name,import.meta.url)));
const catalog=read('resources.json');
const lessons=[...read('linux.json'),...read('curriculum.json').lessons,...read('developer.json').lessons];
test('all lessons have verified videos and HTTPS technical references',()=>{
 assert.equal(lessons.length,415);
 assert.deepEqual(Object.keys(catalog.lessons).sort(),lessons.map(l=>l.id).sort());
 for(const l of lessons){const r=catalog.lessons[l.id];assert.ok(r.videos.length&&r.references.length,l.id);
  for(const id of r.videos){const v=catalog.videos[id];assert.match(v.url,/^https:\/\/www.youtube.com\/watch\?v=[\w-]{11}$/);assert.ok(v.title&&v.channel&&v.focus&&v.checked);assert.ok(['pt-BR','en'].includes(v.language));}
  for(const ref of r.references)assert.equal(new URL(ref.url).protocol,'https:');
  assert.match(render(l,catalog),/Vídeos e referências/);
 }
});
test('resource renderer escapes content and rejects unsafe URLs',()=>{
 const c={videos:{x:{title:'<img src=x>',url:'https://www.youtube.com/watch?v=6SfrO3D4dHM'},bad:{url:'javascript:alert(1)'}},lessons:{a:{videos:['x','bad'],references:[{title:'bad',url:'javascript:alert(1)'}]}}};
 const html=render({id:'a',title:'<script>'},c);assert.ok(!html.includes('<img'));assert.ok(!html.includes('javascript:'));assert.ok(!html.includes('<script>'));assert.match(html,/noopener noreferrer/);assert.match(render({id:'missing'},null),/continuar a aula/);
});
