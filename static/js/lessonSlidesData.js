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
    title: 'What makes something living or non-living?',
    description: 'Living things can grow, breathe, move by themselves, and need food or water. Non-living things do not do those jobs on their own.',
    image: '',
  },
  {
    id: 'hotspots-1',
    type: 'hotspots',
    title: 'Tap to learn what is living and non-living.',
    description: 'Look closely at each object and notice what makes it alive or not alive.',
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
    title: 'Spot the living object.',
    targetIsLiving: true,
    prompt: 'Think about which one can grow and needs care to stay alive.',
    options: [
      getSlideObject('Rock'),
      getSlideObject('Plant'),
    ],
    explanation: getObjectByLabel('Plant')?.explanation,
    successMessage: 'Nice spotting!',
    retryMessage: 'Almost there.',
    retryHint: 'Look for the object that needs sunlight and water to keep living.',
  },
  {
    id: 'hotspots-2',
    type: 'hotspots',
    title: 'Look again and classify each object.',
    description: 'Use what you learned from the first scene and explain each choice to yourself.',
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
    title: 'Find the non-living object.',
    targetIsLiving: false,
    prompt: 'Choose the object that cannot breathe, grow, or move by itself.',
    options: [
      getSlideObject('Butterfly'),
      getSlideObject('Chair'),
    ],
    explanation: getObjectByLabel('Chair')?.explanation,
    successMessage: 'Yes, that is it!',
    retryMessage: 'Try one more time.',
    retryHint: 'Choose the object that only works when a person uses or moves it.',
  },
  {
    id: 'characteristics',
    type: 'characteristics',
    title: 'Why is this fish a living thing?',
    description: 'Pick the traits that prove the fish is alive. More than one answer is correct.',
    object: FISH_OBJECT,
    traits: [
      { id: 'grows', label: 'Grows' },
      { id: 'breathes', label: 'Breathes' },
      { id: 'moves', label: 'Moves on its own' },
      { id: 'needs-food', label: 'Needs food' },
      { id: 'made-by-people', label: 'Made by people' },
    ],
    correctTraits: ['grows', 'breathes', 'moves', 'needs-food'],
    conclusion: 'Great! A fish is living because it grows, breathes with gills, moves on its own, and needs food.',
    partialMessage: 'You are building a strong answer.',
    mistakeHint: 'Check whether the trait is something only living things can do on their own.',
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'You finished the lesson. Here are the big ideas.',
    bullets: [
      'Living things grow, breathe, move on their own, and need food or water.',
      'Non-living things do not do life jobs like breathing or growing.',
      'Animals and plants are living because they need care and can change over time.',
      'Objects made by people, like chairs, books, and toys, are non-living.',
      'A good clue is this: can it do life actions by itself?',
    ],
  },
];
