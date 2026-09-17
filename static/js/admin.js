function togglePassword(button) {
  const wrapper = button.closest('.password-toggle-wrapper');
  const field = wrapper.querySelector('input');
  const icon = button.querySelector('i');

  if (field.type === 'password') {
    field.type = 'text';
    icon.classList.remove('bi-eye');
    icon.classList.add('bi-eye-slash');
  } else {
    field.type = 'password';
    icon.classList.remove('bi-eye-slash');
    icon.classList.add('bi-eye');
  }
}

function updateAdminNavState() {
  const navLinks = document.querySelectorAll('.admin-sidebar .menu-link[data-nav]');
  if (!navLinks.length) return;

  navLinks.forEach((link) => link.classList.remove('active'));

  const currentPath = window.location.pathname.replace(/\/+$/, '');
  const currentHash = window.location.hash;
  const urlParams = new URLSearchParams(window.location.search);
  const currentSection = urlParams.get('section');

  if (currentPath.includes('/admin/compliance')) {
    const complianceLink = document.querySelector('.admin-sidebar .menu-link[data-nav="compliance"]');
    if (complianceLink) complianceLink.classList.add('active');
    return;
  }

  if (currentPath.includes('/admin/users') || currentHash === '#user-management' || currentSection === 'user-management') {
    const userManagementLink = document.querySelector('.admin-sidebar .menu-link[data-nav="user-management"]');
    if (userManagementLink) userManagementLink.classList.add('active');
    return;
  }

  const dashboardLink = document.querySelector('.admin-sidebar .menu-link[data-nav="dashboard"]');
  if (dashboardLink) dashboardLink.classList.add('active');
}

