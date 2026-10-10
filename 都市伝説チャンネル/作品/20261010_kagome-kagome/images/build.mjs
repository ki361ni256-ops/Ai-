// かごめかごめ：動画用の画像をすべて書き出す（node build.mjs）
// 04_演出.md 2章（長尺）・4章（ショート）のカット表を上から順に L001〜L106・S01〜S08 と番号付けしたものに対応。
// サムネは演出 8章の案1〜3。生成AIは使わない自作素材（HTML/SVG）。共通ツール（素材/tools）は import だけして変更しない。
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from '../../../素材/tools/lib.mjs';
import { frame, abs } from '../../../素材/tools/parts.mjs';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const jobs = [];
const L = (id, html) => jobs.push({ out: path.join(OUT, 'long', `${id}.png`), w: 1920, h: 1080, html });
const S = (id, html) => jobs.push({ out: path.join(OUT, 'short', `${id}.png`), w: 1080, h: 1920, html });
const T = (id, html) => jobs.push({ out: path.join(OUT, 'thumb', `${id}.png`), w: 1280, h: 720, html });
const B = (id, html, w = 1920, h = 1080) => jobs.push({ out: path.join(OUT, 'bg', `${id}.png`), w, h, html });

// ---------- 色（04_演出.md 1-3・1-4） ----------
const K = {
  sumi: '#141414', kinari: '#EEE5D1', kinariD: '#E3D8C0', kinariL: '#F7F2E6', card: '#F1E9DA', ink: '#2B2723',
  kaki: '#C8743A', ai: '#2F4A6D', ki: '#E9C46A', hai: '#7A7A7A', line: '#E9DFC8', wood: '#B98650', woodD: '#8C6034', woodL: '#D3A570',
  silh: '#2B2330', glow: 'rgba(255,214,140,.95)',
};
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const br = (s) => esc(s).replace(/\n/g, '<br>');

// 和紙の繊維（明るい背景に薄く重ねる）
const washi = (op = 0.6) => `<svg style="position:absolute;inset:0;width:100%;height:100%;opacity:${op}" xmlns="http://www.w3.org/2000/svg"><filter id="wf" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.012 0.6" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 .42  0 0 0 0 .35  0 0 0 0 .25  0 0 0 .5 -.18"/></filter><rect width="100%" height="100%" filter="url(#wf)"/></svg>`;
// 画面。dark=true は墨黒
const F = (body, { bg = K.kinari, dark = false, w = 1920, h = 1080 } = {}) =>
  frame({ w, h, bg: dark ? K.sumi : bg, grainOp: dark ? 0.1 : 0.05, body: (dark ? '' : washi()) + body });

// ---------- テロップ（1-1・1-2） ----------
// kind: plain / setsu（柿色の下線）/ ai（藍の下線）/ suisoku（灰色ラベル「推測」）/ mikaku（黄色付せん「未確認」）/ q（問いかけ・大）
function tp(text, kind = 'plain', { dark = false, size = 50, bottom = 165, top = null, w = 1920, html = false, maxW = null } = {}) {
  const t = html ? text : br(text);
  const col = dark ? '#F4EFE4' : K.ink;
  const shadow = dark ? 'text-shadow:0 0 4px #000,0 0 4px #000,0 2px 8px rgba(0,0,0,.8);' : '';
  const back = dark ? '' : 'background:rgba(247,242,230,.9);border-radius:10px;box-shadow:0 2px 10px rgba(60,40,20,.08);';
  let inner = `<span style="${kind === 'setsu' ? `border-bottom:6px solid ${K.kaki};` : kind === 'ai' ? `border-bottom:6px solid ${K.ai};` : ''}padding-bottom:2px">${t}</span>`;
  if (kind === 'suisoku') inner = `<span style="display:inline-block;vertical-align:middle;font-size:${size * 0.5}px;background:${K.hai};color:#fff;padding:3px 12px;border-radius:4px;margin-right:16px;position:relative;top:-4px">推測</span>` + inner;
  const sticky = kind === 'mikaku' ? `<span style="position:absolute;right:-26px;top:-30px;background:${K.ki};color:#111;font-size:${size * 0.5}px;padding:4px 14px;transform:rotate(4deg);box-shadow:0 3px 8px rgba(0,0,0,.25)">未確認</span>` : '';
  const fs = kind === 'q' ? size * 1.5 : size;
  const pos = top != null ? `top:${top}px;` : `bottom:${bottom}px;`;
  return abs(`left:0;right:0;${pos}display:flex;justify-content:center;z-index:20`,
    `<div style="position:relative;max-width:${maxW ?? w - 200}px;text-align:center;font-weight:900;font-size:${fs}px;line-height:1.45;color:${col};${shadow}${back}padding:10px 30px">${inner}${sticky}</div>`);
}
// 出典表示（年表バーのすぐ上の左端）
const srcL = (text, { dark = false } = {}) => abs(`left:60px;bottom:128px;font-size:24px;font-weight:500;color:${dark ? 'rgba(242,236,224,.7)' : '#6B6358'};z-index:21`, esc(text));
// 「イメージ」表記（年表バーと重ならないよう左上）
const IMG = (t = 'イメージ（イラスト）', { dark = true, right = false } = {}) => abs(`${right ? 'right:40px' : 'left:40px'};top:30px;font-size:26px;font-weight:900;color:${dark ? '#fff' : K.ink};background:${dark ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.75)'};padding:6px 16px;border-radius:6px;z-index:22`, esc(t));

// ---------- 部品：カード・札・付せん・小札 ----------
const kosatsu = (f, glow = false) => `<span style="position:absolute;right:${-f * 0.3}px;bottom:${-f * 0.3}px;background:#7A7A7A;color:#fff;font-weight:900;font-size:${Math.max(11, f * 0.5)}px;line-height:1;padding:${Math.max(3, f * 0.16)}px ${Math.max(4, f * 0.25)}px;border-radius:3px;white-space:nowrap;${glow ? 'box-shadow:0 0 10px 4px rgba(255,255,255,.95),0 0 24px 8px rgba(255,236,190,.8);' : ''}">本文未確認</span>`;
const hiCss = 'box-shadow:0 0 0 3px rgba(255,214,140,.9),0 0 26px 10px rgba(255,214,140,.75);';
// 記録カード（生成り地・墨文字・細い墨枠）
function rec(text, f = 40, { mi = false, hi = false, dim = false, serif = false, glowMi = false, dashed = false, sub = '', align = 'center', pad = null } = {}) {
  const p0 = pad ?? `${f * 0.35}px ${f * 0.6}px`; const p = mi ? `${p0};padding-bottom:${f * 0.55}px` : p0;
  return `<span style="position:relative;display:inline-block;background:${K.card};color:${K.ink};border:${Math.max(1.5, f * 0.06)}px ${dashed ? 'dashed' : 'solid'} ${K.ink};padding:${p};font-family:${serif ? 'NSerif' : 'NSJ'};font-weight:${serif ? 700 : 900};font-size:${f}px;line-height:1.35;white-space:nowrap;text-align:${align};opacity:${dim ? 0.35 : 1};${hi ? hiCss : 'box-shadow:0 2px 6px rgba(40,30,20,.12);'}">${br(text)}${sub ? `<div style="font-size:${f * 0.55}px;font-weight:500;margin-top:${f * 0.2}px;color:#5B544A">${br(sub)}</div>` : ''}${mi ? kosatsu(f, glowMi) : ''}</span>`;
}
// 説の札（柿色地・白文字の荷札形）。color で藍（学説）にも使う
function fuda(text, f = 40, { color = K.kaki, hi = false, rot = 0, glowMi = false, mi = false, dim = false } = {}) {
  const n = f * 0.55;
  return `<span style="position:relative;display:inline-block;transform:rotate(${rot}deg);opacity:${dim ? 0.35 : 1};${hi ? `filter:drop-shadow(0 0 14px rgba(255,214,140,.95))` : 'filter:drop-shadow(0 2px 3px rgba(40,20,10,.25))'}"><span style="display:inline-block;background:${color};color:#fff;font-weight:900;font-size:${f}px;line-height:1.3;padding:${f * 0.28}px ${f * 0.55}px ${f * 0.28}px ${n + f * 0.45}px;white-space:nowrap;clip-path:polygon(${n}px 0,100% 0,100% 100%,${n}px 100%,0 75%,0 25%)">${br(text)}</span><span style="position:absolute;left:${n * 0.75}px;top:50%;width:${f * 0.26}px;height:${f * 0.26}px;margin-top:${-f * 0.13}px;border-radius:50%;background:${K.kinari};box-shadow:inset 0 0 0 2px rgba(0,0,0,.15)"></span>${mi ? kosatsu(f, glowMi).replace(/right:[^;]+;bottom:[^;]+;/, `right:${-f * 0.3}px;top:${-f * 0.5}px;`) : ''}</span>`;
}
const fusen = (text, f = 36, rot = -3) => `<span style="display:inline-block;background:${K.ki};color:#111;font-weight:900;font-size:${f}px;padding:${f * 0.25}px ${f * 0.5}px;transform:rotate(${rot}deg);box-shadow:0 4px 10px rgba(0,0,0,.25);white-space:nowrap">${esc(text)}</span>`;
// 作者欄（記録カードと同じ見た目・空白）
const authorCard = (f = 40, { hi = false, blink = false } = {}) => `<span style="position:relative;display:inline-block;background:${K.card};color:${K.ink};border:${Math.max(1.5, f * 0.06)}px solid ${K.ink};padding:${f * 0.35}px ${f * 0.6}px;font-weight:900;font-size:${f}px;line-height:1.35;white-space:nowrap;${hi ? hiCss : 'box-shadow:0 2px 6px rgba(40,30,20,.12);'}${blink ? `outline:${f * 0.12}px solid ${K.ink};outline-offset:${f * 0.18}px;` : ''}">作者：<span style="display:inline-block;width:${f * 3.2}px;border-bottom:${Math.max(1, f * 0.05)}px dotted rgba(43,39,35,.45)">&nbsp;</span></span>`;
// 言葉カード（第1章）
const word = (t, f = 54, o = {}) => rec(t, f, { serif: true, ...o });

