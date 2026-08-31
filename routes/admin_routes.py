from datetime import datetime, timedelta

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
    if user:
        user.name = request.form['name'].strip()
        if 'username' in request.form and request.form['username'].strip():
            user.username = request.form['username'].strip()
        user.role = request.form['role']
        if request.form.get('password'):
            user.set_password(request.form['password'])
        db.session.commit()
        flash("User updated successfully!", "info")
    return redirect(url_for('admin.user_management'))

@admin_bp.route('/delete_user/<int:user_id>')
@require_role('admin')
def delete_user(user_id):
    user = User.query.get(user_id)
    if user:
        AccessLog.query.filter_by(user_id=user.id).delete(synchronize_session=False)
        db.session.delete(user)
        db.session.commit()
        flash(f"User '{user.name}' deleted successfully.", "warning")
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
        deleted_count = AccessLog.query.delete()
        db.session.commit()
        log_access(current_user, 'clear_logs', f'target=all count={deleted_count}')
        flash(f"Successfully cleared all {deleted_count} compliance access logs.", "success")

    return redirect(url_for('admin.compliance'))


@admin_bp.route('/clear_user_logs/<int:target_user_id>', methods=['POST'])
@require_role('admin')
def clear_user_logs(target_user_id):
    current_user = get_current_user()
    target_user = User.query.get(target_user_id)
    if target_user:
        deleted_count = AccessLog.query.filter_by(user_id=target_user_id).delete(synchronize_session=False)
        db.session.commit()
        log_access(current_user, 'clear_user_logs', f'target_user={target_user.username} count={deleted_count}')
        flash(f"Successfully cleared {deleted_count} logs for {target_user.name} (@{target_user.username}).", "success")
    return redirect(url_for('admin.compliance'))