function normalizeAdminPageScroll() {
  const currentPath = window.location.pathname;
  const urlParams = new URLSearchParams(window.location.search);
  const currentSection = urlParams.get('section');

  if (currentPath.includes('/admin/compliance')) {
    window.scrollTo({ top: 0, behavior: 'auto' });
    return;
  }

  if (currentPath.includes('/admin/dashboard') && currentSection === 'user-management') {
    const section = document.getElementById('user-management');
    if (!section) return;

    section.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

function initAdminToasts() {
  const toasts = document.querySelectorAll('.admin-toast, .alert, .alerts-container .alert');
  if (!toasts.length) return;

  toasts.forEach((toast) => {
    window.setTimeout(() => {
      if (window.bootstrap && window.bootstrap.Alert) {
        try {
          const alertInstance = window.bootstrap.Alert.getOrCreateInstance(toast);
          alertInstance.close();
          return;
        } catch (e) {}
      }
      toast.classList.remove('show');
      toast.classList.add('fade');
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 500);
    }, 5000);
  });
}

function initAdminDashboardSkeleton() {
  document.body.classList.add('dashboard-loaded');
}

function initActionSummaryFilters() {
  const pills = document.querySelectorAll('.event-type-filter-pill');
  if (!pills.length) return;

  pills.forEach((pill) => {
    pill.addEventListener('click', (e) => {
      e.preventDefault();
      const userId = pill.getAttribute('data-user-id');
      const targetEventType = pill.getAttribute('data-event-type');
      const card = pill.closest('.compiled-user-card');
      if (!card) return;

      const allPills = card.querySelectorAll('.event-type-filter-pill');
      const collapseEl = document.getElementById(`userLogs${userId}`);
      const table = card.querySelector(`.user-logs-table[data-user-id="${userId}"]`);
      const statusBadge = card.querySelector('.user-logs-status-badge');
      if (!table) return;

      const isCurrentlyActive = pill.classList.contains('active');

      // Determine active event type (if clicking already-active filter, toggle back to 'all')
      let activeType = targetEventType;
      if (isCurrentlyActive && targetEventType !== 'all') {
        activeType = 'all';
      }

      // Update active state visual style across pills in this user card
      allPills.forEach((p) => {
        const pType = p.getAttribute('data-event-type');
        if (pType === activeType) {
          p.classList.add('active');
          p.setAttribute('aria-pressed', 'true');
        } else {
          p.classList.remove('active');
          p.setAttribute('aria-pressed', 'false');
        }
      });

      // Filter rows in this user's Action History table
      const rows = table.querySelectorAll('tbody tr:not(.no-matching-logs-row)');
      let matchingCount = 0;

      rows.forEach((row) => {
        const rowEventType = row.getAttribute('data-event-type');
        if (activeType === 'all' || rowEventType === activeType) {
          row.style.display = '';
          matchingCount++;
        } else {
          row.style.display = 'none';
        }
      });

      // Empty state row if no records match
      let emptyRow = table.querySelector('.no-matching-logs-row');
      if (matchingCount === 0) {
        if (!emptyRow) {
          emptyRow = document.createElement('tr');
          emptyRow.className = 'no-matching-logs-row';
          emptyRow.innerHTML = `<td colspan="3" class="text-center text-muted py-4"><i class="bi bi-funnel me-1"></i>No logs found for action: <strong>${activeType}</strong></td>`;
          const tbody = table.querySelector('tbody');
          if (tbody) tbody.appendChild(emptyRow);
        }
        emptyRow.style.display = '';
      } else if (emptyRow) {
        emptyRow.style.display = 'none';
      }

      // Update badge label in collapsible header
      if (statusBadge) {
        if (activeType === 'all') {
          statusBadge.textContent = `Showing all ${matchingCount} logs`;
          statusBadge.className = 'badge bg-secondary user-logs-status-badge';
        } else {
          statusBadge.textContent = `Filtered: ${matchingCount} '${activeType}' logs`;
          statusBadge.className = 'badge bg-primary user-logs-status-badge';
        }
      }

      // Automatically open the Action History accordion/collapse if closed
      if (collapseEl && window.bootstrap && window.bootstrap.Collapse) {
        const bsCollapse = window.bootstrap.Collapse.getOrCreateInstance(collapseEl, { toggle: false });
        bsCollapse.show();
      }
    });
  });
}

function initAdminSlidingIndicator() {
  const menuGroup = document.querySelector('.admin-sidebar .menu-group');
  if (!menuGroup) return;

  const links = Array.from(menuGroup.querySelectorAll('.menu-link'));
  if (!links.length) return;

  let indicator = menuGroup.querySelector('.menu-indicator');
  if (!indicator) {
    indicator = document.createElement('div');
    indicator.className = 'menu-indicator';
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

  const activeLink = menuGroup.querySelector('.menu-link.active') || links[0];
  const activeIndex = links.indexOf(activeLink);

  // Cross-page sliding continuity: smoothly glide from previous button position
  const prevOffsetRaw = sessionStorage.getItem('admin_active_offset');
  const prevIndexRaw = sessionStorage.getItem('admin_active_index');

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

  // Update session storage for next navigation
  sessionStorage.setItem('admin_active_offset', getTargetOffset(activeLink).top);
  sessionStorage.setItem('admin_active_index', activeIndex);

  // Only glide when clicking a different navigation item!
  links.forEach((link, idx) => {
    link.addEventListener('click', () => {
      const currentOffset = getTargetOffset(link);
      sessionStorage.setItem('admin_active_offset', currentOffset.top);
      sessionStorage.setItem('admin_active_index', idx);
      links.forEach(l => l.classList.remove('active'));
      link.classList.add('active');
      moveIndicator(link, true);
    });
  });

  window.addEventListener('resize', () => {
    const currentActive = menuGroup.querySelector('.menu-link.active') || links[0];
    moveIndicator(currentActive, false);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboardSkeleton();
  initAdminToasts();
  normalizeAdminPageScroll();
  updateAdminNavState();
  initActionSummaryFilters();
  initAdminSlidingIndicator();

  const navLinks = document.querySelectorAll('.admin-sidebar .menu-link[data-nav]');
  navLinks.forEach((link) => {
    link.addEventListener('click', () => {
      if (link.getAttribute('href') === '#user-management') {
        navLinks.forEach((item) => item.classList.remove('active'));
        link.classList.add('active');
      }
    });
  });

  window.addEventListener('hashchange', updateAdminNavState);
});
