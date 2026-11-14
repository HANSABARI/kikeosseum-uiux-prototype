let photoFlow = null;
let cameraStream = null;
let photoWait;
let photoCalculationWait;

const PHOTO_FOODS = [
  { label: '현미밥', amount: '150', selected: '', candidates: [
    { code: 'demo-rice-brown', name: '현미밥', energy: 153, protein: 3.3, calcium: 7, vitaminD3: null },
    { code: 'demo-rice-white', name: '쌀밥', energy: 150, protein: 2.7, calcium: 5, vitaminD3: null },
  ] },
  { label: '닭가슴살', amount: '100', selected: '', candidates: [
    { code: 'demo-chicken', name: '닭가슴살 · 구운 것', energy: 165, protein: 31, calcium: 15, vitaminD3: null },
    { code: 'demo-chicken-boiled', name: '닭가슴살 · 삶은 것', energy: 150, protein: 29, calcium: 12, vitaminD3: null },
  ] },
  { label: '채소', amount: '80', selected: '', candidates: [
    { code: 'demo-vegetable', name: '채소 샐러드', energy: 56, protein: 2.5, calcium: 81, vitaminD3: null },
  ] },
];

function stopPhotoCamera() {
  cameraStream?.getTracks().forEach(track => track.stop());
  cameraStream = null;
}

function disposePhoto() {
  clearTimeout(photoWait);
  clearTimeout(photoCalculationWait);
  stopPhotoCamera();
  photoFlow = null;
}

function startPhotoFlow(stage = 'camera') {
  disposePhoto();
  photoFlow = { stage, image: null, source: 'sample', requesting: false, cameraError: '', foods: JSON.parse(JSON.stringify(PHOTO_FOODS)), meal: { slot: '점심', time: '12:30' }, calculation: { status: 'incomplete', totals: null }, revision: 0 };
  photoFlow.foods.forEach(food => { food.selected = food.candidates[0]?.code ?? ''; });
}

function photoImage(className = '') {
  return photoFlow.image ? `<img class="${className}" src="${photoFlow.image}" alt="촬영한 식사">` : `<div class="photo-illustration ${className}">${sampleIllustration()}</div>`;
}

function photoSelectionsValid() {
  return photoFlow.foods.length > 0 && photoFlow.foods.length <= 20 && photoFlow.foods.every(food => food.candidates.some(candidate => candidate.code === food.selected) && /^(0|[1-9][0-9]{0,5})(\.[0-9]{1,6})?$/.test(food.amount) && Number(food.amount) > 0 && Number(food.amount) <= 100000);
}

function photoTotals() {
  const foods = photoFlow.foods.map(food => ({ ...food.candidates.find(candidate => candidate.code === food.selected), amount: Number(food.amount) }));
  return ['energy', 'protein', 'calcium', 'vitaminD3'].map(key => {
    const unknown = foods.filter(food => food[key] === null).length;
    const known = foods.filter(food => food[key] !== null);
    return { key, unknown, value: known.length ? Math.round(known.reduce((sum, food) => sum + food[key] * food.amount / 100, 0) * 1000000) / 1000000 : null };
  });
}

function renderPhotoCalculation() {
  const calculation = photoFlow.calculation;
  const ready = calculation.status === 'ready';
  const totals = ready ? calculation.totals : ['energy', 'protein', 'calcium', 'vitaminD3'].map(key => ({ key, value: null }));
  const status = { incomplete: '음식과 중량을 확인하면 합계가 계산돼요.', calculating: '영양 합계를 다시 계산하고 있어요.', ready: '현재 음식과 중량을 반영했어요.', error: '계산하지 못했어요. 다시 시도해 주세요.' };
  return `<div class="photo-calculation-heading"><h4>영양 합계</h4><span role="status" aria-live="polite">${calculation.status === 'calculating' ? '<span class="photo-inline-spinner" aria-hidden="true"></span>계산 중' : ready ? '계산 완료' : ''}</span></div><div class="photo-nutrition-totals photo-unified-totals" aria-busy="${calculation.status === 'calculating'}">${totals.map(total => { const n = NUTRIENTS.find(n => n.key === total.key); return `<div><span>${n?.label ?? '칼로리'}</span><strong>${number(total.value)} <small>${n?.unit ?? 'kcal'}</small></strong></div>`; }).join('')}</div><p class="photo-calculation-note">${status[calculation.status]}</p>${calculation.status === 'error' ? '<button class="photo-recalculate" data-action="photo-recalculate">다시 계산</button>' : ''}`;
}

