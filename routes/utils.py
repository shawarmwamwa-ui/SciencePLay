from functools import wraps
from flask import session, flash, redirect, url_for
from flask_wtf.csrf import CSRFProtect
from database.models import db, User, AccessLog

csrf = CSRFProtect()


def get_current_user():
    user_id = session.get('user_id')
    if not user_id:
        return None
    return User.query.get(user_id)


def require_role(expected_role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            current_user = get_current_user()
            if not current_user:
                flash('Please log in to continue.', 'warning')
                return redirect(url_for('auth.login'))

            if current_user.role != expected_role:
                flash('Access not allowed for your role.', 'danger')
                if current_user.role == 'admin':
                    return redirect(url_for('admin.dashboard'))
                if current_user.role == 'teacher':
                    return redirect(url_for('teacher.dashboard'))
                return redirect(url_for('student.dashboard'))

            return fn(*args, **kwargs)
        return wrapper
    return decorator


def log_access(user, event_type, details=''):
    if not user:
        return
    try:
        log = AccessLog(user_id=user.id, event_type=event_type, event_details=details)
        db.session.add(log)
        db.session.commit()
    except Exception:
        db.session.rollback()
