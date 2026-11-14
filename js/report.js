const REPORT_METRICS = {
  growth: { title: '성장 진행률', glyph: 'growth', copy: '성장 과정이 얼마나 진행되었는지 보여주는 지표예요. 나이를 바탕으로 추정하는 항목이며, 실제로 자란 키의 비율과는 의미가 달라요.' },
  percentile: { title: '또래 키 비교', glyph: 'user', copy: '같은 나이의 또래를 키가 큰 순서로 비교했을 때의 위치예요. 상위 27%는 키가 큰 쪽에서 27% 범위에 해당한다는 뜻이에요. 현재 순위는 시연용 예시예요.' },
  goal: { title: '목표 키', glyph: 'growth', copy: '내가 설정한 목표 키와 현재 키의 차이예요. 목표 키는 내 정보에서 바꿀 수 있어요.' },
  probability: { title: '목표 도달 가능성', glyph: 'report', copy: '목표 키에 도달할 가능성을 보여줘요. 현재의 40%와 낮음 표시는 시연용 예시예요.' },
  potential: { title: '습관을 가정한 키', glyph: 'leaf', copy: '좋은 생활 습관을 가정했을 때 현재의 키가 어떨지 보여주는 개념이에요. 성인 예상 키와는 의미가 달라요. 표시한 수치는 시연용 예시예요.' },
  change: { title: '최근 키 변화', glyph: 'growth', copy: '최근 30일 동안 측정한 키의 변화를 보여줘요. 비교할 측정 기록이 쌓이면 변화를 돌아볼 수 있어요. 기록 부족은 실제 성장량이 0이라는 뜻이 아니에요.' },
};
const reportParams = new URLSearchParams(location.search);
let reportFlowView = reportParams.get('flow') === 'report';
let reportDesign = reportParams.get('reportDesign') === 'classic' ? 'classic' : 'focus';
const REPORT_DESIGNS = { classic: '기존 카드', focus: '강조와 차트' };
let reportState = { scenario: ['empty', 'recorded'].includes(reportParams.get('reportScenario')) ? reportParams.get('reportScenario') : 'sample', weekly: 'idle' };
let reportAnalysisTimer = null;
let reportAnalysisRevision = 0;

function reportSample(scenario = reportState.scenario) {
  const current = latestMeasurement().height, goal = myProfile.goalHeight;
  const days = scenario === 'empty' ? { sleep: 0, meals: 0, workout: 0 } : scenario === 'recorded' ? { sleep: 5, meals: 6, workout: 4 } : { sleep: 1, meals: 2, workout: 2 };
  return { current, goal, gap: Math.max(0, goal - current), progress: 76, topPercent: 27, probability: 40, potential: current + 4, change: scenario === 'recorded' ? .5 : 0, age: ageOn(myProfile.birthday), days, scenario };
}

function reportMetricValue(key, sample) {
  const cm = value => `<strong>${number(value)}</strong><span>cm</span>`;
  if (key === 'growth') return { value: `<strong>${sample.progress}</strong><span>%</span>`, detail: '성장 진행 추정', extra: `<div class="report-mini-progress" aria-label="성장 진행률 예시 ${sample.progress}%"><i style="width:${sample.progress}%"></i></div>` };
  if (key === 'percentile') return { value: `<span class="report-rank-prefix">상위</span><strong>${sample.topPercent}</strong><span>%</span>`, detail: `${sample.age === null ? '같은 나이의 또래' : `만 ${sample.age}세 또래`} 기준` };
  if (key === 'goal') return { value: cm(sample.goal), detail: `목표까지 ${number(sample.gap)}cm` };
  if (key === 'probability') return { value: '<strong class="report-word-value">낮음</strong>', detail: `${sample.probability}% · 예시` };
  if (key === 'potential') return { value: cm(sample.potential), detail: '좋은 습관을 가정한 현재 키' };
  return { value: `<strong>${sample.change ? '+' : ''}${number(sample.change)}</strong><span>cm</span>`, detail: `최근 30일${sample.change ? '' : ' · 비교 기록 부족'}` };
}

