// streakRaceGame.js
// "Streak Race" — Answer-to-Advance racing game for Plant Parts (Lesson 2B)
// Game 2B: Grade 3 Science, Week 3-4

import { speakText } from './ttsHelper.js';

// ── Audio ─────────────────────────────────────────────────────────────────────

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

// ── QUESTION BANK ─────────────────────────────────────────────────────────────
// 15 questions — each correct answer moves the character forward one segment.
// 5 speed boosts scattered in to reward streaks of consecutive correct answers.

const QUESTIONS = [
  {
    id: 'q1',
    question: 'Which plant part grows underground and absorbs water from the soil?',
    options: [
      { id: 'a', label: 'Roots',  correct: true  },
      { id: 'b', label: 'Leaves', correct: false },
      { id: 'c', label: 'Stem',   correct: false },
    ],
    part: 'roots',
    explanation: 'Roots grow deep into soil and absorb water and nutrients.',
  },
  {
    id: 'q2',
    question: 'What does the stem carry from the roots up to the leaves?',
    options: [
      { id: 'a', label: 'Seeds only',          correct: false },
      { id: 'b', label: 'Water and nutrients', correct: true  },
      { id: 'c', label: 'Only air',            correct: false },
    ],
    part: 'stem',
    explanation: 'The stem has tiny tubes that carry water and nutrients from roots to leaves.',
  },
  {
    id: 'q3',
    question: 'What do leaves use to make food for the plant?',
    options: [
      { id: 'a', label: 'Soil and seeds',    correct: false },
      { id: 'b', label: 'Sunlight and air',  correct: true  },
      { id: 'c', label: 'Only water',        correct: false },
    ],
    part: 'leaves',
    explanation: 'Leaves use sunlight and air (with water) to make food through photosynthesis.',
  },
  {
    id: 'q4',
    question: 'Why do roots also hold the plant in place?',
    options: [
      { id: 'a', label: 'They anchor it firmly in the soil', correct: true  },
      { id: 'b', label: 'They push the plant upward',        correct: false },
      { id: 'c', label: 'They make the plant heavier',       correct: false },
    ],
    part: 'roots',
    explanation: 'Roots grip the soil and keep the plant from falling over in wind or rain.',
  },
  {
    id: 'q5',
    question: 'Which part holds the plant upright so leaves can face the sun?',
    options: [
      { id: 'a', label: 'Roots',  correct: false },
      { id: 'b', label: 'Flower', correct: false },
      { id: 'c', label: 'Stem',   correct: true  },
    ],
    part: 'stem',
    explanation: 'The stem acts like a backbone, keeping the plant standing tall.',
  },
  {
    id: 'q6',
    question: 'A plant in a dark room with no light will most likely:',
    options: [
      { id: 'a', label: 'Grow faster',                          correct: false },
      { id: 'b', label: 'Stop making food and wilt',            correct: true  },
      { id: 'c', label: 'Develop bigger roots for more water',  correct: false },
    ],
    part: 'leaves',
    explanation: 'Without sunlight, leaves cannot do photosynthesis, so the plant starves.',
  },
  {
    id: 'q7',
    question: 'Which plant part absorbs nutrients (minerals) from the soil?',
    options: [
      { id: 'a', label: 'Leaves', correct: false },
      { id: 'b', label: 'Stem',   correct: false },
      { id: 'c', label: 'Roots',  correct: true  },
    ],
    part: 'roots',
    explanation: 'Roots take up minerals dissolved in soil water.',
  },
  {
    id: 'q8',
    question: 'What happens to food made in the leaves?',
    options: [
      { id: 'a', label: 'It is carried down the stem to feed the whole plant', correct: true  },
      { id: 'b', label: 'It evaporates into the air',                          correct: false },
      { id: 'c', label: 'It flows down through the roots into the soil',       correct: false },
    ],
    part: 'stem',
    explanation: 'The stem moves food made in the leaves back down to feed roots and other parts.',
  },
  {
    id: 'q9',
    question: 'Why do leaves always turn to face the sun?',
    options: [
      { id: 'a', label: 'To stay warm',                  correct: false },
      { id: 'b', label: 'To collect as much sunlight for food-making as possible', correct: true },
      { id: 'c', label: 'To hide from insects',          correct: false },
    ],
    part: 'leaves',
    explanation: 'Facing the sun lets leaves capture maximum light to make more food.',
  },
  {
    id: 'q10',
    question: 'A plant with damaged roots would have trouble:',
    options: [
      { id: 'a', label: 'Getting water and nutrients from the soil', correct: true  },
      { id: 'b', label: 'Getting sunlight',                          correct: false },
      { id: 'c', label: 'Producing seeds',                           correct: false },
    ],
    part: 'roots',
    explanation: 'Damaged roots cannot absorb water and minerals — the plant will struggle to survive.',
  },
  {
    id: 'q11',
    question: 'The tiny tubes inside the stem that carry water are like:',
    options: [
      { id: 'a', label: 'A sponge soaking up water',   correct: false },
      { id: 'b', label: 'Pipes or straws',              correct: true  },
      { id: 'c', label: 'A tank storing water',         correct: false },
    ],
    part: 'stem',
    explanation: 'The tiny tubes (xylem and phloem) work like pipes moving liquid up and down.',
  },
  {
    id: 'q12',
    question: 'Which plant part do we say is a "food factory"?',
    options: [
      { id: 'a', label: 'Roots',  correct: false },
      { id: 'b', label: 'Leaves', correct: true  },
      { id: 'c', label: 'Stem',   correct: false },
    ],
    part: 'leaves',
    explanation: 'Leaves make food (sugar) from sunlight and air — just like a factory.',
  },
  {
    id: 'q13',
    question: 'All three plant parts — roots, stem, leaves — work together like:',
    options: [
      { id: 'a', label: 'Competitors trying to get the most water', correct: false },
      { id: 'b', label: 'A team, each doing a different job',       correct: true  },
      { id: 'c', label: 'Separate plants growing from one seed',    correct: false },
    ],
    part: 'roots',
    explanation: 'Each part has its own role and all three depend on each other to keep the plant alive.',
  },
  {
    id: 'q14',
    question: 'What would happen if a plant had no stem?',
    options: [
      { id: 'a', label: 'The plant would grow faster',                     correct: false },
      { id: 'b', label: 'Water could not travel from roots to leaves',     correct: true  },
      { id: 'c', label: 'Leaves would absorb more sunlight from the soil', correct: false },
    ],
    part: 'stem',
    explanation: 'Without the stem\'s tubes, there is no path for water to travel upward.',
  },
  {
    id: 'q15',
    question: 'Which is the best description of what roots, stem, and leaves each do?',
    options: [
      { id: 'a', label: 'Roots get water — Stem carries water — Leaves make food',  correct: true  },
      { id: 'b', label: 'Roots make food — Stem stores seeds — Leaves get water',   correct: false },
      { id: 'c', label: 'Roots hold flowers — Stem absorbs light — Leaves grow deep', correct: false },
    ],
    part: 'leaves',
    explanation: 'Roots absorb, stem transports, leaves produce food — this is the complete teamwork.',
  },
];

