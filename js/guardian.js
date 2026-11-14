let guardianRequestSequence = 0;
let guardianWebRequestId = null;

function requestGuardianConsent(phone) {
  if (onboarding.mode !== 'release' || !onboardingMinor()) return false;
  const normalized = String(phone).replaceAll('-', '');
  if (!/^010\d{8}$/.test(normalized)) return false;
  onboarding.guardian = { status: 'pending', requestId: `consent-preview-${++guardianRequestSequence}`, expiresAt: Date.now() + 10 * 60 * 1000, birthday: onboarding.draft.birthday, contact: `010-****-${normalized.slice(-4)}`, page: 'intro', verified: false, agreed: false, legalRepresentative: false, relationship: '', error: '' };
  return true;
}

function refreshGuardianState(flow = onboarding) {
  if (flow.guardian.status === 'pending' && flow.guardian.expiresAt <= Date.now()) flow.guardian.status = 'expired';
}

function syncGuardianChild() {
  refreshGuardianState();
  if (state.tab === 'onboarding' && onboarding.screen === 'guardian-wait' && obGuardianApproved()) onboarding.screen = 'guardian-approved';
}

function openGuardianWeb() {
  if (onboardingMode !== 'release') return;
  if (!onboarding.guardian.requestId) {
    onboarding = obSample('guardian-wait', true, 'release');
    requestGuardianConsent('01000000000');
  }
  guardianWebRequestId = onboarding.guardian.requestId;
  state.tab = 'guardian'; state.dialog = null; onboardingFlowView = false; render(false);
}

function guardianWebSample(page) {
  const flow = obSample('guardian-wait', true, 'release');
  flow.guardian = { status: page === 'done' ? 'approved' : 'pending', requestId: 'parent-web-sample', expiresAt: Date.now() + 600000, birthday: flow.draft.birthday, contact: '010-****-0000', page, verified: ['consent', 'done'].includes(page), agreed: page === 'done', legalRepresentative: page === 'done', relationship: page === 'done' ? '부모' : '', error: '' };
  return flow;
}

function guardianRequestValid(flow = onboarding, requestId = guardianWebRequestId) {
  return flow.mode === 'release' && flow.guardian.requestId === requestId && flow.guardian.birthday === flow.draft.birthday && flow.guardian.status === 'pending' && flow.guardian.expiresAt > Date.now();
}

