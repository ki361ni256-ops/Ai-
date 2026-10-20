/* ---------- ことばの データ ----------
   WORDS: [えいご, え, にほんご, なかま, レベル]  レベル 1=ようじ〜小2 / 2=小3・4 / 3=小5・6
   小学校で ならう ことば(身近な ものの 名前・あいさつ・ようす・うごき)を 中心に えらんでいる。 */
const CATS={color:['いろ','🎨'],number:['かず','🔢'],animal:['どうぶつ','🐾'],food:['たべもの','🍙'],body:['からだ','🖐️'],family:['かぞく','🏠'],greet:['あいさつ','👋'],school:['がっこう','🏫'],ride:['のりもの','🚃'],nature:['てんき・しぜん','🌈'],home:['いえの もの','🛋️'],verb:['うごき','🏃'],feel:['きもち','💗'],adj:['ようす','📏'],sport:['スポーツ','⚽'],day:['ようび','📅'],month:['つき','🗓️'],subj:['きょうか','📚'],town:['まち','🏘️'],job:['しごと','👩‍⚕️']};
const WORDS_RAW=[
 ['red','🔴','あか','color',1],['blue','🔵','あお','color',1],['yellow','🟡','きいろ','color',1],['green','🟢','みどり','color',1],['pink','🩷','ピンク','color',1],['orange','🟠','オレンジいろ','color',1],['purple','🟣','むらさき','color',1],['black','⚫','くろ','color',1],['white','⚪','しろ','color',1],['brown','🟤','ちゃいろ','color',1],
 ['one','1️⃣','1(いち)','number',1],['two','2️⃣','2(に)','number',1],['three','3️⃣','3(さん)','number',1],['four','4️⃣','4(よん)','number',1],['five','5️⃣','5(ご)','number',1],['six','6️⃣','6(ろく)','number',1],['seven','7️⃣','7(なな)','number',1],['eight','8️⃣','8(はち)','number',1],['nine','9️⃣','9(きゅう)','number',1],['ten','🔟','10(じゅう)','number',1],
 ['eleven','','11(じゅういち)','number',2],['twelve','','12(じゅうに)','number',2],['twenty','','20(にじゅう)','number',2],['thirty','','30(さんじゅう)','number',3],['fifty','','50(ごじゅう)','number',3],['one hundred','💯','100(ひゃく)','number',3],
 ['dog','🐶','いぬ','animal',1],['cat','🐱','ねこ','animal',1],['rabbit','🐰','うさぎ','animal',1],['bear','🐻','くま','animal',1],['bird','🐦','とり','animal',1],['fish','🐟','さかな','animal',1],['pig','🐷','ぶた','animal',1],['cow','🐮','うし','animal',1],['monkey','🐵','さる','animal',1],['lion','🦁','ライオン','animal',1],['panda','🐼','パンダ','animal',1],['mouse','🐭','ねずみ','animal',1],
 ['elephant','🐘','ぞう','animal',2],['giraffe','🦒','きりん','animal',2],['penguin','🐧','ペンギン','animal',2],['horse','🐴','うま','animal',2],['frog','🐸','かえる','animal',2],['sea otter','🦦','ラッコ','animal',2],['koala','🐨','コアラ','animal',2],['tiger','🐯','とら','animal',2],['snake','🐍','へび','animal',3],['dolphin','🐬','イルカ','animal',3],['owl','🦉','ふくろう','animal',3],['turtle','🐢','かめ','animal',3],
 ['apple','🍎','りんご','food',1],['banana','🍌','バナナ','food',1],['strawberry','🍓','いちご','food',1],['milk','🥛','ぎゅうにゅう','food',1],['bread','🍞','パン','food',1],['egg','🥚','たまご','food',1],['cake','🍰','ケーキ','food',1],['ice cream','🍦','アイスクリーム','food',1],['juice','🧃','ジュース','food',1],['rice ball','🍙','おにぎり','food',1],
 ['pudding','🍮','プリン','food',2],['cookie','🍪','クッキー','food',2],['grapes','🍇','ぶどう','food',2],['lemon','🍋','レモン','food',2],['peach','🍑','もも','food',2],['tomato','🍅','トマト','food',2],['carrot','🥕','にんじん','food',2],['pizza','🍕','ピザ','food',2],['curry and rice','🍛','カレーライス','food',2],['noodles','🍜','めん','food',2],['sandwich','🥪','サンドイッチ','food',3],['spaghetti','🍝','スパゲッティ','food',3],['onion','🧅','たまねぎ','food',3],['potato','🥔','じゃがいも','food',3],['salad','🥗','サラダ','food',3],['steak','🥩','ステーキ','food',3],
 ['head','🙂','あたま','body',1],['hand','✋','て','body',1],['eye','👁️','め','body',1],['nose','👃','はな(かおの)','body',1],['mouth','👄','くち','body',1],['ear','👂','みみ','body',1],['foot','🦶','あし(くるぶしから した)','body',1],
 ['leg','🦵','あし','body',2],['tooth','🦷','は','body',2],['hair','💇','かみのけ','body',2],['face','😀','かお','body',2],['shoulder','🤷','かた','body',3],['knee','🦵','ひざ','body',3],
 ['mother','👩','おかあさん','family',1],['father','👨','おとうさん','family',1],['baby','👶','あかちゃん','family',1],['sister','👧','しまい(あね・いもうと)','family',2],['brother','👦','きょうだい(あに・おとうと)','family',2],['grandmother','👵','おばあさん','family',2],['grandfather','👴','おじいさん','family',2],['friend','🧑‍🤝‍🧑','ともだち','family',2],
 ['hello','👋','こんにちは','greet',1],['goodbye','👋','さようなら','greet',1],['thank you','🙏','ありがとう','greet',1],['good morning','🌅','おはよう','greet',1],['good night','🌙','おやすみ','greet',1],['sorry','🙇','ごめんなさい','greet',1],['nice to meet you','🤝','はじめまして','greet',2],['see you','🙋','またね','greet',2],
 ['pencil','✏️','えんぴつ','school',1],['book','📖','ほん','school',1],['bag','🎒','かばん','school',1],['pen','🖊️','ペン','school',1],
 ['eraser','🧽','けしゴム','school',2],['ruler','📏','じょうぎ','school',2],['notebook','📓','ノート','school',2],['desk','🪑','つくえ','school',2],['teacher','🧑‍🏫','せんせい','school',2],['scissors','✂️','はさみ','school',2],['glue','🧴','のり','school',3],['crayon','🖍️','クレヨン','school',3],['calendar','📅','カレンダー','school',3],
 ['car','🚗','くるま','ride',1],['bus','🚌','バス','ride',1],['train','🚃','でんしゃ','ride',1],['bike','🚲','じてんしゃ','ride',1],['ship','🚢','ふね','ride',2],['airplane','✈️','ひこうき','ride',2],['taxi','🚕','タクシー','ride',2],['rocket','🚀','ロケット','ride',3],
 ['sun','☀️','たいよう','nature',1],['moon','🌙','つき','nature',1],['star','⭐','ほし','nature',1],['flower','🌸','はな','nature',1],['tree','🌳','き','nature',1],['rain','☔','あめ','nature',1],
 ['snow','⛄','ゆき','nature',2],['rainbow','🌈','にじ','nature',2],['cloud','☁️','くも','nature',2],['sea','🌊','うみ','nature',2],['mountain','⛰️','やま','nature',2],['river','🏞️','かわ','nature',2],['sunny','🌞','はれ','nature',2],['cloudy','🌥️','くもり','nature',2],['windy','🌬️','かぜが つよい','nature',3],['spring','🌷','はる','nature',3],['summer','🏖️','なつ','nature',3],['fall','🍂','あき','nature',3],['winter','❄️','ふゆ','nature',3],
 ['house','🏠','いえ','home',1],['bed','🛏️','ベッド','home',1],['door','🚪','ドア','home',2],['window','🪟','まど','home',2],['clock','⏰','とけい','home',2],['cup','☕','カップ','home',2],['umbrella','☂️','かさ','home',2],['ball','⚽','ボール','home',1],['cap','🧢','ぼうし(つば つき)','home',2],['T-shirt','👕','Tシャツ','home',2],['shoes','👟','くつ','home',2],['key','🔑','かぎ','home',3],['phone','📱','でんわ','home',3],['computer','💻','コンピューター','home',3],
 ['run','🏃','はしる','verb',2],['jump','🦘','とぶ・ジャンプする','verb',2],['swim','🏊','およぐ','verb',2],['eat','🍽️','たべる','verb',2],['drink','🥤','のむ','verb',2],['sleep','😴','ねる','verb',2],['sing','🎤','うたう','verb',2],['dance','💃','おどる','verb',2],['walk','🚶','あるく','verb',2],['play','🎲','あそぶ','verb',2],['read','📖','よむ','verb',2],['cook','🍳','りょうりする','verb',2],
 ['write','✍️','かく','verb',3],['study','📚','べんきょうする','verb',3],['clean','🧹','そうじする','verb',3],['wash','🧼','あらう','verb',3],['go','👉','いく','verb',3],['come','👈','くる','verb',3],['see','👀','みる','verb',3],['buy','🛍️','かう','verb',3],['make','🛠️','つくる','verb',3],['help','🤲','たすける・てつだう','verb',3],['enjoy','🥳','たのしむ','verb',3],['want','🙏','ほしい','verb',3],
 ['happy','😊','うれしい','feel',1],['sad','😢','かなしい','feel',1],['hungry','🤤','おなかが すいた','feel',2],['sleepy','🥱','ねむい','feel',2],['angry','😠','おこっている','feel',2],['tired','😩','つかれた','feel',2],['fine','👍','げんき','feel',2],['scared','😱','こわい','feel',3],['excited','🤩','わくわくする','feel',3],['great','🌟','すばらしい','feel',3],
 ['big','🐘','おおきい','adj',1],['small','🐜','ちいさい','adj',1],['hot','🔥','あつい','adj',1],['cold','🧊','つめたい・さむい','adj',1],['cute','🥰','かわいい','adj',1],
 ['long','📏','ながい','adj',2],['short','✂️','みじかい','adj',2],['fast','⚡','はやい','adj',2],['slow','🐌','おそい','adj',2],['new','✨','あたらしい','adj',2],['old','🏚️','ふるい','adj',2],['tall','🦒','せが たかい','adj',2],['good','👍','よい','adj',2],
 ['delicious','😋','おいしい','adj',3],['beautiful','💐','うつくしい','adj',3],['strong','💪','つよい','adj',3],['kind','🤗','やさしい','adj',3],['fun','🎉','たのしい','adj',3],['difficult','🧩','むずかしい','adj',3],['easy','🙆','かんたん','adj',3],['famous','🏆','ゆうめい','adj',3],
 ['soccer','⚽','サッカー','sport',2],['baseball','⚾','やきゅう','sport',2],['tennis','🎾','テニス','sport',2],['basketball','🏀','バスケットボール','sport',2],['swimming','🏊','すいえい','sport',3],['volleyball','🏐','バレーボール','sport',3],['table tennis','🏓','たっきゅう','sport',3],
 ['Sunday','','にちようび','day',2],['Monday','','げつようび','day',2],['Tuesday','','かようび','day',2],['Wednesday','','すいようび','day',2],['Thursday','','もくようび','day',2],['Friday','','きんようび','day',2],['Saturday','','どようび','day',2],
 ['January','🎍','1がつ','month',3],['February','👹','2がつ','month',3],['March','🎎','3がつ','month',3],['April','🌸','4がつ','month',3],['May','🎏','5がつ','month',3],['June','☔','6がつ','month',3],['July','🎋','7がつ','month',3],['August','🍉','8がつ','month',3],['September','🎑','9がつ','month',3],['October','🎃','10がつ','month',3],['November','🍁','11がつ','month',3],['December','🎄','12がつ','month',3],
 ['Japanese','🗾','こくご','subj',3],['math','➗','さんすう','subj',3],['science','🔬','りか','subj',3],['social studies','🗺️','しゃかい','subj',3],['English','🔤','えいご','subj',3],['music','🎵','おんがく','subj',3],['P.E.','🤸','たいいく','subj',3],['arts and crafts','🎨','ずがこうさく','subj',3],
 ['park','🏞️','こうえん','town',2],['school','🏫','がっこう','town',2],['hospital','🏥','びょういん','town',3],['station','🚉','えき','town',3],['library','📚','としょかん','town',3],['zoo','🦁','どうぶつえん','town',3],['bakery','🥐','パンや','town',3],['post office','🏤','ゆうびんきょく','town',3],
 ['doctor','🧑‍⚕️','いしゃ','job',3],['chef','🧑‍🍳','コック','job',3],['police officer','👮','けいさつかん','job',3],['pilot','🧑‍✈️','パイロット','job',3],['florist','💐','はなや','job',3],['farmer','🧑‍🌾','のうか','job',3]
];

