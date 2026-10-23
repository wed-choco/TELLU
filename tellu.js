'use strict';

// No network calls. Future AI integration belongs behind a secure backend.
const STORAGE_KEY = 'tellu.word-loop.v2';
const LEGACY_KEY = 'tellu.practice.v1';
const REVIEW_INTERVALS = [1, 3, 7, 14];
const REGION_THRESHOLDS = { thought: 1, expression: 3, connection: 5 };
const REGIONS = [
  { id: 'emotion', name: '気持ちの草原', en: 'EMOTION MEADOW', color: '#d9e4c4' },
  { id: 'thought', name: '思考の村', en: 'THOUGHT VILLAGE', color: '#e8d9c5' },
  { id: 'expression', name: '表現の湖', en: 'EXPRESSION LAKE', color: '#cfdfdf' },
  { id: 'connection', name: 'つながりの森', en: 'CONNECTION FOREST', color: '#c9d9c2' }
];
const WORDS = [
  { word: 'もどかしい', category: 'emotion', meaning: '思うように進まず、じれったく感じること。', keys: ['複雑', 'うまく', '言え', 'できな', '伝わ', '悔し'] },
  { word: '羨ましい', category: 'emotion', meaning: '相手のよいところや状況を、自分もほしいと感じること。', keys: ['友達', '褒め', '比べ', '羨', 'うらやま'] },
  { word: '誇らしい', category: 'emotion', meaning: '自分や大切な人のことを、うれしく、胸を張りたいと感じること。', keys: ['嬉', 'うれし', '褒め', '頑張', '達成'] },
  { word: '焦り', category: 'emotion', meaning: '早く何とかしたいと、気持ちが落ち着かなくなること。', keys: ['複雑', '間に合', '試験', 'テスト', '急', '焦', '遅れ'] },
  { word: '安堵', category: 'emotion', meaning: '心配がやわらぎ、ほっとすること。', keys: ['安心', 'ほっと', '終わ', '心配', '落ち着'] },
  { word: '心細い', category: 'emotion', meaning: '頼れるものが少なく、不安やさびしさを感じること。', keys: ['悲し', '寂し', 'さびし', '不安', 'ひとり', '一人'] },
  { word: '大切にしたい', category: 'thought', meaning: '自分にとって価値があるものを、守り、育てたいと思うこと。', keys: ['大切', '友情', '好き', '考え', '価値'] },
  { word: '納得', category: 'thought', meaning: '理由や事情を理解して、自分の中で受け止められること。', keys: ['意見', '理由', '考え', 'わか', '説明'] },
  { word: '試行錯誤', category: 'thought', meaning: 'いろいろ試して、よりよい方法を探すこと。', keys: ['挑戦', '失敗', '練習', '勉強', '試し'] },
  { word: '余韻', category: 'expression', meaning: '出来事が終わったあとも、心に残る気配や感覚。', keys: ['景色', '映画', '音楽', '心が動', '思い出', '残っ'] },
  { word: '穏やか', category: 'expression', meaning: '激しさがなく、落ち着いてやわらかな様子。', keys: ['休', '静か', 'ゆっくり', '落ち着', '休日'] },
  { word: 'かけがえのない', category: 'expression', meaning: 'ほかのものでは置き換えられないほど、大切なこと。', keys: ['友情', '家族', '大切', '思い出', '特別'] },
  { word: '尊重', category: 'connection', meaning: '相手や自分の気持ち・考えを、大切なものとして扱うこと。', keys: ['聞いて', '意見', '友達', '関係', '話を'] },
  { word: '歩み寄る', category: 'connection', meaning: '違いを認めながら、互いに理解しようと近づくこと。', keys: ['けんか', '喧嘩', '違う', '相談', '仲直り'] },
  { word: '気遣い', category: 'connection', meaning: '相手の気持ちや状況を考えて、心を配ること。', keys: ['ありがとう', '助け', '友達', '優し', '心配'] },
  { word: '信頼', category: 'connection', meaning: '相手を信じて、自分の気持ちや物事を託せること。', keys: ['友情', '友達', '相談', '安心', '約束'] }
];
const PROMPTS = ['最近、心が動いた瞬間は？', 'あなたにとって友情とは？', '最近、少し悔しかったことは？', '自分が大切にしていることは？', 'ほっとできるのは、どんな時間？', '誰かにありがとうを伝えるなら？', '最近の小さな挑戦を教えて。', 'もう一度味わいたい、あの瞬間は？', '意見が違うとき、大切にしたいことは？', 'いまの自分に、かけたいひとことは？'];
const GOALS = ['気持ちを説明する', '理由をひとつ添える', '具体例を入れる', '自分の経験を描く', '考えの中心を伝える'];
const LEVELS = { guided: 'ガイドあり', assisted: '必要なときだけ', independent: '自分の力で' };
const MODES = { random: 'ランダム', expand: '広げる', compress: '縮める' };
const STAGES = { discovered: '見つけた', practiced: '使ってみた', revisited: 'また使えた' };
const ICONS = {
  home: '<path d="m3 10 9-7 9 7v10H15v-7H9v7H3Z"/>',
  spark: '<path d="m12 2 2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5Z"/>',
  book: '<path d="M12 5C9 3 6 3 3 4v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15"/>',
  map: '<path d="m3 5 6-2 6 2 6-2v16l-6 2-6-2-6 2Zm6-2v16m6-14v16"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  back: '<path d="M20 12H4m6-6-6 6 6 6"/>',
  leaf: '<path d="M20 3C8 2 3 8 6 15c7 5 14 0 14-12ZM4 21 16 9"/>',
  repeat: '<path d="M20 7H7a4 4 0 0 0-4 4m17-4-4-4m4 4-4 4M4 17h13a4 4 0 0 0 4-4M4 17l4-4m-4 4 4 4"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  pen: '<path d="m4 15-1 6 6-1L21 8l-5-5Zm10-10 5 5"/>'
};
const icon = name => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ICONS.leaf}</svg>`;
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
const uid = () => globalThis.crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).slice(2)}`;
const dateKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}`;
const dateLabel = value => new Intl.DateTimeFormat('ja-JP', { month:'long', day:'numeric' }).format(new Date(value.length === 10 ? `${value}T12:00:00` : value));
const now = () => new Date().toISOString();
const chars = text => Array.from(text).length;
const normalizeWord = text => text.normalize('NFKC').trim().replace(/\s+/g,' ');
const region = id => REGIONS.find(r => r.id === id) || REGIONS[0];
const segmenter = typeof Intl.Segmenter === 'function' ? new Intl.Segmenter('ja', {granularity:'word'}) : null;
const countExpression = (text, type = 'characters') => type === 'words' && segmenter ? [...segmenter.segment(text)].filter(part => part.isWordLike).length : chars(text);
const freshData = () => ({ version:2, words:[], journals:[], challenges:[], daily:{}, drafts:{journal:null,discover:null,challenge:null} });
const main = document.querySelector('#main');
let storageHealthy = true;
function showStorageWarning(message) { const el=document.querySelector('#storage-warning'); el.textContent=message; el.hidden=false; }
function validDrafts(value) {
  const drafts=value.drafts;
  if (typeof drafts!=='object'||Array.isArray(drafts)) return false;
  const strings=(object,keys)=>keys.every(key=>typeof object[key]==='string');
  const journalExists=id=>id===null||value.journals.some(j=>j.id===id);
  const wordExists=id=>id===null||value.words.some(w=>w.id===id);
  const j=drafts.journal,d=drafts.discover,c=drafts.challenge;
  if (j && (!strings(j,['id','date','title','content','mood'])||!Array.isArray(j.wordIds)||!j.wordIds.every(wordExists)||Number.isNaN(Date.parse(j.date)))) return false;
  if (d && (!strings(d,['id','context','prompt','level','customWord','customCategory','customMeaning'])||!Array.isArray(d.answers)||d.answers.length!==3||!d.answers.every(a=>typeof a==='string')||!Number.isInteger(d.step)||d.step<0||d.step>3||!LEVELS[d.level]||!journalExists(d.sourceJournalId)||!wordExists(d.selectedWordId)||!REGIONS.some(r=>r.id===d.customCategory))) return false;
  if (c && (!strings(c,['id','prompt','context','level','mode','challengeType','goal','response','reflection'])||!value.words.some(w=>w.id===c.targetWordId)||!journalExists(c.sourceJournalId)||!LEVELS[c.level]||!MODES[c.mode]||!['characters','words'].includes(c.challengeType)||typeof c.started!=='boolean'||!Array.isArray(c.limits)||!c.limits.every(n=>Number.isInteger(n)&&n>0&&n<=4000)||!Number.isInteger(c.phase)||c.phase<0||(c.started&&c.phase>=c.limits.length)||!Array.isArray(c.attemptIds)||!c.attemptIds.every(id=>value.challenges.some(a=>a.id===id)))) return false;
  return true;
}
function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return freshData();
    const value = JSON.parse(raw);
    if (value.version !== 2 || !['words','journals','challenges'].every(k => Array.isArray(value[k])) || !value.drafts || !value.daily) throw Error('Invalid schema');
    const ids = list => list.every(x => x && typeof x.id === 'string' && /^[a-zA-Z0-9-]{1,100}$/.test(x.id)) && new Set(list.map(x=>x.id)).size === list.length;
    if (!ids(value.words) || !ids(value.journals) || !ids(value.challenges)) throw Error('Invalid IDs');
    if (!value.words.every(w => typeof w.word==='string' && REGIONS.some(r=>r.id===w.category) && typeof w.meaning==='string' && Array.isArray(w.practiceAttempts) && Array.isArray(w.reviewAttempts) && Array.isArray(w.sourceJournalIds) && STAGES[w.stage] && !Number.isNaN(Date.parse(w.dateDiscovered)))) throw Error('Invalid words');
    if (!value.journals.every(j=>typeof j.content==='string' && typeof j.title==='string' && Array.isArray(j.wordIds) && !Number.isNaN(Date.parse(j.date)))) throw Error('Invalid journals');
    if (!value.challenges.every(c=>typeof c.response==='string' && typeof c.prompt==='string' && Number.isInteger(c.limit) && ['characters','words'].includes(c.challengeType) && value.words.some(w=>w.id===c.targetWordId) && !Number.isNaN(Date.parse(c.date)))) throw Error('Invalid challenges');
    if (!value.words.every(w=>w.practiceAttempts.every(id=>value.challenges.some(c=>c.id===id)) && w.reviewAttempts.every(id=>w.practiceAttempts.includes(id)))) throw Error('Invalid links');
    if (!value.journals.every(j=>j.wordIds.every(id=>value.words.some(w=>w.id===id)))) throw Error('Invalid journal links');
    if (typeof value.daily!=='object'||Array.isArray(value.daily)||!Object.values(value.daily).every(d=>d&&typeof d.prompt==='string'&&typeof d.completed==='boolean')||!validDrafts(value)) throw Error('Invalid drafts');
    return value;
  } catch (error) {
    storageHealthy=false;
    showStorageWarning('保存データを読み込めませんでした。元の記録は上書きせず、このタブだけで使えます。プライバシー画面から元データの書き出し・初期化ができます。');
    return freshData();
  }
}
let data = loadData();
let screen='home', selectedWordId=null, atlasFilter='all', zoom=1;
let timer, toastTimer, confirmCallback=null;
function persist() {
  if (!storageHealthy) return false;
  try { localStorage.setItem(STORAGE_KEY,JSON.stringify(data)); return true; }
  catch (error) { showStorageWarning('保存できませんでした。内容はこのタブに残っています。タブを閉じる前に「データを書き出す」で保存してください。'); return false; }
}
function toast(message) { const el=document.querySelector('#toast'); clearTimeout(toastTimer); el.textContent=message; el.classList.add('visible'); toastTimer=setTimeout(()=>el.classList.remove('visible'),4200); }
function savedToast(message) { toast(persist() ? message : '内容はこのタブに残っています。保存に失敗したため、JSONを書き出してください。'); }
function confirmAction(title, description, action, callback) {
  document.querySelector('#confirm-title').textContent=title;
  document.querySelector('#confirm-description').textContent=description;
  document.querySelector('#confirm-button').textContent=action;
  confirmCallback=callback; const dialog=document.querySelector('#confirmation'); dialog.returnValue=''; dialog.showModal();
}
function capture() {
  main.querySelectorAll('[data-draft]').forEach(el=>{
    const draft=data.drafts[el.dataset.draft]; if (!draft || (el.type==='radio' && !el.checked)) return;
    draft[el.name]=el.value;
  });
}
function navigate(next) { capture(); clearTimeout(timer); persist(); screen=next; render(); }
function heading(label,title,description='') { return `<div class="page-heading"><span class="eyebrow">${label}</span><h1>${esc(title)}</h1>${description?`<p class="subtle">${esc(description)}</p>`:''}</div>`; }
function btn(label, action, type='', attrs='') { return `<button type="button" class="button ${type}" data-action="${action}" ${attrs}>${esc(label)}${icon('arrow')}</button>`; }
function textBtn(label, action, attrs='') { return `<button type="button" class="text-button" data-action="${action}" ${attrs}>${esc(label)}${icon('arrow')}</button>`; }
function loop(active) { return `<div class="loop" aria-label="言葉を育てる流れ">${['記録する','見つける','表現する','地図に残す','また出会う'].map((name,i)=>`<span class="${i===active?'active':''}" ${i===active?'aria-current="step"':''}><b>${i+1}</b>${name}</span>${i<4?'<i aria-hidden="true">→</i>':''}`).join('')}</div>`; }
function dailyPrompt() {
  const key=dateKey();
  if (!data.daily[key]) { const parts=key.split('-').map(Number); const index=Math.floor(Date.UTC(parts[0],parts[1]-1,parts[2])/86400000); data.daily[key]={prompt:PROMPTS[index%PROMPTS.length],completed:false}; persist(); }
  return data.daily[key];
}
function dueWords() { return data.words.filter(w=>w.nextReviewDate && w.nextReviewDate<=dateKey()).sort((a,b)=>a.nextReviewDate.localeCompare(b.nextReviewDate)); }
function wordChip(word) { return `<button type="button" class="word-chip" data-action="word-detail" data-id="${esc(word.id)}"><span class="seed-dot"></span>${esc(word.word)}<small>${STAGES[word.stage]}</small></button>`; }
function empty(title,description,action='',label='') { return `<div class="empty"><h3>${esc(title)}</h3><p>${esc(description)}</p>${action?`<div class="actions">${textBtn(label,action)}</div>`:''}</div>`; }
function heroArt() { return `<svg viewBox="0 0 260 200" fill="none" aria-hidden="true"><ellipse cx="134" cy="163" rx="98" ry="16" fill="#ede9e1"/><path d="M46 147c-9-37 16-72 68-74s103 22 98 59c-3 25-55 40-94 34-41 9-61-6-72-19Z" fill="#dce5ce" stroke="#c6d0b7"/><path d="M88 146c25-19 56-19 93-30" stroke="#f9f7eb" stroke-width="7"/><path d="M120 129V80m0 24c-25 0-32-19-27-24 20-2 27 16 27 24Zm1-14c1-19 14-29 27-23 1 16-12 25-27 23Z" stroke="#8b9c77" stroke-width="2" fill="#b8ca9c"/><path d="M161 114V86m0 11c-11-1-17-11-12-15 11 0 14 11 12 15Z" stroke="#ab8190" stroke-width="2" fill="#e3bdcb"/><circle cx="163" cy="78" r="13" fill="#edcbd5"/><path d="m60 60 3 9 9 3-9 3-3 9-3-9-9-3 9-3Z" fill="#bea283"/><path d="M176 37c0-7 7-11 12-5 5-6 12-2 12 5 0 8-12 15-12 15s-12-7-12-15Z" fill="#dcaaba"/><path d="M123 32c-20-2-30 2-30 13v16l-10 12 25-7h26c9 0 13-4 13-12V44c0-8-8-12-24-12Z" fill="#fffaf3" stroke="#c7b6a4"/><path d="M104 45h30m-30 10h20" stroke="#bfa791" stroke-linecap="round"/><circle cx="208" cy="100" r="3" fill="#c8aa78"/></svg>`; }
function homeScreen() {
  const daily=dailyPrompt(), due=dueWords(), progress=updateAtlasProgress();
  const week=new Date(); week.setHours(0,0,0,0); week.setDate(week.getDate()-(week.getDay()+6)%7);
  const weekly=data.words.filter(w=>new Date(w.dateDiscovered)>=week).length;
  const recent=[...data.words].filter(w=>w.practiceAttempts.length).sort((a,b)=>lastPractice(b).localeCompare(lastPractice(a))).slice(0,5);
  return `${data.drafts.challenge?`<div class="resume"><span>書きかけのチャレンジがあります。言葉を残してあります。</span><div class="actions">${btn('つづきから','resume-challenge','secondary')}</div></div>`:''}<section class="hero"><div><span class="eyebrow">FIND YOUR WORDS. EXPAND YOUR WORLD.</span><h1>ひとつの言葉から、<br>わたしの世界が<em>広がる。</em></h1><p class="subtle">おかえりなさい。いま、どんな気持ち？<br>まだ名前のない思いを、あなたの言葉に。</p></div><div class="hero-art">${heroArt()}</div></section><div class="home-top"><section class="card daily-card"><div class="card-top"><span class="eyebrow">TODAY'S LITTLE DISCOVERY</span><span class="pill">${daily.completed?'今日の表現を残しました':`${dateLabel(dateKey())} のお題`}</span></div><h2>${esc(daily.prompt)}</h2><p class="subtle">気持ちを見つけて、短い言葉にしてみよう。</p>${btn('今日の言葉を見つける','daily')}<p class="field-note">目安 3〜5分・声にしなくても大丈夫</p></section><section class="card atlas-preview"><div class="card-top"><h2>あなたの、言葉の世界</h2><span class="eyebrow">WORD ATLAS</span></div>${miniMap()}<div class="map-caption"><p><strong>${data.words.length}</strong>の言葉・${progress.unlocked.length}つのエリア</p>${textBtn('地図をひらく','atlas')}</div><p class="week-words">今週出会った言葉 <b>${weekly}</b>　／　使ってみた言葉 <b>${progress.practiced}</b></p></section></div><div class="section-title"><h2>最近、あなたが使った言葉 <small>YOUR LITTLE STEPS</small></h2>${textBtn('すべて見る','atlas')}</div>${recent.length?`<div class="word-row">${recent.map(wordChip).join('')}</div>`:empty('まだ小さな、はじまりの島。','見つけた言葉を自分の文で使うと、この世界に芽が出ます。','discover','最初の言葉を見つける')}<div class="home-bottom"><section class="card small-card"><span class="round-icon sage">${icon('repeat')}</span><div><span class="eyebrow">REDISCOVER</span><h3>${due.length?`${due.length}つの言葉が、あなたを待っています。`:'少し時間をおいて、また会おう。'}</h3><p>${due.length?`今日の言葉は「${esc(due[0].word)}」。いまの気持ちで、新しい一文を。`:'使ってみた言葉は、翌日以降にもう一度。以前の自分との違いを見つけよう。'}</p>${due.length?textBtn('ヒントなしで、もう一度','review',`data-id="${esc(due[0].id)}"`):textBtn('言葉の地図を見る','atlas')}</div></section><section class="card small-card"><span class="round-icon">${icon('pen')}</span><div><span class="eyebrow">A PAGE FOR YOURSELF</span><h3>うまく言えない日も、そのまま。</h3><p>日常のひとこまが、次の言葉の種になる。<br>誰にも見せない、あなたのためのノート。</p>${textBtn(data.drafts.journal?'書きかけの日記をひらく':'気持ちをつづる','new-journal')}</div></section></div>`;
}
function newJournal(id=null) {
  const entry=data.journals.find(j=>j.id===id);
  if (entry && data.drafts.journal?.id !== entry.id) data.drafts.journal={...entry,wordIds:[...entry.wordIds]};
  else if (!data.drafts.journal) data.drafts.journal={id:uid(),date:now(),title:'',content:'',mood:'',wordIds:[]};
  screen='journal'; persist(); render();
}
function journalScreen() {
  const d=data.drafts.journal;
  return `${heading('JOURNAL / CAPTURE','気持ちに、余白をあげよう。','うれしかったことも、名前のつかない気持ちも。そのまま書いていい。')}${loop(0)}<div class="two-col"><div>${d?`<form id="journal-form" class="card"><div class="card-top"><span class="eyebrow">${dateLabel(d.date)} のノート</span><span class="pill">下書き自動保存</span></div><label class="field" for="journal-title">タイトル（任意）</label><input id="journal-title" type="text" name="title" data-draft="journal" maxlength="80" value="${esc(d.title)}" placeholder="今日の、ちいさなできごと"><fieldset class="plain-fieldset"><legend class="field">いまの気分（任意）</legend><div class="moods">${['','晴れやか','穏やか','もやもや','しょんぼり','そわそわ'].map(m=>`<label class="mood"><input type="radio" data-draft="journal" name="mood" value="${m}" ${d.mood===m?'checked':''}>${m||'選ばない'}</label>`).join('')}</div></fieldset><label class="field" for="journal-content">今日、どんなことがあった？</label><textarea id="journal-content" name="content" data-draft="journal" maxlength="6000" required placeholder="友達が褒められていて、うれしいけど少し複雑だった…">${esc(d.content)}</textarea><div class="counter-row"><span>あなたのブラウザだけに保存</span><span id="journal-count">${chars(d.content)}文字</span></div><div class="actions"><button class="button secondary" type="submit">ノートを保存 ${icon('book')}</button>${btn('この気持ちに合う言葉を探す','journal-discover')}</div>${data.journals.some(j=>j.id===d.id)?`<div class="actions between">${textBtn('別のページをつづる','blank-journal')}<button type="button" class="text-button" data-action="delete-journal" data-id="${d.id}">この日記を削除</button></div>`:''}</form>`:empty('あなたのペースで、最初のページを。','書いた内容から、自分にしっくりくる言葉を見つけられます。','new-journal','日記を書く')}<div class="section-title"><h2>これまでのノート <small>${data.journals.length} PAGES</small></h2>${d?textBtn('新しいページ','blank-journal'):''}</div><div class="entry-list">${data.journals.length?data.journals.map(j=>`<button type="button" class="entry-card" data-action="edit-journal" data-id="${esc(j.id)}"><small>${dateLabel(j.date)} ${esc(j.mood)} · ${j.wordIds.length}の言葉</small><h3>${esc(j.title||'タイトルのない気持ち')}</h3><p>${esc(j.content)}</p></button>`).join(''):empty('まだ、まっさらなノート。','短いひとことでも、あなたの言葉の種になります。')}</div></div><aside class="stack"><div class="hint-card"><span class="eyebrow">NO RIGHT ANSWER</span><h3>整っていなくても、大丈夫。</h3><p>「何があった？」「どんな気分？」。まずはひとつ、書いてみよう。言葉の候補が違うと感じたら、選ばなくていい。</p></div><div class="hint-card"><span class="eyebrow">YOUR WORD LOOP</span><h3>このページが、地図につながる。</h3><p>日記から見つけた言葉で、自分の一文をつくる。使った言葉が、あなただけの世界に育ちます。</p></div></aside></div>`;
}
function saveJournal(silent=false) {
  capture(); const d=data.drafts.journal;
  if (!d?.content.trim()) { toast('気持ちをひとこと、書いてみよう。'); document.querySelector('#journal-content')?.focus(); return null; }
  const entry={...d,content:d.content.trim(),updatedAt:now()};
  data.journals=[entry,...data.journals.filter(j=>j.id!==entry.id)];
  data.drafts.journal={...entry,wordIds:[...entry.wordIds]};
  if (silent) persist(); else {savedToast('ノートを保存しました。いつでも書き直せます。');render(false);}
  return entry;
}
// Replace these local rules with an explicitly consented backend request for real AI.
function suggestWords(text,mood='') {
  const ranked=WORDS.map((w,index)=>({...w,index,score:w.keys.reduce((n,key)=>n+(text.includes(key)?1:0),0)+(mood==='もやもや'&&w.word==='もどかしい'?1:0)})).sort((a,b)=>b.score-a.score||a.index-b.index);
  return (ranked[0].score?ranked.filter(w=>w.score>0):ranked).slice(0,4);
}
function generateFollowUpQuestion(answers,step) {
  if (step===0) return 'いま、心に残っていることは？';
  if (step===1) return /うれし|嬉|ありがとう|楽しか/.test(answers[0])?'その中で、いちばんうれしかったのは？':'その気持ちにつながった、できごとは？';
  return /うれし|嬉|ありがとう|楽しか/.test(answers[0])?'そのできごとから、何を大切にしたいと思った？':'本当は、どうなってほしかった？';
}
function beginDiscover(options={}) {
  const begin=()=>{
    data.drafts.discover={id:uid(),sourceJournalId:options.journalId||null,context:options.context||'',prompt:options.prompt||'',dailyKey:options.dailyKey||null,answers:options.context?[options.context,'','']:['','',''],step:options.context?3:0,level:'guided',selectedWordId:null,rejected:false,customWord:'',customCategory:'emotion',customMeaning:''};
    screen='discover';persist();render();
  };
  capture();
  const current=data.drafts.discover;
  if (current && (current.answers.some(a=>a.trim())||current.selectedWordId)) confirmAction('新しい気持ちから、はじめますか？','途中の言葉探しを置き換えます。保存済みの日記や言葉は残ります。','新しくはじめる',begin);
  else begin();
}
function assistanceOptions(selected,draft) { return `<fieldset class="plain-fieldset"><legend class="field">考えるときのサポート</legend><div class="choice-grid">${[['guided','ガイドあり','質問とヒント'],['assisted','必要なときだけ','ヒントは自分で開く'],['independent','自分の力で','ヒントなし']].map(([value,label,help])=>`<label class="choice"><input type="radio" name="level" value="${value}" data-draft="${draft}" ${value===selected?'checked':''}><span>${label}<small>${help}</small></span></label>`).join('')}</div></fieldset>`; }
function discoverScreen() {
  const d=data.drafts.discover;
  if (!d) return `${heading('DISCOVER / FIND YOUR WORDS','いまの気持ちから、ひとつ。','思いをたどり、しっくりくる言葉に出会う。')}<div class="notice">質問と候補は、あらかじめ用意したルールによるデモです。AIが気持ちを決めたり、完成した文章を代筆したりすることはありません。</div><div class="two-col"><section class="card"><span class="eyebrow">WHERE SHALL WE START?</span><h2 style="margin:14px 0">どこから、言葉を探そう。</h2><div class="stack">${btn('いまの気持ちから','start-discover','secondary')}${btn('最近のできごと・考えから','start-experience','secondary')}${btn('今日のお題から','daily','soft')}${btn('日記のページから','new-journal','secondary')}</div></section><aside class="hint-card"><span class="eyebrow">A LITTLE QUESTION</span><h3>「なんとなく」の、少し先へ。</h3><p>できごとをたどって、気持ちを見つめる。言葉はあなた自身が選びます。途中で日記に戻っても、下書きは残ります。</p></aside></div>`;
  const content=d.answers.filter(Boolean).join(' '), selected=data.words.find(w=>w.id===d.selectedWordId);
  return `${heading('DISCOVER / FIND YOUR WORDS','その思いに、名前を見つけよう。','しっくりくるかどうかは、あなたが決めていい。')}${loop(1)}<div class="notice">定型質問・キーワードによる候補のデモです。気持ちの診断や本物のAI分析ではありません。</div><div class="two-col"><div class="card">${d.prompt?`<p class="eyebrow">今回のお題</p><p class="wrap">${esc(d.prompt)}</p><hr class="muted-line">`:''}${d.step<3?`<form id="discover-form">${assistanceOptions(d.level,'discover')}<p class="question-number">0${d.step+1}<small> / 03</small></p><label class="field" for="discover-answer">${d.level==='independent'?['残しておきたい気持ち・考え','それにつながったできごと','自分が大切にしたいこと'][d.step]:esc(generateFollowUpQuestion(d.answers,d.step))}</label><textarea id="discover-answer" name="answer" maxlength="1800" required placeholder="短い言葉でも大丈夫。">${esc(d.answers[d.step])}</textarea>${d.level==='guided'?`<p class="field-note">${['最近のできごとや、いまの気持ちをひとつ。','いつ、誰と、どんな場面だった？ 伝えたい範囲だけで大丈夫。','相手へのお願いや、これからの自分への気づきをひとつ。'][d.step]}</p>`:d.level==='assisted'?'<details><summary>小さなヒントを見る</summary><p class="subtle">できごと・自分の気持ち・大切にしたいことを、ひとつずつ考えてみよう。</p></details>':''}<div class="actions">${d.step?btn('ひとつ前へ','discover-back','secondary'):''}<button type="submit" class="button">${d.step===2?'合う言葉を探す':'次の問いへ'} ${icon('arrow')}</button></div></form>`:`${assistanceOptions(d.level,'discover')}<h2>この思いに、近い言葉は？</h2><p class="subtle" style="margin-top:9px">候補はひとつの入り口。全部違っても、大丈夫。</p>${d.level!=='independent'&&!d.rejected?`<div class="suggestion-grid">${suggestWords(content).map(w=>`<button type="button" class="suggestion" data-action="select-word" data-word="${esc(w.word)}" aria-pressed="${selected?.word===w.word}"><b>${esc(w.word)}</b><p>${esc(w.meaning)}</p></button>`).join('')}</div><div class="actions">${textBtn('どれもしっくりこない','reject-words')}</div>`:`<p class="field-note">${d.level==='independent'?'自分で使ってみたい言葉を選んでみよう。':'候補を選ばなくても大丈夫。自分の言葉を残せます。'}</p>`}${customWordForm(d)}${selected?`<div class="selected-word">今回、使ってみる言葉：<b>${esc(selected.word)}</b><p class="field-note">${esc(selected.meaning)}</p></div><div class="actions">${btn('この言葉を使って表現してみる','discover-challenge')}</div>`:''}<div class="actions">${d.sourceJournalId?textBtn('日記の言葉を見直す','source-journal'):textBtn('問いをもう一度見直す','discover-back')}${textBtn('別の思いから探す','start-discover')}</div>`}</div><aside class="hint-card"><span class="eyebrow">YOUR THOUGHT MAP</span><h3>思いの、通り道。</h3><ol class="thought-path">${d.answers.map((answer,i)=>`<li><small>${['心に残ったこと','その背景','大切にしたいこと'][i]}</small>${esc(answer||'これから、見つかる言葉。')}</li>`).join('')}${selected?`<li><small>使ってみる言葉</small>${esc(selected.word)}</li>`:''}</ol>${selected?`<p class="field-note">見つけた言葉は、地図にも残りました。次は自分の一文に。</p>`:''}</aside></div>`;
}
function customWordForm(d) { return `<form id="custom-word-form" class="custom-word"><div class="inline-form"><div><label class="field" for="custom-word">自分で見つけた言葉</label><input id="custom-word" name="customWord" data-draft="discover" type="text" maxlength="30" value="${esc(d.customWord)}" required placeholder="たとえば、やるせない"></div><button class="button secondary" type="submit">この言葉にする</button></div><details><summary>意味とエリアを自分で添える（任意）</summary><label class="field" for="custom-meaning">自分にとっての意味</label><input id="custom-meaning" type="text" data-draft="discover" name="customMeaning" maxlength="140" value="${esc(d.customMeaning)}" placeholder="いまの自分が、この言葉から感じること"><label class="field" for="custom-category">地図のエリア</label><select id="custom-category" data-draft="discover" name="customCategory">${REGIONS.map(r=>`<option value="${r.id}" ${r.id===d.customCategory?'selected':''}>${r.name}</option>`).join('')}</select></details></form>`; }
function collectWord(wordInfo) {
  const d=data.drafts.discover, normalized=normalizeWord(wordInfo.word);
  let w=data.words.find(item=>normalizeWord(item.word)===normalized);
  if (!w) { w={id:uid(),word:normalized,category:wordInfo.category,meaning:wordInfo.meaning||'自分で見つけた言葉。いまの自分にとっての意味を、表現しながら探してみよう。',dateDiscovered:now(),sourceJournalId:d.sourceJournalId,sourceJournalIds:d.sourceJournalId?[d.sourceJournalId]:[],originalContext:d.context||d.answers.filter(Boolean).join('\n'),practiceAttempts:[],reviewAttempts:[],stage:'discovered',nextReviewDate:null};data.words.push(w); }
  if (d.sourceJournalId) {
    if (!w.sourceJournalIds.includes(d.sourceJournalId)) w.sourceJournalIds.push(d.sourceJournalId);
    if (!w.sourceJournalId) w.sourceJournalId=d.sourceJournalId;
    const j=data.journals.find(j=>j.id===d.sourceJournalId); if (j&&!j.wordIds.includes(w.id)) j.wordIds.push(w.id);
    if (j && data.drafts.journal?.id===j.id) data.drafts.journal.wordIds=[...j.wordIds];
  }
  d.selectedWordId=w.id; selectedWordId=w.id; savedToast(`「${w.word}」を見つけました。次は、自分の言葉で。`);render(false);
}
function setupChallenge(wordId,options={}) {
  capture(); const w=data.words.find(w=>w.id===wordId); if (!w) return;
  const begin=()=>{
    data.drafts.challenge={id:uid(),targetWordId:w.id,prompt:options.prompt||'この言葉を使って、最近の気持ちや考えを表現してみよう。',context:options.context||w.originalContext||'',sourceJournalId:options.sourceJournalId||null,dailyKey:options.dailyKey||null,level:options.review?'independent':options.level||'guided',review:Boolean(options.review),mode:'random',challengeType:'characters',goal:GOALS[Math.floor(Math.random()*GOALS.length)],started:false,limits:[],phase:0,response:'',reflection:'',attemptIds:[]};
    screen='challenge';persist();render();
  };
  if (data.drafts.challenge && (data.drafts.challenge.response.trim() || data.drafts.challenge.attemptIds.length)) confirmAction('新しいチャレンジをはじめますか？','途中のチャレンジを置き換えます。すでに地図に残した表現は消えません。','新しくはじめる',begin); else begin();
}
function expressionHint(d) { return d.mode==='expand'?'前の一文に、理由や具体的なできごとをひとつ添えてみよう。':d.mode==='compress'?'いちばん伝えたい気持ちはどこ？ その中心を残してみよう。':`「いつ、何があった？」「自分はどう感じた？」からひとつ選んでみよう。今回の目標は「${d.goal}」。`; }
function challengeScreen() {
  const d=data.drafts.challenge,w=data.words.find(w=>w.id===d?.targetWordId);
  if (!d||!w) return `${heading('WORD CHALLENGE','言葉を見つけて、使ってみよう。')}${empty('まずは、あなたの言葉から。','日記や言葉探しで選んだ言葉が、チャレンジにつながります。','discover','言葉を見つける')}`;
  if (!d.started) return `${heading('CHALLENGE / EXPRESS','その言葉を、あなたの一文に。','正解の文章をつくるより、自分の思いに近づこう。')}${loop(2)}<form id="challenge-setup" class="card"><span class="pill">今回使ってみる言葉：${esc(w.word)}</span><h2 class="challenge-topic">${esc(d.prompt)}</h2>${!d.dailyKey?`<div>${textBtn('別のお題を引く','random-topic')}</div>`:''}<label class="field" for="challenge-mode">練習のかたち</label><select id="challenge-mode" name="mode" data-draft="challenge">${Object.entries(MODES).map(([id,name])=>`<option value="${id}" ${d.mode===id?'selected':''}>${name}${id==='expand'?' — 短い言葉に理由や背景を足す':id==='compress'?' — 思いの中心を残す':' — 制約を引いてみる'}</option>`).join('')}</select><label class="field" for="challenge-type">数え方</label><select id="challenge-type" name="challengeType" data-draft="challenge"><option value="characters" ${d.challengeType==='characters'?'selected':''}>文字数（標準）</option><option value="words" ${d.challengeType==='words'?'selected':''} ${segmenter?'':'disabled'}>語数（上級）${segmenter?'':' — このブラウザは非対応'}</option></select><p class="field-note">文字数はUnicode文字単位（空白・改行も含む）です。語数はIntl.Segmenterの日本語の語らしい区切りを数えます。${segmenter?'':'この環境では語数モードを利用できません。'}</p>${assistanceOptions(d.level,'challenge')}<div class="notice" style="margin-top:20px">${d.review?'復習は、まずヒントなしで。必要なら練習中にサポートを選び直せます。':'制約内に収まることだけで、上達や習得を判定しません。最後は、自分の感覚で振り返ります。'}</div><div class="actions"><button class="button" type="submit">制約をひいて、はじめる ${icon('spark')}</button>${btn('言葉の地図に戻る','atlas','secondary')}</div></form>`;
  const limit=d.limits[d.phase],unit=d.challengeType==='words'?'語':'文字',count=countExpression(d.response,d.challengeType);
  return `${heading(d.review?'REDISCOVER / EXPRESS AGAIN':'CHALLENGE / YOUR OWN WORDS',d.review?'同じ言葉で、新しい自分を。':'短くても、あなたらしく。','言葉を使って、自分の気持ちや考えを表現してみよう。')}${loop(d.review?4:2)}<div class="challenge-layout"><form id="expression-form" class="card"><div class="card-top"><span class="pill">今回使ってみる言葉：${esc(w.word)}</span><span class="eyebrow">${MODES[d.mode]} ${d.phase+1} / ${d.limits.length}</span></div><h2 class="challenge-topic">${esc(d.prompt)}</h2><div class="constraint"><div><strong>${limit}</strong><span>${unit}以内で表現</span></div><span class="goal">${esc(d.goal)}</span></div><label class="field" for="expression">「${esc(w.word)}」を使った、あなたの一文</label><textarea id="expression" name="response" data-draft="challenge" maxlength="4000" required placeholder="ここに、あなた自身の言葉を。" aria-describedby="expression-count expression-rule">${esc(d.response)}</textarea><div class="counter-row"><span id="expression-rule">${d.challengeType==='words'?'日本語の語らしい区切りを数えます':'文字数です。日本語の語数ではありません。'}</span><output id="expression-count" class="live-count ${count>limit?'over':''}" aria-live="polite">${count} / ${limit}${unit}</output></div><div class="progress-track" aria-hidden="true"><span id="count-track" style="width:${Math.min(count/limit*100,100)}%"></span></div><p id="expression-error" class="error" role="alert" hidden></p><fieldset class="plain-fieldset"><legend class="field">自分の伝えたいことを表現できた？</legend><div class="moods">${[['yes','できた'],['practice','もう少し練習したい']].map(([value,label])=>`<label class="mood"><input type="radio" name="reflection" value="${value}" data-draft="challenge" required ${d.reflection===value?'checked':''}>${label}</label>`).join('')}</div></fieldset><p class="field-note">どちらを選んでも練習を残せます。別の日に新しい一文を書き、「できた」を選ぶと再訪になります。</p><div class="actions"><button class="button" type="submit">${d.phase<d.limits.length-1?'この表現を残して、次の長さへ':'この表現を地図に残す'} ${icon('leaf')}</button></div></form><aside class="stack"><div class="hint-card"><span class="eyebrow">MAKE IT YOURS</span><h3>答えは、あなたの中に。</h3>${assistanceOptions(d.level,'challenge')}${d.level==='guided'?`<p>${esc(expressionHint(d))}</p>`:d.level==='assisted'?`<details><summary>小さなヒントを見る</summary><p>${esc(expressionHint(d))}</p></details>`:'<p>いまはヒントなしで。あなたの思うままに、書いてみよう。</p>'}${d.context?`<details><summary>もとの気持ちを見返す</summary><p class="wrap">${esc(d.context)}</p></details>`:''}</div>${d.attemptIds.length?`<div class="card"><h3>今回の、言葉の変化</h3>${attemptList(d.attemptIds)}</div>`:''}</aside></div>`;
}
function evaluateExpression(text,word,type,limit) {
  if (!text.trim()) return {valid:false,message:'自分の言葉で、ひとこと書いてみよう。'};
  const count=countExpression(text,type);
  if (count>limit) return {valid:false,message:`${count-limit}${type==='words'?'語':'文字'}オーバーしています。伝えたい中心を残してみよう。`};
  if (!normalizeWord(text).includes(normalizeWord(word))) return {valid:false,message:`今回の言葉「${word}」を、そのまま一度使ってみよう。`};
  if (normalizeWord(text)===normalizeWord(word)) return {valid:false,message:'言葉だけでなく、自分の気持ちやできごとを添えた一文にしてみよう。'};
  return {valid:true,count};
}
function scheduleReview(word,successfulLaterDay=false) {
  const dates=new Set(word.reviewAttempts.map(id=>data.challenges.find(c=>c.id===id)).filter(Boolean).map(c=>dateKey(new Date(c.date))));
  const days=REVIEW_INTERVALS[Math.min(dates.size,REVIEW_INTERVALS.length-1)];
  if (word.nextReviewDate && !successfulLaterDay) return word.nextReviewDate;
  const next=new Date();next.setDate(next.getDate()+days);return dateKey(next);
}
function lastPractice(word) { return data.challenges.find(c=>c.id===word.practiceAttempts[word.practiceAttempts.length-1])?.date||word.dateDiscovered; }
function updateAtlasProgress() {
  const practiced=data.words.filter(w=>w.practiceAttempts.length).length,revisited=data.words.filter(w=>w.stage==='revisited').length;
  return {practiced,revisited,unlocked:['emotion',...(practiced>=REGION_THRESHOLDS.thought?['thought']:[]),...(practiced>=REGION_THRESHOLDS.expression?['expression']:[]),...(revisited>=REGION_THRESHOLDS.connection?['connection']:[])]};
}
function completeExpression() {
  capture(); const d=data.drafts.challenge,w=data.words.find(w=>w.id===d.targetWordId);
  const result=evaluateExpression(d.response,w.word,d.challengeType,d.limits[d.phase]);
  if (!result.valid) {const el=document.querySelector('#expression-error');el.textContent=result.message;el.hidden=false;document.querySelector('#expression').focus();return;}
  if (!d.reflection) return;
  const timestamp=now();
  const prior=w.practiceAttempts.map(id=>data.challenges.find(c=>c.id===id)).filter(Boolean);
  const laterDay=prior.some(c=>dateKey(new Date(c.date))<dateKey());
  const alreadyReviewedToday=w.reviewAttempts.some(id=>dateKey(new Date(data.challenges.find(c=>c.id===id).date))===dateKey());
  const reviewSuccess=laterDay&&d.reflection==='yes'&&!alreadyReviewedToday&&!prior.some(c=>normalizeWord(c.response)===normalizeWord(d.response));
  const c={id:uid(),runId:d.id,date:timestamp,prompt:d.prompt,challengeType:d.challengeType,limit:d.limits[d.phase],targetWordId:w.id,sourceJournalId:d.sourceJournalId,response:d.response.trim(),selfReflection:d.reflection,assistanceLevel:d.level,mode:d.mode,goal:d.goal,isReview:reviewSuccess};
  data.challenges.push(c);w.practiceAttempts.push(c.id);
  if (reviewSuccess) w.reviewAttempts.push(c.id);
  w.stage=w.reviewAttempts.length?'revisited':'practiced';
  w.nextReviewDate=scheduleReview(w,reviewSuccess);
  if (d.dailyKey&&data.daily[d.dailyKey]) data.daily[d.dailyKey].completed=true;
  d.attemptIds.push(c.id);
  if (d.phase<d.limits.length-1) {d.phase++;d.response=c.response;d.reflection='';savedToast('一文を残しました。同じ思いを、次の長さで。');render();}
  else {selectedWordId=w.id;data.drafts.challenge=null;screen='atlas';savedToast(reviewSuccess?'また使えた言葉として、地図に残しました。':'あなたの一文が、世界の小さな芽になりました。');render();}
}
function attemptList(ids) {
  const attempts=ids.map(id=>data.challenges.find(c=>c.id===id)).filter(Boolean);
  if (!attempts.length) return '<p class="subtle">まだ表現の記録はありません。この言葉で、一文を残してみよう。</p>';
  return `<ol class="attempt-list">${[...attempts].reverse().map(c=>`<li class="attempt-item"><small>${dateLabel(c.date)} · ${c.limit}${c.challengeType==='words'?'語':'文字'}以内 · ${LEVELS[c.assistanceLevel]||'自分の力で'}${c.isReview?' · 再訪':''}</small><p>${esc(c.response)}</p><small>自分の振り返り：${c.selfReflection==='yes'?'できた':'もう少し練習したい'}</small></li>`).join('')}</ol>`;
}
function miniMap() { return `<svg class="mini-world" viewBox="0 0 330 170" fill="none" aria-hidden="true"><ellipse cx="168" cy="140" rx="124" ry="17" fill="#e9eee7"/><path d="M51 113c-25-29 2-59 47-58 17-33 73-37 97-10 44-15 94 11 81 43 30 29-1 61-54 55-42 13-84 4-109-1-34 9-64-2-62-29Z" fill="#e0e8cf" stroke="#cbd5bb"/><path d="M81 124c29-33 69-1 88-30s46-26 73-30" stroke="#fbf8e8" stroke-width="9"/><ellipse cx="224" cy="114" rx="31" ry="16" fill="#bdd7d6"/><path d="M116 113V77m0 16c-20-1-22-13-20-17 15-1 20 8 20 17Zm1-8c0-13 10-23 20-17 0 12-7 18-20 17Z" fill="#a9bf8c" stroke="#8eaa74" stroke-width="1.5"/><path d="m163 65 19-16 18 16v25h-37Z" fill="#f9eee0" stroke="#c5ad92"/><path d="m159 65 23-20 23 20" stroke="#d5a8ae" stroke-width="5" stroke-linecap="round"/><path d="M178 90V76h9v14" fill="#cfbda2"/><path d="M68 73V50m0 13c-12-1-17-10-12-14 9 0 12 8 12 14Z" stroke="#ac8192" fill="#e8c1cf" stroke-width="2"/><circle cx="71" cy="44" r="12" fill="#e4b8c9"/><path d="m252 45 3 7 7 3-7 3-3 7-3-7-7-3 7-3Z" fill="#bca176"/><path class="map-cloud" d="M41 29c-5-10 6-19 15-13 9-12 26-3 22 7 11-2 18 7 10 12H40c-8-1-7-6 1-6Z" fill="white"/><circle cx="142" cy="131" r="4" fill="#d79bb2"/><circle cx="130" cy="135" r="3" fill="#d79bb2"/><path d="m283 102 4 2m-1 7 6 1" stroke="#b8cdcc" stroke-linecap="round"/></svg>`; }
function tree(x,y,scale=1) { return `<g transform="translate(${x} ${y}) scale(${scale})"><path d="M0 0v-28" stroke="#9b8b70" stroke-width="3"/><path d="M-18-17 0-58l18 41Z" fill="#8fa681"/><path d="M-15-32 0-65l15 33Z" fill="#a6ba94"/></g>`; }
function house(x,y,s=1) { return `<g transform="translate(${x} ${y}) scale(${s})"><path d="M-19 0v-28L0-45l19 17V0Z" fill="#f9f0dd" stroke="#c6ae95"/><path d="m-24-27 24-22 24 22" stroke="#c895a3" stroke-width="6" stroke-linecap="round"/><path d="M-4 0v-18H6V0" fill="#bca88f"/><path d="M-12-26h6v6h-6m18-6h6v6H6" fill="#e1d3b7"/></g>`; }
function mapMarker(w,index) {
  const layouts={emotion:[[220,285],[136,300],[263,340],[159,354],[213,368],[95,342]],thought:[[481,186],[567,188],[524,235],[448,225]],expression:[[470,381],[554,406],[540,344],[445,430]],connection:[[245,136],[170,173],[307,158],[200,208]]};
  const spots=layouts[w.category],pos=spots[index%spots.length];
  // Additional words remain accessible in the collection list; avoid overlapping SVG labels.
  if (index>=spots.length) return '';
  const plant=w.stage==='discovered'?'<path d="M0-7v-10m0 3c-9 0-11-6-8-8 6 0 8 4 8 8Z" fill="#b3c397" stroke="#8b9d73"/>':w.stage==='practiced'?'<path d="M0-7v-24m0 12c-14 0-17-10-12-12 10 0 12 7 12 12Zm0-7c0-10 9-15 15-11 0 8-6 12-15 11Z" fill="#abc18e" stroke="#8b9d73" stroke-width="1.5"/>':'<path d="M0-7v-28" stroke="#849a6a" stroke-width="2"/><circle cx="0" cy="-39" r="11" fill="#d8a0b5"/><circle cx="0" cy="-39" r="4" fill="#fff0d9"/><path d="M0-20c-13 0-15-8-12-10 9 0 12 6 12 10Z" fill="#a6bf8b"/>';
  return `<g class="map-word" role="button" tabindex="0" aria-label="${esc(w.word)}、${STAGES[w.stage]}。詳細をひらく" data-action="word-detail" data-id="${esc(w.id)}" transform="translate(${pos[0]} ${pos[1]})"><title>${esc(w.word)} — ${STAGES[w.stage]}</title><ellipse class="marker-halo" cy="-4" rx="26" ry="13"/>${plant}<rect x="-${Math.max(25,chars(w.word)*7+8)}" y="11" width="${Math.max(50,chars(w.word)*14+16)}" height="25" rx="12" fill="#fffcf4" fill-opacity=".94"/><text text-anchor="middle" y="28">${esc(w.word)}</text></g>`;
}
function worldMap() {
  const p=updateAtlasProgress(),groups=id=>`map-region ${p.unlocked.includes(id)?'':'locked'}`;
  const names=(id,x,y)=>`<text class="map-label" x="${x}" y="${y}" text-anchor="middle">${region(id).name}</text><text class="map-label-en" x="${x}" y="${y+16}" text-anchor="middle">${region(id).en}</text>`;
  const viewW=720/zoom,viewH=500/zoom;
  return `<svg class="world-map" viewBox="${(720-viewW)/2} ${(500-viewH)/2} ${viewW} ${viewH}" role="group" aria-label="あなたの言葉の地図。草原、村、湖、森の4つのエリア。言葉の場所はキーボードでも選択できます。"><defs><pattern id="water" width="80" height="50" patternUnits="userSpaceOnUse"><path d="M13 28q8 4 16 0m19-17q6 3 12 0" stroke="#d5e3df" stroke-width="1" fill="none"/></pattern></defs><rect width="720" height="500" fill="#edf3ef"/><rect width="720" height="500" fill="url(#water)"/><ellipse cx="352" cy="310" rx="265" ry="141" fill="#dfe9df" opacity=".4"/><path d="M97 271c-39-43-12-89 33-100-15-62 45-105 107-91 24-34 78-33 119-6 53-26 99-15 128 20 51-4 108 24 109 69 38 12 55 53 33 92 35 34 13 82-24 95-3 47-61 83-111 70-38 29-91 33-133 12-55 21-111 4-130-16-55 17-115-9-112-51-47-19-51-65-19-94Z" fill="#f5f0df" stroke="#d6d9c5" stroke-width="2"/><path d="M104 279c-21-35 3-73 38-82 24-9 52 1 64 27 42-22 75 2 87 27 26 9 40 30 23 54 16 42-19 84-60 79-42 24-104 12-113-14-42 4-78-27-65-54Z" fill="#dce7c7"/><g class="${groups('thought')}"><path d="M356 119c-10-51 43-66 82-39 38-19 90-1 100 31 50 0 81 35 58 69 24 42-24 82-61 62-31 20-60 3-80-14-49 7-79-14-70-43-37-9-53-41-29-66Z" fill="#e8deca"/>${house(454,151,.95)}${house(524,136,.7)}<path d="M429 167q32 25 78 10" stroke="#d1c0a3" stroke-width="3" fill="none"/>${names('thought',483,278)}</g><g class="${groups('expression')}"><path d="M413 307c15-30 69-43 95-20 50-12 100 14 93 58 42 34 14 78-27 73-27 25-69 24-93 1-47 17-88-12-74-45-30-23-25-55 6-67Z" fill="#d6e4df"/><path d="M454 318c27-16 84-15 95 13 36-2 55 29 31 47-11 27-62 29-80 9-39 2-63-21-46-42-13-7-12-20 0-27Z" fill="#b8d4d5"/><path d="M493 337q14 6 30 0m4 26q13 5 25 0" stroke="#e4f1e9" stroke-width="2" fill="none"/><path d="M435 339q-10 2-18-7m21 12q-15 9-24 4" stroke="#91b39d" stroke-width="2" fill="none"/>${names('expression',523,460)}</g><g class="${groups('connection')}"><path d="M139 169c-19-35-1-67 30-72-5-39 42-62 76-40 27-15 75-11 88 20 51 9 58 57 24 80 4 32-37 55-69 36-30 31-68 20-85 3-40 14-64-1-64-27Z" fill="#cfddc5"/>${tree(196,146,.8)}${tree(239,118,.95)}${tree(282,143,.75)}${tree(316,119,.7)}${names('connection',247,53)}</g><path class="map-path" d="M223 287Q303 266 354 250T480 186" opacity="${p.practiced>=1?1:.25}"/><path class="map-path" d="M360 252q64 32 117 117" opacity="${p.practiced>=3?1:.25}"/><path class="map-path" d="M342 249q-23-67-95-104" opacity="${p.revisited>=5?1:.25}"/>${names('emotion',192,426)}<g aria-hidden="true"><path d="M102 255v-30m0 11c-13 0-16-8-12-10 9 0 12 6 12 10Z" stroke="#9aa979" stroke-width="2" fill="#bacb97"/><circle cx="103" cy="216" r="10" fill="#e8becd"/><path d="M291 385v-16m-7 5 7 7 7-9" stroke="#92ab7f" stroke-width="2" fill="none"/><circle cx="291" cy="362" r="6" fill="#dfb0c3"/><circle cx="171" cy="252" r="3" fill="#d9b380"/><circle cx="178" cy="260" r="3" fill="#d9b380"/><path class="map-cloud" d="M56 109c-14-15 5-32 19-22 13-15 36-3 30 11 18-3 26 14 11 19H59c-10 0-11-5-3-8Z" fill="#fff" fill-opacity=".85"/><path class="map-cloud" d="M588 68c-9-13 8-28 21-18 12-12 29-2 24 9 14-2 19 10 8 14h-52c-9-1-8-5-1-5Z" fill="#fff" fill-opacity=".85"/><path d="m646 385 0-36m-12 17 12-17 12 17" stroke="#a5b7aa" fill="none"/><text x="646" y="337" text-anchor="middle" font-family="Georgia" font-size="12" fill="#8fa393">N</text></g>${REGIONS.map(r=>data.words.filter(w=>w.category===r.id).map(mapMarker).join('')).join('')}${!data.words.length?'<text x="357" y="324" font-size="12" text-anchor="middle" fill="#758362">ここから、あなたの世界がはじまる。</text>':''}</svg>`;
}
function wordDetails(w) {
  if (!w) return `<section class="card"><span class="eyebrow">A WORD, A LITTLE STORY</span><h2 style="margin:13px 0">言葉の場所を、選んでみて。</h2><p class="subtle">地図の芽や下の言葉を選ぶと、自分が書いた一文や、その言葉に出会った気持ちを見返せます。</p><div class="actions">${btn('言葉を見つける','discover','soft')}</div></section>`;
  const source=data.journals.find(j=>j.id===w.sourceJournalId),stageOrder=['discovered','practiced','revisited'];
  return `<section class="card word-detail" id="word-detail" tabindex="-1"><span class="eyebrow">${region(w.category).en}</span><h2>${esc(w.word)}</h2><p class="meaning">${esc(w.meaning)}</p><div class="stage-line">${stageOrder.map((stage,i)=>`<span class="${i<=stageOrder.indexOf(w.stage)?'reached':''}">${i+1} ${STAGES[stage]}</span>`).join('')}</div><p class="field-note">段階は保存した練習の記録です。言葉の完全な習得を表すものではありません。</p><dl><dt>出会った日</dt><dd>${dateLabel(w.dateDiscovered)}</dd><dt>はじまりの気持ち</dt><dd>${esc(w.originalContext||'自分で選んだ、使ってみたい言葉。')}</dd>${source?`<dt>つながっている日記</dt><dd>${textBtn(source.title||'タイトルのない気持ち','edit-journal',`data-id="${source.id}"`)}</dd>`:''}<dt>次に、また出会う日</dt><dd>${w.nextReviewDate?`${dateLabel(w.nextReviewDate)}${w.nextReviewDate<=dateKey()?' · いま、再挑戦できます':''}`:'最初の表現を残したあとに、予定を立てます。'}</dd></dl><div class="actions">${btn(w.practiceAttempts.length?'この言葉で、もう一度':'この言葉を使ってみる',w.practiceAttempts.length?'review':'practice-word','',`data-id="${w.id}"`)}</div><div class="detail-section"><h3>あなたが書いた、言葉の足あと</h3>${attemptList(w.practiceAttempts)}</div></section>`;
}
function atlasScreen() {
  const p=updateAtlasProgress(),word=data.words.find(w=>w.id===selectedWordId),filtered=data.words.filter(w=>atlasFilter==='all'||w.category===atlasFilter);
  return `${heading('WORD ATLAS / YOUR GROWING WORLD','言葉が育つ、わたしの地図。','ひとつの言葉にも、あなただけの物語がある。')}${loop(3)}<div class="atlas-layout"><div><div class="map-toolbar"><p>${data.words.length}つの言葉・${p.practiced}つを使い、${p.revisited}つと再会。</p><div class="map-controls" role="group" aria-label="地図の拡大縮小"><button type="button" data-action="zoom-out" aria-label="地図を縮小" ${zoom<=1?'disabled':''}>−</button><button type="button" data-action="zoom-reset" aria-label="地図を全体表示">${Math.round(zoom*100)}%</button><button type="button" data-action="zoom-in" aria-label="地図を拡大" ${zoom>=1.6?'disabled':''}>＋</button></div></div><div class="map-frame">${worldMap()}</div><div class="map-legend"><span><b>🌱</b>見つけた</span><span><b>♧</b>使ってみた</span><span><b>✿</b>別の日に、また使えた</span></div><div class="region-list">${REGIONS.map(r=>{const unlocked=p.unlocked.includes(r.id),condition={emotion:'はじまりのエリア',thought:`異なる${REGION_THRESHOLDS.thought}語の表現`,expression:`異なる${REGION_THRESHOLDS.expression}語の表現`,connection:`${REGION_THRESHOLDS.connection}語の別の日の再訪`}[r.id];return `<div class="region-status">${unlocked?'✧':'○'} ${r.name}<small>${unlocked?'開いています':condition+'で開きます'}</small></div>`;}).join('')}</div><p class="field-note">淡いエリアも、見つけた言葉は選べます。エリアの景色は実際の練習で少しずつ開きます。地図に収まらない言葉も、下の一覧からすべて選べます。</p><div class="section-title atlas-words"><h2>あなたの言葉</h2><select class="filter" id="atlas-filter" aria-label="地図の言葉をエリアで絞り込む"><option value="all">すべてのエリア</option>${REGIONS.map(r=>`<option value="${r.id}" ${atlasFilter===r.id?'selected':''}>${r.name}</option>`).join('')}</select></div>${filtered.length?`<div class="word-row">${filtered.map(wordChip).join('')}</div>`:empty('まだ言葉の芽がありません。','気持ちをつづることから、小さな世界が育ちます。','discover','言葉を見つける')}</div><aside class="atlas-detail">${wordDetails(word)}</aside></div>`;
}
function aboutScreen() { return `${heading('WHY TELLU.','「思っている」を、「言える」に。','Find your words. Expand your world.')}<div class="prose"><p>気持ちはあるのに、うまく言葉にならない。tellu.は、そんな思いから、自分の言葉で考えを表現する力を育てるための練習帳です。</p>${loop(1)}<h2>言葉は、ひとつの体験につながっています。</h2><p>日記につづった気持ちから、しっくりくる言葉を選ぶ。その言葉で自分の一文をつくる。言葉は地図に芽を出し、少し時間をおいて、また新しい表現に出会います。見つける・使う・再び使うという記録が、世界の景色に変わります。</p><h2>代わりに話すより、自分で見つける。</h2><p>完成した文章の生成や、言語能力の点数づけはしません。ガイド、必要なときだけのヒント、自分の力で考える練習を選べます。候補を選ばず、自分の言葉を登録することもできます。</p><h2>デモの仕組みと、これから。</h2><p>この版は定型質問とキーワードに応じた候補を使う、API不要のプロトタイプです。本物のAIではありません。復習は1・3・7・14日の間隔を目安にします。科学的に検証された学習効果を保証するものではありません。</p><p>将来のAI接続点は <code>suggestWords()</code>、<code>generateFollowUpQuestion()</code>、<code>evaluateExpression()</code> です。APIキーを保護するバックエンドと、送信内容についての説明・同意が必要です。今は外部への送信を行いません。</p><div class="actions">${btn('言葉を見つける','discover')}${btn('気持ちをつづる','new-journal','secondary')}</div></div>`; }
function privacyScreen() { return `${heading('YOUR WORDS, YOUR SPACE','あなたの言葉は、あなたのもの。','登録なしで、必要なものだけ。記録はこのブラウザに。')}<div class="prose"><h2>このブラウザに残すもの</h2><p>日記の内容・日時・タイトル・気分、選んだ言葉と意味、元の気持ち、チャレンジの制約・表現・自己振り返り・サポートの選択、復習日、途中の下書きをlocalStorageに保存します。実名や連絡先は不要です。外部への送信、AI APIの呼び出し、アクセス解析はありません。</p><h2>共有端末では、記録が見えることがあります。</h2><p>この記録は暗号化された保管庫ではありません。同じブラウザを使う人は内容を閲覧できることがあります。プライベートブラウズ、ブラウザのデータ削除や容量制限で消える場合があります。残したい記録はJSONで書き出してください。</p><h2>データを書き出す</h2><p>言葉 ${data.words.length}件・日記 ${data.journals.length}件・表現 ${data.challenges.length}件があります。JSONには日記や下書きも含まれます。保存したファイルの扱いには気を配ってください。以前の会話練習版の記録があれば、あわせて書き出します。</p><div class="actions">${btn('データをJSONで書き出す','export','secondary')}</div><h2>記録をすべて削除する</h2><p>このブラウザのtellu.の記録・下書き・復習予定と、以前の会話練習版の記録を削除します。ほかのアプリのデータは削除しません。削除は元に戻せません。</p><div class="actions"><button class="button danger" type="button" data-action="delete-all">tellu.のデータをすべて削除</button></div></div>`; }
function render(focus=true) {
  const navScreen=screen==='challenge'?'discover':screen;
  document.querySelectorAll('[data-nav]').forEach(el=>el.dataset.nav===navScreen?el.setAttribute('aria-current','page'):el.removeAttribute('aria-current'));
  const screens={home:homeScreen,journal:journalScreen,discover:discoverScreen,challenge:challengeScreen,atlas:atlasScreen,about:aboutScreen,privacy:privacyScreen};
  main.innerHTML=`<div class="screen">${(screens[screen]||homeScreen)()}</div>`;
  document.title=`tellu. — ${{home:'「思っている」を、「言える」に。',journal:'気持ちをつづる',discover:'言葉を見つける',challenge:'自分の言葉で表現する',atlas:'言葉の地図',about:'tellu.について',privacy:'プライバシーとデータ'}[screen]}`;
  if (focus) {main.focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
}
function exportData() {
  capture();
  try {
    let old=null,raw=null;
    try { old=localStorage.getItem(LEGACY_KEY);raw=storageHealthy?null:localStorage.getItem(STORAGE_KEY); } catch(error) { /* Current in-memory data can still be exported. */ }
    let legacy=old;try { legacy=old?JSON.parse(old):null; } catch(error) { /* Preserve unreadable legacy data as text. */ }
    const payload={app:'tellu.',exportedAt:now(),...data,legacyPractice:legacy,unreadableOriginal:raw};
    const url=URL.createObjectURL(new Blob([JSON.stringify(payload,null,2)],{type:'application/json'}));
    const a=document.createElement('a');a.href=url;a.download=`tellu-${dateKey()}.json`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),3000);toast('JSONファイルを書き出しました。');
  } catch(error) {toast('書き出せませんでした。ブラウザの保存設定を確認してください。');}
}
function deleteJournal(id) {
  confirmAction('この日記を削除しますか？','日記本文と、この日記へのリンクを削除します。言葉の「はじまりの気持ち」に保存した文と、チャレンジの表現は残ります。','この日記を削除',()=>{
    data.journals=data.journals.filter(j=>j.id!==id);
    data.words.forEach(w=>{w.sourceJournalIds=w.sourceJournalIds.filter(x=>x!==id);if(w.sourceJournalId===id)w.sourceJournalId=w.sourceJournalIds[0]||null;});
    data.challenges.forEach(c=>{if(c.sourceJournalId===id)c.sourceJournalId=null;});
    ['discover','challenge'].forEach(key=>{if(data.drafts[key]?.sourceJournalId===id)data.drafts[key].sourceJournalId=null;});
    if(data.drafts.journal?.id===id)data.drafts.journal=null;
    savedToast('日記を削除しました。');render();
  });
}
function updateLiveCount() {
  const d=data.drafts.challenge;if(!d?.started)return;
  const count=countExpression(d.response,d.challengeType),limit=d.limits[d.phase],output=document.querySelector('#expression-count');
  if(output){output.textContent=`${count} / ${limit}${d.challengeType==='words'?'語':'文字'}`;output.classList.toggle('over',count>limit);document.querySelector('#count-track').style.width=`${Math.min(count/limit*100,100)}%`;}
  const error=document.querySelector('#expression-error');if(error)error.hidden=true;
}
function openWord(id) {
  capture();persist();selectedWordId=id;screen='atlas';render(false);
  const el=document.querySelector('#word-detail');el?.focus({preventScroll:true});
  if(window.matchMedia('(max-width:1150px)').matches)el?.scrollIntoView({behavior:'instant',block:'start'});
}
// Event delegation keeps all screens interactive without page reloads.
document.addEventListener('click',event=>{
  const nav=event.target.closest('[data-nav]');if(nav){navigate(nav.dataset.nav);return;}
  if(event.target.closest('.brand')){event.preventDefault();navigate('home');return;}
  const el=event.target.closest('[data-action]');if(!el)return;
  const action=el.dataset.action;
  if(['home','journal','discover','atlas','privacy'].includes(action)){navigate(action);return;}
  if(action==='new-journal')newJournal();
  else if(action==='blank-journal'){
    capture();const d=data.drafts.journal;
    const begin=()=>{data.drafts.journal=null;newJournal();};
    if(d?.content.trim()&&!data.journals.some(j=>j.id===d.id&&j.content===d.content&&j.title===d.title&&j.mood===d.mood))confirmAction('新しいページをひらきますか？','保存していないこの下書きを置き換えます。残す場合は先に「ノートを保存」を選んでください。','新しいページをひらく',begin);else begin();
  }
  else if(action==='edit-journal'){
    capture();const d=data.drafts.journal;
    const open=()=>newJournal(el.dataset.id);
    if(d&&d.id!==el.dataset.id&&(d.content.trim()||d.title)&&!data.journals.some(j=>j.id===d.id&&j.content===d.content&&j.title===d.title&&j.mood===d.mood))confirmAction('別の日記をひらきますか？','保存していない日記の下書きを置き換えます。残す場合は先に保存してください。','ひらく',open);else open();
  }
  else if(action==='delete-journal')deleteJournal(el.dataset.id);
  else if(action==='journal-discover'){
    const entry=saveJournal(true);if(entry)beginDiscover({journalId:entry.id,context:entry.content,prompt:entry.title});
  }
  else if(action==='source-journal')newJournal(data.drafts.discover.sourceJournalId);
  else if(action==='daily')beginDiscover({prompt:dailyPrompt().prompt,dailyKey:dateKey()});
  else if(action==='start-discover')beginDiscover();
  else if(action==='start-experience')beginDiscover({prompt:'最近のできごとや、心に浮かんだ考えは？'});
  else if(action==='discover-back'){
    capture();const d=data.drafts.discover;
    const answer=main.querySelector('#discover-answer');if(answer)d.answers[d.step]=answer.value;
    d.step=Math.max(0,d.step-1);persist();render();
  }
  else if(action==='reject-words'){data.drafts.discover.rejected=true;persist();render(false);document.querySelector('#custom-word')?.focus();}
  else if(action==='select-word'){const w=WORDS.find(w=>w.word===el.dataset.word);if(w)collectWord(w);}
  else if(action==='discover-challenge'){
    const d=data.drafts.discover;setupChallenge(d.selectedWordId,{prompt:d.prompt||'いま見つけた気持ちを、自分の一文で伝えてみよう。',context:d.context||d.answers.filter(Boolean).join('\n'),sourceJournalId:d.sourceJournalId,dailyKey:d.dailyKey,level:d.level});
  }
  else if(action==='word-detail')openWord(el.dataset.id);
  else if(action==='practice-word')setupChallenge(el.dataset.id);
  else if(action==='review')setupChallenge(el.dataset.id,{review:true});
  else if(action==='random-topic'){capture();const d=data.drafts.challenge;const prompts=PROMPTS.filter(p=>p!==d.prompt);d.prompt=prompts[Math.floor(Math.random()*prompts.length)];d.goal=GOALS[Math.floor(Math.random()*GOALS.length)];persist();render(false);}
  else if(action==='resume-challenge'){screen='challenge';render();}
  else if(action==='zoom-in'||action==='zoom-out'||action==='zoom-reset'){
    zoom=action==='zoom-reset'?1:Math.max(1,Math.min(1.6,Math.round((zoom+(action==='zoom-in'?.2:-.2))*10)/10));
    render(false);main.querySelector(`[data-action="${action}"]`)?.focus();
  }
  else if(action==='export')exportData();
  else if(action==='delete-all')confirmAction('tellu.の記録をすべて削除しますか？','言葉・日記・表現・下書き・復習予定と、以前の会話練習の記録を削除します。元には戻せません。必要なら、先にJSONを書き出してください。','すべて削除する',()=>{
    clearTimeout(timer);
    try{localStorage.removeItem(STORAGE_KEY);localStorage.removeItem(LEGACY_KEY);}catch(error){toast('削除できませんでした。ブラウザのサイトデータ設定を確認してください。');return;}
    data=freshData();storageHealthy=true;selectedWordId=null;document.querySelector('#storage-warning').hidden=true;screen='privacy';render();toast('tellu.の保存データを削除しました。');
  });
});
main.addEventListener('input',event=>{
  const el=event.target;
  if(el.dataset.draft){
    capture();
    if(el.dataset.draft==='challenge'&&el.name==='response'){
      data.drafts.challenge.reflection='';main.querySelectorAll('[name="reflection"]').forEach(input=>input.checked=false);updateLiveCount();
    }
    const count=document.querySelector('#journal-count');if(count)count.textContent=`${chars(data.drafts.journal.content)}文字`;
  }
  if(el.id==='discover-answer'&&data.drafts.discover)data.drafts.discover.answers[data.drafts.discover.step]=el.value;
  clearTimeout(timer);timer=setTimeout(persist,200);
});
main.addEventListener('change',event=>{
  const el=event.target;
  if(el.id==='atlas-filter'){atlasFilter=el.value;render(false);document.querySelector('#atlas-filter').focus();}
  else if(el.name==='level'&&el.dataset.draft){
    capture();persist();
    const currentAnswer=document.querySelector('#discover-answer');if(currentAnswer)data.drafts.discover.answers[data.drafts.discover.step]=currentAnswer.value;
    render(false);main.querySelector(`[name="level"][value="${el.value}"]`)?.focus();
  }else{capture();persist();}
});
main.addEventListener('submit',event=>{
  event.preventDefault();const form=event.target;if(!form.reportValidity())return;capture();
  if(form.id==='journal-form')saveJournal();
  else if(form.id==='discover-form'){
    const d=data.drafts.discover,value=main.querySelector('#discover-answer').value.trim();
    if(!value){toast('思いつくことを、ひとこと書いてみよう。');return;}
    d.answers[d.step]=value;d.step++;persist();render();
  }
  else if(form.id==='custom-word-form'){
    const d=data.drafts.discover,word=normalizeWord(d.customWord);
    if(!word){toast('使ってみたい言葉を入力してください。');return;}
    const known=WORDS.find(w=>w.word===word);collectWord(known||{word,category:d.customCategory,meaning:d.customMeaning.trim()});
  }
  else if(form.id==='challenge-setup'){
    const d=data.drafts.challenge;d.started=true;d.phase=0;
    if(d.challengeType==='words'&&!segmenter){d.challengeType='characters';}
    d.limits=d.mode==='expand'?(d.challengeType==='words'?[5,10,20]:[20,40,80]):d.mode==='compress'?(d.challengeType==='words'?[25,12,6]:[100,50,25]):[d.challengeType==='words'?[5,10,15,25][Math.floor(Math.random()*4)]:[20,40,60,100][Math.floor(Math.random()*4)]];
    const word=data.words.find(w=>w.id===d.targetWordId);
    const minimum=countExpression(word.word,d.challengeType)+2;
    d.limits=d.limits.map(limit=>Math.max(limit,minimum));
    persist();render();
  }
  else if(form.id==='expression-form')completeExpression();
});
main.addEventListener('keydown',event=>{
  const marker=event.target.closest('.map-word');if(marker&&(event.key==='Enter'||event.key===' ')){event.preventDefault();openWord(marker.dataset.id);}
});
document.querySelector('#confirmation').addEventListener('close',event=>{const callback=confirmCallback;confirmCallback=null;if(event.target.returnValue==='confirm'&&callback)callback();});
window.addEventListener('pagehide',()=>{capture();clearTimeout(timer);persist();});
document.addEventListener('visibilitychange',()=>{if(document.hidden){capture();persist();}else if(screen==='home')render(false);});
document.querySelectorAll('[data-icon]').forEach(el=>el.innerHTML=icon(el.dataset.icon));
render(false);
