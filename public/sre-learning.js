(function(root){
 const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 // Render a small Markdown subset. Raw HTML is always text; links only use HTTPS/HTTP.
 function inline(text){
  return String(text).split(/(`[^`]+`|\[[^\]]+\]\(https?:\/\/[^\s)]+\))/g).map(part=>{
   if(part.startsWith('`')&&part.endsWith('`'))return `<code>${escape(part.slice(1,-1))}</code>`;
   const link=part.match(/^\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)$/);
   if(link)return `<a href="${escape(link[2])}" target="_blank" rel="noopener noreferrer">${escape(link[1])} ↗</a>`;
   return escape(part).replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>');
  }).join('');
 }
 function markdown(text){
  return String(text||'').split(/(```[\s\S]*?```)/g).map(chunk=>{
   if(chunk.startsWith('```'))return `<pre><code>${escape(chunk.replace(/^```[^\n]*\n?/,'').replace(/```$/,''))}</code></pre>`;
   return chunk.trim().split(/\n\s*\n/).filter(Boolean).map(block=>{
    if(/^#{1,6} /.test(block))return block.split('\n').map(line=>/^#{1,6} /.test(line)?`<h4>${inline(line.replace(/^#{1,6} /,''))}</h4>`:`<p>${inline(line)}</p>`).join('');
    const lines=block.split('\n');
    if(lines.every(l=>/^\s*[-*] /.test(l)))return `<ul>${lines.map(l=>`<li>${inline(l.replace(/^\s*[-*] /,''))}</li>`).join('')}</ul>`;
    if(lines.every(l=>/^\s*\d+[.)] /.test(l)))return `<ol>${lines.map(l=>`<li>${inline(l.replace(/^\s*\d+[.)] /,''))}</li>`).join('')}</ol>`;
    return `<p>${inline(block).replace(/\n/g,'<br>')}</p>`;
   }).join('');
  }).join('');
 }
 function canComplete(commandCorrect,lesson,choice){return commandCorrect===true&&Number.isInteger(choice)&&choice===lesson.correct;}
 root.AuroraSRE={markdown,canComplete};
 if(typeof module!=='undefined')module.exports=root.AuroraSRE;
})(typeof window!=='undefined'?window:globalThis);
