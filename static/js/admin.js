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
