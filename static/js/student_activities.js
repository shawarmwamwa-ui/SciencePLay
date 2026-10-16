function showLockedActivityNotice() {
  const notice = document.querySelector('#locked-notice');
  if (!notice) return;
  notice.textContent = 'Complete the lesson first to unlock this activity!';
  notice.classList.remove('d-none');
  setTimeout(() => notice.classList.add('d-none'), 2800);
}

window.showLockedActivityNotice = showLockedActivityNotice;

document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.locked-activity-trigger').forEach(button => {
    button.addEventListener('click', showLockedActivityNotice);
  });
});
