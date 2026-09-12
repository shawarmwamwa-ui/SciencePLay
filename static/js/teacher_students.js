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
});
