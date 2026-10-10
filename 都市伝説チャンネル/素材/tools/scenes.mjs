// 背景イラスト（コードで描く自作。写実ではなく絵の質感。生成AIは使わない）
// すべて viewBox 1920x1080 の SVG。vertical=true なら 9:16 用に cx を中心に切り出す。
const svg = (inner, { vertical = false, cx = 960 } = {}) => {
  const vb = vertical ? `${cx - 304} 0 608 1080` : '0 0 1920 1080';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" preserveAspectRatio="xMidYMid slice" style="position:absolute;inset:0;width:100%;height:100%">${inner}</svg>`;
};
const rnd = (seed) => { let s = seed; return () => (s = (s * 16807) % 2147483647) / 2147483647; };
const fog = (id, freq = 0.004, op = 0.5) => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq} ${freq * 2.5}" numOctaves="3" seed="3"/><feColorMatrix values="0 0 0 0 0.42  0 0 0 0 0.50  0 0 0 0 0.56  0 0 0 ${op} 0"/></filter>`;

export const scenes = {
  // G01 夜の車窓（窓は右3分の2）
  G01: (o) => { const r = rnd(7); let lights = ''; for (let i = 0; i < 14; i++) lights += `<circle cx="${700 + r() * 1050}" cy="${520 + r() * 160}" r="${4 + r() * 10}" fill="#E8A84A" opacity="${0.4 + r() * 0.6}" filter="url(#b8)"/>`;
    return svg(`<defs><linearGradient id="sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06101B"/><stop offset="1" stop-color="#0F2433"/></linearGradient><filter id="b8"><feGaussianBlur stdDeviation="6"/></filter><filter id="b20"><feGaussianBlur stdDeviation="20"/></filter></defs>
    <rect width="1920" height="1080" fill="#0A1622"/>
    <rect x="620" y="160" width="1200" height="640" rx="46" fill="url(#sky)"/>
    <path d="M620 650 L820 600 L1000 630 L1200 585 L1420 625 L1820 590 L1820 800 L620 800 Z" fill="#081018" filter="url(#b8)"/>
    ${lights}
    <rect x="620" y="160" width="1200" height="640" rx="46" fill="none" stroke="#1D3446" stroke-width="34"/>
    <path d="M700 220 L1100 760" stroke="#ffffff" stroke-opacity=".05" stroke-width="80" filter="url(#b20)"/>
    <rect x="0" y="830" width="1920" height="250" fill="#07111A"/>
    <rect x="80" y="420" width="420" height="440" rx="40" fill="#0E1D2B" filter="url(#b20)"/>
    <rect x="0" y="0" width="1920" height="70" fill="#07111A"/>`, o); },
  // G02 光の線
  G02: (o) => { const r = rnd(11); let s = ''; for (let i = 0; i < 46; i++) { const y = r() * 1080, w = 300 + r() * 900, x = r() * 1920 - 300; s += `<rect x="${x}" y="${y}" width="${w}" height="${2 + r() * 7}" rx="4" fill="${r() > .5 ? '#E8A84A' : '#5FC4C9'}" opacity="${0.25 + r() * 0.6}" filter="url(#b)"/>`; }
    return svg(`<defs><filter id="b"><feGaussianBlur stdDeviation="3 1.2"/></filter><radialGradient id="v" cx=".5" cy=".5" r=".7"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".75"/></radialGradient></defs><rect width="1920" height="1080" fill="#081626"/>${s}<rect width="1920" height="1080" fill="url(#v)"/>`, o); },
  // G03 無地の駅名標（左3分の1）と灯り
  G03: (o) => svg(`<defs>${fog('f', 0.0018, 0.2)}<radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E8A84A" stop-opacity=".9"/><stop offset="1" stop-color="#E8A84A" stop-opacity="0"/></radialGradient><filter id="b"><feGaussianBlur stdDeviation="2"/></filter></defs>
    <rect width="1920" height="1080" fill="#09131D"/>
    <circle cx="610" cy="250" r="380" fill="url(#lamp)" opacity=".55"/>
    <rect x="598" y="150" width="24" height="120" fill="#1B2733"/><circle cx="610" cy="275" r="18" fill="#FFD9A0"/>
    <rect x="390" y="430" width="440" height="190" rx="10" fill="#E9E4D8" filter="url(#b)"/>
    <rect x="390" y="430" width="440" height="190" rx="10" fill="#0B1A2A" opacity=".18"/>
    <rect x="440" y="620" width="20" height="300" fill="#1B2733"/><rect x="760" y="620" width="20" height="300" fill="#1B2733"/>
    <path d="M0 900 L1920 880 L1920 1080 L0 1080 Z" fill="#141E28"/><path d="M0 900 L1920 880" stroke="#D8D2C2" stroke-opacity=".35" stroke-width="8"/>
    <rect width="1920" height="1080" filter="url(#f)"/>`, { cx: 610, ...o }),
  // G04 暗い野原と山の稜線
  G04: (o) => svg(`<defs>${fog('f', 0.002, 0.45)}<linearGradient id="s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0D1824"/><stop offset="1" stop-color="#1A2A36"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="url(#s)"/>
    <path d="M0 700 L240 610 L420 660 L700 560 L980 650 L1260 590 L1520 660 L1920 600 L1920 1080 L0 1080 Z" fill="#0A121A"/>
    <path d="M0 760 Q960 700 1920 760 L1920 1080 L0 1080 Z" fill="#0C1A14"/>
    <rect y="680" width="1920" height="220" filter="url(#f)" opacity=".8"/>`, o),
  // G05 霧の中の小さな人影（逆光・特徴なし）
  G05: (o) => svg(`<defs>${fog('f', 0.0025, 0.45)}<radialGradient id="g" cx=".55" cy=".55" r=".35"><stop offset="0" stop-color="#C9D6DE" stop-opacity=".7"/><stop offset="1" stop-color="#C9D6DE" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="#101C26"/><rect width="1920" height="1080" fill="url(#g)"/>
    <path d="M0 820 Q960 780 1920 820 L1920 1080 L0 1080Z" fill="#0B141C"/><path d="M900 1080 L1040 800 L1080 800 L1240 1080 Z" fill="#16222C"/>
    <g transform="translate(1062 742)" opacity=".85"><circle cx="0" cy="-58" r="11" fill="#05090D"/><path d="M-14 -44 Q0 -50 14 -44 L18 10 L8 10 L5 58 L-5 58 L-8 10 L-18 10 Z" fill="#05090D"/></g>
    <rect width="1920" height="1080" filter="url(#f)"/>`, o),
  // G06 トンネルの口と遠くの人影
  G06: (o) => svg(`<defs>${fog('f', 0.002, 0.2)}<radialGradient id="in" cx=".5" cy=".6" r=".6"><stop offset="0" stop-color="#3B4A55"/><stop offset=".5" stop-color="#0B0F13"/><stop offset="1" stop-color="#020304"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="#0E1922"/><path d="M0 1080 L0 300 Q960 120 1920 300 L1920 1080Z" fill="#14222B"/>
    <path d="M620 960 L620 560 Q960 260 1300 560 L1300 960 Z" fill="#1E2C35"/><path d="M680 960 L680 580 Q960 330 1240 580 L1240 960 Z" fill="url(#in)"/>
    <g transform="translate(960 800)" opacity=".7"><circle cx="0" cy="-26" r="5" fill="#000"/><path d="M-7 -19 L7 -19 L8 18 L-8 18Z" fill="#000"/></g>
    ${Array.from({ length: 40 }, (_, i) => `<path d="M${560 + i * 22} 980 q6 -${30 + (i * 13) % 50} 12 0" stroke="#0A1410" stroke-width="5" fill="none"/>`).join('')}
    <rect y="900" width="1920" height="180" fill="#0B151B"/><rect width="1920" height="1080" filter="url(#f)" opacity=".7"/>`, o),
  // G07 夜道のヘッドライト（車体は見せない）
  G07: (o) => svg(`<defs><radialGradient id="h" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#FFF4D8"/><stop offset=".25" stop-color="#FFE3A8" stop-opacity=".7"/><stop offset="1" stop-color="#FFE3A8" stop-opacity="0"/></radialGradient><linearGradient id="beam" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFE3A8" stop-opacity=".0"/><stop offset="1" stop-color="#FFE3A8" stop-opacity=".25"/></linearGradient></defs>
    <rect width="1920" height="1080" fill="#070D13"/><path d="M820 560 L1100 560 L1720 1080 L200 1080 Z" fill="#0F171E"/><path d="M820 560 L1100 560 L1500 1080 L420 1080 Z" fill="url(#beam)"/>
    ${Array.from({ length: 9 }, (_, i) => `<path d="M${i * 90} 600 q40 -${200 + i * 15} 80 0 Z" fill="#05090C"/><path d="M${1920 - i * 90} 600 q-40 -${200 + i * 15} -80 0 Z" fill="#05090C"/>`).join('')}
    <circle cx="880" cy="575" r="120" fill="url(#h)"/><circle cx="1040" cy="575" r="120" fill="url(#h)"/>`, o),
  // G08 闇の中の真っ白な余白（右半分）
  G08: (o) => svg(`<defs><filter id="p"><feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="2"/><feColorMatrix values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 .08 0"/></filter></defs>
    <rect width="1920" height="1080" fill="#050505"/><path d="M1010 40 L1880 60 L1860 1040 L990 1030 L1004 860 L985 640 L1012 420 L992 220 Z" fill="#FAFAF7"/><path d="M1010 40 L1880 60 L1860 1040 L990 1030 L1004 860 L985 640 L1012 420 L992 220 Z" filter="url(#p)"/>`, o),
  // G09 無地の駅名標のまわりに浮かぶ光の四角
  G09: (o) => { const r = rnd(5); let q = ''; for (let i = 0; i < 26; i++) { const w = 40 + r() * 70; q += `<rect x="${200 + r() * 1600}" y="${80 + r() * 700}" width="${w}" height="${w * 0.62}" rx="6" fill="#DDEBF5" opacity="${0.12 + r() * 0.4}" filter="url(#b)"/>`; }
    return svg(`<defs>${fog('f', 0.0018, 0.16)}<filter id="b"><feGaussianBlur stdDeviation="3"/></filter><radialGradient id="lamp" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#E8A84A" stop-opacity=".8"/><stop offset="1" stop-color="#E8A84A" stop-opacity="0"/></radialGradient></defs>
    <rect width="1920" height="1080" fill="#0A1521"/>${q}<circle cx="1260" cy="300" r="300" fill="url(#lamp)" opacity=".5"/>
    <rect x="1040" y="430" width="440" height="190" rx="10" fill="#E9E4D8"/><rect x="1090" y="620" width="20" height="300" fill="#1B2733"/><rect x="1410" y="620" width="20" height="300" fill="#1B2733"/>
    <path d="M0 900 L1920 880 L1920 1080 L0 1080Z" fill="#141E28"/><rect width="1920" height="1080" filter="url(#f)"/>`, o); },
};
