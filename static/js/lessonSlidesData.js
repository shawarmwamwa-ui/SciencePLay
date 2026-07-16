// lessonSlidesData.js
// Slide content and hotspots for the Living vs Non-Living lesson.
// This data file is separate from component logic so it can be edited without changing behavior.

import { getObjectByLabel } from './objectsData.js';

const FISH_OBJECT = getObjectByLabel('Fish');

export const LESSON_SLIDES = [
  {
    id: 'intro',
    type: 'intro',
    title: 'What makes something living or non-living?',
    description: 'Living things grow, breathe, move, and need food. Non-living things do not do these things on their own.',
    image: '',
  },
  {
    id: 'hotspots-1',
    type: 'hotspots',
    title: 'Tap to learn what is living and non-living.',
    backgroundImage: '',
    hotspots: [
      {
        id: 'tree',
        label: 'Tree',
        isLiving: true,
        image: getObjectByLabel('Tree')?.image,
        description: 'A tree is living because it grows, breathes, and needs water.',
        x: 18,
        y: 30,
      },
      {
        id: 'bicycle',
        label: 'Bicycle',
        isLiving: false,
        image: getObjectByLabel('Bicycle')?.image,
        description: 'A bicycle is non-living because it does not grow, breathe, or eat.',
        x: 55,
        y: 58,
      },
      {
        id: 'bird',
        label: 'Bird',
        isLiving: true,
        image: getObjectByLabel('Bird')?.image,
        description: 'A bird is living because it eats, breathes, and moves on its own.',
        x: 72,
        y: 25,
      },
      {
        id: 'puddle',
        label: 'Puddle',
        isLiving: false,
        image: '/static/images/puddle.png',
        description: 'A puddle is non-living because it does not grow or breathe.',
        x: 35,
        y: 70,
      },
    ],
  },
  {
    id: 'quick-check-1',
    type: 'quick-check',
    title: 'Which object is living?',
    targetIsLiving: true,
    options: [
      {
        id: 'rock',
        label: 'Rock',
        isLiving: false,
        image: getObjectByLabel('Rock')?.image,
      },
      {
        id: 'plant',
        label: 'Plant',
        isLiving: true,
        image: getObjectByLabel('Plant')?.image,
      },
    ],
    explanation: 'A plant is living because it grows, breathes, and responds to sunlight.',
  },
  {
    id: 'hotspots-2',
    type: 'hotspots',
    title: 'Tap all the living and non-living things in the picture.',
    backgroundImage: '',
    hotspots: [
      {
        id: 'cat',
        label: 'Cat',
        isLiving: true,
        image: '/static/images/cat.png',
        description: 'A cat is living because it moves, eats, and grows.',
        x: 20,
        y: 55,
      },
      {
        id: 'ball',
        label: 'Ball',
        isLiving: false,
        image: getObjectByLabel('Ball')?.image,
        description: 'A ball is non-living because it is made by people and does not move by itself.',
        x: 45,
        y: 70,
      },
      {
        id: 'flower',
        label: 'Flower',
        isLiving: true,
        image: '/static/images/flower.png',
        description: 'A flower is living because it grows and needs water.',
        x: 68,
        y: 48,
      },
    ],
  },
  {
    id: 'quick-check-2',
    type: 'quick-check',
    title: 'Which object is non-living?',
    targetIsLiving: false,
    options: [
      {
        id: 'butterfly',
        label: 'Butterfly',
        isLiving: true,
        image: '/static/images/butterfly.png',
      },
      {
        id: 'chair',
        label: 'Chair',
        isLiving: false,
        image: getObjectByLabel('Chair')?.image,
      },
    ],
    explanation: 'A chair is non-living because it does not breathe, grow, or need food.',
  },
  {
    id: 'characteristics',
    type: 'characteristics',
    title: 'What makes this fish living?',
    object: FISH_OBJECT,
    traits: [
      { id: 'grows', label: 'Grows' },
      { id: 'breathes', label: 'Breathes' },
      { id: 'moves', label: 'Moves on its own' },
      { id: 'needs-food', label: 'Needs food' },
      { id: 'made-by-people', label: 'Made by people' },
    ],
    correctTraits: ['grows', 'breathes', 'moves', 'needs-food'],
    conclusion: 'You checked 4 traits — that means it is LIVING because it grows, breathes, moves, and needs food.',
  },
  {
    id: 'summary',
    type: 'summary',
    title: 'Great job! Here is what we learned.',
    bullets: [
      'Living things grow, breathe, move, and need food.',
      'Non-living things do not grow or breathe on their own.',
      'Some things, like plants and animals, are living.',
      'Things made by people, like toys and chairs, are non-living.',
    ],
    nextLabel: 'Start the Claw Machine Activity',
  },
];
