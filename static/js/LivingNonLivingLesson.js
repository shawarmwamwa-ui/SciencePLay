// LivingNonLivingLesson.js
// Main lesson logic for the Living vs Non-Living interactive slideshow.
// This file handles slide navigation, progress updates, audio feedback, and event logging.

import { LESSON_SLIDES } from './lessonSlidesData.js';
import { speakText, playVoicePrompt, stopVoicePrompt } from './ttsHelper.js';

const lessonState = {
  currentIndex: 0,
  slideStartTime: null,
  log: [],
  slideStates: {},
  touchStartX: null,
};

let lessonAudioContext = null;

function initLessonAudio() {
  if (!lessonAudioContext) {
    lessonAudioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return lessonAudioContext;
}

function playAudioTone(frequency, duration = 0.12, volume = 0.12) {
  const ctx = initLessonAudio();
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(volume, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(ctx.currentTime);
  oscillator.stop(ctx.currentTime + duration);
}

function playFeedbackSound(correct) {
  playAudioTone(correct ? 660 : 260, 0.18, 0.18);
}

function playTapSound() {
  playAudioTone(480, 0.08, 0.1);
}

function getActiveLessonSlides() {
  if (window.publishedLessonPayload && Array.isArray(window.publishedLessonPayload.slides) && window.publishedLessonPayload.slides.length) {
    return window.publishedLessonPayload.slides.map((slide, index) => ({
      id: slide.id || `slide-${index + 1}`,
      title: slide.title || `Slide ${index + 1}`,
      type: slide.type || (slide.templateType === 'summary' ? 'summary' : 'quick-check'),
      description: slide.metadata?.hintText || '',
      prompt: slide.contentData?.prompt || 'Answer the question.',
      options: (slide.contentData?.items || []).map((item, itemIndex) => ({
        id: `${slide.id || index + 1}-option-${itemIndex + 1}`,
        label: item.label || `Option ${itemIndex + 1}`,
        icon: item.iconKey || '',
        isLiving: item.category === 'living'
      })),
      targetIsLiving: (slide.contentData?.targets || []).some(target => target.accepts && target.accepts.includes('living')),
      successMessage: slide.metadata?.correctFeedback || 'Correct!',
      retryMessage: slide.metadata?.incorrectFeedback || 'Try again.',
      retryHint: slide.metadata?.hintText || 'Think carefully.',
      bullets: Array.isArray(slide.contentData?.bullets) ? slide.contentData.bullets : [],
      hotspots: Array.isArray(slide.contentData?.hotspots) ? slide.contentData.hotspots : [],
      traits: Array.isArray(slide.contentData?.traits) ? slide.contentData.traits : [],
      object: slide.contentData?.object || {},
      correctTraits: Array.isArray(slide.contentData?.correctTraits) ? slide.contentData.correctTraits : []
    }));
  }

  return LESSON_SLIDES;
}

let lessonHeartbeatInterval = null;
let lessonFinished = false;

function initLesson() {
  console.log('Initializing lesson...');
  console.log('LESSON_SLIDES available:', LESSON_SLIDES ? LESSON_SLIDES.length + ' slides' : 'NOT LOADED');
  const startIdx = typeof window.initialSlideIndex === 'number' ? Number(window.initialSlideIndex) : (Number(window.initial_slide) || 0);
  const slides = getActiveLessonSlides();
  lessonState.currentIndex = Math.min(Math.max(0, startIdx), slides.length - 1);
  lessonState.log = [];
  lessonState.slideStates = {};
  lessonState.slideStartTime = Date.now();
  lessonState.touchStartX = null;
  lastSavedTime = performance.now();
  lessonFinished = false;

  renderLesson();
  bindNavigation();
  bindSwipe();
  bindTTS();

  // Immediate save to register student as active in live tracker
  saveLessonProgress(false);

  // Periodic 5-second heartbeat for real-time live time tracking
  if (lessonHeartbeatInterval) {
    clearInterval(lessonHeartbeatInterval);
  }
  lessonHeartbeatInterval = setInterval(() => {
    if (!lessonFinished) {
      saveLessonProgress(false);
    }
  }, 5000);

  // Flush remaining time when leaving page (only if not already finished)
  window.addEventListener('pagehide', () => {
    if (!lessonFinished) {
      saveLessonProgress(false);
    }
  });

  console.log('Lesson initialized');
}

function getCurrentSlide() {
  return getActiveLessonSlides()[lessonState.currentIndex];
}

function ensureSlideState(slide) {
  if (!lessonState.slideStates[slide.id]) {
    lessonState.slideStates[slide.id] = {
      hotspotProgress: {},
      lastHotspotId: null,
      quickCheckState: null,
      characteristicSelections: new Set(),
    };
  }
  return lessonState.slideStates[slide.id];
}

function getCurrentSlideState() {
  return ensureSlideState(getCurrentSlide());
}

function resetSlideState() {
  lessonState.slideStartTime = Date.now();
}

function bindNavigation() {
  document.querySelector('#next-slide').addEventListener('click', () => {
    if (!canAdvance()) {
      return;
    }
    logCurrentSlide();
    const slides = getActiveLessonSlides();
    const slide = getCurrentSlide();
    const isFinalSlide = lessonState.currentIndex === slides.length - 1;

    if (slide.type === 'summary' || isFinalSlide) {
      lessonFinished = true;
      if (lessonHeartbeatInterval) {
        clearInterval(lessonHeartbeatInterval);
      }
      const nextBtn = document.querySelector('#next-slide');
      if (nextBtn) {
        nextBtn.disabled = true;
        nextBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Finishing...';
      }
      saveLessonProgress(true).finally(() => {
        window.location.href = '/student/lessons';
      });
      return;
    }

    stopVoicePrompt();
    lessonState.currentIndex += 1;
    resetSlideState();
    renderLesson();
    saveLessonProgress();
  });

  document.querySelector('#prev-slide').addEventListener('click', () => {
    if (lessonState.currentIndex === 0) {
      return;
    }
    stopVoicePrompt();
    logCurrentSlide();
    lessonState.currentIndex -= 1;
    resetSlideState();
    renderLesson();
    saveLessonProgress();
  });

  const backBtn = document.querySelector('.brutal-back-btn, .bpl-back-btn');
  if (backBtn) {
    backBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const slides = getActiveLessonSlides();
      const isAtEnd = lessonState.currentIndex >= slides.length - 1 || getCurrentSlide()?.type === 'summary';
      backBtn.classList.add('disabled');
      saveLessonProgress(isAtEnd).finally(() => {
        window.location.href = '/student/lessons';
      });
    });
  }
}

