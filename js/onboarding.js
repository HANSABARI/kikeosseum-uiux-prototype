let onboardingMode = new URLSearchParams(location.search).get('mode') === 'release' ? 'release' : 'demo';
const OB_LABELS = { birthday: '생년월일', height: '현재 키', weight: '체중', shoe: '신발 사이즈', father: '아버지 키', mother: '어머니 키', goal: '목표 키', nickname: '닉네임', gender: '성별' };
const OB_REQUIRED = ['birthday', 'height', 'weight', 'shoe', 'father', 'mother', 'goal'];
const OB_NUMBERS = {
  height: { title: '현재 키는 얼마인가요?', unit: 'cm', min: 40, max: 240, seed: 160, step: .1, vertical: true },
  weight: { title: '현재 몸무게는 얼마인가요?', unit: 'kg', min: 20, max: 140, seed: 60, step: .1, vertical: false },
  father: { title: '아버지 키는 얼마인가요?', unit: 'cm', min: 100, max: 230, seed: 175, step: .1, vertical: true },
  mother: { title: '어머니 키는 얼마인가요?', unit: 'cm', min: 100, max: 230, seed: 165, step: .1, vertical: true },
  goal: { title: '원하는 키는 얼마인가요?', unit: 'cm', min: 100, max: 250, seed: 180, step: .1, vertical: true },
};

function serviceDay(date = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Seoul', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const part = type => parts.find(item => item.type === type).value;
  return `${part('year')}-${part('month')}-${part('day')}`;
}