function reportClassicContent(sample) {
  return `<header class="report-header"><div><p>나의 성장 돌아보기</p><h2>리포트</h2></div><span class="report-example-tag">시연용 예시</span></header><section class="report-overview"><div class="report-overview-heading"><span>${icon('growth', 17)}성장 상태</span><small>오늘 기준</small></div><div class="report-metric-grid">${Object.entries(REPORT_METRICS).map(([key, metric]) => { const data = reportMetricValue(key, sample); return `<article class="report-metric"><div class="report-metric-top"><span>${icon(metric.glyph, 22)}</span><button class="report-info-button" data-report-info="${key}" aria-label="${metric.title} 설명">${icon('info', 16)}</button></div><h3>${metric.title}</h3><div class="report-metric-value">${data.value}</div><p>${data.detail}</p>${data.extra ?? ''}</article>`; }).join('')}</div></section><button class="report-timing-card" data-report-info="timing"><span class="report-timing-icon">${icon('timer', 25)}</span><span><small>성장 시기</small><strong>${sample.scenario === 'recorded' ? '나의 성장 리듬 알아보기' : '사춘기 질문으로 알아봐요'}</strong><span>성장 시기 안내 보기</span></span><span class="report-card-arrow">${icon('back', 19)}</span></button><section class="report-weekly-card"><span class="report-weekly-mark">${icon('report', 25)}</span><p>한 주를 돌아보는</p><h3>주간 요약</h3><div class="report-weekly-copy">${sample.scenario === 'empty' ? '첫 기록부터 시작해 보세요.<br>나의 한 주가 차곡차곡 쌓여요.' : '이어온 습관은 계속하고,<br>놓친 기록은 하나씩 채워봐요.'}</div><div class="report-weekly-counts">${[['sleep', '수면'], ['meals', '식사'], ['workout', '운동']].map(([key, label]) => `<span>${label}<strong>${sample.days[key]}<small> / 7일</small></strong></span>`).join('')}</div><button class="cta" data-report-action="weekly">${icon('report', 17)}AI 분석 미리보기</button></section>`;
}

function reportInfoButton(key) {
  return `<button class="report-info-button" data-report-info="${key}" aria-label="${REPORT_METRICS[key].title} 설명">${icon('info', 16)}</button>`;
}

