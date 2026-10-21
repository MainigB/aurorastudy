"""Publish the complete final PDF and a page-for-page accessible reading edition."""
import hashlib, json, shutil
from pathlib import Path
import pdfplumber
from pypdf import PdfReader

root = Path(__file__).resolve().parents[1]
source = root.parent / 'output/pdf/SRE_Senior_Livro_4_Formacao_Aprofundada.pdf'
target = root / 'public/book'
target.mkdir(exist_ok=True)
reader = PdfReader(source)
outline = []
def visit(items, level=0):
    for item in items:
        if isinstance(item, list):
            visit(item, level + 1)
        else:
            outline.append(dict(title=str(item.title), page=reader.get_destination_page_number(item)+1, level=level))
visit(reader.outline)
pages = []
with pdfplumber.open(source) as doc:
    for number, page in enumerate(doc.pages, 1):
        blocks = []
        previous = None
        # Remove running header/footer only. All content in the printable body remains.
        lines = [l for l in page.extract_text_lines() if l['top'] > 35 and l['bottom'] < page.height - 28]
        for line in lines:
            chars = line['chars']
            mono = sum('Consol' in c['fontname'] or 'Courier' in c['fontname'] for c in chars) > len(chars)/2
            size = max(c['size'] for c in chars)
            heading = size >= 11.4 and all('Bold' in c['fontname'] for c in chars if c['text'].strip())
            kind = 'code' if mono else 'heading' if heading else 'paragraph'
            gap = line['top'] - previous['bottom'] if previous else 999
            if blocks and blocks[-1]['kind'] == kind and gap < 7:
                blocks[-1]['text'] += ('\n' if mono else ' ') + line['text']
            else:
                blocks.append(dict(kind=kind, text=line['text']))
            if mono:
                blocks[-1].setdefault('_lines', []).append(line)
            previous = line
        for block in blocks:
            if block['kind'] == 'code':
                code_lines = block.pop('_lines')
                left = min(l['x0'] for l in code_lines)
                rendered = []
                for line in code_lines:
                    chars = sorted(line['chars'], key=lambda c:c['x0'])
                    width = next((c['width'] for c in chars if c['width'] > 0), 5.4)
                    cursor = left
                    text = ''
                    for char in chars:
                        text += ' ' * max(0, round((char['x0'] - cursor) / width)) + char['text']
                        cursor = char['x1']
                    rendered.append(text.rstrip())
                block['text'] = '\n'.join(rendered)
        assert blocks, f'Empty page: {number}'
        links = []
        for annotation in reader.pages[number-1].get('/Annots', []):
            item = annotation.get_object()
            uri = item.get('/A', {}).get('/URI')
            if uri and str(uri).startswith(('https://','http://')) and str(uri) not in links:
                links.append(str(uri))
        pages.append(dict(number=number, blocks=blocks, links=links))
        if number % 100 == 0: print(f'{number} páginas extraídas', flush=True)
        page.close()
result = dict(title='SRE Sênior · Livro 4', pageCount=len(pages), sha256=hashlib.sha256(source.read_bytes()).hexdigest(), outline=outline, pages=pages)
(target/'complete.json').write_text(json.dumps(result, ensure_ascii=False), encoding='utf-8')
shutil.copyfile(source, target/'livro-4-completo.pdf')
print(f'Edição integral publicada: {len(pages)} páginas; {len(outline)} entradas no índice.')
