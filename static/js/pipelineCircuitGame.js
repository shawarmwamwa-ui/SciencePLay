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
            <span class="text-muted small">Tap or drag into empty slots</span>
          </div>
          <div class="pc-pods-tray" id="pc-pods-tray">
            ${shuffledSteps.map(step => `
              <div class="pc-pod pc-tray-pod"
                   id="pod-${step.id}"
                   data-pod-id="${step.id}"
                   draggable="true">
                ${step.image_url 
                  ? `<img src="${step.image_url}" class="pc-pod-img" alt="${step.label}">` 
                  : `<div class="pc-pod-icon">${step.icon || '⚡'}</div>`}
                <div class="pc-pod-label">${step.label}</div>
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
    const trayPods = container.querySelectorAll('.pc-tray-pod');
    const dropzones = container.querySelectorAll('.pc-dropzone');
    const trayCard = container.querySelector('.pc-tray-card') || document.getElementById('pc-pods-tray');
    const testBtn = document.getElementById('pc-test-btn');
    const hintText = document.getElementById('pc-hint-text');

    // Drag and Drop for Tray Pods
    trayPods.forEach(podEl => {
      podEl.addEventListener('dragstart', (e) => {
        if (isTesting || podEl.classList.contains('placed')) {
          e.preventDefault();
          return;
        }
        currentDrag = { podId: podEl.dataset.podId, fromSlot: null };
        e.dataTransfer.setData('text/plain', String(podEl.dataset.podId));
        e.dataTransfer.setData('application/json', JSON.stringify(currentDrag));
        podEl.style.opacity = '0.5';
      });

      podEl.addEventListener('dragend', () => {
        podEl.style.opacity = '1';
        currentDrag = null;
        dropzones.forEach(z => z.classList.remove('drag-over'));
        if (trayCard) trayCard.classList.remove('tray-drag-over');
      });

      // Tap-to-select for mobile / tablets
      podEl.addEventListener('click', () => {
        if (isTesting || podEl.classList.contains('placed')) return;
        const podId = podEl.dataset.podId;
        if (selectedTrayPodId === podId) {
          selectedTrayPodId = null;
          podEl.style.borderColor = '';
        } else {
          trayPods.forEach(p => p.style.borderColor = '');
          selectedTrayPodId = podId;
          podEl.style.borderColor = '#10b981';
          if (hintText) hintText.textContent = `Tap any slot on the pipeline to place "${podEl.querySelector('.pc-pod-label').textContent}".`;
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
           style="width: 100%; height: 100%; cursor: grab;">
        ${podData.image_url 
          ? `<img src="${podData.image_url}" class="pc-pod-img" alt="${podData.label}">` 
          : `<div class="pc-pod-icon">${podData.icon || '⚡'}</div>`}
        <div class="pc-pod-label">${podData.label}</div>
        <small class="text-muted mt-1" style="font-size: 0.65rem;">Drag to move or tap to remove</small>
      </div>
    `;

    if (nodeSlot) {
      nodeSlot.classList.add('filled');
      nodeSlot.classList.remove('correct', 'error');
    }

    // Attach drag events to this placed pod
    const slotPodEl = dropzone.querySelector('.pc-slot-pod');
    if (slotPodEl) {
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
      score += 100 + (streak * 20);
      streak += 1;
      updateHUD();

      if (hintText) {
        hintText.innerHTML = `<span class="text-success fw-bold"><i class="bi bi-check-circle-fill me-1"></i> Circuit Completed Perfectly! High voltage active!</span>`;
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
      updateHUD();

      const failedPod = placedPods[failedIndex];
      const hint = failedPod && failedPod.hint ? failedPod.hint : "Review what happens earlier or later in this sequence.";

      if (hintText) {
        hintText.innerHTML = `<span class="text-warning fw-bold"><i class="bi bi-exclamation-triangle-fill me-1"></i> Circuit tripped at Slot ${failedIndex + 1}!</span> ${hint}`;
      }

      if (testBtn) {
        testBtn.disabled = false;
        testBtn.innerHTML = `<i class="bi bi-lightning-charge-fill"></i> Test Circuit`;
      }
      isTesting = false;
    }
  }

  async function finishGame() {
    // Show victory modal
    const finalScore = score;
    const stars = score >= 300 ? 3 : (score >= 150 ? 2 : 1);

    // Post progress to student activity backend if not preview
    if (!isPreview && activityId) {
      try {
        await fetch('/student/activity_progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            activity_id: activityId,
            score: Math.min(100, Math.round((score / (rounds.length * 120)) * 100)),
            stars: stars,
            completed: true
          })
        });
      } catch (e) {
        console.warn("Could not save activity progress:", e);
      }
    }

    container.innerHTML = `
      <div class="d-flex align-items-center justify-content-center p-4" style="min-height: 60vh;">
        <div class="pc-modal-content p-5 text-center shadow-lg" style="max-width: 520px; width: 100%;">
          <div class="display-3 mb-2">⚡🏆⚡</div>
          <h2 class="fw-black text-white mb-1">Circuit Fully Powered!</h2>
          <p class="text-muted mb-4">You solved all the sequence stages and completed the bio-pipeline!</p>
          
          <div class="pc-stars-wrap">
            ${Array.from({length: 3}).map((_, i) => `
              <i class="bi ${i < stars ? 'bi-star-fill text-warning' : 'bi-star text-secondary'}"></i>
            `).join('')}
          </div>

          <div class="p-3 bg-dark rounded-4 border border-secondary mb-4">
            <div class="text-muted small fw-bold text-uppercase">Final Score</div>
            <div class="h3 fw-bold text-info mb-0">${finalScore} Points</div>
          </div>

          <div class="d-flex flex-column gap-2">
            <button type="button" class="btn btn-success fw-bold py-2.5 rounded-pill shadow-sm" id="btn-replay">
              <i class="bi bi-arrow-clockwise me-1"></i> Play Again
            </button>
            <a href="${isPreview ? '/teacher/content/games' : '/student/dashboard'}" class="btn btn-outline-light fw-bold py-2.5 rounded-pill">
              <i class="bi bi-house-door-fill me-1"></i> ${isPreview ? 'Back to Game Studio' : 'Back to Dashboard'}
            </a>
          </div>
        </div>
      </div>
    `;

    document.getElementById('btn-replay')?.addEventListener('click', () => {
      currentRoundIdx = 0;
      score = 0;
      streak = 0;
      updateHUD();
      renderCurrentRound();
    });
  }

  // Initial Boot
  updateHUD();
  renderCurrentRound();
}
