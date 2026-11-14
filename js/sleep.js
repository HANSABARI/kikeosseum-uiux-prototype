let sleepFlowView = new URLSearchParams(location.search).get('flow') === 'sleep';
let sleepEditor = null;

function sleepTimeError(start, end) {
  const time = /^(?:[01]\d|2[0-3]):[0-5]\d$/;
  if (!time.test(start) || !time.test(end)) return '잠든 시각과 일어난 시각을 모두 입력해 주세요.';
  if (start === end) return '잠든 시각과 일어난 시각을 다르게 입력해 주세요.';
  return '';
}

function sleepDraftChanged(editor = sleepEditor) {
  return editor.draft.start !== editor.original.start || editor.draft.end !== editor.original.end;
}

function openSleepEditor(recordId, context) {
  const record = records[state.day].sleep.find(item => item.id === recordId);
  const original = { start: record?.start ?? '23:10', end: record?.end ?? '06:30' };
  sleepEditor = { day: state.day, recordId: record?.id ?? null, original, draft: { ...original }, confirm: null };
  sleepFlowView = false;
  state.dialog = { kind: 'sleep', recordId: sleepEditor.recordId, context };
  render();
  document.querySelector('.sleep-panel input')?.focus();
}

function sleepClockPreview(draft) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.start) || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(draft.end)) {
    return `<div class="sleep-clock sleep-clock-empty"><div class="sleep-clock-inner"><div class="clock-time">${icon('sleep', 20)}<strong>0시간</strong><small>수면 시간</small></div></div></div>`;
  }
  return renderSleepClock(draft.start, draft.end);
}

function sleepGoalText(draft) {
  if (sleepTimeError(draft.start, draft.end)) return `목표 ${duration(TARGETS.sleep)}`;
  return `목표 ${duration(TARGETS.sleep)} · ${Math.round(sleepDuration(draft.start, draft.end) / TARGETS.sleep * 100)}%`;
}

function renderSleepDialog(config, context, editor = sleepEditor) {
  const { draft, confirm, day } = editor;
  const date = `11월 ${9 + day}일 ${WEEKDAYS[day]}요일`;
  if (confirm) {
    const deleting = confirm === 'delete';
    return `<div class="phone-overlay" data-backdrop="${context}"><section class="entry-panel sleep-panel sleep-confirm-panel" role="dialog" aria-modal="true" aria-labelledby="sleep-confirm-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><h3 id="sleep-confirm-${context}">${deleting ? '수면 기록을 삭제할까요?' : '변경을 취소할까요?'}</h3><button class="icon-button" data-action="sleep-keep" aria-label="입력으로 돌아가기">${icon('close', 21)}</button></div><div class="entry-body"><p class="sleep-confirm-copy">${deleting ? `${date} 기록이 삭제돼요.` : '입력한 변경 사항은 저장되지 않아요.'}</p>${deleting ? `<div class="sleep-delete-summary"><strong>${duration(sleepDuration(editor.original.start, editor.original.end))}</strong><span>${editor.original.start} → ${editor.original.end}</span></div>` : ''}</div><div class="entry-actions"><button class="cta secondary" data-action="sleep-keep">${deleting ? '취소' : '계속 입력'}</button><button class="cta ${deleting ? 'sleep-confirm-delete' : ''}" data-action="${deleting ? 'sleep-delete-confirm' : 'sleep-discard'}">${deleting ? '삭제' : '변경 취소'}</button></div></section></div>`;
  }
  const error = sleepTimeError(draft.start, draft.end);
  const title = editor.recordId ? '수면 수정' : '수면 기록';
  return `<div class="phone-overlay" data-backdrop="${context}"><section class="entry-panel sleep-panel ${config.sleep === 'fullscreen' ? 'fullscreen' : ''}" role="dialog" aria-modal="true" aria-labelledby="sleep-title-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><div><h3 id="sleep-title-${context}">${title}</h3><p>${date}</p></div><button class="icon-button" data-action="close" aria-label="닫기">${icon('close', 21)}</button></div><form class="entry-body" id="sleep-form-${context}" data-form="sleep"><div class="clock-wrap" data-sleep-preview>${sleepClockPreview(draft)}</div><div class="sleep-time-fields"><label class="field"><span>${icon('sleep', 14)}잠든 시각</span><input type="time" name="start" value="${draft.start}" required aria-describedby="sleep-error-${context}"></label><span class="sleep-arrow" aria-hidden="true">→</span><label class="field"><span>${icon('sunrise', 15)}일어난 시각</span><input type="time" name="end" value="${draft.end}" required aria-describedby="sleep-error-${context}"></label></div><p class="date-span" data-date-span>${error ? '' : sleepDateSpan(draft.start, draft.end, day)}</p><p class="sleep-goal-copy" data-sleep-goal>${sleepGoalText(draft)}</p><p class="form-error" role="alert" id="sleep-error-${context}" data-form-error>${error}</p></form><div class="entry-actions">${editor.recordId ? '<button class="delete-button" data-action="sleep-delete">삭제</button>' : ''}<button type="submit" class="cta" form="sleep-form-${context}">저장</button></div></section></div>`;
}