// ── TRACK CONFIGURATION ───────────────────────────────────────────────────────

const TOTAL_SEGMENTS = QUESTIONS.length;        // 15 tiles = finish line
const BOOST_AFTER_STREAK = 3;                   // 3 correct in a row → speed boost effect

// ── STATE ─────────────────────────────────────────────────────────────────────

const state = {
  activityId: null,
  qIndex: 0,
  score: 0,
  correctFirstTry: 0,
  streak: 0,
  startTime: 0,
  completed: false,
  answeredWrong: new Set(),  // question ids where first answer was wrong
  objectLogs: [],
};

// ── UPDATE TRACK ──────────────────────────────────────────────────────────────

function updateTrack() {
  for (let i = 0; i < TOTAL_SEGMENTS; i++) {
    const seg = document.getElementById(`sr-seg-${i}`);
    if (!seg) continue;
    seg.classList.remove('sr-seg-passed', 'sr-seg-current', 'sr-seg-future');
    if (i < state.qIndex)  seg.classList.add('sr-seg-passed');
    else if (i === state.qIndex) seg.classList.add('sr-seg-current');
    else seg.classList.add('sr-seg-future');
  }

  // Move character icon to current position
  const charEl = document.getElementById('sr-character');
  const currentSeg = document.getElementById(`sr-seg-${state.qIndex}`);
  if (charEl && currentSeg) {
    const rect = currentSeg.getBoundingClientRect();
    const trackRect = document.getElementById('sr-track')?.getBoundingClientRect();
    if (trackRect) {
      charEl.style.left = `${(state.qIndex / TOTAL_SEGMENTS) * 100}%`;
    }
  }

  // Update score HUD
  const scoreEl = document.getElementById('sr-score');
  if (scoreEl) scoreEl.textContent = state.score;

  const streakEl = document.getElementById('sr-streak');
  if (streakEl) streakEl.textContent = `${state.streak}x`;
}

