// 八尺様：動画用の画像をすべて書き出す（node build.mjs）
// 04_演出.md のカット表（長尺 L01〜L50・ショート S01〜S07）とサムネ案 A/B/C に対応。生成AIは使わない自作素材。
// 共通ツール（素材/tools）は import して使うだけで変更しない。この回専用の背景・部品はこのファイルの中に書く。
// 一部だけ書き出すとき：ONLY=L2 node build.mjs（出力パスに含まれる文字で絞る）
import path from 'path';
import { fileURLToPath } from 'url';
import { render } from '../../../素材/tools/lib.mjs';
import { C, frame, abs } from '../../../素材/tools/parts.mjs';

// 八尺様の回専用の背景イラスト（コードで描く自作。生成AIは使わない）
// 画風：影絵・切り絵・水彩のにじみ・墨のにじみ。写真のように見せない。
// 八尺様は「顔のない、輪郭がにじむ影」だけ。帽子・ワンピースの形は描かない（G01 のつばの影だけは演出書の指定）。
// 実在の場所に見えないよう、地名・看板・特徴のある山の形・実在の建物は入れない。
let _u = 0;
const U = (p = 'f') => `${p}${++_u}`;

// viewBox 付きの SVG。vertical=true なら 1920x1080 の絵から cx を中心に 9:16 を切り出す
const SV = (inner, { vertical = false, cx = 960, w = 1920, h = 1080 } = {}) => {
  const vb = vertical ? `${cx - 304} 0 608 1080` : `0 0 ${w} ${h}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%">${inner}</svg>`;
};
const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };

// フィルター
const fRough = (id, s = 10, f = 0.02, seed = 1) => `<filter id="${id}" x="-5%" y="-5%" width="110%" height="110%"><feTurbulence type="fractalNoise" baseFrequency="${f}" numOctaves="3" seed="${seed}" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${s}" xChannelSelector="R" yChannelSelector="G"/></filter>`;
const fBlur = (id, sd = 6) => `<filter id="${id}" x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="${sd}"/></filter>`;
// 紙の繊維
const fPaper = (id, op = 0.16) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".75 .05" numOctaves="2" seed="5"/><feColorMatrix values="0 0 0 0 .25  0 0 0 0 .22  0 0 0 0 .16  ${op} 0 0 0 -.02"/></filter>`;
// 水彩のむら（色は rgb 0〜1）
const fBlotch = (id, [r, g, b] = [0.2, 0.2, 0.2], op = 0.35, seed = 7, freq = 0.005) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="4" seed="${seed}"/><feColorMatrix values="0 0 0 0 ${r}  0 0 0 0 ${g}  0 0 0 0 ${b}  ${op * 2} 0 0 0 ${-op * 0.7}"/></filter>`;
const texture = (w = 1920, h = 1080, { paper = 0.16, blotch = [0.15, 0.2, 0.2], bop = 0.3, seed = 7 } = {}) => {
  const p = U('pp'), b = U('bl');
  return `<defs>${fPaper(p, paper)}${fBlotch(b, blotch, bop, seed)}</defs><rect width="${w}" height="${h}" filter="url(#${b})"/><rect width="${w}" height="${h}" filter="url(#${p})"/>`;
};
const vign = (w = 1920, h = 1080, op = 0.45) => { const v = U('vg'); return `<defs><radialGradient id="${v}" cx=".5" cy=".5" r=".75"><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity="${op}"/></radialGradient></defs><rect width="${w}" height="${h}" fill="url(#${v})"/>`; };

// ---------- 影の人型（顔・髪・服の形なし。輪郭がにじむ） ----------
function cr(pts) {
  const n = pts.length; let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6], c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + 'Z';
}
function figGeom(cx, base, H, drop = 0, stoop = 0) {
  const sx = stoop * 0.12;
  const raw = [[0.028 + sx * 0.75, -0.872], [0.104 + sx * 0.5, -0.815 + drop], [0.126 + sx * 0.3, -0.62 + drop * 0.5], [0.117, -0.43], [0.09, -0.39], [0.098, -0.14], [0.11, 0], [-0.11, 0], [-0.098, -0.14], [-0.09, -0.39], [-0.117, -0.43], [-0.128 + sx * 0.2, -0.62 + drop * 0.5], [-0.11 + sx * 0.3 - stoop * 0.05, -0.75 + drop * 0.6], [-0.1 + sx * 0.5, -0.815 + drop], [-0.028 + sx * 0.75, -0.872]];
  return {
    body: cr(raw.map(([x, y]) => [cx + x * H, base + y * H])),
    head: { cx: cx + sx * 1.05 * H, cy: base + (-0.932 + stoop * 0.05 + drop * 0.5) * H, rx: 0.047 * H, ry: 0.06 * H },
  };
}
// white: 0〜1（白い服の色。下から染まる・形はぼかす）、tone: 'white' | 'gray'
function figure({ cx, base, H, drop = 0, stoop = 0, fill = '#10171B', white = 0, tone = 'white', op = 1, glow = false, q = false }) {
  const g = figGeom(cx, base, H, drop, stoop);
  const hz = U('hz'), halo = U('ha'), m = U('mk'), mg = U('mg'), wg = U('wg'), wb = U('wb'), gl = U('gl');
  const shape = (f, extra = '') => `<path d="${g.body}" fill="${f}" ${extra}/><ellipse cx="${g.head.cx}" cy="${g.head.cy}" rx="${g.head.rx}" ry="${g.head.ry}" fill="${f}" ${extra}/>`;
  const wc = tone === 'white' ? '#F2EEE3' : '#C9C8C0';
  let s = `<defs>
    <filter id="${hz}" x="-20%" y="-10%" width="140%" height="120%"><feTurbulence type="fractalNoise" baseFrequency="${(0.9 / H * 12).toFixed(4)} ${(1.6 / H * 12).toFixed(4)}" numOctaves="3" seed="4" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${H * 0.024}" xChannelSelector="R" yChannelSelector="G" result="d"/><feGaussianBlur in="d" stdDeviation="${H * 0.005}"/></filter>
    ${fBlur(halo, H * 0.025)}${fBlur(wb, H * 0.014)}${fBlur(gl, H * 0.012)}
    <linearGradient id="${mg}" gradientUnits="userSpaceOnUse" x1="0" y1="${base - H}" x2="0" y2="${base}"><stop offset="0" stop-color="#fff"/><stop offset=".84" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>
    <mask id="${m}" maskUnits="userSpaceOnUse" x="${cx - H}" y="${base - H * 1.2}" width="${H * 2}" height="${H * 1.4}"><rect x="${cx - H}" y="${base - H * 1.2}" width="${H * 2}" height="${H * 1.4}" fill="url(#${mg})"/></mask>
    <linearGradient id="${wg}" gradientUnits="userSpaceOnUse" x1="0" y1="${base}" x2="0" y2="${base - 0.86 * H}"><stop offset="0" stop-color="${wc}" stop-opacity="${0.92 * white}"/><stop offset=".75" stop-color="${wc}" stop-opacity="${0.8 * white}"/><stop offset="1" stop-color="${wc}" stop-opacity="0"/></linearGradient>
  </defs><g opacity="${op}" mask="url(#${m})">`;
  s += `<g filter="url(#${halo})" opacity=".35">${shape(fill)}</g>`;
  s += `<g filter="url(#${hz})">${shape(fill)}</g>`;
  if (white > 0) s += `<path d="${g.body}" fill="url(#${wg})" filter="url(#${wb})"/>`;
  if (glow) s += `<g filter="url(#${gl})"><path d="${g.body}" fill="none" stroke="#F2C94C" stroke-width="${H * 0.006}" opacity=".9"/><ellipse cx="${g.head.cx}" cy="${g.head.cy}" rx="${g.head.rx}" ry="${g.head.ry}" fill="none" stroke="#F2C94C" stroke-width="${H * 0.006}" opacity=".9"/></g>`;
  s += `</g>`;
  if (glow) { // 頭の上の部分／口元の音の波形
    const hx = g.head.cx, hy = g.head.cy - g.head.ry;
    s += `<ellipse cx="${hx}" cy="${hy - H * 0.01}" rx="${H * 0.045}" ry="${H * 0.018}" fill="#F2C94C" opacity=".4" filter="url(#${gl})"/>`;
    const wx = hx + g.head.rx + H * 0.025, wy = g.head.cy + g.head.ry * 0.35;
    s += [0.35, 0.7, 1, 0.6, 0.85, 0.4].map((a, i) => `<rect x="${wx + i * H * 0.012}" y="${wy - a * H * 0.02}" width="${H * 0.006}" height="${a * H * 0.04}" rx="${H * 0.003}" fill="#F2C94C"/>`).join('');
  }
  if (q) { const hx = g.head.cx, hy = g.head.cy - g.head.ry; s += `<text x="${hx}" y="${hy - H * 0.035}" text-anchor="middle" font-family="NSJ" font-weight="900" font-size="${H * 0.11}" fill="#F2C94C" stroke="#111" stroke-width="${H * 0.006}" paint-order="stroke">？</text>`; }
  return s;
}
const figBg = (w = 1920, h = 1080) => { const g = U('fb'); return `<defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6F807D"/><stop offset="1" stop-color="#8E9A93"/></linearGradient></defs><rect width="${w}" height="${h}" fill="url(#${g})"/>` + texture(w, h, { blotch: [0.18, 0.24, 0.24], bop: 0.32, seed: 11 }); };
// 3体（真っすぐ／肩が少し落ちる／背を丸めかける）
const THREE = [{ cx: 560, drop: 0, stoop: 0 }, { cx: 960, drop: 0.03, stoop: 0.16 }, { cx: 1360, drop: 0.055, stoop: 0.45 }];

// ---------- 背景 ----------
const wall = (o = {}) => {
  const r = U('r'), r2 = U('r'), b = U('b'), sky = U('k'), sun = U('s'), bc = U('b');
  const bx = o.bx ?? 1100, R = rnd(3);
  let trees = 'M-40 700 ', trees2 = 'M-40 700 ';
  for (let x = -40; x <= 1980; x += 70) { trees += `Q${x + 35} ${500 - R() * 110} ${x + 70} ${555 + R() * 40} `; trees2 += `Q${x + 35} ${585 - R() * 50} ${x + 70} ${600 + R() * 20} `; }
  trees += 'L1980 700Z'; trees2 += 'L1980 700Z';
  const tiles = Array.from({ length: 50 }, (_, i) => `<path d="M${i * 40} 614 v34" stroke="#1C272D" stroke-width="5"/>`).join('');
  const brim = o.noBrim ? '' : `<g filter="url(#${bc})"><ellipse cx="${bx - 260}" cy="597" rx="170" ry="15" fill="#1A242C" opacity=".14"/><ellipse cx="${bx}" cy="597" rx="175" ry="16" fill="#1A242C" opacity=".88"/><ellipse cx="${bx - 8}" cy="578" rx="66" ry="24" fill="#1A242C" opacity=".82"/></g>`;
  return `<defs><linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#93ACA6"/><stop offset=".55" stop-color="#E2DBC8"/><stop offset="1" stop-color="#EEE7D4"/></linearGradient>
    <radialGradient id="${sun}" cx=".18" cy=".12" r=".6"><stop offset="0" stop-color="#FFF8E6" stop-opacity=".95"/><stop offset="1" stop-color="#FFF8E6" stop-opacity="0"/></radialGradient>
    ${fRough(r, 10, 0.025, 2)}${fRough(r2, 6, 0.04, 5)}${fBlur(b, 18)}<filter id="${bc}" x="-50%" y="-200%" width="200%" height="500%"><feGaussianBlur stdDeviation="16 4"/></filter></defs>
    <rect width="1920" height="1080" fill="url(#${sky})"/><rect width="1920" height="1080" fill="url(#${sun})"/>
    <g filter="url(#${b})" opacity=".45"><ellipse cx="1300" cy="200" rx="320" ry="50" fill="#fff"/><ellipse cx="500" cy="300" rx="260" ry="40" fill="#fff"/></g>
    <path d="${trees}" fill="#7E9993" opacity=".7" filter="url(#${r})"/><path d="${trees2}" fill="#5E7B75" opacity=".55" filter="url(#${r})"/>
    <rect x="-20" y="640" width="1960" height="270" fill="#A89878" filter="url(#${r2})"/>${Array.from({ length: 24 }, (_, i) => `<path d="M${i * 84 + 20} 660 v240" stroke="#9A8A6B" stroke-width="3" opacity=".5"/>`).join('')}<rect x="-20" y="890" width="1960" height="18" fill="#7E705A"/>
    <g filter="url(#${b})" opacity=".5"><ellipse cx="300" cy="780" rx="200" ry="60" fill="#A99B80"/><ellipse cx="1250" cy="840" rx="300" ry="50" fill="#A99B80"/><ellipse cx="1700" cy="720" rx="160" ry="50" fill="#B0A388"/></g>
    <path d="M-20 650 L1940 650 L1940 628 L1920 612 L0 612 L-20 628Z" fill="#2B3A42" filter="url(#${r2})"/>${tiles}
    <rect x="-20" y="650" width="1960" height="30" fill="#000" opacity=".16" filter="url(#${b})"/>
    <rect x="-20" y="905" width="1960" height="180" fill="#E6DECA"/><path d="M-20 905 L1940 905 L1940 990 L-20 955Z" fill="#56676C" opacity=".35" filter="url(#${r})"/>
    ${brim}`;
};

