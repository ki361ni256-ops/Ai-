// 画面部品（テロップ・カウンター・札・時間軸など）。チャンネル共通ルール（04_演出.md 2章）に合わせる。
import { seg7, grain } from './lib.mjs';

export const C = {
  white: '#F2F2F2', cyan: '#7FD3FF', yellow: '#FFD84D', gray: '#9AA0A6', purple: '#B48CFF',
  green: '#7BE0A0', orange: '#FF7A45', red: '#E5484D', amber: '#E8A84A',
  navy: '#0B1A2A', teal: '#12343B', black: '#0A0A0A', year: '#101C2E', light: '#F4F7FA', lightBlue: '#DCEBF5', line: '#4A7BA6',
};

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');

// 画面全体（16:9 または 9:16）
export function frame({ bg = C.navy, body = '', grainOp = 0.12, w = 1920, h = 1080 }) {
  return `<div style="position:relative;width:${w}px;height:${h}px;background:${bg};overflow:hidden">${body}${grainOp ? grain(grainOp) : ''}</div>`;
}
export const abs = (css, inner) => `<div style="position:absolute;${css}">${inner}</div>`;

// 時刻カウンター（左上）。text 例 '2004.01.08 23:14' / 二枠は year を渡す
export function counter({ time = '23:14', date = '', year = null, stopped = false, light = false, x = 64, y = 48, h = 54, center = false }) {
  const on = light ? '#111' : C.white;
  const band = light ? 'rgba(255,255,255,0.85)' : 'rgba(0,0,0,0.45)';
  const t = `<div style="display:flex;align-items:center;gap:${h * 0.3}px;padding:${h * 0.22}px ${h * 0.35}px;background:${band};border-radius:6px;${stopped ? `outline:3px solid ${C.red};` : ''}">${date ? seg7(date, { h: h * 0.45, on, off: 'transparent' }) : ''}${seg7(time, { h, on: time.includes('?') ? C.gray : on, off: light ? 'rgba(0,0,0,0.06)' : undefined })}</div>`;
  const yr = year ? `<div style="display:flex;align-items:center;gap:${h * 0.25}px;padding:${h * 0.22}px ${h * 0.35}px;background:${band};border-radius:6px"><span style="font-weight:900;font-size:${h * 0.38}px;color:${on};letter-spacing:.1em">YEAR</span>${seg7(String(year), { h, on, off: light ? 'rgba(0,0,0,0.06)' : undefined })}</div>` : '';
  return abs(`${center ? 'left:0;right:0;justify-content:center;' : `left:${x}px;`}top:${y}px;display:flex;gap:16px;z-index:5`, t + yr);
}

// テロップ。kind: fact / theory / unknown / fiction / opinion / caution / plain / red
export function telop(text, kind = 'plain', { size = 54, bottom = 120, src = '', w = 1920 } = {}) {
  const lab = { fact: '報道', theory: '説', unknown: '未確認', fiction: '創作', opinion: '考察', caution: '注意' }[kind];
  const col = { fact: C.white, theory: C.yellow, unknown: C.gray, fiction: C.purple, opinion: C.green, caution: C.white, plain: C.white, red: C.red }[kind];
  let box = `color:${col};font-weight:900;font-size:${size}px;line-height:1.35;text-shadow:0 0 4px #000,0 0 4px #000,0 3px 10px rgba(0,0,0,.8);padding:8px 26px;text-align:center;`;
  if (kind === 'fact') box += `border-bottom:6px solid ${C.cyan};`;
  if (kind === 'unknown') box += `border:3px dashed ${C.gray};border-radius:10px;background:rgba(0,0,0,.35);`;
  if (kind === 'caution') box += `background:${C.orange};border-radius:10px;text-shadow:none;color:#fff;`;
  if (kind === 'opinion') box += `background:rgba(123,224,160,.14);border-left:10px solid ${C.green};`;
  const label = lab && kind !== 'caution' ? `<div style="display:inline-block;font-size:${size * 0.42}px;font-weight:900;color:#111;background:${col === C.white ? C.cyan : col};padding:2px 12px;border-radius:4px;margin-bottom:10px">${lab}</div><br>` : '';
  const s = src ? `<div style="font-size:${size * 0.4}px;color:rgba(242,242,242,.6);margin-top:8px;font-weight:500">${esc(src)}</div>` : '';
  return abs(`left:0;right:0;bottom:${bottom}px;display:flex;justify-content:center;z-index:6`, `<div style="max-width:${w - 240}px;text-align:center">${label}<div style="${box}display:inline-block">${esc(text).replace(/\n/g, '<br>')}</div>${s}</div>`);
}

