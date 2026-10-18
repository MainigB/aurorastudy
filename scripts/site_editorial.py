"""Separate the book's reading sequence from actionable website exercises."""
import re

ANSWER_FOR = {'u297':'u296', 'u299':'u298', 'u301':'u300', 'u308':'u307', 'u319':'u318'}
GUIDES = {'u000','u001','u004','u005','u022','u053','u069','u071','u079','u100','u120','u152','u171','u185','u208','u230','u247','u262','u282','u292','u303','u305','u306','u312','u313','u315'}
EXTERNAL = {'u070','u295','u222'}

def adapt(lessons):
    by_id={l['id']:l for l in lessons}
    for l in lessons:
        l['bookTitle']=l['title']
        title=l['title']
        # A chapter introduction, definition or worked example isn't an assignment.
        l['learningMode']='activity' if re.match(r'Aplicação:|Q\d+:|Caso Aurora:|Simulado \d:|Simulado avançado|Simulado de |Oficina |Prova |Laboratório de mesa:|Corrigir uma resposta:|Projeto final:|Projeto integrador',title) else 'reading'
        if l['id'] in GUIDES: l['learningMode']='guide'
        if l['id'] in EXTERNAL: l['learningMode']='external-lab'
        if l['track']=='JOBS': l['learningMode']='reading'
        if l['id'] in ANSWER_FOR:
            l['learningMode']='answer'
            l['exerciseId']=ANSWER_FOR[l['id']]
            exercise=by_id[l['exerciseId']]
            exercise['answerId']=l['id']
            exercise['sections'].append(dict(title='Resposta comentada do exercício',body='\n\n'.join(s['title']+'\n\n'+s['body'] for s in l['sections']),role='solution'))
        l['siteNote']=('Este roteiro exige um ambiente externo de laboratório. O Aurora não executa estes procedimentos; use a leitura para preparar seu ambiente e registre evidências fora do site.' if l['learningMode']=='external-lab' else 'Material de consulta do livro. Não é uma missão, não exige resposta e não concede XP.')
        if l['learningMode']=='activity':
            l['format']='Entrevista simulada' if re.match(r'Q\d+:',title) else 'Projeto guiado' if title.startswith('Projeto') else 'Simulado' if title.startswith(('Simulado','Prova ')) else 'Caso prático'
            l['title']=re.sub(r'^(Q\d+: |Aplicação: )','',title)
            l['title']=l['title'][0].upper()+l['title'][1:]
            if l['format']=='Entrevista simulada':
                l['responseGuidance']='Ensaie uma resposta de entrevista. Use uma experiência real ou declare que está construindo uma resposta hipotética; não apresente a simulação como experiência profissional.'
            elif l['format']=='Projeto guiado':
                l['responseGuidance']='Registre aqui o plano e as evidências do projeto. Implementação, execução e medições exigem seu próprio ambiente de laboratório; o site não executa nem valida infraestrutura.'
            else:
                l['responseGuidance']='Use os dados do enunciado. Quando faltar uma informação, declare a hipótese ou a próxima verificação; não invente resultados.'

    overrides={
    'u002':dict(
        title='Confira a capacidade da API de pedidos',
        scenario='A equipe da Aurora precisa conferir a conta antes de uma campanha. A previsão é de 120 requisições por segundo durante 5 minutos, sem variação de carga. Cada requisição gera um evento de 2 kB. Neste exercício, 1 kB = 1.000 bytes e 1 MB = 1.000.000 bytes. Ignore replicação, índices e cabeçalhos. Uma pessoa estimou apenas 600 requisições e 1,2 MB para o período. Você deve revisar essa estimativa e explicar o erro antes de ela orientar a capacidade.',
        questions=['Quantas requisições e quantos MB de eventos serão produzidos nos 5 minutos? Mostre as unidades em cada etapa.', 'Por que a estimativa de 600 requisições parece plausível, mas está errada?', 'Esses números bastam para dimensionar um servidor real? Identifique dois dados que ainda faltam.'],
        solution='Converta primeiro 5 minutos em 300 segundos. O total é 120 requisições/s × 300 s = 36.000 requisições. Cada uma gera 2.000 bytes: 36.000 × 2.000 = 72.000.000 bytes, ou 72 MB decimais. A conta de 600 multiplicou uma taxa por segundo por um valor em minutos sem conversão; o resultado ficou 60 vezes menor. O volume calculado não dimensiona sozinho um servidor: faltam custo de processamento, distribuição de latência, concorrência e limites das dependências, entre outros. Replicação e índices foram excluídos apenas para isolar a conta do exercício.',
        rubric=['Converti minutos em segundos antes de usar a taxa.', 'Obtive 36.000 requisições e 72 MB com as unidades explícitas.', 'Expliquei o fator 60 de erro na conta original.', 'Separei volume de dados de capacidade efetiva do serviço.']),
    'u003':dict(
        title='Processo ativo significa pedido confirmado?',
        scenario='Às 14h, o processo da API da Aurora está ativo e /health responde 200. Clientes recebem “pedido aceito”, mas a confirmação depende de um worker e de gravação durável no banco. O worker está parado e existem 250 pedidos na fila, ainda sem confirmação. Uma pessoa propõe reiniciar a API e anunciar que o serviço está saudável porque /health funciona. Seu papel é avaliar o que os sinais realmente demonstram; não há evidência de que reiniciar a API ajude.',
        questions=['Diferencie processo, serviço e estado usando os componentes deste cenário.', 'O HTTP 200 e o processo ativo comprovam que o contrato de confirmação foi cumprido? Qual evidência falta?', 'Proponha a próxima investigação e uma mensagem de status coerente com o impacto conhecido.'],
        solution='O processo da API é uma instância em execução. O serviço é a capacidade de aceitar e confirmar pedidos, atravessando API, fila, worker e banco. O estado inclui pedidos pendentes e confirmações persistidas, que precisam sobreviver ao encerramento de processos. /health comprova somente o que esse endpoint verifica; HTTP 200 de aceitação não demonstra confirmação final. Investigue por que o worker parou, a idade dos pedidos e sua possibilidade de processamento seguro, preservando o estado. Reiniciar a API não corrige, por si só, o worker. Uma mensagem defensável é: “A aceitação responde, mas a confirmação está interrompida; há 250 pedidos pendentes e estamos investigando o worker”. Não prometa prazo sem evidência.',
        rubric=['Associei processo, serviço e estado aos componentes corretos.', 'Distingui aceitação HTTP de confirmação final.', 'Propus investigação do worker e dos pedidos sem inventar causa.', 'Comuniquei o impacto conhecido e a incerteza restante.']),
    'u322':dict(
        title='Monte um plano de estudo para uma vaga fictícia',
        scenario='Você vai se preparar para uma vaga fictícia de plataforma na Aurora. O anúncio deste exercício pede diagnóstico Linux, recuperação de PostgreSQL e comunicação de incidentes. Você já consegue investigar processos, nunca ensaiou uma restauração e costuma apresentar hipóteses como certezas. Há seis sessões de uma hora disponíveis. O objetivo é produzir um plano realista com evidências, não copiar o ranking histórico de empresas do livro.',
        questions=['Distribua as seis sessões entre as três competências e justifique sua prioridade.', 'Defina uma entrega verificável para cada competência, incluindo como distinguir estudo de execução real.', 'O que você precisaria confirmar em um anúncio real antes de usar este plano?'],
        solution='Priorize as lacunas demonstradas, não apenas a quantidade de menções em anúncios históricos. Uma distribuição defensável seria uma sessão de diagnóstico Linux para validar a base, três para preparar e ensaiar recuperação em laboratório e duas para praticar comunicação com fatos, hipóteses e próxima atualização. Outras distribuições são válidas se justificadas. As entregas podem ser um diagnóstico explicado, um registro de restauração com validação dos dados e um comunicado revisado. Se o ambiente não estiver disponível, registre planejamento e leitura como tais, sem alegar execução. Em uma vaga real, confirme requisitos, responsabilidades, nível e data da fonte; a amostra do livro não comprova oportunidades atuais.',
        rubric=['Relacionei a prioridade às lacunas do cenário.', 'Respeitei o limite de seis horas e explicitei escolhas.', 'Defini evidências verificáveis sem alegar experiência inexistente.', 'Separei o anúncio fictício de pesquisa histórica e de vagas atuais.'])
    }
    for id,o in overrides.items():
        l=by_id[id]
        l.update(title=o['title'],learningMode='activity',question=o['questions'][0],questions=o['questions'],scenario=o['scenario'],rubric=o['rubric'])
        l['format']='Caso prático'
        l['responseGuidance']='Resolva com os dados fornecidos e mostre seu raciocínio. Declare o que ainda precisaria verificar antes de aplicar a decisão fora do exercício.'
        # Preserve the book text as study; the website exercise has its own data.
        l['sections']=[dict(s,role='study') for s in l['sections']]+[
            dict(title='Sua tarefa na Aurora',body=o['scenario'],role='practice'),
            dict(title='Análise comentada do exercício',body=o['solution'],role='solution')]
        l['reference']=o['solution']