const scenes = {
  // G01 塀と、塀の上を横切る帽子のつばの影だけ（影の本体は見えない）
  G01: (o = {}) => SV(wall(o) + texture(1920, 1080, { blotch: [0.3, 0.35, 0.33], bop: 0.22 }), { cx: o.bx ?? 1100, ...o }),
  // G02 架空の古い日本家屋（特定の地域に見えない）
  G02: (o = {}) => { const r = U('r'), r2 = U('r'), b = U('b'), sky = U('k');
    const beams = [560, 690, 820, 950, 1080, 1210, 1346].map(x => `<rect x="${x}" y="560" width="14" height="240" fill="#4A3B2E"/>`).join('');
    const doors = Array.from({ length: 9 }, (_, i) => `<path d="M${600 + i * 80} 660 V790" stroke="#8E806A" stroke-width="4"/>`).join('') + [700, 745].map(y => `<path d="M600 ${y} H1320" stroke="#8E806A" stroke-width="3"/>`).join('');
    const tileL = Array.from({ length: 8 }, (_, i) => `<path d="M${590 - i * 15} ${392 + i * 22} H${1330 + i * 15}" stroke="#2F3A41" stroke-width="3"/>`).join('');
    return SV(`<defs><linearGradient id="${sky}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#C9D8D2"/><stop offset=".7" stop-color="#EADFC6"/></linearGradient>${fRough(r, 12, 0.02, 3)}${fRough(r2, 5, 0.05, 8)}${fBlur(b, 14)}</defs>
    <rect width="1920" height="1080" fill="url(#${sky})"/>
    <path d="M-50 640 Q400 520 900 600 T1980 560 L1980 800 L-50 800Z" fill="#9DB3AA" opacity=".5" filter="url(#${b})"/>
    <path d="M-50 680 Q600 600 1100 650 T1980 640 L1980 820 L-50 820Z" fill="#B5C4B6" opacity=".55" filter="url(#${b})"/>
    <g filter="url(#${r})" fill="#6E8B81"><circle cx="420" cy="480" r="120"/><circle cx="540" cy="400" r="110"/><circle cx="1400" cy="420" r="120"/><circle cx="1520" cy="500" r="110"/><circle cx="960" cy="330" r="90" opacity=".6"/></g>
    <g filter="url(#${r2})"><polygon points="470,560 1450,560 1330,372 590,372" fill="#3E4B53"/>${tileL}<rect x="600" y="352" width="720" height="22" fill="#2B353B"/>
    <rect x="560" y="560" width="800" height="240" fill="#E4DCC8"/>${beams}<rect x="560" y="596" width="800" height="12" fill="#4A3B2E"/>
    <rect x="600" y="660" width="720" height="130" fill="#CFC5AE"/>${doors}
    <rect x="520" y="790" width="880" height="22" fill="#4A3B2E"/></g>
    <rect x="560" y="560" width="800" height="44" fill="#000" opacity=".22" filter="url(#${b})"/><rect x="520" y="812" width="880" height="30" fill="#2E2A26" opacity=".55"/>
    <rect y="840" width="1920" height="240" fill="#C8C6A6"/>
    <g filter="url(#${r})" fill="#5F7E70"><ellipse cx="300" cy="840" rx="220" ry="80"/><ellipse cx="1640" cy="850" rx="240" ry="80"/><ellipse cx="130" cy="900" rx="160" ry="70" fill="#56736A"/></g>` + texture(1920, 1080, { blotch: [0.4, 0.33, 0.25], bop: 0.25 }), o); },
  // G04 暗い廊下の奥（人影なし）
  G04: (o = {}) => { const b = U('b'), r = U('r'), gl = U('g');
    const X = (i) => 900 * (1 - Math.pow(0.72, i));
    let shoji = '';
    for (let i = 0; i < 9; i++) { const x0 = X(i) + 6, x1 = X(i + 1) - 6; const yt = (x) => x * 440 / 900 + 40 * (1 - x / 900), yb = (x) => 1080 - x * 480 / 900 - 60 * (1 - x / 900);
      shoji += `<polygon points="${x0},${yt(x0)} ${x1},${yt(x1)} ${x1},${yb(x1)} ${x0},${yb(x0)}" fill="#3A4954" opacity="${0.75 - i * 0.07}"/>`;
      const xm = (x0 + x1) / 2; shoji += `<path d="M${xm} ${yt(xm)} L${xm} ${yb(xm)}" stroke="#1A242C" stroke-width="${Math.max(1, 5 - i * 0.5)}"/>`;
      for (const f of [0.25, 0.5, 0.75]) shoji += `<path d="M${x0} ${yt(x0) + (yb(x0) - yt(x0)) * f} L${x1} ${yt(x1) + (yb(x1) - yt(x1)) * f}" stroke="#1A242C" stroke-width="${Math.max(1, 4 - i * 0.4)}"/>`; }
    const posts = Array.from({ length: 8 }, (_, i) => { const x = 1920 - 860 * (1 - Math.pow(0.72, i)); return `<path d="M${x} ${(1920 - x) * 440 / 860} L${x} ${1080 - (1920 - x) * 480 / 860}" stroke="#0A0806" stroke-width="${Math.max(2, 22 - i * 3)}"/>`; }).join('');
    const boards = Array.from({ length: 13 }, (_, i) => `<path d="M${i * 160} 1080 L${900 + i * 160 / 1920 * 160} 600" stroke="#2A241F" stroke-width="3"/>`).join('');
    return SV(`<defs>${fBlur(b, 30)}${fRough(r, 6, 0.04, 9)}<radialGradient id="${gl}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#C9D3D6" stop-opacity=".45"/><stop offset="1" stop-color="#C9D3D6" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="#0E161D"/><polygon points="0,0 1920,0 1060,440 900,440" fill="#141E26"/>
    <polygon points="0,1080 1920,1080 1060,600 900,600" fill="#1E1A17"/>${boards}
    <polygon points="0,0 900,440 900,600 0,1080" fill="#1A242C"/><g filter="url(#${r})">${shoji}</g>
    <polygon points="1920,0 1060,440 1060,600 1920,1080" fill="#15100D"/>${posts}
    <rect x="900" y="440" width="160" height="160" fill="#05080B"/><circle cx="980" cy="540" r="150" fill="url(#${gl})"/>` + vign(1920, 1080, 0.55) + texture(1920, 1080, { blotch: [0.05, 0.08, 0.1], bop: 0.3 }), o); },
  // G05 新聞紙を貼った窓とお札・盛り塩の部屋（人物なし）
  G05: (o = {}) => { const b = U('b'), r = U('r'), lamp = U('l'), R = rnd(21);
    let news = ''; for (let i = 0; i < 6; i++) { const x = 770 + (i % 3) * 128 + R() * 10, y = 300 + Math.floor(i / 3) * 150 + R() * 10; news += `<g transform="rotate(${(R() - 0.5) * 6} ${x + 70} ${y + 80})"><rect x="${x}" y="${y}" width="140" height="160" fill="#B9B4A6"/>${Array.from({ length: 9 }, (_, j) => `<rect x="${x + 12}" y="${y + 14 + j * 16}" width="${60 + R() * 60}" height="5" fill="#8A857A" opacity=".6"/>`).join('')}</g>`; }
    const fuda = (x, y, sk = 0) => `<g transform="translate(${x} ${y}) skewY(${sk})"><rect width="34" height="120" fill="#D9D2BF"/><circle cx="17" cy="26" r="8" fill="none" stroke="#5A554C" stroke-width="3"/><path d="M17 42 V100 M9 70 H25" stroke="#5A554C" stroke-width="3"/></g>`;
    const salt = (x, y, s = 1) => `<g transform="translate(${x} ${y}) scale(${s})"><ellipse cx="0" cy="0" rx="36" ry="10" fill="#C9C6BC"/><path d="M-20 -2 L0 -40 L20 -2Z" fill="#EEEDE6"/></g>`;
    const tat = [860, 960].map(y => `<path d="M0 ${y} H1920" stroke="#2F3529" stroke-width="6"/>`).join('') + [-400, 0, 400].map(dx => `<path d="M${960 + dx * 0.9} 770 L${960 + dx * 2.6} 1080" stroke="#2F3529" stroke-width="6"/>`).join('');
    return SV(`<defs>${fBlur(b, 20)}${fRough(r, 6, 0.04, 4)}<radialGradient id="${lamp}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E8B86A" stop-opacity=".5"/><stop offset="1" stop-color="#E8B86A" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="#101820"/><polygon points="0,0 1920,0 1540,180 380,180" fill="#141B21"/>
    <rect x="380" y="180" width="1160" height="590" fill="#26313A"/><polygon points="0,0 380,180 380,770 0,1080" fill="#1B242C"/><polygon points="1920,0 1540,180 1540,770 1920,1080" fill="#1B242C"/>
    <polygon points="380,770 1540,770 1920,1080 0,1080" fill="#4A5440"/>${tat}
    <rect x="740" y="270" width="440" height="350" fill="#C8D2D6" opacity=".25" filter="url(#${b})"/><rect x="755" y="285" width="410" height="320" fill="#3D474D"/><g filter="url(#${r})">${news}</g>
    ${fuda(560, 320)}${fuda(1320, 320)}${fuda(190, 420, 25)}${fuda(1700, 470, -25)}
    ${salt(420, 790, 0.8)}${salt(1500, 790, 0.8)}${salt(170, 1020, 1.3)}${salt(1750, 1020, 1.3)}
    <circle cx="1400" cy="700" r="300" fill="url(#${lamp})"/><rect x="1370" y="640" width="60" height="90" rx="4" fill="#D9B77A" opacity=".85"/>` + vign(1920, 1080, 0.5) + texture(1920, 1080, { blotch: [0.05, 0.08, 0.1], bop: 0.3 }), o); },
  // G07 空の額縁（札の文字は編集で入れる）
  G07: (o = {}) => { const b = U('b'), sp = U('s'), R = rnd(31), ins = U('i');
    const dust = Array.from({ length: 50 }, () => `<circle cx="${700 + R() * 520}" cy="${R() * 900}" r="${1 + R() * 2.5}" fill="#fff" opacity="${0.08 + R() * 0.2}"/>`).join('');
    return SV(`<defs>${fBlur(b, 30)}<radialGradient id="${sp}" cx=".5" cy=".42" r=".5"><stop offset="0" stop-color="#E9E2D0" stop-opacity=".22"/><stop offset="1" stop-color="#E9E2D0" stop-opacity="0"/></radialGradient><linearGradient id="${ins}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#D3CDBE"/><stop offset="1" stop-color="#B9B3A4"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="#1B2329"/><polygon points="860,0 1060,0 1400,1080 520,1080" fill="#D8D2C2" opacity=".07" filter="url(#${b})"/><rect width="1920" height="1080" fill="url(#${sp})"/>
    <rect x="712" y="212" width="520" height="560" fill="#000" opacity=".35" filter="url(#${b})"/>
    <rect x="700" y="200" width="520" height="560" fill="#5B4A36"/><rect x="726" y="226" width="468" height="508" fill="#3E3226"/><rect x="744" y="244" width="432" height="472" fill="#6E5B44"/><rect x="766" y="266" width="388" height="428" fill="url(#${ins})"/>
    ${[[700, 200], [1220, 200], [700, 760], [1220, 760]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="16" fill="#6E5B44"/>`).join('')}
    <rect x="880" y="792" width="160" height="62" fill="#D8D1BE"/><circle cx="892" cy="804" r="4" fill="#777"/><circle cx="1028" cy="804" r="4" fill="#777"/>${dust}` + vign(1920, 1080, 0.5) + texture(1920, 1080, { blotch: [0.08, 0.1, 0.11], bop: 0.35 }), o); },
  // G08a 背の高い影（1体）
  G08a: (o = {}) => SV(figBg() + figure({ cx: o.cx ?? 960, base: 1010, H: 860, ...(o.fig || {}) }), o),
  // G08b 同じ影が3通り（白は付けない）
  G08b: (o = {}) => SV(figBg() + THREE.map(t => figure({ ...t, base: 980, H: 780 })).join(''), o),
  // G09 閉じた和綴じ本と窓（表紙に文字なし）
  G09: (o = {}) => { const b = U('b'), c = U('c'), r = U('r'), sk = U('k');
    const lat = [1380, 1440, 1500].map(x => `<path d="M${x} 130 V630" stroke="#2A2118" stroke-width="6"/>`).join('') + [230, 330, 430, 530].map(y => `<path d="M1330 ${y} H1560" stroke="#2A2118" stroke-width="6"/>`).join('');
    const grain = Array.from({ length: 12 }, (_, i) => `<path d="M0 ${720 + i * 30} Q960 ${690 + i * 32} 1920 ${660 + i * 34}" stroke="#3A2717" stroke-width="3" opacity=".6"/>`).join('');
    return SV(`<defs>${fBlur(b, 22)}${fRough(r, 6, 0.03, 6)}<radialGradient id="${c}" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#F3C27A" stop-opacity=".55"/><stop offset="1" stop-color="#F3C27A" stop-opacity="0"/></radialGradient><linearGradient id="${sk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2F4A50"/><stop offset="1" stop-color="#7E8C80"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="#1A120C"/>
    <rect x="1320" y="120" width="480" height="520" fill="url(#${sk})"/><path d="M1580 520 Q1680 490 1800 510 L1800 640 L1580 640Z" fill="#26332F" opacity=".8"/>
    <rect x="1320" y="120" width="250" height="520" fill="#6B5F4E" opacity=".92"/>${lat}<rect x="1300" y="100" width="520" height="560" fill="none" stroke="#120C08" stroke-width="40"/>
    <path d="M0 700 L1920 640 L1920 1080 L0 1080Z" fill="#4A3220"/>${grain}
    <circle cx="380" cy="560" r="460" fill="url(#${c})"/><rect x="368" y="560" width="24" height="70" fill="#E9DFC8"/><ellipse cx="380" cy="545" rx="10" ry="20" fill="#FFE2A8"/>
    <g filter="url(#${r})"><polygon points="640,810 1170,780 1200,822 662,858" fill="#D9CBAA"/><polygon points="620,720 1130,700 1170,780 640,810" fill="#7D5B3A"/>
    ${Array.from({ length: 5 }, (_, i) => `<circle cx="${650 + i * 2}" cy="${735 + i * 16}" r="4" fill="#3A2717"/>`).join('')}<path d="M660 722 L684 806" stroke="#5E432A" stroke-width="5"/></g>
    <ellipse cx="900" cy="860" rx="320" ry="26" fill="#000" opacity=".35" filter="url(#${b})"/>` + vign(1920, 1080, 0.55) + texture(1920, 1080, { blotch: [0.15, 0.1, 0.05], bop: 0.3 }), o); },
  // G10 和紙（文字は編集で載せる）
  G10: (o = {}) => { const w = o.w ?? 1920, h = o.h ?? 1080, b = U('b'), fb = U('fb');
    return SV(`<defs>${fBlur(b, 60)}<filter id="${fb}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".004 .09" numOctaves="3" seed="12"/><feColorMatrix values="0 0 0 0 .55  0 0 0 0 .5  0 0 0 0 .4  .5 0 0 0 -.18"/></filter></defs>
    <rect width="${w}" height="${h}" fill="#EEE7D6"/><rect width="${w}" height="${h}" filter="url(#${fb})"/>
    <g filter="url(#${b})" fill="#3A342A" opacity=".1"><circle cx="0" cy="0" r="${w * 0.12}"/><circle cx="${w}" cy="${h}" r="${w * 0.14}"/><circle cx="${w * 0.95}" cy="${h * 0.05}" r="${w * 0.06}"/></g>` + texture(w, h, { paper: 0.12, blotch: [0.45, 0.38, 0.25], bop: 0.18, seed: 3 }), { w, h, ...o }); },
  // G11 窓越しに見る遠くの村の影（特定の地域に見えない）
  G11: (o = {}) => { const b = U('b'), sk = U('k'), R = rnd(41);
    let roofs = ''; for (let i = 0; i < 16; i++) { const x = 640 + i * 42 + R() * 20, w = 40 + R() * 30, h = 18 + R() * 12, y = 640 - R() * 14; roofs += `<polygon points="${x},${y} ${x + w},${y} ${x + w * 0.8},${y - h} ${x + w * 0.2},${y - h}" fill="#1A2428"/><rect x="${x + 4}" y="${y}" width="${w - 8}" height="14" fill="#1F2B2E"/>`; }
    const trees = Array.from({ length: 14 }, () => `<circle cx="${560 + R() * 820}" cy="${615 + R() * 30}" r="${14 + R() * 18}" fill="#1E2B2C"/>`).join('');
    const stones = [600, 1390, 760, 1250].map((x, i) => `<rect x="${x}" y="${668 + (i % 2) * 18}" width="5" height="9" fill="#2A3436"/>`).join('');
    return SV(`<defs>${fBlur(b, 24)}<linearGradient id="${sk}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#26444A"/><stop offset=".6" stop-color="#6F857D"/><stop offset="1" stop-color="#A08C70"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#${sk})"/>
    <path d="M0 610 Q500 560 1000 590 T1920 580 L1920 700 L0 700Z" fill="#4F625C" opacity=".6" filter="url(#${b})"/>
    <rect y="650" width="1920" height="430" fill="#34463F"/>${Array.from({ length: 8 }, (_, i) => `<path d="M0 ${690 + i * 50} Q960 ${680 + i * 52} 1920 ${690 + i * 50}" stroke="#2B3B35" stroke-width="3"/>`).join('')}
    ${trees}${roofs}${stones}<rect y="630" width="1920" height="70" fill="#DDE3DD" opacity=".14" filter="url(#${b})"/>
    <path fill-rule="evenodd" d="M0 0 H1920 V1080 H0Z M220 120 H1700 V960 H220Z" fill="#0D0F10"/><path d="M960 120 V960 M220 540 H1700" stroke="#0D0F10" stroke-width="14"/>` + texture(1920, 1080, { blotch: [0.08, 0.12, 0.12], bop: 0.3 }), o); },
};

// 縦（1080x1920）の1体の影。k=0/1/2 は THREE の順
const figVertical = (k, extra = {}) => SV(figBg(1080, 1920) + figure({ cx: 540, base: 1540, H: 1150, drop: THREE[k].drop, stoop: THREE[k].stoop, ...extra }), { w: 1080, h: 1920 });

// =====================================================================
// ここから：画面部品とカット（04_演出.md のカット表 L01〜L50・S01〜S07、サムネ A/B/C）
// =====================================================================
const OUT = path.dirname(fileURLToPath(import.meta.url));
const jobs = [];
const L = (id, html) => jobs.push({ out: path.join(OUT, 'long', `${id}.png`), w: 1920, h: 1080, html });
const S = (id, html) => jobs.push({ out: path.join(OUT, 'short', `${id}.png`), w: 1080, h: 1920, html });
const T = (id, html) => jobs.push({ out: path.join(OUT, 'thumb', `${id}.png`), w: 1280, h: 720, html });
const B = (id, html, w = 1920, h = 1080) => jobs.push({ out: path.join(OUT, 'bg', `${id}.png`), w, h, html });

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
const Y = '#F2C94C', GW = '#CFCAC0', INK = '#1C1E20', PAPER = '#ECE5D3', NOTE = '#6A665C', TEAL = '#5E8C86';
const F = (body, o = {}) => frame({ bg: o.bg ?? '#0E1418', grainOp: o.grain ?? 0.1, w: o.w ?? 1920, h: o.h ?? 1080, body });
const scene = (k, o = {}) => scenes[k](o);
const dark = (op = 0.35) => abs(`inset:0;background:rgba(0,0,0,${op})`, '');
const IMG = abs('left:40px;bottom:26px;z-index:7', '<span style="font-size:24px;color:rgba(242,242,242,.85);text-shadow:0 0 4px #000,0 0 4px #000">※イメージ（イラスト）</span>');
const IMGv = abs('left:40px;bottom:400px;z-index:7', '<span style="font-size:28px;color:rgba(242,242,242,.85);text-shadow:0 0 4px #000,0 0 4px #000">※イメージ（イラスト）</span>');
const paperBg = (w = 1920, h = 1080, col = PAPER) => SV(`<rect width="${w}" height="${h}" fill="${col}"/>` + texture(w, h, { paper: 0.14, blotch: [0.45, 0.4, 0.3], bop: 0.16, seed: 9 }), { w, h });
const darkPaper = (w = 1920, h = 1080) => SV(`<rect width="${w}" height="${h}" fill="#1E2529"/>` + texture(w, h, { paper: 0.1, blotch: [0.05, 0.07, 0.08], bop: 0.35, seed: 13 }), { w, h });

// ---------- テロップ（04_演出.md 1章：白＋黒縁／強調＝黄／出典注記＝灰白／未確認＝札） ----------
// [[語]] は黄の強調、【未確認】は小さな「未確認」の札、\n は改行
const chip = () => `<span style="display:inline-flex;vertical-align:middle;border:3px dashed ${C.gray};border-radius:6px;padding:2px;margin:0 8px;background:rgba(20,24,28,.75);-webkit-text-stroke:0;text-shadow:none;line-height:1"><span style="background:#7E858C;color:#fff;font-size:.78em;padding:4px 12px;border-radius:3px;font-weight:900">未確認</span></span>`;
const fmt = (s) => esc(s).replace(/\[\[(.+?)\]\]/g, `<span style="color:${Y}">$1</span>`).replace(/【未確認】/g, chip()).replace(/\n/g, '<br>');
function tp(text, { size = 52, bottom = 92, top = null, src = '', color = C.white, lr = [100, 100], gray = false, z = 8 } = {}) {
  const pos = top != null ? `top:${top}px` : `bottom:${bottom}px`;
  const st = `-webkit-text-stroke:${Math.round(size * 0.14)}px #111;paint-order:stroke fill;text-shadow:0 3px 12px rgba(0,0,0,.55)`;
  const box = gray ? `border:3px dashed ${C.gray};border-radius:10px;background:rgba(12,16,20,.6);padding:6px 24px;color:#C5C8CB;` : `color:${color};`;
  const s = src ? `<div style="font-size:${Math.round(size * 0.55)}px;color:${GW};margin-top:6px;font-weight:700;-webkit-text-stroke:4px #111;paint-order:stroke fill">${esc(src)}</div>` : '';
  return abs(`left:${lr[0]}px;right:${lr[1]}px;${pos};display:flex;justify-content:center;z-index:${z}`, `<div style="text-align:center"><div style="display:inline-block;font-weight:900;font-size:${size}px;line-height:1.42;${box}${st}">${fmt(text)}</div>${s}</div>`);
}
const stp = (text, o = {}) => tp(text, { size: 64, top: 640, lr: [60, 140], ...o }); // ショート：縦30〜60%・右端10%を空ける
const maru = (s, col = Y) => `<svg width="${s * 0.9}" height="${s * 0.9}" viewBox="0 0 100 100" style="vertical-align:-0.08em;overflow:visible"><circle cx="50" cy="52" r="36" fill="none" stroke="#111" stroke-width="34"/><circle cx="50" cy="52" r="36" fill="none" stroke="${col}" stroke-width="17"/></svg>`;
// 見出し（灰白の帯に黒文字、図解の左上）
const head = (t, x = 90, y = 70, size = 34) => abs(`left:${x}px;top:${y}px;z-index:7`, `<div style="background:#D9D5CB;color:#111;font-weight:900;font-size:${size}px;padding:6px 22px;border-radius:3px;box-shadow:0 2px 8px rgba(0,0,0,.25)">${esc(t)}</div>`);
// 噂・説（点線の吹き出しに白文字）
const rumor = (t, { bottom = 96, size = 46 } = {}) => abs(`left:0;right:0;bottom:${bottom}px;display:flex;justify-content:center;z-index:8`, `<div style="border:4px dashed #E8E4DA;border-radius:46px;padding:16px 46px;background:rgba(12,16,20,.7);color:#F2F2F2;font-weight:900;font-size:${size}px">${fmt(t)}</div>`);
// 「未確認」の札（0-4）
const mk = (t, size = 30) => `<span style="display:inline-flex;align-items:stretch;border:3px dashed ${C.gray};border-radius:8px;background:rgba(18,22,26,.85);font-weight:900;font-size:${size}px;line-height:1.3;white-space:nowrap"><span style="background:#7E858C;color:#fff;padding:6px 14px;display:flex;align-items:center">未確認</span>${t ? `<span style="color:#DDD9CF;padding:6px 18px;display:flex;align-items:center">${esc(t)}</span>` : ''}</span>`;
const mkAt = (t, o = {}) => abs(`right:${o.right ?? 120}px;bottom:${o.bottom ?? 250}px;z-index:7`, mk(t, o.size ?? 30));

