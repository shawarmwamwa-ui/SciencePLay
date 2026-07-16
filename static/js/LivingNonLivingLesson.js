// LivingNonLivingLesson.js
// Main lesson logic for the Living vs Non-Living interactive slideshow.
// This file handles slide navigation, progress updates, and event logging.

import { LESSON_SLIDES } from './lessonSlidesData.js';

const lessonState = {
  currentIndex: 0,
  slideStartTime: null,
  log: [],
  hotspotProgress: {},
  quickCheckState: null,
  characteristicSelections: new Set(),
  touchStartX: null,
};

function initLesson() {
  lessonState.currentIndex = 0;
  lessonState.log = [];
  lessonState.hotspotProgress = {};
  lessonState.quickCheckState = null;
  lessonState.characteristicSelections = new Set();
  lessonState.slideStartTime = Date.now();
  lessonState.touchStartX = null;

  renderLesson();
  bindNavigation();
  bindSwipe();
}

function bindNavigation() {
  document.querySelector('#next-slide').addEventListener('click', () => {
    if (!canAdvance()) {
      return;
    }
    logCurrentSlide();
    const slide = LESSON_SLIDES[lessonState.currentIndex];
    if (slide.type === 'summary') {
      saveLessonProgress(true);
      window.location.href = '/student/claw_machine';
      return;
    }
    lessonState.currentIndex += 1;
    resetSlideState();
    renderLesson();
    saveLessonProgress();
  });

  document.querySelector('#prev-slide').addEventListener('click', () => {
    if (lessonState.currentIndex === 0) {
      return;
    }
    logCurrentSlide();
    lessonState.currentIndex -= 1;
    resetSlideState();
    renderLesson();
    saveLessonProgress();
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
    } else if (deltaX < -threshold && lessonState.currentIndex < LESSON_SLIDES.length - 1) {
      document.querySelector('#next-slide').click();
    }
    lessonState.touchStartX = null;
  });
}

function resetSlideState() {
  lessonState.slideStartTime = Date.now();
  lessonState.hotspotProgress = {};
  lessonState.quickCheckState = null;
  lessonState.characteristicSelections = new Set();
}

function renderLesson() {
  const slide = LESSON_SLIDES[lessonState.currentIndex];
  document.querySelector('#lesson-title').textContent = slide.title;
  document.querySelector('#lesson-progress').style.width = `${((lessonState.currentIndex + 1) / LESSON_SLIDES.length) * 100}%`;
  document.querySelector('#lesson-progress-text').textContent = `${lessonState.currentIndex + 1} / ${LESSON_SLIDES.length}`;
  document.querySelector('#prev-slide').disabled = lessonState.currentIndex === 0;
  document.querySelector('#next-slide').textContent = slide.type === 'summary' ? slide.nextLabel : 'Next';
  const explanationContainer = document.querySelector('#slide-explanation');
  const slideContainer = document.querySelector('#slide-content');
  explanationContainer.innerHTML = '';
  slideContainer.innerHTML = '';

  // Render explanation (outside the card) and interactive content inside the card.
  if (slide.description) {
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
}

function canAdvance() {
  const slide = LESSON_SLIDES[lessonState.currentIndex];
  if (slide.type === 'hotspots') {
    return Object.keys(lessonState.hotspotProgress).length === slide.hotspots.length;
  }
  if (slide.type === 'quick-check') {
    return lessonState.quickCheckState !== null;
  }
  if (slide.type === 'characteristics') {
    return lessonState.characteristicSelections.size > 0;
  }
  return true;
}

function renderIntroSlide(slide, container, explanationContainer) {
  // Show optional image inside the interactive card area, explanation shown outside.
  container.innerHTML = `
    <div class="lesson-intro">
      ${slide.image ? `<img src="${slide.image}" alt="Lesson intro" class="lesson-intro-image">` : ''}
    </div>
  `;
  if (slide.description && explanationContainer) {
    explanationContainer.innerHTML = `<div class="slide-explanation-text">${slide.description}</div>`;
  }
}

function renderHotspotSlide(slide, container, explanationContainer) {
  const hotspotHtml = slide.hotspots
    .map(hotspot => `
      <button class="hotspot" data-id="${hotspot.id}" style="left: ${hotspot.x}%; top: ${hotspot.y}%">
        ${hotspot.image ? `<img src="${hotspot.image}" alt="${hotspot.label}" class="hotspot-icon">` : ''}
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

  slide.hotspots.forEach(hotspot => {
    const button = container.querySelector(`.hotspot[data-id="${hotspot.id}"]`);
    button.addEventListener('click', () => handleHotspotTap(slide, hotspot, button));
  });
}

function handleHotspotTap(slide, hotspot, button) {
  const tapped = lessonState.hotspotProgress[hotspot.id];
  if (tapped) {
    return;
  }

  lessonState.hotspotProgress[hotspot.id] = true;
  button.classList.add('hotspot-tapped');
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
  const optionsHtml = slide.options
    .map(option => `
      <button class="quick-option" data-id="${option.id}">
        ${option.image ? `<img src="${option.image}" alt="${option.label}" class="quick-option-icon">` : ''}
        <span>${option.label}</span>
      </button>
    `)
    .join('');

  container.innerHTML = `
    <div class="quick-check-slide">
      <div class="quick-options">${optionsHtml}</div>
      <div id="quick-feedback" class="quick-feedback"></div>
    </div>
  `;

  slide.options.forEach(option => {
    const button = container.querySelector(`.quick-option[data-id="${option.id}"]`);
    button.addEventListener('click', () => handleQuickCheckTap(slide, option, button));
  });
}

function handleQuickCheckTap(slide, option, button) {
  if (lessonState.quickCheckState !== null) {
    return;
  }

  const isCorrect = slide.hasOwnProperty('targetIsLiving')
    ? option.isLiving === slide.targetIsLiving
    : option.isLiving;

  lessonState.quickCheckState = {
    selected: option.id,
    correct: isCorrect,
  };

  const feedback = document.querySelector('#quick-feedback');
  feedback.textContent = isCorrect ? `Correct! ${slide.explanation}` : `Try again! ${slide.explanation}`;
  feedback.classList.add(isCorrect ? 'feedback-correct' : 'feedback-incorrect');
  button.classList.add(isCorrect ? 'option-correct' : 'option-incorrect');
  updateNavigationState();

  if (isCorrect) {
    setTimeout(() => {
      if (lessonState.currentIndex < LESSON_SLIDES.length - 1) {
        document.querySelector('#next-slide').click();
      }
    }, 900);
  }
}

function renderCharacteristicsSlide(slide, container, explanationContainer) {
  const traitsHtml = slide.traits
    .map(trait => `
      <button class="trait-option" data-id="${trait.id}">${trait.label}</button>
    `)
    .join('');

  const objectImage = slide.object.image || '/static/images/fish.png';
  const objectDescription = slide.object.description || slide.object.explanation || '';

  container.innerHTML = `
    <div class="characteristics-slide">
      <div class="characteristics-object">
        <img src="${objectImage}" alt="${slide.object.label}" class="characteristics-object-image">
        <div class="object-label">${slide.object.label}</div>
        <p>${objectDescription}</p>
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
    button.addEventListener('click', () => handleTraitTap(slide, trait, button));
  });
}

