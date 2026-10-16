# Aurora — SRE na prática

Produção: https://aurora-sre-academy.vercel.app

## Contas e dados

- Cadastro com nome, e-mail e senha (mínimo de 12 caracteres), login, logout e troca de senha.
- Better Auth gerencia hashes de senha, sessões em cookies HttpOnly/Secure/SameSite e limitação de tentativas no banco.
- PostgreSQL Neon, plano Free, região São Paulo, conectado à Vercel.
- O servidor identifica o usuário pela sessão; nunca usa um ID enviado pelo cliente como autorização.
- `aurora_progress` guarda atividades, rascunhos, revisões e última atividade. XP e contagem diária são recalculados pelo servidor.
- Atualizações usam controle de versão: conflito de abas/dispositivos pede exportação e recarga, sem sobrescrever silenciosamente.
- A interface informa alterações pendentes, sincronização concluída e falhas. Sair é bloqueado enquanto houver alterações pendentes; uma cópia JSON pode ser exportada.
- Progresso antigo em localStorage só é importado após confirmação explícita na tela Minha conta. O PDF pessoal não é enviado ao servidor.
- Recuperação por e-mail e verificação do endereço não estão configuradas; troca de senha exige a senha atual.

## Desenvolvimento

1. `npm install`
2. `vercel env pull .env.local`
3. Definir BETTER_AUTH_SECRET e BETTER_AUTH_URL=http://127.0.0.1:4173 em .env.local.
4. `npm run db:migrate` cria o esquema Better Auth e a tabela de progresso.
5. `npm run dev`

Os arquivos `.env*` são excluídos do Git e deploy. DATABASE_URL e BETTER_AUTH_SECRET existem somente no servidor. A URL de produção precisa estar em BETTER_AUTH_URL.

## Validação

`npm test`: testes de currículo, comandos, XP, validação, normalização de progresso, quizzes, SQLite e fluxo de aprendizagem SRE.
`npm run test:integration`: cria duas contas fictícias e as remove ao terminar; exige autorização para esse fluxo e acesso ao banco. Testa cadastro, login, rejeição de senha incorreta, cookies, persistência, isolamento, versões, origem, logout e troca de senha.

## Conteúdo

17 trilhas, 347 tópicos do Livro 4 e 18 desafios Linux. O terminal é simulado; respostas abertas usam autoavaliação, sem avaliação semântica automática. Perguntas e páginas são derivadas dos manifestos em `book4/`; `python build_curriculum.py` atualiza o catálogo. A pesquisa de vagas permanece histórica.

## Administração

O perfil fica em `aurora_admins`, separado dos campos editáveis de cadastro. Não existe endpoint público para promover usuários. Para conceder o perfil após identificar a conta autorizada: `node --env-file=.env.local scripts/grant-admin.mjs EMAIL`.

O administrador acessa Minha conta > Abrir administração, consulta nome/e-mail, contagem de atividades e sessões e pode encerrar sessões de outra conta. A listagem não retorna senhas, hashes ou rascunhos. Ações ficam registradas em `aurora_admin_audit`. Permissões são consultadas no banco a cada requisição, e mutações verificam origem e identidade da sessão.

Em um banco novo, execute também `node --env-file=.env.local scripts/migrate-admin.mjs`. Testes específicos: `node --env-file=.env.local tests/admin-integration.mjs`; eles criam duas contas fictícias, concedem temporariamente o papel a uma delas e removem dados de teste ao terminar.

## Formações multidisciplinares

A página agora oferece SRE e Desenvolvimento. SRE mantém seus 347 tópicos e 18 comandos, com os mesmos IDs. Desenvolvimento tem 50 aulas autorais em 11 módulos: APIs, testes, SOLID, patterns, MVC, MVVM, Clean Architecture, Multi Tenant, DDD, microsserviços e SQL. Não depende do livro. As aulas incluem texto, código ilustrativo, cenário e referência técnica; 44 têm quizzes e seis executam SQL.

O laboratório roda SQLite/sql.js em um Web Worker, com banco fictício recriado a cada execução, limite de tempo de 12s e de 10.000 caracteres. Não há envio de SQL ao servidor: somente o rascunho e o progresso são sincronizados como os demais exercícios. O resultado é comparado por colunas, valores e ordenação. Essa validação não atesta desempenho, equivalência para todos os dados ou estrutura de transações. Os demais exemplos de código são ilustrativos, sem execução.

`python scripts/build_developer.py` gera `public/developer.json` e `lib/lesson-ids.json`. O registro é validado no servidor, inclui todos os IDs históricos e deve ser regenerado quando o catálogo mudar. Não foi necessária alteração no esquema de dados. XP global soma as áreas; o painel de progresso e a lista de revisão são filtrados pela formação selecionada. Exportação/importação continua abrangendo todas as formações.

`npm test` inclui validação do catálogo, chaves dos quizzes, execução das seis soluções SQL e coexistência de progresso SRE/Desenvolvimento. No navegador foram verificados erro/acerto de quiz, SQL real, troca de formação e persistência após recarga usando uma conta fictícia.

