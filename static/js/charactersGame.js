// charactersGame.js
// "Safari Quest" — Upgraded interactive game for Characters of Living Things.

import { speakText } from './ttsHelper.js';

const state = {
  activityId: null,
  score: 0,
  combo: 1,
  currentRound: 0,
  correctCount: 0,
  startTime: 0,
  completed: false,
};

const ROUNDS = [
  {
    title: 'Round 1: Animal Movement 🐾',
    subtitle: 'Match each outer body part to how the animal moves!',
    pairs: [
      { id: 'r1-1', part: '🐰 Rabbit Legs', role: 'Hopping & Running', icon: '/static/images/bunny_head.svg' },
      { id: 'r1-2', part: '🦅 Eagle Wings', role: 'Flying in Sky', icon: '/static/images/bird.png' },
      { id: 'r1-3', part: '🐟 Fish Fins', role: 'Swimming in Water', icon: '/static/images/fish.png' },
    ]
  },
  {
    title: 'Round 2: Food Gathering 🌾',
    subtitle: 'Match outer body parts to how animals gather food!',
    pairs: [
      { id: 'r2-1', part: '🐤 Bird Beak', role: 'Picking up Seeds', icon: '/static/images/bird.png' },
      { id: 'r2-2', part: '🐱 Cat Claws', role: 'Catching Prey', icon: '/static/images/cat.png' },
      { id: 'r2-3', part: '🐰 Rabbit Teeth', role: 'Nibbling Leaves', icon: '/static/images/bunny_head.svg' },
    ]
  },
  {
    title: 'Round 3: Plant Water & Soil Nutrients 🌱',
    subtitle: 'Match plant parts to how plants get water and food from soil!',
    pairs: [
      { id: 'r3-1', part: '🌱 Plant Roots', role: 'Absorb Water from Soil', icon: '/static/images/plant.png' },
      { id: 'r3-2', part: '🌿 Plant Stem', role: 'Carry Water Upward', icon: '/static/images/tree.png' },
      { id: 'r3-3', part: '🍃 Plant Leaves', role: 'Soak up Sunlight', icon: '/static/images/flower.png' },
    ]
  }
];

function playSound(type) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    if (type === 'correct') {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'wrong') {
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(164.81, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    }
  } catch (e) {}
}

function updateHUD() {
  const scoreEl = document.querySelector('#quest-score');
  const comboEl = document.querySelector('#quest-combo');
  if (scoreEl) scoreEl.textContent = state.score;
  if (comboEl) comboEl.textContent = `${state.combo}x`;
}

function saveGameResult() {
  if (state.completed) return;
  state.completed = true;

  const timeSpent = Math.max(1, Math.round((performance.now() - state.startTime) / 1000));
  const activityId = window.safariQuestActivityId || 2;

  fetch('/student/activity_progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      activity_id: activityId,
      score: state.score,
      time_spent: timeSpent,
      correct_first_try: state.correctCount,
      object_logs: [
        { object_id: 'Animal Movement', was_correct: true, attempt_number: 1 },
        { object_id: 'Food Gathering', was_correct: true, attempt_number: 1 },
        { object_id: 'Plant Soil Nutrients', was_correct: true, attempt_number: 1 }
      ]
    })
  }).catch(() => {});

  showSummaryScreen();
}

function showSummaryScreen() {
  const container = document.querySelector('#quest-game-container');
  if (!container) return;

  speakText(`Congratulations! You completed Safari Quest with ${state.score} points!`);

  container.innerHTML = `
    <div class="text-center py-5">
      <div class="display-1 mb-3">🌟</div>
      <h2 class="fw-bold text-dark mb-2">Safari Quest Completed!</h2>
      <p class="lead text-secondary mb-4">Awesome job matching animal outer body parts and plant soil nutrients!</p>
      <div class="badge bg-primary fs-3 px-4 py-3 rounded-pill mb-4 shadow-sm">${state.score} Points • Combo ${state.combo}x</div>
      <div class="d-flex justify-content-center gap-3">
        <a href="/student/activities" class="btn btn-outline-secondary rounded-pill px-4">Back to Activities</a>
        <button id="quest-restart-btn" class="btn btn-success rounded-pill px-5 fw-bold shadow-sm">Play Again 🔄</button>
      </div>
    </div>
  `;
  container.querySelector('#quest-restart-btn')?.addEventListener('click', initSafariQuest);
}

