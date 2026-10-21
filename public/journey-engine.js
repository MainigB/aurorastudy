(function(root){
 const pages=817;
 function readings(s){return [...new Set((Array.isArray(s.readPages)?s.readPages:[]).filter(n=>Number.isInteger(n)&&n>=1&&n<=pages))].sort((a,b)=>a-b)}
 function checkpoints(lessons){
  const sys=lessons.filter(l=>l.track==='SYS'&&l.readingEnd);
  const sysEnd=Math.max(1,...sys.map(l=>l.readingEnd));
  return lessons.filter(l=>l.formation==='SRE'&&(l.kind==='command'||l.learningMode==='activity')).map(l=>({id:l.id,page:l.kind==='command'?sysEnd:l.readingEnd,lesson:l})).sort((a,b)=>a.page-b.page);
 }
 function progress(s,lessons){
  const read=new Set(readings(s)),checks=checkpoints(lessons),done=checks.filter(c=>s.done?.[c.id]).length;
  let next={kind:'finished',page:pages};
  for(let page=1;page<=pages;page++){
   if(!read.has(page)){next={kind:'reading',page};break}
   const pending=checks.find(c=>c.page===page&&!s.done?.[c.id]);
   if(pending){next={kind:'exercise',page,id:pending.id};break}
  }
  return {read:read.size,done,total:checks.length,percent:Math.floor((read.size+done)/(pages+checks.length)*100),xp:done*20,next,checks};
 }
 function markRead(s,page){if(Number.isInteger(page)&&page>=1&&page<=pages)s.readPages=readings({...s,readPages:[...readings(s),page]});return s}
 const api={pages,readings,checkpoints,progress,markRead};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.AuroraJourney=api;
})(typeof window==='undefined'?globalThis:window);