// ---------- チェックリスト（0-3） ----------
const ITEMS = ['とても背が高い', '白いワンピース', 'つばの広い帽子', '若い女性', '「ぽぽぽ」と笑う', '子どもを狙う', '昔から村に伝わる妖怪'];
const NUMS = ['①', '②', '③', '④', '⑤', '⑥', '⑦'];
const markSvg = (kind, s) => {
  if (kind === 'o') return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" style="position:absolute;left:0;top:0;overflow:visible"><circle cx="50" cy="51" r="34" fill="none" stroke="#6B675E" stroke-opacity=".7" stroke-width="20"/><circle cx="50" cy="51" r="34" fill="none" stroke="#FFFFFF" stroke-width="16"/></svg>`;
  if (kind === 'tri') return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" style="position:absolute;left:0;top:0;overflow:visible"><path d="M50 12 L88 84 L12 84 Z" fill="none" stroke="#222" stroke-width="18" stroke-linejoin="round"/><path d="M50 12 L88 84 L12 84 Z" fill="none" stroke="${Y}" stroke-width="10" stroke-linejoin="round"/></svg>`;
  if (kind === 'dash') return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" style="position:absolute;left:0;top:0"><path d="M14 50 H86" stroke="#555" stroke-width="16" stroke-linecap="round"/><path d="M14 50 H86" stroke="#9AA0A6" stroke-width="9" stroke-linecap="round"/></svg>`;
  if (kind === 'q') return `<span style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-family:NSerif;font-size:${s * 0.72}px;color:#8C8A83;opacity:.85">？</span>`;
  return '';
};
// 保留の札（紐で吊るした形）
const holdTag = (s = 1) => `<span style="display:inline-flex;flex-direction:column;align-items:center;vertical-align:top;flex:none;white-space:nowrap"><span style="width:${2 * s}px;height:${14 * s}px;background:#777"></span><span style="border:${3 * s}px dotted #7E858C;border-radius:${6 * s}px;background:#F5F1E6;color:#5F656B;font-weight:900;font-size:${24 * s}px;line-height:1.2;padding:${3 * s}px ${14 * s}px">保留</span></span>`;
// 2段の札（上：灰白の文字／下：「未確認」の札の見た目）
const holdTwo = (s = 1, up = '記事：特徴として挙げる', down = '元の投稿') => `<span style="display:inline-flex;flex-direction:column;align-items:flex-start;vertical-align:top;gap:${4 * s}px"><span style="display:flex;align-items:flex-start;gap:${8 * s}px">${holdTag(s)}<span style="margin-top:${14 * s}px;border:${2 * s}px solid #B9B4A8;border-radius:${5 * s}px;background:#F5F1E6;color:#6A665C;font-weight:900;font-size:${21 * s}px;line-height:1.25;padding:${3 * s}px ${10 * s}px;white-space:nowrap">${esc(up)}</span></span><span style="display:inline-flex;border:${2.5 * s}px dashed #7E858C;border-radius:${5 * s}px;background:#F5F1E6;font-weight:900;font-size:${21 * s}px;line-height:1.25;white-space:nowrap;margin-left:${2 * s}px"><span style="background:#7E858C;color:#fff;padding:${3 * s}px ${9 * s}px">未確認</span><span style="color:#5F656B;padding:${3 * s}px ${10 * s}px">${esc(down)}</span></span></span>`;
// 小さな線画アイコン（墨の線）
const ic = {
  jizo: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><circle cx="50" cy="28" r="15" fill="#E3DAC4" stroke="${c}" stroke-width="6"/><path d="M28 90 Q27 50 50 45 Q73 50 72 90 Z" fill="#E3DAC4" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M20 92 H80" stroke="${c}" stroke-width="6" stroke-linecap="round"/></svg>`,
  fuda: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect x="32" y="6" width="36" height="88" fill="#EFE9D9" stroke="${c}" stroke-width="6"/><circle cx="50" cy="28" r="8" fill="none" stroke="${c}" stroke-width="5"/><path d="M50 44 V82 M40 62 H60" stroke="${c}" stroke-width="5"/></svg>`,
  salt: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M30 70 L50 26 L70 70 Z" fill="#FBFAF4" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><ellipse cx="50" cy="76" rx="36" ry="10" fill="#E3DAC4" stroke="${c}" stroke-width="6"/></svg>`,
  scroll: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect x="20" y="30" width="60" height="40" fill="#EFE9D9" stroke="${c}" stroke-width="6"/><rect x="10" y="24" width="12" height="52" rx="6" fill="#E3DAC4" stroke="${c}" stroke-width="6"/><rect x="78" y="24" width="12" height="52" rx="6" fill="#E3DAC4" stroke="${c}" stroke-width="6"/><path d="M32 44 H68 M32 56 H58" stroke="${c}" stroke-width="4"/></svg>`,
  cal: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><rect x="16" y="20" width="68" height="70" fill="#EFE9D9" stroke="${c}" stroke-width="6"/><path d="M16 38 H84" stroke="${c}" stroke-width="6"/><path d="M34 12 V28 M66 12 V28" stroke="${c}" stroke-width="6" stroke-linecap="round"/></svg>`,
  talk: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M12 22 H88 V66 H46 L28 84 L30 66 H12 Z" fill="#EFE9D9" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><path d="M28 40 H72 M28 52 H60" stroke="${c}" stroke-width="5"/></svg>`,
  house: (s = 40, c = INK) => `<svg width="${s}" height="${s}" viewBox="0 0 100 100"><path d="M10 48 L50 14 L90 48" fill="none" stroke="${c}" stroke-width="6" stroke-linejoin="round"/><rect x="22" y="46" width="56" height="42" fill="#EFE9D9" stroke="${c}" stroke-width="6"/><rect x="42" y="62" width="16" height="26" fill="${c}"/></svg>`,
};
// 紙の端をぎざぎざにする
const torn = (seed = 1) => { const r = rnd(seed); const P = []; for (let i = 0; i <= 20; i++) P.push(`${i * 5}% ${(r() * 5).toFixed(1)}px`); for (let i = 1; i <= 20; i++) P.push(`calc(100% - ${(r() * 5).toFixed(1)}px) ${i * 5}%`); for (let i = 19; i >= 0; i--) P.push(`${i * 5}% calc(100% - ${(r() * 5).toFixed(1)}px)`); for (let i = 19; i >= 1; i--) P.push(`${(r() * 5).toFixed(1)}px ${i * 5}%`); return `clip-path:polygon(${P.join(',')})`; };
const paperTexDiv = () => `<svg style="position:absolute;inset:0;width:100%;height:100%;pointer-events:none" xmlns="http://www.w3.org/2000/svg"><filter id="ctx"><feTurbulence type="fractalNoise" baseFrequency=".8 .05" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .3  0 0 0 0 .26  0 0 0 0 .18  .22 0 0 0 -.03"/></filter><rect width="100%" height="100%" filter="url(#ctx)"/></svg>`;

