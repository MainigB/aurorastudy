# Aurora: bancada operacional

Python 3.11+; nenhuma biblioteca externa. Dados fictícios. Extraia o ZIP em uma pasta nova. No Windows pode usar `py` no lugar de `python`. Use Linux/WSL para exercícios de ps, ss e permissões.

1. `python lab.py init`
2. `python lab.py backup` — preserve a cópia dos dois pedidos iniciais antes das alterações.
3. `python lab.py serve` — em um terminal; Ctrl+C encerra.
4. `python lab.py probe` — em outro terminal. A configuração inicial tem maintenance=true: health 200 e ready/orders 503.
5. Edite config.json, coloque maintenance=false, reinicie e repita probe. delay_ms permite ensaiar lentidão (máximo aplicado: 5000 ms).

O servidor só escuta em 127.0.0.1 por padrão e não precisa de cloud ou cartão. Em contêiner, use `serve --host 0.0.0.0` e publique apenas para loopback do host. Este servidor didático não foi construído para exposição pública. Não há autenticação.

## Entregas executáveis

- **Diagnóstico:** capture endpoints, processo e porta, altere apenas uma variável e prove recuperação. `--port 8766` funciona com serve e probe.
- **Automação:** ingest é intencionalmente não idempotente. Em uma cópia, execute duas vezes e observe stats. Na bancada principal, implemente import_orders.py com transação e unicidade; após duas execuções devem existir quatro pedidos (001 a 004), total de 12000 centavos. Teste entrada inválida sem persistência parcial.
- **Observabilidade:** escreva analyze.py que leia access.jsonl. Gere analysis.json com objeto por rota /orders e /health; campos total, errors (status >=500), p95_ms pelo método nearest-rank. Teste dados vazios e dados diferentes. Não codifique respostas fixas.
- **Dados:** restaure backup.db para restored.db usando a API SQLite de backup ou cópia com conexões fechadas. Preserve orders.db. A restauração deve conter os dois pedidos iniciais e 4000 centavos. Meça tempo; depois crie um índice em orders(external_id) e compare EXPLAIN QUERY PLAN.
- **Segurança:** gere redacted.jsonl sem o valor FAKE-TRAINING-TOKEN, mantendo quantidade/ordem dos registros e request_id, route, status, latency_ms. Acrescente testes com campos aninhados no seu redator.
- **Resiliência:** implemente cliente com timeout, limite de tentativas e circuito. Compare chamadas com delay_ms=0 e 1500. Registre tentativas e duração, não apenas sucesso.

`python lab.py verify` verifica cinco propriedades dos artefatos atuais e retorna 0 somente se todas passarem. Os testes do seu código, diagnóstico HTTP e qualidade do runbook continuam sendo evidências adicionais. O relatório é local, editável e não certifica identidade, autoria ou domínio. Não é prova de experiência de produção.

## Repetição e defesa

Refaça em pasta nova sem consultar sua solução. Altere entradas e peça revisão a outra pessoa. Guarde scripts, testes e relatório no seu próprio repositório. No Aurora registre hipótese, alteração, evidência e limitações de cada projeto.

Para limpar: encerre com Ctrl+C e remova apenas a pasta extraída da bancada quando não precisar mais das suas evidências. init recusa sobrescrever arquivos existentes.
