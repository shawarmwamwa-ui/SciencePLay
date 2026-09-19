// recyclingGame.js
// EcoSwipe: Sort the Scrap (Left = Compost, Right = Recyclable)
// Standalone arcade activity for Lesson 7 (Recycling)

import { playVoicePrompt } from './ttsHelper.js';

export function initRecyclingGame() {
  const MASTER_ITEMS = [
    // Recyclable Items (Clean Manufactured Materials)
    {
      id: "plastic_bottle",
      name: "Plastic Bottle",
      type: "recycle",
      img: "/static/images/icons/opt/plastic_bottle.png",
      fact: "Clean plastic bottles can be melted and remade into new bottles and sturdy park benches."
    },
    {
      id: "shampoo",
      name: "Shampoo Bottle",
      type: "recycle",
      img: "/static/images/icons/opt/shampoo.png",
      fact: "Rinsed plastic bottles can be collected and recycled into new containers and toys."
    },
    {
      id: "milk",
      name: "Plastic Milk Jug",
      type: "recycle",
      img: "/static/images/icons/opt/milk.png",
      fact: "Clean plastic jugs are recycled into durable outdoor furniture, trash bins, and new jugs."
    },
    {
      id: "glass_bottle",
      name: "Glass Bottle",
      type: "recycle",
      img: "/static/images/icons/opt/glass_bottle.png",
      fact: "Clean glass can be melted and recycled again and again to make fresh new bottles and jars."
    },
    {
      id: "glass_jar",
      name: "Glass Pickle Jar",
      type: "recycle",
      img: "/static/images/icons/opt/glass_jar.png",
      fact: "Clean glass jars are melted in hot furnaces to be reshaped into new food containers."
    },
    {
      id: "aluminum_can",
      name: "Aluminum Soda Can",
      type: "recycle",
      img: "/static/images/icons/opt/aluminum_can.png",
      fact: "Metal soda cans are melted down quickly and recycled into brand new aluminum cans."
    },
    {
      id: "canned_food",
      name: "Tin Food Can",
      type: "recycle",
      img: "/static/images/icons/opt/canned_food.png",
      fact: "Clean metal food cans can easily be melted and recycled into new steel and metal products."
    },
    {
      id: "bottle_cap",
      name: "Metal Bottle Cap",
      type: "recycle",
      img: "/static/images/icons/opt/bottle_cap.png",
      fact: "Metal caps and lids are gathered and melted down to create fresh metal goods."
    },
    {
      id: "box",
      name: "Cardboard Box",
      type: "recycle",
      img: "/static/images/icons/opt/box.png",
      fact: "Clean cardboard boxes are recycled into new paper packaging, or composted if soiled."
    },
    {
      id: "cereal",
      name: "Cereal Box",
      type: "recycle",
      img: "/static/images/icons/opt/cereal.png",
      fact: "Clean cardboard cereal boxes can be recycled to produce new paper and packaging."
    },
    {
      id: "newspaper",
      name: "Daily Newspaper",
      type: "recycle",
      img: "/static/images/icons/opt/newspaper.png",
      fact: "Clean paper newspapers are recycled into new writing sheets, notebooks, and egg cartons."
    },
    {
      id: "paper",
      name: "Notebook Paper",
      type: "recycle",
      img: "/static/images/icons/opt/paper.png",
      fact: "Clean paper sheets can easily be recycled into fresh notebooks, books, and drawing pads."
    },

    // Compostable / Organic Items (Food & Plant Scraps)
    {
      id: "banana_peel",
      name: "Banana Peel",
      type: "compost",
      img: "/static/images/icons/opt/banana_peel.png",
      fact: "Fruit peels break down naturally in the ground to create healthy, nutrient-rich soil for plants."
    },
    {
      id: "apple_core",
      name: "Apple Core",
      type: "compost",
      img: "/static/images/icons/opt/apple_core.png",
      fact: "Leftover fruit scraps decompose quickly and feed helpful worms and microbes in garden compost."
    },
    {
      id: "watermelon",
      name: "Watermelon Rind",
      type: "compost",
      img: "/static/images/icons/opt/watermelon.png",
      fact: "Juicy fruit rinds break down naturally, adding helpful moisture and minerals to compost soil."
    },
    {
      id: "lemon",
      name: "Lemon Rind",
      type: "compost",
      img: "/static/images/icons/opt/lemon.png",
      fact: "Citrus peels rot naturally in compost piles and return organic nutrients back into the earth."
    },
    {
      id: "carrot",
      name: "Carrot Tops",
      type: "compost",
      img: "/static/images/icons/opt/carrot.png",
      fact: "Vegetable scrap trimmings decompose quickly, helping garden plants and flowers grow strong."
    },
    {
      id: "bread",
      name: "Bread Crust",
      type: "compost",
      img: "/static/images/icons/opt/bread.png",
      fact: "Old leftover bread crusts break down naturally into organic compost to nourish garden soil."
    },
    {
      id: "eggshell",
      name: "Crushed Eggshell",
      type: "compost",
      img: "/static/images/icons/opt/eggshell.png",
      fact: "Crushed eggshells decompose into natural minerals that help garden tomatoes and flowers thrive."
    },
    {
      id: "fish_bone",
      name: "Fish Bone Scrap",
      type: "compost",
      img: "/static/images/icons/opt/fish_bone.png",
      fact: "Natural food scraps break down safely in compost piles into rich fertilizer for soil."
    },
    {
      id: "leaves",
      name: "Dry Autumn Leaves",
      type: "compost",
      img: "/static/images/icons/opt/leaves.png",
      fact: "Dry fallen leaves break down naturally to protect garden soil and keep it healthy."
    }
  ];

  const ROUND_SIZE = 12;
  let deck = [];
  let currentIndex = 0;
  let streak = 0;
  let bestStreak = 0;
  let correctCount = 0;
  let score = 0;
  let startTime = performance.now();
  let objectLogs = [];
  let isAnimating = false;

  // Drag physics state
  let isDragging = false;
  let startX = 0;
  let startY = 0;
  let currentX = 0;
  let currentY = 0;

  // DOM Elements
  const hudCounter = document.getElementById("hud-card-counter");
  const hudScore = document.getElementById("hud-score-val");
  const hudStreak = document.getElementById("hud-streak-val");
  const swipeCard = document.getElementById("swipe-card");
  const cardImg = document.getElementById("card-img");
  const cardTitle = document.getElementById("card-title");
  const cardFact = document.getElementById("card-fact");
  const stampCompost = document.getElementById("stamp-compost");
  const stampRecycle = document.getElementById("stamp-recycle");

  const btnCompost = document.getElementById("btn-swipe-compost");
  const btnRecycle = document.getElementById("btn-swipe-recycle");

  const feedbackBanner = document.getElementById("ecoswipe-feedback");
  const feedbackIcon = document.getElementById("feedback-icon");
  const feedbackText = document.getElementById("feedback-text");

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

  function startNewGame() {
    let activeElapsedSeconds = 0;
    let lastTickTime = Date.now();
    let timerPaused = false;

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          timerPaused = true;
          activeElapsedSeconds += Math.max(0, Math.round((Date.now() - lastTickTime) / 1000));
        } else {
          timerPaused = false;
          lastTickTime = Date.now();
        }
      });
    }

    function getActiveElapsedSeconds() {
      if (timerPaused) return activeElapsedSeconds;
      return activeElapsedSeconds + Math.max(0, Math.round((Date.now() - lastTickTime) / 1000));
    }

    // Shuffle and pick 12 items
    const shuffled = shuffle(MASTER_ITEMS);
    deck = shuffled.slice(0, ROUND_SIZE);
    currentIndex = 0;
    streak = 0;
    bestStreak = 0;
    correctCount = 0;
    score = 0;
    activeElapsedSeconds = 0;
    lastTickTime = Date.now();
    timerPaused = false;
    objectLogs = [];
    isAnimating = false;

    updateHUD();
    loadCard(currentIndex);

    if (feedbackBanner) feedbackBanner.style.display = "none";
    playVoicePrompt('recycle_intro', 'Swipe left for Compost, and swipe right for Recycling!');
  }

  function loadCard(index) {
    if (index >= deck.length) {
      finishGame();
      return;
    }

    const item = deck[index];
    if (cardImg) {
      cardImg.src = item.img;
      cardImg.alt = "";
      cardImg.setAttribute("aria-hidden", "true");
    }
    if (cardTitle) cardTitle.textContent = item.name;
    if (cardFact) cardFact.textContent = item.fact;

    // Reset card transform and stamps
    resetCardPosition();
    updateHUD();
  }

  // Web Audio synthesizer for instant sound effects
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
        gain.gain.setValueAtTime(0.16, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);
        osc.start(now);
        osc.stop(now + 0.28);
      }
    } catch (_) {}
  }

  function resetCardPosition() {
    if (!swipeCard) return;
    swipeCard.style.transition = "transform 0.22s ease-out, opacity 0.22s";
    swipeCard.style.transform = "translate3d(0px, 0px, 0px) rotate(0deg)";
    swipeCard.style.opacity = "1";

    if (stampCompost) stampCompost.style.opacity = "0";
    if (stampRecycle) stampRecycle.style.opacity = "0";

    btnCompost?.classList.remove("station-hover", "bin-open");
    btnRecycle?.classList.remove("station-hover", "bin-open");
  }

  function updateHUD() {
    if (hudCounter) hudCounter.textContent = `${Math.min(currentIndex + 1, ROUND_SIZE)} / ${ROUND_SIZE}`;
    if (hudScore) hudScore.textContent = score;
    if (hudStreak) hudStreak.textContent = streak;
  }

  function triggerSwipe(direction) {
    // direction: 'compost' (left) or 'recycle' (right)
    if (isAnimating || currentIndex >= deck.length) return;
    isAnimating = true;

    // Open target bin lid
    if (direction === "compost") {
      btnCompost?.classList.add("bin-open");
      setTimeout(() => btnCompost?.classList.remove("bin-open"), 450);
    } else {
      btnRecycle?.classList.add("bin-open");
      setTimeout(() => btnRecycle?.classList.remove("bin-open"), 450);
    }

    btnCompost?.classList.remove("station-hover");
    btnRecycle?.classList.remove("station-hover");

    const currentItem = deck[currentIndex];
    const isCorrect = currentItem.type === direction;

    // Fly off screen with GPU-accelerated translate3d
    const flyX = direction === "compost" ? -460 : 460;
    const flyRotate = direction === "compost" ? -22 : 22;

    if (swipeCard) {
      swipeCard.style.transition = "transform 0.32s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.28s";
      swipeCard.style.transform = `translate3d(${flyX}px, 30px, 0) rotate(${flyRotate}deg)`;
      swipeCard.style.opacity = "0";
    }

    // Process outcome with audio
    if (isCorrect) {
      playSound('correct');
      playVoicePrompt('recycle_correct', 'Nice sort!');
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      correctCount++;
      const streakBonus = streak >= 10 ? 10 : streak >= 6 ? 6 : streak >= 3 ? 3 : 0;
      score = Math.min(100, Math.round(correctCount * 7.5 + streakBonus));
      showFeedback(true, currentItem, direction);
    } else {
      playSound('wrong');
      playVoicePrompt('recycle_wrong', 'Wrong bin! Check the item.');
      streak = 0;
      showFeedback(false, currentItem, direction);
    }

    // Record analytics log
    objectLogs.push({
      object_id: currentItem.id,
      was_correct: isCorrect,
      attempt_number: 1
    });

    // Advance to next card
    setTimeout(() => {
      currentIndex++;
      if (swipeCard) {
        swipeCard.style.transition = "none";
        swipeCard.style.transform = "translate3d(0px, 0px, 0px) scale(0.92)";
        swipeCard.style.opacity = "0";
      }

      setTimeout(() => {
        loadCard(currentIndex);
        if (swipeCard) {
          swipeCard.style.transition = "transform 0.2s ease-out, opacity 0.2s";
          swipeCard.style.transform = "translate3d(0px, 0px, 0px) scale(1)";
          swipeCard.style.opacity = "1";
        }
        isAnimating = false;
      }, 50);
    }, 300);
  }

  function showFeedback(isCorrect, item, chosenDirection) {
    if (!feedbackBanner || !feedbackText || !feedbackIcon) return;

    feedbackBanner.className = "ecoswipe-feedback-banner";
    if (isCorrect) {
      feedbackBanner.classList.add("feedback--correct");
      feedbackIcon.className = "bi bi-check-circle-fill me-1";

      if (item.id === "box") {
        feedbackText.textContent = "Correct! Clean boxes go to Recycling to save trees!";
      } else {
        feedbackText.textContent = `Spot on! ${item.name} belongs in ${chosenDirection === "compost" ? "Compost" : "Recyclable"}!`;
      }
    } else {
      feedbackBanner.classList.add("feedback--wrong");
      feedbackIcon.className = "bi bi-exclamation-circle-fill me-1";

      if (item.id === "box") {
        feedbackText.textContent = "Cardboard boxes are recyclable to save paper fibers!";
      } else if (item.type === "compost") {
        feedbackText.textContent = `Oops! ${item.name} belongs in Compost. Wet food ruins dry paper!`;
      } else {
        feedbackText.textContent = `Oops! ${item.name} belongs in Recyclable to be remade into new items!`;
      }
    }

    feedbackBanner.style.display = "block";
  }

  // Pointer & Drag Events with GPU transforms
  if (swipeCard) {
    swipeCard.addEventListener("pointerdown", (e) => {
      if (isAnimating) return;
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      currentX = 0;
      currentY = 0;
      swipeCard.setPointerCapture(e.pointerId);
      swipeCard.style.transition = "none";
    });

    swipeCard.addEventListener("pointermove", (e) => {
      if (!isDragging) return;
      currentX = e.clientX - startX;
      currentY = e.clientY - startY;

      const rotateDeg = currentX * 0.08;
      swipeCard.style.transform = `translate3d(${currentX}px, ${currentY}px, 0) rotate(${rotateDeg}deg)`;

      // Animate bin lids opening as card approaches
      if (currentX < -25) {
        const opacity = Math.min(1, Math.abs(currentX) / 100);
        if (stampCompost) stampCompost.style.opacity = opacity.toString();
        if (stampRecycle) stampRecycle.style.opacity = "0";
        btnCompost?.classList.add("bin-open");
        btnRecycle?.classList.remove("bin-open");
      } else if (currentX > 25) {
        const opacity = Math.min(1, currentX / 100);
        if (stampRecycle) stampRecycle.style.opacity = opacity.toString();
        if (stampCompost) stampCompost.style.opacity = "0";
        btnRecycle?.classList.add("bin-open");
        btnCompost?.classList.remove("bin-open");
      } else {
        if (stampCompost) stampCompost.style.opacity = "0";
        if (stampRecycle) stampRecycle.style.opacity = "0";
        btnCompost?.classList.remove("bin-open");
        btnRecycle?.classList.remove("bin-open");
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        swipeCard.releasePointerCapture(e.pointerId);
      } catch (_) {}

      btnCompost?.classList.remove("bin-open");
      btnRecycle?.classList.remove("bin-open");

      // Commit threshold
      if (currentX < -65) {
        triggerSwipe("compost");
      } else if (currentX > 65) {
        triggerSwipe("recycle");
      } else {
        resetCardPosition();
      }
    };

    swipeCard.addEventListener("pointerup", endDrag);
    swipeCard.addEventListener("pointercancel", endDrag);
  }

  // Action Stations / Bins Interaction
  // Single-tap is protected against accidental touches; requires double-tap or swipe
  let lastCompostTap = 0;
  let lastRecycleTap = 0;
  const DOUBLE_TAP_THRESHOLD_MS = 400;

  function handleBinActivation(direction) {
    if (isAnimating) return;
    const now = Date.now();
    if (direction === "compost") {
      if (now - lastCompostTap < DOUBLE_TAP_THRESHOLD_MS) {
        lastCompostTap = 0;
        triggerSwipe("compost");
      } else {
        lastCompostTap = now;
        // Visual nudge indicating single tap registered, need double-tap to commit
        btnCompost?.classList.add("bin-nudge");
        setTimeout(() => btnCompost?.classList.remove("bin-nudge"), 260);
      }
    } else if (direction === "recycle") {
      if (now - lastRecycleTap < DOUBLE_TAP_THRESHOLD_MS) {
        lastRecycleTap = 0;
        triggerSwipe("recycle");
      } else {
        lastRecycleTap = now;
        // Visual nudge indicating single tap registered, need double-tap to commit
        btnRecycle?.classList.add("bin-nudge");
        setTimeout(() => btnRecycle?.classList.remove("bin-nudge"), 260);
      }
    }
  }

  btnCompost?.addEventListener("click", () => handleBinActivation("compost"));
  btnRecycle?.addEventListener("click", () => handleBinActivation("recycle"));

  // Global Keyboard controls (Left Arrow = Compost, Right Arrow = Recycle)
  window.addEventListener("keydown", (e) => {
    if (e.target && (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA")) return;
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      triggerSwipe("compost");
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      triggerSwipe("recycle");
    }
  });

  // Keyboard accessibility for stations
  [btnCompost, btnRecycle].forEach((btn) => {
    btn?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        const dir = btn.id === "btn-swipe-compost" ? "compost" : "recycle";
        triggerSwipe(dir);
      }
    });
  });

  async function finishGame() {
    const timeSpent = Math.max(1, getActiveElapsedSeconds());
    const finalScore = Math.min(100, correctCount > 0 ? Math.max(20, score) : 0);
    const actId = window.recyclingGameActivityId;

    const modalScore = document.getElementById("modal-final-score");
    const modalStreak = document.getElementById("modal-best-streak");
    const modalTime = document.getElementById("modal-time-spent");
    const modalRating = document.getElementById("modal-rating");
    const modalStars = document.getElementById("modal-stars");
    const modalAttemptsUsed = document.getElementById("modal-attempts-used");
    const btnPlayAgain = document.getElementById("btn-play-again");

    const stars = finalScore >= 90 ? 3 : finalScore >= 60 ? 2 : 1;
    if (modalStars) modalStars.textContent = '⭐'.repeat(stars) + '☆'.repeat(3 - stars);

    if (modalScore) modalScore.textContent = finalScore;
    if (modalStreak) modalStreak.textContent = bestStreak;
    if (modalTime) modalTime.textContent = `${timeSpent}s`;
    if (modalRating) {
      modalRating.textContent =
        finalScore >= 90
          ? "Eco Master (Outstanding 90%+)"
          : finalScore >= 75
          ? "Green Guardian (Very Good 75%+)"
          : "Junior Recycler (50%+)";
    }

    let attemptsToday = typeof window.initialAttemptsToday !== 'undefined' ? Number(window.initialAttemptsToday) + 1 : 1;
    let attemptsLimit = 3;

    // Save to backend
    if (actId) {
      try {
        const res = await fetch("/student/activity_progress", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            activity_id: actId,
            score: finalScore,
            attempts: ROUND_SIZE,
            time_spent: timeSpent,
            correct_first_try: correctCount,
            object_logs: objectLogs
          }),
          keepalive: true
        });
        if (res.ok) {
          const data = await res.json();
          if (data.attempts_today !== undefined) attemptsToday = Number(data.attempts_today);
          if (data.attempts_limit !== undefined) attemptsLimit = Number(data.attempts_limit);
        }
      } catch (err) {
        console.warn("Could not save recycling game progress:", err);
      }
    }

    const left = Math.max(0, attemptsLimit - attemptsToday);
    if (modalAttemptsUsed) {
      if (attemptsToday >= attemptsLimit) {
        modalAttemptsUsed.textContent = `${attemptsToday} / ${attemptsLimit} (Daily Limit Reached)`;
        modalAttemptsUsed.className = "text-danger";
        if (btnPlayAgain) {
          btnPlayAgain.disabled = true;
          btnPlayAgain.classList.add("disabled");
          btnPlayAgain.innerHTML = `<i class="bi bi-lock-fill me-1"></i> Limit Reached (3/3)`;
        }
      } else {
        modalAttemptsUsed.textContent = `${attemptsToday} / ${attemptsLimit} (${left} left today)`;
        modalAttemptsUsed.className = "text-success";
      }
    }

    playVoicePrompt('level_complete', 'Level complete! Great job!');
    victoryModal?.show();
  }

  btnPlayAgain?.addEventListener("click", () => {
    victoryModal?.hide();
    startNewGame();
  });

  // Safe exit confirmation
  const backLink = document.getElementById("arcade-back-link");
  backLink?.addEventListener("click", (e) => {
    if (currentIndex > 0 || correctCount > 0) {
      e.preventDefault();
      const exitModalEl = document.getElementById("exitConfirmModal");
      if (exitModalEl && window.bootstrap?.Modal) {
        const modal = window.bootstrap.Modal.getOrCreateInstance(exitModalEl);
        modal.show();
      }
    }
  });

  const btnModalFinishSave = document.getElementById("btn-modal-finish-save");
  btnModalFinishSave?.addEventListener("click", () => {
    const exitModalEl = document.getElementById("exitConfirmModal");
    if (exitModalEl && window.bootstrap?.Modal) {
      const modal = window.bootstrap.Modal.getInstance(exitModalEl);
      modal?.hide();
    }
    finishGame();
  });

  // Start game on init
  startNewGame();
}
