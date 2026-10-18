/**
 * SciencePlay — Teacher Pipeline Circuit Builder
 * Visual sequence authoring and live circuit preview
 */

document.addEventListener('DOMContentLoaded', () => {
  const initialConfig = window.pipelineInitialConfig || {};

  // Extract initial steps
  let steps = [];
  if (Array.isArray(initialConfig.steps) && initialConfig.steps.length > 0) {
    steps = initialConfig.steps;
  } else if (Array.isArray(initialConfig.rounds) && initialConfig.rounds.length > 0 && Array.isArray(initialConfig.rounds[0].steps)) {
    steps = initialConfig.rounds[0].steps;
  } else {
    // Default 4-step sequence
    steps = [
      { id: "step_1", order: 1, label: "Frog Eggs", icon: "🥚", hint: "Clusters of jelly-like eggs laid in the pond." },
      { id: "step_2", order: 2, label: "Tadpole", icon: "🐟", hint: "Breathes with gills and swims using a tail." },
      { id: "step_3", order: 3, label: "Froglet", icon: "🐸", hint: "Develops lungs and back legs while tail shrinks." },
      { id: "step_4", order: 4, label: "Adult Green Frog", icon: "🌿", hint: "Full-grown tailless amphibian with strong jumping legs." }
    ];
  }

  const stagesContainer = document.getElementById('stagesContainer');
  const previewTrack = document.getElementById('builderPreviewTrack');
  const btnAddStage = document.getElementById('btnAddStage');
  const form = document.getElementById('pipelineBuilderForm');
  const stepsDataInput = document.getElementById('stepsDataInput');
  const isDraftInput = document.getElementById('isDraftInput');
  const btnSaveDraft = document.getElementById('btnSaveDraft');
  const btnSaveActivity = document.getElementById('btnSaveActivity');

  function renderStages() {
    if (!stagesContainer) return;

    stagesContainer.innerHTML = steps.map((step, idx) => `
      <div class="stage-card" data-index="${idx}">
        <div class="d-flex justify-content-between align-items-center mb-3">
          <div class="d-flex align-items-center gap-2">
            <span class="stage-badge">Step ${idx + 1}</span>
            <span class="fw-bold text-dark">${step.label || 'Unnamed Stage'}</span>
          </div>
          <div class="d-flex align-items-center gap-1">
            <button type="button" class="btn btn-outline-secondary btn-sm px-2 py-1 btn-move-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} title="Move Earlier">
              <i class="bi bi-arrow-up"></i>
            </button>
            <button type="button" class="btn btn-outline-secondary btn-sm px-2 py-1 btn-move-down" data-index="${idx}" ${idx === steps.length - 1 ? 'disabled' : ''} title="Move Later">
              <i class="bi bi-arrow-down"></i>
            </button>
            <button type="button" class="btn btn-outline-danger btn-sm px-2 py-1 btn-delete-stage" data-index="${idx}" ${steps.length <= 3 ? 'disabled' : ''} title="Remove Stage">
              <i class="bi bi-trash3"></i>
            </button>
          </div>
        </div>

        <div class="row g-2">
          <div class="col-12 col-md-3">
            <label class="form-label small text-muted fw-bold mb-1">Icon / Emoji</label>
            <input type="text" class="form-control form-control-sm text-center fw-bold input-icon" data-index="${idx}" value="${step.icon || '⚡'}" maxlength="4" placeholder="e.g. 🥚">
          </div>
          <div class="col-12 col-md-4">
            <label class="form-label small text-muted fw-bold mb-1">Stage Label <span class="text-danger">*</span></label>
            <input type="text" class="form-control form-control-sm fw-bold input-label" data-index="${idx}" value="${step.label || ''}" placeholder="e.g. Tadpole" required>
          </div>
          <div class="col-12 col-md-5">
            <label class="form-label small text-muted fw-bold mb-1">Pedagogical Clue / Hint</label>
            <input type="text" class="form-control form-control-sm input-hint" data-index="${idx}" value="${step.hint || ''}" placeholder="Hint shown if student places this wrong">
          </div>
        </div>
      </div>
    `).join('');

    if (btnAddStage) {
      if (steps.length >= 10) {
        btnAddStage.classList.add('disabled');
        btnAddStage.setAttribute('disabled', 'true');
      } else {
        btnAddStage.classList.remove('disabled');
        btnAddStage.removeAttribute('disabled');
      }
    }

    bindStageEvents();
    renderLivePreview();
  }

  function bindStageEvents() {
    // Inputs
    stagesContainer.querySelectorAll('.input-label').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        steps[idx].label = e.target.value.trim();
        // Update stage card title
        const titleEl = e.target.closest('.stage-card').querySelector('.fw-bold.text-dark');
        if (titleEl) titleEl.textContent = steps[idx].label || 'Unnamed Stage';
        renderLivePreview();
      });
    });

    stagesContainer.querySelectorAll('.input-icon').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        steps[idx].icon = e.target.value.trim() || '⚡';
        renderLivePreview();
      });
    });

    stagesContainer.querySelectorAll('.input-hint').forEach(inp => {
      inp.addEventListener('input', (e) => {
        const idx = parseInt(e.target.dataset.index, 10);
        steps[idx].hint = e.target.value.trim();
      });
    });

    // Reorder buttons
    stagesContainer.querySelectorAll('.btn-move-up').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx > 0) {
          const temp = steps[idx];
          steps[idx] = steps[idx - 1];
          steps[idx - 1] = temp;
          updateStepOrders();
          renderStages();
        }
      });
    });

    stagesContainer.querySelectorAll('.btn-move-down').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (idx < steps.length - 1) {
          const temp = steps[idx];
          steps[idx] = steps[idx + 1];
          steps[idx + 1] = temp;
          updateStepOrders();
          renderStages();
        }
      });
    });

    // Delete stage
    stagesContainer.querySelectorAll('.btn-delete-stage').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index, 10);
        if (steps.length > 3) {
          steps.splice(idx, 1);
          updateStepOrders();
          renderStages();
        }
      });
    });
  }

  function updateStepOrders() {
    steps.forEach((s, i) => {
      s.order = i + 1;
    });
  }

  function renderLivePreview() {
    if (!previewTrack) return;

    previewTrack.innerHTML = steps.map((step, idx) => `
      <div class="d-flex flex-column align-items-center" style="min-width: 120px;">
        <div class="pc-slot-number-badge mb-1">${idx + 1}</div>
        <div class="pc-pod" style="width: 110px; height: 110px; padding: 0.5rem;">
          <div class="pc-pod-icon" style="font-size: 1.8rem;">${step.icon || '⚡'}</div>
          <div class="pc-pod-label" style="font-size: 0.75rem;">${step.label || 'Step ' + (idx + 1)}</div>
        </div>
      </div>
      ${idx < steps.length - 1 ? `<div class="pc-flow-arrow mx-2"><i class="bi bi-chevron-right"></i></div>` : ''}
    `).join('');
  }

  // Add Stage Button
  if (btnAddStage) {
    btnAddStage.addEventListener('click', () => {
      if (steps.length >= 10) {
        return;
      }
      const newOrder = steps.length + 1;
      steps.push({
        id: `step_${Date.now()}`,
        order: newOrder,
        label: `Stage ${newOrder}`,
        icon: '⚡',
        hint: ''
      });
      renderStages();
    });
  }

  function showInlineFeedback(message, type = 'warning') {
    let alertBox = document.getElementById('pipelineFeedbackAlert');
    if (!alertBox) {
      alertBox = document.createElement('div');
      alertBox.id = 'pipelineFeedbackAlert';
      alertBox.className = `alert alert-${type} alert-dismissible fade show shadow-sm rounded-4 mb-4`;
      const container = document.querySelector('.teacher-main-content');
      if (container) {
        const topBar = container.querySelector('.d-flex');
        if (topBar && topBar.nextSibling) {
          container.insertBefore(alertBox, topBar.nextSibling);
        } else {
          container.prepend(alertBox);
        }
      }
    }
    alertBox.className = `alert alert-${type} alert-dismissible fade show shadow-sm rounded-4 mb-4`;
    alertBox.innerHTML = `
      <i class="bi bi-info-circle-fill me-2"></i>${message}
      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    alertBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  // Save Actions
  function submitForm(isDraft) {
    if (isDraftInput) isDraftInput.value = isDraft ? "1" : "0";

    const titleInput = document.getElementById('activityTitleInput');
    if (!isDraft && (!titleInput || !titleInput.value.trim())) {
      showInlineFeedback("Please enter an Activity Title before publishing.");
      titleInput?.focus();
      return;
    }

    if (!isDraft) {
      const emptyLabel = steps.find(s => !s.label || !s.label.trim());
      if (emptyLabel) {
        showInlineFeedback("All sequence stages must have a name or label.");
        return;
      }
    }

    updateStepOrders();
    if (stepsDataInput) {
      stepsDataInput.value = JSON.stringify(steps);
    }

    form.submit();
  }

  if (btnSaveDraft) {
    btnSaveDraft.addEventListener('click', () => submitForm(true));
  }

  if (btnSaveActivity) {
    btnSaveActivity.addEventListener('click', () => submitForm(false));
  }

  // Initial render
  updateStepOrders();
  renderStages();
});