function ageOn(birthday, today = serviceDay()) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthday)) return null;
  const date = new Date(`${birthday}T12:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== birthday || birthday > today || Number(birthday.slice(0, 4)) < 1900) return null;
  return Number(today.slice(0, 4)) - Number(birthday.slice(0, 4)) - (today.slice(5) < birthday.slice(5) ? 1 : 0);
}

function emptyOnboarding() {
  return { mode: onboardingMode, screen: 'welcome', draft: Object.fromEntries(Object.keys(OB_LABELS).map(key => [key, ''])), terms: { service: false, privacy: false }, guardian: { status: 'none', verified: false, agreed: false }, email: 'new@example.test', accountReady: false, complete: false, editingReview: false, document: null, exitConfirm: null, loginForResult: false, preview: { status: 'idle', step: 0, fingerprint: '' }, error: '' };
}
let onboarding = emptyOnboarding();
let onboardingFlowView = new URLSearchParams(location.search).get('flow') === 'onboarding';

function onboardingMinor(flow = onboarding) {
  const age = ageOn(flow.draft.birthday);
  return age !== null && age < 14;
}

function obFieldError(key, draft = onboarding.draft) {
  const value = String(draft[key] ?? '').trim();
  if (!value) return `${OB_LABELS[key]} 항목을 입력해 주세요.`;
  if (key === 'birthday') return ageOn(value) === null ? '오늘 또는 이전의 올바른 생년월일을 입력해 주세요.' : '';
  if (key === 'nickname') return value.length > 20 ? '닉네임은 20자 이내로 입력해 주세요.' : '';
  if (key === 'gender') return ['남자', '여자'].includes(value) ? '' : '성별을 선택해 주세요.';
  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) return '0보다 큰 숫자를 입력해 주세요.';
  if (key === 'shoe' && !Number.isInteger(number)) return '신발 사이즈는 mm 단위의 정수로 입력해 주세요.';
  const bounds = OB_NUMBERS[key];
  if (bounds && (number < bounds.min || number > bounds.max)) return `${bounds.min}~${bounds.max}${bounds.unit} 범위로 입력해 주세요.`;
  if (key === 'shoe' && (number < 100 || number > 400)) return '100~400mm 범위로 입력해 주세요.';
  return '';
}

function obGuardianApproved(flow = onboarding) {
  return flow.mode === 'release' && flow.guardian.status === 'approved' && flow.guardian.verified && flow.guardian.agreed && flow.guardian.legalRepresentative && Boolean(flow.guardian.relationship) && flow.guardian.birthday === flow.draft.birthday;
}

function obFingerprint(flow = onboarding) {
  return JSON.stringify([...OB_REQUIRED, 'gender'].map(key => flow.draft[key]));
}

function obPreviewReady(flow = onboarding) {
  return flow.preview.status === 'ready' && flow.preview.fingerprint === obFingerprint(flow);
}

function obHasDraft(flow = onboarding) {
  return Object.values(flow.draft).some(value => String(value).trim() !== '');
}

function obResumeScreen() {
  if (onboarding.mode === 'demo' && onboardingMinor()) return 'age-blocked';
  const missing = ['birthday', 'nickname', 'gender', ...OB_REQUIRED.slice(1)].find(key => obFieldError(key));
  if (missing) return missing;
  if (!obPreviewReady()) return 'review';
  if (!onboarding.terms.service || !onboarding.terms.privacy) return 'terms';
  if (onboardingMinor() && !obGuardianApproved()) return onboarding.guardian.status === 'pending' ? 'guardian-wait' : 'guardian-request';
  return 'gate';
}

function obRoute(flow = onboarding) {
  return ['welcome', 'birthday', 'nickname', 'gender', 'height', 'weight', 'shoe', 'father', 'mother', 'goal', 'review', 'analysis', 'gate', 'terms', ...(flow.mode === 'release' && onboardingMinor(flow) ? ['guardian-request', 'guardian-wait', 'guardian-approved'] : []), 'account'];
}

function obGo(screen) {
  onboarding.screen = screen; onboarding.error = ''; onboarding.document = null;
  render(false);
  document.querySelector('.ob-panel input:not([type="range"]), .ob-panel button')?.focus();
}

function startOnboarding(screen = 'welcome', fresh = false) {
  if (fresh) onboarding = emptyOnboarding();
  pauseRoutine(); state.tab = 'onboarding'; state.dialog = null; state.compare = false; onboardingFlowView = false;
  obGo(screen);
}

function obNumericControl(key, flow, context) {
  const spec = OB_NUMBERS[key], value = flow.draft[key];
  const seed = value === '' ? spec.seed : Number(value);
  const ticks = Array.from({ length: 25 }, (_, index) => `<i class="${index % 5 === 0 ? 'major' : ''}"></i>`).join('');
  return `<div class="ob-ruler ${spec.vertical ? 'vertical' : 'horizontal'}"><div class="ob-number"><input type="number" id="ob-${context}-${key}" name="${key}" value="${escapeHTML(value)}" placeholder="0" min="${spec.min}" max="${spec.max}" step="${spec.step}" inputmode="decimal" required aria-label="${OB_LABELS[key]}" data-ob-input="${key}" aria-describedby="ob-error-${context}"><span>${spec.unit}</span></div><div class="ob-ruler-rail"><div class="ob-ruler-ticks" aria-hidden="true">${ticks}</div><span class="ob-ruler-pointer" aria-hidden="true"></span><input type="range" min="${spec.min}" max="${spec.max}" step="${spec.step}" value="${seed}" data-ob-range="${key}" aria-label="${OB_LABELS[key]} 눈금"></div></div><p class="ob-input-hint">눈금을 움직이거나 숫자를 눌러 입력해 주세요.</p>`;
}

function obPredictionDonut(flow, mode) {
  const locked = mode === 'locked', analyzing = mode === 'analysis';
  const step = Math.max(0, Math.min(7, flow.preview.step));
  const segments = Array.from({ length: 7 }, (_, index) => `<path class="home-donut-segment ${index === 0 || index === 6 ? 'top-segment' : ''} ${analyzing && index < step ? 'analyzed' : ''}" d="${homeDonutSegment(-90 + index * 360 / 7 + 1.4, -90 + (index + 1) * 360 / 7 - 1.4)}"/>`).join('');
  const center = locked ? '<p>성인 예상 키</p><div class="ob-donut-masked-value"><i></i><i></i><i></i></div>' : `<p>키 예측 분석</p><div><strong>${Math.round(step / 7 * 100)}</strong><span>%</span></div>`;
  return `<div class="ob-prediction-donut ${locked ? 'locked' : ''}" ${locked ? 'role="img" aria-label="흐리게 처리한 예측 결과. 가입 후 확인할 수 있어요."' : ''}><div class="ob-donut-content" ${locked ? 'aria-hidden="true"' : ''}><svg viewBox="0 0 280 280" aria-hidden="true">${segments}</svg><div class="ob-donut-center">${center}</div></div>${locked ? `<span class="ob-donut-lock" aria-hidden="true">${icon('lock', 29)}</span>` : ''}</div>`;
}

function onboardingPage(flow, context) {
  const { screen, draft, guardian } = flow;
  let title = '', copy = '', body = '', footer = '', form = false;
  const submit = label => `<button class="cta ob-primary" type="submit" form="ob-form-${context}" data-ob-submit>${label}${icon('back', 18)}</button>`;
  if (screen === 'welcome') {
    title = '당신의 키가 궁금한가요?\n저희가 도와줄게요.';
    body = '<div class="ob-welcome-art" aria-hidden="true"><span></span><span></span><span></span><i>↟</i></div>';
    footer = `<button class="cta ob-primary" data-ob-action="begin">내 키 알아보기${icon('back', 18)}</button><button class="ob-text-button" data-ob-action="login">이미 계정이 있어요 · 로그인</button>${obHasDraft(flow) && !flow.complete ? '<button class="ob-text-button" data-ob-action="resume">입력 이어서 하기</button>' : ''}`;
  } else if (screen === 'age-blocked') {
    title = '시연은 만 14세 이상만\n이용할 수 있어요.';
    copy = '입력한 생년월일을 확인해 주세요.';
    body = `<div class="ob-wait-art">${icon('user', 40)}</div><p class="ob-center-copy">${escapeHTML(draft.birthday)} · 만 ${ageOn(draft.birthday)}세<br>현재 시연에서는 가입을 진행할 수 없어요.</p>`;
    footer = '<button class="cta ob-primary" data-ob-action="birthday-correct">생년월일 다시 확인</button><button class="ob-text-button" data-ob-action="blocked-home">처음으로</button>';
  } else if (screen === 'birthday') {
    title = '언제 태어났나요?'; copy = '생년월일로 나이를 확인해요.'; form = true;
    const age = ageOn(draft.birthday);
    body = `<label class="field ob-date-field"><span>생년월일</span><input type="date" name="birthday" value="${escapeHTML(draft.birthday)}" min="1900-01-01" max="${serviceDay()}" required data-ob-input="birthday" aria-describedby="ob-error-${context}"></label><p class="ob-age-note" data-ob-age>${age === null ? '' : age < 14 ? `만 ${age}세 · ${flow.mode === 'demo' ? '시연에서는 가입할 수 없어요.' : '보호자 동의 후 가입할 수 있어요.'}` : `만 ${age}세`}</p>`;
    footer = submit(flow.editingReview ? '확인' : '계속');
  } else if (screen === 'terms') {
    title = '가입하기 전에\n확인해 주세요.';
    body = `<div class="ob-consents"><button class="ob-consent-all" data-ob-action="terms-all" aria-pressed="${flow.terms.service && flow.terms.privacy}"><span class="ob-check ${flow.terms.service && flow.terms.privacy ? 'checked' : ''}">${icon('check', 14)}</span>모두 동의</button>${[['service', '이용약관'], ['privacy', '개인정보 수집·이용']].map(([key, label]) => `<div class="ob-consent-row"><label><input type="checkbox" data-ob-term="${key}" ${flow.terms[key] ? 'checked' : ''}><span>${label} <small>필수</small></span></label><button data-ob-document="${key}" aria-label="${label} 내용 보기">보기</button></div>`).join('')}</div>`;
    footer = `<button class="cta ob-primary" data-ob-action="terms-next" ${flow.terms.service && flow.terms.privacy ? '' : 'disabled'}>동의하고 계속</button>`;
  } else if (screen === 'guardian-request') {
    title = '보호자와 함께\n가입해 주세요.'; copy = '만 14세 미만은 보호자의 확인과 동의가 필요해요.'; form = true;
    body = `<div class="ob-guardian-art">${icon('user', 40)}<span>${icon('check', 18)}</span></div>${field('보호자 연락처', 'guardianPhone', '01000000000', 'type="tel" inputmode="tel" required maxlength="11"')}<p class="ob-support-copy">동의 요청을 받은 보호자가 내용을 확인하고 동의할 수 있어요.</p>`;
    footer = submit('동의 요청하기');
  } else if (screen === 'guardian-wait') {
    title = guardian.status === 'expired' ? '동의 요청이\n만료됐어요.' : guardian.status === 'rejected' ? '동의가\n완료되지 않았어요.' : '보호자의 동의를\n기다리고 있어요.';
    body = `<div class="ob-wait-art">${icon('timer', 40)}</div><p class="ob-center-copy">${guardian.status === 'pending' ? `${escapeHTML(guardian.contact ?? '')}<br>보호자가 문자 링크에서 동의하면<br>계속 진행할 수 있어요.` : '보호자에게 다시 요청할 수 있어요.'}</p>`;
    footer = guardian.status === 'pending' ? '<button class="cta ob-primary" data-ob-action="guardian-refresh">동의 상태 확인</button><button class="ob-text-button" data-ob-action="guardian-retry">다시 요청하기</button>' : '<button class="cta ob-primary" data-ob-action="guardian-retry">다시 요청하기</button>';
  } else if (screen === 'guardian-approved') {
    title = '보호자 동의가\n완료됐어요.'; body = `<div class="ob-success-art">${icon('check', 39)}</div><p class="ob-center-copy">이제 회원가입을 마칠 수 있어요.</p>`;
    footer = '<button class="cta ob-primary" data-ob-action="guardian-continue">계속</button>';
  } else if (['account', 'login', 'reset-password'].includes(screen)) {
    title = screen === 'account' ? '가입하고\n예상 키를 확인해요.' : screen === 'login' ? '다시 만나서\n반가워요.' : '비밀번호를\n다시 설정해요.';
    form = true;
    body = `${field('이메일', 'email', screen === 'account' ? flow.email : 'grow@example.test', 'type="email" required autocomplete="off"')}${screen === 'reset-password' ? '<p class="ob-support-copy">비밀번호를 다시 설정하는 안내를 확인해요.</p>' : `${field('비밀번호', 'password', '', 'type="password" required minlength="8" autocomplete="off" placeholder="8자 이상"')}${screen === 'account' ? field('비밀번호 확인', 'passwordAgain', '', 'type="password" required minlength="8" autocomplete="off"') : '<button type="button" class="ob-inline-link" data-ob-action="reset-password">비밀번호를 잊었어요</button>'}`}`;
    footer = submit(screen === 'account' ? '회원가입하고 결과 확인' : screen === 'login' ? '로그인' : '안내 확인');
  } else if (screen === 'nickname') {
    title = '어떻게 불러드릴까요?'; copy = '앱에서 사용할 이름을 알려주세요.'; form = true;
    body = field('닉네임', 'nickname', draft.nickname, 'type="text" required maxlength="20" data-ob-input="nickname" placeholder="닉네임 입력" autocomplete="off"');
    footer = submit(flow.editingReview ? '확인' : '계속');
  } else if (screen === 'gender') {
    title = '성별을 선택해 주세요.'; form = true;
    body = `<div class="ob-gender-art" aria-hidden="true">⚥</div><div class="ob-gender-options">${[['남자', '♂'], ['여자', '♀']].map(([label, mark]) => `<button type="button" data-ob-gender="${label}" aria-pressed="${draft.gender === label}"><span>${mark}</span><strong>${label}</strong></button>`).join('')}</div>`;
    footer = submit(flow.editingReview ? '확인' : '계속');
  } else if (OB_NUMBERS[screen]) {
    title = OB_NUMBERS[screen].title; form = true;
    if (screen === 'goal') copy = '앞으로 이루고 싶은 키를 알려주세요.';
    body = obNumericControl(screen, flow, context); footer = submit(flow.editingReview ? '확인' : '계속');
  } else if (screen === 'shoe') {
    title = '신발 사이즈는\n얼마인가요?'; copy = '평소 신는 한국 사이즈를 선택해 주세요.'; form = true;
    body = `<div class="ob-shoe-display">${icon('growth', 42)}</div><label class="field ob-shoe-picker"><span>한국 신발 사이즈 · mm</span><select data-ob-shoe-picker aria-label="신발 사이즈 빠른 선택"><option value="">선택해 주세요</option>${Array.from({ length: 37 }, (_, i) => 150 + i * 5).map(size => `<option value="${size}" ${String(size) === draft.shoe ? 'selected' : ''}>${size} mm</option>`).join('')}</select></label>${field('직접 입력 · mm', 'shoe', draft.shoe, 'type="number" inputmode="numeric" min="100" max="400" step="1" required data-ob-input="shoe"')}`;
    footer = submit(flow.editingReview ? '확인' : '계속');
  } else if (screen === 'review') {
    title = '입력한 정보를\n확인해 주세요.'; copy = '수정할 항목을 누르면 바로 바꿀 수 있어요.';
    body = `<div class="ob-review-list">${['nickname', 'birthday', 'gender', 'height', 'weight', 'shoe', 'father', 'mother', 'goal'].map(key => `<button data-ob-edit="${key}"><span>${OB_LABELS[key]}</span><strong>${escapeHTML(draft[key])}${['height', 'father', 'mother', 'goal'].includes(key) ? ' cm' : key === 'weight' ? ' kg' : key === 'shoe' ? ' mm' : ''}</strong><span aria-hidden="true">›</span></button>`).join('')}</div>`;
    footer = '<button class="cta ob-primary" data-ob-action="finish">키 예측 분석하기</button>';
  } else if (screen === 'analysis') {
    title = '키 예측을\n분석하고 있어요.';
    const phases = ['입력 정보 확인 중', '성장 정보 정리 중', '예상 키 분석 중'];
    const phase = Math.min(2, Math.floor(flow.preview.step * 3 / 7));
    body = `${obPredictionDonut(flow, 'analysis')}<p class="ob-analysis-current" role="status" aria-live="polite">${phases[phase]}</p><p class="ob-analysis-caption">분석 화면 미리보기</p>`;
    footer = '<button class="cta ob-primary" disabled>분석 중...</button>';
  } else if (screen === 'gate') {
    title = '분석이 완료됐어요.'; copy = '확인하려면 가입 절차를 진행해 주세요.';
    body = obPredictionDonut(flow, 'locked');
    footer = '<button class="cta ob-primary" data-ob-action="signup">가입하고 결과 확인</button><button class="ob-text-button" data-ob-action="result-login">이미 계정이 있어요 · 로그인</button>';

  }

  return { title, copy, body, footer, form };
}

function obCanContinue(flow = onboarding) {
  if (Object.hasOwn(OB_LABELS, flow.screen)) return !obFieldError(flow.screen, flow.draft);
  return true;
}

function renderOnboardingPhone(context = 'single', flow = onboarding) {
  const page = onboardingPage(flow, context), route = obRoute(flow);
  const progress = Math.max(0, route.indexOf(flow.screen)) / (route.length - 1) * 100;
  const exitModal = flow.exitConfirm ? `<div class="phone-overlay"><section class="entry-panel ob-exit-panel" role="dialog" aria-modal="true" aria-labelledby="ob-exit-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><h3 id="ob-exit-${context}">${flow.exitConfirm === 'restart' ? '처음부터 다시 시작할까요?' : '지금 나가시겠어요?'}</h3><button class="icon-button" data-ob-action="exit-keep" aria-label="계속하기">${icon('close', 22)}</button></div><div class="entry-body"><p class="ob-exit-warning">입력한 정보는 가입 전까지 임시로 보관되며, 이탈 시 사라질 수 있어요.</p></div><div class="entry-actions"><button class="cta secondary" data-ob-action="exit-keep">계속하기</button><button class="cta" data-ob-action="exit-confirm">${flow.exitConfirm === 'restart' ? '처음부터 시작' : '나가기'}</button></div></section></div>` : '';
  const temporaryNotice = !flow.complete && (['review', 'analysis', 'gate', 'terms', 'account'].includes(flow.screen) || flow.screen.startsWith('guardian-') || flow.screen === 'login' && flow.loginForResult) ? '<p class="ob-temporary-notice">가입 전 임시로 보관된 정보는 이탈 시 사라질 수 있어요.</p>' : '';
  const document = flow.document ? `<div class="phone-overlay"><section class="entry-panel ob-document" role="dialog" aria-modal="true" aria-labelledby="ob-document-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><h3 id="ob-document-${context}">${flow.document === 'service' ? '이용약관' : flow.document === 'guardian' ? '보호자 동의 안내' : '개인정보 수집·이용'}</h3><button class="icon-button" data-ob-action="document-close" aria-label="닫기">${icon('close', 22)}</button></div><div class="entry-body"><p class="ob-support-copy">가입 및 성장 기록을 위한 동의 화면의 시안입니다. 정식 약관 전문과 수집 항목·목적·보유기간은 서비스 정책 확정 후 연결합니다.</p></div><div class="entry-actions"><button class="cta" data-ob-action="document-close">확인</button></div></section></div>` : '';
  return `<section class="device-wrap"><div class="device-caption"><strong>${flow.mode === 'release' ? '출시용' : '시연용'} · ${flow.screen === 'welcome' ? '시작' : page.title.replaceAll('\n', ' ')}</strong><span>가입과 기본 정보</span></div><div class="phone ob-phone" data-context="${context}"><div class="status-bar" ${document || exitModal ? 'inert' : ''}><span>9:41</span><span class="status-icons">${icon('signal', 13)}${icon('wifi', 14)}${icon('battery', 18)}</span></div><section class="ob-panel" ${document || exitModal ? 'inert' : ''}><header class="ob-header"><button data-ob-action="back" class="icon-button" aria-label="뒤로가기">${icon('back', 24)}</button><div class="progress-line" role="progressbar" aria-label="온보딩 진행" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${Math.round(progress)}"><div class="progress-fill" style="width:${progress}%"></div></div><button class="ob-exit" data-ob-action="exit">닫기</button></header><main class="phone-scroll ob-scroll"><p class="ob-brand">키컸으면</p><h2>${escapeHTML(page.title).replaceAll('\n', '<br>')}</h2>${page.copy ? `<p class="ob-copy">${page.copy}</p>` : ''}${page.form ? `<form id="ob-form-${context}" data-ob-form="${flow.screen}" novalidate>${page.body}</form>` : page.body}<p class="form-error ob-error" role="alert" id="ob-error-${context}" data-ob-error>${escapeHTML(flow.error)}</p></main><footer class="ob-footer">${page.footer}${temporaryNotice}</footer></section><div class="home-indicator"></div>${document}${exitModal}</div></section>`;
}

