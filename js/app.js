const ICONS = {
  workout: '<path d="m4 9 5-5m6 16 5-5M3 6l3-3m12 18 3-3M6 14l8-8m-4 12 8-8M5 5l14 14"/>',
  meal: '<path d="M5 3v6a3 3 0 0 0 6 0V3M8 3v18M18 3c-3 3-3 8 0 9h2V3h-2Zm2 9v9"/>',
  sleep: '<path d="M20.5 13A8.5 8.5 0 0 1 11 3.5 8.5 8.5 0 1 0 20.5 13Z"/>',
  leaf: '<path d="M19 4C8 3 3 8 6 15s15 6 13-11ZM5 20 15 10M9 15l-1-5m6 1 4 1"/>',
  protein: '<path d="M5 16c1-3 2-3 4-2l1-5 3-4 3 1-1 3-2 1 1 4c5-3 7 0 6 4s-13 5-15-2Z"/>',
  calcium: '<path d="M9 3h6v4l3 5v8H6v-8l3-5V3ZM6 13h12M9 6h6"/><path d="M12 15v3m-1.5-1.5h3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  sunrise: '<path d="M3 18h18M5 21h14M7 15a5 5 0 0 1 10 0M12 3v5m-7 3L3 9m16 2 2-2m-9-6-2 2m2-2 2 2"/>',
  pencil: '<path d="m14 5 5 5M4 20l5-1L21 7a2 2 0 0 0-5-5L4 14l-1 7ZM4 20h9"/>',
  camera: '<path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="4"/>',
  back: '<path d="m14 5-7 7 7 7M7 12h14"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="2"/><rect x="14" y="3" width="7" height="7" rx="2"/><rect x="3" y="14" width="7" height="7" rx="2"/><rect x="14" y="14" width="7" height="7" rx="2"/>',
  play: '<path d="m8 4 13 8-13 8V4Z" fill="currentColor" stroke="none"/>',
  pause: '<rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor" stroke="none"/>',
  skip: '<path d="m5 5 12 7-12 7V5Z" fill="currentColor" stroke="none"/><path d="M20 5v14" stroke-width="3"/>',
  lock: '<rect x="5" y="10" width="14" height="11" rx="3"/><path d="M8 10V7a4 4 0 0 1 8 0v3m-4 4v3"/>',
  check: '<path d="m5 12 5 5 10-10" stroke-width="3"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  share: '<path d="M12 16V3m-4 4 4-4 4 4M6 11H4v10h16V11h-2"/>',
  settings: '<path d="m9 3-1 3-3 1-2 3 2 2v3l3 1 1 3h6l1-3 3-1v-3l2-2-2-3-3-1-1-3H9Z"/><circle cx="12" cy="11" r="3"/>',
  timer: '<circle cx="12" cy="14" r="8"/><path d="M9 2h6m-3 0v4m6 1 2-2m-8 5v5l3 2"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  close: '<path d="m6 6 12 12M6 18 18 6"/>',
  home: '<path d="m3 10 9-7 9 7v10h-6v-6H9v6H3V10Z"/>',
  growth: '<path d="M4 20V4m0 16h16M8 14l4-4 4 2 5-8m-5 0h5v5"/>',
  report: '<path d="M5 3h14v18H5V3Zm4 5h6m-6 4h6m-6 4h3"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M5 21v-3a7 7 0 0 1 14 0v3"/>',
  battery: '<rect x="2" y="6" width="17" height="12" rx="3"/><path d="M22 10v4"/><rect x="5" y="9" width="11" height="6" rx="1" fill="currentColor" stroke="none"/>',
  signal: '<path d="M4 18v-2m5 2v-6m5 6V8m5 10V4"/>',
  wifi: '<path d="M3 8a14 14 0 0 1 18 0M6 12a9 9 0 0 1 12 0m-9 4a4 4 0 0 1 6 0m-3 4v.1"/>',
};

const SEGMENTS = { workout: '운동', meal: '식사', sleep: '수면' };
const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일'];
const TARGETS = { energy: 2000, protein: 70, calcium: 1000, vitaminD3: 15, workout: 30, sleep: 480 };
const NUTRIENTS = [
  { key: 'protein', label: '단백질', unit: 'g', icon: 'protein' },
  { key: 'calcium', label: '칼슘', unit: 'mg', icon: 'calcium' },
  { key: 'vitaminD3', label: '비타민 D3', unit: 'µg', icon: 'sun' },
];
const CONTROLS = [
  { key: 'metric', number: '01', title: '핵심 수치', choices: [['progress', '진행바'], ['ring', '링'], ['score', '달성률']] },
  { key: 'density', number: '02', title: '3열 영양 카드', choices: [['roomy', '여유롭게'], ['compact', '간결하게'], ['flat', '납작하게']], help: '식사에서 확인 · 미입력은 0으로 표시' },
  { key: 'week', number: '03', title: '요일과 주간 차트', choices: [['pill', '둥근 칩'], ['line', '밑줄'], ['block', '면 채움']] },
  { key: 'cta', number: '04', title: '기록 버튼', choices: [['primary', '주요 / 보조'], ['equal', '같은 강조'], ['outline', '테두리']] },
  { key: 'sleep', number: '05', title: '수면 입력', choices: [['sheet', '바텀시트'], ['fullscreen', '전체 화면']], help: '수면 탭의 + 수면 기록으로 열기' },
];
const PRESETS = {
  a: {
    name: '기록의 기본', copy: '진행바 · 여유 있는 카드', recommended: true,
    config: { metric: 'progress', density: 'roomy', week: 'pill', cta: 'primary', sleep: 'sheet' },
    description: '실제 기록량을 먼저 읽고, 남은 목표를 따라갑니다. 가장 익숙한 구성입니다.',
    points: [['수치가 먼저', '기록한 양과 목표가 같은 방향으로 읽힙니다.'], ['숫자로 통일', '미입력 영양소도 0과 같은 형태로 표시합니다.'], ['입력은 가볍게', '대시보드 맥락을 남긴 채 시트를 엽니다.']],
    recommendation: '기본안으로 추천합니다. 기록 목록을 더 많이 보려면 영양 카드만 B의 간결한 밀도로 바꿔보세요.',
  },
  b: {
    name: '주간의 흐름', copy: '링 · 간결한 카드',
    config: { metric: 'ring', density: 'compact', week: 'line', cta: 'equal', sleep: 'fullscreen' },
    description: '달성률과 주간 흐름을 함께 봅니다. 상단 카드를 줄여 아래 기록을 일찍 만납니다.',
    points: [['달성률을 분리', '원형 링이 기록량과 비율을 나눠 보여줍니다.'], ['기록이 가까이', '영양 카드에서 아이콘과 여백을 줄였습니다.'], ['입력에 집중', '수면 입력이 화면 전체를 사용합니다.']],
    recommendation: '기록 목록을 자주 확인한다면 좋은 대안입니다. 두 CTA의 강조가 같아 첫 행동의 우선순위는 약해집니다.',
  },
  c: {
    name: '숫자에 집중', copy: '큰 달성률 · 납작한 카드',
    config: { metric: 'score', density: 'flat', week: 'block', cta: 'outline', sleep: 'sheet' },
    description: '목표 달성률을 가장 크게 봅니다. 반복되는 기록에는 덜 장식적인 구성을 제안합니다.',
    points: [['목표를 크게', '달성률이 먼저 보이고 기록량을 옆에 둡니다.'], ['선택을 명확하게', '요일의 밝은 면으로 현재 선택을 표시합니다.'], ['낮은 시각적 무게', '영양 카드를 구분선으로, CTA를 테두리로 표현합니다.']],
    recommendation: '목표를 동기로 삼는 사용자에게 제안합니다. 칼로리 비율을 영양 종합 점수로 오해하지 않도록 기준을 표시했습니다.',
  },
};