function paintPhotoCalculation() {
  const area = document.querySelector('[data-photo-calculation]');
  if (area && photoFlow?.stage === 'review') area.innerHTML = renderPhotoCalculation();
}

function schedulePhotoCalculation() {
  clearTimeout(photoCalculationWait);
  const flow = photoFlow;
  const revision = ++flow.revision;
  if (!photoSelectionsValid()) {
    flow.calculation = { status: 'incomplete', totals: null };
    paintPhotoCalculation();
    return;
  }
  flow.calculation = { status: 'calculating', totals: null };
  paintPhotoCalculation();
  photoCalculationWait = setTimeout(() => {
    if (photoFlow !== flow || flow.revision !== revision || flow.stage !== 'review') return;
    flow.calculation = { status: 'ready', totals: photoTotals() };
    paintPhotoCalculation();
  }, 700);
}

function renderPhotoDialog(context) {
  const flow = photoFlow;
  const headings = { camera: '음식 촬영', captured: '이 사진으로 분석할까요?', analyzing: '음식을 확인하고 있어요', review: '식사 확인', error: '분석을 마치지 못했어요' };
  const stages = ['camera', 'captured', 'analyzing', 'review'];
  let body = '', actions = '';
  if (flow.stage === 'camera') {
    body = `<div class="camera-viewport">${cameraStream ? '<video data-camera-video autoplay playsinline muted></video>' : `<div class="camera-empty">${icon('camera', 42)}<p>음식이 잘 보이게 담아주세요</p><small>${flow.requesting ? '카메라 권한을 기다리고 있어요' : '카메라를 켜고 촬영해 주세요'}</small></div>`}<div class="camera-guides" aria-hidden="true"></div></div>${flow.cameraError ? `<p class="camera-error" role="alert">${escapeHTML(flow.cameraError)}</p>` : ''}<div class="photo-tips"><span>접시 전체가 보이게</span><span>밝은 곳에서</span></div><button class="photo-sample-link" data-action="photo-sample">샘플 사진으로 둘러보기</button>`;
    actions = `<button class="cta" data-action="${cameraStream ? 'photo-shutter' : 'photo-enable'}" ${flow.requesting ? 'disabled' : ''}>${icon('camera', 19)}${cameraStream ? '촬영' : flow.requesting ? '카메라 연결 중' : '카메라 켜기'}</button>`;
  } else if (flow.stage === 'captured') {
    body = `<div class="photo-large">${photoImage()}</div><p class="photo-capture-hint">흐리거나 음식이 가려졌다면 다시 찍어주세요.</p>`;
    actions = '<button class="cta secondary" data-action="photo-retake">다시 촬영</button><button class="cta" data-action="photo-analyze">이 사진 사용</button>';
  } else if (flow.stage === 'analyzing') {
    body = `<div class="photo-progress-image">${photoImage()}<div class="scan-line" aria-hidden="true"></div></div><div class="recognition-status" role="status"><span class="photo-spinner" aria-hidden="true"></span><h4>음식 후보와 양을 찾고 있어요</h4><p>분석 후 한 화면에서 식사를 확인할 수 있어요.</p></div>`;
    actions = '<button class="cta secondary" data-action="close">취소</button>';
  } else if (flow.stage === 'review') {
    body = `<div class="photo-review-intro">${photoImage()}<div><strong>${flow.foods.length}개 음식</strong><p>음식과 양을 고치면 합계가 바뀌어요.</p></div></div><div class="field-row photo-meal-fields"><label class="field"><span>식사</span><select name="photo-slot" data-photo-meal-field="slot">${['아침', '점심', '저녁', '간식'].map(slot => `<option ${flow.meal.slot === slot ? 'selected' : ''}>${slot}</option>`).join('')}</select></label><label class="field"><span>먹은 시각</span><input name="photo-time" type="time" value="${escapeHTML(flow.meal.time)}" data-photo-meal-field="time" required></label></div><div class="recognized-foods">${flow.foods.map((food, i) => `<article class="recognized-food"><div class="recognized-heading"><span class="food-index">${i + 1}</span><h4>${food.label}</h4><button class="icon-button" type="button" data-action="photo-remove" data-index="${i}" aria-label="${food.label} 제외">${icon('close', 16)}</button></div><div class="food-review-fields"><label class="field"><span>식품</span><select data-food-index="${i}" data-food-field="selected">${food.candidates.length ? '' : '<option value="">일치하는 식품 없음</option>'}${food.candidates.map(candidate => `<option value="${candidate.code}" ${food.selected === candidate.code ? 'selected' : ''}>${candidate.name}</option>`).join('')}</select></label><label class="field"><span>중량 · g</span><input aria-label="${food.label} 섭취 중량 g" type="number" min="0.000001" max="100000" step="0.000001" inputmode="decimal" value="${escapeHTML(food.amount)}" data-food-index="${i}" data-food-field="amount"></label></div></article>`).join('')}</div><section class="photo-unified-calculation" data-photo-calculation>${renderPhotoCalculation()}</section><p class="photo-save-limit">사진 분석 결과의 기록 저장은 아직 지원되지 않아요.</p>`;
    actions = '<button class="cta secondary" data-action="photo-retake">다시 촬영</button><button class="cta" disabled>저장 미지원</button>';
  } else {
    body = `<div class="photo-failure">${icon('camera', 44)}<h4>음식을 확인할 수 없어요</h4><p>다시 시도하거나 더 선명한 사진을 찍어주세요.</p></div>`;
    actions = '<button class="cta secondary" data-action="photo-retake">다시 촬영</button><button class="cta" data-action="photo-analyze">다시 시도</button>';
  }
  return `<div class="phone-overlay" data-backdrop="${context}"><section class="entry-panel fullscreen photo-panel" role="dialog" aria-modal="true" aria-labelledby="photo-title-${context}"><div class="entry-heading"><div><h3 id="photo-title-${context}">${headings[flow.stage]}</h3><p>${flow.stage === 'error' ? '다시 시도할 수 있어요' : `${stages.indexOf(flow.stage) + 1} / ${stages.length}`}</p></div><button class="icon-button" data-action="close" aria-label="닫기">${icon('close', 21)}</button></div><div class="photo-stage-track" aria-hidden="true">${stages.map((stage, i) => `<span class="${i <= stages.indexOf(flow.stage) ? 'filled' : ''}"></span>`).join('')}</div><div class="entry-body">${body}</div><div class="entry-actions">${actions}</div><p class="photo-demo-label">${flow.source === 'sample' ? '샘플 사진 · ' : ''}인식·영양값은 합성 시안</p></section></div>`;
}

