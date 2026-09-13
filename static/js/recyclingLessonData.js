// recyclingLessonData.js
// Slide content for Week 10, Lesson 2: Recycling
// Grade 3 Science — Matter & Materials / Environmental Care
// Features tap-to-sort interactive classification with immediate green check / shake feedback, and formative assessment.

export const RECYCLING_LESSON_SLIDES = [

  // ── Slide 1: Hook ──
  {
    id: 'recycle-hook',
    type: 'info',
    title: 'What Happens to Our Trash?',
    description:
      'We throw away bottles, cans, and paper every day. Recycling gives them a brand new life instead of piling up in dumps!',
    items: [
      { 
        src: '/static/images/icons/recycle_bin.png', 
        label: 'Recycle Bin', 
        simpleExplanation: 'A special bin for clean bottles, cans, and paper to be remade.' 
      },
      { 
        src: '/static/images/icons/aluminum_can.png', 
        label: 'Metal Can', 
        simpleExplanation: 'Can be melted down and turned into a new can in just 60 days!' 
      },
      { 
        src: '/static/images/icons/plastic_bottle.png', 
        label: 'Plastic Bottle', 
        simpleExplanation: 'Shredded and melted to make new bottles, jackets, and backpacks.' 
      },
    ],
    illustrationBg: '#ecfdf5',
  },

  // ── Slide 2: Teach (The Recycling Loop) ──
  {
    id: 'recycle-teach-loop',
    type: 'info',
    title: 'The Recycling Process',
    description:
      'Recycling turns old trash into brand new items! Look for the 3-arrow loop symbol on containers.',
    items: [
      { 
        src: '/static/images/icons/recycle_bin.png', 
        label: '1. Collect & Sort', 
        simpleExplanation: 'Separate clean recyclables so wet food does not spoil them.' 
      },
      { 
        src: '/static/images/icons/paper.png', 
        label: '2. Clean & Pulp', 
        simpleExplanation: 'Old scrap paper is mashed with water into pulp for fresh paper.' 
      },
      { 
        src: '/static/images/icons/glass_jar.png', 
        label: '3. Melt & Remake', 
        simpleExplanation: 'Glass and metals are melted and shaped into shiny new products.' 
      },
    ],
    keyFact: 'Recycling saves trees, saves energy, and keeps our Earth clean!',
    factBg: '#dcfce7',
  },

  // ── Slide 3: Interactive Tap-to-Sort Practice ──
  {
    id: 'recycle-teach-sort',
    type: 'interactive-recycle-sort',
    title: 'Let\'s Sort! Recyclable or Not?',
    description:
      'Tap each item below to check if it belongs in the blue Recycling Bin!',
    recycleBinImage: '/static/images/icons/recycle_bin.png',
    items: [
      {
        id: 'item-plastic',
        name: 'Plastic Bottle',
        src: '/static/images/icons/plastic_bottle.png',
        isRecyclable: true,
        reason: 'Recyclable! Clean plastic bottles can be melted into new containers.'
      },
      {
        id: 'item-banana',
        name: 'Banana Peel',
        src: '/static/images/icons/banana_peel.png',
        isRecyclable: false,
        reason: 'Not Recyclable! Food waste belongs in the compost bin for garden soil.'
      },
      {
        id: 'item-can',
        name: 'Aluminum Can',
        src: '/static/images/icons/aluminum_can.png',
        isRecyclable: true,
        reason: 'Recyclable! Metal cans can be melted and reused over and over.'
      },
      {
        id: 'item-glass',
        name: 'Glass Jar',
        src: '/static/images/icons/glass_jar.png',
        isRecyclable: true,
        reason: 'Recyclable! Glass can be melted and remade without losing quality.'
      },
      {
        id: 'item-paper',
        name: 'Newspaper & Paper',
        src: '/static/images/icons/paper.png',
        isRecyclable: true,
        reason: 'Recyclable! Clean paper makes fresh notebooks and cardboard.'
      }
    ],
    keyFact: 'Only clean items go in recycling. Wet food belongs in compost!',
    factBg: '#eff6ff',
  },

  // ── Slide 4: Quick Check ──
  {
    id: 'recycle-qc',
    type: 'quick-check',
    title: 'Quick Check: Sorting Right',
    prompt: 'Why can\'t food scraps like banana peels go into the blue recycling bin?',
    options: [
      { id: 'opt-a', label: 'Banana peels are made of plastic', icon: 'bi-question-circle', isCorrect: false },
      { id: 'opt-b', label: 'They make dry paper dirty and belong in compost', icon: 'bi-shield-fill-check', isCorrect: true },
      { id: 'opt-c', label: 'Food scraps are too heavy to carry', icon: 'bi-bounding-box', isCorrect: false },
      { id: 'opt-d', label: 'Food scraps are made of copper metal', icon: 'bi-x-circle', isCorrect: false },
    ],
    successMessage: 'Great job! Wet food spoils paper and cardboard. It belongs in the compost bin!',
    retryMessage: 'Think about what wet, rotten food does to clean paper inside a bin.',
  },

  // ── Slide 5: Reflect ──
  {
    id: 'recycle-reflect',
    type: 'info',
    title: 'Reflect: Recycling at Home',
    description:
      'Having separate bins at home makes sorting easy. Small daily habits keep mountains of trash out of our oceans!',
    items: [
      { 
        src: '/static/images/icons/recycle_bin.png', 
        label: 'Separate Bins', 
        simpleExplanation: 'Keep a bin for bottles, cans, and paper.' 
      },
      { 
        src: '/static/images/icons/plastic_bottle.png', 
        label: 'Rinse Clean', 
        simpleExplanation: 'Rinse leftover milk or juice so the bin stays clean.' 
      },
      { 
        src: '/static/images/icons/earth.png', 
        label: 'Clean Planet', 
        simpleExplanation: 'Every recycled bottle helps protect ocean animals!' 
      },
    ],
    illustrationBg: '#f0fdf4',
  },

  // ── Slide 6: Discuss (Local Context & Tricky Items) ──
  {
    id: 'recycle-discuss',
    type: 'info',
    title: 'Discuss: Sorting Tricky Items',
    description:
      'We sort trash into Biodegradable, Non-Biodegradable, and Recyclable. Watch out for tricky items!',
    items: [
      { 
        src: '/static/images/icons/paper.png', 
        label: 'Clean Paper', 
        simpleExplanation: 'Clean notebooks can be recycled, but greasy pizza boxes cannot.' 
      },
      { 
        src: '/static/images/icons/glass_jar.png', 
        label: 'Glass Jars', 
        simpleExplanation: 'Rinse out empty jam jars before placing them in the bin.' 
      },
      { 
        src: '/static/images/icons/aluminum_can.png', 
        label: 'Drink Cans', 
        simpleExplanation: 'Crush soda cans to save room in your recycling bin!' 
      },
    ],
    illustrationBg: '#ecfdf5',
  },

  // ── Slide 7: Deepen (Connecting Back to Metals) ──
  {
    id: 'recycle-deepen',
    type: 'info',
    title: 'Deepen: The Wonder of Metal Recycling',
    description:
      'Metals like iron, copper, and aluminum can be melted down and remade again and again forever without losing strength!',
    items: [
      { 
        src: '/static/images/icons/aluminum_can.png', 
        label: 'Drink Cans', 
        simpleExplanation: 'Recycling 1 can saves enough power to run a TV for 3 hours!' 
      },
      { 
        src: '/static/images/icons/broken_wire.png', 
        label: 'Copper Wires', 
        simpleExplanation: 'Old copper wires are melted into new wires for gadgets.' 
      },
      { 
        src: '/static/images/icons/nail.png', 
        label: 'Iron Scrap', 
        simpleExplanation: 'Old nails and car parts are melted to build new bridges.' 
      },
    ],
    illustrationBg: '#fefce8',
  },

  // ── Slide 8: Generalize / Summary ──
  {
    id: 'recycle-summary',
    type: 'summary',
    title: 'Big Ideas — Recycling',
    bullets: [
      'Recycling turns old waste into useful new products.',
      'Cans, plastic bottles, glass jars, and clean paper are recyclable.',
      'Food scraps belong in compost, not in the blue recycling bin.',
      'Recycling saves energy and protects nature for everyone.',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FORMATIVE ASSESSMENT (5 GRADED QUESTIONS)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'recycle-assess-1',
    type: 'assess',
    assessNumber: 1,
    title: 'Formative Assessment: Question 1',
    question: 'What does recycling mean?',
    options: [
      { id: 'a', label: 'Throwing trash into the ocean' },
      { id: 'b', label: 'Turning used materials into new products' },
      { id: 'c', label: 'Burning garbage in the backyard' },
      { id: 'd', label: 'Burying waste permanently in the soil' },
    ],
    correctId: 'b',
    explanation: 'Recycling takes discarded items and manufactures them into brand-new goods.',
  },
  {
    id: 'recycle-assess-2',
    type: 'assess',
    assessNumber: 2,
    title: 'Formative Assessment: Question 2',
    question: 'Which of these items belongs inside the recycling bin?',
    options: [
      { id: 'a', label: 'Banana peel' },
      { id: 'b', label: 'Aluminum can' },
      { id: 'c', label: 'Leftover chicken bone' },
      { id: 'd', label: 'Used oily tissue paper' },
    ],
    correctId: 'b',
    explanation: 'Aluminum cans are made of clean metal that can be melted and remade into new cans easily.',
  },
  {
    id: 'recycle-assess-3',
    type: 'assess',
    assessNumber: 3,
    title: 'Formative Assessment: Question 3',
    question: 'Why shouldn\'t food waste and wet scraps go into the dry recycling bin?',
    options: [
      { id: 'a', label: 'Food waste is made of heavy metal' },
      { id: 'b', label: 'It can contaminate other recyclables like clean paper and plastic' },
      { id: 'c', label: 'Food is too bright in color' },
      { id: 'd', label: 'It makes the bin completely invisible' },
    ],
    correctId: 'b',
    explanation: 'Wet, rotten food contaminates clean paper and cardboard, making entire recycling loads unusable.',
  },
  {
    id: 'recycle-assess-4',
    type: 'assess',
    assessNumber: 4,
    title: 'Formative Assessment: Question 4',
    question: 'Which metal object can be melted down and reused again and again without losing its quality?',
    options: [
      { id: 'a', label: 'A rubber car tire' },
      { id: 'b', label: 'An aluminum soda can' },
      { id: 'c', label: 'A banana peel' },
      { id: 'd', label: 'A styrofoam plate' },
    ],
    correctId: 'b',
    explanation: 'Metals like aluminum, iron, and copper can be recycled endlessly with zero loss of quality.',
  },
  {
    id: 'recycle-assess-5',
    type: 'assess',
    assessNumber: 5,
    title: 'Formative Assessment: Question 5',
    question: 'Why is recycling important for our planet?',
    options: [
      { id: 'a', label: 'It makes all garbage vanish into thin air' },
      { id: 'b', label: 'It conserves natural resources and reduces pollution and landfill waste' },
      { id: 'c', label: 'It makes everyday items much more expensive' },
      { id: 'd', label: 'It has no real impact on nature' },
    ],
    correctId: 'b',
    explanation: 'Recycling saves trees, reduces open mining, cuts down pollution, and keeps our communities clean.',
  },
];