const params = new URLSearchParams(location.search);
const initialPreset = Object.hasOwn(PRESETS, params.get('preset')) ? params.get('preset') : 'a';
const state = {
  tab: ['home', 'my', 'report', 'onboarding', 'guardian'].includes(params.get('tab')) ? params.get('tab') : 'growth',
  preset: initialPreset,
  config: { ...PRESETS[initialPreset].config },
  segment: Object.hasOwn(SEGMENTS, params.get('segment')) ? params.get('segment') : 'meal',
  day: /^[0-6]$/.test(params.get('day') ?? '') ? Number(params.get('day')) : 4,
  scenario: ['unknown', 'complete', 'empty'].includes(params.get('scenario')) ? params.get('scenario') : 'unknown',
  compare: params.get('compare') === '1',
  dialog: null,
};
for (const control of CONTROLS) {
  if (control.choices.some(([value]) => value === params.get(control.key))) state.config[control.key] = params.get(control.key);
}
let records = seedData(state.scenario);
let timer = { status: 'idle', seconds: 0 };
let nextId = 1;
let toastTimeout;

function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] ?? ICONS.leaf}</svg>`;
}

function escapeHTML(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);
}

function number(value) {
  return new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 1 }).format(value ?? 0);
}

function duration(minutes) {
  if (minutes === null) return '기록 없음';
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return `${hours ? `${hours}시간` : ''}${rest ? ` ${rest}분` : hours ? '' : '0분'}`.trim();
}

function sleepDuration(start, end) {
  const toMinutes = (time) => { const [h, m] = time.split(':').map(Number); return h * 60 + m; };
  return (toMinutes(end) - toMinutes(start) + 1440) % 1440;
}

function seedData(scenario) {
  return WEEKDAYS.map((_, index) => {
    const day = { date: `2026-11-${String(9 + index).padStart(2, '0')}`, meal: [], workout: [], sleep: [] };
    if (index > 4 || (scenario === 'empty' && index === 4)) return day;
    const energies = [[410, 720, 600], [430, 680, 650], [360, 610, 570], [400, 690, 640], [390, 650]];
    day.meal = energies[index].map((energy, slot) => ({
      id: `meal-${index}-${slot}`, slot: ['아침', '점심', '저녁'][slot], time: ['08:30', '12:40', '19:10'][slot],
      energy, protein: [18, 32, 24][slot], calcium: [240, 180, 210][slot],
      vitaminD3: scenario === 'complete' ? [3, 4.5, 2][slot] : slot === 0 && index < 3 ? 3 : null,
    }));
    const minutes = [24, 38, null, 30, 28][index];
    if (minutes !== null) {
      day.workout = [
        { id: `workout-${index}-0`, name: '전신 스트레칭', minutes: 12, source: '타이머', time: '07:20' },
        { id: `workout-${index}-1`, name: '가볍게 걷기', minutes: minutes - 12, source: '직접 입력', time: '18:10' },
      ];
    }
    day.sleep = [{ id: `sleep-${index}`, start: ['23:20', '22:40', '23:50', '22:50', '23:10'][index], end: ['06:30', '06:45', '06:35', '06:30', '06:30'][index] }];
    return day;
  });
}

function nutrientTotal(meals, key) {
  if (!meals.length || meals.some((meal) => meal[key] === null)) return null;
  return meals.reduce((sum, meal) => sum + meal[key], 0);
}

function summaryFor(segment, dayIndex, weekRecords = records) {
  const day = weekRecords[dayIndex];
  const prefix = dayIndex === 4 ? '오늘' : '선택일';
  if (segment === 'meal') {
    const value = nutrientTotal(day.meal, 'energy');
    return { value, target: TARGETS.energy, label: `${prefix} 칼로리`, fact: `${number(value)} kcal`, goal: '2,000 kcal', ratioLabel: '칼로리 목표 대비', big: `${number(value)}<span class="unit">kcal</span>` };
  }
  if (segment === 'workout') {
    const value = day.workout.reduce((sum, record) => sum + record.minutes, 0);
    return { value, target: TARGETS.workout, label: `${prefix} 운동 시간`, fact: `${value}분`, goal: '30분', ratioLabel: '운동 목표 대비', big: `${value}<span class="unit">분</span>` };
  }
  const record = day.sleep[0];
  const value = record ? sleepDuration(record.start, record.end) : null;
  const h = value === null ? 0 : Math.floor(value / 60);
  const m = value === null ? 0 : value % 60;
  return { value, target: TARGETS.sleep, label: `${prefix} 수면 시간`, fact: duration(value), goal: '8시간', ratioLabel: '수면 목표 대비', big: value === null ? '<span class="minor">기록 없음</span>' : `${h}<span class="unit">시간</span>${m ? ` <span class="minor">${m}</span><span class="unit">분</span>` : ''}` };
}

function progressLine(percent, label, extraClass = '') {
  return `<div class="progress-line ${extraClass}" role="img" aria-label="${escapeHTML(label)}"><div class="progress-fill" style="width:${Math.min(100, percent ?? 0)}%"></div></div>`;
}

function renderMetric(config, weekRecords = records) {
  const summary = summaryFor(state.segment, state.day, weekRecords);
  const percent = summary.value === null ? (state.segment === 'meal' ? 0 : null) : Math.round(summary.value / summary.target * 100);
  const percentText = `${percent ?? 0}%`;
  const label = `<p class="metric-label">${summary.label}</p>`;
  const fact = `<div class="metric-inline"><div class="big-number">${summary.big}</div></div>`;
  const goal = `<p class="metric-caption">목표 <strong>${summary.goal}</strong></p>`;
  const bar = progressLine(percent, `${summary.ratioLabel} ${percentText}`);
  if (config.metric === 'ring') {
    return `<div class="metric-ring-layout"><div>${label}${fact}${goal}</div><div class="progress-ring" style="--percent:${Math.min(percent ?? 0, 100)}" role="img" aria-label="${summary.ratioLabel} ${percentText}"><div class="ring-value"><strong>${percentText}</strong><small>목표 대비</small></div></div></div>`;
  }
  if (config.metric === 'score') {
    return `${label}<div class="metric-score"><div class="score-number" ${percent === null ? 'style="font-size:32px;letter-spacing:-1px"' : ''}>${percent === null ? '기록 전' : `${percent}<span>%</span>`}</div><div class="score-fact"><strong>${summary.fact}</strong><small>/ ${summary.goal}</small></div></div>${bar}<div class="progress-meta"><span>${summary.ratioLabel}</span></div>`;
  }
  return `${label}${fact}${bar}<div class="progress-meta"><span>목표 ${summary.goal}</span><span class="attainment">${percentText}</span></div>`;
}

function renderNutrients(config, weekRecords = records) {
  return `<div class="nutrients ${config.density}">${NUTRIENTS.map((nutrient) => {
    const value = nutrientTotal(weekRecords[state.day].meal, nutrient.key);
    const percent = Math.round((value ?? 0) / TARGETS[nutrient.key] * 100);
    const valueHTML = `<span class="nutrient-value">${number(value)}<span class="nutrient-unit">${nutrient.unit}</span></span>`;
    return `<div class="nutrient"><div class="nutrient-icon">${icon(nutrient.icon, 18)}</div><div class="nutrient-label">${nutrient.label}</div>${valueHTML}<div class="nutrient-target">/ ${number(TARGETS[nutrient.key])} ${nutrient.unit}</div>${progressLine(percent, `${nutrient.label} ${number(value)} ${nutrient.unit}`)}</div>`;
  }).join('')}</div>`;
}

function renderWeek(config, weekRecords = records) {
  const segment = state.segment;
  let chart = '';
  if (segment !== 'meal') {
    const values = weekRecords.map((day, index) => day[segment].length ? summaryFor(segment, index, weekRecords).value : null);
    const target = TARGETS[segment];
    const ceiling = Math.max(target * 1.25, ...values.map((value) => value ?? 0));
    chart = `<div class="week-chart ${config.week}" aria-label="이번 주 ${SEGMENTS[segment]} 막대 차트"><div class="chart-target" style="bottom:${78 * target / ceiling}px"><span>${segment === 'sleep' ? '8시간' : '30분'}</span></div>${values.map((value, index) => {
      const text = value === null ? '기록 없음' : segment === 'sleep' ? duration(value) : `${value}분`;
      const short = value === null ? '·' : segment === 'sleep' ? `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}` : `${value}분`;
      return `<button class="chart-day" data-day="${index}" aria-pressed="${index === state.day}" aria-label="11월 ${9 + index}일 ${WEEKDAYS[index]}요일 ${text}" data-testid="${segment}.bar.${weekRecords[index].date}"><span class="chart-value">${short}</span><span class="chart-bar ${value === null ? 'missing' : ''}" style="--bar-height:${value === null ? 5 : Math.max(3, value / ceiling * 78)}px"></span></button>`;
    }).join('')}</div>`;
  }
  return `<div class="week-section">${chart}<div class="week-strip ${config.week}" aria-label="날짜 선택">${weekRecords.map((day, index) => `<button class="day-chip" data-day="${index}" aria-pressed="${index === state.day}" aria-label="11월 ${9 + index}일 ${WEEKDAYS[index]}요일${index === 4 ? ' 오늘' : ''}${day[segment].length ? ' 기록 있음' : ' 기록 없음'}" ${index === 4 ? 'aria-current="date"' : ''} data-testid="${segment}.day.${day.date}"><span class="weekday">${WEEKDAYS[index]}</span><span class="day-number">${9 + index}</span><span class="day-dot ${day[segment].length ? 'recorded' : ''} ${index === 4 ? 'today' : ''}"></span></button>`).join('')}</div></div>`;
}

function renderRecords(weekRecords = records) {
  const day = weekRecords[state.day];
  const items = day[state.segment];
  if (!items.length) return `<div class="empty-card">${icon(state.segment, 27)}아직 ${SEGMENTS[state.segment]} 기록이 없어요<p>첫 기록을 남겨보세요.</p></div>`;
  return `<div class="record-list">${items.map((record) => {
    let title, subtitle, details = '';
    if (state.segment === 'meal') {
      title = `${record.slot} · ${record.time}`;
      subtitle = `${number(record.energy)} <span class="unit">kcal</span>`;
      details = `<div class="record-nutrients">${NUTRIENTS.map((n) => `<div class="record-nutrient"><span>${n.label}</span><strong>${number(record[n.key])} ${n.unit}</strong></div>`).join('')}</div>`;
    } else if (state.segment === 'workout') {
      title = record.name;
      subtitle = `${record.minutes}분 <span class="unit">· ${record.source} · ${record.time}</span>`;
    } else {
      title = duration(sleepDuration(record.start, record.end));
      subtitle = record.end < record.start ? '밤 수면' : '수면 기록';
      details = `<div class="sleep-timeline"><div>${icon('sleep', 17)}<span><small>잠든 시각</small>${record.start}</span></div><div>${icon('sunrise', 18)}<span><small>일어난 시각</small>${record.end}</span></div></div>`;
    }
    return `<article class="record-card"><div class="record-top"><div class="record-main"><span class="record-icon">${icon(state.segment, 18)}</span><div><h4 class="record-title">${escapeHTML(title)}</h4><div class="record-subtitle">${subtitle}</div></div></div><button class="edit-button" data-action="edit" data-record="${record.id}" aria-label="${escapeHTML(title)} 수정 또는 삭제" data-testid="${state.segment}.edit.${record.id}">${icon('pencil', 17)}</button></div>${details}</article>`;
  }).join('')}</div>`;
}

function renderActions(config, weekRecords = records) {
  if (state.segment === 'sleep') {
    const hasRecord = weekRecords[state.day].sleep.length > 0;
    return `<div class="action-row single ${config.cta}"><button class="cta" data-action="sleep">${icon(hasRecord ? 'pencil' : 'plus', 18)}${hasRecord ? '수면 수정' : '수면 기록'}</button></div>`;
  }
  const actions = state.segment === 'meal' ? [['meal', '직접 입력', 'pencil'], ['photo', '사진으로', 'camera']] : [['timer', '타이머', 'timer'], ['workout', '직접 입력', 'pencil']];
  return `<div class="action-row ${config.cta}">${actions.map(([action, label, glyph], index) => `<button class="cta ${(state.segment === 'meal' ? index === 0 : index === 1) ? 'secondary' : ''}" data-action="${action}">${icon(glyph, 17)}${label}</button>`).join('')}</div>`;
}

function renderPhone(config, context, weekRecords = records, previewDialog = null) {
  if (state.tab === 'home') return renderHomePhone(context);
  if (state.tab === 'my') return renderMyPhone(context);
  if (state.tab === 'report') return renderReportPhone(context);
  if (state.tab === 'onboarding') return renderOnboardingPhone(context);
  const segment = state.segment;
  const isModal = previewDialog !== null || state.dialog?.context === context;
  const inert = isModal ? 'inert' : '';
  const preset = PRESETS[context] ?? PRESETS[state.preset];
  const isCustom = context === 'single' && Object.keys(config).some((key) => config[key] !== PRESETS[state.preset].config[key]);
  const content = segment === 'workout' ? renderRoutineBody(config) : `<section class="summary-card" aria-label="${state.day === 4 ? '오늘' : '선택일'} ${SEGMENTS[segment]} 요약">${renderMetric(config, weekRecords)}${segment === 'meal' ? renderNutrients(config, weekRecords) : ''}${renderWeek(config, weekRecords)}</section><section class="daily-section"><div class="section-heading"><h3>${state.day === 4 ? '오늘' : `${9 + state.day}일`} ${SEGMENTS[segment]}</h3><span class="section-date">11월 ${9 + state.day}일 ${WEEKDAYS[state.day]}요일</span></div>${renderActions(config, weekRecords)}${renderRecords(weekRecords)}</section>`;
  return `<section class="device-wrap"><div class="device-caption"><strong>${context === 'single' ? state.preset.toUpperCase() : context.toUpperCase()} · ${preset.name}${isCustom ? '<span class="custom-tag"> + 내 조합</span>' : ''}</strong><span>11.13 금요일</span></div><div class="phone" data-context="${context}"><div class="status-bar" ${inert}><span>9:41</span><span class="status-icons">${icon('signal', 13)}${icon('wifi', 14)}${icon('battery', 18)}</span></div><header class="app-header" ${inert}><div class="app-title-row"><h2>성장</h2><span class="little-leaf">${icon('leaf', 23)}</span></div><div class="segment-control" role="tablist" aria-label="성장 기록 종류">${Object.entries(SEGMENTS).map(([key, title]) => `<button role="tab" id="seg-${context}-${key}" aria-controls="panel-${context}" aria-selected="${segment === key}" tabindex="${segment === key ? 0 : -1}" data-segment="${key}">${icon(key, 16)}${title}</button>`).join('')}</div></header><div class="phone-scroll" id="panel-${context}" role="tabpanel" aria-labelledby="seg-${context}-${segment}" tabindex="0" ${inert}>${content}</div><div ${inert}>${renderBottomNav('growth')}</div><div class="home-indicator" ${inert}></div>${previewDialog ?? (isModal ? renderDialog(config, context) : '')}</div></section>`;
}

function renderSleepClock(start, end) {
  const parts = (time) => time.split(':').map(Number);
  const total = (time) => { const [h, m] = parts(time); return h * 60 + m; };
  const minutes = sleepDuration(start, end);
  const angle = minutes / 1440 * 360;
  const pin = (time, kind) => {
    const rad = total(time) / 1440 * Math.PI * 2 - Math.PI / 2;
    return `<span class="clock-pin ${kind}" style="--x:${Math.cos(rad) * 101};--y:${Math.sin(rad) * 101}">${icon(kind === 'wake' ? 'sun' : 'sleep', 12)}</span>`;
  };
  const ticks = Array.from({ length: 24 }, (_, i) => {
    const rad = i / 24 * Math.PI * 2 - Math.PI / 2;
    return `<line x1="${100 + Math.cos(rad) * 84}" y1="${100 + Math.sin(rad) * 84}" x2="${100 + Math.cos(rad) * (i % 6 ? 89 : 92)}" y2="${100 + Math.sin(rad) * (i % 6 ? 89 : 92)}" stroke="currentColor" stroke-width="${i % 6 ? 1 : 2}"/>`;
  }).join('');
  return `<div class="sleep-clock" data-sleep-clock style="background:conic-gradient(from ${total(start) / 1440 * 360}deg,#ccac85 0deg,#e0c5a4 ${angle}deg,#393225 ${angle}deg)" role="img" aria-label="${start}부터 ${end}까지 ${duration(minutes)}"><div class="sleep-clock-inner"><svg class="clock-ticks" viewBox="0 0 200 200" aria-hidden="true">${ticks}<g fill="#8f826c" font-size="8" font-family="sans-serif" text-anchor="middle"><text x="100" y="27">00</text><text x="176" y="103">06</text><text x="100" y="180">12</text><text x="24" y="103">18</text></g></svg><div class="clock-time">${icon('sleep', 20)}<strong>${duration(minutes)}</strong><small>수면 시간</small></div></div>${pin(start, 'bed')}${pin(end, 'wake')}</div>`;
}

function sleepDateSpan(start, end, dayIndex = state.day) {
  const overnight = end < start;
  return `11월 ${9 + dayIndex - (overnight ? 1 : 0)}일 ${start} → 11월 ${9 + dayIndex}일 ${end}`;
}

function field(label, name, value, attributes = '') {
  return `<label class="field"><span>${label}</span><input name="${name}" value="${escapeHTML(value ?? '')}" ${attributes}></label>`;
}

function sampleIllustration() {
  return '<svg width="225" height="160" viewBox="0 0 225 160" aria-label="시안용 식사 일러스트" role="img"><ellipse cx="114" cy="91" rx="95" ry="57" fill="#201e16"/><ellipse cx="112" cy="78" rx="89" ry="58" fill="#b1a58b"/><ellipse cx="112" cy="78" rx="77" ry="47" fill="#d1c4a7"/><path d="M47 79c-5-19 22-37 43-27s26 35 7 45S52 101 47 79Z" fill="#e2d7ba"/><g fill="#b9a47e"><ellipse cx="67" cy="70" rx="3" ry="2"/><ellipse cx="84" cy="81" rx="3" ry="2"/><ellipse cx="64" cy="85" rx="3" ry="2"/><ellipse cx="83" cy="65" rx="3" ry="2"/></g><path d="m116 59 25-15 32 18-12 24-36 1-14-15Z" fill="#bb916c"/><g stroke="#e0b68d" stroke-width="4" stroke-linecap="round"><path d="m124 59 28 16m-17-24 26 16m-42 1 24 15"/></g><g fill="#6c8052"><circle cx="115" cy="101" r="12"/><circle cx="137" cy="105" r="11"/><circle cx="157" cy="96" r="13"/></g><g fill="#859962"><circle cx="108" cy="96" r="7"/><circle cx="145" cy="97" r="8"/><circle cx="159" cy="89" r="8"/></g><g fill="#c98d57"><ellipse cx="172" cy="76" rx="7" ry="13" transform="rotate(25 172 76)"/><ellipse cx="99" cy="109" rx="5" ry="10" transform="rotate(65 99 109)"/></g></svg>';
}

function renderDialog(config, context) {
  const dialog = state.dialog;
  if (dialog.kind === 'photo') return renderPhotoDialog(context);
  if (dialog.kind === 'routine') return renderRoutineDialog(context);
  if (dialog.kind === 'sleep') return renderSleepDialog(config, context);
  const segment = state.segment;
  const record = records[state.day][segment].find((item) => item.id === dialog.recordId);
  const titles = { meal: record ? '식사 수정' : '식사 기록', workout: record ? '운동 수정' : '운동 기록', sleep: record ? '수면 수정' : '수면 기록', timer: '운동 타이머', photo: '사진으로 기록' };
  let body = '', formType = dialog.kind;
  if (dialog.kind === 'meal') {
    const values = record ?? { slot: '아침', time: '08:30', energy: null, protein: null, calcium: null, vitaminD3: null };
    body = `<div class="field-row"><label class="field"><span>식사</span><select name="slot">${['아침', '점심', '저녁', '간식'].map((slot) => `<option ${slot === values.slot ? 'selected' : ''}>${slot}</option>`).join('')}</select></label>${field('먹은 시각', 'time', values.time, 'type="time" required')}</div>${field('칼로리 · kcal', 'energy', values.energy, 'type="number" inputmode="decimal" min="0" max="10000" step="any" placeholder="0"')}<div class="field-row">${NUTRIENTS.map((n) => field(`${n.label} · ${n.unit}`, n.key, values[n.key], 'type="number" inputmode="decimal" min="0" max="100000" step="any" placeholder="0"')).join('')}</div>`;
  } else {
    body = `${field('운동', 'name', record?.name ?? '전신 스트레칭', 'type="text" maxlength="28" required')}${dialog.kind === 'timer' ? `<div class="timer-readout" data-timer-readout>00:00</div><div class="timer-buttons"><button type="button" data-action="timer-toggle" data-timer-toggle>시작</button><button type="button" data-action="timer-reset">초기화</button></div>` : field('운동 시간 · 분', 'minutes', record?.minutes ?? 15, 'type="number" inputmode="numeric" min="1" max="1440" step="1" required')}`;
  }
  const isFullscreen = dialog.kind === 'timer';
  return `<div class="phone-overlay" data-backdrop="${context}"><section class="entry-panel ${isFullscreen ? 'fullscreen' : ''}" role="dialog" aria-modal="true" aria-labelledby="entry-title-${context}"><div class="sheet-handle" aria-hidden="true"></div><div class="entry-heading"><div><h3 id="entry-title-${context}">${titles[dialog.kind]}</h3><p>11월 ${9 + state.day}일 ${WEEKDAYS[state.day]}요일</p></div><button class="icon-button" data-action="close" aria-label="닫기">${icon('close', 21)}</button></div><form class="entry-body" id="entry-form-${context}" data-form="${formType}">${body}<p class="form-error" role="alert" data-form-error></p></form><div class="entry-actions">${record ? `<button class="delete-button" data-action="delete" aria-label="${escapeHTML(titles[dialog.kind])} 기록 삭제">삭제</button>` : ''}<button type="submit" class="cta" form="entry-form-${context}">저장</button></div></section></div>`;
}

function renderControls() {
  const onHome = state.tab === 'home';
  document.querySelector('#workbench').classList.toggle('viewing-home', onHome);
  document.querySelector('.brand strong').textContent = onHome ? '홈' : '성장 탭';
  document.querySelector('.intro h1').textContent = onHome ? '예상 키를 중심으로 보는 홈.' : '매일의 기록을 담는, 세 가지 리듬.';
  document.querySelector('.intro-copy').textContent = onHome ? '현재 앱의 구성을 바탕으로 다듬습니다.' : '같은 구조와 데이터로 비교하고, 편한 조합을 골라보세요.';
  document.querySelector('#controls').innerHTML = CONTROLS.map((control) => `<div class="control-group"><p class="control-title"><small>${control.number}</small>${control.title}</p><div class="option-row" role="group" aria-label="${control.title}">${control.choices.map(([value, label]) => `<button data-config="${control.key}" data-value="${value}" aria-pressed="${state.config[control.key] === value}">${label}</button>`).join('')}</div>${control.help ? `<small class="help">${control.help}</small>` : ''}</div>`).join('');
  document.querySelector('#presets').innerHTML = Object.entries(PRESETS).map(([key, preset]) => `<button class="preset-button" data-preset="${key}" aria-pressed="${state.preset === key}"><span class="preset-letter">${key.toUpperCase()}</span><span><span class="preset-name">${preset.name}${preset.recommended ? '<span class="preset-tag">추천</span>' : ''}</span><span class="preset-copy">${preset.copy}</span></span></button>`).join('');
  document.querySelector('#scenarios').innerHTML = [['unknown', '일부 미입력'], ['complete', '모두 입력'], ['empty', '빈 날']].map(([value, label]) => `<button data-scenario="${value}" aria-pressed="${state.scenario === value}">${label}</button>`).join('');
  const preset = PRESETS[state.preset];
  document.querySelector('#notes').innerHTML = `<div class="note-top"><p class="note-eyebrow">DIRECTION ${state.preset.toUpperCase()}</p><h2 class="note-title">${preset.name}</h2><p class="note-description">${preset.description}</p>${preset.points.map(([title, copy], i) => `<div class="note-point"><span class="note-number">${i + 1}</span><div><strong>${title}</strong><p>${copy}</p></div></div>`).join('')}</div><div class="recommendation"><small>이렇게 골라보세요</small><p>${preset.recommendation}</p></div><div class="palette" aria-hidden="true"><span class="swatch" style="background:#12100c"></span><span class="swatch" style="background:#1e1a15"></span><span class="swatch" style="background:#CCAC85"></span><span class="swatch" style="background:#c2ad80"></span></div><div class="palette-caption">#12100C &nbsp; #1E1A15 &nbsp; #CCAC85</div><p class="prototype-note">목표치는 비교용 임시 상수입니다.<br>모든 기록은 합성 데이터이며 새로고침하면 초기화됩니다.<br>사진 분석과 저장 상태도 시안입니다.</p>`;
  document.querySelector('#compare-toggle').setAttribute('aria-pressed', String(state.compare));
  document.querySelector('#compare-toggle').innerHTML = state.compare ? '한 안씩 보기 <span aria-hidden="true">↙</span>' : '나란히 비교 <span aria-hidden="true">↗</span>';
  document.querySelector('#workbench').classList.toggle('comparing', ['my', 'report', 'onboarding', 'guardian'].includes(state.tab) ? false : onHome ? homeGaugeCompare : state.compare);
  const onRoutineFlow = state.tab === 'growth' && state.segment === 'workout' && routineFlowView;
  document.querySelector('#workbench').classList.toggle('routine-flow', onRoutineFlow);
  const flowButton = document.querySelector('[data-action="routine-flow"]');
  flowButton.textContent = onRoutineFlow ? '직접 진행하기 ↗' : '세부 화면 한눈에 보기 ↗';
  flowButton.setAttribute('aria-pressed', String(onRoutineFlow));
  if (onRoutineFlow) {
    document.querySelector('.intro h1').textContent = '오늘의 운동, 시작부터 마무리까지.';
    document.querySelector('.intro-copy').textContent = '고른 디자인으로 이어지는 9개 화면입니다. 각 화면 아래에서 직접 진행할 수 있어요.';
  }
  renderSleepControls();
  renderMyControls();
  renderOnboardingControls();
  renderGuardianControls();
  renderReportControls();
  renderQuestionControls();
  if (onHome) renderHomeControls();
}

