const routineParams = new URLSearchParams(location.search);
let routineLevel = (routineParams.get('routineLevel') ?? routineParams.get('routineWeek')) === '2' ? 2 : 1;
let routineResults = {};
let routinePlayer = null;
let routineFlowView = routineParams.get('flow') === 'workout';

function routinePlan(day = (routineLevel - 1) * 7 + state.day + 1) {
  return ROUTINE_SCHEDULE.find(plan => plan.day === day);
}

function routineDone(plan, results = routineResults) {
  return plan.items.filter(item => results[`${plan.day}-${item.order}`] === 'done').length;
}

function routineSeconds(seconds) {
  const minutes = Math.floor(seconds / 60), rest = seconds % 60;
  return `${minutes ? `${minutes}분` : ''}${rest ? ` ${rest}초` : ''}`.trim() || '0초';
}

function routineArt(item) {
  const name = item.originalName;
  let head = [105, 38], torso = 'M105 57 103 99', arms = 'M104 66 73 87M104 66 137 85', legs = 'M103 99 82 147M103 99 130 147', extra = '';
  if (/Hanging|Wall Angels|Overhead/.test(name)) {
    arms = 'M104 66 78 36 79 17M104 66 132 36 132 17';
    if (/Hanging/.test(name)) extra = '<path d="M56 14h99" stroke="#625b46" stroke-width="5" stroke-linecap="round"/>';
  } else if (/Forward|Hamstring|Bend/.test(name) && !/Side|Backbend/.test(name)) {
    head = [143, 91]; torso = 'M134 89 96 74'; arms = 'M131 91 139 129 146 147'; legs = 'M96 74 91 112 83 147M96 74 110 113 108 147';
  } else if (/Puppy|Downward/.test(name)) {
    head = [146, 126]; torso = 'M138 117 97 84'; arms = 'M138 117 161 145 176 146'; legs = 'M97 84 74 112 54 145M97 84 82 137 58 145';
  } else if (/Cobra|Sphinx|Cat-Cow/.test(name)) {
    head = [143, 87]; torso = 'M139 105 114 127 76 132'; arms = 'M136 111 146 147M136 111 129 147'; legs = 'M76 132 47 145 25 146';
  } else if (/Seated|Spinal|Ankle|Figure/.test(name)) {
    head = [106, 62]; torso = 'M106 80 103 124'; arms = 'M105 90 133 119 150 126M105 90 78 115'; legs = 'M103 124 139 145 169 145M103 124 72 142 43 145';
  } else if (/Child/.test(name)) {
    head = [145, 128]; torso = 'M133 125 98 111 81 123'; arms = 'M133 125 166 143 182 143'; legs = 'M81 123 111 145 61 145';
  } else if (/Kneeling/.test(name)) {
    head = [106, 54]; torso = 'M106 73 104 107'; arms = 'M106 81 82 106M106 81 132 106'; legs = 'M104 107 130 130 168 143M104 107 84 144 53 144';
  } else if (/Sprints|Jump/.test(name)) {
    head = [111, 38]; torso = 'M106 57 93 94'; arms = 'M104 66 135 78 152 56M104 66 75 73 62 49'; legs = 'M93 94 129 114 146 139M93 94 64 111 48 89';
  } else if (/Side/.test(name)) {
    head = [117, 46]; torso = 'M115 64 104 99'; arms = 'M115 70 94 36 67 39M115 70 143 104';
  } else if (/Pelvic|Tabletop/.test(name)) {
    head = [49, 120]; torso = 'M65 127 109 109'; arms = 'M65 127 66 148'; legs = 'M109 109 143 119 156 147';
  }
  return `<svg viewBox="0 0 210 175" role="img" aria-label="${escapeHTML(item.name)} 동작 그림"><ellipse cx="106" cy="155" rx="76" ry="7" fill="#332d26"/>${extra}<g fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="${legs}" stroke="#a7a19a" stroke-width="12"/><path d="${torso}" stroke="#b69b7b" stroke-width="21"/><path d="${arms}" stroke="#d6bda8" stroke-width="9"/></g><circle cx="${head[0]}" cy="${head[1]}" r="13" fill="#d6bda8"/><path d="M${head[0] - 12} ${head[1] - 3}a12 12 0 0 1 24 0" fill="#3b3631"/></svg>`;
}

