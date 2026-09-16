// clawMachineGame.js
// Clean rebuild of the Living vs Non-Living claw machine.

import { getClawGameObjects } from './gameObjects.js';
import { playVoicePrompt } from './ttsHelper.js';

const LANE_COUNT = 4;
const DEFAULT_ATTEMPT_LIMIT = 3;

const state = {
  activityId: null,
  title: '',
  instructions: '',
  bins: [],
  objects: [],
  slots: [],
  leftBinCount: 0,
  activeSlotIndex: 0,
  heldObject: null,
  score: 0,
  streak: 0,
  totalAttempts: 0,
  correctFirstTry: 0,
  wrongDrops: 0,
  attemptsToday: 0,
  attemptLimit: DEFAULT_ATTEMPT_LIMIT,
  startTime: 0,
  completed: false,
  saving: false,
  isAnimating: false,
  motion: 'idle',
  cableDepth: 28,
};

const dom = {
  cabinet: null,
  title: null,
  subtitle: null,
  scoreValue: null,
  progressFill: null,
  progressNote: null,
  attemptValue: null,
  remainingValue: null,
  holdingValue: null,
  attemptsToday: null,
  message: null,
  leftBins: null,
  rightBins: null,
  tray: null,
  claw: null,
  moveLeft: null,
  moveRight: null,
  grabButton: null,
  dropButton: null,
  summary: null,
  summaryCorrect: null,
  summaryWrong: null,
  summaryAttempts: null,
  summaryScore: null,
  summaryTime: null,
  summarySubtitle: null,
  restartButton: null,
};

let resizeObserver = null;
let resizeTimer = null;
let controlsBound = false;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

let clawAudioCtx = null;
function playSound(type) {
  try {
    if (!clawAudioCtx) clawAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = clawAudioCtx.currentTime;
    const osc = clawAudioCtx.createOscillator();
    const gain = clawAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(clawAudioCtx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.18, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.start(now);
      osc.stop(now + 0.35);
    } else if (type === 'wrong') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.linearRampToValueAtTime(140, now + 0.22);
      gain.gain.setValueAtTime(0.16, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'grab') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(330, now);
      osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
      osc.start(now);
      osc.stop(now + 0.12);
    }
  } catch (_) {}
}

function wait(ms) {
  return new Promise(resolve => window.setTimeout(resolve, ms));
}

function getTrayObjectElement(object) {
  return document.querySelector(`.tray-object[data-object-id="${object.id}"]`);
}

function getBinElement(binId) {
  return document.querySelector(`.collection-bin[data-bin-id="${binId}"]`);
}

function getHeldObjectElement() {
  return document.querySelector('.claw-held-object-tile');
}

function getClawDepthForElement(element) {
  if (!dom.claw || !element) {
    return 100;
  }

  const clawRect = dom.claw.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const trayRect = dom.tray?.getBoundingClientRect();

  // Target the center of the item card
  const targetY = elementRect.top + (elementRect.height * 0.45);
  
  // Since the pincers grip at (cableDepth + 34px), subtract 34px from the total distance
  const depth = targetY - clawRect.top - 34;

  const maxDepth = trayRect
    ? Math.max(100, Math.round(trayRect.bottom - clawRect.top - 50))
    : 200;

  return clamp(Math.round(depth), 28, maxDepth);
}

function setClawMotion(motion, depth = state.cableDepth) {
  state.motion = motion;
  state.cableDepth = depth;
  renderClaw();
}

function getClawPickupPoint() {
  if (!dom.claw) {
    return null;
  }

  const clawRect = dom.claw.getBoundingClientRect();
  return {
    x: clawRect.left + (clawRect.width / 2),
    y: clawRect.top + state.cableDepth + 34,
  };
}