/* アルファベット: [もじ, ことば, え, いみ, はじめの おと(カタカナの めやす)] */
const LETTERS=[
 ['a','apple','🍎','りんご','ア'],['b','ball','⚽','ボール','ブ'],['c','cat','🐱','ねこ','ク'],['d','dog','🐶','いぬ','ドゥ'],['e','egg','🥚','たまご','エ'],
 ['f','fish','🐟','さかな','フ'],['g','goat','🐐','やぎ','グ'],['h','hat','🎩','ぼうし','ハ'],['i','ink','🖋️','インク','イ'],['j','juice','🧃','ジュース','ジュ'],
 ['k','kite','🪁','たこ','ク'],['l','lion','🦁','ライオン','ル'],['m','moon','🌙','つき','ム'],['n','nut','🥜','ナッツ','ヌ'],['o','octopus','🐙','たこ','オ'],
 ['p','pig','🐷','ぶた','プ'],['q','queen','👸','じょおう','クw'],['r','rabbit','🐰','うさぎ','ゥル'],['s','sun','☀️','たいよう','ス'],['t','tiger','🐯','とら','トゥ'],
 ['u','umbrella','☂️','かさ','ア'],['v','van','🚐','バン','ヴ'],['w','watch','⌚','うでどけい','ウ'],['x','box','📦','はこ','クス'],['y','yo-yo','🪀','ヨーヨー','ィ'],['z','zebra','🦓','しまうま','ズ']
];