const LIVING_VOICE_KEYS = [
  'living_s1_intro',
  'living_s2_explore',
  'living_s3_qc1',
  'living_s4_explore2',
  'living_s5_qc2',
  'living_s6_fish',
  'living_s7_summary'
];

function bindTTS() {
  const btn = document.querySelector('#tts-btn');
  if (!btn) return;
  
  btn.addEventListener('click', () => {
    const slide = getCurrentSlide();
    // Strictly one read aloud per page: only the instruction or question
    const textToRead = slide.question || slide.prompt || slide.description || slide.title;
    const voiceKey = LIVING_VOICE_KEYS[lessonState.currentIndex] || '';
    playVoicePrompt(voiceKey, textToRead);
  });
}

function bindSwipe() {
  const card = document.querySelector('.slide-card');
  if (!card) {
    return;
  }

  card.addEventListener('touchstart', event => {
    lessonState.touchStartX = event.touches[0].clientX;
  });

  card.addEventListener('touchend', event => {
    if (lessonState.touchStartX === null) {
      return;
    }

    const touchEndX = event.changedTouches[0].clientX;
    const deltaX = touchEndX - lessonState.touchStartX;
    const threshold = 60;

    if (deltaX > threshold && lessonState.currentIndex > 0) {
      document.querySelector('#prev-slide').click();
    } else if (deltaX < -threshold && lessonState.currentIndex < getActiveLessonSlides().length - 1) {
      document.querySelector('#next-slide').click();
    }
    lessonState.touchStartX = null;
  });
}