function obSample(screen, minor = false, mode = onboardingMode) {
  const sample = emptyOnboarding();
  sample.mode = mode; sample.screen = screen === 'exit-confirm' ? 'gate' : screen;
  sample.draft = { birthday: minor || screen === 'age-blocked' ? '2014-06-15' : '2010-06-15', nickname: '쑥쑥이', gender: '남자', height: '170', weight: '60', shoe: '260', father: '178', mother: '165', goal: '180' };
  const approved = screen === 'guardian-approved';
  const consentDone = screen.startsWith('guardian-') || screen === 'account';
  sample.terms = { service: consentDone, privacy: consentDone };
  sample.guardian = { status: approved ? 'approved' : screen === 'guardian-wait' ? 'pending' : 'none', requestId: 'child-consent-sample', expiresAt: Date.now() + 600000, contact: '010-****-0000', verified: approved, agreed: approved, legalRepresentative: approved, relationship: approved ? '부모' : '', birthday: sample.draft.birthday, page: approved ? 'done' : 'intro' };
  if (screen.startsWith('guardian-') || ['analysis', 'gate', 'terms', 'account', 'exit-confirm'].includes(screen)) sample.preview = { status: screen === 'analysis' ? 'running' : 'ready', step: screen === 'analysis' ? 3 : 7, fingerprint: obFingerprint(sample) };
  if (screen === 'exit-confirm') sample.exitConfirm = 'home';
  return sample;
}