function requestSleepClose() {
  if (!sleepEditor) return false;
  if (sleepEditor.confirm) sleepEditor.confirm = null;
  else if (sleepDraftChanged()) sleepEditor.confirm = 'discard';
  else return false;
  render();
  document.querySelector('[data-action="sleep-keep"], .sleep-panel input')?.focus();
  return true;
}

const SLEEP_FLOW_STAGES = [
  ['empty', '기록 없는 날', '오늘 수면 기록을 시작해요.'],
  ['entry', '수면 기록', '잠든 시각과 일어난 시각을 한 화면에서 입력해요.'],
  ['overnight', '수면 시간 확인', '날짜를 넘긴 수면도 입력 즉시 계산해요.'],
  ['saved', '저장 후', '수면 시간과 주간 그래프가 함께 바뀌어요.'],
  ['edit', '기록 수정', '기존 시각을 불러와 고쳐요.'],
  ['discard', '입력 취소', '입력한 변경 사항을 취소할지 선택해요.'],
  ['delete', '기록 삭제', '삭제할 날짜와 수면 시간을 확인해요.'],
  ['deleted', '삭제 후', '해당 날짜의 기록만 비워요.'],
  ['invalid', '입력 확인', '시각이 같거나 빠지면 저장 전에 알려줘요.'],
];

function sleepFlowSample(stage) {
  const existing = !['empty', 'entry', 'overnight', 'deleted', 'invalid'].includes(stage);
  const record = { id: `sleep-preview-${state.day}`, start: '23:10', end: '06:30' };
  const week = records.map((day, index) => index === state.day ? { ...day, sleep: existing ? [{ ...record }] : [] } : day);
  const original = { start: record.start, end: record.end };
  const editor = { day: state.day, recordId: existing ? record.id : null, original, draft: { ...original }, confirm: null };
  if (stage === 'overnight') editor.draft = { start: '22:30', end: '07:00' };
  if (['edit', 'discard'].includes(stage)) editor.draft = { start: '22:45', end: '06:45' };
  if (stage === 'invalid') editor.draft.end = editor.draft.start;
  if (['discard', 'delete'].includes(stage)) editor.confirm = stage;
  return { week, editor };
}

function renderSleepFlow() {
  return SLEEP_FLOW_STAGES.map(([stage, title, detail], index) => {
    const { week, editor } = sleepFlowSample(stage);
    const context = `sleep-flow-${stage}`;
    const dashboard = ['empty', 'saved', 'deleted'].includes(stage);
    const content = renderPhone(state.config, context, week, dashboard ? null : renderSleepDialog(state.config, context, editor));
    return `<article class="routine-flow-step sleep-flow-step"><div class="routine-flow-heading"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${title}</h2><p>${detail}</p></div></div><div class="routine-flow-static" inert>${content}</div><button class="studio-button routine-flow-try" data-sleep-preview="${stage}">이 화면에서 눌러보기 ↗</button></article>`;
  }).join('');
}