function renderLesson() {
  const slide = getCurrentSlide();
  console.log('Rendering slide:', slide.id, 'type:', slide.type);
  const slides = getActiveLessonSlides();
  document.querySelector('#lesson-title').textContent = slide.title;
  document.querySelector('#lesson-progress').style.width = `${((lessonState.currentIndex + 1) / slides.length) * 100}%`;
  document.querySelector('#lesson-progress-text').textContent = `${lessonState.currentIndex + 1} / ${slides.length}`;
  document.querySelector('#prev-slide').disabled = lessonState.currentIndex === 0;
  document.querySelector('#next-slide').textContent = slide.type === 'summary' ? (slide.nextLabel || 'Finish') : 'Next';
  const explanationContainer = document.querySelector('#slide-explanation');
  const slideContainer = document.querySelector('#slide-content');
  explanationContainer.innerHTML = '';
  slideContainer.innerHTML = '';

  // Show description for non-intro slides above the card.
  if (slide.description && slide.type !== 'intro') {
    explanationContainer.innerHTML = `<div class="slide-explanation-text">${slide.description}</div>`;
  }

  if (slide.type === 'intro') {
    renderIntroSlide(slide, slideContainer, explanationContainer);
  } else if (slide.type === 'hotspots') {
    renderHotspotSlide(slide, slideContainer, explanationContainer);
  } else if (slide.type === 'quick-check') {
    renderQuickCheckSlide(slide, slideContainer, explanationContainer);
  } else if (slide.type === 'characteristics') {
    renderCharacteristicsSlide(slide, slideContainer, explanationContainer);
  } else if (slide.type === 'summary') {
    renderSummarySlide(slide, slideContainer, explanationContainer);
  }

  updateNavigationState();
  console.log('Slide rendered, slideContainer innerHTML length:', slideContainer.innerHTML.length);
}

function getQuickFeedbackMessage(slide, isCorrect) {
  if (isCorrect) {
    const lead = slide.successMessage || 'Correct!';
    return `${lead} ${slide.explanation || ''}`.trim();
  }

  const lead = slide.retryMessage || 'Try again.';
  const hint = slide.retryHint || 'Think about what only living or non-living things can do on their own.';
  return `${lead} ${hint}`.trim();
}

function getTraitMistakeMessage(slide, selectedCount, wrongLabels) {
  const hint = slide.mistakeHint || 'Try choosing traits that living things do on their own.';
  return `You picked ${selectedCount} trait${selectedCount === 1 ? '' : 's'}, but ${wrongLabels} ${wrongLabels.includes(',') ? 'are' : 'is'} not a living-thing clue. ${hint}`;
}

function getTraitProgressMessage(slide, correctCount) {
  if (correctCount === slide.correctTraits.length) {
    return slide.conclusion;
  }

  const lead = slide.partialMessage || 'Good start!';
  return `${lead} You have found ${correctCount} correct trait${correctCount === 1 ? '' : 's'} so far.`;
}

function canAdvance() {
  const slide = getCurrentSlide();
  const slideState = getCurrentSlideState();
  if (slide.type === 'hotspots') {
    return Object.keys(slideState.hotspotProgress).length === slide.hotspots.length;
  }
  if (slide.type === 'quick-check') {
    return Boolean(slideState.quickCheckState?.correct);
  }
  if (slide.type === 'characteristics') {
    const selected = slideState.characteristicSelections;
    const hasWrongChoice = Array.from(selected).some(id => !slide.correctTraits.includes(id));
    const allCorrectSelected = slide.correctTraits.every(id => selected.has(id));
    return allCorrectSelected && !hasWrongChoice;
  }
  return true;
}

function renderIntroSlide(slide, container) {
  container.innerHTML = `
    <div class="lesson-intro">
      ${slide.image ? `<img src="${slide.image}" alt="Lesson intro" class="lesson-intro-image">` : ''}
      ${slide.description ? `<p class="lesson-intro-description">${slide.description}</p>` : ''}
    </div>
  `;
}

