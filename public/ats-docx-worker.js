importScripts('vendor/ats/mammoth.browser.min.js');
self.onmessage=async e=>{
 try{const result=await mammoth.extractRawText({arrayBuffer:e.data});self.postMessage({text:result.value.slice(0,200001),warnings:result.messages.length})}
 catch{self.postMessage({error:'Não foi possível ler este DOCX. Confira se o arquivo está íntegro e sem senha.'})}
};