function mountPhotoCamera() {
  const video = document.querySelector('[data-camera-video]');
  if (video && cameraStream) { video.srcObject = cameraStream; video.play().catch(() => {}); }
}

async function enablePhotoCamera() {
  const flow = photoFlow;
  const cameraRequest = (flow.cameraRequest ?? 0) + 1;
  flow.cameraRequest = cameraRequest;
  flow.requesting = true;
  flow.cameraError = '';
  render();
  try {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('unsupported');
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 } }, audio: false });
    if (photoFlow !== flow || flow.stage !== 'camera' || flow.cameraRequest !== cameraRequest || (typeof studioMode !== 'undefined' && studioMode !== 'play')) { stream.getTracks().forEach(track => track.stop()); flow.requesting = false; return; }
    cameraStream = stream;
    flow.source = 'camera';
  } catch (error) {
    if (photoFlow !== flow || flow.cameraRequest !== cameraRequest) return;
    flow.cameraError = error.name === 'NotAllowedError' ? '카메라 권한이 필요해요. 브라우저에서 허용한 뒤 다시 켜주세요.' : '카메라를 연결할 수 없어요. 연결을 확인하거나 샘플로 둘러보세요.';
  }
  if (photoFlow === flow) { flow.requesting = false; render(); }
}

function advancePhoto(stage) {
  clearTimeout(photoWait);
  stopPhotoCamera();
  photoFlow.stage = stage;
  render();
  if (stage === 'review') schedulePhotoCalculation();
  document.querySelector('.photo-panel .icon-button')?.focus();
  announce(document.querySelector('.photo-panel h3').textContent);
}

