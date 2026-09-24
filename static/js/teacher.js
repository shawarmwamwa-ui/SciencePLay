function initTeacherNavigation() {
  const navLinks = document.querySelectorAll('.teacher-menu-link[data-nav]');
  if (!navLinks.length) {
    return;
  }

  const currentPath = window.location.pathname.replace(/\/+$/, '');

  const setActive = (navKey) => {
    navLinks.forEach((link) => {
      link.classList.toggle('active', link.dataset.nav === navKey);
    });
  };

  const resolveActiveKey = () => {
    if (currentPath.includes('/teacher/students') || currentPath.includes('/teacher/student')) {
      return 'students';
    }
    if (currentPath.includes('/teacher/lessons') || currentPath.includes('/teacher/assignments')) {
      return 'lessons';
    }
    if (currentPath.includes('/teacher/analytics')) {
      return 'analytics';
    }
    if (currentPath.includes('/teacher/feedback')) {
      return 'feedback';
    }
    if (currentPath.includes('/teacher/dashboard') || currentPath === '/teacher') {
      return 'dashboard';
    }
    return 'dashboard';
  };

  setActive(resolveActiveKey());
}

function initTeacherSlidingIndicator() {
  const menuGroup = document.querySelector('.teacher-sidebar .teacher-menu-group');
  if (!menuGroup) return;

  const links = Array.from(menuGroup.querySelectorAll('.teacher-menu-link'));
  if (!links.length) return;

  let indicator = menuGroup.querySelector('.teacher-menu-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'teacher-menu-indicator';
    indicator.setAttribute('aria-hidden', 'true');
    menuGroup.prepend(indicator);
  }

  menuGroup.classList.add('has-indicator');

  function getTargetOffset(targetEl) {
    const groupRect = menuGroup.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();
    return {
      top: targetRect.top - groupRect.top,
      height: targetRect.height
    };
  }

  function moveIndicator(targetEl, animate = true) {
    if (!targetEl) return;
    const { top, height } = getTargetOffset(targetEl);
    if (!animate) {
      indicator.style.transition = 'none';
    } else {
      indicator.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.25, 0.64, 1), height 0.22s ease, opacity 0.2s ease';
    }
    indicator.style.transform = `translateY(${top}px)`;
    indicator.style.height = `${height}px`;
    indicator.style.opacity = '1';

    if (!animate) {
      requestAnimationFrame(() => {
        indicator.style.transition = 'transform 0.38s cubic-bezier(0.34, 1.25, 0.64, 1), height 0.22s ease, opacity 0.2s ease';
      });
    }
  }

  const activeLink = menuGroup.querySelector('.teacher-menu-link.active') || links[0];
  const activeIndex = links.indexOf(activeLink);

  // Cross-page sliding continuity
  const prevOffsetRaw = sessionStorage.getItem('teacher_active_offset');
  const prevIndexRaw = sessionStorage.getItem('teacher_active_index');

  if (prevOffsetRaw !== null && prevIndexRaw !== null && Number(prevIndexRaw) !== activeIndex) {
    const prevOffset = parseFloat(prevOffsetRaw);
    indicator.style.transition = 'none';
    indicator.style.transform = `translateY(${prevOffset}px)`;
    indicator.style.height = `${activeLink.offsetHeight}px`;
    indicator.style.opacity = '1';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        moveIndicator(activeLink, true);
      });
    });
  } else {
    moveIndicator(activeLink, false);
  }

  sessionStorage.setItem('teacher_active_offset', getTargetOffset(activeLink).top);
  sessionStorage.setItem('teacher_active_index', activeIndex);

  // Only glide when clicking a different navigation item!
  links.forEach((link, idx) => {
    link.addEventListener('click', () => {
      const currentOffset = getTargetOffset(link);
      sessionStorage.setItem('teacher_active_offset', currentOffset.top);
      sessionStorage.setItem('teacher_active_index', idx);
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      moveIndicator(link, true);
    });
  });

  window.addEventListener('resize', () => {
    const currentActive = menuGroup.querySelector('.teacher-menu-link.active') || links[0];
    moveIndicator(currentActive, false);
  });
}

function initAlertAutoDismiss() {
  const alerts = document.querySelectorAll('.alert, .alerts-container .alert, .brutal-alert');
  alerts.forEach((alert) => {
    setTimeout(() => {
      if (window.bootstrap && window.bootstrap.Alert) {
        try {
          const alertInstance = window.bootstrap.Alert.getOrCreateInstance(alert);
          alertInstance.close();
          return;
        } catch (e) {}
      }
      alert.classList.add('fade');
      setTimeout(() => {
        if (alert.parentNode) {
          alert.remove();
        }
      }, 500);
    }, 5000);
  });
}

