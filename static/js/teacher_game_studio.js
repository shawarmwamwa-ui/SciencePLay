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
  document.addEventListener('DOMContentLoaded', initAlertAutoDismiss);
} else {
  initAlertAutoDismiss();
}

window.openAssignGameModal = openAssignGameModal;
window.openPermanentDeleteActivityModal = openPermanentDeleteActivityModal;
