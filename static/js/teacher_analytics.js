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

  // Initialize struggle breakdown tables game & severity filter
  function initStruggleConceptFilters() {
    const gameFilterSelect = document.getElementById('struggleGameFilter');
    const severityFilterSelect = document.getElementById('struggleSeverityFilter');
    if (!gameFilterSelect && !severityFilterSelect) return;

    const tableConfigs = [
      { id: '#struggle-games-table', wrap: '#struggle-games-pagination-wrap', info: '#struggle-games-page-info', nav: '#struggle-games-pagination-nav', badgeId: 'count-struggle-games' },
      { id: '#struggle-lessons-table', wrap: '#struggle-lessons-pagination-wrap', info: '#struggle-lessons-page-info', nav: '#struggle-lessons-pagination-nav', badgeId: 'count-struggle-lessons' },
      { id: '#struggle-breakdown-table', wrap: '#struggle-breakdown-pagination-wrap', info: '#struggle-breakdown-page-info', nav: '#struggle-breakdown-pagination-nav', badgeId: 'count-struggle-all' }
    ];

    function applyStruggleFilter() {
      const selectedGame = gameFilterSelect ? gameFilterSelect.value.trim().toLowerCase() : 'all';
      const selectedSeverity = severityFilterSelect ? severityFilterSelect.value.trim().toLowerCase() : 'all';

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
          const rowSeverity = (row.getAttribute('data-severity') || '').trim().toLowerCase();
          const rowRepeated = parseInt(row.getAttribute('data-repeated') || '0', 10);

          const matchesGame = (
            selectedGame === 'all' ||
            rowGame === selectedGame ||
            rowGame.includes(selectedGame) ||
            selectedGame.includes(rowGame) ||
            rowLesson === selectedGame ||
            rowLesson.includes(selectedGame)
          );

          let matchesSeverity = true;
          if (selectedSeverity === 'high') {
            matchesSeverity = (rowSeverity === 'high' || rowRepeated >= 2);
          } else if (selectedSeverity === 'moderate_high') {
            matchesSeverity = (rowSeverity === 'high' || rowSeverity === 'medium' || rowRepeated >= 1);
          } else if (selectedSeverity === 'low') {
            matchesSeverity = (rowSeverity === 'low' || rowRepeated === 0);
          }

          if (matchesGame && matchesSeverity) {
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

        // Dynamically update the tab header badge so count matches visible rows
        if (cfg.badgeId) {
          const tabBadge = document.getElementById(cfg.badgeId);
          if (tabBadge) {
            tabBadge.textContent = matchedCount;
          }
        }

        // Handle empty filtered state
        let noMatchRow = tbody.querySelector('.struggle-no-match-row');
        if (matchedCount === 0) {
          if (!noMatchRow) {
            noMatchRow = document.createElement('tr');
            noMatchRow.className = 'struggle-no-match-row';
            noMatchRow.innerHTML = '<td colspan="6" class="text-center text-muted py-4"><i class="bi bi-info-circle me-1"></i>No struggling concepts found matching the selected filter criteria.</td>';
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

    if (gameFilterSelect) gameFilterSelect.addEventListener('change', applyStruggleFilter);
    if (severityFilterSelect) severityFilterSelect.addEventListener('change', applyStruggleFilter);
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

  // Initialize Struggling Students Modal with Interactive Confirmation & Student Checklist
  function initStrugglingStudentsModal() {
    const modalEl = document.getElementById('strugglingStudentsModal');
    if (!modalEl) return;

    const modal = window.bootstrap && window.bootstrap.Modal ? bootstrap.Modal.getOrCreateInstance(modalEl) : null;
    const itemNameEl = document.getElementById('strugglingModalItemName');
    const contextBadgeEl = document.getElementById('strugglingModalContextBadge');
    const missesEl = document.getElementById('strugglingModalMisses');
    const countPillEl = document.getElementById('strugglingModalCountPill');
    const studentListEl = document.getElementById('strugglingModalStudentList');
    const severityBadgeEl = document.getElementById('strugglingModalSeverityBadge');
    const breakdownTextEl = document.getElementById('strugglingModalBreakdownText');
    const breakdownBadgeEl = document.getElementById('strugglingModalBreakdownBadge');

    const overviewPane = document.getElementById('strugglingModalOverviewPane');
    const confirmPane = document.getElementById('strugglingModalConfirmPane');
    const confirmBackBtn = document.getElementById('modalConfirmBackBtn');
    const confirmCancelBtn = document.getElementById('modalConfirmCancelBtn');
    const confirmSubmitBtn = document.getElementById('modalConfirmSubmitBtn');
    const confirmSubmitText = document.getElementById('modalConfirmSubmitText');
    const confirmTargetIcon = document.getElementById('confirmTargetIcon');
    const confirmTargetTypeBadge = document.getElementById('confirmTargetTypeBadge');
    const confirmTargetTitle = document.getElementById('confirmTargetTitle');
    const confirmStudentChecklist = document.getElementById('confirmStudentChecklist');
    const confirmCheckedCount = document.getElementById('confirmCheckedCount');
    const confirmTotalCount = document.getElementById('confirmTotalCount');
    const confirmToggleSelectAllBtn = document.getElementById('confirmToggleSelectAllBtn');
    const confirmDueDateInput = document.getElementById('confirmDueDateInput');
    const confirmFeedbackAlert = document.getElementById('modalConfirmFeedbackAlert');

    const assignLessonBtn = document.getElementById('modalBatchAssignLessonBtn');
    const assignGameBtn = document.getElementById('modalBatchAssignGameBtn');
    const createRemedialLessonBtn = document.getElementById('modalCreateRemedialLessonBtn');
    const createRemedialGameBtn = document.getElementById('modalCreateRemedialGameBtn');
    const feedbackAlert = document.getElementById('modalBatchFeedbackAlert');

    let currentStudents = [];
    let currentLessonId = null;
    let currentLessonTitle = '';
    let currentActivityId = null;
    let currentActivityType = '';
    let currentActivityEngine = '';
    let currentItemName = '';
    let pendingAssignType = 'nudge';

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

    function showConfirmFeedback(message, type = 'success') {
      if (!confirmFeedbackAlert) return;
      confirmFeedbackAlert.className = `alert alert-${type} mt-3 mb-0 py-2 px-3 small d-block border-0`;
      confirmFeedbackAlert.innerHTML = `<i class="bi bi-${type === 'success' ? 'check-circle-fill' : 'exclamation-circle-fill'} me-1.5"></i>${message}`;
      confirmFeedbackAlert.classList.remove('d-none');
    }

    function clearConfirmFeedback() {
      if (confirmFeedbackAlert) {
        confirmFeedbackAlert.className = 'alert mt-3 mb-0 py-2 px-3 small d-none';
        confirmFeedbackAlert.innerHTML = '';
      }
    }

    function switchToOverview() {
      if (overviewPane) overviewPane.classList.remove('d-none');
      if (confirmPane) confirmPane.classList.add('d-none');
      clearConfirmFeedback();
    }

    function switchToConfirm(assignType) {
      pendingAssignType = assignType;
      clearFeedback();
      clearConfirmFeedback();

      if (overviewPane) overviewPane.classList.add('d-none');
      if (confirmPane) confirmPane.classList.remove('d-none');

      if (confirmDueDateInput) confirmDueDateInput.value = '';

      const b1 = document.getElementById('confirmBadge1');
      const b2 = document.getElementById('confirmBadge2');

      if (assignType === 'activity') {
        if (confirmTargetIcon) confirmTargetIcon.className = 'bi bi-controller text-success fs-5';
        if (confirmTargetTypeBadge) confirmTargetTypeBadge.textContent = 'Interactive Practice Game';
        if (confirmTargetTitle) confirmTargetTitle.textContent = currentActivityType ? `${currentActivityType} (Practice Game)` : `${currentItemName} Practice`;
        if (b1) {
          b1.className = 'badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-0.5';
          b1.innerHTML = '<i class="bi bi-arrow-repeat me-1"></i>3 Bonus Attempts Unlocked Today';
        }
        if (b2) {
          b2.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-0.5';
          b2.innerHTML = '<i class="bi bi-tag-fill me-1"></i>Tagged: Supplementary Practice';
        }
      } else {
        if (confirmTargetIcon) confirmTargetIcon.className = 'bi bi-bell-fill text-warning fs-5';
        if (confirmTargetTypeBadge) confirmTargetTypeBadge.textContent = 'Targeted Review Nudge';
        if (confirmTargetTitle) confirmTargetTitle.textContent = currentLessonTitle ? `Review Reminder: ${currentLessonTitle} (${currentItemName})` : `Review: ${currentItemName}`;
        if (b1) {
          b1.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2 py-0.5';
          b1.innerHTML = '<i class="bi bi-bell me-1"></i>Direct Dashboard Alert';
        }
        if (b2) {
          b2.className = 'badge bg-info-subtle text-info-emphasis border border-info-subtle rounded-pill px-2 py-0.5';
          b2.innerHTML = '<i class="bi bi-check2 me-1"></i>Zero Assignment Clutter';
        }
      }

      renderConfirmChecklist();
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
        const isRepeated = studentMisses >= 2;

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';
        col.innerHTML = `
          <div class="p-2.5 px-3 rounded-3 border bg-light d-flex align-items-center justify-content-between gap-3 hover-shadow-sm transition-all" style="min-height: 50px;">
            <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;">
              <span class="badge ${isRepeated ? 'bg-danger-subtle text-danger' : 'bg-secondary-subtle text-secondary'} rounded-circle p-2 d-inline-flex align-items-center justify-content-center flex-shrink-0" style="width: 34px; height: 34px;">
                <i class="bi bi-person-fill"></i>
              </span>
              <span class="fw-semibold text-dark" style="font-size: 0.88rem; line-height: 1.25; word-break: break-word;">${studentName}</span>
            </div>
            <span class="badge ${isRepeated ? 'bg-danger text-white' : 'bg-light text-muted border'} rounded-pill px-2.5 py-1 flex-shrink-0 fw-bold" style="font-size: 0.74rem;">
              ${studentMisses} miss${studentMisses === 1 ? '' : 'es'}
            </span>
          </div>`;
        studentListEl.appendChild(col);
      });
    }

    function renderConfirmChecklist() {
      if (!confirmStudentChecklist) return;
      confirmStudentChecklist.innerHTML = '';

      if (!currentStudents || currentStudents.length === 0) {
        confirmStudentChecklist.innerHTML = `
          <div class="col-12 text-center text-muted py-3">
            No students found in this struggle group.
          </div>`;
        return;
      }

      currentStudents.forEach((st, idx) => {
        const studentId = typeof st === 'object' && st !== null && st.id ? st.id : (typeof st === 'number' ? st : null);
        const studentName = typeof st === 'object' && st !== null ? st.name : st;
        const studentMisses = typeof st === 'object' && st !== null && st.miss_count ? st.miss_count : 1;
        const isRepeated = studentMisses >= 2;
        const inputId = `chk_stud_${studentId || idx}`;

        const col = document.createElement('div');
        col.className = 'col-12 col-md-6';
        col.innerHTML = `
          <div class="form-check p-2 px-2.5 rounded-3 bg-white border d-flex align-items-center justify-content-between gap-2 shadow-2xs hover-shadow-sm transition-all" style="min-height: 42px;">
            <div class="d-flex align-items-center gap-2 flex-grow-1" style="min-width: 0;">
              <input class="form-check-input ms-0 me-1 confirm-student-cb" type="checkbox" value="${studentId || ''}" id="${inputId}" checked>
              <label class="form-check-label fw-bold text-dark small text-truncate cursor-pointer mb-0" for="${inputId}">
                ${studentName}
              </label>
            </div>
            <span class="badge ${isRepeated ? 'bg-danger text-white' : 'bg-light text-muted border'} rounded-pill px-2 py-0.5 fw-bold" style="font-size: 0.72rem;">
              ${studentMisses} miss${studentMisses === 1 ? '' : 'es'}
            </span>
          </div>`;
        confirmStudentChecklist.appendChild(col);
      });

      updateConfirmCounts();

      confirmStudentChecklist.querySelectorAll('.confirm-student-cb').forEach(cb => {
        cb.addEventListener('change', updateConfirmCounts);
      });
    }

    function updateConfirmCounts() {
      if (!confirmStudentChecklist) return;
      const allCbs = Array.from(confirmStudentChecklist.querySelectorAll('.confirm-student-cb'));
      const checkedCbs = allCbs.filter(cb => cb.checked);
      const checkedCount = checkedCbs.length;
      const totalCount = allCbs.length;

      if (confirmCheckedCount) confirmCheckedCount.textContent = checkedCount;
      if (confirmTotalCount) confirmTotalCount.textContent = totalCount;
      if (confirmSubmitText) {
        if (pendingAssignType === 'activity') {
          confirmSubmitText.textContent = `Unlock 3 Attempts for ${checkedCount} Student${checkedCount === 1 ? '' : 's'}`;
        } else {
          confirmSubmitText.textContent = `Send Review Nudge to ${checkedCount} Student${checkedCount === 1 ? '' : 's'}`;
        }
      }
      if (confirmSubmitBtn) confirmSubmitBtn.disabled = (checkedCount === 0);

      if (confirmToggleSelectAllBtn) {
        confirmToggleSelectAllBtn.textContent = checkedCount === totalCount ? 'Deselect All' : 'Select All';
      }
    }

    if (confirmToggleSelectAllBtn) {
      confirmToggleSelectAllBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const allCbs = Array.from(confirmStudentChecklist.querySelectorAll('.confirm-student-cb'));
        const anyUnchecked = allCbs.some(cb => !cb.checked);
        allCbs.forEach(cb => { cb.checked = anyUnchecked; });
        updateConfirmCounts();
      });
    }

    if (confirmBackBtn) {
      confirmBackBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToOverview();
      });
    }

    if (confirmCancelBtn) {
      confirmCancelBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToOverview();
      });
    }

    if (confirmSubmitBtn) {
      confirmSubmitBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        clearConfirmFeedback();
        const checkedCbs = Array.from(confirmStudentChecklist.querySelectorAll('.confirm-student-cb:checked'));
        const studentIds = checkedCbs.map(cb => parseInt(cb.value, 10)).filter(Boolean);

        if (!studentIds.length) {
          showConfirmFeedback('Please select at least one student recipient.', 'warning');
          return;
        }

        const originalBtnHtml = confirmSubmitBtn.innerHTML;
        confirmSubmitBtn.disabled = true;
        confirmSubmitBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-1.5" role="status" aria-hidden="true"></span>Processing...';

        try {
          const payload = {
            assign_type: pendingAssignType,
            student_ids: studentIds,
            lesson_id: currentLessonId,
            activity_id: currentActivityId,
            concept: currentItemName,
            due_date: confirmDueDateInput && confirmDueDateInput.value ? confirmDueDateInput.value : null,
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
            showConfirmFeedback(data.message || 'Intervention successfully processed for selected cohort!', 'success');
            confirmSubmitBtn.innerHTML = '<i class="bi bi-check-circle-fill me-1"></i>Completed!';
            setTimeout(() => {
              switchToOverview();
              showFeedback(data.message || 'Intervention successfully processed for selected cohort!', 'success');
            }, 1600);
          } else {
            showConfirmFeedback(data.message || 'Unable to complete batch intervention.', 'danger');
            confirmSubmitBtn.disabled = false;
            confirmSubmitBtn.innerHTML = originalBtnHtml;
          }
        } catch (err) {
          console.error('Batch assign error:', err);
          showConfirmFeedback('Server communication error during intervention.', 'danger');
          confirmSubmitBtn.disabled = false;
          confirmSubmitBtn.innerHTML = originalBtnHtml;
        }
      });
    }

    if (assignLessonBtn) {
      assignLessonBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToConfirm('nudge');
      });
    }

    if (assignGameBtn) {
      assignGameBtn.addEventListener('click', (e) => {
        e.preventDefault();
        switchToConfirm('activity');
      });
    }

    document.addEventListener('click', (e) => {
      const btn = e.target.closest('.open-struggling-students-modal-btn');
      if (!btn) return;
      e.preventDefault();
      clearFeedback();
      switchToOverview();

      const itemName = btn.getAttribute('data-item-name') || 'Activity Item';
      const context = btn.getAttribute('data-context') || 'Exercise';
      const misses = btn.getAttribute('data-misses') || '0';
      const severity = btn.getAttribute('data-severity') || 'medium';
      const severityLabel = btn.getAttribute('data-severity-label') || 'Moderate';
      const repeatedCount = parseInt(btn.getAttribute('data-repeated-count') || '0', 10);
      const singleCount = parseInt(btn.getAttribute('data-single-count') || '0', 10);

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

      if (severityBadgeEl) {
        if (severity === 'high') {
          severityBadgeEl.className = 'badge bg-danger text-white border rounded-pill px-2.5 py-1 fw-bold';
          severityBadgeEl.innerHTML = '<i class="bi bi-fire me-1"></i>Persistent Struggle';
        } else if (severity === 'low') {
          severityBadgeEl.className = 'badge bg-light text-muted border rounded-pill px-2.5 py-1';
          severityBadgeEl.innerHTML = '<i class="bi bi-info-circle me-1"></i>Minor Slip';
        } else {
          severityBadgeEl.className = 'badge bg-warning-subtle text-warning-emphasis border border-warning-subtle rounded-pill px-2.5 py-1 fw-bold';
          severityBadgeEl.innerHTML = '<i class="bi bi-exclamation-triangle me-1"></i>Moderate';
        }
      }

      if (breakdownTextEl && breakdownBadgeEl) {
        if (repeatedCount > 0) {
          breakdownTextEl.textContent = `Mistake Frequency: ${repeatedCount} student(s) with repeated misses (2+), ${singleCount} minor slip(s)`;
          breakdownBadgeEl.className = 'badge bg-danger-subtle text-danger border border-danger-subtle rounded-pill px-2.5 py-1 fw-bold';
          breakdownBadgeEl.textContent = 'High Struggle Priority';
        } else {
          breakdownTextEl.textContent = `Mistake Frequency: All ${students.length} student(s) made 1-off misclicks/slips`;
          breakdownBadgeEl.className = 'badge bg-light text-muted border rounded-pill px-2.5 py-1';
          breakdownBadgeEl.textContent = 'Isolated First-Try Slips';
        }
      }

      if (assignLessonBtn) {
        assignLessonBtn.style.display = currentLessonId ? 'inline-flex' : 'none';
      }
      if (assignGameBtn) {
        assignGameBtn.style.display = currentActivityId ? 'inline-flex' : 'none';
      }

      if (createRemedialLessonBtn) {
        createRemedialLessonBtn.href = `/teacher/content/lesson/builder?mode=supplementary&is_supplementary=1&concept=${encodeURIComponent(itemName)}&lesson_id=${lessonId || ''}`;
      }
      if (createRemedialGameBtn) {
        createRemedialGameBtn.href = `/teacher/content/claw_machine/builder?mode=supplementary&is_supplementary=1&concept=${encodeURIComponent(itemName)}&activity_id=${activityId || ''}`;
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
  initStruggleConceptFilters();
  initStrugglingStudentsModal();
  initUrlHashNavigation();

  // Initialize Bootstrap tooltips for concept preview hover
  if (window.bootstrap && window.bootstrap.Tooltip) {
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    [...tooltipTriggerList].forEach(el => bootstrap.Tooltip.getOrCreateInstance(el));
  }
});
