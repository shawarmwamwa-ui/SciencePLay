// gameObjects.js
// Data adapter for teacher-configurable sorting activities.

import { getObjectByLabel } from './objectsData.js';

const DEFAULT_ROUND_SIZE = 12;
const configCache = new Map();

function shuffleArray(items) {
  const shuffled = [...items];
  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [shuffled[index], shuffled[swapIndex]] = [shuffled[swapIndex], shuffled[index]];
  }
  return shuffled;
}

function normalizeObject(object, index) {
  const sharedObject = getObjectByLabel(object.label || object.name || '');
  const categoryId = object.categoryId || (sharedObject ? (sharedObject.isLiving ? 'living' : 'non-living') : undefined);

  return {
    id: object.id ?? index + 1,
    label: object.label || object.name || sharedObject?.label || `Object ${index + 1}`,
    categoryId,
    explanation: object.explanation || sharedObject?.explanation || '',
    image: object.image || sharedObject?.image || '',
    icon: object.icon || sharedObject?.icon || object.image || sharedObject?.image || '',
  };
}

function normalizeBin(bin, index) {
  const defaultColors = ['#4ade80', '#fb923c', '#60a5fa', '#facc15'];
  return {
    id: bin.id,
    label: bin.label || `Bin ${index + 1}`,
    icon: bin.icon || '📦',
    color: bin.color || defaultColors[index % defaultColors.length],
  };
}

function isValidObjectEntry(object) {
  return object && typeof object.categoryId === 'string';
}

function isValidBinEntry(bin) {
  return bin && typeof bin.id === 'string';
}

function allocateByCategory(objects, bins, roundSize) {
  const grouped = new Map();
  bins.forEach(bin => grouped.set(bin.id, []));
  objects.forEach(object => {
    if (grouped.has(object.categoryId)) {
      grouped.get(object.categoryId).push(object);
    }
  });

  const binIds = bins.map(bin => bin.id);
  const selected = [];
  const perCategory = Math.floor(roundSize / Math.max(1, binIds.length));
  let remainder = roundSize % Math.max(1, binIds.length);

  binIds.forEach(binId => {
    const pool = shuffleArray(grouped.get(binId) || []);
    const target = perCategory + (remainder > 0 ? 1 : 0);
    if (remainder > 0) {
      remainder -= 1;
    }
    selected.push(...pool.slice(0, target));
  });

  if (selected.length < roundSize) {
    const selectedIds = new Set(selected.map(object => object.id));
    const leftovers = shuffleArray(objects.filter(object => !selectedIds.has(object.id)));
    selected.push(...leftovers.slice(0, roundSize - selected.length));
  }

  return shuffleArray(selected).slice(0, roundSize);
}

async function getSortingActivityConfig(activityId) {
  if (configCache.has(activityId)) {
    return configCache.get(activityId);
  }

  try {
    const response = await fetch(`/student/sorting_activity_config/${activityId}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`Config request failed with status ${response.status}`);
    }

    const payload = await response.json();
    if (!payload || !Array.isArray(payload.bins) || !Array.isArray(payload.objects)) {
      throw new Error('Invalid sorting activity payload');
    }

    const bins = payload.bins
      .filter(isValidBinEntry)
      .map((bin, index) => normalizeBin(bin, index));

    if (bins.length < 2 || bins.length > 4) {
      throw new Error('Sorting activity must have 2 to 4 bins');
    }

    const normalizedObjects = payload.objects
      .filter(isValidObjectEntry)
      .map((object, index) => normalizeObject(object, index));

    if (normalizedObjects.length === 0) {
      throw new Error('Activity has no valid objects');
    }

    const config = {
      title: payload.title || 'Sorting Activity',
      instructions: payload.instructions || 'Sort the objects into the correct bins.',
      roundSize: Number(payload.round_size) > 0 ? Number(payload.round_size) : DEFAULT_ROUND_SIZE,
      bins,
      objects: normalizedObjects,
    };

    configCache.set(activityId, config);
    return config;
  } catch (error) {
    console.error('Unable to load sorting activity config:', error);
    throw error;
  }
}

export async function getClawGameObjects(activityId) {
  const config = await getSortingActivityConfig(activityId);
  const size = Math.max(1, Math.min(config.roundSize || DEFAULT_ROUND_SIZE, config.objects.length));
  const selectedObjects = allocateByCategory(config.objects, config.bins, size);

  return {
    title: config.title,
    instructions: config.instructions,
    bins: config.bins,
    objects: selectedObjects.map(object => ({
    ...object,
    name: object.label,
    icon: object.icon || object.image,
    attempts: 0,
    isSorted: false,
    })),
  };
}