function initDashboardSkeleton() {
  const skeleton = document.querySelector('.dashboard-skeleton-wrap');
  const realContent = document.querySelector('.dashboard-real-content');
  if (!skeleton || !realContent) {
    initHashTabSwitching();
    return;
  }

  setTimeout(() => {
    document.body.classList.add('dashboard-loaded');
    setTimeout(initHashTabSwitching, 120);
  }, 650);
}

/**
 * Universal Client-Side Table Pagination for Teacher Views
 */
function setupTablePagination(tableSelector, wrapSelector, infoSelector, navSelector, itemsPerPage = 5, targetPage = null, animate = true) {
  const table = document.querySelector(tableSelector);
  const wrap = document.querySelector(wrapSelector);
  const info = document.querySelector(infoSelector);
  const nav = document.querySelector(navSelector);

  if (!table || !nav) return;

  const rows = Array.from(table.querySelectorAll('tbody tr')).filter(r => !r.classList.contains('table-spacer-row') && !r.querySelector('td[colspan]'));
  const totalRows = rows.length;

  if (totalRows === 0) {
    if (wrap) wrap.classList.add('d-none');
    table.querySelectorAll('tbody tr.table-spacer-row').forEach(r => r.remove());
    return;
  }

  const totalPages = Math.ceil(totalRows / itemsPerPage);

  if (totalRows <= itemsPerPage) {
    if (info) info.textContent = `Showing 1 to ${totalRows} of ${totalRows} entries`;
    if (nav) nav.innerHTML = '';
    if (wrap) wrap.classList.remove('d-none');
    rows.forEach(r => r.style.display = '');
    table._currentPage = 1;
    table.querySelectorAll('tbody tr.table-spacer-row').forEach(r => r.remove());
    return;
  }

  if (wrap) wrap.classList.remove('d-none');
  let currentPage = targetPage ? Math.min(Math.max(1, targetPage), totalPages) : (table._currentPage ? Math.min(table._currentPage, totalPages) : 1);
  table._currentPage = currentPage;

  function showPage(page, shouldAnimate = false) {
    currentPage = page;
    table._currentPage = page;

    // Remove any previously injected spacer rows
    table.querySelectorAll('tbody tr.table-spacer-row').forEach(r => r.remove());

    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    let visibleInThisPage = 0;
    rows.forEach((row, idx) => {
      if (idx >= start && idx < end) {
        row.style.display = '';
        visibleInThisPage++;
        if (shouldAnimate) {
          row.classList.remove('table-row-fade');
          void row.offsetWidth; // Trigger reflow for smooth animation on user click
          row.classList.add('table-row-fade');
        } else {
          row.classList.remove('table-row-fade');
        }
      } else {
        row.style.display = 'none';
      }
    });

    // Static height preservation:
    // If the current page has fewer rows than itemsPerPage, inject empty spacer rows so the table never shrinks!
    if (visibleInThisPage > 0 && visibleInThisPage < itemsPerPage && totalRows > itemsPerPage) {
      const tbody = table.querySelector('tbody');
      const colCount = table.querySelectorAll('thead th').length || 4;
      const missingCount = itemsPerPage - visibleInThisPage;

      // Determine real row height dynamically or fall back to 64px
      let targetRowHeight = 64;
      const sampleRow = rows.find(r => r.style.display !== 'none');
      if (sampleRow && sampleRow.offsetHeight > 40) {
        targetRowHeight = sampleRow.offsetHeight;
      }

      for (let i = 0; i < missingCount; i++) {
        const spacer = document.createElement('tr');
        spacer.className = 'table-spacer-row';
        spacer.style.pointerEvents = 'none';
        spacer.style.height = `${targetRowHeight}px`;
        spacer.setAttribute('aria-hidden', 'true');
        for (let c = 0; c < colCount; c++) {
          const td = document.createElement('td');
          td.className = 'table-spacer-cell';
          td.style.height = `${targetRowHeight}px`;
          td.style.padding = '0 1.1rem';
          td.style.borderBottom = '1px solid #edf2fa';
          td.style.background = 'transparent';
          // Non-collapsing invisible inner div guarantees the browser's table engine maintains exact height
          td.innerHTML = `<div style="height:${targetRowHeight}px; visibility:hidden; pointer-events:none; line-height:${targetRowHeight}px;">&nbsp;</div>`;
          spacer.appendChild(td);
        }
        tbody.appendChild(spacer);
      }
    }

    // Lock stationary height on the table-responsive wrapper so container NEVER shifts or bounces
    const tableWrap = table.closest('.table-responsive');
    if (tableWrap) {
      const currentHeight = table.offsetHeight;
      if (currentHeight > 0) {
        if (!table._stationaryHeight || currentHeight > table._stationaryHeight) {
          table._stationaryHeight = currentHeight;
        }
        tableWrap.style.minHeight = `${table._stationaryHeight}px`;
      }
    }

    if (info) {
      info.textContent = `Showing ${Math.min(start + 1, totalRows)} to ${Math.min(end, totalRows)} of ${totalRows} entries`;
    }

    renderControls();
  }

  table._showPage = showPage;

  function renderControls() {
    nav.innerHTML = '';

    // First page button (<<)
    const firstLi = document.createElement('li');
    firstLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    firstLi.innerHTML = `<button type="button" class="page-link" aria-label="First page" title="First Page"><i class="bi bi-chevron-double-left"></i></button>`;
    firstLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) showPage(1, true);
    });
    nav.appendChild(firstLi);

    // Prev page button (<)
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<button type="button" class="page-link" aria-label="Previous page" title="Previous Page"><i class="bi bi-chevron-left"></i></button>`;
    prevLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) showPage(currentPage - 1, true);
    });
    nav.appendChild(prevLi);

    // Page indicator pill (Page X of Y)
    const pageLi = document.createElement('li');
    pageLi.className = 'page-item disabled page-indicator';
    pageLi.innerHTML = `<span class="page-link fw-bold text-dark px-3 py-1" style="background:#f8fafc; border-color:#e2e8f0; cursor:default; font-size:0.83rem;">Page ${currentPage} of ${totalPages}</span>`;
    nav.appendChild(pageLi);

    // Next page button (>)
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<button type="button" class="page-link" aria-label="Next page" title="Next Page"><i class="bi bi-chevron-right"></i></button>`;
    nextLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) showPage(currentPage + 1, true);
    });
    nav.appendChild(nextLi);

    // Last page button (>>)
    const lastLi = document.createElement('li');
    lastLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    lastLi.innerHTML = `<button type="button" class="page-link" aria-label="Last page" title="Last Page"><i class="bi bi-chevron-double-right"></i></button>`;
    lastLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) showPage(totalPages, true);
    });
    nav.appendChild(lastLi);
  }

  showPage(currentPage, animate);
}

