// clawMachineGame.js
// Main game logic for the Living vs Non-Living Claw Machine activity.

import { getClawGameObjects } from './gameObjects.js';

const state = {
  objects: [],
  activeColumn: 0,
  clawHolding: null,
  score: 0,
  correctFirstTry: 0,
  totalAttempts: 0,
  startTime: null,
  analytics: [],
  isSaving: false,
  isResolvingDrop: false,
};

const COLUMNS = 5;
const LIVING_BIN_POSITION = -1;
const NON_LIVING_BIN_POSITION = COLUMNS;
const CLAW_POSITIONS = [7, 22, 36, 50, 64, 78, 93];

function initGame() {
  state.objects = getClawGameObjects(12).map((object, index) => ({
    ...object,
    lane: index % COLUMNS,
  }));
  state.activeColumn = 0;
  state.clawHolding = null;
  state.score = 0;
  state.correctFirstTry = 0;
  state.totalAttempts = 0;
  state.analytics = [];
  state.startTime = Date.now();
  state.isSaving = false;
  state.isResolvingDrop = false;

  renderBoard();
  renderControls();
  renderStatus();
  loadAttemptAvailability();

  const summaryScreen = document.querySelector('#summary-screen');
  if (summaryScreen) {
    summaryScreen.classList.add('d-none');
    summaryScreen.classList.remove('visible');
  }

  const restartButton = document.querySelector('#restart-button');
  if (restartButton) {
    restartButton.onclick = initGame;
  }
}

function getTrayObjects() {
  return state.objects.filter(object => !object.isSorted);
}

function renderBoard() {
  const tray = document.querySelector('#claw-tray');
  tray.innerHTML = '';

  const columns = Array.from({ length: COLUMNS }, () => []);
  getTrayObjects().forEach(object => {
    columns[object.lane].push(object);
  });

  columns.forEach((objects, columnIndex) => {
    const columnEl = document.createElement('div');
    columnEl.className = `tray-column ${state.activeColumn === columnIndex ? 'active' : ''}`;
    columnEl.dataset.column = columnIndex;
    objects.forEach(object => {
      const item = document.createElement('div');
      item.className = 'tray-object';
      item.dataset.objectId = object.id;

      const card = document.createElement('div');
      card.className = 'object-card';

      if (object.icon) {
        const image = document.createElement('img');
        image.className = 'tray-object-icon';
        image.src = object.icon;
        image.alt = object.name;
        image.onerror = () => {
          image.style.display = 'none';
        };
        card.appendChild(image);
      }

      const label = document.createElement('div');
      label.className = 'tray-object-label';
      label.textContent = object.name;
      card.appendChild(label);

      item.appendChild(card);
      columnEl.appendChild(item);
    });
    tray.appendChild(columnEl);
  });

  document.querySelector('#living-bin').classList.toggle('target-active', state.activeColumn === LIVING_BIN_POSITION);
  document.querySelector('#non-living-bin').classList.toggle('target-active', state.activeColumn === NON_LIVING_BIN_POSITION);

  renderClaw();
}

function renderClaw() {
  const claw = document.querySelector('#claw-machine');
  claw.style.left = `${CLAW_POSITIONS[state.activeColumn + 1]}%`;

  const heldObjectMarkup = state.clawHolding
    ? `
      <div class="claw-held-object-tile">
        <div class="claw-held-object-card">
          ${state.clawHolding.icon ? `<img class="claw-held-object-icon" src="${state.clawHolding.icon}" alt="${state.clawHolding.name}" />` : ''}
          <div class="claw-held-object-label">${state.clawHolding.name}</div>
        </div>
      </div>
    `
    : '';

  claw.innerHTML = `
    <div class="claw-cable"></div>
    <div class="claw-head">
      <span class="claw-pincer left"></span>
      <span class="claw-pincer right"></span>
      ${heldObjectMarkup}
    </div>
  `;
}

function renderControls() {
  document.querySelector('#move-left').onclick = () => moveClaw(-1);
  document.querySelector('#move-right').onclick = () => moveClaw(1);
  document.querySelector('#grab-button').onclick = grabObject;
  document.querySelector('#drop-button').onclick = dropObject;
  setGameControlsDisabled(false);
}

function renderStatus() {
  document.querySelector('#score-value').textContent = state.score;
  document.querySelector('#attempt-value').textContent = state.totalAttempts;
  document.querySelector('#remaining-value').textContent = getTrayObjects().length;
  if (state.clawHolding) {
    document.querySelector('#holding-value').textContent = state.clawHolding.name;
  } else {
    document.querySelector('#holding-value').textContent = 'None';
  }
}

function moveClaw(delta) {
  if (state.isResolvingDrop) {
    return;
  }
  state.activeColumn = Math.min(Math.max(state.activeColumn + delta, LIVING_BIN_POSITION), NON_LIVING_BIN_POSITION);
  renderBoard();
}

function getObjectInColumn(column) {
  return getTrayObjects().find(object => object.lane === column);
}

function grabObject() {
  if (state.isResolvingDrop) {
    return;
  }
  if (state.clawHolding) {
    return showMessage('You are already holding an object.', 'warning');
  }

  const object = getObjectInColumn(state.activeColumn);
  if (!object) {
    return showMessage('No object in this lane.', 'danger');
  }

  state.clawHolding = object;
  renderBoard();
  renderStatus();
  animateClawGrab();
  showMessage(`Grabbed ${object.name}! Move to a bin, then press Drop.`, 'success');
}