// ---------- 年表バー（画面下）と「初出不明」の箱 ----------
// 項目ごとの登場カット番号（L 番号）と、compact（画面下 11%）/ big（第5章：画面下 40%）での置き場所
const G = {
  c: { x0: 80, x1: 1500, y: 1024, f: 19, row: 40, box: { x: 1590, y: 905, s: 0.97 } },
  b: { x0: 70, x1: 1500, y: 975, f: 32, row: 88, box: { x: 1585, y: 700, s: 1.0 } },
};
const ITEMS = [
  // key, from, type, compact{x,tier,label}, big{x,tier,label}
  { k: 'author', from: 29, type: 'author', c: { x: 80, t: 1 }, b: { x: 70, t: 1 } },
  { k: 'edo', from: 29, type: 'rec', mi: true, c: { x: 210, t: 1, l: '江戸時代後期' }, b: { x: 120, t: 2, l: '江戸時代後期' } },
  { k: 'meiji', from: 37, type: 'rec', mi: true, c: { x: 430, t: 1, l: '明治期：幻燈原板' }, b: { x: 330, t: 1, l: '明治期：幻燈原板' } },
  { k: 'y1933', from: 41, type: 'rec', mi: true, c: { x: 640, t: 1, l: '1933 発表会' }, b: { x: 560, t: 2, l: '1933年7月 発表会' } },
  { k: 'y1941', from: 44, type: 'rec', mi: true, c: { x: 800, t: 1, l: '1941 こども風土記' }, b: { x: 640, t: 1, l: '1941年 こども風土記' } },
  { k: 'yamanaka', from: 89, type: 'float', mi: true, bigOnly: true, b: { x: 330, t: 3, l: '山中直治の採譜（時期は示さない）' } },
  { k: 's1998', from: 53, type: 'kaki', c: { x: 1060, t: 1, l: '1998年' }, b: { x: 1010, t: 1, l: '1998年' } },
  { k: 's2007', from: 62, type: 'kaki', c: { x: 1166, t: 1, l: '2007年' }, b: { x: 1180, t: 1, l: '2007年' } },
  { k: 's1999', from: 56, type: 'kaki', mi: true, c: { x: 1110, t: 2, l: '1999年3月' }, b: { x: 1070, t: 2, l: '1999年3月' } },
  { k: 'lib2008', from: 80, type: 'recB', mi: true, c: { x: 1120, l: '2008 安城市' }, b: { x: 880, l: '2008年 安城市' } },
  { k: 'lib2012', from: 80, type: 'recB', mi: true, c: { x: 1252, l: '2012 香川' }, b: { x: 1099, l: '2012年 香川' } },
  { k: 'lib2022', from: 80, type: 'recB', mi: true, c: { x: 1366, l: '2022 足立区' }, b: { x: 1292, l: '2022年 足立区' } },
  { k: 'ai', from: 86, type: 'ai', c: { x: 560, l: '神寄せ・地蔵遊び起源（学説）' }, b: { x: 400, l: '神寄せ・地蔵遊び起源（学説）' } },
];
const BOXTAGS = [['yujo', 68, '遊女・身売り説'], ['shujin', 70, '囚人説'], ['maizo', 72, '埋蔵金説'], ['noroi', 74, '呪い・放送禁止の噂'], ['gyaku', 75, '逆再生の噂']];

// 木箱（SVG）。tags はふたの隙間から出ている札の数、labels=true で札に文字
function box({ x, y, s = 1, n = 0, labels = null, lift = false, overflow = false, dark = false, z = 9, H: FH = 1080, lf = null, lw = 0 }) {
  const W = 300 * s, H = 170 * s;
  const tags = [];
  const names = labels || [];
  const cnt = overflow ? 9 : n;
  for (let i = 0; i < cnt; i++) {
    const tx = 40 + (i * 47) % 220, rot = ((i * 37) % 30) - 15, up = lift ? 95 + (i % 3) * 22 : 52 + (i % 3) * 12;
    tags.push(`<g transform="translate(${tx} ${42 - up}) rotate(${rot})"><path d="M8 0 H52 V30 H8 L0 22 V8 Z" fill="${K.kaki}" stroke="rgba(0,0,0,.25)" stroke-width="1"/><circle cx="7" cy="15" r="3" fill="${K.kinari}"/></g>`);
  }
  const svg = `<svg width="${W}" height="${H + 60 * s}" viewBox="0 -60 300 230" style="overflow:visible">
    <defs><linearGradient id="wd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${K.woodL}"/><stop offset="1" stop-color="${K.wood}"/></linearGradient></defs>
    <ellipse cx="150" cy="168" rx="150" ry="10" fill="rgba(40,25,10,.22)"/>
    <path d="M18 36 L282 36 L268 6 L32 6 Z" fill="${K.woodD}"/>
    ${tags.join('')}
    <rect x="10" y="40" width="280" height="125" rx="4" fill="url(#wd)" stroke="${K.woodD}" stroke-width="3"/>
    ${[70, 100, 130].map(yy => `<path d="M14 ${yy} Q150 ${yy + 6} 286 ${yy - 2}" stroke="${K.woodD}" stroke-opacity=".35" stroke-width="2" fill="none"/>`).join('')}
    <g transform="rotate(-7 150 30)"><rect x="0" y="12" width="300" height="34" rx="4" fill="${K.woodL}" stroke="${K.woodD}" stroke-width="3"/>
    <text x="150" y="38" text-anchor="middle" font-family="NSerif" font-weight="700" font-size="25" fill="${K.ink}" letter-spacing="6">初出不明</text></g>
    ${overflow ? [[30, 0, -20], [90, -14, 12], [160, -8, -6], [220, -18, 22], [250, 2, -30], [-10, 120, -70], [292, 110, 60], [60, -40, 35], [190, -44, -15]].map(([tx, ty, r]) => `<g transform="translate(${tx} ${ty}) rotate(${r})"><path d="M8 0 H52 V30 H8 L0 22 V8 Z" fill="${K.kaki}" stroke="rgba(0,0,0,.25)" stroke-width="1"/><circle cx="7" cy="15" r="3" fill="${K.kinari}"/></g>`).join('') : ''}
  </svg>`;
  let lab = '';
  if (names.length) lab = abs(`left:${x - 60 * s - lw / 2}px;bottom:${FH - y + (lift ? 110 : 50) * s}px;width:${W + 120 * s + lw}px;display:flex;flex-wrap:wrap-reverse;justify-content:center;gap:${12 * s}px;z-index:${z + 1}`, names.map((t, i) => fuda(t, lf ?? 24 * s, { rot: (i % 2 ? 3 : -3) })).join(''));
  return abs(`left:${x}px;top:${y - 60 * s}px;z-index:${z}`, svg) + lab;
}

// 年表バー本体
function nenpyo(o = {}) {
  const { at = 0, mode = 'c', dark = false, hi = [], blurLeft = false, q = false, bracket = false, mihakken = false, blanks = false, margin = false,
    glowMi = false, hide = [], len = 1, showBox = true, boxLabels = null, boxLift = false, boxOverflow = false, tickHi = null, dy = 0, opacity = 1, onlyLeft = false, glow1999 = false } = o;
  const g = G[mode], f = g.f, Y = g.y + dy, lc = dark ? K.line : K.ink;
  let h = '';
  const x1 = g.x0 + (g.x1 - g.x0) * len;
  h += abs(`left:${g.x0}px;top:${Y - 2}px;width:${x1 - g.x0}px;height:${mode === 'b' ? 5 : 4}px;background:${lc};z-index:5`, '');
  if (margin) h += abs(`left:${g.x1}px;top:${Y - 2}px;width:${mode === 'b' ? 70 : 70}px;border-top:${mode === 'b' ? 5 : 4}px dashed ${lc};opacity:.6;z-index:5`, '') +
    abs(`left:${g.x1 + 8}px;top:${Y - (mode === 'b' ? 200 : 74)}px;width:${mode === 'b' ? 60 : 64}px;height:${mode === 'b' ? 180 : 62}px;border:2px dashed ${dark ? 'rgba(233,223,200,.6)' : 'rgba(43,39,35,.45)'};border-radius:6px;z-index:5`, '');
  const tickF = mode === 'b' ? 24 : 18;
  const tick = (x, label, hiT) => abs(`left:${x}px;top:${Y - 8}px;width:3px;height:16px;background:${lc};z-index:5`, '') + (label ? abs(`left:${x - 20}px;top:${Y + 8}px;font-size:${tickF}px;font-weight:900;color:${hiT ? K.kaki : lc};z-index:6;${hiT ? 'text-shadow:0 0 12px rgba(200,116,58,.6)' : ''}`, label) : '');
  if (at >= 12 && len === 1) {
    h += tick(mode === 'b' ? 130 : 220, '江戸', tickHi === 'edo');
    h += abs(`left:${g.x1 + 10}px;top:${Y - tickF * 0.7}px;font-size:${tickF}px;font-weight:900;color:${lc};z-index:6`, '現在');
    if (at >= 35 && !onlyLeft) h += tick(mode === 'b' ? 340 : 440, '明治', tickHi === 'meiji');
    if (at >= 38 && !onlyLeft) h += tick(mode === 'b' ? 520 : 600, '', false);
  }
  const rowB = (t) => 1080 - Y + (mode === 'b' ? 10 : 6) + (t - 1) * g.row;
  const show = (it) => it.from <= at && !hide.includes(it.k) && (!it.bigOnly || mode === 'b') && (!onlyLeft || ['author', 'edo'].includes(it.k));
  // 1998＋2007 の囲み
  if (at >= 62 && !hide.includes('s2007') && !onlyLeft) {
    const a = (mode === 'b' ? ITEMS[6].b : ITEMS[6].c), w = mode === 'b' ? 344 : 202;
    h += abs(`left:${a.x - 8}px;bottom:${rowB(1) - 6}px;width:${w}px;height:${f * 2.0}px;border:${mode === 'b' ? 3 : 2}px solid ${K.kaki};border-radius:8px;z-index:6;${hi.includes('s1998') ? hiCss : ''}`, '');
    h += abs(`left:${a.x + (mode === 'b' ? 158 : 94)}px;bottom:${rowB(1) + f * 0.7}px;width:12px;height:2px;background:${K.kaki};z-index:8`, '');
  }
  for (const it of ITEMS) {
    if (!show(it)) continue;
    const p = mode === 'b' ? it.b : it.c, isHi = hi.includes(it.k) || (it.k === 's2007' && hi.includes('s1998'));
    let el;
    if (it.type === 'author') el = authorCard(f, { hi: isHi, blink: o.blink });
    else if (it.type === 'kaki') el = fuda(p.l, f, { hi: isHi || (it.k === 's1999' && glow1999), mi: it.mi, glowMi });
    else if (it.type === 'ai') el = fuda(p.l, f * (mode === 'b' ? 0.8 : 1), { color: K.ai, hi: isHi });
    else if (it.type === 'float') el = rec(p.l, f * 0.85, { mi: it.mi, hi: isHi, dashed: true, glowMi });
    else el = rec(p.l, it.type === 'recB' ? f * (mode === 'b' ? 0.8 : 1) : f, { mi: it.mi, hi: isHi, glowMi, pad: `${f * 0.2}px ${f * 0.4}px` });
    const blur = blurLeft && p.x < 400 ? 'filter:blur(9px);opacity:.6;' : '';
    if (it.type === 'recB' || it.type === 'ai') {
      h += abs(`left:${p.x}px;top:${Y + (mode === 'b' ? 14 : 10)}px;z-index:7;${blur}`, el);
    } else if (it.type === 'float') {
      h += abs(`left:${p.x}px;bottom:${rowB(p.t)}px;z-index:7`, el);
    } else {
      h += abs(`left:${p.x}px;bottom:${rowB(p.t)}px;z-index:7;${blur}`, el);
      if (p.t > 1) h += abs(`left:${p.x + 12}px;top:${Y - (p.t - 1) * g.row}px;width:2px;height:${(p.t - 1) * g.row}px;background:${it.type === 'kaki' ? K.kaki : lc};opacity:.7;z-index:6`, '');
      h += abs(`left:${p.x + 7}px;top:${Y - 6}px;width:12px;height:12px;border-radius:50%;background:${it.type === 'kaki' ? K.kaki : lc};z-index:6`, '');
    }
    if (it.k === 's1999' && at >= 60) h += abs(`left:${p.x + (mode === 'b' ? 220 : 132)}px;bottom:${rowB(2) + (mode === 'b' ? 8 : 4)}px;z-index:7`, rec('聞き取り記録', f * 0.78, { pad: `${f * 0.15}px ${f * 0.35}px` }));
  }
  // 1990年代の印（札が置かれる前）
  const dot = (x) => abs(`left:${x}px;top:${Y - 14}px;width:28px;height:28px;border-radius:50%;background:${K.kaki};box-shadow:0 0 18px 6px rgba(200,116,58,.45);z-index:7`, '');
  if (at >= 50 && at < 53) h += dot(mode === 'b' ? 1012 : 1062);
  if (at >= 50 && at < 56) h += dot(mode === 'b' ? 1072 : 1112);
  if (at >= 50 && at <= 52) h += abs(`left:${mode === 'b' ? 950 : 1030}px;top:${Y + (mode === 'b' ? 14 : 10)}px;font-size:${tickF}px;font-weight:900;color:${K.kaki};z-index:6`, '1990年代の終わり');
  if (bracket) {
    const bx0 = mode === 'b' ? 340 : 360, bx1 = mode === 'b' ? 1000 : 1040, by = mode === 'b' ? Y - 200 : Y - 90;
    h += abs(`left:${bx0}px;top:${by}px;width:${bx1 - bx0}px;height:${mode === 'b' ? 40 : 26}px;border:${mode === 'b' ? 4 : 3}px solid ${K.hai};border-bottom:none;border-radius:10px 10px 0 0;z-index:6`, '');
  }
  if (mihakken) h += abs(`left:${mode === 'b' ? 560 : 600}px;top:${Y - (mode === 'b' ? 290 : 140)}px;z-index:9`, fusen('未発見かもしれない', mode === 'b' ? 34 : 24));
  if (q) h += abs(`left:${mode === 'b' ? 330 : 360}px;bottom:${rowB(1) + 4}px;font-size:${mode === 'b' ? 64 : 40}px;font-weight:900;color:${K.kaki};z-index:9`, '？');
  if (blanks) for (let i = 0; i < 5; i++) h += abs(`left:${(mode === 'b' ? 520 : 460) + i * (mode === 'b' ? 92 : 104)}px;bottom:${rowB(mode === 'b' ? 3 : 2)}px;z-index:7`, `<span style="display:inline-block;width:${mode === 'b' ? 74 : 84}px;height:${f * 1.6}px;border:2px dashed ${dark ? K.line : K.ink};background:rgba(241,233,218,.7);border-radius:4px"></span>`);
  if (blurLeft) h += abs(`left:0;top:${Y - 160}px;width:430px;height:220px;background:linear-gradient(90deg,${dark ? 'rgba(20,20,20,.9)' : 'rgba(238,229,209,.9)'},rgba(0,0,0,0));filter:blur(10px);z-index:8`, '');
  if (showBox && at >= 13 && !onlyLeft) {
    const bx = g.box, n = BOXTAGS.filter(([, fr]) => fr <= at).length;
    h += box({ x: bx.x, y: bx.y, s: bx.s, n, labels: boxLabels, lift: boxLift, overflow: boxOverflow, dark });
  }
  return `<div style="position:absolute;inset:0;opacity:${opacity}">${h}</div>`;
}
const bar = (at, o = {}) => nenpyo({ at, ...o });

