from flask import Blueprint, render_template, request, flash, redirect, url_for
from database.models import db, Lesson, Activity, User, ProgressLog, ClassGroup, UserClass, LessonAssignment, ActivityAssignment, AttemptLog, UserBadge
from routes.utils import get_current_user, require_role, log_access

teacher_bp = Blueprint('teacher', __name__, url_prefix='/teacher')

@teacher_bp.route('/dashboard')
@require_role('teacher')
def dashboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_dashboard')

    lessons = Lesson.query.filter_by(deleted_at=None).all()
    activities = Activity.query.filter_by(deleted_at=None).all()
    student_count = User.query.filter_by(role='student', deleted_at=None).count()
    progress_logs = ProgressLog.query.filter_by(deleted_at=None).all()
    avg_progress = 0
    if progress_logs:
        total_score = sum((log.score or 0) for log in progress_logs)
        avg_progress = min(100, round((total_score / (len(progress_logs) * 10)) * 100))

    top_students = db.session.query(
        User.name.label('name'),
        db.func.sum(ProgressLog.score).label('total_score')
    ).join(ProgressLog, User.id == ProgressLog.student_id).filter(
        User.role == 'student',
        User.deleted_at == None,
        ProgressLog.deleted_at == None
    ).group_by(User.id).order_by(db.desc('total_score')).limit(5).all()

    recent_activity = db.session.query(
        ProgressLog,
        User.name.label('student_name'),
        Activity.type.label('activity_type')
    ).join(User, User.id == ProgressLog.student_id).join(Activity, Activity.id == ProgressLog.activity_id).filter(
        ProgressLog.deleted_at == None
    ).order_by(ProgressLog.created_at.desc()).limit(5).all()

    return render_template(
        'teacher/teacher_dashboard.html',
        lessons=lessons,
        activities=activities,
        student_count=student_count,
        avg_progress=avg_progress,
        badges_count=0,
        top_students=top_students,
        recent_activity=recent_activity,
        current_user=current_user
    )

@teacher_bp.route('/create_lesson', methods=['POST'])
def create_lesson():
    title = request.form['title']
    description = request.form['description']
    lesson = Lesson(title=title, description=description)
    db.session.add(lesson)
    db.session.commit()
    flash("Lesson created successfully!", "success")
    return redirect(url_for('teacher.dashboard'))

@teacher_bp.route('/create_activity', methods=['POST'])
def create_activity():
    lesson_id = request.form['lesson_id']
    activity_type = request.form['type']
    points = request.form.get('points', 0) or 0
    activity = Activity(lesson_id=lesson_id, type=activity_type, points=int(points))
    db.session.add(activity)
    db.session.commit()
    flash("Activity created successfully!", "success")
    return redirect(url_for('teacher.dashboard'))

@teacher_bp.route('/delete_lesson/<int:lesson_id>')
def delete_lesson(lesson_id):
    lesson = Lesson.query.get(lesson_id)
    if lesson:
        lesson.soft_delete()
        db.session.commit()
        flash("Lesson soft deleted.", "warning")
    return redirect(url_for('teacher.dashboard'))

@teacher_bp.route('/delete_activity/<int:activity_id>')
def delete_activity(activity_id):
    activity = Activity.query.get(activity_id)
    if activity:
        activity.soft_delete()
        db.session.commit()
        flash("Activity soft deleted.", "warning")
    return redirect(url_for('teacher.dashboard'))


@teacher_bp.route('/assignments')
@require_role('teacher')
def assignments():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_assignments')
    lesson_assignments = LessonAssignment.query.filter_by(deleted_at=None).all()
    activity_assignments = ActivityAssignment.query.filter_by(deleted_at=None).all()
    return render_template('teacher/teacher_assignments.html', current_user=current_user, lesson_assignments=lesson_assignments, activity_assignments=activity_assignments)


@teacher_bp.route('/assign_lesson', methods=['POST'])
@require_role('teacher')
def assign_lesson():
    current_user = get_current_user()
    lesson_id = request.form['lesson_id']
    student_id = request.form['student_id']
    due_date = request.form.get('due_date')
    assignment = LessonAssignment(lesson_id=lesson_id, student_id=student_id, assigned_by=current_user.id, due_date=due_date)
    db.session.add(assignment)
    db.session.commit()
    log_access(current_user, 'assign_lesson', f'lesson_id={lesson_id} student_id={student_id}')
    flash('Lesson assigned successfully.', 'success')
    return redirect(url_for('teacher.assignments'))


@teacher_bp.route('/assign_activity', methods=['POST'])
@require_role('teacher')
def assign_activity():
    current_user = get_current_user()
    activity_id = request.form['activity_id']
    student_id = request.form['student_id']
    due_date = request.form.get('due_date')
    assignment = ActivityAssignment(activity_id=activity_id, student_id=student_id, assigned_by=current_user.id, due_date=due_date)
    db.session.add(assignment)
    db.session.commit()
    log_access(current_user, 'assign_activity', f'activity_id={activity_id} student_id={student_id}')
    flash('Activity assigned successfully.', 'success')
    return redirect(url_for('teacher.assignments'))


@teacher_bp.route('/analytics')
@require_role('teacher')
def analytics():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_analytics')
    assignments = LessonAssignment.query.filter_by(deleted_at=None).all()
    activity_attempts = AttemptLog.query.filter_by(deleted_at=None).all()
    return render_template('teacher/teacher_analytics.html', current_user=current_user, assignments=assignments, activity_attempts=activity_attempts)
