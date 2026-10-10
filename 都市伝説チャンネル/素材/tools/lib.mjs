// 動画素材（画像）を HTML/SVG から PNG に書き出す共通ライブラリ。
// 生成AIは使わない。すべてコードで描く自作素材（権利は本人）。
import { createRequire } from 'module';
import { fileURLToPath, pathToFileURL } from 'url';
import path from 'path';
import fs from 'fs';
const require = createRequire(import.meta.url);
const { chromium } = require('/opt/node-tools/node_modules/playwright');

const HERE = path.dirname(fileURLToPath(import.meta.url));
const FONTS = path.resolve(HERE, '../fonts');

export const fontCSS = () => `
@font-face{font-family:'NSJ';font-weight:500;src:url('${pathToFileURL(path.join(FONTS,'NotoSansJP-Medium.ttf'))}')}
@font-face{font-family:'NSJ';font-weight:900;src:url('${pathToFileURL(path.join(FONTS,'NotoSansJP-Black.ttf'))}')}
@font-face{font-family:'NSerif';font-weight:700;src:url('${pathToFileURL(path.join(FONTS,'NotoSerifJP-Bold.ttf'))}')}
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;overflow:hidden}
body{font-family:'NSJ',sans-serif;font-weight:500;color:#F2F2F2}
`;

// ---- 7セグ表示（自作。フォントを使わずに SVG で描く） ----
const SEG = { a:[1,0,1,0], b:[2,1,0,1], c:[2,3,0,1], d:[1,4,1,0], e:[0,3,0,1], f:[0,1,0,1], g:[1,2,1,0] };
const DIGITS = {'0':'abcdef','1':'bc','2':'abged','3':'abgcd','4':'fgbc','5':'afgcd','6':'afgedc','7':'abc','8':'abcdefg','9':'abcdfg','-':'g','?':'abg',' ':''};
export function seg7(text, { h = 100, on = '#F2F2F2', off = 'rgba(255,255,255,0.07)', glow = true } = {}) {
  const w = h * 0.55, t = h * 0.1, gap = h * 0.12;
  let x = 0, parts = [];
  for (const ch of text) {
    if (ch === ':' || ch === '.') {
      const r = t * 0.6, cx = x + t;
      if (ch === ':') parts.push(`<circle cx="${cx}" cy="${h*0.32}" r="${r}" fill="${on}"/><circle cx="${cx}" cy="${h*0.68}" r="${r}" fill="${on}"/>`);
      else parts.push(`<circle cx="${cx}" cy="${h-r}" r="${r}" fill="${on}"/>`);
      x += t * 2 + gap * 0.6; continue;
    }
    if (ch === '?') { parts.push(`<text x="${x + w / 2}" y="${h * 0.9}" text-anchor="middle" font-family="NSJ" font-weight="900" font-size="${h * 1.05}" fill="${on}">?</text>`); x += w + gap; continue; }
    const lit = DIGITS[ch] ?? '';
    for (const [k, [sx, sy, horiz]] of Object.entries(SEG)) {
      const px = x + (sx === 0 ? 0 : sx === 1 ? t * 0.5 : w - t);
      const py = sy * (h / 4) - (horiz ? t / 2 : 0) + (sy === 0 ? t / 2 : sy === 4 ? -t / 2 : 0);
      let d;
      if (horiz) { const L = w - t * 1.2; const X = x + t * 0.6, Y = py; d = `M${X} ${Y+t/2} l${t/2} ${-t/2} h${L-t} l${t/2} ${t/2} l${-t/2} ${t/2} h${-(L-t)} z`; }
      else { const top = sy === 1 ? t * 0.6 : h / 2 + t * 0.3, L = h / 2 - t * 0.9; const X = px; d = `M${X+t/2} ${top} l${t/2} ${t/2} v${L-t} l${-t/2} ${t/2} l${-t/2} ${-t/2} v${-(L-t)} z`; }
      parts.push(`<path d="${d}" fill="${lit.includes(k) ? on : off}"/>`);
    }
    x += w + gap;
  }
  const W = x - gap;
  const filt = glow ? `<filter id="gl"><feGaussianBlur stdDeviation="${h*0.03}" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${h}" viewBox="0 0 ${W} ${h}" style="overflow:visible"><defs>${filt}</defs><g ${glow?'filter="url(#gl)"':''} transform="skewX(-6) translate(${h*0.05},0)">${parts.join('')}</g></svg>`;
}

// フィルムの粒子（写実に見せないため全体にかける）
export const grain = (op = 0.18) => `<svg style="position:absolute;inset:0;width:100%;height:100%;mix-blend-mode:overlay;opacity:${op}" xmlns="http://www.w3.org/2000/svg"><filter id="gr"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/></filter><rect width="100%" height="100%" filter="url(#gr)"/></svg>`;

// 書き出し。jobs = [{ out, w, h, html, transparent }]
export async function render(jobs) {
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  for (const j of jobs) {
    await page.setViewportSize({ width: j.w, height: j.h });
    await page.setContent(`<!doctype html><html><head><meta charset="utf-8"><style>${fontCSS()}</style></head><body style="${j.transparent ? 'background:transparent' : ''}">${j.html}</body></html>`, { waitUntil: 'load' });
    await page.evaluate(() => document.fonts.ready);
    fs.mkdirSync(path.dirname(j.out), { recursive: true });
    await page.screenshot({ path: j.out, omitBackground: !!j.transparent });
    console.log('wrote', path.relative(process.cwd(), j.out));
  }
  await browser.close();
}