function obFlowStages(mode = onboardingMode) {
  return [['welcome', '시작'], ['login', '기존 계정 로그인'], ['birthday', '생년월일·나이 확인'], ...(mode === 'demo' ? [['age-blocked', '14세 미만 · 시연 가입 제한']] : []), ['nickname', '닉네임'], ['gender', '성별'], ['height', '현재 키'], ['weight', '체중'], ['shoe', '신발 사이즈'], ['father', '아버지 키'], ['mother', '어머니 키'], ['goal', '목표 키'], ['review', '입력 확인'], ['analysis', '키 예측 분석'], ['gate', '가입 전 결과 잠금'], ['terms', '가입 전 동의'], ...(mode === 'release' ? [['guardian-request', '14세 미만 · 동의 요청'], ['guardian-wait', '아이 · 동의 대기'], ['parent-intro', '보호자 웹 · 요청 확인'], ['parent-verify', '보호자 웹 · 본인 확인'], ['parent-consent', '보호자 웹 · 동의'], ['parent-done', '보호자 웹 · 완료'], ['guardian-approved', '아이 · 동의 완료']] : []), ['account', '마지막 단계 · 회원가입'], ['home-pending', '가입 후 홈 · 분석 대기'], ['home-ready', '홈 · 결과 표시'], ['home-error', '홈 · 분석 재시도'], ['exit-confirm', '이탈 경고']];
}

