// plantPartsLessonData.js
// Slide content for Lesson 2B: Plant Parts (Roots, Stem & Leaves)
// Grade 3 Science — Week 3-4, Characters of Living Things
// Direct instructional presentation with no questions on Explore/Teach slides

export const PLANT_PARTS_SLIDES = [

  // ── 1. HOOK ───────────────────────────────────────────────────────────────
  {
    id: 'hook',
    type: 'info',
    title: 'What Keeps a Plant Alive',
    description:
      'A healthy plant stands tall and green because all its body parts work together. ' +
      'Just like animals, plants have specialized structures designed to take in water, transport nutrients, and make food.',
    imageSrc: '/static/images/plant_whole.webp',
    illustrationLabel: 'Plant Parts: Flower, Leaves, Stem & Roots',
    illustrationBg: '#fefce8',
  },

  // ── 2. PART 1: ROOTS (OBSERVE -> TEACH) ──────────────────────────────────
  {
    id: 'explore-roots',
    type: 'teach',
    title: 'Roots: The Underground Network',
    description:
      'Roots grow downward and spread through the dark soil beneath the plant. ' +
      'They form a wide network of branching strands that grip the earth and reach deep for moisture.',
    imageSrc: '/static/images/plant_roots.webp',
    illustrationLabel: 'Branching Roots Spreading in Soil',
    partLabel: 'Roots',
    partBg: '#fef3c7',
    partIcon: 'bi-tree',
    keyFact: 'Roots spread through soil to grip the ground and search for water.',
    factBg: '#fffbeb',
  },
  {
    id: 'teach-roots',
    type: 'teach',
    title: 'Roots: Water Absorption and Anchoring',
    description:
      'Roots absorb water and essential mineral nutrients dissolved in the soil and send them upward. ' +
      'Roots also anchor the plant firmly in the ground so strong winds and rain do not dislodge it.',
    imageSrc: '/static/images/plant_roots.webp',
    illustrationLabel: 'Roots Absorbing Water & Nutrients',
    partLabel: 'Roots & Absorption',
    partBg: '#fef3c7',
    partIcon: 'bi-tree',
    keyFact: 'Roots absorb water and nutrients from soil and firmly anchor the plant.',
    factBg: '#fffbeb',
  },

  // ── 3. PART 2: STEM (OBSERVE -> TEACH) ───────────────────────────────────
  {
    id: 'explore-stem',
    type: 'teach',
    title: 'The Stem: The Central Pillar',
    description:
      'The stem is the sturdy middle structure of the plant. ' +
      'It rises above the ground, connecting the roots below to the leaves and flowers above.',
    imageSrc: '/static/images/plant_stem.webp',
    illustrationLabel: 'Sturdy Stem Supporting the Plant',
    partLabel: 'Stem',
    partBg: '#dcfce7',
    partIcon: 'bi-arrow-up',
    keyFact: 'The stem provides the main structure holding leaves and flowers high.',
    factBg: '#f0fdf4',
  },
  {
    id: 'teach-stem',
    type: 'teach',
    title: 'The Stem: Moving Water and Supporting Leaves',
    description:
      'Inside the stem are tiny tube-like passageways that carry water and nutrients from the roots up to the leaves. ' +
      'The stem also carries sugar made in the leaves down to the rest of the plant.',
    imageSrc: '/static/images/plant_stem.webp',
    illustrationLabel: 'Water Traveling Up and Food Moving Down',
    partLabel: 'Stem & Transport',
    partBg: '#dcfce7',
    partIcon: 'bi-arrow-up',
    keyFact: 'The stem holds the plant upright and carries water from roots up to leaves.',
    factBg: '#f0fdf4',
  },

  // ── 4. PART 3: LEAVES (OBSERVE -> TEACH) ─────────────────────────────────
  {
    id: 'explore-leaves',
    type: 'teach',
    title: 'Leaves: Sun Catchers',
    description:
      'Leaves are flat, thin, and green structures that spread outward to catch as much sunlight as possible. ' +
      'Their green color comes from chlorophyll, which captures energy from sunlight.',
    imageSrc: '/static/images/plant_leaves.webp',
    illustrationLabel: 'Broad Leaves Catching Sunlight',
    partLabel: 'Leaves',
    partBg: '#ecfdf5',
    partIcon: 'bi-leaf',
    keyFact: 'Flat green leaves spread wide to absorb maximum sunlight.',
    factBg: '#f0fdf4',
  },
  {
    id: 'teach-leaves',
    type: 'teach',
    title: 'Leaves: Making Food with Sunlight',
    description:
      'Leaves take in sunlight and air (carbon dioxide), combining them with water from the stem to produce food (sugar) through photosynthesis. ' +
      'This food provides the energy the plant needs to grow, flower, and make seeds.',
    imageSrc: '/static/images/plant_leaves.webp',
    illustrationLabel: 'Photosynthesis: Sunlight + Air + Water = Food',
    partLabel: 'Leaves & Food Making',
    partBg: '#ecfdf5',
    partIcon: 'bi-sun-fill',
    keyFact: 'Leaves use sunlight and air to make food (energy) for the whole plant.',
    factBg: '#f0fdf4',
  },

  // ── 5. QUICK CHECKS (QUESTIONS ONLY APPEAR HERE) ─────────────────────────
  {
    id: 'check-roots',
    type: 'quick-check',
    title: 'Quick Check: Roots',
    prompt: 'Which plant part absorbs water and nutrients from the soil?',
    options: [
      { id: 'leaves', label: 'Leaves', icon: 'bi-leaf',        isCorrect: false },
      { id: 'roots',  label: 'Roots',  icon: 'bi-tree',        isCorrect: true  },
      { id: 'flower', label: 'Flower', icon: 'bi-flower1',     isCorrect: false },
    ],
    successMessage: 'Correct! Roots grow underground and absorb water and minerals from the soil.',
    retryMessage: 'Try again. Think about the part of the plant that grows underground.',
  },
  {
    id: 'check-stem',
    type: 'quick-check',
    title: 'Quick Check: Stem',
    prompt: 'What does the stem carry from the roots up to the leaves?',
    options: [
      { id: 'seeds',  label: 'Seeds only',          icon: 'bi-circle-fill',  isCorrect: false },
      { id: 'air',    label: 'Only air bubbles',    icon: 'bi-wind',         isCorrect: false },
      { id: 'water',  label: 'Water and nutrients', icon: 'bi-droplet-fill', isCorrect: true  },
    ],
    successMessage: 'Yes! The stem acts like a pipe system carrying water and nutrients upward.',
    retryMessage: 'Think again. The stem works like a tube carrying liquid from the ground up.',
  },
  {
    id: 'check-leaves',
    type: 'quick-check',
    title: 'Quick Check: Leaves',
    prompt: 'What do leaves need to make food for the plant?',
    options: [
      { id: 'soil',  label: 'Soil only',        icon: 'bi-tree-fill', isCorrect: false },
      { id: 'sun',   label: 'Sunlight and air', icon: 'bi-sun-fill',  isCorrect: true  },
      { id: 'rocks', label: 'Rocks and sand',   icon: 'bi-gem',       isCorrect: false },
    ],
    successMessage: 'That is right! Leaves use sunlight and air along with water to make food for the plant.',
    retryMessage: 'Think about what energy source leaves soak up from the sky.',
  },

  // ── 6. DEEPEN THINKING ───────────────────────────────────────────────────
  {
    id: 'deepen',
    type: 'quick-check',
    title: 'Deepen Your Thinking: Sun & Growth',
    prompt:
      'A gardener waters a plant every day but places it inside a dark closet with no sunlight. Which part of the plant will suffer first and why?',
    imageSrc: '/static/images/plant_leaves.webp',
    illustrationLabel: 'Leaves need sunlight to perform photosynthesis',
    illustrationBg: '#f1f5f9',
    options: [
      { id: 'roots',  label: 'Roots — they stop absorbing water',               icon: 'bi-tree',        isCorrect: false },
      { id: 'stem',   label: 'Stem — it cannot hold water without light',       icon: 'bi-arrow-up',    isCorrect: false },
      { id: 'leaves', label: 'Leaves — they cannot make food without sunlight', icon: 'bi-leaf',        isCorrect: true  },
    ],
    successMessage:
      'Well done! Without sunlight, the leaves cannot perform photosynthesis — so the plant runs out of food energy even if it has plenty of water.',
    retryMessage:
      'Think about which part relies directly on sunlight to do its main job.',
  },

  // ── 7. SUMMARY ───────────────────────────────────────────────────────────
  {
    id: 'summary',
    type: 'summary',
    title: 'Big Ideas — Plant Parts',
    imageSrc: '/static/images/plant_whole.webp',
    illustrationLabel: 'All Plant Parts Connected & Working Together',
    bullets: [
      'Roots grow underground, absorb water and minerals, and anchor the plant in place.',
      'The stem supports the plant upright and carries water and nutrients from roots to leaves.',
      'Leaves absorb sunlight and air to produce food through photosynthesis.',
      'All three parts — roots, stem, and leaves — work together as a connected system to keep the plant alive.',
    ],
  },
];
