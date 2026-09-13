/**
 * Teacher Students Roster & Live Tracker Logic
 * SciencePlay Teacher Portal
 */

document.addEventListener('DOMContentLoaded', function () {
  // 1. Setup Pagination for Live Tracker using centralized teacher.js helper
  if (typeof setupTablePagination === 'function') {
    setupTablePagination('#tracker-table', '#tracker-pagination-wrap', '#tracker-page-info', '#tracker-pagination-nav', 5);
  }

  // 2. Roster Search Filtering
  const rosterSearch = document.getElementById('studentRosterSearch');
  if (rosterSearch) {
    rosterSearch.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();
      const rows = document.querySelectorAll('.student-roster-row');
      rows.forEach(row => {
        const name = row.getAttribute('data-name') || '';
        const username = row.getAttribute('data-username') || '';
        row.style.display = (!query || name.includes(query) || username.includes(query)) ? '' : 'none';
      });
    });
  }

  // 3. Live Tracker Search Filtering
  const trackerSearch = document.getElementById('liveTrackerSearch');
  if (trackerSearch) {
    trackerSearch.addEventListener('input', function () {
      const query = this.value.trim().toLowerCase();
      const rows = document.querySelectorAll('.live-tracker-row');
      const paginationWrap = document.getElementById('tracker-pagination-wrap');
      
      if (!query) {
        if (typeof setupTablePagination === 'function') {
          setupTablePagination('#tracker-table', '#tracker-pagination-wrap', '#tracker-page-info', '#tracker-pagination-nav', 5);
        }
        return;
      }

      if (paginationWrap) paginationWrap.style.display = 'none';
      rows.forEach(row => {
        const student = row.getAttribute('data-student') || '';
        const lesson = row.getAttribute('data-lesson') || '';
        row.style.display = (student.includes(query) || lesson.includes(query)) ? '' : 'none';
      });
    });
  }

  // 4. Handle Direct Tab Switching via URL Hash or Query Param (e.g. #live-tracker or ?tab=live-tracker)
  function activateTabFromUrl() {
    const hash = window.location.hash;
    const urlParams = new URLSearchParams(window.location.search);
    const tabParam = urlParams.get('tab');

    let targetTabId = null;
    if (hash === '#live-tracker' || hash === '#pane-live-tracker' || tabParam === 'live-tracker') {
      targetTabId = 'tab-live-tracker';
    } else if (hash === '#roster' || hash === '#pane-roster' || tabParam === 'roster') {
      targetTabId = 'tab-roster';
    }

    if (targetTabId) {
      const tabBtn = document.getElementById(targetTabId);
      if (tabBtn && typeof bootstrap !== 'undefined' && bootstrap.Tab) {
        const bsTab = bootstrap.Tab.getOrCreateInstance(tabBtn);
        bsTab.show();
      }
    }
  }

  activateTabFromUrl();
  window.addEventListener('hashchange', activateTabFromUrl);
});