// ── SAVE RESULT ───────────────────────────────────────────────────────────────

function saveResult() {
  if (state.completed) return;
  state.completed = true;

  const timeSpent = Math.max(1, Math.round((performance.now() - state.startTime) / 1000));
  const actId = window.streakRaceActivityId || state.activityId;

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

// ── SUMMARY ───────────────────────────────────────────────────────────────────

function showSummary() {
  const area = document.getElementById('sr-question-area');
  if (!area) return;

  const pct = Math.round((state.correctFirstTry / TOTAL_SEGMENTS) * 100);
  speakText(`Streak Race complete! You scored ${state.score} points with ${pct}% accuracy.`);

  area.innerHTML = `
    <div class="sr-summary text-center">
      <div class="sr-summary-icon"><i class="bi bi-trophy-fill"></i></div>
      <h2 class="sr-summary-title">Streak Race — Finished!</h2>
      <p class="sr-summary-sub">You answered all ${TOTAL_SEGMENTS} plant-parts questions.</p>
      <div class="sr-stats-row">
        <div class="sr-stat-box">
          <span class="sr-stat-val">${state.score}</span>
          <span class="sr-stat-lbl">Score</span>
        </div>
        <div class="sr-stat-box">
          <span class="sr-stat-val">${state.correctFirstTry}/${TOTAL_SEGMENTS}</span>
          <span class="sr-stat-lbl">First Try</span>
        </div>
        <div class="sr-stat-box">
          <span class="sr-stat-val">${pct}%</span>
          <span class="sr-stat-lbl">Accuracy</span>
        </div>
      </div>
      <div class="sr-summary-btns">
        <a href="/student/activities" class="sr-btn sr-btn-secondary">
          <i class="bi bi-grid-fill me-1"></i>Back to Activities
        </a>
        <button id="sr-restart" class="sr-btn sr-btn-primary">
          <i class="bi bi-arrow-clockwise me-1"></i>Play Again
        </button>
      </div>
    </div>`;

  document.getElementById('sr-restart')?.addEventListener('click', () => initStreakRace());
}

// ── QUESTION RENDERER ─────────────────────────────────────────────────────────

function renderQuestion() {
  if (state.qIndex >= QUESTIONS.length) {
    saveResult();
    return;
  }

  const q = QUESTIONS[state.qIndex];
  const area = document.getElementById('sr-question-area');
  if (!area) return;

  // Part badge color mapping
  const partColors = {
    roots:  { bg: '#fef3c7', border: '#ca8a04', icon: 'bi-tree'       },
    stem:   { bg: '#dcfce7', border: '#16a34a', icon: 'bi-arrow-up'   },
    leaves: { bg: '#e0f2fe', border: '#0284c7', icon: 'bi-leaf'       },
  };
  const pc = partColors[q.part] || { bg: '#f3f4f6', border: '#6b7280', icon: 'bi-question-circle' };

  const optionsHtml = q.options.map(opt => `
    <button class="sr-opt" data-id="${opt.id}" data-correct="${opt.correct}">
      <span class="sr-opt-letter">${opt.id.toUpperCase()}</span>
      <span>${opt.label}</span>
    </button>`).join('');

  area.innerHTML = `
    <div class="sr-question-card">
      <div class="sr-q-meta">
        <span class="sr-q-num">Question ${state.qIndex + 1} of ${TOTAL_SEGMENTS}</span>
        <span class="sr-part-badge" style="background:${pc.bg};border-color:${pc.border}">
          <i class="bi ${pc.icon} me-1"></i>${q.part.charAt(0).toUpperCase() + q.part.slice(1)}
        </span>
      </div>
      <p class="sr-q-text">${q.question}</p>
      <div class="sr-opts">${optionsHtml}</div>
      <div id="sr-feedback" class="sr-feedback" style="display:none;"></div>
    </div>`;

  updateTrack();
  bindQuestionEvents(q);
}

// ── QUESTION EVENTS ───────────────────────────────────────────────────────────

function bindQuestionEvents(q) {
  const feedbackEl = document.getElementById('sr-feedback');
  let answered = false;

  document.querySelectorAll('.sr-opt').forEach(btn => {
    btn.addEventListener('click', () => {
      if (answered) return;
      answered = true;

      const isCorrect = btn.dataset.correct === 'true';
      const firstTry = !state.answeredWrong.has(q.id);

      // Disable all options
      document.querySelectorAll('.sr-opt').forEach(b => {
        b.disabled = true;
        if (b.dataset.correct === 'true') b.classList.add('sr-opt-correct');
      });

      if (isCorrect) {
        btn.classList.add('sr-opt-correct');
        const pts = firstTry ? 20 : 10;
        state.score += pts;
        if (firstTry) {
          state.correctFirstTry += 1;
          state.streak += 1;
        } else {
          state.streak = 0;
        }

        state.objectLogs.push({ object_id: q.id, was_correct: true, attempt_number: firstTry ? 1 : 2 });

        playTone(660, 0.22);

        const boostMsg = (state.streak > 0 && state.streak % BOOST_AFTER_STREAK === 0)
          ? `<span class="sr-boost-badge"><i class="bi bi-lightning-fill me-1"></i>Speed Boost!</span>` : '';

        if (feedbackEl) {
          feedbackEl.style.display = 'flex';
          feedbackEl.className = 'sr-feedback sr-feedback-ok';
          feedbackEl.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>
            Correct! ${q.explanation} ${boostMsg}`;
        }

        speakText(`Correct! ${q.explanation}`);

        // Advance track
        state.qIndex += 1;
        updateTrack();

        setTimeout(() => renderQuestion(), 1600);

      } else {
        btn.classList.add('sr-opt-wrong');
        state.streak = 0;
        state.answeredWrong.add(q.id);
        state.objectLogs.push({ object_id: q.id, was_correct: false, attempt_number: 1 });

        playTone(220, 0.2);

        if (feedbackEl) {
          feedbackEl.style.display = 'flex';
          feedbackEl.className = 'sr-feedback sr-feedback-err';
          feedbackEl.innerHTML = `<i class="bi bi-x-circle-fill me-2"></i>
            Not quite. Try again — the correct answer is highlighted in green.`;
        }

        // Re-enable correct answer button so student can see it and click it to continue
        setTimeout(() => {
          document.querySelectorAll('.sr-opt').forEach(b => {
            if (b.dataset.correct === 'true') {
              b.disabled = false;
              b.classList.add('sr-opt-pulse');
            }
          });
          answered = false; // allow retry (but marks attempt_number as 2)
        }, 800);
      }

      updateTrack();
    });
  });
}

// ── BUILD TRACK HTML ──────────────────────────────────────────────────────────

function buildTrackHTML() {
  const segs = Array.from({ length: TOTAL_SEGMENTS }, (_, i) => `
    <div class="sr-seg" id="sr-seg-${i}">
      <div class="sr-seg-inner"></div>
    </div>`).join('');

  return `
    <div class="sr-track-wrap">
      <div class="sr-track-meta">
        <span class="sr-track-label">
          <i class="bi bi-flag-fill me-1 text-success"></i>Start
        </span>
        <span class="sr-track-label">
          <i class="bi bi-trophy-fill me-1 text-warning"></i>Finish
        </span>
      </div>
      <div class="sr-track-outer">
        <div id="sr-track" class="sr-track">
          ${segs}
          <!-- Character -->
          <div id="sr-character" class="sr-character" style="left:0%">
            <i class="bi bi-person-fill sr-char-icon"></i>
          </div>
        </div>
      </div>
    </div>`;
}

// ── INIT ──────────────────────────────────────────────────────────────────────

export function initStreakRace() {
  state.score = 0;
  state.correctFirstTry = 0;
  state.streak = 0;
  state.qIndex = 0;
  state.completed = false;
  state.startTime = performance.now();
  state.objectLogs = [];
  state.answeredWrong = new Set();

  const container = document.getElementById('sr-container');
  if (!container) return;

  container.innerHTML = `
    <!-- HUD -->
    <div class="sr-hud">
      <div class="sr-hud-box">
        <i class="bi bi-star-fill me-1 text-warning"></i>
        <span>Score: <strong id="sr-score">0</strong></span>
      </div>
      <div class="sr-hud-box">
        <i class="bi bi-lightning-fill me-1 text-danger"></i>
        <span>Streak: <strong id="sr-streak">0x</strong></span>
      </div>
      <button id="sr-tts-btn" class="sr-tts-btn" title="Read question aloud">
        <i class="bi bi-volume-up-fill me-1"></i>Read Aloud
      </button>
    </div>

    <!-- Track -->
    ${buildTrackHTML()}

    <!-- Question area -->
    <div id="sr-question-area"></div>`;

  document.getElementById('sr-tts-btn')?.addEventListener('click', () => {
    const q = QUESTIONS[state.qIndex];
    if (q) speakText(`${q.question}. Options: ${q.options.map(o => o.label).join(', ')}.`);
  });

  renderQuestion();
}

window.initStreakRace = initStreakRace;
