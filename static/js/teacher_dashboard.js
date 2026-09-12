/**
 * Teacher Dashboard Charts & Progression Logic
 * SciencePlay Teacher Portal
 */

document.addEventListener('DOMContentLoaded', function () {
  // -------------------------------------------------------------
  // 1. Retry Progression Curve Logic
  // -------------------------------------------------------------
  const retryDataElem = document.getElementById('retryProgressionData');
  if (retryDataElem) {
    let retryData = [];
    try {
      retryData = JSON.parse(retryDataElem.textContent);
    } catch (e) {
      console.error('Error parsing retryProgressionData:', e);
    }

    const selectElem = document.getElementById('retryProgressionSelect');
    const canvasElem = document.getElementById('retryImprovementChart');

    if (canvasElem && retryData && retryData.length) {
      const chipFirst = document.getElementById('chip-first-score');
      const chipBest = document.getElementById('chip-best-score');
      const chipLatest = document.getElementById('chip-latest-score');
      const chipImprovement = document.getElementById('chip-improvement');
      const badgesContainer = document.getElementById('retryAttemptBadges');

      let chartInstance = null;

      function updateDashboardAttemptChart(itemIndex) {
        const item = retryData[itemIndex];
        if (!item) return;

        // Update Chips
        if (chipFirst) chipFirst.textContent = `${item.first_score} pts`;
        if (chipBest) chipBest.textContent = `${item.best_score} pts`;
        if (chipLatest) chipLatest.textContent = `${item.latest_score} pts`;

        if (chipImprovement) {
          if (item.attempt_count === 1) {
            chipImprovement.className = 'fw-bold fs-6 text-primary';
            chipImprovement.innerHTML = `<i class="bi bi-flag-fill me-1"></i>1st Try (Baseline)`;
          } else if (item.improvement > 0) {
            chipImprovement.className = 'fw-bold fs-6 text-success';
            chipImprovement.innerHTML = `<i class="bi bi-arrow-up-right me-1"></i>+${item.improvement} pts`;
          } else if (item.improvement < 0) {
            chipImprovement.className = 'fw-bold fs-6 text-danger';
            chipImprovement.innerHTML = `<i class="bi bi-arrow-down-right me-1"></i>${item.improvement} pts`;
          } else {
            chipImprovement.className = 'fw-bold fs-6 text-muted';
            chipImprovement.innerHTML = `<i class="bi bi-dash me-1"></i>No change`;
          }
        }

        // Update Badges
        if (badgesContainer) {
          badgesContainer.innerHTML = '<span class="small text-muted me-2 fw-semibold"><i class="bi bi-list-ol me-1"></i>Attempt Breakdown:</span>';
          item.attempts.forEach((att, idx) => {
            const badge = document.createElement('span');
            badge.className = `badge rounded-pill px-2 py-1 small me-1 ${idx === 0 ? 'bg-secondary' : (att.score >= item.best_score ? 'bg-success' : 'bg-light text-dark border')}`;
            const dateBadge = att.date ? ` <span style="font-size:0.75rem; color: #f8fafc; font-weight: 500;">(${att.date})</span>` : '';
            badge.title = `Attempt #${att.num}${att.date ? ' on ' + att.date : ''}: ${att.score} pts (${att.time}s)`;
            badge.innerHTML = `#${att.num}: <strong>${att.score} pts</strong>${dateBadge}`;
            badgesContainer.appendChild(badge);
          });
        }

        // Prepare Chart Data
        const labels = item.attempts.map(a => `Attempt #${a.num}`);
        const scores = item.attempts.map(a => a.score);
        const times = item.attempts.map(a => a.time);

        const ctx = canvasElem.getContext('2d');
        const gradient = ctx.createLinearGradient(0, 0, 0, 260);
        gradient.addColorStop(0, 'rgba(16, 185, 129, 0.28)');
        gradient.addColorStop(1, 'rgba(16, 185, 129, 0.01)');

        if (chartInstance) {
          chartInstance.data.labels = labels;
          chartInstance.data.datasets[0].data = scores;
          chartInstance.data.datasets[0].timeData = times;
          chartInstance.data.datasets[0].label = `${item.student_name} - ${item.activity_name}`;
          chartInstance.update();
        } else {
          chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: `${item.student_name} - ${item.activity_name}`,
                data: scores,
                timeData: times,
                borderColor: '#10b981',
                backgroundColor: gradient,
                borderWidth: 3,
                fill: true,
                tension: 0.35,
                pointBackgroundColor: '#ffffff',
                pointBorderColor: '#10b981',
                pointBorderWidth: 3,
                pointRadius: 6,
                pointHoverRadius: 9,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#ffffff',
                pointHoverBorderWidth: 3
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              interaction: {
                mode: 'index',
                intersect: false
              },
              plugins: {
                legend: {
                  display: false
                },
                tooltip: {
                  backgroundColor: '#1f2937',
                  titleFont: { family: 'Plus Jakarta Sans', size: 13, weight: 'bold' },
                  bodyFont: { family: 'Plus Jakarta Sans', size: 12 },
                  padding: 12,
                  cornerRadius: 8,
                  callbacks: {
                    title: function (tooltipItems) {
                      const idx = tooltipItems[0].dataIndex;
                      const att = item.attempts[idx];
                      const d = att.date_full || att.date;
                      return `Attempt #${att.num}${d ? ' (' + d + ')' : ''}`;
                    },
                    label: function (context) {
                      const score = context.parsed.y;
                      const time = context.dataset.timeData ? context.dataset.timeData[context.dataIndex] : 0;
                      return [`Score: ${score} pts`, `Time: ${time}s`];
                    }
                  }
                }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: {
                    color: 'rgba(0, 0, 0, 0.06)',
                    drawBorder: false
                  },
                  ticks: {
                    font: { family: 'Plus Jakarta Sans', size: 11 },
                    color: '#6b7280',
                    callback: function (val) {
                      return val + ' pts';
                    }
                  }
                },
                x: {
                  grid: {
                    display: false
                  },
                  ticks: {
                    font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
                    color: '#374151'
                  }
                }
              }
            }
          });
        }
      }

      // Initialize with first item after layout settles
      requestAnimationFrame(function () {
        updateDashboardAttemptChart(0);
      });

      if (selectElem) {
        selectElem.addEventListener('change', function () {
          updateDashboardAttemptChart(parseInt(this.value, 10));
        });
      }

      setTimeout(() => {
        if (chartInstance) {
          chartInstance.resize();
        }
      }, 750);
    }
  }

  // -------------------------------------------------------------
  // 2. Visual Classroom Analytics Charts (Mastery & Engagement)
  // -------------------------------------------------------------
  const chartsDataElem = document.getElementById('dashboardChartsData');
  if (chartsDataElem) {
    let chartsData = null;
    try {
      chartsData = JSON.parse(chartsDataElem.textContent);
    } catch (e) {
      console.error('Error parsing dashboardChartsData:', e);
    }

    if (chartsData) {
      // Chart 1: Lesson Mastery Chart
      const lessonCanvas = document.getElementById('lessonMasteryChart');
      if (lessonCanvas && chartsData.lesson_labels && chartsData.lesson_labels.length) {
        new Chart(lessonCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: chartsData.lesson_labels.map(l => l.length > 20 ? l.substring(0, 18) + '…' : l),
            datasets: [
              {
                label: 'Completion (%)',
                data: chartsData.lesson_completion_rates,
                backgroundColor: 'rgba(16, 185, 129, 0.8)',
                borderColor: '#10b981',
                borderWidth: 1.5,
                borderRadius: 5
              },
              {
                label: 'Activity Avg (%)',
                data: chartsData.lesson_avg_scores,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 1.5,
                borderRadius: 5
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
              },
              tooltip: {
                backgroundColor: '#1f2937',
                titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
                bodyFont: { family: 'Plus Jakarta Sans', size: 11 }
              }
            },
            scales: {
              y: {
                beginAtZero: true,
                max: 100,
                ticks: {
                  callback: function(v) { return v + '%'; },
                  font: { family: 'Plus Jakarta Sans', size: 10 }
                }
              },
              x: {
                ticks: {
                  font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
                }
              }
            }
          }
        });
      }

      // Chart 2: Activity Engagement Chart
      const actCanvas = document.getElementById('activityEngagementChart');
      if (actCanvas && chartsData.act_labels && chartsData.act_labels.length) {
        new Chart(actCanvas.getContext('2d'), {
          type: 'bar',
          data: {
            labels: chartsData.act_labels,
            datasets: [
              {
                label: 'Total Plays',
                data: chartsData.act_attempts_count,
                backgroundColor: 'rgba(139, 92, 246, 0.8)',
                borderColor: '#8b5cf6',
                borderWidth: 1.5,
                borderRadius: 5,
                yAxisID: 'y'
              },
              {
                label: 'Avg Score',
                data: chartsData.act_avg_scores,
                backgroundColor: 'rgba(249, 115, 22, 0.85)',
                borderColor: '#ea580c',
                borderWidth: 1.5,
                borderRadius: 5,
                yAxisID: 'y1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'top',
                labels: { font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' } }
              },
              tooltip: {
                backgroundColor: '#1f2937',
                titleFont: { family: 'Plus Jakarta Sans', size: 12, weight: 'bold' },
                bodyFont: { family: 'Plus Jakarta Sans', size: 11 }
              }
            },
            scales: {
              y: {
                type: 'linear',
                position: 'left',
                beginAtZero: true,
                ticks: {
                  precision: 0,
                  callback: function(v) { return v + ' plays'; },
                  font: { family: 'Plus Jakarta Sans', size: 10 }
                }
              },
              y1: {
                type: 'linear',
                position: 'right',
                beginAtZero: true,
                grid: { drawOnChartArea: false },
                ticks: {
                  callback: function(v) { return v + ' pts'; },
                  font: { family: 'Plus Jakarta Sans', size: 10 }
                }
              },
              x: {
                ticks: {
                  font: { family: 'Plus Jakarta Sans', size: 10, weight: '600' }
                }
              }
            }
          }
        });
      }
    }
  }
});
