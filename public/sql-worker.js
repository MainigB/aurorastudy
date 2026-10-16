importScripts('vendor/sql-wasm.js','learning-engine.js');
self.onmessage=async({data})=>{
 let actual,reference;
 try{
  if(typeof data.sql!=='string'||data.sql.length>10000)throw Error('Use uma consulta de até 10.000 caracteres.');
  const SQL=await initSqlJs({locateFile:()=>'/vendor/sql-wasm.wasm'});
  actual=new SQL.Database();reference=new SQL.Database();actual.run(data.setup);reference.run(data.setup);
  const result=actual.exec(data.sql);const expected=reference.exec(data.solution);
  const output=data.checkQuery?actual.exec(data.checkQuery):result;
  const target=data.checkQuery?reference.exec(data.checkQuery):expected;
  const last=output.at(-1)||{columns:[],values:[]},answer=target.at(-1)||{columns:[],values:[]};
  const correct=output.length>0&&AuroraLearning.sameResult(last,answer);
  self.postMessage({correct,output:{columns:last.columns,values:last.values.slice(0,100)},truncated:last.values.length>100});
 }catch(error){self.postMessage({error:error.message})}finally{actual?.close();reference?.close()}
};