// ---------- 背景イラスト（SVG。写実にしない平面・影絵・切り絵調） ----------
const svgWrap = (inner, { vertical = false, cx = 960 } = {}) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vertical ? `${cx - 304} 0 608 1080` : '0 0 1920 1080'}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%">${inner}</svg>`;
const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const duskDefs = `<linearGradient id="dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7C7097"/><stop offset=".5" stop-color="#B98B95"/><stop offset=".78" stop-color="#D9A07A"/><stop offset="1" stop-color="#E3B07E"/></linearGradient>
  <filter id="paper" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="0.015 0.5" numOctaves="2" seed="9"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .2  0 0 0 0 .2  0 0 0 .35 -.1"/></filter>`;
// 立っている子の影（顔なし）。x,y=足元、k=大きさ。返り値に肩の位置
function child(x, y, k, seed = 1) {
  const r = rnd(seed * 97 + 13); const hair = r() > 0.5;
  const sh = y - 128 * k;
  const s = `<g fill="${K.silh}">
    <circle cx="${x}" cy="${y - 150 * k}" r="${19 * k}"/>
    ${hair ? `<path d="M${x - 19 * k} ${y - 150 * k} Q${x - 22 * k} ${y - 128 * k} ${x - 12 * k} ${y - 126 * k} L${x + 12 * k} ${y - 126 * k} Q${x + 22 * k} ${y - 128 * k} ${x + 19 * k} ${y - 150 * k} Z"/>` : ''}
    <path d="M${x - 15 * k} ${sh} L${x + 15 * k} ${sh} L${x + 29 * k} ${y - 52 * k} L${x - 29 * k} ${y - 52 * k} Z"/>
    <rect x="${x - 13 * k}" y="${y - 54 * k}" width="${9 * k}" height="${54 * k}" rx="${3 * k}"/><rect x="${x + 4 * k}" y="${y - 54 * k}" width="${9 * k}" height="${54 * k}" rx="${3 * k}"/>
  </g>`;
  return { s, L: [x - 13 * k, sh + 8 * k], R: [x + 13 * k, sh + 8 * k], k };
}
// しゃがんで目をふさぐ子（横から。顔なし）
const crouch = (x, y, k) => `<g fill="${K.silh}"><ellipse cx="${x}" cy="${y - 40 * k}" rx="${46 * k}" ry="${40 * k}"/><circle cx="${x + 34 * k}" cy="${y - 82 * k}" r="${21 * k}"/><path d="M${x + 6 * k} ${y - 62 * k} Q${x + 40 * k} ${y - 70 * k} ${x + 50 * k} ${y - 88 * k} L${x + 58 * k} ${y - 80 * k} Q${x + 44 * k} ${y - 52 * k} ${x + 10 * k} ${y - 46 * k} Z"/><ellipse cx="${x}" cy="${y - 2 * k}" rx="${44 * k}" ry="${6 * k}"/></g>`;
// しゃがむ子を真後ろから
const crouchBack = (x, y, k) => `<g fill="${K.silh}"><path d="M${x - 70 * k} ${y} Q${x - 82 * k} ${y - 110 * k} ${x} ${y - 128 * k} Q${x + 82 * k} ${y - 110 * k} ${x + 70 * k} ${y} Z"/><circle cx="${x}" cy="${y - 140 * k}" r="${34 * k}"/></g>`;
function ring({ cx = 960, cy = 780, rx = 560, ry = 110, scale = 1.25, angles = [-160, -125, -90, -55, -20, 25, 155, 60, 120], seed = 3 } = {}) {
  const figs = angles.map((a, i) => { const t = a * Math.PI / 180; const x = cx + rx * Math.cos(t), y = cy + ry * Math.sin(t); const k = scale * (0.82 + 0.22 * (Math.sin(t) + 1) / 2); return { a, ...child(x, y, k, seed + i), y }; });
  const order = [...figs].sort((p, q) => ((p.a % 360) + 360) % 360 - ((q.a % 360) + 360) % 360);
  let arms = '';
  for (let i = 0; i < order.length; i++) {
    const A = order[i], Bf = order[(i + 1) % order.length];
    const [ax, ay] = A.R[0] < Bf.L[0] ? A.R : A.L, [bx, by] = A.R[0] < Bf.L[0] ? Bf.L : Bf.R;
    if (Math.abs(ax - bx) > 480) continue;
    arms += `<path d="M${ax} ${ay} Q${(ax + bx) / 2} ${(ay + by) / 2 + 30} ${bx} ${by}" stroke="${K.silh}" stroke-width="${8 * A.k}" fill="none" stroke-linecap="round"/>`;
  }
  const back = figs.filter(f => f.y <= cy).map(f => f.s).join(''), front = figs.filter(f => f.y > cy).map(f => f.s).join('');
  return { back: arms + back, front, shadow: `<ellipse cx="${cx}" cy="${cy + 10}" rx="${rx + 60}" ry="${ry + 30}" fill="rgba(40,25,40,.18)"/>` };
}
const scenes = {
  // 影絵：輪の真ん中にしゃがむ子（P01 の代わり）
  ring: (o = {}) => { const r = ring(); return svgWrap(`<defs>${duskDefs}<radialGradient id="sun" cx=".5" cy=".72" r=".5"><stop offset="0" stop-color="#F6CB8E" stop-opacity=".8"/><stop offset="1" stop-color="#F6CB8E" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="url(#dusk)"/><circle cx="960" cy="760" r="520" fill="url(#sun)"/>
    <path d="M0 800 Q960 760 1920 800 L1920 1080 L0 1080 Z" fill="#6D5462" opacity=".55"/>
    ${r.shadow}${r.back}${crouch(930, 800, 1.8)}${r.front}
    <rect width="1920" height="1080" filter="url(#paper)"/>`, o); },
  // 影絵：真後ろから（P02 の代わり）
  behind: (o = {}) => { const r = ring({ cy: 640, rx: 520, ry: 70, scale: 0.95, angles: [-165, -130, -95, -60, -25, 15, 165, 40, 140] }); return svgWrap(`<defs>${duskDefs}</defs>
    <rect width="1920" height="1080" fill="url(#dusk)"/><path d="M0 660 Q960 620 1920 660 L1920 1080 L0 1080 Z" fill="#6D5462" opacity=".55"/>
    ${r.shadow}${r.back}${r.front}${crouchBack(960, 1080, 2.6)}<rect width="1920" height="1080" filter="url(#paper)"/>`, o); },
  // 影絵：真ん中の子に光が降りる（P12 の代わり）
  light: (o = {}) => { const r = ring(); return svgWrap(`<defs>${duskDefs}<radialGradient id="gold" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFE8B0" stop-opacity=".95"/><stop offset="1" stop-color="#FFE8B0" stop-opacity="0"/></radialGradient><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF1CC" stop-opacity=".0"/><stop offset="1" stop-color="#FFF1CC" stop-opacity=".55"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#dusk)"/><path d="M0 800 Q960 760 1920 800 L1920 1080 L0 1080 Z" fill="#6D5462" opacity=".55"/>
    <path d="M880 0 L1040 0 L1110 780 L800 780 Z" fill="url(#beam)"/><circle cx="960" cy="700" r="230" fill="url(#gold)"/>
    ${r.shadow}${r.back}${crouch(930, 800, 1.8)}${r.front}<rect width="1920" height="1080" filter="url(#paper)"/>`, o); },
  // 夕暮れの空き地（P03 の代わり。建物・看板・寺社なし）
  akichi: (o = {}) => { const r = rnd(5); let grass = ''; for (let i = 0; i < 70; i++) { const x = r() * 1920, hgt = 30 + r() * 70, y = 900 + r() * 170; grass += `<path d="M${x} ${y} q${4 + r() * 8} ${-hgt} ${14 + r() * 10} ${-hgt * 1.1} q-6 ${hgt * .5} -2 ${hgt * 1.1} Z" fill="#3E3040"/>`; }
    let fence = ''; for (let i = 0; i < 8; i++) fence += `<rect x="${1180 + i * 95}" y="${770 - i * 4}" width="14" height="${120 + i * 6}" fill="#4A3A48"/>`;
    return svgWrap(`<defs>${duskDefs}</defs><rect width="1920" height="1080" fill="url(#dusk)"/>
    <circle cx="560" cy="700" r="90" fill="#F3C48C" opacity=".85"/>
    <path d="M0 760 Q300 690 620 740 Q980 790 1300 720 Q1620 660 1920 730 L1920 1080 L0 1080 Z" fill="#8E7088" opacity=".8"/>
    <path d="M0 830 Q480 790 960 820 Q1440 850 1920 810 L1920 1080 L0 1080 Z" fill="#6A5064"/>
    ${fence}<path d="M1180 800 L1880 772" stroke="#4A3A48" stroke-width="5"/><path d="M1180 840 L1880 812" stroke="#4A3A48" stroke-width="5"/>
    <path d="M0 920 Q960 880 1920 930 L1920 1080 L0 1080 Z" fill="#4C3A4A"/>${grass}<rect width="1920" height="1080" filter="url(#paper)"/>`, o); },
  // 格子の影が和紙に下りる（P04 の代わり。人物なし）
  koushi: (o = {}) => svgWrap(`<defs><filter id="lb"><feGaussianBlur stdDeviation="9"/></filter></defs><rect width="1920" height="1080" fill="${K.kinari}"/>
    <g filter="url(#lb)" opacity=".22" transform="skewX(-8) translate(120 0)">${Array.from({ length: 13 }, (_, i) => `<rect x="${200 + i * 130}" y="-40" width="34" height="${700}" fill="#3B3026"/>`).join('')}${Array.from({ length: 4 }, (_, i) => `<rect x="160" y="${60 + i * 170}" width="1700" height="30" fill="#3B3026"/>`).join('')}</g>
    <rect y="620" width="1920" height="460" fill="${K.kinari}" opacity=".35"/>`, o),
  // 本棚（背表紙に文字なし。P06 の代わり）
  hondana: (o = {}) => { const r = rnd(21), cols = ['#8B5E3C', '#A9744F', '#6E7F8C', '#9C8F6B', '#B9A27E', '#5E6B5A', '#7D5A4F', '#C8B48E']; let b = '';
    for (let row = 0; row < 3; row++) { let x = 200; const y = 150 + row * 290; while (x < 1700) { const w = 34 + r() * 46, h = 190 + r() * 60; b += `<rect x="${x}" y="${y + 250 - h}" width="${w}" height="${h}" rx="3" fill="${cols[Math.floor(r() * cols.length)]}"/><rect x="${x + w * .2}" y="${y + 270 - h}" width="${w * .6}" height="4" fill="rgba(255,255,255,.25)"/>`; x += w + 4 + (r() > .9 ? 30 : 0); } b += `<rect x="170" y="${y + 250}" width="1580" height="24" fill="#7A5232"/>`; }
    return svgWrap(`<rect width="1920" height="1080" fill="#E7DCC4"/><rect x="150" y="100" width="1620" height="920" fill="#9A6D45"/><rect x="170" y="120" width="1580" height="880" fill="#5C3F28"/>${b}`, o); },
  // ガラス板の幻燈（P07 の代わり。平面イラスト。実物の資料に似せない）
  gentou: (o = {}) => { const r = ring({ cx: 960, cy: 600, rx: 150, ry: 34, scale: 0.42 }); return svgWrap(`<defs><radialGradient id="gl" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4D6"/><stop offset="1" stop-color="#FFF4D6" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="${K.kinari}"/><circle cx="960" cy="500" r="480" fill="url(#gl)"/>
    <rect x="640" y="190" width="640" height="560" rx="18" fill="#B07A45" stroke="#6E4724" stroke-width="10"/>
    <rect x="720" y="260" width="480" height="420" rx="8" fill="#F6E9C9" stroke="#6E4724" stroke-width="6"/>
    <circle cx="960" cy="470" r="185" fill="#F3D9A4" stroke="#6E4724" stroke-width="4"/>
    <g>${r.back}${crouch(955, 610, 0.45)}${r.front}</g>
    <circle cx="672" cy="222" r="10" fill="#6E4724"/><circle cx="1248" cy="222" r="10" fill="#6E4724"/><circle cx="672" cy="718" r="10" fill="#6E4724"/><circle cx="1248" cy="718" r="10" fill="#6E4724"/>`, o); },
  // ペン先が年表の上で止まる（P08 の代わり）
  pen: (o = {}) => svgWrap(`<rect width="1920" height="1080" fill="${K.kinari}"/><rect x="160" y="640" width="1600" height="6" fill="${K.ink}"/>
    <g transform="translate(980 600) rotate(-38)"><path d="M0 0 L-26 -70 L-22 -150 L22 -150 L26 -70 Z" fill="#C9A24E" stroke="#6B5020" stroke-width="4"/><path d="M0 -4 L0 -90" stroke="#6B5020" stroke-width="4"/><circle cx="0" cy="-92" r="7" fill="#6B5020"/><rect x="-30" y="-470" width="60" height="320" rx="14" fill="#1E1B19"/><rect x="-34" y="-200" width="68" height="40" rx="6" fill="#C9A24E"/></g>
    <ellipse cx="985" cy="640" rx="60" ry="8" fill="rgba(0,0,0,.08)"/>`, o),
  // 古地図風の抽象イラスト（架空の海岸線・格子のみ。P09 の代わり）
  kochizu: (o = {}) => { const r = rnd(33); const blob = (cx, cy, R, n = 10) => catmull(Array.from({ length: n }, (_, i) => { const a = i / n * Math.PI * 2, rr = R * (0.7 + r() * 0.5); return [cx + rr * Math.cos(a), cy + rr * Math.sin(a) * 0.7]; }));
    return svgWrap(`<rect width="1920" height="1080" fill="#EBDDBF"/>${Array.from({ length: 12 }, (_, i) => `<path d="M${i * 170} 0 V1080" stroke="#9C7B4F" stroke-opacity=".18" stroke-width="2"/>`).join('')}${Array.from({ length: 7 }, (_, i) => `<path d="M0 ${i * 170} H1920" stroke="#9C7B4F" stroke-opacity=".18" stroke-width="2"/>`).join('')}
    <path d="${blob(620, 460, 300, 12)}" fill="#D6BF94" stroke="#8A6A40" stroke-width="5"/><path d="${blob(1300, 640, 230, 11)}" fill="#D6BF94" stroke="#8A6A40" stroke-width="5"/><path d="${blob(1500, 300, 110, 9)}" fill="#D6BF94" stroke="#8A6A40" stroke-width="5"/>
    ${Array.from({ length: 5 }, (_, i) => `<path d="M${200 + i * 40} ${880 + i * 12} q60 -20 120 0 t120 0" stroke="#8A6A40" stroke-opacity=".4" stroke-width="3" fill="none"/>`).join('')}`, o); },
  // 明るい生成り（P10 の代わり。流産説の区間の背景）
  kinari: (o = {}) => svgWrap(`<defs><radialGradient id="wl" cx=".5" cy=".3" r=".8"><stop offset="0" stop-color="#FFFDF6"/><stop offset="1" stop-color="${K.kinariL}"/></radialGradient></defs><rect width="1920" height="1080" fill="url(#wl)"/>`, o),
  // 事典の背表紙（文字なし。P11 の代わり）
  spines: (o = {}) => { const cols = ['#E2D4B4', '#7A5638', '#2F4A6D', '#B79A6E', '#5A4030', '#3D5672', '#CDB78F', '#6E4B33']; let b = '', x = 260;
    cols.concat(cols.slice(0, 4)).forEach((c, i) => { const w = 100 + (i * 23) % 40; b += `<rect x="${x}" y="${300 + (i % 3) * 12}" width="${w}" height="${560 - (i % 3) * 12}" rx="6" fill="${c}"/><rect x="${x + 12}" y="${360}" width="${w - 24}" height="8" fill="rgba(255,255,255,.3)"/><rect x="${x + 12}" y="${760}" width="${w - 24}" height="8" fill="rgba(255,255,255,.3)"/>`; x += w + 8; });
    return svgWrap(`<rect width="1920" height="1080" fill="#E9DFC9"/>${b}<rect x="220" y="860" width="1480" height="30" fill="#7A5232"/>`, o); },
};
const scene = (k, o) => scenes[k](o);

