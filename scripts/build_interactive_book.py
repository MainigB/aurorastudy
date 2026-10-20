import json,re
from pathlib import Path
root=Path(__file__).resolve().parents[1]
units=json.loads((root.parent/'book4/units_snapshot.json').read_text(encoding='utf-8'))
lessons={l['id']:l for l in json.loads((root/'public/curriculum.json').read_text(encoding='utf-8'))['lessons']}
pages=[]
for i,u in enumerate(units):
    key=f'u{i:03}';l=lessons[key]
    # Keep the manuscript verbatim; split only at its own section headings.
    chunks=re.split(r'(?=^### )',u['body'],flags=re.M)
    sections=[]
    for chunk in chunks:
        if not chunk.strip():continue
        title=chunk.split('\n',1)[0] if chunk.startswith('### ') else ''
        answer=bool(re.search(r'resposta|solução|gabarito|rubrica|critério',title,re.I))
        sections.append({'text':chunk,'answer':answer})
    pages.append(dict(id=key,track=u['code'],title=u['title'],page=l['page'],readingEnd=l['readingEnd'],activity=l['learningMode']=='activity',sections=sections))
(root/'public/interactive-book.json').write_text(json.dumps(pages,ensure_ascii=False),encoding='utf-8')
print(f'{len(pages)} trechos preservados na ordem do manuscrito.')