function renderOnboardingFlow() {
  return obFlowStages().map(([screen, title], index) => {
    let phone;
    if (screen.startsWith('parent-')) { const sample = guardianWebSample(screen.slice(7)); phone = renderGuardianPhone(`ob-flow-${screen}`, sample, sample.guardian.requestId); }
    else if (screen.startsWith('home-')) phone = renderHomePhone(`ob-flow-${screen}`, 'original', predictionSample(screen.slice(5)));
    else phone = renderOnboardingPhone(`ob-flow-${screen}`, obSample(screen, screen.startsWith('guardian-')));
    const lane = screen.startsWith('parent-') ? '보호자 · 별도 웹' : screen.startsWith('guardian-') ? '아이 · 앱' : screen.startsWith('home-') ? '가입 후 · 앱' : '가입과 기본 정보';
    return `<article class="routine-flow-step"><div class="routine-flow-heading"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${title}</h2><p>${lane}</p></div></div><div class="routine-flow-static" inert>${phone}</div><button class="studio-button routine-flow-try" data-ob-preview="${screen}">이 화면에서 눌러보기 ↗</button></article>`;
  }).join('');
}

function renderOnboardingControls() {
  const active = state.tab === 'onboarding', release = onboardingMode === 'release';
  document.querySelector('#workbench').classList.toggle('viewing-onboarding', active);
  document.querySelector('#workbench').classList.toggle('onboarding-flow', active && onboardingFlowView);
  document.querySelector('#ob-controls').innerHTML = `<p class="panel-caption">온보딩 · 버전 비교</p><div class="ob-mode-options" role="group" aria-label="온보딩 버전"><button data-ob-mode="demo" aria-pressed="${!release}">시연용</button><button data-ob-mode="release" aria-pressed="${release}">출시용</button></div><p class="home-inspector-note">${release ? '14세 미만은 보호자 웹 본인 확인·동의 후 가입합니다.' : '시연은 만 14세 이상만 가입할 수 있습니다. 생년월일 단계에서 제한합니다.'}</p><button class="studio-button routine-flow-toggle" data-ob-action="flow">${active && onboardingFlowView ? '직접 진행하기' : '화면 한눈에 보기'} ↗</button><div class="photo-preview-buttons"><button data-ob-scenario="adult">14세 이상 · 처음부터</button><button data-ob-scenario="minor">14세 미만 · 처음부터</button><button data-ob-preview="login">기존 계정 로그인</button><button data-ob-preview="analysis">키 예측 분석</button><button data-ob-preview="gate">가입 전 결과 잠금</button><button data-ob-preview="exit-confirm">이탈 경고</button>${release ? '<button data-ob-guardian-state="expired">보호자 요청 만료</button>' : ''}<button data-ob-action="resume">입력 이어서 하기</button></div>${release ? '<p class="panel-caption ob-parent-caption">보호자 · 별도 웹</p><button class="studio-button" data-ob-parent>문자 링크를 받은 보호자 화면 ↗</button>' : ''}<p class="home-inspector-note">가입 전 분석은 화면 연출입니다. 분석 요청은 가입 성공 후 시작하며 홈에서 응답을 기다립니다. 이 시안의 인증·문자·예측 응답은 모두 합성입니다. 이메일은 example.test, 로그인 예시는 grow@example.test와 8자 이상 임의 문자열을 사용합니다. 비밀번호와 인증 정보는 저장·전송하지 않습니다.</p><button class="studio-button" data-tab="home">홈 보기 ↗</button>`;
  if (!active) return;
  document.querySelector('.brand strong').textContent = `온보딩 · ${release ? '출시용' : '시연용'}`;
  document.querySelector('.intro h1').textContent = '처음 만나는 순간부터, 나의 성장 기록까지.';
  document.querySelector('.intro-copy').textContent = `${release ? '출시용' : '시연용'} · ${onboardingFlowView ? obFlowStages().length + '개 화면을 한눈에 비교하세요.' : '성장 정보 입력부터 가입 후 홈까지 직접 진행하세요.'}`;
  document.querySelector('#notes').innerHTML = `<div class="note-top"><p class="note-eyebrow">ONBOARDING / ${release ? 'RELEASE' : 'DEMO'}</p><h2 class="note-title">${release ? '아이 앱과 보호자 웹' : '시연은 14세 이상부터'}</h2><p class="note-description">${release ? '아이의 요청·대기 화면과 보호자의 인증·동의를 별도 화면으로 나눕니다.' : '생년월일에서 제한하고 이후 추가 입력과 가입을 진행하지 않습니다.'}</p><div class="note-point"><span class="note-number">1</span><div><strong>기존 필수 7개 유지</strong><p>생년월일·키·체중·신발·아버지 키·어머니 키·목표 키와 닉네임·성별을 입력합니다.</p></div></div><div class="note-point"><span class="note-number">2</span><div><strong>가입 후 분석 요청</strong><p>가입 전 7분할 분석·잠금 연출은 유지합니다. 가입 성공 → 분석 요청 → 홈 대기 → 응답 후 결과 공개 흐름입니다. 실제 API는 연결하지 않았습니다.</p></div></div><div class="note-point"><span class="note-number">3</span><div><strong>사춘기 질문은 홈에서</strong><p>기존 하루 최대 1회 노출을 유지합니다. 출시용 표시는 화면 기획용이며 실제 인증 구축 완료를 뜻하지 않습니다.</p></div></div></div>`;
}

