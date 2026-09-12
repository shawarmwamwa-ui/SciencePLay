from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class BaseModel(db.Model):
    __abstract__ = True
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)


class User(BaseModel):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    username = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, teacher, student
    password_hash = db.Column(db.String(128), nullable=False)
    last_seen = db.Column(db.DateTime, nullable=True)

    def set_password(self, password):
        # enforce strong hashing method
        self.password_hash = generate_password_hash(password, method="pbkdf2:sha256")

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

class Lesson(BaseModel):
    __tablename__ = 'lesson'
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    prerequisite_lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=True)

class Activity(BaseModel):
    __tablename__ = 'activity'
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'))
    type = db.Column(db.String(50))
    engine = db.Column(db.String(50), nullable=True)
    points = db.Column(db.Integer)
    config = db.Column(db.JSON, nullable=True)
    lesson = db.relationship('Lesson', backref='activities')


class LessonContent(BaseModel):
    __tablename__ = 'lesson_content'
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    version = db.Column(db.Integer, default=1)
    status = db.Column(db.String(20), default='draft')
    payload = db.Column(db.Text, nullable=False)
    lesson = db.relationship('Lesson', backref='content_versions')


class ProgressLog(BaseModel):
    __tablename__ = 'progress_log'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'))
    score = db.Column(db.Integer)
    time_spent = db.Column(db.Integer)

class LessonProgress(BaseModel):
    __tablename__ = 'lesson_progress'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'))
    progress_percent = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    current_slide = db.Column(db.Integer, default=0)
    time_spent = db.Column(db.Integer, default=0)
    initial_time_spent = db.Column(db.Integer, default=0)
    total_time_spent = db.Column(db.Integer, default=0)
    revisit_count = db.Column(db.Integer, default=0)
    lesson = db.relationship('Lesson', backref='progress_logs')
    student = db.relationship('User', backref='lesson_progress_entries')


class LessonAttemptLog(BaseModel):
    __tablename__ = 'lesson_attempt_log'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    attempt_number = db.Column(db.Integer, nullable=False, default=1)
    time_spent = db.Column(db.Integer, default=0)
    completed = db.Column(db.Boolean, default=False)
    progress_percent = db.Column(db.Integer, default=0)
    student = db.relationship('User', backref='lesson_attempt_logs')
    lesson = db.relationship('Lesson', backref='lesson_attempt_logs')


class LessonAssignment(BaseModel):
    __tablename__ = 'lesson_assignment'
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(30), default='assigned')
    notes = db.Column(db.Text)
    lesson = db.relationship('Lesson', backref='assignments')
    student = db.relationship('User', foreign_keys=[student_id], backref='lesson_assignments')
    assigned_by_user = db.relationship('User', foreign_keys=[assigned_by])


class ActivityAssignment(BaseModel):
    __tablename__ = 'activity_assignment'
    id = db.Column(db.Integer, primary_key=True)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_by = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    assigned_at = db.Column(db.DateTime, default=datetime.utcnow)
    due_date = db.Column(db.DateTime)
    status = db.Column(db.String(30), default='assigned')
    activity = db.relationship('Activity', backref='assignments')
    student = db.relationship('User', foreign_keys=[student_id], backref='activity_assignments')
    assigned_by_user = db.relationship('User', foreign_keys=[assigned_by])


class Badge(BaseModel):
    __tablename__ = 'badge'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    icon = db.Column(db.String(255))


class UserBadge(BaseModel):
    __tablename__ = 'user_badge'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    badge_id = db.Column(db.Integer, db.ForeignKey('badge.id'), nullable=False)
    awarded_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='badges')
    badge = db.relationship('Badge', backref='earned_by')


class AttemptLog(BaseModel):
    __tablename__ = 'attempt_log'
    id = db.Column(db.Integer, primary_key=True)
    student_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    activity_id = db.Column(db.Integer, db.ForeignKey('activity.id'), nullable=False)
    attempt_number = db.Column(db.Integer, nullable=False)
    score = db.Column(db.Integer)
    result = db.Column(db.String(50))
    rating = db.Column(db.String(50), nullable=True)
    hints = db.Column(db.Text, nullable=True)
    feedback = db.Column(db.Text)
    teacher_feedback = db.Column(db.Text, nullable=True)
    time_spent = db.Column(db.Integer, default=0)
    student = db.relationship('User', backref='attempt_logs')
    activity = db.relationship('Activity', backref='attempt_logs')


class AttemptObjectLog(db.Model):
    __tablename__ = 'attempt_object_log'
    id = db.Column(db.Integer, primary_key=True)
    attempt_log_id = db.Column(db.Integer, db.ForeignKey('attempt_log.id', ondelete='CASCADE'), nullable=False)
    object_id = db.Column(db.String(100), nullable=False)
    was_correct = db.Column(db.Boolean, nullable=False)
    attempt_number = db.Column(db.Integer, nullable=False)
    created_at = db.Column(db.DateTime, server_default=db.func.now())

    attempt_log = db.relationship('AttemptLog', backref=db.backref('object_logs', lazy=True, cascade='all, delete-orphan'))


class AccessLog(BaseModel):
    __tablename__ = 'access_log'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    event_details = db.Column(db.Text)
    user = db.relationship('User', backref='access_logs')
