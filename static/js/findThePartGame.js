// findThePartGame.js
// "Find the Part" — Hotspot tap-to-label game for Animal Body Parts (Lesson 2A)
// Game 2A: Grade 3 Science, Week 3-4

import { speakText } from './ttsHelper.js';

// ── Audio helpers ─────────────────────────────────────────────────────────────

function playTone(freq, dur = 0.18) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

// ── GAME DATA ────────────────────────────────────────────────────────────────
// Each round: one animal with 3-4 labeled body-zone regions + a word bank.
// Zones are expressed as % (left, top) offsets on the placeholder illustration.
// Placeholder: a structured colored rectangle split into named regions.
//
// When real illustrations are available, swap the `illustrationSrc` image
// and adjust x/y hotspot coordinates — the label/snap logic stays identical.

const ROUNDS = [
  {
    id: 'bird',
    title: 'Round 1 — Label the Bird',
    subtitle: 'Tap a label from the word bank, then tap the matching body zone on the bird.',
    illustrationLabel: 'BIRD (placeholder)',
    illustrationBg: '#bfdbfe',  // light blue sky background
    // Zones: positioned as fractions of the illustration box
    zones: [
      { id: 'beak',   label: 'Beak',   x: 82, y: 38, w: 16, h: 14, color: '#fde047', borderColor: '#ca8a04', icon: 'bi-arrow-right' },
      { id: 'wings',  label: 'Wings',  x: 22, y: 30, w: 30, h: 30, color: '#dbeafe', borderColor: '#3b82f6', icon: 'bi-feather'     },
      { id: 'legs',   label: 'Legs',   x: 44, y: 72, w: 16, h: 20, color: '#dcfce7', borderColor: '#16a34a', icon: 'bi-arrows-move' },
      { id: 'claws',  label: 'Claws',  x: 44, y: 88, w: 16, h: 10, color: '#fce7f3', borderColor: '#db2777', icon: 'bi-lightning-fill' },
    ],
    // Word bank = correct labels + 1-2 decoys
    wordBank: [
      { id: 'beak',  label: 'Beak',  isDecoy: false },
      { id: 'wings', label: 'Wings', isDecoy: false },
      { id: 'legs',  label: 'Legs',  isDecoy: false },
      { id: 'claws', label: 'Claws', isDecoy: false },
      { id: 'fin',   label: 'Fin',   isDecoy: true  },  // fish decoy
      { id: 'tail',  label: 'Tail',  isDecoy: true  },  // generic decoy
    ],
    facts: {
      beak:  'Beaks help birds pick up seeds, berries, and prey for food.',
      wings: 'Wings let the bird fly to reach food in trees and escape danger.',
      legs:  'Legs help the bird perch, hop along the ground, and land safely.',
      claws: 'Claws grip branches tightly so the bird does not fall while resting.',
    },
  },
  {
    id: 'lion',
    title: 'Round 2 — Label the Lion',
    subtitle: 'Tap a label, then tap the correct body region on the lion.',
    illustrationLabel: 'LION (placeholder)',
    illustrationBg: '#fef9c3',  // savanna yellow background
    zones: [
      { id: 'eyes',  label: 'Eyes',  x: 60, y: 12, w: 28, h: 16, color: '#fde68a', borderColor: '#b45309', icon: 'bi-eye-fill'      },
      { id: 'mouth', label: 'Mouth', x: 62, y: 28, w: 26, h: 14, color: '#fee2e2', borderColor: '#dc2626', icon: 'bi-emoji-frown'   },
      { id: 'paws',  label: 'Paws',  x: 28, y: 70, w: 44, h: 20, color: '#fce7f3', borderColor: '#db2777', icon: 'bi-lightning-fill' },
      { id: 'legs',  label: 'Legs',  x: 28, y: 50, w: 44, h: 22, color: '#dcfce7', borderColor: '#16a34a', icon: 'bi-arrows-move'  },
    ],
    wordBank: [
      { id: 'eyes',   label: 'Eyes',   isDecoy: false },
      { id: 'mouth',  label: 'Mouth',  isDecoy: false },
      { id: 'paws',   label: 'Paws',   isDecoy: false },
      { id: 'legs',   label: 'Legs',   isDecoy: false },
      { id: 'wings',  label: 'Wings',  isDecoy: true  },  // bird decoy
      { id: 'beak',   label: 'Beak',   isDecoy: true  },  // bird decoy
    ],
    facts: {
      eyes:  'Lions have forward-facing eyes to judge distances when stalking prey.',
      mouth: 'A lion\'s powerful jaws and sharp teeth help it grip and eat large prey.',
      paws:  'Wide, padded paws let lions walk silently and swipe at prey.',
      legs:  'Strong hind legs give the lion explosive speed to chase down prey.',
    },
  },
  {
    id: 'fish',
    title: 'Round 3 — Label the Fish',
    subtitle: 'Tap a label, then tap the correct body region on the fish.',
    illustrationLabel: 'FISH (placeholder)',
    illustrationBg: '#e0f2fe',  // water blue background
    zones: [
      { id: 'eye',         label: 'Eye',          x: 72, y: 28, w: 14, h: 14, color: '#fde68a', borderColor: '#b45309', icon: 'bi-eye-fill'      },
      { id: 'mouth',       label: 'Mouth',         x: 84, y: 42, w: 12, h: 12, color: '#fee2e2', borderColor: '#dc2626', icon: 'bi-emoji-frown'   },
      { id: 'dorsal_fin',  label: 'Dorsal Fin',   x: 35, y: 6,  w: 22, h: 24, color: '#dbeafe', borderColor: '#3b82f6', icon: 'bi-triangle'      },
      { id: 'tail_fin',    label: 'Tail Fin',      x: 6,  y: 28, w: 22, h: 34, color: '#e9d5ff', borderColor: '#7c3aed', icon: 'bi-chevron-left'  },
    ],
    wordBank: [
      { id: 'eye',        label: 'Eye',         isDecoy: false },
      { id: 'mouth',      label: 'Mouth',       isDecoy: false },
      { id: 'dorsal_fin', label: 'Dorsal Fin',  isDecoy: false },
      { id: 'tail_fin',   label: 'Tail Fin',    isDecoy: false },
      { id: 'wings',      label: 'Wings',       isDecoy: true  },  // bird decoy
      { id: 'claws',      label: 'Claws',       isDecoy: true  },  // lion decoy
    ],
    facts: {
      eye:        'Fish eyes help them spot food and predators in the water.',
      mouth:      'The mouth opens wide to catch small fish and other food in the water.',
      dorsal_fin: 'The dorsal fin on the back keeps the fish stable while swimming.',
      tail_fin:   'The tail fin pushes the fish forward through the water like a paddle.',
    },
  },
];