function obPaint() {
  const panel = document.querySelector('.ob-panel');
  if (!panel) return;
  const age = panel.querySelector('[data-ob-age]');
  if (age) { const years = ageOn(onboarding.draft.birthday); age.textContent = years === null ? '' : years < 14 ? `만 ${years}세 · ${onboarding.mode === 'demo' ? '시연에서는 가입할 수 없어요.' : '보호자 동의 후 가입할 수 있어요.'}` : `만 ${years}세`; }
  const submit = panel.querySelector('[data-ob-submit]');
  if (submit) submit.disabled = !obCanContinue();
  panel.querySelector('[data-ob-error]').textContent = onboarding.error;
}

let obPreviewTimer = null;
let obPreviewRevision = 0;

function obCheckInputs(requireConsent = false) {
  if (onboarding.mode === 'demo' && onboardingMinor()) { obGo('age-blocked'); return false; }
  const invalid = [...OB_REQUIRED, 'nickname', 'gender'].find(key => obFieldError(key));
  if (invalid) { onboarding.editingReview = true; obGo(invalid); return false; }
  if (requireConsent && (!onboarding.terms.service || !onboarding.terms.privacy)) { obGo('terms'); return false; }
  if (requireConsent && onboardingMinor() && !obGuardianApproved()) { obGo('guardian-request'); return false; }
  return true;
}

function obStartPreview() {
  if (!obCheckInputs()) return;
  onboarding.complete = false;
  onboarding.preview = { status: 'running', step: 0, fingerprint: obFingerprint() };
  obGo('analysis');
}

function obMountPreview() {
  const active = state.tab === 'onboarding' && !onboardingFlowView && onboarding.screen === 'analysis';
  if (!active || onboarding.exitConfirm || onboarding.preview.status !== 'running') {
    if (obPreviewTimer !== null) { clearTimeout(obPreviewTimer); obPreviewTimer = null; obPreviewRevision++; }
    if (!active && onboarding.preview.status === 'running') { onboarding.preview.status = 'idle'; onboarding.preview.step = 0; }
    return;
  }
  if (obPreviewTimer !== null) return;
  const revision = ++obPreviewRevision, flow = onboarding;
  obPreviewTimer = setTimeout(() => {
    obPreviewTimer = null;
    if (revision !== obPreviewRevision || flow !== onboarding || state.tab !== 'onboarding' || onboardingFlowView || flow.screen !== 'analysis' || flow.exitConfirm) return;
    flow.preview.step++;
    if (flow.preview.step >= 7) {
      flow.preview.status = 'ready';
      if (flow.accountReady && mySession === 'signed-in') obSave();
      else obGo('gate');
    } else render(false);
  }, 300);
}

function obRegistrationStep() {
  if (onboarding.mode === 'demo' && onboardingMinor()) { obGo('age-blocked'); return; }
  if (!obPreviewReady()) { obStartPreview(); return; }
  if (!onboarding.terms.service || !onboarding.terms.privacy) { obGo('terms'); return; }
  if (onboardingMinor() && !obGuardianApproved()) { obGo(onboarding.guardian.status === 'pending' ? 'guardian-wait' : 'guardian-request'); return; }
  if (onboarding.accountReady) { obSave(); return; }
  obGo(onboarding.loginForResult ? 'login' : 'account');
}

function obSave() {
  if (onboarding.complete) { state.tab = 'home'; state.dialog = null; render(false); return; }
  if (!obCheckInputs(true)) return;
  if (!obPreviewReady()) { obStartPreview(); return; }
  if (!onboarding.accountReady) { obGo('gate'); return; }
  const draft = onboarding.draft;
  myProfile = { ...myProfile, nickname: draft.nickname.trim(), birthday: draft.birthday, gender: draft.gender, fatherHeight: Number(draft.father), motherHeight: Number(draft.mother), goalHeight: Number(draft.goal), email: onboarding.email };
  const id = onboarding.measurementId ?? `ob-body-${nextId++}`;
  onboarding.measurementId = id;
  bodyMeasurements = [{ id, date: serviceDay(), height: Number(draft.height), weight: Number(draft.weight), shoe: Number(draft.shoe) }, ...bodyMeasurements.filter(item => item.id !== id)];
  mySession = 'signed-in'; onboarding.complete = true; onboarding.editingReview = false;
  pubertyConsent = false;
  startHomePrediction({ ...draft });
  state.tab = 'home'; state.dialog = null; homeGaugeCompare = false; render(false);
}