function renderRoutineWeek(config) {
  const days = ROUTINE_SCHEDULE.filter(plan => plan.level === routineLevel);
  return `<div class="week-section routine-calendar"><div class="week-chart ${config.week}">${days.map((plan, index) => {
    const done = routineDone(plan), total = plan.items.length;
    return `<div class="chart-day" aria-hidden="true"><span class="chart-bar ${done ? '' : 'routine-empty-bar'}" style="--bar-height:${Math.max(3, done / total * 20)}px"></span></div>`;
  }).join('')}</div><div class="week-strip ${config.week}" aria-label="루틴 일차 선택">${days.map((plan, index) => `<button class="day-chip" data-day="${index}" aria-pressed="${state.day === index}" aria-label="${plan.day}일차 루틴"><span class="weekday">${WEEKDAYS[index]}</span><span class="day-number">${plan.day}</span></button>`).join('')}</div></div>`;
}

function routineLevelProgress(level = routineLevel, results = routineResults) {
  const plans = ROUTINE_SCHEDULE.filter(plan => plan.level === level);
  const done = plans.reduce((sum, plan) => sum + routineDone(plan, results), 0);
  const total = plans.reduce((sum, plan) => sum + plan.items.length, 0);
  const percent = total === 0 ? 0 : done === total ? 100 : Math.min(99, Math.round(done / total * 100));
  return { done, total, percent };
}

function renderRoutineSummary(config) {
  const plan = routinePlan();
  const seconds = plan.items.reduce((sum, item) => sum + item.seconds, 0);
  const { done, total, percent } = routineLevelProgress();
  const progressLabel = `${routineLevel}단계 전체 ${total}개 중 ${done}개 완료, ${percent}%`;
  const dayLabel = plan.day === 5 ? '오늘 루틴' : `${plan.day}일차 루틴`;
  const big = `<div class="big-number">${percent}<span class="unit">%</span></div>`;
  const count = `<span class="routine-progress-count">${done} / ${total}</span>`;
  const caption = `<div class="progress-meta"><span>${dayLabel} · ${routineSeconds(seconds)}</span></div>`;
  let metric = `<div class="routine-progress-row">${big}${count}</div>${progressLine(percent, progressLabel)}${caption}`;
  if (config.metric === 'ring') metric = `<div class="routine-progress-row"><div class="progress-ring" style="--percent:${percent}" role="img" aria-label="${progressLabel}"><div class="ring-value"><strong>${percent}%</strong></div></div>${count}</div>${caption}`;
  if (config.metric === 'score') metric = `<div class="routine-progress-row"><div class="score-number">${percent}<span>%</span></div>${count}</div>${progressLine(percent, progressLabel)}${caption}`;
  return `<section class="summary-card routine-summary" aria-label="${routineLevel}단계 전체 진행률"><div class="routine-program-heading"><h3>${routineLevel}단계</h3><span class="routine-level-status ${percent === 100 ? 'complete' : ''}">${percent === 100 ? '완료' : '진행 중'}</span></div>${metric}${renderRoutineWeek(config)}</section>`;
}