function syncURL() {
  const next = new URLSearchParams({ preset: state.preset, segment: state.segment, day: String(state.day), scenario: state.scenario });
  next.set('tab', state.tab);
  if (homeGaugeStyle !== 'original') next.set('gauge', homeGaugeStyle);
  if (homeGaugeCompare) next.set('gaugeCompare', '1');
  if (myPreferences.theme === 'light') next.set('theme', 'light');
  for (const [key, value] of Object.entries(state.config)) if (value !== PRESETS[state.preset].config[key]) next.set(key, value);
  if (state.compare) next.set('compare', '1');
  if (routineLevel === 2) next.set('routineLevel', '2');
  if (routineFlowView && state.tab === 'growth' && state.segment === 'workout') next.set('flow', 'workout');
  if (sleepFlowView && state.tab === 'growth' && state.segment === 'sleep') next.set('flow', 'sleep');
  if (state.tab === 'report' && reportDesign === 'classic') next.set('reportDesign', 'classic');
  if (state.tab === 'report' && reportFlowView) next.set('flow', 'report');
  if (state.tab === 'report' && reportState.scenario !== 'sample') next.set('reportScenario', reportState.scenario);
  if (onboardingMode === 'release' || ['onboarding', 'guardian'].includes(state.tab)) next.set('mode', onboardingMode);
  if (state.tab === 'onboarding' && onboardingFlowView) next.set('flow', 'onboarding');
  studioWriteURL(next);
  history.replaceState(null, '', `?${next}`);
}

