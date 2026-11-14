const studioParams = new URLSearchParams(location.search);
const STUDIO_SECTIONS = [['all', '전체 화면'], ['onboarding', '가입·온보딩'], ['home', '홈'], ['workout', '성장 · 운동'], ['meal', '성장 · 식사'], ['sleep', '성장 · 수면'], ['report', '리포트'], ['my', '내 정보']];
let studioMode = studioParams.get('view') === 'play' || (!studioParams.has('view') && studioParams.has('tab') && !studioParams.has('flow')) ? 'play' : 'gallery';
let studioSection = STUDIO_SECTIONS.some(([key]) => key === studioParams.get('section')) || studioParams.get('section') === 'archive' ? studioParams.get('section') : studioParams.has('flow') ? ({ onboarding: 'onboarding', report: 'report', workout: 'workout', sleep: 'sleep' }[studioParams.get('flow')] ?? 'all') : 'all';
let studioHasLive = false, studioLiveDirty = false, studioInitialized = false;
let studioGalleryKey = '', studioSelected = '', studioZoomId = '', studioTools = false;
let studioGalleryScroll = 0, studioRowScroll = {}, studioInitial;
let studioGalleryNode, studioPreviewNode, studioPreviewAnchor;
let studioPhotoPaused = false;
const studioClone = value => JSON.parse(JSON.stringify(value));
const studioExpanded = new Set();

function studioEntry(section, stage, title, branch = false, extra = {}) { return { id: `${section}-${stage}`, section, stage, title, branch, ...extra }; }
function studioCatalog() {
  const onboardingEntries = obFlowStages().map(([stage, title]) => studioEntry('onboarding', stage, title, ['login', 'age-blocked', 'exit-confirm', 'home-error'].includes(stage) || stage.startsWith('guardian-') || stage.startsWith('parent-')));
  onboardingEntries.splice(2, 0, studioEntry('onboarding', 'reset-password', '비밀번호 재설정', true));
  onboardingEntries.splice(onboardingEntries.findIndex(entry => entry.stage === 'terms') + 1, 0, studioEntry('onboarding', 'terms-service', '이용약관 열람', true), studioEntry('onboarding', 'terms-privacy', '정보 수집·이용 안내', true));
  if (onboardingMode === 'release') {
    onboardingEntries.splice(onboardingEntries.findIndex(entry => entry.stage === 'guardian-approved'), 0, studioEntry('onboarding', 'guardian-rejected', '아이 · 보호자 거절', true), studioEntry('onboarding', 'guardian-expired', '아이 · 요청 만료', true));
  }
  return [
    { id: 'onboarding', title: '가입·온보딩', entries: onboardingEntries },
    { id: 'home', title: '홈', entries: [['overview', '예상 키와 성장 흐름'], ['question', '성장 변화 질문'], ['share', '공유 미리보기'], ['question-consent', '질문 응답 동의', true], ['prediction', '예측 안내', true], ['pending', '가입 후 분석 대기', true], ['error', '분석 실패·재시도', true]].map(args => studioEntry('home', ...args)) },
    { id: 'workout', title: '성장 · 운동', entries: ROUTINE_FLOW_STAGES.map(([stage, title]) => studioEntry('workout', stage, title, ['partial', 'exit'].includes(stage))) },
    { id: 'meal', title: '성장 · 식사', entries: [['overview', '식사와 영양 기록'], ['manual', '직접 입력'], ['camera', '카메라 촬영'], ['captured', '사진 확인'], ['analyzing', '음식 인식 대기'], ['review', '음식 후보·중량 확인'], ['calculated', '영양 합계 확인'], ['saved', '저장한 식사'], ['edit', '식사 수정', true], ['error', '음식 인식 실패', true]].map(args => studioEntry('meal', ...args)) },
    { id: 'sleep', title: '성장 · 수면', entries: SLEEP_FLOW_STAGES.map(([stage, title]) => studioEntry('sleep', stage, title, ['discard', 'delete', 'deleted', 'invalid'].includes(stage))) },
    { id: 'report', title: '리포트', entries: REPORT_STAGES.map(([stage, title]) => studioEntry('report', stage, title, ['weekly-error', 'empty'].includes(stage))) },
    { id: 'my', title: '내 정보', entries: [['overview', '내 정보'], ['profile', '프로필 편집'], ['history', '신체 기록'], ['measurement', '측정 기록 추가'], ['measurement-edit', '측정 기록 수정'], ['notifications', '알림'], ['appearance', '화면 모드'], ['account', '로그인 정보'], ['terms', '이용약관', true], ['privacy', '개인정보 처리방침', true], ['version', '버전 정보', true], ['logout', '로그아웃 확인', true], ['withdraw', '회원 탈퇴 확인', true]].map(args => studioEntry('my', ...args)) },
  ];
}
function studioArchive() {
  return [{ id: 'archive', title: '이전 시안', entries: [studioEntry('archive', 'home-halo', '홈 · 은은한 후광'), studioEntry('archive', 'home-halo-tuned', '홈 · 후광과 테두리'), studioEntry('archive', 'growth-b', '성장 · 한눈에 보는 기록'), studioEntry('archive', 'growth-c', '성장 · 숫자에 집중'), studioEntry('archive', 'report-classic', '리포트 · 기존 카드')] }];
}
function studioFind(id) { return [...studioCatalog(), ...studioArchive()].flatMap(group => group.entries).find(entry => entry.id === id); }
function studioCurrentSection() { return state.tab === 'growth' ? state.segment : state.tab === 'guardian' ? 'onboarding' : state.tab; }
function studioMyDialog(topic) {
  const editing = topic === 'measurement-edit';
  const saved = editing ? latestMeasurement() : null;
  if (editing) topic = 'measurement';
  const draft = topic === 'profile' ? { nickname: myProfile.nickname, birthday: myProfile.birthday, gender: myProfile.gender, fatherHeight: String(myProfile.fatherHeight), motherHeight: String(myProfile.motherHeight), goalHeight: String(myProfile.goalHeight) } : topic === 'measurement' ? { date: saved?.date ?? PROFILE_TODAY, height: String(saved?.height ?? latestMeasurement().height), weight: String(saved?.weight ?? latestMeasurement().weight), shoe: String(saved?.shoe ?? latestMeasurement().shoe ?? 260) } : null;
  return { kind: 'my', topic, context: 'single', recordId: saved?.id ?? null, returnTopic: editing ? 'history' : null, draft, original: draft ? { ...draft } : null, confirmDiscard: false };
}
function studioPhotoSample(stage) {
  const flow = { stage: stage === 'calculated' ? 'review' : stage, image: null, source: 'sample', requesting: false, cameraError: '', foods: JSON.parse(JSON.stringify(PHOTO_FOODS)), meal: { slot: '점심', time: '12:30' }, calculation: { status: 'incomplete', totals: null }, revision: 0 };
  flow.foods.forEach(food => { food.selected = food.candidates[0]?.code ?? ''; });
  return flow;
}

