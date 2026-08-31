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
  const skeleton = document.querySelector('.dashboard-skeleton-wrap');
  const realContent = document.querySelector('.dashboard-real-content');
  if (!skeleton || !realContent) return;

  setTimeout(() => {
    document.body.classList.add('dashboard-loaded');
  }, 650);
}

document.addEventListener('DOMContentLoaded', () => {
  initAdminDashboardSkeleton();
  initAdminToasts();
  normalizeAdminPageScroll();
  updateAdminNavState();

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
