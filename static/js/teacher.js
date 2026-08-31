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
    if (currentPath.includes('/teacher/assignments')) {
      return 'assignments';
    }
    if (currentPath.includes('/teacher/analytics') || currentPath.includes('/teacher/student')) {
      return 'analytics';
    }
    if (currentPath.includes('/teacher/feedback')) {
      return 'feedback';
    }
    if (currentPath.includes('/teacher/lessons')) {
      return 'lessons';
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
  if (!skeleton || !realContent) return;

  setTimeout(() => {
    document.body.classList.add('dashboard-loaded');
  }, 650);
}

function setupTeacherPortal() {
  initTeacherNavigation();
  initAlertAutoDismiss();
  initDashboardSkeleton();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', setupTeacherPortal);
} else {
  setupTeacherPortal();
}
