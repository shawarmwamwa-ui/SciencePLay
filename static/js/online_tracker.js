/**
 * Online User Tracker & Heartbeat
 * SciencePlay - Real-Time User Status
 */

(function () {
  'use strict';

  const HEARTBEAT_INTERVAL_MS = 10000; // 10 seconds heartbeat ping
  const REFRESH_INTERVAL_MS = 4000;   // 4 seconds live refresh on dashboards

  // Send periodic heartbeat ping
  function sendHeartbeat() {
    fetch('/api/heartbeat', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    }).catch(function (err) {
      console.warn('Heartbeat ping failed:', err);
    });
  }

  // Fetch online users list and update UI
  function refreshOnlineUsers() {
    fetch('/api/online_users')
      .then(function (response) {
        if (!response.ok) return null;
        return response.json();
      })
      .then(function (data) {
        if (!data || data.status !== 'ok') return;
        updateOnlineUI(data.online_users, data.count);
      })
      .catch(function (err) {
        console.warn('Failed to fetch online users:', err);
      });
  }

  function updateOnlineUI(users, count) {
    // Update count badges
    const countBadges = document.querySelectorAll('.online-count-badge');
    countBadges.forEach(function (badge) {
      if (badge.tagName === 'SPAN' && badge.classList.contains('rounded-pill')) {
        badge.textContent = count + ' Online';
      } else {
        badge.textContent = count;
      }
    });

    // Update list container if present
    const container = document.querySelector('.online-users-container');
    if (!container) return;

    if (!users || users.length === 0) {
      container.innerHTML = `
        <div class="text-center text-muted py-4">
          <i class="bi bi-person-x fs-3 d-block mb-1 opacity-50"></i>
          <span class="small">No users currently online</span>
        </div>
      `;
      return;
    }

    let html = '<div class="list-group list-group-flush">';
    users.forEach(function (u) {
      const roleBadgeClass = u.role === 'teacher' ? 'bg-info text-dark' : 'bg-primary';
      const roleIcon = u.role === 'teacher' ? 'bi-person-workspace' : 'bi-mortarboard';

      html += `
        <div class="list-group-item d-flex align-items-center justify-content-between px-3 py-2 border-0 mb-1 rounded bg-light-subtle">
          <div class="d-flex align-items-center gap-2">
            <span class="position-relative d-inline-block">
              <i class="bi ${roleIcon} fs-5 text-secondary"></i>
              <span class="position-absolute bottom-0 end-0 p-1 bg-success border border-light rounded-circle" style="transform: translate(25%, 25%);"></span>
            </span>
            <div>
              <div class="fw-semibold text-dark text-truncate" style="max-width: 180px;">${escapeHtml(u.name)}</div>
              <small class="text-muted">@${escapeHtml(u.username)}</small>
            </div>
          </div>
          <span class="badge ${roleBadgeClass} text-capitalize">${escapeHtml(u.role)}</span>
        </div>
      `;
    });
    html += '</div>';

    container.innerHTML = html;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function initAutoDismissAlerts() {
    const alerts = document.querySelectorAll('.alert, .alerts-container .alert, .brutal-alert, .admin-toast');
    if (!alerts.length) return;
    alerts.forEach(function (alert) {
      setTimeout(function () {
        if (window.bootstrap && window.bootstrap.Alert) {
          try {
            const instance = window.bootstrap.Alert.getOrCreateInstance(alert);
            instance.close();
            return;
          } catch (e) {}
        }
        alert.classList.remove('show');
        alert.classList.add('fade');
        setTimeout(function () {
          if (alert.parentNode) {
            alert.remove();
          }
        }, 500);
      }, 5000);
    });
  }

  // Initialize
  document.addEventListener('DOMContentLoaded', function () {
    // Universal 5-second alert auto-dismissal
    initAutoDismissAlerts();

    // Delay initial heartbeat and online user polling slightly (1.5s)
    // so critical rendering and LCP paint complete without network contention
    setTimeout(function () {
      sendHeartbeat();

      // If page has online users container or count badge, fetch initial data and poll
      if (document.querySelector('.online-users-container') || document.querySelector('.online-count-badge')) {
        refreshOnlineUsers();
        setInterval(refreshOnlineUsers, REFRESH_INTERVAL_MS);
      }

      // Schedule periodic heartbeat
      setInterval(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
    }, 1500);

    // Immediate ping on tab focus/visibility change (important for mobile/tablet devices)
    document.addEventListener('visibilitychange', function () {
      if (document.visibilityState === 'visible') {
        sendHeartbeat();
        if (document.querySelector('.online-users-container') || document.querySelector('.online-count-badge')) {
          refreshOnlineUsers();
        }
      }
    });

    window.addEventListener('focus', function () {
      sendHeartbeat();
      if (document.querySelector('.online-users-container') || document.querySelector('.online-count-badge')) {
        refreshOnlineUsers();
      }
    });
  });
})();