## SRE aprofundado

Oito oficinas adicionais em `scripts/sre_cases.json` incluem dados, restrições e decisões: canário/percentis, retries/deadline, agregação de erros, orçamento de erro, lock de infraestrutura, PDB/capacidade, recuperação de dados e coordenação de incidente. As perguntas de aprofundamento do manuscrito também aparecem no roteiro de resposta antes da solução.

Os 347 tópicos preservam todas as seções do manuscrito, sem truncar explicações, código ou soluções. `python build_curriculum.py` usa os manifestos em `../book4/` para gerar estudo, prática, respostas comentadas, exemplos guiados, vocabulário e links de pré-requisitos. Esses arquivos de origem pertencem ao projeto do livro e não estão neste repositório; o catálogo gerado está versionado e basta para executar/publicar o site. Seções são classificadas por título: estudo, prática ou solução. Perguntas-guia específicas são acompanhadas de aplicação ao caso e análise de limites. As referências são abertas após uma tentativa; a conclusão exige quatro critérios de autoavaliação, sem alegar correção semântica.

`node scripts/build_linux.mjs` gera `public/linux.json` com 18 laboratórios autorais: cenário operacional, teoria, sintaxe, dicas progressivas, interpretação com feedback por alternativa e extensão comentada. Um comando correto libera a interpretação; XP só é concedido após as duas etapas. A simulação não executa Linux e aceita apenas variantes previstas. Os IDs e os 20 XP históricos foram mantidos: atividades já concluídas continuam concluídas, e sua revisão não gera XP adicional. Rascunhos de comandos e respostas continuam salvos pelo mecanismo existente. A etapa intermediária de interpretação reinicia ao reabrir o laboratório.

`public/sre-learning.js` renderiza um subconjunto seguro de Markdown: HTML bruto vira texto, e links aceitam somente HTTP/HTTPS. `tests/sre.test.mjs` verifica cobertura, pré-requisitos, trechos de código preservados, conclusão em duas etapas e escape de conteúdo.

## Jornada na empresa fictícia

Toda a formação SRE tem um contexto de trabalho: 17 rotações com colegas recorrentes, responsabilidades, impacto, restrições e uma passagem de turno esperada. As 365 atividades possuem tickets estáveis derivados dos IDs originais, vinculados aos IDs de progresso originais. A ordem sugerida começa por integração, mas nenhuma rotação é bloqueada. Estados A fazer, Rascunho, Em revisão e Concluída são derivados do progresso existente; revisão tem precedência visual sobre conclusão.

`scripts/company_arcs.json` contém as narrativas e os ensaios de decisão por rotação. `node scripts/build_company.mjs` combina esses contextos com o conteúdo específico de cada aula e gera `public/company.json`. Execute esse gerador depois de alterar/regenerar o currículo ou Linux. Os chamados apresentam evidências e perguntas do próprio exercício; não transferem números nem simulam efeitos de infraestrutura entre missões. Decisões na conversa da rotação exibem consequências didáticas, não dão XP e não são persistidas.

O caderno de bordo reúne rascunhos, revisões e conclusões SRE e pode ser baixado como Markdown. Usa a sincronização autenticada já existente; não cria tabela ou campo adicional. O botão de modelo de registro só preenche respostas vazias e preserva rascunhos existentes. Um modelo sem preenchimento não libera a comparação. Em Linux, o comando é salvo; a alternativa de interpretação não é armazenada. O encerramento informa explicitamente que nenhum colega real revisou ou recebeu o registro.

`tests/company.test.mjs` verifica cobertura integral, identidade dos tickets, sequência dentro das rotações, fases, decisões e preservação dos estados históricos.
### Vídeos e referências complementares

Todas as 415 aulas possuem materiais complementares em `public/resources.json`: 33 vídeos do YouTube, com prioridade para português, identificação de idioma, canal e orientação de estudo. Materiais de fundamentos podem ser compartilhados entre aulas da mesma trilha; não são apresentados como respostas específicas ao exercício. Referências técnicas existentes foram preservadas. A consulta aos vídeos é opcional e não concede XP.

`node scripts/build_resources.mjs` regenera as associações por trilha e assunto usando os metadados salvos. `node scripts/build_resources.mjs --verify` consulta o oEmbed público do YouTube e atualiza títulos/canais; requer rede. A checagem de metadados não comprova reprodução integral nem revisão de toda a transcrição. A curadoria inicial foi feita em 16/10/2026. Alguns manuais GNU e systemd recusam consultas automatizadas; seus endereços oficiais foram preservados. Para novos vídeos, conferir conteúdo, idioma, relevância e compatibilidade de versões antes de adicioná-los.

O componente compartilhado `public/resources.js` escapa texto e aceita apenas links HTTPS. Falhas no carregamento do catálogo não impedem o acesso às atividades. Os testes verificam cobertura das aulas, metadados e segurança da renderização.