// ── STATE ─────────────────────────────────────────────────────────────────────

const state = {
  activityId: null,
  currentRound: 0,
  score: 0,
  correctFirstTry: 0,
  startTime: 0,
  completed: false,

  // per-round
  selectedLabel: null,    // id from word bank currently tapped
  matched: new Set(),     // zone ids that have been successfully labeled
  attempts: {},           // { zoneId: attemptCount }
  objectLogs: [],         // for analytics
};

// ── UTILITIES ─────────────────────────────────────────────────────────────────

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function updateHUD() {
  const el = document.getElementById('ftp-score');
  if (el) el.textContent = state.score;
}

// ── SAVE RESULT ───────────────────────────────────────────────────────────────

function saveResult() {
  if (state.completed) return;
  state.completed = true;

  const timeSpent = Math.max(1, Math.round((performance.now() - state.startTime) / 1000));
  const actId = window.findThePartActivityId || state.activityId;

  fetch('/student/activity_progress', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      activity_id: actId,
      score: state.score,
      time_spent: timeSpent,
      correct_first_try: state.correctFirstTry,
      object_logs: state.objectLogs,
    }),
  }).catch(() => {});

  showSummary();
}

// ── SUMMARY SCREEN ────────────────────────────────────────────────────────────

function showSummary() {
  const container = document.getElementById('ftp-container');
  if (!container) return;

  const total = ROUNDS.reduce((acc, r) => acc + r.zones.length, 0);
  const pct = Math.round((state.correctFirstTry / total) * 100);

  speakText(`Game complete! You scored ${state.score} points.`);

  container.innerHTML = `
    <div class="ftp-summary text-center">
      <div class="ftp-summary-icon">
        <i class="bi bi-trophy-fill"></i>
      </div>
      <h2 class="ftp-summary-title">Find the Part — Complete!</h2>
      <p class="ftp-summary-sub">You labelled all three animals' body parts.</p>
      <div class="ftp-stats-row">
        <div class="ftp-stat-box">
          <span class="ftp-stat-val">${state.score}</span>
          <span class="ftp-stat-lbl">Score</span>
        </div>
        <div class="ftp-stat-box">
          <span class="ftp-stat-val">${state.correctFirstTry}/${total}</span>
          <span class="ftp-stat-lbl">First Try</span>
        </div>
        <div class="ftp-stat-box">
          <span class="ftp-stat-val">${pct}%</span>
          <span class="ftp-stat-lbl">Accuracy</span>
        </div>
      </div>
      <div class="ftp-summary-btns">
        <a href="/student/activities" class="ftp-btn ftp-btn-secondary">
          <i class="bi bi-grid-fill me-1"></i>Back to Activities
        </a>
        <button id="ftp-restart" class="ftp-btn ftp-btn-primary">
          <i class="bi bi-arrow-clockwise me-1"></i>Play Again
        </button>
      </div>
    </div>`;

  document.getElementById('ftp-restart')?.addEventListener('click', () => initFindThePart());
}

