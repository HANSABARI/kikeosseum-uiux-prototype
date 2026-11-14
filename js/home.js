let homeExample = 0;
const HOME_GAUGE_STYLES = {
  original: { name: '기존 도넛', detail: '선택한 안 · 7분절과 작은 상단 표식' },
  halo: { name: '은은한 후광 원안', detail: '직전에 만든 후광을 그대로 유지' },
  'halo-tuned': { name: '은은한 후광 수정안', detail: '7분절 테두리 강조 · 후광은 조금 약하게' },
};
const homeGaugeParams = new URLSearchParams(location.search);
let homeGaugeStyle = Object.hasOwn(HOME_GAUGE_STYLES, homeGaugeParams.get('gauge')) ? homeGaugeParams.get('gauge') : 'original';
let homeGaugeCompare = homeGaugeParams.get('gaugeCompare') === '1';
const HOME_SAMPLES = [
  { current: 170, adult: '176.0', future: [174, 175.5, 176] },
  { current: 174, adult: '178.6', future: [177, 178.2, 178.6] },
];

let homePrediction = { status: 'sample', step: 7, result: null, requests: 0 };
let homePredictionTimer = null;
let homePredictionGeneration = 0;

function predictionSample(status = 'ready') {
  return { status, step: status === 'pending' ? 2 : 7, result: status === 'ready' ? { ...HOME_SAMPLES[homeExample] } : null, requests: 1 };
}

function startHomePrediction(input, fail = false) {
  if (mySession !== 'signed-in') return false;
  if (homePredictionTimer !== null) clearTimeout(homePredictionTimer);
  const generation = ++homePredictionGeneration;
  homePrediction = { status: 'pending', step: 0, result: null, requests: homePrediction.requests + 1, input: { ...input }, account: myProfile.email, outcome: fail ? 'error' : 'ready' };
  const sample = { ...HOME_SAMPLES[homeExample] };
  const advance = () => {
    if (generation !== homePredictionGeneration) return;
    homePrediction.step++;
    if (homePrediction.step >= 7) {
      homePrediction.status = homePrediction.outcome;
      homePrediction.result = homePrediction.status === 'ready' ? sample : null;
      homePredictionTimer = null;
    } else homePredictionTimer = setTimeout(advance, 350);
    if (state.tab === 'home') render();
  };
  homePredictionTimer = setTimeout(advance, 350);
  return true;
}

function resetHomePredictionSample() {
  if (homePredictionTimer !== null) clearTimeout(homePredictionTimer);
  homePredictionTimer = null; homePredictionGeneration++;
  homePrediction = { status: 'sample', step: 7, result: null, requests: 0 };
}

function predictionVisible(prediction = homePrediction) {
  return ['sample', 'ready'].includes(prediction.status);
}

function homeGrowthContent(prediction = homePrediction) {
  if (predictionVisible(prediction)) return `<div class="home-chart-card">${homeChart(prediction)}<div class="home-chart-legend"><span>기록 예시</span><span>예측 예시</span></div></div>`;
  return `<div class="home-chart-card home-prediction-placeholder"><span class="home-prediction-skeleton" aria-hidden="true"></span><p>${prediction.status === 'error' ? '분석이 완료되면 성장 흐름을 볼 수 있어요.' : '분석 결과를 기다리고 있어요.'}</p></div>`;
}

function renderBottomNav(tab) {
  return `<nav class="app-bottom-nav" aria-label="앱 내 위치"><button data-tab="home" class="${tab === 'home' ? 'active' : ''}" ${tab === 'home' ? 'aria-current="page"' : ''}>${icon('home', 19)}홈</button><button data-tab="growth" class="${tab === 'growth' ? 'active' : ''}" ${tab === 'growth' ? 'aria-current="page"' : ''}>${icon('growth', 20)}성장</button><button data-tab="report" class="${tab === 'report' ? 'active' : ''}" ${tab === 'report' ? 'aria-current="page"' : ''}>${icon('report', 19)}리포트</button><button data-tab="my" class="${tab === 'my' ? 'active' : ''}" ${tab === 'my' ? 'aria-current="page"' : ''}>${icon('user', 19)}내 정보</button></nav>`;
}

function homeDonutSegment(start, end, corner = 3) {
  const outer = 127, inner = 102;
  const point = (radius, angle) => {
    const radians = angle * Math.PI / 180;
    return `${(140 + radius * Math.cos(radians)).toFixed(3)} ${(140 + radius * Math.sin(radians)).toFixed(3)}`;
  };
  const outerCorner = corner / outer * 180 / Math.PI;
  const innerCorner = corner / inner * 180 / Math.PI;
  return `M${point(outer - corner, start)} Q${point(outer, start)} ${point(outer, start + outerCorner)} A${outer} ${outer} 0 0 1 ${point(outer, end - outerCorner)} Q${point(outer, end)} ${point(outer - corner, end)} L${point(inner + corner, end)} Q${point(inner, end)} ${point(inner, end - innerCorner)} A${inner} ${inner} 0 0 0 ${point(inner, start + innerCorner)} Q${point(inner, start)} ${point(inner + corner, start)} Z`;
}