// o: rows, circles, ul（下線の行 0〜6）, q（鉛筆の？）, hold（0なし／1保留／2二段）, marks, notes, mkn（行の未確認の札）, cover（紙で隠す）, seven（⑦の分割 0〜4）, focus（明るく残す行）, glow6, textW
function checklist(o = {}) {
  const { W = 640, fs = 34, rh = 66, rows = 7, circles = true, ul = null, q = new Set(), hold = 0, marks = {}, notes = {}, mkn = {}, cover = new Set(), seven = 0, focus = null, glow6 = false, textW = null, holdS = 1, holdTxt = null, compact = false, rot = -0.6, ghost = 0 } = o;
  const cs = Math.round(rh * 0.7);
  let rowsHtml = '';
  for (let i = 0; i < rows; i++) {
    const op = focus ? (focus.has(i) ? 1 : 0.32) : 1;
    let circ = '';
    if (circles) {
      const glow = glow6 && i === 5 ? `box-shadow:0 0 ${cs * 0.6}px ${cs * 0.3}px rgba(255,248,225,.95);background:#FFFBEF;` : '';
      circ = `<span style="position:relative;display:inline-block;width:${cs}px;height:${cs}px;flex:none">${marks[i] ? '' : `<span style="position:absolute;inset:${cs * 0.08}px;border:${Math.max(2, cs * 0.06)}px solid #3A3A3A;border-radius:50%;${glow}"></span>`}${q.has(i) ? markSvg('q', cs) : ''}${marks[i] ? markSvg(marks[i], cs) : ''}${cover.has(i) ? `<span style="position:absolute;left:-${cs * 0.15}px;top:-${cs * 0.1}px;width:${cs * 1.3}px;height:${cs * 1.2}px;background:#D7CBAE;transform:rotate(${(i * 37) % 9 - 4}deg);box-shadow:0 2px 5px rgba(0,0,0,.35)"></span>` : ''}</span>`;
    } else circ = `<span style="display:inline-block;width:${cs}px;flex:none"></span>`;
    const txt = `<span style="font-family:NSerif;font-weight:700;font-size:${fs}px;color:${INK};white-space:nowrap;${ul === i ? `background:linear-gradient(transparent 74%, ${Y} 74%, ${Y} 92%, transparent 92%);` : ''}">${NUMS[i]}${esc(ITEMS[i])}</span>`;
    let extra = '';
    if (i === 5 && hold === 1) extra += holdTag(holdS);
    if (i === 5 && hold === 2) extra += holdTxt ? holdTwo(holdS, holdTxt[0], holdTxt[1]) : holdTwo(holdS);
    if (notes[i]) extra += `<span style="font-size:${fs * 0.66}px;color:${NOTE};font-weight:700;white-space:nowrap">${esc(notes[i])}</span>`;
    if (mkn[i]) extra += `<span style="font-size:${fs * 0.6}px">${mk(mkn[i], fs * 0.6)}</span>`;
    if (i === 6 && seven > 0) {
      const lab = (t, bg) => `<span style="flex:none;font-size:${fs * 0.58}px;font-weight:900;color:#fff;background:${bg};padding:2px 10px;border-radius:4px">${t}</span>`;
      const ms = Math.round(cs * 0.8);
      const up = seven >= 2 ? `<span style="position:relative;display:inline-block;width:${ms}px;height:${ms}px;flex:none">${markSvg('o', ms)}</span>` + (compact ? '' : `<span style="display:flex;gap:16px;align-items:center;font-size:${fs * 0.5}px;color:${NOTE};font-weight:700">${[['jizo', '村の地蔵'], ['cal', '前回の被害'], ['talk', '老婆の言い伝え']].map(([k, t]) => `<span style="display:flex;align-items:center;gap:4px">${ic[k](fs * 0.9)}${t}</span>`).join('')}</span>`) : '';
      const down = seven >= 3 ? `<span style="font-size:${fs * 0.62}px;font-weight:900;color:${INK};white-space:nowrap">記録なし${compact ? '' : '（今回の調査の範囲）'}</span>` : '';
      const dn2 = seven >= 4 && !compact ? `<div style="margin-top:6px;font-size:${fs * 0.5}px;color:${NOTE};font-weight:700;line-height:1.45">Snopes：都市伝説と位置づけ<br>江戸の「八尺の女」：似ているが起源とまでは言えない</div>` : '';
      extra = `<div style="flex:1;border:3px solid #3A3A3A;border-radius:6px;overflow:hidden;min-width:${compact ? 220 : 520}px"><div style="background:#C9DDD8;padding:${compact ? 6 : 10}px 14px;display:flex;align-items:center;gap:14px;min-height:${rh * 0.95}px">${lab('話の中', TEAL)}${up}</div><div style="border-top:3px solid #3A3A3A;background:#F4EFE2;padding:${compact ? 6 : 10}px 14px;min-height:${rh * 0.95}px"><div style="display:flex;align-items:center;gap:14px">${lab('話の外', '#7E858C')}${down}</div>${dn2}</div></div>`;
    }
    rowsHtml += `<div style="display:flex;align-items:center;gap:${fs * 0.45}px;min-height:${rh}px;opacity:${op}">${circ}<span style="${textW ? `width:${textW}px;flex:none;` : ''}display:inline-block">${txt}</span><span style="display:flex;align-items:center;gap:14px;flex-wrap:wrap">${extra}</span></div>`;
  }
  const g = ghost ? `<div style="position:absolute;inset:0;transform:translate(${ghost}px,${-ghost / 2}px) rotate(1.6deg);opacity:.28;background:${PAPER}"></div>` : '';
  return `<div style="position:relative;width:${W}px;transform:rotate(${rot}deg)">${g}<div style="position:relative;width:${W}px;background:${PAPER};padding:${rh * 0.4}px ${rh * 0.45}px;box-shadow:0 8px 26px rgba(0,0,0,.45);${torn(3)}">${paperTexDiv()}<div style="position:relative">${rowsHtml}</div></div></div>`;
}
const tsec = (s) => { const [m, x] = s.split(':'); return +m * 60 + +x; };
function resState(t) { const T = tsec(t), q = new Set(); if (T >= 405) q.add(1); if (T >= 455) q.add(2); if (T >= 470) q.add(4); return { q, hold: T >= 592 ? 2 : T >= 495 ? 1 : 0 }; }
// 右上に常駐（幅 約340px・不透明度85%）
const res = (t, ul = null) => abs('right:34px;top:28px;width:640px;transform:scale(.53);transform-origin:top right;opacity:.88;z-index:9', checklist({ ...resState(t), ul, holdS: 0.95 }));

