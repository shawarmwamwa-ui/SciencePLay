// findThePartGame.js
// "Find the Part" — Hotspot Callout Leader Pin labeling game for Animal Body Parts
// Game 2A: Grade 3 Science, Week 3-4

let audioCtx = null;
function playSound(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const now = audioCtx.currentTime;
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);

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
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
      osc.start(now);
      osc.stop(now + 0.28);
    } else if (type === 'pop') {
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, now);
      osc.frequency.exponentialRampToValueAtTime(660, now + 0.08);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.1);
    }
  } catch (_) {}
}

// ── GAME DATA: 3 Rounds with Callout Pins & Slots ─────────────────────────────

const ROUNDS = [
  {
    id: 'bird',
    title: 'Round 1 — Label the Bird',
    subtitle: 'Match each body part label to the correct pointer pin on the bird.',
    illustrationSrc: '/static/images/ftp_bird.webp',
    illustrationAlt: 'Bird Diagram',
    illustrationBg: '#e0f2fe',
    zones: [
      { id: 'beak',   label: 'Beak',   number: 1, pinX: 74, pinY: 30, slotX: 84, slotY: 18, color: '#fef08a' },
      { id: 'wings',  label: 'Wings',  number: 2, pinX: 46, pinY: 48, slotX: 16, slotY: 36, color: '#dbeafe' },
      { id: 'legs',   label: 'Legs',   number: 3, pinX: 50, pinY: 72, slotX: 18, slotY: 76, color: '#dcfce7' },
      { id: 'claws',  label: 'Claws',  number: 4, pinX: 58, pinY: 82, slotX: 80, slotY: 84, color: '#fce7f3' },
    ],
    wordBank: [
      { id: 'beak',  label: 'Beak',  isDecoy: false },
      { id: 'wings', label: 'Wings', isDecoy: false },
      { id: 'legs',  label: 'Legs',  isDecoy: false },
      { id: 'claws', label: 'Claws', isDecoy: false },
      { id: 'fin',   label: 'Fin',   isDecoy: true  },
      { id: 'tail',  label: 'Tail',  isDecoy: true  },
    ],
    facts: {
      beak:  'Beaks help birds pick up seeds, berries, and insects to eat.',
      wings: 'Wings let the bird fly into the air to travel and escape danger.',
      legs:  'Legs help the bird hop along the ground and perch securely.',
      claws: 'Claws grip tree branches tightly so the bird stays balanced while resting.',
    },
  },
  {
    id: 'lion',
    title: 'Round 2 — Label the Lion',
    subtitle: 'Match each body part label to the correct pointer pin on the lion.',
    illustrationSrc: '/static/images/ftp_lion.webp',
    illustrationAlt: 'Lion Diagram',
    illustrationBg: '#fef9c3',
    zones: [
      { id: 'eyes',  label: 'Eyes',  number: 1, pinX: 76, pinY: 30, slotX: 84, slotY: 16, color: '#fde68a' },
      { id: 'mouth', label: 'Mouth', number: 2, pinX: 82, pinY: 41, slotX: 84, slotY: 52, color: '#fee2e2' },
      { id: 'legs',  label: 'Legs',  number: 3, pinX: 56, pinY: 66, slotX: 34, slotY: 84, color: '#dcfce7' },
      { id: 'paws',  label: 'Paws',  number: 4, pinX: 62, pinY: 86, slotX: 82, slotY: 84, color: '#fce7f3' },
    ],
    wordBank: [
      { id: 'eyes',   label: 'Eyes',   isDecoy: false },
      { id: 'mouth',  label: 'Mouth',  isDecoy: false },
      { id: 'paws',   label: 'Paws',   isDecoy: false },
      { id: 'legs',   label: 'Legs',   isDecoy: false },
      { id: 'wings',  label: 'Wings',  isDecoy: true  },
      { id: 'beak',   label: 'Beak',   isDecoy: true  },
    ],
    facts: {
      eyes:  'Forward-facing eyes help lions spot prey and judge leaping distances.',
      mouth: 'Powerful jaws and teeth help the lion bite, grip, and chew food.',
      paws:  'Wide, padded paws let the lion walk quietly without making noise.',
      legs:  'Muscular legs give the lion explosive speed to run fast.',
    },
  },
  {
    id: 'fish',
    title: 'Round 3 — Label the Fish',
    subtitle: 'Match each body part label to the correct pointer pin on the fish.',
    illustrationSrc: '/static/images/ftp_fish.webp',
    illustrationAlt: 'Fish Diagram',
    illustrationBg: '#e0f2fe',
    zones: [
      { id: 'dorsal_fin',  label: 'Dorsal Fin', number: 1, pinX: 52, pinY: 22, slotX: 50, slotY: 10, color: '#dbeafe' },
      { id: 'eye',         label: 'Eye',        number: 2, pinX: 73, pinY: 45, slotX: 84, slotY: 28, color: '#fde68a' },
      { id: 'mouth',       label: 'Mouth',       number: 3, pinX: 82, pinY: 53, slotX: 84, slotY: 66, color: '#fee2e2' },
      { id: 'tail_fin',    label: 'Tail Fin',    number: 4, pinX: 24, pinY: 48, slotX: 14, slotY: 48, color: '#e9d5ff' },
    ],
    wordBank: [
      { id: 'eye',        label: 'Eye',         isDecoy: false },
      { id: 'mouth',      label: 'Mouth',       isDecoy: false },
      { id: 'dorsal_fin', label: 'Dorsal Fin',  isDecoy: false },
      { id: 'tail_fin',   label: 'Tail Fin',    isDecoy: false },
      { id: 'wings',      label: 'Wings',       isDecoy: true  },
      { id: 'claws',      label: 'Claws',       isDecoy: true  },
    ],
    facts: {
      eye:        'Large fish eyes help them spot food and steer safely underwater.',
      mouth:      'The mouth opens to swallow water and catch tiny plants and prey.',
      dorsal_fin: 'The dorsal fin along the fish’s back keeps it upright and stable in water.',
      tail_fin:   'The tail fin swishes side to side to propel the fish forward.',
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
  attemptsToday: typeof window.initialAttemptsToday !== 'undefined' ? Number(window.initialAttemptsToday) : 0,
  attemptsLimit: 3,

  // per-round
  selectedLabel: null,    // ID of label from word bank currently tapped
  selectedSlot: null,     // ID of slot currently selected
  matched: new Set(),     // set of matched zone IDs
  attempts: {},           // { zoneId: count }
  objectLogs: [],         // analytics
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
  const maxScore = 100;
  if (el) el.textContent = `${state.score} / ${maxScore}`;
}

// ── SAVE RESULT ───────────────────────────────────────────────────────────────

async function saveResult() {
  if (state.completed) return;
  state.completed = true;

  // Bonus for perfect run (all first try): +1 pt to make exactly 100 pts
  const totalZones = ROUNDS.reduce((acc, r) => acc + r.zones.length, 0);
  if (state.correctFirstTry >= totalZones) {
    state.score = 100;
  }
  state.score = Math.min(100, Math.max(20, state.score));

  const timeSpent = Math.max(1, Math.round((performance.now() - state.startTime) / 1000));
  const actId = window.findThePartActivityId || state.activityId;

  let responseData = null;
  try {
    const res = await fetch('/student/activity_progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        activity_id: actId,
        score: state.score,
        time_spent: timeSpent,
        correct_first_try: state.correctFirstTry,
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

  showSummary(responseData);
}

// ── SUMMARY SCREEN ────────────────────────────────────────────────────────────

function showSummary(data) {
  const container = document.getElementById('ftp-container');
  if (!container) return;

  const maxScore = 100;
  const pct = Math.round(state.score);

  const attemptsUsed = state.attemptsToday || (data && data.attempts_today) || 1;
  const limit = state.attemptsLimit || 3;
  const exhausted = attemptsUsed >= limit;

  let attemptBadge = '';
  let restartBtnHtml = '';
  let coachHintHtml = '';

  if (exhausted) {
    attemptBadge = `
      <div class="ftp-stat-box ftp-stat-box-warn">
        <span class="ftp-stat-val text-danger"><i class="bi bi-lock-fill me-1"></i>${attemptsUsed}/${limit}</span>
        <span class="ftp-stat-lbl">Daily Limit Reached</span>
      </div>`;
    restartBtnHtml = `
      <button class="ftp-btn ftp-btn-disabled" disabled title="You have reached your 3 daily attempts. Check back tomorrow for more practice!">
        <i class="bi bi-lock-fill me-1"></i>Daily Limit Reached (3/3)
      </button>`;
    coachHintHtml = `
      <div class="ftp-hint-box ftp-hint-box-exhausted">
        <i class="bi bi-info-circle-fill me-2 text-warning"></i>
        <span>You've completed all <strong>3 daily attempts</strong> for today! Awesome work. Check back tomorrow or explore other activities!</span>
      </div>`;
  } else {
    const left = limit - attemptsUsed;
    attemptBadge = `
      <div class="ftp-stat-box">
        <span class="ftp-stat-val text-success">${attemptsUsed}/${limit}</span>
        <span class="ftp-stat-lbl">${left} Attempt${left === 1 ? '' : 's'} Left Today</span>
      </div>`;
    restartBtnHtml = `
      <button id="ftp-restart" class="ftp-btn ftp-btn-primary">
        <i class="bi bi-arrow-clockwise me-1"></i>Play Again (${left} left)
      </button>`;
  }

  if (data && data.hint && !exhausted) {
    coachHintHtml = `
      <div class="ftp-hint-box">
        <i class="bi bi-lightbulb-fill me-2 text-warning"></i>
        <span><strong>Coach Tip:</strong> ${data.hint}</span>
      </div>`;
  }

  container.innerHTML = `
    <div class="ftp-summary text-center">
      <div class="ftp-summary-icon">
        <i class="bi bi-trophy-fill"></i>
      </div>
      <h2 class="ftp-summary-title">Find the Part — Complete!</h2>
      <p class="ftp-summary-sub">You labeled all animal body parts. Great effort!</p>
      
      <div class="ftp-stats-row">
        <div class="ftp-stat-box">
          <span class="ftp-stat-val">${state.score} / ${maxScore}</span>
          <span class="ftp-stat-lbl">Final Score</span>
        </div>
        <div class="ftp-stat-box">
          <span class="ftp-stat-val">${state.correctFirstTry}/${total}</span>
          <span class="ftp-stat-lbl">First Try</span>
        </div>
        <div class="ftp-stat-box">
          <span class="ftp-stat-val">${pct}%</span>
          <span class="ftp-stat-lbl">Score Accuracy</span>
        </div>
        ${attemptBadge}
      </div>

      ${coachHintHtml}

      <div class="ftp-summary-btns">
        <a href="/student/activities" class="ftp-btn ${exhausted ? 'ftp-btn-primary' : 'ftp-btn-secondary'}">
          <i class="bi bi-grid-fill me-1"></i>Back to Activities
        </a>
        ${restartBtnHtml}
      </div>
    </div>`;

  if (!exhausted) {
    document.getElementById('ftp-restart')?.addEventListener('click', () => initFindThePart());
  }
}

// ── ROUND RENDERER ────────────────────────────────────────────────────────────

function renderRound(roundIdx) {
  if (roundIdx >= ROUNDS.length) {
    saveResult();
    return;
  }

  state.currentRound = roundIdx;
  state.selectedLabel = null;
  state.selectedSlot = null;
  state.matched = new Set();
  state.attempts = {};

  const round = ROUNDS[roundIdx];
  const container = document.getElementById('ftp-container');
  if (!container) return;

  const shuffledBank = shuffle(round.wordBank);

  // SVG Leader lines connecting pins to slots
  const svgLinesHtml = round.zones.map(z => `
    <line class="ftp-leader-line" data-line-id="${z.id}"
          x1="${z.pinX}" y1="${z.pinY}" x2="${z.slotX}" y2="${z.slotY}" />
    <circle class="ftp-pin-halo" data-halo-id="${z.id}"
            cx="${z.pinX}" cy="${z.pinY}" r="3.2" />
    <circle class="ftp-pin-dot" data-pin-id="${z.id}"
            cx="${z.pinX}" cy="${z.pinY}" r="1.8" fill="${z.color}" />
  `).join('');

  // Callout Slots HTML
  const slotsHtml = round.zones.map(z => `
    <div class="ftp-slot ftp-slot-empty"
         data-zone-id="${z.id}"
         style="left:${z.slotX}%;top:${z.slotY}%;"
         role="button"
         tabindex="0"
         aria-label="Slot for ${z.label}">
      <span class="ftp-slot-badge">${z.number}</span>
      <span class="ftp-slot-label"><i class="bi bi-plus me-1"></i>Drop / Tap</span>
    </div>
  `).join('');

  // Word bank chips HTML (draggable)
  const bankHtml = shuffledBank.map(w => `
    <button class="ftp-chip"
            draggable="true"
            data-label-id="${w.id}"
            data-is-decoy="${w.isDecoy}">
      ${w.label}
    </button>
  `).join('');

  container.innerHTML = `
    <div class="ftp-round">
      <!-- Round header -->
      <div class="ftp-round-header">
        <span class="ftp-round-badge">Round ${roundIdx + 1} / ${ROUNDS.length}</span>
        <h2 class="ftp-round-title">${round.title}</h2>
        <p class="ftp-round-sub">${round.subtitle}</p>
      </div>

      <!-- Instruction banner -->
      <div id="ftp-banner" class="ftp-banner ftp-banner-info">
        <i class="bi bi-hand-index-thumb-fill me-2"></i>
        <span>Drag or tap a label from the word bank, then match it to a numbered pin slot!</span>
      </div>

      <!-- Illustration with Callout Leader Pins & Slots -->
      <div class="ftp-illustration-wrap">
        <div class="ftp-illustration"
             style="background:${round.illustrationBg};"
             aria-label="${round.illustrationAlt}">
          <img src="${round.illustrationSrc}" alt="${round.illustrationAlt}" class="ftp-animal-img" fetchpriority="high" width="800" height="600">
          <svg class="ftp-leader-svg" viewBox="0 0 100 100" preserveAspectRatio="none">
            ${svgLinesHtml}
          </svg>
          ${slotsHtml}
        </div>
      </div>

      <!-- Fact panel -->
      <div id="ftp-fact" class="ftp-fact-panel" style="display:none;"></div>

      <!-- Word bank -->
      <div class="ftp-bank-header">
        <i class="bi bi-card-text me-1"></i>Word Bank (Drag or Tap)
      </div>
      <div id="ftp-word-bank" class="ftp-word-bank">
        ${bankHtml}
      </div>
    </div>`;

  bindRoundEvents(round);
  updateHUD();
}

// ── MATCH HANDLER (Shared by Tap & Drag) ──────────────────────────────────────

function processMatch(zoneId, labelId, round) {
  const banner = document.getElementById('ftp-banner');
  const factPanel = document.getElementById('ftp-fact');
  const slotEl = document.querySelector(`.ftp-slot[data-zone-id="${zoneId}"]`);
  const chipEl = document.querySelector(`.ftp-chip[data-label-id="${labelId}"]`);
  const isDecoy = chipEl?.dataset.isDecoy === 'true';
  const isMatch = labelId === zoneId && !isDecoy;

  state.attempts[zoneId] = (state.attempts[zoneId] || 0) + 1;
  const tries = state.attempts[zoneId];

  if (isMatch) {
    const zone = round.zones.find(z => z.id === zoneId);
    const fact = round.facts[zoneId];
    const firstTry = tries === 1;

    // Diminishing point return (9 parts total -> 9 * 11 = 99 + 1 perfect bonus = 100 pts max):
    // 1st try: 11 pts | 2nd try: 6 pts | 3rd try: 3 pts | 4+ tries: 1 pt
    let pts = 1;
    let ptsBadge = '+1 pt (Review needed)';
    if (tries === 1) {
      pts = 11;
      ptsBadge = '+11 pts (First Try!)';
      state.correctFirstTry += 1;
    } else if (tries === 2) {
      pts = 6;
      ptsBadge = '+6 pts';
    } else if (tries === 3) {
      pts = 3;
      ptsBadge = '+3 pts';
    }

    state.matched.add(zoneId);
    state.score += pts;

    state.objectLogs.push({
      object_id: `${round.id}_${zoneId}`,
      was_correct: true,
      attempt_number: tries,
    });

    // Update Slot appearance
    if (slotEl) {
      slotEl.className = 'ftp-slot ftp-slot-matched';
      slotEl.innerHTML = `
        <span class="ftp-slot-badge"><i class="bi bi-check-lg"></i></span>
        <span class="ftp-slot-label">${zone.label}</span>
      `;
    }

    // Update SVG Leader Line & Pin
    const line = document.querySelector(`.ftp-leader-line[data-line-id="${zoneId}"]`);
    if (line) line.classList.add('ftp-leader-matched');
    const halo = document.querySelector(`.ftp-pin-halo[data-halo-id="${zoneId}"]`);
    if (halo) halo.classList.add('ftp-pin-halo-matched');
    const dot = document.querySelector(`.ftp-pin-dot[data-pin-id="${zoneId}"]`);
    if (dot) dot.classList.add('ftp-pin-dot-matched');

    // Update Word Chip
    if (chipEl) {
      chipEl.classList.remove('ftp-chip-selected');
      chipEl.classList.add('ftp-chip-used');
      chipEl.disabled = true;
      chipEl.draggable = false;
    }

    state.selectedLabel = null;
    state.selectedSlot = null;

    // Show fact callout
    if (factPanel && fact) {
      factPanel.style.display = 'flex';
      factPanel.innerHTML = `<i class="bi bi-check-circle-fill me-2 text-success"></i>${fact}`;
    }

    if (banner) {
      banner.className = 'ftp-banner ftp-banner-success';
      banner.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>
        Correct! <strong>${zone.label}</strong> labeled! <strong>${ptsBadge}</strong>`;
    }

    playSound('correct');
    updateHUD();

    // Check if round complete
    if (state.matched.size === round.zones.length) {
      setTimeout(() => renderRound(state.currentRound + 1), 1600);
    }
  } else {
    // Wrong match
    state.objectLogs.push({
      object_id: `${round.id}_${zoneId}`,
      was_correct: false,
      attempt_number: tries,
    });

    // Calculate remaining potential points for this slot
    let nextPotential = 1;
    if (tries === 1) nextPotential = 6;
    else if (tries === 2) nextPotential = 3;
    else nextPotential = 1;

    const labelName = chipEl ? chipEl.textContent.trim() : labelId;
    if (banner) {
      banner.className = 'ftp-banner ftp-banner-danger';
      banner.innerHTML = `<i class="bi bi-x-circle-fill me-2"></i>
        Not quite! <strong>${labelName}</strong> does not go there. (Points for this part lessened to <strong>+${nextPotential} pts</strong>)`;
    }
    playSound('wrong');

    if (slotEl) {
      slotEl.classList.add('ftp-slot-error');
      setTimeout(() => slotEl.classList.remove('ftp-slot-error'), 600);
    }

    // Shake the wrong chip for clear tactile feedback
    if (chipEl) {
      chipEl.classList.add('ftp-chip-wrong-shake');
      setTimeout(() => chipEl.classList.remove('ftp-chip-wrong-shake'), 500);
    }

    // Reset BOTH slot and label selections to prevent unintended follow-up triggers
    state.selectedSlot = null;
    state.selectedLabel = null;
    document.querySelectorAll('.ftp-slot').forEach(s => {
      if (!state.matched.has(s.dataset.zoneId)) s.classList.remove('ftp-slot-selected');
    });
    document.querySelectorAll('.ftp-chip').forEach(c => {
      if (!c.classList.contains('ftp-chip-used')) c.classList.remove('ftp-chip-selected');
    });
  }
}

// ── EVENT BINDING ─────────────────────────────────────────────────────────────

function bindRoundEvents(round) {
  const banner = document.getElementById('ftp-banner');

  // Word bank chips: Tap and Touch Drag
  document.querySelectorAll('.ftp-chip').forEach(chip => {
    // HTML5 Drag Start (desktop)
    chip.addEventListener('dragstart', (e) => {
      if (chip.classList.contains('ftp-chip-used')) {
        e.preventDefault();
        return;
      }
      e.dataTransfer.setData('text/plain', chip.dataset.labelId);
      chip.classList.add('ftp-chip-selected');
      state.selectedLabel = chip.dataset.labelId;
    });

    chip.addEventListener('dragend', () => {
      if (!state.selectedSlot) {
        chip.classList.remove('ftp-chip-selected');
      }
    });

    // Touch Drag (tablets & touch screens)
    let touchStartX = 0;
    let touchStartY = 0;
    let isDragging = false;
    let ghostChip = null;

    chip.addEventListener('touchstart', (e) => {
      if (chip.classList.contains('ftp-chip-used')) return;
      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      isDragging = false;
    }, { passive: true });

    chip.addEventListener('touchmove', (e) => {
      if (chip.classList.contains('ftp-chip-used')) return;
      const touch = e.touches[0];
      const dx = touch.clientX - touchStartX;
      const dy = touch.clientY - touchStartY;

      if (!isDragging && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) {
        isDragging = true;
        ghostChip = document.createElement('div');
        ghostChip.className = 'ftp-chip ftp-chip-selected';
        ghostChip.textContent = chip.textContent.trim();
        ghostChip.style.position = 'fixed';
        ghostChip.style.pointerEvents = 'none';
        ghostChip.style.zIndex = '9999';
        ghostChip.style.boxShadow = '0 8px 16px rgba(0,0,0,0.2)';
        document.body.appendChild(ghostChip);
      }

      if (isDragging && ghostChip) {
        e.preventDefault();
        ghostChip.style.left = `${touch.clientX - 40}px`;
        ghostChip.style.top = `${touch.clientY - 20}px`;
      }
    }, { passive: false });

    const endTouchDrag = (e) => {
      if (isDragging && ghostChip) {
        const touch = e.changedTouches ? e.changedTouches[0] : null;
        if (touch) {
          const targetEl = document.elementFromPoint(touch.clientX, touch.clientY);
          const slotEl = targetEl?.closest('.ftp-slot');
          if (slotEl && !state.matched.has(slotEl.dataset.zoneId)) {
            processMatch(slotEl.dataset.zoneId, chip.dataset.labelId, round);
          }
        }
        ghostChip.remove();
        ghostChip = null;
        isDragging = false;
      }
    };

    chip.addEventListener('touchend', endTouchDrag);
    chip.addEventListener('touchcancel', () => {
      if (ghostChip) {
        ghostChip.remove();
        ghostChip = null;
      }
      isDragging = false;
    });

    // Tap
    chip.addEventListener('click', () => {
      if (chip.classList.contains('ftp-chip-used')) return;

      // If a slot is already selected, try to match directly!
      if (state.selectedSlot) {
        processMatch(state.selectedSlot, chip.dataset.labelId, round);
        return;
      }

      // Otherwise, select this chip
      document.querySelectorAll('.ftp-chip').forEach(c => c.classList.remove('ftp-chip-selected'));
      chip.classList.add('ftp-chip-selected');
      state.selectedLabel = chip.dataset.labelId;
      playSound('pop');

      if (banner) {
        banner.className = 'ftp-banner ftp-banner-primary';
        banner.innerHTML = `<i class="bi bi-hand-index-thumb-fill me-2"></i>
          Word chosen: <strong>${chip.textContent.trim()}</strong>. Now tap the matching numbered pin slot!`;
      }
    });
  });

  // Callout Slots: Tap and Drop
  document.querySelectorAll('.ftp-slot').forEach(slotEl => {
    const zoneId = slotEl.dataset.zoneId;

    // Drag Over & Leave
    slotEl.addEventListener('dragover', (e) => {
      if (state.matched.has(zoneId)) return;
      e.preventDefault();
      slotEl.classList.add('ftp-slot-dragover');
    });

    slotEl.addEventListener('dragleave', () => {
      slotEl.classList.remove('ftp-slot-dragover');
    });

    // Drop
    slotEl.addEventListener('drop', (e) => {
      e.preventDefault();
      slotEl.classList.remove('ftp-slot-dragover');
      if (state.matched.has(zoneId)) return;

      const labelId = e.dataTransfer.getData('text/plain') || state.selectedLabel;
      if (labelId) {
        processMatch(zoneId, labelId, round);
      }
    });

    // Tap
    slotEl.addEventListener('click', () => {
      // Already matched
      if (state.matched.has(zoneId)) {
        const fact = round.facts[zoneId];
        const factPanel = document.getElementById('ftp-fact');
        if (factPanel && fact) {
          factPanel.style.display = 'flex';
          factPanel.innerHTML = `<i class="bi bi-info-circle-fill me-2"></i>${fact}`;
        }
        return;
      }

      // If a word is already selected, evaluate match!
      if (state.selectedLabel) {
        processMatch(zoneId, state.selectedLabel, round);
        return;
      }

      // Otherwise, select this slot first (Slot -> Word flow)
      document.querySelectorAll('.ftp-slot').forEach(s => {
        if (!state.matched.has(s.dataset.zoneId)) s.classList.remove('ftp-slot-selected');
      });

      slotEl.classList.add('ftp-slot-selected');
      state.selectedSlot = zoneId;
      playTone(480, 0.08);

      const zone = round.zones.find(z => z.id === zoneId);
      if (banner) {
        banner.className = 'ftp-banner ftp-banner-primary';
        banner.innerHTML = `<i class="bi bi-pin-map-fill me-2"></i>
          Pin Slot <strong>#${zone?.number}</strong> selected! Now tap its matching name in the Word Bank below.`;
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
  state.selectedLabel = null;
  state.selectedSlot = null;
  state.matched = new Set();
  state.attempts = {};

  if (typeof window.initialAttemptsToday !== 'undefined') {
    state.attemptsToday = Number(window.initialAttemptsToday);
  }

  renderRound(0);
  updateHUD();
}

window.initFindThePart = initFindThePart;
