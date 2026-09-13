// bodyPartsLesson.js
// Shared lesson engine for Lesson 2A (Animal Body Parts) and Lesson 2B (Plant Parts).
// Handles slide navigation, slide rendering, quick-checks, formative assessment, and progress saving.

import { speakText } from './ttsHelper.js';

let currentLottieInstances = [];

function clearLottieInstances() {
  currentLottieInstances.forEach(anim => {
    try { anim.destroy(); } catch (_) {}
  });
  currentLottieInstances = [];
}

function renderMediaGrid(slide) {
  // If slide has a dedicated image/diagram
  if (slide.imageSrc) {
    return `
      <div class="bpl-media-wrap" style="background:${slide.illustrationBg || slide.partBg || '#fefce8'}">
        <img src="${slide.imageSrc}" alt="${slide.illustrationLabel || slide.title || ''}" class="bpl-media-img" loading="lazy" width="800" height="600">
        ${slide.illustrationLabel ? `<p class="bpl-lottie-caption">${slide.illustrationLabel}</p>` : ''}
      </div>`;
  }

  const items = [];
  if (Array.isArray(slide.animations) && slide.animations.length > 0) {
    items.push(...slide.animations);
  } else if (Array.isArray(slide.lottieSrcs) && slide.lottieSrcs.length > 0) {
    slide.lottieSrcs.forEach(src => items.push({ src }));
  } else if (slide.lottieSrc) {
    items.push({ src: slide.lottieSrc, label: slide.illustrationLabel || '' });
  }

  if (items.length === 0) return '';

  const cardsHtml = items.map(item => `
    <div class="bpl-lottie-card">
      <div class="bpl-lottie-player-box" data-lottie-path="${item.src}"></div>
      ${item.label ? `<p class="bpl-lottie-caption">${item.label}</p>` : ''}
    </div>
  `).join('');

  return `<div class="bpl-lottie-grid bpl-lottie-count-${items.length}" style="background:${slide.illustrationBg || slide.partBg || '#fef9c3'}">${cardsHtml}</div>`;
}

function initLottieAnimationsInDom() {
  clearLottieInstances();
  const lottieEngine = window.lottie || (typeof lottie !== 'undefined' ? lottie : null);
  if (!lottieEngine) return;

  const boxes = document.querySelectorAll('#bpl-content [data-lottie-path]');
  boxes.forEach(box => {
    const path = box.getAttribute('data-lottie-path');
    if (!path) return;
    try {
      const anim = lottieEngine.loadAnimation({
        container: box,
        renderer: 'svg',
        loop: true,
        autoplay: true,
        path: path
      });
      currentLottieInstances.push(anim);
    } catch (err) {
      console.warn('Lottie render notice for', path, err);
    }
  });
}

function renderInfo(slide) {
  const media = renderMediaGrid(slide);
  const fallback = !media ? `
    <div class="bpl-illustration" style="background:${slide.illustrationBg || '#f8fafc'}">
      <i class="bi ${slide.illustrationIcon || 'bi-star-fill'} bpl-illus-icon"></i>
      <p class="bpl-illus-label">${slide.illustrationLabel || ''}</p>
    </div>` : '';

  return `
    <div class="bpl-info-slide">
      ${media || fallback}
      <p class="bpl-body-text">${slide.description}</p>
    </div>`;
}

function renderPredict(slide) {
  const media = renderMediaGrid(slide);
  return `
    <div class="bpl-predict-slide">
      ${media}
      <div class="bpl-part-badge" style="background:${slide.partBg || '#f1f5f9'}">
        <i class="bi ${slide.partIcon || 'bi-question-circle'} bpl-part-icon"></i>
        <span class="bpl-part-label">${slide.partLabel}</span>
      </div>
      <p class="bpl-body-text">${slide.description}</p>
      <div class="bpl-think-box">
        <i class="bi bi-lightbulb-fill me-2 text-warning"></i>
        <span>${slide.thinkPrompt}</span>
      </div>
    </div>`;
}

