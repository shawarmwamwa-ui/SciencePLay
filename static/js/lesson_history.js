/**
 * Student Lesson History & Revisit Telemetry Logic
 * SciencePlay Teacher Portal
 */

(function () {
  const container = document.getElementById('lesson-history-container') || document.body;
  const apiUrl = container.getAttribute('data-history-api-url');
  if (!apiUrl) return;

  function renderAttempts(attempts) {
    const tbody = document.getElementById('attempts-table-body');
    if (!tbody) return;

    if (!attempts || attempts.length === 0) {
      tbody.innerHTML = `
        <tr>
          <td colspan="5" class="text-center text-muted py-5">
            <i class="bi bi-info-circle fs-3 d-block mb-2 text-secondary"></i>
            No visit attempts recorded for this student yet.
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    attempts.forEach(att => {
      const badgeHtml = att.is_first
        ? `<span class="visit-first-badge d-inline-flex align-items-center gap-1"><i class="bi bi-flag-fill text-primary"></i> First Visit (Initial)</span>`
        : `<span class="visit-revisit-badge d-inline-flex align-items-center gap-1"><i class="bi bi-arrow-repeat text-success"></i> Revisit #${att.attempt_number - 1}</span>`;

      const statusHtml = att.completed
        ? `<span class="badge bg-success-subtle text-success border border-success-subtle px-3 py-2 rounded-pill fw-bold"><i class="bi bi-check-circle-fill me-1"></i>Completed</span>`
        : `<span class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-3 py-2 rounded-pill fw-bold"><i class="bi bi-hourglass-split me-1"></i>In Progress</span>`;

      html += `
        <tr>
          <td class="ps-4">${badgeHtml}</td>
          <td>${statusHtml}</td>
          <td>
            <div class="d-flex align-items-center gap-2" style="min-width: 130px;" title="Slide ${att.current_slide} of ${att.total_slides} (${att.progress_percent}%)">
              <div class="progress flex-grow-1" style="height: 8px; border-radius: 6px; background-color: #e2e8f0;">
                <div class="progress-bar ${att.completed ? 'bg-success' : 'bg-primary'}" role="progressbar" style="width: ${att.progress_percent}%; border-radius: 6px;" aria-valuenow="${att.progress_percent}" aria-valuemin="0" aria-valuemax="100"></div>
              </div>
              <span class="fw-bold ${att.completed ? 'text-success' : 'text-primary'} small" style="min-width: 38px;">${att.progress_percent}%</span>
            </div>
          </td>
          <td>
            <strong class="text-primary fs-6">${att.time_spent_formatted}</strong>
          </td>
          <td>
            <small class="text-muted">${att.created_at_formatted || 'N/A'}</small>
          </td>
        </tr>
      `;
    });
    tbody.innerHTML = html;
  }

  function updateKPIs(kpis) {
    if (!kpis) return;
    const elTotal = document.getElementById('kpi-total-visits');
    const elRevisitSub = document.getElementById('kpi-revisit-subtext');
    const elFirstTime = document.getElementById('kpi-first-visit-time');
    const elAvgTime = document.getElementById('kpi-avg-revisit-time');
    const elTotalTime = document.getElementById('kpi-total-overall-time');
    const elCountBadge = document.getElementById('attempts-total-count-badge');

    if (elTotal) elTotal.textContent = kpis.total_attempts;
    if (elRevisitSub) elRevisitSub.textContent = `1 Initial + ${kpis.revisit_count} Revisit${kpis.revisit_count !== 1 ? 's' : ''}`;
    if (elFirstTime) elFirstTime.textContent = kpis.first_visit_time_formatted;
    if (elAvgTime) elAvgTime.textContent = kpis.avg_revisit_time_formatted;
    if (elTotalTime) elTotalTime.textContent = kpis.total_time_formatted;
    if (elCountBadge) elCountBadge.textContent = `${kpis.total_attempts} Total Attempt${kpis.total_attempts !== 1 ? 's' : ''}`;
  }

  async function fetchLiveHistory() {
    try {
      const res = await fetch(apiUrl, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data && data.success) {
        renderAttempts(data.attempts);
        updateKPIs(data.kpis);
      }
    } catch (err) {
      // Silently handle background network fluctuation
    }
  }

  // Live poll every 3.5 seconds
  setInterval(fetchLiveHistory, 3500);

  // Re-fetch immediately whenever teacher tabs back into the window
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      fetchLiveHistory();
    }
  });
})();