function handleTraitTap(slide, trait, button) {
  const selected = lessonState.characteristicSelections;
  if (selected.has(trait.id)) {
    selected.delete(trait.id);
    button.classList.remove('trait-selected');
  } else {
    selected.add(trait.id);
    button.classList.add('trait-selected');
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
      feedback.textContent = `You selected ${selectedCount} trait(s), but ${wrongLabels} ${wrongTraits.length === 1 ? 'is' : 'are'} not traits of living things. Try choosing grows, breathes, moves, and needs food.`;
      feedback.classList.add('feedback-incorrect');
      feedback.classList.remove('feedback-correct');
    } else {
      feedback.textContent = `You checked ${selectedCount} traits — ${slide.conclusion}`;
      feedback.classList.add('feedback-correct');
      feedback.classList.remove('feedback-incorrect');
    }
  }
  updateNavigationState();
}

function renderSummarySlide(slide, container) {
  const bulletsHtml = slide.bullets.map(bullet => `<li>${bullet}</li>`).join('');
  container.innerHTML = `
    <div class="summary-slide">
      <ul>${bulletsHtml}</ul>
    </div>
  `;
}

function updateNavigationState() {
  const nextButton = document.querySelector('#next-slide');
  nextButton.disabled = !canAdvance();
}

function saveLessonProgress(completed = false) {
  const lessonId = window.currentLessonId || null;
  if (!lessonId) {
    return;
  }

  const payload = {
    lesson_id: lessonId,
    progress_percent: Math.round(((lessonState.currentIndex + 1) / LESSON_SLIDES.length) * 100),
    current_slide: lessonState.currentIndex,
    completed: completed,
  };

  fetch('/student/lesson_progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  }).then(response => {
    if (!response.ok) {
      return response.json().then(err => Promise.reject(err));
    }
    return response.json();
  }).then(data => {
    console.debug('Lesson progress saved:', data);
  }).catch(error => {
    console.warn('Failed to save lesson progress:', error);
  });
}

function logCurrentSlide() {
  const slide = LESSON_SLIDES[lessonState.currentIndex];
  const timeSpentOnSlide = Date.now() - lessonState.slideStartTime;

  const logEntry = {
    studentId: window.currentStudentId || null,
    slideId: slide.id,
    timeSpentOnSlide,
    hotspotsTapped: slide.type === 'hotspots' ? Object.keys(lessonState.hotspotProgress) : [],
    quickCheckAnswer: slide.type === 'quick-check' ? lessonState.quickCheckState : null,
    traitsSelected: slide.type === 'characteristics' ? Array.from(lessonState.characteristicSelections) : [],
  };

  lessonState.log.push(logEntry);
  console.debug('Lesson log entry:', logEntry);
}

window.initLivingNonLivingLesson = initLesson;
window.lessonState = lessonState;