// 日本の簡易図（抽象的な形。県境の線だけ・印なし）
function catmull(pts, closed = true) {
  const n = pts.length; let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < (closed ? n : n - 1); i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
  }
  return d + (closed ? 'Z' : '');
}
function band(center, widths) {
  const L = [], R = [];
  center.forEach((p, i) => { const a = center[Math.max(0, i - 1)], b = center[Math.min(center.length - 1, i + 1)]; const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy); const nx = -dy / len, ny = dx / len, w = widths[i]; L.push([p[0] + nx * w, p[1] + ny * w]); R.push([p[0] - nx * w, p[1] - ny * w]); });
  return { d: catmull(L.concat(R.reverse())), L, R: R.reverse() };
}
function japan({ dot = false, arrow = false, w = 900, dark = false, op = 1 } = {}) {
  const fill = dark ? '#3A342D' : '#E6D8B8', st = dark ? K.line : K.ink;
  const hc = [[700, 300], [705, 380], [690, 450], [655, 515], [600, 565], [530, 600], [450, 625], [370, 650], [300, 670]];
  const hw = [44, 58, 60, 58, 54, 50, 44, 40, 34];
  const hon = band(hc, hw);
  const borders = [1, 2, 3, 4, 5, 6, 7].map(i => `<path d="M${hon.L[i][0]} ${hon.L[i][1]} L${hon.R[i][0]} ${hon.R[i][1]}" stroke="${st}" stroke-width="2" stroke-opacity=".55"/>`).join('');
  const hok = catmull([[700, 120], [760, 130], [820, 165], [800, 225], [740, 250], [690, 230], [675, 175]]);
  const shi = catmull([[350, 700], [420, 690], [470, 705], [440, 735], [370, 740], [335, 725]]);
  const kyu = catmull([[250, 690], [290, 705], [300, 760], [270, 820], [225, 830], [205, 780], [215, 720]]);
  const extra = `<path d="M720 190 L760 230" stroke="${st}" stroke-width="2" stroke-opacity=".55"/><path d="M400 692 L405 738" stroke="${st}" stroke-width="2" stroke-opacity=".55"/><path d="M210 760 L296 750" stroke="${st}" stroke-width="2" stroke-opacity=".55"/>`;
  let mark = '';
  if (dot) mark += `<circle cx="640" cy="535" r="11" fill="${K.kaki}"/><text x="662" y="528" font-family="NSJ" font-weight="900" font-size="26" fill="${K.ink}">野田市（今の千葉県）</text>`;
  if (arrow) mark += `<path d="M628 545 Q560 610 470 615" stroke="${K.kaki}" stroke-width="6" stroke-dasharray="14 12" fill="none" stroke-linecap="round"/><text x="420" y="590" font-family="NSJ" font-weight="900" font-size="54" fill="${K.kaki}">？</text>`;
  return `<svg width="${w}" height="${w * 0.8}" viewBox="150 90 720 780" style="opacity:${op}"><g fill="${fill}" stroke="${st}" stroke-width="3" stroke-linejoin="round"><path d="${hok}"/><path d="${hon.d}"/><path d="${shi}"/><path d="${kyu}"/></g>${borders}${extra}${mark}</svg>`;
}
const mapNote = (o = {}) => abs(`${o.css || 'right:40px;top:30px'};font-size:${o.size || 24}px;font-weight:500;color:${o.dark ? 'rgba(242,236,224,.8)' : '#5B544A'};z-index:22`, '簡易図（実際の地図ではありません）');

// 架空の「まとめ記事風」画面（ダミー。強いぼかし）
const fakeArticle = () => `<div style="position:absolute;inset:0;background:#F6F4EF;filter:blur(7px)">
  <div style="height:90px;background:#D9D6CF"></div>
  <div style="margin:50px 420px 0;display:flex;flex-direction:column;gap:26px">
    <div style="height:46px;width:80%;background:#9C978E;border-radius:6px"></div><div style="height:46px;width:55%;background:#9C978E;border-radius:6px"></div>
    <div style="height:300px;background:#C9C3B8;border-radius:10px;margin-top:20px"></div>
    ${[90, 96, 70, 88, 60, 94, 80].map(w => `<div style="height:20px;width:${w}%;background:#B9B4AA;border-radius:10px"></div>`).join('')}
  </div></div>`;