function homeGauge(mode = homeGaugeStyle, prediction = homePrediction) {
  const sample = prediction.result ?? HOME_SAMPLES[homeExample];
  const pending = prediction.status === 'pending', failed = prediction.status === 'error';
  const center = pending ? `<p>성인 예상 키</p><div class="home-prediction-pending"><strong>분석 중</strong></div><span class="home-prediction-status" role="status">잠시만 기다려 주세요.</span>` : failed ? `<p>성인 예상 키</p><div class="home-prediction-pending"><strong>다시 시도해 주세요</strong></div><button class="home-prediction-retry" data-action="home-prediction-retry">분석 다시 요청</button>` : `<p>성인 예상 키 <span class="home-example-tag">예시</span></p><div><strong>${sample.adult}</strong><span>cm</span></div><button class="home-accuracy" data-action="home-prediction-info"><span>예시 정확도</span><strong>86%</strong>${icon('info', 14)}</button>`;
  return `<div class="home-prediction-gauge gauge-${mode} ${pending ? 'prediction-pending' : ''}"><svg viewBox="0 0 280 280" aria-hidden="true">${Array.from({ length: 7 }, (_, i) => `<path class="home-donut-segment ${i === 0 || i === 6 ? 'top-segment' : ''} ${pending && i < prediction.step ? 'prediction-done' : ''}" d="${homeDonutSegment(-90 + i * 360 / 7 + 1.4, -90 + (i + 1) * 360 / 7 - 1.4)}"/>`).join('')}${pending || failed ? '' : `<path class="home-donut-marker" d="${homeDonutSegment(-88.6, -85.2, 1.3)}"/>`}</svg><div class="home-prediction-value">${center}</div></div>`;
}

function homeChart(prediction = homePrediction) {
  const sample = { ...(prediction.result ?? HOME_SAMPLES[homeExample]), current: latestMeasurement().height };
  const heights = [158, 164, sample.current, ...sample.future];
  const low = Math.min(150, ...heights.map(height => height - 4));
  const high = Math.max(190, ...heights.map(height => height + 4));
  const chartY = height => 140 - (height - low) / (high - low) * 132;
  const points = heights.map((height, i) => ({ x: 35 + i * 51, y: chartY(height) }));
  const path = (list) => list.map((p, i) => `${i ? 'L' : 'M'}${p.x} ${p.y}`).join(' ');
  return `<svg class="home-growth-chart" viewBox="0 0 320 170" role="img" aria-label="고정 예시 성장 흐름. 14세 158cm, 15세 164cm, 현재 16세 ${sample.current}cm, 성인 예상 키 ${sample.adult}cm.">${[160, 170, 180].map(height => `<path d="M28 ${chartY(height)}H308" stroke="var(--border)" stroke-width="1"/><text x="0" y="${chartY(height) + 4}" fill="var(--dim)" font-size="8">${height}</text>`).join('')}<path d="${path(points.slice(0, 3))}" fill="none" stroke="var(--accent)" stroke-width="3" stroke-linecap="round"/><path d="${path(points.slice(2))}" fill="none" stroke="var(--accent-bright)" stroke-dasharray="5 5" stroke-width="2"/>${points.slice(0, 3).map((p, i) => `<circle cx="${p.x}" cy="${p.y}" r="${i === 2 ? 5 : 3}" fill="var(--accent)"/>`).join('')}<circle cx="${points[5].x}" cy="${points[5].y}" r="4" fill="var(--accent-bright)"/><text x="${points[2].x}" y="${points[2].y - 12}" fill="var(--text)" font-size="9" text-anchor="middle">지금 ${sample.current}cm</text>${[14, 15, 16, 17, 18, 19].map((age, i) => `<text x="${points[i].x}" y="163" fill="var(--dim)" font-size="9" text-anchor="middle">${age}세</text>`).join('')}</svg>`;
}

