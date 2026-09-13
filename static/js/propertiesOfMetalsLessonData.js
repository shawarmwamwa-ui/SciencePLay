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
    description: 'Iron is all around us in heavy gates, cooking pans, and nails! It is one of Earth\'s strongest metals. 🔩',
    items: [
      { 
        src: '/static/images/icons/spoon.png', 
        label: 'Metal Spoon', 
        simpleExplanation: 'Strong iron spoon won\'t bend or melt in hot soup!' 
      },
      { 
        src: '/static/images/icons/nail.png', 
        label: 'Iron Nail', 
        simpleExplanation: 'Super hard so builders can hammer it into walls!' 
      },
      { 
        src: '/static/images/icons/paperclip.png', 
        label: 'Paperclip', 
        simpleExplanation: 'Thin iron wire that bends to hold papers tightly!' 
      },
      { 
        src: '/static/images/icons/gate.png', 
        label: 'Iron Gate', 
        simpleExplanation: 'Heavy iron bars that protect our homes and schools!' 
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
    cardPrompt: 'Tap the card to test iron\'s strength!',
    frontLabel: 'Is Iron Hard & Strong?',
    frontIcon: 'bi-shield-shaded',
    imageSrc: '/static/images/icons/shield.png',
    description: 'Iron is super hard and tough! It holds up tall buildings and bridges without bending.',
    keyFact: 'Iron is hard and strong — it holds heavy loads without snapping!',
    factBg: '#eff6ff',
  },

  // ── Slide 3: Teach (Iron: Abundant / Metal Comparison) ──
  {
    id: 'iron-teach-abundant',
    type: 'metal-hook',
    section: 'Iron',
    title: 'Property 2: Abundant in Earth',
    description: 'Iron is found all across our planet, making it affordable! Tap each metal below to inspect its unique properties and rarity.',
    items: [
      {
        src: '/static/images/icons/nail.png',
        label: 'Iron',
        tag: 'Super Abundant',
        isHighlight: true,
        metalKey: 'iron',
        theme: { border: '#64748b', bg: '#f1f5f9', pillBg: '#475569', text: '#1e293b' },
        simpleExplanation: 'Found everywhere! Iron is super abundant underground, making it inexpensive, tough, and strong.'
      },
      {
        src: '/static/images/icons/broken_wire.png',
        label: 'Copper',
        tag: 'Common in Ores',
        isHighlight: false,
        metalKey: 'copper',
        theme: { border: '#ea580c', bg: '#fff7ed', pillBg: '#c2410c', text: '#7c2d12' },
        simpleExplanation: 'Common in rocks and ores. Mined across the world to power electrical grids and cables.'
      },
      {
        src: '/static/images/icons/gold_coin.png',
        label: 'Gold',
        tag: 'Rare & Precious',
        isHighlight: false,
        metalKey: 'gold',
        theme: { border: '#eab308', bg: '#fefce8', pillBg: '#ca8a04', text: '#713f12' },
        simpleExplanation: 'Rare and precious yellow metal. Prized for royal crowns and jewelry because it never rusts.'
      },
      {
        src: '/static/images/icons/silver_medal.png',
        label: 'Silver',
        tag: 'Rare & Shiny',
        isHighlight: false,
        metalKey: 'silver',
        theme: { border: '#0284c7', bg: '#f0f9ff', pillBg: '#0369a1', text: '#075985' },
        simpleExplanation: 'Bright shiny metal for awards and fine crafts. Rare, brilliant, and never tarnishes!'
      }
    ],
    illustrationBg: '#eff6ff',
    tapPrompt: 'Tap any metal above to see where it comes from and its properties!',
    keyFact: 'Iron is abundant inside Earth, making it affordable for big buildings!',
    factBg: '#fef3c7',
  },

  // ── Slide 4: Teach (Iron: Can Rust) ──
  {
    id: 'iron-teach-rust',
    type: 'interactive-property-card',
    section: 'Iron',
    title: 'Property 3: Iron Can Rust',
    cardPrompt: 'Tap the card to see what happens in rain!',
    frontLabel: 'What happens when Iron gets wet?',
    frontIcon: 'bi-droplet-half',
    imageSrc: '/static/images/icons/rust.png',
    description: 'Rain and air cause iron to turn into reddish-brown rust. Paint protects iron from water!',
    keyFact: 'Water and air cause iron to rust. Painting iron shields it from water!',
    factBg: '#fee2e2',
  },

  // ── Slide 5: Quick Check (Iron) ──
  {
    id: 'iron-qc',
    type: 'quick-check',
    section: 'Iron',
    title: 'Quick Check: Iron',
    prompt: 'Which property makes iron perfect for holding up bridges? 🌉',
    options: [
      { id: 'opt-a', label: 'Hard and strong', icon: 'bi-shield-fill-check', isCorrect: true },
      { id: 'opt-b', label: 'Can rust', icon: 'bi-droplet-fill', isCorrect: false },
      { id: 'opt-c', label: 'Very shiny', icon: 'bi-star-fill', isCorrect: false },
      { id: 'opt-d', label: 'Very light', icon: 'bi-feather', isCorrect: false },
    ],
    successMessage: 'Spot on! Iron\'s strength supports massive weights safely.',
    retryMessage: 'Which property keeps bridges from falling down?',
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
    description: 'Inside power cables hide reddish-orange copper threads! Copper brings electrical power into our homes. ⚡',
    items: [
      { 
        src: '/static/images/icons/plug.png', 
        label: 'Electrical Plug', 
        simpleExplanation: 'Metal prongs connect appliances to electricity safely!' 
      },
      { 
        src: '/static/images/icons/broken_wire.png', 
        label: 'Copper Wires', 
        simpleExplanation: 'Flexible copper threads let electric current travel smoothly.' 
      },
    ],
    illustrationBg: '#fff7ed',
  },

  // ── Slide 7: Teach (Copper: Wire Toggle Simulation) ──
  {
    id: 'copper-teach-conduction',
    type: 'interactive-wire-toggle',
    section: 'Copper',
    title: 'Conductors & Plastic Insulation',
    description: 'Copper conducts electricity easily! Plastic coating wraps around it to keep our hands safe from shocks. 🔌',
    wireImageBare: '/static/images/icons/broken_wire.png',
    wireImageCoated: '/static/images/icons/plug.png',
    prompt: 'Tap the toggle to compare bare copper vs. insulated wire! 💡',
    keyFact: 'Copper conducts electricity. The plastic coating keeps us safe from shocks!',
    factBg: '#fef3c7',
  },

  // ── Slide 8: Quick Check (Copper) ──
  {
    id: 'copper-qc',
    type: 'quick-check',
    section: 'Copper',
    title: 'Quick Check: Copper',
    prompt: 'Why do electric wires have plastic coating around the copper? 🔌',
    options: [
      { id: 'opt-a', label: 'To make it heavier', icon: 'bi-bounding-box', isCorrect: false },
      { id: 'opt-b', label: 'To insulate and protect us from shocks', icon: 'bi-shield-fill-check', isCorrect: true },
      { id: 'opt-c', label: 'To make it look shiny', icon: 'bi-stars', isCorrect: false },
      { id: 'opt-d', label: 'To freeze the wire', icon: 'bi-snow', isCorrect: false },
    ],
    successMessage: 'Great job! Plastic is an insulator that keeps us safe.',
    retryMessage: 'What keeps our hands safe from electric currents?',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SECTION C: GOLD & SILVER
  // ══════════════════════════════════════════════════════════════════════════

  // ── Slide 9: Hook (Gold & Silver) ──
  {
    id: 'gold-silver-hook',
    type: 'metal-hook',
    section: 'Gold & Silver',
    title: 'Gold & Silver: Precious Metals',
    description: 'Gold and silver never rust! They keep their dazzling shine for centuries in crowns, rings, and medals. 👑',
    items: [
      { 
        src: '/static/images/icons/gold_ring.png', 
        label: 'Gold Ring', 
        simpleExplanation: 'Gold never rusts or tarnishes with water — stays shiny forever!' 
      },
      { 
        src: '/static/images/icons/gold_coin.png', 
        label: 'Gold Coin', 
        simpleExplanation: 'Rare and precious, traded as treasure for thousands of years.' 
      },
      { 
        src: '/static/images/icons/silver_medal.png', 
        label: 'Silver Medal', 
        simpleExplanation: 'Bright silver shine, awarded to champion athletes!' 
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
    description: 'Gold and silver have brilliant metallic luster. When light hits them, they sparkle brightly! ✨',
    flashlightOff: '/static/images/icons/flashlight_off.png',
    flashlightOn: '/static/images/icons/flashlight_on.png',
    swatches: [
      { id: 'gold', name: 'Gold Ring', src: '/static/images/icons/gold_ring.png', shines: true, color: '#f59e0b' },
      { id: 'silver', name: 'Silver Medal', src: '/static/images/icons/silver_medal.png', shines: true, color: '#0284c7' },
      { id: 'iron', name: 'Iron Nail', src: '/static/images/icons/nail.png', shines: false, color: '#64748b' },
    ],
    prompt: 'Tap the flashlight to shine light on the metals! 🔦',
    keyFact: 'Gold and silver shine bright and never rust, perfect for precious jewelry!',
    factBg: '#fefce8',
  },

  // ── Slide 11: Quick Check (Gold & Silver) ──
  {
    id: 'gold-silver-qc',
    type: 'quick-check',
    section: 'Gold & Silver',
    title: 'Quick Check: Shiny Metals',
    prompt: 'Which metals shine with brilliant luster and never rust? ✨',
    options: [
      { id: 'opt-a', label: 'Gold and Silver', icon: 'bi-gem', isCorrect: true },
      { id: 'opt-b', label: 'Rusty Iron and Wood', icon: 'bi-tree', isCorrect: false },
      { id: 'opt-c', label: 'Only Iron', icon: 'bi-hammer', isCorrect: false },
      { id: 'opt-d', label: 'None of them', icon: 'bi-x-circle', isCorrect: false },
    ],
    successMessage: 'Spot on! Gold and silver never rust and shine forever.',
    retryMessage: 'Which metals are used for championship medals and rings?',
  },

  // ══════════════════════════════════════════════════════════════════════════
  // SHARED SYNTHESIS (ALL THREE METALS)
  // ══════════════════════════════════════════════════════════════════════════

  // ── Slide 12: Reflect ──
  {
    id: 'metals-reflect',
    type: 'info',
    section: 'Overview',
    title: 'Reflect: Metal Detectives',
    description: 'Look around! Iron protects our gates, copper powers our fans, and gold & silver shine in jewelry! 🔍',
    items: [
      { 
        src: '/static/images/icons/gate.png', 
        label: 'Iron for Gates', 
        simpleExplanation: 'Strong and tough to protect schools and homes.' 
      },
      { 
        src: '/static/images/icons/plug.png', 
        label: 'Copper for Cables', 
        simpleExplanation: 'Conducts electrical power right to our lights.' 
      },
      { 
        src: '/static/images/icons/silver_medal.png', 
        label: 'Silver for Medals', 
        simpleExplanation: 'Shiny surface stays gleaming for champion awards.' 
      },
    ],
    illustrationBg: '#f8fafc',
  },

  // ── Slide 13: Discuss ──
  {
    id: 'metals-discuss',
    type: 'info',
    section: 'Overview',
    title: 'Real-World Metal Jobs',
    description: 'Every metal has a special job matched to its unique properties! 🛠️',
    items: [
      { 
        src: '/static/images/icons/spoon.png', 
        label: 'Iron Utensils', 
        simpleExplanation: 'Sturdy iron and steel forks and spoons for hot meals.' 
      },
      { 
        src: '/static/images/icons/broken_wire.png', 
        label: 'Copper Coils', 
        simpleExplanation: 'Spins inside electric fan motors to bring cool breezes.' 
      },
      { 
        src: '/static/images/icons/gold_ring.png', 
        label: 'Gold Jewelry', 
        simpleExplanation: 'Precious family treasures that never lose their shine.' 
      },
    ],
    illustrationBg: '#eff6ff',
  },

  // ── Slide 14: Deepen ──
  {
    id: 'metals-deepen',
    type: 'info',
    section: 'Overview',
    title: 'Common vs. Rare Metals',
    description: 'Iron is abundant to build cities! Gold and silver are rare treasures. All metals can be recycled! ♻️',
    items: [
      { 
        src: '/static/images/icons/shield.png', 
        label: 'Abundant Iron', 
        simpleExplanation: 'Plentiful underground, great for bridges and towers.' 
      },
      { 
        src: '/static/images/icons/earth.png', 
        label: 'Earth\'s Resources', 
        simpleExplanation: 'Metals come from Earth\'s rocks — remember to recycle!' 
      },
      { 
        src: '/static/images/icons/gold_coin.png', 
        label: 'Rare Gold', 
        simpleExplanation: 'Hard to dig up, making it one of Earth\'s rarest treasures.' 
      },
    ],
    illustrationBg: '#fefce8',
  },

  // ── Slide 15: Generalize / Summary ──
  {
    id: 'metals-summary',
    type: 'summary',
    title: 'Properties of Metals: Big Ideas',
    bigIdeas: [
      {
        icon: 'bi-shield-shaded',
        color: '#475569',
        bg: '#f1f5f9',
        border: '#cbd5e1',
        title: 'Iron: Hard & Strong',
        text: 'Iron is tough and magnetic, making it ideal for tall buildings and bridges (protect it from rust!).'
      },
      {
        icon: 'bi-lightning-charge-fill',
        color: '#c2410c',
        bg: '#fff7ed',
        border: '#fed7aa',
        title: 'Copper: Master Conductor',
        text: 'Reddish-orange copper conducts electricity and heat with ease, powering our lights and gadgets.'
      },
      {
        icon: 'bi-stars',
        color: '#ca8a04',
        bg: '#fefce8',
        border: '#fef08a',
        title: 'Gold & Silver: Never Rust',
        text: 'Precious metals reflect light with brilliant metallic luster and remain untarnished for centuries.'
      },
      {
        icon: 'bi-recycle',
        color: '#16a34a',
        bg: '#f0fdf4',
        border: '#bbf7d0',
        title: 'Endlessly Recyclable',
        text: 'All metals can be melted down and reshaped endlessly forever without losing strength.'
      }
    ],
    bullets: [
      'Iron: Hard, strong, and magnetic! (Rusts in wet air).',
      'Copper: Red-orange champion electricity conductor!',
      'Gold & Silver: Brilliant luster that never rusts!',
      'Each metal is chosen for the job that fits its properties.',
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
