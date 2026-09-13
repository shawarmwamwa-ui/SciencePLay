// buildAPlantGame.js
// "Build a Plant" — 2-Round plant assembly game for Plant Parts (Grade 3)
// Round 1: Garden Flower Plant (Roots → Stem → Leaves → Flower → Fruit → Seeds)
// Round 2: Mighty Apple Tree (Tree Roots → Trunk → Branches → Canopy Leaves → Blossoms → Apples & Seeds)

// ── Audio ─────────────────────────────────────────────────────────────────────

let plantAudioCtx = null;
function playSound(type) {
  try {
    if (!plantAudioCtx) plantAudioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = plantAudioCtx.currentTime;
    const osc = plantAudioCtx.createOscillator();
    const gain = plantAudioCtx.createGain();
    osc.connect(gain);
    gain.connect(plantAudioCtx.destination);

    if (type === 'correct') {
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12);
      gain.gain.setValueAtTime(0.2, now);
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
    }
  } catch (_) {}
}

function playSuccess() { playSound('correct'); }
function playError() { playSound('wrong'); }

// ── ROUNDS DATA ───────────────────────────────────────────────────────────────

const ROUNDS = [
  {
    id: 'flower_plant',
    name: 'Round 1: Garden Flower Plant',
    iconHtml: '<i class="bi bi-flower1" style="color:#ec4899;"></i>',
    nameText: 'Round 1: Garden Flower Plant',
    bgClass: 'bap-canvas-bg--flower',
    stages: [
      {
        id: 'roots',
        label: 'Roots',
        cardClass: 'bap-card--roots',
        iconHtml: '<i class="bi bi-diagram-3-fill" style="color:#d97706;"></i>',
        dzTop: '79%',
        dzLeft: '50%',
        svgId: 'svg-roots',
        hint: 'I drink water deep in the soil and hold the plant steady.',
        funFact: 'Roots grip the soil and drink up water and minerals! 💧',
      },
      {
        id: 'stem',
        label: 'Stem',
        cardClass: 'bap-card--stem',
        iconHtml: '<i class="bi bi-arrow-up-circle-fill" style="color:#16a34a;"></i>',
        dzTop: '55%',
        dzLeft: '50%',
        svgId: 'svg-stem',
        hint: 'I stand tall like a straw, carrying water up to the leaves.',
        funFact: 'The stem works like a straw, carrying water upward! 🥤',
      },
      {
        id: 'leaves',
        label: 'Leaves',
        cardClass: 'bap-card--leaves',
        iconHtml: '<i class="bi bi-brightness-high-fill" style="color:#10b981;"></i>',
        dzTop: '38%',
        dzLeft: '50%',
        svgId: 'svg-leaves',
        hint: 'We catch sunlight and air to cook food for the plant.',
        funFact: 'Leaves use sunlight and air to make food (sugar)! ☀️',
      },
      {
        id: 'flower',
        label: 'Flower',
        cardClass: 'bap-card--flower',
        iconHtml: '<i class="bi bi-flower1" style="color:#ec4899;"></i>',
        dzTop: '16%',
        dzLeft: '50%',
        svgId: 'svg-flower',
        hint: 'I bloom colorful petals to attract helpful bees and butterflies.',
        funFact: 'Flowers attract bees and butterflies to help make seeds! 🐝',
      },
      {
        id: 'fruit',
        label: 'Fruit',
        cardClass: 'bap-card--fruit',
        iconHtml: '<i class="bi bi-apple" style="color:#f97316;"></i>',
        dzTop: '23%',
        dzLeft: '50%',
        svgId: 'svg-fruit',
        hint: 'I grow sweet and juicy to protect the baby seeds inside.',
        funFact: 'Fruit wraps around seeds to protect them until planting! 🌱',
      },
      {
        id: 'seeds',
        label: 'Seeds',
        cardClass: 'bap-card--seeds',
        iconHtml: '<i class="bi bi-record-circle-fill" style="color:#8b5cf6;"></i>',
        dzTop: '29%',
        dzLeft: '50%',
        svgId: 'svg-seeds',
        hint: 'We are tiny packages ready to sprout into new plants.',
        funFact: 'Seeds sprout into brand new plants — life begins again! 🌿',
      },
    ],
    decoys: [
      {
        id: 'soil',
        label: 'Soil',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-layers-fill" style="color:#64748b;"></i>',
        wrongHint: 'Soil is dirt where roots live, not a plant part!',
      },
      {
        id: 'branch',
        label: 'Branch',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-signpost-split-fill" style="color:#b45309;"></i>',
        wrongHint: 'Branches grow on trees. A garden plant needs a green Stem!',
      },
      {
        id: 'petal',
        label: 'Petal',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-suit-heart-fill" style="color:#ec4899;"></i>',
        wrongHint: 'A petal is just one piece. We need the whole Flower!',
      },
      {
        id: 'bud',
        label: 'Bud',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-droplet-half" style="color:#3b82f6;"></i>',
        wrongHint: 'A bud is unbloomed. We need the full Flower!',
      },
      {
        id: 'pollen',
        label: 'Pollen',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-stars" style="color:#eab308;"></i>',
        wrongHint: 'Pollen is yellow dust inside flowers, not a main plant part!',
      },
    ],
  },
  {
    id: 'apple_tree',
    name: 'Round 2: Mighty Apple Tree',
    iconHtml: '<i class="bi bi-tree-fill text-success"></i>',
    nameText: 'Round 2: Mighty Apple Tree',
    bgClass: 'bap-canvas-bg--tree',
    stages: [
      {
        id: 'tree_roots',
        label: 'Tree Roots',
        cardClass: 'bap-card--tree_roots',
        iconHtml: '<i class="bi bi-diagram-3-fill" style="color:#78350f;"></i>',
        dzTop: '78%',
        dzLeft: '50%',
        svgId: 'svg-tree-roots',
        hint: 'Deep underground to anchor the giant tree and drink water.',
        funFact: 'Roots anchor the giant tree and drink lots of water! 💧',
      },
      {
        id: 'trunk',
        label: 'Woody Trunk',
        cardClass: 'bap-card--trunk',
        iconHtml: '<i class="bi bi-shield-fill" style="color:#92400e;"></i>',
        dzTop: '60%',
        dzLeft: '50%',
        svgId: 'svg-tree-trunk',
        hint: 'A thick, woody pillar that holds up the whole tree.',
        funFact: 'The woody trunk stands strong and carries water up! 🛡️',
      },
      {
        id: 'branches',
        label: 'Branches',
        cardClass: 'bap-card--branches',
        iconHtml: '<i class="bi bi-signpost-2-fill" style="color:#ea580c;"></i>',
        dzTop: '44%',
        dzLeft: '50%',
        svgId: 'svg-tree-branches',
        hint: 'Wooden arms spreading wide to hold leaves up to the sun.',
        funFact: 'Branches spread out so leaves get plenty of sunshine! 🌲',
      },
      {
        id: 'tree_leaves',
        label: 'Leafy Canopy',
        cardClass: 'bap-card--tree_leaves',
        iconHtml: '<i class="bi bi-tree-fill" style="color:#15803d;"></i>',
        dzTop: '26%',
        dzLeft: '50%',
        svgId: 'svg-tree-leaves',
        hint: 'A green crown in the sky making food from sunlight.',
        funFact: 'Green leaves make food for the whole tree! ☀️',
      },
      {
        id: 'blossoms',
        label: 'Blossoms',
        cardClass: 'bap-card--blossoms',
        iconHtml: '<i class="bi bi-flower2" style="color:#ec4899;"></i>',
        dzTop: '20%',
        dzLeft: '50%',
        svgId: 'svg-tree-blossoms',
        hint: 'Sweet pink flowers that attract bees in spring.',
        funFact: 'Blossoms bring bees to pollinate the tree! 🌸🐝',
      },
      {
        id: 'apples',
        label: 'Apples & Seeds',
        cardClass: 'bap-card--apples',
        iconHtml: '<i class="bi bi-apple" style="color:#dc2626;"></i>',
        dzTop: '32%',
        dzLeft: '50%',
        svgId: 'svg-tree-apples',
        hint: 'Sweet fruit hanging on branches, protecting the seeds.',
        funFact: 'Apples protect the seeds for new trees! 🍎🌱',
      },
    ],
    decoys: [
      {
        id: 'mushroom',
        label: 'Mushroom',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-umbrella-fill" style="color:#dc2626;"></i>',
        wrongHint: 'Mushrooms are fungi, not a part of this tree!',
      },
      {
        id: 'nest',
        label: 'Bird Nest',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-egg-fill" style="color:#d97706;"></i>',
        wrongHint: 'A nest is an animal home, not a plant part!',
      },
      {
        id: 'green_stem',
        label: 'Green Stem',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-arrow-up" style="color:#16a34a;"></i>',
        wrongHint: 'Trees need a thick woody trunk, not a soft stem!',
      },
      {
        id: 'vine',
        label: 'Climbing Vine',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-infinity" style="color:#15803d;"></i>',
        wrongHint: 'Vines are separate climbing plants, not part of the tree!',
      },
      {
        id: 'pinecone',
        label: 'Pinecone',
        cardClass: 'bap-card--decoy',
        iconHtml: '<i class="bi bi-triangle-fill" style="color:#78350f;"></i>',
        wrongHint: 'Pinecones are from pine trees, but apple trees grow blossoms and fruit!',
      },
    ],
  },
];

