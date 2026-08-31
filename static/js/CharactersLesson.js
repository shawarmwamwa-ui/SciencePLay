// CharactersLesson.js
// Interactive slide presentation engine for "Characters of Living Things".

import { CHARACTERS_LESSON_SLIDES } from './charactersLessonData.js';
import { speakText } from './ttsHelper.js';

const state = {
  slides: CHARACTERS_LESSON_SLIDES,
  currentIndex: 0,
  discovered: {},    // { <slideId>: Set of discovered hotspot ids }
  checkAnswered: {}, // { <slideId>: boolean }
  matchedPairs: new Set(),
  lastSavedTime: performance.now(),
};

function currentSlide() {
  return state.slides[state.currentIndex];
}

function isSlideComplete(slide) {
  if (slide.type === 'intro' || slide.type === 'summary') return true;
  if (slide.type === 'hotspots') {
    const disc = state.discovered[slide.id] || new Set();
    return slide.hotspots.every(h => disc.has(h.id));
  }
  if (slide.type === 'quick-check') {
    return Boolean(state.checkAnswered[slide.id]);
  }
  if (slide.type === 'matching') {
    return state.matchedPairs.size >= slide.pairs.length;
  }
  return true;
}

function updateProgressBar() {
  const total = state.slides.length;
  const done = state.slides.filter(s => isSlideComplete(s)).length;
  const pct = Math.round((done / total) * 100);
  const fill = document.querySelector('#char-progress-fill');
  const info = document.querySelector('#char-progress-info');
  if (fill) fill.style.width = `${pct}%`;
  if (info) info.textContent = `${state.currentIndex + 1} / ${total}`;
}

function saveProgress(completed = false) {
  const lessonId = window.currentLessonId || 2;
  const total = state.slides.length;
  const done = state.slides.filter(s => isSlideComplete(s)).length;
  const pct = Math.round((done / total) * 100);

  const now = performance.now();
  const timeSpentDelta = Math.max(1, Math.round((now - state.lastSavedTime) / 1000));
  state.lastSavedTime = now;

  fetch('/student/lesson_progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lesson_id: lessonId,
      progress_percent: completed ? 100 : pct,
      current_slide: state.currentIndex,
      completed: completed ? 'true' : 'false',
      time_spent: timeSpentDelta,
    }),
  }).catch(() => {});
}

function setNextDisabled(disabled) {
  const btn = document.querySelector('#char-next');
  if (!btn) return;
  if (disabled) {
    btn.setAttribute('disabled', '');
  } else {
    btn.removeAttribute('disabled');
  }
}

