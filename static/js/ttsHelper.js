/**
 * ttsHelper.js
 * Shared Text-to-Speech utility for SciencePlay.
 *
 * Selects a friendly female English voice when available, with full fallback.
 * Pitch and rate are tuned for Grade 3 learners.
 *
 * Usage:
 *   import { speakText } from './ttsHelper.js';
 *   speakText("Hello, scientist!");
 */

// ---------------------------------------------------------------------------
// Priority list — checked in order against each voice's .name (case-insensitive)
// Common female voices across Chrome on Windows, macOS, Android, and ChromeOS
// ---------------------------------------------------------------------------
const FEMALE_VOICE_KEYWORDS = [
  'zira',        // Microsoft Zira — Windows (very common in school labs)
  'samantha',    // macOS / iOS
  'victoria',    // macOS
  'karen',       // macOS / iOS Australian
  'moira',       // macOS Irish
  'tessa',       // macOS South African
  'fiona',       // macOS
  'allison',     // macOS
  'ava',         // macOS
  'susan',       // some Windows / Edge builds
  'female',      // generic flag used by some browser synth engines
  'google us english',   // Chrome's built-in high-quality voice (neutral/female-leaning)
  'google uk english female',
  'en-us',       // last-resort: any en-US voice is usually gender-neutral but clear
];

let _cachedVoice = null;  // resolved once, reused for every call

/**
 * Resolve and cache the preferred voice.
 * Must be called after voices have loaded (inside voiceschanged or a timeout).
 */
function resolveVoice() {
  const voices = window.speechSynthesis.getVoices();

  // --- Debug: log all available voices so the teacher can inspect them ---
  console.group('[SciencePlay TTS] Available voices on this device:');
  voices.forEach((v, i) => {
    console.log(`  [${i}] "${v.name}" | lang: ${v.lang} | local: ${v.localService} | default: ${v.default}`);
  });
  console.groupEnd();

  if (!voices.length) return null;

  const englishVoices = voices.filter(v => v.lang.startsWith('en'));

  // Walk the priority list and return the first match
  for (const keyword of FEMALE_VOICE_KEYWORDS) {
    const match = englishVoices.find(v => v.name.toLowerCase().includes(keyword));
    if (match) {
      console.log(`[SciencePlay TTS] Selected voice: "${match.name}" (matched keyword: "${keyword}")`);
      return match;
    }
  }

  // Fallback: first English voice available
  if (englishVoices.length) {
    console.log(`[SciencePlay TTS] No preferred voice found — falling back to: "${englishVoices[0].name}"`);
    return englishVoices[0];
  }

  // Last resort: browser default (non-English system)
  console.log('[SciencePlay TTS] No English voice found — using browser default.');
  return null;
}

/**
 * Speak a string of text using the system default voice settings.
 * Optimized for cross-device tablet/mobile stability.
 *
 * @param {string} text   The text to read aloud.
 * @param {object} [opts] Optional overrides: { pitch, rate, volume }
 */
export function speakText(text, opts = {}) {
  if (!text) return;

  // 1. If running inside the Android Tablet APK, use the native Android TTS bridge
  if (typeof window !== 'undefined' && window.AndroidTTS && typeof window.AndroidTTS.speak === 'function') {
    try {
      window.AndroidTTS.speak(text);
      return;
    } catch (err) {
      console.warn('[SciencePlay TTS] AndroidTTS bridge notice:', err);
    }
  }

  // 2. Standard Browser SpeechSynthesis fallback
  if (typeof window === 'undefined' || !window.speechSynthesis) return;

  try {
    window.speechSynthesis.cancel();
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    utterance.pitch = opts.pitch ?? 1.0;
    utterance.rate = opts.rate ?? 0.95;
    utterance.volume = opts.volume ?? 1.0;

    // Use device default voice for maximum stability across mobile and tablet hardware
    window.speechSynthesis.speak(utterance);
  } catch (e) {
    console.warn('[SciencePlay TTS] Speech synthesis notice:', e);
  }
}

let _currentVoiceAudio = null;

/**
 * Play a studio recorded voice prompt (e.g. from ElevenLabs in /static/audio/voice/).
 * Automatically falls back to TTS if the audio file hasn't been generated yet or fails.
 *
 * @param {string} promptKey     Name of the audio file without extension (e.g. 'welcome', 'great_job')
 * @param {string} [fallbackText] Text to speak if the audio file is not available
 */
export function playVoicePrompt(promptKey, fallbackText = '') {
  if (!promptKey) {
    if (fallbackText) speakText(fallbackText);
    return;
  }

  stopVoicePrompt();

  const audioPath = `/static/audio/voice/${promptKey}.mp3`;
  const audio = new Audio(audioPath);
  _currentVoiceAudio = audio;

  let fallbackHandled = false;
  const triggerFallback = () => {
    if (fallbackHandled) return;
    fallbackHandled = true;
    if (fallbackText) speakText(fallbackText);
  };

  audio.addEventListener('error', () => {
    triggerFallback();
  }, { once: true });

  const playPromise = audio.play();
  if (playPromise !== undefined) {
    playPromise.catch((err) => {
      console.warn(`[VoicePrompt] Audio play notice for ${promptKey}:`, err);
      triggerFallback();
    });
  }
}

export function stopVoicePrompt() {
  if (_currentVoiceAudio) {
    try {
      _currentVoiceAudio.pause();
      _currentVoiceAudio.currentTime = 0;
    } catch (_) {}
    _currentVoiceAudio = null;
  }
  if (typeof window !== 'undefined') {
    if (window.AndroidTTS && typeof window.AndroidTTS.stopSpeech === 'function') {
      try { window.AndroidTTS.stopSpeech(); } catch (_) {}
    }
    if (window.speechSynthesis) {
      try { window.speechSynthesis.cancel(); } catch (_) {}
    }
  }
}

// Ensure speech synthesis and audio are instantly cancelled when navigating back or minimizing the app
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', stopVoicePrompt);
  window.addEventListener('beforeunload', stopVoicePrompt);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      stopVoicePrompt();
    }
  });
}

