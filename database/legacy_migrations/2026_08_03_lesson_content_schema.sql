-- Migration: add lesson content storage for multi-slide studio drafts/published lessons
START TRANSACTION;

CREATE TABLE IF NOT EXISTS `lesson_content` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `lesson_id` int(11) NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `status` varchar(20) NOT NULL DEFAULT 'draft',
  `payload` longtext NOT NULL,
  `created_at` datetime DEFAULT current_timestamp(),
  `updated_at` datetime DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  `deleted_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `lesson_id` (`lesson_id`),
  CONSTRAINT `lesson_content_ibfk_1` FOREIGN KEY (`lesson_id`) REFERENCES `lesson` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

COMMIT;