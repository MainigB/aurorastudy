import fs from 'node:fs';
const read=p=>JSON.parse(fs.readFileSync(new URL(p,import.meta.url),'utf8'));
const arcs=read('./company_arcs.json'),curriculum=read('../public/curriculum.json'),linux=read('../public/linux.json');
const order=['PRE','SYS','AUT','OBS','SLO','RES','CLOUD','IAC','CONT','DATA','CD','SEC','INC','AI','LID','PRA','JOBS'];
const missions={};
for(const track of order){
 const lessons=[...linux,...curriculum.lessons].filter(l=>l.track===track);
 const arc=arcs[track];
 for(const [index,l] of lessons.entries()){
  const phase=Math.min(2,Math.floor(index*3/lessons.length));
  const task=l.kind==='command'?l.scenario:l.questions[0];
  const evidence=l.kind==='command'?'Saída sintética do terminal e condições declaradas no enunciado.':l.track==='JOBS'?'Registro histórico do livro, data da amostra e exigências explicitamente observadas.':'Seções de contexto e prática, exemplos e condições do chamado abaixo. Não presuma dados que não foram fornecidos.';
  missions[l.id]={ticket:`AUR-${track}-${l.id.startsWith('linux-')?'L'+l.id.slice(6).padStart(2,'0'):l.id.slice(1)}`,phase,sequence:index+1,subject:l.title,request:`${arc.owner} encaminhou o chamado “${l.title}”. Sua tarefa nesta rodada: ${task}`,evidence,deliverable:l.kind==='command'?'Consulta correta e interpretação da evidência, incluindo o que a saída não permite concluir.':arc.deliverable,previous:lessons[index-1]?.id||null,next:lessons[index+1]?.id||null};
 }
}
const company={name:'Aurora · Plataforma de pedidos',order,arcs,missions,
 story:'Você faz parte da equipe de confiabilidade de uma plataforma fictícia usada por lojistas para receber pedidos. A jornada vai da integração ao primeiro plantão, passa por automação, plataforma e dados e termina em uma revisão técnica. Produto, engenharia e operação dependem das decisões que você consegue explicar.',
 contract:'Simulação de trabalho: pessoas, chamados e consequências são fictícios. Cada exercício é um recorte independente; números e estados de uma missão não são transportados automaticamente para outra. Somente respostas, revisões e conclusões são salvas. Nenhuma ação modifica uma infraestrutura real.',
 topology:['Lojista','Borda / DNS / HTTP','API de pedidos','Banco de pedidos','Fila de eventos','Workers e notificações'],
 principles:['Um pedido precisa ser correto, não apenas rápido.','A decisão deve apontar evidência, hipótese e limite.','Quem assume o próximo turno precisa entender suas pendências.']};
fs.writeFileSync(new URL('../public/company.json',import.meta.url),JSON.stringify(company,null,2)+'\n');
console.log(`${order.length} rotações, ${Object.keys(missions).length} chamados.`);
