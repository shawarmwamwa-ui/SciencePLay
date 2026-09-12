/**
 * Teacher Analytics Portal Logic
 * SciencePlay Teacher Portal
 */

document.addEventListener('DOMContentLoaded', () => {
  // Direct robust click handler for KPI cards and info buttons
  function openKpiModal(targetId) {
    if (!targetId) return;
    const modalElem = document.querySelector(targetId);
    if (!modalElem) return;
    if (window.bootstrap && window.bootstrap.Modal) {
      const modalInstance = bootstrap.Modal.getOrCreateInstance(modalElem);
      modalInstance.show();
    } else {
      modalElem.classList.add('show');
      modalElem.style.display = 'block';
      document.body.classList.add('modal-open');
    }
  }

  document.querySelectorAll('.kpi-clickable-card').forEach(card => {
    card.addEventListener('click', function (e) {
      const target = this.getAttribute('data-bs-target');
      if (target) {
        e.preventDefault();
        openKpiModal(target);
      }
    });
  });

  document.querySelectorAll('.kpi-info-btn').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      const target = this.getAttribute('data-bs-target');
      if (target) {
        openKpiModal(target);
      }
    });
  });

  // Initialize pagination for all tables across both tabs using centralized teacher.js helper
  if (typeof setupTablePagination === 'function') {
    setupTablePagination('#top-students-table', '#top-students-pagination-wrap', '#top-students-page-info', '#top-students-pagination-nav', 5);
    setupTablePagination('#missed-lessons-table', '#missed-lessons-pagination-wrap', '#missed-lessons-page-info', '#missed-lessons-pagination-nav', 5);
    setupTablePagination('#missed-activities-table', '#missed-activities-pagination-wrap', '#missed-activities-page-info', '#missed-activities-pagination-nav', 5);
    setupTablePagination('#retry-table', '#retry-pagination-wrap', '#retry-page-info', '#retry-pagination-nav', 8);
    setupTablePagination('#tracker-table', '#tracker-pagination-wrap', '#tracker-page-info', '#tracker-pagination-nav', 5);
    setupTablePagination('#attempts-table', '#attempts-pagination-wrap', '#attempts-page-info', '#attempts-pagination-nav', 5);
  }
});