function renderRoutineBody(config) {
  const plan = routinePlan(), done = routineDone(plan);
  const resumable = routinePlayer?.day === plan.day && routinePlayer.screen === 'exercise';
  return `${renderRoutineSummary(config)}<section class="daily-section"><div class="section-heading"><h3>${plan.day === 5 ? '오늘 스트레칭' : `${plan.day}일차 스트레칭`}</h3></div><div class="action-row single ${config.cta}"><button class="cta" data-action="routine-open">${icon('workout', 18)}${done === plan.items.length ? '루틴 다시 보기' : resumable ? '이어서 하기' : '루틴 시작'}</button></div><div class="routine-list">${plan.items.map((item, index) => {
    const result = routineResults[`${plan.day}-${item.order}`];
    return `<button class="routine-card ${result === 'done' ? 'done' : ''}" data-action="routine-item" data-index="${index}" aria-label="${item.name} ${routineSeconds(item.seconds)}${result === 'done' ? ' 완료' : result === 'skipped' ? ' 건너뜀' : ''}"><span class="routine-thumbnail">${routineArt(item)}</span><span class="routine-card-copy"><strong>${item.name}</strong><span>${routineSeconds(item.seconds)}${result === 'skipped' ? ' · 건너뜀' : ''}</span></span><span class="routine-card-end" aria-hidden="true">${result === 'done' ? '✓' : '›'}</span></button>`;
  }).join('')}</div></section>${routineLevel === 1 ? `<details class="other-workouts"><summary>다른 운동 기록 <span>＋</span></summary><div class="action-row single"><button class="cta secondary" data-action="workout">${icon('pencil', 16)}직접 입력</button></div>${renderRecords()}</details>` : ''}`;
}

function routineRemaining(player = routinePlayer) {
  if (!player) return 0;
  return Math.max(0, player.remaining - (player.status === 'running' ? performance.now() - player.startedAt : 0));
}

function pauseRoutine() {
  if (routinePlayer?.status === 'running') {
    routinePlayer.remaining = routineRemaining();
    routinePlayer.status = routinePlayer.remaining > 0 ? 'paused' : 'finished';
  }
}

function openRoutine(context, index = null) {
  const plan = routinePlan();
  pauseRoutine();
  const fromList = !!routinePlayer?.showList;
  if (index !== null) {
    const same = routinePlayer?.day === plan.day && routinePlayer.index === index && routinePlayer.screen === 'exercise';
    routinePlayer = { day: plan.day, index, screen: 'detail', status: same ? routinePlayer.status : 'ready', remaining: same ? routinePlayer.remaining : plan.items[index].seconds * 1000, detailReturnToList: fromList };
  } else if (routinePlayer?.day !== plan.day || routinePlayer.screen !== 'exercise') {
    const first = Math.max(0, plan.items.findIndex(item => routineResults[`${plan.day}-${item.order}`] !== 'done'));
    routinePlayer = { day: plan.day, index: first, screen: 'preview', status: 'ready', remaining: plan.items[first].seconds * 1000 };
  }
  routineFlowView = false;
  state.dialog = { kind: 'routine', recordId: null, context };
  render();
  document.querySelector('.routine-panel .icon-button')?.focus();
}

function routineResultList(plan, results) {
  return `<div class="routine-outcome-list">${plan.items.map(item => {
    const result = results[`${plan.day}-${item.order}`];
    return `<div class="routine-outcome-row ${result === 'done' ? 'done' : ''}"><span class="routine-outcome-mark">${result === 'done' ? icon('check', 15) : result === 'skipped' ? icon('skip', 15) : '·'}</span><span>${item.name}<small>${routineSeconds(item.seconds)}</small></span><strong>${result === 'done' ? '완료' : result === 'skipped' ? '건너뜀' : '미완료'}</strong></div>`;
  }).join('')}</div>`;
}

