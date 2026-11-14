const PROFILE_TODAY = serviceDay();
let myProfile = { nickname: '키크는중', birthday: '2010-11-13', gender: '남자', fatherHeight: 178, motherHeight: 165, goalHeight: 180, email: 'grow@example.test' };
let myPreferences = { reminders: false, reminderTime: '20:30', theme: new URLSearchParams(location.search).get('theme') === 'light' ? 'light' : 'dark' };
let mySession = 'signed-in';
let bodyMeasurements = [
  { id: 'body-3', date: '2026-11-13', height: 170, weight: 60, shoe: 260 },
  { id: 'body-2', date: '2026-10-13', height: 169.5, weight: 59.8, shoe: 260 },
  { id: 'body-1', date: '2026-09-13', height: 169.1, weight: 59.2, shoe: 255 },
];

function latestMeasurement() {
  return bodyMeasurements[0];
}

function myRow(topic, label, value = '', glyph = null) {
  return `<button class="my-setting-row" data-my-open="${topic}">${glyph ? `<span class="my-row-icon">${icon(glyph, 19)}</span>` : ''}<span class="my-row-label">${label}</span>${value ? `<span class="my-row-value">${escapeHTML(value)}</span>` : ''}<span class="my-row-chevron" aria-hidden="true">›</span></button>`;
}

function myMainContent() {
  const latest = latestMeasurement();
  const signedIn = mySession === 'signed-in';
  return `<header class="my-page-header"><h2>내 정보</h2></header>${signedIn ? `<button class="my-profile-card" data-my-open="profile"><span class="my-avatar">${icon('user', 29)}</span><span><strong>${escapeHTML(myProfile.nickname)}</strong><small>프로필 편집</small></span><span class="my-profile-chevron" aria-hidden="true">›</span></button><section class="my-section"><h3>기본 정보</h3><div class="my-setting-list">${myRow('profile', '생년월일', myProfile.birthday.replaceAll('-', '.'))}${myRow('profile', '성별', myProfile.gender)}${myRow('profile', '아버지 키', `${myProfile.fatherHeight} cm`)}${myRow('profile', '어머니 키', `${myProfile.motherHeight} cm`)}${myRow('profile', '목표 키', `${myProfile.goalHeight} cm`)}</div></section><section class="my-section"><div class="my-section-heading"><h3>신체 기록</h3><button data-my-open="history">기록 보기 ›</button></div><div class="my-body-card"><div class="my-body-metrics"><div><span>키</span><strong>${latest.height.toFixed(1)}<small>cm</small></strong></div><div><span>체중</span><strong>${latest.weight.toFixed(1)}<small>kg</small></strong></div></div><p>신발 ${latest.shoe ?? 0} mm · 최근 측정 ${latest.date.replaceAll('-', '.')}</p><button class="cta secondary" data-my-open="measurement">${icon('plus', 17)}측정 기록 추가</button></div></section>` : `<section class="my-signed-out"><span class="my-avatar">${icon('user', 29)}</span><h3>${mySession === 'withdrawn' ? '새롭게 시작해볼까요?' : '로그인하고 시작해요'}</h3><button class="cta" data-my-open="signin">로그인</button></section>`}<section class="my-section"><h3>앱 설정</h3><div class="my-setting-list">${myRow('notifications', '알림', myPreferences.reminders ? '켜짐' : '꺼짐', 'timer')}${myRow('appearance', '화면 모드', myPreferences.theme === 'dark' ? '다크' : '라이트', 'sun')}</div></section><section class="my-section"><h3>계정·안내</h3><div class="my-setting-list">${signedIn ? myRow('account', '로그인 정보', '이메일', 'user') : ''}${myRow('terms', '이용약관')}${myRow('privacy', '개인정보 처리방침')}${myRow('version', '버전 정보', '2026.11')}</div></section>${signedIn ? '<div class="my-account-actions"><button data-my-open="logout">로그아웃</button><button data-my-open="withdraw">회원 탈퇴</button></div>' : ''}`;
}

