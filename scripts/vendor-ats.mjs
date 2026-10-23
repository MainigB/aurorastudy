import {mkdirSync,copyFileSync} from 'node:fs';
// Refresh after a reviewed dependency update; keep browser parser and worker versions aligned.
mkdirSync('public/vendor/ats',{recursive:true});
for(const [source,target] of [
 ['pdfjs-dist/build/pdf.min.mjs','pdf.min.mjs'],
 ['pdfjs-dist/build/pdf.worker.min.mjs','pdf.worker.min.mjs'],
 ['pdfjs-dist/LICENSE','PDFJS-LICENSE'],
 ['mammoth/mammoth.browser.min.js','mammoth.browser.min.js'],
 ['mammoth/LICENSE','MAMMOTH-LICENSE']
])copyFileSync('node_modules/'+source,'public/vendor/ats/'+target);
