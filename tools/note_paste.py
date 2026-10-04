#!/usr/bin/env python3
"""note記事の .md から、note に貼り付けるためのページを作る（Noteリポジトリの tools/note_paste.py を1ファイル記事用にしたもの）。

使い方:
    python3 tools/note_paste.py note記事/2026-10-04_食べこぼし.md

- タイトルは最初の「# 」行。本文はその下すべて（<!-- --> のコメントは消す）
- 「## 」は note の大見出し、「### 」は小見出しになる → note の目次にそのまま反映される
- できたページは note記事/貼り付け用/<同じ名前>.html。Artifact で公開すると、スマホから「書式つきでコピー」できる
- 見た目は tools/note_paste_template.html
"""
import html, re, sys
from pathlib import Path
import markdown

TOOLS = Path(__file__).resolve().parent

def prep(s):
    s = re.sub(r'<!--.*?-->\n?', '', s, flags=re.S)
    s = re.sub(r'^#### ', '### ', s, flags=re.M)
    out = []
    for l in s.split('\n'):
        # 箇条書きの直前に空行を入れる（入れないと markdown が箇条書きとして扱わない）
        if re.match(r'^(\s*[-*] |\d+\. )', l) and out and out[-1].strip() and not re.match(r'^(\s*[-*] |\d+\. )', out[-1]):
            out.append('')
        out.append(l)
    return re.sub(r'\n{3,}', '\n\n', '\n'.join(out)).strip() + '\n'

def main(path):
    src = Path(path)
    text = src.read_text(encoding='utf-8')
    m = re.search(r'^# (.*)$', text, flags=re.M)
    title = m.group(1).strip()
    body = prep(text[m.end():])
    html_body = markdown.markdown(body, extensions=['nl2br', 'sane_lists'])
    guide = ('全文無料の記事です。タイトルと本文を1回ずつコピーして貼ってください。'
             '本文は「書式つきでコピー」で、見出し（大見出し・小見出し）がついたまま貼れます。'
             '目次は、貼ったあとに note のメニューから「目次」を入れると、見出しから自動で作られます。')
    t = (TOOLS / 'note_paste_template.html').read_text(encoding='utf-8')
    page = (t.replace('{{PAGE_TITLE}}', html.escape(title[:20]) + ' 貼り付け用')
             .replace('{{GUIDE}}', guide)
             .replace('{{TITLE}}', html.escape(title))
             .replace('{{FREE}}', html_body))
    outdir = src.parent / '貼り付け用'
    outdir.mkdir(exist_ok=True)
    out = outdir / (src.stem + '.html')
    out.write_text(page, encoding='utf-8')
    n = len(re.sub(r'<[^>]+>|\s', '', html_body))
    print(f'{out}  タイトル: {title}  本文: 約{n:,}字')

if __name__ == '__main__':
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(sys.argv[1])
