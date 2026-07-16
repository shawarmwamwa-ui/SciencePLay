from flask import Blueprint, render_template, request, redirect, url_for, flash
from sqlalchemy.exc import IntegrityError
from database.models import db, AccessLog, User
from routes.utils import get_current_user, require_role, log_access

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/dashboard')
@require_role('admin')
def dashboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'admin_dashboard')
    users = User.query.filter_by(deleted_at=None).all()

    users = User.query.filter_by(deleted_at=None).all()
    return render_template('admin/admin_dashboard.html', users=users, current_user=current_user)

@admin_bp.route('/create_user', methods=['POST'])
def create_user():
    name = request.form['name']
    email = request.form['email']
    role = request.form['role']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    # Duplicate email check
    existing_user = User.query.filter_by(email=email, deleted_at=None).first()
    if existing_user:
        flash("Email already exists. Please use a different email.", "danger")
        return redirect(url_for('admin.dashboard'))

    if password != confirm_password:
        flash("Passwords do not match!", "danger")
        return redirect(url_for('admin.dashboard'))

    if len(password) < 8 or password.isalnum():
        flash("Password must include special characters and be at least 8 characters long.", "danger")
        return redirect(url_for('admin.dashboard'))

    try:
        user = User(name=name, email=email, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash("User created successfully!", "success")
    except IntegrityError:
        db.session.rollback()
        flash("Email already exists. Please use a different email.", "danger")

    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/update_user/<int:user_id>', methods=['POST'])
def update_user(user_id):
    user = User.query.get(user_id)
    if user:
        user.name = request.form['name']
        user.email = request.form['email']
        user.role = request.form['role']
        if request.form['password']:
            user.set_password(request.form['password'])
        db.session.commit()
        flash("User updated successfully!", "info")
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/delete_user/<int:user_id>')
@require_role('admin')
def delete_user(user_id):
    user = User.query.get(user_id)
    if user:
        user.soft_delete()
        db.session.commit()
        flash("User soft deleted.", "warning")
    return redirect(url_for('admin.dashboard'))

@admin_bp.route('/compliance')
@require_role('admin')
def compliance():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'admin_compliance')
    access_logs = AccessLog.query.order_by(AccessLog.created_at.desc()).limit(100).all()
    return render_template('admin/admin_compliance.html', current_user=current_user, access_logs=access_logs)
