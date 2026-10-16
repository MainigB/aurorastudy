import json,re
from pathlib import Path
root=Path(__file__).resolve().parent.parent
units=json.loads((root/'book4/units_snapshot.json').read_text(encoding='utf-8'))
did=json.loads((root/'book4/didactic_manifest.json').read_text(encoding='utf-8'))
toc={x['key']:x['page'] for x in json.loads((root/'book4/toc.json').read_text(encoding='utf-8'))}
names={'SYS':'Linux e redes','AUT':'Programação e automação','OBS':'Observabilidade','SLO':'SLOs e error budget','RES':'Sistemas distribuídos','CLOUD':'Cloud e infraestrutura','IAC':'Infraestrutura como código','CONT':'Containers e Kubernetes','DATA':'Bancos, cache e mensageria','CD':'Entrega contínua','SEC':'Segurança e identidade','INC':'Incidentes e operação','AI':'IA para confiabilidade','LID':'Liderança e produto','PRE':'Aprender a aprender','PRA':'Entrevistas e projeto final','JOBS':'Pesquisa de vagas'}
tracks=[dict(id=k,name=v) for k,v in names.items()]
lessons=[]
for i,u in enumerate(units):
 d=did.get(str(i),{});body=u['body'];sections=re.split(r'\n### ',body)
 case=next((s.split('\n',1)[-1] for s in sections[1:] if re.search(r'caso|cenário|enunciado|exemplo|problema|exercício',s.split('\n')[0],re.I)),None)
 question=d.get('question',f"Como você usaria '{u['title']}' para orientar seu plano de desenvolvimento? Diferencie evidências históricas de informações atuais.")
 ref=next((s.split('\n',1)[-1] for s in sections[1:] if re.search(r'resposta|solução|interpretação',s.split('\n')[0],re.I)),body.split('\n\n###')[0])
 # Preserve every paragraph, including code and worked answers. The UI separates
 # study, practice and the answer guide instead of cutting the manuscript.
 blocks=[]
 if sections[0].strip():
  # Some units begin directly with a heading.
  first=sections[0].strip()
  if first.startswith('### '):
   heading,_,text=first[4:].partition('\n')
   blocks.append(dict(title=heading,body=text.strip()))
  else: blocks.append(dict(title='Fundamentos e contexto',body=first))
 for section in sections[1:]:
  heading,_,text=section.partition('\n')
  blocks.append(dict(title=heading,body=text.strip()))
 for block in blocks:
  h=block['title'].lower()
  block['role']='solution' if re.search(r'resposta|solução|interpretação|resolvid|erro a evitar|sinal de senioridade|aprofundamento do entrevistador|rubrica|critério',h) else 'practice' if re.search(r'exercício|pergunta|enunciado|situação|cenário|treino orientado|entrega|defesa|experimento|rodada',h) else 'study'
 practice=[b for b in blocks if b['role']=='practice']
 solution=[b for b in blocks if b['role']=='solution']
 scenario='\n\n'.join(b['body'] for b in practice if re.search(r'situação|cenário|enunciado',b['title'],re.I))
 if not scenario: scenario=next((b['body'] for b in practice),blocks[0]['body'])
 followup=(f'Na análise histórica de “{u["title"]}”, separe o que foi observado daquilo que foi inferido. Que informação precisaria ser verificada antes de aplicar a conclusão hoje?' if u['code']=='JOBS' else f'Aplique “{u["title"]}” ao caso apresentado: descreva a decisão, o mecanismo que a sustenta e a evidência que faria você mudar de hipótese.')
 lessons.append(dict(id=f'u{i:03}',track=u['code'],title=re.sub(r'^G: ','',u['title']),page=toc.get(f'u{i:03}'),question=question,scenario=scenario,reference='\n\n'.join(b['title']+'\n\n'+b['body'] for b in solution) or body,vocabulary=d.get('vocabulary',[]),kind='reflection',sections=blocks,example=d.get('example'),prerequisite=f'u{d["prerequisite"]:03}' if isinstance(d.get('prerequisite'),int) else None,questions=[question,followup,'Quais hipóteses, limites ou condições do caso precisam continuar verdadeiros? Explique uma alternativa e o que mudaria sua escolha.'],rubric=['Respondi à pergunta-guia com um mecanismo explicado em minhas palavras.','Relacionei minha decisão aos dados, comandos, cálculos ou exemplos específicos deste tópico.','Expliquei como verificaria o resultado e o que enfraqueceria minha hipótese.','Declarei uma limitação e comparei uma alternativa.'],minutes=max(12,round(len(body.split())/150)+10)))
cases=json.loads((root/'site/scripts/sre_cases.json').read_text(encoding='utf-8'))
for lesson in lessons:
 extra_questions=re.findall(r'\*\*([^*]+\?)\*\*','\n'.join(s['body'] for s in lesson['sections']))
 lesson['questions']=list(dict.fromkeys([lesson['question'],*extra_questions,*lesson['questions'][1:]]))
 if lesson['id'] in cases:
  case=cases[lesson['id']]
  lesson['sections'].append(dict(title='Oficina de decisão: caso adicional',body=case['scenario'],role='practice'))
  lesson['sections'].append(dict(title='Oficina de decisão: análise comentada',body=case['solution'],role='solution'))
  lesson['questions']=case['questions']
  lesson['minutes']+=10
(root/'site/public/curriculum.json').write_text(json.dumps(dict(tracks=tracks,lessons=lessons),ensure_ascii=False),encoding='utf-8')
print(f'{len(tracks)} trilhas, {len(lessons)} tópicos exportados.')
