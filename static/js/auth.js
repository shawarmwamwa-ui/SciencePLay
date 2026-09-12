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

function initInputAutoScroll() {
  const inputs = document.querySelectorAll('.login-page input');
  inputs.forEach(input => {
    input.addEventListener('focus', () => {
      // Delay slightly for virtual keyboard animation
      setTimeout(() => {
        input.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 350);
    });
  });
}

function initInputElevate() {
  const usernameInput = document.getElementById('username');
  const passwordInput = document.getElementById('password');
  const body = document.body;

  if (usernameInput) {
    usernameInput.addEventListener('focus', () => {
      body.classList.remove('password-focused');
      body.classList.add('username-focused');
    });
    usernameInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (!document.activeElement || (document.activeElement.id !== 'username' && document.activeElement.id !== 'password')) {
          body.classList.remove('username-focused');
        }
      }, 150);
    });
  }

  if (passwordInput) {
    passwordInput.addEventListener('focus', () => {
      body.classList.remove('username-focused');
      body.classList.add('password-focused');
    });
    passwordInput.addEventListener('blur', () => {
      setTimeout(() => {
        if (!document.activeElement || (document.activeElement.id !== 'username' && document.activeElement.id !== 'password')) {
          body.classList.remove('password-focused');
        }
      }, 150);
    });
  }
}

window.initLoginMusic = initLoginMusic;
window.initAuthToasts = initAuthToasts;
window.togglePassword = togglePassword;
window.initInputAutoScroll = initInputAutoScroll;
window.initInputElevate = initInputElevate;

document.addEventListener('DOMContentLoaded', () => {
  initAuthToasts();
  initInputAutoScroll();
  initInputElevate();
});
