// teacher_find_the_part_builder.js
// Interactive visual editor for Teacher Content Studio: Diagram Match & Label

(function () {
  'use strict';

  const PRESET_COLORS = ['#fef08a', '#fdba74', '#f87171', '#38bdf8', '#4ade80', '#c084fc', '#f472b6'];

  // Initial State loaded from server
  const config = window.initialDiagramConfig || {};
  let rounds = Array.isArray(config.rounds) && config.rounds.length > 0 ? JSON.parse(JSON.stringify(config.rounds)) : [
    {
      id: 'round_1',
      title: 'Round 1 — Layers of the Earth',
      subtitle: 'Match each label to the correct layer of Planet Earth.',
      illustrationSrc: '/static/images/ftp_earth_layers.jpg',
      illustrationAlt: 'Earth Diagram',
      illustrationBg: '#ffffff',
      zones: [
        { id: 'crust', label: 'Crust', number: 1, pinX: 50, pinY: 13, slotX: 84, slotY: 14, color: '#fef08a' },
        { id: 'mantle', label: 'Mantle', number: 2, pinX: 50, pinY: 28, slotX: 84, slotY: 32, color: '#fdba74' },
        { id: 'outer_core', label: 'Outer Core', number: 3, pinX: 50, pinY: 44, slotX: 16, slotY: 48, color: '#f87171' },
        { id: 'inner_core', label: 'Inner Core', number: 4, pinX: 50, pinY: 50, slotX: 16, slotY: 72, color: '#fbbf24' }
      ],
      wordBank: [
        { id: 'crust', label: 'Crust', isDecoy: false },
        { id: 'mantle', label: 'Mantle', isDecoy: false },
        { id: 'outer_core', label: 'Outer Core', isDecoy: false },
        { id: 'inner_core', label: 'Inner Core', isDecoy: false },
        { id: 'atmosphere', label: 'Atmosphere', isDecoy: true },
        { id: 'hydrosphere', label: 'Hydrosphere', isDecoy: true }
      ],
      facts: {
        crust: "The crust is Earth's solid, rocky outermost shell where all life exists.",
        mantle: "The mantle is a thick layer of extremely hot, dense semi-solid rock beneath the crust.",
        outer_core: "The outer core is a churning liquid layer composed of molten iron and nickel.",
        inner_core: "The inner core is an intensely hot, solid metallic sphere at the center of Earth."
      }
    }
  ];

  let currentRoundIdx = 0;
  let activeZoneId = null;

  // DOM Elements
  const roundsTabBar = document.getElementById('roundsTabBar');
  const btnAddRound = document.getElementById('btnAddRound');
  const roundTitleInput = document.getElementById('roundTitleInput');
  const roundSubtitleInput = document.getElementById('roundSubtitleInput');
  const currentDiagramLabel = document.getElementById('currentDiagramLabel');
  const roundFileInput = document.getElementById('roundFileInput');
  const diagramImage = document.getElementById('diagramImage');
  const diagramSvgOverlay = document.getElementById('diagramSvgOverlay');
  const pinsSlotsLayer = document.getElementById('pinsSlotsLayer');
  const pinTargetsList = document.getElementById('pinTargetsList');
  const pinCountBadge = document.getElementById('pinCountBadge');
  const decoyCountBadge = document.getElementById('decoyCountBadge');
  const decoyInput = document.getElementById('decoyInput');
  const btnAddDecoy = document.getElementById('btnAddDecoy');
  const decoyChipsList = document.getElementById('decoyChipsList');
  const btnAddPinManual = document.getElementById('btnAddPinManual');
  const btnDeleteCurrentRound = document.getElementById('btnDeleteCurrentRound');
  const roundSummaryNote = document.getElementById('roundSummaryNote');
  const diagramBuilderForm = document.getElementById('diagramBuilderForm');
  const roundsDataInput = document.getElementById('roundsDataInput');

  function getCurrentRound() {
    if (!rounds[currentRoundIdx]) {
      currentRoundIdx = 0;
    }
    return rounds[currentRoundIdx];
  }

  function clamp(val, min, max) {
    return Math.min(Math.max(val, min), max);
  }

  // ── RENDER ROUNDS TAB BAR ────────────────────────────────────────────────────
  function renderRoundsTabBar() {
    roundsTabBar.innerHTML = '';
    rounds.forEach((r, idx) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `round-tab-btn ${idx === currentRoundIdx ? 'active' : ''}`;
      btn.innerHTML = `<i class="bi bi-image me-1"></i>Round ${idx + 1}`;
      btn.addEventListener('click', () => {
        if (currentRoundIdx !== idx) {
          currentRoundIdx = idx;
          activeZoneId = null;
          renderAll();
        }
      });
      roundsTabBar.appendChild(btn);
    });

    roundSummaryNote.textContent = `Round ${currentRoundIdx + 1} of ${rounds.length}`;
    btnDeleteCurrentRound.disabled = (rounds.length <= 1);
  }

  // ── RENDER CANVAS & PINS ─────────────────────────────────────────────────────
  function renderCanvas() {
    const round = getCurrentRound();
    if (!round.zones) round.zones = [];
    if (!round.wordBank) round.wordBank = [];
    if (!round.facts) round.facts = {};

    diagramImage.src = round.illustrationSrc || '/static/images/ftp_earth_layers.jpg';
    diagramImage.alt = round.illustrationAlt || 'Science Diagram';

    // Clear SVG and Pins layer
    diagramSvgOverlay.innerHTML = '';
    pinsSlotsLayer.innerHTML = '';

    // Render SVG Leader Lines
    round.zones.forEach(z => {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('class', `builder-leader-line ${z.id === activeZoneId ? 'active' : ''}`);
      line.setAttribute('data-zone-id', z.id);
      line.setAttribute('x1', z.pinX);
      line.setAttribute('y1', z.pinY);
      line.setAttribute('x2', z.slotX);
      line.setAttribute('y2', z.slotY);
      line.setAttribute('stroke', z.color || '#0284c7');
      diagramSvgOverlay.appendChild(line);
    });

    // Render Draggable Pin Dot Handles
    round.zones.forEach(z => {
      const handle = document.createElement('div');
      handle.className = `builder-pin-handle ${z.id === activeZoneId ? 'active' : ''}`;
      handle.dataset.zoneId = z.id;
      handle.style.left = `${z.pinX}%`;
      handle.style.top = `${z.pinY}%`;
      handle.style.setProperty('--pin-color', z.color || '#0284c7');
      handle.title = `Pin #${z.number} (${z.label || 'Unlabeled'}) - Drag to move pointer`;

      handle.innerHTML = `
        <div class="builder-pin-halo"></div>
        <div class="builder-pin-dot"></div>
      `;

      initDraggable(handle, (newX, newY) => {
        z.pinX = Math.round(newX);
        z.pinY = Math.round(newY);
        updateLine(z);
      }, () => {
        setActiveZone(z.id);
      });

      pinsSlotsLayer.appendChild(handle);
    });

    // Render Draggable Callout Slot Boxes
    round.zones.forEach(z => {
      const slot = document.createElement('div');
      slot.className = 'builder-slot-box';
      slot.dataset.zoneId = z.id;
      slot.style.left = `${z.slotX}%`;
      slot.style.top = `${z.slotY}%`;
      slot.style.setProperty('--pin-color', z.color || '#0284c7');
      slot.title = `Callout Drop Box #${z.number} - Drag to move`;

      slot.innerHTML = `
        <span class="builder-slot-badge">${z.number}</span>
        <span class="builder-slot-label-text">${z.label || 'Drop / Tap Target'}</span>
      `;

      initDraggable(slot, (newX, newY) => {
        z.slotX = Math.round(newX);
        z.slotY = Math.round(newY);
        updateLine(z);
      }, () => {
        setActiveZone(z.id);
      });

      pinsSlotsLayer.appendChild(slot);
    });

    pinCountBadge.textContent = `${round.zones.length} Pin${round.zones.length === 1 ? '' : 's'} Placed`;
  }

  function updateLine(zone) {
    const line = diagramSvgOverlay.querySelector(`line[data-zone-id="${zone.id}"]`);
    if (line) {
      line.setAttribute('x1', zone.pinX);
      line.setAttribute('y1', zone.pinY);
      line.setAttribute('x2', zone.slotX);
      line.setAttribute('y2', zone.slotY);
    }
  }

  // ── DRAGGABLE LOGIC (PERCENTAGE BASED) ─────────────────────────────────────────
  function initDraggable(el, onMove, onClick) {
    let isDragging = false;
    let startX = 0, startY = 0;
    let moved = false;

    function onPointerDown(e) {
      e.stopPropagation();
      e.preventDefault();
      isDragging = true;
      moved = false;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;
      startX = clientX;
      startY = clientY;

      document.addEventListener('pointermove', onPointerMove);
      document.addEventListener('pointerup', onPointerUp);
    }

    function onPointerMove(e) {
      if (!isDragging) return;
      const clientX = e.touches ? e.touches[0].clientX : e.clientX;
      const clientY = e.touches ? e.touches[0].clientY : e.clientY;

      if (Math.hypot(clientX - startX, clientY - startY) > 4) {
        moved = true;
      }

      const rect = diagramImage.getBoundingClientRect();
      if (!rect.width || !rect.height) return;

      const pctX = clamp(((clientX - rect.left) / rect.width) * 100, 2, 98);
      const pctY = clamp(((clientY - rect.top) / rect.height) * 100, 2, 98);

      el.style.left = `${pctX}%`;
      el.style.top = `${pctY}%`;

      if (onMove) onMove(pctX, pctY);
    }

    function onPointerUp() {
      if (isDragging) {
        isDragging = false;
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
        if (!moved && onClick) {
          onClick();
        }
      }
    }

    el.addEventListener('pointerdown', onPointerDown);
  }

  // ── CLICK ON DIAGRAM TO ADD PIN ──────────────────────────────────────────────
  diagramImage.addEventListener('click', (e) => {
    const rect = diagramImage.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const clickX = clamp(((e.clientX - rect.left) / rect.width) * 100, 4, 96);
    const clickY = clamp(((e.clientY - rect.top) / rect.height) * 100, 4, 96);

    addNewPinAt(clickX, clickY);
  });

  function addNewPinAt(pinX, pinY) {
    const round = getCurrentRound();
    const nextNum = (round.zones.length + 1);
    const newId = `part_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const slotX = clamp(pinX > 50 ? pinX + 16 : pinX - 16, 8, 92);
    const slotY = clamp(pinY, 8, 92);
    const color = PRESET_COLORS[(nextNum - 1) % PRESET_COLORS.length];

    const newZone = {
      id: newId,
      label: '',
      number: nextNum,
      pinX: Math.round(pinX),
      pinY: Math.round(pinY),
      slotX: Math.round(slotX),
      slotY: Math.round(slotY),
      color: color
    };

    round.zones.push(newZone);
    round.facts[newId] = '';
    activeZoneId = newId;

    renderCanvas();
    renderInspector();

    // Focus on new label input
    setTimeout(() => {
      const input = document.querySelector(`.pin-label-input[data-zone-id="${newId}"]`);
      if (input) input.focus();
    }, 60);
  }

  btnAddPinManual.addEventListener('click', () => {
    addNewPinAt(50, 50);
  });

  function setActiveZone(zoneId) {
    activeZoneId = zoneId;
    renderCanvas();
    renderInspector();

    const card = document.querySelector(`.pin-target-card[data-zone-id="${zoneId}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  // ── RENDER INSPECTOR PANEL ───────────────────────────────────────────────────
  function renderInspector() {
    const round = getCurrentRound();
    pinTargetsList.innerHTML = '';

    if (round.zones.length === 0) {
      pinTargetsList.innerHTML = `
        <div class="text-center text-muted py-5 px-3">
          <i class="bi bi-pin-map text-primary fs-1 mb-2 d-block opacity-50"></i>
          <h4 class="h6 fw-bold text-dark mb-1">No Pins Placed Yet</h4>
          <p class="small text-muted mb-0">Click anywhere on the diagram canvas to drop your first callout pointer pin!</p>
        </div>
      `;
      renderWordBank();
      return;
    }

    round.zones.forEach((z, idx) => {
      z.number = idx + 1; // keep numbers sequential 1, 2, 3...
      const card = document.createElement('div');
      card.className = `pin-target-card ${z.id === activeZoneId ? 'active' : ''}`;
      card.dataset.zoneId = z.id;

      card.innerHTML = `
        <div class="d-flex justify-content-between align-items-center mb-2">
          <div class="d-flex align-items-center gap-2">
            <span class="badge rounded-circle p-1 d-inline-flex align-items-center justify-content-center text-dark fw-black" style="width: 24px; height: 24px; background: ${z.color || '#fef08a'}; font-size: 0.75rem;">
              ${z.number}
            </span>
            <span class="fw-bold small text-dark">${z.label || `Target Pin #${z.number}`}</span>
          </div>
          <button type="button" class="btn btn-sm text-danger p-0 border-0 btn-delete-pin" data-zone-id="${z.id}" title="Delete this pin">
            <i class="bi bi-trash3"></i>
          </button>
        </div>

        <div class="mb-2">
          <label class="form-label small text-muted fw-bold mb-1">Correct Answer / Label <span class="text-danger">*</span></label>
          <input type="text" class="form-control form-control-sm rounded-3 fw-bold pin-label-input" data-zone-id="${z.id}" value="${escapeHtml(z.label)}" placeholder="e.g. Crust">
        </div>

        <div class="mb-2">
          <label class="form-label small text-muted fw-bold mb-1">Kid-Friendly Fact / Explanation</label>
          <textarea class="form-control form-control-sm rounded-3 pin-fact-input" data-zone-id="${z.id}" rows="2" placeholder="e.g. The crust is the outermost solid rocky shell.">${escapeHtml(round.facts[z.id] || '')}</textarea>
        </div>

        <div class="d-flex align-items-center justify-content-between mt-2 pt-2 border-top">
          <span class="small text-muted" style="font-size: 0.72rem;">Pin Color:</span>
          <div class="d-flex align-items-center gap-1.5">
            ${PRESET_COLORS.map(c => `
              <button type="button" class="pin-color-btn ${c === z.color ? 'active' : ''}" data-color="${c}" data-zone-id="${z.id}" style="background:${c};" title="Choose color"></button>
            `).join('')}
          </div>
        </div>
      `;

      // Event listeners for inputs
      const labelInput = card.querySelector('.pin-label-input');
      labelInput.addEventListener('input', (e) => {
        z.label = e.target.value.trim();
        // Update slot text in DOM
        const slotText = document.querySelector(`.builder-slot-box[data-zone-id="${z.id}"] .builder-slot-label-text`);
        if (slotText) slotText.textContent = z.label || 'Drop / Tap Target';
        syncWordBank();
      });

      const factInput = card.querySelector('.pin-fact-input');
      factInput.addEventListener('input', (e) => {
        round.facts[z.id] = e.target.value.trim();
      });

      card.querySelectorAll('.pin-color-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          z.color = btn.dataset.color;
          renderCanvas();
          renderInspector();
        });
      });

      const btnDel = card.querySelector('.btn-delete-pin');
      btnDel.addEventListener('click', (e) => {
        e.stopPropagation();
        deletePin(z.id);
      });

      card.addEventListener('click', () => {
        setActiveZone(z.id);
      });

      pinTargetsList.appendChild(card);
    });

    renderWordBank();
  }

  function deletePin(zoneId) {
    const round = getCurrentRound();
    round.zones = round.zones.filter(z => z.id !== zoneId);
    delete round.facts[zoneId];
    if (activeZoneId === zoneId) {
      activeZoneId = round.zones[0] ? round.zones[0].id : null;
    }
    syncWordBank();
    renderCanvas();
    renderInspector();
  }

  // ── WORD BANK MANAGEMENT ─────────────────────────────────────────────────────
  function syncWordBank() {
    const round = getCurrentRound();
    if (!Array.isArray(round.wordBank)) round.wordBank = [];

    // Keep existing decoys
    const decoys = round.wordBank.filter(w => w.isDecoy);

    // Build correct items from active zones
    const corrects = round.zones
      .filter(z => z.label && z.label.trim())
      .map(z => ({
        id: z.id,
        label: z.label.trim(),
        isDecoy: false
      }));

    round.wordBank = [...corrects, ...decoys];
    renderWordBank();
  }

  function renderWordBank() {
    const round = getCurrentRound();
    if (!Array.isArray(round.wordBank)) round.wordBank = [];

    const decoys = round.wordBank.filter(w => w.isDecoy);
    decoyCountBadge.textContent = `${decoys.length} Decoy${decoys.length === 1 ? '' : 's'}`;

    decoyChipsList.innerHTML = '';
    if (decoys.length === 0) {
      decoyChipsList.innerHTML = `<span class="text-muted small fst-italic">No decoy words added. Add distractors above to challenge students!</span>`;
      return;
    }

    decoys.forEach(d => {
      const chip = document.createElement('span');
      chip.className = 'decoy-chip';
      chip.innerHTML = `
        <span>${escapeHtml(d.label)}</span>
        <button type="button" class="btn-remove-decoy" data-decoy-id="${d.id}" title="Remove decoy word">&times;</button>
      `;

      chip.querySelector('.btn-remove-decoy').addEventListener('click', () => {
        removeDecoy(d.id);
      });

      decoyChipsList.appendChild(chip);
    });
  }

  function addDecoyWord() {
    const val = decoyInput.value.trim();
    if (!val) return;
    const round = getCurrentRound();
    if (!Array.isArray(round.wordBank)) round.wordBank = [];

    const decoyId = `decoy_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    round.wordBank.push({
      id: decoyId,
      label: val,
      isDecoy: true
    });

    decoyInput.value = '';
    renderWordBank();
  }

  btnAddDecoy.addEventListener('click', addDecoyWord);
  decoyInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addDecoyWord();
    }
  });

  function removeDecoy(decoyId) {
    const round = getCurrentRound();
    round.wordBank = round.wordBank.filter(w => w.id !== decoyId);
    renderWordBank();
  }

  // ── PRESET DIAGRAM SELECTION & FILE UPLOAD ────────────────────────────────────
  document.querySelectorAll('.btn-select-preset-diagram').forEach(btn => {
    btn.addEventListener('click', () => {
      const src = btn.dataset.src;
      const label = btn.dataset.label;
      const round = getCurrentRound();
      round.illustrationSrc = src;
      round.illustrationAlt = label;
      currentDiagramLabel.textContent = label;
      renderCanvas();
    });
  });

  roundFileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const round = getCurrentRound();
    const reader = new FileReader();
    reader.onload = (event) => {
      round.illustrationSrc = event.target.result;
      round.illustrationAlt = file.name;
      currentDiagramLabel.textContent = file.name;
      renderCanvas();
    };
    reader.readAsDataURL(file);

    // Name this file input appropriately for server upload
    roundFileInput.name = `round_image_file_${currentRoundIdx}`;
  });

  // ── ROUND MANAGEMENT (ADD & DELETE) ──────────────────────────────────────────
  btnAddRound.addEventListener('click', () => {
    const nextRoundNum = rounds.length + 1;
    rounds.push({
      id: `round_${Date.now()}`,
      title: `Round ${nextRoundNum} — Diagram`,
      subtitle: 'Match each label to the correct pointer pin on the diagram.',
      illustrationSrc: '/static/images/ftp_earth_layers.jpg',
      illustrationAlt: `Round ${nextRoundNum} Diagram`,
      illustrationBg: '#ffffff',
      zones: [],
      wordBank: [],
      facts: {}
    });

    currentRoundIdx = rounds.length - 1;
    activeZoneId = null;
    renderAll();
  });

  btnDeleteCurrentRound.addEventListener('click', () => {
    if (rounds.length <= 1) {
      alert('You must have at least one round in this activity.');
      return;
    }
    if (confirm(`Are you sure you want to delete Round ${currentRoundIdx + 1}?`)) {
      rounds.splice(currentRoundIdx, 1);
      if (currentRoundIdx >= rounds.length) {
        currentRoundIdx = rounds.length - 1;
      }
      activeZoneId = null;
      renderAll();
    }
  });

  // Inputs sync
  roundTitleInput.addEventListener('input', (e) => {
    getCurrentRound().title = e.target.value.trim();
  });

  roundSubtitleInput.addEventListener('input', (e) => {
    getCurrentRound().subtitle = e.target.value.trim();
  });

  // ── FORM SUBMISSION ──────────────────────────────────────────────────────────
  diagramBuilderForm.addEventListener('submit', (e) => {
    // Validate each round
    for (let i = 0; i < rounds.length; i++) {
      const r = rounds[i];
      if (!r.zones || r.zones.length === 0) {
        e.preventDefault();
        alert(`Round ${i + 1} has no pins placed! Please place at least 1 pin target.`);
        currentRoundIdx = i;
        renderAll();
        return;
      }

      for (let j = 0; j < r.zones.length; j++) {
        const z = r.zones[j];
        if (!z.label || !z.label.trim()) {
          e.preventDefault();
          alert(`In Round ${i + 1}, Pin #${z.number} has no label/answer. Please provide a correct answer.`);
          currentRoundIdx = i;
          activeZoneId = z.id;
          renderAll();
          return;
        }
      }
    }

    // Serialize cleaned rounds into JSON
    roundsDataInput.value = JSON.stringify(rounds);
  });

  function renderAll() {
    const round = getCurrentRound();
    roundTitleInput.value = round.title || `Round ${currentRoundIdx + 1}`;
    roundSubtitleInput.value = round.subtitle || '';
    currentDiagramLabel.textContent = round.illustrationAlt || 'Custom Diagram';

    renderRoundsTabBar();
    renderCanvas();
    renderInspector();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  // Initial render
  renderAll();

})();
