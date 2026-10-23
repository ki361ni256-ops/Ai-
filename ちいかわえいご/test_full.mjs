// 自動テスト(通しで): node ちいかわえいご/test_full.mjs [画像フォルダ]
// 本物と おなじく「こおった(かきかえ できない)データ」を かえす にせの アカウント保存を つかう。
// 時計は Playwright の clock で すすめる(3びょう まち・つぎの 日 を ためす ため)。
import {chromium} from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';import path from 'path';import {fileURLToPath} from 'url';
const dir=path.dirname(fileURLToPath(import.meta.url)),OUT=process.argv[2]||fs.mkdtempSync('/tmp/eigo-full-');
const page_html=path.join(OUT,'p.html');
fs.writeFileSync(page_html,'<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+fs.readFileSync(path.join(dir,'index.html'),'utf8')+'</body></html>');
const results=[];const ok=(name,cond,info='')=>{results.push([cond?'OK':'NG',name,info]);console.log((cond?'OK  ':'NG  ')+name+(info?'  ('+info+')':''))};
const store={};
const b=await chromium.launch();
async function open({w=400,h=860,time,noVoice=false,clearLocal=false,ctx}={}){
  ctx=ctx||await b.newContext({viewport:{width:w,height:h},timezoneId:'Asia/Tokyo'});
  if(!ctx.__setup){ctx.__setup=1;
    await ctx.exposeFunction('dbOp',(op,k,v)=>{if(op==='get')return store[k]?JSON.stringify(store[k]):null;if(op==='set'){store[k]=JSON.parse(v);return null}if(op==='del'){delete store[k];return null}});
    await ctx.addInitScript(()=>{const df=o=>{if(o&&typeof o==='object'){Object.values(o).forEach(df);Object.freeze(o)}return o};
      const doc=p=>{const k=p.split('/').pop();return {get:async()=>{const r=await window.dbOp('get',k);return {exists:!!r,data:()=>df(JSON.parse(r))}},set:async v=>window.dbOp('set',k,JSON.stringify(v)),delete:async()=>window.dbOp('del',k)}};
      window.claude={use:async n=>n==='db'?{doc}:n==='user'?{id:async()=>'u1'}:null};
      if(window.__noVoice)try{delete window.speechSynthesis}catch(e){}});}
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));p.__errs=errs;
  if(noVoice)await p.addInitScript(()=>{Object.defineProperty(window,'speechSynthesis',{value:undefined,configurable:true})});
  await p.clock.install({time:time||new Date('2026-10-26T08:00:00+09:00')});
  await p.goto('file://'+page_html+'#qa');
  if(clearLocal)await p.evaluate(()=>localStorage.clear());
  await p.clock.runFor(1500);await p.waitForTimeout(300);
  for(let i=0;i<20&&!(await p.$('.splash .go:not([disabled]), .splash .whos button'));i++){await p.clock.runFor(1000);await p.waitForTimeout(100)}
  if(!(await p.$('.splash .go:not([disabled]), .splash .whos button')))console.log('   open failed. errors:',errs.join(' | '),'\n   html:',(await p.content()).slice(-300));
  await p.click('.splash .go:not([disabled]), .splash .whos button',{timeout:5000});await p.waitForTimeout(200);
  return p}