function renderGuardianPhone(context = 'single', flow = onboarding, requestId = guardianWebRequestId) {
  const g = flow.guardian;
  let page = g.page ?? 'intro';
  if (flow.mode !== 'release' || !g.requestId) page = 'unavailable';
  else if (requestId !== g.requestId || g.status === 'expired') page = 'expired';
  else if (g.status === 'rejected') page = 'rejected';
  else if (g.status === 'approved') page = 'done';
  let title, copy = '', body = '', footer = '';
  if (page === 'intro') {
    title = '자녀의 가입 동의를\n요청받았어요.';
    copy = '보호자 확인과 동의를 진행해 주세요.';
    body = `<div class="guardian-child"><span>자녀</span><strong>${escapeHTML(flow.draft.nickname || '가입 신청자')}</strong><p>${escapeHTML(flow.draft.birthday)} · 만 ${ageOn(flow.draft.birthday)}세</p></div><p class="ob-support-copy">기본 정보와 성장 기록을 이용하는 서비스입니다. 본인 확인 후 수집·이용 내용을 확인할 수 있어요.</p>`;
    footer = '<button class="cta" data-guardian-action="start">보호자 본인 확인</button><button class="ob-text-button" data-guardian-action="reject">동의하지 않음</button>';
  } else if (page === 'verify') {
    title = '보호자 본인을\n확인해 주세요.'; copy = '외부 휴대폰 인증 화면 · 시안';
    body = `<form id="guardian-verify-${context}" data-guardian-form>${field('이름', 'guardianName', '김보호자', 'type="text" required maxlength="30" autocomplete="off"')}${field('휴대폰 번호', 'guardianPhone', '01000000000', 'type="tel" inputmode="tel" required maxlength="11"')}<label class="field"><span>통신사</span><select name="carrier"><option>SKT</option><option>KT</option><option>LG U+</option><option>알뜰폰</option></select></label><p class="ob-support-copy">실제 인증 연동 시 인증 업체 화면에서 진행합니다. 이 시안은 인증 정보나 문자를 전송하지 않습니다.</p><p class="form-error" role="alert">${escapeHTML(g.error ?? '')}</p></form>`;
    footer = `<button class="cta" type="submit" form="guardian-verify-${context}">본인 확인 완료 · 시안</button>`;
  } else if (page === 'consent') {
    title = '자녀의 정보 이용에\n동의하시나요?';
    body = `<div class="guardian-verified">${icon('check', 18)}보호자 본인 확인 완료</div><div class="guardian-child"><span>동의 대상 자녀</span><strong>${escapeHTML(flow.draft.nickname)}</strong><p>${escapeHTML(flow.draft.birthday)}</p></div><label class="field"><span>자녀와의 관계</span><select data-guardian-relationship><option value="">선택해 주세요</option>${['부모', '그 외 법정대리인'].map(value => `<option ${g.relationship === value ? 'selected' : ''}>${value}</option>`).join('')}</select></label><label class="guardian-check"><input type="checkbox" data-guardian-check="legalRepresentative" ${g.legalRepresentative ? 'checked' : ''}>저는 해당 자녀의 법정대리인입니다.</label><label class="guardian-check"><input type="checkbox" data-guardian-check="agreed" ${g.agreed ? 'checked' : ''}>자녀의 개인정보 수집·이용에 동의합니다.</label><button class="ob-inline-link" data-guardian-action="document">수집·이용 내용 확인</button>`;
    footer = `<button class="cta" data-guardian-action="approve" ${g.verified && g.agreed && g.legalRepresentative && g.relationship ? '' : 'disabled'}>동의 완료</button><button class="ob-text-button" data-guardian-action="reject">동의하지 않음</button>`;
  } else if (page === 'document') {
    title = '수집·이용 내용';
    body = '<p class="ob-support-copy">생년월일·닉네임·성별·키·체중·신발 사이즈·부모 키·목표 키를 가입 및 성장 정보 기록에 사용하는 동의 화면의 시안입니다.</p><p class="ob-support-copy">정식 문서의 수집 목적·항목·보유기간은 실제 서비스 정책과 연결합니다. 사춘기 질문 답변은 홈에서 별도로 동의하고 선택합니다.</p>';
    footer = '<button class="cta" data-guardian-action="consent-back">동의 화면으로</button>';
  } else if (page === 'done') {
    title = '동의가 완료됐어요.';
    body = `<div class="ob-success-art">${icon('check', 38)}</div><p class="ob-center-copy">자녀가 가입을 계속할 수 있어요.<br>이 창은 닫아도 됩니다.</p>`;
  } else if (page === 'rejected') {
    title = '동의하지 않았어요.'; body = '<p class="ob-support-copy">자녀에게 동의 결과가 전달됩니다. 가입을 계속하려면 자녀 화면에서 다시 요청해야 합니다.</p>';
  } else {
    title = page === 'unavailable' ? '사용할 수 없는\n동의 링크예요.' : '동의 요청이\n만료됐어요.';
    body = '<p class="ob-support-copy">자녀 화면에서 동의를 다시 요청해 주세요.</p>';
  }
  return `<section class="device-wrap"><div class="device-caption"><strong>출시용 · 보호자 웹</strong><span>보호자 기기</span></div><div class="phone guardian-web-phone" data-context="${context}"><div class="status-bar"><span>9:41</span><span>${icon('battery', 18)}</span></div><div class="guardian-browser-bar">${icon('lock', 13)}consent.kikeosseum.example</div><main class="phone-scroll guardian-scroll"><p class="ob-brand">키컸으면 · 보호자 동의</p><h2>${escapeHTML(title).replaceAll('\n', '<br>')}</h2>${copy ? `<p class="ob-copy">${copy}</p>` : ''}${body}</main>${footer ? `<footer class="ob-footer guardian-footer">${footer}</footer>` : ''}<div class="home-indicator"></div></div></section>`;
}