function renderSleepControls() {
  const active = state.tab === 'growth' && state.segment === 'sleep' && sleepFlowView;
  document.querySelector('#workbench').classList.toggle('sleep-flow', active);
  const button = document.querySelector('[data-action="sleep-flow"]');
  button.textContent = active ? '직접 기록하기 ↗' : '세부 화면 한눈에 보기 ↗';
  button.setAttribute('aria-pressed', String(active));
  if (active) {
    document.querySelector('.intro h1').textContent = '하룻밤의 수면, 기록부터 수정까지.';
    document.querySelector('.intro-copy').textContent = '9개 화면을 한눈에 보고, 원하는 상황에서 직접 기록해 보세요.';
  }
  if (state.tab === 'growth' && state.segment === 'sleep') {
    document.querySelector('#notes').innerHTML = '<div class="note-top"><p class="note-eyebrow">SLEEP</p><h2 class="note-title">한 화면에서 기록하기</h2><p class="note-description">두 시각과 총 수면 시간을 함께 보며 입력합니다.</p><div class="note-point"><span class="note-number">1</span><div><strong>바로 확인</strong><p>입력한 시각에 맞춰 수면 시간과 날짜가 바뀝니다.</p></div></div><div class="note-point"><span class="note-number">2</span><div><strong>수정과 취소</strong><p>계속 입력하면 초안을 유지하고, 변경을 취소하면 기존 기록을 유지합니다.</p></div></div><div class="note-point"><span class="note-number">3</span><div><strong>홈과 연결</strong><p>저장·수정·삭제 결과를 주간 차트와 홈에서 함께 확인합니다.</p></div></div></div><p class="prototype-note">모든 기록은 합성 데이터입니다. 새로고침하면 초기화됩니다.<br>화면 모음을 보는 것만으로 기록이 바뀌지 않습니다. 각 미리보기 버튼은 선택한 상황의 합성 기록으로 시작합니다.</p>';
  }
}

document.addEventListener('click', event => {
  const preview = event.target.closest('[data-sleep-preview]');
  if (preview) {
    const stage = preview.dataset.sleepPreview;
    const sample = sleepFlowSample(stage);
    records[state.day].sleep = sample.week[state.day].sleep;
    state.tab = 'growth'; state.segment = 'sleep'; state.compare = false; sleepFlowView = false;
    sleepEditor = sample.editor;
    state.dialog = ['empty', 'saved', 'deleted'].includes(stage) ? null : { kind: 'sleep', recordId: sleepEditor.recordId, context: 'single' };
    render(false);
    if (state.dialog) document.querySelector('.sleep-panel input, .sleep-panel button')?.focus();
    return;
  }
  const button = event.target.closest('[data-action^="sleep-"]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'sleep-flow') {
    sleepFlowView = !sleepFlowView; state.tab = 'growth'; state.segment = 'sleep'; state.compare = false; state.dialog = null; sleepEditor = null;
    render(false); return;
  }
  if (!sleepEditor || state.dialog?.kind !== 'sleep') return;
  const context = state.dialog.context;
  if (action === 'sleep-keep') {
    sleepEditor.confirm = null; render(); document.querySelector('.sleep-panel input')?.focus();
  } else if (action === 'sleep-discard') closeDialog(true);
  else if (action === 'sleep-delete') {
    sleepEditor.confirm = 'delete'; render(); document.querySelector('[data-action="sleep-keep"]')?.focus();
  } else if (action === 'sleep-delete-confirm') {
    records[sleepEditor.day].sleep = records[sleepEditor.day].sleep.filter(record => record.id !== sleepEditor.recordId);
    closeDialog(true); toast('수면 기록을 삭제했어요', context);
  }
});

document.addEventListener('input', event => {
  const form = event.target.closest('[data-form="sleep"]');
  if (!form || !sleepEditor || state.dialog?.kind !== 'sleep') return;
  sleepEditor.draft = { start: form.elements.start.value, end: form.elements.end.value };
  const draft = sleepEditor.draft, error = sleepTimeError(draft.start, draft.end);
  form.querySelector('[data-sleep-preview]').innerHTML = sleepClockPreview(draft);
  form.querySelector('[data-date-span]').textContent = error ? '' : sleepDateSpan(draft.start, draft.end, sleepEditor.day);
  form.querySelector('[data-sleep-goal]').textContent = sleepGoalText(draft);
  form.querySelector('[data-form-error]').textContent = error;
});

document.addEventListener('submit', event => {
  const form = event.target.closest('[data-form="sleep"]');
  if (!form) return;
  event.preventDefault(); event.stopImmediatePropagation();
  if (!sleepEditor || state.dialog?.kind !== 'sleep' || sleepEditor.confirm) return;
  const start = form.elements.start.value, end = form.elements.end.value;
  const error = sleepTimeError(start, end);
  if (error) { form.querySelector('[data-form-error]').textContent = error; return; }
  const items = records[sleepEditor.day].sleep;
  const id = sleepEditor.recordId ?? `demo-sleep-${nextId++}`;
  const record = { id, start, end };
  const index = items.findIndex(item => item.id === id);
  if (index >= 0) items[index] = record;
  else items.push(record);
  const context = state.dialog.context;
  closeDialog(true); toast('수면 기록을 저장했어요', context);
});
