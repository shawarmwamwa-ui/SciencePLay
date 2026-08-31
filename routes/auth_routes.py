from datetime import datetime
from flask import Blueprint, render_template, request, redirect, url_for, flash, session
from database.models import db, User
from routes.utils import log_access

auth_bp = Blueprint('auth', __name__, url_prefix='/auth')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username_input = request.form.get('username', '').strip()
        password = request.form.get('password', '')

        # Look up user by username or name
        user = User.query.filter(
            (User.username == username_input) | (User.name == username_input)
        ).first()

        if user and user.check_password(password):
            session['user_id'] = user.id
            session['role'] = user.role
            user.last_seen = datetime.utcnow()
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
            flash("Login successful.", "success")
            log_access(user, 'login', f'role={user.role}')

            # Redirect based on role
            if user.role == 'admin':
                return redirect(url_for('admin.dashboard'))
            elif user.role == 'teacher':
                return redirect(url_for('teacher.dashboard'))
            else:
                return redirect(url_for('student.dashboard'))
        else:
            flash("Invalid username or password.", "danger")
            return redirect(url_for('auth.login'))

    return render_template('auth/login.html')

@auth_bp.route('/logout')
def logout():
    from database.models import User
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            user.last_seen = None
            try:
                db.session.commit()
            except Exception:
                db.session.rollback()
        log_access(user, 'logout', f'role={session.get("role", "unknown")}')
    session.clear()
    flash("Logout successful.", "success")
    return redirect(url_for('auth.login'))
