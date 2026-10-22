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
    const isLivingTopic = (window.publishedLessonPayload.title || '').toLowerCase().includes('living');
    return window.publishedLessonPayload.slides.map((slide, index) => {
      const rawType = slide.type || (slide.templateType === 'summary' ? 'summary' : 'quick-check');
      const normalizedType = (rawType === 'concept' ? 'intro' : rawType);
      const rawOptions = Array.isArray(slide.options) ? slide.options : (slide.contentData?.items || []);
      return {
        id: slide.id || `slide-${index + 1}`,
        title: slide.title || `Slide ${index + 1}`,
        type: normalizedType,
        image: slide.image || '',
        images: Array.isArray(slide.images) && slide.images.length > 0 ? slide.images : (slide.image ? [slide.image] : []),
        animationSrc: slide.animationSrc || (typeof slide.image === 'string' && slide.image.endsWith('.json') ? slide.image : ''),
        animationLabel: slide.animationLabel || '',
        captions: Array.isArray(slide.captions) ? slide.captions : [],
        description: slide.description || slide.explanation || slide.metadata?.hintText || '',
        explanation: slide.explanation || slide.description || '',
        prompt: slide.prompt || slide.contentData?.prompt || (normalizedType === 'quick-check' ? 'Answer the question.' : ''),
        options: rawOptions.map((item, itemIndex) => ({
          id: item.id || `${slide.id || index + 1}-option-${itemIndex + 1}`,
          label: item.label || `Option ${itemIndex + 1}`,
          icon: item.icon || item.iconKey || item.image || '',
          image: item.image || item.icon || '',
          isCorrect: item.isCorrect ?? (item.category === 'living'),
          isLiving: item.isCorrect ?? (item.category === 'living')
        })),
        targetIsLiving: (slide.contentData?.targets || []).some(target => target.accepts && target.accepts.includes('living')),
        successMessage: slide.successMessage || slide.metadata?.correctFeedback || 'Correct! Well done!',
        retryMessage: slide.retryMessage || slide.metadata?.incorrectFeedback || 'Try again!',
        retryHint: slide.retryHint || slide.metadata?.hintText || (isLivingTopic ? 'Think carefully about what living things do.' : 'Think carefully about the clues and try again.'),
        bullets: Array.isArray(slide.bullets) ? slide.bullets : (Array.isArray(slide.contentData?.bullets) ? slide.contentData.bullets : []),
        hotspots: Array.isArray(slide.hotspots) ? slide.hotspots : (Array.isArray(slide.contentData?.hotspots) ? slide.contentData.hotspots : []),
        traits: Array.isArray(slide.traits) ? slide.traits : (Array.isArray(slide.contentData?.traits) ? slide.contentData.traits : []),
        object: slide.object || slide.contentData?.object || {},
        correctTraits: Array.isArray(slide.correctTraits) ? slide.correctTraits : (Array.isArray(slide.contentData?.correctTraits) ? slide.contentData.correctTraits : []),
        isCustom: true
      };
    });
  }

  return LESSON_SLIDES;
}

let currentLottieInstances = [];

function clearLottieInstances() {
  currentLottieInstances.forEach(anim => {
    try { anim.destroy(); } catch (_) {}
  });
  currentLottieInstances = [];
}