// ── STATE ─────────────────────────────────────────────────────────────────────

const state = {
  currentRoundIdx: 0,
  currentStageIdx: 0,
  score: 0,
  totalFirstTry: 0,
  attemptsThisStage: 0,
  startTime: 0,
  completed: false,
  attemptsToday: typeof window.initialAttemptsToday !== 'undefined' ? Number(window.initialAttemptsToday) : 0,
  attemptsLimit: 3,
  objectLogs: [],
  selectedCardId: null,
  draggedCardId: null,
  shuffledParts: [],
};

function getPoints() {
  if (state.attemptsThisStage === 0) return 14;
  if (state.attemptsThisStage === 1) return 7;
  if (state.attemptsThisStage === 2) return 3;
  return 1;
}

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const $ = id => document.getElementById(id);

function getTotalStages() {
  return ROUNDS.reduce((acc, r) => acc + r.stages.length, 0);
}

// ── HUD UPDATE ────────────────────────────────────────────────────────────────

function updateHUD() {
  const round = ROUNDS[state.currentRoundIdx];
  const scoreEl = $('bap-score');
  const stageEl = $('bap-stage');
  const stageHud = $('bap-stage-hud');
  const hintEl  = $('bap-hint');
  const progBar = $('bap-progress-bar');
  const roundTitle = $('bap-round-title');

  if (scoreEl) scoreEl.textContent = state.score;
  const currentNum = Math.min(state.currentStageIdx + 1, round.stages.length);
  if (stageEl) stageEl.textContent = `${currentNum} / ${round.stages.length}`;
  if (stageHud) stageHud.textContent = `Round ${state.currentRoundIdx + 1} (${currentNum}/6)`;
  if (roundTitle) roundTitle.innerHTML = `${round.iconHtml} ${round.nameText}`;
  if (progBar) progBar.style.width = `${(state.currentStageIdx / round.stages.length) * 100}%`;
  if (hintEl && state.currentStageIdx < round.stages.length) {
    hintEl.innerHTML = `<i class="bi bi-lightbulb-fill text-warning me-2"></i><span>${round.stages[state.currentStageIdx].hint}</span>`;
  }
}

