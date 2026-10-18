function openAssignGameModal(activityId, title) {
  const input = document.getElementById('modalGameActivityId');
  const display = document.getElementById('modalGameTitleDisplay');
  const studentSelect = document.getElementById('modalGameStudentSelect');
  if (input) input.value = activityId;
  if (display) display.textContent = title;
  if (studentSelect) studentSelect.value = '';
  const modalEl = document.getElementById('assignGameModal');
  if (modalEl && window.bootstrap && window.bootstrap.Modal) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function openPermanentDeleteActivityModal(activityId, title) {
  const display = document.getElementById('permDeleteActivityTitle');
  const form = document.getElementById('permanentDeleteActivityForm');
  if (display) display.textContent = title;
  if (form) form.action = `/teacher/content/permanent_delete/${activityId}`;
  const modalEl = document.getElementById('permanentDeleteActivityModal');
  if (modalEl && window.bootstrap && window.bootstrap.Modal) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function initAlertAutoDismiss() {
  const alerts = document.querySelectorAll('.alert.alert-dismissible');
  alerts.forEach(alertEl => {
    const dismissAlert = () => {
      if (!alertEl || !alertEl.parentElement) return;
      alertEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease, max-height 0.4s ease, margin 0.4s ease, padding 0.4s ease';
      alertEl.style.opacity = '0';
      alertEl.style.transform = 'translateY(-8px)';
      alertEl.style.maxHeight = '0';
      alertEl.style.margin = '0';
      alertEl.style.paddingTop = '0';
      alertEl.style.paddingBottom = '0';
      alertEl.style.overflow = 'hidden';
      setTimeout(() => {
        try { alertEl.remove(); } catch (_) {}
      }, 400);
    };

    const closeBtn = alertEl.querySelector('.btn-close');
    if (closeBtn) {
      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        dismissAlert();
      });
    }

    setTimeout(dismissAlert, 4500);
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    initAlertAutoDismiss();
    initGameCreationModals();
  });
} else {
  initAlertAutoDismiss();
  initGameCreationModals();
}