function renderMyPhone(context = 'single') {
  const modal = state.dialog?.context === context;
  const inert = modal ? 'inert' : '';
  return `<section class="device-wrap"><div class="device-caption"><strong>내 정보</strong><span>11.13 금요일</span></div><div class="phone my-phone" data-context="${context}"><div class="status-bar" ${inert}><span>9:41</span><span class="status-icons">${icon('signal', 13)}${icon('wifi', 14)}${icon('battery', 18)}</span></div><main class="phone-scroll my-scroll" ${inert}>${myMainContent()}</main><div ${inert}>${renderBottomNav('my')}</div><div class="home-indicator" ${inert}></div>${modal ? renderMyDialog(context) : ''}</div></section>`;
}

function openMyDialog(topic, context, recordId = null) {
  const saved = topic === 'measurement' && recordId ? bodyMeasurements.find(item => item.id === recordId) : null;
  const returnTopic = topic === 'measurement' && state.dialog?.kind === 'my' && state.dialog.topic === 'history' ? 'history' : null;
  const draft = topic === 'profile' ? { nickname: myProfile.nickname, birthday: myProfile.birthday, gender: myProfile.gender, fatherHeight: String(myProfile.fatherHeight), motherHeight: String(myProfile.motherHeight), goalHeight: String(myProfile.goalHeight) } : topic === 'measurement' ? { date: saved?.date ?? PROFILE_TODAY, height: String(saved?.height ?? latestMeasurement().height), weight: String(saved?.weight ?? latestMeasurement().weight), shoe: String(saved?.shoe ?? latestMeasurement().shoe ?? 260) } : null;
  state.dialog = { kind: 'my', topic, context, recordId, returnTopic, draft, original: draft ? { ...draft } : null, confirmDiscard: false };
  render();
  document.querySelector('.my-panel input, .my-panel button')?.focus();
}

function myHistoryContent() {
  return `<p class="my-detail-intro">측정한 키와 체중을 날짜별로 확인해요.</p><div class="my-history-list">${bodyMeasurements.map((item, index) => `<button data-my-measurement="${item.id}" class="my-history-row"><span><strong>${item.date.replaceAll('-', '.')}</strong>${index === 0 ? '<small>최근 기록</small>' : ''}</span><span>${item.height.toFixed(1)}<small>cm</small></span><span>${item.weight.toFixed(1)}<small>kg</small></span><span>${item.shoe ?? 0}<small>mm</small></span><span aria-hidden="true">›</span></button>`).join('')}</div>`;
}