// 浮く札（冒頭・第3章）
const floatTags = (list, { y = 300, spread = 1, rot = true, size = 46, row = false } = {}) => row
  ? abs(`left:0;right:0;top:${y}px;display:flex;justify-content:center;gap:50px;z-index:10`, list.map(t => fuda(t, size)).join(''))
  : list.map((t, i) => abs(`left:${[360, 820, 1250, 560, 1050][i]}px;top:${y + [40, -30, 70, 190, 220][i] * spread}px;z-index:10`, fuda(t, size, { rot: rot ? [-6, 4, -3, 5, -4][i] : 0 }))).join('');
const OPTAGS = ['牢屋の歌？', '埋蔵金の暗号？', '呪いの歌？'];
const center = (inner, css = '') => abs(`left:0;right:0;top:0;bottom:120px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px;z-index:10;${css}`, inner);
const chapNo = (no, title, at, { bg = K.kinari } = {}) => F(abs('left:120px;top:110px', `<div style="font-size:44px;font-weight:900;color:${K.kaki};letter-spacing:.2em">${esc(no)}</div>`) +
  center(`<div style="font-family:NSerif;font-weight:700;font-size:92px;color:${K.ink};text-align:center;line-height:1.3">${br(title)}</div>`) + bar(at), { bg });

// ===================== 背景（素材単体・テロップなし） =====================
const BG = { K01_影絵_輪: 'ring', K02_影絵_真後ろ: 'behind', K03_影絵_光が降りる: 'light', K04_夕暮れの空き地: 'akichi', K05_格子の影: 'koushi', K06_本棚: 'hondana', K07_幻燈イメージ: 'gentou', K08_ペン先: 'pen', K09_古地図風: 'kochizu', K10_明るい生成り: 'kinari', K11_事典の背表紙: 'spines' };
for (const [id, k] of Object.entries(BG)) B(id, frame({ body: scene(k), grainOp: 0.05 }));
B('K01_影絵_輪_vertical', frame({ w: 1080, h: 1920, body: scene('ring', { vertical: true, cx: 960 }), grainOp: 0.05 }), 1080, 1920);
B('K12_日本の簡易図', F(abs('inset:0;display:flex;align-items:center;justify-content:center', japan({ w: 1100 })) + mapNote()));
B('K13_初出不明の箱', frame({ bg: K.kinari, grainOp: 0, body: box({ x: 660, y: 420, s: 2 }) }));
B('K14_初出不明の箱_透過', `<div style="position:relative;width:1920px;height:1080px">${box({ x: 660, y: 420, s: 2 })}</div>`);
jobs[jobs.length - 1].transparent = true;

// ===================== 長尺（L001〜L106） =====================
const dk = { dark: true };
// ---- オープニング 0:00〜0:30 ----
L('L001', F(bar(1, { dark: true, len: 0.62 }) + tp('今回の調べで、日付までたどれた\n怖い説・謎の説は、いくつ？', 'q', { dark: true, size: 46, top: 330 }), dk));
L('L002', F(floatTags(OPTAGS, { y: 360, size: 54 }) + bar(2, dk), dk));
L('L003', F(floatTags(OPTAGS, { y: 640, size: 44, row: true }) + abs('left:0;right:0;top:760px;text-align:center;font-size:30px;color:rgba(242,236,224,.5);z-index:9', '・・・') + bar(3, dk) + tp('歌と怖い説を、生まれた順に', 'plain', { dark: true, top: 260, size: 56 }), dk));
L('L004', F(abs('inset:0;transform:scale(1.25);transform-origin:8% 95%', bar(4, { dark: true, blurLeft: true })) + tp('年表のいちばん古い端に、何が残る？', 'plain', { dark: true, top: 300, size: 58 }), dk));
L('L004b', F(center(`<div style="font-family:NSerif;font-weight:700;font-size:170px;color:#F4EFE4;letter-spacing:.06em">かごめかごめ</div><div style="font-size:50px;font-weight:900;color:${K.kaki}">怖い説、出どころを一つずつ追ってみた</div>`) + bar(4, dk), dk));
// ---- 導入 0:30〜1:30 ----
const kageBar = (at) => abs('left:0;right:0;bottom:0;height:150px;background:linear-gradient(rgba(20,20,20,0),rgba(20,20,20,.55));z-index:4', '') + bar(at, dk);
L('L005', F(scene('ring') + kageBar(5) + IMG() + tp('かごめかごめ', 'plain', { dark: true, size: 72, top: 120 }), dk));
L('L006', F(scene('behind') + kageBar(6) + IMG() + tp('うしろの正面だあれ', 'plain', { dark: true, size: 64, top: 120 }), dk));
L('L007', F(scene('akichi') + kageBar(7) + IMG(), dk));
L('L008', F(fakeArticle() + abs('right:40px;top:30px;font-size:24px;font-weight:900;color:#fff;background:rgba(0,0,0,.45);padding:6px 16px;border-radius:6px;z-index:22', '架空の画面（イメージ）') + bar(8) + tp('本やネットで語られる「怖い意味」', 'plain', { size: 60, top: 380 })));
L('L009', F(scene('koushi') + bar(9) + IMG('イメージ（イラスト）', { dark: false }) + tp('〜という説があります', 'setsu', { size: 58 })));
L('L010', F(scene('ring') + kageBar(10) + IMG() + tp('なぜ怖い話が集まる？', 'q', { dark: true, size: 52, top: 110 }), dk));
L('L011', F(center(`<div style="font-size:96px;font-weight:900;color:${K.ink}">当てに行くのではなく</div>`) + bar(11)));
L('L012', F(bar(12) + abs('left:200px;top:1000px;width:44px;z-index:9', '') + tp('いつ・どこで記録されたか', 'plain', { size: 64, top: 400 })));
L('L013', F(bar(13) + abs('left:1560px;top:820px;font-size:60px;color:' + K.woodD + ';z-index:9', '↓') + tp('日付不明 → 「初出不明」の箱へ', 'plain', { size: 60, top: 400 })));
// ---- 第1章 1:30〜2:50 ----
const W5 = ['かごめ', '籠の中の鳥', '夜明けの晩', '鶴と亀がすべった', '後ろの正面'];
const words = (o = {}) => abs(`left:0;right:0;top:${o.top ?? 250}px;display:flex;flex-wrap:wrap;justify-content:center;gap:40px 46px;padding:0 140px;z-index:10`,
  W5.map((t, i) => `<span style="position:relative;display:inline-block">${word(t, 58, { dim: o.dim && i !== 0 })}${o.q ? `<span style="position:absolute;right:-18px;top:-46px;font-size:64px;font-weight:900;color:${K.kaki}">？</span>` : ''}</span>`).join(''));
L('L014a', chapNo('第1章', '説明できない言葉だらけの歌', 14));
L('L014', F(abs('left:120px;top:110px;font-size:36px;font-weight:900;color:' + K.kaki + ';letter-spacing:.2em', '第1章') + abs('left:120px;top:170px;font-family:NSerif;font-weight:700;font-size:56px;color:' + K.ink, '説明できない言葉だらけの歌') + words({ top: 400 }) + bar(14)));
L('L015', F(words() + bar(15) + tp('かごめ／籠の中の鳥／夜明けの晩／鶴と亀がすべった／後ろの正面', 'plain', { size: 40 })));
const pairs = () => abs('left:0;right:0;top:260px;display:flex;flex-direction:column;align-items:center;gap:80px;z-index:10', [['夜明け', '晩'], ['後ろ', '正面']].map(([a, b]) => `<div style="display:flex;align-items:center;gap:0">${word(a, 72)}<span style="display:inline-block;width:260px;height:6px;background:#8A8378;margin:0 10px"></span>${word(b, 72)}</div>`).join(''));
L('L016', F(pairs() + bar(16) + tp('夜明け<span style="font-size:1.4em;line-height:1">⇔</span>晩／後ろ<span style="font-size:1.4em;line-height:1">⇔</span>正面', 'plain', { size: 56, html: true })));
L('L017', F(words({ q: true, top: 320 }) + bar(17)));
L('L018', F(scene('hondana') + bar(18) + IMG('イメージ（イラスト）', { dark: true })));
L('L019', F(center(rec('国立国会図書館 レファレンス協同データベース\n（安城市図書情報館の事例）', 54, { mi: true }) + `<div style="font-size:28px;color:#6B6358">※データベースの画面ではなく、名前を文字で再構成しています</div>`) + bar(19)));
L('L020', F(center(`<div style="font-size:52px;font-weight:900;color:${K.ink}">『日本童謡事典』は歌詞を</div><div style="font-family:NSerif;font-weight:700;font-size:150px;color:${K.ink};line-height:1.1">「解釈できない」</div><div style="font-size:52px;font-weight:900;color:${K.ink}">とする、と紹介</div>`) + bar(20)));
L('L021', F(center(rec('図書館の回答：意味の解釈は難しい', 66)) + bar(21)));
L('L022', F(words({ dim: true, top: 280 }) + bar(22) + tp('「かごめ」の語源の説明', 'plain', { size: 56 })));
const branch = (o = {}) => abs('left:0;right:0;top:170px;display:flex;flex-direction:column;align-items:center;z-index:10', `${word('かごめ', 84)}<svg width="900" height="200" viewBox="0 0 900 200"><path d="M450 10 L170 170" stroke="${K.ink}" stroke-width="6"/><path d="M450 10 L730 170" stroke="${K.ink}" stroke-width="6"/><path d="M150 178 l40 -6 l-14 -30" fill="none" stroke="${K.ink}" stroke-width="6"/><path d="M750 178 l-40 -6 l14 -30" fill="none" stroke="${K.ink}" stroke-width="6"/></svg><div style="display:flex;gap:260px">${rec('囲め？', 60)}${rec('屈め（かがめ）？', 60)}</div>`);
L('L023', F(branch() + bar(23)));
L('L024', F(center(`<div style="font-size:84px;font-weight:900;color:${K.ink}">辞書によって説明が分かれる</div><div style="display:flex;gap:40px;font-size:34px;color:#6B6358;font-weight:900"><span>日本国語大辞典</span><span>世界大百科事典</span></div>`) + bar(24)));
L('L025', F(scene('ring') + kageBar(25) + IMG() + `<svg style="position:absolute;inset:0;z-index:9" width="1920" height="1080"><ellipse cx="960" cy="720" rx="700" ry="200" fill="none" stroke="#F4EFE4" stroke-width="6" stroke-dasharray="20 14"/><path d="M1650 700 l14 30 l22 -26" fill="none" stroke="#F4EFE4" stroke-width="6"/><path d="M985 470 L985 620" stroke="#F4EFE4" stroke-width="6"/><path d="M965 600 l20 26 l20 -26" fill="none" stroke="#F4EFE4" stroke-width="6"/></svg>` +
  abs('left:1500px;top:520px;z-index:10', rec('囲め', 50)) + abs('left:925px;top:380px;z-index:10', rec('屈め', 50)), dk));
