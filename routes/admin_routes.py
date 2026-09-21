from datetime import datetime, timedelta

from flask import Blueprint, render_template, request, redirect, url_for, flash
from sqlalchemy.exc import IntegrityError
from database.models import (
    db, AccessLog, User, AttemptLog, AttemptObjectLog,
    ProgressLog, LessonProgress, LessonAttemptLog,
    LessonAssignment, ActivityAssignment, UserBadge
)
from routes.utils import get_current_user, require_role, log_access

admin_bp = Blueprint('admin', __name__, url_prefix='/admin')

@admin_bp.route('/sync_clean_students_once')
def sync_clean_students_once():
    # 1. Clear child logs
    AttemptObjectLog.query.delete()
    for m in [AttemptLog, ProgressLog, LessonProgress, LessonAttemptLog, LessonAssignment, ActivityAssignment, UserBadge, AccessLog]:
        m.query.delete()

    # 2. Purge existing student/test accounts
    User.query.filter((User.role == 'student') | (User.username == 'test1')).delete(synchronize_session=False)
    db.session.commit()

    # 3. Create fresh accounts (Student 1, 2, 3)
    new_users = []
    for i in range(1, 4):
        u = User(name=f'Student {i}', username=f'student{i}', role='student')
        u.set_password('Student@123')
        new_users.append(u)
    db.session.add_all(new_users)
    db.session.commit()

    return """
    <div style="font-family:system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width:540px; margin:60px auto; padding:32px 28px; border:2.5px solid #22c55e; border-radius:20px; background:#f0fdf4; text-align:center; box-shadow:0 10px 25px rgba(34, 197, 94, 0.15);">
        <div style="width:54px; height:54px; border-radius:50%; background:#22c55e; color:#fff; font-size:28px; display:inline-flex; align-items:center; justify-content:center; margin-bottom:16px;">✓</div>
        <h2 style="color:#166534; margin:0 0 8px 0; font-size:22px; font-weight:800;">TiDB Cloud Database Synced!</h2>
        <p style="color:#334155; font-size:15px; margin:0 0 20px 0;">All old student attempts and logs were cleared. 3 fresh accounts are active.</p>
        <div style="background:#ffffff; border:1.5px solid #bbf7d0; border-radius:14px; padding:16px; text-align:left; margin-bottom:24px;">
            <p style="margin:0 0 8px 0; font-size:13px; font-weight:700; color:#15803d; text-transform:uppercase; letter-spacing:0.5px;">Active Student Accounts (Password: <code>Student@123</code>)</p>
            <ul style="margin:0; padding-left:20px; color:#1e293b; font-size:14px; line-height:1.8;">
                <li><strong>Student 1:</strong> <code>student1</code></li>
                <li><strong>Student 2:</strong> <code>student2</code></li>
                <li><strong>Student 3:</strong> <code>student3</code></li>
            </ul>
        </div>
        <a href="/auth/login" style="display:inline-block; padding:12px 28px; background:#16a34a; color:#ffffff; font-weight:700; font-size:15px; text-decoration:none; border-radius:12px; box-shadow:0 4px 12px rgba(22, 163, 74, 0.3);">Go to Login</a>
    </div>
    """

@admin_bp.route('/dashboard')
@require_role('admin')
def dashboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'admin_dashboard')
    users = User.query.all()
    week_ago = datetime.utcnow() - timedelta(days=7)
    online_threshold = datetime.utcnow() - timedelta(minutes=3)

    online_users = User.query.filter(
        User.role.in_(['teacher', 'student']),
        User.last_seen >= online_threshold
    ).order_by(User.name.asc()).all()

    dashboard_stats = {
        'total_users': len(users),
        'admin_count': sum(1 for user in users if user.role == 'admin'),
        'teacher_count': sum(1 for user in users if user.role == 'teacher'),
        'student_count': sum(1 for user in users if user.role == 'student'),
        'new_this_week': sum(1 for user in users if user.created_at and user.created_at >= week_ago),
        'online_count': len(online_users),
        'total_audit_logs': AccessLog.query.count()
    }

    return render_template(
        'admin/admin_dashboard.html',
        online_users=online_users,
        current_user=current_user,
        dashboard_stats=dashboard_stats,
        online_threshold=online_threshold
    )


@admin_bp.route('/users')
@require_role('admin')
def user_management():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'admin_user_management')
    online_threshold = datetime.utcnow() - timedelta(minutes=3)
    users = User.query.order_by(User.created_at.desc()).all()

    return render_template(
        'admin/admin_users.html',
        users=users,
        current_user=current_user,
        online_threshold=online_threshold
    )