function render(preserveScroll = true) {
  if (studioRenderGate()) return;
  const scroll = {};
  document.querySelectorAll('.phone').forEach((phone) => { scroll[phone.dataset.context] = phone.querySelector('.phone-scroll').scrollTop; });
  if (state.dialog?.kind !== 'photo') disposePhoto();
  if (state.dialog?.kind !== 'routine') pauseRoutine();
  syncGuardianChild();
  syncReportAnalysis();
  syncHomeQuestions();
  renderControls();
  document.querySelectorAll('[data-routine-level]').forEach(select => { select.value = String(routineLevel); });
  document.querySelector('#preview').innerHTML = state.tab === 'report' ? reportFlowView ? renderReportFlow() : renderReportPhone() : state.tab === 'guardian' ? renderGuardianPhone() : state.tab === 'onboarding' ? onboardingFlowView ? renderOnboardingFlow() : renderOnboardingPhone() : state.tab === 'my' ? renderMyPhone() : state.tab === 'growth' && state.segment === 'sleep' && sleepFlowView ? renderSleepFlow() : state.tab === 'growth' && state.segment === 'workout' && routineFlowView ? renderRoutineFlow() : state.tab === 'home' && homeGaugeCompare ? Object.keys(HOME_GAUGE_STYLES).map(mode => renderHomePhone(mode, mode)).join('') : state.compare && state.tab !== 'home' ? Object.entries(PRESETS).map(([key, preset]) => renderPhone(preset.config, key)).join('') : renderPhone(state.config, 'single');
  document.querySelectorAll('.phone').forEach(phone => { phone.dataset.theme = myPreferences.theme; });
  if (preserveScroll) document.querySelectorAll('.phone').forEach((phone) => { phone.querySelector('.phone-scroll').scrollTop = scroll[phone.dataset.context] ?? 0; });
  syncURL();
  obMountPreview();
  if (state.tab === 'onboarding' && !onboardingFlowView) obPaint();
  mountPhotoCamera();
  studioAfterRender();
}