L('L026', F(abs('inset:0;transform:scale(1.3);transform-origin:5% 96%', bar(26)) + tp('歌は、いつからあった？', 'q', { size: 52, top: 300 })));
// ---- 第2章 2:50〜5:25 ----
L('L027a', chapNo('第2章', '年表の出発点', 27));
L('L027', F(center(rec('足立区立中央図書館の事例：\n歴史と作者を知りたい', 64, { mi: true })) + bar(27)));
L('L028', F(center(rec('事例作成日：2022年7月（データベースの表示）', 54)) + srcL('出典：レファレンス協同データベース（足立区立中央図書館の事例）') + bar(28)));
const zoomL = (inner) => abs('left:120px;top:210px;display:flex;align-items:flex-end;gap:40px;z-index:10', inner);
L('L029', F(zoomL(authorCard(54) + rec('江戸時代後期', 72, { mi: true })) + bar(29, { hi: ['edo'] }) + tp('江戸時代後期：ほぼ同じ歌詞で遊ばれていた\n（図書館の回答として紹介）', 'plain', { size: 46 })));
L('L030', F(zoomL(authorCard(72, { hi: true, blink: true }) + rec('江戸時代後期', 54, { mi: true })) + bar(30, { hi: ['author'], blink: true }) + tp('作者：分かる資料なし', 'plain', { size: 60 })));
L('L031', F(abs('left:0;right:0;top:220px;display:flex;justify-content:center;gap:120px;z-index:10', [['足立区立中央図書館の事例', '江戸後期に遊ばれていた／作者の資料なし'], ['安城市図書情報館の事例', '江戸後期に遊びがあった／原型・作者は特定されていない']].map(([a, b]) => `<div style="display:flex;flex-direction:column;align-items:center;gap:30px">${rec(a, 44, { mi: true, sub: b })}<svg width="200" height="80" viewBox="0 0 200 80"><path d="M10 40 H170" stroke="${K.ink}" stroke-width="8"/><path d="M150 14 L186 40 L150 66" fill="none" stroke="${K.ink}" stroke-width="8"/></svg></div>`).join('')) + bar(31) + tp('2つの図書館の回答が同じ方向', 'plain', { size: 56 })));
L('L032', F(zoomL(rec('江戸時代後期', 72, { mi: true }) + `<span style="font-size:120px;font-weight:900;color:${K.kaki};line-height:1">？</span>`) + bar(32, { q: true }) + tp('江戸の歌詞＝今の歌詞？', 'q', { size: 50 })));
const ghost = (o = {}) => abs(`left:0;right:0;top:${o.top ?? 260}px;display:flex;justify-content:center;gap:90px;z-index:10`, ['鶴と亀がすべった', '後ろの正面'].map(t => `<span style="position:relative;display:inline-block">${word(t, o.f ?? 66, { dim: true })}${o.st ? `<span style="position:absolute;right:-30px;top:-34px">${fusen('未確認', (o.f ?? 66) * 0.55, 5)}</span>` : ''}</span>`).join(''));
L('L033', F(ghost() + bar(33) + tp('「江戸の記録に鶴と亀・後ろの正面はない」\nとする解説もある', 'plain', { size: 50 })));
L('L034', F(ghost({ st: true }) + bar(34) + tp('未確認：元の資料で確認できていません', 'mikaku', { size: 52 })));
L('L035', F(abs('inset:0;transform:scale(1.3);transform-origin:30% 96%', bar(35, { tickHi: 'meiji' })) + tp('明治', 'plain', { size: 110, top: 330 })));
L('L036', F(scene('gentou') + bar(36) + IMG('イメージ（実物の資料ではありません）', { dark: false, right: true }) + tp('江戸東京博物館 江戸博アーカイブズ\n「かごめかごめをする子供たち」（明治期）', 'plain', { size: 46 })));
L('L037', F(zoomL(rec('明治期：幻燈原板', 72, { mi: true })) + bar(37, { hi: ['meiji'] }) + tp('明治には身近な遊びだった？', 'suisoku', { size: 56 })));
L('L038', F(abs('inset:0;transform:scale(1.3);transform-origin:45% 96%', bar(38)) + tp('時代は下って', 'plain', { size: 90, top: 330 })));
const yamanakaCard = (dim = false) => rec('山中直治（1906〜1937）', 76, { sub: '今の千葉県野田市の出身', dim });
L('L039', F(center(yamanakaCard()) + bar(39) + abs('right:60px;top:40px;font-size:26px;color:#6B6358;z-index:9', '名前の文字カード（写真・肖像なし）')));
const saifu = `<div style="display:flex;align-items:center;gap:50px">
  <div style="text-align:center"><svg width="220" height="180" viewBox="0 0 220 180"><path d="M20 60 Q60 20 100 60 T180 60" stroke="${K.ink}" stroke-width="7" fill="none"/><path d="M20 110 Q60 70 100 110 T180 110" stroke="${K.ink}" stroke-width="7" fill="none" opacity=".5"/></svg><div style="font-size:38px;font-weight:900;color:${K.ink}">歌われていた歌</div></div>
  <svg width="140" height="80" viewBox="0 0 140 80"><path d="M10 40 H110" stroke="${K.kaki}" stroke-width="8"/><path d="M92 14 L128 40 L92 66" fill="none" stroke="${K.kaki}" stroke-width="8"/></svg>
  <div style="text-align:center"><svg width="220" height="180" viewBox="0 0 100 100"><path d="M70 10 L90 30 L38 82 L14 88 L20 64 Z" fill="none" stroke="${K.ink}" stroke-width="5"/></svg><div style="font-size:38px;font-weight:900;color:${K.ink}">書き取る</div></div>
  <svg width="140" height="80" viewBox="0 0 140 80"><path d="M10 40 H110" stroke="${K.kaki}" stroke-width="8"/><path d="M92 14 L128 40 L92 66" fill="none" stroke="${K.kaki}" stroke-width="8"/></svg>
  <div style="text-align:center"><div style="width:200px;height:180px;background:${K.card};border:3px solid ${K.ink};margin:0 auto"></div><div style="font-size:38px;font-weight:900;color:${K.ink}">楽譜</div></div></div>`;
L('L040', F(center(saifu + `<div style="font-size:28px;color:#6B6358">採譜＝歌を楽譜に書き取ること（採譜の年は示しません）</div>`) + bar(40) + tp('作者ではなく「採譜」した人', 'plain', { size: 58 })));
L('L041', F(zoomL(rec('1933年7月 童謡曲集の出版記念の発表会', 54, { mi: true, sub: '野田市の資料' })) + bar(41, { hi: ['y1933'] }) + tp('1933年7月 童謡曲集の出版記念の発表会（野田市の資料）', 'plain', { size: 44 })));
L('L042', F(abs('left:0;right:0;top:10px;display:flex;justify-content:center;z-index:8', japan({ dot: true, arrow: true, w: 1000 })) + mapNote() + bar(42) + tp('「全国に広まった」という説／道すじは未確認', 'setsu', { size: 50 })));
L('L043', F(center(yamanakaCard(true)) + bar(43)));
L('L044', F(zoomL(rec('1941年 柳田国男「こども風土記」', 60, { mi: true, sub: '朝日新聞の連載（紙面・ロゴは使いません）' })) + bar(44, { hi: ['y1941'] }) + tp('1941年 柳田国男「こども風土記」（朝日新聞連載）', 'plain', { size: 48 })));
L('L045', F(center(`<div style="display:flex;align-items:center;gap:40px">${word('かごめ', 80)}<span style="font-size:80px;font-weight:900;color:${K.ink}">→</span>${word('かがめ（しゃがめ）', 80)}</div>`) + bar(45) + tp('柳田：「かごめ」＝「かがめ（しゃがめ）」と紹介', 'plain', { size: 52 })));
L('L046', F(bar(46, { mode: 'b' }) + tp('今回確かめた範囲では、怖い話なし', 'plain', { size: 60, top: 260 })));
L('L047', F(scene('pen') + bar(47) + tp('怖い説は、年表のどこに？', 'q', { size: 54, top: 160 })));
// ---- 第3章 5:25〜9:16 ----
const k3 = { bg: K.kinariD };
L('L048a', chapNo('第3章', '怖い説を、生まれた順に並べてみる', 48, k3));
L('L048', F(floatTags(OPTAGS, { y: 260, size: 52 }) + bar(48), k3));
L('L049', F(center(`<div style="font-size:60px;font-weight:900;color:${K.ink}">今回の調べで、日付までたどれたのは</div><div style="font-size:96px;font-weight:900;color:${K.ink};display:flex;align-items:center">「<span style="font-size:260px;color:${K.ki};-webkit-text-stroke:4px ${K.ink};paint-order:stroke;line-height:1">2</span>つ」</div>`) + bar(49), k3));
L('L050', F(bar(50, { mode: 'b' }) + tp('1990年代の終わり', 'plain', { size: 64, top: 260 }), k3));
L('L051', F(bar(51, { mode: 'b', bracket: true }), k3));
L('L052', F(bar(52, { mode: 'b', bracket: true, mihakken: true, glowMi: true }) + tp('「それより前に無かった」とは言えない\n（ウェブ検索で確認できた範囲）', 'plain', { size: 50, top: 180 }), k3));
L('L053', F(abs('left:0;right:0;top:300px;display:flex;justify-content:center;z-index:10', fuda('1998年', 110)) + bar(53, { hi: ['s1998'] }), k3));
L('L054', F(center(rec('関裕二『「かごめ歌」に秘められた裏卑弥呼』（1998年）', 54, { sub: '書名の文字カード（表紙画像なし）' })) + bar(54), k3));
L('L055', F(scene('kochizu') + bar(55) + IMG('イメージ（イラスト）', { dark: false }) + tp('古代史と結び付ける解釈（本で紹介されたもの）', 'setsu', { size: 52 })));
// 流産説の区間 6:17〜7:03（明るい生成り・暗い演出なし）
const soft = (body, at, o = {}) => F(scene('kinari') + body + bar(at, o), { bg: K.kinariL });
L('L056', soft(abs('left:0;right:0;top:300px;display:flex;justify-content:center;z-index:10', fuda('1999年3月', 100)), 56));
L('L057', soft(center(rec('久野俊彦「高校生が知っている不思議な話」\n『下野民俗』（1999年）', 56, { mi: true })), 57));
L('L058', soft(center(`<div style="font-size:62px;font-weight:900;color:${K.ink};text-align:center;line-height:1.5">「流産の歌」と話した、という<br>聞き取りの記録（1件）</div>`), 58));
L('L059', soft(center(rec('出典：国際日本文化研究センター\n怪異・妖怪伝承データベース', 56, { sub: '画面の写しではなく、名前を文字で再構成しています' })), 59));
L('L060', soft(abs('left:0;right:0;top:250px;display:flex;justify-content:center;align-items:center;gap:30px;z-index:10', fuda('1999年3月', 80) + rec('聞き取り記録', 56)), 60) + tp('歌の起源ではなく、「そう話した人がいた」ことの記録', 'plain', { size: 50 }));
L('L061', F(scene('kinari') + abs('inset:0;background:rgba(255,255,255,.35);z-index:3', '') + bar(61), { bg: K.kinariL }));
L('L062', F(abs('left:0;right:0;top:220px;display:flex;justify-content:center;z-index:10', `<div style="display:flex;align-items:center;gap:0;border:5px solid ${K.kaki};border-radius:16px;padding:26px 34px">${fuda('1998年', 70)}<span style="display:inline-block;width:60px;height:5px;background:${K.kaki}"></span>${fuda('2007年', 70)}</div>`) + bar(62, { hi: ['s1998'] }) + tp('関裕二『かごめ歌の暗号』（2007年）\n1998年と同じ系統：説としては1つに数える', 'plain', { size: 48 })));
L('L063', F(center(`<div style="font-size:64px;font-weight:900;color:${K.ink};text-align:center;line-height:1.5">籠神社・伊勢神宮外宮と結び付ける<span style="border-bottom:7px solid ${K.kaki}">解釈</span><br><span style="font-size:44px">（本の内容紹介より）</span></div>`) + bar(63)));
L('L064', F(center(`<div style="font-size:76px;font-weight:900;color:${K.ink}">本の中で紹介された一つの読み方</div>`) + bar(64)));
L('L065', F(center(`<div style="font-size:76px;font-weight:900;color:${K.ink}">神社側の見解：今回は調べていない</div>`) + bar(65)));
const REST = ['遊女・身売り説', '囚人説', '埋蔵金説', '呪い・放送禁止の噂', '逆再生の噂'];
L('L066', F(floatTags(REST, { y: 330, size: 42, rot: false }) + bar(66, { hi: ['s1998', 's1999'] }) + tp('残りの説は？', 'q', { size: 52, top: 90 }), k3));
// 箱のアップ
const boxZoom = (at, { tagIn = null, extra = '', labels = null, lift = false } = {}) => {
  const n = BOXTAGS.filter(([, fr]) => fr <= at).length;
  const lab = labels ?? BOXTAGS.filter(([, fr]) => fr <= at).map(([, , t]) => t);
  return box({ x: 1060, y: 420, s: 2.1, n, labels: lab, lift, lf: 38 }) + (tagIn ? abs('left:330px;top:300px;z-index:12', fuda(tagIn, 50, { rot: -8 }) + `<svg width="560" height="200" style="position:absolute;left:300px;top:60px" viewBox="0 0 560 200"><path d="M0 20 Q400 0 520 190" stroke="${K.kaki}" stroke-width="5" stroke-dasharray="12 10" fill="none"/></svg>`) : '') + extra;
};
L('L067', F(boxZoom(67) + bar(67, { showBox: false }) + tp('「初出不明」の箱', 'plain', { size: 60, top: 120 }), k3));
L('L068', F(boxZoom(67, { tagIn: '遊女・身売り説' }) + bar(68, { showBox: false }) + tp('遊女・身売り説：初出不明', 'plain', { size: 56 }), k3));
L('L069', F(boxZoom(68) + bar(69, { showBox: false }), k3));
L('L070', F(boxZoom(69, { tagIn: '囚人説' }) + bar(70, { showBox: false }) + tp('囚人説：初出不明', 'plain', { size: 56 }), k3));
L('L071', F(abs('left:0;right:0;top:200px;display:flex;flex-direction:column;align-items:center;gap:60px;z-index:10', rec('日光東照宮にあるとされる鶴と亀の像', 60) + fuda('埋蔵金説（という説があります）', 54)) + bar(71) + tp('埋蔵金説（という説があります）', 'setsu', { size: 52 })));
L('L072', F(boxZoom(71, { tagIn: '埋蔵金説' }) + bar(72, { showBox: false }) + tp('埋蔵金説：初出不明', 'plain', { size: 56 }) + abs('left:0;right:0;top:110px;display:flex;justify-content:center;z-index:20', `<div style="font-size:36px;font-weight:900;color:${K.ink};background:rgba(247,242,230,.9);padding:8px 24px;border-radius:8px">東照宮側の見解：今回は調べていない</div>`), k3));
L('L073', F(abs('left:0;right:0;top:220px;display:flex;justify-content:center;z-index:10', `<span style="position:relative;display:inline-block">${word('鶴と亀がすべった', 76, { dim: true })}<span style="position:absolute;right:-34px;top:-40px">${fusen('未確認', 42, 5)}</span></span>`) + bar(73) + tp('「江戸に鶴と亀なし」なら疑問／ただし未確認', 'mikaku', { size: 50 }), k3));
L('L074', F(boxZoom(73, { tagIn: '呪い・放送禁止の噂' }) + bar(74, { showBox: false }) + tp('呪いの歌・放送禁止の噂：裏付けなし', 'plain', { size: 54 }), k3));
L('L075', F(boxZoom(74, { tagIn: '逆再生の噂' }) + bar(75, { showBox: false }) + tp('逆再生の噂：初出不明', 'plain', { size: 56 }), k3));
// 比較図：左に年表（札3枚・説2つ）、右に箱（ふたが閉まらない）
L('L076', F(abs('left:120px;top:250px;width:940px;height:420px;z-index:9', `<div style="position:absolute;left:0;right:0;top:300px;height:6px;background:${K.ink}"></div><div style="position:absolute;left:300px;top:150px;display:flex;align-items:center;border:4px solid ${K.kaki};border-radius:12px;padding:16px 20px">${fuda('1998年', 40)}<span style="display:inline-block;width:30px;height:4px;background:${K.kaki}"></span>${fuda('2007年', 40)}</div><div style="position:absolute;left:420px;top:40px">${fuda('1999年3月', 40)}</div><div style="position:absolute;left:0;top:330px;font-size:34px;font-weight:900;color:${K.ink}">年表の上</div>`) +
  box({ x: 1220, y: 400, s: 1.8, overflow: true }) + abs('left:1260px;top:740px;font-size:34px;font-weight:900;color:' + K.ink + ';z-index:10', '箱の中') + bar(76, { showBox: false, opacity: 0.35 }) + tp('年表の上：2つの説（札3枚）／箱の中：たくさん', 'plain', { size: 52, top: 110 }), k3));