@admin_bp.route('/create_user', methods=['POST'])
@require_role('admin')
def create_user():
    name = request.form['name'].strip()
    username = request.form['username'].strip()
    role = request.form['role']
    password = request.form['password']
    confirm_password = request.form['confirm_password']

    # Duplicate username check
    existing_user = User.query.filter(
        User.username == username
    ).first()
    if existing_user:
        flash("Username already exists. Please use a different username.", "danger")
        return redirect(url_for('admin.dashboard'))

    if password != confirm_password:
        flash("Passwords do not match!", "danger")
        return redirect(url_for('admin.dashboard'))

    if len(password) < 8 or password.isalnum():
        flash("Password must include special characters and be at least 8 characters long.", "danger")
        return redirect(url_for('admin.dashboard'))

    try:
        user = User(name=name, username=username, role=role)
        user.set_password(password)
        db.session.add(user)
        db.session.commit()
        flash("User created successfully!", "success")
    except IntegrityError:
        db.session.rollback()
        flash("Username already exists. Please use a different username.", "danger")

    return redirect(url_for('admin.user_management'))

@admin_bp.route('/update_user/<int:user_id>', methods=['POST'])
@require_role('admin')
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        flash("User not found.", "warning")
        return redirect(url_for('admin.user_management'))

    new_name = request.form.get('name', '').strip()
    new_username = request.form.get('username', '').strip()
    new_role = request.form.get('role', '').strip()
    new_password = request.form.get('password', '').strip()

    if not new_name or not new_username:
        flash("Name and Username cannot be blank.", "danger")
        return redirect(url_for('admin.user_management'))

    try:
        user.name = new_name
        user.username = new_username
        if new_role in ['admin', 'teacher', 'student']:
            user.role = new_role
        if new_password:
            user.set_password(new_password)
        db.session.commit()
        flash(f"User '{user.name}' updated successfully!", "info")
    except IntegrityError:
        db.session.rollback()
        flash(f"Username '{new_username}' is already taken. Please choose a different username.", "danger")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to update user: {str(e)}", "danger")

    return redirect(url_for('admin.user_management'))

@admin_bp.route('/delete_user/<int:user_id>')
@require_role('admin')
def delete_user(user_id):
    user = User.query.get(user_id)
    if not user:
        flash("User not found.", "warning")
        return redirect(url_for('admin.user_management'))

    try:
        # Clean up related records to prevent foreign key integrity crash
        AccessLog.query.filter_by(user_id=user.id).delete(synchronize_session=False)
        UserBadge.query.filter_by(user_id=user.id).delete(synchronize_session=False)
        ProgressLog.query.filter_by(student_id=user.id).delete(synchronize_session=False)
        LessonProgress.query.filter_by(student_id=user.id).delete(synchronize_session=False)
        LessonAttemptLog.query.filter_by(student_id=user.id).delete(synchronize_session=False)
        LessonAssignment.query.filter((LessonAssignment.student_id == user.id) | (LessonAssignment.assigned_by == user.id)).delete(synchronize_session=False)
        ActivityAssignment.query.filter((ActivityAssignment.student_id == user.id) | (ActivityAssignment.assigned_by == user.id)).delete(synchronize_session=False)
        
        # Clean up attempt logs and their child object logs
        student_attempts = AttemptLog.query.filter_by(student_id=user.id).all()
        for att in student_attempts:
            AttemptObjectLog.query.filter_by(attempt_log_id=att.id).delete(synchronize_session=False)
        AttemptLog.query.filter_by(student_id=user.id).delete(synchronize_session=False)

        db.session.delete(user)
        db.session.commit()
        flash(f"User '{user.name}' deleted successfully.", "warning")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to delete user: {str(e)}", "danger")

    return redirect(url_for('admin.user_management'))