// ── SVG REVEAL ───────────────────────────────────────────────────────────────

function revealPlantPart(svgId) {
  const el = $(svgId);
  if (!el) return;
  el.classList.remove('bap-part-revealed');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('bap-part-revealed');
}

// ── FEEDBACK ──────────────────────────────────────────────────────────────────

function showFeedback(isCorrect, message) {
  const fb = $('bap-feedback');
  if (!fb) return;
  fb.className = `bap-feedback bap-feedback--${isCorrect ? 'correct' : 'wrong'}`;
  fb.innerHTML = `<span class="bap-feedback-icon">${isCorrect ? '✅' : '❌'}</span><span>${message}</span>`;
  fb.style.display = 'flex';
  clearTimeout(fb._hideTimer);
  fb._hideTimer = setTimeout(() => { fb.style.display = 'none'; }, 3800);
}

// ── DROP ZONE ─────────────────────────────────────────────────────────────────

function positionDropzone(stageIdx) {
  const round = ROUNDS[state.currentRoundIdx];
  const dz = $('bap-dropzone');
  if (!dz) return;
  if (stageIdx >= round.stages.length) {
    dz.className = 'bap-dropzone bap-dropzone--hidden';
    return;
  }
  const stage = round.stages[stageIdx];
  dz.style.top  = stage.dzTop;
  dz.style.left = stage.dzLeft;
  dz.className  = 'bap-dropzone';
  dz.innerHTML  = `
    <div class="bap-dropzone-target">
      <span class="bap-dropzone-step">Step ${stageIdx + 1}</span>
      <span class="bap-dropzone-icon"><i class="bi bi-geo-alt-fill"></i></span>
    </div>
  `;
}

// ── CARD PLACEMENT LOGIC ──────────────────────────────────────────────────────

function tryPlace(cardId) {
  const round = ROUNDS[state.currentRoundIdx];
  if (state.currentStageIdx >= round.stages.length || state.completed) return;
  const stage = round.stages[state.currentStageIdx];

  // Deselect card
  document.querySelectorAll('.bap-card--selected').forEach(c => c.classList.remove('bap-card--selected'));
  state.selectedCardId = null;

  if (cardId === stage.id) {
    // ✅ CORRECT
    const pts = getPoints();
    state.score += pts;
    if (state.attemptsThisStage === 0) state.totalFirstTry++;
    state.objectLogs.push({
      object_id: `${round.id}_${stage.id}`,
      was_correct: true,
      attempt_number: state.attemptsThisStage + 1,
    });

    // Grey out placed card
    const cardEl = $(`bap-card-${cardId}`);
    if (cardEl) {
      cardEl.classList.add('bap-card--placed');
      cardEl.setAttribute('draggable', 'false');
    }

    // Reveal SVG plant part
    revealPlantPart(stage.svgId);
    playSuccess();
    showFeedback(true, `<strong>+${pts} pts!</strong> ${stage.funFact}`);

    // Flash drop zone green
    const dz = $('bap-dropzone');
    if (dz) {
      dz.style.background = 'rgba(34, 197, 94, 0.45)';
      setTimeout(() => { dz.style.background = ''; }, 400);
    }

    state.currentStageIdx++;
    state.attemptsThisStage = 0;
    updateHUD();

    if (state.currentStageIdx >= round.stages.length) {
      // Current round complete!
      const dzEl = $('bap-dropzone');
      if (dzEl) dzEl.className = 'bap-dropzone bap-dropzone--hidden';
      const hintEl = $('bap-hint');
      if (hintEl) hintEl.textContent = `🎉 Awesome! You built the complete ${round.name}!`;

      if (state.currentRoundIdx < ROUNDS.length - 1) {
        setTimeout(showRoundIntermission, 2400);
      } else {
        setTimeout(saveResult, 2600);
      }
    } else {
      setTimeout(() => positionDropzone(state.currentStageIdx), 600);
    }

  } else {
    // ❌ WRONG
    state.attemptsThisStage++;
    state.objectLogs.push({
      object_id: `${round.id}_${stage.id}`,
      was_correct: false,
      attempt_number: state.attemptsThisStage,
    });

    const decoy = round.decoys.find(d => d.id === cardId);
    const wrongMsg = decoy
      ? decoy.wrongHint
      : `That's not the right part yet! ${stage.hint}`;

    showFeedback(false, wrongMsg);
    playError();

    // Shake drop zone
    const dz = $('bap-dropzone');
    if (dz) {
      dz.classList.add('bap-dropzone--shake');
      setTimeout(() => dz.classList.remove('bap-dropzone--shake'), 500);
    }

    // Shake card
    const cardEl = $(`bap-card-${cardId}`);
    if (cardEl) {
      cardEl.classList.add('bap-card--wrong-shake');
      setTimeout(() => cardEl.classList.remove('bap-card--wrong-shake'), 450);
    }
  }
}

// ── ROUND INTERMISSION MODAL ──────────────────────────────────────────────────

function showRoundIntermission() {
  const currentRound = ROUNDS[state.currentRoundIdx];
  const nextRound = ROUNDS[state.currentRoundIdx + 1];

  playSuccess();

  const overlay = document.createElement('div');
  overlay.className = 'bap-intermission-overlay';
  overlay.innerHTML = `
    <div class="bap-intermission-card">
      <div class="bap-intermission-icon">🌸✨</div>
      <h2 class="bap-intermission-title">Garden Plant Grown!</h2>
      <p class="bap-intermission-sub">
        You assembled all parts of the garden flowering plant in perfect order!<br>
        Next up: <strong>${nextRound.name}</strong> — discover how giant woody trees grow!
      </p>
      <button id="bap-next-round-btn" class="bap-btn bap-btn--primary" style="font-size:1.05rem;padding:0.85rem 2rem;">
        Continue to Round 2: Apple Tree 🌳
      </button>
    </div>`;

  document.body.appendChild(overlay);

  document.getElementById('bap-next-round-btn')?.addEventListener('click', () => {
    overlay.remove();
    state.currentRoundIdx++;
    state.currentStageIdx = 0;
    state.attemptsThisStage = 0;
    renderCurrentRound();
  });
}