/**
 * Auto-switch tabs if window URL hash matches a tab trigger or element inside a tab pane,
 * and smoothly scrolls directly down to the exact section with a comfortable offset.
 */
function initHashTabSwitching() {
  const hash = window.location.hash;
  if (!hash || hash.length <= 1) return;

  function scrollToElement(target) {
    if (!target) return;
    const headerOffset = 85;
    const elementPosition = target.getBoundingClientRect().top;
    const offsetPosition = elementPosition + window.pageYOffset - headerOffset;
    
    window.scrollTo({
      top: Math.max(0, offsetPosition),
      behavior: 'smooth'
    });

    if (target.id === 'struggling-concepts-section') {
      const lessonsEl = document.getElementById('missed-lessons-section');
      const activitiesEl = document.getElementById('missed-activities-section');
      if (lessonsEl) lessonsEl.classList.add('section-anchor-highlight');
      if (activitiesEl) activitiesEl.classList.add('section-anchor-highlight');
      setTimeout(() => {
        if (lessonsEl) lessonsEl.classList.remove('section-anchor-highlight');
        if (activitiesEl) activitiesEl.classList.remove('section-anchor-highlight');
      }, 2500);
    } else {
      target.classList.add('section-anchor-highlight');
      setTimeout(() => target.classList.remove('section-anchor-highlight'), 2500);
    }

    // Re-verify after smooth scroll completes to prevent layout shift offset
    setTimeout(() => {
      const recheckPos = target.getBoundingClientRect().top;
      if (Math.abs(recheckPos - headerOffset) > 40) {
        window.scrollTo({
          top: Math.max(0, target.getBoundingClientRect().top + window.pageYOffset - headerOffset),
          behavior: 'smooth'
        });
      }
    }, 450);
  }

  // Check if hash matches a tab trigger directly
  const targetTrigger = document.querySelector(`button[data-bs-target="${hash}"], a[data-bs-target="${hash}"]`);
  if (targetTrigger && window.bootstrap && window.bootstrap.Tab) {
    new window.bootstrap.Tab(targetTrigger).show();
    setTimeout(() => scrollToElement(targetTrigger), 180);
    return;
  }

  let targetEl = null;
  try {
    targetEl = document.querySelector(hash);
  } catch (e) {
    return;
  }

  if (targetEl) {
    const parentPane = targetEl.closest('.tab-pane');
    if (parentPane && !parentPane.classList.contains('active')) {
      const tabTrigger = document.querySelector(`[data-bs-target="#${parentPane.id}"]`);
      if (tabTrigger && window.bootstrap && window.bootstrap.Tab) {
        new window.bootstrap.Tab(tabTrigger).show();
        // Wait for Bootstrap fade tab transition to complete layout rendering
        setTimeout(() => scrollToElement(targetEl), 250);
        return;
      }
    }

    // Target is already in visible pane or standalone section
    setTimeout(() => scrollToElement(targetEl), 100);
  }
}