// 章タイトル（生成りの和紙カード・黒の明朝・章番号は黄）
const card = (no, title) => F(scene('G10') + abs('inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:34px', `<div style="font-size:60px;font-weight:900;color:${Y};-webkit-text-stroke:7px #2A2620;paint-order:stroke fill;letter-spacing:.2em">${esc(no)}</div><div style="width:120px;height:5px;background:#2A2620;opacity:.6"></div><div style="font-family:NSerif;font-weight:700;font-size:92px;color:#1A1A1A;text-align:center;line-height:1.35">${esc(title).replace(/\n/g, '<br>')}</div>`), { grain: 0.06 });

// 年表（江戸〜現代／ズーム）
function timeline({ fs = 1, mode = 'wide', flag = true, blankLeft = false, y = 560, x0 = 140, x1 = 1780, label = '2008.8.26', light = false, flagX = null }) {
  const ink = light ? '#ECE5D3' : INK;
  let h = abs(`left:${x0}px;top:${y}px;width:${x1 - x0}px;height:7px;background:${ink};border-radius:4px`, '');
  let fx;
  if (mode === 'wide') {
    const X = (yr) => x0 + (x1 - x0) * (yr - 1600) / (2030 - 1600);
    [['江戸', 1610], ['明治', 1868], ['昭和', 1926], ['平成', 1989], ['現代', 2026]].forEach(([t, yr]) => { h += abs(`left:${X(yr) - 5}px;top:${y - 18}px;width:10px;height:42px;background:${ink}`, '') + abs(`left:${X(yr) - 80}px;top:${y + 40}px;width:160px;text-align:center;font-family:NSerif;font-weight:700;font-size:40px;color:${ink}`, t); });
    fx = X(2008);
    if (blankLeft) h += abs(`left:${x0}px;top:${y - 200}px;width:${fx - x0 - 20}px;height:190px;background:rgba(40,36,30,.12);border:3px dashed #9AA0A6;border-radius:8px`, '');
  } else {
    const X = (yr) => x0 + (x1 - x0) * (yr - 2000) / 10;
    for (let yr = 2000; yr <= 2010; yr += 2) h += abs(`left:${X(yr) - 4}px;top:${y - 14}px;width:8px;height:34px;background:${ink}`, '') + abs(`left:${X(yr) - 70}px;top:${y + 34}px;width:140px;text-align:center;font-weight:900;font-size:34px;color:${ink};opacity:.8`, String(yr));
    fx = X(2008.65);
  }
  if (flagX) fx = flagX;
  const flip = fx > x1 - 200;
  if (flag) h += abs(`left:${fx - 4}px;top:${y - 170 * fs}px;width:8px;height:${170 * fs + 6}px;background:${ink}`, '') + abs(`${flip ? `right:${1920 - fx - 4}px` : `left:${fx + 4}px`};top:${y - 170 * fs}px;z-index:2`, `<div style="background:${Y};color:#111;font-weight:900;font-size:${40 * fs}px;padding:${10 * fs}px ${flip ? 20 * fs : 26 * fs}px ${10 * fs}px ${flip ? 26 * fs : 20 * fs}px;clip-path:${flip ? 'polygon(0 0,100% 0,100% 100%,0 100%,12% 50%)' : 'polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)'}">${esc(label)}</div>`);
  return h;
}

// 架空の掲示板画面（灰白の地に黒。本文はぼかした無意味な線。投稿者名・日付・投稿文なし）
function bbsFake({ vertical = false, title = '' }) {
  const R = rnd(17), x = vertical ? 70 : 120, w = vertical ? 900 : 1260, top = vertical ? 330 : 150;
  const post = (i) => `<div style="background:#E8E5DD;border-radius:10px;padding:22px 26px;margin-bottom:20px"><div style="display:flex;gap:14px;align-items:center"><span style="font-weight:900;font-size:26px;color:#555">${i + 1}</span><span style="width:120px;height:14px;border-radius:7px;background:#B8B3A8"></span><span style="width:180px;height:14px;border-radius:7px;background:#C9C5BB"></span></div><div style="filter:blur(2.5px)">${Array.from({ length: 2 + (i % 3) }, () => `<div style="height:15px;border-radius:7px;background:#6E6A62;opacity:.55;margin-top:14px;width:${40 + R() * 55}%"></div>`).join('')}</div></div>`;
  return abs(`left:${x}px;top:${top}px;width:${w}px;bottom:0;background:#D6D3CB;border-radius:14px 14px 0 0;box-shadow:0 10px 40px rgba(0,0,0,.5);overflow:hidden`, `<div style="background:#B9B4A8;height:${vertical ? 120 : 92}px;display:flex;align-items:center;padding:0 30px;font-weight:900;font-size:${vertical ? 34 : 36}px;color:#111">${esc(title)}</div><div style="padding:26px">${Array.from({ length: 7 }, (_, i) => post(i)).join('')}</div>`);
}
// 表
function table({ cols, rows, widths, x = 100, y = 190, fs = 36, rowH = 92, hl = {} }) {
  const cell = (c, w, hd, extra = '') => `<div style="width:${w}px;flex:none;padding:10px 20px;display:flex;flex-direction:column;justify-content:center;min-height:${hd ? 74 : rowH}px;font-weight:900;font-size:${hd ? fs * 0.78 : fs}px;color:${hd ? '#111' : INK};border-right:2px solid #8C8578;${extra}">${c}</div>`;
  let h = `<div style="display:flex;background:#D9D5CB;border-bottom:3px solid #3A3A3A">${cols.map((c, i) => cell(esc(c), widths[i], true)).join('')}</div>`;
  rows.forEach((r, ri) => { h += `<div style="display:flex;border-bottom:2px solid #8C8578">${r.map((c, i) => cell(c, widths[i], false, hl[`${ri},${i}`] || '')).join('')}</div>`; });
  return abs(`left:${x}px;top:${y}px;background:#F4EFE2;border:3px solid #3A3A3A;box-shadow:0 6px 20px rgba(0,0,0,.25)`, h);
}
const nt = (t, fs = 22) => `<span style="font-size:${fs}px;color:${NOTE};font-weight:700">${esc(t)}</span>`;
const gr = (t) => `<span style="color:#8E8A80">${esc(t)}</span>`;
const mark = (t, col = Y) => `<span style="background:${col};padding:0 8px;border-radius:3px">${t}</span>`;

// ---------- 背景（素材単体。テロップなし。編集で自由に使う） ----------
for (const k of Object.keys(scenes)) B(k, F(scene(k), { grain: 0.08 }));
B('G01_vertical', F(scene('G01', { vertical: true }), { w: 1080, h: 1920, grain: 0.08 }), 1080, 1920);
B('G01_noBrim', F(scene('G01', { noBrim: true }), { grain: 0.08 }));
[0, 1, 2].forEach(k => B(`G08b_vertical_${k + 1}`, F(figVertical(k), { w: 1080, h: 1920, grain: 0.08 }), 1080, 1920));
B('G08b_white', F(SV(figBg() + THREE.map((t, i) => figure({ ...t, base: 980, H: 780, white: i === 0 ? 1 : 0 })).join('')), { grain: 0.08 }));
B('G08b_white_vertical', F(figVertical(0, { white: 1 }), { w: 1080, h: 1920, grain: 0.08 }), 1080, 1920);
B('G10_vertical', F(scene('G10', { w: 1080, h: 1920 }), { w: 1080, h: 1920, grain: 0.06 }), 1080, 1920);

// ---------- 0:00 あなたの八尺様チェック ----------
const G01dim = () => `<div style="position:absolute;inset:0;filter:blur(8px) brightness(.45)">${scene('G01')}</div>`;
L('L01', F(scene('G01') + tp('八尺様と聞いて、どんな姿が浮かぶ？', { size: 58 }) + IMG));
L('L02', F(G01dim() + abs('left:0;right:0;top:150px;display:flex;justify-content:center', checklist({ W: 900, fs: 52, rh: 96, rows: 3, circles: false }))));
L('L02b', F(G01dim() + abs('left:0;right:0;top:110px;display:flex;justify-content:center', checklist({ W: 900, fs: 52, rh: 96, circles: false }))));
L('L03', F(G01dim() + abs('left:0;right:0;top:40px;display:flex;justify-content:center', checklist({ W: 860, fs: 46, rh: 84 })) + tp('最初の話にあったのはどれ？／答え合わせは動画の最後で', { size: 50, bottom: 46 })));
L('L03b', F(abs('inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px', `<div style="font-family:NSerif;font-weight:700;font-size:200px;color:${PAPER};letter-spacing:.12em">八尺様</div><div style="font-size:52px;font-weight:900;color:${PAPER};opacity:.85">7つの特徴を答え合わせ</div>`), { bg: '#0B0D0E' }));
L('L03c', F(G01dim() + res('0:38')));

// ---------- 0:40 昔話の顔をした怪談 ----------
L('L04', F(scene('G02') + res('0:40') + tp('祖父母の家で起きた「体験談」の形の怪談', { src: '（現代ビジネスの紹介による）' }) + IMG));
L('L05', F(paperBg() + abs('left:120px;right:420px;top:330px;display:flex;justify-content:space-between', ['jizo', 'fuda', 'salt', 'scroll'].map(k => `<div style="width:260px;height:260px;display:flex;align-items:center;justify-content:center">${ic[k](240)}</div>`).join('')) + res('1:00') + tp('地蔵／お札／盛り塩／村の言い伝え')));
const calPad = abs('left:520px;top:200px;width:560px;height:560px', `<div style="position:absolute;inset:0;background:#E8E1CE;box-shadow:0 10px 30px rgba(0,0,0,.35)"></div><div style="position:absolute;left:0;right:0;top:0;height:70px;background:#2A2F33"></div><div style="position:absolute;left:0;right:0;top:70px;bottom:0;display:flex;align-items:center;justify-content:center;font-family:NSerif;font-weight:700;font-size:300px;color:#2A2F33">？</div><div style="position:absolute;right:0;bottom:0;width:220px;height:220px;background:linear-gradient(135deg,#F6F1E4 50%,rgba(0,0,0,.2) 50%);clip-path:polygon(100% 0,0 100%,100% 100%);"></div><div style="position:absolute;right:0;bottom:0;width:220px;height:220px;background:#CFC6AE;clip-path:polygon(100% 0,0 100%,0 0);opacity:.0"></div>`);
L('L06', F(paperBg() + calPad + res('1:15') + tp('八尺様には「誕生日」がある？')));
const twoCols = (fill = {}) => abs('left:110px;top:150px;display:flex;gap:60px', ['最初の記録', '後から広まった姿'].map((t, i) => `<div style="width:620px"><div style="background:${Y};color:#111;font-weight:900;font-size:44px;padding:10px 24px;border:3px solid #111">${t}</div><div style="height:560px;border:4px dashed #6A665C;border-top:none;background:rgba(255,255,255,.25)">${fill[i] || ''}</div></div>`).join(''));
L('L06b', F(paperBg() + twoCols() + res('1:28') + tp('八尺様には「誕生日」がある？', { bottom: 60 })));