// 中央の大きな文字
export function bigText(text, { size = 110, color = C.white, font = 'NSJ', top = null, weight = 900 } = {}) {
  const pos = top == null ? 'top:0;bottom:0;' : `top:${top}px;`;
  return abs(`left:0;right:0;${pos}display:flex;align-items:center;justify-content:center;text-align:center;z-index:4`, `<div style="font-family:${font};font-weight:${weight};font-size:${size}px;color:${color};line-height:1.3;text-shadow:0 4px 20px rgba(0,0,0,.6)">${esc(text).replace(/\n/g, '<br>')}</div>`);
}

// 荷札（白=確認済／黄=要確認／灰=不明）
export function tag(kind, { size = 30 } = {}) {
  const m = { ok: [C.white, '確認済'], check: [C.yellow, '要確認'], unknown: [C.gray, '不明'] }[kind];
  return `<span style="display:inline-flex;align-items:center;gap:8px;background:${m[0]};color:#111;font-weight:900;font-size:${size}px;padding:4px 16px 4px 12px;clip-path:polygon(14px 0,100% 0,100% 100%,14px 100%,0 50%);padding-left:26px;position:relative"><span style="width:${size * 0.32}px;height:${size * 0.32}px;border-radius:50%;background:#0A0A0A;position:absolute;left:12px"></span>${m[1]}</span>`;
}

// 付箋
export const sticky = (n, size = 56) => `<span style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;background:#FFF6C8;color:#111;font-weight:900;font-size:${size * 0.6}px;transform:rotate(-4deg);box-shadow:0 4px 10px rgba(0,0,0,.4)">${n}</span>`;

// 章タイトル
export function chapter({ no, time, title, light = false }) {
  const fg = light ? '#111' : C.white;
  return frame({ bg: light ? C.light : C.black, grainOp: light ? 0 : 0.1, body:
    abs('left:120px;top:110px', `<div style="font-size:44px;font-weight:900;color:${light ? C.line : C.amber};letter-spacing:.2em">${esc(no)}</div>`) +
    abs('left:0;right:0;top:0;bottom:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:40px',
      (time ? `<div style="display:flex;align-items:center;gap:22px;color:${fg};font-size:90px;font-weight:900">【${time.split('→').map((t, i) => (i ? '<span style="margin:0 10px">→</span>' : '') + (/^[\d:?]+$/.test(t) ? seg7(t, { h: 100, on: fg, off: 'transparent' }) : `<span>${esc(t)}</span>`)).join('')}】</div>` : '') +
      `<div style="font-size:96px;font-weight:900;color:${fg}">${esc(title)}</div>`) });
}

// 縦の時間軸。items: [{t:'23:14', label, kind, tag, sticky, glow}]、blanks: 下に続く空欄数
export function vAxis({ items = [], blanks = 0, x = 330, top = 170, gap = 120, whiteBelow = null, light = false, labelW = 900 }) {
  const fg = light ? '#111' : C.white;
  let html = '', y = top;
  const rows = [];
  for (const it of items) { rows.push({ ...it, y }); y += it.gapAfter ?? gap; }
  for (let i = 0; i < blanks; i++) { rows.push({ blank: true, y }); y += gap * 0.8; }
  const endY = y - gap * 0.4;
  html += abs(`left:${x}px;top:${top - 30}px;width:6px;height:${endY - top + 30}px;background:${light ? '#333' : 'rgba(242,242,242,.75)'}`, '');
  if (whiteBelow != null) html += abs(`left:0;right:0;top:${whiteBelow}px;bottom:0;background:linear-gradient(#fff,#fff 60%,rgba(255,255,255,.92));`, '');
  for (const r of rows) {
    if (r.blank) { html += abs(`left:${x - 150}px;top:${r.y - 26}px;width:130px;height:52px;border:3px dashed ${C.gray};border-radius:8px`, '') + abs(`left:${x - 9}px;top:${r.y - 9}px;width:24px;height:24px;border-radius:50%;border:3px dashed ${C.gray}`, ''); continue; }
    const col = r.t && r.t.includes('?') ? C.gray : fg;
    html += abs(`left:${x - 13}px;top:${r.y - 13}px;width:32px;height:32px;border-radius:50%;background:${col};${r.glow ? `box-shadow:0 0 30px 10px ${C.amber}` : ''}`, '');
    if (r.t) html += abs(`right:${1920 - x + 40}px;top:${r.y - 30}px`, seg7(r.t, { h: 60, on: col, off: 'transparent' }));
    const lc = { fact: fg, theory: C.yellow, unknown: C.gray, fiction: C.purple }[r.kind || 'fact'];
    html += abs(`left:${x + 60}px;top:${r.y - 30}px;max-width:${labelW}px;display:flex;align-items:center;gap:18px;font-size:42px;font-weight:900;color:${lc}`,
      (r.sticky ? sticky(r.sticky, 52) : '') + `<span>${esc(r.label || '')}</span>` + (r.tag ? tag(r.tag, { size: 30 }) : ''));
  }
  return html;
}