function obExit(target) {
  onboarding = emptyOnboarding();
  if (target === 'restart') obGo('birthday');
  else if (target === 'restart-welcome') obGo('welcome');
  else { state.tab = 'home'; state.dialog = null; render(false); }
}

function obRequestExit(target = 'home') {
  if (!onboarding.complete && obHasDraft()) {
    onboarding.exitConfirm = target; render();
    document.querySelector('[data-ob-action="exit-keep"]')?.focus();
  } else obExit(target);
}

document.addEventListener('input', event => {
  const key = event.target.dataset.obInput ?? event.target.dataset.obRange;
  if (!key) return;
  onboarding.draft[key] = event.target.value; onboarding.error = event.target.value ? obFieldError(key) : '';
  if (event.target.dataset.obRange) { const number = document.querySelector(`[data-ob-input="${key}"]`); if (number) number.value = event.target.value; }
  else if (OB_NUMBERS[key] && event.target.value) { const range = document.querySelector(`[data-ob-range="${key}"]`); if (range) range.value = event.target.value; }
  if (key === 'shoe') {
    const picker = document.querySelector('[data-ob-shoe-picker]');
    if (picker && !obFieldError('shoe')) {
      if (![...picker.options].some(option => option.value === event.target.value)) { const option = document.createElement('option'); option.value = event.target.value; option.textContent = `${event.target.value} mm`; picker.append(option); }
      picker.value = event.target.value;
    } else if (picker) picker.value = '';
  }
  obPaint();
});

document.addEventListener('change', event => {
  if (event.target.matches('[data-ob-shoe-picker]')) { onboarding.draft.shoe = event.target.value; const field = document.querySelector('[data-ob-input="shoe"]'); if (field) field.value = event.target.value; onboarding.error = ''; obPaint(); }
  if (event.target.dataset.obInput) { onboarding.draft[event.target.dataset.obInput] = event.target.value; onboarding.error = ''; obPaint(); }
  if (event.target.dataset.obTerm) { onboarding.terms[event.target.dataset.obTerm] = event.target.checked; render(); }
});