function announce(message) {
  document.querySelector('#announcer').textContent = message;
}

function toast(message, context) {
  clearTimeout(toastTimeout);
  document.querySelectorAll('.toast').forEach((item) => item.remove());
  const phone = document.querySelector(`.phone[data-context="${context}"]`);
  if (phone) phone.insertAdjacentHTML('beforeend', `<div class="toast" role="status">${escapeHTML(message)}</div>`);
  toastTimeout = setTimeout(() => document.querySelectorAll('.toast').forEach((item) => item.remove()), 2400);
  announce(message);
}

function closeDialog(force = false) {
  if (!force && state.dialog?.kind === 'routine' && requestRoutineBack()) return;
  if (!force && state.dialog?.kind === 'sleep' && requestSleepClose()) return;
  if (!force && state.dialog?.kind === 'my' && requestMyClose()) return;
  if (!force && state.dialog?.kind === 'my' && state.dialog.returnTopic) { finishMyDialog(); return; }
  const context = state.dialog?.context ?? 'single';
  const recordId = state.dialog?.recordId;
  const returnAction = state.dialog?.returnAction;
  const myTopic = state.dialog?.kind === 'my' ? state.dialog.topic : null;
  const questionDialog = state.dialog?.kind === 'question';
  const reportTopic = state.dialog?.kind === 'report' ? state.dialog.topic : null;
  state.dialog = null;
  sleepEditor = null;
  timer = { status: 'idle', seconds: 0 };
  render();
  const phone = document.querySelector(`.phone[data-context="${context}"]`);
  if (reportTopic) { (reportTopic === 'weekly' ? phone?.querySelector('[data-report-action="weekly"]') : phone?.querySelector(`[data-report-info="${reportTopic}"]`))?.focus(); return; }
  if (questionDialog) { phone?.querySelector('[data-question-action="begin"]')?.focus(); return; }
  if (myTopic) { (phone?.querySelector(`[data-my-open="${myTopic}"]`) ?? phone?.querySelector('[data-tab="my"]'))?.focus(); return; }
  if (returnAction) { phone?.querySelector(`[data-action="${returnAction}"]`)?.focus(); return; }
  (recordId ? phone?.querySelector(`[data-record="${recordId}"]`) : null)?.focus();
  if (!recordId || !phone?.querySelector(`[data-record="${recordId}"]`)) phone?.querySelector('.action-row .cta')?.focus();
}

