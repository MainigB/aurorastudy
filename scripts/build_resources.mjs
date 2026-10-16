import {readFileSync,writeFileSync} from 'node:fs';
const read=name=>JSON.parse(readFileSync(new URL('../public/'+name,import.meta.url),'utf8'));
// Curated from the creators' YouTube pages. oEmbed verifies titles and channels;
// descriptions below are study prompts, not claims of full-video review.
const entries=[
 ['dns','mpQZVYPuDGU','en','Resolução de nomes','Visualize a resolução DNS e relacione cada etapa à evidência que uma consulta dig fornece.'],
 ['prometheus','h4Sl21AKiDg','en','Arquitetura do Prometheus','Relacione coleta, séries temporais e alertas. Para quantis e cardinalidade, aprofunde na documentação vinculada.'],
 ['group','ocyVJ9gRUaE','pt-BR','Agregação SQL','Compare DISTINCT, GROUP BY e HAVING. Observe as diferenças entre o MySQL do vídeo e o SQLite do laboratório.'],
 ['explain','CMftYJnqou0','en','Planos de execução PostgreSQL','Aprofundamento em EXPLAIN e planos genéricos no PostgreSQL 16. Compare com o plano e a versão do seu caso.'],
 ['learn','ZtMzB5CoekE','pt-BR','Métodos de estudo','Observe como organizar o aprendizado e transforme a aula em uma pequena prática verificável.'],
 ['linux','x0AG2sqTCGo','pt-BR','Fundamentos do terminal','Apoio geral para ganhar familiaridade com o terminal. Confira a sintaxe específica no manual da aula.'],
 ['perf','FJW8nGV4jxY','en','Diagnóstico de desempenho','Relacione ferramentas de diagnóstico com CPU, memória e I/O. O material é histórico; valide opções na documentação atual.'],
 ['slo','tEylFyxbDLE','en','Confiabilidade e objetivos','Diferencie indicador, objetivo e compromisso de serviço antes de justificar a decisão do caso.'],
 ['incident','n4y9dwinPBQ','en','Coordenação de incidentes','Observe os papéis e a comunicação. Aplique isso à passagem de turno e às decisões da equipe Aurora.'],
 ['obs','SoZZzB-yTOk','en','Observabilidade','Relacione métricas, logs e traces à evidência que falta no diagnóstico. Interfaces antigas podem diferir das atuais.'],
 ['python','31llNGKWDdo','pt-BR','Base para automação','Introdução à linguagem para quem precisa revisar a base. As decisões de segurança da automação continuam no exercício.'],
 ['distributed','UEAMfLPZZhE','en','Sistemas distribuídos','Introdução à série de Martin Kleppmann. Use as aulas seguintes da série para aprofundar modelos de falha e coordenação.'],
 ['cloud','97l0Ahu2efE','pt-BR','Computação em nuvem','Revise os conceitos de nuvem e confronte-os com responsabilidade operacional, custo e disponibilidade.'],
 ['terraform','4FellihAcV8','pt-BR','Infraestrutura como código','Apoio para compreender Terraform. Compare exemplos antigos com a documentação atual de estado, planos e provedores.'],
 ['docker','ms04rvuRyyI','pt-BR','Containers','Primeiros passos da série Descomplicando Docker. Relacione o ambiente isolado com o ciclo de vida da aplicação.'],
 ['k8s','s_o8dwzRlu4','en','Kubernetes','Visão geral prática dos componentes. Consulte a documentação atual antes de reproduzir configurações e versões.'],
 ['sql','GaOlyL3Uv9M','pt-BR','Consultas SQL','Revise SELECT e filtros. O vídeo usa MySQL; o laboratório Aurora usa SQLite e os casos de SRE podem usar PostgreSQL.'],
 ['events','50v1MkAYQ-s','pt-BR','Arquitetura orientada a eventos','Relacione produtores, consumidores e eventos com as consequências de entrega repetida ou atrasada.'],
 ['kafka','YL8CvpQ_nL0','pt-BR','Mensageria e integração','Apoio sobre Kafka e integração. Ao responder, explicite garantias, reprocessamento e limites do seu cenário.'],
 ['cicd','rQ_f1ptZWlU','pt-BR','Entrega de software','Relacione a esteira com validação, artefato e implantação. Acrescente critérios de interrupção e recuperação ao caso.'],
 ['security','yn6CPQ9RioA','en','Identidade e confiança','Introdução a Zero Trust. Use como ponto de partida para discutir identidade, autorização e privilégio mínimo.'],
 ['ai','jrHRe9lSqqA','en','Segurança de IA','Observe o risco de instruções presentes em dados externos e avalie os limites de atuação do agente.'],
 ['career','imB0QVoNrGc','pt-BR','Escolhas de aprendizado','Conversa sobre escolhas de tecnologia. Apoio geral de carreira, não análise das vagas históricas nem anúncio de emprego.'],
 ['api','S7MduKwvVGk','pt-BR','Contratos de API','Introdução a REST. Use a documentação da aula para conferir semântica HTTP, erros e condições do contrato.'],
 ['test','fNTJnJB3eDI','pt-BR','Testes de software','Relacione os tipos de teste com o risco do caso, o isolamento e o feedback que cada teste oferece.'],
 ['solid','6SfrO3D4dHM','pt-BR','Princípios SOLID','Use as ilustrações como base para explicar responsabilidades, contratos e dependências no código da aula.'],
 ['patterns','J-lHpiu-Twk','pt-BR','Design Patterns','Introdução à família de padrões. Consulte a referência específica para comparar intenção, estrutura e custo do padrão da aula.'],
 ['mvc','jyTNhT67ZyY','pt-BR','MVC','Relacione modelo, visão e controlador com a responsabilidade de cada trecho do exemplo.'],
 ['mvvm','Pso1MeX_HvI','en','MVVM','Exemplos no ecossistema .NET. Transfira a separação de estado, apresentação e comandos para o cenário da aula.'],
 ['clean','BuSf7VsH064','pt-BR','Clean Architecture','Observe limites e direção das dependências; explique como testar a regra de negócio sem depender da infraestrutura.'],
 ['tenant','KYf-3pXANto','en','Arquitetura SaaS','Conversa sobre arquitetura multi-tenant. Compare isolamento, operação e efeitos de compartilhar recursos.'],
 ['ddd','eUf5rhBGLAk','pt-BR','Domain-Driven Design','Relacione domínio e linguagem de negócio com os limites e invariantes do exercício.'],
 ['micro','hlcQ_WOyNNs','pt-BR','Microsserviços','Apoio para discutir distribuição e escala. Compare os benefícios com falhas parciais e custo de operação.']
];
const tracks={
 PRE:['learn','https://sre.google/sre-book/part-I-introduction/'],
 LID:['incident','https://sre.google/workbook/engagement-model/'],
 SYS:['perf','https://www.brendangregg.com/linuxperf.html'],
 AUT:['python','https://docs.python.org/pt-br/3/tutorial/'],
 OBS:['obs','https://prometheus.io/docs/practices/histograms/'],
 SLO:['slo','https://sre.google/workbook/implementing-slos/'],
 RES:['distributed','https://sre.google/sre-book/handling-overload/'],
 CLOUD:['cloud','https://docs.aws.amazon.com/wellarchitected/latest/reliability-pillar/welcome.html'],
 IAC:['terraform','https://developer.hashicorp.com/terraform/language/state'],
 CONT:['k8s','https://kubernetes.io/pt-br/docs/concepts/'],
 DATA:['sql','https://www.postgresql.org/docs/current/admin.html'],
 CD:['cicd','https://sre.google/workbook/canarying-releases/'],
 SEC:['security','https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html'],
 INC:['incident','https://sre.google/workbook/incident-response/'],
 AI:['ai','https://genai.owasp.org/llmrisk/llm01-prompt-injection/'],
 PRA:['learn','https://sre.google/workbook/table-of-contents/'],
 JOBS:['career','https://sre.google/sre-book/evolving-sre-engagement-model/'],
 'DEV-API':['api'],'DEV-TEST':['test'],'DEV-SOLID':['solid'],'DEV-PAT':['patterns'],
 'DEV-MVC':['mvc'],'DEV-MVVM':['mvvm'],'DEV-CLEAN':['clean'],'DEV-TENANT':['tenant'],
 'DEV-DDD':['ddd'],'DEV-MICRO':['micro'],'DEV-SQL':['sql']
};
const lessons=[...read('linux.json'),...read('curriculum.json').lessons,...read('developer.json').lessons];
let previous={videos:{}};try{previous=read('resources.json')}catch{}
const videos=Object.fromEntries(entries.map(([id,youtube,language,topic,focus])=>[id,{...previous.videos[id],url:`https://www.youtube.com/watch?v=${youtube}`,language,topic,focus}]));
if(process.argv.includes('--verify')){
 for(const [id,v] of Object.entries(videos)){
  const r=await fetch('https://www.youtube.com/oembed?format=json&url='+encodeURIComponent(v.url),{signal:AbortSignal.timeout(15000)});
  if(!r.ok)throw Error(`${id}: YouTube ${r.status}`);
  const m=await r.json();Object.assign(v,{title:m.title,channel:m.author_name,checked:'2026-10-16'});console.log(id+': '+m.title+' / '+m.author_name);
 }
}
for(const [id,v] of Object.entries(videos))if(!v.title)throw Error('Execute --verify para verificar '+id);
const mapping={};
for(const l of lessons){
 const config=tracks[l.track];if(!config)throw Error('Trilha sem curadoria: '+l.track);
 const selected=[config[0]];
 if(l.kind==='command')selected.splice(0,1,'linux');
 if(l.track==='SYS'&&/dns|resolu.*nome/i.test(l.title))selected.splice(0,1,'dns');
 if(l.track==='OBS'&&/prom|histograma|cardinalidade|quantil|percentil/i.test(l.title))selected.unshift('prometheus');
 if(l.track==='DATA'&&/plano|índice|indice|consulta|explain/i.test(l.title))selected.splice(0,1,'explain');
 if(l.track==='DEV-SQL'&&/group|having|agrega/i.test(l.title))selected.splice(0,1,'group');
 if(l.track==='CONT'&&/docker|imagem|container|contêiner/i.test(l.title))selected.unshift('docker');
 if(l.track==='DATA'&&/kafka|fila|mensageria|evento|outbox/i.test(l.title))selected.splice(0,1,'kafka','events');
 if(l.track==='AUT'&&/teste/i.test(l.title))selected.unshift('test');
 if(l.track==='AUT'&&/retry|retries|idempot|backpressure|concorr/i.test(l.title))selected.unshift('distributed');
 if(l.track==='PRA'&&/incidente|plantão/i.test(l.title))selected.splice(0,1,'incident');
 if(l.track==='PRA'&&/arquitetura|sistema|capacidade/i.test(l.title))selected.splice(0,1,'distributed');
 mapping[l.id]={videos:[...new Set(selected)].slice(0,2),references:[{title:l.source?'Referência técnica da aula':'Documentação e aprofundamento da trilha',url:l.source||config[1]}]};
}
writeFileSync(new URL('../public/resources.json',import.meta.url),JSON.stringify({checked:'2026-10-16',videos,lessons:mapping},null,2)+'\n');
console.log(`${Object.keys(videos).length} vídeos; ${lessons.length} aulas com materiais.`);
