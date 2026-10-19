/**
 * SciencePlay — Pipeline Circuit Game Engine
 * Sequence & Cycle Runner (Interactive Bio-Circuit)
 */

export function initPipelineCircuit() {
  const config = window.pipelineCircuitConfig || {};
  const isPreview = Boolean(window.isTeacherPreview);
  const activityId = window.pipelineCircuitActivityId || null;

  const rounds = Array.isArray(config.rounds) && config.rounds.length > 0
    ? config.rounds
    : [{
        id: "default_round",
        title: config.title || "Bio-Circuit",
        subtitle: "Chronological Sequence",
        instructions: config.instructions || "Place the steps in order to complete the circuit!",
        theme: "bio",
        steps: config.steps || []
      }];

  let currentRoundIdx = 0;
  let score = 0;
  let streak = 0;
  let selectedTrayPodId = null;
  let placedPods = {}; // slotIndex -> pod object
  let isTesting = false;
  let roundMistakes = 0;
  let totalMistakes = 0;
  let correctFirstTryCount = 0;
  let startTime = Date.now();

  // Audio Synthesizer
  const audioCtx = (typeof window.AudioContext !== 'undefined' || typeof window.webkitAudioContext !== 'undefined')
    ? new (window.AudioContext || window.webkitAudioContext)()
    : null;

  function playTone(freq, type, duration, gainValue = 0.1) {
    if (!audioCtx) return;
    try {
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
      gain.gain.setValueAtTime(gainValue, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function sfxSnap() {
    playTone(520, 'sine', 0.12, 0.12);
  }

  function sfxSwitch() {
    playTone(180, 'triangle', 0.15, 0.2);
  }

  function sfxSurge(stepIdx) {
    playTone(320 + (stepIdx * 110), 'sine', 0.25, 0.15);
  }

  function sfxSuccess() {
    [523.25, 659.25, 783.99, 1046.50].forEach((freq, i) => {
      setTimeout(() => playTone(freq, 'triangle', 0.35, 0.18), i * 90);
    });
  }

  function sfxError() {
    playTone(150, 'sawtooth', 0.35, 0.2);
  }

  // DOM Elements
  const container = document.getElementById('pc-game-container');
  const scoreEl = document.getElementById('pc-score');
  const streakEl = document.getElementById('pc-streak');

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = score;
    if (streakEl) streakEl.textContent = `${streak}x`;
  }

  function renderCurrentRound() {
    placedPods = {};
    selectedTrayPodId = null;
    isTesting = false;
    roundMistakes = 0;

    const round = rounds[currentRoundIdx];
    const steps = round.steps || [];

    // Clone steps and shuffle for tray
    const shuffledSteps = [...steps].sort(() => Math.random() - 0.5);

    container.innerHTML = `
      <div class="pc-workspace">
        <!-- Main Circuit Board -->
        <div class="pc-circuit-card">
          <div class="pc-board-header">
            <div>
              <span class="pc-round-badge">Stage ${currentRoundIdx + 1} of ${rounds.length}</span>
              <h2 class="h5 fw-bold text-white mt-1 mb-0">${round.title || 'Science Circuit'}</h2>
              <small class="text-info">${round.subtitle || ''}</small>
            </div>
            <div class="text-end">
              <span class="badge bg-dark border border-secondary text-light px-3 py-1.5 rounded-pill">
                ${steps.length} Steps
              </span>
            </div>
          </div>

          <!-- Pipeline Track -->
          <div class="pc-pipeline-track" id="pc-pipeline-track">
            <div class="pc-pipeline-tube" id="pc-pipeline-tube"></div>
            ${steps.map((step, idx) => `
              <div class="pc-node-slot" data-slot-index="${idx}" id="node-slot-${idx}">
                <div class="pc-slot-number-badge">${idx + 1}</div>
                <div class="pc-dropzone" data-slot-index="${idx}" id="dropzone-${idx}">
                  <div class="pc-dropzone-placeholder">
                    <i class="bi bi-box-arrow-in-down"></i>
                    <span>Slot ${idx + 1}</span>
                  </div>
                </div>
              </div>
              ${idx < steps.length - 1 ? `<div class="pc-flow-arrow"><i class="bi bi-chevron-right"></i></div>` : ''}
            `).join('')}
          </div>
        </div>

        <!-- Controls Bar -->
        <div class="pc-controls-bar">
          <div class="pc-hint-box" id="pc-hint-box">
            <div class="pc-hint-icon"><i class="bi bi-lightbulb-fill"></i></div>
            <span id="pc-hint-text">${round.instructions || 'Drag or tap the pods below to place them in chronological order along the pipeline.'}</span>
          </div>
          <div>
            <button type="button" class="pc-power-switch" id="pc-test-btn" disabled>
              <i class="bi bi-lightning-charge-fill"></i>
              <span>Test Circuit</span>
            </button>
          </div>
        </div>

        <!-- Power Pod Canisters Tray -->
        <div class="pc-tray-card">
          <div class="pc-tray-title">
            <h3><i class="bi bi-collection-fill text-info"></i> Power Pods (Stages)</h3>
            <span class="small" style="color: #94a3b8;">Tap or drag into empty slots</span>
          </div>
          <div class="pc-pods-tray" id="pc-pods-tray">
            ${shuffledSteps.map(step => `
              <div class="pc-pod pc-tray-pod"
                   id="pod-${step.id}"
                   data-pod-id="${step.id}"
                   draggable="true"
                   title="${step.hint ? escapeHtml(step.hint) : ''}">
                ${step.image_url 
                  ? `<img src="${step.image_url}" class="pc-pod-img" alt="${escapeHtml(step.label)}">` 
                  : `<div class="pc-pod-icon">${step.icon || '⚡'}</div>`}
                <div class="pc-pod-label">${escapeHtml(step.label)}</div>
                ${step.hint ? `
                  <span class="pc-pod-clue-badge">
                    <i class="bi bi-lightbulb-fill text-warning me-1"></i>Clue
                  </span>
                ` : ''}
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    setupInteractions(steps);
  }

  let currentDrag = null; // { podId, fromSlot }

  function setupInteractions(steps) {
    const round = rounds[currentRoundIdx] || {};
    const trayPods = container.querySelectorAll('.pc-tray-pod');
    const dropzones = container.querySelectorAll('.pc-dropzone');
    const trayCard = container.querySelector('.pc-tray-card') || document.getElementById('pc-pods-tray');
    const testBtn = document.getElementById('pc-test-btn');
    const hintText = document.getElementById('pc-hint-text');
    const defaultInstructions = round.instructions || 'Drag or tap the pods below to place them in chronological order along the pipeline.';

    function updateHintDisplay(step) {
      if (!hintText) return;
      if (step && step.hint) {
        hintText.innerHTML = `<span class="text-info fw-bold"><i class="bi bi-lightbulb-fill text-warning me-1"></i>${escapeHtml(step.label)} Clue:</span> <span class="text-light">${escapeHtml(step.hint)}</span>`;
      } else if (step && step.label) {
        hintText.innerHTML = `<strong>${escapeHtml(step.label)}</strong>: Place this stage into the correct chronological slot.`;
      } else {
        const filledCount = Object.keys(placedPods).length;
        if (filledCount === steps.length) {
          hintText.innerHTML = `<strong>Ready!</strong> All slots are filled. Flip the <strong>Test Circuit</strong> switch to verify the energy flow.`;
        } else {
          hintText.innerHTML = defaultInstructions;
        }
      }
    }

    // Drag and Drop for Tray Pods
    trayPods.forEach(podEl => {
      podEl.addEventListener('mouseenter', () => {
        if (isTesting) return;
        const stepData = steps.find(s => String(s.id) === String(podEl.dataset.podId));
        updateHintDisplay(stepData);
      });

      podEl.addEventListener('mouseleave', () => {
        if (isTesting || selectedTrayPodId) return;
        updateHintDisplay(null);
      });

      podEl.addEventListener('dragstart', (e) => {
        if (isTesting || podEl.classList.contains('placed')) {
          e.preventDefault();
          return;
        }
        currentDrag = { podId: podEl.dataset.podId, fromSlot: null };
        e.dataTransfer.setData('text/plain', String(podEl.dataset.podId));
        e.dataTransfer.setData('application/json', JSON.stringify(currentDrag));
        podEl.style.opacity = '0.5';
        const stepData = steps.find(s => String(s.id) === String(podEl.dataset.podId));
        updateHintDisplay(stepData);
      });

      podEl.addEventListener('dragend', () => {
        podEl.style.opacity = '1';
        currentDrag = null;
        dropzones.forEach(z => z.classList.remove('drag-over'));
        if (trayCard) trayCard.classList.remove('tray-drag-over');
        if (!selectedTrayPodId) updateHintDisplay(null);
      });

      // Tap-to-select for mobile / tablets
      podEl.addEventListener('click', () => {
        if (isTesting || podEl.classList.contains('placed')) return;
        const podId = podEl.dataset.podId;
        if (selectedTrayPodId === podId) {
          selectedTrayPodId = null;
          podEl.style.borderColor = '';
          updateHintDisplay(null);
        } else {
          trayPods.forEach(p => p.style.borderColor = '');
          selectedTrayPodId = podId;
          podEl.style.borderColor = '#10b981';
          const stepData = steps.find(s => String(s.id) === String(podId));
          updateHintDisplay(stepData);
        }
      });
    });

    // Dropzones (Slot boxes)
    dropzones.forEach(zoneEl => {
      const slotIdx = parseInt(zoneEl.dataset.slotIndex, 10);

      zoneEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (isTesting) return;
        if (currentDrag && currentDrag.fromSlot === slotIdx) return;
        zoneEl.classList.add('drag-over');
      });

      zoneEl.addEventListener('dragleave', () => {
        zoneEl.classList.remove('drag-over');
      });

      zoneEl.addEventListener('drop', (e) => {
        e.preventDefault();
        zoneEl.classList.remove('drag-over');
        if (isTesting) return;

        let dragData = currentDrag;
        if (!dragData) {
          try {
            dragData = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
          } catch (_) {
            dragData = { podId: e.dataTransfer.getData('text/plain'), fromSlot: null };
          }
        }
        if (!dragData || !dragData.podId) {
          const textId = e.dataTransfer.getData('text/plain');
          if (textId) dragData = { podId: textId, fromSlot: null };
        }
        if (!dragData || !dragData.podId) return;

        const fromSlot = (dragData.fromSlot !== undefined && dragData.fromSlot !== null) ? parseInt(dragData.fromSlot, 10) : null;
        placePodInSlot(dragData.podId, slotIdx, steps, fromSlot);
      });

      // Click dropzone to place selected pod or remove existing pod
      zoneEl.addEventListener('click', () => {
        if (isTesting) return;
        if (selectedTrayPodId) {
          placePodInSlot(selectedTrayPodId, slotIdx, steps, null);
          selectedTrayPodId = null;
          trayPods.forEach(p => p.style.borderColor = '');
        } else if (placedPods[slotIdx]) {
          removePodFromSlot(slotIdx, steps);
        }
      });

      zoneEl.addEventListener('mouseenter', () => {
        if (isTesting) return;
        if (placedPods[slotIdx]) {
          updateHintDisplay(placedPods[slotIdx]);
        } else if (!selectedTrayPodId) {
          if (hintText) hintText.innerHTML = `<strong>Slot ${slotIdx + 1}</strong>: Drop or tap the stage that occurs #${slotIdx + 1} in this sequence.`;
        }
      });

      zoneEl.addEventListener('mouseleave', () => {
        if (isTesting || selectedTrayPodId) return;
        updateHintDisplay(null);
      });
    });

    // Word Bank (Tray): Dragging a placed pod back to the word bank removes it from its slot!
    if (trayCard) {
      trayCard.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (isTesting) return;
        if (currentDrag && currentDrag.fromSlot !== null && currentDrag.fromSlot !== undefined) {
          trayCard.classList.add('tray-drag-over');
        }
      });

      trayCard.addEventListener('dragleave', () => {
        trayCard.classList.remove('tray-drag-over');
      });

      trayCard.addEventListener('drop', (e) => {
        e.preventDefault();
        trayCard.classList.remove('tray-drag-over');
        if (isTesting) return;

        let dragData = currentDrag;
        if (!dragData) {
          try {
            dragData = JSON.parse(e.dataTransfer.getData('application/json') || '{}');
          } catch (_) {}
        }
        if (dragData && dragData.fromSlot !== null && dragData.fromSlot !== undefined) {
          removePodFromSlot(parseInt(dragData.fromSlot, 10), steps);
        }
      });
    }

    if (testBtn) {
      testBtn.addEventListener('click', () => {
        if (!isTesting) {
          testCircuit(steps);
        }
      });
    }
  }

  function renderDropzoneContent(slotIdx, podData, steps) {
    const dropzone = document.getElementById(`dropzone-${slotIdx}`);
    const nodeSlot = document.getElementById(`node-slot-${slotIdx}`);
    if (!dropzone) return;

    if (!podData) {
      dropzone.innerHTML = `
        <div class="pc-dropzone-placeholder">
          <i class="bi bi-box-arrow-in-down"></i>
          <span>Slot ${slotIdx + 1}</span>
        </div>
      `;
      if (nodeSlot) {
        nodeSlot.classList.remove('filled', 'correct', 'error');
      }
      return;
    }

    dropzone.innerHTML = `
      <div class="pc-pod pc-slot-pod"
           id="slot-pod-${slotIdx}"
           data-pod-id="${podData.id}"
           data-slot-index="${slotIdx}"
           draggable="true"
           title="${podData.hint ? escapeHtml(podData.hint) : ''}"
           style="width: 100%; height: 100%; cursor: grab;">
        ${podData.image_url 
          ? `<img src="${podData.image_url}" class="pc-pod-img" alt="${escapeHtml(podData.label)}">` 
          : `<div class="pc-pod-icon">${podData.icon || '⚡'}</div>`}
        <div class="pc-pod-label">${escapeHtml(podData.label)}</div>
        ${podData.hint ? `
          <span class="pc-pod-clue-badge mb-1" style="font-size: 0.6rem; padding: 0.1rem 0.4rem;">
            <i class="bi bi-lightbulb-fill text-warning me-1"></i>Clue
          </span>
        ` : ''}
        <small class="mt-1" style="font-size: 0.68rem; color: #94a3b8;">Drag to move or tap to remove</small>
      </div>
    `;

    if (nodeSlot) {
      nodeSlot.classList.add('filled');
      nodeSlot.classList.remove('correct', 'error');
    }

    // Attach drag & hover events to this placed pod
    const slotPodEl = dropzone.querySelector('.pc-slot-pod');
    if (slotPodEl) {
      slotPodEl.addEventListener('mouseenter', () => {
        if (isTesting) return;
        const hintEl = document.getElementById('pc-hint-text');
        if (hintEl) {
          if (podData.hint) {
            hintEl.innerHTML = `<span class="text-info fw-bold"><i class="bi bi-lightbulb-fill text-warning me-1"></i>${escapeHtml(podData.label)} Clue:</span> <span class="text-light">${escapeHtml(podData.hint)}</span>`;
          } else {
            hintEl.innerHTML = `<strong>${escapeHtml(podData.label)}</strong> placed in Slot ${slotIdx + 1}.`;
          }
        }
      });

      slotPodEl.addEventListener('mouseleave', () => {
        if (isTesting || selectedTrayPodId) return;
        const hintEl = document.getElementById('pc-hint-text');
        if (hintEl) {
          const round = rounds[currentRoundIdx] || {};
          const defaultInstructions = round.instructions || 'Drag or tap the pods below to place them in chronological order along the pipeline.';
          const filledCount = Object.keys(placedPods).length;
          if (filledCount === steps.length) {
            hintEl.innerHTML = `<strong>Ready!</strong> All slots are filled. Flip the <strong>Test Circuit</strong> switch to verify the energy flow.`;
          } else {
            hintEl.innerHTML = defaultInstructions;
          }
        }
      });

      slotPodEl.addEventListener('dragstart', (e) => {
        if (isTesting) {
          e.preventDefault();
          return;
        }
        currentDrag = { podId: podData.id, fromSlot: slotIdx };
        e.dataTransfer.setData('text/plain', String(podData.id));
        e.dataTransfer.setData('application/json', JSON.stringify(currentDrag));
        slotPodEl.style.opacity = '0.4';
      });

      slotPodEl.addEventListener('dragend', () => {
        slotPodEl.style.opacity = '1';
        currentDrag = null;
        document.querySelectorAll('.pc-dropzone').forEach(z => z.classList.remove('drag-over'));
        const trayCard = container.querySelector('.pc-tray-card') || document.getElementById('pc-pods-tray');
        if (trayCard) trayCard.classList.remove('tray-drag-over');
      });
    }
  }

  function placePodInSlot(podId, slotIdx, steps, fromSlot = null) {
    const podData = steps.find(s => String(s.id) === String(podId));
    if (!podData) return;

    if (fromSlot !== null && fromSlot !== undefined) {
      if (fromSlot === slotIdx) return; // Dropped onto self
      const existingInTarget = placedPods[slotIdx];

      if (existingInTarget) {
        // Swap two slots!
        placedPods[fromSlot] = existingInTarget;
        placedPods[slotIdx] = podData;
        renderDropzoneContent(fromSlot, existingInTarget, steps);
        renderDropzoneContent(slotIdx, podData, steps);
      } else {
        // Move from fromSlot to empty slotIdx
        delete placedPods[fromSlot];
        placedPods[slotIdx] = podData;
        renderDropzoneContent(fromSlot, null, steps);
        renderDropzoneContent(slotIdx, podData, steps);
      }
    } else {
      // Coming from tray (word bank)
      const existingInTarget = placedPods[slotIdx];
      if (existingInTarget) {
        // Return existing target pod back to tray
        const oldTrayPod = document.getElementById(`pod-${existingInTarget.id}`);
        if (oldTrayPod) oldTrayPod.classList.remove('placed');
      }

      placedPods[slotIdx] = podData;
      // Mark tray pod as placed
      const trayPod = document.getElementById(`pod-${podId}`);
      if (trayPod) {
        trayPod.classList.add('placed');
        trayPod.style.borderColor = '';
      }
      renderDropzoneContent(slotIdx, podData, steps);
    }

    sfxSnap();
    checkReadyToTest(steps.length);
  }

  function removePodFromSlot(slotIdx, steps = null) {
    const podData = placedPods[slotIdx];
    if (!podData) return;

    delete placedPods[slotIdx];
    sfxSnap();

    // Unmark tray pod
    const trayPod = document.getElementById(`pod-${podData.id}`);
    if (trayPod) {
      trayPod.classList.remove('placed');
      trayPod.style.borderColor = '';
    }

    renderDropzoneContent(slotIdx, null, steps);

    const totalSteps = steps ? steps.length : rounds[currentRoundIdx].steps.length;
    checkReadyToTest(totalSteps);
  }

  function checkReadyToTest(totalSteps) {
    const filledCount = Object.keys(placedPods).length;
    const testBtn = document.getElementById('pc-test-btn');
    const hintText = document.getElementById('pc-hint-text');

    if (testBtn) {
      testBtn.disabled = (filledCount < totalSteps);
    }
    if (hintText && filledCount === totalSteps) {
      hintText.innerHTML = `<strong>Ready!</strong> All slots are filled. Flip the <strong>Test Circuit</strong> switch to verify the energy flow.`;
    }
  }

  async function testCircuit(steps) {
    isTesting = true;
    sfxSwitch();

    const testBtn = document.getElementById('pc-test-btn');
    const hintText = document.getElementById('pc-hint-text');
    const tube = document.getElementById('pc-pipeline-tube');

    if (testBtn) {
      testBtn.disabled = true;
      testBtn.innerHTML = `<i class="bi bi-arrow-repeat spin"></i> Testing...`;
    }

    // Clear previous states
    steps.forEach((_, idx) => {
      const nodeSlot = document.getElementById(`node-slot-${idx}`);
      if (nodeSlot) nodeSlot.classList.remove('correct', 'error');
    });

    let allCorrect = true;
    let failedIndex = -1;

    for (let i = 0; i < steps.length; i++) {
      sfxSurge(i);
      const placed = placedPods[i];
      const nodeSlot = document.getElementById(`node-slot-${i}`);

      // Wait a fraction of a second for energy flow visual
      await new Promise(r => setTimeout(r, 450));

      // Correct check: step order in array corresponds to index + 1
      const isStepCorrect = (placed && (placed.order === (i + 1) || steps[i].id === placed.id));

      if (isStepCorrect) {
        if (nodeSlot) nodeSlot.classList.add('correct');
      } else {
        if (nodeSlot) nodeSlot.classList.add('error');
        allCorrect = false;
        failedIndex = i;
        break;
      }
    }

    if (allCorrect) {
      // Energy surge through whole tube
      if (tube) tube.classList.add('energized');
      sfxSuccess();

      const numSteps = Math.max(1, steps.length);
      const roundMaxPoints = Math.round(100 / rounds.length);

      // Points calculation based on sequence stages and retry deductions:
      // - Solved on 1st test (0 mistakes): 100% of round max points
      // - 1 tripped circuit retry: 75%
      // - 2 tripped circuit retries: 55%
      // - 3 tripped circuit retries: 40%
      // - 4+ retries: 25% floor
      let earnedRatio = 1.0;
      if (roundMistakes === 1) earnedRatio = 0.75;
      else if (roundMistakes === 2) earnedRatio = 0.55;
      else if (roundMistakes === 3) earnedRatio = 0.40;
      else if (roundMistakes >= 4) earnedRatio = 0.25;

      const earnedPoints = Math.max(15, Math.round(roundMaxPoints * earnedRatio));
      score += earnedPoints;

      if (roundMistakes === 0) {
        correctFirstTryCount += numSteps;
        streak += 1;
      } else {
        streak = 0;
      }
      updateHUD();

      if (hintText) {
        const bonusMsg = roundMistakes === 0
          ? ` (+${earnedPoints} pts, First Try Perfect!)`
          : ` (+${earnedPoints} pts, ${roundMistakes} retry penalty applied)`;
        hintText.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Circuit Completed! High voltage active!${bonusMsg}</span>`;
      }

      await new Promise(r => setTimeout(r, 1200));

      if (currentRoundIdx < rounds.length - 1) {
        currentRoundIdx++;
        renderCurrentRound();
      } else {
        finishGame();
      }
    } else {
      sfxError();
      streak = 0;
      roundMistakes++;
      totalMistakes++;
      updateHUD();

      const numSteps = Math.max(1, steps.length);
      const roundMaxPoints = Math.round(100 / rounds.length);

      let nextRatio = 0.75;
      if (roundMistakes === 1) nextRatio = 0.75;
      else if (roundMistakes === 2) nextRatio = 0.55;
      else if (roundMistakes === 3) nextRatio = 0.40;
      else nextRatio = 0.25;

      const nextPotential = Math.max(15, Math.round(roundMaxPoints * nextRatio));

      const failedPod = placedPods[failedIndex];
      const hint = failedPod && failedPod.hint ? failedPod.hint : "Review what happens earlier or later in this sequence.";

      if (hintText) {
        hintText.innerHTML = `<span class="text-warning fw-bold"><i class="bi bi-exclamation-triangle-fill me-1"></i> Circuit tripped at Slot ${failedIndex + 1}!</span> ${hint} <span class="badge bg-danger ms-2">Max score lowered to +${nextPotential} pts</span>`;
      }

      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = `<i class="bi bi-lightning-charge-fill"></i> Test Circuit`;
      }
      isTesting = false;
    }
  }

  async function saveProgressToBackend(finalScore, stars) {
    if (isPreview || !activityId) {
      return {
        attemptsToday: 1,
        attemptsLimit: 3,
        attemptsExhausted: false
      };
    }

    const payload = {
      activity_id: activityId,
      score: finalScore,
      stars: stars,
      time_spent: Math.max(1, Math.round((Date.now() - startTime) / 1000)),
      attempts: totalMistakes + 1,
      correct_first_try: correctFirstTryCount,
      completed: true
    };

    try {
      const res = await fetch('/student/activity_progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
        keepalive: true
      });

      if (res.ok) {
        const data = await res.json();
        const attemptsToday = Number(data.attempts_today) || 1;
        const attemptsLimit = Number(data.attempts_limit) || 3;
        const attemptsExhausted = Boolean(data.attempts_exhausted || attemptsToday >= attemptsLimit);

        // Update HUD attempts pill if present
        const attemptsHud = document.getElementById('pc-attempts-today');
        if (attemptsHud) {
          attemptsHud.textContent = `Attempts: ${attemptsToday}/${attemptsLimit}`;
        }

        return {
          attemptsToday,
          attemptsLimit,
          attemptsExhausted,
          rating: data.rating,
          hint: data.hint
        };
      } else {
        console.warn("activity_progress responded with status:", res.status);
      }
    } catch (e) {
      console.warn("Could not save activity progress:", e);
    }

    return {
      attemptsToday: 1,
      attemptsLimit: 3,
      attemptsExhausted: false
    };
  }

  async function finishGame() {
    // Show victory modal
    const finalScore = Math.min(100, Math.max(20, Math.round(score)));
    // Standard SciencePlay star scale: 90%+ = 3 stars, 60%+ = 2 stars, otherwise 1 star
    const stars = finalScore >= 90 ? 3 : (finalScore >= 60 ? 2 : 1);

    const progressResult = await saveProgressToBackend(finalScore, stars);

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-center p-4" style="min-height: 60vh;">
        <div class="pc-modal-content p-5 text-center shadow-lg" style="max-width: 520px; width: 100%;">
          <div class="display-3 mb-2">⚡🏆⚡</div>
          <h2 class="fw-black text-white mb-2" style="font-size: 2rem;">Circuit Fully Powered!</h2>
          <p class="mb-3" style="color: #cbd5e1; font-size: 1.05rem; line-height: 1.5;">You solved all the sequence stages and completed the bio-pipeline!</p>
          
          <div class="pc-stars-wrap mb-4" style="font-size: 2.3rem;">
            ${Array.from({length: 3}).map((_, i) => `
              <i class="bi ${i < stars ? 'bi-star-fill text-warning' : 'bi-star text-secondary'}"></i>
            `).join('')}
          </div>

          <div class="p-3 rounded-4 mb-4" style="background: rgba(15, 23, 42, 0.85); border: 1.5px solid rgba(56, 189, 248, 0.3);">
            <div class="small fw-bold text-uppercase mb-1" style="color: #94a3b8; letter-spacing: 0.05em;">Final Score</div>
            <div class="h3 fw-bold text-info mb-1">${finalScore} Points</div>
            <div class="d-flex justify-content-center ${!isPreview ? 'mb-3' : 'mb-1'} mt-2">
              <div class="small fw-bold px-3 py-1.5 rounded-3 d-inline-flex align-items-center justify-content-center gap-1.5"
                   style="${totalMistakes === 0 
                     ? 'background: rgba(34, 197, 94, 0.18); border: 1px solid rgba(34, 197, 94, 0.5); color: #86efac;' 
                     : 'background: rgba(245, 158, 11, 0.22); border: 1px solid rgba(245, 158, 11, 0.55); color: #fef08a;'} font-size: 0.95rem; line-height: 1.4;">
                ${totalMistakes === 0 
                  ? '<i class="bi bi-trophy-fill text-success me-1"></i> Solved with 0 mistakes (100% accuracy)' 
                  : `<i class="bi bi-exclamation-triangle-fill text-warning me-1"></i> Circuit tripped ${totalMistakes} ${totalMistakes === 1 ? 'time' : 'times'} before sequence completed`}
              </div>
            </div>
            ${!isPreview ? `
              <div class="d-inline-flex align-items-center gap-1.5 px-3 py-1 rounded-pill ${progressResult.attemptsExhausted ? 'bg-danger text-white' : 'bg-primary text-white'} fw-bold" style="font-size: 0.85rem;">
                <i class="bi bi-clock-history"></i> Attempts today: ${progressResult.attemptsToday}/${progressResult.attemptsLimit}
              </div>
            ` : ''}
          </div>

          <div class="d-flex flex-column gap-2">
            ${(!isPreview && progressResult.attemptsExhausted) ? `
              <button type="button" class="btn btn-secondary fw-bold py-2.5 rounded-pill shadow-sm" disabled style="cursor: not-allowed; opacity: 0.75;">
                <i class="bi bi-lock-fill me-1"></i> Daily Limit Reached (3/3)
              </button>
            ` : `
              <button type="button" class="btn btn-success fw-bold py-2.5 rounded-pill shadow-sm" id="btn-replay">
                <i class="bi bi-arrow-clockwise me-1"></i> Play Again
              </button>
            `}
            <a href="${isPreview ? (window.teacherStudioUrl || '/teacher/content/game_studio') : '/student/activities'}" class="btn btn-outline-light fw-bold py-2.5 rounded-pill">
              <i class="bi bi-grid-fill me-1"></i> ${isPreview ? 'Back to Game Studio' : 'Back to Game Hub'}
            </a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-replay')?.addEventListener('click', () => {
      currentRoundIdx = 0;
      score = 0;
      streak = 0;
      roundMistakes = 0;
      totalMistakes = 0;
      correctFirstTryCount = 0;
      startTime = Date.now();
      updateHUD();
      renderCurrentRound();
    });
  }

  // Initial Boot
  updateHUD();
  renderCurrentRound();
}