function reportFocusedContent(sample) {
  const dots = Array.from({ length: 100 }, (_, index) => `<i class="${index < sample.topPercent ? 'filled' : ''}"></i>`).join('');
  const ticks = Array.from({ length: 19 }, (_, index) => `<i class="${index % 3 === 0 ? 'major' : ''}"></i>`).join('');
  const changePath = sample.change ? 'M4 42L35 39L65 34L95 23L130 14' : 'M4 37H130';
  const days = [['sleep', '수면', 'sleep'], ['meals', '식사', 'meal'], ['workout', '운동', 'workout']];
  return `<header class="report-header"><div><p>나의 성장 돌아보기</p><h2>리포트</h2></div><span class="report-example-tag">시연용 예시</span></header>
    <section class="report-growth-hero report-metric"><div class="report-hero-heading"><span>${icon('growth', 18)}성장 진행률</span>${reportInfoButton('growth')}</div><div class="report-hero-body"><div><div class="report-hero-number"><strong>${sample.progress}</strong><span>%</span></div><span class="report-hero-note">나이를 바탕으로 한 진행 추정</span></div><svg class="report-growth-arc" viewBox="0 0 160 115" aria-hidden="true"><path class="arc-base" d="M20 85a60 60 0 0 1 120 0"/><path class="arc-value" d="M20 85a60 60 0 0 1 120 0" pathLength="100" stroke-dasharray="${sample.progress} 100"/><path class="arc-inner" d="M34 85a46 46 0 0 1 92 0"/><path class="arc-ticks" d="M5 85h8m134 0h8M80 10v8m-53 8 5 5m96 0 5-5"/><text x="80" y="83" text-anchor="middle">GROWTH</text></svg></div><div class="report-hero-footer"><span>현재 키<strong>${number(sample.current)}<small>cm</small></strong></span><span>목표까지<strong>${number(sample.gap)}<small>cm</small></strong></span><span>기준 나이<strong>${sample.age === null ? '0' : sample.age}<small>세</small></strong></span></div></section>
    <section class="report-visual-grid"><article class="report-metric report-peer-card"><div class="report-visual-heading"><h3>또래 키 비교</h3>${reportInfoButton('percentile')}</div><div class="report-metric-value"><span class="report-rank-prefix">상위</span><strong>${sample.topPercent}</strong><span>%</span></div><p>같은 나이의 또래 기준</p><div class="report-peer-dots" aria-hidden="true">${dots}</div><span class="report-chart-caption">또래 100명 기준 예시</span></article>
    <article class="report-metric report-goal-card"><div class="report-visual-heading"><h3>목표 키</h3>${reportInfoButton('goal')}</div><div class="report-metric-value"><strong>${number(sample.goal)}</strong><span>cm</span></div><p>${number(sample.gap)}cm 더 가까워지고 싶어요</p><div class="report-height-ruler" aria-hidden="true">${ticks}<span></span></div><div class="report-ruler-labels"><span>현재 ${number(sample.current)}</span><strong>목표 ${number(sample.goal)}</strong></div></article></section>
    <article class="report-probability-card report-metric"><div class="report-probability-heading"><h3>목표 도달 가능성</h3><span>낮음</span>${reportInfoButton('probability')}</div><div class="report-probability-line"><div aria-label="목표 도달 가능성 예시 ${sample.probability}%"><i style="width:${sample.probability}%"></i></div><strong>${sample.probability}<small>%</small></strong></div></article>
    <section class="report-visual-grid report-secondary-grid"><article class="report-metric report-potential-card"><div class="report-visual-heading"><h3>습관을 가정한 키</h3>${reportInfoButton('potential')}</div><div class="report-metric-value"><strong>${number(sample.potential)}</strong><span>cm</span></div><div class="report-potential-foot"><span>${icon('leaf', 14)}좋은 습관을 가정한 현재 키</span><strong>+${number(sample.potential - sample.current)}cm</strong></div></article>
    <article class="report-metric report-change-card"><div class="report-visual-heading"><h3>최근 키 변화</h3>${reportInfoButton('change')}</div><div class="report-metric-value"><strong>${sample.change ? '+' : ''}${number(sample.change)}</strong><span>cm</span></div><svg class="report-change-chart ${sample.change ? 'has-change' : ''}" viewBox="0 0 136 53" aria-hidden="true"><path class="change-grid" d="M4 13H130M4 37H130"/><path class="change-line" d="${changePath}"/><circle cx="130" cy="${sample.change ? '14' : '37'}" r="3"/></svg><span class="report-chart-caption">최근 30일${sample.change ? '' : ' · 비교 기록 부족'}</span></article></section>
    <button class="report-timing-card report-timing-visual" data-report-info="timing"><span class="report-timing-icon">${icon('timer', 25)}</span><span><small>성장 시기</small><strong>나의 성장 리듬은 어떨까요?</strong><span class="report-timing-scale" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></span></span><span class="report-card-arrow">${icon('back', 19)}</span></button>
    <section class="report-habit-overview"><div class="report-section-heading"><h3>이번 주의 기록</h3><span class="report-count">7일 중 기록한 날</span></div>${days.map(([key, label, glyph]) => `<div class="report-habit-row habit-${key}"><span class="report-habit-icon">${icon(glyph, 17)}</span><span>${label}</span><div class="report-habit-dots" aria-hidden="true">${Array.from({ length: 7 }, (_, index) => `<i class="${index < sample.days[key] ? 'filled' : ''}"></i>`).join('')}</div><strong>${sample.days[key]}<small>/7</small></strong></div>`).join('')}</section>
    
    <section class="report-weekly-card report-weekly-focus"><div class="report-weekly-top"><span>${icon('report', 18)}WEEKLY REPORT</span><span>예시</span></div><h3>작은 습관이 모여<br>나의 한 주가 돼요.</h3><div class="report-weekly-copy">${sample.scenario === 'empty' ? '오늘의 첫 기록부터 시작해 볼까요?' : '이어온 습관과 놓친 부분을 함께 돌아보세요.'}</div><button class="cta" data-report-action="weekly">주간 AI 분석 미리보기<span>${icon('back', 18)}</span></button></section>`;
}