/**
 * Real-Time Live Time Stopwatch & Auto-Polling Sync for Live Tracker
 */
function formatDurationStr(totalSec) {
  if (isNaN(totalSec) || totalSec < 0) totalSec = 0;
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function initLiveStopwatchTicker() {
  setInterval(() => {
    const tickers = document.querySelectorAll('.live-time-ticker');
    tickers.forEach(ticker => {
      let sec = parseInt(ticker.getAttribute('data-seconds') || '0', 10);
      sec += 1;
      ticker.setAttribute('data-seconds', sec);
      const valEl = ticker.querySelector('.time-val');
      if (valEl) valEl.textContent = formatDurationStr(sec);

      const baseTotal = parseInt(ticker.getAttribute('data-base-total') || '0', 10);
      const parent = ticker.closest('.d-flex.flex-column');
      if (parent) {
        const totalValEl = parent.querySelector('.total-val');
        if (totalValEl) totalValEl.textContent = formatDurationStr(baseTotal + sec);
      }
    });
  }, 1000);
}

function initLiveTrackerSync() {
  const section = document.getElementById('live-tracker-section');
  if (!section) return;
  const apiUrl = section.getAttribute('data-live-tracker-api-url');
  if (!apiUrl) return;

  async function pollTracker() {
    try {
      const res = await fetch(apiUrl, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (!data || !data.success || !Array.isArray(data.tracker)) return;

      const tbody = document.querySelector('#tracker-table tbody');
      if (!tbody) return;

      // Update count badges if present
      const badge1 = document.getElementById('live-tracker-count-badge');
      if (badge1) badge1.textContent = `${data.total_active} Active Students`;
      const badge2 = document.getElementById('analytics-live-tracker-count-badge');
      if (badge2) badge2.textContent = `${data.total_active} Active Students`;

      // Check current search filter
      const searchInput = document.getElementById('liveTrackerSearch');
      const query = searchInput ? searchInput.value.trim().toLowerCase() : '';

      if (data.tracker.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No student lesson progress recorded yet.</td></tr>';
        return;
      }

      // Check existing rows in tbody
      const existingRows = Array.from(tbody.querySelectorAll('tr.live-tracker-row'));
      const existingKeys = existingRows.map(r => r.getAttribute('data-row-key') || `${r.getAttribute('data-student')}-${r.getAttribute('data-lesson')}`);
      const incomingKeys = data.tracker.map(item => `${item.student_id}-${(item.lesson_title || '').toLowerCase()}`);

      const keysMatch = existingKeys.length === incomingKeys.length && existingKeys.every((k, idx) => k === incomingKeys[idx]);

      if (keysMatch && !query) {
        // SURGICAL IN-PLACE UPDATE: No DOM destruction, zero twitching, zero layout shift!
        data.tracker.forEach((item, idx) => {
          const row = existingRows[idx];
          if (!row) return;

          // 1. Online indicator in student cell
          const studentCell = row.children[0];
          if (studentCell) {
            const existingOnlineBadge = studentCell.querySelector('.badge.bg-success-subtle');
            if (item.is_online && !existingOnlineBadge) {
              const wrap = studentCell.querySelector('.d-flex');
              if (wrap) {
                const onlineSpan = document.createElement('span');
                onlineSpan.className = 'badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1';
                onlineSpan.style.fontSize = '0.74rem';
                onlineSpan.title = 'Active online now';
                onlineSpan.innerHTML = '<span class="status-pulse-dot me-1"></span>Online';
                wrap.appendChild(onlineSpan);
              }
            } else if (!item.is_online && existingOnlineBadge) {
              existingOnlineBadge.remove();
            }
          }

          // 2. Status badge
          const statusCell = row.children[2];
          if (statusCell) {
            const expectedStatusHtml = `<span class="badge ${item.status_badge_class} px-3 py-2 rounded-pill">${item.status}</span>`;
            if (statusCell.innerHTML.trim() !== expectedStatusHtml.trim()) {
              statusCell.innerHTML = expectedStatusHtml;
            }
          }

          // 3. Progress bar
          const progressCell = row.children[3];
          if (progressCell && progressCell.innerHTML.trim() !== item.progress_bar_display.trim()) {
            progressCell.innerHTML = item.progress_bar_display;
          }

          // 4. Time spent
          const timeCell = row.children[4];
          if (timeCell && timeCell.innerHTML.trim() !== item.time_spent_display.trim()) {
            timeCell.innerHTML = item.time_spent_display;
          }

          // 5. Revisit history
          const revisitCell = row.children[5];
          if (revisitCell && revisitCell.innerHTML.trim() !== item.revisit_display.trim()) {
            revisitCell.innerHTML = item.revisit_display;
          }
        });
      } else {
        // Rows were added, removed, or filtered: re-render cleanly
        let html = '';
        data.tracker.forEach(item => {
          const studentLower = (item.student_name || '').toLowerCase();
          const lessonLower = (item.lesson_title || '').toLowerCase();
          const rowKey = `${item.student_id}-${lessonLower}`;
          const matches = !query || studentLower.includes(query) || lessonLower.includes(query);
          const displayStyle = matches ? '' : 'style="display:none;"';

          const onlineBadge = item.is_online
            ? `<span class="badge bg-success-subtle text-success border border-success-subtle rounded-pill px-2 py-1" style="font-size: 0.74rem;" title="Active online now"><span class="status-pulse-dot me-1"></span>Online</span>`
            : '';

          html += `
            <tr class="live-tracker-row" data-student="${studentLower}" data-lesson="${lessonLower}" data-row-key="${rowKey}" ${displayStyle}>
              <td>
                <div class="d-flex align-items-center gap-2 flex-wrap">
                  <a href="/teacher/student/${item.student_id}" class="btn btn-sm btn-light border px-3 py-1 rounded-pill fw-bold text-dark d-inline-flex align-items-center gap-1 shadow-sm hover-primary" title="View Student Performance Report">
                    <i class="bi bi-person-fill text-primary"></i> ${item.student_name}
                  </a>
                  ${onlineBadge}
                </div>
              </td>
              <td><span class="fw-semibold text-secondary">${item.lesson_title}</span></td>
              <td><span class="badge ${item.status_badge_class} px-3 py-2 rounded-pill">${item.status}</span></td>
              <td>${item.progress_bar_display}</td>
              <td>${item.time_spent_display}</td>
              <td>${item.revisit_display}</td>
            </tr>
          `;
        });

        tbody.innerHTML = html;

        if (!query && typeof setupTablePagination === 'function') {
          const table = document.querySelector('#tracker-table');
          const savedPage = table ? table._currentPage : 1;
          setupTablePagination('#tracker-table', '#tracker-pagination-wrap', '#tracker-page-info', '#tracker-pagination-nav', 5, savedPage, false);
        }
      }
    } catch (e) {
      // Ignore background fetch error
    }
  }

  setInterval(pollTracker, 5000);

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      pollTracker();
    }
  });
}

