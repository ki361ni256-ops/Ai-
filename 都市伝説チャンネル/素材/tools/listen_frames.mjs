// 聞かせる型の画面（背景イラスト＋章タイトル＋字幕）を書き出す：node listen_frames.mjs jobs.json
import fs from 'fs';
import { pathToFileURL } from 'url';
import { render } from './lib.mjs';
import { phrases } from './phrases.mjs';
// 字幕の折り返しは文節の切れ目だけで行う（語の途中・かっこの直後の助詞の前では改行しない）
const wrapJa = (s) => phrases(s).map(esc).join('<wbr>');
const { w, h, items } = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const V = h > w;
const cache = {};
const dataUrl = (p) => cache[p] ??= `data:image/png;base64,${fs.readFileSync(p).toString('base64')}`;
const jobs = items.map((it) => ({ out: it.out, w, h, html: `
<div style="position:relative;width:${w}px;height:${h}px;background:#0A0F16;overflow:hidden">
  ${it.bg ? `<img src="${dataUrl(it.bg)}" style="position:absolute;inset:0;width:100%;height:100%;object-fit:cover;filter:brightness(.7) saturate(.9)">` : ''}
  <div style="position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.35),rgba(0,0,0,0) 30%,rgba(0,0,0,0) 55%,rgba(0,0,0,.75))"></div>
  ${it.chapter ? `<div style="position:absolute;left:${V ? 60 : 70}px;top:${V ? 230 : 56}px;right:${V ? 60 : 400}px;font-size:${V ? 34 : 30}px;font-weight:900;color:#E8A84A;letter-spacing:.06em;text-shadow:0 2px 8px #000">${esc(it.chapter)}</div>` : ''}
  ${it.title ? `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 120px"><div style="font-family:NSerif;font-weight:700;font-size:${V ? 84 : 96}px;line-height:1.3;color:#F2F2F2;text-shadow:0 4px 24px #000">${esc(it.title).replace(/\n/g, '<br>')}</div></div>` : ''}
  ${it.text ? `<div style="position:absolute;left:0;right:0;bottom:${V ? 520 : 90}px;display:flex;justify-content:center;padding-left:${V ? 70 : 160}px;padding-right:${V ? 150 : 160}px"><div style="font-size:${(V ? 54 : 50) * (it.text.length > 46 ? 0.88 : 1)}px;font-weight:900;line-height:1.5;color:#FFFFFF;text-align:center;text-wrap:balance;word-break:keep-all;overflow-wrap:anywhere;line-break:strict;text-shadow:0 0 6px #000,0 0 6px #000,0 3px 12px rgba(0,0,0,.9)">${wrapJa(it.text)}</div></div>` : ''}
  ${it.badge ? `<div style="position:absolute;right:${V ? 60 : 70}px;top:${V ? 230 : 56}px;font-size:${V ? 30 : 26}px;color:rgba(242,242,242,.75)">${esc(it.badge)}</div>` : ''}
</div>` }));
await render(jobs);
