// きさらぎ駅：動画用の画像をすべて書き出す（node build.mjs）
// 04_演出.md のカット表（L01〜L86・S01〜S10）とサムネ案 A/B/C に対応。生成AIは使わない自作素材。
import path from 'path';
import { fileURLToPath } from 'url';
import { render, seg7 } from '../../../素材/tools/lib.mjs';
import { C, frame, abs, counter, telop, bigText, tag, sticky, chapter, vAxis, yearLine, icon, bbs, exchange } from '../../../素材/tools/parts.mjs';
import { scenes } from '../../../素材/tools/scenes.mjs';

const OUT = path.dirname(fileURLToPath(import.meta.url));
const jobs = [];
const L = (id, html) => jobs.push({ out: path.join(OUT, 'long', `${id}.png`), w: 1920, h: 1080, html });
const S = (id, html) => jobs.push({ out: path.join(OUT, 'short', `${id}.png`), w: 1080, h: 1920, html });
const T = (id, html) => jobs.push({ out: path.join(OUT, 'thumb', `${id}.png`), w: 1280, h: 720, html });
const B = (id, html, w = 1920, h = 1080) => jobs.push({ out: path.join(OUT, 'bg', `${id}.png`), w, h, html });

const IMG = '<div style="position:absolute;left:40px;bottom:30px;font-size:24px;color:rgba(242,242,242,.7);z-index:7">イメージ（イラスト）</div>';
const IMGv = '<div style="position:absolute;left:40px;bottom:420px;font-size:28px;color:rgba(242,242,242,.7);z-index:7">イメージ（イラスト）</div>';
const cnt = (o) => counter(o);
const scene = (k, o = {}) => scenes[k](o);
const dark = (op = .35) => abs(`inset:0;background:rgba(0,0,0,${op})`, '');

// 時間軸で繰り返し使う項目
const ax1 = { t: '23:14', label: '最初の書き込み', sticky: '1' };
const ax2 = { t: '23:23', label: '電車の様子の書き込み', sticky: '2' };
const steps = ['① 新浜松から（とされる）', '② 無人駅「きさらぎ」', '③ 太鼓のような音', '④ 老人が消える（要約）', '⑤ トンネルの先の人影', '⑥ 車に乗る'];

// ---------- 背景（素材単体。編集で自由に使う） ----------
for (const k of Object.keys(scenes)) B(k, frame({ body: scene(k), grainOp: .12 }));
for (const [k, cx] of [['G01', 1220], ['G02', 960], ['G03', 610], ['G04', 960]]) B(`${k}_vertical`, frame({ w: 1080, h: 1920, body: scene(k, { vertical: true, cx }), grainOp: .12 }), 1080, 1920);