L('L077', F(abs('inset:0;transform:scale(1.3);transform-origin:95% 96%', bar(77)) + tp('意味を知りたい人は、どこへ？', 'q', { size: 52, top: 260 }), k3));
// ---- 第4章 9:16〜10:51 ----
L('L078a', chapNo('第4章', '年表の右端', 78, { bg: K.kinariL }));
L('L078', F(center(rec('国立国会図書館\nレファレンス協同データベース', 70, { sub: '名前を文字で再構成（画面の写しではありません）' })) + bar(78), { bg: K.kinariL }));
L('L079', F(abs('left:0;right:0;top:200px;display:flex;justify-content:center;gap:50px;z-index:10', Array.from({ length: 4 }, () => `<div style="width:300px;height:380px;background:${K.card};border:3px solid ${K.ink};padding:40px 30px;box-shadow:0 4px 10px rgba(0,0,0,.1)">${[80, 60, 90, 70, 50].map(w => `<div style="height:14px;width:${w}%;background:#B7AC99;border-radius:7px;margin-bottom:28px"></div>`).join('')}</div>`).join('')) + bar(79) + tp(`かごめかごめの質問：少なくとも<span style="color:#B8860B;font-size:1.3em">4件</span>`, 'plain', { size: 54, html: true }), { bg: K.kinariL }));
L('L080', F(abs('inset:0;transform:scale(1.3);transform-origin:80% 98%', bar(80, { hi: ['lib2008', 'lib2012', 'lib2022'] })) + tp('2008年 安城市／2012年 香川県立図書館／2022年 足立区\n（データベースの表示）', 'plain', { size: 46, top: 220 }), { bg: K.kinariL }));
L('L081', F(center(rec('2012年 香川県立図書館の事例', 64, { mi: true, sub: '歌詞に込められた暗号について書かれた本は' })) + bar(81, { hi: ['lib2012'] }) + tp('「暗号の本は？」', 'q', { size: 50 }), { bg: K.kinariL }));
L('L082', F(scene('spines') + abs('left:0;right:0;top:120px;display:flex;justify-content:center;z-index:10', rec('暗号：記述なし', 60)) + bar(82) + IMG('イメージ（イラスト）', { dark: false }) + tp('参考図書に「暗号」の記述なし、と紹介', 'plain', { size: 54 })));
L('L083', F(center(`<div style="font-size:96px;font-weight:900;color:${K.ink}">事典の説明は？</div>`) + bar(83), { bg: K.kinariL }));
L('L084', F(scene('light') + kageBar(84) + IMG('イメージ（再現ではありません）') + tp('『日本大百科全書』：神寄せの遊びに元がある、と紹介', 'ai', { size: 48 }), dk));
L('L085', F(center(`<div style="font-size:60px;font-weight:900;color:${K.ink};text-align:center;line-height:1.5"><span style="border-bottom:6px solid ${K.ai}">図書館の回答：神降ろし的な遊びが<br>起源と考えられる、と紹介</span></div>`) + bar(85), { bg: K.kinariL }));
L('L086', F(abs('inset:0;transform:scale(1.3);transform-origin:35% 99%', bar(86, { hi: ['ai'] })) + tp('怖い噂ではなく、民俗学の説明', 'ai', { size: 56, top: 260 }), { bg: K.kinariL }));
L('L087', F(scene('ring') + kageBar(87) + IMG() + abs('left:0;right:0;top:120px;display:flex;justify-content:center;z-index:20', `<span style="font-size:44px;font-weight:900;background:${K.hai};color:#fff;padding:6px 26px;border-radius:6px">推測</span>`), dk));
L('L088', F(bar(88, { mode: 'b' }), { bg: K.kinariL }));
// ---- 第5章 10:51〜12:15（年表を画面下40%に大きく。テロップは上から20〜40%） ----
const top5 = (t, k = 'plain', size = 48) => tp(t, k, { size, top: 230 });
L('L089a', chapNo('第5章', '年表と箱を、端から見直す', 89));
L('L089', F(bar(89, { mode: 'b' })));
L('L090', F(bar(90, { mode: 'b', hi: ['edo', 'author'] }) + top5('左側＝記録：江戸後期には遊びがあった（図書館の回答）\n作者欄は空白', 'plain', 46)));
L('L091', F(bar(91, { mode: 'b', hi: ['meiji', 'yamanaka', 'y1941'] }) + top5('明治期の幻燈原板／山中直治の採譜／1941年 柳田国男')));
L('L092', F(bar(92, { mode: 'b', hi: ['s1998', 's1999'] }) + top5('右側＝説：今回の調べで、日付つきの怖い説・謎の説は\n2つ（1998年・1999年）', 'plain', 46)));
const box5 = (lift, labels) => box({ x: 800, y: 640, s: 1.7, n: 5, labels, lift, lf: 36, lw: 500 });
L('L093', F(box5(true, ['江戸の元の歌詞', '鶴と亀・後ろの正面はいつから']) + bar(93, { showBox: false, opacity: 0.4 }) + top5('箱の中：江戸の元の歌詞／鶴と亀・後ろの正面はいつから', 'plain', 46)));
L('L094', F(box5(false, ['遊女・身売り説', '囚人説', '埋蔵金説', '1998年より前のこと']) + bar(94, { showBox: false, opacity: 0.4 }) + top5('各説の生まれた時期／1998年より前のこと')));
L('L095', F(abs('inset:0;transform:scale(1.7);transform-origin:2% 92%', bar(95, { mode: 'b', onlyLeft: true })) + top5('年表のいちばん古い端には')));
L('L096', F(abs('inset:0;transform:scale(1.7);transform-origin:2% 92%', bar(96, { mode: 'b', onlyLeft: true, hi: ['author'] })) + top5('遊びの記録と、作者欄の「空白」')));
L('L097', F(bar(97, { mode: 'b', hi: ['author'] }) + `<svg style="position:absolute;inset:0;z-index:12" width="1920" height="1080"><path d="M1640 690 Q900 380 230 860" stroke="${K.kaki}" stroke-width="5" stroke-dasharray="16 12" fill="none"/></svg>` +
  [[1450, 560, -10], [1150, 470, 8], [820, 470, -6], [520, 560, 10]].map(([x, y, r]) => abs(`left:${x}px;top:${y}px;z-index:13`, fuda('　', 30, { rot: r }))).join('') + top5('空白に、後から意味が流し込まれた？', 'suisoku', 50)));