function renderRound(roundIdx) {
  if (roundIdx >= ROUNDS.length) {
    saveGameResult();
    return;
  }

  state.currentRound = roundIdx;
  const round = ROUNDS[roundIdx];
  const container = document.querySelector('#quest-game-container');
  if (!container) return;

  let selectedPartId = null;
  let matchedInRound = 0;

  const shuffledRoles = [...round.pairs].sort(() => Math.random() - 0.5);

  let partsHtml = round.pairs.map(p => `
    <button class="quest-part-card btn btn-outline-primary w-100 p-3 rounded-4 fw-bold mb-3 d-flex align-items-center gap-3" data-id="${p.id}" data-part="${p.part}">
      <img src="${p.icon}" alt="${p.part}" style="height: 44px; width: 44px;" class="img-fluid">
      <span class="fs-5">${p.part}</span>
    </button>
  `).join('');

  let rolesHtml = shuffledRoles.map(p => `
    <button class="quest-role-card btn btn-outline-success w-100 p-3 rounded-4 fw-bold mb-3 d-flex align-items-center justify-content-center" data-id="${p.id}">
      <span class="fs-5">${p.role}</span>
    </button>
  `).join('');

  container.innerHTML = `
    <div class="quest-round-wrap max-w-800 mx-auto">
      <div class="text-center mb-3">
        <span class="badge bg-primary-subtle text-primary px-3 py-2 rounded-pill fs-6 mb-2">Round ${roundIdx + 1} of 3</span>
        <h3 class="fw-bold text-dark mb-1">${round.title}</h3>
        <p class="text-secondary mb-2">${round.subtitle}</p>
        <div id="quest-instruction-banner" class="alert alert-info py-2 px-3 fw-semibold small mb-3">
          👈 Step 1: Tap a body or plant part on the left!
        </div>
      </div>

      <div class="row g-4">
        <div class="col-md-6">
          <h6 class="text-uppercase text-muted fw-bold mb-3">1. Select Part</h6>
          ${partsHtml}
        </div>
        <div class="col-md-6">
          <h6 class="text-uppercase text-muted fw-bold mb-3">2. Select Role</h6>
          ${rolesHtml}
        </div>
      </div>
    </div>
  `;

  const banner = container.querySelector('#quest-instruction-banner');

  container.querySelectorAll('.quest-part-card').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;

      container.querySelectorAll('.quest-part-card').forEach(b => {
        if (!b.classList.contains('disabled')) {
          b.classList.remove('btn-primary', 'text-white', 'border-3');
          b.classList.add('btn-outline-primary');
        }
      });

      btn.classList.remove('btn-outline-primary');
      btn.classList.add('btn-primary', 'text-white', 'border-3');
      selectedPartId = btn.getAttribute('data-id');
      const partName = btn.getAttribute('data-part');

      if (banner) {
        banner.className = 'alert alert-primary py-2 px-3 fw-semibold small mb-3';
        banner.textContent = `Selected: "${partName}". Now tap its matching role on the right! 👉`;
      }
      speakText(partName);
    });
  });

  container.querySelectorAll('.quest-role-card').forEach(btn => {
    btn.addEventListener('click', () => {
      if (btn.classList.contains('disabled')) return;

      const roleId = btn.getAttribute('data-id');

      if (!selectedPartId) {
        if (banner) {
          banner.className = 'alert alert-warning py-2 px-3 fw-semibold small mb-3';
          banner.textContent = '⚠️ Please tap a body or plant part on the left first!';
        }
        speakText('Please select a body or plant part on the left first!');
        return;
      }

      if (selectedPartId === roleId) {
        playSound('correct');
        state.score += 20;
        state.combo += 1;
        state.correctCount += 1;
        matchedInRound += 1;
        updateHUD();

        btn.classList.remove('btn-outline-success');
        btn.classList.add('btn-success', 'text-white', 'disabled');

        const partCard = container.querySelector(`.quest-part-card[data-id="${selectedPartId}"]`);
        if (partCard) {
          partCard.classList.remove('btn-primary');
          partCard.classList.add('btn-success', 'text-white', 'disabled');
        }

        selectedPartId = null;

        if (banner) {
          banner.className = 'alert alert-success py-2 px-3 fw-semibold small mb-3';
          banner.textContent = '🎉 Awesome match! Select another part to continue.';
        }
        speakText('Awesome match!');

        if (matchedInRound >= round.pairs.length) {
          setTimeout(() => { renderRound(roundIdx + 1); }, 1200);
        }
      } else {
        playSound('wrong');
        btn.classList.add('border-danger', 'bg-danger-subtle');
        setTimeout(() => { btn.classList.remove('border-danger', 'bg-danger-subtle'); }, 600);

        if (banner) {
          banner.className = 'alert alert-danger py-2 px-3 fw-semibold small mb-3';
          banner.textContent = 'Not quite! Try matching with another role on the right.';
        }
        speakText('Not quite. Try another role!');
      }
    });
  });

  updateHUD();
}

export function initSafariQuest() {
  state.score = 0;
  state.combo = 1;
  state.currentRound = 0;
  state.correctCount = 0;
  state.startTime = performance.now();
  state.completed = false;

  document.querySelector('#quest-tts-btn')?.addEventListener('click', () => {
    const round = ROUNDS[state.currentRound];
    if (round) speakText(`${round.title}. ${round.subtitle}`);
  });

  renderRound(0);
}

window.initSafariQuest = initSafariQuest;