function reportMainContent(sample, design = reportDesign) {
  return design === 'classic' ? reportClassicContent(sample) : reportFocusedContent(sample);
}

function renderReportDialog(context, topic = state.dialog?.topic, weekly = reportState.weekly, sample = reportSample()) {
  const metric = REPORT_METRICS[topic];
  let title = metric?.title ?? (topic === 'timing' ? '나의 성장 시기' : '이번 주 성장 리포트');
  let body = metric ? `<div class="report-detail-icon">${icon(metric.glyph, 30)}</div><p class="report-dialog-copy">${metric.copy}</p>` : topic === 'timing' ? `<div class="report-detail-icon">${icon('timer', 30)}</div><p class="report-dialog-copy">사춘기 질문에 대한 응답을 바탕으로 이른 편·보통·늦은 편의 성장 시기를 안내하는 화면이에요.</p><div class="report-timing-types"><span>이른 편</span><span>보통</span><span>늦은 편</span></div><p class="report-dialog-copy">질문은 홈에서 간헐적으로 나타나요. 이 화면에서는 성장 유형을 판정하지 않아요.</p>` : '';
  let footer = '<button class="cta" data-action="close">확인</button>';
  if (topic === 'weekly') {
    if (weekly === 'loading') { body = `<div class="report-analysis-loading" role="status"><span class="photo-inline-spinner"></span><strong>한 주의 기록을 정리하고 있어요</strong><p>수면 · 식사 · 스트레칭</p></div>`; footer = '<button class="cta secondary" data-action="close">닫기</button>'; }
    else if (weekly === 'error') { body = `<div class="report-detail-icon">${icon('report', 30)}</div><h4 class="report-result-title">요약을 불러오지 못했어요.</h4><p class="report-dialog-copy">잠시 후 다시 확인해 주세요.</p>`; footer = '<button class="cta secondary" data-action="close">닫기</button><button class="cta" data-report-action="retry">다시 보기</button>'; }
    else if (sample.scenario === 'empty') body = `<div class="report-detail-icon">${icon('leaf', 30)}</div><h4 class="report-result-title">나의 한 주를 채워볼까요?</h4><p class="report-dialog-copy">아직 생활 기록이 없어요. 수면·식사·스트레칭을 기록하면 한 주를 돌아볼 수 있어요.</p><div class="report-summary-lines"><p>수면<strong>0 / 7일</strong></p><p>식사<strong>0 / 7일</strong></p><p>운동<strong>0 / 7일</strong></p></div>`;
    else body = `<div class="report-detail-icon">${icon('leaf', 30)}</div><h4 class="report-result-title">작은 습관이 쌓이고 있어요.</h4><p class="report-dialog-copy">수면과 식사 기록을 이어왔어요. 스트레칭도 잊지 않고 채워보세요.</p><div class="report-summary-lines"><p>수면 기록<strong>${sample.days.sleep} / 7일</strong></p><p>식사 기록<strong>${sample.days.meals} / 7일</strong></p><p>스트레칭 기록<strong>${sample.days.workout} / 7일</strong></p></div><div class="report-next-step"><strong>다음 주에는</strong><p>잠들기 전, 오늘의 기록을 한 번 돌아보세요.</p></div>`;
  }
  return `<div class="phone-overlay"><section class="entry-panel report-detail-panel" role="dialog" aria-modal="true" aria-labelledby="report-sheet-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><h3 id="report-sheet-${context}">${title}</h3><button class="icon-button" data-action="close" aria-label="닫기">${icon('close', 21)}</button></div><div class="entry-body">${body}<p class="report-dialog-example">화면 확인용 예시이며 실제 분석 결과가 아닙니다.</p></div><div class="entry-actions">${footer}</div></section></div>`;
}

