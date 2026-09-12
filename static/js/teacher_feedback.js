/**
 * Teacher Feedback Portal Logic
 * SciencePlay Teacher Portal
 */

// Quick preset insertion
window.applyPreset = function (attemptId, text) {
  const textarea = document.getElementById(`feedback-text-${attemptId}`);
  if (!textarea) return;
  if (textarea.value.trim().length > 0) {
    textarea.value = textarea.value.trim() + ' ' + text;
  } else {
    textarea.value = text;
  }
  textarea.focus();
};

// Dynamic UI counters & badges updater
function updateCounters() {
  const allCards = document.querySelectorAll('.feedback-submission-card');
  const pendingCards = document.querySelectorAll('.feedback-submission-card[data-status="pending"]');
  const completedCards = document.querySelectorAll('.feedback-submission-card[data-status="completed"]');

  const total = allCards.length;
  const pending = pendingCards.length;
  const completed = completedCards.length;

  const kpiTotal = document.getElementById('kpi-total-submissions');
  const kpiNeeds = document.getElementById('kpi-needs-feedback');
  const kpiGiven = document.getElementById('kpi-feedback-given');

  if (kpiTotal) kpiTotal.textContent = total;
  if (kpiNeeds) kpiNeeds.textContent = pending;
  if (kpiGiven) kpiGiven.textContent = completed;

  const tabAll = document.getElementById('tab-btn-all');
  const tabPending = document.getElementById('tab-btn-pending');
  const tabCompleted = document.getElementById('tab-btn-completed');

  if (tabAll) tabAll.innerHTML = `All (${total})`;
  if (tabPending) tabPending.innerHTML = `<i class="bi bi-hourglass-split me-1 text-warning"></i>Needs Note (${pending})`;
  if (tabCompleted) tabCompleted.innerHTML = `<i class="bi bi-check-circle-fill me-1 text-success"></i>Given (${completed})`;

  // Update sidebar notification badges
  const sidebarBadges = document.querySelectorAll('.feedback-nav-badge');
  sidebarBadges.forEach(b => {
    if (pending > 0) {
      b.textContent = pending;
      b.style.display = 'inline-flex';
    } else {
      b.style.display = 'none';
    }
  });
}

// Ajax Save Feedback
window.saveTeacherFeedback = async function (attemptId) {
  const textarea = document.getElementById(`feedback-text-${attemptId}`);
  const saveBtn = document.getElementById(`save-btn-${attemptId}`);
  const indicator = document.getElementById(`save-status-indicator-${attemptId}`) || document.getElementById(`save-indicator-${attemptId}`);
  if (!textarea || !saveBtn) return;

  const text = textarea.value.trim();
  const originalHtml = saveBtn.innerHTML;
  saveBtn.disabled = true;
  saveBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1"></span>Saving...';

  const apiUrl = document.body.getAttribute('data-add-feedback-url') || '/teacher/add_feedback';

  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      },
      body: JSON.stringify({
        attempt_id: attemptId,
        teacher_feedback: text
      })
    });

    if (response.ok) {
      saveBtn.disabled = false;
      saveBtn.innerHTML = '<i class="bi bi-check2 me-1"></i>Saved';
      setTimeout(() => { saveBtn.innerHTML = originalHtml; }, 2000);

      if (indicator) {
        indicator.style.display = 'inline-block';
        setTimeout(() => { indicator.style.display = 'none'; }, 3000);
      }

      // Instantly update card badge and state
      const card = textarea.closest('.feedback-submission-card');
      const badge = document.getElementById(`status-badge-${attemptId}`) || (card ? card.querySelector('.submission-status-badge') : null);

      if (card) {
        if (text.length > 0) {
          card.classList.remove('needs-note');
          card.classList.add('note-given');
          card.setAttribute('data-status', 'completed');

          if (badge) {
            badge.className = 'badge submission-status-badge bg-success-subtle text-success border border-success-subtle px-2 py-1 rounded-pill';
            badge.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i><span>Feedback Given</span>';
          }
        } else {
          card.classList.add('needs-note');
          card.classList.remove('note-given');
          card.setAttribute('data-status', 'pending');

          if (badge) {
            badge.className = 'badge submission-status-badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1 rounded-pill';
            badge.innerHTML = '<i class="bi bi-hourglass-split me-1"></i><span>Needs Note</span>';
          }
        }
      }

      // Update metric cards, tab counts, and sidebar badge immediately
      updateCounters();

      // Re-apply current active filters smoothly
      if (window.applyFeedbackFilters) {
        window.applyFeedbackFilters();
      }
    } else {
      throw new Error('Failed to save');
    }
  } catch (err) {
    console.error(err);
    saveBtn.disabled = false;
    saveBtn.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Retry';
    alert('Could not save note. Please try again.');
  }
};

// Client-side filtering logic
document.addEventListener('DOMContentLoaded', () => {
  const cards = document.querySelectorAll('.feedback-submission-card');
  const filterBtns = document.querySelectorAll('.filter-tab-btn');
  const studentFilter = document.getElementById('studentFilter');
  const searchInput = document.getElementById('searchInput');
  const noResults = document.getElementById('noResultsNotice');

  let currentStatusFilter = 'all';

  window.applyFeedbackFilters = function() {
    const selectedStudent = studentFilter ? studentFilter.value : '';
    const searchKeyword = searchInput ? searchInput.value.trim().toLowerCase() : '';
    let visibleCount = 0;

    cards.forEach(card => {
      const status = card.getAttribute('data-status');
      const studentId = card.getAttribute('data-student-id');
      const searchText = card.getAttribute('data-search-text') || '';

      const matchesStatus = (currentStatusFilter === 'all') || (status === currentStatusFilter);
      const matchesStudent = !selectedStudent || (studentId === selectedStudent);
      const matchesSearch = !searchKeyword || searchText.includes(searchKeyword);

      if (matchesStatus && matchesStudent && matchesSearch) {
        card.style.display = 'block';
        visibleCount += 1;
      } else {
        card.style.display = 'none';
      }
    });

    if (noResults) {
      noResults.classList.toggle('d-none', visibleCount > 0);
    }
  };

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatusFilter = btn.getAttribute('data-filter');
      window.applyFeedbackFilters();
    });
  });

  if (studentFilter) studentFilter.addEventListener('change', window.applyFeedbackFilters);
  if (searchInput) searchInput.addEventListener('input', window.applyFeedbackFilters);
});
