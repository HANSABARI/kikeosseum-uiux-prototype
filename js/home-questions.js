const HOME_QUESTION_KEY = 'kikeosseum-prototype:question-exposure:v1';
const HOME_QUESTIONS = [
  { id: 'voice-change', text: '최근 목소리에 변화가 느껴지나요?', choices: ['아직 변화가 없어요', '조금 달라진 것 같아요', '잘 모르겠어요'] },
  { id: 'growth-change', text: '최근 키가 크는 속도에 변화가 느껴지나요?', choices: ['이전과 비슷해요', '전보다 빨리 크는 것 같아요', '잘 모르겠어요'] },
];
let pubertyDayOffset = 0;
let pubertyConsent = false;
let pubertyCard = { visible: false, onHome: false, index: 0, answering: false, answers: [] };
let pubertyExposureDay = '';
try {
  const stored = localStorage.getItem(HOME_QUESTION_KEY);
  if (stored && /^\d{4}-\d{2}-\d{2}$/.test(stored)) pubertyExposureDay = stored;
} catch { /* A blocked storage falls back to the current session. */ }

function pubertyDay() {
  const day = serviceDay();
  const date = new Date(`${day}T12:00:00+09:00`);
  date.setUTCDate(date.getUTCDate() + pubertyDayOffset);
  return serviceDay(date);
}

function syncHomeQuestions() {
  const eligible = state.tab === 'home' && !homeGaugeCompare && mySession === 'signed-in';
  if (!eligible) {
    pubertyCard.visible = false; pubertyCard.onHome = false;
    return;
  }
  const day = pubertyDay();
  if (pubertyCard.onHome && pubertyExposureDay === day) return;
  pubertyCard.onHome = true;
  if (pubertyExposureDay === day) return;
  pubertyExposureDay = day;
  try { localStorage.setItem(HOME_QUESTION_KEY, day); } catch { /* Keep the in-memory cap. */ }
  pubertyCard.visible = true; pubertyCard.index = 0; pubertyCard.answering = pubertyConsent; pubertyCard.answers = [];
}

function renderHomeQuestions() {
  if (!pubertyCard.visible) return '';
  const question = HOME_QUESTIONS[pubertyCard.index];
  return `<section class="home-question-section" aria-labelledby="home-question-title"><div class="home-question-heading"><h3 id="home-question-title">성장 변화 질문</h3><button data-question-action="later">나중에</button></div><div class="home-question-card"><p class="home-question-counter">${pubertyCard.index + 1} / ${HOME_QUESTIONS.length}</p><h4>${question.text}</h4>${pubertyCard.answering ? `<div class="home-question-options">${question.choices.map((choice, index) => `<button data-question-answer="${index}" data-question-id="${question.id}">${choice}</button>`).join('')}</div>` : '<button class="cta secondary" data-question-action="begin">질문 답하기</button>'}</div></section>`;
}

function renderQuestionConsent(context) {
  const stage = state.dialog.stage ?? 'consent';
  const minor = ageOn(myProfile.birthday) !== null && ageOn(myProfile.birthday) < 14;
  let title, body, footer;
  if (minor && stage === 'guardian') {
    title = '보호자의 동의를 확인해요';
    body = `<p class="my-detail-intro">성장 변화 질문 응답을 기록하는 데 동의해 주세요. 답변은 선택 사항이며 언제든 나중에 할 수 있어요.</p><button class="ob-verify-button" data-question-action="guardian-verify" ${state.dialog.verified ? 'disabled' : ''}>${state.dialog.verified ? '보호자 확인 완료' : '보호자 확인 · 시안'}</button><label class="ob-question-consent"><input type="checkbox" data-question-guardian-agreed ${state.dialog.agreed ? 'checked' : ''}>자녀의 성장 변화 질문 응답 수집·이용에 동의합니다.</label>`;
    footer = `<button class="cta" data-question-action="accept" ${state.dialog.verified && state.dialog.agreed ? '' : 'disabled'}>동의하고 답하기</button>`;
  } else {
    title = minor ? '보호자 동의가 필요해요' : '성장 변화 질문을 시작할까요?';
    body = '<p class="my-detail-intro">답변은 성장 변화 기록에 사용해요. 답하지 않아도 다른 기능을 계속 이용할 수 있어요.</p>';
    footer = minor ? '<button class="cta" data-question-action="guardian">보호자 동의 화면 보기</button>' : '<button class="cta" data-question-action="accept">동의하고 답하기</button>';
  }
  return `<div class="phone-overlay"><section class="entry-panel" role="dialog" aria-modal="true" aria-labelledby="question-consent-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><h3 id="question-consent-${context}">${title}</h3><button class="icon-button" data-action="close" aria-label="닫기">${icon('close', 21)}</button></div><div class="entry-body">${body}</div><div class="entry-actions"><button class="cta secondary" data-question-action="later">나중에</button>${footer}</div></section></div>`;
}