// ── COMPLETION ────────────────────────────────────────────────────────────────

async function saveResult() {
  // Bonus for perfect garden (all 7 stages first try): +2 pts to make exactly 100 pts
  const totalStages = getTotalStages();
  if (state.totalFirstTry >= totalStages) {
    state.score = 100;
  }
  state.score = Math.min(100, Math.max(20, state.score));

  const timeSpent = Math.max(1, Math.round((performance.now() - state.startTime) / 1000));
  const actId = window.buildAPlantActivityId;
  if (!actId) return;

  let responseData = null;
  try {
    const res = await fetch('/student/activity_progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: actId,
        score: state.score,
        time_spent: timeSpent,
        correct_first_try: state.totalFirstTry,
        object_logs: state.objectLogs,
      }),
      keepalive: true,
    });
    if (res.ok) {
      responseData = await res.json();
      if (responseData.attempts_today !== undefined) {
        state.attemptsToday = Number(responseData.attempts_today);
      }
      if (responseData.attempts_limit !== undefined) {
        state.attemptsLimit = Number(responseData.attempts_limit);
      }
    }
  } catch (err) {
    console.warn('Could not save activity progress:', err);
  }

  showCompletion(responseData);
}

function launchConfetti() {
  const container = document.createElement('div');
  container.className = 'bap-confetti-container';
  document.body.appendChild(container);
  const colors = ['#ff6b6b','#ffd93d','#6bcb77','#4d96ff','#ff6bef','#ff922b','#51cf66'];
  for (let i = 0; i < 80; i++) {
    const dot = document.createElement('div');
    dot.className = 'bap-confetti-dot';
    dot.style.cssText = `
      left:${Math.random()*100}%;
      background:${colors[Math.floor(Math.random()*colors.length)]};
      animation-delay:${Math.random()*1.2}s;
      animation-duration:${1.8 + Math.random()*1.8}s;
      width:${7 + Math.random()*9}px;height:${7 + Math.random()*9}px;
      border-radius:${Math.random()>0.5?'50%':'3px'};
    `;
    container.appendChild(dot);
  }
  setTimeout(() => container.remove(), 5000);
}

function showCompletion(data) {
  state.completed = true;
  launchConfetti();

  const maxScore = 100;
  const pct = Math.round(state.score);
  const stars = pct >= 90 ? 3 : pct >= 60 ? 2 : 1;
  const starStr = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

  const attemptsUsed = state.attemptsToday || (data && data.attempts_today) || 1;
  const limit = state.attemptsLimit || 3;
  const exhausted = attemptsUsed >= limit;

  let attemptStatHtml = '';
  let restartBtnHtml = '';

  if (exhausted) {
    attemptStatHtml = `
      <div class="bap-stat" style="border-color:#fca5a5;background:#fff1f2;">
        <span class="bap-stat-val text-danger"><i class="bi bi-lock-fill me-1"></i>${attemptsUsed}/${limit}</span>
        <span class="bap-stat-lbl">Daily Limit Reached</span>
      </div>`;
    restartBtnHtml = `
      <button class="bap-btn bap-btn--secondary" disabled style="cursor:not-allowed;opacity:0.7;" title="You have used all 3 attempts for today.">
        <i class="bi bi-lock-fill me-1"></i>Daily Limit Reached (3/3)
      </button>`;
  } else {
    const left = limit - attemptsUsed;
    attemptStatHtml = `
      <div class="bap-stat">
        <span class="bap-stat-val text-success">${attemptsUsed}/${limit}</span>
        <span class="bap-stat-lbl">${left} Left Today</span>
      </div>`;
    restartBtnHtml = `
      <button id="bap-restart" class="bap-btn bap-btn--primary">
        <i class="bi bi-arrow-clockwise me-1"></i>Play Again (${left} left)
      </button>`;
  }

  const main = $('bap-main');
  if (!main) return;

  main.innerHTML = `
    <div class="bap-completion">
      <div class="bap-completion-card">
        <div class="bap-completion-icon">🌳🌸</div>
        <h2 class="bap-completion-title">Master Botanist!</h2>
        <p class="bap-completion-sub">
          You placed all <strong>${totalStages} parts</strong> across both rounds — Garden Flower & Apple Tree!
        </p>
        <div class="bap-stars">${starStr}</div>
        <div class="bap-stats-row">
          <div class="bap-stat">
            <span class="bap-stat-val">${state.score} / ${maxScore}</span>
            <span class="bap-stat-lbl">Total Score</span>
          </div>
          <div class="bap-stat">
            <span class="bap-stat-val">${state.totalFirstTry}/${totalStages}</span>
            <span class="bap-stat-lbl">First Try</span>
          </div>
          <div class="bap-stat">
            <span class="bap-stat-val">${pct}%</span>
            <span class="bap-stat-lbl">Accuracy</span>
          </div>
          ${attemptStatHtml}
        </div>
        <div class="bap-completion-btns">
          <a href="/student/activities" class="bap-btn ${exhausted ? 'bap-btn--primary' : 'bap-btn--secondary'}">
            <i class="bi bi-grid-fill me-1"></i>Back to Activities
          </a>
          ${restartBtnHtml}
        </div>
      </div>
    </div>`;

  if (!exhausted) {
    $('bap-restart')?.addEventListener('click', () => initBuildAPlant());
  }
}

// ── CARD TRAY RENDERING ───────────────────────────────────────────────────────