function renderMyDialog(context) {
  const dialog = state.dialog, topic = dialog.topic;
  const titles = { profile: '프로필 편집', history: '신체 기록', measurement: dialog.recordId ? '측정 기록 수정' : '측정 기록 추가', notifications: '알림', appearance: '화면 모드', account: '로그인 정보', terms: '이용약관', privacy: '개인정보 처리방침', version: '버전 정보', logout: '로그아웃할까요?', withdraw: '회원 탈퇴' };
  let body = '', footer = '', fullscreen = ['profile', 'history', 'measurement'].includes(topic);
  if (dialog.confirmDiscard) {
    fullscreen = false;
    body = '<p class="my-detail-intro">입력한 변경 사항은 저장되지 않아요.</p>';
    footer = '<button class="cta secondary" data-action="my-keep">계속 입력</button><button class="cta" data-action="my-discard">변경 취소</button>';
  } else if (topic === 'profile') {
    const draft = dialog.draft;
    body = `<form id="my-form-${context}" data-my-form="profile"><div class="my-editor-avatar"><span class="my-avatar">${icon('user', 32)}</span></div>${field('닉네임', 'nickname', draft.nickname, 'type="text" required maxlength="20" autocomplete="off"')}${field('생년월일', 'birthday', draft.birthday, `type="date" required max="${PROFILE_TODAY}"`)}<label class="field"><span>성별</span><select name="gender">${['남자', '여자', '선택 안 함'].map(label => `<option ${draft.gender === label ? 'selected' : ''}>${label}</option>`).join('')}</select></label>${field('아버지 키 · cm', 'fatherHeight', draft.fatherHeight, 'type="number" min="1" max="300" step="0.1" required')}${field('어머니 키 · cm', 'motherHeight', draft.motherHeight, 'type="number" min="1" max="300" step="0.1" required')}${field('목표 키 · cm', 'goalHeight', draft.goalHeight, 'type="number" min="1" max="300" step="0.1" required')}<p class="form-error" role="alert" data-my-error></p></form>`;
    footer = `<button class="cta" type="submit" form="my-form-${context}">저장</button>`;
  } else if (topic === 'history') {
    body = myHistoryContent();
    footer = '<button class="cta" data-my-open="measurement">측정 기록 추가</button>';
  } else if (topic === 'measurement') {
    const draft = dialog.draft;
    body = `<form id="my-form-${context}" data-my-form="measurement"><p class="my-detail-intro">측정한 날짜와 키·체중을 남겨주세요.</p>${field('측정 날짜', 'date', draft.date, `type="date" required max="${PROFILE_TODAY}"`)}<div class="field-row">${field('키 · cm', 'height', draft.height, 'type="number" inputmode="decimal" min="1" max="300" step="0.1" required')}${field('체중 · kg', 'weight', draft.weight, 'type="number" inputmode="decimal" min="1" max="500" step="0.1" required')}</div>${field('신발 사이즈 · mm', 'shoe', draft.shoe, 'type="number" min="100" max="400" step="1" required')}<p class="form-error" role="alert" data-my-error></p></form>`;
    footer = `<button class="cta" type="submit" form="my-form-${context}">저장</button>`;
  } else if (topic === 'notifications') {
    body = `<div class="my-notification-setting"><span><strong>기록 알림</strong><small>매일 기록할 시간을 정해요.</small></span><button class="my-switch" role="switch" aria-checked="${myPreferences.reminders}" aria-label="기록 알림" data-action="my-reminders"><span></span></button></div>${myPreferences.reminders ? field('알림 시각', 'reminderTime', myPreferences.reminderTime, 'type="time" data-my-reminder-time required') : ''}`;
  } else if (topic === 'appearance') {
    body = `<div class="my-theme-options">${[['light', '라이트'], ['dark', '다크']].map(([key, label]) => `<button data-my-theme="${key}" aria-pressed="${myPreferences.theme === key}"><span class="my-theme-swatch ${key}"><i></i><i></i></span><strong>${label}</strong><span>${myPreferences.theme === key ? '선택됨' : '선택'}</span></button>`).join('')}</div>`;
  } else if (topic === 'account') {
    body = `<div class="my-detail-values"><p><span>로그인 방식</span><strong>이메일</strong></p><p><span>이메일</span><strong>${escapeHTML(myProfile.email)}</strong></p></div>`;
  } else if (['terms', 'privacy'].includes(topic)) {
    body = `<div class="my-document-empty">${icon('report', 28)}<h4>${topic === 'terms' ? '이용약관' : '개인정보 처리방침'} 문서 준비 중</h4><p>정식 문서가 준비되면 여기에서 확인할 수 있어요.</p></div>`;
  } else if (topic === 'version') {
    body = '<div class="my-version-mark">↟</div><h4 class="my-version-name">키컸으면</h4><p class="my-version-caption">디자인 프로토타입 · 2026.11</p>';
  } else if (topic === 'logout') {
    body = '<p class="my-detail-intro">다시 로그인해 이용할 수 있어요.</p>';
    footer = '<button class="cta secondary" data-action="close">취소</button><button class="cta" data-action="my-logout">로그아웃</button>';
  } else if (topic === 'withdraw') {
    body = '<p class="my-detail-intro">정말 회원 탈퇴를 진행하시겠어요?</p>';
    footer = '<button class="cta secondary" data-action="close">취소</button><button class="cta my-withdraw-confirm" data-action="my-withdraw">탈퇴하기</button>';

  }
  if (!footer) footer = '<button class="cta" data-action="close">확인</button>';
  const title = dialog.confirmDiscard ? '변경을 취소할까요?' : titles[topic];
  return `<div class="phone-overlay"><section class="entry-panel my-panel ${fullscreen ? 'fullscreen' : ''}" role="dialog" aria-modal="true" aria-labelledby="my-title-${context}"><div class="sheet-handle" aria-hidden="true"></div><header class="entry-heading"><h3 id="my-title-${context}">${title}</h3><button class="icon-button" data-action="close" aria-label="${fullscreen ? '뒤로가기' : '닫기'}">${icon(fullscreen ? 'back' : 'close', 23)}</button></header><div class="entry-body">${body}</div><footer class="entry-actions">${footer}</footer></section></div>`;
}

