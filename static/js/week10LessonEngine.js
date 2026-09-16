// week10LessonEngine.js
// Specialized interactive engine for Week 10 Lessons: Properties of Metals and Recycling
// Inherits standard progress saving, TTS audio speech, quick checks, and formative assessments
// Supports custom interactive components: reveal cards, globe tap-reveal, wire conduction toggle, flashlight shine, and recycle sort.

import { speakText, playVoicePrompt, stopVoicePrompt } from './ttsHelper.js';

export function initWeek10Lesson(slides, lessonId, lessonName, initialSlide = 0) {
  // Shuffle formative assessment questions so each session gets a fresh question order
  const assessIndices = [];
  slides.forEach((s, idx) => {
    if (s.type === 'assess') assessIndices.push(idx);
  });
  if (assessIndices.length > 1) {
    const assessSlides = assessIndices.map(i => slides[i]);
    for (let i = assessSlides.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [assessSlides[i], assessSlides[j]] = [assessSlides[j], assessSlides[i]];
    }
    assessSlides.forEach((s, idx) => {
      s.assessNumber = idx + 1;
      s.title = `Formative Assessment: Question ${idx + 1}`;
      slides[assessIndices[idx]] = s;
    });
  }

  const startIdx = initialSlide !== null ? Number(initialSlide) : 0;
  const state = {
    currentIndex: Math.min(Math.max(0, startIdx), slides.length - 1),
    lastSavedTime: performance.now(),
    finished: false,
    slideStates: {},
    assessAnswers: {},
    shuffledOptions: {},
    wireIsInsulated: false,
    flashlightIsOn: false,
    recycleSorted: {},
    activeSortedItemId: null,
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

  function getShuffledOptions(slide) {
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
      const metalType = item.metal || (item.theme && item.theme.name) || '';
      const metalAttr = metalType ? `data-metal="${metalType}"` : '';
      const metalClass = (isActive && metalType) ? `active-${metalType}` : '';
      return `
        <div class="w10-icon-item ${isActive ? 'active ' + metalClass : ''}" ${metalAttr} data-item-index="${idx}" title="Tap to inspect ${item.label}">
          ${isActive ? '<span class="w10-icon-active-pill"><i class="bi bi-eye-fill"></i> Viewing</span>' : ''}
          <img src="${item.src}" alt="${item.label}" class="w10-icon-img" loading="lazy">
          <p class="w10-icon-label">${item.label}</p>
        </div>
      `;
    }).join('');

    const borderStyle = activeItem.theme?.border ? `style="border-color:${activeItem.theme.border}; box-shadow:0 8px 20px ${activeItem.theme.border}28;"` : '';
    const previewBg = activeItem.theme?.bg ? `style="background:${activeItem.theme.bg}; border-color:${activeItem.theme.border};"` : '';
    const nameColor = activeItem.theme?.text ? `style="color:${activeItem.theme.text};"` : '';

    const explanationHtml = activeItem && activeItem.simpleExplanation ? `
      <div class="w10-item-explanation-card" id="w10-item-explanation" ${borderStyle}>
        <img src="${activeItem.src}" alt="${activeItem.label}" class="w10-explanation-icon-preview" ${previewBg}>
        <div class="w10-explanation-content">
          <div class="w10-explanation-header">
            <span class="w10-explanation-item-name" ${nameColor}>
              <i class="bi bi-lightbulb-fill text-warning me-1"></i>${activeItem.label}
              ${activeItem.tag ? `<span class="badge ${activeItem.isHighlight ? 'bg-success' : 'bg-primary'} ms-2" style="font-size:0.75rem; font-weight:700; border-radius:999px; padding:3px 8px; ${activeItem.theme?.pillBg ? `background:${activeItem.theme.pillBg} !important;` : ''}">${activeItem.tag}</span>` : ''}
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
          <i class="bi bi-hand-index-thumb text-primary"></i> ${slide.tapPrompt || 'Tap any object above to see its simple explanation!'}
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
        ${slide.keyFact ? `
          <div class="bpl-key-fact" style="background:${slide.factBg || '#f8fafc'}">
            <i class="bi bi-check-circle-fill me-2 text-success"></i>
            <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
          </div>` : ''}
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
    if (slide.items && slide.items.length > 0) {
      return renderMetalHook(slide);
    }
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
    const bins = slide.bins || [
      { id: 'bin-recycle', name: 'Blue Recycling Bin', color: '#2563eb', bg: '#eff6ff', border: '#3b82f6', icon: 'bi-recycle', subtitle: 'Bottles, Cans, Glass & Clean Paper' },
      { id: 'bin-compost', name: 'Green Compost Bin', color: '#16a34a', bg: '#f0fdf4', border: '#22c55e', icon: 'bi-tree-fill', subtitle: 'Food Scraps & Organic Waste' }
    ];

    // Count how many sorted
    const sortedCount = Object.keys(sorted).length;
    const activeItem = slide.items.find(i => i.id === state.activeSortedItemId) || (sortedCount > 0 ? slide.items.find(i => sorted[i.id]) : null);

    // Items tray
    const itemsHtml = slide.items.map(item => {
      const isSorted = Boolean(sorted[item.id]);
      const isActive = state.activeSortedItemId === item.id;
      const targetBin = bins.find(b => b.id === item.targetBin) || bins[0];
      return `
        <div class="w10-sort-card ${isSorted ? 'is-sorted' : ''} ${isActive ? 'active-sort' : ''}" data-item-id="${item.id}" title="Tap to sort ${item.name}">
          <img src="${item.src}" alt="${item.name}" class="w10-sort-img">
          <div class="fw-bold text-dark" style="font-size:0.84rem;line-height:1.2;">${item.name}</div>
          ${isSorted
            ? `<span class="badge mt-1" style="font-size:0.68rem;background:${targetBin.color};color:#fff;">
                 <i class="bi bi-check2-circle me-1"></i>${targetBin.name.includes('Blue') ? 'Recycled' : 'Composted'}
               </span>`
            : '<span class="badge bg-secondary-subtle text-secondary mt-1" style="font-size:0.68rem;">Tap to Sort</span>'}
        </div>
      `;
    }).join('');

    // Two Bins Display
    const binsHtml = bins.map(bin => {
      const itemsInBin = slide.items.filter(item => sorted[item.id] && item.targetBin === bin.id);
      return `
        <div class="w10-bin-target-box flex-fill rounded-4 p-3" style="background:${bin.bg};border:2.5px solid ${bin.border};min-width:280px;">
          <div class="d-flex align-items-center gap-2 mb-2 pb-2 border-bottom" style="border-color:${bin.border} !important;">
            <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:40px;height:40px;background:${bin.color};color:#fff;font-size:1.2rem;flex-shrink:0;">
              <i class="bi ${bin.icon}"></i>
            </div>
            <div>
              <h4 class="fw-black fs-6 mb-0" style="color:${bin.color};">${bin.name}</h4>
              <small class="text-muted fw-bold" style="font-size:0.75rem;">${bin.subtitle}</small>
            </div>
            <span class="badge ms-auto rounded-pill" style="background:${bin.color};color:#fff;font-size:0.75rem;">${itemsInBin.length}</span>
          </div>
          <div class="d-flex flex-wrap gap-2" style="min-height:54px;align-content:flex-start;">
            ${itemsInBin.length > 0
              ? itemsInBin.map(item => `
                  <span class="w10-bin-item-pill badge d-inline-flex align-items-center gap-1 py-1 px-2" style="background:${bin.badgeBg || '#fff'};border:1px solid ${bin.border};color:${bin.badgeText || bin.color};font-size:0.78rem;font-weight:700;">
                    <i class="bi bi-check-circle-fill" style="color:${bin.color};"></i> ${item.name}
                  </span>
                `).join('')
              : `<span class="text-muted small fst-italic py-2"><i class="bi bi-arrow-down-short"></i> Tap items above to sort here</span>`
            }
          </div>
        </div>
      `;
    }).join('');

    // Object Info Card when clicked or sorted
    const objectInfoHtml = activeItem ? `
      <div class="w10-item-explanation-card mt-3 mb-0" style="border-color:${activeItem.color || '#2563eb'};box-shadow:0 6px 18px ${activeItem.color || '#2563eb'}26;">
        <img src="${activeItem.src}" alt="${activeItem.name}" class="w10-explanation-icon-preview" style="background:#eff6ff;border-color:#bfdbfe;">
        <div class="w10-explanation-content">
          <div class="w10-explanation-header">
            <span class="w10-explanation-item-name" style="color:${activeItem.color || '#1e3a8a'};">
              <i class="bi bi-info-circle-fill me-1"></i>${activeItem.name}
              <span class="badge ms-2" style="background:${activeItem.color || '#2563eb'};color:#fff;font-size:0.75rem;font-weight:700;border-radius:999px;padding:3px 8px;">
                ${activeItem.tag || (activeItem.category === 'recyclable' ? 'Recyclable' : 'Compost')}
              </span>
            </span>
            <button class="w10-explanation-listen-btn" id="w10-speak-sort-btn" title="Listen to this object info">
              <i class="bi bi-volume-up-fill"></i> Listen
            </button>
          </div>
          <p class="w10-explanation-text mb-0">${activeItem.reason}</p>
        </div>
      </div>
    ` : `
      <div class="alert alert-info py-2 px-3 mt-3 mb-0 d-flex align-items-center gap-2" style="border-radius:14px;border:1.5px solid #bfdbfe;background:#eff6ff;color:#1e40af;font-size:0.88rem;font-weight:700;">
        <i class="bi bi-hand-index-thumb fs-5 text-primary"></i>
        <span>Tap any object above to sort it into its bin and view its recycling guide!</span>
      </div>
    `;

    return `
      <div class="bpl-info-slide">
        <div class="w10-recycle-stage">
          <div class="d-flex justify-content-between align-items-center mb-2 px-1">
            <span class="fw-bold text-dark small"><i class="bi bi-collection-fill text-primary me-1"></i>Item Sorting Tray</span>
            <span class="badge bg-light text-dark border">${sortedCount} / ${slide.items.length} Sorted</span>
          </div>
          <div class="w10-recycle-items-tray">
            ${itemsHtml}
          </div>
          <div class="d-flex flex-wrap gap-3 mt-3">
            ${binsHtml}
          </div>
          ${objectInfoHtml}
        </div>
        <p class="bpl-body-text">${slide.description}</p>
        <div class="bpl-key-fact" style="background:${slide.factBg || '#dcfce7'}">
          <i class="bi bi-check-circle-fill me-2 text-success"></i>
          <span><strong>Key Fact:</strong> ${slide.keyFact}</span>
        </div>
      </div>`;
  }

  function renderQuickCheck(slide) {
    const ss = state.slideStates[slide.id] || {};
    const options = getShuffledOptions(slide);
    const optionsHtml = options.map(opt => {
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
           <i class="bi ${ss.correct ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2 fs-4"></i>
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
    const options = getShuffledOptions(slide);
    const letters = ['A', 'B', 'C', 'D'];
    const optionsHtml = options.map((opt, idx) => {
      let cls = 'bpl-assess-opt';
      if (as.selected === opt.id) {
        cls += opt.id === slide.correctId ? ' bpl-opt-correct' : ' bpl-opt-wrong';
      }
      return `
        <button class="${cls}" data-id="${opt.id}" ${as.answered ? 'disabled' : ''}>
          <span class="bpl-assess-letter">${letters[idx]}</span>
          <span>${opt.label}</span>
        </button>`;
    }).join('');

    const feedbackHtml = as.answered
      ? `<div class="bpl-feedback ${as.selected === slide.correctId ? 'bpl-feedback-ok' : 'bpl-feedback-err'}">
           <i class="bi ${as.selected === slide.correctId ? 'bi-check-circle-fill text-success' : 'bi-x-circle-fill text-danger'} me-2 fs-4"></i>
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
            <span class="w10-question-hint-pill"><i class="bi bi-patch-question-fill me-1"></i>Check Your Understanding</span>
          </div>
          <p class="bpl-prompt">${slide.question}</p>
        </div>
        <div class="bpl-options">${optionsHtml}</div>
        ${feedbackHtml}
      </div>`;
  }

  function renderSummary(slide) {
    // Compact Lesson Complete Card
    const completeCardHtml = `
      <div class="w10-lesson-complete-card text-center p-3 mb-3 mx-auto rounded-4" style="max-width:440px;background:linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%);border:2px solid #86efac;box-shadow:0 6px 18px rgba(34, 197, 94, 0.15);">
        <div class="d-inline-flex align-items-center justify-content-center rounded-circle bg-success text-white mb-2" style="width:48px;height:48px;font-size:1.5rem;">
          <i class="bi bi-award-fill"></i>
        </div>
        <h3 class="fw-black text-dark fs-5 mb-1">Lesson Complete!</h3>
        <p class="text-success-emphasis small fw-bold mb-0">You've mastered these core science concepts.</p>
      </div>
    `;

    // Big Ideas Grid if present
    let contentHtml = '';
    if (slide.bigIdeas && slide.bigIdeas.length > 0) {
      contentHtml = `
        <div class="w10-big-ideas-grid">
          ${slide.bigIdeas.map(idea => `
            <div class="w10-big-idea-card p-3 rounded-4 shadow-sm" style="background:${idea.bg};border:2px solid ${idea.border};">
              <div class="d-flex align-items-center gap-2 mb-2">
                <div class="rounded-circle d-flex align-items-center justify-content-center" style="width:38px;height:38px;background:${idea.color};color:#fff;font-size:1.15rem;flex-shrink:0;">
                  <i class="bi ${idea.icon}"></i>
                </div>
                <h4 class="fw-black fs-6 mb-0" style="color:${idea.color};">${idea.title}</h4>
              </div>
              <p class="mb-0 text-dark fw-semibold" style="font-size:0.92rem;line-height:1.45;">${idea.text}</p>
            </div>
          `).join('')}
        </div>
      `;
    } else {
      const bulletsHtml = slide.bullets.map(b => `<li>${b}</li>`).join('');
      contentHtml = `<ul class="bpl-summary-list">${bulletsHtml}</ul>`;
    }

    return `
      <div class="bpl-summary-slide">
        ${completeCardHtml}
        ${contentHtml}
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
            const tagPart = activeItem.tag ? `${activeItem.tag}. ` : '';
            speakText(`${activeItem.label}. ${tagPart}${activeItem.simpleExplanation}`);
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
      const cards = document.querySelectorAll('.w10-sort-card[data-item-id]');
      cards.forEach(card => {
        card.addEventListener('click', () => {
          const itemId = card.getAttribute('data-item-id');
          state.recycleSorted[itemId] = true;
          state.activeSortedItemId = itemId;
          render();
        });
      });

      const speakSortBtn = document.getElementById('w10-speak-sort-btn');
      if (speakSortBtn) {
        speakSortBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          const activeItem = slide.items.find(i => i.id === state.activeSortedItemId) || slide.items[0];
          if (activeItem) {
            speakText(`${activeItem.name}. ${activeItem.reason}`);
          }
        });
      }
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
        stopVoicePrompt();
        state.currentIndex--;
        saveProgress(false);
        render();
      }
    });
  }

  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      stopVoicePrompt();
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

  // ── Voice Prompts & Read Aloud ─────────────────────────────────────────────
  const WEEK10_VOICE_MAP = {
    // Properties of Metals
    'iron-hook': 'metal_s1_iron_hook',
    'iron-teach-strong': 'metal_s2_iron_strong',
    'iron-teach-abundant': 'metal_s3_iron_abundant',
    'iron-teach-rust': 'metal_s4_iron_rust',
    'iron-qc': 'metal_s5_iron_qc',
    'copper-hook': 'metal_s6_copper_hook',
    'copper-teach-conduction': 'metal_s7_copper_wire',
    'copper-teach-wire': 'metal_s7_copper_wire',
    'copper-qc': 'metal_s8_copper_qc',
    'gold-silver-hook': 'metal_s9_gold_hook',
    'gold-hook': 'metal_s9_gold_hook',
    'gold-silver-teach-shine': 'metal_s10_gold_shine',
    'gold-teach-shine': 'metal_s10_gold_shine',
    'gold-silver-qc': 'metal_s11_gold_qc',
    'gold-qc': 'metal_s11_gold_qc',
    'metals-reflect': 'metal_s12_reflect',
    'metal-reflect': 'metal_s12_reflect',
    'metals-discuss': 'metal_s13_discuss',
    'metal-discuss': 'metal_s13_discuss',
    'metals-deepen': 'metal_s14_deepen',
    'metal-deepen': 'metal_s14_deepen',
    'metals-summary': 'metal_s15_summary',
    'metal-summary': 'metal_s15_summary',
    'metals-assess-1': 'metal_s16_assess1',
    'metal-assess-1': 'metal_s16_assess1',
    'metals-assess-2': 'metal_s17_assess2',
    'metal-assess-2': 'metal_s17_assess2',
    'metals-assess-3': 'metal_s18_assess3',
    'metal-assess-3': 'metal_s18_assess3',
    'metals-assess-4': 'metal_s19_assess4',
    'metal-assess-4': 'metal_s19_assess4',
    'metals-assess-5': 'metal_s20_assess5',
    'metal-assess-5': 'metal_s20_assess5',

    // Recycling
    'recycle-hook': 'recycle_s1_hook',
    'recycle-teach-loop': 'recycle_s2_process',
    'recycle-teach-sort': 'recycle_s3_sort',
    'recycle-qc': 'recycle_s4_qc',
    'recycle-reflect': 'recycle_s5_reflect',
    'recycle-discuss': 'recycle_s6_discuss',
    'recycle-deepen': 'recycle_s7_deepen',
    'recycle-summary': 'recycle_s8_summary',
    'recycle-assess-1': 'recycle_s9_q1',
    'recycle-assess-2': 'recycle_s10_q2',
    'recycle-assess-3': 'recycle_s11_q3',
    'recycle-assess-4': 'recycle_s12_q4',
    'recycle-assess-5': 'recycle_s13_q5',
  };

  if (ttsBtn) {
    ttsBtn.addEventListener('click', () => {
      const slide = slides[state.currentIndex];
      // Strictly one read aloud per page: only the instruction or question
      const textToSpeak = slide.question || slide.prompt || slide.description || slide.title;
      const voiceKey = WEEK10_VOICE_MAP[slide.id] || '';
      playVoicePrompt(voiceKey, textToSpeak);
    });
  }

  // Initial render
  render();
}