function openDialog(kind, recordId, context) {
  if (kind === 'sleep') { openSleepEditor(recordId, context); return; }
  if (kind === 'photo') startPhotoFlow();
  state.dialog = { kind, recordId, context };
  timer = { status: 'idle', seconds: 0 };
  render();
  document.querySelector('.entry-panel .icon-button')?.focus();
}

function elapsedSeconds() {
  return timer.status === 'running' ? timer.seconds + Math.floor((Date.now() - timer.startedAt) / 1000) : timer.seconds;
}

function paintTimer() {
  const readout = document.querySelector('[data-timer-readout]');
  if (!readout) return;
  const elapsed = elapsedSeconds();
  readout.textContent = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  const button = document.querySelector('[data-timer-toggle]');
  button.textContent = timer.status === 'running' ? '일시정지' : timer.status === 'paused' ? '계속' : '시작';
}

document.addEventListener('click', (event) => {
  if (event.target.matches('.phone-overlay')) { closeDialog(); return; }
  const button = event.target.closest('button');
  if (!button) return;
  const context = button.closest('.phone')?.dataset.context ?? 'single';
  if (button.dataset.tab) {
    state.tab = button.dataset.tab;
    state.dialog = null;
    render(false);
    document.querySelector(`.phone [data-tab="${state.tab}"]`)?.focus();
  } else if (button.dataset.preset) {
    state.preset = button.dataset.preset;
    state.config = { ...PRESETS[state.preset].config };
    state.dialog = null;
    render();
    document.querySelector(`[data-preset="${state.preset}"]`)?.focus();
    announce(`${state.preset.toUpperCase()} ${PRESETS[state.preset].name}`);
  } else if (button.dataset.config) {
    const key = button.dataset.config;
    state.config[key] = button.dataset.value;
    state.compare = false;
    state.dialog = null;
    render();
    document.querySelector(`[data-config="${key}"][data-value="${state.config[key]}"]`)?.focus();
  } else if (button.dataset.scenario) {
    state.scenario = button.dataset.scenario;
    state.day = 4;
    records = seedData(state.scenario);
    state.dialog = null;
    render(false);
    document.querySelector(`[data-scenario="${state.scenario}"]`)?.focus();
  } else if (button.dataset.segment) {
    state.segment = button.dataset.segment;
    state.dialog = null;
    render(false);
    document.querySelector(`#seg-${context}-${state.segment}`)?.focus();
    announce(`${SEGMENTS[state.segment]} 기록`);
  } else if (button.dataset.day !== undefined) {
    state.day = Number(button.dataset.day);
    render();
    const selector = button.classList.contains('chart-day') ? '.chart-day' : '.day-chip';
    document.querySelector(`.phone[data-context="${context}"] ${selector}[data-day="${state.day}"]`)?.focus();
    announce(`11월 ${9 + state.day}일 ${SEGMENTS[state.segment]} 기록`);
  } else if (button.id === 'compare-toggle') {
    state.compare = !state.compare;
    state.dialog = null;
    render(false);
    document.querySelector('#compare-toggle').focus();
  } else if (button.id === 'reset-data') {
    routineResults = {};
    routinePlayer = null;
    records = seedData(state.scenario);
    state.day = 4;
    state.dialog = null;
    render(false);
    document.querySelector('#reset-data').focus();
    announce('합성 기록을 초기화했습니다.');
  } else if (button.dataset.action) {
    const action = button.dataset.action;
    if (action === 'close') { closeDialog(); return; }
    if (action === 'edit') { openDialog(state.segment, button.dataset.record, context); return; }
    if (['meal', 'workout', 'sleep', 'timer', 'photo'].includes(action)) {
      openDialog(action, action === 'sleep' ? records[state.day].sleep[0]?.id ?? null : null, context);
      return;
    }
    if (action === 'delete') {
      records[state.day][state.segment] = records[state.day][state.segment].filter((record) => record.id !== state.dialog.recordId);
      closeDialog();
      toast('기록을 삭제했어요', context);
    } else if (action === 'timer-toggle') {
      timer = timer.status === 'running' ? { status: 'paused', seconds: elapsedSeconds() } : { status: 'running', seconds: timer.seconds, startedAt: Date.now() };
      paintTimer();
    } else if (action === 'timer-reset') {
      timer = { status: 'idle', seconds: 0 };
      paintTimer();
    }
  }
});