// Gallery snapshots borrow renderers synchronously, then restore every borrowed value.
function studioSandbox(callback) {
  const saved = { state: { ...state }, records, onboarding, homePrediction, homeGaugeStyle, homeGaugeCompare, reportState, reportDesign, routinePlayer, routineResults, sleepEditor, photoFlow, cameraStream, pubertyCard, mySession };
  try { return callback(); }
  finally {
    Object.assign(state, saved.state);
    ({ records, onboarding, homePrediction, homeGaugeStyle, homeGaugeCompare, reportState, reportDesign, routinePlayer, routineResults, sleepEditor, photoFlow, cameraStream, pubertyCard, mySession } = saved);
  }
}
function studioApply(entry) {
  const { section, stage } = entry;
  state.dialog = null; state.compare = false;
  if (section === 'onboarding') {
    state.tab = 'onboarding';
    if (['welcome', 'login'].includes(stage)) { onboarding = emptyOnboarding(); onboarding.screen = stage; }
    else if (stage.startsWith('terms-')) { onboarding = obSample('terms'); onboarding.document = stage.slice(6); }
    else if (stage.startsWith('parent-')) { onboarding = guardianWebSample(stage.slice(7)); state.tab = 'guardian'; }
    else if (['guardian-rejected', 'guardian-expired'].includes(stage)) { onboarding = obSample('guardian-wait', true); onboarding.guardian.status = stage.slice(9); }
    else if (stage.startsWith('home-')) { state.tab = 'home'; homePrediction = predictionSample(stage.slice(5)); }
    else onboarding = obSample(stage, stage.startsWith('guardian-'));
  } else if (section === 'home') {
    state.tab = 'home'; homeGaugeStyle = 'original'; homeGaugeCompare = false; homePrediction = { status: 'sample', step: 7, result: null, requests: 0 };
    if (['pending', 'error'].includes(stage)) homePrediction = predictionSample(stage);
    if (['share', 'prediction'].includes(stage)) state.dialog = { kind: 'home', topic: stage, context: 'single' };
    if (stage.startsWith('question')) { mySession = 'signed-in'; pubertyCard = { ...pubertyCard, visible: true, onHome: true, answering: false, index: 0, answers: [] }; if (stage === 'question-consent') state.dialog = { kind: 'question', context: 'single', stage: 'consent' }; }
  } else if (section === 'workout') {
    state.tab = 'growth'; state.segment = 'workout'; state.day = 4;
    if (stage !== 'dashboard') { const sample = routineFlowSample(stage); routinePlayer = sample.player; routineResults = sample.results; state.dialog = { kind: 'routine', context: 'single', recordId: null }; }
  } else if (section === 'sleep') {
    state.tab = 'growth'; state.segment = 'sleep'; state.day = 4;
    const sample = sleepFlowSample(stage); records = sample.week; sleepEditor = sample.editor;
    if (!['empty', 'saved', 'deleted'].includes(stage)) state.dialog = { kind: 'sleep', recordId: sleepEditor.recordId, context: 'single' };
  } else if (section === 'meal') {
    state.tab = 'growth'; state.segment = 'meal'; state.day = 4;
    if (['manual', 'edit'].includes(stage)) {
      if (stage === 'edit' && !records[state.day].meal.length) { const week = seedData('complete'); records = records.map((day, index) => index === state.day ? { ...day, meal: week[index].meal } : day); }
      state.dialog = { kind: 'meal', recordId: stage === 'edit' ? records[state.day].meal[0].id : null, context: 'single' };
    } else if (stage === 'saved') { const week = seedData('complete'); records = records.map((day, index) => index === state.day ? { ...day, meal: week[index].meal } : day); }
    else if (stage !== 'overview') { photoFlow = studioPhotoSample(stage); if (stage === 'calculated') photoFlow.calculation = { status: 'ready', totals: photoTotals() }; state.dialog = { kind: 'photo', context: 'single', recordId: null }; }
  } else if (section === 'report') {
    state.tab = 'report'; reportDesign = 'focus'; reportState = { scenario: ['empty', 'recorded'].includes(stage) ? stage : 'sample', weekly: 'idle' };
    if (stage === 'metric' || stage === 'timing') state.dialog = { kind: 'report', topic: stage === 'metric' ? 'growth' : 'timing', context: 'single' };
    if (stage.startsWith('weekly-')) { reportState.weekly = stage.slice(7) === 'error' ? 'error' : stage.slice(7) === 'loading' ? 'loading' : 'ready'; state.dialog = { kind: 'report', topic: 'weekly', context: 'single' }; }
  } else if (section === 'my') {
    state.tab = 'my'; mySession = 'signed-in';
    if (stage !== 'overview') state.dialog = studioMyDialog(stage);
  } else if (section === 'archive') {
    if (stage.startsWith('home-')) { state.tab = 'home'; homeGaugeStyle = stage.slice(5); homeGaugeCompare = false; }
    if (stage.startsWith('growth-')) { state.tab = 'growth'; state.segment = 'meal'; state.preset = stage.slice(7); state.config = { ...PRESETS[state.preset].config }; }
    if (stage === 'report-classic') { state.tab = 'report'; reportDesign = 'classic'; }
  }
}
function studioScopeIds(html, prefix) {
  const ids = [...html.matchAll(/ id="([^"]+)"/g)].map(match => match[1]);
  for (const id of new Set(ids)) { const replacement = `${prefix}-${id}`; html = html.replaceAll(`id="${id}"`, `id="${replacement}"`).replaceAll(`form="${id}"`, `form="${replacement}"`).replaceAll(`for="${id}"`, `for="${replacement}"`).replaceAll(`aria-labelledby="${id}"`, `aria-labelledby="${replacement}"`).replaceAll(`aria-describedby="${id}"`, `aria-describedby="${replacement}"`).replaceAll(`url(#${id})`, `url(#${replacement})`); }
  return html.replaceAll('data-theme="light"', '').replaceAll('data-theme="dark"', '').replace(/class="phone /g, `data-theme="${myPreferences.theme}" class="phone `);
}
function studioSnapshot(entry, prefix) {
  return studioSandbox(() => {
    cameraStream = null;
    studioApply(entry);
    let html;
    if (state.tab === 'guardian') html = renderGuardianPhone('single', onboarding, onboarding.guardian.requestId);
    else if (state.tab === 'onboarding') html = renderOnboardingPhone();
    else if (state.tab === 'home') html = renderHomePhone();
    else if (state.tab === 'report') html = renderReportPhone();
    else if (state.tab === 'my') html = renderMyPhone();
    else html = renderPhone(state.config, 'single');
    return studioScopeIds(html, prefix);
  });
}
function studioRememberGallery() {
  if (studioMode !== 'gallery') return;
  studioGalleryScroll = window.scrollY || (document.scrollingElement ?? document.documentElement).scrollTop;
  document.querySelectorAll('[data-studio-row]').forEach(row => { studioRowScroll[row.dataset.studioRow] = row.scrollLeft; });
}
function studioRestoreGallery() {
  document.querySelectorAll('[data-studio-row]').forEach(row => { row.scrollLeft = studioRowScroll[row.dataset.studioRow] ?? 0; });
  (document.scrollingElement ?? document.documentElement).scrollTop = studioGalleryScroll;
}
function studioGalleryHTML() {
  const groups = studioSection === 'archive' ? studioArchive() : studioCatalog().filter(group => studioSection === 'all' || group.id === studioSection);
  const count = groups.reduce((sum, group) => sum + group.entries.length, 0);
  return `<div class="studio-gallery-intro"><div><p>${studioSection === 'archive' ? 'ARCHIVE' : 'SCREEN GALLERY'}</p><h1>${studioSection === 'all' ? '앱의 흐름을 한눈에.' : groups[0]?.title ?? '화면 전시'}</h1><span>작은 화면을 선택하면 크게 볼 수 있어요.</span></div><span class="studio-total">${groups.length}개 기능 · ${count}개 화면</span></div>${studioSection === 'archive' ? '<div class="studio-palette-archive"><div><strong>기존 Earth-Tone 컬러</strong><p>배경 #12100C · 카드 #1E1A15 · 강조 #809671</p></div><div aria-label="기존 컬러"><i style="background:#12100c"></i><i style="background:#1e1a15"></i><i style="background:#809671"></i><i style="background:#adbd94"></i></div><a href="./color-sets/original-earth/colors.json" target="_blank" rel="noopener">원본 컬러 보기 ↗</a></div>' : ''}${groups.map(group => {
    const branches = group.entries.filter(entry => entry.branch).length, expanded = studioExpanded.has(group.id);
    const entries = group.entries.filter(entry => !entry.branch || expanded);
    return `<section class="studio-feature-row" id="studio-feature-${group.id}"><header><div><h2>${group.title}</h2><span>기본 ${group.entries.length - branches}${branches ? ` · 분기 ${branches}` : ''}</span></div>${branches ? `<button data-studio-expand="${group.id}" aria-expanded="${expanded}">${expanded ? '분기 접기' : `분기 ${branches}개 펼치기`} ${icon('plus', 13)}</button>` : ''}</header><div class="studio-screen-row" data-studio-row="${group.id}">${entries.map(entry => `<article class="studio-screen-card ${entry.id === studioSelected ? 'selected' : ''}" id="studio-card-${entry.id}"><div class="studio-thumb" role="button" tabindex="0" data-studio-zoom="${entry.id}" aria-label="${entry.title} 크게 보기"><div class="studio-thumb-viewport"><div class="studio-thumb-scale" inert>${studioSnapshot(entry, `thumb-${entry.id}`)}</div></div><span class="studio-thumb-magnify">${icon('plus', 15)}</span></div><div class="studio-card-heading"><span>${String(group.entries.indexOf(entry) + 1).padStart(2, '0')}</span><h3>${entry.title}</h3>${entry.branch ? '<i>분기</i>' : ''}</div><button class="studio-card-play" data-studio-start="${entry.id}">여기서 체험 ${icon('play', 11)}</button></article>`).join('')}</div></section>`;
  }).join('')}`;
}

function initStudio() {
  if (studioInitialized) return;
  studioInitialized = true;
  studioInitial = { records: studioClone(records), profile: { ...myProfile }, measurements: studioClone(bodyMeasurements) };
  document.title = '키컸으면 · 프로토타입';
  const shell = document.createElement('div'); shell.id = 'prototype-studio';
  shell.innerHTML = `<header class="prototype-header"><button class="prototype-brand" data-studio-section="all">키컸으면 <small>프로토타입</small></button><div class="studio-view-switch" role="group" aria-label="보기 방식"><button data-studio-view="gallery">${icon('grid', 15)}화면 전시</button><button data-studio-view="play">${icon('play', 13)}직접 체험</button></div><div class="studio-version-switch" role="group" aria-label="온보딩 버전"><button data-studio-version="demo">시연용</button><button data-studio-version="release">출시용</button></div></header><div class="prototype-layout"><aside class="prototype-nav" id="studio-nav"></aside><main class="prototype-main"><section id="studio-gallery"></section><div class="studio-play-toolbar" id="studio-play-toolbar"></div><div id="studio-live"></div></main></div><div id="studio-zoom"></div><aside class="studio-tools" id="studio-tools" aria-label="체험 설정" hidden></aside>`;
  document.body.prepend(shell);
  document.querySelector('#studio-live').append(document.querySelector('#workbench'));
  studioGalleryNode = document.querySelector('#studio-gallery');
  studioPreviewNode = document.querySelector('#preview');
  studioPreviewAnchor = document.createComment('live phone mount');
  studioPreviewNode.before(studioPreviewAnchor);
  if (studioMode === 'play' && !studioParams.has('tab')) studioApply(studioCatalog().find(group => group.id === studioSection)?.entries[0] ?? studioCatalog()[0].entries[0]);
  renderControls();
  // The selected current designs are the default; comparison variants live in Archive.
  if (!studioParams.has('preset')) { state.preset = 'a'; state.config = { ...PRESETS.a.config }; }
  state.compare = false; homeGaugeCompare = false;
  routineFlowView = false; sleepFlowView = false; onboardingFlowView = false; reportFlowView = false;
}
function studioRenderFrame() {
  studioMountView();
  document.body.classList.add('studio-unified');
  document.body.classList.toggle('studio-gallery-mode', studioMode === 'gallery');
  document.body.classList.toggle('studio-play-mode', studioMode === 'play');
  document.querySelectorAll('[data-studio-view]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studioView === studioMode)));
  document.querySelectorAll('[data-studio-version]').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.studioVersion === onboardingMode)));
  const active = studioMode === 'gallery' ? studioSection : studioCurrentSection();
  document.querySelector('#studio-nav').innerHTML = `<p>화면 둘러보기</p><nav aria-label="기능 선택">${STUDIO_SECTIONS.map(([key, label]) => `<button data-studio-section="${key}" ${active === key ? 'aria-current="page"' : ''}><span>${label}</span>${key === 'all' ? icon('grid', 14) : ''}</button>`).join('')}<button class="studio-mobile-menu" data-studio-tools>체험 설정</button><button class="studio-mobile-menu" data-studio-section="archive">이전 시안</button></nav><div class="studio-nav-bottom"><button data-studio-tools>${icon('settings', 15)}체험 설정</button><button data-studio-section="archive" ${active === 'archive' ? 'aria-current="page"' : ''}>${icon('timer', 15)}이전 시안</button><p>${onboardingMode === 'demo' ? '14세 미만 가입 제한' : '14세 미만 보호자 동의'}<br>인증·분석·기록은 시연용입니다.</p></div>`;
  if (studioMode === 'gallery') {
    const key = [studioSection, onboardingMode, myPreferences.theme, [...studioExpanded].join(',')].join('|');
    if (studioGalleryKey !== key) { document.querySelector('#studio-gallery').innerHTML = studioGalleryHTML(); studioGalleryKey = key; studioRestoreGallery(); }
  }
  document.querySelector('#studio-play-toolbar').innerHTML = `<div><button data-studio-back>${icon('back', 16)}화면 전시로 돌아가기</button><span>${STUDIO_SECTIONS.find(([key]) => key === studioCurrentSection())?.[1] ?? '직접 체험'}</span></div><div>${state.tab === 'guardian' ? '<button data-guardian-child>아이 화면으로 돌아가기 ↗</button>' : state.tab === 'onboarding' && onboarding.screen === 'guardian-wait' ? '<button data-ob-parent>보호자 화면으로 ↗</button>' : ''}<button data-studio-restart>${icon('timer', 14)}처음부터</button><button data-studio-tools>${icon('settings', 15)}체험 설정</button></div>`;
  if (studioTools) studioRenderTools();
}
function studioMountView() {
  if (studioMode === 'play') {
    studioGalleryNode.remove();
    if (!studioPreviewNode.isConnected) studioPreviewAnchor.after(studioPreviewNode);
    studioPreviewNode.querySelectorAll('.phone').forEach(phone => { phone.dataset.theme = myPreferences.theme; });
  } else {
    studioPreviewNode.remove();
    if (!studioGalleryNode.isConnected) document.querySelector('.prototype-main').prepend(studioGalleryNode);
  }
}
function studioRenderGate() {
  initStudio();
  if (studioMode === 'play') { studioMountView(); return false; }
  if (studioHasLive) studioLiveDirty = true;
  studioRenderFrame(); syncURL(); return true;
}
function studioAfterRender() { studioHasLive = true; studioLiveDirty = false; studioRenderFrame(); }
function studioWriteURL(next) {
  next.set('view', studioMode); next.set('section', studioSection);
  if (onboardingMode === 'release' || studioMode === 'gallery') next.set('mode', onboardingMode);
}
function studioPauseLive() {
  const running = routinePlayer?.status === 'running'; pauseRoutine();
  if (running) studioLiveDirty = true;
  if (timer.status === 'running') { timer.seconds = elapsedSeconds(); timer.status = 'paused'; }
  if (obPreviewTimer !== null) { clearTimeout(obPreviewTimer); obPreviewTimer = null; obPreviewRevision++; }
  if (state.dialog?.kind === 'photo') { clearTimeout(photoWait); clearTimeout(photoCalculationWait); if (photoFlow) { photoFlow.cameraRequest = (photoFlow.cameraRequest ?? 0) + 1; photoFlow.requesting = false; } studioPhotoPaused = true; }
  if (cameraStream) { stopPhotoCamera(); studioLiveDirty = true; }
}
function studioLiveEntry() {
  if (studioSelected.startsWith('archive-')) { const entry = studioFind(studioSelected); if ((state.tab === 'home' && entry?.stage === `home-${homeGaugeStyle}`) || (state.tab === 'growth' && state.segment === 'meal' && entry?.stage === `growth-${state.preset}`) || (state.tab === 'report' && reportDesign === 'classic' && entry?.stage === 'report-classic')) return entry; }
  let section = studioCurrentSection(), stage;
  if (state.tab === 'guardian') { section = 'onboarding'; stage = `parent-${onboarding.guardian.status === 'approved' ? 'done' : onboarding.guardian.page ?? 'intro'}`; }
  else if (section === 'onboarding') {
    stage = onboarding.screen;
    if (onboarding.document) stage = `terms-${onboarding.document}`;
    if (onboarding.exitConfirm) stage = 'exit-confirm';
    if (stage === 'guardian-wait' && ['rejected', 'expired'].includes(onboarding.guardian.status)) stage = `guardian-${onboarding.guardian.status}`;
  } else if (section === 'home') {
    stage = state.dialog?.kind === 'question' ? 'question-consent' : state.dialog?.topic ?? (homePrediction.status === 'pending' ? 'pending' : homePrediction.status === 'error' ? 'error' : pubertyCard.visible ? 'question' : 'overview');
    if (studioSelected.startsWith('onboarding-home-') && !state.dialog) { section = 'onboarding'; stage = `home-${homePrediction.status === 'pending' ? 'pending' : homePrediction.status === 'error' ? 'error' : 'ready'}`; }
  } else if (section === 'workout') stage = state.dialog?.kind !== 'routine' ? 'dashboard' : routinePlayer?.showExit ? 'exit' : routinePlayer?.screen === 'summary' ? 'summary' : ['detail', 'preview'].includes(routinePlayer?.screen) ? routinePlayer.screen : routinePlayer?.status === 'ready' ? 'paused' : routinePlayer?.status ?? 'dashboard';
  else if (section === 'meal') stage = state.dialog?.kind === 'photo' ? photoFlow?.stage === 'review' && photoFlow.calculation.status === 'ready' ? 'calculated' : photoFlow?.stage : state.dialog?.kind === 'meal' ? state.dialog.recordId ? 'edit' : 'manual' : 'overview';
  else if (section === 'sleep') stage = state.dialog?.kind === 'sleep' ? sleepEditor.confirm ?? (sleepEditor.recordId ? 'edit' : 'entry') : records[state.day].sleep.length ? 'saved' : 'empty';
  else if (section === 'report') stage = state.dialog?.kind === 'report' ? state.dialog.topic === 'weekly' ? `weekly-${reportState.weekly}` : state.dialog.topic === 'timing' ? 'timing' : 'metric' : reportState.scenario === 'sample' ? 'overview' : reportState.scenario;
  else if (section === 'my') stage = state.dialog?.kind === 'my' ? state.dialog.topic === 'measurement' && state.dialog.recordId ? 'measurement-edit' : state.dialog.topic : 'overview';
  return studioFind(`${section}-${stage}`);
}
function studioReveal(entry) {
  const card = document.querySelector(`#studio-card-${entry.id}`), row = card?.closest('[data-studio-row]');
  if (!row) return;
  row.scrollLeft = Math.max(0, card.getBoundingClientRect().left - row.getBoundingClientRect().left + row.scrollLeft - 34);
  const feature = card.closest('.studio-feature-row');
  const top = feature.getBoundingClientRect().top + (document.scrollingElement ?? document.documentElement).scrollTop - document.querySelector('.prototype-header').getBoundingClientRect().height - (innerWidth <= 650 ? document.querySelector('.prototype-nav').getBoundingClientRect().height : 0) - 20;
  (document.scrollingElement ?? document.documentElement).scrollTop = Math.max(0, top);
  studioRememberGallery();
}
function studioGallery() {
  const current = studioMode === 'play' ? studioLiveEntry() : null;
  const moved = current && current.id !== studioSelected;
  if (moved) { studioSelected = current.id; if (studioSection !== 'all') studioSection = current.section; if (current.branch) studioExpanded.add(current.section); }
  if (studioMode === 'play') studioPauseLive();
  studioMode = 'gallery'; studioGalleryKey = ''; studioRenderFrame(); syncURL(); studioRestoreGallery();
  if (studioSelected) document.querySelector(`#studio-card-${studioSelected}`)?.classList.add('selected');
  if (moved) studioReveal(current);
}
function studioResume() {
  studioRememberGallery(); studioMode = 'play'; studioCloseZoom(); studioTools = false; document.querySelector('#studio-tools').hidden = true;
  if (!studioHasLive) { const group = studioCatalog().find(group => group.id === studioSection); studioLaunch(group?.entries[0] ?? studioCatalog()[0].entries[0]); return; }
  if (studioLiveDirty) render();
  else { studioRenderFrame(); syncURL(); obMountPreview(); mountPhotoCamera(); }
  if (studioPhotoPaused && photoFlow && state.dialog?.kind === 'photo') { studioPhotoPaused = false; if (photoFlow.stage === 'analyzing') waitForPhoto('analyzing', 'review'); else if (photoFlow.stage === 'review' && photoFlow.calculation.status !== 'ready') schedulePhotoCalculation(); }
}
function studioLaunch(entry) {
  if (!entry) return;
  studioRememberGallery(); studioCloseZoom();
  studioSelected = entry.id; studioMode = 'play'; studioTools = false; document.querySelector('#studio-tools').hidden = true;
  disposePhoto(); studioPhotoPaused = false; stopReportAnalysis(); pauseRoutine();
  if (obPreviewTimer !== null) { clearTimeout(obPreviewTimer); obPreviewTimer = null; obPreviewRevision++; }
  routineFlowView = false; sleepFlowView = false; onboardingFlowView = false; reportFlowView = false; homeGaugeCompare = false;
  studioApply(entry);
  if (state.tab === 'guardian') guardianWebRequestId = onboarding.guardian.requestId;
  if (entry.section === 'home' && entry.stage.startsWith('question')) { pubertyExposureDay = pubertyDay(); pubertyCard.onHome = true; }
  if (state.tab === 'home' && homePrediction.status === 'pending') { mySession = 'signed-in'; startHomePrediction({ ...obSample('account').draft }); }
  if (state.tab === 'report' && reportState.weekly === 'loading') { startReportAnalysis(); return; }
  render(false);
  if (state.dialog?.kind === 'photo') { if (photoFlow.stage === 'analyzing') waitForPhoto('analyzing', 'review'); if (photoFlow.stage === 'review' && entry.stage !== 'calculated') schedulePhotoCalculation(); }
  document.querySelector('#preview .phone input, #preview .phone button')?.focus();
}
function studioRestart() {
  disposePhoto(); stopReportAnalysis(); pauseRoutine(); resetHomePredictionSample();
  records = studioClone(studioInitial.records); myProfile = { ...studioInitial.profile }; bodyMeasurements = studioClone(studioInitial.measurements);
  routineResults = {}; routinePlayer = null; sleepEditor = null;
  state.preset = 'a'; state.config = { ...PRESETS.a.config }; state.segment = 'meal'; state.day = 4; homeGaugeStyle = 'original'; reportDesign = 'focus';
  studioLaunch(studioCatalog()[0].entries[0]);
}
function studioOpenZoom(id) {
  const entry = studioFind(id); if (!entry) return;
  studioRememberGallery(); studioSelected = id; studioZoomId = id;
  document.querySelectorAll('.studio-screen-card').forEach(card => card.classList.toggle('selected', card.id === `studio-card-${id}`));
  document.querySelector('#studio-zoom').innerHTML = `<div class="studio-zoom-backdrop"><section class="studio-zoom-panel" role="dialog" aria-modal="true" aria-labelledby="studio-zoom-title"><header><div><small>${STUDIO_SECTIONS.find(([key]) => key === entry.section)?.[1] ?? '이전 시안'}</small><h2 id="studio-zoom-title">${entry.title}</h2></div><button data-studio-zoom-close aria-label="크게 보기 닫기">${icon('close', 23)}</button></header><div class="studio-zoom-phone">${studioSnapshot(entry, 'zoom')}</div><footer><button data-studio-zoom-step="-1" aria-label="이전 화면">${icon('back', 18)}</button><button class="studio-zoom-play" data-studio-start="${id}">여기서 체험 ${icon('play', 12)}</button><button data-studio-zoom-step="1" aria-label="다음 화면">${icon('back', 18)}</button></footer></section></div>`;
  document.querySelectorAll('.studio-zoom-phone button, .studio-zoom-phone input, .studio-zoom-phone select, .studio-zoom-phone textarea').forEach(control => { control.disabled = true; control.tabIndex = -1; });
  document.querySelector('.prototype-header').inert = true; document.querySelector('.prototype-layout').inert = true;
  document.body.classList.add('studio-zoom-open');
  document.querySelector('[data-studio-zoom-close]')?.focus();
}
function studioCloseZoom() {
  const id = studioZoomId; studioZoomId = '';
  document.querySelector('.prototype-header').inert = false; document.querySelector('.prototype-layout').inert = false;
  document.querySelector('#studio-zoom').innerHTML = ''; document.body.classList.remove('studio-zoom-open');
  if (id) document.querySelector(`[data-studio-zoom="${id}"]`)?.focus();
}
function studioStepZoom(step) {
  const group = [...studioCatalog(), ...studioArchive()].find(group => group.entries.some(entry => entry.id === studioZoomId));
  if (!group) return;
  const entries = group.entries.filter(entry => !entry.branch || studioExpanded.has(group.id));
  const index = entries.findIndex(entry => entry.id === studioZoomId);
  const next = entries[index + step]; if (next) studioOpenZoom(next.id);
}
function studioRenderTools() {
  const section = studioMode === 'play' ? studioCurrentSection() : studioSection;
  const choices = {
    onboarding: '<button data-ob-scenario="adult">14세 이상 · 처음부터</button><button data-ob-scenario="minor">14세 미만 · 처음부터</button><button data-ob-preview="gate">가입 전 잠금</button>',
    home: '<button data-prediction-preview="pending">분석 대기</button><button data-prediction-preview="ready">결과 표시</button><button data-prediction-preview="error">분석 실패</button><button data-question-preview="today">오늘 질문 보기</button>',
    workout: '<button data-routine-preview="running">운동 중</button><button data-routine-preview="finished">동작 완료</button><button data-routine-preview="partial">일부 완료</button>',
    meal: '<button data-photo-preview="camera">카메라 촬영</button><button data-photo-preview="calculated">음식·영양 확인</button><button data-photo-preview="error">인식 실패</button>',
    sleep: '<button data-sleep-preview="empty">기록 없음</button><button data-sleep-preview="edit">수정</button><button data-sleep-preview="delete">삭제 확인</button>',
    report: '<button data-report-preview="empty">기록 없음</button><button data-report-preview="recorded">기록이 쌓인 상태</button><button data-report-preview="weekly-error">분석 실패</button>',
    my: '<button data-my-open="profile">프로필 편집</button><button data-my-open="measurement">측정 기록 추가</button>',
  };
  const drawer = document.querySelector('#studio-tools'); drawer.hidden = false;
  drawer.innerHTML = `<header><h2>체험 설정</h2><button data-studio-tools-close aria-label="체험 설정 닫기">${icon('close', 21)}</button></header><p>이 설정은 화면 밖의 시연 도구입니다.</p><h3>화면 모드</h3><div class="studio-tool-buttons"><button data-studio-theme="dark" aria-pressed="${myPreferences.theme === 'dark'}">다크</button><button data-studio-theme="light" aria-pressed="${myPreferences.theme === 'light'}">라이트</button></div><h3>장면 바로 열기</h3><div class="studio-tool-buttons">${choices[section] ?? '<button data-ob-scenario="adult">14세 이상 가입</button><button data-ob-scenario="minor">14세 미만 가입</button><button data-report-preview="weekly-error">리포트 분석 실패</button>'}</div>${onboardingMode === 'release' ? '<h3>보호자 관점</h3><button class="studio-tool-parent" data-ob-parent>문자 링크의 보호자 웹 열기 ↗</button>' : ''}<p class="studio-tool-note">예시 장면을 선택하면 해당 화면에서 새로 체험합니다. 일반 전시·체험 전환은 입력 중인 내용을 유지합니다. 실제 인증·AI API와 연결하지 않습니다.</p>`;
}

document.addEventListener('click', event => {
  const thumb = event.target.closest?.('[data-studio-zoom]');
  if (thumb) { studioOpenZoom(thumb.dataset.studioZoom); return; }
  const button = event.target.closest('button'); if (!button) return;
  if (button.dataset.studioView) { if (button.dataset.studioView === studioMode) return; if (button.dataset.studioView === 'play') studioResume(); else studioGallery(); return; }
  if (button.hasAttribute('data-studio-back')) { studioGallery(); return; }
  if (button.dataset.studioSection) {
    studioRememberGallery(); studioSection = button.dataset.studioSection; studioGalleryScroll = 0;
    if (studioMode === 'play' && !['all', 'archive'].includes(studioSection)) studioLaunch(studioCatalog().find(group => group.id === studioSection)?.entries[0]);
    else { if (studioMode === 'play') studioPauseLive(); studioMode = 'gallery'; studioGalleryKey = ''; studioRenderFrame(); syncURL(); }
    return;
  }
  if (button.dataset.studioVersion) {
    const mode = button.dataset.studioVersion; if (mode === onboardingMode) return;
    if (obPreviewTimer !== null) { clearTimeout(obPreviewTimer); obPreviewTimer = null; obPreviewRevision++; }
    onboardingMode = mode; onboarding = emptyOnboarding(); guardianWebRequestId = null; studioGalleryKey = '';
    if (studioMode === 'gallery' && studioHasLive && ['onboarding', 'guardian'].includes(state.tab)) { state.tab = 'onboarding'; state.dialog = null; studioLiveDirty = true; }
    if (studioMode === 'play' && ['onboarding', 'guardian'].includes(state.tab)) { state.tab = 'onboarding'; state.dialog = null; render(false); }
    else { studioRenderFrame(); syncURL(); }
    return;
  }
  if (button.dataset.studioExpand) { studioRememberGallery(); const id = button.dataset.studioExpand; studioExpanded.has(id) ? studioExpanded.delete(id) : studioExpanded.add(id); studioGalleryKey = ''; studioRenderFrame(); return; }
  if (button.dataset.studioZoom) { studioOpenZoom(button.dataset.studioZoom); return; }
  if (button.hasAttribute('data-studio-zoom-close')) { studioCloseZoom(); return; }
  if (button.dataset.studioZoomStep) { studioStepZoom(Number(button.dataset.studioZoomStep)); return; }
  if (button.dataset.studioStart) { studioLaunch(studioFind(button.dataset.studioStart)); return; }
  if (button.hasAttribute('data-studio-restart')) { studioRestart(); return; }
  if (button.hasAttribute('data-studio-tools')) { studioTools = !studioTools; if (studioTools) { studioRenderTools(); document.querySelector('[data-studio-tools-close]')?.focus(); } else document.querySelector('#studio-tools').hidden = true; return; }
  if (button.hasAttribute('data-studio-tools-close')) { studioTools = false; document.querySelector('#studio-tools').hidden = true; return; }
  if (button.dataset.studioTheme) { myPreferences.theme = button.dataset.studioTheme; studioGalleryKey = ''; document.querySelectorAll('.phone').forEach(phone => { phone.dataset.theme = myPreferences.theme; }); studioRenderFrame(); syncURL(); }
});
document.addEventListener('click', event => {
  if (event.target.classList.contains('studio-zoom-backdrop')) { studioCloseZoom(); return; }
  const button = event.target.closest('#studio-tools button');
  if (!button || button.hasAttribute('data-studio-tools-close') || button.dataset.studioTheme) return;
  studioRememberGallery(); studioMode = 'play'; studioTools = false; document.querySelector('#studio-tools').hidden = true;
  routineFlowView = false; sleepFlowView = false; onboardingFlowView = false; reportFlowView = false;
  if (button.dataset.photoPreview) state.tab = 'growth';
}, true);
document.addEventListener('keydown', event => {
  const thumb = event.target.closest?.('[data-studio-zoom]');
  if (thumb && ['Enter', ' '].includes(event.key)) { event.preventDefault(); studioOpenZoom(thumb.dataset.studioZoom); }
  if (studioZoomId) {
    if (event.key === 'Escape') { event.preventDefault(); studioCloseZoom(); }
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); studioStepZoom(event.key === 'ArrowLeft' ? -1 : 1); }
    if (event.key === 'Tab') { const buttons = [...document.querySelectorAll('.studio-zoom-panel button')]; const first = buttons[0], last = buttons.at(-1); if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); } else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); } }
  } else if (studioTools && event.key === 'Escape') { event.preventDefault(); studioTools = false; document.querySelector('#studio-tools').hidden = true; }
  if (studioZoomId || studioMode !== 'play') event.stopImmediatePropagation();
}, true);
