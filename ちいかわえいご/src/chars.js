/* ---------- なかまの え(ちいかわ がくしゅうランドと おなじ 描きかた) ---------- */
const CHARS={
  chiikawa:{name:'ちいかわ',start:['いっしょに がんばろ…!','がんばる…!'],ok:['…!!(やったぁ)','わぁ…!すごい…!','できた…!'],ng:['(なきそう…)でも もういっかい…!','うぅ…つぎは できる…!'],end:'ぜんぶ おわった…!えらい…!'},
  hachiware:{name:'ハチワレ',start:['なんとかなれーッ!','いっしょに やってみよ!'],ok:['すごーい!','てんさいじゃん!','やったね!','かんぺき!'],ng:['だいじょうぶ!もういっかい!','おしい〜!','あわてない あわてない!'],end:'さいごまで できたね!すごいよ!'},
  usagi:{name:'うさぎ',start:['ウラ!','ヤハ!'],ok:['ヤハ!','ウラ!','ヤハーッ!!','ハァ〜!'],ng:['フゥン…','プルルル…','ウラ…?'],end:'ヤハーッ!!!'},
  momonga:{name:'モモンガ',start:['はやく やろうよ〜!','かわいい ぼくと いっしょだよ!'],ok:['ほめて ほめて!','やったー!','とうぜん でしょ!'],ng:['え〜っ!','もう いっかい!'],end:'もっと ほめて〜!'},
  kurimanju:{name:'くりまんじゅう',start:['ゆっくり いこう','ひと休みしてから がんばろ'],ok:['ハァ〜…いいね','おみごと'],ng:['あわてない あわてない','ふぅ…もういちど'],end:'ハァ〜〜っ…さいこう'},
  rakko:{name:'ラッコ',start:['しゅぎょうの はじまりだ','いざ!'],ok:['みごと!','いい うでだ'],ng:['まだまだ これから','あせらず いこう'],end:'よく がんばった!'},
  shisa:{name:'シーサー',start:['がんばるさー!','いっしょに やるさー!'],ok:['すごいさー!','やったさー!'],ng:['だいじょうぶさー','つぎ がんばるさー'],end:'さいこうさー!'},
  furuhonya:{name:'古本屋',start:['いい 本 ありますよ','ゆっくり よんでいこう'],ok:['おみごと','よく しってるね'],ng:['もう いちど よんでみよう','だいじょうぶ'],end:'たくさん まなんだね'},
  anoko:{name:'あのこ',start:['いっしょに あそぼ!','やってみよう!'],ok:['わぁ〜!','すごいすごい!'],ng:['ありゃ〜','つぎは できるよ'],end:'たのしかったね!'},
  dekatsuyo:{name:'でかつよ',start:['いくぞーっ!','ちからを みせろ!'],ok:['つよい!','やるな!'],ng:['まだまだ!','もう いっかい こい!'],end:'さいきょうだ!'},
  ode:{name:'オデ',start:['オデ がんばる','オデも いっしょ'],ok:['オデ うれしい','すごい'],ng:['オデも まちがう','だいじょうぶ'],end:'オデ たのしかった'},
  kimera:{name:'キメラ',start:['いっしょに がんばろう','やってみる…!'],ok:['うれしい…!','できたね!'],ng:['なかないで…','つぎ いこう'],end:'がんばったね…!'},
  yoroi:{name:'鎧さん',start:['では まいろう','しっかり いこう'],ok:['おみごと!','りっぱだ'],ng:['あせらずに','もういちど ためそう'],end:'よく やりとげた!'},
  kabutomushi:{name:'カブトムシ',start:['がんばろうね','いっしょに いこう'],ok:['すてき!','やったね'],ng:['だいじょうぶだよ','もう いちど'],end:'よく できました'},
  goblin:{name:'ゴブリン',start:['がんばるぞ!','やってみよう'],ok:['いいね!','すごいぞ'],ng:['ドンマイ','つぎ つぎ!'],end:'よく がんばった!'},
  hoshi:{name:'星',start:['キラッ!','かがやこう!'],ok:['キラキラ!','ピカーッ!'],ng:['くもっても だいじょうぶ','また ひかろう'],end:'きみも ひかってるよ!'}
};
function charSVG(kind,mood){
  mood=mood||'normal';if(!CHARS[kind])kind='hachiware';const id='c'+(++uid);
  const white='#ffffff', blue='#93abd2', cream='#f8e7a4';
  const FILL={usagi:cream,kurimanju:'#f6dcae',rakko:'#f7ebd0',shisa:'#f8e9c2',furuhonya:'#fadadd',ode:'#f8e7b4',kimera:'#f7b9cb',yoroi:'#c9c9c9',goblin:'#c3dca0',hoshi:'#fff04a'},fill=FILL[kind]||white;
  const S=`stroke="${INK}" stroke-width="3" stroke-linejoin="round"`,L=w=>`fill="none" stroke="${INK}" stroke-width="${w}" stroke-linecap="round"`;
  const HEAD='<ellipse cx="60" cy="62" rx="44" ry="38"',hd=(f,x)=>`${HEAD} fill="${f}" ${x||S}/>`,clip=`<clipPath id="${id}">${HEAD}/></clipPath>`;
  let s=`<svg viewBox="0 0 120 124" role="img" aria-label="${CHARS[kind].name}">`;
  // Stars have no body; everyone else gets a small body under the head.
  if(kind==='hoshi'){
    const P=[];for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,r=i%2?24:52;P.push((60+r*Math.cos(a)).toFixed(1)+' '+(66+r*Math.sin(a)).toFixed(1))}
    s+=`<path d="M${P.join(' L')} Z" fill="${fill}" ${S}/>`;
    s+= mood==='happy'?`<path d="M44 62 q5 -7 10 0" ${L(3.2)}/><path d="M66 62 q5 -7 10 0" ${L(3.2)}/><path d="M52 70 Q60 80 68 70 Z" fill="#e9707f" ${S}/>`
      :`<ellipse cx="49" cy="62" rx="4" ry="4.6" fill="${INK}"/><ellipse cx="71" cy="62" rx="4" ry="4.6" fill="${INK}"/><path d="M52 71 h16 M55 71 v3 M65 71 v3" ${L(2.6)}/>`;
    if(mood==='oops') s+=`<path d="M45 68 q-4 8 0 12 q4 -4 0 -12z" fill="#8ec8f2"/>`;
    return s+'</svg>';
  }
  if(kind==='dekatsuyo'){s+=`<circle cx="60" cy="64" r="56" fill="#fff38a"/>`;for(let i=0;i<20;i++){const a=i/20*Math.PI*2;s+=`<path d="M${(60+46*Math.cos(a)).toFixed(1)} ${(64+46*Math.sin(a)).toFixed(1)} L${(60+54*Math.cos(a)).toFixed(1)} ${(64+54*Math.sin(a)).toFixed(1)}" ${L(2.4)}/>`}}
  if(kind==='momonga') s+=`<path d="M92 104 C118 96 120 60 104 48 C100 66 96 84 84 96 Z" fill="${white}" ${S}/>`;
  if(kind==='shisa') [[-1,0],[1,0]].forEach(([d])=>{for(let i=0;i<4;i++){const y=44+i*13;s+=`<circle cx="${60+d*46}" cy="${y}" r="9" fill="#ef9a55" ${S}/>`}});
  s+=`<ellipse cx="60" cy="106" rx="24" ry="14" fill="${kind==='kabutomushi'?'#9a6a3c':fill}" ${S}/>`;
  // ears and things behind the head
  if(kind==='chiikawa') s+=`<circle cx="30" cy="36" r="11" fill="${white}" ${S}/><circle cx="90" cy="36" r="11" fill="${white}" ${S}/>`;
  if(kind==='hachiware') s+=`<path d="M22 50 L28 15 L52 32 Z" fill="${blue}" ${S}/><path d="M98 50 L92 15 L68 32 Z" fill="${blue}" ${S}/>`;
  if(kind==='usagi') s+=`<ellipse cx="51" cy="24" rx="8" ry="24" fill="${cream}" ${S}/><ellipse cx="69" cy="24" rx="8" ry="24" fill="${cream}" ${S}/><ellipse cx="51" cy="22" rx="3" ry="15" fill="#f6b3c0"/><ellipse cx="69" cy="22" rx="3" ry="15" fill="#f6b3c0"/>`;
  if(kind==='momonga') [[30,-1],[90,1]].forEach(([x])=>{s+=`<ellipse cx="${x}" cy="28" rx="15" ry="17" fill="${white}" ${S}/><ellipse cx="${x}" cy="30" rx="8" ry="10" fill="#cfe3f5"/>`});
  if(kind==='rakko'||kind==='kimera'){const c=kind==='kimera'?INK:fill;s+=`<circle cx="27" cy="38" r="8" fill="${c}" ${S}/><circle cx="93" cy="38" r="8" fill="${c}" ${S}/>`}
  if(kind==='shisa') s+=`<path d="M26 44 L30 22 L46 32 Z" fill="${fill}" ${S}/><path d="M94 44 L90 22 L74 32 Z" fill="${fill}" ${S}/>`;
  if(kind==='furuhonya') [32,88].forEach(x=>{s+=`<path d="M${x-14} 34 C${x-18} 14 ${x-6} 10 ${x} 18 C${x+6} 10 ${x+18} 14 ${x+14} 34 Z" fill="#f19cb0" ${S}/>`});
  if(kind==='anoko') s+=`<circle cx="32" cy="30" r="9" fill="${white}" ${S}/><circle cx="88" cy="30" r="9" fill="${white}" ${S}/>`;
  if(kind==='dekatsuyo') s+=`<path d="M30 36 Q24 14 36 6 Q34 22 42 32 Z" fill="${white}" ${S}/><path d="M90 36 Q96 14 84 6 Q86 22 78 32 Z" fill="${white}" ${S}/><path d="M33 22 h6 M85 22 h6" ${L(2)}/>`;
  if(kind==='goblin') s+=`<path d="M22 58 L2 46 L20 76 Z" fill="${fill}" ${S}/><path d="M98 58 L118 46 L100 76 Z" fill="${fill}" ${S}/><path d="M48 28 L60 10 L72 28 Z" fill="${fill}" ${S}/>`;
  if(kind==='kabutomushi') s+=`<path d="M52 24 Q50 12 40 10 Q50 4 60 12 Q70 4 80 10 Q70 12 68 24 Z" fill="#9a6a3c" ${S}/>`;
  // head
  if(kind==='anoko'){let p='';for(let i=0;i<24;i++){const a=i/24*Math.PI*2,r=i%2?40:45;p+=(i?' L':'M')+(60+r*1.08*Math.cos(a)).toFixed(1)+' '+(62+r*.88*Math.sin(a)).toFixed(1)}s+=`<path d="${p} Z" fill="${white}" ${S}/>`}
  else if(kind==='rakko') s+=hd(fill,`stroke="${INK}" stroke-width="3" stroke-dasharray="3 6" stroke-linecap="round"`);
  else if(kind==='yoroi') s+=`<path d="M22 50 C22 20 98 20 98 50 L96 76 C90 96 74 104 60 104 C46 104 30 96 24 76 Z" fill="${fill}" ${S}/>`;
  else if(kind==='kabutomushi') s+=hd('#9a6a3c')+'<ellipse cx="60" cy="64" rx="34" ry="29" fill="#fff" stroke="'+INK+'" stroke-width="2.4"/>';
  else s+=hd(fill);
  // patterns on the head
  if(kind==='hachiware') s+=clip+`<path clip-path="url(#${id})" d="M10 10 H110 V56 C96 54 80 50 67 32 L60 25 L53 32 C40 50 24 54 10 56 Z" fill="${blue}"/>`+hd('none');
  if(kind==='kurimanju') s+=clip+`<path clip-path="url(#${id})" d="M0 0 H120 V44 C104 36 92 50 80 42 C70 36 64 46 56 42 C44 36 34 48 20 42 L0 44 Z" fill="#9a6a3c"/>`+hd('none');
  if(kind==='furuhonya') s+=clip+`<path clip-path="url(#${id})" d="M0 0 H120 V40 C90 32 30 32 0 40 Z" fill="#f4a7b5"/>`+hd('none')+`<path d="M41 47 l6 1 M41 51 l6 1 M79 48 l-6 1 M79 52 l-6 1" ${L(2)}/>`;
  if(kind==='yoroi') return s+`<path d="M60 26 V48" ${L(3)}/><path d="M28 58 Q60 50 92 58 L90 66 Q60 60 30 66 Z" fill="${INK}"/>${mood==='happy'?`<path d="M42 58 l4 -4 l4 4 M70 58 l4 -4 l4 4" stroke="#fff" stroke-width="2" fill="none"/>`:''}<rect x="48" y="76" width="24" height="12" rx="3" fill="#fff" ${S}/><path d="M54 76 v12 M60 76 v12 M66 76 v12 M48 82 h24" ${L(1.6)}/><path d="M60 88 V102" ${L(3)}/>`+(mood==='oops'?`<path d="M96 30 q-4 8 0 12 q4 -4 0 -12z" fill="#8ec8f2"/>`:'')+'</svg>';
  if(kind==='ode'){const e=mood==='happy'?`<path d="M50 50 q10 -12 20 0" ${L(3.4)}/>`:`<circle cx="60" cy="48" r="12" fill="#fff" ${S}/><circle cx="60" cy="49" r="4.5" fill="${INK}"/>`;
    return s+e+`<path d="M30 70 C30 60 48 66 60 64 C72 66 90 60 90 70 C90 82 72 76 60 78 C48 76 30 82 30 70 Z" fill="#f6d39a" ${S}/><path d="M36 71 Q60 73 84 71" ${L(2)}/>`+(mood==='oops'?`<path d="M74 44 q-4 8 0 12 q4 -4 0 -12z" fill="#8ec8f2"/>`:'')+`<circle cx="38" cy="106" r="7" fill="${fill}" ${S}/><circle cx="82" cy="106" r="7" fill="${fill}" ${S}/></svg>`}
  if(kind==='dekatsuyo'){s+=`<path d="M36 52 q8 -6 16 0 M68 52 q8 -6 16 0" ${L(2.4)}/>`;
    s+= mood==='happy'?`<path d="M38 62 q6 -8 12 0 M70 62 q6 -8 12 0" ${L(3.2)}/>`:`<ellipse cx="44" cy="62" rx="6" ry="7" fill="#fff" ${S}/><ellipse cx="76" cy="62" rx="6" ry="7" fill="#fff" ${S}/><circle cx="44" cy="63" r="3.4" fill="#d9475a"/><circle cx="76" cy="63" r="3.4" fill="#d9475a"/>`;
    return s+`<ellipse cx="60" cy="72" rx="5" ry="3.4" fill="#a8746a" ${S}/><path d="M36 78 Q60 96 84 78 Z" fill="${INK}"/><path d="M40 80 l4 5 l4 -4 l4 5 l4 -4 l4 5 l4 -5 l4 4 l4 -5 l4 4" fill="#fff" stroke="#fff" stroke-width="1.4"/><circle cx="38" cy="106" r="7" fill="${white}" ${S}/><circle cx="82" cy="106" r="7" fill="${white}" ${S}/></svg>`}
  // extras on the face
  if(kind==='rakko') s+=`<path d="M38 44 l3 6 l6 1 l-5 4 l1 6 l-5 -3 l-5 3 l1 -6 l-5 -4 l6 -1 Z" fill="#fff" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>`;
  if(kind==='shisa') s+=`<path d="M36 52 q8 -8 16 0 M68 52 q8 -8 16 0" fill="none" stroke="#e07a2c" stroke-width="4" stroke-linecap="round"/>`;
  if(kind==='anoko') s+=`<path d="M60 38 l-4 8 h8 Z" fill="#f2b28c" ${S} stroke-width="2"/>`;
  if(kind==='momonga'||kind==='kimera') s+=`<path d="M10 66 h14 M12 74 l13 -3 M110 66 h-14 M108 74 l-13 -3" ${L(2)}/>`;
  if(kind==='momonga') s+=`<ellipse cx="60" cy="66" rx="4" ry="3" fill="#a9cdee"/>`;
  // cheeks
  if(kind!=='anoko') s+=`<ellipse cx="33" cy="73" rx="7.5" ry="4.5" fill="#f9b6c4"/><ellipse cx="87" cy="73" rx="7.5" ry="4.5" fill="#f9b6c4"/>`;
  // eyes
  if(mood==='happy'){
    s+=`<path d="M38 63 q6 -9 12 0" ${L(3.4)}/><path d="M70 63 q6 -9 12 0" ${L(3.4)}/>`;
  }else if(kind==='anoko'){
    s+=`<circle cx="44" cy="60" r="8" fill="#fff" ${S}/><circle cx="76" cy="60" r="8" fill="#fff" ${S}/><circle cx="46" cy="61" r="4" fill="${INK}"/><circle cx="78" cy="61" r="4" fill="${INK}"/>`;
  }else{
    const sm=['usagi','kurimanju','rakko','kabutomushi','goblin','shisa'].includes(kind),big=kind==='momonga'; const rx=sm?3.4:big?6.5:4.8, ry=sm?3.8:big?8:6.2;
    s+=`<ellipse cx="44" cy="60" rx="${rx}" ry="${ry}" fill="${INK}"/><ellipse cx="76" cy="60" rx="${rx}" ry="${ry}" fill="${INK}"/>`;
    if(!sm) s+=`<circle cx="45.8" cy="57.2" r="1.8" fill="#fff"/><circle cx="77.8" cy="57.2" r="1.8" fill="#fff"/>`;
    if(big) s+=`<circle cx="42" cy="63" r="1.4" fill="#fff"/><circle cx="74" cy="63" r="1.4" fill="#fff"/>`;
    if(mood==='oops'||kind==='kimera') s+=`<path d="M41 68 q-4 8 0 12 q4 -4 0 -12z" fill="#8ec8f2"/><path d="M79 68 q-4 8 0 12 q4 -4 0 -12z" fill="#8ec8f2"/>`;
  }
  // mouth
  if(kind==='anoko'&&mood!=='oops') s+=`<path d="M54 72 q3 3 6 0 q3 3 6 0" ${L(2.4)}/><path d="M56 74 q4 10 8 0 Z" fill="#e9707f" ${S} stroke-width="2"/>`;
  else if(mood==='happy') s+= kind==='usagi'
     ? `<path d="M45 70 Q60 92 75 70 Z" fill="#e9707f" ${S}/>`
     : `<path d="M52 71 Q60 84 68 71 Z" fill="#e9707f" ${S}/>`;
  else if(mood==='oops') s+=`<path d="M54 77 q6 -5 12 0" ${L(2.6)}/>`;
  else if(kind==='usagi') s+=`<path d="M49 71 Q60 82 71 71" ${L(2.6)}/>`;
  else s+=`<path d="M55 72 q2.5 3 5 0 q2.5 3 5 0" ${L(2.4)}/>`;
  // arms
  const af=kind==='kabutomushi'?'#9a6a3c':fill;
  if(mood==='happy') s+=`<ellipse cx="20" cy="88" rx="7" ry="9" transform="rotate(-35 20 88)" fill="${af}" ${S}/><ellipse cx="100" cy="88" rx="7" ry="9" transform="rotate(35 100 88)" fill="${af}" ${S}/>`;
  else s+=`<circle cx="38" cy="106" r="7" fill="${af}" ${S}/><circle cx="82" cy="106" r="7" fill="${af}" ${S}/>`;
  return s+'</svg>';
}

