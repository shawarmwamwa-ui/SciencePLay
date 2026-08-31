ALTER TABLE lesson
ADD COLUMN prerequisite_lesson_id INT NULL,
ADD CONSTRAINT fk_lesson_prerequisite
    FOREIGN KEY (prerequisite_lesson_id)
    REFERENCES lesson(id)
    ON DELETE SET NULL;