function renderSlide(index) {
  state.currentIndex = index;
  const slide = state.slides[index];
  const container = document.querySelector('#char-slide-container');
  if (!container) return;

  container.innerHTML = '';
  setNextDisabled(!isSlideComplete(slide));

  if (slide.type === 'intro') {
    container.innerHTML = `
      <div class="text-center py-2">
        <div class="mb-2">
          <img src="${slide.image}" alt="Lesson Intro" style="max-height: 140px; width: auto;" class="img-fluid drop-shadow">
        </div>
        <h2 class="fw-bold text-dark mb-3 fs-2">${slide.title}</h2>
        <p class="lead text-secondary max-w-600 mx-auto mb-4 fs-5">${slide.description}</p>
        <button id="char-start-btn" class="btn btn-lg btn-success rounded-pill px-5 fw-bold shadow-sm">
          <i class="bi bi-play-fill me-2"></i>Start Lesson
        </button>
      </div>
    `;
    container.querySelector('#char-start-btn')?.addEventListener('click', goNext);
  } else if (slide.type === 'hotspots') {
    const disc = state.discovered[slide.id] || new Set();
    let hotspotDots = slide.hotspots.map(h => `
      <button class="char-hotspot-dot ${disc.has(h.id) ? 'discovered' : ''}" style="left: ${h.x}%; top: ${h.y}%;" data-id="${h.id}" aria-label="${h.label}">
        <span class="hotspot-pulse"></span>
        <span class="hotspot-icon">💡</span>
      </button>
    `).join('');

    container.innerHTML = `
      <div class="hotspot-slide-wrap">
        <div class="row align-items-center g-4">
          <div class="col-md-7">
            <h3 class="fw-bold text-dark mb-2">${slide.title}</h3>
            <p class="text-muted mb-3">${slide.description}</p>
            <div class="char-diagram-frame position-relative rounded-4 p-3 bg-light text-center">
              <img src="${slide.illustration}" alt="Diagram" class="img-fluid char-diagram-img" style="max-height: 280px;">
              ${hotspotDots}
            </div>
          </div>
          <div class="col-md-5">
            <div id="char-fact-card" class="char-fact-card p-4 rounded-4 shadow-sm bg-white border border-primary-subtle text-center">
              <div id="char-fact-icon-wrap" class="mb-3">
                <span class="fs-1">🔍</span>
              </div>
              <h5 id="char-fact-label" class="fw-bold text-primary mb-2">Tap a glowing dot!</h5>
              <p id="char-fact-text" class="text-secondary mb-0">Discover how each body or plant part helps in survival!</p>
            </div>
          </div>
        </div>
      </div>
    `;

    container.querySelectorAll('.char-hotspot-dot').forEach(btn => {
      btn.addEventListener('click', () => {
        const hId = btn.getAttribute('data-id');
        const h = slide.hotspots.find(item => item.id === hId);
        if (!h) return;

        if (!state.discovered[slide.id]) state.discovered[slide.id] = new Set();
        state.discovered[slide.id].add(hId);
        btn.classList.add('discovered');

        const card = container.querySelector('#char-fact-card');
        if (card) {
          card.querySelector('#char-fact-icon-wrap').innerHTML = `<img src="${h.icon}" alt="${h.label}" style="height: 64px;" class="anim-wiggle">`;
          card.querySelector('#char-fact-label').textContent = h.label;
          card.querySelector('#char-fact-text').textContent = h.fact;
          speakText(`${h.label}. ${h.fact}`);
        }

        setNextDisabled(!isSlideComplete(slide));
        updateProgressBar();
      });
    });
  } else if (slide.type === 'quick-check') {
    let optionsHtml = slide.options.map(opt => `
      <div class="col-6">
        <button class="char-quick-opt-card btn w-100 p-4 rounded-4 border-2 bg-white text-center shadow-sm" data-id="${opt.id}" data-correct="${opt.isCorrect}">
          <img src="${opt.icon}" alt="${opt.label}" style="height: 90px;" class="mb-3 img-fluid">
          <h5 class="fw-bold text-dark mb-0">${opt.label}</h5>
        </button>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="quick-check-slide-wrap max-w-700 mx-auto text-center">
        <span class="badge bg-warning text-dark px-3 py-2 rounded-pill fs-6 mb-2">Quick Check</span>
        <h3 class="fw-bold text-dark mb-2">${slide.title}</h3>
        <p class="lead text-secondary mb-4">${slide.prompt}</p>
        <div class="row g-3 mb-4">${optionsHtml}</div>
        <div id="char-quick-feedback" class="alert d-none rounded-3 py-3 fw-semibold"></div>
      </div>
    `;

    container.querySelectorAll('.char-quick-opt-card').forEach(card => {
      card.addEventListener('click', () => {
        const isCorrect = card.getAttribute('data-correct') === 'true';
        const optId = card.getAttribute('data-id');
        const opt = slide.options.find(o => o.id === optId);

        container.querySelectorAll('.char-quick-opt-card').forEach(c => c.classList.remove('border-success', 'border-danger', 'bg-success-subtle', 'bg-danger-subtle'));

        const fb = container.querySelector('#char-quick-feedback');
        fb.classList.remove('d-none', 'alert-success', 'alert-danger');

        if (isCorrect) {
          card.classList.add('border-success', 'bg-success-subtle');
          fb.classList.add('alert-success');
          fb.textContent = opt?.explanation || slide.successMessage;
          state.checkAnswered[slide.id] = true;
          speakText(`Correct! ${opt?.explanation || slide.successMessage}`);
        } else {
          card.classList.add('border-danger', 'bg-danger-subtle');
          fb.classList.add('alert-danger');
          fb.textContent = opt?.explanation || slide.retryHint;
          speakText(`Not quite. ${slide.retryHint}`);
        }

        setNextDisabled(!isSlideComplete(slide));
        updateProgressBar();
      });
    });
  } else if (slide.type === 'matching') {
    let selectedPart = null;
    let pairsHtml = slide.pairs.map((p, idx) => `
      <div class="row g-3 align-items-center mb-3">
        <div class="col-5">
          <button class="btn btn-outline-primary w-100 py-3 rounded-3 fw-bold char-part-btn" data-idx="${idx}">${p.part}</button>
        </div>
        <div class="col-2 text-center fs-4 text-muted">➔</div>
        <div class="col-5">
          <button class="btn btn-outline-success w-100 py-3 rounded-3 fw-bold char-role-btn" data-idx="${idx}">${p.role}</button>
        </div>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="matching-slide-wrap max-w-700 mx-auto text-center">
        <h3 class="fw-bold text-dark mb-2">${slide.title}</h3>
        <p class="text-secondary mb-4">${slide.description}</p>
        <div class="matching-grid text-start mb-3">${pairsHtml}</div>
        <div id="char-match-msg" class="text-success fw-bold"></div>
      </div>
    `;

    container.querySelectorAll('.char-part-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.char-part-btn').forEach(b => b.classList.remove('active', 'btn-primary', 'text-white'));
        btn.classList.add('active', 'btn-primary', 'text-white');
        selectedPart = btn.getAttribute('data-idx');
      });
    });

    container.querySelectorAll('.char-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const roleIdx = btn.getAttribute('data-idx');
        if (selectedPart !== null && selectedPart === roleIdx) {
          btn.classList.remove('btn-outline-success');
          btn.classList.add('btn-success', 'text-white', 'disabled');
          const partBtn = container.querySelector(`.char-part-btn[data-idx="${selectedPart}"]`);
          if (partBtn) {
            partBtn.classList.remove('btn-outline-primary');
            partBtn.classList.add('btn-primary', 'text-white', 'disabled');
          }
          state.matchedPairs.add(roleIdx);
          selectedPart = null;
          speakText('Correct match!');
          setNextDisabled(!isSlideComplete(slide));
          updateProgressBar();
        } else if (selectedPart !== null) {
          speakText('Try matching with another role!');
        }
      });
    });
  } else if (slide.type === 'summary') {
    container.innerHTML = `
      <div class="text-center py-4">
        <div class="display-1 mb-3 text-warning"><i class="bi bi-trophy-fill"></i></div>
        <h2 class="fw-bold text-dark mb-2">${slide.title}</h2>
        <p class="lead text-secondary max-w-600 mx-auto mb-4">${slide.description}</p>
        <div class="d-flex justify-content-center gap-3">
          <a href="/student/lessons" class="btn btn-outline-secondary rounded-pill px-4">Back to Lessons</a>
          <a href="/student/characters_game" class="btn btn-primary rounded-pill px-5 fw-bold shadow-sm">
            <i class="bi bi-controller me-2"></i>Play Safari Quest Game
          </a>
        </div>
      </div>
    `;
    saveProgress(true);
  }

  updateProgressBar();
}