/* ぶん: [えいご, にほんご, レベル] 「ぶんを つくろう」と「きいて わかる」で つかう */
const SENTS=[
 ['I like cats.','わたしは ねこが すき。',1],['I am happy.','わたしは うれしい。',1],['This is a pen.','これは ペンです。',1],['Good morning, Chiikawa!','おはよう、ちいかわ!',1],['I have a ball.','わたしは ボールを もっている。',1],['It is red.','それは あかい。',1],
 ['I like pudding.','わたしは プリンが すき。',2],['Do you like dogs?','あなたは いぬが すき?',2],['I can swim.','わたしは およげる。',2],['How many apples?','りんごは いくつ?',2],['What color do you like?','なにいろが すき?',2],['I am hungry.','おなかが すいた。',2],['Let\'s play soccer.','サッカーを しよう。',2],['It is sunny today.','きょうは はれ。',2],['Hachiware can sing.','ハチワレは うたえる。',2],['I don\'t like snakes.','わたしは へびが すきでは ない。',2],['What day is it today?','きょうは なんようび?',2],['It is Monday.','げつようびです。',2],
 ['I want to be a doctor.','わたしは いしゃに なりたい。',3],['My birthday is in May.','わたしの たんじょうびは 5がつ。',3],['I went to the zoo.','わたしは どうぶつえんに いった。',3],['Where is the library?','としょかんは どこ?',3],['I usually get up at seven.','わたしは たいてい 7じに おきる。',3],['What do you want to eat?','なにが たべたい?',3],['I enjoyed fishing.','わたしは つりを たのしんだ。',3],['She is good at cooking.','かのじょは りょうりが とくい。',3],['Go straight and turn left.','まっすぐ いって ひだりに まがって。',3],['My favorite subject is science.','すきな きょうかは りか。',3],['I can play the piano well.','わたしは ピアノを じょうずに ひける。',3],['Usagi ran very fast.','うさぎは とても はやく はしった。',3]
];

