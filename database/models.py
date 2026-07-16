from flask_sqlalchemy import SQLAlchemy
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import datetime

db = SQLAlchemy()

class BaseModel(db.Model):
    __abstract__ = True
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    deleted_at = db.Column(db.DateTime, nullable=True)

    def soft_delete(self):
        self.deleted_at = datetime.utcnow()

class User(BaseModel):
    __tablename__ = 'user'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(50), nullable=False)
    email = db.Column(db.String(100), unique=True, nullable=False)
    role = db.Column(db.String(20), nullable=False)  # admin, teacher, student
    password_hash = db.Column(db.String(128), nullable=False)

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

class Activity(BaseModel):
    __tablename__ = 'activity'
    id = db.Column(db.Integer, primary_key=True)
    lesson_id = db.Column(db.Integer, db.ForeignKey('lesson.id'))
    type = db.Column(db.String(50))
    points = db.Column(db.Integer)
    lesson = db.relationship('Lesson', backref='activities')

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
    current_slide = db.Column(db.Integer, default=0)
    lesson = db.relationship('Lesson', backref='progress_logs')
    student = db.relationship('User', backref='lesson_progress_entries')


class ClassGroup(BaseModel):
    __tablename__ = 'class_group'
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text)
    teacher_id = db.Column(db.Integer, db.ForeignKey('user.id'))
    teacher = db.relationship('User', backref='classes')


class UserClass(BaseModel):
    __tablename__ = 'user_class'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    class_group_id = db.Column(db.Integer, db.ForeignKey('class_group.id'), nullable=False)
    role_in_class = db.Column(db.String(20), default='student')
    joined_at = db.Column(db.DateTime, default=datetime.utcnow)
    user = db.relationship('User', backref='class_memberships')
    class_group = db.relationship('ClassGroup', backref='members')


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
    points = db.Column(db.Integer, default=0)


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
    feedback = db.Column(db.Text)
    time_spent = db.Column(db.Integer, default=0)
    student = db.relationship('User', backref='attempt_logs')
    activity = db.relationship('Activity', backref='attempt_logs')


class ActivityFeedback(BaseModel):
    __tablename__ = 'activity_feedback'
    id = db.Column(db.Integer, primary_key=True)
    progress_log_id = db.Column(db.Integer, db.ForeignKey('progress_log.id'), nullable=False)
    rating = db.Column(db.String(50))
    comments = db.Column(db.Text)
    hints = db.Column(db.Text)
    progress_log = db.relationship('ProgressLog', backref='feedback')


class AccessLog(BaseModel):
    __tablename__ = 'access_log'
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    event_type = db.Column(db.String(50), nullable=False)
    event_details = db.Column(db.Text)
    ip_address = db.Column(db.String(45))
    user_agent = db.Column(db.String(255))
    user = db.relationship('User', backref='access_logs')