function initLottieAnimationsInDom() {
  clearLottieInstances();
  const lottieEngine = window.lottie || (typeof lottie !== 'undefined' ? lottie : null);
  if (!lottieEngine) return;

  const boxes = document.querySelectorAll('#slide-content [data-lottie-path]');
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
        window.location.href = window.isTeacherPreview ? '/teacher/content/lesson_studio' : '/student/lessons';
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
        window.location.href = window.isTeacherPreview ? '/teacher/content/lesson_studio' : '/student/lessons';
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
    if (!slide) return;

    // Check if this is a custom, published, or preview deck
    const isCustomDeck = Boolean(
      (window.publishedLessonPayload && Array.isArray(window.publishedLessonPayload.slides) && window.publishedLessonPayload.slides.length) ||
      (window.currentLessonId && window.currentLessonId !== 1) ||
      slide.isCustom
    );

    const lessonTitle = window.publishedLessonPayload?.title || document.querySelector('.lesson-title-center h1')?.textContent?.replace(/Exit Preview/i, '')?.trim() || '';

    // Determine text to read: instruction/prompt for quick-check, or title & description/explanation for story slides
    let textToRead = '';
    if (slide.type === 'quick-check') {
      const q = slide.prompt || slide.question || '';
      textToRead = (slide.title && q && !q.toLowerCase().includes(slide.title.toLowerCase()))
        ? `${slide.title}. ${q}`
        : (q || slide.title || '');
    } else if (slide.type === 'summary') {
      const bulletText = (Array.isArray(slide.bullets) && slide.bullets.length > 0)
        ? slide.bullets.filter(Boolean).join('. ')
        : '';
      const summaryText = slide.explanation || slide.description || '';
      let sTitle = slide.title || '';
      if (isCustomDeck && (!sTitle || sTitle === 'Living vs Non-Living: Big Ideas' || sTitle === 'Great Job! Big Ideas')) {
        sTitle = lessonTitle ? `${lessonTitle}: Big Ideas` : 'Lesson Summary';
      }
      textToRead = `${sTitle}. Lesson Complete! ${summaryText} ${bulletText ? 'Key takeaways: ' + bulletText : ''}`.trim();
    } else {
      const desc = slide.description || slide.explanation || '';
      textToRead = (slide.title && desc && !desc.toLowerCase().includes(slide.title.toLowerCase()))
        ? `${slide.title}. ${desc}`
        : (desc || slide.title || '');
    }

    let voiceKey = '';
    // Only use pre-recorded Living studio audio files if this is the original default lesson #1!
    if (!isCustomDeck && LIVING_VOICE_KEYS[lessonState.currentIndex]) {
      voiceKey = LIVING_VOICE_KEYS[lessonState.currentIndex];
    } else if (slide.voiceKey) {
      voiceKey = slide.voiceKey;
    }

    if (voiceKey) {
      playVoicePrompt(voiceKey, textToRead);
    } else {
      // Dynamic Speech Synthesis for custom/newly built lessons
      stopVoicePrompt();
      speakText(textToRead);
    }
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

  const isCustomDeck = Boolean(
    (window.publishedLessonPayload && Array.isArray(window.publishedLessonPayload.slides) && window.publishedLessonPayload.slides.length) ||
    (window.currentLessonId && window.currentLessonId !== 1) ||
    slide.isCustom
  );
  const lessonTitle = window.publishedLessonPayload?.title || document.querySelector('.lesson-title-center h1')?.textContent?.replace(/Exit Preview/i, '')?.trim() || '';

  let displayTitle = slide.title || '';
  if (slide.type === 'summary' && isCustomDeck) {
    if (!displayTitle || displayTitle === 'Living vs Non-Living: Big Ideas' || displayTitle === 'Great Job! Big Ideas') {
      displayTitle = lessonTitle ? `${lessonTitle}: Big Ideas` : 'Lesson Summary: Big Ideas';
    }
  }

  document.querySelector('#lesson-title').textContent = displayTitle;
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

  initLottieAnimationsInDom();

  updateNavigationState();
  console.log('Slide rendered, slideContainer innerHTML length:', slideContainer.innerHTML.length);
}