function renderTray() {
  const tray = $('bap-tray');
  if (!tray) return;

  tray.innerHTML = state.shuffledParts.map(part => `
    <div class="bap-card ${part.cardClass}"
         id="bap-card-${part.id}"
         draggable="true"
         data-id="${part.id}"
         role="button"
         tabindex="0"
         aria-label="${part.label} — drag to the glowing target on the plant">
      <span class="bap-card-icon">${part.iconHtml}</span>
      <span class="bap-card-label">${part.label}</span>
    </div>
  `).join('');

  tray.querySelectorAll('.bap-card').forEach(card => {
    const cardId = card.dataset.id;

    // Desktop Mouse Drag events
    card.addEventListener('dragstart', e => {
      state.draggedCardId = cardId;
      e.dataTransfer.effectAllowed = 'move';
      card.classList.add('bap-card--dragging');
    });
    card.addEventListener('dragend', () => {
      card.classList.remove('bap-card--dragging');
      state.draggedCardId = null;
    });

    // Touch Drag & Drop (Tablets & Mobile touchscreens)
    let touchStartX = 0;
    let touchStartY = 0;
    let ghostEl = null;
    let isTouchDragging = false;

    card.addEventListener('touchstart', e => {
      if (card.classList.contains('bap-card--placed')) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isTouchDragging = false;
    }, { passive: true });

    card.addEventListener('touchmove', e => {
      if (card.classList.contains('bap-card--placed')) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      // Start drag if moved beyond finger threshold
      if (!isTouchDragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
        isTouchDragging = true;
        state.draggedCardId = cardId;
        card.classList.add('bap-card--dragging');

        // Create floating ghost element attached to finger
        ghostEl = card.cloneNode(true);
        ghostEl.className = `${card.className} bap-touch-ghost`;
        ghostEl.style.width = `${card.offsetWidth}px`;
        ghostEl.style.height = `${card.offsetHeight}px`;
        ghostEl.style.left = `${touch.clientX}px`;
        ghostEl.style.top = `${touch.clientY}px`;
        document.body.appendChild(ghostEl);
      }

      if (isTouchDragging && ghostEl) {
        e.preventDefault(); // Prevent accidental tablet scrolling while dragging
        ghostEl.style.left = `${touch.clientX}px`;
        ghostEl.style.top = `${touch.clientY}px`;

        // Check if finger is hovering over dropzone
        const dz = $('bap-dropzone');
        if (dz && !dz.classList.contains('bap-dropzone--hidden')) {
          const rect = dz.getBoundingClientRect();
          const isOver = (
            touch.clientX >= rect.left - 24 &&
            touch.clientX <= rect.right + 24 &&
            touch.clientY >= rect.top - 24 &&
            touch.clientY <= rect.bottom + 24
          );
          if (isOver) {
            dz.classList.add('bap-dropzone--over');
          } else {
            dz.classList.remove('bap-dropzone--over');
          }
        }
      }
    }, { passive: false });

    card.addEventListener('touchend', () => {
      if (isTouchDragging) {
        if (ghostEl) {
          ghostEl.remove();
          ghostEl = null;
        }
        card.classList.remove('bap-card--dragging');
        isTouchDragging = false;
        state.draggedCardId = null;

        // Check if dropped inside dropzone
        const dz = $('bap-dropzone');
        if (dz && !dz.classList.contains('bap-dropzone--hidden')) {
          const isOver = dz.classList.contains('bap-dropzone--over');
          dz.classList.remove('bap-dropzone--over');
          if (isOver) {
            tryPlace(cardId);
            return;
          }
        }
      }
    });

    card.addEventListener('touchcancel', () => {
      if (ghostEl) { ghostEl.remove(); ghostEl = null; }
      card.classList.remove('bap-card--dragging');
      isTouchDragging = false;
      state.draggedCardId = null;
      const dz = $('bap-dropzone');
      if (dz) dz.classList.remove('bap-dropzone--over');
    });

    // Tap / click selection (Works instantly on tap or click)
    card.addEventListener('click', () => {
      if (card.classList.contains('bap-card--placed')) return;
      if (state.selectedCardId === cardId) {
        card.classList.remove('bap-card--selected');
        state.selectedCardId = null;
        return;
      }
      document.querySelectorAll('.bap-card--selected').forEach(c => c.classList.remove('bap-card--selected'));
      card.classList.add('bap-card--selected');
      state.selectedCardId = cardId;
      playTone(440, 0.08);
    });

    card.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); card.click(); }
    });
  });
}

// ── SVG FLOWER MARKUP (ROUND 1) ───────────────────────────────────────────────

