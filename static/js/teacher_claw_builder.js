// Initial data from server: support 2 to 4 chutes
const clawConfig = window.CLAW_BUILDER_CONFIG || {};
const getCsrfToken = () => clawConfig.csrfToken || document.querySelector('input[name="csrf_token"]')?.value || "";
let rawBins = clawConfig.rawBins || [];

let chutes = Array.isArray(rawBins) && rawBins.length >= 2
  ? rawBins.slice(0, 6)
  : [
      {"id": "category_1", "label": "", "icon": "📦", "color": "#3b82f6"},
      {"id": "category_2", "label": "", "icon": "⭐", "color": "#10b981"}
    ];

let objects = clawConfig.objects || [];

let activeObjectPickerIndex = null;

// TOPIC PRESETS (Multi-chute support: 2, 3, or 4 chutes)
const TOPIC_PRESETS = {
  living_vs_nonliving: {
    title: "Living vs Non-Living Sorting",
    instructions: "Sort objects into Living and Non-Living chutes to win stars.",
    round_size: 8,
    bins: [
      { id: "living", label: "Living", icon: "🌱", color: "#4ade80" },
      { id: "non-living", label: "Non-Living", icon: "🪨", color: "#fb923c" }
    ],
    objects: [
      { label: "Dog", categoryId: "living", explanation: "Dogs are living animals that breathe, eat, and grow.", image: "/static/images/dog.webp" },
      { label: "Cat", categoryId: "living", explanation: "Cats are living animals that grow and reproduce.", image: "/static/images/cat.webp" },
      { label: "Tree", categoryId: "living", explanation: "Trees are living plants that absorb water and sunlight.", image: "/static/images/tree.webp" },
      { label: "Flower", categoryId: "living", explanation: "Flowers are living organisms that need sunlight and water.", image: "/static/images/flower.webp" },
      { label: "Rock", categoryId: "non-living", explanation: "Rocks do not eat, breathe, or reproduce.", image: "/static/images/rock.webp" },
      { label: "Wooden Chair", categoryId: "non-living", explanation: "A manufactured chair is an inanimate object.", image: "/static/images/chair.webp" },
      { label: "Bicycle", categoryId: "non-living", explanation: "A bicycle is a manufactured machine and is not alive.", image: "/static/images/bicycle.webp" },
      { label: "Rubber Ball", categoryId: "non-living", explanation: "A rubber ball is non-living.", image: "/static/images/ball.webp" }
    ]
  },
  states_of_matter: {
    title: "States of Matter Sorting",
    instructions: "Sort each object into Solid, Liquid, or Gas chutes to win stars.",
    round_size: 6,
    bins: [
      { id: "solid", label: "Solid", icon: "🧊", color: "#60a5fa" },
      { id: "liquid", label: "Liquid", icon: "💧", color: "#38bdf8" },
      { id: "gas", label: "Gas", icon: "💨", color: "#a855f7" }
    ],
    objects: [
      { label: "Ice Cube", categoryId: "solid", explanation: "Ice holds a fixed shape firmly as a solid.", image: "/static/images/rock.webp" },
      { label: "Water Puddle", categoryId: "liquid", explanation: "Water flows and takes the shape of its container.", image: "/static/images/puddle.webp" },
      { label: "Steam / Vapor", categoryId: "gas", explanation: "Steam expands to fill all available space as a gas.", image: "/static/images/puddle.webp" },
      { label: "Wooden Chair", categoryId: "solid", explanation: "A chair is solid and keeps its own rigid shape.", image: "/static/images/chair.webp" },
      { label: "Rock", categoryId: "solid", explanation: "Rocks have definite shapes and volumes as solids.", image: "/static/images/rock.webp" },
      { label: "Bicycle", categoryId: "solid", explanation: "A bicycle is made of solid parts that keep their shape.", image: "/static/images/bicycle.webp" }
    ]
  },
      waste_sorting: {
        title: "Eco Waste & Recycling Sort",
        instructions: "Sort materials into Organic Compost or Recyclable chutes.",
        round_size: 6,
        bins: [
          { id: "organic", label: "Organic Compost", icon: "🍂", color: "#84cc16" },
          { id: "recyclable", label: "Recyclable", icon: "♻️", color: "#06b6d4" }
        ],
        objects: [
          { label: "Fallen Leaves", categoryId: "organic", explanation: "Leaves decompose naturally into rich garden compost.", image: "/static/images/plant.webp" },
          { label: "Tree Branch", categoryId: "organic", explanation: "Wood branches are organic matter that break down naturally.", image: "/static/images/tree.webp" },
          { label: "Plastic Bottle", categoryId: "recyclable", explanation: "Clean plastic can be melted and reprocessed into new goods.", image: "/static/images/puddle.webp" },
          { label: "Plant", categoryId: "organic", explanation: "Plant materials decompose organically in compost bins.", image: "/static/images/plant.webp" }
        ]
      },
      herbivore_vs_carnivore: {
        title: "Herbivore vs Carnivore Animals",
        instructions: "Sort animals by their diet into Herbivore or Carnivore.",
        round_size: 6,
        bins: [
          { id: "herbivore", label: "Herbivore (Plant Eater)", icon: "🌿", color: "#22c55e" },
          { id: "carnivore", label: "Carnivore (Meat Eater)", icon: "🥩", color: "#ef4444" }
        ],
        objects: [
          { label: "Butterfly", categoryId: "herbivore", explanation: "Butterflies feed on plant nectar.", image: "/static/images/butterfly.webp" },
          { label: "Cat", categoryId: "carnivore", explanation: "Cats are carnivores that hunt and eat meat.", image: "/static/images/cat.webp" },
          { label: "Fish", categoryId: "carnivore", explanation: "Predatory fish feed on smaller animals.", image: "/static/images/fish.webp" },
          { label: "Bird", categoryId: "herbivore", explanation: "Many birds feed primarily on seeds and berries.", image: "/static/images/bird.webp" }
        ]
      }
    };

    // MODERN IN-APP TOAST SYSTEM (Replaces disruptive browser alerts/confirms)
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
        const bsToast = window.bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
        bsToast.show();
      }
    }

    function loadTopicPreset(presetKey) {
      const p = TOPIC_PRESETS[presetKey];
      if (!p) return;

      document.getElementById('activityTitleInput').value = p.title;
      document.getElementById('activityInstructionsInput').value = p.instructions;
      document.getElementById('roundSizeInput').value = p.round_size;

      chutes = JSON.parse(JSON.stringify(p.bins));
      objects = JSON.parse(JSON.stringify(p.objects));

      renderChutes();
      renderObjects();
      updateLiveCanvas();
      showBuilderToast(`Loaded preset template: "${p.title}"`, 'success');
    }

    window.addChute = function() {
      if (chutes.length >= 6) {
        showBuilderToast("Maximum 6 category chutes supported for the arcade cabinet.", "warning");
        return;
      }
      const defaultColors = ['#4ade80', '#fb923c', '#60a5fa', '#a855f7', '#f43f5e', '#06b6d4'];
      const defaultIcons = ['🌱', '🪨', '💧', '💨', '⚡', '📦'];
      const nextIdx = chutes.length;
      chutes.push({
        id: `category_${nextIdx + 1}`,
        label: `Chute ${nextIdx + 1}`,
        icon: defaultIcons[nextIdx] || '📦',
        color: defaultColors[nextIdx] || '#a855f7'
      });
      renderChutes();
      updateLiveCanvas();
      showBuilderToast(`Added Chute ${chutes.length}! You can now sort items into ${chutes.length} categories.`, "success");
    };

    window.removeChute = function(idx) {
      if (chutes.length <= 2) {
        showBuilderToast("At least 2 chutes are required for a sorting game.", "warning");
        return;
      }
      const removedId = chutes[idx].id;
      chutes.splice(idx, 1);
      const fallbackId = chutes[0].id;
      objects.forEach(obj => {
        if (obj.categoryId === removedId) {
          obj.categoryId = fallbackId;
        }
      });
      renderChutes();
      updateLiveCanvas();
      showBuilderToast("Chute removed. Objects re-mapped to the first chute.", "info");
    };

    // RENDER CHUTES (2 TO 6 CHUTES)
    function renderChutes() {
      const container = document.getElementById('chutesContainer');
      if (!container) return;
      container.innerHTML = '';

      if (chutes.length < 2) {
        chutes = [
          { id: "category_1", label: "Left Category", icon: "🌱", color: "#4ade80" },
          { id: "category_2", label: "Right Category", icon: "🪨", color: "#fb923c" }
        ];
      } else if (chutes.length > 6) {
        chutes = chutes.slice(0, 6);
      }

      const countBadge = document.getElementById('chutesCountBadge');
      if (countBadge) {
        countBadge.innerHTML = `<i class="bi bi-layout-split me-1"></i>${chutes.length} Chutes Configured`;
      }
      const addBtn = document.getElementById('btnAddChute');
      if (addBtn) {
        addBtn.style.display = chutes.length >= 6 ? 'none' : 'inline-flex';
      }

      const colClass = chutes.length === 2 ? 'col-12 col-md-6' : (chutes.length === 3 ? 'col-12 col-md-4' : (chutes.length === 4 ? 'col-12 col-md-6 col-lg-3' : 'col-12 col-sm-6 col-lg-4'));

      chutes.forEach((chute, idx) => {
        const col = document.createElement('div');
        col.className = colClass;

        const currentColor = chute.color || '#4ade80';
        const leftCount = Math.ceil(chutes.length / 2);
        const isLeft = idx < leftCount;
        const sideLabel = isLeft ? `Left Side (${idx + 1}/${leftCount})` : `Right Side (${idx - leftCount + 1}/${chutes.length - leftCount})`;

        col.innerHTML = `
          <div class="chute-config-card" id="chute_card_${idx}">
            <div class="chute-accent-bar" id="chute_accent_${idx}" style="background-color: ${currentColor};"></div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge ${isLeft ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-warning-subtle text-dark border-warning-subtle'} border fw-bold d-inline-flex align-items-center gap-1 px-2 py-1 shadow-sm">
                <i class="bi ${isLeft ? 'bi-arrow-left-circle-fill' : 'bi-arrow-right-circle-fill'}"></i> Chute ${idx + 1}
              </span>
              <div class="d-flex align-items-center gap-1">
                <span class="badge bg-light text-secondary border small fw-semibold">${sideLabel}</span>
                ${chutes.length > 2 ? `
                  <button type="button" class="btn btn-outline-danger btn-sm border-0 p-0 ms-1" onclick="removeChute(${idx})" title="Delete Chute">
                    <i class="bi bi-trash3-fill text-danger fs-6"></i>
                  </button>
                ` : ''}
              </div>
            </div>

            <div class="chute-card-layout">
              <div>
                <div class="mini-arcade-bin position-relative" id="mini_bin_${idx}" style="background: linear-gradient(180deg, ${currentColor} 0%, rgba(15, 23, 42, 0.45) 140%), ${currentColor}; cursor: pointer;" onclick="openChuteEmojiPicker(${idx})" title="Click to choose icon / emoji for this chute">
                  <div class="mini-bin-icon" id="mini_icon_${idx}">${chute.icon || '📦'}</div>
                  <div class="mini-bin-title" id="mini_label_${idx}">${chute.label || `Chute ${idx + 1}`}</div>
                  <div class="mini-bin-catch"></div>
                  <span class="position-absolute top-0 end-0 m-1 badge bg-dark bg-opacity-50 text-white rounded-pill px-1.5 py-0.5 mini-bin-edit-badge" style="font-size: 0.6rem; opacity: 0.7; transition: opacity 0.2s;" title="Edit icon">
                    <i class="bi bi-pencil-fill"></i>
                  </span>
                </div>
                <div class="text-center text-muted mt-1" style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em;">IN-GAME LOOK</div>
              </div>

              <div>
                <div class="mb-2">
                  <label class="form-label text-muted small fw-bold mb-1">Chute Label <span class="text-danger">*</span></label>
                  <input type="text" class="form-control form-control-sm fw-bold rounded-3" value="${chute.label}" oninput="updateChuteField(${idx}, 'label', this.value)" required placeholder="e.g. Solid or Living">
                </div>

                <div class="row g-2 align-items-end">
                  <div class="col-5">
                    <label class="form-label text-muted small fw-bold mb-1 d-flex justify-content-between align-items-center">
                      <span>Emoji / Icon</span>
                      <button type="button" class="btn btn-link p-0 text-primary text-decoration-none fw-bold" style="font-size: 0.7rem;" onclick="openChuteEmojiPicker(${idx})">
                        <i class="bi bi-pencil-square me-1"></i>Pick
                      </button>
                    </label>
                    <div class="input-group input-group-sm chute-emoji-input-group shadow-xs">
                      <input type="text" class="form-control form-control-sm text-center fs-5 rounded-start-3 p-1 fw-bold bg-white" style="border: 1.5px solid #cbd5e1; border-right: none;" id="chute_icon_input_${idx}" value="${chute.icon || '📦'}" oninput="updateChuteField(${idx}, 'icon', this.value)" maxlength="6" placeholder="📦" title="Type or paste emoji directly">
                      <button class="btn btn-outline-primary rounded-end-3 px-2 d-flex align-items-center justify-content-center" style="border: 1.5px solid #cbd5e1; border-left: 1px solid #e2e8f0;" type="button" onclick="openChuteEmojiPicker(${idx})" title="Choose from Emoji Library">
                        <i class="bi bi-emoji-smile-fill"></i>
                      </button>
                    </div>
                  </div>
                  <div class="col-7">
                    <label class="form-label text-muted small fw-bold mb-1">Glow Color</label>
                    <div class="d-flex align-items-center gap-1 flex-wrap pt-0.5">
                      <input type="color" class="color-picker-btn" id="chute_picker_${idx}" value="${currentColor}" oninput="updateChuteField(${idx}, 'color', this.value)" title="Choose custom color">
                      <button type="button" class="color-swatch-circle" style="background-color: #4ade80;" onclick="updateChuteField(${idx}, 'color', '#4ade80')" title="Green"></button>
                      <button type="button" class="color-swatch-circle" style="background-color: #60a5fa;" onclick="updateChuteField(${idx}, 'color', '#60a5fa')" title="Blue"></button>
                      <button type="button" class="color-swatch-circle" style="background-color: #fb923c;" onclick="updateChuteField(${idx}, 'color', '#fb923c')" title="Orange"></button>
                      <button type="button" class="color-swatch-circle" style="background-color: #ec4899;" onclick="updateChuteField(${idx}, 'color', '#ec4899')" title="Pink"></button>
                      <button type="button" class="color-swatch-circle" style="background-color: #a855f7;" onclick="updateChuteField(${idx}, 'color', '#a855f7')" title="Purple"></button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        `;
        container.appendChild(col);
      });

      // Synchronize category dropdowns on objects
      renderObjects();
    }

    function updateChuteField(idx, field, value) {
      chutes[idx][field] = value;
      if (field === 'label') {
        chutes[idx].id = value.toLowerCase().replace(/[^a-z0-9]/g, '_') || `category_${idx + 1}`;
        const lbl = document.getElementById(`mini_label_${idx}`);
        if (lbl) lbl.textContent = value || 'Chute';
      }
      if (field === 'icon') {
        const ico = document.getElementById(`mini_icon_${idx}`);
        if (ico) ico.textContent = value || '📦';
        const inp = document.getElementById(`chute_icon_input_${idx}`);
        if (inp && inp.value !== value) inp.value = value;
      }
      if (field === 'color') {
        const bin = document.getElementById(`mini_bin_${idx}`);
        if (bin) bin.style.background = `linear-gradient(180deg, ${value} 0%, rgba(15, 23, 42, 0.45) 140%), ${value}`;
        const accent = document.getElementById(`chute_accent_${idx}`);
        if (accent) accent.style.backgroundColor = value;
        const picker = document.getElementById(`chute_picker_${idx}`);
        if (picker && picker.value !== value) picker.value = value;
      }
      renderObjects();
      updateLiveCanvas();
    }

    // CHUTE EMOJI PICKER MODAL CONTROLLER
    let activeChuteEmojiIndex = null;

    const CHUTE_EMOJI_CATEGORIES = [
      {
        name: "States of Matter & Science",
        icon: "bi-droplet-half",
        emojis: [
          { emoji: "💧", label: "Water / Liquid" },
          { emoji: "🧊", label: "Ice / Solid" },
          { emoji: "💨", label: "Gas / Air / Vapor" },
          { emoji: "🔥", label: "Fire / Heat" },
          { emoji: "🪨", label: "Rock / Solid Mineral" },
          { emoji: "⚡", label: "Electricity / Energy" },
          { emoji: "🧪", label: "Chemical / Flask" },
          { emoji: "🔬", label: "Microscope / Lab" },
          { emoji: "🧲", label: "Magnet / Magnetic Force" },
          { emoji: "💡", label: "Light / Bulb" },
          { emoji: "☀️", label: "Sun / Solar Heat" },
          { emoji: "🌪️", label: "Tornado / Wind" },
          { emoji: "🌋", label: "Volcano / Earth Science" },
          { emoji: "🌊", label: "Wave / Water Current" },
          { emoji: "❄️", label: "Snowflake / Freezing" },
          { emoji: "🪐", label: "Planet / Astronomy" },
          { emoji: "🌈", label: "Rainbow / Light Optics" },
          { emoji: "🌡️", label: "Thermometer / Temperature" }
        ]
      },
      {
        name: "Living & Biology",
        icon: "bi-flower1",
        emojis: [
          { emoji: "🌱", label: "Seedling / Plant Growth" },
          { emoji: "🌿", label: "Herb / Leaves" },
          { emoji: "🌳", label: "Tree / Flora" },
          { emoji: "🌺", label: "Flower / Bloom" },
          { emoji: "🍄", label: "Fungi / Mushroom" },
          { emoji: "🐶", label: "Dog / Animal" },
          { emoji: "🐱", label: "Cat / Mammal" },
          { emoji: "🐟", label: "Fish / Aquatic Life" },
          { emoji: "🐦", label: "Bird / Avian" },
          { emoji: "🦋", label: "Butterfly / Insect" },
          { emoji: "🐢", label: "Turtle / Reptile" },
          { emoji: "🐸", label: "Frog / Amphibian" },
          { emoji: "🦠", label: "Microbe / Bacteria" },
          { emoji: "🦴", label: "Bone / Skeletal" },
          { emoji: "🫀", label: "Heart / Organ" },
          { emoji: "🧠", label: "Brain / Nervous System" },
          { emoji: "🍎", label: "Apple / Organic Fruit" },
          { emoji: "🥕", label: "Carrot / Plant Food" }
        ]
      },
      {
        name: "Materials & Objects",
        icon: "bi-box-seam",
        emojis: [
          { emoji: "📦", label: "Box / Parcel" },
          { emoji: "🪵", label: "Wood / Timber" },
          { emoji: "🧱", label: "Brick / Inanimate Solid" },
          { emoji: "💎", label: "Gem / Crystal" },
          { emoji: "⚙️", label: "Gear / Mechanical Metal" },
          { emoji: "🗑️", label: "Trash / Waste" },
          { emoji: "♻️", label: "Recycling / Eco" },
          { emoji: "🧴", label: "Plastic Bottle" },
          { emoji: "📄", label: "Paper / Non-living" },
          { emoji: "🔋", label: "Battery / Electric Power" },
          { emoji: "🚗", label: "Car / Vehicle" },
          { emoji: "🚀", label: "Rocket / Aerospace" },
          { emoji: "📚", label: "Book / Learning" },
          { emoji: "✏️", label: "Pencil / School Tool" },
          { emoji: "✂️", label: "Scissors / Metal Tool" },
          { emoji: "🔔", label: "Bell / Sound Energy" },
          { emoji: "🔧", label: "Wrench / Hardware" },
          { emoji: "🪞", label: "Mirror / Reflection" }
        ]
      },
      {
        name: "Colors & Symbols",
        icon: "bi-palette",
        emojis: [
          { emoji: "⭐", label: "Star" },
          { emoji: "🌟", label: "Glowing Star" },
          { emoji: "🎯", label: "Target / Goal" },
          { emoji: "🏆", label: "Trophy / Winner" },
          { emoji: "🟢", label: "Green Circle" },
          { emoji: "🔴", label: "Red Circle" },
          { emoji: "🔵", label: "Blue Circle" },
          { emoji: "🟡", label: "Yellow Circle" },
          { emoji: "🟣", label: "Purple Circle" },
          { emoji: "🟠", label: "Orange Circle" },
          { emoji: "⚪", label: "White Circle" },
          { emoji: "⬛", label: "Black Square" },
          { emoji: "❓", label: "Question / Unknown" },
          { emoji: "❗", label: "Exclamation / Important" },
          { emoji: "✅", label: "Check / Correct" },
          { emoji: "❌", label: "Cross / False" },
          { emoji: "🏷️", label: "Tag / Category" },
          { emoji: "🛡️", label: "Shield / Safe" }
        ]
      }
    ];

    function openChuteEmojiPicker(idx) {
      if (idx < 0 || idx >= chutes.length) return;
      activeChuteEmojiIndex = idx;
      const chute = chutes[idx];

      const modalTitle = document.getElementById('chuteEmojiModalTitle');
      if (modalTitle) {
        modalTitle.textContent = `Choose Icon for Chute ${idx + 1} (${chute.label || 'Unnamed'})`;
      }

      const display = document.getElementById('modalCurrentEmojiDisplay');
      if (display) {
        display.textContent = chute.icon || '📦';
      }

      const customInput = document.getElementById('modalCustomEmojiInput');
      if (customInput) {
        customInput.value = chute.icon || '';
      }

      const searchInput = document.getElementById('chuteEmojiSearchInput');
      if (searchInput) {
        searchInput.value = '';
      }

      renderChuteEmojiPickerGrid('');

      const modalEl = document.getElementById('chuteEmojiModal');
      if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
    }

    function renderChuteEmojiPickerGrid(filterText = '') {
      const container = document.getElementById('chuteEmojiCategoriesContainer');
      if (!container) return;
      container.innerHTML = '';

      const query = (filterText || '').trim().toLowerCase();
      let matchCount = 0;

      CHUTE_EMOJI_CATEGORIES.forEach(cat => {
        const filteredEmojis = cat.emojis.filter(item => {
          if (!query) return true;
          return item.label.toLowerCase().includes(query) ||
                 item.emoji.includes(query) ||
                 cat.name.toLowerCase().includes(query);
        });

        if (filteredEmojis.length === 0) return;
        matchCount += filteredEmojis.length;

        const catSection = document.createElement('div');
        catSection.className = 'mb-3';

        catSection.innerHTML = `
          <div class="chute-emoji-category-header">
            <i class="bi ${cat.icon} text-primary"></i>
            <span>${cat.name}</span>
            <span class="badge bg-light text-muted border rounded-pill small ms-1" style="font-size: 0.65rem;">${filteredEmojis.length}</span>
          </div>
          <div class="chute-emoji-grid">
            ${filteredEmojis.map(item => `
              <button type="button" class="chute-emoji-tile" title="${item.label}" onclick="selectChuteEmoji('${item.emoji}')">
                ${item.emoji}
              </button>
            `).join('')}
          </div>
        `;
        container.appendChild(catSection);
      });

      if (matchCount === 0) {
        container.innerHTML = `
          <div class="text-center py-4 text-muted">
            <i class="bi bi-emoji-neutral fs-2 d-block mb-1 text-secondary opacity-50"></i>
            <div class="fw-bold">No matching preset emojis found</div>
            <div class="small">You can paste any custom emoji into the box above and click "Use This Emoji"!</div>
          </div>
        `;
      }
    }

    function selectChuteEmoji(emoji) {
      if (activeChuteEmojiIndex !== null && chutes[activeChuteEmojiIndex]) {
        updateChuteField(activeChuteEmojiIndex, 'icon', emoji);
        showBuilderToast(`Updated Chute ${activeChuteEmojiIndex + 1} icon to ${emoji}`, 'success');
      }
      const modalEl = document.getElementById('chuteEmojiModal');
      if (modalEl && window.bootstrap && window.bootstrap.Modal) {
        bootstrap.Modal.getInstance(modalEl)?.hide();
      }
    }

    function filterChuteModalEmojis(query) {
      renderChuteEmojiPickerGrid(query);
    }

    function handleModalCustomEmojiInput(val) {
      const display = document.getElementById('modalCurrentEmojiDisplay');
      if (display) {
        display.textContent = val.trim() || '📦';
      }
    }

    function applyModalCustomEmoji() {
      const input = document.getElementById('modalCustomEmojiInput');
      const val = input ? input.value.trim() : '';
      if (!val) {
        showBuilderToast("Please type or paste an emoji first.", "warning");
        return;
      }
      selectChuteEmoji(val);
    }

    window.openChuteEmojiPicker = openChuteEmojiPicker;
    window.selectChuteEmoji = selectChuteEmoji;
    window.filterChuteModalEmojis = filterChuteModalEmojis;
    window.handleModalCustomEmojiInput = handleModalCustomEmojiInput;
    window.applyModalCustomEmoji = applyModalCustomEmoji;


    // RENDER OBJECTS
    function renderObjects() {
      const container = document.getElementById('objectsContainer');
      container.innerHTML = '';

      if (objects.length === 0) {
        container.innerHTML = `
          <div class="text-center p-4 border-2 border-dashed rounded-4 bg-light my-2">
            <div class="rounded-circle d-inline-flex align-items-center justify-content-center bg-primary-subtle text-primary mb-3" style="width: 54px; height: 54px; font-size: 1.5rem;">
              <i class="bi bi-box-seam"></i>
            </div>
            <h5 class="h6 fw-bold text-dark mb-1">Your Arcade Object Pool is Clean &amp; Empty</h5>
            <p class="text-muted small mb-3">Add 4 to 8 sorting items for students to grab with the claw and drop into your 2 target chutes.</p>
            <button type="button" class="btn btn-primary rounded-pill fw-bold px-3 py-1.5 shadow-sm" onclick="addNewObject()">
              <i class="bi bi-plus-lg me-1"></i>Add First Sorting Item
            </button>
          </div>
        `;
        updateLiveCanvas();
        return;
      }

      const validCategoryIds = new Set(chutes.map(c => c.id));

      objects.forEach((obj, idx) => {
        const row = document.createElement('div');
        row.className = 'object-item-row';
        const currentImg = obj.image || '/static/images/rock.webp';

        // Ensure categoryId matches one of the 2 chutes
        if (!validCategoryIds.has(obj.categoryId) && chutes.length > 0) {
          obj.categoryId = chutes[0].id;
        }

        const categoryOptions = chutes.map(c => `
          <option value="${c.id}" ${obj.categoryId === c.id ? 'selected' : ''}>
            ${c.icon || '📦'} ${c.label}
          </option>
        `).join('');

        row.innerHTML = `
          <div class="text-center">
            <img src="${currentImg}" alt="${obj.label || 'Object'}" class="object-thumb-preview" id="thumb_preview_${idx}" onclick="openPresetPicker(${idx})" title="Click to pick science icon">
            <label class="btn btn-link btn-sm p-0 mt-1 text-decoration-none small text-primary fw-bold" style="font-size: 0.72rem; cursor: pointer;">
              <i class="bi bi-upload me-1"></i>Upload
              <input type="file" name="object_file_${idx}" accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp" class="d-none" onchange="handleFileUpload(${idx}, this)">
            </label>
          </div>

          <div>
            <label class="form-label text-muted small fw-bold d-lg-none mb-1">Label</label>
            <input type="text" class="form-control rounded-3 fw-bold" value="${obj.label || ''}" oninput="updateObjectField(${idx}, 'label', this.value)" required placeholder="e.g. Ice Cube">
          </div>

          <div>
            <label class="form-label text-muted small fw-bold d-lg-none mb-1">Target Chute</label>
            <select class="form-select rounded-3 fw-semibold" onchange="updateObjectField(${idx}, 'categoryId', this.value)">
              ${categoryOptions}
            </select>
          </div>

          <div>
            <label class="form-label text-muted small fw-bold d-lg-none mb-1">Explanation (Spoken aloud by TTS)</label>
            <div class="d-flex align-items-center gap-1">
              <input type="text" class="form-control rounded-3" value="${obj.explanation || ''}" oninput="updateObjectField(${idx}, 'explanation', this.value)" placeholder="e.g. Ice has a fixed shape and volume as a solid.">
              <button type="button" class="btn btn-outline-primary btn-sm rounded-3 px-2 py-1 flex-shrink-0" onclick="previewObjectTTS(${idx})" title="Listen to voice explanation">
                <i class="bi bi-volume-up-fill"></i>
              </button>
            </div>
          </div>

          <div class="text-end">
            ${objects.length > 2 ? `
              <button type="button" class="btn btn-outline-danger btn-sm border-0 p-1" onclick="removeObject(${idx})" title="Delete object">
                <i class="bi bi-trash3-fill fs-6"></i>
              </button>
            ` : ''}
          </div>
        `;
        container.appendChild(row);
      });

      // Keep round size automatically synchronized to total objects created
      const maxAllowed = getMaxAllowedObjects();
      const roundInput = document.getElementById('roundSizeInput');
      if (roundInput) {
        roundInput.value = Math.min(objects.length, maxAllowed);
        roundInput.max = maxAllowed;
      }
      const countBadge = document.getElementById('objectsCountBadge');
      if (countBadge) {
        const diffText = document.getElementById('difficultyLevelInput')?.value || 'Level 1 — Easy';
        const tierName = diffText.includes('Easy') ? 'Easy' : (diffText.includes('Medium') ? 'Medium' : 'Hard');
        countBadge.textContent = `${objects.length} / ${maxAllowed} Objects (${tierName} Cap)`;
        if (objects.length > maxAllowed) {
          countBadge.className = 'badge bg-danger text-white border border-danger px-3 py-1 rounded-pill fw-bold';
        } else {
          countBadge.className = 'badge bg-primary-subtle text-primary border border-primary-subtle px-3 py-1 rounded-pill fw-bold';
        }
      }

      updateLiveCanvas();
    }

    function getMaxAllowedObjects() {
      const val = (document.getElementById('difficultyLevelInput')?.value || '').toLowerCase();
      if (val.includes('easy')) return 8;
      if (val.includes('medium')) return 12;
      if (val.includes('hard')) return 16;
      return 16;
    }

    window.previewObjectTTS = function(idx) {
      const obj = objects[idx];
      if (!obj) return;
      const targetChute = chutes.find(c => c.id === obj.categoryId);
      const chuteLabel = targetChute ? targetChute.label : 'target chute';
      const textToRead = obj.explanation
        ? `${obj.label || 'Item'}: ${obj.explanation}`
        : `Correct! ${obj.label || 'This item'} belongs in ${chuteLabel}.`;

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(textToRead);
        utterance.rate = 0.95;
        utterance.pitch = 1.05;
        window.speechSynthesis.speak(utterance);
        showBuilderToast("Speaking explanation aloud...", "info");
      } else {
        showBuilderToast("Speech synthesis not supported in this browser.", "warning");
      }
    };

    function addObject() {
      const maxAllowed = getMaxAllowedObjects();
      if (objects.length >= maxAllowed) {
        const diffText = document.getElementById('difficultyLevelInput')?.value || 'this level';
        showBuilderToast(`Item limit reached (${maxAllowed} max for ${diffText}). Select a higher difficulty level to add more items.`, "warning");
        return;
      }
      const defaultCategory = chutes.length > 0 ? chutes[0].id : 'solid';
      objects.push({
        id: objects.length + 1,
        label: "New Object",
        categoryId: defaultCategory,
        explanation: "Explain why this object belongs in this chute.",
        image: "/static/images/rock.webp"
      });
      renderObjects();
    }

    function removeObject(idx) {
      if (objects.length <= 2) {
        showBuilderToast("A sorting activity needs at least 2 objects to play.", "warning");
        return;
      }
      objects.splice(idx, 1);
      renderObjects();
    }

    function updateObjectField(idx, field, value) {
      objects[idx][field] = value;
      updateLiveCanvas();
    }

    // STRICT FILE UPLOAD VALIDATION: Only PNG, JPG, JPEG, WEBP; No file size cap
    function handleFileUpload(idx, input) {
      if (input.files && input.files[0]) {
        const file = input.files[0];
        const validExtensions = ['png', 'jpg', 'jpeg', 'webp'];
        const ext = (file.name.split('.').pop() || '').toLowerCase();
        const isImageMime = file.type.startsWith('image/');

        if (!validExtensions.includes(ext) || !isImageMime) {
          showBuilderToast("Only image files (.png, .jpg, .jpeg, .webp) are supported.", "danger");
          input.value = '';
          return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
          document.getElementById(`thumb_preview_${idx}`).src = e.target.result;
          objects[idx].image = e.target.result; // temporary preview
          updateLiveCanvas();
        };
        reader.readAsDataURL(file);
      }
    }

    let clawTeacherAssetsCache = [];

    async function loadClawTeacherAssets() {
      const grid = document.getElementById('libraryClawImagesGrid');
      const badge = document.getElementById('badgeClawImgLibraryCount');
      if (!grid) return;

      grid.innerHTML = '<div class="text-center py-4 text-muted small w-100" style="grid-column: 1 / -1;"><span class="spinner-border spinner-border-sm me-2 text-primary"></span>Loading permanent library...</div>';

      try {
        const res = await fetch('/teacher/api/assets?type=image');
        const data = await res.json();
        if (data.status === 'success') {
          clawTeacherAssetsCache = data.assets || [];
          if (badge) badge.textContent = clawTeacherAssetsCache.length;
          renderClawLibraryGrid();
        } else {
          grid.innerHTML = '<div class="text-center py-3 text-danger small w-100" style="grid-column: 1 / -1;">Failed loading library</div>';
        }
      } catch (err) {
        grid.innerHTML = '<div class="text-center py-3 text-danger small w-100" style="grid-column: 1 / -1;">Could not connect to library</div>';
      }
    }

    function renderClawLibraryGrid() {
      const grid = document.getElementById('libraryClawImagesGrid');
      if (!grid) return;

      if (clawTeacherAssetsCache.length === 0) {
        grid.innerHTML = `
          <div class="text-center py-4 text-muted w-100" style="grid-column: 1 / -1;">
            <i class="bi bi-inbox fs-2 d-block mb-1 text-secondary opacity-50"></i>
            <div class="small fw-bold">No uploaded illustrations in your library yet</div>
            <div style="font-size: 0.75rem;">Use the upload box above to permanently save files for all games and slides!</div>
          </div>
        `;
        return;
      }

      grid.innerHTML = '';
      clawTeacherAssetsCache.forEach(asset => {
        const item = document.createElement('div');
        item.className = 'preset-picker-item position-relative';
        item.style.cursor = 'pointer';
        item.innerHTML = `
          <img src="${asset.file_url}" alt="${asset.title}" onerror="this.src='/static/images/tree.webp'">
          <div class="small fw-bold text-dark text-truncate" title="${asset.title}">${asset.title}</div>
          <button type="button" class="btn btn-sm btn-light text-danger position-absolute top-0 end-0 m-1 rounded-circle p-0 shadow-sm border d-flex align-items-center justify-content-center" style="width: 22px; height: 22px; font-size: 0.65rem;" title="Delete" onclick="deleteClawLibraryAsset(event, ${asset.id})">
            <i class="bi bi-trash3-fill"></i>
          </button>
        `;
        item.onclick = (e) => {
          if (e.target.closest('button')) return;
          choosePresetImage(asset.file_url, asset.title);
        };
        grid.appendChild(item);
      });
    }

    async function uploadClawLibraryAsset(input) {
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
          await loadClawTeacherAssets();
          choosePresetImage(result.asset.file_url, result.asset.title);
        } else {
          showBuilderToast(result.message || 'Upload failed', 'danger');
          input.value = '';
        }
      } catch (err) {
        showBuilderToast('Error uploading asset to server', 'danger');
        input.value = '';
      }
    }

    async function deleteClawLibraryAsset(event, assetId) {
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
            await loadClawTeacherAssets();
          } else {
            showBuilderToast(result.message || 'Could not delete asset', 'danger');
          }
        } catch (err) {
          showBuilderToast('Failed communicating with server', 'danger');
        }
      };

      if (window.scienceplayConfirm) {
        window.scienceplayConfirm({
          title: 'Delete Asset?',
          message: 'Remove this illustration from your permanent library?',
          confirmText: 'Delete',
          confirmClass: 'btn-danger',
          iconClass: 'bi-trash3-fill text-danger',
          onConfirm: doDelete
        });
      } else {
        doDelete();
      }
    }

    function openPresetPicker(idx) {
      activeObjectPickerIndex = idx;
      const modalEl = document.getElementById('presetImageModal');
      const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
      modal.show();
      loadClawTeacherAssets();
    }

    function choosePresetImage(src, label) {
      if (activeObjectPickerIndex !== null && objects[activeObjectPickerIndex]) {
        objects[activeObjectPickerIndex].image = src;
        const thumb = document.getElementById(`thumb_preview_${activeObjectPickerIndex}`);
        if (thumb) thumb.src = src;
      }
      const modalEl = document.getElementById('presetImageModal');
      bootstrap.Modal.getInstance(modalEl)?.hide();
      updateLiveCanvas();
    }

    // REAL-TIME ARCADE STAGE CANVAS SYNCHRONIZATION
    function updateLiveCanvas() {
      const title = document.getElementById('activityTitleInput')?.value || 'Custom Sorting Game';
      const instructions = document.getElementById('activityInstructionsInput')?.value || 'Sort each object into the correct chute to win stars.';
      const roundSize = document.getElementById('roundSizeInput')?.value || objects.length || '8';
      const diffInput = document.getElementById('difficultyLevelInput');

      const titleEl = document.getElementById('canvasMarqueeTitle');
      if (titleEl) titleEl.textContent = title;
      const instrEl = document.getElementById('canvasMarqueeInstructions');
      if (instrEl) instrEl.textContent = instructions;

      const diffBadge = document.getElementById('canvasDifficultyBadge');
      if (diffBadge && diffInput) {
        diffBadge.textContent = diffInput.value;
      }

      // Dynamic Left and Right Chutes for Arcade Live Canvas
      const leftChutesContainer = document.getElementById('simulatorLeftChutes');
      const rightChutesContainer = document.getElementById('simulatorRightChutes');
      
      const leftCount = Math.ceil(chutes.length / 2);
      const leftBins = chutes.slice(0, leftCount);
      const rightBins = chutes.slice(leftCount);

      const renderSimChute = (c, idx) => {
        const color = c.color || '#4318ff';
        const icon = c.icon || '📦';
        const label = c.label || `Chute ${idx + 1}`;
        return `
          <div class="simulator-chute-box" style="background: linear-gradient(180deg, ${color} 0%, rgba(15, 23, 42, 0.5) 140%), ${color};">
            <span class="simulator-chute-icon">${icon}</span>
            <div class="simulator-chute-title">${label}</div>
            <div class="simulator-chute-pocket"></div>
          </div>
        `;
      };

      if (leftChutesContainer) {
        leftChutesContainer.innerHTML = leftBins.map((c, i) => renderSimChute(c, i)).join('');
      }
      if (rightChutesContainer) {
        rightChutesContainer.innerHTML = rightBins.map((c, i) => renderSimChute(c, leftCount + i)).join('');
      }

      // Objects in Center Bay Conveyor
      const carousel = document.getElementById('canvasItemsCarousel');
      if (carousel) {
        carousel.innerHTML = '';
        if (objects.length === 0) {
          carousel.innerHTML = '<span class="text-white-50 small py-3 px-2">No objects configured yet. Click "+ Add Object" to insert items.</span>';
        } else {
          objects.forEach(obj => {
            const itemPill = document.createElement('div');
            itemPill.className = 'simulator-item-pill';
            const assignedChute = chutes.find(c => c.id === obj.categoryId);
            const dotColor = assignedChute ? (assignedChute.color || '#4318ff') : '#94a3b8';
            const imgSrc = obj.image || '/static/images/rock.webp';
            itemPill.innerHTML = `
              <img src="${imgSrc}" alt="${obj.label || 'Object'}" onerror="this.src='/static/images/rock.webp'">
              <span class="simulator-item-name" title="${obj.label || ''}">${obj.label || 'Object'}</span>
              <span class="simulator-item-cat-dot" style="background-color: ${dotColor};" title="Category: ${assignedChute ? assignedChute.label : 'None'}"></span>
            `;
            carousel.appendChild(itemPill);
          });
        }
      }

      // Dynamic Normalized Scoring calculation (always 100 points max)
      const totalObj = Math.max(1, objects.length);
      const ptsPerObj = (100 / totalObj).toFixed(1);
      const hudScore = document.getElementById('canvasHudScore');
      if (hudScore) {
        hudScore.innerHTML = `<i class="bi bi-calculator me-1"></i>Score: <strong class="text-white">100 Pts Normalized</strong> (${ptsPerObj} pts / item for ${totalObj} objects)`;
      }
      const hudRound = document.getElementById('canvasHudRound');
      if (hudRound) {
        hudRound.innerHTML = `<i class="bi bi-stars text-warning me-1"></i>Round Size: <strong>${roundSize} objects</strong>`;
      }
    }

    // FORM SUBMISSION & VALIDATION
    function submitBuilderForm(isDraft = false) {
      const isDraftInput = document.getElementById('isDraftInput');
      if (isDraftInput) {
        isDraftInput.value = isDraft ? '1' : '0';
      }

      const titleInput = document.getElementById('activityTitleInput');
      let title = titleInput.value.trim();
      if (!title) {
        if (isDraft) {
          title = 'Untitled Sorting Game Draft';
          titleInput.value = title;
        } else {
          showBuilderToast("Please enter an activity title.", "warning");
          titleInput.focus();
          return;
        }
      }

      // Check chutes count (2 to 6 chutes)
      if (chutes.length < 2) {
        if (isDraft) {
          chutes.push({
            id: `category_${chutes.length + 1}`,
            label: `Chute ${chutes.length + 1}`,
            icon: '📦',
            color: '#3b82f6'
          });
        } else {
          showBuilderToast("Please configure at least 2 sorting chutes.", "warning");
          return;
        }
      }

      if (chutes.length > 6) {
        showBuilderToast("A maximum of 6 chutes is supported.", "warning");
        return;
      }

      for (let i = 0; i < chutes.length; i++) {
        if (!chutes[i].label || !chutes[i].label.trim()) {
          if (isDraft) {
            chutes[i].label = `Chute ${i + 1}`;
          } else {
            showBuilderToast(`Please provide a label for Chute ${i + 1}.`, "warning");
            return;
          }
        }
      }

      if (!isDraft) {
        if (objects.length < 2) {
          showBuilderToast("Please add at least 2 objects to sort.", "warning");
          return;
        }

        // Check object labels
        for (let i = 0; i < objects.length; i++) {
          if (!objects[i].label || !objects[i].label.trim()) {
            showBuilderToast(`Object #${i + 1} is missing a label.`, "warning");
            return;
          }
        }

        // Check difficulty limits
        const maxAllowed = getMaxAllowedObjects();
        if (objects.length > maxAllowed) {
          const diffName = document.getElementById('difficultyLevelInput').value;
          showBuilderToast(`You have ${objects.length} items, which exceeds the limit of ${maxAllowed} items for ${diffName}. Please delete ${objects.length - maxAllowed} item(s) or select a higher difficulty tier.`, "danger");
          return;
        }

        // Check that every object maps to a valid chute
        const validCategoryIds = new Set(chutes.map(c => c.id));
        for (let i = 0; i < objects.length; i++) {
          if (!validCategoryIds.has(objects[i].categoryId)) {
            showBuilderToast(`Object "${objects[i].label}" is not assigned to a valid chute. Every item must have a valid destination chute.`, "danger");
            return;
          }
        }
      }

      // Assign chute sequential clean IDs and map objects to them
      const idMap = {};
      chutes.forEach((chute, idx) => {
        const oldId = chute.id;
        const cleanBase = chute.label.toLowerCase().replace(/[^a-z0-9]/g, '_') || `category_${idx + 1}`;
        let newId = cleanBase;
        if (Object.values(idMap).includes(newId)) {
          newId = `${cleanBase}_${idx + 1}`;
        }
        idMap[oldId] = newId;
        chute.id = newId;
      });

      // Assign object sequential IDs and preserve chute target mapping
      objects.forEach((obj, idx) => {
        obj.id = idx + 1;
        if (!obj.label || !obj.label.trim()) {
          obj.label = `Object ${idx + 1}`;
        }
        if (idMap[obj.categoryId]) {
          obj.categoryId = idMap[obj.categoryId];
        } else if (chutes[0]) {
          obj.categoryId = chutes[0].id;
        }
      });

      document.getElementById('binsDataInput').value = JSON.stringify(chutes);
      document.getElementById('objectsDataInput').value = JSON.stringify(objects);

      document.getElementById('activityBuilderForm').submit();
    }

    document.getElementById('btn-save-activity-bottom')?.addEventListener('click', () => submitBuilderForm(false));
    document.getElementById('btn-save-activity-top')?.addEventListener('click', () => submitBuilderForm(false));
    document.getElementById('btn-save-draft')?.addEventListener('click', () => submitBuilderForm(true));
    document.getElementById('btn-save-draft-top')?.addEventListener('click', () => submitBuilderForm(true));

    // Initial render & listeners
    document.addEventListener('DOMContentLoaded', () => {
      renderChutes();
      updateLiveCanvas();

      document.getElementById('activityTitleInput')?.addEventListener('input', updateLiveCanvas);
      document.getElementById('activityInstructionsInput')?.addEventListener('input', updateLiveCanvas);
      document.getElementById('roundSizeInput')?.addEventListener('input', updateLiveCanvas);
      document.getElementById('difficultyLevelInput')?.addEventListener('change', () => {
        const maxAllowed = getMaxAllowedObjects();
        if (objects.length > maxAllowed) {
          showBuilderToast(`Notice: You have ${objects.length} items, which exceeds the ${maxAllowed}-item limit for ${document.getElementById('difficultyLevelInput').value}. Please reduce items or select a higher tier before saving.`, "warning");
        }
        renderObjects();
        updateLiveCanvas();
      });
    });
