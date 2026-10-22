(function(root){
 const pages=817;
 // Pages 2–7 are tool indexes; 8–28 are the printed table of contents.
 const isReadingPage=n=>Number.isInteger(n)&&n>=1&&n<=pages&&!(n>=2&&n<=28);
 const readingPages=Array.from({length:pages},(_,i)=>i+1).filter(isReadingPage);
 const totalPages=readingPages.length;
 function resolvePage(n){n=Number.isInteger(Number(n))?Math.max(1,Math.min(pages,Number(n))):1;return isReadingPage(n)?n:29}
 function previousPage(n){return readingPages.filter(p=>p<n).at(-1)||null}
 function nextPage(n){return readingPages.find(p=>p>n)||null}
 function readings(s){return [...new Set((Array.isArray(s.readPages)?s.readPages:[]).filter(isReadingPage))].sort((a,b)=>a-b)}
 function checkpoints(lessons){
  const sys=lessons.filter(l=>l.track==='SYS'&&l.readingEnd);
  const sysEnd=Math.max(1,...sys.map(l=>l.readingEnd));
  return lessons.filter(l=>l.formation==='SRE'&&(l.kind==='command'||l.learningMode==='activity')).map(l=>({id:l.id,page:l.kind==='command'?sysEnd:l.readingEnd,lesson:l})).sort((a,b)=>a.page-b.page);
 }
 function progress(s,lessons){
  const read=new Set(readings(s)),checks=checkpoints(lessons),done=checks.filter(c=>s.done?.[c.id]).length;
  let next={kind:'finished',page:pages};
  for(const page of readingPages){
   if(!read.has(page)){next={kind:'reading',page};break}
   const pending=checks.find(c=>c.page===page&&!s.done?.[c.id]);
   if(pending){next={kind:'exercise',page,id:pending.id};break}
  }
  return {read:read.size,totalPages,done,total:checks.length,percent:Math.floor((read.size+done)/(totalPages+checks.length)*100),xp:done*20,next,checks};
 }
 function markRead(s,page){if(isReadingPage(page))s.readPages=readings({...s,readPages:[...readings(s),page]});return s}
 const api={pages,totalPages,readingPages,isReadingPage,resolvePage,previousPage,nextPage,readings,checkpoints,progress,markRead};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.AuroraJourney=api;
})(typeof window==='undefined'?globalThis:window);