// ── ROUND RENDERER ────────────────────────────────────────────────────────────

function renderRound(roundIdx) {
  if (roundIdx >= ROUNDS.length) {
    saveResult();
    return;
  }

  state.currentRound = roundIdx;
  state.selectedLabel = null;
  state.matched = new Set();
  state.attempts = {};

  const round = ROUNDS[roundIdx];
  const container = document.getElementById('ftp-container');
  if (!container) return;

  const shuffledBank = shuffle(round.wordBank);

  // ── Build zone overlays HTML ───────────────────────────────────────────────
  const zonesHtml = round.zones.map(z => `
    <div class="ftp-zone ftp-zone-unlabeled"
         data-zone-id="${z.id}"
         style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%;
                background:${z.color};border-color:${z.borderColor};"
         role="button" aria-label="Body zone: ${z.label}">
      <i class="bi ${z.icon} ftp-zone-icon"></i>
      <span class="ftp-zone-label-text"></span>
    </div>`).join('');

  // ── Build word bank chips HTML ─────────────────────────────────────────────
  const bankHtml = shuffledBank.map(w => `
    <button class="ftp-chip" data-label-id="${w.id}" data-is-decoy="${w.isDecoy}">
      ${w.label}
    </button>`).join('');

  container.innerHTML = `
    <div class="ftp-round">
      <!-- Round header -->
      <div class="ftp-round-header">
        <span class="ftp-round-badge">Round ${roundIdx + 1} / ${ROUNDS.length}</span>
        <h3 class="ftp-round-title">${round.title}</h3>
        <p class="ftp-round-sub">${round.subtitle}</p>
      </div>

      <!-- Instruction banner -->
      <div id="ftp-banner" class="ftp-banner ftp-banner-info">
        <i class="bi bi-hand-index-thumb-fill me-2"></i>
        Step 1: Tap a label from the word bank below.
      </div>

      <!-- Illustration with hotspot zones -->
      <div class="ftp-illustration-wrap">
        <div class="ftp-illustration"
             style="background:${round.illustrationBg};"
             aria-label="${round.illustrationLabel}">
          <div class="ftp-illus-placeholder-label">${round.illustrationLabel}</div>
          <!-- Zones overlaid -->
          ${zonesHtml}
        </div>
      </div>

      <!-- Fact panel -->
      <div id="ftp-fact" class="ftp-fact-panel" style="display:none;"></div>

      <!-- Word bank -->
      <div class="ftp-bank-header">
        <i class="bi bi-card-text me-1"></i>Word Bank
      </div>
      <div id="ftp-word-bank" class="ftp-word-bank">
        ${bankHtml}
      </div>
    </div>`;

  bindRoundEvents(round);
  updateHUD();
}

// ── EVENT BINDING ─────────────────────────────────────────────────────────────