// ---------- 冒頭 ----------
L('L01', frame({ bg: C.black, body: abs('inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px', seg7('2004.01.08', { h: 80 }) + seg7('23:14', { h: 220 })) + telop('【2004.1.8 23:14】', 'plain', { bottom: 90, size: 48 }) }));
L('L02', frame({ bg: C.black, body: abs('inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px', seg7('2004.01.08', { h: 80 }) + `<div style="display:flex;align-items:center;gap:40px">${seg7('23:14', { h: 220 })}${sticky('1', 110)}</div>`) + telop('23:14 最初の書き込み（報道による）', 'fact') }));
L('L03', frame({ bg: C.black, body: abs('inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px', seg7('2004.01.08', { h: 80 }) + `<div style="display:flex;align-items:center;gap:40px">${seg7('23:23', { h: 220 })}${sticky('2', 110)}</div>`) + telop('23:23 電車の異変を伝える書き込み（報道による・要約）', 'fact') }));
L('L04', frame({ bg: C.navy, body: vAxis({ items: [ax1, ax2], blanks: 4, x: 760, top: 200, gap: 150 }) + telop('「存在しない駅」の、分単位の記録', 'plain', { bottom: 70 }) }));
L('L05', frame({ body: scene('G01') + dark(.25) + cnt({ time: '23:23' }) + telop('きさらぎ駅――実況ログを時刻順に', 'plain', { size: 64 }) + IMG }));
L('L06', frame({ bg: C.black, body: cnt({ time: '23:23', h: 70 }) + abs('left:560px;top:62px;opacity:.3;display:flex;gap:40px;align-items:center', seg7('2004', { h: 50 }) + '<span style="font-size:40px">…</span>' + seg7('2025', { h: 50 })) + telop('最後に：止まった時刻と、進み続けた年', 'plain') }));
L('L07', frame({ body: bigText('きさらぎ駅', { size: 160, font: 'NSerif', weight: 700 }) + bigText('時刻順にたどる実況ログ', { size: 52, top: 700, color: C.amber }) }));
// ---------- 導入 ----------
L('L08', frame({ body: scene('G01') + cnt({ time: '23:23' }) + IMG }));
L('L09', frame({ body: bbs({ title: '身のまわりで変なことが起こったら実況するスレ 26（とされる）' }) + cnt({ time: '23:23' }) }));
L('L10', frame({ bg: C.black, body: bigText('怪談ではなく\n「実況」', { size: 130 }) }));
L('L11', frame({ body: exchange({}) + cnt({ time: '23:23' }) }));
L('L11b', frame({ body: exchange({ dimBubbles: true }) + cnt({ time: '23:23' }) }));
L('L12', frame({ bg: C.black, body: abs('left:360px;right:360px;top:330px;border:4px dashed ' + C.gray + ';border-radius:16px;padding:60px;text-align:center', `<div style="font-size:56px;font-weight:900;color:${C.gray}">出典：報道・解説記事の要約<br>※元ログは未確認</div><div style="font-size:40px;margin-top:40px;color:${C.white}">※本文の引用はしません</div>`) }));
L('L13', frame({ bg: C.navy, body: abs('inset:0;display:flex;align-items:center;justify-content:center', seg7('23:14', { h: 260 })) }));
// ---------- 第1章 ----------
L('L14a', chapter({ no: '第1章', time: '23:14→23:23', title: '最初の9分' }));
L('L14', frame({ body: bbs({ title: '', blur: 14 }) + cnt({ time: '23:14' }) + telop('（要約）', 'plain') }));
L('L15', frame({ body: bbs({ title: '', nameSwap: '<span style="color:#FFD84D;font-weight:900;font-size:34px">はすみ</span>' }) + cnt({ time: '23:14' }) + telop('投稿者：のちに「はすみ」と名乗る（とされる）', 'theory') }));
L('L16', frame({ body: vAxis({ items: [ax1], x: 760, top: 300 }) + cnt({ time: '23:14' }) + telop('23:14 最初の書き込み（多くの記事）', 'fact') }));
L('L17', frame({ body: scene('G02') + cnt({ time: '23:23' }) + telop('23:23 電車が20分ほど駅に止まらない', 'fact', { src: '東洋経済オンラインの記事による・要約' }) + IMG }));
L('L18', frame({ body: vAxis({ items: [ax1, ax2], x: 760, top: 300, gap: 260 }) + abs(`left:735px;top:330px;width:56px;height:200px;background:linear-gradient(rgba(232,168,74,0),rgba(232,168,74,.55),rgba(232,168,74,0));border-radius:28px`, '') + abs(`left:830px;top:400px;font-size:40px;font-weight:900;color:${C.amber}`, '午後11時20分ごろ（中日新聞）') + cnt({ time: '23:23' }) }));
L('L19', frame({ body: vAxis({ items: [ax1, { label: '午後11時20分ごろ（幅のある言い方）', kind: 'fact' }, ax2], x: 760, top: 280, gap: 170 }) + cnt({ time: '23:23' }) }));
L('L20', frame({ body: vAxis({ items: [{ ...ax1, tag: 'check' }, { ...ax2, tag: 'check' }], x: 760, top: 300, gap: 200 }) + cnt({ time: '23:23' }) + telop('※時刻と書き込みの対応：記事本文では未確認', 'unknown') }));
L('L21', frame({ body: vAxis({ items: [ax1, ax2], x: 500, top: 300, gap: 200 }) + abs('right:260px;top:300px', `<svg width="520" height="520" viewBox="0 0 100 100"><rect x="62" y="40" width="30" height="20" rx="2" fill="#7FD3FF" opacity=".55"/><circle cx="38" cy="34" r="10" fill="#05090D"/><path d="M22 92 Q24 52 38 48 Q52 52 56 70 L64 66 L66 72 L54 80 L52 92 Z" fill="#05090D"/><path d="M60 60 L92 60 L92 62 L60 62Z" fill="#05090D"/></svg>`) + abs('right:120px;top:330px;width:340px;height:300px;background:radial-gradient(rgba(127,211,255,.25),transparent 70%)', '') + cnt({ time: '23:23' }) }));
L('L22', frame({ body: abs('inset:0;display:flex;align-items:center;justify-content:center;gap:90px', [0, 1, 2].map(i => `<div style="width:300px;height:400px;background:#EDE8DC;transform:rotate(${(i - 1) * 3}deg);padding:40px 30px">${[70, 90, 60, 80, 50].map((w, j) => `<div style="height:14px;margin-bottom:26px;border-radius:7px;background:#999;width:${(w + i * 7 * (j % 2 ? 1 : -1)) % 100}%"></div>`).join('')}</div>`).join('<div style="font-size:80px;color:#E8A84A">→</div>')) + cnt({ time: '23:23' }) }));
L('L23', frame({ body: vAxis({ items: [ax1, ax2], x: 760, top: 200, gap: 160, whiteBelow: 560 }) + cnt({ time: '23:23' }) }));
// ---------- 第2章 ----------
L('L24a', chapter({ no: '第2章', time: '23:23→?', title: '時刻が消える夜' }));
L('L24', frame({ body: vAxis({ items: [ax1, ax2, { t: '??:??', label: steps[0], kind: 'fact' }], x: 520, top: 220, gap: 170 }) + cnt({ time: '??:??' }) }));
L('L25', frame({ body: bigText('新浜松から\n静岡県内の私鉄', { size: 96 }) + telop('報道による・要約', 'fact', { size: 40 }) + cnt({ time: '??:??' }) }));
L('L26', frame({ body: scene('G03') + abs('left:390px;top:430px;width:440px;height:190px;display:flex;align-items:center;justify-content:center;font-family:NSerif;font-weight:700;font-size:92px;color:#1A1A1A', 'きさらぎ') + cnt({ time: '??:??' }) + telop('② 無人駅「きさらぎ」', 'fact') + IMG }));
L('L27', frame({ body: scene('G04') + abs('left:460px;right:460px;bottom:300px;height:120px;display:flex;align-items:center;gap:10px', Array.from({ length: 60 }, (_, i) => `<div style="flex:1;background:${C.amber};opacity:.8;height:${10 + Math.abs(Math.sin(i * 0.9)) * (i % 8 < 2 ? 110 : 30)}px;border-radius:3px"></div>`).join('')) + cnt({ time: '??:??' }) + telop('③ 太鼓のような音', 'fact') + IMG }));
L('L28', frame({ body: scene('G05') + abs('right:60px;top:60px;font-size:32px;color:#fff;background:rgba(0,0,0,.5);padding:6px 16px;border-radius:6px', '再現イメージ') + cnt({ time: '??:??' }) + telop('④ 危ないと声をかけた老人が消える（要約）', 'fact') + IMG }));
L('L29', frame({ bg: C.navy, body: abs('inset:0;display:flex;align-items:center;justify-content:center', `<div style="background:${C.orange};color:#fff;font-weight:900;font-size:68px;padding:50px 80px;border-radius:20px;text-align:center">※線路への立ち入りは危険です。<br>絶対にやめましょう</div>`) + cnt({ time: '??:??' }) }));
L('L30', frame({ body: scene('G06') + cnt({ time: '??:??' }) + telop('⑤ トンネルの先の人影（名前の表記は記事により異なる）', 'fact', { size: 46 }) + IMG }));
L('L31', frame({ body: scene('G07') + cnt({ time: '??:??' }) + telop('⑥ 車に乗る', 'fact') + IMG }));
const axSteps = steps.map(s => ({ t: '??:??', label: s, kind: 'fact' }));
L('L32', frame({ body: vAxis({ items: [ax1, ax2, ...axSteps], x: 520, top: 130, gap: 108 }) + telop('途中の時刻：未確認', 'unknown', { bottom: 60 }) + cnt({ time: '??:??' }) }));
L('L33', frame({ body: vAxis({ items: [{ ...ax1, glow: true }, { ...ax2, glow: true }, ...axSteps], x: 520, top: 130, gap: 108 }) + telop('書き込みの時刻が分かるのは「最初のほう」と「最後」だけ（今回の調査の範囲）', 'unknown', { bottom: 40, size: 44 }) + cnt({ time: '??:??' }) }));
L('L34', frame({ body: vAxis({ items: axSteps.slice(2), x: 520, top: 120, gap: 150, blanks: 2 }) + cnt({ time: '??:??' }) }));
// ---------- 再フック ----------
L('L35', frame({ bg: C.black, body: abs('inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:30px', seg7('2004.01.09', { h: 80 }) + seg7('03:44', { h: 240 })) + telop('【2004.1.9 3:44】', 'plain', { bottom: 90, size: 48 }) }));
L('L36', frame({ bg: C.black, body: abs('inset:0;display:flex;align-items:center;justify-content:center', icon.battery(1, 520)) + telop('最後の書き込み：午前3時44分とされる', 'fact') + cnt({ time: '03:44' }) }));
L('L37', frame({ bg: C.black, body: vAxis({ items: [ax1, { t: '03:44', label: '最後の書き込み（とされる）', gapAfter: 0 }], x: 760, top: 260, gap: 480 }) + telop('23:14 → 3:44　約4時間30分', 'fact') + cnt({ time: '03:44' }) }));
L('L38', frame({ bg: C.black, body: abs('left:0;right:0;top:300px;display:flex;flex-direction:column;align-items:center;gap:40px', icon.ticket(420, 'rgba(242,242,242,.8)') + `<div style="font-size:60px;font-weight:900;color:${C.yellow}">「存在しない駅」のきっぷ？</div>`) + cnt({ time: '03:44' }) }));
// ---------- 第3章 ----------
L('L39a', chapter({ no: '第3章', time: '3:44→', title: '書かれていなかったこと' }));
L('L39', frame({ bg: C.black, body: vAxis({ items: [{ t: '03:44', label: '最後の書き込み' }], x: 760, top: 260, whiteBelow: 330 }) + abs('left:0;right:0;bottom:120px;display:flex;justify-content:center;z-index:6', `<div style="font-size:54px;font-weight:900;color:#111;border-bottom:6px solid ${C.cyan};padding:6px 20px">元の書き込み：<span style="color:${C.red}">結末なし</span>（報道の要約による）</div>`) + cnt({ time: '03:44' }) }));
L('L40', frame({ bg: C.black, body: abs('left:950px;top:0;width:20px;height:520px;background:rgba(242,242,242,.8)', '') + abs('left:0;right:0;top:600px;bottom:0;background:#fff', '') + cnt({ time: '03:44' }) }));
L('L41', frame({ bg: '#fff', body: abs('inset:0;display:flex;align-items:center;justify-content:center;gap:120px;font-family:NSerif;font-size:120px;color:rgba(0,0,0,.28)', '<span>行方不明</span><span>神隠し</span>') + abs('left:0;right:0;bottom:120px;display:flex;justify-content:center', `<div style="font-size:50px;font-weight:900;color:#B8860B;background:rgba(0,0,0,.8);padding:10px 28px;border-radius:8px"><span style="font-size:24px;background:${C.yellow};color:#111;padding:2px 10px;border-radius:4px;margin-right:16px">説</span>「行方不明」「神隠し」：記録ではなく解釈（報道の要約による）</div>`) + cnt({ time: '03:44' }) }));
L('L42', frame({ bg: '#fff', body: abs('inset:0;display:flex;align-items:center;justify-content:center;gap:120px;font-family:NSerif;font-size:120px;color:rgba(0,0,0,.28)', `<span>行方不明<span style="color:${C.gray};font-family:NSJ;font-size:90px">？</span></span><span>神隠し<span style="color:${C.gray};font-family:NSJ;font-size:90px">？</span></span>`) + abs('left:0;right:0;bottom:120px;display:flex;justify-content:center', `<div style="font-size:48px;font-weight:900;color:#555;border:3px dashed ${C.gray};padding:10px 28px;border-radius:10px;background:#fff">初出：不明（スレッド内での有無も未確認）</div>`) + cnt({ time: '03:44' }) }));
L('L43', frame({ bg: C.black, body: abs('left:0;right:0;top:420px;bottom:0;background:#fff', '') + cnt({ time: '03:44' }) }));
L('L44', frame({ body: abs('left:240px;right:240px;top:470px;height:8px;background:rgba(242,242,242,.6)', '') + abs('left:0;right:0;top:420px;display:flex;justify-content:space-around;padding:0 200px', ['やみ', 'きさらぎ', 'かたす'].map(n => `<div style="text-align:center"><div style="width:100px;height:100px;border-radius:50%;border:8px solid ${C.yellow};background:${C.navy};margin:0 auto"></div><div style="font-size:56px;font-weight:900;margin-top:20px;color:${C.yellow}">${n}</div></div>`).join('')) + abs(`right:70px;top:60px;font-size:30px;font-weight:900;background:${C.yellow};color:#111;padding:4px 16px;border-radius:6px`, '説') + telop('やみ駅 ← きさらぎ駅 → かたす駅（とされる）', 'theory') + cnt({ time: '03:44' }) }));
L('L45', frame({ body: telop('出どころ：まとめ記事1件のみ／初出不明', 'unknown', { bottom: 470, size: 60 }) + cnt({ time: '03:44' }) }));
L('L46', frame({ body: telop('駅名標にほかの駅名がなかった、と紹介されることも\n※未確認', 'unknown', { bottom: 440, size: 56 }) + cnt({ time: '03:44' }) }));
L('L47', frame({ bg: C.black, body: abs('inset:0;display:flex;align-items:center;justify-content:center;gap:50px', `<div style="outline:6px solid ${C.red};padding:20px 30px;border-radius:10px">${seg7('03:44', { h: 200 })}</div><div style="display:flex;align-items:center;gap:20px;padding:20px 30px;background:rgba(255,255,255,.06);border-radius:10px"><span style="font-weight:900;font-size:60px">YEAR</span>${seg7('2004', { h: 160 })}</div>`) }));
// ---------- 第4章（年表） ----------
const c4 = (yr) => cnt({ time: '03:44', stopped: true, year: yr });
const yl = (active, pins) => yearLine({ active, pins });
const pinAll = [
  { y: 2014, text: 'かたす駅の話', kind: 'theory', up: 1 }, { y: 2018, text: '事典に掲載', up: 2 }, { y: 2020, text: 'テレビ・トレンド入り', up: 3 },
  { y: 2021, text: 'アニメ放送', up: 4 }, { y: 2022, text: 'きっぷ・映画', up: 5 }, { y: 2023, text: 'きさらぎ駅の日', up: 6 }, { y: 2025, text: '続編映画', up: 1 },
];
L('L48a', chapter({ no: '第4章', time: '2004→2025', title: '年で進むカウンター' }));
L('L48', frame({ bg: C.year, body: yl(2014, [pinAll[0]]) + c4(2014) + telop('※出どころ：まとめサイトのみ', 'unknown', { bottom: 40, size: 44 }) }));
L('L49', frame({ bg: C.year, body: yl(2018, pinAll.slice(0, 2)) + abs('left:0;right:0;top:220px;display:flex;justify-content:center;gap:40px;align-items:center', icon.book(140) + `<div style="font-size:50px;font-weight:900;border-bottom:6px solid ${C.cyan}">朝里樹『日本現代怪異事典』（笠間書院）</div>`) + abs('left:0;right:0;top:400px;text-align:center;font-size:40px;font-weight:900', '「異界駅」の最初の例：きさらぎ駅<div style="font-size:26px;color:rgba(242,242,242,.6);margin-top:8px">文春オンラインのインタビューより・要約</div>') + c4(2018) }));
L('L50', frame({ bg: C.year, body: yl(2020, pinAll.slice(0, 3)) + abs('left:0;right:0;top:200px;display:flex;justify-content:center;gap:40px;align-items:center', icon.tv(140) + `<div style="font-size:46px;font-weight:900;border-bottom:6px solid ${C.cyan}">フジテレビ『世界の何だコレ!?ミステリー』</div>`) + abs('left:0;right:0;top:380px;text-align:center;font-size:40px;font-weight:900', '2020.10.21 再現VTR放送 → トレンド入り（報道による）') + c4(2020) }));
L('L51', frame({ bg: C.year, body: abs('left:0;right:0;top:250px;text-align:center', `<div style="display:inline-block;width:900px;height:90px;border-radius:45px;border:4px solid rgba(242,242,242,.6)"></div><div style="font-size:52px;font-weight:900;margin-top:50px">「静岡県」と一緒に検索された急上昇ワード <span style="color:${C.red};font-size:90px">1位</span></div><div style="font-size:30px;color:rgba(242,242,242,.6)">Business Insider</div><div style="font-size:60px;font-weight:900;margin-top:50px;color:${C.amber}">2004 → 2020：16年後</div>`) + c4(2020) }));
L('L52', frame({ bg: C.year, body: yl(2021, pinAll.slice(0, 4)) + abs('left:0;right:0;top:250px;display:flex;justify-content:center;gap:40px;align-items:center', icon.anime(140) + `<div style="font-size:46px;font-weight:900;border-bottom:6px solid ${C.cyan}">アニメ『裏世界ピクニック』放送<div style="font-size:30px;margin-top:6px">原作：宮澤伊織〈早川書房〉</div></div>`) + c4(2021) }));
const tk = (from, to, note, ok) => `<div style="width:600px;height:300px;background:#F3EFE4;color:#111;border-radius:14px;clip-path:polygon(0 0,100% 0,100% 40%,96% 50%,100% 60%,100% 100%,0 100%,0 60%,4% 50%,0 40%);display:flex;flex-direction:column;justify-content:center;align-items:center;gap:16px"><div style="font-size:52px;font-weight:900">${from} → ${to}</div><div style="font-size:34px;font-weight:900;color:${ok ? '#1E6B3A' : '#A33'}">${note}</div></div>`;
L('L53', frame({ bg: C.year, body: abs('left:0;right:0;top:200px;display:flex;justify-content:center;gap:80px', tk('新浜松', 'さぎの宮', '使える', true) + tk('新浜松', 'きさらぎ', '使えない・レプリカ', false)) + abs('left:0;right:0;top:600px;text-align:center;font-size:40px;font-weight:900', '2022.1.8　駅名看板の一部が「きさらぎ」に装飾（報道による）<div style="font-size:26px;color:rgba(242,242,242,.6);margin-top:8px">※きっぷは文字だけの自作図。実物の券面ではありません</div>') + c4(2022) }));
L('L54', frame({ bg: C.year, body: yl(2025, pinAll.slice(0, 6).concat([{ y: 2025, text: '限定きっぷの販売情報', up: 2 }])) + c4(2025) }));
L('L55', frame({ bg: C.year, body: yl(2022, pinAll.slice(0, 4).concat([{ y: 2022, text: '映画『きさらぎ駅』公開', up: 5, kind: 'fiction', label: '創作' }])) + abs('left:0;right:0;top:220px;display:flex;justify-content:center;gap:40px;align-items:center', icon.film(140) + `<div style="font-size:48px;font-weight:900">2022.6.3 映画『きさらぎ駅』公開</div>`) + telop('映画の主人公・投稿者のその後：創作', 'fiction', { bottom: 40, size: 44 }) + c4(2022) }));
L('L56', frame({ bg: C.year, body: abs('left:0;right:0;top:300px;text-align:center', `<div style="font-size:60px;font-weight:900">2025.6.13「きさらぎ駅 Re:」公開</div><div style="font-size:42px;font-weight:900;color:${C.yellow};margin-top:40px">浜松市が公開記念トークショー・展示（とされる）</div>`) + c4(2025) }));
L('L57', frame({ bg: C.year, body: yl(2025, pinAll) + abs('left:0;right:0;top:120px;display:flex;justify-content:center', `<div style="outline:6px solid ${C.red};padding:16px 26px;border-radius:10px">${seg7('03:44', { h: 140 })}</div>`) + telop('3:44で停止 ／ 2004→2025', 'plain', { bottom: 40 }) }));
L('L58', frame({ bg: C.year, body: yearLine({ active: 2022, pins: [{ y: 2022, text: '新浜松 → さぎの宮', up: 2 }] }) + abs('inset:0;background:radial-gradient(circle at 60% 55%,transparent 15%,rgba(0,0,0,.6) 40%)', '') + telop('なぜ「さぎの宮」？', 'plain', { bottom: 500, size: 80 }) + c4(2022) }));
// ---------- 第5章（明るいトーン） ----------
const setsu = abs(`right:70px;top:60px;font-size:30px;font-weight:900;background:${C.yellow};color:#111;padding:4px 16px;border-radius:6px`, '説');
const cl = cnt({ time: '03:44', year: 2022, light: true });
const card = (t, col = '#111', extra = '') => `<div style="background:#fff;border-radius:16px;padding:30px 40px;font-size:46px;font-weight:900;color:${col};box-shadow:0 6px 20px rgba(0,0,0,.08);${extra}">${t}</div>`;
const simpleLine = abs(`left:260px;top:520px;width:700px;height:10px;background:${C.line};border-radius:5px`, '') + abs('left:220px;top:490px;text-align:center;width:120px', `<div style="width:60px;height:60px;border-radius:50%;background:#fff;border:8px solid ${C.line};margin:0 auto"></div><div style="font-size:38px;font-weight:900;color:#111;margin-top:10px;white-space:nowrap">新浜松</div>`) + abs('left:860px;top:490px;text-align:center;width:160px', `<div style="width:60px;height:60px;border-radius:50%;background:#fff;border:8px solid ${C.line};margin:0 auto"></div><div style="font-size:38px;font-weight:900;color:#111;margin-top:10px;white-space:nowrap">さぎの宮</div>`) + abs('left:260px;top:700px;font-size:24px;color:#667', '簡易図（実際の地図・路線図ではありません）');
L('L59a', chapter({ no: '第5章', time: '', title: 'さぎの宮駅は「説」として', light: true }));
L('L59', frame({ bg: C.light, grainOp: 0, body: simpleLine + setsu + cl + abs('left:1100px;top:440px', card('モデル駅説（噂・説）', '#8A6D00')) }));
L('L60', frame({ bg: C.light, grainOp: 0, body: simpleLine + setsu + cl + abs('left:1100px;top:260px;display:flex;flex-direction:column;gap:26px', card('①新浜松から約14分') + card('②ひらがなが続く駅名') + card('③読み間違い説', '#8A6D00')) }));
L('L61', frame({ bg: C.light, grainOp: 0, body: setsu + cl + abs('left:0;right:0;top:360px;display:flex;flex-direction:column;align-items:center;gap:40px', card('東洋経済オンラインの記事による推論') + card('※社名の記載：未確認', '#777', `border:3px dashed ${C.gray}`)) }));
L('L62', frame({ bg: C.light, grainOp: 0, body: setsu + cl + abs('left:180px;top:200px', card('反論：トンネルがない？（とされる）', '#8A6D00')) + vAxis({ items: [{ t: '??:??', label: '③ 太鼓のような音' }, { t: '??:??', label: '④ 老人が消える（要約）' }, { t: '??:??', label: '⑤ トンネル（徒歩の場面とされる）' }], x: 760, top: 470, gap: 150, light: true }) + abs(`left:690px;top:740px;width:1000px;height:90px;border:6px solid ${C.cyan};border-radius:14px`, '') }));
L('L63', frame({ bg: C.light, grainOp: 0, body: setsu + cl + abs('left:0;right:0;top:380px;display:flex;flex-direction:column;align-items:center;gap:40px', card('別の参加者が挙げた？（個人サイトの説）', '#8A6D00') + card('※未確認', '#777', `border:3px dashed ${C.gray}`)) }));
L('L64', frame({ bg: C.light, grainOp: 0, body: setsu + cl + abs('left:0;right:0;top:440px;display:flex;justify-content:center', card('投稿者がモデルを認めた記録：見つかっていない', '#111', `font-size:60px;border-bottom:8px solid ${C.cyan}`)) }));
L('L65', frame({ bg: C.light, grainOp: 0, body: setsu + cl + abs('left:200px;right:200px;top:280px;display:flex;flex-direction:column;gap:40px', card('遠州鉄道公式サイト「きさらぎ駅」ページ：<br>「実際には存在しない鉄道駅」<span style="font-size:30px;color:#777">（要原文確認）</span>') + card('遠州鉄道公式X（@et_train）の投稿より：<br>「ちゃんと各駅止まりますので」<span style="font-size:30px;color:#777">（要原文確認）</span>')) }));
L('L66', frame({ bg: C.light, grainOp: 0, body: setsu + cl + bigText('舞台とされる駅', { size: 90, color: '#111', top: 300 }) + abs('left:0;right:0;top:640px;display:flex;justify-content:center', `<div style="background:${C.orange};color:#fff;font-weight:900;font-size:52px;padding:30px 60px;border-radius:16px">※駅・線路での迷惑行為や危険な行為はやめましょう</div>`) }));
L('L67', frame({ bg: C.navy, body: abs('inset:0;display:flex;align-items:center;justify-content:center', seg7('23:14', { h: 240 })) }));
// ---------- 第6章（考察） ----------
const band = abs(`left:0;right:0;top:0;height:60px;background:${C.green};color:#111;font-weight:900;font-size:34px;display:flex;align-items:center;padding-left:40px;z-index:8`, '考察');
L('L68a', chapter({ no: '第6章', time: '', title: 'なぜ「実況」は本当に見えたのか' }));
L('L68', frame({ body: band + bigText('考察①　読み手と同じ「いま」', { size: 80, color: C.green }) + abs('left:0;right:0;top:640px;text-align:center;font-size:38px;color:rgba(242,242,242,.7)', '※ここからはチャンネルの考察') }));
L('L69', frame({ body: `<div style="position:absolute;inset:0;opacity:.18">${bbs({})}</div>` + band + abs('inset:0;display:flex;align-items:center;justify-content:center;gap:60px', seg7('23:14:00', { h: 200 }) + `<div style="display:flex;flex-direction:column;gap:30px;font-size:36px;font-weight:900">${sticky('1', 80)} <span>23:14</span>${sticky('2', 80)}<span>23:23</span></div>`) }));
L('L70', frame({ body: exchange({}) + band + telop('考察②　読み手も話の進み方に関わった', 'opinion') }));
L('L71', frame({ body: exchange({ onlyRight: true }) + band + abs(`left:0;right:0;top:120px;display:flex;justify-content:center`, `<div style="outline:6px solid ${C.red};padding:12px 22px;border-radius:10px">${seg7('03:44', { h: 110 })}</div>`) + telop('考察③　終わりではなく「続きが来ない」', 'opinion') }));
L('L72', frame({ body: band + abs('left:0;right:0;top:150px;text-align:center;font-size:36px;font-weight:900', '廣田龍平『ネット怪談の民俗学』（早川書房・2024年）書誌の紹介による') + abs('left:0;right:0;top:320px;display:flex;justify-content:center;align-items:center;gap:120px', `<div style="text-align:center">${icon.pen(160)}<div style="font-size:36px;font-weight:900">ひとりで書く怪談</div></div><div style="font-size:90px;color:${C.amber}">→</div><div style="text-align:center"><div>${icon.pen(110)}${icon.pen(110)}${icon.pen(110)}</div><div>${icon.pen(110)}${icon.pen(110)}</div><div style="font-size:36px;font-weight:900">みんなで組み立てる怪談</div></div>`) + telop('共同構築：みんなで組み立てる怪談（言葉どおりの受け取り方）', 'opinion', { size: 46 }) }));
L('L73', frame({ body: band + vAxis({ items: [ax1, ax2, { t: '03:44', label: '最後の書き込み' }], x: 520, top: 220, gap: 200, labelW: 600 }) + abs('right:220px;top:300px;display:flex;gap:40px', icon.person(180) + icon.person(140) + icon.person(140)) + telop('読み手と同じ「いま」に書かれ、読み手と一緒に作られた実況', 'opinion', { size: 48 }) }));
L('L74', frame({ body: band + yearLine({ active: 2025, pins: [] }) + abs('left:300px;right:300px;top:880px;display:flex;justify-content:space-around', icon.tv(90) + icon.anime(90) + icon.ticket(110) + icon.film(90)) + cnt({ time: '03:44', stopped: true, year: 2025, y: 90 }) }));
// ---------- 整理（L字＋札） ----------
function Lshape({ stage }) {
  // 縦：x=360 / 23:14(y=160) 23:23(y=260) ??(y=360-520) 3:44(y=640) → 横：y=640 から右へ 2004..2025
  const X0 = 360, Y = 680, x1 = 1800;
  const Xy = (yr) => 560 + (x1 - 560) * (yr - 2004) / 21;
  let h = abs(`left:${X0}px;top:150px;width:6px;height:${Y - 150}px;background:#fff`, '') + abs(`left:${X0}px;top:${Y}px;width:${x1 - X0}px;height:6px;background:#fff`, '');
  const pt = (x, y) => abs(`left:${x - 11}px;top:${y - 11}px;width:28px;height:28px;border-radius:50%;background:#fff`, '');
  const lab = (x, y, t, right = true) => abs(`${right ? `left:${x + 40}px` : `right:${1920 - x + 40}px`};top:${y - 26}px;font-size:34px;font-weight:900;display:flex;gap:14px;align-items:center`, t);
  h += pt(X0, 180) + abs(`right:${1920 - X0 + 40}px;top:156px`, seg7('23:14', { h: 46, off: 'transparent' }));
  h += pt(X0, 270) + abs(`right:${1920 - X0 + 40}px;top:246px`, seg7('23:23', { h: 46, off: 'transparent' }));
  h += abs(`right:${1920 - X0 + 40}px;top:400px`, seg7('??:??', { h: 46, on: C.gray, off: 'transparent' }));
  h += pt(X0, 560) + abs(`right:${1920 - X0 + 40}px;top:536px`, seg7('03:44', { h: 46, off: 'transparent' }));
  if (stage >= 1) h += lab(X0, 180, `最初の書き込み ${tag('check', { size: 26 })}`) + lab(X0, 270, `電車の様子 ${tag('check', { size: 26 })}`);
  if (stage >= 2) h += lab(X0, 410, `①〜⑥ 途中の時刻 ${tag('unknown', { size: 26 })}`);
  if (stage >= 3) h += lab(X0, 560, `最後の書き込み ${tag('check', { size: 26 })}　実話か創作か ${tag('unknown', { size: 26 })}`);
  const yrs = [[2014, 'unknown'], [2018, 'check'], [2020, 'check'], [2021, 'check'], [2022, 'check'], [2025, 'check']];
  if (stage >= 4) yrs.forEach(([yr, k], i) => { if (stage < 5 && yr !== 2014) return; h += pt(Xy(yr), Y + 3) + abs(`left:${Xy(yr) - 50}px;top:${Y + 30}px;width:100px;text-align:center`, seg7(String(yr), { h: 28, off: 'transparent' })) + abs(`left:${Xy(yr) - 60}px;top:${Y + (i % 2 ? 120 : 80)}px`, tag(k, { size: 24 })); });
  if (stage >= 6) h += abs(`left:1150px;top:430px;display:flex;flex-direction:column;align-items:center;gap:8px;font-size:28px;font-weight:900;color:${C.gray}`, `${tag('unknown', { size: 28 })}<span>さぎの宮の出どころ</span>`);
  h += abs(`left:0;right:0;bottom:40px;display:flex;justify-content:center;gap:30px;font-size:24px`, `${tag('ok', { size: 22 })}原文確認済 ${tag('check', { size: 22 })}原文確認待ち ${tag('unknown', { size: 22 })}分からない`);
  return h;
}
L('L75', frame({ bg: C.black, body: Lshape({ stage: 0 }) + telop('3:44で止まった記録と、その後の年', 'plain', { bottom: 300 }) }));
L('L76', frame({ bg: C.black, body: Lshape({ stage: 1 }) + telop('23:14 最初の書き込み／23:23 電車の様子（報道による・対応は要確認）', 'fact', { bottom: 120, size: 42 }) }));
L('L77', frame({ bg: C.black, body: Lshape({ stage: 2 }) + telop('途中の時刻：不明', 'unknown', { bottom: 120 }) }));
L('L78', frame({ bg: C.black, body: Lshape({ stage: 3 }) + telop('3:44 最後の書き込み（報道による）／実話か創作か：不明', 'fact', { bottom: 120, size: 44 }) }));
L('L79', frame({ bg: C.black, body: Lshape({ stage: 4 }) + telop('2014 かたす駅：出どころはまとめサイトのみ', 'unknown', { bottom: 120, size: 44 }) }));
L('L80', frame({ bg: C.black, body: Lshape({ stage: 5 }) + telop('2018／2020／2021／2022／2025（報道・公的資料による）', 'fact', { bottom: 120, size: 44 }) }));
L('L81', frame({ bg: C.black, body: Lshape({ stage: 6 }) + telop('「さぎの宮」の出どころ：不明', 'unknown', { bottom: 120 }) }));
L('L82', frame({ bg: C.black, body: Lshape({ stage: 6 }) }));
// ---------- 結び ----------
L('L83', frame({ bg: C.black, body: abs('left:360px;top:150px;width:6px;height:530px;background:#fff', '') + abs('left:360px;top:680px;width:1440px;height:6px;background:#fff', '') + cnt({ time: '03:44', stopped: true, year: 2025 }) + telop('23:14 → 3:44 ／ 2004 → 2025', 'plain', { bottom: 160 }) }));
L('L84', frame({ bg: C.black, body: abs('left:360px;top:680px;width:1200px;height:6px;background:#fff', '') + abs('left:1560px;top:682px;width:340px;border-top:6px dotted #fff', '') + abs('left:1600px;top:560px;display:flex;gap:20px', icon.person(80, C.amber) + icon.person(80, C.amber)) + cnt({ time: '03:44', stopped: true, year: 2025 }) }));
L('L85', frame({ bg: C.black, body: bigText('あなたの「最初のきさらぎ駅」は\n何年？', { size: 90 }) }));
L('L86', frame({ bg: C.black, body: bigText('コメントで教えてください', { size: 80 }) + cnt({ time: '??:??' }) }));