async function animateObjectPickup(object) {
  const sourceElement = getTrayObjectElement(object);
  const pickupPoint = getClawPickupPoint();
  if (!sourceElement || !pickupPoint) {
    return;
  }

  const sourceRect = sourceElement.getBoundingClientRect();
  const ghost = sourceElement.cloneNode(true);
  ghost.classList.add('pickup-object');
  ghost.style.left = `${sourceRect.left}px`;
  ghost.style.top = `${sourceRect.top}px`;
  ghost.style.width = `${sourceRect.width}px`;
  ghost.style.height = `${sourceRect.height}px`;
  ghost.style.margin = '0';
  ghost.style.opacity = '1';
  ghost.style.transform = 'translate(0, 0) scale(1)';

  sourceElement.style.opacity = '0';
  document.body.appendChild(ghost);

  const deltaX = pickupPoint.x - (sourceRect.left + sourceRect.width / 2);
  const deltaY = pickupPoint.y - (sourceRect.top + sourceRect.height / 2);
  const liftKeyframes = [
    { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
    { transform: `translate(${deltaX * 0.22}px, ${deltaY * 0.28 + 12}px) scale(0.98)`, opacity: 1, offset: 0.3 },
    { transform: `translate(${deltaX * 0.68}px, ${deltaY * 0.7 - 10}px) scale(0.9)`, opacity: 0.98, offset: 0.72 },
    { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.76)`, opacity: 0.08, offset: 1 },
  ];

  ghost.animate(liftKeyframes, {
    duration: 380,
    easing: 'cubic-bezier(0.2, 0.78, 0.26, 1)',
    fill: 'forwards',
  });

  await wait(380);
  sourceElement.style.opacity = '';
  ghost.remove();
}

async function animateObjectDrop(object, targetElement) {
  const sourceElement = getHeldObjectElement() || getTrayObjectElement(object);
  if (!sourceElement || !targetElement) {
    return;
  }

  const sourceRect = sourceElement.getBoundingClientRect();
  const targetRect = targetElement.getBoundingClientRect();
  const ghost = document.createElement('div');
  ghost.className = 'dropped-object';
  ghost.style.left = `${sourceRect.left}px`;
  ghost.style.top = `${sourceRect.top}px`;
  ghost.style.width = `${sourceRect.width}px`;
  ghost.style.height = `${sourceRect.height}px`;
  ghost.style.margin = '0';
  ghost.style.opacity = '1';
  ghost.style.transform = 'translate(0, 0) scale(1)';
  ghost.innerHTML = `
    <div class="object-card">
      ${object.icon ? `<img class="tray-object-icon" src="${object.icon}" alt="${object.name}" />` : ''}
      <div class="tray-object-label">${object.name}</div>
    </div>
  `;
  document.body.appendChild(ghost);

  const deltaX = (targetRect.left + targetRect.width / 2) - (sourceRect.left + sourceRect.width / 2);
  const deltaY = (targetRect.top + targetRect.height / 2) - (sourceRect.top + sourceRect.height / 2);
  const arcKeyframes = [
    { transform: 'translate(0, 0) scale(1)', opacity: 1, offset: 0 },
    { transform: `translate(${deltaX * 0.35}px, ${deltaY * 0.05 - 20}px) scale(0.98)`, opacity: 1, offset: 0.35 },
    { transform: `translate(${deltaX * 0.72}px, ${deltaY * 0.55 - 8}px) scale(0.9)`, opacity: 0.95, offset: 0.7 },
    { transform: `translate(${deltaX}px, ${deltaY}px) scale(0.74)`, opacity: 0.15, offset: 1 },
  ];

  ghost.animate(arcKeyframes, {
    duration: 560,
    easing: 'cubic-bezier(0.22, 0.8, 0.28, 1)',
    fill: 'forwards',
  });

  await wait(560);
  ghost.remove();
}

function cacheDom() {
  dom.cabinet = document.querySelector('.arcade-cabinet');
  dom.title = document.querySelector('.marquee-title h1');
  dom.subtitle = document.querySelector('.marquee-title p');
  dom.scoreValue = document.querySelector('#score-value');
  dom.progressFill = document.querySelector('.hud-progress-fill');
  dom.progressNote = document.querySelector('.hud-progress-note');
  dom.attemptValue = document.querySelector('#attempt-value');
  dom.remainingValue = document.querySelector('#remaining-value');
  dom.holdingValue = document.querySelector('#holding-value');
  dom.attemptsToday = document.querySelector('#attempts-today');
  dom.message = document.querySelector('#game-message');
  dom.leftBins = document.querySelector('#left-bins');
  dom.rightBins = document.querySelector('#right-bins');
  dom.tray = document.querySelector('#claw-tray');
  dom.claw = document.querySelector('#claw-machine');
  dom.moveLeft = document.querySelector('#move-left');
  dom.moveRight = document.querySelector('#move-right');
  dom.grabButton = document.querySelector('#grab-button');
  dom.dropButton = document.querySelector('#drop-button');
  dom.summary = document.querySelector('#summary-screen');
  dom.summaryCorrect = document.querySelector('#summary-correct');
  dom.summaryWrong = document.querySelector('#summary-wrong');
  dom.summaryAttempts = document.querySelector('#summary-attempts');
  dom.summaryScore = document.querySelector('#summary-sorted');
  dom.summaryTime = document.querySelector('#summary-time');
  dom.summarySubtitle = document.querySelector('#summary-subtitle');
  dom.restartButton = document.querySelector('#restart-button');
}

function setMessage(text, kind = 'primary') {
  if (!dom.message) return;

  dom.message.className = `game-notification alert-${kind}`;
  dom.message.textContent = text;
}

function buildSlots() {
  const leftBins = state.bins.slice(0, state.leftBinCount).map(bin => ({ type: 'bin', bin }));
  const lanes = Array.from({ length: LANE_COUNT }, (_, column) => ({ type: 'column', column }));
  const rightBins = state.bins.slice(state.leftBinCount).map(bin => ({ type: 'bin', bin }));
  state.slots = [...leftBins, ...lanes, ...rightBins];
}

function getActiveSlot() {
  return state.slots[state.activeSlotIndex] || null;
}

function getSlotIndexForColumn(column) {
  return state.leftBinCount + column;
}

function getSlotIndexForBin(binId) {
  const binIndex = state.bins.findIndex(bin => bin.id === binId);
  if (binIndex < 0) return state.leftBinCount;

  if (binIndex < state.leftBinCount) {
    return binIndex;
  }

  return state.leftBinCount + LANE_COUNT + (binIndex - state.leftBinCount);
}

function getBinLabel(categoryId) {
  const bin = state.bins.find(entry => entry.id === categoryId);
  return bin ? bin.label : 'the correct bin';
}

function setActiveSlotIndex(index) {
  state.activeSlotIndex = clamp(index, 0, Math.max(0, state.slots.length - 1));
}

function getSortedCount() {
  return state.objects.filter(object => object.isSorted).length;
}

function getRemainingCount() {
  return state.objects.filter(object => !object.isSorted).length;
}

function getLaneObjects(column) {
  return state.objects.filter(object => object.lane === column && !object.isSorted && !object.isHeld);
}

function formatTime(seconds) {
  if (seconds < 60) {
    return `${seconds}s`;
  }

  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return `${minutes}m ${remainder}s`;
}

function renderHeader() {
  if (dom.title) {
    dom.title.textContent = state.title || 'Sorting Claw Machine';
  }
  if (dom.subtitle) {
    dom.subtitle.textContent = state.instructions || 'Sort the objects into the correct bins.';
  }
}

function renderBins() {
  if (!dom.leftBins || !dom.rightBins) return;

  dom.leftBins.innerHTML = '';
  dom.rightBins.innerHTML = '';

  const activeSlot = getActiveSlot();

  state.bins.forEach((bin, index) => {
    const slotIndex = getSlotIndexForBin(bin.id);
    const binElement = document.createElement('aside');
    binElement.className = 'collection-bin';
    binElement.dataset.binId = bin.id;
    binElement.tabIndex = 0;
    binElement.setAttribute('role', 'button');
    binElement.setAttribute('aria-label', `${bin.label} bin`);
    binElement.style.setProperty('--bin-color', bin.color || '#4ade80');
    binElement.style.setProperty('--bin-border-color', bin.color || '#15803d');

    if (activeSlot && activeSlot.type === 'bin' && activeSlot.bin.id === bin.id) {
      binElement.classList.add('active');
    }

    binElement.innerHTML = `
      <span class="bin-icon">${bin.icon || '📦'}</span>
      <strong>${bin.label}</strong>
      <small>Drop into ${bin.label}</small>
      <div class="bin-catch" aria-hidden="true"></div>
    `;

    // Side bins are visual targets only; claw movement is strictly controlled via arrow buttons
    if (index < state.leftBinCount) {
      dom.leftBins.appendChild(binElement);
    } else {
      dom.rightBins.appendChild(binElement);
    }
  });
}

function renderTray() {
  if (!dom.tray) return;

  dom.tray.innerHTML = '';
  const activeSlot = getActiveSlot();

  const columns = Array.from({ length: LANE_COUNT }, () => []);
  state.objects.forEach(object => {
    if (!object.isSorted) {
      columns[object.lane].push(object);
    }
  });

  columns.forEach((objects, columnIndex) => {
    const columnElement = document.createElement('div');
    columnElement.className = 'tray-column';
    columnElement.dataset.column = String(columnIndex);

    if (activeSlot && activeSlot.type === 'column' && activeSlot.column === columnIndex) {
      columnElement.classList.add('active');
    }

    objects.forEach(object => {
      const objectButton = document.createElement('div');
      objectButton.className = 'tray-object';
      objectButton.dataset.objectId = String(object.id);

      if (object.isHeld) {
        objectButton.classList.add('is-held');
      }
      if (object.isSorted) {
        objectButton.classList.add('is-sorted');
      }

      objectButton.innerHTML = `
        <div class="object-card">
          ${object.icon ? `<img class="tray-object-icon" src="${object.icon}" alt="${object.name}" />` : ''}
          <div class="tray-object-label">${object.name}</div>
        </div>
      `;

      // Tray objects are picked up via the GRAB button when the claw is positioned above, avoiding accidental touch jumps
      columnElement.appendChild(objectButton);
    });

    dom.tray.appendChild(columnElement);
  });
}

function renderClaw() {
  if (!dom.claw) return;

  dom.claw.classList.toggle('grabbing', state.motion === 'grabbing');
  dom.claw.classList.toggle('dropping', state.motion === 'dropping');
  dom.claw.classList.toggle('lifting', state.motion === 'lifting');
  dom.claw.classList.toggle('holding', Boolean(state.heldObject) && state.motion === 'idle');
  dom.claw.style.setProperty('--grab-depth', `${state.cableDepth}px`);

  const activeSlot = getActiveSlot();
  const anchorElement = activeSlot?.type === 'bin'
    ? document.querySelector(`.collection-bin[data-bin-id="${activeSlot.bin.id}"]`)
    : activeSlot?.type === 'column'
      ? document.querySelector(`.tray-column[data-column="${activeSlot.column}"]`)
      : null;

  let leftPercent = 50;
  if (dom.cabinet && anchorElement) {
    const cabinetRect = dom.cabinet.getBoundingClientRect();
    const anchorRect = anchorElement.getBoundingClientRect();
    leftPercent = ((anchorRect.left + anchorRect.width / 2) - cabinetRect.left) / cabinetRect.width * 100;
    leftPercent = clamp(leftPercent, 4, 96);
  } else {
    const totalSlots = Math.max(1, state.slots.length);
    leftPercent = clamp(((state.activeSlotIndex + 1) / (totalSlots + 1)) * 100, 4, 96);
  }

  const heldMarkup = state.heldObject
    ? `
      <div class="claw-held-object-tile">
        <div class="claw-held-object-card">
          ${state.heldObject.icon ? `<img class="claw-held-object-icon" src="${state.heldObject.icon}" alt="${state.heldObject.name}" />` : ''}
          <div class="claw-held-object-label">${state.heldObject.name}</div>
        </div>
      </div>
    `
    : '';

  dom.claw.classList.toggle('holding', Boolean(state.heldObject));
  dom.claw.style.left = `${leftPercent}%`;
  dom.claw.innerHTML = `
    <div class="claw-cable"></div>
    <div class="claw-head">
      <span class="claw-pincer left"></span>
      <span class="claw-pincer right"></span>
      ${heldMarkup}
    </div>
  `;
}

function renderStatus() {
  if (dom.scoreValue) {
    dom.scoreValue.textContent = String(state.score);
  }
  if (dom.attemptValue) {
    dom.attemptValue.textContent = String(state.totalAttempts);
  }
  if (dom.remainingValue) {
    dom.remainingValue.textContent = String(getRemainingCount());
  }
  if (dom.holdingValue) {
    dom.holdingValue.textContent = state.heldObject ? state.heldObject.name : 'None';
  }
  if (dom.attemptsToday) {
    dom.attemptsToday.textContent = `Attempts today: ${state.attemptsToday}/${state.attemptLimit}`;
  }
  if (dom.progressFill) {
    const total = Math.max(1, state.objects.length);
    const percent = (getSortedCount() / total) * 100;
    dom.progressFill.style.width = `${percent}%`;
  }
  if (dom.progressNote) {
    dom.progressNote.textContent = `${getSortedCount()} sorted of ${state.objects.length} objects`;
  }
}

function renderSummary() {
  if (dom.summaryCorrect) {
    dom.summaryCorrect.textContent = `${state.correctFirstTry} / ${state.objects.length}`;
  }
  if (dom.summaryWrong) {
    dom.summaryWrong.textContent = String(state.wrongDrops);
  }
  if (dom.summaryAttempts) {
    dom.summaryAttempts.textContent = String(state.totalAttempts);
  }
  if (dom.summaryScore) {
    dom.summaryScore.textContent = `${state.score} / 100 pts`;
  }
  if (dom.summaryTime) {
    const elapsed = Math.max(0, Math.round((Date.now() - state.startTime) / 1000));
    dom.summaryTime.textContent = formatTime(elapsed);
  }
}

function renderBoard() {
  renderBins();
  renderTray();
  renderClaw();
}

function setControlsDisabled(disabled) {
  [dom.moveLeft, dom.moveRight, dom.grabButton, dom.dropButton].forEach(button => {
    if (button) {
      button.disabled = disabled;
    }
  });
}

function moveClaw(delta) {
  if (state.completed || state.isAnimating) return;
  const nextIndex = clamp(state.activeSlotIndex + delta, 0, Math.max(0, state.slots.length - 1));
  if (nextIndex !== state.activeSlotIndex) {
    state.activeSlotIndex = nextIndex;
    renderBoard();
    renderStatus();
  }
}

async function grabObject() {
  if (state.completed || state.isAnimating) return;
  if (state.heldObject) {
    setMessage('You are already holding an object.', 'warning');
    return;
  }

  const slot = getActiveSlot();
  if (!slot || slot.type !== 'column') {
    setMessage('Move the claw over a tray column to grab an object.', 'info');
    return;
  }

  const laneObjects = getLaneObjects(slot.column);
  const targetObject = laneObjects[0];
  if (!targetObject) {
    setMessage('That tray column is empty.', 'warning');
    return;
  }

  state.isAnimating = true;
  setControlsDisabled(true);

  const targetElement = getTrayObjectElement(targetObject);
  const grabDepth = getClawDepthForElement(targetElement);

  setClawMotion('grabbing', grabDepth);
  setMessage(`Grabbing ${targetObject.name}...`, 'primary');
  await wait(650);

  await animateObjectPickup(targetObject);

  playSound('grab');
  targetObject.isHeld = true;
  state.heldObject = targetObject;
  renderBoard();
  renderStatus();

  setClawMotion('lifting', 28);
  await wait(650);

  setClawMotion('idle', 28);
  state.isAnimating = false;
  setControlsDisabled(false);
  setMessage(`Holding ${targetObject.name}. Move to the matching bin and drop it.`, 'primary');
}

async function dropObject() {
  if (state.completed || state.isAnimating) return;
  if (!state.heldObject) {
    setMessage('Grab an object first.', 'info');
    return;
  }

  const slot = getActiveSlot();
  if (!slot || slot.type !== 'bin') {
    setMessage('Move to a bin before dropping.', 'warning');
    return;
  }

  state.isAnimating = true;
  setControlsDisabled(true);

  const object = state.heldObject;
  const sourceElement = getTrayObjectElement(object);
  const targetElement = getBinElement(slot.bin.id);
  const dropDepth = getClawDepthForElement(targetElement, 22);

  object.attempts = (object.attempts || 0) + 1;
  state.totalAttempts += 1;

  setClawMotion('dropping', dropDepth);
  setMessage(`Dropping ${object.name}...`, 'primary');
  await wait(650);

  await animateObjectDrop(object, targetElement || sourceElement);

  const isCorrect = slot.bin.id === object.categoryId;
  
  // Track object drop attempt for analytics (manuscript §1.2 most-missed objects)
  state.objectLogs.push({
    object_id: object.name || object.label || String(object.id),
    was_correct: isCorrect,
    attempt_number: 1
  });

  // Always mark sorted so this object is finished for the round (no immediate retry)
  object.isSorted = true;

  if (isCorrect) {
    playSound('correct');
    playVoicePrompt('claw_correct', 'Correct! Good job!');
    object.wasCorrect = true;
    state.streak = (state.streak || 0) + 1;
    state.correctFirstTry += 1;

    // 8 pts per object + streak bonus (+2 pts at streak 4, +2 pts at streak 8) -> 12 * 8 = 96 + 4 = 100 max
    let earned = 8;
    let bonusText = '';
    if (state.streak === 4 || state.streak === 8) {
      earned += 2;
      bonusText = ` (+2 Streak Bonus!)`;
    }
    state.score = Math.min(100, state.score + earned);
    setMessage(`✓ Correct! ${object.name} is a ${slot.bin.label}. (+${earned} pts${bonusText})`, 'success');
  } else {
    playSound('wrong');
    playVoicePrompt('claw_wrong', 'Oops! Try again!');
    object.wasCorrect = false;
    state.wrongDrops += 1;
    state.streak = 0;
    // -4 pts penalty for wrong bin
    state.score = Math.max(0, state.score - 4);
    setMessage(`✗ Incorrect! ${object.name} is a ${getBinLabel(object.categoryId)}, not a ${slot.bin.label}. (-4 pts)`, 'warning');
  }

  object.isHeld = false;
  state.heldObject = null;
  renderBoard();
  renderStatus();

  setClawMotion('lifting', 42);
  await wait(650);

  setClawMotion('idle', 42);
  state.isAnimating = false;
  setControlsDisabled(false);
  renderBoard();
  renderStatus();
  maybeCompleteRound();
}

function maybeCompleteRound() {
  if (state.completed || getRemainingCount() > 0) {
    return;
  }

  state.completed = true;
  state.isAnimating = false;
  setControlsDisabled(true);

  // Safety floor: guarantee at least 20 pts if at least one object was sorted correctly
  if (state.correctFirstTry > 0) {
    state.score = Math.max(20, state.score);
  }
  state.score = Math.min(100, state.score);

  renderSummary();
  if (dom.summary) {
    dom.summary.classList.remove('d-none');
    dom.summary.classList.add('visible');
  }
  playVoicePrompt('level_complete', 'Level complete! Great job!');
  saveProgress();
}

async function saveProgress() {
  if (state.saving) return;
  state.saving = true;

  const elapsedSeconds = Math.max(0, Math.round((Date.now() - state.startTime) / 1000));
  const payload = {
    activity_id: state.activityId,
    score: state.score,
    attempts: state.totalAttempts,
    time_spent: elapsedSeconds,
    correct_first_try: state.correctFirstTry,
    object_logs: state.objectLogs,
  };

  try {
    const response = await fetch('/student/activity_progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'same-origin',
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to save progress');
    }

    const data = await response.json();
    const { rating, hint } = data;

    state.attemptsToday = Number(data.attempts_today) || (state.attemptsToday + 1);
    if (data.attempts_limit) state.attemptLimit = Number(data.attempts_limit);
    renderStatus();

    // Check if daily attempts limit reached (3/3)
    if (state.attemptsToday >= state.attemptLimit) {
      if (dom.restartButton) {
        dom.restartButton.disabled = true;
        dom.restartButton.classList.add('disabled', 'btn-secondary');
        dom.restartButton.classList.remove('btn-primary');
        dom.restartButton.innerHTML = '<i class="bi bi-lock-fill me-1"></i>Attempts Limit Reached (3/3)';
      }
      if (dom.summarySubtitle) {
        dom.summarySubtitle.textContent = "You've used all 3 attempts for today. Great job! Check back tomorrow or explore other activities.";
      }
    } else {
      if (dom.restartButton) {
        dom.restartButton.disabled = false;
        dom.restartButton.classList.remove('disabled', 'btn-secondary');
        dom.restartButton.classList.add('btn-primary');
        dom.restartButton.innerHTML = `<i class="bi bi-arrow-repeat me-1"></i>Play Again (${state.attemptLimit - state.attemptsToday} left)`;
      }
    }

    // Display manuscript §1.2 rating on summary screen
    const ratingBlock = document.getElementById('summary-rating-block');
    const ratingEl    = document.getElementById('summary-rating');
    const hintEl      = document.getElementById('summary-hint');
    if (ratingBlock && ratingEl && hintEl && rating) {
      ratingEl.textContent = rating;
      // Map tier to Bootstrap colour class
      const colourMap = {
        'Excellent':         'bg-success',
        'Very Good':         'bg-primary',
        'Good':              'bg-warning text-dark',
        'Needs Improvement': 'bg-danger',
      };
      ratingEl.className = `summary-rating-badge badge fs-5 ${colourMap[rating] || 'bg-secondary'}`;
      hintEl.textContent = hint || '';
      ratingBlock.classList.remove('d-none');
    }

    setMessage(`Round complete! Rating: ${rating || ''} — ${state.score} points saved.`, 'success');
  } catch (error) {
    console.error('Unable to save claw machine progress:', error);
    setMessage('Round complete, but saving failed. You can still replay.', 'warning');
  } finally {
    state.saving = false;
  }
}


function bindControls() {
  if (controlsBound) return;

  if (dom.moveLeft) {
    dom.moveLeft.onclick = () => moveClaw(-1);
  }
  if (dom.moveRight) {
    dom.moveRight.onclick = () => moveClaw(1);
  }
  if (dom.grabButton) {
    dom.grabButton.onclick = grabObject;
  }
  if (dom.dropButton) {
    dom.dropButton.onclick = dropObject;
  }
  if (dom.restartButton) {
    dom.restartButton.onclick = () => initGame();
  }

  document.addEventListener('keydown', event => {
    if (event.defaultPrevented) return;
    const tag = (event.target && event.target.tagName || '').toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      moveClaw(-1);
    } else if (event.key === 'ArrowRight') {
      event.preventDefault();
      moveClaw(1);
    } else if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      if (state.heldObject) {
        dropObject();
      } else {
        grabObject();
      }
    }
  });

  controlsBound = true;
}

function bindResizeHandlers() {
  if (resizeObserver || !dom.cabinet) return;

  resizeObserver = new ResizeObserver(() => {
    if (resizeTimer) {
      window.clearTimeout(resizeTimer);
    }
    resizeTimer = window.setTimeout(() => {
      renderClaw();
    }, 80);
  });

  resizeObserver.observe(dom.cabinet);
  const stage = document.querySelector('.arcade-stage');
  if (stage) {
    resizeObserver.observe(stage);
  }

  window.addEventListener('resize', renderClaw, { passive: true });
  window.addEventListener('orientationchange', renderClaw, { passive: true });
}

async function loadAttemptStatus() {
  try {
    const response = await fetch(`/student/activity_attempts/${state.activityId}`, { cache: 'no-store', credentials: 'same-origin' });
    if (!response.ok) return;
    const payload = await response.json();
    state.attemptsToday = Number(payload.used) || 0;
    state.attemptLimit = Number(payload.limit) || DEFAULT_ATTEMPT_LIMIT;
    renderStatus();
    
    if (state.attemptsToday >= state.attemptLimit) {
      setControlsDisabled(true);
      setMessage("You've completed all 3 attempts for today. Come back tomorrow!", 'warning');
      if (dom.restartButton) {
        dom.restartButton.disabled = true;
        dom.restartButton.classList.add('disabled', 'btn-secondary');
        dom.restartButton.classList.remove('btn-primary');
        dom.restartButton.innerHTML = '<i class="bi bi-lock-fill me-1"></i>Attempts Limit Reached (3/3)';
      }
    }
  } catch (error) {
    console.error('Unable to load attempt status:', error);
  }
}

async function initGame() {
  cacheDom();
  bindControls();
  bindResizeHandlers();
  bindTTS();

  if (dom.summary) {
    dom.summary.classList.add('d-none');
    dom.summary.classList.remove('visible');
  }
  setControlsDisabled(false);

  state.activityId = window.clawMachineActivityId;
  state.title = '';
  state.instructions = '';
  state.bins = [];
  state.objects = [];
  state.slots = [];
  state.leftBinCount = 0;
  state.activeSlotIndex = 0;
  state.heldObject = null;
  state.score = 0;
  state.totalAttempts = 0;
  state.correctFirstTry = 0;
  state.wrongDrops = 0;
  state.startTime = Date.now();
  state.completed = false;
  state.saving = false;
  state.objectLogs = [];

  setMessage('Loading sorting round...', 'info');

  try {
    const [config, attempts] = await Promise.all([
      getClawGameObjects(state.activityId),
      fetch(`/student/activity_attempts/${state.activityId}`, { cache: 'no-store', credentials: 'same-origin' }).then(async response => {
        if (!response.ok) {
          return null;
        }
        return response.json();
      }),
    ]);

    state.title = config.title || 'Sorting Claw Machine';
    state.instructions = config.instructions || 'Sort the objects into the correct bins.';
    state.bins = config.bins || [];
    state.objects = (config.objects || []).map((object, index) => ({
      ...object,
      id: object.id ?? index + 1,
      name: object.name || object.label || `Object ${index + 1}`,
      lane: index % LANE_COUNT,
      attempts: 0,
      isSorted: false,
      isHeld: false,
    }));
    state.leftBinCount = Math.ceil(state.bins.length / 2);
    buildSlots();
    state.activeSlotIndex = Math.min(state.leftBinCount, Math.max(0, state.slots.length - 1));

    if (attempts) {
      state.attemptsToday = Number(attempts.used) || 0;
      state.attemptLimit = Number(attempts.limit) || DEFAULT_ATTEMPT_LIMIT;
    }

    renderHeader();
    renderBoard();
    renderStatus();

    if (state.attemptsToday >= state.attemptLimit) {
      setControlsDisabled(true);
      setMessage("You've completed all 3 attempts for today. Come back tomorrow!", 'warning');
      if (dom.restartButton) {
        dom.restartButton.disabled = true;
        dom.restartButton.classList.add('disabled', 'btn-secondary');
        dom.restartButton.classList.remove('btn-primary');
        dom.restartButton.innerHTML = '<i class="bi bi-lock-fill me-1"></i>Attempts Limit Reached (3/3)';
      }
    } else {
      setMessage('Move the claw, grab an object, then drop it into the matching bin.', 'primary');
      playVoicePrompt('claw_intro', 'Move the claw, grab an item, and drop it into a chute!');
    }
  } catch (error) {
    console.error('Failed to initialize claw machine:', error);
    setMessage('Unable to load the sorting game right now. Please refresh and try again.', 'danger');
  }
}

function setupGlobals() {
  window.initClawMachineGame = initGame;
}

setupGlobals();
