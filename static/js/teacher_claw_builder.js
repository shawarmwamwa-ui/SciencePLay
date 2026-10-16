// Initial data from server: strictly 2 chutes
    const clawConfig = window.CLAW_BUILDER_CONFIG || {};
const getCsrfToken = () => clawConfig.csrfToken || document.querySelector('input[name="csrf_token"]')?.value || "";
let rawBins = clawConfig.rawBins || [];

    let chutes = Array.isArray(rawBins) && rawBins.length >= 2
      ? rawBins.slice(0, 2)
      : [
          {"id": "category_1", "label": "", "icon": "📦", "color": "#3b82f6"},
          {"id": "category_2", "label": "", "icon": "⭐", "color": "#10b981"}
        ];

    let objects = clawConfig.objects || [];

    let activeObjectPickerIndex = null;

    // TOPIC PRESETS (Strictly 2 chutes: Left vs Right)
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
        title: "Solid vs Liquid Sorting",
        instructions: "Sort each object into the Solid or Liquid chute.",
        round_size: 6,
        bins: [
          { id: "solid", label: "Solid", icon: "🧊", color: "#60a5fa" },
          { id: "liquid", label: "Liquid", icon: "💧", color: "#38bdf8" }
        ],
        objects: [
          { label: "Ice Cube", categoryId: "solid", explanation: "Ice holds a fixed shape firmly as a solid.", image: "/static/images/rock.webp" },
          { label: "Water Puddle", categoryId: "liquid", explanation: "Water flows and takes the shape of its container.", image: "/static/images/puddle.webp" },
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

    // RENDER EXACTLY 2 CHUTES (LEFT & RIGHT)
    function renderChutes() {
      const container = document.getElementById('chutesContainer');
      container.innerHTML = '';

      if (chutes.length < 2) {
        chutes = [
          { id: "category_1", label: "Left Category", icon: "🌱", color: "#4ade80" },
          { id: "category_2", label: "Right Category", icon: "🪨", color: "#fb923c" }
        ];
      } else if (chutes.length > 2) {
        chutes = chutes.slice(0, 2);
      }

      const zoneNames = ["Chute 1: Left Drop Zone", "Chute 2: Right Drop Zone"];
      const zonePositions = ["Arcade Slot: Left Side", "Arcade Slot: Right Side"];
      const zoneIcons = ["bi-arrow-left-circle-fill", "bi-arrow-right-circle-fill"];

      chutes.forEach((chute, idx) => {
        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';

        const isLeft = idx === 0;
        const zoneBadgeClass = isLeft ? 'bg-primary-subtle text-primary border-primary-subtle' : 'bg-warning-subtle text-dark border-warning-subtle';
        const currentColor = chute.color || (isLeft ? '#4ade80' : '#fb923c');

        col.innerHTML = `
          <div class="chute-config-card" id="chute_card_${idx}">
            <div class="chute-accent-bar" id="chute_accent_${idx}" style="background-color: ${currentColor};"></div>

            <div class="d-flex justify-content-between align-items-center mb-3">
              <span class="badge ${zoneBadgeClass} border fw-bold d-inline-flex align-items-center gap-1 px-2 py-1 shadow-sm">
                <i class="bi ${zoneIcons[idx]}"></i> ${zoneNames[idx]}
              </span>
              <span class="badge bg-light text-secondary border small fw-semibold">${zonePositions[idx]}</span>
            </div>

            <div class="chute-card-layout">
              <div>
                <div class="mini-arcade-bin" id="mini_bin_${idx}" style="background: linear-gradient(180deg, ${currentColor} 0%, rgba(15, 23, 42, 0.45) 140%), ${currentColor};">
                  <div class="mini-bin-icon" id="mini_icon_${idx}">${chute.icon || '📦'}</div>
                  <div class="mini-bin-title" id="mini_label_${idx}">${chute.label || 'Chute'}</div>
                  <div class="mini-bin-catch"></div>
                </div>
                <div class="text-center text-muted mt-1" style="font-size: 0.65rem; font-weight: 800; letter-spacing: 0.05em;">IN-GAME LOOK</div>
              </div>

              <div>
                <div class="mb-2">
                  <label class="form-label text-muted small fw-bold mb-1">Chute Label <span class="text-danger">*</span></label>
                  <input type="text" class="form-control form-control-sm fw-bold rounded-3" value="${chute.label}" oninput="updateChuteField(${idx}, 'label', this.value)" required placeholder="e.g. Living or Solid">
                </div>

                <div class="row g-2 align-items-end">
                  <div class="col-4">
                    <label class="form-label text-muted small fw-bold mb-1">Emoji</label>
                    <input type="text" class="form-control form-control-sm text-center fs-5 rounded-3 p-1" value="${chute.icon || '📦'}" oninput="updateChuteField(${idx}, 'icon', this.value)" maxlength="4" placeholder="📦">
                  </div>
                  <div class="col-8">
                    <label class="form-label text-muted small fw-bold mb-1">Glow Color</label>
                    <div class="d-flex align-items-center gap-1 flex-wrap">
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
    }

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
      if (!confirm('Remove this illustration from your permanent library?')) return;

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

      // Left Chute
      if (chutes[0]) {
        const leftEl = document.getElementById('canvasLeftChute');
        const color0 = chutes[0].color || '#4ade80';
        if (leftEl) leftEl.style.background = `linear-gradient(180deg, ${color0} 0%, rgba(15, 23, 42, 0.5) 140%), ${color0}`;
        const leftIco = document.getElementById('canvasLeftIcon');
        if (leftIco) leftIco.textContent = chutes[0].icon || '📦';
        const leftLbl = document.getElementById('canvasLeftTitle');
        if (leftLbl) leftLbl.textContent = chutes[0].label || 'Chute 1';
      }

      // Right Chute
      if (chutes[1]) {
        const rightEl = document.getElementById('canvasRightChute');
        const color1 = chutes[1].color || '#fb923c';
        if (rightEl) rightEl.style.background = `linear-gradient(180deg, ${color1} 0%, rgba(15, 23, 42, 0.5) 140%), ${color1}`;
        const rightIco = document.getElementById('canvasRightIcon');
        if (rightIco) rightIco.textContent = chutes[1].icon || '📦';
        const rightLbl = document.getElementById('canvasRightTitle');
        if (rightLbl) rightLbl.textContent = chutes[1].label || 'Chute 2';
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
    function submitBuilderForm() {
      const title = document.getElementById('activityTitleInput').value.trim();
      if (!title) {
        showBuilderToast("Please enter an activity title.", "warning");
        document.getElementById('activityTitleInput').focus();
        return;
      }

      if (chutes.length !== 2) {
        showBuilderToast("The claw machine sorting game requires exactly 2 chutes (Left and Right).", "danger");
        return;
      }

      // Ensure both chutes have labels
      if (!chutes[0].label.trim() || !chutes[1].label.trim()) {
        showBuilderToast("Please provide labels for both Chute 1 and Chute 2.", "warning");
        return;
      }

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

      // Check that every object maps to Chute 1 or Chute 2
      const validCategoryIds = new Set(chutes.map(c => c.id));
      for (let i = 0; i < objects.length; i++) {
        if (!validCategoryIds.has(objects[i].categoryId)) {
          showBuilderToast(`Object "${objects[i].label}" is not assigned to either Chute 1 or Chute 2. Every item must have a valid destination chute.`, "danger");
          return;
        }
      }

      // Assign chute sequential clean IDs and map objects to them
      const oldId0 = chutes[0].id;
      const oldId1 = chutes[1].id;
      const newId0 = chutes[0].label.toLowerCase().replace(/[^a-z0-9]/g, '_') || "category_1";
      const newId1 = chutes[1].label.toLowerCase().replace(/[^a-z0-9]/g, '_') || "category_2";
      chutes[0].id = newId0;
      chutes[1].id = newId1;

      // Assign object sequential IDs and preserve chute target mapping
      objects.forEach((obj, idx) => {
        obj.id = idx + 1;
        if (obj.categoryId === oldId0) {
          obj.categoryId = newId0;
        } else if (obj.categoryId === oldId1) {
          obj.categoryId = newId1;
        }
      });

      document.getElementById('binsDataInput').value = JSON.stringify(chutes);
      document.getElementById('objectsDataInput').value = JSON.stringify(objects);

      document.getElementById('activityBuilderForm').submit();
    }

    document.getElementById('btn-save-activity-bottom')?.addEventListener('click', submitBuilderForm);

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