function renderHotspotSlide(slide, container, explanationContainer) {
  const slideState = getCurrentSlideState();
  const hotspotHtml = slide.hotspots
    .map(hotspot => `
      <button class="hotspot ${slideState.hotspotProgress[hotspot.id] ? 'hotspot-tapped' : ''}" data-id="${hotspot.id}" style="left: ${hotspot.x}%; top: ${hotspot.y}%">
        ${(hotspot.icon || hotspot.image) ? `<img src="${hotspot.icon || hotspot.image}" alt="${hotspot.label}" class="hotspot-icon">` : ''}
        <span>${hotspot.label}</span>
      </button>
    `)
    .join('');

  const sceneStyle = slide.backgroundImage
    ? `background-image: url('${slide.backgroundImage}')`
    : 'background: linear-gradient(180deg, #eaf6ff 0%, #d8f0ff 45%, #f8fbff 100%);';

  container.innerHTML = `
    <div class="hotspot-slide">
      <div class="scene-image" style="${sceneStyle}">
        ${hotspotHtml}
      </div>
      <div id="hotspot-feedback" class="hotspot-feedback"></div>
    </div>
  `;

  if (slideState.lastHotspotId) {
    const hotspot = slide.hotspots.find(item => item.id === slideState.lastHotspotId);
    if (hotspot) {
      const feedback = container.querySelector('#hotspot-feedback');
      feedback.innerHTML = `
        <div class="hotspot-card">
          <strong>${hotspot.label}</strong>
          <p>${hotspot.description}</p>
        </div>
      `;
    }
  }

  slide.hotspots.forEach(hotspot => {
    const button = container.querySelector(`.hotspot[data-id="${hotspot.id}"]`);
    if (button) {
      button.addEventListener('click', () => handleHotspotTap(slide, hotspot, button));
    } else {
      console.warn(`Hotspot button not found for id: ${hotspot.id}`);
    }
  });
}

function handleHotspotTap(slide, hotspot, button) {
  playTapSound();
  const slideState = getCurrentSlideState();
  const wasTapped = Boolean(slideState.hotspotProgress[hotspot.id]);
  if (!wasTapped) {
    slideState.hotspotProgress[hotspot.id] = true;
    button.classList.add('hotspot-tapped');
  }
  slideState.lastHotspotId = hotspot.id;

  const feedback = document.querySelector('#hotspot-feedback');
  feedback.innerHTML = `
    <div class="hotspot-card">
      <strong>${hotspot.label}</strong>
      <p>${hotspot.description}</p>
    </div>
  `;
  button.classList.add('hotspot-bounce');
  setTimeout(() => button.classList.remove('hotspot-bounce'), 350);
  updateNavigationState();
}

function renderQuickCheckSlide(slide, container, explanationContainer) {
  const slideState = getCurrentSlideState();
  if (!slideState.shuffledOptions) {
    const opts = [...slide.options];
    for (let i = opts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [opts[i], opts[j]] = [opts[j], opts[i]];
    }
    slideState.shuffledOptions = opts;
  }
  const optionsToRender = slideState.shuffledOptions;

  const promptMarkup = slide.prompt
    ? `<div class="quick-check-header-card">
         <span class="quick-check-badge"><i class="bi bi-lightbulb-fill me-1"></i>Quick Check</span>
         <p class="quick-check-prompt">${slide.prompt}</p>
       </div>`
    : '';
  const optionsHtml = optionsToRender
    .map(option => {
      const isSelected = slideState.quickCheckState?.selected === option.id;
      const isCorrect = slideState.quickCheckState?.correct;
      const selectedClass = isSelected
        ? isCorrect ? 'option-correct' : 'option-incorrect'
        : '';
      return `
      <button class="quick-option ${selectedClass}" data-id="${option.id}">
        <div class="quick-opt-icon-circle">
          ${(option.icon || option.image) ? `<img src="${option.icon || option.image}" alt="${option.label}" class="quick-option-icon">` : '<i class="bi bi-patch-question-fill"></i>'}
        </div>
        <span class="quick-opt-text">${option.label}</span>
      </button>
    `;
    })
    .join('');

  container.innerHTML = `
    <div class="quick-check-slide">
      ${promptMarkup}
      <div class="quick-options">${optionsHtml}</div>
      <div id="quick-feedback" class="quick-feedback"></div>
    </div>
  `;

  optionsToRender.forEach(option => {
    const button = container.querySelector(`.quick-option[data-id="${option.id}"]`);
    if (button) {
      button.addEventListener('click', () => handleQuickCheckTap(slide, option, button));
    } else {
      console.warn(`Quick-check button not found for id: ${option.id}`);
    }
  });

  const feedback = container.querySelector('#quick-feedback');
  if (slideState.quickCheckState) {
    const isCorrect = slideState.quickCheckState.correct;
    const msg = getQuickFeedbackMessage(slide, isCorrect);
    feedback.innerHTML = `
      <div class="quick-feedback-bubble ${isCorrect ? 'bubble-correct' : 'bubble-incorrect'}">
        <div class="bubble-icon">
          <i class="bi ${isCorrect ? 'bi-patch-check-fill text-success' : 'bi-lightbulb-fill text-warning'} fs-3"></i>
        </div>
        <div class="bubble-text">
          <strong>${isCorrect ? 'Awesome Job, Scientist!' : 'Coach Tip:'}</strong>
          <p>${msg}</p>
        </div>
      </div>
    `;
  }
}

