-- Migration: 2026_08_11_seed_parts_lesson.sql
-- Hard-delete "Characters of Living Things" content and seed "Parts of an Animal"
-- Run order: dependent rows first, then parents.
-- Created: 2026-08-11

START TRANSACTION;

-- ─── Step 1: Remove dependent rows (FK order) ────────────────────────────────

-- 1a. Granular object logs (ON DELETE CASCADE fires too, but explicit is safe)
DELETE aol FROM attempt_object_log aol
  JOIN attempt_log al ON al.id = aol.attempt_log_id
  JOIN activity a ON a.id = al.activity_id
  JOIN lesson l ON l.id = a.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1b. Attempt logs
DELETE al FROM attempt_log al
  JOIN activity a ON a.id = al.activity_id
  JOIN lesson l ON l.id = a.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1c. Activity feedback (linked via progress_log)
DELETE af FROM activity_feedback af
  JOIN progress_log pl ON pl.id = af.progress_log_id
  JOIN activity a ON a.id = pl.activity_id
  JOIN lesson l ON l.id = a.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1d. Progress logs
DELETE pl FROM progress_log pl
  JOIN activity a ON a.id = pl.activity_id
  JOIN lesson l ON l.id = a.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1e. Activity assignments
DELETE aa FROM activity_assignment aa
  JOIN activity a ON a.id = aa.activity_id
  JOIN lesson l ON l.id = a.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1f. Lesson assignments
DELETE la FROM lesson_assignment la
  JOIN lesson l ON l.id = la.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1g. Lesson progress
DELETE lp FROM lesson_progress lp
  JOIN lesson l ON l.id = lp.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1h. Activities
DELETE a FROM activity a
  JOIN lesson l ON l.id = a.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1i. Lesson content
DELETE lc FROM lesson_content lc
  JOIN lesson l ON l.id = lc.lesson_id
 WHERE l.title = 'Characters of Living Things';

-- 1j. Lesson (parent row — must be last)
DELETE FROM lesson WHERE title = 'Characters of Living Things';

-- ─── Step 2: Seed new Lesson ──────────────────────────────────────────────────
INSERT INTO `lesson` (title, description, created_at, updated_at)
SELECT 'Parts of an Animal',
       'Tap each body part to discover what it does, then test what you learned!',
       NOW(), NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM `lesson` WHERE title = 'Parts of an Animal'
);

-- ─── Step 3: Seed LessonContent (published hotspot payload) ──────────────────
INSERT INTO `lesson_content` (lesson_id, version, status, payload, created_at, updated_at)
SELECT
    l.id,
    1,
    'published',
    '{"slides":[{"id":1,"title":"Parts of an Animal","illustration":"rabbit_diagram.svg","hotspots":[{"id":"leg","label":"Leg","x":62,"y":74,"icon":"leg_icon.svg","fact":"Legs help this rabbit hop and run to find food and escape danger!","animation":"hop"},{"id":"ear","label":"Ear","x":40,"y":12,"icon":"ear_icon.svg","fact":"Big ears help the rabbit hear danger coming from far away.","animation":"wiggle"}],"checkQuestion":{"prompt":"Which part helps a rabbit hop away fast?","choices":["leg","ear","tail"],"correctId":"leg"}}]}',
    NOW(), NOW()
FROM `lesson` l
WHERE l.title = 'Parts of an Animal'
AND NOT EXISTS (
    SELECT 1 FROM `lesson_content` lc
    WHERE lc.lesson_id = l.id AND lc.status = 'published'
);

-- ─── Step 4: Seed Activity (part_dash engine) ─────────────────────────────────
INSERT INTO `activity` (lesson_id, type, engine, points, config, created_at, updated_at)
SELECT
    l.id,
    'Parts of an Animal \u2014 Make Your Animal',
    'part_dash',
    20,
    '{"targetAnimal":"Rabbit","correctParts":[{"id":"bunny_head","label":"Head","icon":"bunny_head.svg"},{"id":"bunny_body","label":"Body","icon":"bunny_body.svg"}],"decoyParts":[{"id":"chicken_body","label":"Body","icon":"chicken_body.svg"},{"id":"owl_head","label":"Head","icon":"owl_head.svg"}],"lives":3}',
    NOW(), NOW()
FROM `lesson` l
WHERE l.title = 'Parts of an Animal'
AND NOT EXISTS (
    SELECT 1 FROM `activity` a
    WHERE a.lesson_id = l.id AND a.engine = 'part_dash'
);

COMMIT;

-- ─── Verification SELECT (run after commit) ───────────────────────────────────
SELECT
    l.id          AS lesson_id,
    l.title       AS lesson_title,
    lc.id         AS content_id,
    lc.status     AS content_status,
    a.id          AS activity_id,
    a.engine      AS activity_engine,
    a.type        AS activity_type
FROM lesson l
LEFT JOIN lesson_content lc ON lc.lesson_id = l.id AND lc.deleted_at IS NULL
LEFT JOIN activity a        ON a.lesson_id  = l.id AND a.deleted_at  IS NULL
WHERE l.title = 'Parts of an Animal';