// ---------- 1:40 第1章 ----------
L('L07a', card('第1章', '定番の八尺様を分解する'));
L('L07', F(scene('G08a') + res('1:42') + IMG));
const adult = (x, base, hgt) => `<svg style="position:absolute;left:${x - hgt * 0.16}px;top:${base - hgt}px" width="${hgt * 0.32}" height="${hgt}" viewBox="0 0 32 100"><circle cx="16" cy="9" r="8" fill="#3E4448"/><path d="M4 100 L5 26 Q16 18 27 26 L28 100 Z" fill="#3E4448"/></svg>`;
L('L08', F(paperBg() + abs('left:160px;top:780px;width:1300px;height:6px;background:#2A2620', '') + abs('left:300px;top:280px;width:210px;height:500px;border:10px solid #5A4A3A;border-bottom:none', '') + abs('left:300px;top:796px;width:210px;text-align:center;font-size:30px;font-weight:900;color:#5A4A3A', 'ドア') + adult(780, 780, 425) + abs('left:640px;top:796px;width:280px;text-align:center;font-size:30px;font-weight:900;color:#3E4448', '一般的な成人') + abs('left:1150px;top:180px;width:12px;height:600px;background:#2A2620', '') + abs(`left:1110px;top:180px;width:92px;height:10px;background:#2A2620`, '') + abs('left:220px;top:176px;width:1240px;border-top:6px dashed rgba(42,38,32,.6)', '') + abs('left:1200px;top:300px', `<div style="font-size:110px;font-weight:900;color:${Y};-webkit-text-stroke:12px #111;paint-order:stroke fill">約2.4m</div>`) + res('1:50') + tp('八尺：[[約2.4m]]')));
const sideSil = SV(figure({ cx: 1500, base: 1020, H: 700, fill: '#0A0E10' }));
L('L09', F(darkPaper() + sideSil + abs('left:160px;top:300px;width:1100px;text-align:center', `<div style="font-size:96px;font-weight:900;color:#F2F2F2">「白いワンピースの女」</div><div style="font-size:34px;color:${GW};margin-top:30px;font-weight:700">Snopes（米国のファクトチェックサイト）</div>`) + res('2:08', 1) + tp('「白いワンピースの女」／Snopes・解説本の書評でも', { size: 48 })));
L('L09b', F(darkPaper() + sideSil + abs('left:160px;top:150px;width:1100px;text-align:center', `<div style="font-size:60px;font-weight:900;color:rgba(242,242,242,.55)">「白いワンピースの女」</div><div style="font-size:80px;font-weight:900;color:#F2F2F2;margin-top:70px">Snopes・解説本の書評でも</div><div style="font-size:32px;color:${GW};margin-top:34px;font-weight:700;line-height:1.6">Snopes（米国のファクトチェックサイト）<br>書評：『21世紀日本怪異ガイド100』（朝里樹・星海社新書・2021年7月）</div>`) + res('2:18', 1) + tp('「白いワンピースの女」／Snopes・解説本の書評でも', { size: 48 })));
const popoRound = (size, col = PAPER) => `<svg width="${size * 3.4}" height="${size * 1.3}" viewBox="0 0 ${size * 3.4} ${size * 1.3}" style="overflow:visible"><text x="50%" y="${size * 1.02}" text-anchor="middle" font-family="NSJ" font-weight="900" font-size="${size}" fill="${col}" stroke="${col}" stroke-width="${size * 0.12}" stroke-linejoin="round" stroke-linecap="round" letter-spacing="${size * 0.08}">ぽぽぽ</text></svg>`;
const popoBrush = (size, col = '#A29C90') => { const f = U('ink'); return `<svg width="${size * 3.6}" height="${size * 1.4}" viewBox="0 0 ${size * 3.6} ${size * 1.4}" style="overflow:visible"><defs><filter id="${f}" x="-20%" y="-30%" width="140%" height="160%"><feTurbulence type="fractalNoise" baseFrequency=".035" numOctaves="3" seed="2" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${size * 0.09}" result="d"/><feGaussianBlur in="d" stdDeviation="${size * 0.012}" result="b"/><feGaussianBlur in="d" stdDeviation="${size * 0.05}" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="b"/></feMerge></filter></defs><text x="50%" y="${size * 1.08}" text-anchor="middle" font-family="NSerif" font-weight="700" font-size="${size}" fill="${col}" filter="url(#${f})" letter-spacing="${size * 0.12}">ぽぽぽ</text></svg>`; };
L('L10', F(scene('G04') + abs('left:0;right:0;top:380px;display:flex;justify-content:center;opacity:.92', popoRound(110)) + res('2:28', 4) + tp('家族の声をまねる（と言われる）／魅入られる', { src: '' }) + IMG));
const zoneMap = (extra = '') => { const r = U('r'); return SV(`<defs>${fRough(r, 8, 0.02, 4)}</defs><g filter="url(#${r})"><circle cx="760" cy="500" r="300" fill="rgba(94,140,134,.12)" stroke="${INK}" stroke-width="7"/><path d="M760 230 V770 M490 500 H1030" stroke="${INK}" stroke-width="3" stroke-dasharray="14 12" opacity=".6"/></g>${extra}`) + [[760, 150, '北'], [1110, 500, '東'], [760, 850, '南'], [410, 500, '西']].map(([x, y, t]) => abs(`left:${x - 50}px;top:${y - 50}px;width:100px;text-align:center`, `${ic.jizo(70)}<div style="font-family:NSerif;font-size:30px;color:${INK}">${t}</div>`)).join(''); };
L('L11', F(paperBg() + zoneMap() + res('2:45') + tp('地蔵の封印')));
L('L11b', F(scene('G05') + res('2:55') + tp('お札・盛り塩の部屋で朝まで') + IMG));
const globe = () => { const cp = U('c'), R = rnd(5); let blobs = ''; for (let i = 0; i < 7; i++) { const x = 380 + R() * 480, y = 260 + R() * 480, s = 50 + R() * 90; blobs += `<path d="M${x} ${y} q${s} ${-s * 0.4} ${s * 1.4} ${s * 0.2} q${s * 0.2} ${s * 0.7} ${-s * 0.5} ${s} q${-s} ${s * 0.1} ${-s * 0.9} ${-s * 1.2}z" fill="#A9BFA8"/>`; }
  return SV(`<defs><clipPath id="${cp}"><circle cx="620" cy="520" r="300"/></clipPath></defs><circle cx="620" cy="520" r="300" fill="#5E7F7A"/><g clip-path="url(#${cp})">${blobs}${[0.3, 0.6, 0.9].map(f => `<ellipse cx="620" cy="520" rx="${300 * f}" ry="300" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="3"/>`).join('')}<path d="M320 520 H920 M340 400 H900 M340 640 H900" stroke="#fff" stroke-opacity=".25" stroke-width="3"/></g><circle cx="620" cy="520" r="300" fill="none" stroke="${INK}" stroke-width="6"/>`); };
const bubble = (x, y, t, w = 460) => abs(`left:${x}px;top:${y}px;width:${w}px;background:#FAF7EE;border:4px solid ${INK};border-radius:30px;padding:18px 28px;font-size:40px;font-weight:900;color:${INK};text-align:center;box-shadow:0 4px 14px rgba(0,0,0,.25)`, t);
L('L12', F(paperBg() + globe() + bubble(980, 210, '子どもをさらう女') + bubble(1000, 420, 'ハロウィンの頃に<br>毎年のように', 420) + bubble(940, 660, '……', 200) + res('3:05', 5) + tp('海外では「子どもをさらう女」／Snopes：ハロウィンの頃に毎年のように出回る', { size: 44 })));
const lab = (x, y, t, lx, ly) => `<svg style="position:absolute;left:0;top:0;width:1920px;height:1080px;z-index:5" viewBox="0 0 1920 1080"><path d="M${x} ${y} L${lx} ${ly}" stroke="#F2F2F2" stroke-width="4"/><circle cx="${lx}" cy="${ly}" r="8" fill="#F2F2F2"/></svg>` + abs(`left:${x - (x < 960 ? 220 : 0)}px;top:${y - 30}px;width:220px;display:flex;justify-content:${x < 960 ? 'flex-end' : 'flex-start'};z-index:6`, `<span style="background:#F2F2F2;color:#111;font-weight:900;font-size:38px;padding:6px 20px;border-radius:6px">${t}</span>`);
L('L13', F(scene('G08a') + lab(640, 240, '帽子', 920, 200) + lab(640, 420, 'ぽぽぽ', 930, 260) + lab(1300, 360, '背丈', 1040, 360) + lab(1300, 620, '白い服', 1040, 620) + lab(640, 840, '子ども', 870, 860) + res('3:18') + tp('これが「定番の八尺様」') + IMG));
L('L13b', F('', { bg: '#000', grain: 0 }));

// ---------- 3:30 第2章 ----------
L('L14a', card('第2章', '原本にたどり着けない／\n食い違う「誕生」'));
L('L14', F(paperBg() + timeline({ mode: 'zoom', flag: false }) + res('3:33')));
L('L15', F(paperBg() + timeline({ mode: 'zoom' }) + res('3:40') + tp('[[2008年8月26日]]', { size: 64, src: '（現代ビジネスの紹介による）' })));
L('L15b', F(paperBg() + bbsFake({ title: '死ぬ程洒落にならない怖い話を集めてみない？ 196' }) + res('3:52') + tp('2ちゃんねる オカルト板「洒落怖」196スレ目', { src: '（現代ビジネスの紹介による）' })));
L('L16', F(paperBg() + timeline({ mode: 'wide' }) + res('4:05') + tp('古い妖怪ではなく「ネットの怪談」として始まったと説明されている', { size: 48 })));
const genpon = abs('left:880px;top:792px;width:160px;height:62px;display:flex;align-items:center;justify-content:center;font-family:NSerif;font-weight:700;font-size:38px;color:#2A2620', '原本');
L('L17', F(scene('G07') + genpon + res('4:20') + tp('過去ログ：たどり着けず', { gray: true }) + IMG));
const frost = abs('left:540px;top:0;width:840px;height:1080px;overflow:hidden;z-index:3', `<div style="position:absolute;left:-540px;top:0;width:1920px;height:1080px;filter:blur(9px)">${scene('G07')}</div><div style="position:absolute;inset:0;background:rgba(214,220,222,.22);border-left:3px solid rgba(255,255,255,.35);border-right:3px solid rgba(255,255,255,.35)"></div><div style="position:absolute;left:0;right:0;top:90px;text-align:center;font-size:80px;font-weight:900;color:rgba(255,255,255,.75);letter-spacing:.3em">要約</div>`);
L('L18', F(scene('G07') + genpon + frost + res('4:35') + tp('以下の「元の話」は、記事・解説の要約による') + IMG));
L('L19', F(scene('G07') + genpon + frost + abs('left:1080px;top:640px;z-index:6', mk('確かめられていない点', 44)) + res('4:48') + tp('未確認の点には札を付けます') + IMG));
const W3 = [500, 380, 360];
const cmpRows = (n, o = {}) => {
  const r = [
    ['日本語の記事・解説', o.yel ? mark('2008') : '2008', `<span style="${o.ul ? 'text-decoration:underline;text-decoration-color:rgba(28,30,32,.45);text-underline-offset:8px;text-decoration-thickness:4px' : ''}">2ちゃんねる</span>`],
    ['英語圏の解説サイト', gr('2002') + (o.only ? nt('見た中ではこの1件') : ''), gr('（未確認）')],
    ['Snopes', `2008${nt('（〜と主張する情報源がある）', 21)}`, `<span style="${o.ul ? 'text-decoration:underline;text-decoration-color:rgba(28,30,32,.45);text-underline-offset:8px;text-decoration-thickness:4px' : ''}">2chan</span>`],
    ['英語圏のブログ', '2008', gr('（未確認）')],
  ];
  return r.slice(0, n);
};
const cmpTable = (n, o) => head('比較：出典／投稿の年／掲示板の名前', 100, 70) + table({ cols: ['出典', '投稿の年', '掲示板の名前'], rows: cmpRows(n, o), widths: W3, x: 100, y: 150 });
const note98 = abs(`left:100px;top:620px;border:4px solid ${TEAL};background:rgba(201,221,216,.55);padding:12px 26px;font-weight:900;font-size:32px;color:${INK}`, '作中の時期（参考）：1998年（英語圏のブログの読み取り）');
L('L20', F(paperBg() + cmpTable(2) + res('5:00') + tp('2002年説（英語圏の解説サイト）')));
L('L21', F(paperBg() + cmpTable(3, { ul: true }) + res('5:15') + tp('Snopes：「〜と主張する情報源がある」／表記は「2chan」', { size: 48 })));
L('L22', F(paperBg() + cmpTable(4, { ul: true }) + res('5:30') + tp('投稿2008年／話の中の出来事は1998年（英語圏のブログの整理）\n※作中の時期の読み取り', { size: 44, bottom: 70 })));
L('L22b', F(paperBg() + cmpTable(4, { ul: true }) + note98 + res('5:38') + tp('投稿2008年／話の中の出来事は1998年（英語圏のブログの整理）\n※作中の時期の読み取り', { size: 44, bottom: 40 })));
L('L23', F(paperBg() + cmpTable(4, { ul: true, only: true, yel: true }) + note98 + res('5:50') + tp('今回見た英語のサイト：年・掲示板名・言い方にずれ\n日本語の記事・解説：2008年でほぼ一致', { size: 44, bottom: 40 })));
L('L24', F(abs('left:0;right:0;top:110px;display:flex;justify-content:center', checklist({ W: 860, fs: 46, rh: 84 })), { bg: '#0B1013' }));
L('L24b', F(abs('left:0;right:0;top:70px;display:flex;justify-content:center;filter:blur(1.2px)', checklist({ W: 860, fs: 46, rh: 84, rot: 2.4, ghost: 22 })) + abs('inset:0;background:radial-gradient(circle at 50% 45%,transparent 30%,rgba(0,0,0,.55) 70%)', '') + tp('元の話では、姿は「見る人によって違う」？', { size: 64, color: Y, bottom: 80 }), { bg: '#06090B' }));

