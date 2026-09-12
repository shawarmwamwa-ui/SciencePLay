// metalLogicGame.js
// Metal Clue Detective — Clues are the questions (1, 2, 3...) & Answer Boxes hold the metal items!
// Features extra metals (Aluminum) and confusing distractors/decoys (Plastic Insulator, Glass Jar, Wood Shield).
// Full tablet touch drag-and-drop + desktop drag & tap-to-place support.
// Standalone arcade activity for Lesson 6 (Properties of Metals)

export function initMetalLogicGame() {
  const ITEMS_BANK = {
    // --- Genuine Metals ---
    iron: {
      id: "iron",
      name: "Iron",
      isDecoy: false,
      icon: "/static/images/icons/opt/nail.png",
      badge: "Magnetic & Rusts",
      clue: "I stick firmly to magnets and form reddish-brown rust when wet. What metal am I?",
      fact: "Iron is magnetic and reacts with air and water to form rust."
    },
    copper: {
      id: "copper",
      name: "Copper",
      isDecoy: false,
      icon: "/static/images/icons/opt/broken_wire.png",
      badge: "Power Cords & Wires",
      clue: "I have a warm reddish-orange color and carry electric currents safely inside household wires. What metal am I?",
      fact: "Copper is non-magnetic and is one of the best conductors of electricity."
    },
    gold: {
      id: "gold",
      name: "Gold",
      isDecoy: false,
      icon: "/static/images/icons/opt/gold_coin.png",
      badge: "Lustrous & Never Rusts",
      clue: "I have a bright yellow metallic shine and never rust or tarnish in air or water. What metal am I?",
      fact: "Gold has a brilliant yellow luster and is resistant to corrosion."
    },
    silver: {
      id: "silver",
      name: "Silver",
      isDecoy: false,
      icon: "/static/images/icons/opt/silver_medal.png",
      badge: "Silver-White & Shiny",
      clue: "I have a brilliant grayish-white shine and am crafted into champion medals and dining spoons. What metal am I?",
      fact: "Silver has a shiny silver-white luster and high electrical conductivity."
    },
    aluminum: {
      id: "aluminum",
      name: "Aluminum",
      isDecoy: false,
      icon: "/static/images/icons/opt/aluminum_can.png",
      badge: "Light & Non-Magnetic",
      clue: "I am a silvery, lightweight metal shaped into drink cans and foil. Unlike iron, I do NOT stick to magnets! What metal am I?",
      fact: "Aluminum is lightweight and silvery, but is completely non-magnetic!"
    },
    steel: {
      id: "steel",
      name: "Steel",
      isDecoy: false,
      icon: "/static/images/icons/opt/paperclip.png",
      badge: "Strong Alloy & Magnetic",
      clue: "I am an ultra-tough metal alloy made from iron and carbon, shaped into paperclips and bridge beams. I attract magnets! What metal am I?",
      fact: "Steel is a magnetic alloy of iron that is stronger and more durable than pure iron."
    },
    tin: {
      id: "tin",
      name: "Tin",
      isDecoy: false,
      icon: "/static/images/icons/opt/canned_food.png",
      badge: "Protective Food Coating",
      clue: "I am a soft, shiny metal used to coat and line food cans so they don't rust or spoil meals. What metal am I?",
      fact: "Tin is a malleable metal that resists corrosion and is widely used to coat food cans."
    },
    stainless_steel: {
      id: "stainless_steel",
      name: "Stainless Steel",
      isDecoy: false,
      icon: "/static/images/icons/opt/spoon.png",
      badge: "Rust-Proof Kitchenware",
      clue: "I am polished to a mirror shine for dining spoons and cooking pots. Water and dishwashers will NOT make me rust! What metal am I?",
      fact: "Stainless steel contains chromium, protecting dining spoons from rusting in dishwashers."
    },
    wrought_iron: {
      id: "wrought_iron",
      name: "Wrought Iron",
      isDecoy: false,
      icon: "/static/images/icons/opt/gate.png",
      badge: "Heavy Forged Metal",
      clue: "I am dark, heavy metal heated and forged into strong decorative outdoor garden gates and fences. What metal am I?",
      fact: "Wrought iron is tough and malleable, forged by blacksmiths for outdoor gates."
    },
    gold_jewelry: {
      id: "gold_jewelry",
      name: "Gold Jewelry",
      isDecoy: false,
      icon: "/static/images/icons/opt/gold_ring.png",
      badge: "Precious Yellow Metal",
      clue: "I am a precious, glittering yellow metal shaped into valuable wedding rings that never corrodes or tarnishes. What metal am I?",
      fact: "Gold is very malleable and retains its brilliant luster without corroding."
    },

    // --- Confusing Decoys / Non-Metals ---
    plastic_plug: {
      id: "plastic_plug",
      name: "Plastic Plug",
      isDecoy: true,
      icon: "/static/images/icons/opt/plug.png",
      badge: "Insulator (Non-Metal)",
      wrongFeedback: "Watch out! Plastic is an electrical insulator, not a metal conductor! It covers cables to block electric shocks."
    },
    glass_jar: {
      id: "glass_jar",
      name: "Glass Jar",
      isDecoy: true,
      icon: "/static/images/icons/opt/glass_jar.png",
      badge: "Fragile Non-Metal",
      wrongFeedback: "Careful! Glass is brittle and transparent — it is a non-metal that does not conduct electricity or attract magnets."
    },
    wood_shield: {
      id: "wood_shield",
      name: "Wood Shield",
      isDecoy: true,
      icon: "/static/images/icons/opt/shield.png",
      badge: "Organic Non-Metal",
      wrongFeedback: "Oops! Wood comes from trees and is not a metal. It does not have metallic luster or conduct electric current."
    },
    cardboard_box: {
      id: "cardboard_box",
      name: "Cardboard Box",
      isDecoy: true,
      icon: "/static/images/icons/opt/box.png",
      badge: "Paper Packaging (Non-Metal)",
      wrongFeedback: "Watch out! Cardboard is made from plant fibers, not metal. It is not magnetic and does not conduct electricity."
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

  // Modals
  const metalPickerModalEl = document.getElementById("metalPickerModal");
  const metalPickerModal = metalPickerModalEl ? new bootstrap.Modal(metalPickerModalEl) : null;
  const modalPickerTitle = document.getElementById("modal-picker-title");
  const modalPickerClueText = document.getElementById("modal-picker-clue-text");
  const modalPickerOptions = document.getElementById("modal-picker-options");

  const levelUpModalEl = document.getElementById("levelUpModal");
  const levelUpModal = levelUpModalEl ? new bootstrap.Modal(levelUpModalEl) : null;
  const btnNextLevel = document.getElementById("btn-next-level");

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

    // Update HUD with clean short level title
    if (hudLevelText) hudLevelText.textContent = `Level ${currentLevelIdx + 1} / ${LEVELS.length}`;
    document.querySelectorAll(".level-dot").forEach((dot, idx) => {
      dot.classList.remove("active", "completed");
      if (idx < currentLevelIdx) dot.classList.add("completed");
      if (idx === currentLevelIdx) dot.classList.add("active");
    });

    // Pick random metals for the clues
    const shuffledMetals = shuffle(config.metalsPool);
    const chosenMetalIds = shuffledMetals.slice(0, config.clueCount);

    currentLevelData = chosenMetalIds.map((mId, index) => {
      return {
        boxNum: index + 1,
        metal: ITEMS_BANK[mId],
        correctMetalId: mId
      };
    });

    // Build choice shelf: chosen metals + unused metals + decoys, shuffled
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
      const colEl = document.createElement("div");
      colEl.className = "mystery-column";
      colEl.id = `mystery-col-${item.boxNum}`;

      const answeredItemId = userAnswers[item.boxNum];
      const answeredItem = answeredItemId ? ITEMS_BANK[answeredItemId] : null;

      colEl.innerHTML = `
        <div class="mystery-header-badge" title="Clue #${item.boxNum}">
          ${item.boxNum}
        </div>

        <div class="mystery-question-box">
          <p class="mystery-question-text">"${item.metal.clue}"</p>
        </div>

        <div class="mystery-answer-box ${item.boxNum === activeBoxIndex ? 'active-box' : ''} ${answeredItem ? 'filled-box' : ''}" 
             id="mystery-box-${item.boxNum}" 
             data-box="${item.boxNum}"
             title="Drop or tap to select item for Clue #${item.boxNum}">
          ${
            answeredItem
              ? `
              <div class="mystery-filled-content">
                <img src="${answeredItem.icon}" alt="" aria-hidden="true" class="mystery-filled-img" width="40" height="40">
                <h4 class="mystery-filled-name ${answeredItem.isDecoy ? 'text-danger' : ''}">${answeredItem.name}</h4>
                <span class="mystery-change-tag"><i class="bi bi-arrow-repeat me-1"></i>Tap to change</span>
              </div>
            `
              : `
              <div class="mystery-empty-prompt">
                <i class="bi bi-box-seam mystery-empty-icon"></i>
                <span>Drop or Tap Metal</span>
              </div>
            `
          }
        </div>
      `;

      mysteryGrid.appendChild(colEl);
    });

    // Attach click and drag drop listeners to answer boxes
    mysteryGrid.querySelectorAll(".mystery-answer-box").forEach((box) => {
      const boxNum = parseInt(box.getAttribute("data-box"), 10);

      // Tap click handler
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
      const isUsed = Object.values(userAnswers).includes(itemId);

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `metal-choice-btn ${isUsed ? "used" : ""}`;
      btn.draggable = true;
      btn.setAttribute("data-item", itemId);
      btn.innerHTML = `
        <img src="${item.icon}" alt="" aria-hidden="true" width="38" height="38">
        <span>${item.name}</span>
      `;

      // 1. Desktop HTML5 Drag Start
      btn.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", itemId);
        btn.classList.add("dragging");
      });

      btn.addEventListener("dragend", () => {
        btn.classList.remove("dragging");
      });

      // 2. Tablet Touch Drag & Drop (Pointer / Touch Events)
      let touchStartX = 0;
      let touchStartY = 0;
      let ghostEl = null;
      let isTouchDragging = false;

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

        // Threshold to initiate drag
        if (!isTouchDragging && (Math.abs(dx) > 10 || Math.abs(dy) > 10)) {
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
          e.preventDefault(); // Prevent tablet screen scroll or gesture zoom while dragging item
          ghostEl.style.left = `${touch.clientX}px`;
          ghostEl.style.top = `${touch.clientY}px`;

          // Check if finger is hovering over any mystery answer box
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
          // Check target box with drag-over
          const hoveredBox = mysteryGrid?.querySelector(".mystery-answer-box.drag-over");
          if (hoveredBox) {
            hoveredBox.classList.remove("drag-over");
            const boxNum = parseInt(hoveredBox.getAttribute("data-box"), 10);
            assignItemToBox(boxNum, itemId);
          }
          cleanupTouchDrag();
        } else {
          cleanupTouchDrag();
          // Standard tap on item button: Assign to active box
          assignItemToActiveBox(itemId);
        }
      });

      btn.addEventListener("touchcancel", cleanupTouchDrag);

      // Desktop Click (fallback)
      btn.addEventListener("click", () => {
        assignItemToActiveBox(itemId);
      });

      metalChoiceRow.appendChild(btn);
    });
  }

  function findBoxUnderTouch(clientX, clientY) {
    const boxes = mysteryGrid?.querySelectorAll(".mystery-answer-box");
    if (!boxes) return null;

    for (const box of boxes) {
      const rect = box.getBoundingClientRect();
      const margin = 20; // generous touch hit area for tablet fingertips
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
    userAnswers[boxNum] = itemId;
    setActiveBox(boxNum);

    // Re-render
    renderMysteryGrid();
    renderChoiceShelf();

    // Auto-advance activeBoxIndex to next empty box if any
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

      currentShelfIds.forEach((itemId) => {
        const item = ITEMS_BANK[itemId];
        const isSelected = userAnswers[boxNum] === itemId;

        const optBtn = document.createElement("button");
        optBtn.type = "button";
        optBtn.className = `picker-card-tile ${isSelected ? "selected" : ""}`;
        optBtn.innerHTML = `
          <div class="picker-tile-top">
            <img src="${item.icon}" alt="" aria-hidden="true" class="picker-tile-img" width="56" height="56">
            ${isSelected ? '<span class="picker-tile-check"><i class="bi bi-check-circle-fill"></i></span>' : ''}
          </div>
          <div class="picker-tile-name">${item.name}</div>
          <div class="picker-tile-badge">${item.badge}</div>
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
    renderMysteryGrid();
    renderChoiceShelf();
  });

  // Hint Logic
  btnUseHint?.addEventListener("click", () => {
    // Find first empty or incorrectly answered box
    let target = currentLevelData.find((d) => userAnswers[d.boxNum] !== d.correctMetalId);

    // Deduct 10 points (minimum floor 25)
    hintsUsed++;
    score = Math.max(25, score - 10);
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
        hintMessage.textContent = `Hint (-10 pts) for Clue #${target.boxNum}: ${metal.fact} Choose ${metal.name}! (Beware of decoy non-metals!)`;
        hintToast.style.display = "block";
      }
    } else {
      if (hintToast && hintMessage) {
        hintMessage.textContent = `All boxes are correctly filled! Press 'Check My Answers!' to proceed.`;
        hintToast.style.display = "block";
      }
    }
  });

  function speakClue(text) {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.92;
      window.speechSynthesis.speak(utterance);
    }
  }

  // Check deduction answers
  btnSubmit?.addEventListener("click", () => {
    checkAnswers();
  });

  function checkAnswers() {
    // 1. Check if all boxes are filled
    const unfilled = currentLevelData.some((d) => !userAnswers[d.boxNum]);
    if (unfilled) {
      if (hintToast && hintMessage) {
        hintMessage.textContent = `Please drag or choose an item for all ${currentLevelData.length} clues!`;
        hintToast.style.display = "block";
      }
      const card = document.getElementById("logic-game-card");
      card?.classList.add("shake-card");
      setTimeout(() => card?.classList.remove("shake-card"), 600);
      return;
    }

    // 2. Check correctness & identify decoy mistakes
    let allCorrect = true;
    let decoyFeedback = null;

    currentLevelData.forEach((d) => {
      const boxEl = document.getElementById(`mystery-box-${d.boxNum}`);
      const chosenItemId = userAnswers[d.boxNum];

      if (chosenItemId !== d.correctMetalId) {
        allCorrect = false;
        boxEl?.classList.add("shake-card");
        setTimeout(() => boxEl?.classList.remove("shake-card"), 600);

        const chosenItem = ITEMS_BANK[chosenItemId];
        if (chosenItem && chosenItem.isDecoy && !decoyFeedback) {
          decoyFeedback = chosenItem.wrongFeedback;
        }
      }
    });

    if (allCorrect) {
      objectLogs.push({
        object_id: `level_${currentLevelIdx + 1}_clues`,
        was_correct: true,
        attempt_number: 1
      });

      if (currentLevelIdx < LEVELS.length - 1) {
        const levelUpTitle = document.getElementById("levelup-title");
        const levelUpMsg = document.getElementById("levelup-msg");
        if (levelUpTitle) levelUpTitle.textContent = `${LEVELS[currentLevelIdx].name} Solved!`;
        if (levelUpMsg) {
          levelUpMsg.textContent = `Awesome detective work! You avoided the tricky distractors and matched all metals to their clues. Ready for ${LEVELS[currentLevelIdx + 1].name}?`;
        }
        levelUpModal?.show();
      } else {
        handleVictory();
      }
    } else {
      // Deduct 5 points on wrong check (minimum floor 25)
      score = Math.max(25, score - 5);
      if (hudScoreVal) hudScoreVal.textContent = score;

      if (hintToast && hintMessage) {
        if (decoyFeedback) {
          hintMessage.textContent = `${decoyFeedback} (-5 pts penalty)`;
        } else {
          hintMessage.textContent = `Some items don't match their clues! (-5 pts) Re-read the clues carefully or use a Simple Hint.`;
        }
        hintToast.style.display = "block";
      }
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