function homeStatistics() {
  const sleep = records[4].sleep[0];
  const minutes = sleep ? sleepDuration(sleep.start, sleep.end) : 0;
  const meals = records[4].meal;
  const energy = nutrientTotal(meals, 'energy') ?? 0;
  const level = routineLevelProgress();
  const cards = [
    { segment: 'sleep', label: '수면', detail: `수면 시간 · ${duration(minutes)}`, percent: Math.round(minutes / TARGETS.sleep * 100), progress: '수면 목표 대비', footer: `목표 ${duration(TARGETS.sleep)}` },
    { segment: 'meal', label: '식사', detail: `오늘 ${meals.length}끼 · ${number(energy)} kcal`, percent: Math.round(energy / TARGETS.energy * 100), progress: '칼로리 목표 대비', footer: `목표 ${number(TARGETS.energy)} kcal` },
    { segment: 'workout', label: '운동', detail: `${routineLevel}단계 · ${level.done} / ${level.total} 동작 완료`, percent: level.percent, progress: '단계 전체 진행률', footer: level.percent === 100 ? '단계 완료' : '스트레칭 이어보기' },
  ];
  return `<section class="home-statistics"><div class="section-heading"><h3>성장 입력</h3></div><div class="home-stat-list">${cards.map(card => `<button class="home-stat-card" data-action="home-stat" data-home-segment="${card.segment}"><span class="home-stat-header"><span class="home-stat-icon">${icon(card.segment, 26)}</span><span class="home-stat-copy"><span class="home-stat-title-row"><strong>${card.label}</strong><span class="home-stat-percent" aria-label="${card.progress} ${card.percent}%">${card.percent}%</span></span><span class="home-stat-detail">${card.detail}</span></span><span class="home-stat-arrow" aria-hidden="true">${icon('back', 20)}</span></span><span class="home-stat-progress"><span class="home-stat-progress-fill" style="width:${Math.min(100, card.percent)}%"></span><span>${card.footer}</span></span></button>`).join('')}</div></section>`;
}

function renderHomePhone(context = 'single', gauge = homeGaugeStyle, prediction = homePrediction) {
  const sample = HOME_SAMPLES[homeExample];
  const isModal = state.dialog?.context === context;
  const inert = isModal ? 'inert' : '';
  return `<section class="device-wrap"><div class="device-caption"><strong>홈 · ${HOME_GAUGE_STYLES[gauge].name}</strong><span>11.13 금요일</span></div><div class="phone home-phone" data-context="${context}"><div class="status-bar" ${inert}><span>9:41</span><span class="status-icons">${icon('signal', 13)}${icon('wifi', 14)}${icon('battery', 18)}</span></div><main class="phone-scroll home-scroll" ${inert}><header class="home-header"><button class="home-header-button" data-tab="my" aria-label="내 정보">${icon('user', 22)}</button><h2>키컸으면<span></span></h2><span aria-hidden="true"></span></header><section class="home-prediction-hero"><button class="home-update" data-action="home-prediction-info">${icon('timer', 13)}${prediction.status === 'pending' ? '예상 키 분석 중' : prediction.status === 'error' ? '분석을 다시 요청해 주세요' : '다음 업데이트 · 6일 23시간'}</button>${homeGauge(gauge, prediction)}</section><button class="cta home-share" data-action="home-share" ${predictionVisible(prediction) ? '' : 'disabled'}>${icon('share', 18)}공유 미리보기</button>${context === 'single' ? renderHomeQuestions() : ''}<section class="home-growth-section"><div class="section-heading"><h3>성장 흐름</h3></div>${homeGrowthContent(prediction)}</section>${homeStatistics()}</main><div ${inert}>${renderBottomNav('home')}</div><div class="home-indicator" ${inert}></div>${isModal ? renderHomeDialog(context) : ''}</div></section>`;
}

function renderHomeDialog(context) {
  if (state.dialog.kind === 'question') return renderQuestionConsent(context);
  const sample = homePrediction.result ?? HOME_SAMPLES[homeExample];
  const topic = state.dialog.topic;
  const titles = { prediction: '예시 데이터 안내', share: '공유 미리보기' };
  const bodies = {
    prediction: '<p class="home-sheet-copy">키·성장 그래프·정확도·갱신 시간은 화면 확인을 위한 고정 예시입니다. 예측 서비스와 연결되어 있지 않습니다.</p>',
    share: `<div class="home-share-card"><span>키컸으면</span><p>성인 예상 키 · 예시</p><strong>${sample.adult}<small>cm</small></strong><p>가상 데이터 미리보기</p></div><p class="home-sheet-copy">이 카드는 예시이며 외부로 공유하지 않습니다.</p>`,
  };
  return `<div class="phone-overlay"><section class="entry-panel" role="dialog" aria-modal="true" aria-labelledby="home-sheet-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><h3 id="home-sheet-${context}">${titles[topic]}</h3><button class="icon-button" data-action="close" aria-label="닫기">${icon('close', 21)}</button></div><div class="entry-body">${bodies[topic]}</div><div class="entry-actions"><button class="cta" data-action="close">닫기</button></div></section></div>`;
}

