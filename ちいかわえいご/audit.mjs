// 監視役の自動チェック: node ちいかわえいご/audit.mjs   (NG が 1つでも あれば 終了コード 1)
// 教材データの 抜け・重なり・むずかしすぎる 表記を しらべる。画面の テストは test.mjs。
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const dir=path.dirname(fileURLToPath(import.meta.url));
const src=fs.readFileSync(path.join(dir,'src/data.js'),'utf8').replace(/^const /gm,'globalThis.');
eval(src);
const NG=[],WARN=[];const ng=m=>NG.push(m),warn=m=>WARN.push(m);
const W=new Map(WORDS_RAW.map(w=>[w[0],w]));const KANJI=/[一-鿿]/;
// 1. ことば
const seenEn=new Set();WORDS_RAW.forEach(([en,e,ja,c,b])=>{if(seenEn.has(en))ng(`ことばが 2かい ある: ${en}`);seenEn.add(en);
  if(!CATS[c])ng(`なかまが ない: ${en} (${c})`);if(![1,2,3].includes(b))ng(`レベルが へん: ${en}`);
  if(b===1&&KANJI.test(ja))ng(`ようじ〜小2 の いみに 漢字: ${en} = ${ja}`);if(!ja)ng(`いみが ない: ${en}`);
  if(/\s{2,}|^\s|\s$/.test(en))ng(`よけいな 空白: "${en}"`)});
const ja=WORDS_RAW.map(w=>w[2]);ja.forEach((x,i)=>{if(ja.indexOf(x)!==i)ng(`いみが おなじ ことばが 2つ(クイズで まぎらわしい): ${x}`)});
// 2. コースと かいわ
UNITS.forEach((u,i)=>{u.w.forEach(en=>{if(!W.has(en))ng(`ユニット${i+1} に ない ことば: ${en}`)});if(!DIALOGS[u.d])ng(`ユニット${i+1} の かいわが ない: ${u.d}`);if(u.w.length<5)warn(`ユニット${i+1} の ことばが すくない`)});
Object.entries(DIALOGS).forEach(([k,D])=>{['q','qja','a','aja'].forEach(f=>{if(!D[f])ng(`かいわ ${k} の ${f} が ない`)});
  if(!Array.isArray(D.x)||D.x.length<2)ng(`かいわ ${k} の まちがい選択肢が たりない`);if(D.x&&D.x.includes(D.a))ng(`かいわ ${k}: こたえが まちがいにも ある`);
  if(KANJI.test(D.qja+D.aja))ng(`かいわ ${k} の にほんごに 漢字`);
  const as=new Set(Object.values(DIALOGS).map(x=>x.a));(D.x||[]).forEach(x=>{if(!as.has(x)&&!XJA[x])ng(`かいわ ${k} の まちがい選択肢「${x}」に いみが ない(正解だけ いみが でて しまう)`)})});
// 3. えほん
const glossable=w=>{const k=w.toLowerCase().replace(/[^a-z'-]/g,'');if(!k)return true;return [...W.keys()].some(x=>x.toLowerCase()===k)||GLOSS[k]||GLOSS[k.replace(/'s$/,'')]||GLOSS[k.replace(/s$/,'')]};
STORIES.forEach(s=>{if(!s.opts||s.a==null||!s.opts[s.a])ng(`えほん ${s.id} の クイズが へん`);if(KANJI.test(s.title+s.ask+s.opts.join('')))ng(`えほん ${s.id} に 漢字`);
  s.lines.forEach(l=>l.split(' ').forEach(w=>{if(!glossable(w))ng(`えほん ${s.id}「${w}」の いみが でない`)}))});
// 4. ぶん
SENTS.forEach(([en,j,b])=>{if(!/[.?!]$/.test(en))warn(`ぶんの おわりに . ? ! が ない: ${en}`);if(b===1&&KANJI.test(j))ng(`ようじ〜小2 の ぶんに 漢字: ${j}`)});
// 5. index.html が いまの src から つくった ものと おなじか(build.py の しわすれを ふせぐ)
{const app=fs.readFileSync(path.join(dir,'src/app.html'),'utf8'),built=app.replace('/*@DATA@*/',()=>fs.readFileSync(path.join(dir,'src/data.js'),'utf8')).replace('/*@CHARS@*/',()=>fs.readFileSync(path.join(dir,'src/chars.js'),'utf8'));
  if(!fs.existsSync(path.join(dir,'index.html'))||fs.readFileSync(path.join(dir,'index.html'),'utf8')!==built)ng('index.html が いまの src から つくられて いない(python3 src/build.py を じっこう)')}
console.log(`ことば ${WORDS_RAW.length} / ユニット ${UNITS.length} / かいわ ${Object.keys(DIALOGS).length} / ぶん ${SENTS.length} / えほん ${STORIES.length}`);
WARN.forEach(m=>console.log('注意: '+m));NG.forEach(m=>console.log('NG: '+m));
console.log(NG.length?`判定: 差し戻し(NG ${NG.length})`:'判定: OK');process.exit(NG.length?1:0);