function finishMyDialog() {
  const dialog = state.dialog;
  if (dialog?.returnTopic) openMyDialog(dialog.returnTopic, dialog.context);
  else closeDialog(true);
}

function requestMyClose() {
  const dialog = state.dialog;
  if (dialog.confirmDiscard) dialog.confirmDiscard = false;
  else if (dialog.draft && Object.keys(dialog.draft).some(key => dialog.draft[key] !== dialog.original[key])) dialog.confirmDiscard = true;
  else return false;
  render();
  document.querySelector('[data-action="my-keep"], .my-panel input')?.focus();
  return true;
}

function renderMyControls() {
  const onMy = state.tab === 'my';
  document.querySelector('#workbench').classList.toggle('viewing-my', onMy);
  if (!onMy) return;
  document.querySelector('.brand strong').textContent = '내 정보';
  document.querySelector('.intro h1').textContent = '나의 기록과 설정을 한곳에.';
  document.querySelector('.intro-copy').textContent = '프로필과 신체 기록을 관리하고 앱 설정을 확인하세요.';
  document.querySelector('#my-controls').innerHTML = `<p class="panel-caption">내 정보 · 세부 화면</p><div class="photo-preview-buttons">${[['profile', '프로필'], ['history', '신체 기록'], ['measurement', '측정 추가'], ['notifications', '알림'], ['appearance', '화면 모드'], ['account', '로그인 정보']].map(([key, label]) => `<button data-my-open="${key}">${label}</button>`).join('')}</div><p class="home-inspector-note">프로필·측정·설정은 합성 데이터로 동작합니다. 알림 예약과 계정 API는 연결하지 않습니다. 로그아웃·탈퇴는 예시 계정 상태만 전환하며 실제 기록을 삭제하지 않습니다. 약관·개인정보 문서는 준비 중 화면입니다. 새로고침하면 초기화됩니다.</p><button class="studio-button" data-tab="home">홈 화면으로 이동 ↗</button>`;
  document.querySelector('#notes').innerHTML = '<div class="note-top"><p class="note-eyebrow">MY PAGE</p><h2 class="note-title">기록과 설정의 자리</h2><p class="note-description">작은 프로필, 신체 기록 카드, 간결한 설정 목록으로 구성했습니다.</p><div class="note-point"><span class="note-number">1</span><div><strong>같은 측정 기록</strong><p>홈의 현재 키와 내 정보의 최근 측정값이 같은 데이터를 읽습니다. 예상 키는 기존 고정 예시입니다.</p></div></div><div class="note-point"><span class="note-number">2</span><div><strong>설정은 여기에서</strong><p>홈의 톱니바퀴를 제거하고 알림·화면 모드를 내 정보에 모았습니다.</p></div></div><div class="note-point"><span class="note-number">3</span><div><strong>계정과 안내</strong><p>로그인 정보와 문서 진입점을 제공하고 로그아웃·회원 탈퇴를 맨 아래에 배치했습니다.</p></div></div></div>';
}