function buildFlowerSVG() {
  return `
  <svg class="bap-plant-svg" viewBox="0 0 440 530" xmlns="http://www.w3.org/2000/svg">
    <!-- ROOTS — underground -->
    <g id="svg-roots" class="bap-plant-part" style="transform-origin:220px 360px">
      <line x1="220" y1="360" x2="185" y2="425" stroke="#8B5E3C" stroke-width="7" stroke-linecap="round"/>
      <line x1="220" y1="360" x2="220" y2="445" stroke="#8B5E3C" stroke-width="7" stroke-linecap="round"/>
      <line x1="220" y1="360" x2="255" y2="425" stroke="#8B5E3C" stroke-width="7" stroke-linecap="round"/>
      <line x1="185" y1="425" x2="155" y2="475" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/>
      <line x1="185" y1="425" x2="170" y2="495" stroke="#7A5230" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="255" y1="425" x2="285" y2="475" stroke="#7A5230" stroke-width="5" stroke-linecap="round"/>
      <line x1="255" y1="425" x2="270" y2="495" stroke="#7A5230" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="220" y1="445" x2="200" y2="495" stroke="#7A5230" stroke-width="3.5" stroke-linecap="round"/>
      <line x1="220" y1="445" x2="240" y2="495" stroke="#7A5230" stroke-width="3.5" stroke-linecap="round"/>
    </g>
    
    <!-- STEM — center vertical bar -->
    <g id="svg-stem" class="bap-plant-part" style="transform-origin:220px 240px">
      <rect x="210" y="115" width="20" height="255" fill="#2E7D32" rx="10"/>
      <rect x="214" y="118" width="8" height="248" fill="#43A047" rx="4" opacity="0.6"/>
    </g>
    
    <!-- LEAVES — two sides -->
    <g id="svg-leaves" class="bap-plant-part" style="transform-origin:220px 240px">
      <!-- Left leaf -->
      <ellipse cx="155" cy="245" rx="72" ry="26" fill="#2E7D32" transform="rotate(-30 155 245)"/>
      <ellipse cx="158" cy="247" rx="66" ry="20" fill="#43A047" transform="rotate(-30 158 247)"/>
      <line x1="216" y1="256" x2="95" y2="228" stroke="#1B5E20" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
      <!-- Right leaf -->
      <ellipse cx="285" cy="225" rx="72" ry="26" fill="#2E7D32" transform="rotate(30 285 225)"/>
      <ellipse cx="282" cy="223" rx="66" ry="20" fill="#43A047" transform="rotate(30 282 223)"/>
      <line x1="224" y1="236" x2="345" y2="208" stroke="#1B5E20" stroke-width="2.5" stroke-linecap="round" opacity="0.5"/>
    </g>
    
    <!-- FLOWER — top -->
    <g id="svg-flower" class="bap-plant-part" style="transform-origin:220px 85px">
      <ellipse cx="220" cy="52" rx="17" ry="28" fill="#FF80AB"/>
      <ellipse cx="220" cy="52" rx="17" ry="28" fill="#FF80AB" transform="rotate(60 220 85)"/>
      <ellipse cx="220" cy="52" rx="17" ry="28" fill="#FF80AB" transform="rotate(120 220 85)"/>
      <ellipse cx="220" cy="52" rx="17" ry="28" fill="#F48FB1" transform="rotate(180 220 85)"/>
      <ellipse cx="220" cy="52" rx="17" ry="28" fill="#F48FB1" transform="rotate(240 220 85)"/>
      <ellipse cx="220" cy="52" rx="17" ry="28" fill="#F48FB1" transform="rotate(300 220 85)"/>
      <!-- Center -->
      <circle cx="220" cy="85" r="24" fill="#FFD600"/>
      <circle cx="220" cy="85" r="16" fill="#FF8F00"/>
      <!-- Smile -->
      <path d="M211 87 Q220 94 229 87" stroke="#5D4037" stroke-width="2.5" fill="none" stroke-linecap="round"/>
      <circle cx="214" cy="82" r="2.5" fill="#5D4037"/>
      <circle cx="226" cy="82" r="2.5" fill="#5D4037"/>
    </g>
    
    <!-- FRUIT — below flower -->
    <g id="svg-fruit" class="bap-plant-part" style="transform-origin:220px 130px">
      <ellipse cx="220" cy="135" rx="30" ry="38" fill="#E53935"/>
      <ellipse cx="220" cy="135" rx="24" ry="32" fill="#EF5350" opacity="0.55"/>
      <!-- Shine -->
      <ellipse cx="206" cy="120" rx="8" ry="6" fill="white" opacity="0.45" transform="rotate(-20 206 120)"/>
      <!-- Stem nub -->
      <line x1="220" y1="96" x2="220" y2="108" stroke="#388E3C" stroke-width="5" stroke-linecap="round"/>
      <!-- Leaf nub -->
      <ellipse cx="230" cy="100" rx="13" ry="7" fill="#43A047" transform="rotate(-25 230 100)"/>
    </g>
    
    <!-- SEEDS — inside fruit area -->
    <g id="svg-seeds" class="bap-plant-part" style="transform-origin:220px 135px">
      <circle cx="207" cy="132" r="7" fill="#4E342E"/>
      <circle cx="220" cy="142" r="7" fill="#4E342E"/>
      <circle cx="233" cy="132" r="7" fill="#4E342E"/>
      <circle cx="207" cy="132" r="3.5" fill="#6D4C41"/>
      <circle cx="220" cy="142" r="3.5" fill="#6D4C41"/>
      <circle cx="233" cy="132" r="3.5" fill="#6D4C41"/>
    </g>
  </svg>`;
}

// ── SVG TREE MARKUP (ROUND 2) ─────────────────────────────────────────────────

