const lessonConfig = window.LESSON_BUILDER_CONFIG || {};
const getCsrfToken = () => lessonConfig.csrfToken || document.querySelector('input[name="csrf_token"]')?.value || '';
// Modern in-app toast
    function showBuilderToast(message, type = 'success') {
      const toastEl = document.getElementById('builderToast');
      const msgEl = document.getElementById('builderToastMessage');
      const iconEl = document.getElementById('builderToastIcon');
      if (!toastEl || !msgEl) return;

      msgEl.textContent = message;

      if (type === 'success') {
        toastEl.style.background = 'linear-gradient(135deg, #059669 0%, #10b981 100%)';
        if (iconEl) iconEl.textContent = '✨';
      } else if (type === 'warning') {
        toastEl.style.background = 'linear-gradient(135deg, #d97706 0%, #f59e0b 100%)';
        if (iconEl) iconEl.textContent = '⚠️';
      } else if (type === 'danger' || type === 'error') {
        toastEl.style.background = 'linear-gradient(135deg, #dc2626 0%, #ef4444 100%)';
        if (iconEl) iconEl.textContent = '⛔';
      } else {
        toastEl.style.background = 'linear-gradient(135deg, #1e293b 0%, #334155 100%)';
        if (iconEl) iconEl.textContent = 'ℹ️';
      }

      if (window.bootstrap?.Toast) {
        const bsToast = window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3200 });
        bsToast.show();
      }
    }

    // Default starter slide deck (Living vs Non-Living 7 slides matching exact predefined curriculum)
    const DEFAULT_SLIDES = [
      {
        id: "slide-1",
        title: "Living vs Non-Living",
        type: "concept",
        image: "/static/images/tree.webp",
        images: ["/static/images/tree.webp"],
        captions: ["Living vs Non-Living"],
        explanation: "Living things grow, breathe, and need food and water! 🌱 Non-living things do not do these on their own. 🪨"
      },
      {
        id: "slide-2",
        title: "Tap to Explore",
        type: "concept",
        images: [
          "/static/images/tree.webp",
          "/static/images/puddle.webp",
          "/static/images/bicycle.webp",
          "/static/images/bird.webp"
        ],
        captions: ["Tree", "Puddle", "Bicycle", "Bird"],
        itemExplanations: {
          "Tree": "A tree grows tall over many years, breathes air, and needs water and sunlight! 🌱 (Living Thing)",
          "Puddle": "A puddle is water on the ground. It does not eat, breathe, or grow on its own. 💧 (Non-Living Thing)",
          "Bicycle": "A bicycle only moves when a person pedals it. It cannot grow, eat, or breathe. 🚲 (Non-Living Thing)",
          "Bird": "A bird is a living thing. It can fly around, look for food, and breathe on its own! 🐦 (Living Thing)"
        },
        explanation: "Tap each item to see what makes it living or non-living! 🔍"
      },
      {
        id: "slide-3",
        title: "Quick Check: Living Thing",
        type: "quick-check",
        prompt: "Which one can grow and needs water to stay alive? 🌱",
        image: "/static/images/plant.webp",
        explanation: "Great job! Plants are living things because they absorb water, make food from sunlight, and grow!",
        options: [
          { id: "opt-1", label: "Rock", icon: "/static/images/rock.webp", isCorrect: false },
          { id: "opt-2", label: "Plant", icon: "/static/images/plant.webp", isCorrect: true }
        ]
      },
      {
        id: "slide-4",
        title: "More Objects to Classify",
        type: "concept",
        images: [
          "/static/images/cat.webp",
          "/static/images/ball.webp",
          "/static/images/flower.webp"
        ],
        captions: ["Cat", "Ball", "Flower"],
        itemExplanations: {
          "Cat": "A cat breathes, moves on its own, eats food, and grows from a tiny kitten! 🐱 (Living Thing)",
          "Ball": "A toy ball only rolls after someone kicks or throws it. It cannot breathe or grow. ⚽ (Non-Living Thing)",
          "Flower": "A flower blooms in the garden and needs soil, water, and sunlight to stay healthy! 🌸 (Living Thing)"
        },
        explanation: "Tap each object! Is it living or non-living? ✨"
      },
      {
        id: "slide-5",
        title: "Quick Check: Non-Living Thing",
        type: "quick-check",
        prompt: "Which object cannot breathe or move by itself? 🪑",
        image: "/static/images/chair.webp",
        explanation: "Spot on! A chair is made of wood or plastic by people and cannot breathe, eat, or grow.",
        options: [
          { id: "opt-1", label: "Butterfly", icon: "/static/images/butterfly.webp", isCorrect: false },
          { id: "opt-2", label: "Chair", icon: "/static/images/chair.webp", isCorrect: true }
        ]
      },
      {
        id: "slide-6",
        title: "Why is this fish a living thing?",
        type: "characteristics",
        description: "Tap all the traits that prove this fish is alive! 🐟",
        prompt: "Tap all the traits that prove this fish is alive! 🐟",
        image: "/static/images/fish.webp",
        images: ["/static/images/fish.webp"],
        captions: ["Fish"],
        object: {
          label: "Fish",
          image: "/static/images/fish.webp",
          icon: "/static/images/fish.webp",
          explanation: "A fish shows life in many ways: it breathes through gills, swims by itself, grows, and needs food."
        },
        traits: [
          { id: "grows", label: "Grows", isCorrect: true },
          { id: "breathes", label: "Breathes", isCorrect: true },
          { id: "moves", label: "Moves on its own", isCorrect: true },
          { id: "needs-food", label: "Needs food", isCorrect: true },
          { id: "made-by-people", label: "Made by people", isCorrect: false }
        ],
        correctTraits: ["grows", "breathes", "moves", "needs-food"],
        explanation: "A fish shows life in many ways: it breathes through gills, swims by itself, grows, and needs food."
      },
      {
        id: "slide-7",
        title: "Living vs Non-Living: Big Ideas",
        type: "summary",
        image: "/static/images/app_icon.png",
        images: ["/static/images/app_icon.png"],
        captions: ["Science Champion"],
        bullets: [
          "Living things grow, breathe, and need food and water.",
          "Non-living things do not eat, breathe, or grow on their own.",
          "Examples of living things: Trees, birds, plants, cats, and fish.",
          "Examples of non-living things: Rocks, bicycles, balls, puddles, and chairs."
        ],
        explanation: "🌱 Living things grow, breathe, and need food. 🪨 Non-living things do not eat, breathe, or grow on their own. Fantastic job, Science Explorer!"
      }
    ];

    // Lesson topic presets
    const LESSON_PRESETS = {
      living_vs_nonliving: {
        title: "Living vs Non-Living",
        description: "Learn how to tell living things from non-living things!",
        slides: DEFAULT_SLIDES
      },
      states_of_matter: {
        title: "States of Matter: Solid vs Liquid",
        description: "Explore the different forms matter can take around us.",
        slides: [
          {
            id: "slide-1",
            title: "What is Matter?",
            type: "concept",
            image: "/static/images/rock.webp",
            explanation: "Everything around us is made of matter! Matter can be a solid, liquid, or gas."
          },
          {
            id: "slide-2",
            title: "Solids Keep Their Shape",
            type: "concept",
            image: "/static/images/chair.webp",
            explanation: "A wooden chair is a solid. It keeps its firm shape and fixed volume."
          },
          {
            id: "slide-3",
            title: "Quick Check: Find the Solid",
            type: "quick-check",
            prompt: "Which object keeps its rigid shape and is a solid? 🧊",
            image: "/static/images/rock.webp",
            explanation: "Ice and rocks hold a definite shape as solids.",
            options: [
              { id: "opt-1", label: "Ice Cube", icon: "/static/images/rock.webp", isCorrect: true },
              { id: "opt-2", label: "Water Puddle", icon: "/static/images/puddle.webp", isCorrect: false }
            ]
          },
          {
            id: "slide-4",
            title: "Liquids Flow and Pour",
            type: "concept",
            image: "/static/images/puddle.webp",
            explanation: "Water is a liquid! It flows smoothly and takes the shape of whatever container it sits in."
          },
          {
            id: "slide-5",
            title: "Matter Explorer Complete!",
            type: "summary",
            image: "/static/images/star.webp",
            explanation: "You now know the basic properties of solids and liquids!"
          }
        ]
      },
      recycling: {
        title: "Eco Recycling & Waste Sorting",
        description: "Discover how sorting waste protects our planet Earth.",
        slides: [
          {
            id: "slide-1",
            title: "Caring for Our Planet",
            type: "concept",
            image: "/static/images/plant.webp",
            explanation: "Every day we use materials that can either become compost or be recycled into new products!"
          },
          {
            id: "slide-2",
            title: "Organic Compost",
            type: "concept",
            image: "/static/images/tree.webp",
            explanation: "Leaves, branches, and fruit peels decompose naturally into nutrient-rich garden soil."
          },
          {
            id: "slide-3",
            title: "Quick Check: Organic Waste",
            type: "quick-check",
            prompt: "Which item breaks down naturally as organic compost? 🍂",
            image: "/static/images/plant.webp",
            explanation: "Fallen leaves decompose naturally in garden compost.",
            options: [
              { id: "opt-1", label: "Fallen Leaves", icon: "/static/images/plant.webp", isCorrect: true },
              { id: "opt-2", label: "Plastic Bottle", icon: "/static/images/puddle.webp", isCorrect: false }
            ]
          },
          {
            id: "slide-4",
            title: "Recyclable Materials",
            type: "concept",
            image: "/static/images/puddle.webp",
            explanation: "Clean plastics, glass, and metals can be melted and remanufactured to reduce pollution."
          },
          {
            id: "slide-5",
            title: "Eco Scientist Certified!",
            type: "summary",
            image: "/static/images/star.webp",
            explanation: "You are ready to help protect the environment by sorting waste properly!"
          }
        ]
      },
      basic_needs: {
        title: "Basic Needs of Living Things",
        term: "Term 2",
        description: "Term 2, Weeks 5-7: Learn that living things need air, food, water, and shelter, depend on one another and the environment, and must be protected.",
        slides: [
          {
            id: "bn-1", title: "What Do Living Things Need?", type: "concept",
            images: ["/static/images/tree.webp", "/static/images/dog.webp", "/static/images/butterfly.webp", "/static/images/fish.webp"],
            captions: ["Tree", "Dog", "Butterfly", "Fish"],
            explanation: "Plants, animals, and people are all living things. To stay alive and healthy, every one of them has basic needs!"
          },
          {
            id: "bn-2", title: "Air", type: "concept",
            images: ["/static/images/bird.webp"], captions: ["Air"],
            explanation: "Living things need air. Animals and people breathe in air, and plants take in air through their leaves."
          },
          {
            id: "bn-3", title: "Food and Water", type: "concept",
            images: ["/static/images/plant.webp", "/static/images/puddle.webp"],
            captions: ["Food", "Water"],
            explanation: "Living things need food for energy and water to grow. Plants make their own food using sunlight, water, and air. Animals eat plants or other animals."
          },
          {
            id: "bn-4", title: "Quick Check: Basic Needs", type: "quick-check",
            prompt: "Which one is something living things need to survive?",
            image: "/static/images/puddle.webp",
            explanation: "Water is a basic need of all living things.",
            options: [
              { id: "opt-1", label: "Water", icon: "/static/images/puddle.webp", isCorrect: true },
              { id: "opt-2", label: "Rock", icon: "/static/images/rock.webp", isCorrect: false },
              { id: "opt-3", label: "Ball", icon: "/static/images/ball.webp", isCorrect: false }
            ]
          },
          {
            id: "bn-5", title: "Shelter", type: "concept",
            images: ["/static/images/tree.webp", "/static/images/bird.webp"],
            captions: ["Tree (home)", "Bird (lives in the tree)"],
            explanation: "Shelter keeps living things safe from weather and enemies. Birds build nests in trees, and animals live in burrows, caves, and homes."
          },
          {
            id: "bn-6", title: "We Depend on One Another", type: "concept",
            images: ["/static/images/flower.webp", "/static/images/butterfly.webp"],
            captions: ["Flower", "Butterfly"],
            explanation: "Living things depend on each other and their environment. Butterflies drink nectar from flowers, and in return they help flowers make seeds."
          },
          {
            id: "bn-7", title: "Quick Check: Shelter", type: "quick-check",
            prompt: "Where does a bird find shelter?",
            image: "/static/images/bird.webp",
            explanation: "Birds build nests in trees for shelter.",
            options: [
              { id: "opt-1", label: "Tree", icon: "/static/images/tree.webp", isCorrect: true },
              { id: "opt-2", label: "Puddle", icon: "/static/images/puddle.webp", isCorrect: false }
            ]
          },
          {
            id: "bn-8", title: "Protect Our Environment", type: "concept",
            images: ["/static/images/plant.webp", "/static/images/tree.webp"],
            captions: ["Plant", "Tree"],
            explanation: "If we harm the environment, living things lose air, food, water, and shelter. We must protect and conserve nature so living things can survive."
          },
          {
            id: "bn-9", title: "Basic Needs Expert!", type: "summary",
            image: "/static/images/star.webp",
            explanation: "Great job! Living things need air, food, water, and shelter, and we must take care of the environment that provides them."
          }
        ]
      }
    };

    // State
    let currentSlideIndex = 0;
    let rawSlides = (lessonConfig.serverSlides && lessonConfig.serverSlides.length > 0) ? lessonConfig.serverSlides : DEFAULT_SLIDES;
    let slides = Array.isArray(rawSlides) && rawSlides.length > 0
      ? rawSlides
      : [
          {
            id: `slide-${Date.now()}`,
            title: "Lesson Introduction",
            type: "concept",
            image: "/static/images/tree.webp",
            explanation: "Welcome to this lesson! Type your introductory science concept here for students."
          }
        ];

    function renderSlideStrip() {
      const container = document.getElementById('slideStripContainer');
      if (!container) return;
      container.innerHTML = '';

      slides.forEach((slide, idx) => {
        const item = document.createElement('div');
        item.className = `slide-ribbon-item ${idx === currentSlideIndex ? 'active' : ''}`;
        item.onclick = () => selectSlide(idx);

        let typePill = '<span class="slide-strip-type-pill st-concept">Concept</span>';
        if (slide.type === 'quick-check') {
          typePill = '<span class="slide-strip-type-pill st-quiz">Quiz</span>';
        } else if (slide.type === 'summary') {
          typePill = '<span class="slide-strip-type-pill st-summary">Summary</span>';
        }

        const thumbImg = (slide.images && slide.images.length > 0) ? slide.images[0] : (slide.image || '/static/images/tree.webp');

        item.innerHTML = `
          <div class="d-flex align-items-center justify-content-between mb-1">
            <span class="slide-strip-num">${idx + 1}</span>
            ${typePill}
          </div>
          <div class="d-flex align-items-center gap-2 overflow-hidden">
            <img src="${thumbImg}" alt="Thumb" class="rounded-2 border object-fit-cover flex-shrink-0" style="width: 32px; height: 32px; background: #ffffff;">
            <div class="slide-strip-title text-truncate" title="${escapeAttr(slide.title || 'Untitled Slide')}">${escapeAttr(slide.title || 'Untitled Slide')}</div>
          </div>
        `;
        container.appendChild(item);
      });

      const badge = document.getElementById('slidesCountBadge');
      if (badge) badge.textContent = `${slides.length} Slides`;

      const activeEl = container.querySelector('.slide-ribbon-item.active');
      if (activeEl) {
        activeEl.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }

    function selectSlide(idx) {
      if (idx < 0 || idx >= slides.length) return;
      currentSlideIndex = idx;
      renderSlideStrip();
      loadSlideIntoEditor();
      updateCanvasPreview();
    }

    function addSlide(type = 'concept') {
      const nextNum = slides.length + 1;
      let newSlide = {
        id: `slide-${Date.now()}`,
        title: type === 'quick-check' ? `Quick Check ${nextNum}` : `Concept Slide ${nextNum}`,
        type: type,
        image: "/static/images/tree.webp",
        explanation: "Enter explanatory text for this slide..."
      };

      if (type === 'quick-check') {
        newSlide.prompt = "What is the correct answer?";
        newSlide.options = [
          { id: `opt-${Date.now()}-1`, label: "Option A", icon: "/static/images/tree.webp", isCorrect: true },
          { id: `opt-${Date.now()}-2`, label: "Option B", icon: "/static/images/rock.webp", isCorrect: false }
        ];
      } else if (type === 'characteristics') {
        newSlide.title = "Why is this fish a living thing?";
        newSlide.description = "Tap all the traits that prove this subject is alive! 🐟";
        newSlide.prompt = "Tap all the traits that prove this subject is alive! 🐟";
        newSlide.image = "/static/images/fish.webp";
        newSlide.images = ["/static/images/fish.webp"];
        newSlide.captions = ["Fish"];
        newSlide.object = {
          label: "Fish",
          image: "/static/images/fish.webp",
          icon: "/static/images/fish.webp",
          explanation: "A fish shows life in many ways: it breathes through gills, swims by itself, grows, and needs food."
        };
        newSlide.traits = [
          { id: `trait-${Date.now()}-1`, label: "Grows", isCorrect: true },
          { id: `trait-${Date.now()}-2`, label: "Breathes", isCorrect: true },
          { id: `trait-${Date.now()}-3`, label: "Moves on its own", isCorrect: true },
          { id: `trait-${Date.now()}-4`, label: "Needs food", isCorrect: true },
          { id: `trait-${Date.now()}-5`, label: "Made by people", isCorrect: false }
        ];
        newSlide.correctTraits = [
          newSlide.traits[0].id,
          newSlide.traits[1].id,
          newSlide.traits[2].id,
          newSlide.traits[3].id
        ];
        newSlide.explanation = "A fish shows life in many ways: it breathes through gills, swims by itself, grows, and needs food.";
      } else if (type === 'summary') {
        const curTitle = document.getElementById('lessonTitleInput')?.value?.trim() || 'Lesson';
        newSlide.title = `${curTitle}: Big Ideas`;
        newSlide.explanation = `Great job! You have explored and completed all key ideas of ${curTitle}.`;
        newSlide.bullets = [];
        newSlide.image = "";
        newSlide.images = [];
      }

      slides.push(newSlide);
      selectSlide(slides.length - 1);
      showBuilderToast("Added new slide", "success");
    }

    function moveSlide(direction) {
      const targetIndex = currentSlideIndex + direction;
      if (targetIndex < 0 || targetIndex >= slides.length) return;

      const temp = slides[currentSlideIndex];
      slides[currentSlideIndex] = slides[targetIndex];
      slides[targetIndex] = temp;

      selectSlide(targetIndex);
    }

    function deleteCurrentSlide() {
      if (slides.length <= 1) {
        showBuilderToast("A lesson must have at least 1 slide.", "warning");
        return;
      }
      slides.splice(currentSlideIndex, 1);
      currentSlideIndex = Math.max(0, currentSlideIndex - 1);
      renderSlideStrip();
      loadSlideIntoEditor();
      updateCanvasPreview();
      showBuilderToast("Slide removed", "warning");
    }

    function ensureSlideImages(slide) {
      if (!Array.isArray(slide.images)) {
        if (slide.image && typeof slide.image === 'string' && slide.image.trim()) {
          slide.images = [slide.image];
        } else {
          slide.images = [];
          slide.image = '';
        }
      } else {
        slide.image = slide.images.length > 0 ? slide.images[0] : '';
      }
      if (!Array.isArray(slide.captions)) slide.captions = [];
      while (slide.captions.length < slide.images.length) slide.captions.push('');
      slide.captions.length = slide.images.length;
      return slide.images;
    }

    function escapeAttr(v) {
      return String(v ?? '').replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
    }

    function setImageCaption(idx, val) {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      ensureSlideImages(slide);
      slide.captions[idx] = val;
      updateCanvasPreview();
    }

    function captionLabelHtml(slide, i, cls) {
      const cap = (slide.captions && slide.captions[i]) || '';
      return cap ? `<span class="${cls}">${escapeAttr(cap)}</span>` : '';
    }

    function loadSlideIntoEditor() {
      const slide = slides[currentSlideIndex];
      if (!slide) return;

      const numBadge = document.getElementById('currentSlideNumberBadge');
      if (numBadge) numBadge.textContent = `Slide ${currentSlideIndex + 1} of ${slides.length}`;
      const typeBadge = document.getElementById('currentSlideTypeBadge');
      if (typeBadge) {
        if (slide.type === 'quick-check') {
          typeBadge.textContent = '❓ Quick Check';
          typeBadge.className = 'badge bg-warning-subtle text-dark border small fw-bold';
        } else if (slide.type === 'characteristics') {
          typeBadge.textContent = '🧬 Traits Activity';
          typeBadge.className = 'badge bg-purple text-white border small fw-bold' || 'badge bg-primary text-white border small fw-bold';
          typeBadge.style.background = '#7c3aed';
        } else if (slide.type === 'summary') {
          typeBadge.textContent = '🏆 Milestone';
          typeBadge.className = 'badge bg-success-subtle text-success border small fw-bold';
        } else {
          typeBadge.textContent = '📝 Concept Story';
          typeBadge.className = 'badge bg-primary-subtle text-primary border small fw-bold';
        }
      }
      const titleBadge = document.getElementById('currentSlideFocusTitle');
      if (titleBadge) titleBadge.textContent = slide.title || 'Untitled Slide';

      document.getElementById('editSlideTitle').value = slide.title || '';
      document.getElementById('editSlideType').value = slide.type || 'concept';
      document.getElementById('editSlideExplanation').value = slide.explanation || '';

      const badge = document.getElementById('activeAnimationBadge');
      const isAnim = Boolean(slide.animationSrc || (typeof slide.image === 'string' && slide.image.endsWith('.json')));
      if (isAnim) {
        if (badge) badge.classList.remove('d-none');
        const nameEl = document.getElementById('activeAnimationName');
        if (nameEl) nameEl.textContent = slide.animationLabel || 'Animation Attached';
      } else {
        if (badge) badge.classList.add('d-none');
      }

      const mediaSection = document.getElementById('slideMediaConfigSection');
      const quizBox = document.getElementById('quickCheckEditFields');
      const summaryBulletsBox = document.getElementById('summaryBulletsEditFields');
      const charSection = document.getElementById('characteristicsEditFields');

      if (slide.type === 'quick-check') {
        if (mediaSection) mediaSection.classList.add('d-none');
        if (summaryBulletsBox) summaryBulletsBox.classList.add('d-none');
        if (charSection) charSection.classList.add('d-none');
        if (quizBox) {
          quizBox.classList.remove('d-none');
          document.getElementById('editQuizPrompt').value = slide.prompt || '';
          renderQuizOptionsEditor();
        }
      } else if (slide.type === 'characteristics') {
        if (mediaSection) mediaSection.classList.add('d-none');
        if (quizBox) quizBox.classList.add('d-none');
        if (summaryBulletsBox) summaryBulletsBox.classList.add('d-none');
        if (charSection) {
          charSection.classList.remove('d-none');
          document.getElementById('editCharacteristicsPrompt').value = slide.description || slide.prompt || '';
          const obj = slide.object || {};
          document.getElementById('editCharacteristicsObjLabel').value = obj.label || 'Fish';
          document.getElementById('editCharacteristicsObjDesc').value = obj.explanation || obj.description || slide.explanation || '';
          const thumb = document.getElementById('editCharacteristicsObjImgThumb');
          if (thumb) thumb.src = obj.image || slide.image || '/static/images/fish.webp';
          renderCharacteristicsTraitsEditor();
        }
      } else if (slide.type === 'summary') {
        if (mediaSection) mediaSection.classList.remove('d-none');
        if (quizBox) quizBox.classList.add('d-none');
        if (charSection) charSection.classList.add('d-none');
        if (summaryBulletsBox) {
          summaryBulletsBox.classList.remove('d-none');
          renderSummaryBulletsEditor();
        }
        renderSlideMediaStrip(slide);
      } else {
        if (mediaSection) mediaSection.classList.remove('d-none');
        if (quizBox) quizBox.classList.add('d-none');
        if (charSection) charSection.classList.add('d-none');
        if (summaryBulletsBox) summaryBulletsBox.classList.add('d-none');
        renderSlideMediaStrip(slide);
      }
    }

    function renderSlideMediaStrip(slide) {
      const container = document.getElementById('slideImagesThumbStrip');
      const countBadge = document.getElementById('slideMediaCountBadge');
      const layoutHint = document.getElementById('slideMediaLayoutText');
      const addBtn = document.getElementById('btnAddSlideImageBtn');
      if (!container) return;

      const imgs = ensureSlideImages(slide);
      container.innerHTML = '';

      if (countBadge) countBadge.textContent = `${imgs.length} Image${imgs.length === 1 ? '' : 's'}`;
      if (layoutHint) {
        if (imgs.length === 0) {
          layoutHint.textContent = 'No Images: Clean Text & Narration Layout';
        } else if (imgs.length === 1) {
          layoutHint.textContent = '1 Image: Spotlight Hero Showcase';
        } else if (imgs.length === 2) {
          layoutHint.textContent = '2 Images: Side-by-Side Comparison (Left vs Right)';
        } else {
          layoutHint.textContent = `${imgs.length} Images: Balanced Photo Gallery Grid`;
        }
      }

      if (imgs.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'w-100 py-3 text-center text-muted small fw-semibold';
        emptyState.innerHTML = '<i class="bi bi-image text-secondary me-1"></i>No images attached. Click "Add Image" or "Upload File" to add one.';
        container.appendChild(emptyState);
      } else {
        imgs.forEach((imgSrc, idx) => {
          const item = document.createElement('div');
          item.className = 'slide-media-thumb-item';
          item.title = `Image #${idx + 1} (Click to change/replace)`;
          item.innerHTML = `
            <span class="slide-media-thumb-badge">${idx + 1}</span>
            <img src="${imgSrc}" alt="Slide Image ${idx + 1}">
            <span class="slide-media-thumb-del" title="Remove this image" onclick="event.stopPropagation(); removeSlideImage(${idx});">✕</span>
          `;
          item.onclick = () => openSlidePresetPicker('replace', idx);
          container.appendChild(item);
        });
      }

      if (addBtn) {
        addBtn.disabled = imgs.length >= 4;
        addBtn.classList.toggle('disabled', imgs.length >= 4);
      }

      // Per-image caption (icon name) editor
      let capBox = document.getElementById('slideCaptionEditor');
      if (!capBox) {
        capBox = document.createElement('div');
        capBox.id = 'slideCaptionEditor';
        capBox.className = 'd-flex flex-column gap-1 mt-2 w-100';
        container.insertAdjacentElement('afterend', capBox);
      }
      if (imgs.length === 0) {
        capBox.innerHTML = '';
      } else {
        capBox.innerHTML = imgs.map((_, i) => `
          <div class="input-group input-group-sm">
            <span class="input-group-text fw-bold">#${i + 1}</span>
            <input type="text" class="form-control" maxlength="40" placeholder="Name this image (e.g. Water)" value="${escapeAttr(slide.captions[i])}" oninput="setImageCaption(${i}, this.value)">
          </div>`).join('');
      }
    }

    function removeSlideImage(imgIdx) {
      const slide = slides[currentSlideIndex];
      if (!slide || !Array.isArray(slide.images) || slide.images.length === 0) {
        return;
      }
      slide.images.splice(imgIdx, 1);
      if (Array.isArray(slide.captions)) slide.captions.splice(imgIdx, 1);
      slide.image = slide.images.length > 0 ? slide.images[0] : '';
      loadSlideIntoEditor();
      updateCanvasPreview();
      showBuilderToast("Image removed from slide.", "info");
    }

    function renderSummaryBulletsEditor() {
      const slide = slides[currentSlideIndex];
      const container = document.getElementById('summaryBulletsEditor');
      if (!slide || !container) return;

      if (!Array.isArray(slide.bullets)) {
        slide.bullets = [];
      }

      container.innerHTML = '';
      if (slide.bullets.length === 0) {
        container.innerHTML = `
          <div class="text-center py-2 text-muted small bg-white rounded-3 border">
            No bullet points yet. Click <strong class="text-success">+ Add Bullet</strong> to create key takeaways!
          </div>
        `;
        return;
      }

      slide.bullets.forEach((bulletText, idx) => {
        const row = document.createElement('div');
        row.className = 'input-group input-group-sm';
        row.innerHTML = `
          <span class="input-group-text fw-bold bg-white text-success">⭐ #${idx + 1}</span>
          <input type="text" class="form-control fw-semibold" placeholder="Key takeaway (e.g. Living things grow and breathe)" value="${escapeAttr(bulletText)}" oninput="updateSummaryBullet(${idx}, this.value)">
          <button type="button" class="btn btn-outline-danger" title="Remove bullet point" onclick="removeSummaryBullet(${idx})">✕</button>
        `;
        container.appendChild(row);
      });
    }

    function addSummaryBullet() {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      if (!Array.isArray(slide.bullets)) slide.bullets = [];
      if (slide.bullets.length >= 6) {
        showBuilderToast("Maximum 6 bullet points recommended for summary slide.", "warning");
        return;
      }
      slide.bullets.push('');
      renderSummaryBulletsEditor();
      updateCanvasPreview();
      setTimeout(() => {
        const inputs = document.querySelectorAll('#summaryBulletsEditor input');
        if (inputs.length) inputs[inputs.length - 1].focus();
      }, 50);
    }

    function updateSummaryBullet(idx, val) {
      const slide = slides[currentSlideIndex];
      if (!slide || !Array.isArray(slide.bullets)) return;
      slide.bullets[idx] = val;
      updateCanvasPreview();
    }

    function removeSummaryBullet(idx) {
      const slide = slides[currentSlideIndex];
      if (!slide || !Array.isArray(slide.bullets)) return;
      slide.bullets.splice(idx, 1);
      renderSummaryBulletsEditor();
      updateCanvasPreview();
      showBuilderToast("Bullet point removed", "info");
    }

    function toggleCanvasExpand() {
      const layout = document.querySelector('.lesson-workspace-layout') || document.querySelector('.lesson-workspace-grid');
      const btn = document.getElementById('btnToggleExpandCanvas');
      if (!layout) return;
      const isExpanded = layout.classList.toggle('canvas-expanded');
      if (btn) {
        if (isExpanded) {
          btn.innerHTML = '<i class="bi bi-arrows-angle-contract me-1"></i>Standard View';
          btn.classList.replace('btn-outline-dark', 'btn-dark');
          showBuilderToast("Canvas expanded to full width preview", "info");
        } else {
          btn.innerHTML = '<i class="bi bi-arrows-angle-expand me-1"></i>Expand Canvas';
          btn.classList.replace('btn-dark', 'btn-outline-dark');
          showBuilderToast("Canvas restored to standard side-by-side view", "info");
        }
      }
    }

    function renderQuizOptionsEditor() {
      const slide = slides[currentSlideIndex];
      if (!slide || !Array.isArray(slide.options)) return;
      const container = document.getElementById('quizOptionsEditor');
      container.innerHTML = '';

      slide.options.forEach((opt, optIdx) => {
        const row = document.createElement('div');
        row.className = 'd-flex align-items-center gap-2 p-2 bg-white rounded-3 border shadow-sm';
        row.innerHTML = `
          <div class="form-check m-0" title="Mark as correct answer">
            <input class="form-check-input" type="radio" name="correct_opt_radio" id="correct_opt_${optIdx}" ${opt.isCorrect ? 'checked' : ''} onchange="setQuizCorrectOption(${optIdx})" style="cursor: pointer;">
          </div>
          <button type="button" class="btn btn-sm btn-light border p-1 rounded-2 choice-icon-btn d-flex align-items-center justify-content-center" onclick="openChoicePresetPicker(${optIdx})" title="Click to change image/icon for Choice #${optIdx + 1}" style="width: 44px; height: 44px; min-width: 44px; background: #f8fafc;">
            <img src="${opt.icon || '/static/images/rock.webp'}" alt="Choice Icon" style="width: 32px; height: 32px; object-fit: contain;">
            <span class="choice-icon-edit-tag"><i class="bi bi-pencil-fill"></i></span>
          </button>
          <div class="flex-grow-1">
            <input type="text" class="form-control form-control-sm rounded-2 fw-bold" value="${escapeAttr(opt.label)}" oninput="updateQuizOptionLabel(${optIdx}, this.value)" placeholder="Choice label (e.g. Dog, Plant)">
          </div>
          <button type="button" class="btn btn-sm btn-outline-primary border-0 p-1.5 fw-bold small text-nowrap" onclick="openChoicePresetPicker(${optIdx})" title="Change Choice Image">
            <i class="bi bi-image"></i>
          </button>
          ${slide.options.length > 2 ? `
            <button type="button" class="btn btn-outline-danger btn-sm border-0 p-1.5" onclick="removeQuizOption(${optIdx})" title="Delete Choice"><i class="bi bi-x-lg"></i></button>
          ` : ''}
        `;
        container.appendChild(row);
      });
    }

    function openChoicePresetPicker(optIdx) {
      activeImagePickerMode = { action: 'choice_icon', index: optIdx };
      const modalEl = document.getElementById('presetImageModal');
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      loadTeacherAssets('image');
    }

    function updateQuizOptionLabel(optIdx, val) {
      if (slides[currentSlideIndex]?.options?.[optIdx]) {
        slides[currentSlideIndex].options[optIdx].label = val;
        updateCanvasPreview();
      }
    }

    function setQuizCorrectOption(optIdx) {
      if (slides[currentSlideIndex]?.options) {
        slides[currentSlideIndex].options.forEach((opt, i) => {
          opt.isCorrect = (i === optIdx);
        });
        updateCanvasPreview();
      }
    }

    function addQuizOption() {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      if (!Array.isArray(slide.options)) slide.options = [];
      if (slide.options.length >= 4) {
        showBuilderToast("Maximum 4 options allowed per quick-check.", "warning");
        return;
      }
      slide.options.push({
        id: `opt-${Date.now()}-${slide.options.length + 1}`,
        label: `Choice ${slide.options.length + 1}`,
        icon: "/static/images/rock.webp",
        isCorrect: false
      });
      renderQuizOptionsEditor();
      updateCanvasPreview();
    }

    function removeQuizOption(optIdx) {
      const slide = slides[currentSlideIndex];
      if (!slide?.options || slide.options.length <= 2) {
        showBuilderToast("A question needs at least 2 options.", "warning");
        return;
      }
      slide.options.splice(optIdx, 1);
      // Ensure at least one is correct
      if (!slide.options.some(o => o.isCorrect)) {
        slide.options[0].isCorrect = true;
      }
      renderQuizOptionsEditor();
      updateCanvasPreview();
    }

    function updateCurrentSlideField(field, value) {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      slide[field] = value;
      if (field === 'type') {
        if (value === 'quick-check' && !slide.options) {
          slide.prompt = "Answer the question.";
          slide.options = [
            { id: "opt-1", label: "Choice A", icon: "/static/images/tree.webp", isCorrect: true },
            { id: "opt-2", label: "Choice B", icon: "/static/images/rock.webp", isCorrect: false }
          ];
        } else if (value === 'characteristics' && (!slide.traits || slide.traits.length === 0)) {
          slide.title = slide.title || "Why is this fish a living thing?";
          slide.description = "Tap all the traits that prove this subject is alive! 🐟";
          slide.prompt = "Tap all the traits that prove this subject is alive! 🐟";
          slide.image = slide.image || "/static/images/fish.webp";
          slide.object = slide.object || {
            label: "Fish",
            image: "/static/images/fish.webp",
            icon: "/static/images/fish.webp",
            explanation: "A fish shows life in many ways: it breathes through gills, swims by itself, grows, and needs food."
          };
          slide.traits = [
            { id: `trait-${Date.now()}-1`, label: "Grows", isCorrect: true },
            { id: `trait-${Date.now()}-2`, label: "Breathes", isCorrect: true },
            { id: `trait-${Date.now()}-3`, label: "Moves on its own", isCorrect: true },
            { id: `trait-${Date.now()}-4`, label: "Needs food", isCorrect: true },
            { id: `trait-${Date.now()}-5`, label: "Made by people", isCorrect: false }
          ];
          slide.correctTraits = [
            slide.traits[0].id,
            slide.traits[1].id,
            slide.traits[2].id,
            slide.traits[3].id
          ];
          slide.explanation = "A fish shows life in many ways: it breathes through gills, swims by itself, grows, and needs food.";
        } else if (value === 'summary') {
          const curTitle = document.getElementById('lessonTitleInput')?.value?.trim() || 'Lesson';
          if (!slide.title || slide.title.startsWith('Concept') || slide.title.startsWith('Quick Check') || slide.title === 'Living vs Non-Living: Big Ideas') {
            slide.title = `${curTitle}: Big Ideas`;
          }
          if (!slide.explanation || slide.explanation.includes('Living things grow, breathe')) {
            slide.explanation = `Great job! You have explored and completed all key ideas of ${curTitle}.`;
          }
          if (!Array.isArray(slide.bullets)) {
            slide.bullets = [];
          }
        }
        loadSlideIntoEditor();
      }
      renderSlideStrip();
      updateCanvasPreview();
    }

    function updateCanvasPreview() {
      const slide = slides[currentSlideIndex];
      if (!slide) return;

      document.getElementById('canvasTitleDisplay').textContent = slide.title || 'Untitled Slide';
      document.getElementById('canvasNarrationDisplay').textContent = slide.explanation || 'No narration entered yet.';
      document.getElementById('canvasSlideIndicator').textContent = `Slide ${currentSlideIndex + 1} / ${slides.length}`;

      const heroBox = document.getElementById('canvasHeroBox');
      const heroImg = document.getElementById('canvasHeroImg');
      const quizBox = document.getElementById('canvasQuizBox');
      const quizPrompt = document.getElementById('canvasQuizPromptDisplay');
      const quizOpts = document.getElementById('canvasQuizOptionsContainer');
      const charBox = document.getElementById('canvasCharacteristicsBox');
      const narrationBox = document.getElementById('canvasNarrationDisplay');

      if (slide.type === 'quick-check') {
        if (charBox) charBox.classList.add('d-none');
        if (narrationBox) narrationBox.classList.remove('d-none');
        heroBox.classList.add('d-none');
        quizBox.classList.remove('d-none');
        quizPrompt.textContent = slide.prompt || 'Answer the question:';
        quizOpts.innerHTML = '';

        (slide.options || []).forEach(opt => {
          const btn = document.createElement('div');
          btn.className = 'canvas-quiz-opt-btn';
          btn.innerHTML = `
            <img src="${opt.icon || '/static/images/tree.webp'}" alt="Icon" class="canvas-quiz-opt-icon">
            <span>${opt.label}</span>
            <span class="quiz-feedback-pill badge d-none small py-0 px-1 mt-1"></span>
          `;
          btn.onclick = () => {
            quizOpts.querySelectorAll('.canvas-quiz-opt-btn').forEach(b => {
              b.classList.remove('is-correct', 'is-incorrect');
              const pill = b.querySelector('.quiz-feedback-pill');
              if (pill) pill.classList.add('d-none');
            });
            const pill = btn.querySelector('.quiz-feedback-pill');
            if (opt.isCorrect) {
              btn.classList.add('is-correct');
              if (pill) {
                pill.className = 'quiz-feedback-pill badge bg-success small py-0 px-1 mt-1';
                pill.textContent = '✓ Correct';
                pill.classList.remove('d-none');
              }
              showBuilderToast(`Correct! "${opt.label}" is the right answer.`, "success");
            } else {
              btn.classList.add('is-incorrect');
              if (pill) {
                pill.className = 'quiz-feedback-pill badge bg-danger small py-0 px-1 mt-1';
                pill.textContent = '✗ Try again';
                pill.classList.remove('d-none');
              }
              showBuilderToast(`"${opt.label}" is incorrect. Try another option!`, "warning");
            }
          };
          quizOpts.appendChild(btn);
        });
      } else if (slide.type === 'characteristics') {
        heroBox.classList.add('d-none');
        quizBox.classList.add('d-none');
        if (narrationBox) narrationBox.classList.add('d-none');
        if (charBox) {
          charBox.classList.remove('d-none');
          const bannerEl = document.getElementById('canvasCharacteristicsBanner');
          if (bannerEl) bannerEl.textContent = slide.description || slide.prompt || 'Tap all the traits that prove this subject is alive! 🐟';

          const obj = slide.object || {};
          const charImg = document.getElementById('canvasCharacteristicsImg');
          if (charImg) charImg.src = obj.image || slide.image || '/static/images/fish.webp';
          const charLabel = document.getElementById('canvasCharacteristicsLabel');
          if (charLabel) charLabel.textContent = obj.label || 'Fish';
          const charDesc = document.getElementById('canvasCharacteristicsDesc');
          if (charDesc) charDesc.textContent = obj.explanation || obj.description || slide.explanation || '';

          const traitsGrid = document.getElementById('canvasCharacteristicsTraitsGrid');
          if (traitsGrid) {
            traitsGrid.innerHTML = '';
            const traits = Array.isArray(slide.traits) ? slide.traits : [];
            const correctIds = Array.isArray(slide.correctTraits) && slide.correctTraits.length > 0
              ? slide.correctTraits
              : traits.filter(t => t.isCorrect).map(t => t.id);

            traits.forEach(trait => {
              const btn = document.createElement('div');
              btn.className = 'trait-option';
              btn.setAttribute('data-id', trait.id);
              btn.innerHTML = `
                <span class="trait-label">${escapeAttr(trait.label)}</span>
                <span class="trait-check-badge"></span>
              `;
              btn.onclick = () => {
                const isSelected = btn.classList.contains('trait-selected');
                if (isSelected) {
                  btn.classList.remove('trait-selected', 'trait-correct', 'trait-incorrect');
                  const badge = btn.querySelector('.trait-check-badge');
                  if (badge) badge.innerHTML = '';
                } else {
                  btn.classList.add('trait-selected');
                  const isCorrect = trait.isCorrect ?? correctIds.includes(trait.id);
                  const badge = btn.querySelector('.trait-check-badge');
                  if (isCorrect) {
                    btn.classList.add('trait-correct');
                    if (badge) badge.innerHTML = '<i class="bi bi-check-circle-fill"></i>';
                    showBuilderToast(`Awesome! "${trait.label}" is a living characteristic! 🌟`, 'success');
                  } else {
                    btn.classList.add('trait-incorrect');
                    if (badge) badge.innerHTML = '<i class="bi bi-x-circle-fill"></i>';
                    showBuilderToast(`"${trait.label}" is a decoy! Only pick traits living things do on their own.`, 'warning');
                  }
                }
              };
              traitsGrid.appendChild(btn);
            });
          }
        }
      } else {
        if (charBox) charBox.classList.add('d-none');
        if (narrationBox) narrationBox.classList.remove('d-none');
        quizBox.classList.add('d-none');
        heroBox.classList.remove('d-none');
        const lottieBox = document.getElementById('canvasLottieContainer');
        const mediaDisplay = document.getElementById('canvasMediaDisplayArea');
        const animSrc = slide.animationSrc || (typeof slide.image === 'string' && slide.image.endsWith('.json') ? slide.image : null);

        if (animSrc && window.lottie) {
          if (mediaDisplay) mediaDisplay.classList.add('d-none');
          if (lottieBox) {
            lottieBox.classList.remove('d-none');
            lottieBox.innerHTML = '';
            if (window._builderLottieAnim) {
              window._builderLottieAnim.destroy();
              window._builderLottieAnim = null;
            }
            try {
              window._builderLottieAnim = lottie.loadAnimation({
                container: lottieBox,
                renderer: 'svg',
                loop: true,
                autoplay: true,
                path: animSrc
              });
            } catch (err) {
              console.warn("Lottie preview notice:", err);
            }
          }
        } else {
          if (window._builderLottieAnim) {
            window._builderLottieAnim.destroy();
            window._builderLottieAnim = null;
          }
          if (lottieBox) lottieBox.classList.add('d-none');
          if (mediaDisplay) {
            mediaDisplay.classList.remove('d-none');
            const imgs = ensureSlideImages(slide);

            if (slide.type === 'summary') {
              const bullets = Array.isArray(slide.bullets) ? slide.bullets.filter(b => b && b.trim()) : [];
              if (bullets.length > 0) {
                mediaDisplay.innerHTML = `
                  <div class="canvas-summary-preview w-100 p-2">
                    ${imgs.length > 0 ? `
                      <div class="text-center mb-3">
                        <img src="${imgs[0]}" alt="Summary Hero" style="max-height: 120px; max-width: 180px; object-fit: contain; border-radius: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.08));">
                      </div>
                    ` : ''}
                    <div class="d-flex flex-column gap-2">
                      ${bullets.map((b, i) => `
                        <div class="p-2.5 rounded-3 border d-flex align-items-center gap-2 shadow-sm" style="background: #ffffff; border-color: #cbd5e1 !important;">
                          <span class="badge bg-success-subtle text-success border border-success-subtle fw-bold px-2 py-1">⭐ #${i + 1}</span>
                          <span class="fw-semibold text-dark small text-start">${escapeAttr(b)}</span>
                        </div>
                      `).join('')}
                    </div>
                  </div>
                `;
              } else if (imgs.length === 0) {
                mediaDisplay.innerHTML = `
                  <div class="canvas-summary-empty p-4 text-center text-muted">
                    <span class="fs-1 d-block mb-2">🏆</span>
                    <div class="fw-bold fs-6 text-dark mb-1">Milestone Summary</div>
                    <div class="small text-muted">Add summary bullet takeaways or media to celebrate lesson completion!</div>
                  </div>
                `;
              } else if (imgs.length === 1) {
                mediaDisplay.innerHTML = `
                  <div class="canvas-single-hero">
                    <img src="${imgs[0]}" alt="Slide Illustration" class="canvas-hero-img">
                    ${captionLabelHtml(slide, 0, 'canvas-img-caption')}
                  </div>
                `;
              } else {
                mediaDisplay.innerHTML = `
                  <div class="canvas-gallery-grid">
                    ${imgs.map((src, i) => `
                      <div class="canvas-gallery-card">
                        <span class="badge bg-light text-dark border small mb-1">#${i + 1}</span>
                        <img src="${src}" alt="Gallery item ${i + 1}">
                        ${captionLabelHtml(slide, i, 'canvas-img-caption')}
                      </div>
                    `).join('')}
                  </div>
                `;
              }
            } else if (imgs.length === 0) {
              mediaDisplay.innerHTML = `
                <div class="canvas-text-only-placeholder p-4 text-center text-muted">
                  <i class="bi bi-fonts fs-1 text-secondary opacity-50 mb-2 d-block"></i>
                  <span class="fw-bold fs-6 text-dark d-block">Text &amp; Narration Slide</span>
                  <div class="small text-muted mt-1">No images attached. Slide will focus on the explanation and audio narration.</div>
                </div>
              `;
            } else if (imgs.length === 1) {
              mediaDisplay.innerHTML = `
                <div class="canvas-single-hero">
                  <img src="${imgs[0]}" alt="Slide Illustration" class="canvas-hero-img">
                  ${captionLabelHtml(slide, 0, 'canvas-img-caption')}
                </div>
              `;
            } else {
              // 2 or more images: render as interactive explore scene matching student lesson (Image 2)
              mediaDisplay.innerHTML = `
                <div class="canvas-explore-scene">
                  ${imgs.map((src, i) => {
                    const cap = (Array.isArray(slide.captions) && slide.captions[i]) ? slide.captions[i] : `Item ${i + 1}`;
                    return `
                      <div class="canvas-explore-chip" data-index="${i}" data-caption="${escapeAttr(cap)}" title="Tap to inspect ${escapeAttr(cap)}">
                        <img src="${src}" alt="${escapeAttr(cap)}">
                        <span>${escapeAttr(cap)}</span>
                      </div>
                    `;
                  }).join('')}
                </div>
              `;

              // Add interactive click behavior to preview what student sees
              mediaDisplay.querySelectorAll('.canvas-explore-chip').forEach(chip => {
                chip.onclick = function() {
                  mediaDisplay.querySelectorAll('.canvas-explore-chip').forEach(c => c.classList.remove('active-chip'));
                  this.classList.add('active-chip');
                  const cap = this.getAttribute('data-caption');
                  const narration = document.getElementById('canvasNarrationText');
                  if (narration && slide.itemExplanations && slide.itemExplanations[cap]) {
                    narration.textContent = slide.itemExplanations[cap];
                  } else if (narration && cap) {
                    narration.textContent = `${cap}: Tap to explore how it lives and interacts with its environment!`;
                  }
                };
              });
            }
          }
        }
      }

      const backBtn = document.getElementById('canvasBackBtn');
      if (backBtn) {
        backBtn.disabled = currentSlideIndex === 0;
        backBtn.classList.toggle('disabled', currentSlideIndex === 0);
      }
      const nextBtn = document.getElementById('canvasNextBtn');
      if (nextBtn) {
        nextBtn.innerHTML = (currentSlideIndex === slides.length - 1)
          ? 'Finish <i class="bi bi-check-circle-fill ms-1"></i>'
          : 'Next <i class="bi bi-arrow-right ms-1"></i>';
      }
    }

    // Canvas Back/Next navigation
    function canvasStep(dir) {
      const target = currentSlideIndex + dir;
      if (target < 0) return;
      if (target >= slides.length) {
        // Reached the final slide and clicked "Finish"
        if (window.scienceplayConfirm) {
          window.scienceplayConfirm({
            title: "Lesson Complete!",
            message: "🎉 You've reached the end of the lesson! Would you like to Save & Publish this lesson now?",
            confirmText: "Save & Publish",
            confirmClass: "btn-primary",
            iconClass: "bi-trophy-fill text-warning",
            onConfirm: () => submitLessonForm(false)
          });
        } else {
          submitLessonForm(false);
        }
        return;
      }
      selectSlide(target);
    }

    // TTS Preview in Canvas
    function previewCurrentSlideTTS() {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      let textToRead = `${slide.title}. ${slide.type === 'quick-check' ? (slide.prompt || '') : (slide.explanation || '')}`;
      if (slide.type === 'summary' && Array.isArray(slide.bullets) && slide.bullets.length > 0) {
        const bulletText = slide.bullets.filter(Boolean).join('. ');
        if (bulletText) {
          textToRead += `. Key ideas: ${bulletText}`;
        }
      }
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
        showBuilderToast("Speaking aloud...", "info");
      } else {
        showBuilderToast("Speech synthesis not supported in this browser.", "warning");
      }
    }

    // Preset Image Picker
    let teacherAssetsCache = { image: [], animation: [] };

    async function loadTeacherAssets(type = 'image') {
      const gridId = type === 'image' ? 'libraryImagesGrid' : 'libraryAnimationsGrid';
      const badgeId = type === 'image' ? 'badgeImgLibraryCount' : 'badgeAnimLibraryCount';
      const grid = document.getElementById(gridId);
      const badge = document.getElementById(badgeId);

      if (!grid) return;
      grid.innerHTML = '<div class="text-center py-4 text-muted small w-100" style="grid-column: 1 / -1;"><span class="spinner-border spinner-border-sm me-2 text-primary"></span>Loading permanent library...</div>';

      try {
        const res = await fetch(`/teacher/api/assets?type=${type}`);
        const data = await res.json();
        if (data.status === 'success') {
          teacherAssetsCache[type] = data.assets || [];
          if (badge) badge.textContent = teacherAssetsCache[type].length;
          renderLibraryGrid(type);
        } else {
          grid.innerHTML = '<div class="text-center py-3 text-danger small w-100" style="grid-column: 1 / -1;">Failed loading library</div>';
        }
      } catch (err) {
        grid.innerHTML = '<div class="text-center py-3 text-danger small w-100" style="grid-column: 1 / -1;">Could not connect to library</div>';
      }
    }

    function renderLibraryGrid(type = 'image') {
      const gridId = type === 'image' ? 'libraryImagesGrid' : 'libraryAnimationsGrid';
      const grid = document.getElementById(gridId);
      if (!grid) return;

      const assets = teacherAssetsCache[type] || [];
      if (assets.length === 0) {
        grid.innerHTML = `
          <div class="text-center py-4 text-muted w-100" style="grid-column: 1 / -1;">
            <i class="bi bi-inbox fs-2 d-block mb-1 text-secondary opacity-50"></i>
            <div class="small fw-bold">No uploaded ${type}s in your library yet</div>
            <div style="font-size: 0.75rem;">Use the upload box above to permanently save files for all future lessons!</div>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      assets.forEach(asset => {
        const item = document.createElement('div');
        item.className = 'preset-picker-item position-relative';
        item.style.cursor = 'pointer';

        if (type === 'image') {
          item.innerHTML = `
            <img src="${asset.file_url}" alt="${asset.title}" onerror="this.src='/static/images/tree.webp'">
            <div class="small fw-bold text-dark text-truncate" title="${asset.title}">${asset.title}</div>
            <button type="button" class="btn btn-sm btn-light text-danger position-absolute top-0 end-0 m-1 rounded-circle p-0 shadow-sm border d-flex align-items-center justify-content-center" style="width: 22px; height: 22px; font-size: 0.65rem;" title="Delete" onclick="deleteTeacherLibraryAsset(event, ${asset.id}, 'image')">
              <i class="bi bi-trash3-fill"></i>
            </button>
          `;
          item.onclick = (e) => {
            if (e.target.closest('button')) return;
            chooseSlidePresetImage(asset.file_url, asset.title);
          };
        } else {
          item.innerHTML = `
            <div class="fs-1 text-center py-2">✨</div>
            <div class="small fw-bold text-dark text-truncate" title="${asset.title}">${asset.title}</div>
            <button type="button" class="btn btn-sm btn-light text-danger position-absolute top-0 end-0 m-1 rounded-circle p-0 shadow-sm border d-flex align-items-center justify-content-center" style="width: 22px; height: 22px; font-size: 0.65rem;" title="Delete" onclick="deleteTeacherLibraryAsset(event, ${asset.id}, 'animation')">
              <i class="bi bi-trash3-fill"></i>
            </button>
          `;
          item.onclick = (e) => {
            if (e.target.closest('button')) return;
            chooseSlidePresetAnimation(asset.file_url, asset.title);
          };
        }

        grid.appendChild(item);
      });
    }

    async function uploadTeacherLibraryAsset(input, type = 'image') {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];

      const formData = new FormData();
      formData.append('file', file);
      formData.append('csrf_token', getCsrfToken());

      showBuilderToast(`Uploading "${file.name}" to your library...`, 'info');

      try {
        const res = await fetch('/teacher/api/assets/upload', {
          method: 'POST',
          body: formData
        });
        const result = await res.json();
        if (result.status === 'success') {
          showBuilderToast(result.message, 'success');
          input.value = '';
          await loadTeacherAssets(type);
          if (type === 'image') {
            chooseSlidePresetImage(result.asset.file_url, result.asset.title);
          } else {
            chooseSlidePresetAnimation(result.asset.file_url, result.asset.title);
          }
        } else {
          showBuilderToast(result.message || 'Upload failed', 'danger');
          input.value = '';
        }
      } catch (err) {
        showBuilderToast('Error uploading asset to server', 'danger');
        input.value = '';
      }
    }

    async function deleteTeacherLibraryAsset(event, assetId, type) {
      event.stopPropagation();
      const doDelete = async () => {
        const formData = new FormData();
        formData.append('csrf_token', getCsrfToken());

        try {
          const res = await fetch(`/teacher/api/assets/${assetId}/delete`, {
            method: 'POST',
            body: formData
          });
          const result = await res.json();
          if (result.status === 'success') {
            showBuilderToast('Asset removed from library', 'info');
            await loadTeacherAssets(type);
          } else {
            showBuilderToast(result.message || 'Could not delete asset', 'danger');
          }
        } catch (err) {
          showBuilderToast('Failed communicating with server', 'danger');
        }
      };

      if (window.scienceplayConfirm) {
        window.scienceplayConfirm({
          title: "Delete Asset?",
          message: "Remove this asset from your permanent library?",
          confirmText: "Delete",
          confirmClass: "btn-danger",
          iconClass: "bi-trash3-fill text-danger",
          onConfirm: doDelete
        });
      } else {
        doDelete();
      }
    }

    let activeImagePickerMode = { action: 'add', index: null };

    function openSlidePresetPicker(mode = 'add', targetIdx = null) {
      activeImagePickerMode = { action: mode, index: targetIdx };
      const modalEl = document.getElementById('presetImageModal');
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      loadTeacherAssets('image');
    }

    function chooseSlidePresetImage(src, label) {
      const slide = slides[currentSlideIndex];
      if (slide) {
        if (activeImagePickerMode?.action === 'choice_icon') {
          const optIdx = activeImagePickerMode.index;
          if (slide.options && slide.options[optIdx]) {
            slide.options[optIdx].icon = src;
            if (label && (!slide.options[optIdx].label || slide.options[optIdx].label.startsWith('Choice '))) {
              slide.options[optIdx].label = label;
            }
            renderQuizOptionsEditor();
            updateCanvasPreview();
            showBuilderToast(`Updated Choice #${optIdx + 1} image to "${label || 'illustration'}"!`, "success");
          }
          const modalEl = document.getElementById('presetImageModal');
          bootstrap.Modal.getInstance(modalEl)?.hide();
          return;
        }

        if (activeImagePickerMode?.action === 'char_obj') {
          if (!slide.object) slide.object = {};
          slide.object.image = src;
          slide.image = src;
          if (label && (!slide.object.label || slide.object.label === 'Fish' || slide.object.label === 'Subject')) {
            slide.object.label = label;
          }
          loadSlideIntoEditor();
          updateCanvasPreview();
          showBuilderToast(`Updated subject image to "${label || 'illustration'}"!`, "success");
          const modalEl = document.getElementById('presetImageModal');
          bootstrap.Modal.getInstance(modalEl)?.hide();
          return;
        }

        const imgs = ensureSlideImages(slide);
        if (activeImagePickerMode?.action === 'add') {
          if (imgs.length < 4) {
            imgs.push(src);
            slide.captions.push(label || '');
            showBuilderToast(`Added ${label || 'illustration'} to slide!`, "success");
          } else {
            showBuilderToast("Maximum 4 images allowed per slide.", "warning");
          }
        } else if (activeImagePickerMode?.action === 'replace') {
          const idx = activeImagePickerMode.index ?? 0;
          imgs[idx] = src;
          if (label) slide.captions[idx] = label;
          showBuilderToast(`Replaced Image #${idx + 1}!`, "success");
        } else {
          slide.images = [src];
        }
        slide.image = imgs[0];
        loadSlideIntoEditor();
        updateCanvasPreview();
      }
      const modalEl = document.getElementById('presetImageModal');
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }

    // Characteristics (Multi-Select Traits) Editor Handlers
    function renderCharacteristicsTraitsEditor() {
      const container = document.getElementById('characteristicsTraitsEditor');
      if (!container) return;
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      if (!Array.isArray(slide.traits)) {
        slide.traits = [];
      }
      container.innerHTML = '';

      if (slide.traits.length === 0) {
        container.innerHTML = `
          <div class="text-center py-2 text-muted small bg-white rounded-3 border">
            No traits yet. Click <strong class="text-primary">+ Add Trait</strong> to create interactive trait buttons.
          </div>
        `;
        return;
      }

      slide.traits.forEach((trait, idx) => {
        const item = document.createElement('div');
        item.className = `characteristics-trait-item ${trait.isCorrect ? 'is-correct-trait' : ''}`;
        item.innerHTML = `
          <input type="checkbox" class="form-check-input mt-0 me-1" ${trait.isCorrect ? 'checked' : ''} title="Mark as correct living trait" onchange="toggleCharacteristicsTraitCorrect(${idx}, this.checked)" style="cursor: pointer;">
          <input type="text" class="form-control form-control-sm rounded-2 fw-bold" value="${escapeAttr(trait.label)}" placeholder="Trait label" oninput="updateCharacteristicsTraitLabel(${idx}, this.value)">
          <button type="button" class="btn btn-outline-danger btn-sm p-1 border-0 rounded-2" onclick="removeCharacteristicsTrait(${idx})" title="Remove trait">✕</button>
        `;
        container.appendChild(item);
      });
    }

    function addCharacteristicsTrait() {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      if (!Array.isArray(slide.traits)) slide.traits = [];
      if (slide.traits.length >= 8) {
        showBuilderToast("Maximum 8 traits recommended for clean layout.", "warning");
        return;
      }
      const newId = `trait-${Date.now()}`;
      slide.traits.push({ id: newId, label: 'New Trait', isCorrect: true });
      if (!Array.isArray(slide.correctTraits)) slide.correctTraits = [];
      slide.correctTraits.push(newId);
      renderCharacteristicsTraitsEditor();
      updateCanvasPreview();
      showBuilderToast('Added new trait button!', 'success');
      setTimeout(() => {
        const inputs = document.querySelectorAll('#characteristicsTraitsEditor input[type="text"]');
        if (inputs.length) inputs[inputs.length - 1].focus();
      }, 50);
    }

    function toggleCharacteristicsTraitCorrect(idx, checked) {
      const slide = slides[currentSlideIndex];
      if (!slide || !slide.traits || !slide.traits[idx]) return;
      slide.traits[idx].isCorrect = Boolean(checked);
      const tid = slide.traits[idx].id;
      if (!Array.isArray(slide.correctTraits)) slide.correctTraits = [];
      if (checked) {
        if (!slide.correctTraits.includes(tid)) slide.correctTraits.push(tid);
      } else {
        slide.correctTraits = slide.correctTraits.filter(id => id !== tid);
      }
      renderCharacteristicsTraitsEditor();
      updateCanvasPreview();
    }

    function updateCharacteristicsTraitLabel(idx, label) {
      const slide = slides[currentSlideIndex];
      if (!slide || !slide.traits || !slide.traits[idx]) return;
      slide.traits[idx].label = label;
      updateCanvasPreview();
    }

    function removeCharacteristicsTrait(idx) {
      const slide = slides[currentSlideIndex];
      if (!slide || !slide.traits || !slide.traits[idx]) return;
      if (slide.traits.length <= 2) {
        showBuilderToast("Activity needs at least 2 traits.", "warning");
        return;
      }
      const tid = slide.traits[idx].id;
      slide.traits.splice(idx, 1);
      if (Array.isArray(slide.correctTraits)) {
        slide.correctTraits = slide.correctTraits.filter(id => id !== tid);
      }
      renderCharacteristicsTraitsEditor();
      updateCanvasPreview();
    }

    function updateCharacteristicsPrompt(val) {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      slide.description = val;
      slide.prompt = val;
      const bannerEl = document.getElementById('canvasCharacteristicsBanner');
      if (bannerEl) bannerEl.textContent = val || 'Tap all the traits that prove this subject is alive! 🐟';
    }

    function updateCharacteristicsObjField(field, val) {
      const slide = slides[currentSlideIndex];
      if (!slide) return;
      if (!slide.object) slide.object = {};
      slide.object[field] = val;
      if (field === 'explanation') {
        slide.explanation = val;
      }
      updateCanvasPreview();
    }

    function openCharacteristicsPresetPicker() {
      activeImagePickerMode = { action: 'char_obj', index: null };
      const modalEl = document.getElementById('presetImageModal');
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      loadTeacherAssets('image');
    }

    // Preset Animation Picker
    function openAnimationPresetPicker() {
      const modalEl = document.getElementById('presetAnimationModal');
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      loadTeacherAssets('animation');
    }

    function chooseSlidePresetAnimation(src, label) {
      const slide = slides[currentSlideIndex];
      if (slide) {
        slide.animationSrc = src;
        slide.animationLabel = label;
        slide.image = src;
        loadSlideIntoEditor();
        updateCanvasPreview();
        showBuilderToast(`Animation attached: ${label}`, "success");
      }
      const modalEl = document.getElementById('presetAnimationModal');
      bootstrap.Modal.getInstance(modalEl)?.hide();
    }

    function clearSlideAnimation() {
      const slide = slides[currentSlideIndex];
      if (slide) {
        delete slide.animationSrc;
        delete slide.animationLabel;
        slide.image = '/static/images/tree.webp';
        loadSlideIntoEditor();
        updateCanvasPreview();
        showBuilderToast("Animation removed", "info");
      }
    }

    // File upload (images + animations)
    async function handleSlideFileUpload(input) {
      if (!input.files || !input.files[0]) return;
      const file = input.files[0];
      const validExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'json'];
      const ext = (file.name.split('.').pop() || '').toLowerCase();

      if (!validExtensions.includes(ext)) {
        showBuilderToast("Supported files: .png, .jpg, .webp, .gif, or .json animation", "danger");
        input.value = '';
        return;
      }

      showBuilderToast(`Processing "${file.name}"...`, 'info');

      const uploadToServer = async (fileToUpload) => {
        const formData = new FormData();
        formData.append('file', fileToUpload);
        formData.append('csrf_token', getCsrfToken());

        const res = await fetch('/teacher/api/assets/upload', {
          method: 'POST',
          body: formData
        });
        return await res.json();
      };

      if (ext === 'json') {
        try {
          const text = await file.text();
          JSON.parse(text);
          const uploadResult = await uploadToServer(file);
          const slide = slides[currentSlideIndex];
          if (uploadResult.status === 'success' && uploadResult.asset?.file_url) {
            slide.animationSrc = uploadResult.asset.file_url;
            slide.animationLabel = uploadResult.asset.title || file.name;
            slide.image = uploadResult.asset.file_url;
          } else {
            slide.animationSrc = text;
            slide.animationLabel = file.name;
            slide.image = text;
          }
          loadSlideIntoEditor();
          updateCanvasPreview();
          showBuilderToast(`Animation attached: ${file.name}`, "success");
        } catch (err) {
          showBuilderToast("Invalid Lottie JSON animation file.", "danger");
        }
        input.value = '';
      } else {
        const img = new Image();
        const reader = new FileReader();
        reader.onload = function(e) {
          img.onload = async function() {
            const maxDim = 1200;
            let width = img.width;
            let height = img.height;
            if (width > maxDim || height > maxDim) {
              if (width > height) {
                height = Math.round((height * maxDim) / width);
                width = maxDim;
              } else {
                width = Math.round((width * maxDim) / height);
                height = maxDim;
              }
            }
            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(async (blob) => {
              const readyFile = blob ? new File([blob], file.name.replace(/\.[^.]+$/, '.webp'), { type: 'image/webp' }) : file;
              try {
                const uploadResult = await uploadToServer(readyFile);
                const slide = slides[currentSlideIndex];
                delete slide.animationSrc;
                delete slide.animationLabel;
                const imgs = ensureSlideImages(slide);
                const finalUrl = (uploadResult.status === 'success' && uploadResult.asset?.file_url) ? uploadResult.asset.file_url : e.target.result;

                if (imgs.length < 4) {
                  imgs.push(finalUrl);
                  slide.captions.push(file.name.replace(/\.[^.]+$/, ''));
                  showBuilderToast(`Uploaded and added image to slide (${imgs.length}/4)!`, "success");
                } else {
                  imgs[imgs.length - 1] = finalUrl;
                  showBuilderToast("Updated latest image on slide!", "success");
                }
                slide.image = imgs[0];
                loadSlideIntoEditor();
                updateCanvasPreview();
              } catch (err) {
                showBuilderToast("Image attached to slide", "success");
              }
              input.value = '';
            }, 'image/webp', 0.85);
          };
          img.src = e.target.result;
        };
        reader.readAsDataURL(file);
      }
    }

    // Load Starter Lesson Presets
    function loadLessonPreset(presetKey) {
      const p = LESSON_PRESETS[presetKey];
      if (!p) return;

      document.getElementById('lessonTitleInput').value = p.title;
      document.getElementById('lessonDescInput').value = p.description;
      if (p.term) {
        const termSel = document.getElementById('lessonTermInput');
        if (termSel) termSel.value = p.term;
      }
      slides = JSON.parse(JSON.stringify(p.slides));
      currentSlideIndex = 0;

      renderSlideStrip();
      loadSlideIntoEditor();
      updateCanvasPreview();
      showBuilderToast(`Loaded lesson template: "${p.title}"`, "success");
    }

    // Form Submission
    function submitLessonForm(isDraft = false) {
      const isDraftInput = document.getElementById('isDraftInput');
      if (isDraftInput) {
        isDraftInput.value = isDraft ? '1' : '0';
      }

      const titleInput = document.getElementById('lessonTitleInput');
      let title = titleInput.value.trim();
      if (!title) {
        if (isDraft) {
          title = 'Untitled Lesson Draft';
          titleInput.value = title;
        } else {
          showBuilderToast("Please enter a lesson title.", "warning");
          titleInput.focus();
          return;
        }
      }

      if (!isDraft && slides.length === 0) {
        showBuilderToast("Please add at least 1 slide to this lesson.", "warning");
        return;
      }

      document.getElementById('slidesDataInput').value = JSON.stringify(slides);
      document.getElementById('lessonBuilderForm').submit();
    }

    document.getElementById('btn-save-lesson')?.addEventListener('click', () => submitLessonForm(false));
    document.getElementById('btn-save-lesson-top')?.addEventListener('click', () => submitLessonForm(false));
    document.getElementById('btn-save-draft')?.addEventListener('click', () => submitLessonForm(true));
    document.getElementById('btn-save-draft-top')?.addEventListener('click', () => submitLessonForm(true));

    document.addEventListener('DOMContentLoaded', () => {
      if (new URLSearchParams(location.search).get('preset') === 'basic_needs' && LESSON_PRESETS.basic_needs) {
        loadLessonPreset('basic_needs');
        return;
      }

      const titleInput = document.getElementById('lessonTitleInput');
      if (titleInput) {
        titleInput.addEventListener('input', (e) => {
          const val = e.target.value.trim();
          if (!val) return;
          slides.forEach(s => {
            if (s.type === 'summary') {
              if (!s.title || s.title === 'Living vs Non-Living: Big Ideas' || s.title.endsWith(': Big Ideas') || s.title.startsWith('Living vs Non-Living')) {
                s.title = `${val}: Big Ideas`;
              }
              if (!s.explanation || s.explanation.includes('Living things grow, breathe, and need food')) {
                s.explanation = `Great job! You have explored and completed the core concepts of ${val}.`;
              }
            }
          });
          renderSlideStrip();
          loadSlideIntoEditor();
          updateCanvasPreview();
        });
      }

      renderSlideStrip();
      loadSlideIntoEditor();
      updateCanvasPreview();
    });

    window.openChoicePresetPicker = openChoicePresetPicker;
    window.openSlidePresetPicker = openSlidePresetPicker;
    window.chooseSlidePresetImage = chooseSlidePresetImage;
    window.addSummaryBullet = addSummaryBullet;
    window.updateSummaryBullet = updateSummaryBullet;
    window.removeSummaryBullet = removeSummaryBullet;
    window.removeSlideImage = removeSlideImage;
    window.toggleCanvasExpand = toggleCanvasExpand;
    window.handleSlideFileUpload = handleSlideFileUpload;

    // Characteristics exports
    window.renderCharacteristicsTraitsEditor = renderCharacteristicsTraitsEditor;
    window.addCharacteristicsTrait = addCharacteristicsTrait;
    window.toggleCharacteristicsTraitCorrect = toggleCharacteristicsTraitCorrect;
    window.updateCharacteristicsTraitLabel = updateCharacteristicsTraitLabel;
    window.removeCharacteristicsTrait = removeCharacteristicsTrait;
    window.updateCharacteristicsPrompt = updateCharacteristicsPrompt;
    window.updateCharacteristicsObjField = updateCharacteristicsObjField;
    window.openCharacteristicsPresetPicker = openCharacteristicsPresetPicker;