function renderTeach(slide) {
  const media = renderMediaGrid(slide);
  return `
    <div class="bpl-teach-slide">
      ${media}
      <div class="bpl-part-badge" style="background:${slide.partBg || '#f1f5f9'}">
        <i class="bi ${slide.partIcon || 'bi-book-fill'} bpl-part-icon"></i>
        <span class="bpl-part-label">${slide.partLabel}</span>
      </div>
      <p class="bpl-body-text">${slide.description}</p>
      <div class="bpl-key-fact" style="background:${slide.factBg || '#f8fafc'}">
        <i class="bi bi-check-circle-fill me-2 text-success"></i>
        <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
      </div>
    </div>`;
}

function getShuffledOptions(slide, state) {
  if (!state.shuffledOptions) state.shuffledOptions = {};
  if (!state.shuffledOptions[slide.id]) {
    const opts = [...slide.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    state.shuffledOptions[slide.id] = opts;
  }
  return state.shuffledOptions[slide.id];
}

function renderQuickCheck(slide, state) {
  const media = renderMediaGrid(slide);
  const ss = state.slideStates[slide.id] || {};
  const options = getShuffledOptions(slide, state);
  const optionsHtml = options.map(opt => {
    let cls = 'bpl-option';
    if (ss.selected === opt.id) {
      cls += opt.isCorrect ? ' bpl-opt-correct' : ' bpl-opt-wrong';
    }
    return `
      <button class="${cls}" data-id="${opt.id}" ${ss.correct ? 'disabled' : ''}>
        <div class="bpl-opt-icon-circle"><i class="bi ${opt.icon || 'bi-patch-question-fill'}"></i></div>
        <span>${opt.label}</span>
      </button>`;
  }).join('');

  const feedbackHtml = ss.selected
    ? `<div class="bpl-feedback ${ss.correct ? 'bpl-feedback-ok' : 'bpl-feedback-err'}">
         <div class="bpl-feedback-icon">${ss.correct ? '🎉' : '💡'}</div>
         <div class="bpl-feedback-text">
           <strong>${ss.correct ? 'Spot On, Scientist!' : 'Coach Tip:'}</strong>
           <p>${ss.correct ? slide.successMessage : slide.retryMessage}</p>
         </div>
       </div>`
    : '';

  return `
    <div class="bpl-quickcheck-slide">
      ${media}
      <div class="bpl-question-card">
        <span class="bpl-question-tag"><i class="bi bi-lightbulb-fill me-1"></i>Quick Check</span>
        <p class="bpl-prompt">${slide.prompt}</p>
      </div>
      <div class="bpl-options">${optionsHtml}</div>
      ${feedbackHtml}
    </div>`;
}

function renderAssess(slide, state) {
  const as = state.assessAnswers[slide.id] || {};
  const optionsHtml = slide.options.map(opt => {
    let cls = 'bpl-assess-opt';
    if (as.selected === opt.id) {
      cls += opt.id === slide.correctId ? ' bpl-opt-correct' : ' bpl-opt-wrong';
    }
    return `
      <button class="${cls}" data-id="${opt.id}" ${as.answered ? 'disabled' : ''}>
        <span class="bpl-assess-letter">${opt.id.toUpperCase()}</span>
        <span>${opt.label}</span>
      </button>`;
  }).join('');

  const feedbackHtml = as.answered
    ? `<div class="bpl-feedback ${as.selected === slide.correctId ? 'bpl-feedback-ok' : 'bpl-feedback-err'}">
         <div class="bpl-feedback-icon">${as.selected === slide.correctId ? '🌟' : '💡'}</div>
         <div class="bpl-feedback-text">
           <strong>${as.selected === slide.correctId ? 'Great Job!' : 'Key Takeaway:'}</strong>
           <p>${slide.explanation}</p>
         </div>
       </div>`
    : '';

  return `
    <div class="bpl-assess-slide">
      <div class="bpl-question-card">
        <div class="d-flex justify-content-between align-items-center mb-1">
          <span class="bpl-assess-num"><i class="bi bi-star-fill text-warning me-1"></i>Question ${slide.assessNumber} of 5</span>
          <span class="bpl-formative-badge"><i class="bi bi-patch-question-fill me-1"></i>Check Your Understanding</span>
        </div>
        <p class="bpl-prompt">${slide.question}</p>
      </div>
      <div class="bpl-options">${optionsHtml}</div>
      ${feedbackHtml}
    </div>`;
}

function renderSummary(slide) {
  const media = renderMediaGrid(slide);
  const items = slide.bullets.map(b => `<li>${b}</li>`).join('');
  return `
    <div class="bpl-summary-slide">
      ${media}
      <ul class="bpl-summary-list">${items}</ul>
    </div>`;
}

// ── ENGINE ───────────────────────────────────────────────────────────────────

export function initBodyPartsLesson(slides, lessonId, lessonName, initialSlide = null) {
  const startIdx = initialSlide !== null ? Number(initialSlide) : (Number(window.initialSlide) || 0);
  const state = {
    currentIndex: Math.min(Math.max(0, startIdx), slides.length - 1),
    lastSavedTime: performance.now(),
    finished: false,
    slideStates: {},   // quick-check state
    assessAnswers: {}, // assessment answers
  };

  const totalSlides = slides.length;

  // DOM references
  const titleEl   = document.getElementById('bpl-title');
  const contentEl = document.getElementById('bpl-content');
  const prevBtn   = document.getElementById('bpl-prev');
  const nextBtn   = document.getElementById('bpl-next');
  const progFill  = document.getElementById('bpl-progress-fill');
  const progText  = document.getElementById('bpl-progress-text');

  // ── Helpers ────────────────────────────────────────────────────────────────

  function playTone(freq, dur = 0.15) {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = 'triangle';
      gain.gain.setValueAtTime(0.0001, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.15, ctx.currentTime + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
      osc.connect(gain); gain.connect(ctx.destination);
      osc.start(ctx.currentTime); osc.stop(ctx.currentTime + dur);
    } catch (_) {}
  }

  function canAdvance() {
    const slide = slides[state.currentIndex];
    if (slide.type === 'quick-check') {
      return Boolean(state.slideStates[slide.id]?.correct);
    }
    if (slide.type === 'assess') {
      return Boolean(state.assessAnswers[slide.id]?.answered);
    }
    return true;
  }

  function updateNav() {
    prevBtn.disabled = state.currentIndex === 0;
    nextBtn.disabled = !canAdvance();
    const slide = slides[state.currentIndex];
    const isLast = state.currentIndex === totalSlides - 1;
    nextBtn.textContent = (slide.type === 'summary' || isLast) ? 'Finish' : 'Next';
    nextBtn.innerHTML = (slide.type === 'summary' || isLast)
      ? '<i class="bi bi-check-circle-fill me-1"></i>Finish'
      : 'Next <i class="bi bi-arrow-right-circle-fill ms-1"></i>';
  }

  function updateProgress() {
    const pct = Math.round(((state.currentIndex + 1) / totalSlides) * 100);
    if (progFill) progFill.style.width = `${pct}%`;
    if (progText) progText.textContent = `${state.currentIndex + 1} / ${totalSlides}`;
  }

  function saveProgress(completed = false) {
    if (!lessonId) return;
    const now = performance.now();
    const delta = Math.max(1, Math.round((now - state.lastSavedTime) / 1000));
    state.lastSavedTime = now;
    const pct = completed ? 100 : Math.round(((state.currentIndex + 1) / totalSlides) * 100);
    fetch('/student/lesson_progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      keepalive: true,
      body: JSON.stringify({
        lesson_id: lessonId,
        progress_percent: pct,
        current_slide: state.currentIndex,
        completed: completed,
        time_spent: delta,
      }),
    }).catch(() => {});
  }

  function logQuickCheckAttempt(slide, optId, correct) {
    fetch('/student/lesson_question_attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonId,
        question: slide.prompt || slide.question,
        was_correct: correct,
      }),
    }).catch(() => {});
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  function render() {
    const slide = slides[state.currentIndex];
    if (titleEl) titleEl.textContent = slide.title;
    updateProgress();
    updateNav();

    let html = '';
    if (slide.type === 'info')        html = renderInfo(slide);
    else if (slide.type === 'predict') html = renderPredict(slide);
    else if (slide.type === 'teach')   html = renderTeach(slide);
    else if (slide.type === 'quick-check') html = renderQuickCheck(slide, state);
    else if (slide.type === 'assess')  html = renderAssess(slide, state);
    else if (slide.type === 'summary') html = renderSummary(slide);

    if (contentEl) {
      contentEl.innerHTML = html;
      bindSlideEvents(slide);
      initLottieAnimationsInDom();
    }
  }

  // ── Event binding ──────────────────────────────────────────────────────────

  function bindSlideEvents(slide) {
    if (slide.type === 'quick-check') {
      contentEl.querySelectorAll('.bpl-option').forEach(btn => {
        btn.addEventListener('click', () => {
          const ss = state.slideStates[slide.id] || {};
          if (ss.correct) return; // locked after correct

          const optId = btn.dataset.id;
          const opt = slide.options.find(o => o.id === optId);
          const correct = Boolean(opt?.isCorrect);

          state.slideStates[slide.id] = { selected: optId, correct };
          playTone(correct ? 660 : 260);
          logQuickCheckAttempt(slide, optId, correct);
          render();
        });
      });
    }

    if (slide.type === 'assess') {
      contentEl.querySelectorAll('.bpl-assess-opt').forEach(btn => {
        btn.addEventListener('click', () => {
          const as = state.assessAnswers[slide.id] || {};
          if (as.answered) return;

          const optId = btn.dataset.id;
          const correct = optId === slide.correctId;
          state.assessAnswers[slide.id] = { selected: optId, answered: true, correct };
          playTone(correct ? 660 : 260);
          logQuickCheckAttempt(slide, optId, correct);
          render();
        });
      });
    }
  }

  // ── Navigation ─────────────────────────────────────────────────────────────

  function goNext() {
    if (!canAdvance()) return;
    const slide = slides[state.currentIndex];
    const isLast = state.currentIndex === totalSlides - 1;

    if (slide.type === 'summary' || isLast) {
      state.finished = true;
      clearInterval(heartbeat);
      saveProgress(true);
      setTimeout(() => { window.location.href = '/student/lessons'; }, 800);
      return;
    }

    state.currentIndex += 1;
    saveProgress(false);
    render();
  }

  function goPrev() {
    if (state.currentIndex === 0) return;
    state.currentIndex -= 1;
    saveProgress(false);
    render();
  }

  // ── TTS ────────────────────────────────────────────────────────────────────

  function readAloud() {
    const slide = slides[state.currentIndex];
    let text = slide.title + '. ';
    text += slide.description || slide.prompt || slide.question || '';
    if (slide.bullets) text += ' ' + slide.bullets.join('. ');
    if (slide.options)  text += ' Options are: ' + slide.options.map(o => o.label).join(', ');
    speakText(text);
  }

  // ── Swipe support ──────────────────────────────────────────────────────────

  let touchStartX = null;
  document.addEventListener('touchstart', e => { touchStartX = e.touches[0].clientX; });
  document.addEventListener('touchend', e => {
    if (touchStartX === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX;
    touchStartX = null;
    if (dx > 60 && state.currentIndex > 0) goPrev();
    else if (dx < -60) goNext();
  });

  // ── Wire up buttons ────────────────────────────────────────────────────────

  prevBtn?.addEventListener('click', goPrev);
  nextBtn?.addEventListener('click', goNext);
  document.getElementById('bpl-tts-btn')?.addEventListener('click', readAloud);
  document.querySelector('.bpl-back-btn')?.addEventListener('click', () => {
    if (!state.finished) saveProgress(false);
  });

  // ── Heartbeat ──────────────────────────────────────────────────────────────

  const heartbeat = setInterval(() => {
    if (!state.finished) saveProgress(false);
  }, 5000);

  window.addEventListener('pagehide', () => {
    if (!state.finished) saveProgress(false);
  });

  // ── Boot ───────────────────────────────────────────────────────────────────

  saveProgress(false);
  render();

  console.log(`[BodyPartsLesson] Initialized "${lessonName}" — ${totalSlides} slides, lessonId=${lessonId}`);
}
