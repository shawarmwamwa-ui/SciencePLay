function togglePassword(event, inputId, toggleButton) {
  if (event) event.preventDefault();
  const field = document.getElementById(inputId);
  if (!field) return;

  const icon = toggleButton.querySelector('i');
  const isPassword = field.type === 'password';
  field.type = isPassword ? 'text' : 'password';

  if (icon) {
    if (isPassword) {
      icon.className = 'bi bi-eye-slash-fill fs-5';
    } else {
      icon.className = 'bi bi-eye-fill fs-5';
    }
  }
}

function initLoginMusic() {
  const audio = document.getElementById('login-audio');
  if (!audio) {
    return;
  }

  audio.volume = 0.35;

  const startAudio = () => audio.play().catch(() => {});

  startAudio();

  if (audio.paused) {
    const resumeAudio = () => {
      startAudio();
      if (!audio.paused) {
        document.removeEventListener('pointerdown', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
      }
    };

    document.addEventListener('pointerdown', resumeAudio, { once: true });
    document.addEventListener('keydown', resumeAudio, { once: true });
    document.addEventListener('touchstart', resumeAudio, { once: true });
  }
}

function initAuthToasts() {
  const toasts = document.querySelectorAll('.login-toast, .alert, .alerts-container .alert');
  if (!toasts.length) {
    return;
  }

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

window.initLoginMusic = initLoginMusic;
window.initAuthToasts = initAuthToasts;
window.togglePassword = togglePassword;

document.addEventListener('DOMContentLoaded', initAuthToasts);
