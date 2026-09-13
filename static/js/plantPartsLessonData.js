// plantPartsLessonData.js
// Slide content for Lesson 2B: Plant Parts (Roots, Stem & Leaves)
// Grade 3 Science — Week 3-4, Characters of Living Things
// Direct instructional presentation with no questions on Explore/Teach slides

export const PLANT_PARTS_SLIDES = [

  // ── 1. HOOK ───────────────────────────────────────────────────────────────
  {
    id: 'hook',
    type: 'info',
    title: 'What Keeps a Plant Alive?',
    description: 'All plant parts work together to help the plant stand tall, drink water, and make food! 🌿',
    imageSrc: '/static/images/plant_whole.webp',
    illustrationLabel: 'Plant Parts: Flower, Leaves, Stem & Roots',
    illustrationBg: '#fefce8',
  },

  // ── 2. PART 1: ROOTS (OBSERVE -> TEACH) ──────────────────────────────────
  {
    id: 'explore-roots',
    type: 'teach',
    title: 'Roots: Underground Network',
    description: 'Roots spread deep into the soil beneath the plant to grip the ground. 🌱',
    imageSrc: '/static/images/plant_roots.webp',
    illustrationLabel: 'Branching Roots Spreading in Soil',
    partLabel: 'Roots',
    partBg: '#fef3c7',
    partIcon: 'bi-tree',
    keyFact: 'Roots grip the ground and search for water deep underground! 💧',
    factBg: '#fffbeb',
  },
  {
    id: 'teach-roots',
    type: 'teach',
    title: 'Roots: Drinking Water & Anchoring',
    description: 'Roots drink up water from the soil and hold the plant firm in strong winds! 🌧️',
    imageSrc: '/static/images/plant_roots.webp',
    illustrationLabel: 'Roots Absorbing Water & Nutrients',
    partLabel: 'Roots & Absorption',
    partBg: '#fef3c7',
    partIcon: 'bi-tree',
    keyFact: 'Roots absorb water and keep the plant from blowing away!',
    factBg: '#fffbeb',
  },

  // ── 3. PART 2: STEM (OBSERVE -> TEACH) ───────────────────────────────────
  {
    id: 'explore-stem',
    type: 'teach',
    title: 'The Stem: The Central Pillar',
    description: 'The stem rises above the ground, holding leaves and flowers high toward the sun! ☀️',
    imageSrc: '/static/images/plant_stem.webp',
    illustrationLabel: 'Sturdy Stem Supporting the Plant',
    partLabel: 'Stem',
    partBg: '#dcfce7',
    partIcon: 'bi-arrow-up',
    keyFact: 'The stem is the plant\'s backbone that holds it upright!',
    factBg: '#f0fdf4',
  },
  {
    id: 'teach-stem',
    type: 'teach',
    title: 'The Stem: The Water Elevator',
    description: 'Inside the stem, tiny tubes carry water up from the roots to the leaves! 🛗',
    imageSrc: '/static/images/plant_stem.webp',
    illustrationLabel: 'Water Traveling Up and Food Moving Down',
    partLabel: 'Stem & Transport',
    partBg: '#dcfce7',
    partIcon: 'bi-arrow-up',
    keyFact: 'The stem acts like a straw carrying water up to the leaves! 🥤',
    factBg: '#f0fdf4',
  },

  // ── 4. PART 3: LEAVES (OBSERVE -> TEACH) ─────────────────────────────────
  {
    id: 'explore-leaves',
    type: 'teach',
    title: 'Leaves: Sun Catchers',
    description: 'Leaves are flat and green to catch as much warm sunlight as possible! 🍃',
    imageSrc: '/static/images/plant_leaves.webp',
    illustrationLabel: 'Broad Leaves Catching Sunlight',
    partLabel: 'Leaves',
    partBg: '#ecfdf5',
    partIcon: 'bi-leaf',
    keyFact: 'Flat green leaves spread wide to soak up golden sunlight!',
    factBg: '#f0fdf4',
  },
  {
    id: 'teach-leaves',
    type: 'teach',
    title: 'Leaves: Making Food',
    description: 'Leaves are the plant\'s kitchen! They use sunlight, air, and water to make food (sugar)! 🍲',
    imageSrc: '/static/images/plant_leaves.webp',
    illustrationLabel: 'Sunlight + Air + Water = Food for the Plant',
    partLabel: 'Leaves & Food Making',
    partBg: '#ecfdf5',
    partIcon: 'bi-sun-fill',
    keyFact: 'Leaves use sunlight and water to cook food for the whole plant!',
    factBg: '#f0fdf4',
  },

  // ── 5. QUICK CHECKS (QUESTIONS ONLY APPEAR HERE) ─────────────────────────
  {
    id: 'check-roots',
    type: 'quick-check',
    title: 'Quick Check: Roots',
    prompt: 'Which plant part absorbs water from the soil? 💧',
    options: [
      { id: 'leaves', label: 'Leaves', icon: 'bi-leaf',        isCorrect: false },
      { id: 'roots',  label: 'Roots',  icon: 'bi-tree',        isCorrect: true  },
      { id: 'flower', label: 'Flower', icon: 'bi-flower1',     isCorrect: false },
    ],
    successMessage: 'Correct! Roots grow underground and drink water.',
    retryMessage: 'Try again! Think about the part underground.',
  },
  {
    id: 'check-stem',
    type: 'quick-check',
    title: 'Quick Check: Stem',
    prompt: 'What does the stem carry from roots up to leaves? 🌿',
    options: [
      { id: 'seeds',  label: 'Seeds only',          icon: 'bi-circle-fill',  isCorrect: false },
      { id: 'air',    label: 'Only air bubbles',    icon: 'bi-wind',         isCorrect: false },
      { id: 'water',  label: 'Water and nutrients', icon: 'bi-droplet-fill', isCorrect: true  },
    ],
    successMessage: 'Yes! The stem is like a pipe carrying water up.',
    retryMessage: 'Think about what liquid moves up through the stem.',
  },
  {
    id: 'check-leaves',
    type: 'quick-check',
    title: 'Quick Check: Leaves',
    prompt: 'What do leaves need to make food for the plant? ☀️',
    options: [
      { id: 'soil',  label: 'Soil only',        icon: 'bi-tree-fill', isCorrect: false },
      { id: 'sun',   label: 'Sunlight and air', icon: 'bi-sun-fill',  isCorrect: true  },
      { id: 'rocks', label: 'Rocks and sand',   icon: 'bi-gem',       isCorrect: false },
    ],
    successMessage: 'Right! Leaves catch sunlight and air to cook plant food.',
    retryMessage: 'Think about what shines from the sky into leaves.',
  },

  // ── 6. DEEPEN THINKING ───────────────────────────────────────────────────
  {
    id: 'deepen',
    type: 'quick-check',
    title: 'Deepen Thinking: Sunlight',
    prompt: 'A plant has water but is kept in a dark room with no light. Which part suffers first?',
    imageSrc: '/static/images/plant_leaves.webp',
    illustrationLabel: 'Leaves need sunlight to make food',
    illustrationBg: '#f1f5f9',
    options: [
      { id: 'roots',  label: 'Roots — cannot absorb water',              icon: 'bi-tree',     isCorrect: false },
      { id: 'stem',   label: 'Stem — cannot hold water',                 icon: 'bi-arrow-up', isCorrect: false },
      { id: 'leaves', label: 'Leaves — cannot make food without light',  icon: 'bi-leaf',     isCorrect: true  },
    ],
    successMessage: 'Well done! Without sunlight, leaves cannot make food!',
    retryMessage: 'Which part needs sunlight to make food?',
  },

  // ── 7. SUMMARY ───────────────────────────────────────────────────────────
  {
    id: 'summary',
    type: 'summary',
    title: 'Plant Parts: Big Ideas',
    imageSrc: '/static/images/plant_whole.webp',
    illustrationLabel: 'All Plant Parts Working Together',
    bullets: [
      '🌱 Roots anchor the plant and drink water from the soil.',
      '🌿 The stem holds the plant high and carries water up.',
      '🍃 Leaves catch sunlight and air to make food!',
      '🤝 All parts work together as a team to keep the plant alive.',
    ],
  },
];