// ---------- ショート（9:16） ----------
const sc = (o) => counter({ ...o, center: true, y: 260, h: 70 });
const st = (t, k = 'plain', o = {}) => telop(t, k, { bottom: 520, size: 60, w: 1080, ...o });
S('S01', frame({ w: 1080, h: 1920, bg: C.black, body: abs('left:0;right:0;top:420px;display:flex;flex-direction:column;align-items:center;gap:70px', seg7('23:14', { h: 170 }) + seg7('23:23', { h: 170 }) + `<div style="height:240px;border-left:8px dotted ${C.gray}"></div>` + seg7('03:44', { h: 170 })) }));
S('S02', frame({ w: 1080, h: 1920, body: bbs({ w: 1080, h: 1920 }) + sc({ time: '23:14' }) + st('2004.1.8 23:14\n最初の書き込み', 'fact') }));
S('S03', frame({ w: 1080, h: 1920, body: scene('G01', { vertical: true, cx: 1220 }) + dark(.45) + bigText('きさらぎ駅', { size: 170, font: 'NSerif', weight: 700 }) + IMGv }));
S('S04', frame({ w: 1080, h: 1920, body: scene('G02', { vertical: true }) + sc({ time: '23:23' }) + st('23:23\n電車が止まらない（要約）', 'fact') + IMGv }));
S('S05a', frame({ w: 1080, h: 1920, body: scene('G03', { vertical: true, cx: 610 }) + abs('left:0;right:0;top:830px;text-align:center;font-family:NSerif;font-weight:700;font-size:140px;color:#1A1A1A', 'きさらぎ') + sc({ time: '??:??' }) + IMGv }));
S('S05b', frame({ w: 1080, h: 1920, body: scene('G04', { vertical: true }) + sc({ time: '??:??' }) + IMGv }));
S('S05c', frame({ w: 1080, h: 1920, body: abs('left:0;right:0;top:500px;display:flex;flex-direction:column;align-items:center;gap:50px', ['?', '?', '?', '?'].map(() => seg7('??:??', { h: 110, on: C.gray, off: 'transparent' })).join('')) + sc({ time: '??:??' }) + st('途中の時刻：？', 'unknown') }));
S('S06', frame({ w: 1080, h: 1920, bg: C.black, body: abs('left:0;right:0;top:640px;display:flex;justify-content:center', seg7('03:44', { h: 260 })) + abs('left:0;right:0;bottom:560px;text-align:center;font-size:76px;font-weight:900', `【3:44】<span style="color:${C.red}">結末なし</span>`) }));
S('S07', frame({ w: 1080, h: 1920, bg: C.black, body: abs('left:0;right:0;top:960px;bottom:0;background:#fff', '') + abs('left:0;right:0;top:1180px;text-align:center;font-family:NSerif;font-size:130px;color:rgba(0,0,0,.25)', '行方不明') + abs('left:0;right:0;top:620px;text-align:center', `<div style="display:inline-block;font-size:54px;font-weight:900;color:${C.yellow};text-shadow:0 0 6px #000">「行方不明」：<br>記録ではなく解釈</div>`) + sc({ time: '03:44' }) }));
S('S08', frame({ w: 1080, h: 1920, bg: C.year, body: abs('left:300px;top:430px;width:6px;height:1000px;background:rgba(242,242,242,.7)', '') + [['2020', 'テレビ', icon.tv(90)], ['2021', 'アニメ', icon.anime(90)], ['2022', 'きっぷ（レプリカ）', icon.ticket(100)], ['2022', '映画 <span style="font-size:28px;background:#B48CFF;color:#111;padding:2px 8px;border-radius:4px">創作</span>', icon.film(90)]].map(([y, t, ic], i) => abs(`left:120px;top:${470 + i * 240}px;display:flex;align-items:center;gap:40px`, seg7(y, { h: 56, off: 'transparent' }) + `<div style="width:30px;height:30px;border-radius:50%;background:#fff;margin-left:-10px"></div>` + ic + `<span style="font-size:52px;font-weight:900">${t}</span>`)).join('') + sc({ time: '03:44', year: 2022 }) }));
S('S09', frame({ w: 1080, h: 1920, bg: C.black, body: abs('left:0;right:0;top:560px;display:flex;flex-direction:column;align-items:center;gap:120px', `<div style="outline:8px solid ${C.red};padding:20px 30px;border-radius:12px">${seg7('03:44', { h: 200 })}</div><div style="display:flex;align-items:center;gap:24px"><span style="font-size:60px;font-weight:900">YEAR</span>${seg7('2025', { h: 200 })}</div>`) }));
S('S10', frame({ w: 1080, h: 1920, bg: C.black, body: abs('left:0;right:0;top:500px;display:flex;justify-content:center;opacity:.5', seg7('23:14', { h: 100 })) + bigText('本編は\nチャンネルから', { size: 100 }) }));