// ---------- 6:25 第3章 ----------
const three = (o = {}) => SV(figBg() + THREE.map((t, i) => figure({ ...t, base: 980, H: 780, ...(o[i] || {}), ...(o.all || {}) })).join(''));
L('L25a', card('第3章', '見る人によって姿が変わる'));
L('L25', F(three() + res('6:28') + tp('若い女・中年の女・老婆', { src: '（現代ビジネスの紹介による）' }) + IMG));
L('L26', F(three({ 0: { white: 1 } }) + res('6:45', 1) + tp('白いワンピース：語り手が見た「一つの例」とされる') + IMG));
L('L27', F(three({ 0: { white: 1 }, 1: { white: 0.55, tone: 'gray' } }) + res('7:05') + tp('「白い喪服に見えた人も」という要約も') + IMG));
const glowAll = { glow: true };
L('L28', F(three({ 0: { white: 0.5, glow: true }, 1: { white: 0.3, tone: 'gray', glow: true }, 2: glowAll }) + head('記事が挙げる共通点', 90, 60) + res('7:15') + tp('①人間の女の姿 ②頭に何かを載せている ③男のような声で「ぽぽぽ」', { size: 46 }) + IMG));
L('L28b', F(three({ 0: { white: 0.5, glow: true }, 1: { white: 0.3, tone: 'gray', glow: true }, 2: glowAll }) + head('記事が挙げる共通点', 90, 60) + res('7:28') + tp('①人間の女の姿 ②頭に何かを載せている ③男のような声で「ぽぽぽ」\n【未確認】元の投稿の言葉か、記事のまとめか', { size: 44, bottom: 50 }) + IMG));
L('L29', F(three({ 0: { white: 0.5, q: true }, 1: { white: 0.3, tone: 'gray', q: true }, 2: { q: true } }) + res('7:35', 2) + tp('共通点の書き方は「頭に何か」／帽子の形：【未確認】') + IMG));
L('L30', F(abs('left:0;right:0;top:300px;display:flex;justify-content:center', popoRound(200)) + res('7:50', 4) + tp('「ぽぽぽ」は男のような声とされる'), { bg: '#0A0B0C' }));
L('L30b', F(abs('left:0;right:0;top:280px;display:flex;justify-content:center', popoBrush(210)) + res('7:58', 4) + tp('「ぽぽぽ」は男のような声とされる'), { bg: '#0A0B0C' }));
L('L31', F(paperBg() + zoneMap() + abs(`left:1120px;top:620px;font-size:46px;font-weight:900;color:${INK};background:rgba(255,255,255,.4);padding:10px 20px;border-radius:8px`, '数年から十数年に一度') + res('8:05', 5) + tp('「子どもを狙う」：元の話での書き方【未確認】')));
L('L31b', F(`<div style="position:absolute;inset:0;filter:blur(6px);opacity:.6">${paperBg()}${zoneMap()}</div>` + abs('left:0;right:0;top:60px;display:flex;justify-content:center', checklist({ W: 1000, fs: 54, rh: 100, ul: 5, hold: 1, holdS: 1.8, q: new Set([1, 2, 4]) })) + tp('「子どもを狙う」：元の話での書き方【未確認】', { bottom: 40 })));
const merged = SV(figBg() + [[900, 0.25], [1020, 0.25]].map(([cx, op]) => figure({ cx, base: 980, H: 780, drop: 0.03, stoop: 0.16, op })).join('') + figure({ cx: 960, base: 980, H: 800, white: 0.35 }));
L('L32', F(merged + res('8:25') + tp('「一つの例」が定番に固まった？／固まった時期：【未確認】') + IMG));
L('L33', F(scene('G09') + res('8:45') + tp('なぜ「昔からいる」と感じるのか\n江戸の本に、よく似た話が一つ', { size: 50, bottom: 60 }) + IMG));
L('L34', F(scene('G11') + res('8:53') + IMG));

// ---------- 9:00 第4章 ----------
const inkV = (t, size) => `<div style="display:flex;flex-direction:column;align-items:center;font-family:NSerif;font-weight:700;font-size:${size}px;line-height:1.08;color:#24211C;text-shadow:0 0 ${size * 0.06}px rgba(36,33,28,.55),0 0 ${size * 0.18}px rgba(36,33,28,.25)">${[...t].map(c => c === '「' ? '<span style="display:block;transform:rotate(90deg) translate(.25em,-.25em)">「</span>' : c === '」' ? '<span style="display:block;transform:rotate(90deg) translate(-.25em,.25em)">」</span>' : `<span>${esc(c)}</span>`).join('')}</div>`; // 縦組み（1字ずつ並べる。フォントに縦書き用の情報がないため）
const inkText = (t, size, vertical = false) => { const f = U('ink'); return `<svg width="${vertical ? size * 1.4 : size * t.length * 1.06}" height="${vertical ? size * t.length * 1.06 : size * 1.4}" style="overflow:visible"><defs><filter id="${f}" x="-10%" y="-10%" width="120%" height="120%"><feTurbulence type="fractalNoise" baseFrequency=".05" numOctaves="2" seed="7" result="n"/><feDisplacementMap in="SourceGraphic" in2="n" scale="${size * 0.05}" result="d"/><feGaussianBlur in="d" stdDeviation="${size * 0.03}" result="h"/><feMerge><feMergeNode in="h"/><feMergeNode in="d"/></feMerge></filter></defs><text ${vertical ? `x="${size * 0.7}" y="${size * 0.1}" writing-mode="vertical-rl" style="writing-mode:vertical-rl;text-orientation:upright"` : `x="0" y="${size * 1.05}"`} font-family="NSerif" font-weight="700" font-size="${size}" fill="#24211C" filter="url(#${f})">${esc(t)}</text></svg>`; };
L('L35a', card('第4章', '「昔から」はどこから来たのか'));
L('L35', F(scene('G10') + abs('left:0;right:0;top:250px;display:flex;flex-direction:column;align-items:center;gap:50px', inkText('岡田新川『秉穂録』', 96) + inkText('「身の丈八尺の女」', 110)) + abs(`left:0;right:0;top:720px;text-align:center;font-size:32px;font-weight:700;color:${NOTE}`, '（現代ビジネスの紹介による）') + res('9:03'), { grain: 0.06 }));
const W2 = [300, 520, 520];
const two = (n) => table({ cols: ['', '『秉穂録』の八尺の女', '八尺様'], widths: W2, x: 100, y: 130, fs: 36, rowH: 98, rows: [
  ['背丈', mark('身の丈八尺'), mark('八尺（約2.4m）')],
  ['声', gr('―'), '「ぽぽぽ」'],
  ['頭の載せ物', gr('―'), '頭に何かを載せる'],
  ['子ども', gr('―'), '子どもを狙う'],
  ['現れる場所', '山の中', '人の住む村の中'],
].slice(0, n) });
L('L36', F(paperBg() + two(3) + res('9:20') + tp('声・頭の載せ物・子どもを狙う点は、昔の山女の話に見られない', { size: 46, src: '（同記事の指摘）' })));
L('L36b', F(paperBg() + two(5) + res('9:33') + tp('声・頭の載せ物・子どもを狙う点は、昔の山女の話に見られない', { size: 46, src: '（同記事の指摘）', bottom: 40 })));
const bigList = (o) => abs('right:70px;top:70px', checklist({ W: 900, fs: 46, rh: 86, q: new Set([1, 2, 4]), ul: 5, ...o }));
L('L37', F(`<div style="position:absolute;inset:0;opacity:.35">${paperBg()}${two(5)}</div>` + dark(0.45) + bigList({ hold: 1, holdS: 1.5 })));
L('L37b', F(`<div style="position:absolute;inset:0;opacity:.35">${paperBg()}${two(5)}</div>` + dark(0.45) + bigList({ hold: 2, holdS: 1.25 }) + tp('記事が挙げた特徴：子どもを狙う\n元の投稿での書き方：【未確認】→⑥は保留のまま', { size: 46, bottom: 50 })));
const hdrCard = (t) => `<div style="background:#D9D5CB;border:3px solid #3A3A3A;padding:20px 34px;font-weight:900;font-size:44px;color:#111">${t}</div>`;
L('L38', F(paperBg() + abs('left:120px;right:420px;top:340px;display:flex;align-items:center;justify-content:space-between', hdrCard('『秉穂録』の八尺の女') + hdrCard('八尺様')) + abs('left:612px;top:396px;width:170px;border-top:7px dashed #8E8A80', '') + abs('left:962px;top:396px;width:170px;border-top:7px dashed #8E8A80', '') + abs('left:800px;top:330px;width:150px;text-align:center', `<span style="font-size:110px;font-weight:900;color:${Y};-webkit-text-stroke:10px #111;paint-order:stroke fill">？</span>`) + res('10:05') + rumor('「元ネタ説」：参考にした証拠は見つかっていない')));
L('L39', F(paperBg() + timeline({ mode: 'wide', blankLeft: true }) + res('10:20') + tp('「八尺様」の名がある古い記録：【未確認】')));
const twoLines = (stage, merge = false) => {
  const up = abs(`left:80px;right:440px;top:${merge ? 330 : 150}px;height:300px;border:4px solid ${TEAL};background:rgba(201,221,216,${merge ? 0.55 : 0.85});overflow:hidden`, `<div style="position:absolute;left:24px;top:16px;background:${TEAL};color:#fff;font-weight:900;font-size:32px;padding:4px 16px">物語の中の年表（話の中の時間）</div><div style="position:absolute;left:60px;right:60px;top:180px;height:6px;background:#1E3A36"></div>` + [[40, ic.jizo(64), '村の地蔵による封印', 3], [500, ic.house(64), '前回の被害：約15年前', 1], [990, ic.talk(64), '祖父母・Kの語り', 1]].filter(a => stage >= a[3]).map(([x, i, t]) => `<div style="position:absolute;left:${x}px;top:76px;display:flex;align-items:center;gap:12px;font-weight:900;font-size:36px;color:#16302C">${i}<span>${t}</span></div><div style="position:absolute;left:${x + 26}px;top:170px;width:24px;height:24px;border-radius:50%;background:#1E3A36"></div>`).join(''));
  const lo = abs(`left:80px;right:440px;top:${merge ? 400 : 520}px;height:300px;border:4px solid #3A3A3A;background:rgba(244,239,226,${merge ? 0.6 : 1})`, `<div style="position:absolute;left:24px;top:16px;background:#3A3A3A;color:#fff;font-weight:900;font-size:32px;padding:4px 16px">現実の年表（現実の時間）</div><div style="position:absolute;left:60px;right:60px;top:200px;height:6px;background:${INK}"></div><div style="position:absolute;left:1100px;top:100px;width:8px;height:106px;background:${INK}"></div><div style="position:absolute;left:1108px;top:100px;background:${Y};font-weight:900;font-size:36px;padding:6px 22px 6px 14px;clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)">2008</div>`);
  return merge ? lo + up : up + lo;
};
L('L40', F(paperBg() + twoLines(1) + res('10:30', 6) + tp('「昔から伝わる」は物語の中の設定', { bottom: 70 })));
L('L40b', F(paperBg() + twoLines(3) + res('10:42', 6) + tp('「昔から伝わる」は物語の中の設定', { bottom: 70 })));
L('L41', F(paperBg() + `<div style="position:absolute;inset:0;filter:blur(1.5px)">${twoLines(3, true)}</div>` + res('10:55') + tp('話の中の古さ → 現実の古さに見える', { bottom: 90 })));

