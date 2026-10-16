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

`npm test`: 7 testes de currículo, comandos, XP, validação e normalização de progresso.
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
