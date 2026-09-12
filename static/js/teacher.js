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
function setupTablePagination(tableSelector, wrapSelector, infoSelector, navSelector, itemsPerPage = 5) {
  const table = document.querySelector(tableSelector);
  const wrap = document.querySelector(wrapSelector);
  const info = document.querySelector(infoSelector);
  const nav = document.querySelector(navSelector);

  if (!table || !nav) return;

  const rows = Array.from(table.querySelectorAll('tbody tr')).filter(r => !r.querySelector('td[colspan]'));
  const totalRows = rows.length;

  if (totalRows === 0) {
    if (wrap) wrap.classList.add('d-none');
    return;
  }

  if (totalRows <= itemsPerPage) {
    if (info) info.textContent = `Showing 1 to ${totalRows} of ${totalRows} entries`;
    if (nav) nav.innerHTML = '';
    if (wrap) wrap.classList.remove('d-none');
    rows.forEach(r => r.style.display = '');
    return;
  }

  if (wrap) wrap.classList.remove('d-none');
  let currentPage = 1;
  const totalPages = Math.ceil(totalRows / itemsPerPage);

  function showPage(page) {
    currentPage = page;
    const start = (page - 1) * itemsPerPage;
    const end = start + itemsPerPage;

    rows.forEach((row, idx) => {
      if (idx >= start && idx < end) {
        row.style.display = '';
        row.classList.remove('table-row-fade');
        void row.offsetWidth; // Trigger reflow for smooth animation
        row.classList.add('table-row-fade');
      } else {
        row.style.display = 'none';
      }
    });

    if (info) {
      info.textContent = `Showing ${Math.min(start + 1, totalRows)} to ${Math.min(end, totalRows)} of ${totalRows} entries`;
    }

    renderControls();
  }

  function renderControls() {
    nav.innerHTML = '';

    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" aria-label="Previous"><i class="bi bi-chevron-left"></i></a>`;
    prevLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage > 1) showPage(currentPage - 1);
    });
    nav.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
      const li = document.createElement('li');
      li.className = `page-item ${i === currentPage ? 'active' : ''}`;
      li.innerHTML = `<a class="page-link" href="#">${i}</a>`;
      li.addEventListener('click', (e) => {
        e.preventDefault();
        showPage(i);
      });
      nav.appendChild(li);
    }

    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" aria-label="Next"><i class="bi bi-chevron-right"></i></a>`;
    nextLi.addEventListener('click', (e) => {
      e.preventDefault();
      if (currentPage < totalPages) showPage(currentPage + 1);
    });
    nav.appendChild(nextLi);
  }

  showPage(1);
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

    target.classList.add('section-anchor-highlight');
    setTimeout(() => target.classList.remove('section-anchor-highlight'), 2500);

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

function setupTeacherPortal() {
  initTeacherNavigation();
  initAlertAutoDismiss();
  initDashboardSkeleton();
  window.addEventListener('hashchange', initHashTabSwitching);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTeacherPortal);
} else {
  setupTeacherPortal();
}
