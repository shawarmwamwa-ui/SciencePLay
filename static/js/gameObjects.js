// gameObjects.js
// This file adapts shared living/non-living objects for the Claw Machine game.
// It reuses the same content source as the lesson for consistency.

import { LIVING_NON_LIVING_OBJECTS } from './objectsData.js';

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

export function getClawGameObjects(roundSize = 12) {
  const livingObjects = LIVING_NON_LIVING_OBJECTS.filter(object => object.isLiving);
  const nonLivingObjects = LIVING_NON_LIVING_OBJECTS.filter(object => !object.isLiving);

  const livingCount = Math.ceil(roundSize / 2);
  const nonLivingCount = Math.floor(roundSize / 2);

  const selectedObjects = [
    ...shuffleArray(livingObjects).slice(0, Math.min(livingCount, livingObjects.length)),
    ...shuffleArray(nonLivingObjects).slice(0, Math.min(nonLivingCount, nonLivingObjects.length)),
  ];

  return shuffleArray(selectedObjects).map(object => ({
    ...object,
    name: object.label,
    icon: object.icon || object.image,
    attempts: 0,
    isSorted: false,
  }));
}
