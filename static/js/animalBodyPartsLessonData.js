// animalBodyPartsLessonData.js
// Slide content for Lesson 2A: Animal Body Parts (Movement & Feeding)
// Grade 3 Science — Week 3-4, Characters of Living Things
// Direct instructional presentation with no questions on Explore/Teach slides

export const ANIMAL_BODY_PARTS_SLIDES = [

  // ── 1. HOOK ───────────────────────────────────────────────────────────────
  {
    id: 'hook',
    type: 'info',
    title: 'How Animals Move and Find Food',
    description:
      'Animals move from place to place in different ways — a dog walks on land, a bird flies through the air, and a chicken pecks the ground. ' +
      'Every animal has special body parts designed to help it find food, move around, and survive.',
    animations: [
      { src: '/static/animations/dog-walking.json', label: 'Dog walking' },
      { src: '/static/animations/bird-flying.json', label: 'Bird flying' },
      { src: '/static/animations/chicken-pecking.json', label: 'Chicken pecking' },
    ],
    illustrationBg: '#fef9c3',
  },

  // ── 2. PART 1: HEAD (OBSERVE -> TEACH) ────────────────────────────────────
  {
    id: 'explore-head',
    type: 'teach',
    title: 'The Head: Eyes & Mouth',
    description:
      'Look at the cow as it grazes. The head is where key sensory and eating parts are located. ' +
      'Its eyes watch the area for safety while its mouth grasps and chews food.',
    animations: [
      { src: '/static/animations/eating-cow.json', label: 'A cow' },
    ],
    partLabel: 'Head (Eyes & Mouth)',
    partBg: '#dbeafe',
    partIcon: 'bi-person-circle',
    keyFact: 'The head holds the eyes for seeing and the mouth for eating.',
    factBg: '#eff6ff',
  },
  {
    id: 'teach-head',
    type: 'teach',
    title: 'The Head: Seeing Food and Eating',
    description:
      'An animal\'s eyes allow it to spot food from far away and stay alert to predators. ' +
      'The mouth lets the animal bite, chew, and swallow food so its body gets energy.',
    animations: [
      { src: '/static/animations/dog eyes-mouth.json', label: 'Head: Eyes & Mouth' },
    ],
    partLabel: 'Head & Senses',
    partBg: '#dbeafe',
    partIcon: 'bi-eye-fill',
    keyFact: 'Eyes spot food and danger, while the mouth picks up and eats food.',
    factBg: '#eff6ff',
  },

  // ── 3. PART 2: LEGS (OBSERVE -> TEACH) ────────────────────────────────────
  {
    id: 'explore-legs',
    type: 'teach',
    title: 'Legs: Moving Across Land',
    description:
      'Look at the fox moving across the meadow. Animals use their legs to support their body weight and travel over land. ' +
      'Different animals have legs adapted for walking, running, or climbing.',
    animations: [
      { src: '/static/animations/running-fox.json', label: 'A fox' },
    ],
    partLabel: 'Legs',
    partBg: '#dcfce7',
    partIcon: 'bi-arrows-move',
    keyFact: 'Legs support the animal\'s weight and allow movement on land.',
    factBg: '#f0fdf4',
  },
  {
    id: 'teach-legs',
    type: 'teach',
    title: 'Legs: Searching for Food and Staying Safe',
    description:
      'Legs allow animals to walk, run, and jump. When animals are hungry, they use their legs to roam and search for food. ' +
      'Strong legs also allow them to quickly run or leap away when danger approaches.',
    animations: [
      { src: '/static/animations/frog-jumping.json', label: 'Frog jumping' },
      { src: '/static/animations/walking-dog.json', label: 'Dog walking' },
    ],
    partLabel: 'Legs & Movement',
    partBg: '#dcfce7',
    partIcon: 'bi-person-walking',
    keyFact: 'Legs let animals walk, run, and jump to find food and escape danger.',
    factBg: '#f0fdf4',
  },

  // ── 4. PART 3: WINGS (OBSERVE -> TEACH) ───────────────────────────────────
  {
    id: 'explore-wings',
    type: 'teach',
    title: 'Wings: Moving Through the Air',
    description:
      'Look at the bird soaring smoothly in the sky. Wings are lightweight, wide structures attached to the sides of the body that generate lift in the air.',
    animations: [
      { src: '/static/animations/flying-bird.json', label: 'A bird' },
    ],
    partLabel: 'Wings',
    partBg: '#fce7f3',
    partIcon: 'bi-feather',
    keyFact: 'Wings are light, wide body parts that allow birds and insects to fly.',
    factBg: '#fdf2f8',
  },
  {
    id: 'teach-wings',
    type: 'teach',
    title: 'Wings: Flying to High Food and Safety',
    description:
      'Wings let animals fly to reach food in tall trees, high cliffs, and flowers that walking animals cannot reach on the ground. ' +
      'Wings also let birds take off quickly into the air to stay safe from land predators.',
    animations: [
      { src: '/static/animations/bird-flies.json', label: 'Bird wings in flight' },
    ],
    partLabel: 'Wings & Flight',
    partBg: '#fce7f3',
    partIcon: 'bi-feather',
    keyFact: 'Wings let animals fly to reach high food and escape land danger.',
    factBg: '#fdf2f8',
  },

  // ── 5. QUICK CHECKS (QUESTIONS ONLY APPEAR HERE) ─────────────────────────
  {
    id: 'check-head',
    type: 'quick-check',
    title: 'Quick Check: The Head',
    prompt: 'Which part of the head helps an animal SEE where food is?',
    options: [
      { id: 'eyes',  label: 'Eyes',  icon: 'bi-eye-fill',       isCorrect: true  },
      { id: 'tail',  label: 'Tail',  icon: 'bi-arrow-right',    isCorrect: false },
      { id: 'claws', label: 'Claws', icon: 'bi-lightning-fill', isCorrect: false },
    ],
    successMessage: 'Correct! Eyes allow animals to spot food and notice danger from afar.',
    retryMessage: 'Try again. Think about the sense organ used to look around.',
  },
  {
    id: 'check-legs',
    type: 'quick-check',
    title: 'Quick Check: Legs',
    prompt: 'What do legs help an animal do when it is hungry?',
    options: [
      { id: 'move',  label: 'Walk and run to find food', icon: 'bi-person-walking', isCorrect: true  },
      { id: 'sleep', label: 'Sleep in the shade',        icon: 'bi-moon-stars',     isCorrect: false },
      { id: 'fly',   label: 'Fly high into trees',       icon: 'bi-wind',           isCorrect: false },
    ],
    successMessage: 'Spot on! Legs allow the animal to move across land in search of food.',
    retryMessage: 'Not quite. Think about how legs are used to move around on the ground.',
  },
  {
    id: 'check-wings',
    type: 'quick-check',
    title: 'Quick Check: Wings',
    prompt: 'Why would a bird need wings to get food from a tall tree?',
    options: [
      { id: 'fly',   label: 'To fly up and reach high branches', icon: 'bi-feather', isCorrect: true  },
      { id: 'swim',  label: 'To swim under the soil',            icon: 'bi-water',   isCorrect: false },
      { id: 'dig',   label: 'To dig deep holes',                 icon: 'bi-tools',   isCorrect: false },
    ],
    successMessage: 'Great job! Wings allow birds to fly upward to reach food high above the ground.',
    retryMessage: 'Think again. Wings are specialized for moving through the air.',
  },

  // ── 6. DEEPEN THINKING ───────────────────────────────────────────────────
  {
    id: 'deepen',
    type: 'quick-check',
    title: 'Deepen Your Thinking: Other Adaptations',
    prompt:
      'A fish has NO legs and NO wings. How does it move through water to find food?',
    animations: [
      { src: '/static/animations/fish-swimming.json', label: 'Fish swimming' },
    ],
    illustrationBg: '#e0f2fe',
    options: [
      { id: 'fins',  label: 'It uses fins and its tail to swim', icon: 'bi-tsunami',        isCorrect: true  },
      { id: 'legs',  label: 'It grows temporary legs',           icon: 'bi-person-walking', isCorrect: false },
      { id: 'flies', label: 'It flies above the water',          icon: 'bi-wind',           isCorrect: false },
    ],
    successMessage:
      'Excellent thinking! Fish have fins and tails instead of legs or wings — different animals have different body parts suited for where they live.',
    retryMessage:
      'Think about what body structures a fish uses to propel itself in water.',
  },

  // ── 7. SUMMARY ───────────────────────────────────────────────────────────
  {
    id: 'summary',
    type: 'summary',
    title: 'Big Ideas — Animal Body Parts',
    bullets: [
      'The head has eyes (to see food and danger) and a mouth (to eat food).',
      'Legs help animals walk, run, and jump to move across land in search of food.',
      'Wings allow animals to fly to reach food in trees and escape from predators.',
      'Different animals have different body parts suited to where they live and survive.',
      'Every body part has a specific job that helps keep the animal alive.',
    ],
  },
];