@admin_bp.route('/compliance')
@require_role('admin')
def compliance():
    from collections import defaultdict
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'admin_compliance')
    
    role_filter = request.args.get('role', 'all').lower()
    view_mode = request.args.get('view', 'compiled').lower()
    search_query = request.args.get('search', '').strip()
    page = request.args.get('page', 1, type=int)
    per_page = 20

    # Base query joining AccessLog and User
    query = db.session.query(AccessLog, User).join(
        User, User.id == AccessLog.user_id
    )

    start_date_str = request.args.get('start_date', '').strip()
    end_date_str = request.args.get('end_date', '').strip()

    # Apply role filter
    if role_filter in ('admin', 'teacher', 'student'):
        query = query.filter(User.role == role_filter)

    # Apply search filter (user name or username)
    if search_query:
        query = query.filter(
            (User.name.ilike(f'%{search_query}%')) | 
            (User.username.ilike(f'%{search_query}%'))
        )

    # Apply date range filter
    if start_date_str:
        try:
            s_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            query = query.filter(AccessLog.created_at >= s_date)
        except ValueError:
            pass

    if end_date_str:
        try:
            e_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            query = query.filter(AccessLog.created_at < e_date)
        except ValueError:
            pass

    raw_logs = query.order_by(AccessLog.created_at.desc()).all()

    # Build compiled user summary data
    user_compiled = defaultdict(lambda: {
        'user': None,
        'total_actions': 0,
        'last_active': None,
        'action_counts': defaultdict(int),
        'recent_logs': []
    })

    for log, u in raw_logs:
        uid = u.id
        if user_compiled[uid]['user'] is None:
            user_compiled[uid]['user'] = u
            user_compiled[uid]['last_active'] = log.created_at

        user_compiled[uid]['total_actions'] += 1
        user_compiled[uid]['action_counts'][log.event_type] += 1
        user_compiled[uid]['recent_logs'].append(log)

    compiled_users = list(user_compiled.values())
    compiled_users.sort(key=lambda x: x['last_active'] if x['last_active'] else x['user'].created_at, reverse=True)

    # Calculate role counts summary
    all_users = User.query.all()
    role_counts = {
        'all': len(all_users),
        'admin': sum(1 for u in all_users if u.role == 'admin'),
        'teacher': sum(1 for u in all_users if u.role == 'teacher'),
        'student': sum(1 for u in all_users if u.role == 'student'),
    }

    # Detailed pagination query for timeline mode returning AccessLog model instances
    detailed_query = AccessLog.query.join(User, User.id == AccessLog.user_id)
    if role_filter in ('admin', 'teacher', 'student'):
        detailed_query = detailed_query.filter(User.role == role_filter)
    if search_query:
        detailed_query = detailed_query.filter(
            (User.name.ilike(f'%{search_query}%')) | 
            (User.username.ilike(f'%{search_query}%'))
        )
    if start_date_str:
        try:
            s_date = datetime.strptime(start_date_str, '%Y-%m-%d')
            detailed_query = detailed_query.filter(AccessLog.created_at >= s_date)
        except ValueError:
            pass
    if end_date_str:
        try:
            e_date = datetime.strptime(end_date_str, '%Y-%m-%d') + timedelta(days=1)
            detailed_query = detailed_query.filter(AccessLog.created_at < e_date)
        except ValueError:
            pass

    detailed_pagination = detailed_query.order_by(AccessLog.created_at.desc()).paginate(page=page, per_page=per_page, error_out=False)

    return render_template(
        'admin/admin_compliance.html',
        current_user=current_user,
        compiled_users=compiled_users,
        access_logs=detailed_pagination.items,
        pagination=detailed_pagination,
        selected_role=role_filter,
        selected_view=view_mode,
        search_query=search_query,
        start_date=start_date_str,
        end_date=end_date_str,
        role_counts=role_counts
    )


@admin_bp.route('/clear_logs', methods=['POST'])
@require_role('admin')
def clear_logs():
    current_user = get_current_user()
    role_target = request.form.get('role_target', 'all').lower()

    try:
        if role_target in ('admin', 'teacher', 'student'):
            user_ids = [u.id for u in User.query.filter_by(role=role_target).all()]
            if user_ids:
                deleted_count = AccessLog.query.filter(AccessLog.user_id.in_(user_ids)).delete(synchronize_session=False)
                db.session.commit()
                log_access(current_user, 'clear_logs', f'target_role={role_target} count={deleted_count}')
                flash(f"Successfully cleared {deleted_count} logs for {role_target.capitalize()} users.", "success")
            else:
                flash(f"No logs found for {role_target.capitalize()} users.", "info")
        else:
            deleted_count = AccessLog.query.delete(synchronize_session=False)
            db.session.commit()
            log_access(current_user, 'clear_logs', f'target=all count={deleted_count}')
            flash(f"Successfully cleared all {deleted_count} compliance access logs.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to clear logs: {str(e)}", "danger")

    return redirect(url_for('admin.compliance'))


@admin_bp.route('/clear_user_logs/<int:target_user_id>', methods=['POST'])
@require_role('admin')
def clear_user_logs(target_user_id):
    current_user = get_current_user()
    target_user = User.query.get(target_user_id)
    if not target_user:
        flash("User not found.", "warning")
        return redirect(url_for('admin.compliance'))

    try:
        deleted_count = AccessLog.query.filter_by(user_id=target_user_id).delete(synchronize_session=False)
        db.session.commit()
        log_access(current_user, 'clear_user_logs', f'target_user={target_user.username} count={deleted_count}')
        flash(f"Successfully cleared {deleted_count} logs for {target_user.name} (@{target_user.username}).", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to clear user logs: {str(e)}", "danger")

    return redirect(url_for('admin.compliance'))