function handleQuickCheckTap(slide, option, button) {
  playTapSound();
  const slideState = getCurrentSlideState();
  if (slideState.quickCheckState?.correct) {
    return;
  }

  const allOptions = document.querySelectorAll('.quick-option');
  allOptions.forEach(opt => {
    opt.classList.remove('option-correct', 'option-incorrect');
  });

  const isCorrect = slide.hasOwnProperty('targetIsLiving')
    ? option.isLiving === slide.targetIsLiving
    : option.isLiving;

  slideState.quickCheckState = {
    selected: option.id,
    correct: isCorrect,
  };

  const feedback = document.querySelector('#quick-feedback');
  const msg = getQuickFeedbackMessage(slide, isCorrect);
  feedback.innerHTML = `
    <div class="quick-feedback-bubble ${isCorrect ? 'bubble-correct' : 'bubble-incorrect'}">
      <div class="bubble-icon">
        <i class="bi ${isCorrect ? 'bi-patch-check-fill text-success' : 'bi-lightbulb-fill text-warning'} fs-3"></i>
      </div>
      <div class="bubble-text">
        <strong>${isCorrect ? 'Awesome Job, Scientist!' : 'Coach Tip:'}</strong>
        <p>${msg}</p>
      </div>
    </div>
  `;
  button.classList.add(isCorrect ? 'option-correct' : 'option-incorrect');
  playFeedbackSound(isCorrect);
  updateNavigationState();
  logQuickCheckAttempt(slide, option, isCorrect);
}

function logQuickCheckAttempt(slide, option, isCorrect) {
  const promptText = slide.prompt || `Question #${slide.id}`;
  const optionName = option.label || option.name || option.id || '';
  const questionTitle = optionName ? `${promptText} (${optionName})` : promptText;

  fetch('/student/lesson_question_attempt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      lesson_id: 1,
      question: questionTitle,
      was_correct: isCorrect
    })
  }).catch(() => {});
}

