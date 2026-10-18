function openAssignLessonModal(lessonId, title) {
  const input = document.getElementById('modalLessonId');
  const display = document.getElementById('modalLessonTitleDisplay');
  const studentSelect = document.getElementById('modalLessonStudentSelect');
  if (input) input.value = lessonId;
  if (display) display.textContent = title;
  if (studentSelect) studentSelect.value = '';
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

window.openAssignLessonModal = openAssignLessonModal;
window.openPermanentDeleteLessonModal = openPermanentDeleteLessonModal;

function archiveLessonWithConfirm(formId, title, isDraft = false) {
  const form = document.getElementById(formId);
  if (!form) return;
  const isDraftItem = Boolean(isDraft);
  const actionTitle = isDraftItem ? 'Archive Draft?' : 'Archive Lesson?';
  const actionMsg = isDraftItem
    ? `Move draft "${title}" to archive? You can restore it anytime from the Archived tab.`
    : `Move lesson "${title}" to archive? You can restore it anytime from the Archived tab.`;
  const confirmText = isDraftItem ? 'Archive Draft' : 'Archive';

  if (window.scienceplayConfirm) {
    window.scienceplayConfirm({
      title: actionTitle,
      message: actionMsg,
      confirmText: confirmText,
      confirmClass: 'btn-danger',
      iconClass: 'bi-archive-fill text-warning',
      iconBgClass: 'bg-warning-subtle',
      onConfirm: () => form.submit()
    });
  } else {
    if (confirm(actionMsg)) {
      form.submit();
    }
  }
}
window.archiveLessonWithConfirm = archiveLessonWithConfirm;

function handleArchiveLessonBtn(btn) {
  if (!btn) return;
  const formId = btn.dataset.formId;
  const title = btn.dataset.title || 'this lesson';
  const isDraft = btn.dataset.isDraft === 'true';
  archiveLessonWithConfirm(formId, title, isDraft);
}
window.handleArchiveLessonBtn = handleArchiveLessonBtn;

// Restore tab from URL query param ?tab=drafts or hash #tab-draft-lessons
function initLessonStudioTabs() {
  const hash = window.location.hash;
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');

  if (hash === '#tab-draft-lessons' || tabParam === 'drafts') {
    const draftTab = document.getElementById('tab-draft-lessons');
    if (draftTab && window.bootstrap && window.bootstrap.Tab) {
      bootstrap.Tab.getOrCreateInstance(draftTab).show();
    }
  } else if (hash === '#tab-archived-lessons' || tabParam === 'archived') {
    const archiveTab = document.getElementById('tab-archived-lessons');
    if (archiveTab && window.bootstrap && window.bootstrap.Tab) {
      bootstrap.Tab.getOrCreateInstance(archiveTab).show();
    }
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initLessonStudioTabs);
} else {
  initLessonStudioTabs();
}
