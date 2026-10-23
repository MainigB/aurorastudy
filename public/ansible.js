(function(root){
 const lessons=[
  {id:'ansible-01',title:'Ansible: inventário e escopo da mudança',minutes:15,
   reading:`Ansible executa tarefas a partir de um nó de controle sobre os destinos definidos no inventário. Em servidores Linux, a conexão costuma usar SSH; o usuário remoto precisa das permissões necessárias e muitos módulos dependem de Python no destino. Não é preciso manter um agente Ansible rodando em cada servidor. No Windows, use WSL ou um ambiente Linux como nó de controle.

O inventário nomeia máquinas e grupos. Um playbook em YAML associa um padrão de hosts a uma sequência de tarefas. Os módulos implementam operações, como copiar um arquivo ou manter um serviço iniciado. Terraform costuma provisionar recursos; Ansible pode configurar sistemas já existentes. A divisão não é absoluta: evite duas ferramentas disputando o mesmo estado.

Na Aurora, homologação e produção precisam ter escopos explícitos. Considere este inventário didático, com nomes fictícios:

\`\`\`ini
[homologacao]
stage01

[producao]
api01
api02
\`\`\`

Antes de executar um playbook, inspecione o inventário e a lista de destinos. Um limite restringe o conjunto definido pelo play; ele não concede acesso nem transforma produção em homologação.

\`\`\`bash
ansible-inventory -i inventory.ini --graph
ansible-playbook -i inventory.ini configurar.yml --syntax-check
ansible-playbook -i inventory.ini configurar.yml --list-hosts --limit homologacao
\`\`\`

Checar sintaxe não testa a conexão e listar hosts não executa tarefas. O módulo ansible.builtin.ping verifica a comunicação Ansible e Python em destinos compatíveis; não é um ping ICMP nem uma prova de saúde da API. Revise usuário remoto, autenticação e necessidade de become antes de aplicar. Não coloque senhas no inventário versionado.`,
   scenario:'Você recebeu configurar.yml com hosts: all e o inventário acima. A mudança foi autorizada somente em stage01. A revisão de sintaxe passou. Escolha as decisões antes de executar.',
   questions:[
    {prompt:'Qual verificação confirma o conjunto de destinos sem executar as tarefas?',options:['Executar sem limite, pois a sintaxe passou.','Usar --list-hosts --limit homologacao e conferir que só stage01 aparece.','Usar --limit producao porque há menos máquinas.'],answer:1,explanation:'A lista permite conferir o escopo efetivo. Use o mesmo inventário e limite também na execução posterior; a conferência não torna outro comando seguro.'},
    {prompt:'O módulo ping retornou pong. O que você demonstrou?',options:['A API de pedidos está saudável.','As portas HTTP estão abertas para todos os clientes.','A comunicação Ansible necessária ao módulo funcionou; a saúde da aplicação ainda precisa ser testada.'],answer:2,explanation:'O ping do Ansible não é ICMP nem uma requisição à API. Verifique a aplicação com um teste específico e do ponto de vista apropriado.'}
   ],source:'https://docs.ansible.com/projects/ansible/latest/inventory_guide/intro_inventory.html'},
  {id:'ansible-02',title:'Ansible: playbooks e idempotência',minutes:20,
   reading:`Uma tarefa deve descrever o estado desejado sempre que possível. Idempotência significa que repetir uma operação sobre um estado já convergido não introduz novas mudanças relevantes. Isso depende do módulo e dos argumentos: não é uma propriedade automática de qualquer playbook.

Neste exemplo local, o diretório deve existir e um arquivo deve conter exatamente o texto indicado. O exemplo é opcional para execução em um ambiente de estudo com Ansible instalado; o site não executa estes comandos no seu computador. Salve como configurar.yml:

\`\`\`yaml
- name: Preparar configuracao didatica da Aurora
  hosts: localhost
  connection: local
  gather_facts: false
  tasks:
    - name: Criar diretorio do laboratorio
      ansible.builtin.file:
        path: /tmp/aurora-ansible-estudo
        state: directory
        mode: '0700'
    - name: Declarar configuracao
      ansible.builtin.copy:
        dest: /tmp/aurora-ansible-estudo/api.conf
        content: "workers=2\\n"
        mode: '0600'
\`\`\`

Execute somente em um ambiente de estudo:

\`\`\`bash
ansible-playbook -i localhost, configurar.yml
ansible-playbook -i localhost, configurar.yml
\`\`\`

Partindo de um diretório inexistente, a primeira execução normalmente relata duas mudanças. Na segunda, sem alteração externa, espera-se changed=0. Se alguém editar workers=2 para workers=9, uma nova execução deve restaurar o conteúdo declarado. Registre o recap e confira o arquivo: changed=0 sozinho não prova que a aplicação funciona.

Usar shell com echo e redirecionamento de acréscimo pode duplicar linhas a cada execução. Trocar para um módulo apropriado é melhor que esconder a mudança com changed_when: false. Essa opção altera o relatório, não torna uma operação idempotente.

Para configurações com variáveis, use template e um arquivo Jinja2. Organize tarefas reutilizáveis em roles conforme o projeto crescer. Um handler notificado por uma tarefa alterada permite reagir a uma mudança, como reiniciar um serviço. Notificações repetidas do mesmo handler são agrupadas antes de sua execução; o momento pode ser antecipado com meta: flush_handlers. Nem todo serviço aceita reload: confirme seu comportamento.`,
   scenario:'Um colega substituiu o módulo copy por shell: echo workers=2 >> /tmp/aurora-ansible-estudo/api.conf. Após três execuções há três linhas iguais. Ele propõe changed_when: false para deixar o painel verde.',
   questions:[
    {prompt:'Qual correção trata a causa?',options:['Definir o conteúdo com copy ou template e verificar duas execuções consecutivas.','Adicionar changed_when: false ao shell.','Ignorar o recap e executar mais uma vez.'],answer:0,explanation:'copy/template comparam o estado desejado e o arquivo. changed_when só controla o relato da tarefa; não impede o acréscimo de linhas.'},
    {prompt:'Depois da convergência, uma segunda execução apresentou changed=0. Qual conclusão é defensável?',options:['Não é necessário testar o serviço.','As tarefas não reportaram mudanças; ainda precisamos verificar conteúdo e comportamento da aplicação.','Nenhuma alteração futura será possível.'],answer:1,explanation:'O recap é evidência sobre as tarefas executadas, não uma garantia de disponibilidade nem de ausência de drift futuro.'}
   ],source:'https://docs.ansible.com/projects/ansible/latest/collections/ansible/builtin/copy_module.html'},
  {id:'ansible-03',title:'Ansible: mudança gradual e recuperação',minutes:20,
   reading:`Antes de uma mudança, revise o diff, teste em homologação e limite o primeiro lote. --check simula operações nos módulos que oferecem suporte, mas pode pular tarefas e não reproduz todos os efeitos. Tarefas configuradas com check_mode: false podem executar mesmo nesse modo. Portanto, revise o playbook antes de confiar na simulação. --diff pode mostrar segredos; evite expor conteúdo sensível em logs.

Um handler de reinício só será notificado quando a tarefa associada reportar mudança. Por padrão, uma falha posterior pode impedir handlers naquele host. Não trate isso como transação: um arquivo pode ter sido alterado mesmo que o serviço não tenha reiniciado.

Considere este fragmento de estratégia para uma API com quatro réplicas; as tarefas de retirada do balanceador, mudança e validação devem ser implementadas conforme o ambiente:

\`\`\`yaml
- name: Alterar replicas gradualmente
  hosts: producao
  serial: 1
  any_errors_fatal: true
  tasks:
    # Retirar a replica do trafego e aguardar drenagem.
    # Aplicar configuracao validada e executar o handler.
    # Testar saude e comportamento antes de recolocar no trafego.
\`\`\`

O fragmento ilustra a estratégia, não um deploy pronto. serial: 1 limita o lote, mas não verifica disponibilidade. any_errors_fatal interrompe a execução conforme o processamento da falha no lote; ele não desfaz tarefas concluídas. Para validar antes de avançar, defina critérios de saúde e falhe explicitamente quando eles não forem atendidos.

Na Aurora, estabeleça: no máximo uma réplica fora de tráfego, configuração validada antes da troca, teste de pedido sintético sem cobrança real e interrupção em caso de erro. Use register, assert ou failed_when quando precisar interpretar um resultado, em vez de ignore_errors indiscriminado.

Planeje recuperação: guarde a configuração anterior, confirme compatibilidade e restaure somente após entender o efeito da mudança. Um bloco rescue pode executar ações de tratamento, mas não oferece rollback automático nem cobre todas as classes de falha. Ansible Vault protege arquivos e variáveis em repouso; não impede que uma tarefa revele um segredo durante a execução. Use menor privilégio, controle de acesso e no_log nas tarefas sensíveis quando adequado.`,
   scenario:'A API tem quatro réplicas. O playbook usa serial: 1. A primeira réplica recebeu uma configuração nova, mas a checagem de saúde falhou. Um colega quer acrescentar ignore_errors para atualizar as outras três.',
   questions:[
    {prompt:'Qual deve ser a próxima decisão?',options:['Atualizar as outras réplicas para padronizar a falha.','Interromper a expansão, manter a réplica problemática fora do tráfego e investigar ou recuperar a configuração com validação.','Aumentar serial para 4.'],answer:1,explanation:'O primeiro lote revelou um problema. Preserve as réplicas saudáveis, investigue a evidência e valide a recuperação antes de retomar. serial sozinho não interrompe todo o rollout em qualquer política.'},
    {prompt:'O que --check --diff garante?',options:['Rollback automático de todas as mudanças.','Execução completamente inofensiva de qualquer playbook.','Uma previsão limitada ao suporte e à configuração das tarefas; ainda exige revisão e testes.'],answer:2,explanation:'Check mode tem limitações e tarefas podem optar por executar. Diff pode revelar dados sensíveis. Nenhum dos dois substitui teste de aplicação ou plano de recuperação.'}
   ],source:'https://docs.ansible.com/projects/ansible/latest/playbook_guide/playbooks_checkmode.html'}
 ].map(l=>({...l,formation:'SRE',track:'IAC',kind:'supplement',learningMode:'activity',page:396,readingEnd:396}));
 const api={lessons,correct:(lesson,answers)=>lesson.questions.every((q,i)=>answers[i]===q.answer)};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.AuroraAnsible=api;
})(typeof window==='undefined'?globalThis:window);