function waitForPhoto(stage, nextStage) {
  const flow = photoFlow;
  advancePhoto(stage);
  photoWait = setTimeout(() => { if (photoFlow === flow && flow.stage === stage) advancePhoto(nextStage); }, 3500);
}

document.addEventListener('click', event => {
  const preview = event.target.closest('[data-photo-preview]');
  if (preview) {
    state.segment = 'meal';
    state.compare = false;
    const calculated = preview.dataset.photoPreview === 'calculated';
    startPhotoFlow(calculated ? 'review' : preview.dataset.photoPreview);
    if (calculated) {
      photoFlow.calculation = { status: 'ready', totals: photoTotals() };
    }
    state.dialog = { kind: 'photo', recordId: null, context: 'single' };
    render();
    if (photoFlow.stage === 'review' && !calculated) schedulePhotoCalculation();
    return;
  }
  const button = event.target.closest('[data-action^="photo-"]');
  if (!button || !photoFlow) return;
  const action = button.dataset.action;
  if (action === 'photo-enable') enablePhotoCamera();
  else if (action === 'photo-shutter') {
    const video = document.querySelector('[data-camera-video]');
    if (!video?.videoWidth) { photoFlow.cameraError = '카메라가 준비되는 중이에요. 잠시 후 촬영해 주세요.'; render(); return; }
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    photoFlow.image = canvas.toDataURL('image/jpeg', .85);
    advancePhoto('captured');
  } else if (action === 'photo-sample') {
    photoFlow.image = null;
    photoFlow.source = 'sample';
    advancePhoto('captured');
  } else if (action === 'photo-retake') {
    const context = state.dialog.context;
    startPhotoFlow();
    state.dialog = { kind: 'photo', recordId: null, context };
    render();
  } else if (action === 'photo-analyze') waitForPhoto('analyzing', 'review');
  else if (action === 'photo-recalculate') schedulePhotoCalculation();
  else if (action === 'photo-remove') { photoFlow.foods.splice(Number(button.dataset.index), 1); render(); schedulePhotoCalculation(); }
});

function updatePhotoSelection(event) {
  if (!photoFlow || photoFlow.stage !== 'review') return;
  const metadata = event.target.closest('[data-photo-meal-field]');
  if (metadata) {
    photoFlow.meal[metadata.dataset.photoMealField] = metadata.value;
    return;
  }
  const input = event.target.closest('[data-food-index]');
  if (!input) return;
  const food = photoFlow.foods[Number(input.dataset.foodIndex)];
  if (food[input.dataset.foodField] === input.value) return;
  food[input.dataset.foodField] = input.value;
  schedulePhotoCalculation();
}
document.addEventListener('input', updatePhotoSelection);
document.addEventListener('change', updatePhotoSelection);
window.addEventListener('pagehide', disposePhoto);
