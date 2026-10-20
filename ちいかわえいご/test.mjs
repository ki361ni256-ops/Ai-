// 画面の テスト: node ちいかわえいご/test.mjs [画像を おく フォルダ]  (Playwright が いる)
import {chromium} from '/opt/node-tools/node_modules/playwright/index.mjs';
import fs from 'fs';
const S=process.argv[2]||fs.mkdtempSync('/tmp/eigo-');
const body=fs.readFileSync('/home/user/Ai-/ちいかわえいご/index.html','utf8');
fs.writeFileSync(S+'/p.html','<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1"></head><body>'+body+'</body></html>');
const b=await chromium.launch();const p=await b.newPage({viewport:{width:400,height:860}});
const errs=[];p.on('pageerror',e=>errs.push('ERR '+e.message));
await p.goto('file://'+S+'/p.html');await p.click('.splash');await p.waitForTimeout(300);
await p.screenshot({path:S+'/c_home.png',fullPage:true});
// cheat: pick correct answer by trying choices in order (wrong first-tries lower score). Instead read answer via retry: fine.
async function round(){for(let n=0;n<300;n++){
  if(await p.$('.result'))return;
  const learn=await p.$('[data-a="next"]');if(learn){await learn.click();await p.waitForTimeout(200);continue}
  if(await p.$('[data-a="said"]')){await p.click('[data-a="said"]');await p.waitForTimeout(1300);continue}
  const c=await p.$('.choice:not([disabled])');if(c){await c.click();await p.waitForTimeout(1300);continue}
  await p.waitForTimeout(500)}}
await p.click('[data-a="cnext"]');await p.waitForTimeout(300);await p.screenshot({path:S+'/c_learn.png'});
while(await p.$('[data-a="lnext"]')){await p.click('[data-a="lnext"]');await p.waitForTimeout(150)}
await round();await p.screenshot({path:S+'/c_res1.png',fullPage:true});
console.log('after step1 text:',(await p.textContent('.result')).replace(/\s+/g,' ').slice(0,300));
await p.click('[data-a="course"]');await p.waitForTimeout(300);await p.screenshot({path:S+'/c_map.png'});
await p.click('[data-a="unit"][data-k="0"]');await p.screenshot({path:S+'/c_unit.png',fullPage:true});
await p.click('[data-a="ustep"][data-k="0:2"]').catch(()=>console.log('step3 locked as expected'));
await p.click('[data-a="course"]');await p.click('[data-a="home"]');
await p.click('[data-a="start"][data-k="talk"]');await p.waitForTimeout(300);await p.screenshot({path:S+'/c_talk.png'});
await round();console.log('talk result:',(await p.textContent('.ptsbox')).replace(/\s+/g,' '));
await p.click('[data-a="home"]');await p.screenshot({path:S+'/c_home2.png',fullPage:true});
await p.click('[data-a="parent"]');const q=await p.textContent('.word');const [a,bb]=q.match(/\d+/g).map(Number);
for(const d of String(a*bb))await p.click(`[data-a="gk"][data-k="${d}"]`);await p.click('[data-a="gk"][data-k="OK"]');await p.waitForTimeout(300);
await p.click('[data-a="padj"][data-k="5"]');await p.screenshot({path:S+'/c_parent.png',fullPage:true});
console.log('scrollWidth',await p.evaluate(()=>document.documentElement.scrollWidth));console.log(errs.join('\n')||'no errors');await b.close();
