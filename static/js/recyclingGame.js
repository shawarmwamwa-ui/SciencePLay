// recyclingGame.js
// EcoSwipe: Sort the Scrap (Left = Compost, Right = Recyclable)
// Standalone arcade activity for Lesson 7 (Recycling)

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
    // Shuffle and pick 12 items
    const shuffled = shuffle(MASTER_ITEMS);
    deck = shuffled.slice(0, ROUND_SIZE);
    currentIndex = 0;
    streak = 0;
    bestStreak = 0;
    correctCount = 0;
    score = 0;
    startTime = performance.now();
    objectLogs = [];
    isAnimating = false;

    updateHUD();
    loadCard(currentIndex);

    if (feedbackBanner) feedbackBanner.style.display = "none";
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

  function resetCardPosition() {
    if (!swipeCard) return;
    swipeCard.style.transition = "transform 0.25s ease-out, opacity 0.25s";
    swipeCard.style.transform = "translate(0px, 0px) rotate(0deg)";
    swipeCard.style.opacity = "1";

    if (stampCompost) stampCompost.style.opacity = "0";
    if (stampRecycle) stampRecycle.style.opacity = "0";

    btnCompost?.classList.remove("station-hover");
    btnRecycle?.classList.remove("station-hover");
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

    btnCompost?.classList.remove("station-hover");
    btnRecycle?.classList.remove("station-hover");

    const currentItem = deck[currentIndex];
    const isCorrect = currentItem.type === direction;

    // Fly off screen
    const flyX = direction === "compost" ? -500 : 500;
    const flyRotate = direction === "compost" ? -25 : 25;

    if (swipeCard) {
      swipeCard.style.transition = "transform 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s";
      swipeCard.style.transform = `translate(${flyX}px, 40px) rotate(${flyRotate}deg)`;
      swipeCard.style.opacity = "0";
    }

    // Process outcome
    if (isCorrect) {
      streak++;
      if (streak > bestStreak) bestStreak = streak;
      correctCount++;
      // Score calculation: 7.5 base points per correct item (12 * 7.5 = 90 pts)
      // Streak bonuses: streak >= 3 (+3 pts), streak >= 6 (+3 pts), streak >= 10 (+4 pts) -> Total = 100 pts max!
      const streakBonus = streak >= 10 ? 10 : streak >= 6 ? 6 : streak >= 3 ? 3 : 0;
      score = Math.min(100, Math.round(correctCount * 7.5 + streakBonus));
      showFeedback(true, currentItem, direction);
    } else {
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
        swipeCard.style.transform = "translate(0px, 0px) scale(0.9)";
        swipeCard.style.opacity = "0";
      }

      setTimeout(() => {
        loadCard(currentIndex);
        if (swipeCard) {
          swipeCard.style.transition = "transform 0.2s ease-out, opacity 0.2s";
          swipeCard.style.transform = "translate(0px, 0px) scale(1)";
          swipeCard.style.opacity = "1";
        }
        isAnimating = false;
      }, 60);
    }, 320);
  }

  function showFeedback(isCorrect, item, chosenDirection) {
    if (!feedbackBanner || !feedbackText || !feedbackIcon) return;

    feedbackBanner.className = "ecoswipe-feedback-banner";
    if (isCorrect) {
      feedbackBanner.classList.add("feedback--correct");
      feedbackIcon.className = "bi bi-check-circle-fill me-1";

      if (item.id === "box") {
        feedbackText.textContent = "Correct! Clean boxes go to Recycling to save trees, but can be shredded for compost if soiled!";
      } else {
        feedbackText.textContent = `Spot on! ${item.name} correctly sorted into ${chosenDirection === "compost" ? "Compost" : "Recyclable"}!`;
      }
    } else {
      feedbackBanner.classList.add("feedback--wrong");
      feedbackIcon.className = "bi bi-exclamation-circle-fill me-1";

      if (item.id === "box") {
        feedbackText.textContent = "Cardboard boxes are recyclable to save paper fibers! (They can also be composted if soiled or torn into scraps).";
      } else if (item.type === "compost") {
        feedbackText.textContent = `Oops! ${item.name} is organic waste and belongs in Compost. Food waste contaminates recyclables!`;
      } else {
        feedbackText.textContent = `Oops! ${item.name} is clean scrap and belongs in Recyclable so it can be remanufactured!`;
      }
    }

    feedbackBanner.style.display = "block";
  }

  // Pointer & Drag Events
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
      swipeCard.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${rotateDeg}deg)`;

      // Update stamp opacity & station hover highlights
      if (currentX < -30) {
        const opacity = Math.min(1, Math.abs(currentX) / 120);
        if (stampCompost) stampCompost.style.opacity = opacity.toString();
        if (stampRecycle) stampRecycle.style.opacity = "0";
        btnCompost?.classList.add("station-hover");
        btnRecycle?.classList.remove("station-hover");
      } else if (currentX > 30) {
        const opacity = Math.min(1, currentX / 120);
        if (stampRecycle) stampRecycle.style.opacity = opacity.toString();
        if (stampCompost) stampCompost.style.opacity = "0";
        btnRecycle?.classList.add("station-hover");
        btnCompost?.classList.remove("station-hover");
      } else {
        if (stampCompost) stampCompost.style.opacity = "0";
        if (stampRecycle) stampRecycle.style.opacity = "0";
        btnCompost?.classList.remove("station-hover");
        btnRecycle?.classList.remove("station-hover");
      }
    });

    const endDrag = (e) => {
      if (!isDragging) return;
      isDragging = false;
      try {
        swipeCard.releasePointerCapture(e.pointerId);
      } catch (_) {}

      btnCompost?.classList.remove("station-hover");
      btnRecycle?.classList.remove("station-hover");

      // Commit threshold
      if (currentX < -75) {
        triggerSwipe("compost");
      } else if (currentX > 75) {
        triggerSwipe("recycle");
      } else {
        resetCardPosition();
      }
    };

    swipeCard.addEventListener("pointerup", endDrag);
    swipeCard.addEventListener("pointercancel", endDrag);
  }

  // Action Buttons / Stations Click Handlers
  btnCompost?.addEventListener("click", () => triggerSwipe("compost"));
  btnRecycle?.addEventListener("click", () => triggerSwipe("recycle"));

  // Keyboard accessibility for stations
  [btnCompost, btnRecycle].forEach((btn) => {
    btn?.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        btn.click();
      }
    });
  });

  async function finishGame() {
    const timeSpent = Math.max(1, Math.round((performance.now() - startTime) / 1000));
    const finalScore = Math.min(100, correctCount > 0 ? Math.max(20, score) : 0);
    const actId = window.recyclingGameActivityId;

    const modalScore = document.getElementById("modal-final-score");
    const modalStreak = document.getElementById("modal-best-streak");
    const modalTime = document.getElementById("modal-time-spent");
    const modalRating = document.getElementById("modal-rating");

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

    // Save to backend
    if (actId) {
      try {
        await fetch("/student/activity_progress", {
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
      } catch (err) {
        console.warn("Could not save recycling game progress:", err);
      }
    }

    victoryModal?.show();
  }

  btnPlayAgain?.addEventListener("click", () => {
    victoryModal?.hide();
    startNewGame();
  });

  // Start game on init
  startNewGame();
}