const S=p=>p.evaluate(()=>JSON.parse(JSON.stringify(window.__qa.save())));
const tick=async(p,ms=4000)=>{await p.clock.runFor(ms);await p.waitForTimeout(80)};
// いまの もんだいに こたえる(right=true で せいかい、false で まちがい)
async function answer(p,right=true){const q=await p.evaluate(()=>{const s=window.__qa.st(),q=s.qs&&s.qs[s.i];return q?{type:q.type,answer:q.answer,accepts:q.accepts,chunks:q.chunks,join:q.join}:null});if(!q)return false;
  if(q.type==='choice'){const sel=right?`.choice[data-v="${q.answer.replace(/"/g,'\\"')}"]`:'.choice:not([disabled])';
    if(right)await p.click(sel);else{const cs=await p.$$('.choice:not([disabled])');for(const c of cs){if((await c.getAttribute('data-v'))!==q.answer){await c.click();break}}}}
  else if(q.type==='order'){const toks=q.join?q.accepts[0].split(' '):q.accepts[0].split('');const used=new Set();
    for(const t of (right?toks:toks.slice().reverse())){const i=q.chunks.findIndex((c,k)=>c===t&&!used.has(k));used.add(i);await p.click(`.chipw[data-a="chunk"][data-k="${i}"]`);await p.waitForTimeout(30)}}
  else if(q.type==='speak'){await tick(p,9000);await p.click('#saidbtn')}
  else if(q.type==='recall'){await tick(p,9000);await p.click('[data-a="reveal"]');await p.click(right?'[data-a="rcok"]':'[data-a="rcng"]')}
  await tick(p,2500);if(await p.$('[data-a="next"]')){await p.click('[data-a="next"]');await tick(p,500)}return true}
async function playAll(p,right=true){for(let n=0;n<80;n++){if(await p.$('.result'))return true;if(await p.$('#saidbtn[data-a="lnext"]')){await tick(p,9000);await p.click('#saidbtn');await tick(p,300);continue}
  if(!(await answer(p,typeof right==='function'?right(n):right)))await tick(p,500)}return !!(await p.$('.result'))}
const noHScroll=async p=>(await p.evaluate(()=>document.documentElement.scrollWidth))<=(await p.evaluate(()=>window.innerWidth));

