/**
 * MasterMind Survey — 설문 전체 로직
 *
 * 1. Google Sheets "문항" 시트에서 문항 데이터 fetch
 * 2. 파트별 동적 UI 렌더링
 * 3. 파트 전환 / 프로그레스 바
 * 4. 유효성 검증
 * 5. Google Sheets "응답" 시트로 제출
 */

// ★ 배포 후 Google Apps Script 웹앱 URL로 교체
const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwFRtjPBdc6GyDVYNZsJ04pD8uvLiHuhBly_FNPhzCDeJ_cFRfG0x3wtOOXLmwi2U-UVg/exec';

// ── DOM ──
const $ = (sel) => document.querySelector(sel);
const screens = {
  intro:    $('#intro-screen'),
  loading:  $('#loading-screen'),
  survey:   $('#survey-screen'),
  complete: $('#complete-screen'),
  error:    $('#error-screen'),
};

// ── State ──
let parts = [];          // [{ partNum, title, desc, questions: [...] }]
let currentPart = 0;     // index into parts[]
let responses = {};      // { Q1: 'value', Q2: 'value', ... }
let isSubmitting = false;

// ═══════════════════════
//  화면 전환
// ═══════════════════════

function showScreen(name) {
  Object.values(screens).forEach((s) => s.classList.remove('active'));
  screens[name].classList.add('active');
}

// ═══════════════════════
//  데이터 로딩 & 파싱
// ═══════════════════════

async function loadSurveyData() {
  const res = await fetch(SCRIPT_URL);
  if (!res.ok) throw new Error('Network error');
  const raw = await res.json();
  return parseSurveyData(raw);
}

function parseSurveyData(rows) {
  const partMap = {};

  rows.forEach((row) => {
    const partNum = Number(row['파트번호'] || row['part']);
    if (!partMap[partNum]) {
      partMap[partNum] = {
        partNum,
        title: row['파트제목'] || '',
        desc: row['파트안내문구'] || '',
        questions: [],
      };
    }
    partMap[partNum].questions.push({
      id:          row['문항ID'] || row['id'],
      type:        (row['문항유형'] || row['type'] || 'text').toLowerCase(),
      text:        row['문항텍스트'] || row['text'] || '',
      options:     (row['선택지'] || '').split(',').map((s) => s.trim()).filter(Boolean),
      required:    (row['필수여부'] || 'Y').toUpperCase() === 'Y',
      placeholder: row['placeholder'] || '',
      unit:        row['단위'] || '',
    });
    // 파트 제목은 첫 행에서만 세팅
    if (row['파트제목']) partMap[partNum].title = row['파트제목'];
    if (row['파트안내문구']) partMap[partNum].desc = row['파트안내문구'];
  });

  return Object.keys(partMap)
    .sort((a, b) => a - b)
    .map((k) => partMap[k]);
}

// ═══════════════════════
//  렌더링
// ═══════════════════════

function renderPart(partIndex) {
  const part = parts[partIndex];
  const container = $('#survey-content');

  let html = `<div class="part-header">
    <div class="part-title">Part ${part.partNum}. ${part.title}</div>
    ${part.desc ? `<p class="part-desc">${part.desc}</p>` : ''}
  </div>`;

  part.questions.forEach((q) => {
    html += `<div class="question-block" data-id="${q.id}">`;
    html += `<div class="question-label"><span class="question-number">${q.id}.</span> ${q.text}</div>`;

    if (q.type === 'radio') {
      html += renderRadio(q);
    } else if (q.type === 'number') {
      html += renderNumber(q);
    } else if (q.type === 'email') {
      html += renderEmail(q);
    } else {
      html += renderText(q);
    }

    html += `<div class="error-message" id="err-${q.id}"></div>`;
    html += `</div>`;
  });

  container.innerHTML = html;
  container.scrollTop = 0;
  window.scrollTo(0, 0);

  // 라디오 이벤트 바인딩
  container.querySelectorAll('.radio-option').forEach((opt) => {
    opt.addEventListener('click', () => {
      const group = opt.closest('.radio-group');
      group.querySelectorAll('.radio-option').forEach((o) => o.classList.remove('selected'));
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
      const qid = opt.closest('.question-block').dataset.id;
      responses[qid] = opt.querySelector('input').value;
      clearError(qid);
    });
  });

  // 텍스트/숫자/이메일 이벤트
  container.querySelectorAll('input.text-input, input.number-input, input.email-input').forEach((input) => {
    input.addEventListener('input', () => {
      const qid = input.closest('.question-block').dataset.id;
      responses[qid] = input.value;
      clearError(qid);
    });
    // 기존 값 복원
    const qid = input.closest('.question-block').dataset.id;
    if (responses[qid]) input.value = responses[qid];
  });

  // 라디오 기존 값 복원
  container.querySelectorAll('.radio-option').forEach((opt) => {
    const qid = opt.closest('.question-block').dataset.id;
    if (responses[qid] && opt.querySelector('input').value === responses[qid]) {
      opt.classList.add('selected');
      opt.querySelector('input').checked = true;
    }
  });

  updateProgress();
  updateNav();
}

