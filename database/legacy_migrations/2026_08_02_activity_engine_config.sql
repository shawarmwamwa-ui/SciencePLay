-- Migration: activity engine/config + attempt_object_log
-- Target: MariaDB 10.4.x
-- Notes:
-- 1) Uses ALTER statements (no full table rewrite)
-- 2) Keeps existing data and foreign keys intact
-- 3) JSON is stored in a JSON column type (MariaDB validates as JSON alias)

START TRANSACTION;

-- 1) Add activity.engine to distinguish rendering engine from human-readable title
ALTER TABLE `activity`
  ADD COLUMN IF NOT EXISTS `engine` varchar(50) NULL AFTER `type`;

-- Backfill known existing claw machine row and any null/blank engine rows
UPDATE `activity`
SET `engine` = 'claw_machine'
WHERE `type` = 'Living vs Non-Living Claw Machine';

UPDATE `activity`
SET `engine` = 'claw_machine'
WHERE `engine` IS NULL OR TRIM(`engine`) = '';

-- Optional hardening: make engine required after backfill
ALTER TABLE `activity`
  MODIFY COLUMN `engine` varchar(50) NOT NULL;

-- Helpful lookup index for engine-based activity listing
ALTER TABLE `activity`
  ADD INDEX `ix_activity_engine` (`engine`);

-- 2) Add activity.config for engine-specific content
ALTER TABLE `activity`
  ADD COLUMN IF NOT EXISTS `config` JSON NULL AFTER `points`;

-- 3) Add normalized per-object attempt analytics table
CREATE TABLE IF NOT EXISTS `attempt_object_log` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attempt_log_id` int(11) NOT NULL,
  `object_id` varchar(100) NOT NULL,
  `was_correct` tinyint(1) NOT NULL,
  `attempt_number` int(11) NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `ix_attempt_object_log_attempt_log_id` (`attempt_log_id`),
  KEY `ix_attempt_object_log_object_id` (`object_id`),
  KEY `ix_attempt_object_log_was_correct` (`was_correct`),
  KEY `ix_attempt_object_log_attempt_number` (`attempt_number`),
  CONSTRAINT `attempt_object_log_ibfk_1`
    FOREIGN KEY (`attempt_log_id`) REFERENCES `attempt_log` (`id`)
    ON DELETE CASCADE
    ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Keep object attempts unique per attempt row + object + per-object attempt sequence
ALTER TABLE `attempt_object_log`
  ADD UNIQUE KEY `uq_attempt_object_log_attempt_object_number` (`attempt_log_id`, `object_id`, `attempt_number`);

COMMIT;
