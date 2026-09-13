// metalLogicGame.js
// Metal Clue Detective — Clues are the questions (1, 2, 3...) & Answer Boxes hold the metal items!
// Features concise kid-friendly clues, shuffle per round, choice dimming, remove/swap actions,
// post-round review modal with right/wrong feedback, and latency-free Web Audio sound effects.
// Standalone arcade activity for Lesson 6 (Properties of Metals)

export function initMetalLogicGame() {
  // Web Audio Synthesizer for instant game sound effects
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
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(220, now); // A3
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
    } catch (e) {
      // AudioContext unavailable or blocked
    }
  }

  const ITEMS_BANK = {
    // --- Genuine Metals (Concise 1-sentence kid-friendly clues) ---
    iron: {
      id: "iron",
      name: "Iron",
      isDecoy: false,
      icon: "/static/images/icons/opt/nail.png",
      badge: "Magnetic",
      clue: "Sticks to magnets and forms reddish-brown rust.",
      fact: "Iron is magnetic and reacts with moisture to form rust."
    },
    copper: {
      id: "copper",
      name: "Copper",
      isDecoy: false,
      icon: "/static/images/icons/opt/broken_wire.png",
      badge: "Electric Wires",
      clue: "Reddish-orange metal that powers electric wires.",
      fact: "Copper is non-magnetic and conducts electricity inside wires."
    },
    gold: {
      id: "gold",
      name: "Gold",
      isDecoy: false,
      icon: "/static/images/icons/opt/gold_coin.png",
      badge: "Shiny Yellow",
      clue: "Shiny yellow metal that never rusts or tarnishes.",
      fact: "Gold stays shiny forever and never rusts or tarnishes."
    },
    silver: {
      id: "silver",
      name: "Silver",
      isDecoy: false,
      icon: "/static/images/icons/opt/silver_medal.png",
      badge: "Shiny Medals",
      clue: "Shiny silver metal crafted into medals and spoons.",
      fact: "Silver has a brilliant silver-white luster and high conductivity."
    },
    aluminum: {
      id: "aluminum",
      name: "Aluminum",
      isDecoy: false,
      icon: "/static/images/icons/opt/aluminum_can.png",
      badge: "Drink Cans",
      clue: "Lightweight silvery metal for drink cans; not magnetic.",
      fact: "Aluminum is silvery and lightweight, but not magnetic!"
    },
    steel: {
      id: "steel",
      name: "Steel",
      isDecoy: false,
      icon: "/static/images/icons/opt/paperclip.png",
      badge: "Strong Alloy",
      clue: "Strong magnetic metal alloy for bridge beams and clips.",
      fact: "Steel is a magnetic alloy of iron made for heavy strength."
    },
    tin: {
      id: "tin",
      name: "Tin",
      isDecoy: false,
      icon: "/static/images/icons/opt/canned_food.png",
      badge: "Food Cans",
      clue: "Soft metal used to coat and protect food cans.",
      fact: "Tin coats food cans to keep meals safe and prevent rust."
    },
    stainless_steel: {
      id: "stainless_steel",
      name: "Stainless Steel",
      isDecoy: false,
      icon: "/static/images/icons/opt/spoon.png",
      badge: "Rust-Proof",
      clue: "Rust-proof metal for dining spoons and cooking pots.",
      fact: "Stainless steel stays shiny in water and does not rust."
    },
    wrought_iron: {
      id: "wrought_iron",
      name: "Wrought Iron",
      isDecoy: false,
      icon: "/static/images/icons/opt/gate.png",
      badge: "Heavy Forged",
      clue: "Heavy forged metal for tough garden gates.",
      fact: "Wrought iron is forged by blacksmiths into outdoor gates."
    },
    gold_jewelry: {
      id: "gold_jewelry",
      name: "Gold Jewelry",
      isDecoy: false,
      icon: "/static/images/icons/opt/gold_ring.png",
      badge: "Precious Rings",
      clue: "Precious yellow metal shaped into glittering rings.",
      fact: "Gold is shaped into valuable jewelry that never tarnishes."
    },

    // --- Confusing Decoys / Non-Metals ---
    plastic_plug: {
      id: "plastic_plug",
      name: "Plastic Plug",
      isDecoy: true,
      icon: "/static/images/icons/opt/plug.png",
      badge: "Insulator",
      wrongFeedback: "Plastic is an insulator, not a metal conductor!"
    },
    glass_jar: {
      id: "glass_jar",
      name: "Glass Jar",
      isDecoy: true,
      icon: "/static/images/icons/opt/glass_jar.png",
      badge: "Non-Metal",
      wrongFeedback: "Glass is brittle and transparent, not a metal!"
    },
    wood_shield: {
      id: "wood_shield",
      name: "Wood Shield",
      isDecoy: true,
      icon: "/static/images/icons/opt/shield.png",
      badge: "Non-Metal",
      wrongFeedback: "Wood comes from trees and is not a metal!"
    },
    cardboard_box: {
      id: "cardboard_box",
      name: "Cardboard Box",
      isDecoy: true,
      icon: "/static/images/icons/opt/box.png",
      badge: "Non-Metal",
      wrongFeedback: "Cardboard is made of plant fibers, not metal!"
    }
  };

  const LEVELS = [
    {
      levelNum: 1,
      name: "Level 1",
      clueCount: 4,
      metalsPool: ["iron", "copper", "gold", "silver", "aluminum"],
      decoys: ["plastic_plug"]
    },
    {
      levelNum: 2,
      name: "Level 2",
      clueCount: 6,
      metalsPool: ["iron", "copper", "gold", "silver", "aluminum", "steel", "tin"],
      decoys: ["plastic_plug", "glass_jar"]
    },
    {
      levelNum: 3,
      name: "Level 3",
      clueCount: 9,
      metalsPool: ["iron", "copper", "gold", "silver", "aluminum", "steel", "tin", "stainless_steel", "wrought_iron", "gold_jewelry"],
      decoys: ["plastic_plug", "wood_shield", "cardboard_box"]
    }
  ];

  let currentLevelIdx = 0;
  let score = 100;
  let hintsUsed = 0;
  let startTime = performance.now();
  let currentLevelData = []; // array of { boxNum: 1, metal: obj, correctMetalId: str }
  let currentShelfIds = []; // array of metal and decoy IDs shown on choice shelf
  let userAnswers = {}; // { 1: itemId, 2: itemId, ... }
  let activeBoxIndex = 1;
  let objectLogs = [];

  // DOM Elements
  const hudLevelText = document.getElementById("hud-level-text");
  const hudScoreVal = document.getElementById("hud-score-val");
  const mysteryGrid = document.getElementById("mystery-clues-grid");
  const metalChoiceRow = document.getElementById("metal-choice-row");
  const hintToast = document.getElementById("logic-hint-toast");
  const hintMessage = document.getElementById("logic-hint-message");
  const btnUseHint = document.getElementById("btn-use-hint");
  const btnSubmit = document.getElementById("btn-submit-deduction");
  const btnClearAll = document.getElementById("btn-clear-all-boxes");
  const btnShelfLeft = document.getElementById("btn-shelf-scroll-left");
  const btnShelfRight = document.getElementById("btn-shelf-scroll-right");

  btnShelfLeft?.addEventListener("click", () => {
    metalChoiceRow?.scrollBy({ left: -180, behavior: "smooth" });
  });

  btnShelfRight?.addEventListener("click", () => {
    metalChoiceRow?.scrollBy({ left: 180, behavior: "smooth" });
  });

  // Cheerful, high-contrast themes for clues
  const CLUE_THEMES = [
    { bg: '#f0f9ff', border: '#0284c7', badgeBg: '#0284c7', qBg: '#e0f2fe', dashBorder: '#38bdf8' }, // 1: Sky Blue
    { bg: '#f0fdf4', border: '#059669', badgeBg: '#059669', qBg: '#dcfce7', dashBorder: '#34d399' }, // 2: Emerald Green
    { bg: '#fffbeb', border: '#d97706', badgeBg: '#d97706', qBg: '#fef3c7', dashBorder: '#fbbf24' }, // 3: Warm Amber
    { bg: '#faf5ff', border: '#7c3aed', badgeBg: '#7c3aed', qBg: '#f3e8ff', dashBorder: '#a78bfa' }, // 4: Royal Purple
    { bg: '#fff1f2', border: '#e11d48', badgeBg: '#e11d48', qBg: '#ffe4e6', dashBorder: '#fb7185' }, // 5: Coral Rose
    { bg: '#f0fdfa', border: '#0d9488', badgeBg: '#0d9488', qBg: '#ccfbf1', dashBorder: '#2dd4bf' }, // 6: Deep Teal
    { bg: '#fff7ed', border: '#ea580c', badgeBg: '#ea580c', qBg: '#ffedd5', dashBorder: '#fb923c' }, // 7: Tangerine Orange
    { bg: '#eef2ff', border: '#4f46e5', badgeBg: '#4f46e5', qBg: '#e0e7ff', dashBorder: '#818cf8' }, // 8: Indigo Navy
    { bg: '#fdf2f8', border: '#db2777', badgeBg: '#db2777', qBg: '#fce7f3', dashBorder: '#f472b6' }, // 9: Berry Pink
  ];

  // Modals
  const metalPickerModalEl = document.getElementById("metalPickerModal");
  const metalPickerModal = metalPickerModalEl ? new bootstrap.Modal(metalPickerModalEl) : null;
  const modalPickerTitle = document.getElementById("modal-picker-title");
  const modalPickerClueText = document.getElementById("modal-picker-clue-text");
  const modalPickerOptions = document.getElementById("modal-picker-options");

  const levelUpModalEl = document.getElementById("levelUpModal");
  const levelUpModal = levelUpModalEl ? new bootstrap.Modal(levelUpModalEl) : null;
  const btnNextLevel = document.getElementById("btn-next-level");

  const roundReviewModalEl = document.getElementById("roundReviewModal");
  const roundReviewModal = roundReviewModalEl ? new bootstrap.Modal(roundReviewModalEl) : null;
  const roundReviewList = document.getElementById("round-review-list");
  const roundReviewSubtitle = document.getElementById("round-review-subtitle");
  const btnReviewContinue = document.getElementById("btn-review-continue");

  const victoryModalEl = document.getElementById("victoryModal");
  const victoryModal = victoryModalEl ? new bootstrap.Modal(victoryModalEl) : null;
  const btnPlayAgain = document.getElementById("btn-play-again");

  function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function setupLevel(lvlIdx) {
    currentLevelIdx = lvlIdx;
    const config = LEVELS[currentLevelIdx];

    // Update HUD level text
    if (hudLevelText) hudLevelText.textContent = `Level ${currentLevelIdx + 1} / ${LEVELS.length}`;
    document.querySelectorAll(".level-dot").forEach((dot, idx) => {
      dot.classList.remove("active", "completed");
      if (idx < currentLevelIdx) dot.classList.add("completed");
      if (idx === currentLevelIdx) dot.classList.add("active");
    });

    // Pick random metals for clues
    const shuffledMetals = shuffle(config.metalsPool);
    const chosenMetalIds = shuffledMetals.slice(0, config.clueCount);

    currentLevelData = chosenMetalIds.map((mId, index) => {
      return {
        boxNum: index + 1,
        metal: ITEMS_BANK[mId],
        correctMetalId: mId
      };
    });

    // Build choice shelf: chosen metals + extra pool metals + decoys, shuffled
    const remainingMetals = shuffledMetals.slice(config.clueCount);
    currentShelfIds = shuffle([...chosenMetalIds, ...remainingMetals, ...config.decoys]);

    userAnswers = {};
    activeBoxIndex = 1;

    renderMysteryGrid();
    renderChoiceShelf();

    if (hintToast) hintToast.style.display = "none";
  }

  function renderMysteryGrid() {
    if (!mysteryGrid) return;
    mysteryGrid.innerHTML = "";

    const count = currentLevelData.length;
    if (count <= 4) {
      mysteryGrid.style.gridTemplateColumns = `repeat(4, minmax(0, 1fr))`;
      mysteryGrid.className = "mystery-clues-grid mystery-clues-grid--compact grid-cols-4";
    } else if (count <= 6) {
      mysteryGrid.style.gridTemplateColumns = `repeat(3, minmax(0, 1fr))`;
      mysteryGrid.className = "mystery-clues-grid mystery-clues-grid--compact grid-cols-6";
    } else {
      mysteryGrid.style.gridTemplateColumns = `repeat(3, minmax(0, 1fr))`;
      mysteryGrid.className = "mystery-clues-grid mystery-clues-grid--compact grid-cols-9";
    }

    currentLevelData.forEach((item) => {
      const theme = CLUE_THEMES[(item.boxNum - 1) % CLUE_THEMES.length];
      const colEl = document.createElement("div");
      colEl.className = "mystery-column";
      colEl.id = `mystery-col-${item.boxNum}`;
      colEl.style.backgroundColor = theme.bg;

      const answeredItemId = userAnswers[item.boxNum];
      const answeredItem = answeredItemId ? ITEMS_BANK[answeredItemId] : null;

      colEl.innerHTML = `
        <div class="mystery-header-badge" style="background:${theme.badgeBg}; border-color:#18181b;" title="Clue #${item.boxNum}">
          ${item.boxNum}
        </div>

        <div class="mystery-question-box" style="background:${theme.qBg}; border-color:${theme.border};">
          <p class="mystery-question-text">"${item.metal.clue}"</p>
        </div>

        <div class="mystery-answer-box ${item.boxNum === activeBoxIndex ? 'active-box' : ''} ${answeredItem ? 'filled-box' : ''}" 
             style="${answeredItem ? '' : `border-color:${theme.dashBorder}; background:#ffffff;`}"
             id="mystery-box-${item.boxNum}" 
             data-box="${item.boxNum}"
             title="Tap to place or change metal for Clue #${item.boxNum}">
          ${
            answeredItem
              ? `
              <div class="mystery-filled-content">
                <img src="${answeredItem.icon}" alt="" aria-hidden="true" class="mystery-filled-img" width="38" height="38">
                <h4 class="mystery-filled-name ${answeredItem.isDecoy ? 'text-danger' : ''}">${answeredItem.name}</h4>
                <span class="mystery-change-tag"><i class="bi bi-arrow-repeat me-1"></i>Tap to change</span>
              </div>
            `
              : `
              <div class="mystery-empty-prompt">
                <i class="bi bi-box-seam mystery-empty-icon" style="color:${theme.border};"></i>
                <span style="color:${theme.border};">Drop / Tap</span>
              </div>
            `
          }
        </div>
      `;

      mysteryGrid.appendChild(colEl);
    });

    // Attach click and drag-drop listeners to answer boxes
    mysteryGrid.querySelectorAll(".mystery-answer-box").forEach((box) => {
      const boxNum = parseInt(box.getAttribute("data-box"), 10);

      // Tap click handler: open picker modal
      box.addEventListener("click", () => {
        setActiveBox(boxNum);
        openPickerModal(boxNum);
      });

      // Desktop HTML5 Drag & Drop
      box.addEventListener("dragover", (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      });

      box.addEventListener("dragenter", (e) => {
        e.preventDefault();
        box.classList.add("drag-over");
      });

      box.addEventListener("dragleave", () => {
        box.classList.remove("drag-over");
      });

      box.addEventListener("drop", (e) => {
        e.preventDefault();
        box.classList.remove("drag-over");
        const itemId = e.dataTransfer.getData("text/plain");
        if (itemId && ITEMS_BANK[itemId]) {
          assignItemToBox(boxNum, itemId);
        }
      });
    });
  }

  function renderChoiceShelf() {
    if (!metalChoiceRow) return;
    metalChoiceRow.innerHTML = "";

    currentShelfIds.forEach((itemId) => {
      const item = ITEMS_BANK[itemId];
      const assignedBoxEntry = Object.entries(userAnswers).find(([, id]) => id === itemId);
      const isUsed = Boolean(assignedBoxEntry);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `metal-choice-btn ${isUsed ? "used" : ""}`;
      btn.draggable = true;
      btn.setAttribute("data-item", itemId);
      btn.title = isUsed ? `${item.name} is placed in Clue #${assignedBoxEntry[0]}. Tap to focus.` : `Select ${item.name}`;
      btn.innerHTML = `
        <img src="${item.icon}" alt="" aria-hidden="true" width="26" height="26">
        <span>${item.name}</span>
      `;

      // HTML5 Drag
      btn.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", itemId);
        e.dataTransfer.effectAllowed = "move";
      });

      // Tablet Touch Drag
      let touchStartX = 0;
      let touchStartY = 0;
      let isTouchDragging = false;
      let ghostEl = null;

      btn.addEventListener("touchstart", (e) => {
        const touch = e.touches[0];
        touchStartX = touch.clientX;
        touchStartY = touch.clientY;
        isTouchDragging = false;
      }, { passive: true });

      btn.addEventListener("touchmove", (e) => {
        const touch = e.touches[0];
        const dx = touch.clientX - touchStartX;
        const dy = touch.clientY - touchStartY;

        // Only initiate drag-drop ghost when dragging upwards towards the puzzle board
        // If the gesture is horizontal (|dx| >= |dy|), allow the choice shelf to scroll naturally!
        if (!isTouchDragging && dy < -14 && Math.abs(dy) > Math.abs(dx) * 1.1) {
          isTouchDragging = true;
          btn.classList.add("dragging");

          ghostEl = document.createElement("div");
          ghostEl.className = "metal-touch-ghost";
          ghostEl.innerHTML = `
            <img src="${item.icon}" alt="" aria-hidden="true" width="38" height="38">
            <span>${item.name}</span>
          `;
          ghostEl.style.left = `${touch.clientX}px`;
          ghostEl.style.top = `${touch.clientY}px`;
          document.body.appendChild(ghostEl);
        }

        if (isTouchDragging && ghostEl) {
          e.preventDefault();
          ghostEl.style.left = `${touch.clientX}px`;
          ghostEl.style.top = `${touch.clientY}px`;

          const targetBox = findBoxUnderTouch(touch.clientX, touch.clientY);
          mysteryGrid?.querySelectorAll(".mystery-answer-box").forEach((b) => {
            if (b === targetBox) {
              b.classList.add("drag-over");
            } else {
              b.classList.remove("drag-over");
            }
          });
        }
      }, { passive: false });

      const cleanupTouchDrag = () => {
        if (ghostEl) {
          ghostEl.remove();
          ghostEl = null;
        }
        btn.classList.remove("dragging");
        isTouchDragging = false;
      };

      btn.addEventListener("touchend", () => {
        if (isTouchDragging) {
          const hoveredBox = mysteryGrid?.querySelector(".mystery-answer-box.drag-over");
          if (hoveredBox) {
            hoveredBox.classList.remove("drag-over");
            const boxNum = parseInt(hoveredBox.getAttribute("data-box"), 10);
            assignItemToBox(boxNum, itemId);
          }
          cleanupTouchDrag();
        } else {
          cleanupTouchDrag();
          // Tapped choice:
          if (isUsed && assignedBoxEntry) {
            // Already placed: focus on that box
            setActiveBox(parseInt(assignedBoxEntry[0], 10));
            playSound('pop');
          } else {
            assignItemToActiveBox(itemId);
          }
        }
      });

      btn.addEventListener("touchcancel", cleanupTouchDrag);

      btn.addEventListener("click", () => {
        if (isUsed && assignedBoxEntry) {
          setActiveBox(parseInt(assignedBoxEntry[0], 10));
          playSound('pop');
        } else {
          assignItemToActiveBox(itemId);
        }
      });

      metalChoiceRow.appendChild(btn);
    });
  }

  function findBoxUnderTouch(clientX, clientY) {
    const boxes = mysteryGrid?.querySelectorAll(".mystery-answer-box");
    if (!boxes) return null;

    for (const box of boxes) {
      const rect = box.getBoundingClientRect();
      const margin = 20;
      if (
        clientX >= rect.left - margin &&
        clientX <= rect.right + margin &&
        clientY >= rect.top - margin &&
        clientY <= rect.bottom + margin
      ) {
        return box;
      }
    }
    return null;
  }

  function setActiveBox(boxNum) {
    activeBoxIndex = boxNum;
    mysteryGrid?.querySelectorAll(".mystery-answer-box").forEach((box) => {
      const bNum = parseInt(box.getAttribute("data-box"), 10);
      box.classList.toggle("active-box", bNum === activeBoxIndex);
    });
  }

  function assignItemToBox(boxNum, itemId) {
    // If this item was in another box, clear it from that box so it moves cleanly
    Object.keys(userAnswers).forEach((b) => {
      if (userAnswers[b] === itemId && parseInt(b, 10) !== boxNum) {
        delete userAnswers[b];
      }
    });

    userAnswers[boxNum] = itemId;
    playSound('pop');
    setActiveBox(boxNum);

    renderMysteryGrid();
    renderChoiceShelf();

    // Move to next empty box
    const nextEmpty = currentLevelData.find((d) => !userAnswers[d.boxNum]);
    if (nextEmpty) {
      setActiveBox(nextEmpty.boxNum);
    }
  }

  function assignItemToActiveBox(itemId) {
    if (!activeBoxIndex) activeBoxIndex = 1;
    assignItemToBox(activeBoxIndex, itemId);
  }

  function openPickerModal(boxNum) {
    if (!metalPickerModal) return;

    const itemData = currentLevelData.find((d) => d.boxNum === boxNum);
    if (!itemData) return;

    if (modalPickerTitle) modalPickerTitle.textContent = `Choose Item for Clue #${boxNum}`;
    if (modalPickerClueText) modalPickerClueText.textContent = `"${itemData.metal.clue}"`;

    if (modalPickerOptions) {
      modalPickerOptions.innerHTML = "";

      // Option to remove item if box is currently filled
      if (userAnswers[boxNum]) {
        const removeBtn = document.createElement("button");
        removeBtn.type = "button";
        removeBtn.className = "btn btn-outline-danger fw-bold rounded-pill w-100 mb-2 py-1";
        removeBtn.innerHTML = `<i class="bi bi-trash3 me-1"></i> Empty / Remove Item from Box #${boxNum}`;
        removeBtn.addEventListener("click", () => {
          delete userAnswers[boxNum];
          playSound('pop');
          renderMysteryGrid();
          renderChoiceShelf();
          metalPickerModal.hide();
        });
        modalPickerOptions.appendChild(removeBtn);
      }

      currentShelfIds.forEach((itemId) => {
        const item = ITEMS_BANK[itemId];
        const isSelected = userAnswers[boxNum] === itemId;
        const placedInBox = Object.keys(userAnswers).find(b => userAnswers[b] === itemId);
        const isPlacedElsewhere = placedInBox && parseInt(placedInBox, 10) !== boxNum;

        const optBtn = document.createElement("button");
        optBtn.type = "button";
        let stateClass = "";
        if (isSelected) {
          stateClass = "selected";
        } else if (isPlacedElsewhere) {
          stateClass = "already-placed";
        }

        optBtn.className = `picker-card-tile ${stateClass}`;
        optBtn.innerHTML = `
          <div class="picker-tile-top">
            <img src="${item.icon}" alt="" aria-hidden="true" class="picker-tile-img" width="56" height="56">
            ${isSelected ? '<span class="picker-tile-check"><i class="bi bi-check-circle-fill"></i></span>' : ''}
            ${isPlacedElsewhere ? `<span class="picker-tile-placed-badge" title="Already in Box #${placedInBox}"><i class="bi bi-pin-map-fill"></i> #${placedInBox}</span>` : ''}
          </div>
          <div class="picker-tile-name">${item.name}</div>
          <div class="picker-tile-badge">${item.badge}</div>
          ${isPlacedElsewhere ? `<div class="picker-tile-in-use-tag"><i class="bi bi-check2-circle me-1"></i>In Box #${placedInBox}</div>` : ''}
          ${isSelected ? `<div class="picker-tile-current-tag"><i class="bi bi-check-circle-fill me-1"></i>Current Choice</div>` : ''}
        `;

        optBtn.addEventListener("click", () => {
          assignItemToBox(boxNum, itemId);
          metalPickerModal.hide();
        });

        modalPickerOptions.appendChild(optBtn);
      });
    }

    metalPickerModal.show();
  }

  btnClearAll?.addEventListener("click", () => {
    userAnswers = {};
    activeBoxIndex = 1;
    playSound('pop');
    renderMysteryGrid();
    renderChoiceShelf();
  });

  // Hint Logic
  btnUseHint?.addEventListener("click", () => {
    let target = currentLevelData.find((d) => userAnswers[d.boxNum] !== d.correctMetalId);

    hintsUsed++;
    score = Math.max(25, score - 5);
    if (hudScoreVal) hudScoreVal.textContent = score;

    if (target) {
      setActiveBox(target.boxNum);
      const boxEl = document.getElementById(`mystery-box-${target.boxNum}`);
      if (boxEl) {
        boxEl.classList.add("cell-hint-glow");
        setTimeout(() => boxEl.classList.remove("cell-hint-glow"), 5000);
      }

      const metal = target.metal;
      if (hintToast && hintMessage) {
        hintMessage.textContent = `Hint for Clue #${target.boxNum}: ${metal.fact} Try ${metal.name}!`;
        hintToast.style.display = "block";
      }
    } else {
      if (hintToast && hintMessage) {
        hintMessage.textContent = `All boxes are correctly filled! Press 'Check Answers!' to proceed.`;
        hintToast.style.display = "block";
      }
    }
  });

  // Check deduction answers
  btnSubmit?.addEventListener("click", () => {
    checkAnswers();
  });

  function checkAnswers() {
    // 1. Check if all boxes are filled
    const unfilled = currentLevelData.some((d) => !userAnswers[d.boxNum]);
    if (unfilled) {
      if (hintToast && hintMessage) {
        hintMessage.textContent = `Please place an item in all ${currentLevelData.length} boxes before checking!`;
        hintToast.style.display = "block";
      }
      playSound('wrong');
      const card = document.getElementById("logic-game-card");
      card?.classList.add("shake-card");
      setTimeout(() => card?.classList.remove("shake-card"), 600);
      return;
    }

    // 2. Evaluate all answers
    let allCorrect = true;
    let mistakeCount = 0;
    const reviewItems = [];

    currentLevelData.forEach((d) => {
      const chosenItemId = userAnswers[d.boxNum];
      const isCorrect = (chosenItemId === d.correctMetalId);
      if (!isCorrect) {
        allCorrect = false;
        mistakeCount++;
      }

      // Log each clue individually for teacher analytics & missed questions tracking
      objectLogs.push({
        object_id: `${d.metal.name} Clue (Level ${currentLevelIdx + 1})`,
        was_correct: isCorrect,
        attempt_number: 1
      });

      const chosenItem = chosenItemId ? ITEMS_BANK[chosenItemId] : null;
      reviewItems.push({
        boxNum: d.boxNum,
        clue: d.metal.clue,
        chosenItem: chosenItem,
        correctItem: d.metal,
        isCorrect: isCorrect
      });
    });

    if (allCorrect) {
      playSound('correct');
    } else {
      playSound('wrong');
      score = Math.max(25, score - (mistakeCount * 5));
      if (hudScoreVal) hudScoreVal.textContent = score;
    }

    // Show Round Review Modal before moving to next level
    if (roundReviewList && roundReviewModal) {
      roundReviewList.innerHTML = "";

      reviewItems.forEach((r) => {
        const card = document.createElement("div");
        card.className = `review-item-card ${r.isCorrect ? "correct" : "incorrect"}`;
        
        if (r.isCorrect) {
          card.innerHTML = `
            <div class="review-item-badge bg-success">✓</div>
            <div class="review-item-info">
              <h5 class="review-item-title text-success">Clue #${r.boxNum}: ${r.chosenItem.name} — Correct!</h5>
              <p class="review-item-clue">"${r.clue}"</p>
            </div>
            <div class="review-item-status text-success fw-bold">
              <i class="bi bi-check-circle-fill me-1"></i> Correct
            </div>
          `;
        } else {
          card.innerHTML = `
            <div class="review-item-badge bg-danger">✗</div>
            <div class="review-item-info">
              <h5 class="review-item-title text-danger">Clue #${r.boxNum}: Placed ${r.chosenItem ? r.chosenItem.name : 'None'}</h5>
              <p class="review-item-clue">"${r.clue}"</p>
              <div class="small fw-bold text-dark mt-1">
                <i class="bi bi-lightbulb-fill text-warning me-1"></i>Fact: ${r.correctItem.name} — ${r.correctItem.fact}
              </div>
            </div>
            <div class="review-item-status text-danger fw-bold">
              <i class="bi bi-x-circle-fill me-1"></i> Missed
            </div>
          `;
        }
        roundReviewList.appendChild(card);
      });

      if (roundReviewSubtitle) {
        if (allCorrect) {
          roundReviewSubtitle.innerHTML = `<span class="text-success fw-bold">🎉 Perfect Detective Work!</span> You solved all ${currentLevelData.length} clues correctly!`;
        } else {
          roundReviewSubtitle.innerHTML = `You got <strong>${currentLevelData.length - mistakeCount} of ${currentLevelData.length}</strong> clues right. Review the clues below before continuing!`;
        }
      }

      // Continue button directly advances to the next level (or victory)
      if (btnReviewContinue) {
        const isLastLevel = (currentLevelIdx >= LEVELS.length - 1);
        if (isLastLevel) {
          btnReviewContinue.innerHTML = `<i class="bi bi-award-fill me-1"></i> See Final Detective Results`;
          btnReviewContinue.className = "btn btn-success btn-lg fw-black px-4 py-2 border-dark border-3 rounded-pill shadow";
          btnReviewContinue.onclick = () => {
            roundReviewModal.hide();
            handleVictory();
          };
        } else {
          btnReviewContinue.innerHTML = `<i class="bi bi-arrow-right-circle-fill me-1"></i> Continue to ${LEVELS[currentLevelIdx + 1].name}`;
          btnReviewContinue.className = "btn btn-warning btn-lg fw-black px-4 py-2 border-dark border-3 rounded-pill shadow";
          btnReviewContinue.onclick = () => {
            roundReviewModal.hide();
            setupLevel(currentLevelIdx + 1);
          };
        }
      }

      roundReviewModal.show();
    }
  }

  btnNextLevel?.addEventListener("click", () => {
    levelUpModal?.hide();
    setupLevel(currentLevelIdx + 1);
  });

  async function handleVictory() {
    const timeSpent = Math.max(1, Math.round((performance.now() - startTime) / 1000));
    const finalScore = score;
    const actId = window.metalGameActivityId;

    const modalScore = document.getElementById("modal-final-score");
    const modalTime = document.getElementById("modal-time-spent");
    const modalRating = document.getElementById("modal-rating");

    if (modalScore) modalScore.textContent = finalScore;
    if (modalTime) modalTime.textContent = `${timeSpent}s`;
    if (modalRating) {
      modalRating.textContent =
        finalScore >= 90
          ? "Master Detective (Top Score 90%+)"
          : finalScore >= 75
          ? "Senior Detective (75%+)"
          : "Detective (50%+)";
    }

    // Save to backend
    if (actId) {
      try {
        await fetch("/student/activity_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity_id: actId,
            score: finalScore,
            attempts: hintsUsed + 1,
            time_spent: timeSpent,
            correct_first_try: hintsUsed === 0 ? 1 : 0,
            object_logs: objectLogs
          }),
          keepalive: true
        });
      } catch (err) {
        console.warn("Could not save metal game progress:", err);
      }
    }

    victoryModal?.show();
  }

  btnPlayAgain?.addEventListener("click", () => {
    victoryModal?.hide();
    score = 100;
    hintsUsed = 0;
    if (hudScoreVal) hudScoreVal.textContent = score;
    startTime = performance.now();
    objectLogs = [];
    setupLevel(0);
  });

  // Start Level 1
  setupLevel(0);
}
