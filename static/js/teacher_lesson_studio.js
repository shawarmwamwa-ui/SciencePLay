function openAssignLessonModal(lessonId, title) {
  const input = document.getElementById('modalLessonId');
  const display = document.getElementById('modalLessonTitleDisplay');
  if (input) input.value = lessonId;
  if (display) display.textContent = title;
  const modalEl = document.getElementById('assignLessonModal');
  if (modalEl && window.bootstrap && window.bootstrap.Modal) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function openPermanentDeleteLessonModal(lessonId, title) {
  const display = document.getElementById('permDeleteLessonTitle');
  const form = document.getElementById('permanentDeleteLessonForm');
  if (display) display.textContent = title;
  if (form) form.action = `/teacher/content/lesson/permanent_delete/${lessonId}`;
  const modalEl = document.getElementById('permanentDeleteLessonModal');
  if (modalEl && window.bootstrap && window.bootstrap.Modal) {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

window.openAssignLessonModal = openAssignLessonModal;
window.openPermanentDeleteLessonModal = openPermanentDeleteLessonModal;