/* えほん: ちいかわたちの みじかい おはなし(このアプリの ための オリジナル)。lines は 1ぎょう ずつ よみあげる */
const STORIES=[
 {id:'s1',lv:1,ch:'chiikawa',title:'ちいかわと りんご',lines:['I am Chiikawa.','I like apples.','Red apples!','Yum!'],ask:'ちいかわが すきな ものは?',opts:['りんご','バナナ','パン'],a:0},
 {id:'s2',lv:1,ch:'hachiware',title:'ハチワレの いろ',lines:['Look!','A blue bird.','A yellow flower.','I like blue.'],ask:'ハチワレが すきな いろは?',opts:['あお','きいろ','あか'],a:0},
 {id:'s3',lv:1,ch:'usagi',title:'うさぎ ジャンプ',lines:['I am Usagi.','I can jump.','One, two, three!','Jump!'],ask:'うさぎが できることは?',opts:['ジャンプ','およぐ','うたう'],a:0},
 {id:'s4',lv:2,ch:'chiikawa',title:'ピクニック',lines:['It is sunny today.','Chiikawa and Hachiware go to the park.','They eat rice balls.','Hachiware says, This is delicious!','Chiikawa is happy.'],ask:'ふたりは こうえんで なにを たべた?',opts:['おにぎり','ケーキ','ピザ'],a:0},
 {id:'s5',lv:2,ch:'hachiware',title:'ハチワレの うた',lines:['Hachiware likes music.','He can sing very well.','Chiikawa says, Sing again, please!','Hachiware sings again.','They dance together.'],ask:'ハチワレが とくいな ことは?',opts:['うたう','およぐ','りょうり'],a:0},
 {id:'s6',lv:2,ch:'usagi',title:'うさぎと プリン',lines:['Usagi is hungry.','He opens the door.','He sees a big pudding!','Usagi says, Yaha!','He eats it all.'],ask:'うさぎは なにを みつけた?',opts:['おおきな プリン','ちいさな いぬ','あかい ボール'],a:0},
 {id:'s7',lv:3,ch:'chiikawa',title:'ゆきの ひ',lines:['It was very cold this morning.','When Chiikawa opened the window, everything was white.','Chiikawa and Hachiware made a big snowman in the park.','Usagi came and put a carrot on its face.','After that, they drank hot milk together.'],ask:'ゆきだるまの かおに なにを つけた?',opts:['にんじん','りんご','ぼうし'],a:0},
 {id:'s8',lv:3,ch:'hachiware',title:'ハチワレの ゆめ',lines:['Hachiware has a dream.','He wants to open a small shop someday.','He saves a little money every week.','Chiikawa says, I will help you!','Hachiware smiles and says, Thank you. Let\'s do our best!'],ask:'ハチワレの ゆめは?',opts:['おみせを ひらく','パイロットに なる','うみで およぐ'],a:0},
 {id:'s9',lv:3,ch:'usagi',title:'なつやすみ',lines:['Last summer, Usagi went to the sea with his friends.','He swam fast and found a pretty shell.','In the evening, they watched fireworks.','Usagi was so excited that he shouted, Ura!','It was the best day of the summer.'],ask:'うさぎたちは ゆうがた なにを みた?',opts:['はなび','にじ','ゆき'],a:0}
];