function renderCharacteristicsSlide(slide, container, explanationContainer) {
  const slideState = getCurrentSlideState();
  const traitsHtml = slide.traits
    .map(trait => {
      const isSelected = slideState.characteristicSelections.has(trait.id);
      const isCorrect = slide.correctTraits.includes(trait.id);
      let stateClass = '';
      let badgeHtml = '';
      if (isSelected) {
        if (isCorrect) {
          stateClass = 'trait-selected trait-correct';
          badgeHtml = '<span class="trait-check-badge"><i class="bi bi-check-circle-fill"></i></span>';
        } else {
          stateClass = 'trait-selected trait-incorrect';
          badgeHtml = '<span class="trait-check-badge"><i class="bi bi-x-circle-fill"></i></span>';
        }
      }
      return `
        <button class="trait-option ${stateClass}" data-id="${trait.id}">
          <span class="trait-label">${trait.label}</span>
          ${badgeHtml}
        </button>
      `;
    })
    .join('');

  const objectImage = slide.object.image || (slide.object.icon && (slide.object.icon.startsWith('http') || slide.object.icon.startsWith('/')) ? slide.object.icon : '') || '/static/images/fish.png';
  const objectDescription = slide.object.description || slide.object.explanation || '';

  const imageHtml = objectImage 
    ? `<img src="${objectImage}" alt="${slide.object.label}" class="characteristics-object-image">`
    : `<div class="characteristics-object-emoji">${slide.object.icon || '🐟'}</div>`;

  container.innerHTML = `
    <div class="characteristics-slide">
      <div class="characteristics-object">
        ${imageHtml}
        <div class="characteristics-object-info">
          <div class="object-label">${slide.object.label}</div>
          <p>${objectDescription}</p>
        </div>
      </div>
      <div class="traits-grid">${traitsHtml}</div>
      <div id="characteristics-feedback" class="characteristics-feedback"></div>
    </div>
  `;
  if (slide.description && explanationContainer) {
    explanationContainer.innerHTML = `<div class="slide-explanation-text">${slide.description}</div>`;
  }

  slide.traits.forEach(trait => {
    const button = container.querySelector(`.trait-option[data-id="${trait.id}"]`);
    if (button) {
      button.addEventListener('click', () => handleTraitTap(slide, trait, button));
    } else {
      console.warn(`Trait button not found for id: ${trait.id}`);
    }
  });

  const feedback = container.querySelector('#characteristics-feedback');
  feedback.classList.remove('feedback-correct', 'feedback-incorrect');
  if (slideState.characteristicSelections.size > 0) {
    const selectedCount = slideState.characteristicSelections.size;
    const wrongTraits = Array.from(slideState.characteristicSelections).filter(id => !slide.correctTraits.includes(id));
    if (wrongTraits.length > 0) {
      const wrongLabels = wrongTraits
        .map(id => slide.traits.find(trait => trait.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      feedback.textContent = getTraitMistakeMessage(slide, selectedCount, wrongLabels);
      feedback.classList.add('feedback-incorrect');
    } else {
      const correctCount = slide.correctTraits.filter(id => slideState.characteristicSelections.has(id)).length;
      const progressText = getTraitProgressMessage(slide, correctCount);
      feedback.textContent = progressText;
      feedback.classList.add('feedback-correct');
    }
  }
}

function handleTraitTap(slide, trait, button) {
  playTapSound();
  const slideState = getCurrentSlideState();
  const selected = slideState.characteristicSelections;
  const isCorrect = slide.correctTraits.includes(trait.id);

  if (selected.has(trait.id)) {
    selected.delete(trait.id);
    button.classList.remove('trait-selected', 'trait-correct', 'trait-incorrect');
    const badge = button.querySelector('.trait-check-badge');
    if (badge) badge.remove();
  } else {
    selected.add(trait.id);
    button.classList.add('trait-selected');
    if (isCorrect) {
      button.classList.add('trait-correct');
      button.classList.remove('trait-incorrect');
      button.innerHTML = `<span class="trait-label">${trait.label}</span><span class="trait-check-badge"><i class="bi bi-check-circle-fill"></i></span>`;
    } else {
      button.classList.add('trait-incorrect');
      button.classList.remove('trait-correct');
      button.innerHTML = `<span class="trait-label">${trait.label}</span><span class="trait-check-badge"><i class="bi bi-x-circle-fill"></i></span>`;
    }
  }

  const feedback = document.querySelector('#characteristics-feedback');
  const selectedCount = selected.size;
  if (selectedCount === 0) {
    feedback.textContent = '';
    feedback.classList.remove('feedback-correct');
    feedback.classList.remove('feedback-incorrect');
  } else {
    const correctCount = slide.correctTraits.filter(id => selected.has(id)).length;
    const wrongTraits = Array.from(selected).filter(id => !slide.correctTraits.includes(id));

    if (wrongTraits.length > 0) {
      const wrongLabels = wrongTraits
        .map(id => slide.traits.find(trait => trait.id === id)?.label)
        .filter(Boolean)
        .join(', ');
      feedback.textContent = getTraitMistakeMessage(slide, selectedCount, wrongLabels);
      feedback.classList.add('feedback-incorrect');
      feedback.classList.remove('feedback-correct');
    } else {
      const correctCount = slide.correctTraits.filter(id => selected.has(id)).length;
      const progressText = getTraitProgressMessage(slide, correctCount);
      feedback.textContent = progressText;
      feedback.classList.add('feedback-correct');
      feedback.classList.remove('feedback-incorrect');
    }
  }
  updateNavigationState();
}

function renderSummarySlide(slide, container) {
  const defaultIdeas = [
    {
      icon: '🌱',
      title: 'Living Needs & Growth',
      text: 'Living things grow, breathe, reproduce, and need food and water to survive.',
      bg: '#f0fdf4',
      border: '#86efac',
      color: '#16a34a'
    },
    {
      icon: '🪨',
      title: 'Non-Living Characteristics',
      text: 'Non-living things do not eat, breathe, grow, or move on their own.',
      bg: '#f8fafc',
      border: '#cbd5e1',
      color: '#475569'
    },
    {
      icon: '🐾',
      title: 'Plants & Animals Are Living',
      text: 'Puppies, birds, fish, trees, and flowers are all living organisms!',
      bg: '#ecfdf5',
      border: '#a7f3d0',
      color: '#059669'
    },
    {
      icon: '🚲',
      title: 'Everyday Objects Are Non-Living',
      text: 'Toys, bicycles, chairs, rocks, and pencils are non-living items.',
      bg: '#eff6ff',
      border: '#bfdbfe',
      color: '#2563eb'
    }
  ];

  container.innerHTML = `
    <div class="summary-slide ln-summary-container">
      <div class="ln-summary-badge">
        <div class="ln-summary-badge-icon">
          <i class="bi bi-award-fill"></i>
        </div>
        <div class="ln-summary-badge-text">
          <h3>Lesson Complete!</h3>
          <p>You've mastered the core concepts of Living and Non-Living things!</p>
        </div>
      </div>
      <div class="ln-summary-grid">
        ${defaultIdeas.map(idea => `
          <div class="ln-summary-card" style="background:${idea.bg};border:2px solid ${idea.border};">
            <div class="ln-summary-card-header">
              <span class="ln-summary-emoji">${idea.icon}</span>
              <h4 style="color:${idea.color};">${idea.title}</h4>
            </div>
            <p class="ln-summary-desc">${idea.text}</p>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function updateNavigationState() {
  const nextButton = document.querySelector('#next-slide');
  nextButton.disabled = !canAdvance();
}

let lastSavedTime = performance.now();

function saveLessonProgress(completed = false) {
  const lessonId = window.currentLessonId || null;
  if (!lessonId) {
    return Promise.resolve();
  }

  const now = performance.now();
  const timeSpentDelta = Math.max(1, Math.round((now - lastSavedTime) / 1000));
  lastSavedTime = now;

  const slides = getActiveLessonSlides();
  const isAtSummary = lessonState.currentIndex >= slides.length - 1 || getCurrentSlide()?.type === 'summary';
  const isDone = completed || isAtSummary;
  const progressPercent = isDone ? 100 : Math.round(((lessonState.currentIndex + 1) / slides.length) * 100);

  const payload = {
    lesson_id: lessonId,
    progress_percent: progressPercent,
    current_slide: lessonState.currentIndex,
    completed: isDone,
    time_spent: timeSpentDelta,
  };

  return fetch('/student/lesson_progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    keepalive: true,
    body: JSON.stringify(payload)
  }).then(response => {
    if (!response.ok) {
      return response.json().then(err => Promise.reject(err));
    }
    return response.json();
  }).then(data => {
    console.debug('Lesson progress saved:', data);
    return data;
  }).catch(error => {
    console.warn('Failed to save lesson progress:', error);
  });
}

function logCurrentSlide() {
  const slide = getCurrentSlide();
  const slideState = getCurrentSlideState();
  const timeSpentOnSlide = Date.now() - lessonState.slideStartTime;

  const logEntry = {
    studentId: window.currentStudentId || null,
    slideId: slide.id,
    timeSpentOnSlide,
    hotspotsTapped: slide.type === 'hotspots' ? Object.keys(slideState.hotspotProgress) : [],
    quickCheckAnswer: slide.type === 'quick-check' ? slideState.quickCheckState : null,
    traitsSelected: slide.type === 'characteristics' ? Array.from(slideState.characteristicSelections) : [],
  };

  lessonState.log.push(logEntry);
  console.debug('Lesson log entry:', logEntry);
}

window.initLivingNonLivingLesson = initLesson;
window.lessonState = lessonState;
console.log('LivingNonLivingLesson module loaded, initLivingNonLivingLesson available:', typeof window.initLivingNonLivingLesson);