function renderRoutineDialog(context, player = routinePlayer, results = routineResults) {
  const plan = routinePlan(player.day), item = plan.items[player.index];
  const total = plan.items.reduce((sum, row) => sum + row.seconds, 0);
  const remaining = Math.ceil(routineRemaining(player) / 1000);
  const next = plan.items[player.index + 1];
  let body, actions;
  if (player.showExit) {
    body = `<div class="routine-exit-icon">${icon('pause', 30)}</div><h4 class="routine-player-title">잠시 멈췄어요</h4><p class="routine-exit-copy">완료한 동작은 그대로 남아 있어요.<br>루틴으로 돌아가도 이어서 할 수 있어요.</p><div class="routine-exit-current"><span>현재 동작</span><strong>${item.name}</strong><small>${routineSeconds(remaining)} 남음 · ${routineDone(plan, results)}개 완료</small></div>`;
    actions = '<button class="cta" data-action="routine-continue">계속하기</button><button class="cta secondary" data-action="routine-suspend">루틴으로 돌아가기</button>';
  } else if (player.showList) {
    body = `<div class="routine-session-list"><h4>${plan.day === 5 ? '오늘의 동작' : `${plan.day}일차 동작`}</h4>${plan.items.map((row, index) => `<button data-action="routine-item" data-index="${index}" class="routine-session-item ${index === player.index ? 'current' : ''}"><span class="routine-thumbnail">${routineArt(row)}</span><span><strong>${row.name}</strong><small>${routineSeconds(row.seconds)}${results[`${plan.day}-${row.order}`] === 'skipped' ? ' · 건너뜀' : ''}</small></span><span class="routine-session-marker">${results[`${plan.day}-${row.order}`] === 'done' ? '✓' : index + 1}</span></button>`).join('')}</div>`;
    actions = '<button class="cta" data-action="routine-list-close">돌아가기</button>';
  } else if (player.screen === 'detail') {
    body = `<div class="routine-scene routine-detail-scene">${routineArt(item)}</div><p class="routine-player-eyebrow">${plan.day}일차 · ${player.index + 1}번째 동작</p><h4 class="routine-player-title">${item.name}</h4><p class="routine-detail-meta">${routineSeconds(item.seconds)}<span aria-hidden="true">·</span>${results[`${plan.day}-${item.order}`] === 'done' ? '완료' : results[`${plan.day}-${item.order}`] === 'skipped' ? '건너뜀' : '시작 전'}</p>`;
    actions = `<button class="cta" data-action="routine-detail-start">${player.status === 'paused' ? '이 동작 이어하기' : '이 동작 시작'}</button>`;
  } else if (player.screen === 'preview') {
    body = `<div class="routine-scene routine-preparation-scene">${routineArt(item)}</div><div class="routine-preparation-copy"><h4 class="routine-player-title">${plan.day === 5 ? '오늘 스트레칭을 시작할까요?' : `${plan.day}일차 스트레칭을 시작할까요?`}</h4><div class="routine-preparation-facts"><span>${plan.items.length}개 동작</span><span>${routineSeconds(total)}</span></div><p class="routine-first-label">준비되면 시작해 주세요.</p></div>`;
    actions = `<button class="cta" data-action="routine-start">스트레칭 시작</button><p class="routine-start-note">첫 동작 · ${item.name}</p>`;
  } else if (player.screen === 'summary') {
    const done = routineDone(plan, results), complete = done === plan.items.length;
    const skipped = plan.items.filter(row => results[`${plan.day}-${row.order}`] === 'skipped').length;
    const progress = routineLevelProgress(plan.level, results);
    const doneSeconds = plan.items.filter(row => results[`${plan.day}-${row.order}`] === 'done').reduce((sum, row) => sum + row.seconds, 0);
    body = `<div class="routine-finish-icon">${icon(complete ? 'check' : 'pause', 32)}</div><p class="routine-player-eyebrow">${plan.level}단계 · ${plan.day}일차</p><h4 class="routine-player-title">${complete ? (plan.day === 5 ? '오늘 루틴을 마쳤어요' : '루틴을 마쳤어요') : '여기까지 잘했어요'}</h4><div class="routine-result-count"><strong>${done}</strong> / ${plan.items.length} 동작</div><p class="routine-first-label">완료한 동작 ${routineSeconds(doneSeconds)}${skipped ? ` · ${skipped}개 건너뜀` : ''}</p><div class="routine-result-progress"><div><span>${plan.level}단계 진행률</span><strong>${progress.percent}% <small>${progress.done} / ${progress.total}</small></strong></div>${progressLine(progress.percent, `${plan.level}단계 ${progress.percent}% 완료`)}</div>${routineResultList(plan, results)}`;
    actions = `<button class="cta" data-action="${complete ? 'routine-suspend' : 'routine-resume-pending'}">${complete ? '루틴으로 돌아가기' : '남은 동작 이어하기'}</button><button class="routine-footer-link" data-action="${complete ? 'routine-home' : 'routine-suspend'}">${complete ? '홈으로' : '루틴으로 돌아가기'}</button>`;
  } else {
    const finished = player.status === 'finished';
    const controlAction = finished ? 'routine-complete' : 'routine-toggle';
    const controlLabel = finished ? (next ? '완료하고 다음' : '완료하고 결과 보기') : player.status === 'running' ? '일시정지' : player.status === 'paused' ? '계속하기' : '시작';
    body = `<div class="routine-scene routine-exercise-scene">${routineArt(item)}</div><h4 class="routine-player-title">${item.name}</h4><p class="routine-player-state ${finished ? 'finished' : ''}" role="status">${finished ? '시간을 채웠어요' : player.status === 'running' ? '진행 중' : player.status === 'paused' ? '일시정지' : '준비되면 시작해 주세요'}</p>`;
    actions = `<div class="routine-timer-position">${player.index + 1} / ${plan.items.length}</div><div class="routine-countdown" data-routine-countdown>${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}</div><div class="progress-line"><div class="progress-fill" data-routine-progress style="width:${Math.min(100, (1 - remaining / item.seconds) * 100)}%"></div></div><div class="routine-transport"><button class="routine-reset-control" data-action="routine-reset">처음부터</button><div class="routine-main-transport"><button class="routine-primary-control" data-action="${controlAction}" aria-label="${controlLabel}">${icon(finished ? 'check' : player.status === 'running' ? 'pause' : 'play', 30)}</button><span>${controlLabel}</span></div><button class="routine-skip-control" data-action="routine-skip" aria-label="건너뛰기">${icon('skip', 26)}</button></div>${player.status === 'paused' ? '<button class="routine-footer-link" data-action="routine-suspend">나중에 이어하기</button>' : ''}`;
  }
  return `<div class="phone-overlay" data-backdrop="${context}"><section class="entry-panel fullscreen routine-panel routine-training-panel ${player.screen === 'summary' ? 'routine-summary-panel' : ''}" role="dialog" aria-modal="true" aria-labelledby="routine-title-${context}"><header class="routine-training-header"><button class="icon-button" data-action="routine-back" aria-label="뒤로가기">${icon('back', 26)}</button><div><h3 id="routine-title-${context}">${player.screen === 'detail' ? '동작 상세' : player.screen === 'summary' ? '운동 결과' : '스트레칭'}</h3><p>${plan.level}단계</p></div><button class="icon-button ${player.showList ? 'active' : ''}" data-action="routine-list" aria-label="운동 목록" aria-expanded="${!!player.showList}">${icon('grid', 23)}</button></header><div class="entry-body routine-training-body">${body}</div><footer class="entry-actions routine-training-footer">${actions}</footer></section></div>`;
}