L('L098', F(abs('inset:0;transform:scale(.92);transform-origin:45% 100%', bar(98, { mode: 'b', margin: true })) + top5('歌が古くても、怖い意味が本当だとは限りません。', 'plain', 54)));
// ---- まとめ 12:15〜13:30 ----
L('L099', F(abs('inset:0;transform:translateY(-330px)', bar(99))));
const miniBar = (at, o = {}) => abs('inset:0;transform:scale(.8);transform-origin:50% 100%;opacity:.8', bar(at, o));
const mapC = (o = {}) => abs(`left:0;right:0;top:${o.top ?? 20}px;display:flex;justify-content:center;z-index:8`, japan({ w: o.w ?? 960, op: o.op ?? 1 }));
L('L100', F(mapC() + mapNote() + miniBar(100) + tp('あなたの地域の歌詞は？', 'q', { size: 50, bottom: 190 })));
L('L101', F(mapC({ op: 0.8 }) + mapNote() + abs('left:110px;top:230px;z-index:10', word('鶴と亀がすべった', 58)) + abs('right:120px;top:380px;z-index:10', word('後ろの正面', 58)) + miniBar(101) + tp('鶴と亀？ 別の言葉？／「後ろの正面」はあった？', 'plain', { size: 50, bottom: 190 })));
L('L102', F(mapC({ op: 0.5 }) + mapNote() + ghost({ top: 300, f: 60, st: true }) + miniBar(102) + tp('「江戸の記録になかった」とする解説（未確認）', 'mikaku', { size: 50, bottom: 190 })));
L('L103', F(mapC({ op: 0.35 }) + mapNote() + bar(103, { blanks: true, glow1999: true }) + tp('あなたの地域の歌詞も、手がかり', 'plain', { size: 56, top: 260 })));
L('L104', F(abs('left:0;right:0;top:330px;display:flex;justify-content:center;z-index:10', `<svg width="240" height="380" viewBox="0 0 240 380"><path d="M120 10 V320" stroke="${K.ink}" stroke-width="14"/><path d="M40 250 L120 350 L200 250" fill="none" stroke="${K.ink}" stroke-width="14"/></svg>`) + abs('left:0;right:0;top:720px;text-align:center;font-size:34px;font-weight:900;color:#6B6358;z-index:10', '動画の下のコメント欄へ') + bar(104) + tp('コメントで「地域」と「歌詞」を\n地域は都道府県まででOK', 'plain', { size: 56, top: 110 })));
L('L105', F(abs('left:80px;top:1022px;width:1420px;height:4px;background:rgba(233,223,200,.35)', '') + abs('left:80px;bottom:62px;z-index:7', authorCard(40)) + abs('left:0;right:0;top:0;bottom:0;background:radial-gradient(circle at 12% 92%,transparent 14%,rgba(20,20,20,.75) 40%);z-index:8', ''), dk));
L('L106', F(abs('left:80px;top:1022px;width:1420px;height:4px;background:rgba(233,223,200,.15)', ''), dk));

// ===================== ショート（S01〜S08。縦の年表：下端＝江戸、上端＝現在） =====================
const SV = { x: 200, top: 400, bot: 1500 };
function vBar(o = {}) {
  const { at = 0, edo = false, tags = [], dots = false, op = 1, glowDots = false } = o;
  let h = abs(`left:${SV.x}px;top:${SV.top}px;width:6px;height:${SV.bot - SV.top}px;background:${K.ink};z-index:5`, '');
  h += abs(`left:${SV.x - 30}px;top:${SV.bot + 14}px;font-size:30px;font-weight:900;color:${K.ink};z-index:6`, '江戸') + abs(`left:${SV.x - 30}px;top:${SV.top - 52}px;font-size:30px;font-weight:900;color:${K.ink};z-index:6`, '現在');
  if (dots) [470, 540].forEach(y => { h += abs(`left:${SV.x - 13}px;top:${y}px;width:32px;height:32px;border-radius:50%;background:${K.kaki};${glowDots ? 'box-shadow:0 0 26px 10px rgba(200,116,58,.55)' : ''};z-index:7`, ''); });
  if (edo) h += abs(`left:${SV.x - 9}px;top:${SV.bot - 60}px;width:24px;height:24px;border-radius:50%;background:${K.ink};z-index:6`, '') + abs(`left:${SV.x + 50}px;top:${SV.bot - 110}px;display:flex;gap:24px;align-items:center;z-index:7`, rec('江戸後期', 46, { mi: true }) + authorCard(40));
  tags.forEach(([y, t]) => { h += abs(`left:${SV.x - 9}px;top:${y + 26}px;width:24px;height:24px;border-radius:50%;background:${K.kaki};z-index:6`, '') + abs(`left:${SV.x + 50}px;top:${y}px;z-index:7`, fuda(t, 40, { mi: t.startsWith('1999') })); });
  return `<div style="position:absolute;inset:0;opacity:${op}">${h}</div>`;
}
const sF = (body, o = {}) => F(body, { w: 1080, h: 1920, ...o });
const stp = (t, k = 'plain', o = {}) => tp(t, k, { w: 1080, size: 56, top: 560, maxW: 860, ...o });
const sTags = ['1998年 本で紹介された解釈', '1999年 聞き取りの記録'];
S('S01', sF(vBar({ dots: true, glowDots: true }) + abs('left:0;right:0;top:640px;display:flex;justify-content:center;z-index:20', `<div style="text-align:center;background:rgba(247,242,230,.92);border-radius:12px;padding:20px 30px;margin-left:120px"><div style="font-size:50px;font-weight:900;color:${K.ink};line-height:1.4">今回の調べで、<br>日付までたどれたのは</div><div style="font-size:80px;font-weight:900;color:${K.ink}">「<span style="font-size:200px;color:${K.ki};-webkit-text-stroke:4px ${K.ink};paint-order:stroke;line-height:1.1">2</span>つ」</div></div>`)));
S('S02', sF(vBar({ op: 0.4 }) + abs('left:0;right:0;top:520px;display:flex;flex-direction:column;align-items:center;gap:70px;z-index:10', ['牢屋？', '埋蔵金？', '呪い？'].map((t, i) => fuda(t, 76, { rot: [-5, 4, -3][i] })).join(''))));
S('S03', sF(vBar() + abs('left:330px;top:620px;display:flex;flex-direction:column;align-items:flex-start;gap:50px;z-index:10', ['牢屋？', '埋蔵金？', '呪い？'].map((t, i) => fuda(t, 56, { rot: -4 })).join('')) + `<svg style="position:absolute;left:230px;top:700px;z-index:11" width="120" height="300" viewBox="0 0 120 300"><path d="M100 20 Q20 150 60 280" stroke="${K.kaki}" stroke-width="6" stroke-dasharray="12 10" fill="none"/></svg>` + stp('生まれた順に並べると？', 'plain', { top: 430 })));
S('S04', sF(vBar({ edo: true }) + stp('江戸後期：遊びがあった\n（図書館の回答）／作者：不明', 'plain', { top: 640, size: 54 })));
S('S05', F(scene('kinari') + vBar({ edo: true, tags: [[440, sTags[0]], [560, sTags[1]]] }), { w: 1080, h: 1920, bg: K.kinariL }));
S('S06', sF(vBar({ edo: true, tags: [[440, '1998年'], [560, '1999年']], op: 0.45 }) + box({ x: 330, y: 1020, s: 1.6, n: 2, labels: ['遊女説', '埋蔵金説'], H: 1920, lf: 44 }) + stp('それ以前は不明\n遊女説・埋蔵金説：初出不明', 'plain', { top: 400, size: 52 })));
S('S07', sF(abs('inset:0;transform:scale(.88);transform-origin:20% 50%', vBar({ edo: true, tags: [[440, '1998年'], [560, '1999年']] }) + box({ x: 560, y: 1200, s: 1.2, n: 5, H: 1920 })) + stp('歌が古くても、\n怖い意味が本当だとは\n限りません。', 'plain', { top: 720, size: 60 })));
S('S08', sF(abs('left:60px;right:0;top:330px;display:flex;justify-content:center;z-index:4', japan({ w: 960 })) + vBar({ op: 0.3, edo: true }) + mapNote({ css: 'left:300px;top:1130px', size: 26 }) + stp('あなたの地域の歌詞は？\n年表の全体は本編で', 'plain', { top: 1190, size: 56 })));

// ===================== サムネ（演出 8章の案1〜3。1280×720） =====================
const tStroke = (t, size, col = K.ink, extra = '') => `<div style="font-weight:900;font-size:${size}px;line-height:1.1;color:${col};${extra}">${t}</div>`;
// 案1（決定）：作者欄は空白
const miniRing = () => { const r = ring({ cx: 960, cy: 700, rx: 330, ry: 60, scale: 0.75 }); return `<svg width="500" height="281" viewBox="560 420 800 450"><defs>${duskDefs}</defs><rect x="560" y="420" width="800" height="450" rx="30" fill="url(#dusk)"/>${r.shadow}${r.back}${crouch(950, 705, 0.75)}${r.front}</svg>`; };
T('thumb_1_作者欄は空白', F(abs('left:60px;top:210px;z-index:5', `<div style="background:${K.card};border:5px solid ${K.ink};padding:38px 50px;box-shadow:0 8px 20px rgba(60,40,20,.18)"><div style="font-weight:900;font-size:92px;color:${K.ink};white-space:nowrap">作者：<span style="display:inline-block;width:250px;border-bottom:4px dotted rgba(43,39,35,.5)">&nbsp;</span></div></div>`) +
  abs('left:64px;top:46px;z-index:6', tStroke('作者欄は空白', 112)) + abs('left:76px;top:470px;z-index:6', `<div style="font-size:44px;font-weight:900;color:${K.kaki}">かごめかごめの年表</div>`) +
  abs('right:30px;bottom:30px;z-index:5;border-radius:24px;overflow:hidden', miniRing()) + abs('left:70px;bottom:44px;width:560px;height:5px;background:' + K.ink, ''), { w: 1280, h: 720 }));
// 案2：初出不明だらけ
T('thumb_2_初出不明だらけ', F(box({ x: 460, y: 250, s: 1.2, overflow: true, H: 720 }) + abs('left:30px;top:30px;width:300px;z-index:6', `<div style="height:4px;background:${K.ink};margin-top:60px"></div><div style="position:absolute;left:170px;top:20px">${fuda('', 18)}</div><div style="position:absolute;left:210px;top:20px">${fuda('', 18)}</div>`) +
  abs('left:0;right:0;top:530px;text-align:center;z-index:7', tStroke('初出不明だらけ', 112)) + abs('right:40px;top:40px;z-index:7', `<div style="font-size:40px;font-weight:900;color:${K.kaki}">かごめかごめの怖い説</div>`), { w: 1280, h: 720 }));
// 案3：怖い説を年表に
T('thumb_3_怖い説を年表に', F(abs('left:60px;top:300px;width:1160px;height:5px;background:' + K.line, '') +
  [[700, 250, -4], [800, 250, 3]].map(([x, y, r]) => abs(`left:${x}px;top:${y}px`, fuda('', 40, { rot: r }))).join('') +
  [[760, 360, 12], [860, 420, -18], [940, 470, 25], [1010, 400, -8], [880, 520, 30], [1060, 500, -20], [980, 560, 14]].map(([x, y, r]) => abs(`left:${x}px;top:${y}px;opacity:.9`, fuda('', 36, { rot: r }))).join('') +
  box({ x: 1040, y: 600, s: 0.65, n: 3, dark: true }) + abs('left:60px;top:360px;z-index:6', tStroke('怖い説を<br>年表に', 110, '#F4EFE4')) + abs('left:64px;top:80px;z-index:6', `<div style="font-size:46px;font-weight:900;color:${K.kaki}">かごめかごめ</div>`), { w: 1280, h: 720, dark: true }));

await render(jobs);
console.log(jobs.length, 'images');