document.addEventListener('submit', (event) => {
  const form = event.target.closest('[data-form]');
  if (!form) return;
  event.preventDefault();
  const input = new FormData(form);
  const dialog = state.dialog;
  const items = records[state.day][state.segment];
  const id = dialog.recordId ?? `demo-${state.segment}-${nextId++}`;
  let record;
  if (form.dataset.form === 'meal') {
    const numeric = (key) => String(input.get(key)).trim() === '' ? null : Number(input.get(key));
    record = { id, slot: input.get('slot'), time: input.get('time'), energy: numeric('energy'), protein: numeric('protein'), calcium: numeric('calcium'), vitaminD3: numeric('vitaminD3') };
  } else {
    const isTimer = form.dataset.form === 'timer';
    if (isTimer && elapsedSeconds() < 1) { form.querySelector('[data-form-error]').textContent = '타이머를 시작한 뒤 저장하세요.'; return; }
    const existing = items.find((item) => item.id === id);
    record = { id, name: String(input.get('name')).trim(), minutes: isTimer ? Math.max(1, Math.ceil(elapsedSeconds() / 60)) : Number(input.get('minutes')), source: isTimer ? '타이머' : existing?.source ?? '직접 입력', time: existing?.time ?? '09:41' };
    if (!record.name) { form.querySelector('[data-form-error]').textContent = '운동 이름을 입력하세요.'; return; }
  }
  const index = items.findIndex((item) => item.id === id);
  if (index >= 0) items[index] = record;
  else items.push(record);
  if (state.segment === 'meal') items.sort((left, right) => left.time.localeCompare(right.time));
  const context = dialog.context;
  closeDialog();
  toast('저장했어요', context);
});