// ===== 1. はじめて つかう =====
let p=await open();
ok('はじめて:ホームに「きょうの えいご」ボタン',!!(await p.$('.gobtn')));
ok('はじめて:ことばの きろくは まだ 0',Object.keys((await S(p)).kn).length===0);
await p.click('[data-a="go"]');await tick(p,300);
ok('きょうの えいご → まなぶ(1まいずつ)が はじまる',!!(await p.$('#saidbtn[data-a="lnext"]')));
ok('まなぶ:「いえた!」は すぐには おせない',await p.$eval('#saidbtn',e=>e.disabled));
await tick(p,9000);ok('まなぶ:3びょう たつと おせる(数字は でない)',!(await p.$eval('#saidbtn',e=>e.disabled))&&!/\d/.test(await p.$eval('#saidbtn',e=>e.textContent)));
ok('まなぶ→確認クイズ を 最後まで できる',await playAll(p,true));
let sv=await S(p);ok('ミッション:コース 10ポイント(全問せいかい)',sv.pts['2026-10-26']===10,JSON.stringify(sv.mp));
ok('ことばの きろくが できる(はじめて せいかい・つぎの 復習日)',Object.values(sv.kn).some(r=>r.fo==='2026-10-26'&&r.due==='2026-10-27'),Object.keys(sv.kn).length+'こ');
ok('結果画面に「きょう できたこと」が でる',!!(await p.$('.gain')));
await p.screenshot({path:OUT+'/1_result.png',fullPage:true});
// ===== 2. まちがい・ヒント =====
await p.click('[data-a="cnext"]');await tick(p,600);
const before=await S(p);
await answer(p,false);sv=await S(p);const wasWrongQ=true;
const ngItem=Object.entries(sv.kn).find(([k,r])=>r.ng>0);
ok('まちがえた:きろくに まちがいが のこる(にがて にも 入る)',!!ngItem&&Object.keys(sv.miss).length>Object.keys(before.miss).length);
ok('まちがえた:責めない ことば',!(await p.textContent('#bubble')).match(/ちがう|ダメ|だめ|×/));
// ヒント(まちがえた もんだいを せいかい してから、つぎの もんだいで ためす)
await answer(p,true);
let used=false;for(let n=0;n<12&&!used;n++){const t=await p.evaluate(()=>{const s=window.__qa.st(),q=s.qs&&s.qs[s.i];return q&&q.type});const rt=await p.evaluate(()=>{const s=window.__qa.st();return !!(s.qs[s.i]&&s.qs[s.i].retry)});if(t==='choice'&&!rt&&await p.$('#hintbtn:not([disabled])')){await p.click('#hintbtn');used=true;const left=await p.$$eval('.choice:not([disabled])',e=>e.length);ok('ヒント:えらぶ ものが 2つ いかに なる',left<=2,left+'こ');const hi=await p.evaluate(()=>{const s=window.__qa.st(),q=s.qs[s.i];return {hinted:s.hinted,first:s.first,mode:q.mode,item:q.item,retry:!!q.retry}});console.log('   hint q:',JSON.stringify(hi));await answer(p,true)}else await answer(p,true)}
sv=await S(p);ok('ヒント:ヒントあり せいかいは べつに きろく',Object.values(sv.kn).some(r=>r.h>0));
await playAll(p,true);
// ===== 3. 保存と さいきどう =====
const kn1=Object.keys((await S(p)).kn).length,pts1=(await S(p)).pts['2026-10-26'];
await p.reload();await p.clock.runFor(1500);await p.waitForTimeout(200);for(let i=0;i<10&&!(await p.$('.splash .go:not([disabled])'));i++)await tick(p,1000);await p.click('.splash .go');
sv=await S(p);ok('さいきどう:進み・ポイント・きろくが のこる',Object.keys(sv.kn).length===kn1&&sv.pts['2026-10-26']===pts1&&sv.cp>=2,`kn ${kn1} pts ${pts1} cp ${sv.cp}`);
ok('アカウント保存にも のこる',!!store.meta&&store.meta.ids.length===1&&Object.keys(store['p_'+store.meta.ids[0]].kn||{}).length===kn1);
// 端末の きろくが きえても アカウントから もどる
const p2=await open({clearLocal:true});sv=await S(p2);ok('端末の きろくが きえても アカウントから もどる(あたらしい からっぽを つくらない)',Object.keys(sv.kn).length===kn1&&store.meta.ids.length===1);await p2.close();
// ===== 4. ごほうびが ふえすぎない =====
await p.click('[data-a="go"]');await tick(p,300);
for(let n=0;n<6;n++){const scr=await p.evaluate(()=>window.__qa.st().screen);if(scr==='story'){await p.click('[data-a="squiz"]');await tick(p,300)}
  if(scr==='squiz'||await p.$('[data-a="sans"]')){const a=await p.evaluate(()=>window.__qa.st().s.a);await p.click(`[data-a="sans"][data-k="${a}"]`);await tick(p,1500);break}}
