"""ちいかわ えいごランドを 1まいの HTML に まとめる: python3 src/build.py → index.html"""
import pathlib
here=pathlib.Path(__file__).resolve().parent
html=(here/'app.html').read_text()
html=html.replace('/*@DATA@*/',(here/'data.js').read_text()).replace('/*@CHARS@*/',(here/'chars.js').read_text())
(here.parent/'index.html').write_text(html)
print('index.html', len(html.encode()), 'bytes')