function renderGuardianControls() {
  const active = state.tab === 'guardian';
  document.querySelector('#workbench').classList.toggle('viewing-guardian', active);
  if (!active) return;
  document.querySelector('.brand strong').textContent = '보호자 웹';
  document.querySelector('.intro h1').textContent = '보호자에게 도착한 동의 링크.';
  document.querySelector('.intro-copy').textContent = '아이의 앱과 분리된 보호자 웹 인증·동의 화면입니다.';
  document.querySelector('#guardian-controls').innerHTML = '<p class="panel-caption">별도 기기 · 시안 전환</p><button class="studio-button" data-guardian-child>아이 화면으로 돌아가기 ↗</button><div class="photo-preview-buttons"><button data-guardian-example="intro">동의 요청 도착</button><button data-guardian-example="verify">외부 본인 확인</button><button data-guardian-example="consent">관계 확인과 동의</button><button data-guardian-example="done">동의 완료</button></div><p class="home-inspector-note">인증·동의는 합성 상태입니다. 실제 서비스에서는 인증 업체 결과와 동의 이력을 서버에서 확인합니다. 본인 인증이 가족관계를 자동 증명한다는 의미는 아닙니다. 실제 문자나 인증 정보를 전송하지 않습니다.</p>';
  document.querySelector('#notes').innerHTML = '<div class="note-top"><p class="note-eyebrow">GUARDIAN WEB</p><h2 class="note-title">보호자가 직접 확인해요</h2><p class="note-description">아이의 앱에서는 동의 요청과 대기만 합니다. 보호자는 문자 링크를 열어 앱 설치 없이 본인 확인과 동의를 진행합니다.</p></div>';
}

document.addEventListener('change', event => {
  if (state.tab !== 'guardian') return;
  if (event.target.matches('[data-guardian-relationship]')) onboarding.guardian.relationship = event.target.value;
  else if (event.target.dataset.guardianCheck) onboarding.guardian[event.target.dataset.guardianCheck] = event.target.checked;
  else return;
  const approve = document.querySelector('[data-guardian-action="approve"]');
  if (approve) { const g = onboarding.guardian; approve.disabled = !(g.verified && g.agreed && g.legalRepresentative && g.relationship); }
});

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-guardian-form]');
  if (!form) return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (state.tab !== 'guardian' || !guardianRequestValid()) { render(); return; }
  const data = new FormData(form);
  if (!String(data.get('guardianName')).trim() || !/^010\d{8}$/.test(String(data.get('guardianPhone')).replaceAll('-', ''))) { onboarding.guardian.error = '이름과 휴대폰 번호를 확인해 주세요.'; render(); return; }
  onboarding.guardian.verified = true; onboarding.guardian.page = 'consent'; onboarding.guardian.error = ''; render(false);
});

document.addEventListener('click', event => {
  if (event.target.closest('[data-guardian-child]')) { onboardingFlowView = false; state.tab = 'onboarding'; state.dialog = null; render(false); return; }
  const example = event.target.closest('[data-guardian-example]');
  if (example) { onboardingMode = 'release'; onboarding = guardianWebSample(example.dataset.guardianExample); guardianWebRequestId = onboarding.guardian.requestId; state.tab = 'guardian'; render(false); return; }
  const button = event.target.closest('[data-guardian-action]');
  if (!button || state.tab !== 'guardian') return;
  if (!guardianRequestValid()) { refreshGuardianState(); render(); return; }
  const action = button.dataset.guardianAction;
  if (action === 'start') onboarding.guardian.page = 'verify';
  else if (action === 'document') onboarding.guardian.page = 'document';
  else if (action === 'consent-back') onboarding.guardian.page = 'consent';
  else if (action === 'reject') { onboarding.guardian.status = 'rejected'; onboarding.guardian.page = 'rejected'; }
  else if (action === 'approve') {
    const g = onboarding.guardian;
    if (!g.verified || !g.agreed || !g.legalRepresentative || !g.relationship) return;
    g.status = 'approved'; g.page = 'done'; g.approvedAt = Date.now();
  }
  render(false);
});

window.addEventListener('focus', () => {
  if (state.tab === 'onboarding' && onboarding.screen === 'guardian-wait') render();
});
