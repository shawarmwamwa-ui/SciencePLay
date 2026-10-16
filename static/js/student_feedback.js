function toggleOlder(groupIndex, btn) {
  const container = document.getElementById(`older-attempts-${groupIndex}`);
  if (!container) return;

  const isExpanded = container.classList.contains('expanded');
  if (isExpanded) {
    container.classList.remove('expanded');
    btn.innerHTML = `<i class="bi bi-chevron-down me-1"></i><span>Show older attempts</span>`;
  } else {
    container.classList.add('expanded');
    btn.innerHTML = `<i class="bi bi-chevron-up me-1"></i><span>Hide older attempts</span>`;
  }
}

window.toggleOlder = toggleOlder;

document.addEventListener('DOMContentLoaded', () => {
  const filterBtns = document.querySelectorAll('.filter-pill-btn');
  const entries = document.querySelectorAll('.feedback-entry');
  const groups = document.querySelectorAll('.activity-group-block');

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const filter = btn.getAttribute('data-filter');

      groups.forEach(group => {
        let visibleInGroup = 0;
        const groupEntries = group.querySelectorAll('.feedback-entry');

        groupEntries.forEach(entry => {
          const hasTeacher = entry.getAttribute('data-has-teacher') === 'true';
          const hasSystem = entry.getAttribute('data-has-system') === 'true';

          let show = true;
          if (filter === 'teacher') show = hasTeacher;
          if (filter === 'system') show = hasSystem;

          entry.style.display = show ? 'block' : 'none';
          if (show) visibleInGroup += 1;
        });

        group.style.display = (visibleInGroup > 0) ? 'block' : 'none';
      });
    });
  });
});