function buildTreeSVG() {
  return `
  <svg class="bap-plant-svg" viewBox="0 0 440 530" xmlns="http://www.w3.org/2000/svg">
    <!-- TREE ROOTS — deep spreading system -->
    <g id="svg-tree-roots" class="bap-plant-part" style="transform-origin:220px 380px">
      <!-- Main taproot -->
      <path d="M220 370 Q215 420 220 490" stroke="#78350F" stroke-width="12" fill="none" stroke-linecap="round"/>
      <!-- Left root branches -->
      <path d="M210 385 Q160 410 110 440 Q85 455 60 475" stroke="#78350F" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M160 410 Q145 445 130 485" stroke="#92400E" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M110 440 Q95 470 85 500" stroke="#B45309" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <!-- Right root branches -->
      <path d="M230 385 Q280 410 330 440 Q355 455 380 475" stroke="#78350F" stroke-width="9" fill="none" stroke-linecap="round"/>
      <path d="M280 410 Q295 445 310 485" stroke="#92400E" stroke-width="6" fill="none" stroke-linecap="round"/>
      <path d="M330 440 Q345 470 355 500" stroke="#B45309" stroke-width="4.5" fill="none" stroke-linecap="round"/>
      <!-- Deep sub-roots -->
      <path d="M220 450 Q205 480 195 510" stroke="#92400E" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path d="M220 450 Q235 480 245 510" stroke="#92400E" stroke-width="5" fill="none" stroke-linecap="round"/>
    </g>

    <!-- TRUNK — thick woody bark -->
    <g id="svg-tree-trunk" class="bap-plant-part" style="transform-origin:220px 320px">
      <!-- Sturdy Trunk Body -->
      <path d="M195 380 Q190 320 195 260 L245 260 Q250 320 245 380 Z" fill="#78350F"/>
      <path d="M205 380 Q200 320 205 260 L235 260 Q240 320 235 380 Z" fill="#92400E" opacity="0.65"/>
      <!-- Bark Texture Lines -->
      <path d="M210 270 Q208 310 212 370" stroke="#451A03" stroke-width="3" fill="none" opacity="0.6"/>
      <path d="M225 265 Q223 320 226 375" stroke="#451A03" stroke-width="3" fill="none" opacity="0.6"/>
      <path d="M232 280 Q234 330 231 365" stroke="#451A03" stroke-width="2.5" fill="none" opacity="0.5"/>
    </g>

    <!-- BRANCHES — spreading woody limbs -->
    <g id="svg-tree-branches" class="bap-plant-part" style="transform-origin:220px 240px">
      <!-- Center main fork -->
      <path d="M220 270 Q220 210 220 160" stroke="#78350F" stroke-width="12" fill="none" stroke-linecap="round"/>
      <!-- Left main branch -->
      <path d="M205 260 Q160 230 110 210 Q85 200 65 190" stroke="#78350F" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M160 230 Q140 190 120 160" stroke="#92400E" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M110 210 Q95 175 80 145" stroke="#B45309" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- Right main branch -->
      <path d="M235 260 Q280 230 330 210 Q355 200 375 190" stroke="#78350F" stroke-width="10" fill="none" stroke-linecap="round"/>
      <path d="M280 230 Q300 190 320 160" stroke="#92400E" stroke-width="7" fill="none" stroke-linecap="round"/>
      <path d="M330 210 Q345 175 360 145" stroke="#B45309" stroke-width="5" fill="none" stroke-linecap="round"/>
      <!-- Upper twigs -->
      <path d="M220 190 Q195 160 175 130" stroke="#92400E" stroke-width="5.5" fill="none" stroke-linecap="round"/>
      <path d="M220 190 Q245 160 265 130" stroke="#92400E" stroke-width="5.5" fill="none" stroke-linecap="round"/>
    </g>

    <!-- LEAFY CANOPY — sprawling green crown -->
    <g id="svg-tree-leaves" class="bap-plant-part" style="transform-origin:220px 160px">
      <!-- Main overlapping leafy lobes -->
      <circle cx="220" cy="120" r="75" fill="#15803D"/>
      <circle cx="150" cy="160" r="65" fill="#166534"/>
      <circle cx="290" cy="160" r="65" fill="#166534"/>
      <circle cx="110" cy="200" r="55" fill="#15803D"/>
      <circle cx="330" cy="200" r="55" fill="#15803D"/>
      <circle cx="180" cy="210" r="60" fill="#166534"/>
      <circle cx="260" cy="210" r="60" fill="#166534"/>
      <circle cx="220" cy="190" r="65" fill="#15803D"/>
      <!-- Highlights -->
      <circle cx="205" cy="105" r="45" fill="#22C55E" opacity="0.45"/>
      <circle cx="140" cy="145" r="40" fill="#22C55E" opacity="0.45"/>
      <circle cx="295" cy="145" r="40" fill="#22C55E" opacity="0.45"/>
      <circle cx="220" cy="170" r="45" fill="#4ADE80" opacity="0.35"/>
    </g>

    <!-- BLOSSOMS — spring apple blossoms -->
    <g id="svg-tree-blossoms" class="bap-plant-part" style="transform-origin:220px 140px">
      <!-- Blossom 1 -->
      <circle cx="140" cy="125" r="9" fill="#FFF"/>
      <circle cx="140" cy="125" r="5" fill="#F472B6"/>
      <circle cx="140" cy="125" r="2.5" fill="#FBBF24"/>
      <!-- Blossom 2 -->
      <circle cx="220" cy="80" r="10" fill="#FFF"/>
      <circle cx="220" cy="80" r="5.5" fill="#F472B6"/>
      <circle cx="220" cy="80" r="2.5" fill="#FBBF24"/>
      <!-- Blossom 3 -->
      <circle cx="300" cy="125" r="9" fill="#FFF"/>
      <circle cx="300" cy="125" r="5" fill="#F472B6"/>
      <circle cx="300" cy="125" r="2.5" fill="#FBBF24"/>
      <!-- Blossom 4 -->
      <circle cx="100" cy="180" r="8" fill="#FFF"/>
      <circle cx="100" cy="180" r="4.5" fill="#F472B6"/>
      <circle cx="100" cy="180" r="2" fill="#FBBF24"/>
      <!-- Blossom 5 -->
      <circle cx="340" cy="180" r="8" fill="#FFF"/>
      <circle cx="340" cy="180" r="4.5" fill="#F472B6"/>
      <circle cx="340" cy="180" r="2" fill="#FBBF24"/>
      <!-- Blossom 6 -->
      <circle cx="220" cy="145" r="9" fill="#FFF"/>
      <circle cx="220" cy="145" r="5" fill="#F472B6"/>
      <circle cx="220" cy="145" r="2.5" fill="#FBBF24"/>
    </g>

    <!-- APPLES & SEEDS — ripe apples with seeds inside -->
    <g id="svg-tree-apples" class="bap-plant-part" style="transform-origin:220px 170px">
      <!-- Apple 1 -->
      <circle cx="165" cy="165" r="16" fill="#DC2626"/>
      <circle cx="160" cy="160" r="5" fill="#FFF" opacity="0.45"/>
      <path d="M165 149 Q168 143 172 145" stroke="#15803D" stroke-width="2.5" fill="none"/>
      <!-- Apple 2 -->
      <circle cx="265" cy="155" r="17" fill="#DC2626"/>
      <circle cx="260" cy="150" r="5.5" fill="#FFF" opacity="0.45"/>
      <path d="M265 138 Q268 132 272 134" stroke="#15803D" stroke-width="2.5" fill="none"/>
      <!-- Apple 3 -->
      <circle cx="215" cy="200" r="17" fill="#DC2626"/>
      <circle cx="210" cy="195" r="5" fill="#FFF" opacity="0.45"/>
      <path d="M215 183 Q218 177 222 179" stroke="#15803D" stroke-width="2.5" fill="none"/>
      <!-- Apple 4 -->
      <circle cx="120" cy="215" r="15" fill="#DC2626"/>
      <circle cx="116" cy="211" r="4.5" fill="#FFF" opacity="0.45"/>
      <!-- Apple 5 -->
      <circle cx="310" cy="215" r="15" fill="#DC2626"/>
      <circle cx="306" cy="211" r="4.5" fill="#FFF" opacity="0.45"/>
      <!-- Cut open apple showing seeds! -->
      <g transform="translate(220, 245) scale(0.9)">
        <circle cx="0" cy="0" r="18" fill="#DC2626"/>
        <circle cx="0" cy="0" r="14" fill="#FEF3C7"/>
        <ellipse cx="-4" cy="0" rx="3.5" ry="5.5" fill="#451A03"/>
        <ellipse cx="4" cy="0" rx="3.5" ry="5.5" fill="#451A03"/>
      </g>
    </g>
  </svg>`;
}