function initGameCreationModals() {
  // 1. Tooltips initialization for disabled buttons / hints
  const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
  tooltipTriggerList.forEach(el => {
    if (window.bootstrap && window.bootstrap.Tooltip) {
      new bootstrap.Tooltip(el);
    }
  });

  // 2. Preset Selection in both Game Engine Creation Modals
  document.querySelectorAll('.preset-options-list').forEach(list => {
    const parentCard = list.closest('.game-choice-card');
    const startPresetBtn = parentCard ? parentCard.querySelector('.btn-start-preset') : null;

    list.querySelectorAll('.preset-option-row').forEach(row => {
      row.addEventListener('click', () => {
        // Remove selection from siblings
        list.querySelectorAll('.preset-option-row').forEach(r => {
          r.classList.remove('selected');
          const icon = r.querySelector('.preset-check-radio i');
          if (icon) {
            icon.className = 'bi bi-circle text-muted';
          }
        });

        // Mark current as selected
        row.classList.add('selected');
        const activeIcon = row.querySelector('.preset-check-radio i');
        if (activeIcon) {
          activeIcon.className = 'bi bi-check-circle-fill text-primary';
        }

        // Enable "Start with this preset" button
        if (startPresetBtn) {
          startPresetBtn.classList.remove('disabled', 'btn-secondary');
          startPresetBtn.classList.add('btn-primary');
          startPresetBtn.removeAttribute('disabled');
          startPresetBtn.dataset.targetUrl = row.dataset.url || '';
        }
      });

      // Accessibility: allow Space / Enter to select
      row.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          row.click();
        }
      });
    });

    if (startPresetBtn) {
      startPresetBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const url = startPresetBtn.dataset.targetUrl;
        if (url) {
          window.location.href = url;
        }
      });
    }
  });

  // 3. Diagram Modal Dropzone
  const dropzone = document.getElementById('diagramModalDropzone');
  const fileInput = document.getElementById('diagramModalFileInput');
  const promptEl = document.getElementById('diagramDropzonePrompt');
  const previewEl = document.getElementById('diagramDropzonePreview');
  const thumbnailEl = document.getElementById('diagramThumbnail');
  const fileNameEl = document.getElementById('diagramFileName');
  const fileSizeEl = document.getElementById('diagramFileSize');
  const removeBtn = document.getElementById('btnRemoveDiagramFile');
  const startCustomBtn = document.getElementById('btnStartCustomDiagram');
  const startCustomWrapper = document.getElementById('btnStartCustomDiagramWrapper');

  let chosenFileDataUrl = null;
  let chosenFileName = null;

  if (dropzone && fileInput) {
    const openPicker = () => fileInput.click();
    promptEl?.addEventListener('click', openPicker);

    // Drag & Drop handlers
    ['dragenter', 'dragover'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.add('dragover');
      });
    });

    ['dragleave', 'drop'].forEach(eventName => {
      dropzone.addEventListener(eventName, (e) => {
        e.preventDefault();
        e.stopPropagation();
        dropzone.classList.remove('dragover');
      });
    });

    dropzone.addEventListener('drop', (e) => {
      const dt = e.dataTransfer;
      if (dt && dt.files && dt.files[0]) {
        handleChosenFile(dt.files[0]);
      }
    });

    fileInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        handleChosenFile(e.target.files[0]);
      }
    });

    function formatBytes(bytes) {
      if (bytes < 1024) return bytes + ' B';
      const kb = bytes / 1024;
      if (kb < 1024) return kb.toFixed(1) + ' KB';
      return (kb / 1024).toFixed(1) + ' MB';
    }

    function handleChosenFile(file) {
      const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      const fileExt = '.' + file.name.split('.').pop().toLowerCase();
      if (!validTypes.includes(file.type) && !['.png', '.jpg', '.jpeg', '.webp'].includes(fileExt)) {
        alert('Please select a supported image file (.png, .jpg, .webp).');
        return;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        chosenFileDataUrl = event.target.result;
        chosenFileName = file.name;

        if (thumbnailEl) thumbnailEl.src = chosenFileDataUrl;
        if (fileNameEl) fileNameEl.textContent = file.name;
        if (fileSizeEl) fileSizeEl.textContent = formatBytes(file.size);

        if (promptEl) promptEl.classList.add('d-none');
        if (previewEl) {
          previewEl.classList.remove('d-none');
          previewEl.classList.add('active');
        }

        // Enable Start Custom Diagram button & disable tooltip
        if (startCustomBtn) {
          startCustomBtn.classList.remove('disabled', 'btn-secondary');
          startCustomBtn.classList.add('btn-primary');
          startCustomBtn.removeAttribute('disabled');
        }
        if (startCustomWrapper) {
          if (window.bootstrap && window.bootstrap.Tooltip) {
            const tip = bootstrap.Tooltip.getInstance(startCustomWrapper);
            if (tip) tip.disable();
          }
          startCustomWrapper.removeAttribute('title');
        }
      };
      reader.readAsDataURL(file);
    }

    removeBtn?.addEventListener('click', (e) => {
      e.stopPropagation();
      chosenFileDataUrl = null;
      chosenFileName = null;
      fileInput.value = '';

      if (promptEl) promptEl.classList.remove('d-none');
      if (previewEl) {
        previewEl.classList.add('d-none');
        previewEl.classList.remove('active');
      }

      // Re-disable Start Custom Diagram button & restore tooltip
      if (startCustomBtn) {
        startCustomBtn.classList.add('disabled', 'btn-secondary');
        startCustomBtn.classList.remove('btn-primary');
        startCustomBtn.setAttribute('disabled', 'disabled');
      }
      if (startCustomWrapper) {
        startCustomWrapper.setAttribute('title', 'Upload a diagram first');
        if (window.bootstrap && window.bootstrap.Tooltip) {
          let tip = bootstrap.Tooltip.getInstance(startCustomWrapper);
          if (!tip) tip = new bootstrap.Tooltip(startCustomWrapper);
          tip.enable();
        }
      }
    });

    startCustomBtn?.addEventListener('click', (e) => {
      e.preventDefault();
      if (!chosenFileDataUrl) return;

      try {
        sessionStorage.setItem('pendingDiagramImage', chosenFileDataUrl);
        sessionStorage.setItem('pendingDiagramName', chosenFileName || 'Custom Diagram');
      } catch (err) {
        console.warn('SessionStorage cache notice:', err);
      }

      const blankUrl = startCustomBtn.dataset.blankUrl || '/teacher/content/find_the_part/builder?mode=blank';
      window.location.href = blankUrl;
    });
  }
}

window.openAssignGameModal = openAssignGameModal;
window.openPermanentDeleteActivityModal = openPermanentDeleteActivityModal;

