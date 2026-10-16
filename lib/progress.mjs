import lessonIds from './lesson-ids.json' with { type: 'json' };
const allowedLessons=new Set(lessonIds);
export function validLesson(id){return typeof id==='string'&&allowedLessons.has(id);}
export function emptyState(){return {done:{},xp:0,days:{},review:[],drafts:{},last:null};}
export function cleanState(input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw new Error('INVALID_STATE');
 const result=emptyState();
 for(const [id,value] of Object.entries(input.done||{})){
  if(!validLesson(id)||!value||!/^\d{4}-\d{2}-\d{2}$/.test(value.date)||Number.isNaN(Date.parse(value.date))||new Date(value.date).toISOString().slice(0,10)!==value.date)throw new Error('INVALID_COMPLETION');
  result.done[id]={date:value.date};result.days[value.date]=(result.days[value.date]||0)+1;
 }
 result.xp=Object.keys(result.done).length*20;
 if(!Array.isArray(input.review||[]))throw new Error('INVALID_REVIEW');
 result.review=[...new Set(input.review||[])].filter(validLesson);
 for(const [id,text] of Object.entries(input.drafts||{})){
  if(!validLesson(id)||typeof text!=='string'||text.length>20000)throw new Error('INVALID_DRAFT');
  result.drafts[id]=text;
 }
 result.last=typeof input.last==='string'&&validLesson(input.last)?input.last:null;
 if(Buffer.byteLength(JSON.stringify(result))>240000)throw new Error('STATE_LIMIT');
 return result;
}
