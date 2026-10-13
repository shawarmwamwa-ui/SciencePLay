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

  // Initialize Most Missed Concepts Visual Chart (Chart.js)
  function initMostMissedChart() {
    const canvas = document.getElementById('mostMissedChart');
    if (!canvas || typeof Chart === 'undefined') return;

    let labels = [];
    let misses = [];
    let types = [];
    try {
      labels = JSON.parse(canvas.getAttribute('data-chart-labels') || '[]');
      misses = JSON.parse(canvas.getAttribute('data-chart-misses') || '[]');
      types = JSON.parse(canvas.getAttribute('data-chart-types') || '[]');
    } catch (e) {
      return;
    }

    if (!labels.length || !misses.length) return;

    const ctx = canvas.getContext('2d');
    new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Total Misses',
          data: misses,
          backgroundColor: [
            'rgba(239, 68, 68, 0.85)',
            'rgba(249, 115, 22, 0.85)',
            'rgba(245, 158, 11, 0.85)',
            'rgba(234, 179, 8, 0.85)',
            'rgba(99, 102, 241, 0.85)',
            'rgba(139, 92, 246, 0.85)',
            'rgba(236, 72, 153, 0.85)',
            'rgba(20, 184, 166, 0.85)'
          ],
          borderColor: [
            '#dc2626',
            '#ea580c',
            '#d97706',
            '#ca8a04',
            '#4f46e5',
            '#7c3aed',
            '#db2777',
            '#0d9488'
          ],
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false
          },
          tooltip: {
            backgroundColor: '#0f172a',
            titleFont: { size: 13, family: 'Plus Jakarta Sans', weight: 'bold' },
            bodyFont: { size: 12, family: 'Plus Jakarta Sans' },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              afterLabel: function(ctx) {
                const idx = ctx.dataIndex;
                return types[idx] ? `Context: ${types[idx]}` : '';
              },
              label: function(ctx) {
                return ` ${ctx.parsed.y} miss${ctx.parsed.y === 1 ? '' : 'es'}`;
              }
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: {
              font: { family: 'Plus Jakarta Sans', weight: '600', size: 11 },
              color: '#475569'
            }
          },
          y: {
            beginAtZero: true,
            ticks: {
              stepSize: 1,
              precision: 0,
              font: { family: 'Plus Jakarta Sans', weight: '500', size: 11 },
              color: '#64748b'
            },
            grid: {
              color: '#f1f5f9'
            }
          }
        }
      }
    });
  }

  // Initialize retry table game filter
  function initRetryGameFilter() {
    const filterSelect = document.getElementById('retryGameFilter');
    const table = document.getElementById('retry-table');
    if (!filterSelect || !table) return;

    const tbody = table.querySelector('tbody');
    if (!tbody) return;

    const allRows = Array.from(tbody.querySelectorAll('.retry-table-row'));
    if (!allRows.length) return;

    filterSelect.addEventListener('change', () => {
      const selectedGame = filterSelect.value.trim().toLowerCase();

      allRows.forEach(row => {
        const rowGame = (row.getAttribute('data-game') || '').toLowerCase();
        if (selectedGame === 'all' || rowGame === selectedGame) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });

      // Re-trigger pagination on filtered rows
      if (typeof setupTablePagination === 'function') {
        setupTablePagination('#retry-table', '#retry-pagination-wrap', '#retry-page-info', '#retry-pagination-nav', 8, 1, false);
      }
    });
  }

  // Initialize pagination for all tables across both tabs using centralized teacher.js helper
  if (typeof setupTablePagination === 'function') {
    setupTablePagination('#top-students-table', '#top-students-pagination-wrap', '#top-students-page-info', '#top-students-pagination-nav', 5);
    setupTablePagination('#struggle-games-table', '#struggle-games-pagination-wrap', '#struggle-games-page-info', '#struggle-games-pagination-nav', 6);
    setupTablePagination('#struggle-lessons-table', '#struggle-lessons-pagination-wrap', '#struggle-lessons-page-info', '#struggle-lessons-pagination-nav', 6);
    setupTablePagination('#struggle-breakdown-table', '#struggle-breakdown-pagination-wrap', '#struggle-breakdown-page-info', '#struggle-breakdown-pagination-nav', 6);
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

    let currentStudents = [];

    function renderStudents() {
      if (!studentListEl) return;
      studentListEl.innerHTML = '';

      if (!currentStudents || currentStudents.length === 0) {
        studentListEl.innerHTML = `
          <div class="col-12 text-center text-muted py-4">
            <i class="bi bi-check-circle display-6 text-success opacity-75 d-block mb-2"></i>
            No student misses recorded for this item.
          </div>`;
        return;
      }

      currentStudents.forEach(st => {
        const studentName = typeof st === 'object' && st !== null ? st.name : st;
        const studentMisses = typeof st === 'object' && st !== null && st.miss_count ? st.miss_count : 1;

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';
        col.innerHTML = `
          <div class="p-2.5 px-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 hover-shadow-sm transition-all" style="min-height: 50px;">
            <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;">
              <span class="badge bg-danger-subtle text-danger rounded-circle p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0" style="width: 34px; height: 34px;">
                <i class="bi bi-person-fill"></i>
              </span>
              <span class="fw-semibold text-dark" style="font-size: 0.88rem; line-height: 1.25; word-break: break-word;">${studentName}</span>
            </div>
            <span class="badge bg-danger text-white rounded-pill px-2.5 py-1 flex-shrink-0 fw-bold" style="font-size: 0.74rem;">
              ${studentMisses} miss${studentMisses === 1 ? '' : 'es'}
            </span>
          </div>`;
        studentListEl.appendChild(col);
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

  // -------------------------------------------------------------
  // Automatic URL Hash Handling & Tab Activation for Inter-page Links
  // -------------------------------------------------------------
  function initUrlHashNavigation() {
    function jumpToTarget() {
      const hash = window.location.hash;
      if (!hash) return;

      const tab2Anchors = ['#attempts-section', '#live-tracker-section', '#time-on-task-section'];
      const tab1Anchors = ['#struggling-concepts-section', '#struggling-concepts-table-section', '#most-missed-chart-section', '#top-students-section', '#retry-improvement-section'];

      if (tab2Anchors.some(anchor => hash.startsWith(anchor))) {
        const tabBtn = document.getElementById('tab-live-logs');
        if (tabBtn && window.bootstrap && window.bootstrap.Tab) {
          bootstrap.Tab.getOrCreateInstance(tabBtn).show();
        }
      } else if (tab1Anchors.some(anchor => hash.startsWith(anchor))) {
        const tabBtn = document.getElementById('tab-performance');
        if (tabBtn && window.bootstrap && window.bootstrap.Tab) {
          bootstrap.Tab.getOrCreateInstance(tabBtn).show();
        }
      }

      setTimeout(() => {
        let targetEl = null;
        try {
          targetEl = document.querySelector(hash);
        } catch (e) {
          targetEl = null;
        }

        if (targetEl) {
          const headerOffset = 85;
          const elementPosition = targetEl.getBoundingClientRect().top;
          const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

          window.scrollTo({
            top: Math.max(0, offsetPosition),
            behavior: 'smooth'
          });

          targetEl.classList.add('section-anchor-highlight');
          setTimeout(() => targetEl.classList.remove('section-anchor-highlight'), 2500);
        }
      }, 250);
    }

    jumpToTarget();
    window.addEventListener('hashchange', jumpToTarget);
  }

  initMostMissedChart();
  initRetryGameFilter();
  initStrugglingStudentsModal();
  initUrlHashNavigation();
});