// ── RENDER CURRENT ROUND ──────────────────────────────────────────────────────

function renderCurrentRound() {
  const round = ROUNDS[state.currentRoundIdx];

  // Shuffle parts + decoys for this round
  const allParts = [...round.stages, ...round.decoys];
  state.shuffledParts = shuffle(allParts);
  state.selectedCardId = null;
  state.draggedCardId = null;

  const main = $('bap-main');
  if (!main) return;

  const svgContent = round.id === 'flower_plant' ? buildFlowerSVG() : buildTreeSVG();
  const firstStage = round.stages[0];

  main.innerHTML = `
    <div class="bap-game-area">

      <!-- Left: Plant Canvas -->
      <div class="bap-canvas-wrap">
        <div class="bap-canvas-bg ${round.bgClass}" id="bap-canvas">

          <!-- SVG plant drawing -->
          ${svgContent}

          <!-- Drop zone circle (active stage target) -->
          <div id="bap-dropzone" class="bap-dropzone" style="top:${firstStage.dzTop};left:${firstStage.dzLeft}">
            <div class="bap-dropzone-target">
              <span class="bap-dropzone-step">Step 1</span>
              <span class="bap-dropzone-icon"><i class="bi bi-geo-alt-fill"></i></span>
            </div>
          </div>

        </div>
        <div class="bap-hint-bar" id="bap-hint"><i class="bi bi-lightbulb-fill text-warning me-2"></i><span>${firstStage.hint}</span></div>
      </div>

      <!-- Right: Controls & Tray -->
      <div class="bap-right-panel">

        <!-- Round header badge -->
        <div class="d-flex align-items-center justify-content-between flex-wrap gap-2">
          <div class="bap-round-pill">
            <span id="bap-round-title">${round.iconHtml} ${round.nameText}</span>
          </div>
          <div class="bap-progress-label mb-0">
            Step <span id="bap-stage">1 / ${round.stages.length}</span>
          </div>
        </div>

        <!-- Progress bar -->
        <div class="bap-progress-wrap">
          <div class="bap-progress-bar" id="bap-progress-bar" style="width:0%"></div>
        </div>

        <!-- Feedback toast -->
        <div id="bap-feedback" class="bap-feedback"></div>

        <!-- Instruction -->
        <div class="bap-instruction">
          <strong>How to play:</strong><br>
          Look at the glowing circle on the plant canvas — it marks where the next part belongs.
          <strong>Drag</strong> the matching part from the tray onto the circle, 
          or <strong>tap</strong> a card then <strong>tap the circle</strong> to snap it in.
          Watch out for tricky decoys! 🎯
        </div>

        <!-- Parts tray -->
        <div class="bap-tray-label">🌱 Specimen Tray — Pick the correct part!</div>
        <div class="bap-tray" id="bap-tray"></div>

      </div>
    </div>`;

  // Render shuffled cards
  renderTray();

  // Drop zone events
  const dz = $('bap-dropzone');
  if (dz) {
    dz.addEventListener('dragover', e => {
      e.preventDefault();
      dz.classList.add('bap-dropzone--over');
    });
    dz.addEventListener('dragleave', () => {
      dz.classList.remove('bap-dropzone--over');
    });
    dz.addEventListener('drop', e => {
      e.preventDefault();
      dz.classList.remove('bap-dropzone--over');
      if (state.draggedCardId) tryPlace(state.draggedCardId);
    });
    dz.addEventListener('click', () => {
      if (state.selectedCardId) tryPlace(state.selectedCardId);
    });
  }

  updateHUD();
}

// ── INIT ──────────────────────────────────────────────────────────────────────

export function initBuildAPlant() {
  state.currentRoundIdx   = 0;
  state.currentStageIdx   = 0;
  state.score             = 0;
  state.totalFirstTry     = 0;
  state.attemptsThisStage = 0;
  state.completed         = false;
  state.startTime         = performance.now();
  state.objectLogs        = [];
  state.selectedCardId    = null;
  state.draggedCardId     = null;

  if (typeof window.initialAttemptsToday !== 'undefined') {
    state.attemptsToday = Number(window.initialAttemptsToday);
  }

  renderCurrentRound();
}

window.initBuildAPlant = initBuildAPlant;