document.addEventListener('click', event => {
  const open = event.target.closest('[data-my-open]');
  if (open) {
    if (open.dataset.myOpen === 'signin') { startOnboarding('login'); return; }
    if (mySession !== 'signed-in' && ['profile', 'history', 'measurement', 'account'].includes(open.dataset.myOpen)) { startOnboarding('login'); return; }
    openMyDialog(open.dataset.myOpen, open.closest('.phone')?.dataset.context ?? 'single'); return;
  }
  const measurement = event.target.closest('[data-my-measurement]');
  if (measurement) { openMyDialog('measurement', measurement.closest('.phone').dataset.context, measurement.dataset.myMeasurement); return; }
  const theme = event.target.closest('[data-my-theme]');
  if (theme) { myPreferences.theme = theme.dataset.myTheme; render(); document.querySelector(`[data-my-theme="${myPreferences.theme}"]`)?.focus(); return; }
  const button = event.target.closest('[data-action^="my-"]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'my-keep') { state.dialog.confirmDiscard = false; render(); document.querySelector('.my-panel input')?.focus(); }
  else if (action === 'my-discard') finishMyDialog();
  else if (action === 'my-reminders') { myPreferences.reminders = !myPreferences.reminders; render(); document.querySelector('[data-action="my-reminders"]')?.focus(); }
  else if (['my-logout', 'my-withdraw'].includes(action)) {
    mySession = action === 'my-withdraw' ? 'withdrawn' : 'signed-out';
    pubertyConsent = false;
    closeDialog(true);
    toast(action === 'my-withdraw' ? '회원 탈퇴 후 화면 미리보기예요' : '로그아웃했어요', 'single');
  }
});

function readMyDraft(form) {
  return Object.fromEntries(new FormData(form).entries());
}

document.addEventListener('input', event => {
  const form = event.target.closest('[data-my-form]');
  if (form && state.dialog?.kind === 'my') {
    state.dialog.draft = readMyDraft(form);
    form.querySelector('[data-my-error]').textContent = '';
  }
});

document.addEventListener('change', event => {
  const form = event.target.closest('[data-my-form]');
  if (form && state.dialog?.kind === 'my') state.dialog.draft = readMyDraft(form);
  if (event.target.matches('[data-my-reminder-time]') && /^(?:[01]\d|2[0-3]):[0-5]\d$/.test(event.target.value)) myPreferences.reminderTime = event.target.value;
});

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-my-form]');
  if (!form) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const dialog = state.dialog, draft = readMyDraft(form);
  if (dialog?.kind !== 'my' || dialog.confirmDiscard) return;
  let error = '';
  if (form.dataset.myForm === 'profile') {
    if (!draft.nickname.trim()) error = '닉네임을 입력해 주세요.';
    else if (!draft.birthday || draft.birthday > PROFILE_TODAY) error = '생년월일을 확인해 주세요.';
    else if (['fatherHeight', 'motherHeight', 'goalHeight'].some(key => !Number.isFinite(Number(draft[key])) || Number(draft[key]) <= 0 || Number(draft[key]) > 300)) error = '부모 키와 목표 키를 확인해 주세요.';
    else myProfile = { ...myProfile, nickname: draft.nickname.trim(), birthday: draft.birthday, gender: draft.gender, fatherHeight: Number(draft.fatherHeight), motherHeight: Number(draft.motherHeight), goalHeight: Number(draft.goalHeight) };
  } else {
    const height = Number(draft.height), weight = Number(draft.weight), shoe = Number(draft.shoe);
    if (!draft.date || draft.date > PROFILE_TODAY) error = '측정 날짜를 확인해 주세요.';
    else if (!Number.isFinite(height) || height < 1 || height > 300 || !Number.isFinite(weight) || weight < 1 || weight > 500) error = '키와 체중을 확인해 주세요.';
    else if (!Number.isInteger(shoe) || shoe < 100 || shoe > 400) error = '신발 사이즈를 확인해 주세요.';
    else {
      const id = dialog.recordId ?? `body-demo-${nextId++}`;
      bodyMeasurements = [{ id, date: draft.date, height, weight, shoe }, ...bodyMeasurements.filter(item => item.id !== id)];
      bodyMeasurements.sort((a, b) => b.date.localeCompare(a.date));
    }
  }
  if (error) { form.querySelector('[data-my-error]').textContent = error; return; }
  finishMyDialog(); toast('저장했어요', 'single');
});