function renderRadio(q) {
  let html = `<div class="radio-group">`;
  q.options.forEach((opt, i) => {
    html += `<label class="radio-option">
      <input type="radio" name="${q.id}" value="${opt}">
      <span class="radio-dot"></span>
      <span class="radio-text">${opt}</span>
    </label>`;
  });
  html += `</div>`;
  return html;
}

function renderText(q) {
  return `<input type="text" class="text-input" data-qid="${q.id}"
    placeholder="${q.placeholder || '입력해주세요'}">`;
}

function renderNumber(q) {
  return `<input type="number" class="number-input" data-qid="${q.id}"
    placeholder="${q.placeholder || '숫자를 입력해주세요'}" inputmode="numeric">
    ${q.unit ? `<div class="input-unit">단위: ${q.unit}</div>` : ''}`;
}

function renderEmail(q) {
  return `<input type="email" class="email-input" data-qid="${q.id}"
    placeholder="${q.placeholder || '이메일 주소를 입력해주세요'}" inputmode="email">`;
}

// ═══════════════════════
//  네비게이션 & 프로그레스
// ═══════════════════════

function updateProgress() {
  const pct = ((currentPart + 1) / parts.length) * 100;
  $('#progress-fill').style.width = pct + '%';
  $('#progress-label').textContent = `Part ${currentPart + 1} / ${parts.length}`;
}

function updateNav() {
  const prevBtn = $('#prev-btn');
  const nextBtn = $('#next-btn');
  prevBtn.style.visibility = currentPart === 0 ? 'hidden' : 'visible';

  if (currentPart === parts.length - 1) {
    nextBtn.textContent = '제출하기';
    nextBtn.onclick = handleSubmit;
  } else {
    nextBtn.textContent = '다음';
    nextBtn.onclick = goNext;
  }
}

function goNext() {
  if (!validateCurrentPart()) return;
  currentPart++;
  renderPart(currentPart);
}

function goPrev() {
  if (currentPart > 0) {
    currentPart--;
    renderPart(currentPart);
  }
}

// ═══════════════════════
//  유효성 검증
// ═══════════════════════

function validateCurrentPart() {
  const part = parts[currentPart];
  let valid = true;

  part.questions.forEach((q) => {
    const val = responses[q.id];

    if (q.required) {
      if (q.type === 'radio' && !val) {
        showError(q.id, '선택지를 선택해주세요.');
        valid = false;
      } else if (q.type === 'number') {
        if (!val || isNaN(Number(val)) || Number(val) < 0) {
          showError(q.id, '올바른 숫자를 입력해주세요.');
          valid = false;
        }
      } else if (q.type === 'text' && !val) {
        showError(q.id, '내용을 입력해주세요.');
        valid = false;
      }
    }

    if (q.type === 'email' && val) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(val)) {
        showError(q.id, '올바른 이메일 형식을 입력해주세요.');
        valid = false;
      }
    }
  });

  return valid;
}

function showError(qid, msg) {
  const block = document.querySelector(`.question-block[data-id="${qid}"]`);
  if (!block) return;
  block.classList.add('has-error');
  const errEl = block.querySelector('.error-message');
  if (errEl) { errEl.textContent = msg; errEl.classList.add('visible'); }
}

function clearError(qid) {
  const block = document.querySelector(`.question-block[data-id="${qid}"]`);
  if (!block) return;
  block.classList.remove('has-error');
  const errEl = block.querySelector('.error-message');
  if (errEl) { errEl.textContent = ''; errEl.classList.remove('visible'); }
}

// ═══════════════════════
//  제출
// ═══════════════════════

async function handleSubmit() {
  if (!validateCurrentPart()) return;
  if (isSubmitting) return;
  isSubmitting = true;

  const nextBtn = $('#next-btn');
  nextBtn.disabled = true;
  nextBtn.innerHTML = '<span class="btn-spinner"></span>제출 중...';

  try {
    const res = await fetch(SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(responses),
    });

    if (!res.ok) throw new Error('Submit failed');

    // 이메일 입력 시 메시지 커스텀
    const emailQ = parts.flatMap((p) => p.questions).find((q) => q.type === 'email');
    if (emailQ && responses[emailQ.id]) {
      $('#complete-message').textContent =
        '클로즈드 베타 초대장과 벤치마크 리포트를 보내드리겠습니다.';
    }

    showScreen('complete');
  } catch (e) {
    console.error('Submit error:', e);
    nextBtn.disabled = false;
    nextBtn.textContent = '제출하기';
    isSubmitting = false;
    alert('제출에 실패했습니다. 다시 시도해주세요.');
  }
}

// ═══════════════════════
//  초기화
// ═══════════════════════

async function init() {
  // 인트로 → 시작 버튼
  $('#start-btn').addEventListener('click', async () => {
    showScreen('loading');
    try {
      parts = await loadSurveyData();
      if (!parts.length) throw new Error('No data');
      currentPart = 0;
      showScreen('survey');
      renderPart(0);
    } catch (e) {
      console.error('Load error:', e);
      showScreen('error');
    }
  });

  // 네비게이션 (onclick은 updateNav()에서 동적으로 설정)
  $('#prev-btn').addEventListener('click', goPrev);

  // 재시도
  $('#retry-btn').addEventListener('click', () => {
    showScreen('intro');
  });
}

document.addEventListener('DOMContentLoaded', init);
