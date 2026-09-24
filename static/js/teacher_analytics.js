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

    // Re-verify stationary heights when switching tabs
    document.querySelectorAll('button[data-bs-toggle="pill"]').forEach(tab => {
      tab.addEventListener('shown.bs.tab', () => {
        document.querySelectorAll('.tab-pane.active table[id]').forEach(t => {
          if (t._currentPage && typeof t._showPage === 'function') {
            t._showPage(t._currentPage, false);
          }
        });
      });
    });
  }

  // Initialize Struggling Students Modal
  function initStrugglingStudentsModal() {
    const modalEl = document.getElementById('strugglingStudentsModal');
    if (!modalEl) return;

    const modal = window.bootstrap && window.bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;
    const itemNameEl = document.getElementById('strugglingModalItemName');
    const contextBadgeEl = document.getElementById('strugglingModalContextBadge');
    const missesEl = document.getElementById('strugglingModalMisses');
    const countPillEl = document.getElementById('strugglingModalCountPill');
    const studentListEl = document.getElementById('strugglingModalStudentList');
    const searchInput = document.getElementById('strugglingModalSearchInput');

    let currentStudents = [];

    function renderStudents(filter = '') {
      if (!studentListEl) return;
      studentListEl.innerHTML = '';

      const query = filter.trim().toLowerCase();
      const filtered = query ? currentStudents.filter(name => name.toLowerCase().includes(query)) : currentStudents;

      if (filtered.length === 0) {
        studentListEl.innerHTML = `
          <div class="col-12 text-center text-muted py-4">
            <i class="bi bi-search display-6 opacity-50 d-block mb-2"></i>
            No students found matching "${filter}".
          </div>`;
        return;
      }

      filtered.forEach(name => {
        const col = document.createElement('div');
        col.className = 'col-12 col-sm-6';
        col.innerHTML = `
          <div class="p-2 rounded-3 border bg-light d-flex align-items-center gap-2 hover-shadow-sm transition-all">
            <span class="badge bg-danger-subtle text-danger rounded-circle p-2 d-inline-flex align-items-center justify-content-center" style="width: 32px; height: 32px;">
              <i class="bi bi-person-fill"></i>
            </span>
            <span class="fw-semibold text-dark text-truncate" title="${name}">${name}</span>
          </div>`;
        studentListEl.appendChild(col);
      });
    }

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        renderStudents(e.target.value);
      });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-struggling-students-modal-btn');
      if (!btn) return;
      e.preventDefault();

      const itemName = btn.getAttribute('data-item-name') || 'Activity Item';
      const context = btn.getAttribute('data-context') || 'Exercise';
      const misses = btn.getAttribute('data-misses') || '0';
      let students = [];
      try {
        students = JSON.parse(btn.getAttribute('data-students') || '[]');
      } catch (err) {
        students = [];
      }

      currentStudents = students;

      if (itemNameEl) itemNameEl.textContent = itemName;
      if (contextBadgeEl) contextBadgeEl.textContent = context;
      if (missesEl) missesEl.textContent = `${misses} miss${misses == 1 ? '' : 'es'}`;
      if (countPillEl) countPillEl.textContent = `${students.length} Student${students.length == 1 ? '' : 's'}`;
      if (searchInput) searchInput.value = '';

      renderStudents();

      if (modal) {
        modal.show();
      } else {
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
        document.body.classList.add('modal-open');
      }
    });
  }

  initStrugglingStudentsModal();
});
