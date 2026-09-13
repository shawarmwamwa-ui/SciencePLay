// lessonSlidesData.js
// Slide content and hotspots for the Living vs Non-Living lesson.
// This data file is separate from component logic so it can be edited without changing behavior.

import { getObjectByLabel } from './objectsData.js';

function getSlideObject(label, overrides = {}) {
  const object = getObjectByLabel(label) || {};
  return {
    id: label.toLowerCase(),
    label: object.label || label,
    isLiving: object.isLiving ?? false,
    image: object.image || '',
    icon: object.icon || object.image || '',
    description: object.explanation || '',
    ...overrides,
  };
}

const FISH_OBJECT = getObjectByLabel('Fish');
console.log('lessonSlidesData module loaded, FISH_OBJECT:', FISH_OBJECT);

export const LESSON_SLIDES = [
  {
    id: 'intro',
    type: 'intro',
    title: 'Living vs Non-Living',
    description: 'Living things grow, breathe, and need food and water! 🌱 Non-living things do not do these on their own. 🪨',
    image: '',
  },
  {
    id: 'hotspots-1',
    type: 'hotspots',
    title: 'Tap to Explore',
    description: 'Tap each item to see what makes it living or non-living! 🔍',
    backgroundImage: '',
    hotspots: [
      { ...getSlideObject('Tree'), x: 18, y: 30 },
      { ...getSlideObject('Bicycle'), x: 55, y: 58 },
      { ...getSlideObject('Bird'), x: 72, y: 25 },
      { ...getSlideObject('Puddle'), x: 35, y: 70 },
    ],
  },
  {
    id: 'quick-check-1',
    type: 'quick-check',
    title: 'Quick Check: Living Thing',
    targetIsLiving: true,
    prompt: 'Which one can grow and needs water to stay alive? 🌱',
    options: [
      getSlideObject('Rock'),
      getSlideObject('Plant'),
    ],
    explanation: getObjectByLabel('Plant')?.explanation,
    successMessage: 'Great job! Plants are living things!',
    retryMessage: 'Try again!',
    retryHint: 'Look for what needs water and sunlight.',
  },
  {
    id: 'hotspots-2',
    type: 'hotspots',
    title: 'More Objects to Classify',
    description: 'Tap each object! Is it living or non-living? ✨',
    backgroundImage: '',
    hotspots: [
      { ...getSlideObject('Cat'), x: 20, y: 55 },
      { ...getSlideObject('Ball'), x: 45, y: 70 },
      { ...getSlideObject('Flower'), x: 68, y: 48 },
    ],
  },
  {
    id: 'quick-check-2',
    type: 'quick-check',
    title: 'Quick Check: Non-Living Thing',
    targetIsLiving: false,
    prompt: 'Which object cannot breathe or move by itself? 🪑',
    options: [
      getSlideObject('Butterfly'),
      getSlideObject('Chair'),
    ],
    explanation: getObjectByLabel('Chair')?.explanation,
    successMessage: 'Spot on! A chair is non-living.',
    retryMessage: 'Try again!',
    retryHint: 'Which one is made by people and does not eat?',
  },
  {
    id: 'characteristics',
    type: 'characteristics',
    title: 'Why is this fish a living thing?',
    description: 'Tap all the traits that prove this fish is alive! 🐟',
    object: FISH_OBJECT,
    traits: [
      { id: 'grows', label: 'Grows' },
      { id: 'breathes', label: 'Breathes' },
      { id: 'moves', label: 'Moves on its own' },
      { id: 'needs-food', label: 'Needs food' },
      { id: 'made-by-people', label: 'Made by people' },
    ],
    correctTraits: ['grows', 'breathes', 'moves', 'needs-food'],
    conclusion: 'Awesome! A fish is living because it grows, breathes, moves, and eats food!',
    partialMessage: 'Keep going! What else does it do?',
    mistakeHint: 'Only pick things living animals do on their own.',
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'Great Job! Big Ideas',
    bullets: [
      '🌱 Living things grow, breathe, and need food.',
      '🪨 Non-living things do not eat, breathe, or grow.',
      '🐾 Animals and plants are living!',
      '🚲 Toys, chairs, and rocks are non-living.',
    ],
  },
];