function requestRoutineBack() {
  const player = routinePlayer;
  if (!player) return false;
  if (player.showExit) player.showExit = false;
  else if (player.showList) player.showList = false;
  else if (player.screen === 'detail' && player.detailReturnToList) { player.showList = true; player.screen = 'exercise'; }
  else if (player.screen === 'exercise' && ['running', 'paused', 'finished'].includes(player.status)) {
    pauseRoutine(); player.showExit = true;
  } else return false;
  render();
  document.querySelector('.routine-panel .routine-primary-control, .routine-panel .cta, .routine-panel .icon-button')?.focus();
  return true;
}

const ROUTINE_FLOW_STAGES = [
  ['dashboard', '루틴 목록', '진행률과 오늘의 동작을 확인해요.'],
  ['detail', '동작 상세', '목록에서 동작을 누르면 열려요.'],
  ['preview', '시작 전', '전체 동작 수와 시간을 확인해요.'],
  ['running', '운동 중', '현재 동작과 남은 시간에 집중해요.'],
  ['paused', '일시정지', '계속하거나 나중에 이어갈 수 있어요.'],
  ['finished', '동작 완료', '완료를 눌러야 진행률에 반영돼요.'],
  ['summary', '루틴 완료', '오늘 결과와 단계 진행률을 확인해요.'],
  ['partial', '일부 완료', '건너뛴 동작을 다시 이어갈 수 있어요.'],
  ['exit', '중단과 복귀', '현재 위치를 남기고 루틴으로 돌아가요.'],
];