function dropObject() {
  if (state.isResolvingDrop) {
    return;
  }
  if (!state.clawHolding) {
    return showMessage('Grab an object first.', 'warning');
  }

  const target = getBinTarget();
  if (!target) {
    return showMessage('Move the claw to the Living or Non-Living bin before dropping.', 'warning');
  }

  const object = state.clawHolding;
  object.attempts += 1;
  state.totalAttempts += 1;

  const isCorrect = object.isLiving === (target === 'living');
  const timeTaken = Date.now() - state.startTime;
  state.analytics.push({
    studentId: null,
    objectId: object.id,
    attemptNumber: object.attempts,
    wasCorrect: isCorrect,
    timeToSort: timeTaken,
  });

  state.isResolvingDrop = true;
  setGameControlsDisabled(true);
  animateClawDrop(object, target);

  if (isCorrect) {
    state.score += 1;
    state.correctFirstTry += 1;
    showMessage(`Correct! ${object.explanation}`, 'success');
  } else {
    const correctChute = object.isLiving ? 'Living' : 'Non-Living';
    showMessage(`Not quite. ${object.name} belongs in the ${correctChute} chute. ${object.explanation}`, 'warning');
  }

  setTimeout(() => {
    state.clawHolding = null;
    renderBoard();
    renderStatus();
  }, 800);

  setTimeout(() => {
    object.isSorted = true;
    state.isResolvingDrop = false;
    renderBoard();
    renderStatus();

    if (getTrayObjects().length === 0 && !state.isSaving) {
      state.isSaving = true;
      showSummary();
      saveActivityProgress();
      return;
    }

    setGameControlsDisabled(false);
  }, 1800);
}

function setGameControlsDisabled(disabled) {
  document.querySelectorAll('#move-left, #move-right, #grab-button, #drop-button')
    .forEach(control => {
      control.disabled = disabled;
    });
}

function getBinTarget() {
  if (state.activeColumn === LIVING_BIN_POSITION) {
    return 'living';
  }
  if (state.activeColumn === NON_LIVING_BIN_POSITION) {
    return 'non-living';
  }
  return null;
}

function showMessage(text, type) {
  const messageBox = document.querySelector('#game-message');
  messageBox.textContent = text;
  messageBox.className = `game-notification alert alert-${type}`;
}

function showSummary() {
  const totalTime = Math.round((Date.now() - state.startTime) / 1000);
  const totalObjects = state.objects.length;

  document.querySelector('#summary-correct').textContent = state.correctFirstTry;
  document.querySelector('#summary-attempts').textContent = state.totalAttempts;
  document.querySelector('#summary-time').textContent = `${totalTime}s`;
  document.querySelector('#summary-sorted').textContent = `${state.score} / ${totalObjects}`;
  document.querySelector('#summary-screen').classList.remove('d-none');
  document.querySelector('#summary-screen').classList.add('visible');
}

function saveActivityProgress() {
  const totalTime = Math.round((Date.now() - state.startTime) / 1000);
  const payload = {
    activity_id: window.clawMachineActivityId,
    score: state.score,
    attempts: state.totalAttempts,
    time_spent: totalTime,
    correct_first_try: state.correctFirstTry,
  };

  console.log('Saving claw machine attempt:', payload);

  fetch('/student/activity_progress', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'same-origin',
    body: JSON.stringify(payload)
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) {
      throw data;
    }
    return data;
  }).then(data => {
    console.log('Claw machine attempt saved:', data);
    window.location.href = '/student/activities';
  }).catch(error => {
    const message = error.error || 'Unable to save your activity progress.';
    showMessage(message, 'warning');
    document.querySelector('#restart-button').disabled = true;
  });
}

function loadAttemptAvailability() {
  fetch(`/student/activity_attempts/${window.clawMachineActivityId}`, {
    credentials: 'same-origin'
  }).then(async response => {
    const data = await response.json();
    if (!response.ok) {
      throw data;
    }
    return data;
  }).then(data => {
    document.querySelector('#attempts-today').textContent = `Attempts today: ${data.used}/${data.limit}`;
    if (data.remaining === 0) {
      document.querySelector('#grab-button').disabled = true;
      showMessage("You've reached today's attempt limit — try again tomorrow.", 'warning');
    }
  }).catch(error => {
    console.warn('Failed to load claw machine attempt availability:', error);
    document.querySelector('#attempts-today').textContent = 'Attempts today: unavailable';
  });
}

function animateClawGrab() {
  const claw = document.querySelector('#claw-machine');
  claw.classList.add('grabbed');
  setTimeout(() => claw.classList.remove('grabbed'), 400);
}

function animateClawDrop(object, target) {
  const claw = document.querySelector('#claw-machine');
  const bin = document.querySelector(target === 'living' ? '#living-bin' : '#non-living-bin');
  const droppedObject = document.createElement('div');
  droppedObject.className = 'dropped-object';

  droppedObject.innerHTML = `
    ${object.icon ? `<img src="${object.icon}" alt="${object.name}" />` : ''}
    <span>${object.name}</span>
  `;

  bin.appendChild(droppedObject);

  claw.classList.add('dropping');
  setTimeout(() => claw.classList.remove('dropping'), 800);
}

window.initClawMachineGame = initGame;