// ══════════════════════════════════════════════════════════════════════
// Shared Struggling Students Modal (for Dashboard and Analytics)
// ══════════════════════════════════════════════════════════════════════
function initSharedStrugglingStudentsModal() {
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
    } else if (window.bootstrap && window.bootstrap.Modal) {
      const bsModal = new bootstrap.Modal(modalEl);
      bsModal.show();
    }
  });
}

function setupTeacherPortal() {
  initTeacherNavigation();
  initTeacherSlidingIndicator();
  initAlertAutoDismiss();
  initDashboardSkeleton();
  initLiveStopwatchTicker();
  initLiveTrackerSync();
  initSharedStrugglingStudentsModal();
  window.addEventListener('hashchange', initHashTabSwitching);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTeacherPortal);
} else {
  setupTeacherPortal();
}

// ══════════════════════════════════════════════════════════════════════
// Tablet Touch & Kiosk Mode: Lock Context Menus, Copy/Paste Popups & Text Selection
// ══════════════════════════════════════════════════════════════════════
(function () {
  function isEditableElement(el) {
    if (!el) return false;
    const tag = (el.tagName || '').toUpperCase();
    if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
    if (el.isContentEditable) return true;
    return false;
  }

  document.addEventListener('contextmenu', function (e) {
    if (isEditableElement(e.target)) return;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('selectstart', function (e) {
    if (isEditableElement(e.target)) return;
    e.preventDefault();
  }, { passive: false });

  document.addEventListener('copy', function (e) {
    if (isEditableElement(e.target)) return;
    e.preventDefault();
  });
})();

