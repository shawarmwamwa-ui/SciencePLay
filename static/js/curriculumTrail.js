/**
 * curriculumTrail.js
 * Modular logic for Grade 3 SciencePlay Curriculum Learning Trail
 * - Accessible text-to-speech reading with Web Speech API
 * - Interactive term completion celebration & confetti
 */

// Text-to-Speech Accessible Reader for Grade 3 pupils
function readTermCard(cardId) {
  if (!('speechSynthesis' in window)) {
    if (window.showScienceplayToast) {
      window.showScienceplayToast("Audio reading is not supported on this browser.", "info");
    } else {
      console.warn("Audio reading is not supported on this browser.");
    }
    return;
  }
  window.speechSynthesis.cancel();
  const card = document.getElementById(cardId);
  if (!card) return;
  const speechText = card.getAttribute('data-speech-text') || card.innerText;
  const utterance = new SpeechSynthesisUtterance(speechText);
  utterance.rate = 0.9;
  utterance.pitch = 1.05;
  window.speechSynthesis.speak(utterance);
}

// Gentle star celebration for completed term
function launchKidCelebration() {
  const canvas = document.getElementById('celebration-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.display = 'block';

  const particles = [];
  const colors = ['#fde047', '#4ade80', '#60a5fa', '#f472b6', '#fb923c'];

  for (let i = 0; i < 40; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.4,
      r: Math.random() * 6 + 4,
      d: Math.random() * 40,
      color: colors[Math.floor(Math.random() * colors.length)],
      tilt: Math.floor(Math.random() * 10) - 10,
      tiltAngleIncremental: (Math.random() * 0.07) + 0.05,
      tiltAngle: 0
    });
  }

  let animationFrames = 0;
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    particles.forEach(p => {
      p.tiltAngle += p.tiltAngleIncremental;
      p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
      p.tilt = Math.sin(p.tiltAngle - (animationFrames / 3)) * 15;

      ctx.beginPath();
      ctx.lineWidth = p.r;
      ctx.strokeStyle = p.color;
      ctx.moveTo(p.x + p.tilt + (p.r / 2), p.y);
      ctx.lineTo(p.x + p.tilt, p.y + p.tilt + (p.r / 2));
      ctx.stroke();
    });

    animationFrames++;
    if (animationFrames < 120) {
      requestAnimationFrame(draw);
    } else {
      canvas.style.display = 'none';
    }
  }
  draw();
}

document.addEventListener('DOMContentLoaded', function() {
  const completedCards = document.querySelectorAll('.kid-badge-completed');
  if (completedCards.length > 0) {
    launchKidCelebration();
  }
});

// Expose globally for inline onclick handlers
window.readTermCard = readTermCard;
window.launchKidCelebration = launchKidCelebration;