function goNext() {
  if (state.currentIndex + 1 < state.slides.length) {
    saveProgress(false);
    renderSlide(state.currentIndex + 1);
  }
}

function goPrev() {
  if (state.currentIndex - 1 >= 0) {
    saveProgress(false);
    renderSlide(state.currentIndex - 1);
  }
}

let charHeartbeatInterval = null;
let charLessonFinished = false;

export function initCharactersLesson() {
  const startIdx = typeof window.initialSlideIndex === 'number' ? Math.min(window.initialSlideIndex, state.slides.length - 1) : 0;
  state.currentIndex = startIdx;
  state.discovered = {};
  state.checkAnswered = {};
  state.matchedPairs = new Set();
  state.lastSavedTime = performance.now();
  charLessonFinished = false;

  document.querySelector('#char-prev')?.addEventListener('click', goPrev);
  document.querySelector('#char-next')?.addEventListener('click', goNext);
  document.querySelector('#char-tts-btn')?.addEventListener('click', () => {
    const slide = currentSlide();
    if (slide) speakText(`${slide.title}. ${slide.description || ''}`);
  });

  // Save progress immediately on open to register student as active in live tracker
  saveProgress(false);

  // Save progress periodically every 5 seconds to accurately track live time spent
  if (charHeartbeatInterval) {
    clearInterval(charHeartbeatInterval);
  }
  charHeartbeatInterval = setInterval(() => {
    if (!charLessonFinished) {
      saveProgress(false);
    }
  }, 5000);

  // Flush remaining time on window unload / pagehide (only if not already finished)
  window.addEventListener('pagehide', () => {
    if (!charLessonFinished) {
      saveProgress(false);
    }
  });

  renderSlide(startIdx);
}

window.initCharactersLesson = initCharactersLesson;