function bindRoundEvents(round) {
  const banner = document.getElementById('ftp-banner');
  const factPanel = document.getElementById('ftp-fact');

  // Word bank chips
  document.querySelectorAll('.ftp-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      // Deselect previous
      document.querySelectorAll('.ftp-chip').forEach(c => c.classList.remove('ftp-chip-selected'));

      // If already used/matched, ignore
      if (chip.classList.contains('ftp-chip-used') || chip.classList.contains('ftp-chip-wrong')) return;

      chip.classList.add('ftp-chip-selected');
      state.selectedLabel = chip.dataset.labelId;
      playTone(480, 0.08);

      if (banner) {
        banner.className = 'ftp-banner ftp-banner-primary';
        banner.innerHTML = `<i class="bi bi-hand-index-thumb-fill me-2"></i>
          Label selected: <strong>${chip.textContent.trim()}</strong>. Now tap the matching zone on the animal!`;
      }
      speakText(`Label selected: ${chip.textContent.trim()}. Now tap its matching zone.`);
    });
  });

  // Zone hotspots
  document.querySelectorAll('.ftp-zone').forEach(zoneEl => {
    zoneEl.addEventListener('click', () => {
      const zoneId = zoneEl.dataset.zoneId;

      // Already matched
      if (state.matched.has(zoneId)) {
        const fact = round.facts[zoneId];
        if (factPanel && fact) {
          factPanel.style.display = 'flex';
          factPanel.innerHTML = `<i class="bi bi-info-circle-fill me-2"></i>${fact}`;
        }
        return;
      }

      // No label selected yet
      if (!state.selectedLabel) {
        if (banner) {
          banner.className = 'ftp-banner ftp-banner-warn';
          banner.innerHTML = `<i class="bi bi-exclamation-triangle-fill me-2"></i>
            Please tap a label from the word bank first!`;
        }
        playTone(220, 0.1);
        return;
      }

      // Check correctness
      state.attempts[zoneId] = (state.attempts[zoneId] || 0) + 1;
      const isDecoy = document.querySelector(`.ftp-chip[data-label-id="${state.selectedLabel}"]`)
                               ?.dataset.isDecoy === 'true';
      const isMatch = state.selectedLabel === zoneId && !isDecoy;

      if (isMatch) {
        // Correct match
        const zone = round.zones.find(z => z.id === zoneId);
        const fact = round.facts[zoneId];
        const firstTry = state.attempts[zoneId] === 1;

        state.matched.add(zoneId);
        const pts = firstTry ? 20 : 10;
        state.score += pts;
        if (firstTry) state.correctFirstTry += 1;

        state.objectLogs.push({
          object_id: `${round.id}_${zoneId}`,
          was_correct: true,
          attempt_number: state.attempts[zoneId],
        });

        // Update zone appearance
        zoneEl.classList.remove('ftp-zone-unlabeled');
        zoneEl.classList.add('ftp-zone-labeled');
        zoneEl.querySelector('.ftp-zone-label-text').textContent = zone.label;

        // Mark chip used
        const chip = document.querySelector(`.ftp-chip[data-label-id="${state.selectedLabel}"]`);
        if (chip) { chip.classList.remove('ftp-chip-selected'); chip.classList.add('ftp-chip-used'); chip.disabled = true; }

        state.selectedLabel = null;

        // Show fact
        if (factPanel && fact) {
          factPanel.style.display = 'flex';
          factPanel.innerHTML = `<i class="bi bi-check-circle-fill me-2 text-success"></i>${fact}`;
        }

        if (banner) {
          banner.className = 'ftp-banner ftp-banner-success';
          banner.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>
            Correct! <strong>${zone.label}</strong> matched! ${firstTry ? '+20 pts' : '+10 pts'}`;
        }
        playTone(660, 0.22);
        speakText(`Correct! ${zone.label}. ${fact}`);
        updateHUD();

        // Check if all zones matched → next round
        if (state.matched.size === round.zones.length) {
          setTimeout(() => renderRound(state.currentRound + 1), 1500);
        }
      } else {
        // Wrong match
        state.objectLogs.push({
          object_id: `${round.id}_${zoneId}`,
          was_correct: false,
          attempt_number: state.attempts[zoneId],
        });

        if (banner) {
          banner.className = 'ftp-banner ftp-banner-danger';
          banner.innerHTML = `<i class="bi bi-x-circle-fill me-2"></i>
            Not quite! <strong>${document.querySelector(`.ftp-chip[data-label-id="${state.selectedLabel}"]`)?.textContent.trim()}</strong>
            does not go there. Try another zone or a different label.`;
        }
        playTone(220, 0.2);

        // Flash zone red briefly
        zoneEl.classList.add('ftp-zone-error');
        setTimeout(() => zoneEl.classList.remove('ftp-zone-error'), 600);
      }
    });
  });
}

// ── INIT ──────────────────────────────────────────────────────────────────────

export function initFindThePart() {
  state.score = 0;
  state.correctFirstTry = 0;
  state.currentRound = 0;
  state.completed = false;
  state.startTime = performance.now();
  state.objectLogs = [];

  document.getElementById('ftp-tts-btn')?.addEventListener('click', () => {
    const round = ROUNDS[state.currentRound];
    if (round) speakText(`${round.title}. ${round.subtitle}`);
  });

  renderRound(0);
  updateHUD();
}

window.initFindThePart = initFindThePart;