function getQuickFeedbackMessage(slide, isCorrect) {
  if (isCorrect) {
    const lead = slide.successMessage || 'Correct!';
    return `${lead} ${slide.explanation || ''}`.trim();
  }

  const lead = slide.retryMessage || 'Try again.';
  const hint = slide.retryHint || (slide.isCustom ? 'Think carefully about the clues and try again.' : 'Think about what only living or non-living things can do on their own.');
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
  const images = (Array.isArray(slide.images) && slide.images.length > 0)
    ? slide.images
    : (slide.image ? [slide.image] : []);

  const caps = Array.isArray(slide.captions) ? slide.captions : [];
  const capHtml = (i) => caps[i] ? `<span class="lesson-img-caption">${String(caps[i]).replace(/</g, '&lt;')}</span>` : '';

  let mediaHtml = '';
  if (slide.animationSrc) {
    mediaHtml = `
      <div class="lesson-single-captioned">
        <div class="lesson-lottie-container" data-lottie-path="${slide.animationSrc}"></div>
        ${slide.animationLabel ? `<span class="lesson-img-caption">${String(slide.animationLabel).replace(/</g, '&lt;')}</span>` : capHtml(0)}
      </div>
    `;
  } else if (images.length === 1) {
    mediaHtml = `<div class="lesson-single-captioned"><img src="${images[0]}" alt="Lesson illustration" class="lesson-intro-image">${capHtml(0)}</div>`;
  } else if (images.length === 2) {
    mediaHtml = `
      <div class="lesson-compare-container">
        <div class="lesson-compare-card">
          <img src="${images[0]}" alt="Comparison item 1" class="lesson-compare-img">
          ${capHtml(0)}
        </div>
        <div class="lesson-compare-card">
          <img src="${images[1]}" alt="Comparison item 2" class="lesson-compare-img">
          ${capHtml(1)}
        </div>
      </div>
    `;
  } else if (images.length > 2) {
    mediaHtml = `
      <div class="lesson-gallery-grid count-${images.length}">
        ${images.map((src, i) => `
          <div class="lesson-gallery-card">
            <img src="${src}" alt="Gallery item ${i + 1}" class="lesson-gallery-img">
            ${capHtml(i)}
          </div>
        `).join('')}
      </div>
    `;
  }

  container.innerHTML = `
    <div class="lesson-intro">
      ${mediaHtml}
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

  let mediaHeader = '';
  if (slide.animationSrc) {
    mediaHeader = `<div class="lesson-lottie-container mb-2" data-lottie-path="${slide.animationSrc}" style="max-height: 140px;"></div>`;
  } else if (slide.image && typeof slide.image === 'string' && slide.image.trim() && !slide.image.endsWith('.json')) {
    mediaHeader = `<div class="text-center mb-2"><img src="${slide.image}" alt="Prompt visual" style="max-height: 120px; object-fit: contain; border-radius: 10px;"></div>`;
  }

  const promptMarkup = slide.prompt
    ? `<div class="quick-check-header-card">
         ${mediaHeader}
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

  const isCorrect = option.hasOwnProperty('isCorrect')
    ? Boolean(option.isCorrect)
    : (slide.hasOwnProperty('targetIsLiving')
      ? option.isLiving === slide.targetIsLiving
      : Boolean(option.isLiving));

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
      lesson_id: window.currentLessonId || 1,
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

function escapeHtml(str) {
  return String(str ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function renderSummarySlide(slide, container) {
  const isCustomDeck = Boolean(
    (window.publishedLessonPayload && Array.isArray(window.publishedLessonPayload.slides) && window.publishedLessonPayload.slides.length) ||
    (window.currentLessonId && window.currentLessonId !== 1) ||
    slide.isCustom
  );

  const lessonTitle = window.publishedLessonPayload?.title || document.querySelector('.lesson-title-center h1')?.textContent?.replace(/Exit Preview/i, '')?.trim() || 'this lesson';

  if (!isCustomDeck) {
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
    return;
  }

  // --- Dynamic Custom Summary Slide ---
  const heroImg = (Array.isArray(slide.images) && slide.images.length > 0)
    ? slide.images[0]
    : ((slide.image && typeof slide.image === 'string' && slide.image.trim()) ? slide.image : '');
  const summaryExplanation = slide.explanation || slide.description || '';

  // Extract bullet ideas if available, or if explanation has emoji/lines
  let customCards = [];
  if (Array.isArray(slide.bullets) && slide.bullets.length > 0) {
    customCards = slide.bullets.filter(b => b && b.trim()).map((b, i) => ({
      icon: '⭐',
      title: `Key Idea #${i + 1}`,
      text: b,
      bg: '#f8fafc',
      border: '#cbd5e1',
      color: '#1e293b'
    }));
  } else if (summaryExplanation.includes('\n')) {
    const rawLines = summaryExplanation.split(/\n+/).map(l => l.trim()).filter(Boolean);
    if (rawLines.length > 1) {
      const colors = [
        { bg: '#f0fdf4', border: '#86efac', color: '#16a34a', icon: '🌟' },
        { bg: '#eff6ff', border: '#bfdbfe', color: '#2563eb', icon: '💡' },
        { bg: '#faf5ff', border: '#d8b4fe', color: '#7c3aed', icon: '🚀' },
        { bg: '#fffbeb', border: '#fde68a', color: '#d97706', icon: '🏆' }
      ];
      customCards = rawLines.map((line, idx) => {
        const style = colors[idx % colors.length];
        return {
          icon: style.icon,
          title: `Takeaway #${idx + 1}`,
          text: line,
          bg: style.bg,
          border: style.border,
          color: style.color
        };
      });
    }
  }

  container.innerHTML = `
    <div class="summary-slide ln-summary-container">
      <div class="ln-summary-badge" style="background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%); border: 2px solid #6ee7b7; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.15);">
        <div class="ln-summary-badge-icon" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: #ffffff;">
          <i class="bi bi-award-fill"></i>
        </div>
        <div class="ln-summary-badge-text">
          <h3 style="color: #065f46; font-weight: 800; font-size: 1.35rem; margin-bottom: 2px;">Lesson Complete! 🎉</h3>
          <p style="color: #047857; font-weight: 600; margin-bottom: 0;">You've mastered the core concepts of <strong>${escapeHtml(lessonTitle)}</strong>!</p>
        </div>
      </div>

      ${customCards.length > 0 ? `
        ${heroImg ? `
          <div class="text-center my-3">
            <img src="${escapeHtml(heroImg)}" alt="Summary Hero" style="max-height: 140px; max-width: 220px; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08));">
          </div>
        ` : ''}
        <div class="ln-summary-grid">
          ${customCards.map(idea => `
            <div class="ln-summary-card" style="background:${idea.bg};border:2px solid ${idea.border};">
              <div class="ln-summary-card-header">
                <span class="ln-summary-emoji">${idea.icon}</span>
                <h4 style="color:${idea.color}; font-weight: 700;">${escapeHtml(idea.title)}</h4>
              </div>
              <p class="ln-summary-desc" style="color: #334155; font-size: 0.95rem; line-height: 1.5;">${escapeHtml(idea.text)}</p>
            </div>
          `).join('')}
        </div>
      ` : `
        <div class="p-4 bg-white rounded-4 border shadow-sm text-center my-3" style="border: 2px solid #e2e8f0;">
          ${heroImg ? `
            <div class="mb-3">
              <img src="${escapeHtml(heroImg)}" alt="Summary Hero" style="max-height: 180px; max-width: 260px; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.1));">
            </div>
          ` : ''}
          <div class="d-inline-flex align-items-center gap-2 mb-2 px-3 py-1 rounded-pill bg-light border">
            <span style="font-size: 1.2rem;">💡</span>
            <span class="fw-bold text-dark">${escapeHtml(slide.title || 'Key Takeaways')}</span>
          </div>
          <p class="fs-5 fw-medium text-dark mb-0 mx-auto" style="max-width: 650px; line-height: 1.6;">
            ${escapeHtml(summaryExplanation || 'Great job! You have explored and completed all activities in this lesson. Click Finish below to complete!')}
          </p>
        </div>
      `}
    </div>
  `;
}

function updateNavigationState() {
  const nextButton = document.querySelector('#next-slide');
  nextButton.disabled = !canAdvance();
}

let lastSavedTime = performance.now();

function saveLessonProgress(completed = false) {
  if (window.isTeacherPreview) {
    return Promise.resolve();
  }

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