/* えほんの ことばを おすと でる いみ(WORDS に ない ことば) */
const GLOSS={i:'わたし',am:'〜です',is:'〜です',are:'〜です',a:'ひとつの',the:'その',look:'みて',like:'すき',likes:'すき',yum:'おいしい',can:'できる',it:'それ',today:'きょう',and:'と',to:'〜へ',they:'かれら',eat:'たべる',says:'いう',this:'これ',he:'かれ',very:'とても',well:'じょうずに',again:'もういちど',please:'おねがい',sings:'うたう',together:'いっしょに',opens:'あける',sees:'みる',yaha:'ヤハ(うさぎの こえ)',ura:'ウラ(うさぎの こえ)',all:'ぜんぶ',was:'だった',morning:'あさ',when:'〜とき',opened:'あけた',everything:'ぜんぶ',made:'つくった',snowman:'ゆきだるま',in:'〜の なかで',came:'きた',put:'おいた',on:'〜の うえに',its:'その',after:'〜の あと',that:'それ',drank:'のんだ',has:'もっている',dream:'ゆめ',wants:'〜したい',open:'ひらく',shop:'おみせ',someday:'いつか',saves:'ためる',little:'すこし',money:'おかね',every:'まい〜',week:'しゅう',will:'〜するつもり',you:'あなた',smiles:'ほほえむ',let:'〜しよう',"let's":'〜しよう',do:'する',our:'わたしたちの',best:'いちばん・ベスト',last:'このまえの',went:'いった',with:'〜と いっしょに',his:'かれの',friends:'ともだち',swam:'およいだ',found:'みつけた',pretty:'かわいい',shell:'かいがら',evening:'ゆうがた',watched:'みた',fireworks:'はなび',so:'とても',shouted:'さけんだ',of:'〜の',chiikawa:'ちいかわ',hachiware:'ハチワレ',usagi:'うさぎ',go:'いく',jump:'ジャンプ',sing:'うたう',cold:'さむい',white:'しろい',hot:'あつい',milk:'ぎゅうにゅう',carrot:'にんじん',face:'かお',help:'たすける',thank:'ありがとう',day:'ひ',sea:'うみ',summer:'なつ',fast:'はやく',excited:'わくわくして',rice:'ごはん',balls:'たま(おにぎり)',delicious:'おいしい',happy:'うれしい',hungry:'おなかが すいた',door:'ドア',big:'おおきい',pudding:'プリン',music:'おんがく',dance:'おどる',park:'こうえん',sunny:'はれ',bird:'とり',flower:'はな',blue:'あお',yellow:'きいろ',red:'あかい',apples:'りんご',one:'1',two:'2',three:'3',window:'まど',small:'ちいさい'};