// 横の年表。pins: [{y:2014, text, kind, tag, label}]、range [2004,2025]
export function yearLine({ pins = [], active = null, y = 820, x0 = 160, x1 = 1760, light = false, range = [2004, 2025], showTicks = [2004, 2014, 2018, 2020, 2022, 2025] }) {
  const fg = light ? '#111' : C.white;
  const X = (yr) => x0 + (x1 - x0) * (yr - range[0]) / (range[1] - range[0]);
  let html = abs(`left:${x0}px;top:${y}px;width:${x1 - x0}px;height:5px;background:${light ? '#333' : 'rgba(242,242,242,.7)'}`, '');
  for (const t of showTicks) html += abs(`left:${X(t) - 60}px;top:${y + 26}px;width:120px;text-align:center`, seg7(String(t), { h: 30, on: t === active ? C.amber : fg, off: 'transparent', glow: t === active }));
  pins.forEach((p, i) => {
    const px = X(p.y), col = { fact: fg, theory: C.yellow, unknown: C.gray, fiction: C.purple }[p.kind || 'fact'];
    const up = p.up ?? (i % 2 === 0 ? 1 : 2);
    const hgt = 70 + up * 90;
    html += abs(`left:${px - 3}px;top:${y - hgt}px;width:6px;height:${hgt}px;background:${col};opacity:.8`, '');
    html += abs(`left:${px - 12}px;top:${y - 10}px;width:26px;height:26px;border-radius:50%;background:${col}`, '');
    const near = px > 1920 - 520;
    const pos = near ? `right:${1920 - px - 20}px;justify-content:flex-end;` : `left:${Math.max(px - 20, 40)}px;`;
    html += abs(`${pos}top:${y - hgt - 60}px;max-width:500px;font-size:30px;font-weight:900;color:${col};line-height:1.25;display:flex;gap:10px;align-items:center;flex-wrap:wrap`,
      `<span>${esc(p.text)}</span>` + (p.tag ? tag(p.tag, { size: 24 }) : '') + (p.label ? `<span style="font-size:22px;background:${C.purple};color:#111;padding:2px 8px;border-radius:4px">${esc(p.label)}</span>` : ''));
  });
  return html;
}

