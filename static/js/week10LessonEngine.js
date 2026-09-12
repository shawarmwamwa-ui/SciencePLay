// week10LessonEngine.js
// Specialized interactive engine for Week 10 Lessons: Properties of Metals and Recycling
// Inherits standard progress saving, TTS audio speech, quick checks, and formative assessments
// Supports custom interactive components: reveal cards, globe tap-reveal, wire conduction toggle, flashlight shine, and recycle sort.

import { speakText } from './ttsHelper.js';

export function initWeek10Lesson(slides, lessonId, lessonName, initialSlide = 0) {
  const startIdx = initialSlide !== null ? Number(initialSlide) : 0;
  const state = {
    currentIndex: Math.min(Math.max(0, startIdx), slides.length - 1),
    lastSavedTime: performance.now(),
    finished: false,
    slideStates: {},
    assessAnswers: {},
    wireIsInsulated: false,
    flashlightIsOn: false,
    recycleSorted: {},
    selectedItemIndex: {},
  };

  const totalSlides = slides.length;

  const titleEl   = document.getElementById('bpl-title');
  const contentEl = document.getElementById('bpl-content');
  const prevBtn   = document.getElementById('bpl-prev');
  const nextBtn   = document.getElementById('bpl-next');
  const progFill  = document.getElementById('bpl-progress-fill');
  const progText  = document.getElementById('bpl-progress-text');
  const ttsBtn    = document.getElementById('bpl-tts-btn');

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
    if (prevBtn) prevBtn.disabled = state.currentIndex === 0;
    if (nextBtn) {
      nextBtn.disabled = !canAdvance();
      const slide = slides[state.currentIndex];
      const isLast = state.currentIndex === totalSlides - 1;
      nextBtn.innerHTML = (slide.type === 'summary' || isLast)
        ? '<i class="bi bi-check-circle-fill me-1"></i>Finish'
        : 'Next <i class="bi bi-arrow-right-circle-fill ms-1"></i>';
    }
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

  function logQuestionAttempt(questionText, correct) {
    if (!lessonId) return;
    fetch('/student/lesson_question_attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lesson_id: lessonId,
        question: questionText,
        was_correct: correct,
      }),
    }).catch(() => {});
  }

  // ── Render Helpers ─────────────────────────────────────────────────────────

  function renderItemShowcase(slide) {
    if (!slide.items || slide.items.length === 0) return '';
    const selectedIdx = state.selectedItemIndex[slide.id] ?? 0;
    const activeItem = slide.items[selectedIdx] || slide.items[0];

    const itemsHtml = slide.items.map((item, idx) => {
      const isActive = idx === selectedIdx;
      return `
        <div class="w10-icon-item ${isActive ? 'active' : ''}" data-item-index="${idx}" title="Tap to inspect ${item.label}">
          ${isActive ? '<span class="w10-icon-active-pill"><i class="bi bi-eye-fill"></i> Viewing</span>' : ''}
          <img src="${item.src}" alt="${item.label}" class="w10-icon-img" loading="lazy">
          <p class="w10-icon-label">${item.label}</p>
        </div>
      `;
    }).join('');

    const explanationHtml = activeItem && activeItem.simpleExplanation ? `
      <div class="w10-item-explanation-card" id="w10-item-explanation">
        <img src="${activeItem.src}" alt="${activeItem.label}" class="w10-explanation-icon-preview">
        <div class="w10-explanation-content">
          <div class="w10-explanation-header">
            <span class="w10-explanation-item-name">
              <i class="bi bi-lightbulb-fill text-warning me-1"></i>${activeItem.label}
            </span>
            <button class="w10-explanation-listen-btn" id="w10-speak-item-btn" title="Listen to this explanation">
              <i class="bi bi-volume-up-fill"></i> Listen
            </button>
          </div>
          <p class="w10-explanation-text">${activeItem.simpleExplanation}</p>
        </div>
      </div>
    ` : '';

    return `
      <div class="w10-icon-grid" style="background:${slide.illustrationBg || '#f1f5f9'}">
        ${itemsHtml}
        <div class="w10-icon-tap-prompt">
          <i class="bi bi-hand-index-thumb text-primary"></i> Tap any object above to see its simple explanation!
        </div>
      </div>
      ${explanationHtml}
    `;
  }

  function renderMetalHook(slide) {
    return `
      <div class="bpl-info-slide">
        ${renderItemShowcase(slide)}
        <p class="bpl-body-text">${slide.description}</p>
      </div>`;
  }

  function renderInteractivePropertyCard(slide) {
    const isRevealed = Boolean(state.slideStates[slide.id]?.revealed);
    return `
      <div class="bpl-info-slide">
        <div class="w10-reveal-card-wrap" id="prop-card-wrap">
          <div class="w10-reveal-card ${isRevealed ? 'revealed' : ''}" id="prop-card">
            <div class="w10-unrevealed-content">
              <i class="bi ${slide.frontIcon} w10-card-front-icon"></i>
              <h3 class="w10-card-title">${slide.frontLabel}</h3>
              <span class="w10-tap-hint"><i class="bi bi-hand-index-thumb me-1"></i>${slide.cardPrompt}</span>
            </div>
            <div class="w10-revealed-content">
              <img src="${slide.imageSrc}" alt="${slide.title}" class="w10-icon-img mb-2" style="width:72px;height:72px;">
              <h3 class="w10-card-title text-success"><i class="bi bi-check-circle-fill me-1"></i>${slide.title}</h3>
              <p class="small text-muted mb-0">${slide.keyFact}</p>
            </div>
          </div>
        </div>
        <p class="bpl-body-text">${slide.description}</p>
        <div class="bpl-key-fact" style="background:${slide.factBg || '#f8fafc'}">
          <i class="bi bi-check-circle-fill me-2 text-success"></i>
          <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
        </div>
      </div>`;
  }

  function renderInteractiveGlobeReveal(slide) {
    const isRevealed = Boolean(state.slideStates[slide.id]?.globeRevealed);
    const metalsHtml = slide.metals.map(m => `
      <div class="w10-metal-pill-card ${m.isHighlight ? 'highlight' : ''}">
        <img src="${m.src}" alt="${m.name}" class="w10-metal-pill-img">
        <div>
          <div class="fw-bold fs-6 text-dark">${m.name} <span class="badge ${m.isHighlight ? 'bg-success' : 'bg-secondary'} ms-1" style="font-size:0.7rem;">${m.tag}</span></div>
          <small class="text-muted d-block" style="font-size:0.78rem;">${m.desc}</small>
        </div>
      </div>
    `).join('');

    return `
      <div class="bpl-info-slide">
        <div class="w10-globe-stage">
          <div class="w10-globe-interactive" id="globe-tap-target" title="Tap our planet!">
            <img src="${slide.earthImage}" alt="Planet Earth" class="w10-globe-img">
            <div class="mt-2"><span class="w10-tap-hint"><i class="bi bi-hand-index-thumb me-1"></i>${isRevealed ? 'Earth Explored!' : slide.globePrompt}</span></div>
          </div>
          <div class="w10-globe-metals-grid ${isRevealed ? 'active' : ''}" id="globe-metals-grid">
            ${metalsHtml}
          </div>
        </div>
        <p class="bpl-body-text">${slide.description}</p>
        <div class="bpl-key-fact" style="background:${slide.factBg || '#fef3c7'}">
          <i class="bi bi-check-circle-fill me-2 text-success"></i>
          <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
        </div>
      </div>`;
  }

  function renderInteractiveWireToggle(slide) {
    const isInsulated = state.wireIsInsulated;
    return `
      <div class="bpl-info-slide">
        <div class="w10-wire-stage">
          <button class="w10-wire-switch-btn" id="wire-toggle-btn">
            <i class="bi ${isInsulated ? 'bi-shield-check' : 'bi-lightning-charge-fill'} me-1"></i>
            ${isInsulated ? 'Switch to: Bare Copper Wire' : 'Switch to: Plastic Insulated Wire'}
          </button>
          <div class="w10-wire-visual-wrap">
            <div class="w10-wire-box">
              <img src="${isInsulated ? slide.wireImageCoated : slide.wireImageBare}" alt="Wire view" class="w10-wire-img">
              <h4 class="fw-bold fs-6 mb-1 ${isInsulated ? 'text-success' : 'text-danger'}">
                ${isInsulated ? '<i class="bi bi-shield-fill-check me-1"></i>Insulated & Safe to Touch' : '<i class="bi bi-lightning-fill me-1"></i>Bare Copper: Active Conductor'}
              </h4>
              <small class="text-muted">
                ${isInsulated ? 'Plastic coating blocks electricity from escaping safely!' : 'Electricity flows freely through copper to power devices.'}
              </small>
            </div>
          </div>
        </div>
        <p class="bpl-body-text">${slide.description}</p>
        <div class="bpl-key-fact" style="background:${slide.factBg || '#fef3c7'}">
          <i class="bi bi-check-circle-fill me-2 text-success"></i>
          <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
        </div>
      </div>`;
  }

  function renderInteractiveFlashlightShine(slide) {
    const isOn = state.flashlightIsOn;
    const swatchesHtml = slide.swatches.map(s => {
      const isGlowing = isOn && s.shines;
      const isDull = isOn && !s.shines;
      return `
        <div class="w10-swatch-card ${isGlowing ? 'glowing' : (isDull ? 'dull' : '')}">
          <i class="bi bi-sparkle w10-glint-sparkle"></i>
          <img src="${s.src}" alt="${s.name}" style="width:54px;height:54px;object-fit:contain;margin-bottom:8px;">
          <div class="fw-bold fs-6" style="color:${s.color};">${s.name}</div>
          <small class="text-white-50" style="font-size:0.75rem;">
            ${isGlowing ? 'Brilliant Shine!' : (isDull ? 'Dull (No Shine)' : 'Ready for Light')}
          </small>
        </div>
      `;
    }).join('');

    return `
      <div class="bpl-info-slide">
        <div class="w10-flashlight-stage">
          <button class="w10-flashlight-btn ${isOn ? 'on' : ''}" id="flashlight-toggle-btn">
            <img src="${isOn ? slide.flashlightOn : slide.flashlightOff}" alt="Flashlight" style="width:24px;height:24px;vertical-align:middle;margin-right:6px;">
            ${isOn ? 'Flashlight is ON (Tap to turn off)' : 'Tap Flashlight to Turn ON'}
          </button>
          <div class="w10-swatches-grid">
            ${swatchesHtml}
          </div>
        </div>
        <p class="bpl-body-text">${slide.description}</p>
        <div class="bpl-key-fact" style="background:${slide.factBg || '#fefce8'}">
          <i class="bi bi-check-circle-fill me-2 text-success"></i>
          <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
        </div>
      </div>`;
  }

  function renderInteractiveRecycleSort(slide) {
    const sorted = state.recycleSorted || {};
    const itemsHtml = slide.items.map(item => {
      const status = sorted[item.id];
      const cls = status === 'correct' ? 'correct' : (status === 'wrong' ? 'wrong' : '');
      return `
        <div class="w10-sort-card ${cls}" data-item-id="${item.id}">
          <img src="${item.src}" alt="${item.name}" class="w10-sort-img">
          <div class="fw-bold" style="font-size:0.8rem;color:#1e293b;">${item.name}</div>
          ${status === 'correct' ? '<span class="badge bg-success mt-1" style="font-size:0.65rem;">Correct!</span>' : ''}
          ${status === 'wrong' ? '<span class="badge bg-danger mt-1" style="font-size:0.65rem;">Try Again!</span>' : ''}
        </div>
      `;
    }).join('');

    return `
      <div class="bpl-info-slide">
        <div class="w10-recycle-stage">
          <div class="w10-recycle-items-tray">
            ${itemsHtml}
          </div>
          <div class="w10-recycle-bin-target">
            <img src="${slide.recycleBinImage}" alt="Recycle Bin" class="w10-bin-img">
            <div>
              <div class="fw-black text-dark fs-6">Tap any item above to sort it!</div>
              <small class="text-muted">Is it Recyclable or Compost/Trash?</small>
            </div>
          </div>
        </div>
        <p class="bpl-body-text">${slide.description}</p>
        <div id="recycle-feedback-box" class="mt-2"></div>
        <div class="bpl-key-fact mt-2" style="background:${slide.factBg || '#eff6ff'}">
          <i class="bi bi-check-circle-fill me-2 text-success"></i>
          <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
        </div>
      </div>`;
  }

  function renderQuickCheck(slide) {
    const ss = state.slideStates[slide.id] || {};
    const optionsHtml = slide.options.map(opt => {
      let cls = 'bpl-option';
      if (ss.selected === opt.id) {
        cls += opt.isCorrect ? ' bpl-opt-correct' : ' bpl-opt-wrong';
      }
      return `
        <button class="${cls}" data-id="${opt.id}" ${ss.correct ? 'disabled' : ''}>
          <span class="w10-opt-icon-circle"><i class="bi ${opt.icon || 'bi-patch-check'}"></i></span>
          <span>${opt.label}</span>
        </button>`;
    }).join('');

    const feedbackHtml = ss.selected
      ? `<div class="bpl-feedback ${ss.correct ? 'bpl-feedback-ok' : 'bpl-feedback-err'}">
           <i class="bi ${ss.correct ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2 fs-4"></i>
           <span>${ss.correct ? slide.successMessage : slide.retryMessage}</span>
         </div>`
      : '';

    return `
      <div class="bpl-quickcheck-slide">
        <div class="w10-question-container">
          <div class="w10-question-header">
            <span class="w10-question-tag"><i class="bi bi-patch-question-fill me-1"></i>Quick Check</span>
            <span class="w10-question-hint-pill"><i class="bi bi-hand-index-thumb me-1"></i>Tap 1 answer</span>
          </div>
          <p class="bpl-prompt">${slide.prompt}</p>
        </div>
        <div class="bpl-options">${optionsHtml}</div>
        ${feedbackHtml}
      </div>`;
  }

  function renderAssess(slide) {
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
           <i class="bi ${as.selected === slide.correctId ? 'bi-check-circle-fill' : 'bi-x-circle-fill'} me-2 fs-4"></i>
           <span>${slide.explanation}</span>
         </div>`
      : '';

    return `
      <div class="bpl-assess-slide">
        <div class="w10-question-container">
          <div class="w10-question-header">
            <span class="w10-question-tag" style="background:#fef3c7;border-color:#fde68a;color:#92400e;">
              <i class="bi bi-star-fill me-1 text-warning"></i>Question ${slide.assessNumber} of 5
            </span>
            <span class="w10-question-hint-pill"><i class="bi bi-award-fill me-1"></i>Graded Assessment</span>
          </div>
          <p class="bpl-prompt">${slide.question}</p>
        </div>
        <div class="bpl-options">${optionsHtml}</div>
        ${feedbackHtml}
      </div>`;
  }

  function renderSummary(slide) {
    const bulletsHtml = slide.bullets.map(b => `<li>${b}</li>`).join('');
    return `
      <div class="bpl-summary-slide">
        <div class="w10-globe-stage" style="background:#f0fdf4;">
          <i class="bi bi-award-fill text-success display-3 mb-2 d-block"></i>
          <h3 class="fw-black text-dark fs-4">Lesson Complete!</h3>
          <p class="text-muted mb-0">You've mastered these core science concepts.</p>
        </div>
        <ul class="bpl-summary-list">${bulletsHtml}</ul>
      </div>`;
  }

  // ── Main Render Dispatcher ─────────────────────────────────────────────────

  function render() {
    const slide = slides[state.currentIndex];
    if (titleEl) titleEl.textContent = slide.title;
    updateProgress();
    updateNav();

    let html = '';
    if (slide.type === 'metal-hook') {
      html = renderMetalHook(slide);
    } else if (slide.type === 'interactive-property-card') {
      html = renderInteractivePropertyCard(slide);
    } else if (slide.type === 'interactive-globe-reveal') {
      html = renderInteractiveGlobeReveal(slide);
    } else if (slide.type === 'interactive-wire-toggle') {
      html = renderInteractiveWireToggle(slide);
    } else if (slide.type === 'interactive-flashlight-shine') {
      html = renderInteractiveFlashlightShine(slide);
    } else if (slide.type === 'interactive-recycle-sort') {
      html = renderInteractiveRecycleSort(slide);
    } else if (slide.type === 'quick-check') {
      html = renderQuickCheck(slide);
    } else if (slide.type === 'assess') {
      html = renderAssess(slide);
    } else if (slide.type === 'summary') {
      html = renderSummary(slide);
    } else {
      // General info slide
      html = `
        <div class="bpl-info-slide">
          ${slide.items ? renderItemShowcase(slide) : ''}
          <p class="bpl-body-text">${slide.description}</p>
          ${slide.keyFact ? `
            <div class="bpl-key-fact" style="background:${slide.factBg || '#f8fafc'}">
              <i class="bi bi-check-circle-fill me-2 text-success"></i>
              <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
            </div>` : ''}
        </div>`;
    }

    if (contentEl) {
      contentEl.innerHTML = html;
      attachSlideListeners(slide);
    }
  }

  // ── Slide Interactive Listeners ────────────────────────────────────────────

  function attachSlideListeners(slide) {
    // 0. Icon Item Tap & Simple Explanation Listener
    if (slide.items && slide.items.length > 0) {
      const iconItems = document.querySelectorAll('.w10-icon-item[data-item-index]');
      iconItems.forEach(item => {
        item.addEventListener('click', () => {
          const idx = parseInt(item.getAttribute('data-item-index'), 10);
          state.selectedItemIndex[slide.id] = idx;
          render();
        });
      });

      const speakItemBtn = document.getElementById('w10-speak-item-btn');
      if (speakItemBtn) {
        speakItemBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const selectedIdx = state.selectedItemIndex[slide.id] ?? 0;
          const activeItem = slide.items[selectedIdx] || slide.items[0];
          if (activeItem && activeItem.simpleExplanation) {
            speakText(`${activeItem.label}. ${activeItem.simpleExplanation}`);
          }
        });
      }
    }

    // 1. Property Reveal Card
    const propWrap = document.getElementById('prop-card-wrap');
    if (propWrap) {
      propWrap.addEventListener('click', () => {
        const card = document.getElementById('prop-card');
        if (card) {
          card.classList.toggle('revealed');
          if (!state.slideStates[slide.id]) state.slideStates[slide.id] = {};
          state.slideStates[slide.id].revealed = card.classList.contains('revealed');
        }
      });
    }

    // 2. Globe Tap-Reveal
    const globeTarget = document.getElementById('globe-tap-target');
    if (globeTarget) {
      globeTarget.addEventListener('click', () => {
        const grid = document.getElementById('globe-metals-grid');
        if (grid) {
          grid.classList.toggle('active');
          if (!state.slideStates[slide.id]) state.slideStates[slide.id] = {};
          state.slideStates[slide.id].globeRevealed = grid.classList.contains('active');
        }
      });
    }

    // 3. Wire Toggle (Copper)
    const wireBtn = document.getElementById('wire-toggle-btn');
    if (wireBtn) {
      wireBtn.addEventListener('click', () => {
        state.wireIsInsulated = !state.wireIsInsulated;
        render();
      });
    }

    // 4. Flashlight Toggle (Gold & Silver)
    const flashBtn = document.getElementById('flashlight-toggle-btn');
    if (flashBtn) {
      flashBtn.addEventListener('click', () => {
        state.flashlightIsOn = !state.flashlightIsOn;
        render();
      });
    }

    // 5. Recycling Tap-to-Sort
    if (slide.type === 'interactive-recycle-sort') {
      const cards = document.querySelectorAll('.w10-sort-card');
      const feedbackBox = document.getElementById('recycle-feedback-box');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const itemId = card.getAttribute('data-item-id');
          const itemDef = slide.items.find(i => i.id === itemId);
          if (!itemDef) return;

          // Toggle or test sort
          const isCorrect = itemDef.isRecyclable;
          state.recycleSorted[itemId] = isCorrect ? 'correct' : 'wrong';

          if (feedbackBox) {
            feedbackBox.innerHTML = `
              <div class="alert ${isCorrect ? 'alert-success' : 'alert-warning'} py-2 px-3 mb-0" style="border-radius:12px;font-size:0.88rem;font-weight:700;">
                <i class="bi ${isCorrect ? 'bi-check-circle-fill text-success' : 'bi-exclamation-triangle-fill text-warning'} me-2"></i>
                <strong>${itemDef.name}:</strong> ${itemDef.reason}
              </div>`;
          }

          render();
        });
      });
    }

    // 6. Quick Check Options
    if (slide.type === 'quick-check') {
      const optBtns = document.querySelectorAll('.bpl-option');
      optBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const optId = btn.getAttribute('data-id');
          const opt = slide.options.find(o => o.id === optId);
          if (!opt) return;

          state.slideStates[slide.id] = { selected: optId, correct: opt.isCorrect };
          logQuestionAttempt(slide.prompt, opt.isCorrect);
          render();
        });
      });
    }

    // 7. Formative Assessment Options
    if (slide.type === 'assess') {
      const optBtns = document.querySelectorAll('.bpl-assess-opt');
      optBtns.forEach(btn => {
        btn.addEventListener('click', () => {
          const optId = btn.getAttribute('data-id');
          const isCorrect = optId === slide.correctId;
          state.assessAnswers[slide.id] = { selected: optId, answered: true };
          logQuestionAttempt(slide.question, isCorrect);
          render();
        });
      });
    }
  }

  // ── Navigation Listeners ───────────────────────────────────────────────────

  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      if (state.currentIndex > 0) {
        state.currentIndex--;
        saveProgress(false);
        render();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      if (state.currentIndex < totalSlides - 1) {
        state.currentIndex++;
        saveProgress(false);
        render();
      } else {
        // Final finish
        saveProgress(true);
        window.location.href = '/student/lessons';
      }
    });
  }

  // ── Read Aloud (TTS) ───────────────────────────────────────────────────────
  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      const slide = slides[state.currentIndex];
      let textToSpeak = slide.title + '. ';
      
      // If slide has items with active simple explanation, include that
      if (slide.items && slide.items.length > 0) {
        const selectedIdx = state.selectedItemIndex[slide.id] ?? 0;
        const activeItem = slide.items[selectedIdx] || slide.items[0];
        if (activeItem && activeItem.simpleExplanation) {
          textToSpeak += `${activeItem.label}: ${activeItem.simpleExplanation} `;
        }
      }

      if (slide.description) textToSpeak += slide.description + ' ';
      if (slide.prompt) textToSpeak += slide.prompt + ' ';
      if (slide.question) textToSpeak += slide.question + ' ';
      if (slide.keyFact) textToSpeak += 'Key Fact: ' + slide.keyFact;
      speakText(textToSpeak);
    });
  }

  // Initial render
  render();
}