// ---------- サムネ（1280x720） ----------
T('thumb_A_結末がない', frame({ w: 1280, h: 720, bg: '#000', grainOp: .1, body: scene('G08') + abs('left:110px;top:250px', `<div style="outline:5px solid ${C.red};padding:14px 20px;border-radius:8px">${seg7('3:44', { h: 170 })}</div>`) + abs('left:0;top:0;width:1280px;height:720px;display:flex;justify-content:flex-end;align-items:center;padding-right:200px', '<div style="writing-mode:vertical-rl;font-size:124px;font-weight:900;color:#111;line-height:1;letter-spacing:.02em">結末がない</div>') }));
T('thumb_B_分単位の記録', frame({ w: 1280, h: 720, bg: C.navy, grainOp: .1, body: `<div style="position:absolute;inset:0;opacity:.35">${scene('G02')}</div>` + abs('left:90px;top:90px;display:flex;flex-direction:column;gap:34px', seg7('23:14', { h: 120 }) + seg7('23:23', { h: 120 }) + seg7('--:--', { h: 120, on: C.gray }) + seg7('--:--', { h: 120, on: 'rgba(154,160,166,.5)' })) + abs('left:610px;top:180px', `<div style="font-size:54px;font-weight:900;color:${C.yellow}">存在しない駅の</div><div style="font-size:124px;font-weight:900;line-height:1.1;-webkit-text-stroke:3px #000;paint-order:stroke">分単位の<br>記録</div>`) }));
T('thumb_C_読み手も作った', frame({ w: 1280, h: 720, bg: C.navy, grainOp: .1, body: scene('G09') + abs('left:693px;top:287px;width:293px;height:127px;display:flex;align-items:center;justify-content:center;font-family:NSerif;font-weight:700;font-size:62px;color:#1A1A1A', 'きさらぎ') + abs('left:40px;top:40px', seg7('23:14', { h: 50 })) + abs('left:60px;top:230px;font-size:110px;font-weight:900;line-height:1.15;-webkit-text-stroke:3px #000;paint-order:stroke', '読み手も<br>作った？') }));

await render(jobs);
console.log(jobs.length, 'images');