document.addEventListener('click', event => {
  if (event.target.closest('[data-ob-launch]')) { startOnboarding('welcome'); return; }
  const mode = event.target.closest('[data-ob-mode]');
  if (mode) { onboardingMode = mode.dataset.obMode; onboarding = emptyOnboarding(); state.tab = 'onboarding'; state.dialog = null; state.compare = false; render(false); return; }
  if (event.target.closest('[data-ob-parent]')) { openGuardianWeb(); return; }
  const scenario = event.target.closest('[data-ob-scenario]');
  if (scenario) { startOnboarding('birthday', true); onboarding.draft.birthday = scenario.dataset.obScenario === 'minor' ? '2014-06-15' : '2010-06-15'; render(); return; }
  const preview = event.target.closest('[data-ob-preview]');
  if (preview) {
    const screen = preview.dataset.obPreview;
    if (screen.startsWith('parent-')) { onboarding = guardianWebSample(screen.slice(7)); guardianWebRequestId = onboarding.guardian.requestId; onboardingFlowView = false; state.tab = 'guardian'; state.dialog = null; render(false); }
    else if (screen.startsWith('home-')) { mySession = 'signed-in'; resetHomePredictionSample(); if (screen === 'home-pending') startHomePrediction({ ...obSample('account').draft }); else homePrediction = predictionSample(screen.slice(5)); state.tab = 'home'; state.dialog = null; homeGaugeCompare = false; render(false); }
    else { onboarding = obSample(screen, screen.startsWith('guardian-')); startOnboarding(onboarding.screen); }
    return;
  }
  const guardianState = event.target.closest('[data-ob-guardian-state]');
  if (guardianState && onboardingMode === 'release') { onboarding = obSample('guardian-wait', true); onboarding.guardian.status = guardianState.dataset.obGuardianState; startOnboarding('guardian-wait'); return; }
  const documentButton = event.target.closest('[data-ob-document]');
  if (documentButton) { onboarding.document = documentButton.dataset.obDocument; render(); document.querySelector('.ob-document button')?.focus(); return; }
  const edit = event.target.closest('[data-ob-edit]');
  if (edit) { onboarding.complete = false; onboarding.editingReview = true; onboarding.preview.status = 'idle'; obGo(edit.dataset.obEdit); return; }
  const gender = event.target.closest('[data-ob-gender]');
  if (gender) { onboarding.draft.gender = gender.dataset.obGender; render(); return; }
  const button = event.target.closest('[data-ob-action]');
  if (!button) return;
  const action = button.dataset.obAction;
  if (action === 'flow') { onboardingFlowView = !(state.tab === 'onboarding' && onboardingFlowView); state.tab = 'onboarding'; state.dialog = null; state.compare = false; render(false); return; }
  if (action === 'begin') obRequestExit('restart');
  else if (action === 'login') { onboarding.loginForResult = false; obGo('login'); }
  else if (action === 'result-login') { if (!obPreviewReady()) { obStartPreview(); return; } onboarding.loginForResult = true; obRegistrationStep(); }
  else if (action === 'signup') { if (!obPreviewReady()) { obStartPreview(); return; } onboarding.loginForResult = false; obRegistrationStep(); }
  else if (action === 'resume') { if (onboarding.complete) { state.tab = 'home'; state.dialog = null; render(false); } else startOnboarding(obResumeScreen()); }
  else if (action === 'back') {
    if (onboarding.exitConfirm) { onboarding.exitConfirm = null; render(); return; }
    if (onboarding.document) { onboarding.document = null; render(); return; }
    if (onboarding.editingReview) { onboarding.editingReview = false; obGo('review'); return; }
    if (['gate', 'analysis'].includes(onboarding.screen)) { obGo('review'); return; }
    if (onboarding.screen === 'reset-password') { obGo('login'); return; }
    if (onboarding.screen === 'login') { obGo(onboarding.loginForResult ? 'gate' : 'welcome'); return; }
    const route = obRoute(); obGo(route[Math.max(0, route.indexOf(onboarding.screen) - 1)] ?? 'welcome');
  } else if (action === 'exit') obRequestExit();
  else if (action === 'exit-keep') { onboarding.exitConfirm = null; render(); document.querySelector('.ob-panel input, .ob-panel button')?.focus(); }
  else if (action === 'exit-confirm') obExit(onboarding.exitConfirm);
  else if (action === 'document-close') { onboarding.document = null; render(); }
  else if (action === 'terms-all') { const next = !(onboarding.terms.service && onboarding.terms.privacy); onboarding.terms = { service: next, privacy: next }; render(); }
  else if (action === 'terms-next') {
    if (!onboarding.terms.service || !onboarding.terms.privacy) return;
    obRegistrationStep();
  } else if (action === 'guardian-refresh') { syncGuardianChild(); render(); }
  else if (action === 'guardian-retry') { onboarding.guardian = { status: 'none', verified: false, agreed: false }; obGo('guardian-request'); }
  else if (action === 'guardian-continue') { if (!obGuardianApproved()) return; obRegistrationStep(); }
  else if (action === 'birthday-correct') obGo('birthday');
  else if (action === 'blocked-home') obExit('restart-welcome');
  else if (action === 'reset-password') obGo('reset-password');
  else if (action === 'finish') obStartPreview();
  else if (action === 'home') { if (!onboarding.complete) obSave(); if (onboarding.complete) { state.tab = 'home'; state.dialog = null; render(false); } }
});

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-ob-form]');
  if (!form) return;
  event.preventDefault(); event.stopImmediatePropagation();
  const screen = form.dataset.obForm, input = new FormData(form);
  const fail = message => { onboarding.error = message; obPaint(); };
  if (screen === 'guardian-request') {
    if (!/^010\d{8}$/.test(String(input.get('guardianPhone')).replaceAll('-', ''))) { fail('보호자 연락처를 확인해 주세요.'); return; }
    if (!requestGuardianConsent(input.get('guardianPhone'))) { fail('보호자 요청을 다시 확인해 주세요.'); return; }
    obGo('guardian-wait'); return;
  }
  if (['account', 'login', 'reset-password'].includes(screen)) {
    const email = String(input.get('email')).trim();
    if (!/^[^@\s]+@[^@\s]+\.test$/.test(email)) { fail('시안에서는 example.test 형식의 예시 이메일을 사용해 주세요.'); return; }
    if (screen === 'reset-password') { obGo('login'); toast('재설정 안내 미리보기예요. 메일은 전송하지 않습니다.', 'single'); return; }
    if (String(input.get('password')).length < 8) { fail('비밀번호는 8자 이상 입력해 주세요.'); return; }
    if (screen === 'login') {
      if (email !== 'grow@example.test' && !(onboarding.accountReady && email === onboarding.email)) { fail('예시 계정을 확인해 주세요. grow@example.test로 로그인할 수 있어요.'); return; }
      if (onboarding.loginForResult) { onboarding.email = email; onboarding.accountReady = true; obSave(); }
      else { mySession = 'signed-in'; state.tab = 'home'; state.dialog = null; render(false); }
      return;
    }
    if (input.get('password') !== input.get('passwordAgain')) { fail('비밀번호가 서로 달라요.'); return; }
    if (email === 'grow@example.test') { fail('이미 등록된 예시 이메일이에요. 로그인해 주세요.'); return; }
    onboarding.email = email; onboarding.accountReady = true; obSave(); return;
  }
  if (Object.hasOwn(OB_LABELS, screen)) {
    if (screen !== 'gender') onboarding.draft[screen] = String(input.get(screen) ?? '');
    const error = obFieldError(screen);
    if (error) { fail(error); return; }
    if (screen === 'birthday') {
      if (onboarding.mode === 'demo' && onboardingMinor()) { obGo('age-blocked'); return; }
      obGo(onboarding.editingReview ? 'review' : 'nickname'); return;
    }
    if (onboarding.editingReview) { onboarding.editingReview = false; obGo('review'); return; }
    const route = obRoute(); obGo(route[route.indexOf(screen) + 1]);
  }
});

document.addEventListener('keydown', event => {
  if (state.tab !== 'onboarding' || onboardingFlowView) return;
  if (event.key === 'Escape') { event.preventDefault(); document.querySelector(onboarding.exitConfirm ? '[data-ob-action="exit-keep"]' : onboarding.document ? '[data-ob-action="document-close"]' : '[data-ob-action="back"]')?.click(); }
  if (event.key === 'Tab' && (onboarding.document || onboarding.exitConfirm)) {
    const buttons = [...document.querySelectorAll(onboarding.exitConfirm ? '.ob-exit-panel button' : '.ob-document button')].filter(button => !button.disabled);
    if (event.shiftKey && document.activeElement === buttons[0]) { event.preventDefault(); buttons.at(-1)?.focus(); }
    else if (!event.shiftKey && document.activeElement === buttons.at(-1)) { event.preventDefault(); buttons[0]?.focus(); }
  }
});

window.addEventListener('beforeunload', event => {
  if (state.tab !== 'onboarding' || onboardingFlowView || onboarding.complete || !obHasDraft()) return;
  event.preventDefault();
  event.returnValue = '';
});