// 自作アイコン（フラット）
export const icon = {
  book: (s = 120, c = C.white) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M10 20 Q30 12 50 22 Q70 12 90 20 V82 Q70 74 50 84 Q30 74 10 82 Z" fill="none" stroke="${c}" stroke-width="5"/><path d="M50 22 V84" stroke="${c}" stroke-width="5"/></svg>`,
  tv: (s = 120, c = C.white) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect x="8" y="22" width="84" height="56" rx="6" fill="none" stroke="${c}" stroke-width="5"/><path d="M38 8 L50 22 L62 8" fill="none" stroke="${c}" stroke-width="5"/><path d="M30 90 H70" stroke="${c}" stroke-width="5"/></svg>`,
  film: (s = 120, c = C.white) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect x="12" y="18" width="76" height="64" rx="4" fill="none" stroke="${c}" stroke-width="5"/>${[26, 42, 58, 74].map(y => `<rect x="17" y="${y - 3}" width="7" height="6" fill="${c}"/><rect x="76" y="${y - 3}" width="7" height="6" fill="${c}"/>`).join('')}</svg>`,
  ticket: (s = 120, c = C.white) => `<svg width="${s}" height="${s * 0.55}" viewBox="0 0 100 55"><path d="M4 4 H96 V20 A7 7 0 0 0 96 34 V51 H4 V34 A7 7 0 0 0 4 20 Z" fill="none" stroke="${c}" stroke-width="4"/></svg>`,
  anime: (s = 120, c = C.white) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect x="10" y="20" width="80" height="60" rx="8" fill="none" stroke="${c}" stroke-width="5"/><path d="M42 38 L64 50 L42 62 Z" fill="${c}"/></svg>`,
  pen: (s = 80, c = C.white) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M70 10 L90 30 L38 82 L14 88 L20 64 Z" fill="none" stroke="${c}" stroke-width="5"/></svg>`,
  person: (s = 90, c = C.white) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="30" r="16" fill="none" stroke="${c}" stroke-width="5"/><path d="M20 90 Q50 50 80 90" fill="none" stroke="${c}" stroke-width="5"/></svg>`,
  battery: (lvl, s = 260) => `<svg width="${s}" height="${s * 0.5}" viewBox="0 0 100 50"><rect x="3" y="5" width="86" height="40" rx="6" fill="none" stroke="${C.white}" stroke-width="4"/><rect x="90" y="17" width="7" height="16" rx="2" fill="${C.white}"/>${Array.from({ length: lvl }, (_, i) => `<rect x="${9 + i * 26}" y="11" width="22" height="28" rx="2" fill="${lvl === 1 ? C.red : C.white}"/>`).join('')}</svg>`,
};

// 架空の掲示板風画面（本文はダミーバーのみ）
export function bbs({ title = '', blur = 0, w = 1920, h = 1080, nameSwap = null }) {
  const bars = (n, seed) => Array.from({ length: n }, (_, i) => `<div style="height:16px;border-radius:8px;background:rgba(242,242,242,.22);width:${55 + ((seed * 37 + i * 23) % 40)}%;margin-top:14px"></div>`).join('');
  const card = (i) => `<div style="background:#14263A;border-radius:18px;padding:26px 30px;margin-bottom:22px"><div style="display:flex;gap:16px;align-items:center;font-size:26px;color:rgba(242,242,242,.55)"><span style="color:${C.cyan}">${i + 1}</span><span>${nameSwap && i === 0 ? nameSwap : '名無し'}</span><span>2004/01/08</span></div>${bars(2 + (i % 2), i)}</div>`;
  return `<div style="position:absolute;inset:0;background:#0D1B2A;padding:${title ? 150 : 80}px ${w > h ? 360 : 70}px 0;filter:blur(${blur}px)">${title ? abs(`left:0;right:0;top:50px;text-align:center;font-size:${w > h ? 40 : 34}px;font-weight:900;color:${C.white}`, esc(title)) : ''}${Array.from({ length: 6 }, (_, i) => card(i)).join('')}</div>`;
}

// 投稿者 ⇄ 住人（丸と線の記号）
export function exchange({ dimBubbles = false, onlyRight = false }) {
  const b = (side, i) => abs(`${side}:${side === 'left' ? 420 : 420}px;top:${260 + i * 150}px;width:520px;height:90px;border-radius:45px;background:rgba(242,242,242,${dimBubbles ? .08 : .2});display:flex;flex-direction:column;justify-content:center;padding:0 40px;gap:14px`, `<div style="height:12px;width:80%;border-radius:6px;background:rgba(242,242,242,.35)"></div><div style="height:12px;width:55%;border-radius:6px;background:rgba(242,242,242,.35)"></div>`);
  let html = abs('left:150px;top:380px;text-align:center;font-size:34px;font-weight:900', `${icon.person(160)}<br>投稿者`) + abs('right:150px;top:380px;text-align:center;font-size:34px;font-weight:900', `${icon.person(160)}${icon.person(120)}<br>スレッドの住人`);
  [0, 1, 2, 3].forEach(i => { if (onlyRight && i % 2 === 0) return; html += b(i % 2 ? 'right' : 'left', i); });
  if (dimBubbles) html += abs('left:0;right:0;top:470px;text-align:center;font-size:120px;color:' + C.amber, '⇄');
  return html;
}