/* ---------- すすむコース(ユニットの じゅんばん) ----------
   1ユニット = ①まなぶ(ことばを きいて まねする) ②れんしゅう(クイズ) ③はなそう(かいわ) の 3ステップ。
   英検5級で よく でる ことばと、小学校の 英語の 会話を 中心に ならべている。 */
const UNITS=[
 {t:'あいさつ',ic:'👋',w:['hello','goodbye','good morning','good night','thank you','sorry'],d:'greet'},
 {t:'いろ',ic:'🎨',w:['red','blue','yellow','green','pink','white','black'],d:'color'},
 {t:'かず 1〜5',ic:'🖐️',w:['one','two','three','four','five'],d:'age'},
 {t:'どうぶつ',ic:'🐶',w:['dog','cat','rabbit','bear','bird','fish','panda','mouse'],d:'likeAnimal'},
 {t:'かず 6〜10',ic:'🔟',w:['six','seven','eight','nine','ten'],d:'howMany'},
 {t:'たべもの',ic:'🍎',w:['apple','banana','strawberry','milk','bread','egg','cake','rice ball'],d:'food'},
 {t:'からだ',ic:'🖐️',w:['head','hand','eye','nose','mouth','ear','foot'],d:'whatThis'},
 {t:'かぞく',ic:'🏠',w:['mother','father','baby','sister','brother','grandmother','grandfather'],d:'who'},
 {t:'きもち',ic:'💗',w:['happy','sad','hungry','sleepy','tired','fine'],d:'howAre'},
 {t:'ようす',ic:'📏',w:['big','small','hot','cold','cute','long','short'],d:'isIt'},
 {t:'のりもの',ic:'🚃',w:['car','bus','train','bike','ship','airplane'],d:'whatThat'},
 {t:'てんき',ic:'🌈',w:['sun','moon','star','rain','snow','rainbow','cloud'],d:'weather'},
 {t:'どうぶつ 2',ic:'🐘',w:['elephant','giraffe','penguin','horse','frog','koala','tiger','lion','monkey'],d:'canAnimal'},
 {t:'おやつ',ic:'🍮',w:['pudding','cookie','grapes','lemon','peach','ice cream','juice','tomato','carrot'],d:'want'},
 {t:'がっこう',ic:'🏫',w:['pencil','book','bag','pen','eraser','ruler','notebook','desk','teacher'],d:'have'},
 {t:'うごき 1',ic:'🏃',w:['run','jump','swim','eat','drink','sleep'],d:'can'},
 {t:'うごき 2',ic:'🎤',w:['sing','dance','walk','play','read','cook'],d:'letsPlay'},
 {t:'スポーツ',ic:'⚽',w:['soccer','baseball','tennis','basketball','swimming'],d:'sport'},
 {t:'いえの もの',ic:'🛋️',w:['house','bed','door','window','clock','cup','umbrella','shoes'],d:'where'},
 {t:'ようび',ic:'📅',w:['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],d:'day'},
 {t:'おおきな かず',ic:'💯',w:['eleven','twelve','twenty','thirty','fifty','one hundred'],d:'howMany2'},
 {t:'きせつ',ic:'🌷',w:['spring','summer','fall','winter','sunny','cloudy','windy'],d:'season'},
 {t:'つき 1〜6',ic:'🎎',w:['January','February','March','April','May','June'],d:'birthday'},
 {t:'つき 7〜12',ic:'🎄',w:['July','August','September','October','November','December'],d:'birthday'},
 {t:'きょうか',ic:'📚',w:['Japanese','math','science','social studies','English','music','P.E.','arts and crafts'],d:'subject'},
 {t:'まち',ic:'🏘️',w:['park','school','hospital','station','library','zoo','bakery','post office'],d:'whereTown'},
 {t:'しごと',ic:'🧑‍⚕️',w:['doctor','chef','police officer','pilot','florist','farmer'],d:'job'},
 {t:'うごき 3',ic:'✍️',w:['write','study','clean','wash','go','come','see','buy','make','help'],d:'weekend'},
 {t:'ようす 2',ic:'💐',w:['delicious','beautiful','strong','kind','fun','difficult','easy','famous'],d:'howWas'},
 {t:'じこしょうかい',ic:'🙋',w:['friend','orange','purple','brown','nice to meet you','see you'],d:'name'}
];

/* かいわ: q=きかれる ぶん、a=こたえ、x=まちがいの こたえ(いみが あわない もの)。じぶんで こたえを いう れんしゅうにも つかう */
const DIALOGS={
 greet:{q:'Hello! How are you?',qja:'こんにちは! げんき?',a:"I'm fine, thank you.",aja:'げんきだよ、ありがとう。',x:["It's red.","I like cats."]},
 color:{q:'What color do you like?',qja:'なにいろが すき?',a:'I like blue.',aja:'あおが すき。',x:["I'm seven.",'Yes, I do.']},
 age:{q:'How old are you?',qja:'なんさい?',a:"I'm seven.",aja:'7さいだよ。',x:['I like pink.',"It's a dog."]},
 likeAnimal:{q:'Do you like dogs?',qja:'いぬは すき?',a:'Yes, I do.',aja:'うん、すき。',x:["I'm fine.","It's Monday."]},
 howMany:{q:'How many apples?',qja:'りんごは いくつ?',a:'Six apples.',aja:'6こ。',x:['I like apples.',"It's red."]},
 food:{q:'What food do you like?',qja:'すきな たべものは なに?',a:'I like strawberries.',aja:'いちごが すき。',x:["I'm hungry.",'Good night.']},
 whatThis:{q:"What's this?",qja:'これは なに?',a:"It's a nose.",aja:'はなだよ。',x:['Yes, I can.',"I'm happy."]},
 who:{q:'Who is this?',qja:'これは だれ?',a:'This is my mother.',aja:'わたしの おかあさん。',x:["It's a cat.",'I like milk.']},
 howAre:{q:'How are you today?',qja:'きょうの ちょうしは どう?',a:"I'm hungry.",aja:'おなかが すいた。',x:['I have a pen.',"It's sunny."]},
 isIt:{q:'Is it big?',qja:'それは おおきい?',a:'Yes, it is.',aja:'うん、おおきい。',x:["I'm fine.",'I like red.']},
 whatThat:{q:"What's that?",qja:'あれは なに?',a:"It's a train.",aja:'でんしゃだよ。',x:['Thank you.','I can swim.']},
 weather:{q:"How's the weather?",qja:'てんきは どう?',a:"It's rainy.",aja:'あめだよ。',x:['I like rabbits.',"I'm seven."]},
 canAnimal:{q:'Can a penguin fly?',qja:'ペンギンは とべる?',a:"No, it can't.",aja:'ううん、とべない。',x:['Yes, I do.',"It's yellow."]},
 want:{q:'What do you want?',qja:'なにが ほしい?',a:'I want pudding.',aja:'プリンが ほしい。',x:["I'm sleepy.",'Good morning.']},
 have:{q:'Do you have a pencil?',qja:'えんぴつ もってる?',a:'Yes, I do. Here you are.',aja:'うん。はい、どうぞ。',x:["It's hot.","I'm a bear."]},
 can:{q:'Can you swim?',qja:'およげる?',a:'Yes, I can.',aja:'うん、およげる。',x:["It's a fish.",'I like blue.']},
 letsPlay:{q:"Let's sing together!",qja:'いっしょに うたおう!',a:"OK! Let's sing!",aja:'いいよ! うたおう!',x:["It's a book.","I'm six."]},
 sport:{q:'What sport do you like?',qja:'すきな スポーツは?',a:'I like soccer.',aja:'サッカーが すき。',x:["It's Friday.",'I have a bag.']},
 where:{q:'Where is my cup?',qja:'わたしの カップは どこ?',a:"It's on the desk.",aja:'つくえの うえに あるよ。',x:['I like cake.',"I'm tired."]},
 day:{q:'What day is it today?',qja:'きょうは なんようび?',a:"It's Monday.",aja:'げつようびだよ。',x:["It's a cat.",'I can run.']},
 howMany2:{q:'How many pencils do you have?',qja:'えんぴつを なんぼん もってる?',a:'I have twelve pencils.',aja:'12ほん もってる。',x:['I like pencils.',"It's sunny."]},
 season:{q:'What season do you like?',qja:'すきな きせつは?',a:'I like summer.',aja:'なつが すき。',x:["It's ten.","I'm Chiikawa."]},
 birthday:{q:'When is your birthday?',qja:'たんじょうびは いつ?',a:'My birthday is in May.',aja:'5がつだよ。',x:['I like May.',"It's a present."]},
 subject:{q:'What subject do you like?',qja:'すきな きょうかは?',a:'I like music.',aja:'おんがくが すき。',x:["It's Tuesday.",'I want a pen.']},
 whereTown:{q:'Where is the station?',qja:'えきは どこ?',a:'Go straight. It is on your left.',aja:'まっすぐ いって。ひだりに あるよ。',x:['I like trains.',"I'm hungry."]},
 job:{q:'What do you want to be?',qja:'なにに なりたい?',a:'I want to be a doctor.',aja:'いしゃに なりたい。',x:['I like doctors.',"It's a hospital."]},
 weekend:{q:'What did you do last weekend?',qja:'このまえの しゅうまつ なにを した?',a:'I went to the park.',aja:'こうえんに いった。',x:['I go to school.','I like parks.']},
 howWas:{q:'How was the curry?',qja:'カレーは どうだった?',a:'It was delicious.',aja:'おいしかった。',x:['I want to be a chef.',"It's Sunday."]},
 name:{q:"What's your name?",qja:'なまえは なに?',a:'My name is Chiikawa.',aja:'ちいかわだよ。',x:["I'm fine.",'Nice to meet you, too.']}
};
