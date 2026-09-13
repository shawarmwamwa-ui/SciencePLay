// animalBodyPartsLessonData.js
// Slide content for Lesson 2A: Animal Body Parts (Movement & Feeding)
// Grade 3 Science — Week 3-4, Characters of Living Things
// Direct instructional presentation with no questions on Explore/Teach slides

export const ANIMAL_BODY_PARTS_SLIDES = [

  // ── 1. HOOK ───────────────────────────────────────────────────────────────
  {
    id: 'hook',
    type: 'info',
    title: 'How Animals Move & Find Food',
    description: 'Animals have special body parts that help them walk, fly, eat, and stay safe! 🐾',
    animations: [
      { src: '/static/animations/dog-walking.json', label: 'Dog walking' },
      { src: '/static/animations/bird-flying.json', label: 'Bird flying' },
      { src: '/static/animations/chicken-pecking.json', label: 'Chicken pecking' },
    ],
    illustrationBg: '#fef9c3',
  },

  // ── 2. PART 1: HEAD (OBSERVE -> TEACH) ────────────────────────────────────
  {
    id: 'explore-head',
    type: 'teach',
    title: 'The Head: Eyes & Mouth',
    description: 'The head holds the eyes for watching and the mouth for eating! 👀 👄',
    animations: [
      { src: '/static/animations/eating-cow.json', label: 'A cow' },
    ],
    partLabel: 'Head (Eyes & Mouth)',
    partBg: '#dbeafe',
    partIcon: 'bi-person-circle',
    keyFact: 'The head holds eyes for seeing and a mouth for eating!',
    factBg: '#eff6ff',
  },
  {
    id: 'teach-head',
    type: 'teach',
    title: 'The Head: Senses & Eating',
    description: 'Eyes spot food from far away, while the mouth chews food for daily energy! 🍎',
    animations: [
      { src: '/static/animations/dog eyes-mouth.json', label: 'Head: Eyes & Mouth' },
    ],
    partLabel: 'Head & Senses',
    partBg: '#dbeafe',
    partIcon: 'bi-eye-fill',
    keyFact: 'Eyes spot food and danger. The mouth chews food!',
    factBg: '#eff6ff',
  },

  // ── 3. PART 2: LEGS (OBSERVE -> TEACH) ────────────────────────────────────
  {
    id: 'explore-legs',
    type: 'teach',
    title: 'Legs: Moving Across Land',
    description: 'Legs support the body so animals can walk, run, and explore land! 🦊',
    animations: [
      { src: '/static/animations/running-fox.json', label: 'A fox' },
    ],
    partLabel: 'Legs',
    partBg: '#dcfce7',
    partIcon: 'bi-arrows-move',
    keyFact: 'Legs hold up the body and let animals move on land!',
    factBg: '#f0fdf4',
  },
  {
    id: 'teach-legs',
    type: 'teach',
    title: 'Legs: Finding Food & Safety',
    description: 'Strong legs help animals search for food and quickly leap away from danger! 🏃',
    animations: [
      { src: '/static/animations/frog-jumping.json', label: 'Frog jumping' },
      { src: '/static/animations/walking-dog.json', label: 'Dog walking' },
    ],
    partLabel: 'Legs & Movement',
    partBg: '#dcfce7',
    partIcon: 'bi-person-walking',
    keyFact: 'Legs walk, run, and jump to find food and escape danger!',
    factBg: '#f0fdf4',
  },

  // ── 4. PART 3: WINGS (OBSERVE -> TEACH) ───────────────────────────────────
  {
    id: 'explore-wings',
    type: 'teach',
    title: 'Wings: Soaring in the Air',
    description: 'Wings are light and wide to help birds soar smoothly through the sky! 🦅',
    animations: [
      { src: '/static/animations/flying-bird.json', label: 'A bird' },
    ],
    partLabel: 'Wings',
    partBg: '#fce7f3',
    partIcon: 'bi-feather',
    keyFact: 'Wings are lightweight and wide so animals can fly!',
    factBg: '#fdf2f8',
  },
  {
    id: 'teach-wings',
    type: 'teach',
    title: 'Wings: High Food & Quick Escape',
    description: 'Wings fly up to reach fruits in tall trees and quickly escape predators on the ground! 🌳',
    animations: [
      { src: '/static/animations/bird-flies.json', label: 'Bird wings in flight' },
    ],
    partLabel: 'Wings & Flight',
    partBg: '#fce7f3',
    partIcon: 'bi-feather',
    keyFact: 'Wings let birds reach tall trees and stay safe in the sky!',
    factBg: '#fdf2f8',
  },

  // ── 5. QUICK CHECKS (QUESTIONS ONLY APPEAR HERE) ─────────────────────────
  {
    id: 'check-head',
    type: 'quick-check',
    title: 'Quick Check: The Head',
    prompt: 'Which part of the head helps an animal SEE food? 👀',
    options: [
      { id: 'tail',  label: 'Tail',  icon: 'bi-arrow-right',    isCorrect: false },
      { id: 'eyes',  label: 'Eyes',  icon: 'bi-eye-fill',       isCorrect: true  },
      { id: 'claws', label: 'Claws', icon: 'bi-lightning-fill', isCorrect: false },
    ],
    successMessage: 'Correct! Eyes spot food and danger from afar.',
    retryMessage: 'Try again! Which part is used for looking?',
  },
  {
    id: 'check-legs',
    type: 'quick-check',
    title: 'Quick Check: Legs',
    prompt: 'How do legs help an animal when it is hungry? 🐾',
    options: [
      { id: 'sleep', label: 'Sleep in the shade',        icon: 'bi-moon-stars',     isCorrect: false },
      { id: 'fly',   label: 'Fly high into clouds',      icon: 'bi-wind',           isCorrect: false },
      { id: 'move',  label: 'Walk and run to find food', icon: 'bi-person-walking', isCorrect: true  },
    ],
    successMessage: 'Spot on! Legs let animals roam and find food.',
    retryMessage: 'Think about moving around on the ground.',
  },
  {
    id: 'check-wings',
    type: 'quick-check',
    title: 'Quick Check: Wings',
    prompt: 'Why do birds need wings to get food in tall trees? 🦅',
    options: [
      { id: 'dig',   label: 'To dig deep holes',                 icon: 'bi-tools',   isCorrect: false },
      { id: 'fly',   label: 'To fly up and reach high branches', icon: 'bi-feather', isCorrect: true  },
      { id: 'swim',  label: 'To swim under soil',                icon: 'bi-water',   isCorrect: false },
    ],
    successMessage: 'Great job! Wings allow birds to fly high.',
    retryMessage: 'Wings help animals move through the air!',
  },

  // ── 6. DEEPEN THINKING ───────────────────────────────────────────────────
  {
    id: 'deepen',
    type: 'quick-check',
    title: 'Deepen Thinking: In Water',
    prompt: 'A fish has NO legs and NO wings. How does it move through water to find food? 🐟',
    animations: [
      { src: '/static/animations/fish-swimming.json', label: 'Fish swimming' },
    ],
    illustrationBg: '#e0f2fe',
    options: [
      { id: 'legs',  label: 'It grows temporary legs',           icon: 'bi-person-walking', isCorrect: false },
      { id: 'flies', label: 'It flies above the water',          icon: 'bi-wind',           isCorrect: false },
      { id: 'fins',  label: 'It uses fins and tail to swim',     icon: 'bi-tsunami',        isCorrect: true  },
    ],
    successMessage: 'Awesome! Fish use fins and tails to swim in water!',
    retryMessage: 'What does a fish use to swim smoothly?',
  },

  // ── 7. SUMMARY ───────────────────────────────────────────────────────────
  {
    id: 'summary',
    type: 'summary',
    title: 'Animal Body Parts: Big Ideas',
    bullets: [
      '👀 Head: Eyes spot food and mouth chews food.',
      '🐾 Legs: Walk, run, and leap across land.',
      '🦅 Wings: Fly high into trees and escape danger.',
      '🐟 Animals have body parts built for where they live!',
    ],
  },
];