function openAnsibleLesson(id){
 const l=AuroraAnsible.lessons.find(l=>l.id===id);if(!l||!AuroraAccount.isReady())return;
 show(`<div class="book-reader"><button class="text-button" id="ansible-back">← Minha trilha</button><p class="eyebrow">COMPLEMENTO DO AURORA · ANSIBLE · ${l.minutes} MIN</p><h2>${esc(l.title)}</h2><p>Leia ou ouça o conteúdo e resolva o cenário. Este complemento não faz parte do texto original do livro.</p>${completeBookAudio()}<article class="book-prose" id="book-text">${AuroraSRE.markdown(l.reading)}</article><p><a href="${esc(l.source)}" target="_blank" rel="noopener noreferrer">Documentação oficial do Ansible ↗</a></p><button class="primary" id="ansible-practice">Praticar o que li →</button><section id="ansible-questions" hidden><h3>Seu trabalho na Aurora</h3><p>${esc(l.scenario)}</p><form id="ansible-form">${l.questions.map((q,i)=>`<fieldset><legend>${i+1}. ${esc(q.prompt)}</legend>${q.options.map((o,j)=>`<p><label><input type="radio" name="answer-${i}" value="${j}" required> ${esc(o)}</label></p>`).join('')}</fieldset>`).join('')}<button class="primary">Verificar decisões</button></form><div id="ansible-feedback" role="status"></div></section></div>`);
 $('#lesson-dialog').classList.add('book-reading');AuroraBookVoice.bind($('#book-text'));
 $('#ansible-back').onclick=()=>$('#lesson-dialog').close();
 $('#ansible-practice').onclick=()=>{AuroraBookVoice.stop();$('#ansible-questions').hidden=false;$('#ansible-questions').scrollIntoView({behavior:'smooth'})};
 $('#ansible-form').onsubmit=e=>{e.preventDefault();if(!AuroraAccount.isReady()){AuroraAccount.open();return}const answers=l.questions.map((q,i)=>Number(new FormData(e.target).get(`answer-${i}`)));const correct=AuroraAnsible.correct(l,answers);
 $('#ansible-feedback').innerHTML=l.questions.map((q,i)=>`<p><b>${answers[i]===q.answer?'✓':'Revise'} · Questão ${i+1}:</b> ${esc(q.explanation)}</p>`).join('');
 if(correct){const fresh=Aurora.award(state,l.id,Aurora.dateKey());save();render();$('#ansible-feedback').insertAdjacentHTML('beforeend',`<p>${fresh?'Atividade concluída · +20 XP.':'Atividade revisada; XP já registrado.'} Acertar este cenário não comprova execução em um ambiente real.</p><button class="primary" id="ansible-next">Continuar minha trilha →</button>`);$('#ansible-next').onclick=followJourney}
 else $('#ansible-feedback').insertAdjacentHTML('beforeend','<p>Revise as decisões e tente novamente. O próximo passo será liberado após acertar as duas questões.</p>');
 };
}