function renderHomeControls() {
  document.querySelector('#home-controls').innerHTML = `<p class="panel-caption">원형 후광 비교</p><div class="home-gauge-options">${Object.entries(HOME_GAUGE_STYLES).map(([key, option]) => `<button data-home-gauge="${key}" aria-pressed="${homeGaugeStyle === key}"><strong>${option.name}</strong><span>${option.detail}</span></button>`).join('')}</div><button class="studio-button home-gauge-compare" data-action="home-gauge-compare" aria-pressed="${homeGaugeCompare}">${homeGaugeCompare ? '한 안씩 보기' : '세 안 나란히 비교'} ↗</button><p class="panel-caption">가입 후 분석 · 시안</p><div class="photo-preview-buttons"><button data-prediction-preview="pending">홈 분석 대기</button><button data-prediction-preview="ready">홈 결과</button><button data-prediction-preview="error">분석 실패</button></div><p class="panel-caption">홈 · 고정 예시</p><div class="home-example-options">${['기본 예시 · 170cm', '키 변경 예시 · 174cm'].map((label, index) => `<button data-home-example="${index}" aria-pressed="${homeExample === index}">${label}</button>`).join('')}</div><p class="home-inspector-note">키·성장선은 현재 앱의 고정 예시이며, 신체·생활 기록도 합성 데이터입니다. 정확도는 실제 예측 성능이 아닙니다.</p><button class="studio-button" data-tab="growth">성장 화면으로 이동 ↗</button>`;
  document.querySelector('#notes').innerHTML = '<div class="note-top"><p class="note-eyebrow">HOME</p><h2 class="note-title">예상 키를 중심으로</h2><p class="note-description">원형 예상 키와 성장 흐름 아래에 수면·식사·운동 입력을 세로 카드로 배치했습니다.</p><div class="note-point"><span class="note-number">1</span><div><strong>예상 키</strong><p>7일 업데이트 주기를 표현하는 도넛의 후광을 비교합니다. 시간 표시는 현재 고정 시안입니다.</p></div></div><div class="note-point"><span class="note-number">2</span><div><strong>성장 흐름</strong><p>기록과 예측 예시를 실선·점선으로 나눕니다.</p></div></div><div class="note-point"><span class="note-number">3</span><div><strong>성장 입력</strong><p>성장 탭과 같은 합성 기록을 읽고 해당 세그먼트로 이동합니다.</p></div></div></div><div class="recommendation"><small>현재 색상</small><p>다크 배경과 샌드베이지 포인트를 유지했습니다. 원래 Earth-Tone 컬러셋도 별도 보관되어 있습니다.</p></div>';
}

document.addEventListener('click', event => {
  const gauge = event.target.closest('[data-home-gauge]');
  if (gauge) { homeGaugeStyle = gauge.dataset.homeGauge; homeGaugeCompare = false; render(); document.querySelector(`[data-home-gauge="${homeGaugeStyle}"]`)?.focus(); return; }
  const example = event.target.closest('[data-home-example]');
  if (example) { resetHomePredictionSample(); homeExample = Number(example.dataset.homeExample); bodyMeasurements[0].height = HOME_SAMPLES[homeExample].current; render(); return; }
  const button = event.target.closest('[data-action^="home-"]');
  if (!button) return;
  const action = button.dataset.action;
  if (action === 'home-prediction-retry') { startHomePrediction(homePrediction.input ?? {}); render(); return; }
  if (action === 'home-gauge-compare') { homeGaugeCompare = !homeGaugeCompare; render(); document.querySelector('[data-action="home-gauge-compare"]')?.focus(); return; }
  if (action === 'home-stat') {
    state.tab = 'growth'; state.segment = button.dataset.homeSegment; state.day = 4; state.dialog = null;
    render(false); return;
  }
  const topic = { 'home-prediction-info': 'prediction', 'home-share': 'share' }[action];
  if (topic) {
    state.dialog = { kind: 'home', topic, context: button.closest('.phone')?.dataset.context ?? 'single', returnAction: action };
    render();
    document.querySelector('.home-phone .entry-panel .icon-button')?.focus();
  }
});

document.addEventListener('click', event => {
  const button = event.target.closest('[data-prediction-preview]');
  if (!button) return;
  mySession = 'signed-in'; resetHomePredictionSample();
  const status = button.dataset.predictionPreview;
  if (status === 'pending') startHomePrediction({});
  else homePrediction = predictionSample(status);
  state.tab = 'home'; state.dialog = null; homeGaugeCompare = false; render(false);
});
