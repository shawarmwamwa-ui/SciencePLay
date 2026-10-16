function initAdminUserModals() {
  const config = window.ADMIN_USER_CONFIG;
  if (!config || !config.editErrorUserId) return;
  const targetModal = document.getElementById('updateUser' + config.editErrorUserId);
  if (targetModal && window.bootstrap && window.bootstrap.Modal) {
    const errorAlert = targetModal.querySelector('.update-user-error-alert');
    const errorText = targetModal.querySelector('.update-user-error-text');
    if (errorAlert && errorText) {
      errorText.textContent = config.editError || 'Invalid input';
      errorAlert.classList.remove('d-none');
    }
    const pwd = targetModal.querySelector('input[name="password"]');
    if (pwd) pwd.classList.add('is-invalid');
    const m = bootstrap.Modal.getOrCreateInstance(targetModal);
    m.show();
  }
}

document.addEventListener('DOMContentLoaded', initAdminUserModals);
