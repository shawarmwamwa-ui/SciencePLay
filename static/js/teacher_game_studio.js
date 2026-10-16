function openAssignGameModal(activityId, title) {
  const input = document.getElementById('modalGameActivityId');
  const display = document.getElementById('modalGameTitleDisplay');
  if (input) input.value = activityId;
  if (display) display.textContent = title;
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

window.openAssignGameModal = openAssignGameModal;
window.openPermanentDeleteActivityModal = openPermanentDeleteActivityModal;
