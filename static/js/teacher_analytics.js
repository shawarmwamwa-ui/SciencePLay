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

  let mostMissedChartInstance = null;

  // Initialize Most Missed Concepts Visual Chart (Chart.js)
  function initMostMissedChart() {
    const canvas = document.getElementById('mostMissedChart');
    if (!canvas || typeof Chart === 'undefined') return;

    let labels = [];
    let misses = [];
    let types = [];
    let chartByLesson = {};
    try {
      labels = JSON.parse(canvas.getAttribute('data-chart-labels') || '[]');
      misses = JSON.parse(canvas.getAttribute('data-chart-misses') || '[]');
      types = JSON.parse(canvas.getAttribute('data-chart-types') || '[]');
      chartByLesson = JSON.parse(canvas.getAttribute('data-chart-by-lesson') || '{}');
    } catch (e) {
      return;
    }

    if (!labels.length && !Object.keys(chartByLesson).length) return;

    const ctx = canvas.getContext('2d');
    mostMissedChartInstance = new Chart(ctx, {
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
                const activeTypes = (mostMissedChartInstance && mostMissedChartInstance._activeTypes) || types;
                return activeTypes[idx] ? `Context: ${activeTypes[idx]}` : '';
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
              color: '#475569',
              callback: function(value) {
                const label = this.getLabelForValue(value);
                if (label && label.length > 22) {
                  return label.substring(0, 20) + '...';
                }
                return label;
              }
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

    mostMissedChartInstance._activeTypes = types;

    // Dynamically filter chart by selected Lesson / Module
    const chartLessonFilter = document.getElementById('chartLessonFilter');
    if (chartLessonFilter) {
      chartLessonFilter.addEventListener('change', function () {
        const selectedLesson = this.value;
        const targetData = (chartByLesson && chartByLesson[selectedLesson]) 
          ? chartByLesson[selectedLesson] 
          : { labels, misses, types };

        mostMissedChartInstance.data.labels = targetData.labels || [];
        mostMissedChartInstance.data.datasets[0].data = targetData.misses || [];
        mostMissedChartInstance._activeTypes = targetData.types || [];
        mostMissedChartInstance.update();

        const countBadge = document.getElementById('chartConceptsCountBadge');
        if (countBadge) {
          countBadge.textContent = (targetData.labels || []).length;
        }
      });
    }
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

    function applyFilter() {
      const selectedGame = filterSelect.value.trim().toLowerCase();
      let matchedCount = 0;

      allRows.forEach(row => {
        const rowGame = (row.getAttribute('data-game') || '').trim().toLowerCase();
        const matches = (
          selectedGame === 'all' || 
          rowGame === selectedGame || 
          rowGame.includes(selectedGame) || 
          selectedGame.includes(rowGame)
        );

        if (matches) {
          row.classList.remove('filter-hidden');
          row.removeAttribute('data-filtered');
          row.style.display = '';
          matchedCount++;
        } else {
          row.classList.add('filter-hidden');
          row.setAttribute('data-filtered', 'true');
          row.style.display = 'none';
        }
      });

      // Handle empty filtered state
      let noMatchRow = tbody.querySelector('.retry-no-match-row');
      if (matchedCount === 0) {
        if (!noMatchRow) {
          noMatchRow = document.createElement('tr');
          noMatchRow.className = 'retry-no-match-row';
          noMatchRow.innerHTML = '<td colspan="8" class="text-center text-muted py-4"><i class="bi bi-info-circle me-1"></i>No student retry entries found for this activity.</td>';
          tbody.appendChild(noMatchRow);
        }
        noMatchRow.style.display = '';
      } else if (noMatchRow) {
        noMatchRow.style.display = 'none';
      }

      // Re-trigger pagination on only the visible, filtered rows
      if (typeof setupTablePagination === 'function') {
        setupTablePagination('#retry-table', '#retry-pagination-wrap', '#retry-page-info', '#retry-pagination-nav', 8, 1, false);
      }
    }

    filterSelect.addEventListener('change', applyFilter);
  }

  // Initialize struggle breakdown tables game filter
  function initStruggleGameFilter() {
    const filterSelect = document.getElementById('struggleGameFilter');
    if (!filterSelect) return;

    const tableConfigs = [
      { id: '#struggle-games-table', wrap: '#struggle-games-pagination-wrap', info: '#struggle-games-page-info', nav: '#struggle-games-pagination-nav' },
      { id: '#struggle-lessons-table', wrap: '#struggle-lessons-pagination-wrap', info: '#struggle-lessons-page-info', nav: '#struggle-lessons-pagination-nav' },
      { id: '#struggle-breakdown-table', wrap: '#struggle-breakdown-pagination-wrap', info: '#struggle-breakdown-page-info', nav: '#struggle-breakdown-pagination-nav' }
    ];

    function applyStruggleFilter() {
      const selectedGame = filterSelect.value.trim().toLowerCase();

      tableConfigs.forEach(cfg => {
        const table = document.querySelector(cfg.id);
        if (!table) return;
        const tbody = table.querySelector('tbody');
        if (!tbody) return;

        const allRows = Array.from(tbody.querySelectorAll('.struggle-table-row'));
        if (!allRows.length) return;

        let matchedCount = 0;
        allRows.forEach(row => {
          const rowGame = (row.getAttribute('data-game') || '').trim().toLowerCase();
          const rowLesson = (row.getAttribute('data-lesson') || '').trim().toLowerCase();

          const matches = (
            selectedGame === 'all' ||
            rowGame === selectedGame ||
            rowGame.includes(selectedGame) ||
            selectedGame.includes(rowGame) ||
            rowLesson === selectedGame ||
            rowLesson.includes(selectedGame)
          );

          if (matches) {
            row.classList.remove('filter-hidden');
            row.removeAttribute('data-filtered');
            row.style.display = '';
            matchedCount++;
          } else {
            row.classList.add('filter-hidden');
            row.setAttribute('data-filtered', 'true');
            row.style.display = 'none';
          }
        });

        // Handle empty filtered state
        let noMatchRow = tbody.querySelector('.struggle-no-match-row');
        if (matchedCount === 0) {
          if (!noMatchRow) {
            noMatchRow = document.createElement('tr');
            noMatchRow.className = 'struggle-no-match-row';
            noMatchRow.innerHTML = '<td colspan="7" class="text-center text-muted py-4"><i class="bi bi-info-circle me-1"></i>No struggling concepts found for this game or activity.</td>';
            tbody.appendChild(noMatchRow);
          }
          noMatchRow.style.display = '';
        } else if (noMatchRow) {
          noMatchRow.style.display = 'none';
        }

        // Re-trigger pagination on visible filtered rows
        if (typeof setupTablePagination === 'function') {
          setupTablePagination(cfg.id, cfg.wrap, cfg.info, cfg.nav, 6, 1, false);
        }
      });
    }

    filterSelect.addEventListener('change', applyStruggleFilter);
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

  // Initialize Struggling Students Modal with 1-Click Batch Intervention
  function initStrugglingStudentsModal() {
    const modalEl = document.getElementById('strugglingStudentsModal');
    if (!modalEl) return;

    const modal = window.bootstrap && window.bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;
    const itemNameEl = document.getElementById('strugglingModalItemName');
    const contextBadgeEl = document.getElementById('strugglingModalContextBadge');
    const missesEl = document.getElementById('strugglingModalMisses');
    const countPillEl = document.getElementById('strugglingModalCountPill');
    const studentListEl = document.getElementById('strugglingModalStudentList');

    const assignLessonBtn = document.getElementById('modalBatchAssignLessonBtn');
    const assignGameBtn = document.getElementById('modalBatchAssignGameBtn');
    const createSuppBtn = document.getElementById('modalCreateSupplementaryBtn');
    const feedbackAlert = document.getElementById('modalBatchFeedbackAlert');

    let currentStudents = [];
    let currentLessonId = null;
    let currentLessonTitle = '';
    let currentActivityId = null;
    let currentActivityType = '';
    let currentActivityEngine = '';
    let currentItemName = '';

    function showFeedback(message, type = 'success') {
      if (!feedbackAlert) return;
      feedbackAlert.className = `alert alert-${type} mt-2 mb-0 py-2 px-3 small d-block border-0`;
      feedbackAlert.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'} me-1.5"></i>${message}`;
      feedbackAlert.classList.remove('d-none');
    }

    function clearFeedback() {
      if (feedbackAlert) {
        feedbackAlert.className = 'alert mt-2 mb-0 py-2 px-3 small d-none';
        feedbackAlert.innerHTML = '';
      }
    }

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

    // Modal Batch Intervention Assignment Handler
    async function executeBatchAssign(assignType) {
      clearFeedback();
      const studentIds = currentStudents.map(s => (typeof s === 'object' && s.id ? s.id : s)).filter(Boolean);
      if (!studentIds.length) {
        showFeedback('No valid student accounts found in this struggle group.', 'warning');
        return;
      }

      const activeBtn = assignType === 'lesson' ? assignLessonBtn : assignGameBtn;
      const originalHtml = activeBtn ? activeBtn.innerHTML : '';
      if (activeBtn) {
        activeBtn.disabled = true;
        activeBtn.innerHTML = `<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>Assigning...`;
      }

      try {
        const payload = {
          assign_type: assignType,
          student_ids: studentIds,
          lesson_id: currentLessonId,
          activity_id: currentActivityId,
          is_supplementary: true
        };

        const res = await fetch('/teacher/batch_assign_intervention', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
          },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (res.ok && data.status === 'ok') {
          showFeedback(data.message || 'Intervention successfully assigned to cohort!', 'success');
        } else {
          showFeedback(data.message || 'Unable to complete batch intervention assignment.', 'danger');
        }
      } catch (err) {
        console.error('Batch assign error:', err);
        showFeedback('Server communication error during intervention assignment.', 'danger');
      } finally {
        if (activeBtn) {
          activeBtn.disabled = false;
          activeBtn.innerHTML = originalHtml;
        }
      }
    }

    if (assignLessonBtn) {
      assignLessonBtn.addEventListener('click', (e) => {
        e.preventDefault();
        executeBatchAssign('lesson');
      });
    }

    if (assignGameBtn) {
      assignGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        executeBatchAssign('activity');
      });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-struggling-students-modal-btn');
      if (!btn) return;
      e.preventDefault();
      clearFeedback();

      const itemName = btn.getAttribute('data-item-name') || 'Activity Item';
      const context = btn.getAttribute('data-context') || 'Exercise';
      const misses = btn.getAttribute('data-misses') || '0';
      const lessonId = btn.getAttribute('data-lesson-id') || null;
      const lessonTitle = btn.getAttribute('data-lesson-title') || '';
      const activityId = btn.getAttribute('data-activity-id') || null;
      const activityType = btn.getAttribute('data-activity-type') || '';
      const activityEngine = btn.getAttribute('data-activity-engine') || '';

      let students = [];
      try {
        students = JSON.parse(btn.getAttribute('data-students') || '[]');
      } catch (err) {
        students = [];
      }

      currentStudents = students;
      currentLessonId = lessonId;
      currentLessonTitle = lessonTitle;
      currentActivityId = activityId;
      currentActivityType = activityType;
      currentActivityEngine = activityEngine;
      currentItemName = itemName;

      if (itemNameEl) itemNameEl.textContent = itemName;
      if (contextBadgeEl) contextBadgeEl.textContent = context;
      if (missesEl) missesEl.textContent = `${misses} miss${misses == 1 ? '' : 'es'}`;
      if (countPillEl) countPillEl.textContent = `${students.length} Student${students.length == 1 ? '' : 's'}`;

      if (assignLessonBtn) {
        assignLessonBtn.style.display = currentLessonId ? 'inline-flex' : 'none';
      }
      if (assignGameBtn) {
        assignGameBtn.style.display = currentActivityId ? 'inline-flex' : 'none';
      }

      if (createSuppBtn) {
        if (activityEngine === 'claw_machine' && activityId) {
          createSuppBtn.href = `/teacher/claw_machine_builder?activity_id=${activityId}&concept=${encodeURIComponent(itemName)}`;
        } else {
          createSuppBtn.href = `/teacher/content_management?concept=${encodeURIComponent(itemName)}&lesson=${encodeURIComponent(lessonTitle)}`;
        }
      }

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
  initStruggleGameFilter();
  initStrugglingStudentsModal();
  initUrlHashNavigation();
});
