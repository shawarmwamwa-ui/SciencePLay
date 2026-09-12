// recyclingLessonData.js
// Slide content for Week 10, Lesson 2: Recycling
// Grade 3 Science — Matter & Materials / Environmental Care
// Features tap-to-sort interactive classification with immediate green check / shake feedback, and formative assessment.

export const RECYCLING_LESSON_SLIDES = [

  // ── Slide 1: Hook ──
  {
    id: 'recycle-hook',
    type: 'info',
    title: 'What Happens to the Things We Throw Away?',
    description:
      'Every single day, people around the world throw away tons of empty bottles, paper, cans, and food scraps. ' +
      'If everything is tossed into regular trash dumps, garbage piles up and harms our nature, rivers, and wildlife. ' +
      'Fortunately, there is a better way to give used materials a brand-new life: recycling!',
    items: [
      { 
        src: '/static/images/icons/recycle_bin.png', 
        label: 'Recycling Bin', 
        simpleExplanation: 'The special bin where we put clean bottles, paper, and cans so they can be turned into new items.' 
      },
      { 
        src: '/static/images/icons/aluminum_can.png', 
        label: 'Metal Can', 
        simpleExplanation: 'Can be melted down and turned into a brand-new drink can in just 60 days without wasting metal!' 
      },
      { 
        src: '/static/images/icons/plastic_bottle.png', 
        label: 'Plastic Bottle', 
        simpleExplanation: 'Clean plastic bottles can be shredded and remade into new containers, school backpacks, or fleece coats.' 
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
      'Recycling means collecting used materials, breaking them down through manufacturing, and remaking them into brand-new products. ' +
      'Instead of cutting down new trees for paper or mining raw ores from mountains, we reuse what we already have. ' +
      'Look for the three-arrow loop symbol on containers — it shows that the material can be recycled!',
    items: [
      { 
        src: '/static/images/icons/recycle_bin.png', 
        label: 'Collect & Sort', 
        simpleExplanation: 'Step 1: Gather and separate materials so trash and wet food do not ruin clean recyclables.' 
      },
      { 
        src: '/static/images/icons/paper.png', 
        label: 'Clean Scrap Paper', 
        simpleExplanation: 'Step 2: Old books and boxes are mashed with water into paper pulp to create fresh paper sheets.' 
      },
      { 
        src: '/static/images/icons/glass_jar.png', 
        label: 'Reusable Glass', 
        simpleExplanation: 'Step 3: Glass jars can be washed and refilled, or melted down endlessly without losing any quality!' 
      },
    ],
    keyFact: 'Recycling turns used materials into new products, conserving Earth\'s precious natural resources.',
    factBg: '#dcfce7',
  },

  // ── Slide 3: Interactive Tap-to-Sort Practice ──
  {
    id: 'recycle-teach-sort',
    type: 'interactive-recycle-sort',
    title: 'Let\'s Sort! Recyclable or Not?',
    description:
      'Help clean up! Tap each item below and decide whether it belongs in the Recycling Bin or Not. ' +
      'Watch for instant feedback — clean recyclables will turn green, while food scraps and non-recyclables will alert you!',
    recycleBinImage: '/static/images/icons/recycle_bin.png',
    items: [
      {
        id: 'item-plastic',
        name: 'Plastic Bottle',
        src: '/static/images/icons/plastic_bottle.png',
        isRecyclable: true,
        reason: 'Recyclable! Clean plastic bottles can be melted into fibers and new containers.'
      },
      {
        id: 'item-banana',
        name: 'Banana Peel',
        src: '/static/images/icons/banana_peel.png',
        isRecyclable: false,
        reason: 'Not Recyclable! Food waste contaminates dry paper and plastic. It belongs in a compost bin!'
      },
      {
        id: 'item-can',
        name: 'Aluminum Can',
        src: '/static/images/icons/aluminum_can.png',
        isRecyclable: true,
        reason: 'Recyclable! Aluminum can be melted and reused endlessly without losing quality.'
      },
      {
        id: 'item-glass',
        name: 'Glass Jar',
        src: '/static/images/icons/glass_jar.png',
        isRecyclable: true,
        reason: 'Recyclable! Glass jars can be washed, crushed, melted, and remade endlessly.'
      },
      {
        id: 'item-paper',
        name: 'Newspaper / Scrap Paper',
        src: '/static/images/icons/paper.png',
        isRecyclable: true,
        reason: 'Recyclable! Clean paper is pulped to make fresh notebooks and cardboard boxes.'
      }
    ],
    keyFact: 'Only clean materials (metal, plastic, glass, paper) can be recycled. Food scraps belong in compost!',
    factBg: '#eff6ff',
  },

  // ── Slide 4: Quick Check ──
  {
    id: 'recycle-qc',
    type: 'quick-check',
    title: 'Quick Check: Sorting Right',
    prompt: 'Why can\'t food scraps like banana peels go into the blue recycling bin?',
    options: [
      { id: 'opt-a', label: 'Banana peels are actually recyclable plastic', icon: 'bi-question-circle', isCorrect: false },
      { id: 'opt-b', label: 'They contaminate dry recyclables and should be composted into garden soil instead', icon: 'bi-shield-fill-check', isCorrect: true },
      { id: 'opt-c', label: 'Food scraps are too heavy to carry', icon: 'bi-bounding-box', isCorrect: false },
      { id: 'opt-d', label: 'Food scraps are made of copper metal', icon: 'bi-x-circle', isCorrect: false },
    ],
    successMessage: 'Spot on! Food and wet grease ruin clean paper and cardboard. Composting is the right way for food waste!',
    retryMessage: 'Think about what happens when wet, rotten food touches clean paper inside a bin.',
  },

  // ── Slide 5: Reflect ──
  {
    id: 'recycle-reflect',
    type: 'info',
    title: 'Reflect: Recycling at Home',
    description:
      'Think about your daily routines at home and school. ' +
      'Do you have a designated bin or box for plastic bottles, metal cans, and scrap paper? ' +
      'Small daily habits — like rinsing out soda cans or collecting plastic bottles — prevent mountains of trash from filling our oceans!',
    items: [
      { 
        src: '/static/images/icons/recycle_bin.png', 
        label: 'Segregated Bins', 
        simpleExplanation: 'Having labeled bins at home or in class makes it super easy to sort paper, bottles, and cans.' 
      },
      { 
        src: '/static/images/icons/plastic_bottle.png', 
        label: 'Rinsed Plastics', 
        simpleExplanation: 'Rinsing out leftover juice or milk keeps recycling bins clean, odorless, and pest-free.' 
      },
      { 
        src: '/static/images/icons/earth.png', 
        label: 'Healthy Earth', 
        simpleExplanation: 'Every bottle or can you recycle keeps plastic out of our oceans and keeps our planet green and clean!' 
      },
    ],
    illustrationBg: '#f0fdf4',
  },

  // ── Slide 6: Discuss (Local Context & Tricky Items) ──
  {
    id: 'recycle-discuss',
    type: 'info',
    title: 'Discuss: Barangay Waste & Tricky Items',
    description:
      'In many Philippine communities and schools, waste segregation is practiced by sorting into Biodegradable, Non-Biodegradable, and Recyclable. ' +
      'Be careful with tricky items! ' +
      '• Juice boxes (Tetra Paks) look like cardboard, but have plastic and aluminum layers inside that need special processing. ' +
      '• Thin plastic grocery bags (sando bags) can jam conveyor belts at recycling plants. ' +
      '• Old batteries have hazardous chemicals and must be taken to special e-waste drop-off boxes!',
    items: [
      { 
        src: '/static/images/icons/paper.png', 
        label: 'Clean Paper', 
        simpleExplanation: 'Clean newspapers and workbooks can be recycled, but greasy pizza boxes must go to compost or trash.' 
      },
      { 
        src: '/static/images/icons/glass_jar.png', 
        label: 'Bottles & Jars', 
        simpleExplanation: 'Wash jam and mayonnaise jars before recycling so the glass recycling machines stay clean.' 
      },
      { 
        src: '/static/images/icons/aluminum_can.png', 
        label: 'Drink Cans', 
        simpleExplanation: 'Crush soda cans before recycling to save space in your barangay recycling collection trucks.' 
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
      'Remember our lesson on iron and copper? Metal is an extraordinary material! ' +
      'Unlike paper fibers that get shorter or plastic that degrades, metals like iron, copper, and aluminum can be melted down and reformed indefinitely without losing strength. ' +
      'Recycling an aluminum can saves 95% of the energy needed to mine and produce a new one from scratch!',
    items: [
      { 
        src: '/static/images/icons/aluminum_can.png', 
        label: 'Cans', 
        simpleExplanation: 'Aluminum cans can be recycled forever! Recycling one can saves enough energy to run a TV for 3 hours.' 
      },
      { 
        src: '/static/images/icons/broken_wire.png', 
        label: 'Copper Scrap', 
        simpleExplanation: 'Old copper wires from broken gadgets are collected and melted into fresh wires for new electronics.' 
      },
      { 
        src: '/static/images/icons/nail.png', 
        label: 'Iron Scrap', 
        simpleExplanation: 'Old iron nails, pipes, and car parts are melted down in huge furnaces to build new bridges and towers.' 
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
      'Recycling converts discarded materials into fresh, usable products instead of wasting them in landfills.',
      'Common recyclables include clean aluminum cans, plastic bottles, glass jars, and scrap paper.',
      'Food waste, banana peels, and grease do not belong in recycling bins — they should be composted.',
      'Recycling metals saves immense amounts of electrical energy and protects our planet for future generations.',
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