sv=await S(p);ok('えほん ミッション 5ポイント',sv.mp['2026-10-26'].story===5,JSON.stringify(sv.mp['2026-10-26']));
await p.click('[data-a="home"]');await tick(p,300);await p.click('[data-a="go"]');await tick(p,300);await playAll(p,true);
sv=await S(p);ok('3つで ちょうど 20ポイント',sv.pts['2026-10-26']===20,String(sv.pts['2026-10-26']));
await p.click('[data-a="home"]');await tick(p,300);await p.click('[data-a="go"]');await tick(p,300);await playAll(p,true);
sv=await S(p);ok('ミッション後は ポイントが ふえない(⭐だけ)',sv.pts['2026-10-26']===20);
await p.click('[data-a="home"]');await tick(p,300);
await p.click('[data-a="gacha"]');await p.click('[data-a="gpull"]');await tick(p,2000);
const st1=(await S(p)).stickers.length;await p.click('[data-a="home"]');await tick(p,300);
ok('シールくじは 1日 1かい(ホームから きえる)',!(await p.$('[data-a="gacha"]'))&&st1>=1);
// ===== 5. つぎの 日:形を かえて 復習 =====
const day1=await S(p);await p.close();
p=await open({time:new Date('2026-10-27T08:00:00+09:00')});
await p.evaluate(()=>{const b=document.createElement('button');b.dataset.a='start';b.dataset.k='due';b.id='duebtn';document.body.appendChild(b)});await p.click('#duebtn');await tick(p,400);
const dq=await p.evaluate(()=>window.__qa.st().qs.map(q=>({m:q.mode,item:q.item,src:!!q.fromSrs})));
const lm=day1.kn;const varied=dq.filter(x=>x.src).map(x=>{const id=x.m==='recall'?x.item:(x.m==='talk'?'d:'+x.item:(x.m==='hear'||x.m==='order'?'s:'+x.item:(x.m==='abc'?'l:'+x.item:'w:'+x.item)));return lm[id]&&lm[id].lm!==x.m});
ok('つぎの 日:きのう ならった ことばが 復習に でる',dq.some(x=>x.src),dq.length+'もん');
ok('復習は まえと ちがう 形式で でる',varied.filter(Boolean).length>=Math.ceil(varied.length*0.6),`${varied.filter(Boolean).length}/${varied.length}`);
await playAll(p,true);sv=await S(p);
ok('2日目 せいかいで つよさが 上がり、復習日が のびる',Object.values(sv.kn).some(r=>r.st>=2&&dNumJS(r.due)>dNumJS('2026-10-28')));
function dNumJS(k){return new Date(k.replace(/-/g,'/')).getTime()}
await p.close();
// ===== 6. ボス =====
const pid=store.meta.ids[0];const prof=JSON.parse(JSON.stringify(store['p_'+pid]));prof.cp=15;prof.upd=Date.now()+1e6;store['p_'+pid]=prof;
p=await open({time:new Date('2026-10-28T08:00:00+09:00'),clearLocal:true});
ok('5ユニット おわると ボスが でる',(await p.textContent('.gobtn')).includes('ボス'));
await p.click('[data-a="go"]');await tick(p,300);ok('ボスの おはなし 画面',!!(await p.$('[data-a="bossgo"]')));
await p.click('[data-a="bossgo"]');await tick(p,300);await playAll(p,true);sv=await S(p);
ok('ボスに かつと つぎの エリアが ひらく',!!sv.boss[0]);
await p.click('[data-a="course"]');await tick(p,300);ok('つぎの エリアの ユニット6が ひらく',!(await p.$eval('#u5',e=>e.disabled)));
await p.screenshot({path:OUT+'/6_map.png',fullPage:true});
// ===== 7. 画面の 大きさ・おうちの ひと =====
for(const [w,h] of [[320,640],[1024,768]]){await p.setViewportSize({width:w,height:h});await p.click('[data-a="home"]').catch(()=>{});await tick(p,200);ok(`よこ はば ${w}px で よこスクロール なし(ホーム)`,await noHScroll(p))}
await p.setViewportSize({width:400,height:860});
await p.click('[data-a="parent"]');const q=await p.textContent('.word');const [x,y]=q.match(/\d+/g).map(Number);for(const d of String(x*y))await p.click(`[data-a="gk"][data-k="${d}"]`);await p.click('[data-a="gk"][data-k="OK"]');await tick(p,300);
ok('おうちの ひと:4つの ちからと おぼえぐあいが でる',(await p.textContent('#app')).includes('4つの ちから'));
ok('おうちの ひと:よこスクロール なし',await noHScroll(p));
await p.screenshot({path:OUT+'/7_parent.png',fullPage:true});
ok('ページエラー なし(ここまで)',p.__errs.length===0,p.__errs.join(' | '));
await p.close();
// ===== 8. 音が でない 端末 =====
p=await open({noVoice:true,time:new Date('2026-10-29T08:00:00+09:00')});
await p.click('[data-a="go"]');await tick(p,300);const fin=await playAll(p,true);
ok('音が でなくても 学習が とまらない',fin,p.__errs.join(' | '));
await p.close();await b.close();
const ngs=results.filter(r=>r[0]==='NG');console.log(`\n${results.length}こ ちゅう OK ${results.length-ngs.length} / NG ${ngs.length}`);console.log('画像:',OUT);process.exit(ngs.length?1:0);