// ---------- 11:05 答え合わせ ----------
const legend = abs('left:0;right:0;bottom:46px;display:flex;justify-content:center;gap:34px;font-size:32px;font-weight:900;color:#F2F2F2;z-index:6', `<span><span style="color:#fff;-webkit-text-stroke:5px #111;paint-order:stroke fill">○</span> 元の話にあるとされる</span><span><span style="color:${Y}">△</span> 一つの例・形は未確認</span><span><span style="color:${C.gray}">―</span> 決まっていない</span><span style="display:flex;align-items:center;gap:10px"><span style="border:3px dotted #9AA0A6;padding:0 10px;color:#C5C8CB;font-size:26px">保留</span> 確認できず</span>`);
const NOTES = { 4: '男のような声', 1: '語り手が見た一例とされる', 2: '共通点は「頭に何か」と紹介', 3: '若い女にも老婆にも見えるとされる' };
const ORDER = [0, 4, 1, 2, 3]; const MK = { 0: 'o', 4: 'o', 1: 'tri', 2: 'tri', 3: 'dash' };
function ans(n, o = {}) { // n = 書き込み済みの数（ORDER 順）
  const marks = {}, notes = {}, mkn = {};
  ORDER.slice(0, n).forEach(i => { marks[i] = MK[i]; if (NOTES[i]) notes[i] = NOTES[i]; if (i === 2) mkn[2] = '形'; });
  return checklist({ W: 1560, fs: 46, rh: 94, textW: 520, marks, notes, mkn, hold: 2, holdS: 1.15, holdTxt: o.holdFinal ? ['記事は特徴に挙げる', '元の書き方'] : null, rot: -0.3, ...o });
}
const ansF = (inner, o = {}) => F(abs(`left:0;right:0;top:${o.top ?? 40}px;display:flex;justify-content:center`, inner) + (o.legend === false ? '' : legend) + (o.extra || ''), { bg: '#10171C' });
L('L42', ansF(ans(0), { extra: head('答え合わせ', 60, 16, 40) + '' }));
L('L43', ansF(ans(1, { ul: 0 })));
L('L43b', ansF(ans(2, { ul: 4 })));
L('L43c', ansF(ans(3, { ul: 1 })));
L('L43d', ansF(ans(4, { ul: 2 })));
L('L44', ansF(ans(5, { ul: 3 })));
L('L44b', ansF(ans(5, { ul: 5, holdFinal: true })));
L('L45', ansF(ans(5, { holdFinal: true, seven: 1, ul: 6 }), { top: 20 }));
L('L45b', ansF(ans(5, { holdFinal: true, seven: 2, ul: 6 }), { top: 20 }));
L('L45c', ansF(ans(5, { holdFinal: true, seven: 3, ul: 6 }), { top: 20 }));
L('L45d', ansF(ans(5, { holdFinal: true, seven: 4, ul: 6 }), { top: 20, legend: false }));
// ⑦の下段から現実の年表が右へ伸びる
const compactList = () => abs('left:50px;top:60px', checklist({ W: 860, fs: 38, rh: 74, marks: MK, hold: 2, holdS: 0.95, holdTxt: ['記事は特徴に挙げる', '元の書き方'], seven: 3, compact: true, rot: -0.3 }));
function realLine(stage, onlyFlag = false) {
  const y = 640, x0 = 990, x1 = 1880;
  let h = abs(`left:${x0 - 40}px;top:${y - 210}px;width:${x1 - x0 + 70}px;height:420px;background:${PAPER};box-shadow:0 8px 26px rgba(0,0,0,.45)`, paperTexDiv()) + abs(`left:${x0}px;top:${y}px;width:${x1 - x0 - 20}px;height:7px;background:${INK}`, '');
  const pt = (x, yr, t, up) => abs(`left:${x - 16}px;top:${y - 13}px;width:32px;height:32px;border-radius:50%;background:${Y};border:4px solid #111`, '') + abs(`left:${x - 60}px;top:${y + 30}px;width:120px;text-align:center;font-weight:900;font-size:30px;color:${INK}`, yr) + (t ? abs(`left:${x - 200}px;top:${up ? y - 140 : y + 80}px;width:400px;text-align:center;font-weight:900;font-size:26px;line-height:1.35;color:${INK};white-space:nowrap`, t) : '');
  h += abs(`left:${x0 + 60}px;top:${y - 175}px;width:7px;height:175px;background:${INK}`, '') + abs(`left:${x0 + 67}px;top:${y - 175}px;background:${Y};font-weight:900;font-size:36px;padding:6px 22px 6px 14px;clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)`, '2008');
  if (!onlyFlag || true) h += abs(`left:${x0 - 20}px;top:${y + 80}px;width:420px;font-weight:700;font-size:25px;line-height:1.35;color:${NOTE}`, '親しみやすい描かれ方は初期から<br>（現代ビジネスの指摘）');
  if (stage >= 2) h += pt(1420, '2021', '解説本<br>『21世紀日本怪異ガイド100』', true);
  if (stage >= 3) h += pt(1740, '2026.7', 'ゲーム<br>『八尺様がいた夏休み』', false);
  return h;
}
const lineLink = abs('left:900px;top:640px;width:60px;height:7px;background:#F2F2F2', '');
L('L46', F(compactList() + realLine(1) + lineLink + tp('親しみやすい描かれ方は初期から（現代ビジネスの指摘）／2021年 解説本・2026年7月 ゲーム', { size: 40, bottom: 40 }), { bg: '#10171C' }));
L('L46b', F(compactList() + realLine(2) + lineLink + tp('親しみやすい描かれ方は初期から（現代ビジネスの指摘）／2021年 解説本・2026年7月 ゲーム', { size: 40, bottom: 40 }), { bg: '#10171C' }));
L('L46c', F(compactList() + realLine(3) + lineLink + tp('親しみやすい描かれ方は初期から（現代ビジネスの指摘）／2021年 解説本・2026年7月 ゲーム', { size: 40, bottom: 40 }), { bg: '#10171C' }));
L('L47', F(compactList() + realLine(1, true) + lineLink + tp('創作か、体験の脚色か：不明／投稿者：詮索しません', { bottom: 50 }), { bg: '#10171C' }));
const fullAns = (o = {}) => ans(5, { holdFinal: true, seven: 4, ...o });
L('L48', ansF(fullAns({ focus: new Set([0, 4]) }), { top: 20, legend: false, extra: abs('left:0;right:0;bottom:36px;display:flex;justify-content:center;z-index:8', `<div style="font-weight:900;font-size:60px;color:${Y};-webkit-text-stroke:8px #111;paint-order:stroke fill">迷わず${maru(60)}は 7つのうち 2つ</div>`) }));
const brimShadow = (x, y, s = 1) => `<svg style="position:absolute;left:${x - 260 * s}px;top:${y - 80 * s}px;z-index:7" width="${520 * s}" height="${160 * s}" viewBox="0 0 520 160"><defs><filter id="bs" x="-50%" y="-100%" width="200%" height="300%"><feGaussianBlur stdDeviation="14 4"/></filter></defs><g filter="url(#bs)"><ellipse cx="260" cy="100" rx="175" ry="16" fill="#0D1418" opacity=".9"/><ellipse cx="252" cy="80" rx="66" ry="24" fill="#0D1418" opacity=".85"/></g></svg>`;
L('L49', ansF(fullAns({ focus: new Set([5]) }), { top: 20, legend: false, extra: tp('保留にした⑥、あなたなら何を付ける？', { size: 60, bottom: 40 }) }));
L('L49b', F(`<div style="position:absolute;left:0;right:0;bottom:0;height:520px;opacity:.28;overflow:hidden"><div style="position:absolute;left:0;bottom:0;width:1920px;height:1080px">${scene('G01', { noBrim: true })}</div></div>` + abs('left:0;right:0;top:20px;display:flex;justify-content:center', ans(5, { seven: 4, hold: 0, focus: new Set([5]), glow6: true })) + brimShadow(330, 590) + tp('保留にした⑥、あなたなら何を付ける？', { size: 60, bottom: 40 }), { bg: '#0A0F12' }));
L('L49c', F(tp('保留にした⑥、あなたなら何を付ける？', { size: 60, bottom: 500 }), { bg: '#000', grain: 0 }));
L('L50', F(abs('left:120px;top:140px;width:1000px;font-size:40px;font-weight:700;color:#CFCAC0;line-height:1.9', '出典<br>現代ビジネス（講談社）<br>Snopes<br>講談社（書誌）<br>gamebiz　ほか<br><span style="font-size:32px">※出典の一覧は概要欄に</span>'), { bg: '#050607' }));

// ---------- ショート（9:16） ----------
const SH = { w: 1080, h: 1920 };
S('S01', F(scene('G01', { vertical: true }) + stp('八尺様に「決まった姿」は\nなかった？', { top: 560 }) + IMGv, SH));
const vFlag = abs('left:0;right:0;top:1140px;height:360px', `<div style="position:absolute;left:90px;right:90px;top:250px;height:8px;background:${INK}"></div><div style="position:absolute;left:600px;top:40px;width:9px;height:218px;background:${INK}"></div><div style="position:absolute;left:609px;top:40px;background:${Y};font-weight:900;font-size:64px;padding:12px 40px 12px 24px;clip-path:polygon(0 0,100% 0,88% 50%,100% 100%,0 100%)">2008</div>`);
S('S02', F(paperBg(1080, 1920) + vFlag + stp('2008年の掲示板投稿が\n始まりと説明されている', { src: '（現代ビジネスの紹介による）' }), SH));
S('S02b', F(paperBg(1080, 1920) + bbsFake({ vertical: true }) + stp('2008年の掲示板投稿が\n始まりと説明されている', { src: '（現代ビジネスの紹介による）' }), SH));
const s3t = stp('見る人によって\n若い女にも\n老婆にも', { src: '（現代ビジネスの紹介による）', top: 600 });
S('S03a', F(figVertical(0) + s3t + IMGv, SH));
S('S03b', F(figVertical(1) + s3t + IMGv, SH));
S('S03c', F(figVertical(2) + s3t + IMGv, SH));
S('S04', F(figVertical(0, { white: 1 }) + stp('白いワンピース：\n語り手が見た一例とされる', { size: 60 }) + IMGv, SH));
const s5h = head('記事が挙げる共通点', 60, 570, 44) + stp('頭に何か・男のような声', { top: 650, size: 60 });
S('S05', F(figVertical(0, { white: 1, q: true }) + s5h + IMGv, SH));
S('S05b', F(s5h + abs('left:0;right:0;top:900px;display:flex;justify-content:center', popoRound(240)), { ...SH, bg: '#0A0B0C' }));
S('S05c', F(s5h + abs('left:0;right:0;top:880px;display:flex;justify-content:center', popoBrush(240)), { ...SH, bg: '#0A0B0C' }));
S('S06', F(scene('G10', { w: 1080, h: 1920 }) + abs('left:0;right:110px;top:560px;display:flex;justify-content:center;gap:40px', inkV('江戸の「八尺の女」', 66)), { ...SH, grain: 0.06 }));
S('S06b', F(scene('G10', { w: 1080, h: 1920 }) + abs('left:0;right:110px;top:560px;display:flex;flex-direction:row-reverse;justify-content:center;gap:50px', `<div style="opacity:.5">${inkV('江戸の「八尺の女」', 62)}</div>` + inkV('似ているが', 62) + inkV('起源とまでは言えない', 56)), { ...SH, grain: 0.06 }));
const sList = (o = {}) => abs('left:0;right:0;top:700px;display:flex;justify-content:center', checklist({ W: 900, fs: 52, rh: 92, cover: new Set([0, 1, 2, 3, 4, 6]), ...o }));
S('S07', F(sList() + stp('7つの特徴を本編で答え合わせ', { top: 560, size: 60 }), { ...SH, bg: '#10171C' }));
S('S07b', F(sList({ focus: new Set([5]), glow6: true }) + stp('「子どもを狙う」は保留\n→あなたなら○？', { top: 500, size: 60 }), { ...SH, bg: '#0A0F12' }));
S('S07c', F(stp('7つの特徴を本編で答え合わせ', { top: 860, size: 54, color: 'rgba(242,242,242,.7)' }), { ...SH, bg: '#000', grain: 0 }));

// ---------- サムネ（1280x720） ----------
const thumbText = (t, css, size) => abs(css, `<div style="font-weight:900;font-size:${size}px;line-height:1.1;color:${Y};-webkit-text-stroke:${Math.round(size * 0.16)}px #111;paint-order:stroke fill;white-space:nowrap">${t}</div>`);
T('thumb_A_○は2つだけ', F(abs('left:560px;top:0;width:720px;height:720px;overflow:hidden', `<div style="position:absolute;inset:0">${scene('G01')}</div><div style="position:absolute;inset:0;background:rgba(12,24,34,.38)"></div>`) + abs('left:30px;top:150px', checklist({ W: 560, fs: 33, rh: 64, marks: { 0: 'o', 4: 'o' }, cover: new Set([1, 2, 3, 6]), hold: 1, holdS: 1.1, rot: -1.5 })) + thumbText(maru(112) + 'は2つだけ', 'left:590px;top:44px', 112), { w: 1280, h: 720, bg: '#0E161C', grain: 0.08 }));
T('thumb_B_姿は見る人次第', F(SV(figBg(1920, 1080) + THREE.map(t => figure({ ...t, base: 1050, H: 640 })).join('') + `<path d="M640 760 H880 M1040 760 H1280" stroke="#F2F2F2" stroke-width="6" stroke-dasharray="14 14" opacity=".8"/>`) + thumbText('姿は見る人次第？', 'left:0;right:0;top:40px;display:flex;justify-content:center', 122), { w: 1280, h: 720, grain: 0.08 }));
T('thumb_C_2008年生まれ', F(paperBg(1280, 720) + SV(figure({ cx: 1210, base: 1000, H: 760, fill: '#1B2730', op: 0.38 })) + `<div style="position:absolute;left:0;top:0;width:1920px;height:1080px;transform:scale(.6667);transform-origin:0 0">${timeline({ mode: 'wide', y: 760, label: '2008', x1: 1780, fs: 1.9 })}</div>` + thumbText('2008年生まれ？', 'left:60px;top:60px', 122), { w: 1280, h: 720, grain: 0.06 }));

const only = process.env.ONLY;
await render(only ? jobs.filter(j => j.out.includes(only)) : jobs);
console.log(jobs.length, 'images');