function renderReportPhone(context = 'single', sample = reportSample(), preview = null, design = reportDesign) {
  const dialog = preview ?? (state.dialog?.kind === 'report' && state.dialog.context === context ? state.dialog : null);
  const inert = dialog ? 'inert' : '';
  return `<section class="device-wrap"><div class="device-caption"><strong>리포트 · ${REPORT_DESIGNS[design]}</strong><span>시연용 화면</span></div><div class="phone report-phone report-design-${design}" data-context="${context}"><div class="status-bar" ${inert}><span>9:41</span><span class="status-icons">${icon('signal', 13)}${icon('wifi', 14)}${icon('battery', 18)}</span></div><main class="phone-scroll report-scroll" ${inert}>${reportMainContent(sample, design)}</main><div ${inert}>${renderBottomNav('report')}</div><div class="home-indicator" ${inert}></div>${dialog ? renderReportDialog(context, dialog.topic, dialog.weekly ?? reportState.weekly, sample) : ''}</div></section>`;
}

const REPORT_STAGES = [['overview', '리포트 전체'], ['metric', '성장 지표 설명'], ['timing', '성장 시기 안내'], ['weekly-loading', '주간 분석 대기'], ['weekly-ready', '주간 분석 결과'], ['weekly-error', '분석 실패·재시도'], ['recorded', '기록이 쌓인 한 주'], ['empty', '생활 기록 없는 상태']];
function renderReportFlow() {
  return REPORT_STAGES.map(([stage, label], index) => {
    const sample = reportSample(['empty', 'recorded'].includes(stage) ? stage : 'sample');
    const dialog = stage === 'metric' ? { topic: 'growth' } : stage === 'timing' ? { topic: 'timing' } : stage.startsWith('weekly-') ? { topic: 'weekly', weekly: stage.slice(7) === 'ready' ? 'ready' : stage.slice(7) === 'error' ? 'error' : 'loading' } : null;
    return `<article class="routine-flow-step"><div class="routine-flow-heading"><span>${String(index + 1).padStart(2, '0')}</span><div><h2>${label}</h2><p>리포트 · 시연용 예시</p></div></div><div class="routine-flow-static" inert>${renderReportPhone(`report-flow-${stage}`, sample, dialog)}</div><button class="studio-button routine-flow-try" data-report-preview="${stage}">이 화면에서 눌러보기 ↗</button></article>`;
  }).join('');
}

function renderReportControls() {
  const active = state.tab === 'report';
  document.querySelector('#workbench').classList.toggle('viewing-report', active);
  document.querySelector('#workbench').classList.toggle('report-flow', active && reportFlowView);
  if (!active) return;
  document.querySelector('.brand strong').textContent = '리포트';
  document.querySelector('.intro h1').textContent = '성장 상태와 한 주의 습관을 함께.';
  document.querySelector('.intro-copy').textContent = reportFlowView ? '리포트와 세부 화면 8개를 한눈에 확인하세요.' : 'GoTall의 정보 구성을 웜 블랙·베이지로 구성한 시연용 리포트입니다.';
  document.querySelector('#report-controls').innerHTML = `<p class="panel-caption">리포트 · 디자인 비교</p><div class="ob-mode-options" role="group" aria-label="리포트 디자인">${Object.entries(REPORT_DESIGNS).map(([key, label]) => `<button data-report-design="${key}" aria-pressed="${reportDesign === key}">${label}</button>`).join('')}</div><p class="home-inspector-note">기존안은 같은 크기 카드로 정리합니다. 수정안은 진행률을 크게 두고, 지표마다 다른 차트와 밝기 차이를 줍니다.</p><p class="panel-caption">리포트 · 화면 보기</p><button class="studio-button routine-flow-toggle" data-report-action="flow">${reportFlowView ? '직접 진행하기' : '화면 한눈에 보기'} ↗</button><div class="photo-preview-buttons">${REPORT_STAGES.filter(([stage]) => !['metric', 'timing', 'overview'].includes(stage)).map(([stage, label]) => `<button data-report-preview="${stage}">${label}</button>`).join('')}</div><p class="panel-caption report-panel-caption">지표 설명</p><div class="photo-preview-buttons">${Object.entries(REPORT_METRICS).map(([key, metric]) => `<button data-report-info="${key}">${metric.title}</button>`).join('')}</div><p class="home-inspector-note">성장 진행률·또래 순위·확률·습관을 가정한 키·30일 변화·생활 기록·요약 문장은 모두 예시입니다. 현재 키와 목표 키는 내 정보의 합성 입력을 사용합니다. 실제 리포트·예측·AI API는 호출하지 않습니다.</p><button class="studio-button" data-tab="home">홈 보기 ↗</button>`;
  document.querySelector('#notes').innerHTML = '<div class="note-top"><p class="note-eyebrow">REPORT</p><h2 class="note-title">성장 상태와 생활 해석</h2><p class="note-description">기존 카드와 강조·차트 안을 왼쪽에서 비교합니다. 성장 지표 6개와 세부 기능은 같은 정보를 사용합니다.</p><div class="note-point"><span class="note-number">1</span><div><strong>성장 상태 6개</strong><p>진행률·또래 비교·목표·가능성·습관을 가정한 키·실측 변화를 구분합니다. 각 설명 버튼을 눌러 의미를 확인합니다.</p></div></div><div class="note-point"><span class="note-number">2</span><div><strong>성장 시기와 이번 주 기록</strong><p>성장 시기는 설명 화면으로 연결합니다. 사춘기 질문의 기존 홈 노출 주기는 유지합니다.</p></div></div><div class="note-point"><span class="note-number">3</span><div><strong>주간 AI 분석 미리보기</strong><p>대기·결과·실패·기록 없는 상태를 확인할 수 있습니다. 모든 분석값과 문장은 화면 구성용 합성 예시입니다.</p></div></div></div>';
}

