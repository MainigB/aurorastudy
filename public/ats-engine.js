(function(root){
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[‐‑–—]/g,'-').replace(/\s+/g,' ').trim();
 const extras={
  'JavaScript':['javascript','ecmascript'],TypeScript:['typescript'],Java:['java'],Python:['python'],
  'C++':['c++','cpp'],'C#':['c#','csharp','c sharp'],'.NET':['.net','dotnet'],Go:['golang','linguagem go','go language'],
  'Node.js':['node.js','nodejs','node js'],React:['react','reactjs','react.js'],Angular:['angular'],Vue:['vue','vue.js','vuejs'],
  'Spring Boot':['spring boot'],Django:['django'],Flask:['flask'],FastAPI:['fastapi'],Ruby:['ruby'],Rails:['rails'],PHP:['php'],Laravel:['laravel'],Rust:['rust'],Kotlin:['kotlin'],Swift:['swift'],Dart:['dart'],Flutter:['flutter'],
  SQL:['sql','structured query language'],NoSQL:['nosql'],PostgreSQL:['postgresql','postgres'],MongoDB:['mongodb','mongo db'],Redis:['redis'],MySQL:['mysql'],SQLite:['sqlite'],
  AWS:['aws','amazon web services'],Azure:['azure','microsoft azure'],GCP:['gcp','google cloud','google cloud platform'],
  Kubernetes:['kubernetes','k8s'],Docker:['docker'],Terraform:['terraform'],Ansible:['ansible'],
  'CI/CD':['ci/cd','ci cd','cicd','continuous integration','integracao continua','continuous delivery','entrega continua'],
  'GitHub Actions':['github actions'],'Azure DevOps':['azure devops'],GitLab:['gitlab'],Jenkins:['jenkins'],
  SRE:['sre','site reliability engineering','engenharia de confiabilidade'],DevOps:['devops'],
  'Testes automatizados':['testes automatizados','automated testing','automated tests'],
  'Testes unitários':['testes unitarios','unit testing','unit tests'],TDD:['tdd','test driven development'],BDD:['bdd','behavior driven development'],
  Cypress:['cypress'],Playwright:['playwright'],Selenium:['selenium'],Jest:['jest'],Pytest:['pytest'],JUnit:['junit'],
  'Design patterns':['design patterns','padroes de projeto'],SOLID:['solid'],'Clean Architecture':['clean architecture','arquitetura limpa'],
  DDD:['ddd','domain driven design'],MVC:['mvc','model view controller'],MVVM:['mvvm','model view viewmodel'],
  Microsserviços:['microsservicos','microservices','microservico'],REST:['rest','restful'],GraphQL:['graphql'],gRPC:['grpc'],
  OAuth:['oauth','oauth2','oauth 2.0'],OpenTelemetry:['opentelemetry','otel'],Prometheus:['prometheus'],Grafana:['grafana'],
  'Inteligência artificial':['inteligencia artificial','artificial intelligence'],
  'Machine learning':['machine learning','aprendizado de maquina'],PyTorch:['pytorch'],TensorFlow:['tensorflow'],
  'Power BI':['power bi','powerbi'],Tableau:['tableau'],Spark:['spark','apache spark'],Airflow:['airflow','apache airflow'],
  Scrum:['scrum'],Kanban:['kanban'],Agile:['agile','agil'],'Inglês':['ingles','english'],
  Comunicação:['comunicacao','communication'],Liderança:['lideranca','leadership']
 };
 // Broad ordinary words would inflate scores without identifying a technical skill.
 const generic=new Set(['apply','plan','job','node','host','label','limit','request','service','state','merge','offset','pool','port','porta','processo','estado','contrato','indice','janela','memoria','dado','dados','modelo','codigo','go','ia','az','kb','mb','gb','b','r','c']);
 const escape=s=>s.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 function contains(text,term){return new RegExp('(^|[^a-z0-9_+#])'+escape(normalize(term))+'(?=$|[^a-z0-9_+#])','u').test(normalize(text))}
 function catalog(titles=[]){
  const map=new Map();
  for(const title of titles){const key=normalize(title);if(key.length>1&&!generic.has(key))map.set(key,{title,aliases:[title]})}
  for(const [title,aliases] of Object.entries(extras)){for(const alias of aliases)map.delete(normalize(alias));map.set(normalize(title),{title,aliases})}
  return [...map.values()];
 }
 function compare(resume,job,titles=[],custom=[]){
  const terms=catalog(titles);
  for(const title of [...new Set(custom.map(t=>t.trim()).filter(Boolean))])if(!terms.some(t=>normalize(t.title)===normalize(title)))terms.push({title,aliases:[title]});
  const selected=terms.filter(t=>t.aliases.some(a=>contains(job,a)));
  const found=[],missing=[];
  for(const term of selected)(term.aliases.some(a=>contains(resume,a))?found:missing).push(term.title);
  return {score:selected.length?Math.round(found.length/selected.length*100):null,total:selected.length,found,missing};
 }
 const api={normalize,contains,catalog,compare};if(typeof module==='object'&&module.exports)module.exports=api;else root.AuroraATS=api;
})(typeof window==='undefined'?globalThis:window);