function routineFlowSample(stage) {
  const plan = routinePlan();
  const results = { ...routineResults };
  const player = { day: plan.day, index: 0, screen: 'exercise', status: 'ready', remaining: plan.items[0].seconds * 1000 };
  if (['detail', 'preview'].includes(stage)) player.screen = stage;
  if (['running', 'paused', 'exit'].includes(stage)) {
    player.status = stage === 'running' ? 'running' : 'paused';
    player.remaining *= .6; player.startedAt = performance.now();
    player.showExit = stage === 'exit';
  }
  if (stage === 'finished') { player.status = 'finished'; player.remaining = 0; }
  if (['summary', 'partial'].includes(stage)) {
    player.screen = 'summary';
    plan.items.forEach((item, index) => {
      const key = `${plan.day}-${item.order}`;
      if (stage === 'summary' || index === 0) results[key] = 'done';
      else if (index === 1) results[key] = 'skipped';
      else delete results[key];
    });
  }
  return { player, results };
}

function renderRoutineFlow() {
  return ROUTINE_FLOW_STAGES.map(([stage, title, detail], index) => {
    const { player, results } = routineFlowSample(stage);
    const content = stage === 'dashboard' ? renderPhone(state.config, `flow-${stage}`) : `<section class="device-wrap"><div class="phone" data-context="flow-${stage}" inert><div class="phone-scroll"></div>${renderRoutineDialog(`flow-${stage}`, player, results)}</div></section>`;
    return `<article class="routine-flow-step"><div class="routine-flow-heading"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${title}</h2><p>${detail}</p></div></div><div class="routine-flow-static" inert>${content}</div>${!['summary', 'partial'].includes(stage) ? `<button class="studio-button routine-flow-try" data-routine-preview="${stage}">이 화면에서 눌러보기 ↗</button>` : '<p class="routine-flow-sample-note">결과 화면은 합성 예시 · 실제 기록에는 반영되지 않아요.</p>'}</article>`;
  }).join('');
}

function nextRoutine() {
  const player = routinePlayer, plan = routinePlan(player.day);
  const next = plan.items.findIndex((item, index) => index > player.index && routineResults[`${plan.day}-${item.order}`] !== 'done');
  if (next < 0) { player.screen = 'summary'; player.status = 'ready'; }
  else { player.index = next; player.remaining = plan.items[next].seconds * 1000; player.status = 'ready'; }
  render();
  document.querySelector('.routine-panel .routine-primary-control, .routine-panel .cta')?.focus();
}

