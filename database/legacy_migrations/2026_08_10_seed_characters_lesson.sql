-- Migration: Seed "Characters of Living Things" lesson, hotspot content, and Function Match activity
-- Created: 2026-08-10
-- Notes: INSERT only — no schema changes, no DROP/ALTER on existing tables.

START TRANSACTION;

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Lesson row
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `lesson` (title, description, created_at, updated_at)
SELECT 'Characters of Living Things',
       'Discover the body parts of animals and plants and learn what each part does.',
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM `lesson` WHERE title = 'Characters of Living Things' AND deleted_at IS NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Published lesson content (hotspot-slide payload)
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `lesson_content` (lesson_id, version, status, payload, created_at, updated_at)
SELECT
    l.id,
    1,
    'published',
    '{"slides":[{"id":1,"title":"Parts of a Rabbit","illustration":"rabbit_diagram.png","hotspots":[{"id":"ears","label":"Ears","x":50,"y":12,"fact":"A rabbit uses its long ears to hear danger from far away. The ears can turn to catch sounds in every direction!","animation":"wiggle"},{"id":"eyes","label":"Eyes","x":62,"y":22,"fact":"Rabbits have eyes on the sides of their head so they can see almost all the way around them — helping them spot predators!","animation":"wiggle"},{"id":"nose","label":"Nose","x":60,"y":30,"fact":"A rabbit sniffs the air constantly to smell food and detect danger. Their nose twitches up to 120 times per minute!","animation":"wiggle"},{"id":"legs","label":"Legs","x":55,"y":75,"fact":"A rabbit'\''s powerful back legs let it hop fast and jump high to escape from predators. It can reach speeds of 56 km/h!","animation":"hop"},{"id":"fur","label":"Fur","x":35,"y":50,"fact":"Thick fur keeps the rabbit warm in winter and cool in summer. The colour of fur can also act as camouflage!","animation":"wiggle"}],"checkQuestion":{"prompt":"Which part helps a rabbit run away from danger quickly?","choices":["ears","legs","nose"],"correctId":"legs"}},{"id":2,"title":"Parts of a Sunflower","illustration":"sunflower_diagram.png","hotspots":[{"id":"flower","label":"Flower","x":50,"y":10,"fact":"The bright yellow petals attract bees and insects. When they visit, they carry pollen that helps the plant make seeds!","animation":"wiggle"},{"id":"leaves","label":"Leaves","x":30,"y":45,"fact":"Leaves capture sunlight and turn it into food through a process called photosynthesis. They are like the plant'\''s solar panels!","animation":"wiggle"},{"id":"stem","label":"Stem","x":50,"y":60,"fact":"The stem holds the plant upright and works like a straw, carrying water and food up from the roots to the leaves and flower.","animation":"wiggle"},{"id":"roots","label":"Roots","x":50,"y":88,"fact":"Roots anchor the plant in the soil and absorb water and minerals. Without roots, the plant would fall over and dry out!","animation":"wiggle"}],"checkQuestion":{"prompt":"Which part of the sunflower makes food from sunlight?","choices":["flower","stem","leaves"],"correctId":"leaves"}}]}',
    NOW(), NOW()
FROM `lesson` l
WHERE l.title = 'Characters of Living Things' AND l.deleted_at IS NULL
AND NOT EXISTS (
    SELECT 1 FROM `lesson_content` lc
    WHERE lc.lesson_id = l.id AND lc.status = 'published' AND lc.deleted_at IS NULL
);

-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Function Match activity
-- ─────────────────────────────────────────────────────────────────────────────
INSERT INTO `activity` (lesson_id, type, engine, points, config, created_at, updated_at)
SELECT
    l.id,
    'Characters of Living Things — Function Match',
    'match_pairs',
    20,
    '{"pairs":[{"id":"rabbit_ears","partName":"Rabbit Ears","partIcon":"🐰","functionText":"Hears danger from far away","explanation":"Long ears can rotate to catch sounds from every direction, giving rabbits an early warning of predators."},{"id":"rabbit_legs","partName":"Rabbit Legs","partIcon":"🦵","functionText":"Hops and runs fast","explanation":"Powerful hind legs launch the rabbit forward at up to 56 km/h — fast enough to escape most predators."},{"id":"rabbit_fur","partName":"Rabbit Fur","partIcon":"🧸","functionText":"Keeps the body warm","explanation":"Dense fur traps body heat in winter and can camouflage the rabbit against its surroundings."},{"id":"sunflower_leaves","partName":"Sunflower Leaves","partIcon":"🍃","functionText":"Makes food from sunlight","explanation":"Leaves contain chlorophyll which captures sunlight and converts it to energy through photosynthesis."},{"id":"sunflower_roots","partName":"Sunflower Roots","partIcon":"🌱","functionText":"Absorbs water from soil","explanation":"Roots anchor the plant and draw up water and nutrients needed for growth."},{"id":"sunflower_stem","partName":"Sunflower Stem","partIcon":"🌻","functionText":"Carries water to the flower","explanation":"The stem acts like a straw, transporting water and minerals from roots to leaves and flowers."}]}',
    NOW(), NOW()
FROM `lesson` l
WHERE l.title = 'Characters of Living Things' AND l.deleted_at IS NULL
AND NOT EXISTS (
    SELECT 1 FROM `activity` a
    WHERE a.lesson_id = l.id AND a.engine = 'match_pairs' AND a.deleted_at IS NULL
);

COMMIT;
