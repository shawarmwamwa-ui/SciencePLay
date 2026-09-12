// bgmPlayer.js
// Handles permanent ambient background music playback with autoplay fallback and lifecycle management.

export function initBgmPlayer(audioElementId, options = {}) {
  const audio = document.getElementById(audioElementId);
  if (!audio) return;

  const defaultVolume = options.volume ?? 0.22;
  const storageKey = options.storageKey ?? 'scienceplay_bgm_muted';

  // Ensure music is permanently active
  localStorage.removeItem(storageKey);
  audio.volume = defaultVolume;
  audio.muted = false;

  const startAudio = () => {
    audio.volume = defaultVolume;
    audio.play().catch(() => {});
  };

  // Attempt initial playback
  startAudio();

  // If autoplay is blocked by browser policy, start immediately on first user interaction
  if (audio.paused) {
    const resumeAudio = () => {
      startAudio();
      if (!audio.paused) {
        document.removeEventListener('pointerdown', resumeAudio);
        document.removeEventListener('keydown', resumeAudio);
        document.removeEventListener('touchstart', resumeAudio);
        document.removeEventListener('click', resumeAudio);
      }
    };

    document.addEventListener('pointerdown', resumeAudio, { once: true });
    document.addEventListener('keydown', resumeAudio, { once: true });
    document.addEventListener('touchstart', resumeAudio, { once: true });
    document.addEventListener('click', resumeAudio, { once: true });
  }

  // Remove any legacy toggle button if it exists in DOM
  const existingBtn = document.getElementById('bgm-toggle-btn');
  if (existingBtn) {
    existingBtn.remove();
  }

  // Ensure audio is silenced when user navigates back, leaves page, or minimizes WebView
  window.addEventListener('pagehide', () => {
    audio.pause();
    document.querySelectorAll('audio, video').forEach(m => m.pause());
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  });

  window.addEventListener('beforeunload', () => {
    audio.pause();
    document.querySelectorAll('audio, video').forEach(m => m.pause());
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      audio.pause();
      document.querySelectorAll('audio, video').forEach(m => m.pause());
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    } else if (document.visibilityState === 'visible') {
      audio.play().catch(() => {});
    }
  });
}
