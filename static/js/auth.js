function togglePassword(event, inputId, toggleButton) {
  event.preventDefault();
  const field = document.getElementById(inputId);
  if (!field) return;

  const icon = toggleButton.querySelector('i');
  const isPassword = field.type === 'password';
  field.type = isPassword ? 'text' : 'password';

  if (icon) {
    icon.classList.toggle('bi-eye', !isPassword);
    icon.classList.toggle('bi-eye-slash', isPassword);
  }
}