function renderQuestionControls() {
  document.querySelector('#question-controls').innerHTML = `<p class="panel-caption">홈 질문 · 하루 한 번</p><div class="photo-preview-buttons"><button data-question-preview="today">오늘 질문 다시 보기</button><button data-question-preview="next-day">다음 날 가정</button><button data-question-preview="hidden">오늘은 닫힌 상태</button></div><p class="home-inspector-note">첫 홈 노출 날짜만 브라우저에 보관합니다. 답변·미루기·홈 이탈·새로고침 뒤에는 같은 날 다시 표시하지 않습니다. 위 버튼은 시안 확인을 위해 이 제한을 초기화하거나 날짜를 바꿉니다. 응답은 메모리의 예시이며 예측값을 바꾸지 않습니다.</p>`;
}

document.addEventListener('change', event => {
  if (!event.target.matches('[data-question-guardian-agreed]') || state.dialog?.kind !== 'question') return;
  state.dialog.agreed = event.target.checked;
  const accept = document.querySelector('[data-question-action="accept"]');
  if (accept) accept.disabled = !(state.dialog.verified && state.dialog.agreed);
});

document.addEventListener('click', event => {
  const preview = event.target.closest('[data-question-preview]');
  if (preview) {
    const kind = preview.dataset.questionPreview;
    if (kind === 'next-day') pubertyDayOffset++;
    if (kind === 'today') pubertyDayOffset = 0;
    pubertyCard.onHome = false; pubertyCard.visible = false;
    pubertyExposureDay = kind === 'hidden' ? pubertyDay() : '';
    try { if (pubertyExposureDay) localStorage.setItem(HOME_QUESTION_KEY, pubertyExposureDay); else localStorage.removeItem(HOME_QUESTION_KEY); } catch { /* The preview also works with memory. */ }
    state.tab = 'home'; state.dialog = null; homeGaugeCompare = false;
    render(false); return;
  }
  const answer = event.target.closest('[data-question-answer]');
  if (answer && pubertyCard.visible && pubertyCard.answering && pubertyConsent && answer.dataset.questionId === HOME_QUESTIONS[pubertyCard.index].id) {
    const index = Number(answer.dataset.questionAnswer);
    if (!HOME_QUESTIONS[pubertyCard.index].choices[index]) return;
    pubertyCard.answers.push({ questionId: HOME_QUESTIONS[pubertyCard.index].id, choice: index });
    if (pubertyCard.index + 1 < HOME_QUESTIONS.length) pubertyCard.index++;
    else { pubertyCard.visible = false; render(); toast('오늘 질문에 답했어요', 'single'); return; }
    render(); document.querySelector('[data-question-answer]')?.focus(); return;
  }
  const button = event.target.closest('[data-question-action]');
  if (!button) return;
  const action = button.dataset.questionAction;
  const context = button.closest('.phone')?.dataset.context ?? 'single';
  if (action === 'later') { pubertyCard.visible = false; state.dialog = null; render(); return; }
  if (action === 'begin') {
    if (pubertyConsent) { pubertyCard.answering = true; render(); return; }
    state.dialog = { kind: 'question', stage: 'consent', context, returnAction: null }; render(); document.querySelector('[data-question-action="accept"], [data-question-action="guardian"]')?.focus(); return;
  }
  if (state.dialog?.kind !== 'question') return;
  if (action === 'guardian') { state.dialog.stage = 'guardian'; render(); }
  else if (action === 'guardian-verify') {
    state.dialog.verified = true; button.disabled = true; button.textContent = '보호자 확인 완료';
    const accept = document.querySelector('[data-question-action="accept"]');
    if (accept) accept.disabled = !state.dialog.agreed;
  } else if (action === 'accept') {
    const minor = ageOn(myProfile.birthday) !== null && ageOn(myProfile.birthday) < 14;
    if (minor && !(state.dialog.stage === 'guardian' && state.dialog.verified && state.dialog.agreed)) return;
    pubertyConsent = true; pubertyCard.answering = true; state.dialog = null; render(); document.querySelector('[data-question-answer]')?.focus();
  }
});
