// propertiesOfMetalsLessonData.js
// Slide content for Week 10, Lesson 1: Properties of Metals (Iron, Copper, Gold & Silver)
// Grade 3 Science — Matter & Materials
// Features interactive property reveals, wire conduction toggle, flashlight shine inspection, and formative assessment.

export const PROPERTIES_OF_METALS_SLIDES = [

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION A: IRON
  // ══════════════════════════════════════════════════════════════════════════

  // ── Slide 1: Hook (Iron) ──
  {
    id: 'iron-hook',
    type: 'metal-hook',
    section: 'Iron',
    title: 'Iron Objects Around Us',
    description:
      'Look closely at the items around our homes and school — from heavy gates and cooking pans to small nails and paperclips. ' +
      'All of these everyday objects are made of iron. Iron is one of the most useful metals on Earth!',
    items: [
      { 
        src: '/static/images/icons/spoon.png', 
        label: 'Metal Spoon', 
        simpleExplanation: 'Made of strong iron or steel so it won\'t bend, melt, or break when scooping hard ice cream or hot soup!' 
      },
      { 
        src: '/static/images/icons/nail.png', 
        label: 'Iron Nail', 
        simpleExplanation: 'Super hard and pointy so builders can hammer it deep into hard wooden walls without it bending.' 
      },
      { 
        src: '/static/images/icons/paperclip.png', 
        label: 'Paperclip', 
        simpleExplanation: 'Made from a thin iron wire that bends just enough to squeeze papers tightly and springs right back!' 
      },
      { 
        src: '/static/images/icons/gate.png', 
        label: 'Iron Gate', 
        simpleExplanation: 'Tall and heavy iron bars that protect homes and schools from strong winds, heavy storms, and intruders.' 
      },
    ],
    illustrationBg: '#f1f5f9',
  },

  // ── Slide 2: Teach (Iron: Hard & Strong) ──
  {
    id: 'iron-teach-strong',
    type: 'interactive-property-card',
    section: 'Iron',
    title: 'Property 1: Hard & Strong',
    cardPrompt: 'Tap the card to test its strength!',
    frontLabel: 'Is Iron Hard & Strong?',
    frontIcon: 'bi-shield-shaded',
    imageSrc: '/static/images/icons/shield.png',
    description:
      'Iron is extremely hard and tough! Unlike wood that can snap or plastic that bends under heavy loads, iron does not bend or break easily. ' +
      'That is why builders and engineers use iron and steel beams to construct tall buildings, long bridges, and sturdy safety gates.',
    keyFact: 'Iron is hard and strong — it can support heavy weights without bending or breaking.',
    factBg: '#eff6ff',
  },

  // ── Slide 3: Teach (Iron: Abundant / Globe Tap-Reveal) ──
  {
    id: 'iron-teach-abundant',
    type: 'interactive-globe-reveal',
    section: 'Iron',
    title: 'Property 2: Abundant in the Earth',
    description:
      'Tap the Earth to explore! Iron is found buried inside rocks and soil all across our planet. ' +
      'Because there is so much iron in the Earth, it is not expensive to use for everyday tools and huge construction projects.',
    globePrompt: 'Tap our planet to reveal the metals hidden beneath the ground!',
    earthImage: '/static/images/icons/earth.png',
    metals: [
      {
        name: 'Iron',
        src: '/static/images/icons/nail.png',
        tag: 'Super Abundant',
        desc: 'Found in massive amounts everywhere! Inexpensive and strong.',
        isHighlight: true
      },
      {
        name: 'Copper',
        src: '/static/images/icons/broken_wire.png',
        tag: 'Common in Ores',
        desc: 'Mined from rocks to power electrical grids worldwide.',
        isHighlight: false
      },
      {
        name: 'Gold',
        src: '/static/images/icons/gold_coin.png',
        tag: 'Rare & Precious',
        desc: 'Very small amounts deep in the crust. Valued highly for beauty.',
        isHighlight: false
      },
      {
        name: 'Silver',
        src: '/static/images/icons/silver_medal.png',
        tag: 'Rare & Shiny',
        desc: 'Deep underground veins. Prized for fine jewelry and awards.',
        isHighlight: false
      }
    ],
    keyFact: 'Iron is abundant all over the world, which makes it an affordable metal for building big structures.',
    factBg: '#fef3c7',
  },

  // ── Slide 4: Teach (Iron: Can Rust) ──
  {
    id: 'iron-teach-rust',
    type: 'interactive-property-card',
    section: 'Iron',
    title: 'Property 3: Iron Can Rust',
    cardPrompt: 'Tap the card to see what happens when iron meets air and water!',
    frontLabel: 'What happens when Iron gets wet?',
    frontIcon: 'bi-droplet-half',
    imageSrc: '/static/images/icons/rust.png',
    description:
      'When iron is left outdoors exposed to rain, water, and oxygen in the air, a chemical change takes place. ' +
      'An orange-brown powdery crust called rust forms on the metal. Over time, rust eats away at the iron and makes it brittle and weak. ' +
      'That is why people paint iron fences, cars, and bridges — the paint acts as a protective shield against moisture!',
    keyFact: 'Water and air cause iron to rust (turn orange-brown). Painting iron protects it from rusting.',
    factBg: '#fee2e2',
  },

  // ── Slide 5: Quick Check (Iron) ──
  {
    id: 'iron-qc',
    type: 'quick-check',
    section: 'Iron',
    title: 'Quick Check: Iron',
    prompt: 'Which property makes iron perfect for holding up heavy bridges and buildings without breaking?',
    options: [
      { id: 'opt-a', label: 'Hard and strong', icon: 'bi-shield-fill-check', isCorrect: true },
      { id: 'opt-b', label: 'Can rust', icon: 'bi-droplet-fill', isCorrect: false },
      { id: 'opt-c', label: 'Very shiny', icon: 'bi-star-fill', isCorrect: false },
      { id: 'opt-d', label: 'Very light', icon: 'bi-feather', isCorrect: false },
    ],
    successMessage: 'Spot on! Hardness and high strength allow iron to support massive weights safely.',
    retryMessage: 'Think about what property prevents heavy objects from collapsing.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION B: COPPER
  // ══════════════════════════════════════════════════════════════════════════

  // ── Slide 6: Hook (Copper) ──
  {
    id: 'copper-hook',
    type: 'metal-hook',
    section: 'Copper',
    title: 'Copper: The Power Conductor',
    description:
      'Look at an appliance cord or electrical plug. Inside that smooth plastic cable hides a bundle of shiny, reddish-orange metal threads. ' +
      'That metal is copper! Copper is the invisible highway that brings electrical power and lighting to our homes, schools, and cities.',
    items: [
      { 
        src: '/static/images/icons/plug.png', 
        label: 'Electrical Plug', 
        simpleExplanation: 'Metal prongs insert into wall sockets to connect appliances directly to the building\'s electric grid.' 
      },
      { 
        src: '/static/images/icons/broken_wire.png', 
        label: 'Copper Wire Strands', 
        simpleExplanation: 'Flexible copper threads that let electric current travel smoothly without getting trapped.' 
      },
    ],
    illustrationBg: '#fff7ed',
  },

  // ── Slide 7: Teach (Copper: Wire Toggle Simulation) ──
  {
    id: 'copper-teach-conduction',
    type: 'interactive-wire-toggle',
    section: 'Copper',
    title: 'Conducting Electricity & Insulation',
    description:
      'Copper is a champion conductor — it allows electricity to flow through it quickly and easily. ' +
      'However, direct electric currents can give dangerous shocks. That is why electrical wires are wrapped in a plastic coating. ' +
      'Plastic is an insulator: it blocks electricity from escaping, keeping our hands safe when we plug in appliances.',
    wireImageBare: '/static/images/icons/broken_wire.png',
    wireImageCoated: '/static/images/icons/plug.png',
    prompt: 'Tap the toggle to compare bare copper vs. insulated coated wire!',
    keyFact: 'Copper conducts electricity easily. The plastic coating acts as an insulator to keep us safe.',
    factBg: '#fef3c7',
  },

  // ── Slide 8: Quick Check (Copper) ──
  {
    id: 'copper-qc',
    type: 'quick-check',
    section: 'Copper',
    title: 'Quick Check: Copper',
    prompt: 'Why do electrical wires have a plastic coating around the copper strands inside?',
    options: [
      { id: 'opt-a', label: 'To make the wire heavier', icon: 'bi-bounding-box', isCorrect: false },
      { id: 'opt-b', label: 'To insulate the wire and keep us safe from electric shock', icon: 'bi-shield-fill-check', isCorrect: true },
      { id: 'opt-c', label: 'To make the copper look shinier', icon: 'bi-stars', isCorrect: false },
      { id: 'opt-d', label: 'To keep the wire completely frozen', icon: 'bi-snow', isCorrect: false },
    ],
    successMessage: 'Great job! Plastic is an electrical insulator that traps the current safely inside.',
    retryMessage: 'Think about what protects people when they touch electrical power cords.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION C: GOLD & SILVER
  // ══════════════════════════════════════════════════════════════════════════

  // ── Slide 9: Hook (Gold & Silver) ──
  {
    id: 'gold-silver-hook',
    type: 'metal-hook',
    section: 'Gold & Silver',
    title: 'Gold and Silver: Treasured Metals',
    description:
      'For thousands of years, people across all cultures have admired gold and silver. ' +
      'Unlike iron that quickly rusts, gold and silver maintain their dazzling luster for centuries. ' +
      'They are prized for crafting beautiful jewelry, champion sports medals, and commemorative coins.',
    items: [
      { 
        src: '/static/images/icons/gold_ring.png', 
        label: 'Gold Ring', 
        simpleExplanation: 'Pure gold never rusts or tarnishes with water, keeping wedding rings shiny for decades!' 
      },
      { 
        src: '/static/images/icons/gold_coin.png', 
        label: 'Gold Coin', 
        simpleExplanation: 'Because gold is rare and durable, ancient people traded gold coins as royal money.' 
      },
      { 
        src: '/static/images/icons/silver_medal.png', 
        label: 'Silver Medal', 
        simpleExplanation: 'Silver reflects light like a bright mirror, making it a proud award for honor students and athletes!' 
      },
    ],
    illustrationBg: '#fefce8',
  },

  // ── Slide 10: Teach (Flashlight Shine Drag / Toggle) ──
  {
    id: 'gold-silver-teach-shine',
    type: 'interactive-flashlight-shine',
    section: 'Gold & Silver',
    title: 'Luster & Light Reflection',
    description:
      'Gold and silver are renowned for their brilliant metallic luster. ' +
      'When light rays strike polished gold or silver, the surface reflects the light with a sparkling glint. ' +
      'Even better, gold does not tarnish or rust when exposed to moisture — it stays radiant forever!',
    flashlightOff: '/static/images/icons/flashlight_off.png',
    flashlightOn: '/static/images/icons/flashlight_on.png',
    swatches: [
      { id: 'gold', name: 'Gold Ring', src: '/static/images/icons/gold_ring.png', shines: true, color: '#f59e0b' },
      { id: 'silver', name: 'Silver Medal', src: '/static/images/icons/silver_medal.png', shines: true, color: '#0284c7' },
      { id: 'iron', name: 'Iron Nail', src: '/static/images/icons/nail.png', shines: false, color: '#64748b' },
    ],
    prompt: 'Tap the flashlight to shine light across the three metal swatches!',
    keyFact: 'Gold and silver reflect light with a bright shine and do not rust, making them ideal for jewelry.',
    factBg: '#fefce8',
  },

  // ── Slide 11: Quick Check (Gold & Silver) ──
  {
    id: 'gold-silver-qc',
    type: 'quick-check',
    section: 'Gold & Silver',
    title: 'Quick Check: Gold & Silver',
    prompt: 'Which metals reflect light with a brilliant shine and are prized for making jewelry and awards?',
    options: [
      { id: 'opt-a', label: 'Gold and Silver', icon: 'bi-gem', isCorrect: true },
      { id: 'opt-b', label: 'Rusty Iron and Wood', icon: 'bi-tree', isCorrect: false },
      { id: 'opt-c', label: 'Only Iron', icon: 'bi-hammer', isCorrect: false },
      { id: 'opt-d', label: 'None of them', icon: 'bi-x-circle', isCorrect: false },
    ],
    successMessage: 'Spot on! The lustrous, non-rusting nature of gold and silver makes them timeless treasures.',
    retryMessage: 'Think about which metals we use for wedding rings and championship medals.',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED SYNTHESIS (ALL THREE METALS)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Slide 12: Reflect ──
  {
    id: 'metals-reflect',
    type: 'info',
    title: 'Reflect: Metal Detectives',
    description:
      'Take a moment to look around your classroom, your bag, or your home. ' +
      'Can you identify at least one object made of iron, one with copper wires, and something shiny like silver or gold? ' +
      'Metals are everywhere in our modern world, each serving a unique daily purpose!',
    items: [
      { 
        src: '/static/images/icons/gate.png', 
        label: 'Iron in Gates', 
        simpleExplanation: 'Chosen for gates because it holds up firmly against wind and guards our school safety.' 
      },
      { 
        src: '/static/images/icons/plug.png', 
        label: 'Copper in Cables', 
        simpleExplanation: 'Chosen for cables because it conducts power right to our fans, lamps, and televisions.' 
      },
      { 
        src: '/static/images/icons/silver_medal.png', 
        label: 'Silver in Medals', 
        simpleExplanation: 'Chosen for awards because its shiny surface stays gleaming without tarnishing easily.' 
      },
    ],
    illustrationBg: '#f8fafc',
  },

  // ── Slide 13: Discuss ──
  {
    id: 'metals-discuss',
    type: 'info',
    title: 'Discuss: Real-World Uses in the Philippines',
    description:
      'Why do you think each metal has a different job? ' +
      '• Iron makes durable bicycle frames, playground swing chains, and heavy construction rebar (kabilya). ' +
      '• Copper powers motor coils inside electric fans and powers our ceiling lights. ' +
      '• Gold and silver are crafted into graduation medals, watches, and precious family jewelry. ' +
      'Every metal is chosen because its special properties fit its job perfectly!',
    items: [
      { 
        src: '/static/images/icons/spoon.png', 
        label: 'Iron Utensils', 
        simpleExplanation: 'Sturdy iron and steel forks and spoons withstand boiling soup and heavy daily kitchen use.' 
      },
      { 
        src: '/static/images/icons/broken_wire.png', 
        label: 'Copper Motor Coils', 
        simpleExplanation: 'Coiled copper wires inside electric fan motors spin the blades to bring cool breezes.' 
      },
      { 
        src: '/static/images/icons/gold_ring.png', 
        label: 'Gold Jewelry', 
        simpleExplanation: 'Precious heirloom jewelry passed down through families because it never loses its luster.' 
      },
    ],
    illustrationBg: '#eff6ff',
  },

  // ── Slide 14: Deepen ──
  {
    id: 'metals-deepen',
    type: 'info',
    title: 'Deepen: Common vs. Rare Metals',
    description:
      'Because iron is so abundant and strong, human beings can build entire cities and railway systems out of it. ' +
      'Gold and silver are scarce and take huge effort to extract from underground, making them rare and precious. ' +
      'Remember: abundant metals are also very easy to melt down and recycle over and over again!',
    items: [
      { 
        src: '/static/images/icons/shield.png', 
        label: 'Abundant & Strong', 
        simpleExplanation: 'Iron is cheap and plentiful underground, perfect for massive bridges and high-rise towers.' 
      },
      { 
        src: '/static/images/icons/earth.png', 
        label: 'Earth\'s Natural Resources', 
        simpleExplanation: 'All metals come from rocks in Earth\'s crust — we should take care of them and recycle!' 
      },
      { 
        src: '/static/images/icons/gold_coin.png', 
        label: 'Rare & Valuable', 
        simpleExplanation: 'Gold takes enormous effort to dig up, making it one of the rarest treasures on Earth.' 
      },
    ],
    illustrationBg: '#fefce8',
  },

  // ── Slide 15: Generalize / Summary ──
  {
    id: 'metals-summary',
    type: 'summary',
    title: 'Big Ideas — Properties of Metals',
    bullets: [
      'Iron is hard, strong, and abundant in the Earth — but it can rust when exposed to air and water.',
      'Copper conducts electricity exceptionally well — plastic coating is used as an insulator to keep us safe.',
      'Gold and silver have high metallic luster (shine brightly) and do not easily rust, making them ideal for jewelry.',
      'Every metal is chosen for specific everyday jobs based on its physical properties.',
    ],
  },

  // ══════════════════════════════════════════════════════════════════════════
  // FORMATIVE ASSESSMENT (5 GRADED QUESTIONS)
  // ══════════════════════════════════════════════════════════════════════════

  {
    id: 'metals-assess-1',
    type: 'assess',
    assessNumber: 1,
    title: 'Formative Assessment: Question 1',
    question: 'Which metal is used to make electrical wires because it conducts electricity well?',
    options: [
      { id: 'a', label: 'Iron' },
      { id: 'b', label: 'Copper' },
      { id: 'c', label: 'Gold' },
      { id: 'd', label: 'Silver' },
    ],
    correctId: 'b',
    explanation: 'Copper is the standard metal for electrical cables because electricity flows through it smoothly.',
  },
  {
    id: 'metals-assess-2',
    type: 'assess',
    assessNumber: 2,
    title: 'Formative Assessment: Question 2',
    question: 'What happens to an iron object when it is exposed to air and water over a long time?',
    options: [
      { id: 'a', label: 'It turns to pure gold' },
      { id: 'b', label: 'It melts into a puddle' },
      { id: 'c', label: 'It forms rust and becomes weaker' },
      { id: 'd', label: 'It becomes extremely light' },
    ],
    correctId: 'c',
    explanation: 'Iron reacts with moisture and oxygen to form rust, an orange-brown crust that weakens the metal.',
  },
  {
    id: 'metals-assess-3',
    type: 'assess',
    assessNumber: 3,
    title: 'Formative Assessment: Question 3',
    question: 'Why are gold and silver primarily used for jewelry, awards, and decorations?',
    options: [
      { id: 'a', label: 'They are very heavy' },
      { id: 'b', label: 'They reflect light beautifully and do not easily rust' },
      { id: 'c', label: 'They are magnetic' },
      { id: 'd', label: 'They are the cheapest metals found' },
    ],
    correctId: 'b',
    explanation: 'Gold and silver have dazzling metallic shine and resist corrosion, making them cherished for adornments.',
  },
  {
    id: 'metals-assess-4',
    type: 'assess',
    assessNumber: 4,
    title: 'Formative Assessment: Question 4',
    question: 'Which property makes iron useful for building strong structures like bridges and building frames?',
    options: [
      { id: 'a', label: 'High shine' },
      { id: 'b', label: 'Hardness and high strength' },
      { id: 'c', label: 'Lightness' },
      { id: 'd', label: 'Rarity' },
    ],
    correctId: 'b',
    explanation: 'Iron is exceptionally hard and strong, so it holds heavy weights without snapping or bending.',
  },
  {
    id: 'metals-assess-5',
    type: 'assess',
    assessNumber: 5,
    title: 'Formative Assessment: Question 5',
    question: 'What is the plastic coating around copper wires used for?',
    options: [
      { id: 'a', label: 'Decoration only' },
      { id: 'b', label: 'To make the wire heavier' },
      { id: 'c', label: 'Insulation and safety from electric shocks' },
      { id: 'd', label: 'To make the copper shinier' },
    ],
    correctId: 'c',
    explanation: 'Plastic is an electrical insulator: it traps the electric current inside the wire to prevent shocks.',
  },
];
