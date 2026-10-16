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
 lessons.append(dict(id=f'u{i:03}',track=u['code'],title=re.sub(r'^G: ','',u['title']),page=toc.get(f'u{i:03}'),question=question,scenario=(case or ('No laboratório fictício Aurora, você precisa orientar uma decisão sobre este assunto. Explique seu raciocínio, as evidências necessárias e uma limitação.'))[:1800],reference=(ref if len(ref.strip())>20 else body)[:2400],vocabulary=d.get('vocabulary',[]),kind='reflection'))
(root/'site/public/curriculum.json').write_text(json.dumps(dict(tracks=tracks,lessons=lessons),ensure_ascii=False),encoding='utf-8')
print(f'{len(tracks)} trilhas, {len(lessons)} tópicos exportados.')