document.addEventListener('click', event => {
  const preview = event.target.closest('[data-routine-preview]');
  if (preview) {
    const stage = preview.dataset.routinePreview;
    pauseRoutine(); routineFlowView = false;
    state.tab = 'growth'; state.segment = 'workout'; state.compare = false; state.dialog = null;
    if (stage === 'dashboard') { render(); return; }
    routinePlayer = routineFlowSample(stage).player;
    state.dialog = { kind: 'routine', recordId: null, context: 'single' };
    render(); return;
  }
  const button = event.target.closest('[data-action^="routine-"]');
  if (!button) return;
  const action = button.dataset.action, context = button.closest('.phone')?.dataset.context ?? 'single';
  if (action === 'routine-flow') {
    pauseRoutine(); routineFlowView = !routineFlowView;
    state.tab = 'growth'; state.segment = 'workout'; state.compare = false; state.dialog = null;
    render(false); return;
  }
  if (action === 'routine-open') { openRoutine(context); return; }
  if (action === 'routine-back') { closeDialog(); return; }
  if (action === 'routine-item') { openRoutine(context, Number(button.dataset.index)); return; }
  const player = routinePlayer;
  if (!player) return;
  if (action === 'routine-list') { pauseRoutine(); player.showExit = false; player.showList = !player.showList; render(); return; }
  if (action === 'routine-list-close') { player.showList = false; render(); return; }
  if (action === 'routine-suspend') { pauseRoutine(); player.showExit = false; closeDialog(true); return; }
  if (action === 'routine-home') { pauseRoutine(); state.tab = 'home'; state.dialog = null; render(false); return; }
  const plan = routinePlan(player.day), item = plan.items[player.index], key = `${plan.day}-${item.order}`;
  if (['routine-start', 'routine-detail-start', 'routine-continue'].includes(action)) {
    player.screen = 'exercise'; player.showExit = false;
    if (player.remaining > 0) { player.status = 'running'; player.startedAt = performance.now(); }
    else player.status = 'finished';
  } else if (action === 'routine-resume-pending') {
    const first = plan.items.findIndex(row => routineResults[`${plan.day}-${row.order}`] !== 'done');
    if (first < 0) { closeDialog(true); return; }
    player.index = first; player.screen = 'exercise'; player.status = 'ready'; player.remaining = plan.items[first].seconds * 1000;
  } else if (action === 'routine-toggle') {
    if (player.status === 'running') pauseRoutine();
    else { player.status = 'running'; player.startedAt = performance.now(); }
  } else if (action === 'routine-reset') { player.remaining = item.seconds * 1000; player.status = 'ready'; }
  else if (action === 'routine-skip') {
    if (routineResults[key] !== 'done') routineResults[key] = 'skipped';
    nextRoutine(); return;
  } else if (action === 'routine-complete' && player.status === 'finished') {
    routineResults[key] = 'done'; nextRoutine(); return;
  }
  render();
  document.querySelector('.routine-panel .routine-primary-control, .routine-panel .cta')?.focus();
});

document.addEventListener('change', event => {
  if (!event.target.matches('[data-routine-level]')) return;
  pauseRoutine();
  routineLevel = Number(event.target.value);
  state.dialog = null;
  render(false);
});

setInterval(() => {
  if (routinePlayer?.status !== 'running' || state.dialog?.kind !== 'routine') return;
  const remaining = routineRemaining();
  const seconds = Math.ceil(remaining / 1000);
  const readout = document.querySelector('[data-routine-countdown]');
  if (readout) readout.textContent = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const progress = document.querySelector('[data-routine-progress]');
  if (progress) progress.style.width = `${Math.min(100, (1 - remaining / (routinePlan(routinePlayer.day).items[routinePlayer.index].seconds * 1000)) * 100)}%`;
  if (remaining === 0) {
    routinePlayer.remaining = 0; routinePlayer.status = 'finished';
    render();
    document.querySelector('.routine-panel .routine-primary-control, .routine-panel .cta')?.focus();
    announce('시간을 채웠어요. 완료를 눌러주세요.');
  }
}, 200);

document.addEventListener('visibilitychange', () => { if (document.hidden) { pauseRoutine(); if (state.dialog?.kind === 'routine') render(); } });