function stopReportAnalysis() {
  if (reportAnalysisTimer !== null) clearTimeout(reportAnalysisTimer);
  reportAnalysisTimer = null; reportAnalysisRevision++;
}
function syncReportAnalysis() {
  if (reportAnalysisTimer !== null && (state.tab !== 'report' || reportFlowView || state.dialog?.kind !== 'report' || state.dialog.topic !== 'weekly')) stopReportAnalysis();
}
function startReportAnalysis() {
  stopReportAnalysis(); reportState.weekly = 'loading';
  state.dialog = { kind: 'report', topic: 'weekly', context: 'single' };
  const revision = reportAnalysisRevision;
  render();
  reportAnalysisTimer = setTimeout(() => {
    reportAnalysisTimer = null;
    if (revision !== reportAnalysisRevision || state.tab !== 'report' || state.dialog?.kind !== 'report' || state.dialog.topic !== 'weekly') return;
    reportState.weekly = 'ready'; render(); document.querySelector('.report-detail-panel .icon-button')?.focus();
  }, 1300);
  document.querySelector('.report-detail-panel .icon-button')?.focus();
}

document.addEventListener('click', event => {
  const design = event.target.closest('[data-report-design]');
  if (design && Object.hasOwn(REPORT_DESIGNS, design.dataset.reportDesign)) { reportDesign = design.dataset.reportDesign; state.tab = 'report'; render(false); return; }
  const info = event.target.closest('[data-report-info]');
  if (info) { if (!REPORT_METRICS[info.dataset.reportInfo] && info.dataset.reportInfo !== 'timing') return; stopReportAnalysis(); reportFlowView = false; state.tab = 'report'; state.dialog = { kind: 'report', topic: info.dataset.reportInfo, context: 'single' }; render(); document.querySelector('.report-detail-panel .icon-button')?.focus(); return; }
  const preview = event.target.closest('[data-report-preview]');
  if (preview) {
    stopReportAnalysis(); reportFlowView = false; state.tab = 'report'; state.dialog = null;
    const stage = preview.dataset.reportPreview;
    reportState = { scenario: ['empty', 'recorded'].includes(stage) ? stage : 'sample', weekly: 'idle' };
    if (stage === 'metric' || stage === 'timing') state.dialog = { kind: 'report', topic: stage === 'metric' ? 'growth' : 'timing', context: 'single' };
    else if (stage === 'weekly-loading') { startReportAnalysis(); return; }
    else if (stage.startsWith('weekly-')) { reportState.weekly = stage === 'weekly-error' ? 'error' : 'ready'; state.dialog = { kind: 'report', topic: 'weekly', context: 'single' }; }
    render(false); return;
  }
  const action = event.target.closest('[data-report-action]')?.dataset.reportAction;
  if (action === 'flow') { stopReportAnalysis(); reportFlowView = !reportFlowView; state.tab = 'report'; state.dialog = null; render(false); }
  else if (action === 'weekly' || action === 'retry') startReportAnalysis();
});