document.addEventListener('keydown', (event) => {
  const panel = state.dialog ? document.querySelector('.entry-panel') : null;
  if (event.key === 'Escape' && panel) { event.preventDefault(); closeDialog(); return; }
  if (event.key === 'Tab' && panel) {
    const focusable = [...panel.querySelectorAll('button, input, select')].filter((el) => !el.disabled);
    const first = focusable[0], last = focusable.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    return;
  }
  if (event.target.closest('input, select, textarea') || event.ctrlKey || event.metaKey || event.altKey || panel) return;
  if (state.tab !== 'growth') return;
  if (['ArrowLeft', 'ArrowRight'].includes(event.key) && event.target.matches('[role="tab"]')) {
    event.preventDefault();
    const keys = Object.keys(SEGMENTS);
    const next = (keys.indexOf(state.segment) + (event.key === 'ArrowRight' ? 1 : 2)) % 3;
    document.querySelector(`#seg-${event.target.closest('.phone').dataset.context}-${keys[next]}`)?.click();
    return;
  }
  if (['1', '2', '3'].includes(event.key)) document.querySelector(`[data-preset="${['a', 'b', 'c'][Number(event.key) - 1]}"]`).click();
  else if (['w', 'm', 's'].includes(event.key.toLowerCase())) {
    const segment = { w: 'workout', m: 'meal', s: 'sleep' }[event.key.toLowerCase()];
    document.querySelector(`[data-segment="${segment}"]`).click();
  } else if (['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    const next = Math.max(0, Math.min(6, state.day + (event.key === 'ArrowRight' ? 1 : -1)));
    document.querySelector(`.day-chip[data-day="${next}"]`).click();
  }
});

render(false);
setInterval(paintTimer, 250);
if (['127.0.0.1', 'localhost', '[::1]'].includes(location.hostname)) {
  let sourceVersion;
  setInterval(async () => {
    try {
      const response = await fetch('/__version', { cache: 'no-store' });
      if (!response.ok) return;
      const { version } = await response.json();
      if (sourceVersion && version !== sourceVersion) location.reload();
      sourceVersion = version;
    } catch { /* The loopback server can restart between polls. */ }
  }, 1500);
}
