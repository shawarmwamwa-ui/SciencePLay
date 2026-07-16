from flask import Blueprint, render_template, flash, redirect, url_for, session, request, jsonify
from database.models import db, Lesson, Activity, ProgressLog, LessonProgress, User, LessonAssignment, ActivityAssignment, AttemptLog, UserBadge
from routes.utils import get_current_user, require_role, log_access
from types import SimpleNamespace
from datetime import datetime, time

student_bp = Blueprint('student', __name__, url_prefix='/student')


def get_or_create_default_lesson():
    lesson = Lesson.query.filter_by(title='Living vs Non-Living', deleted_at=None).first()
    if lesson:
        return lesson
    lesson = Lesson(
        title='Living vs Non-Living',
        description='Learn to distinguish between living and non-living things.'
    )
    db.session.add(lesson)
    db.session.commit()
    return lesson


def get_or_create_claw_machine_activity():
    lesson = get_or_create_default_lesson()
    activity = Activity.query.filter_by(
        lesson_id=lesson.id,
        type='Living vs Non-Living Claw Machine',
        deleted_at=None
    ).first()
    if activity:
        return activity

    activity = Activity(
        lesson_id=lesson.id,
        type='Living vs Non-Living Claw Machine',
        points=20
    )
    db.session.add(activity)
    db.session.commit()
    return activity


def get_attempts_today(student_id, activity_id):
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_end = datetime.combine(datetime.utcnow().date(), time.max)
    return AttemptLog.query.filter(
        AttemptLog.student_id == student_id,
        AttemptLog.activity_id == activity_id,
        AttemptLog.deleted_at == None,
        AttemptLog.created_at >= today_start,
        AttemptLog.created_at <= today_end
    ).count()

@student_bp.route('/dashboard')
@require_role('student')
def dashboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'student_dashboard')
    user_id = current_user.id
    lessons = Lesson.query.filter_by(deleted_at=None).all()
    activities = Activity.query.filter_by(deleted_at=None).all()
    progress_logs = []
    completed_by_activity = {}

    current_user = User.query.get(user_id) if user_id else None
    if user_id:
        progress_logs = ProgressLog.query.filter_by(student_id=user_id, deleted_at=None).all()
        completed_by_activity = {log.activity_id: log for log in progress_logs}

    completed_activities = len(completed_by_activity)
    total_activities = len(activities)
    student_progress = round((completed_activities / total_activities) * 100) if total_activities else 0
    total_score = sum((log.score or 0) for log in progress_logs)

    lesson_progress = []
    for lesson in lessons:
        lesson_activities = [activity for activity in activities if activity.lesson_id == lesson.id]
        completed = sum(1 for activity in lesson_activities if activity.id in completed_by_activity)
        percent = round((completed / len(lesson_activities)) * 100) if lesson_activities else 0
        lesson_progress.append({
            'lesson': lesson,
            'completed': completed,
            'total': len(lesson_activities),
            'percent': percent
        })

    return render_template(
        'student/student_dashboard.html',
        lessons=lessons,
        activities=activities,
        completed_by_activity=completed_by_activity,
        completed_activities=completed_activities,
        total_activities=total_activities,
        student_progress=student_progress,
        total_score=total_score,
        lesson_progress=lesson_progress,
        current_user=current_user,
    )

@student_bp.route('/lessons')
def lessons():
    user_id = session.get('user_id')
    lessons = Lesson.query.filter_by(deleted_at=None).all()
    activities = Activity.query.filter_by(deleted_at=None).all()
    progress_logs = []
    completed_by_activity = {}

    if user_id:
        progress_logs = ProgressLog.query.filter_by(student_id=user_id, deleted_at=None).all()
        completed_by_activity = {log.activity_id: log for log in progress_logs}

    lesson_progress = []
    for lesson in lessons:
        lesson_activities = [activity for activity in activities if activity.lesson_id == lesson.id]
        completed = sum(1 for activity in lesson_activities if activity.id in completed_by_activity)
        percent = round((completed / len(lesson_activities)) * 100) if lesson_activities else 0
        lesson_progress.append({
            'lesson': lesson,
            'completed': completed,
            'total': len(lesson_activities),
            'percent': percent
        })

    if not lesson_progress:
        # Fallback current lesson if no lessons are in the database yet.
        lesson_progress = [{
            'lesson': SimpleNamespace(title='Living vs Non-Living', description='Learn to distinguish between living and non-living things.'),
            'completed': 0,
            'total': 0,
            'percent': 0
        }]

    return render_template('student/lessons.html', lesson_progress=lesson_progress)

@student_bp.route('/lesson_progress', methods=['POST'])
def lesson_progress_api():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.get_json(silent=True) or request.form
    lesson_id = data.get('lesson_id')
    if lesson_id is None:
        return jsonify({'error': 'lesson_id is required'}), 400

    try:
        lesson_id = int(lesson_id)
        progress_percent = int(data.get('progress_percent', 0))
        current_slide = int(data.get('current_slide', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid numeric values'}), 400

    completed = str(data.get('completed')).lower() in ('true', '1', 'yes')
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404

    log = LessonProgress.query.filter_by(student_id=user_id, lesson_id=lesson_id, deleted_at=None).first()
    if log:
        log.progress_percent = progress_percent
        log.current_slide = current_slide
        log.completed = completed
    else:
        log = LessonProgress(
            student_id=user_id,
            lesson_id=lesson_id,
            progress_percent=progress_percent,
            current_slide=current_slide,
            completed=completed
        )
        db.session.add(log)
    db.session.commit()
    return jsonify({'status': 'ok'})

@student_bp.route('/activities')
@require_role('student')
def activities():
    current_user = get_current_user()
    user_id = current_user.id
    claw_machine_activity = get_or_create_claw_machine_activity()
    activities = Activity.query.filter_by(deleted_at=None).all()
    progress_logs = []
    completed_by_activity = {}
    attempts_today_by_activity = {
        claw_machine_activity.id: get_attempts_today(user_id, claw_machine_activity.id)
    }

    if user_id:
        progress_logs = ProgressLog.query.filter_by(student_id=user_id, deleted_at=None).all()
        completed_by_activity = {log.activity_id: log for log in progress_logs}

    return render_template(
        'student/activities.html',
        activities=activities,
        completed_by_activity=completed_by_activity,
        attempts_today_by_activity=attempts_today_by_activity,
    )

@student_bp.route('/activity_complete/<int:activity_id>/<int:score>')
def activity_complete(activity_id, score):
    user_id = session.get('user_id')
    if user_id:
        log = ProgressLog.query.filter_by(student_id=user_id, activity_id=activity_id, deleted_at=None).first()
        if log:
            log.score = score
            log.updated_at = db.func.now()
        else:
            log = ProgressLog(student_id=user_id, activity_id=activity_id, score=score, time_spent=0)
            db.session.add(log)
        db.session.commit()
        flash(f"Activity {activity_id} completed with score {score}!", "success")
    else:
        flash("You must be logged in to complete an activity.", "danger")
    return redirect(url_for('student.dashboard'))

@student_bp.route('/lesson/living-non-living')
def living_non_living_lesson():
    lesson = get_or_create_default_lesson()
    return render_template('student/living_non_living_lesson.html', lesson=lesson)

@student_bp.route('/claw_machine')
@require_role('student')
def claw_machine():
    activity = get_or_create_claw_machine_activity()
    return render_template('student/claw_machine_game.html', activity_id=activity.id)


@student_bp.route('/activity_attempts/<int:activity_id>')
@require_role('student')
def activity_attempts(activity_id):
    current_user = get_current_user()
    activity = Activity.query.filter_by(id=activity_id, deleted_at=None).first()
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404

    used = get_attempts_today(current_user.id, activity.id)
    return jsonify({'used': used, 'remaining': max(0, 3 - used), 'limit': 3})


@student_bp.route('/activity_progress', methods=['POST'])
@require_role('student')
def activity_progress():
    current_user = get_current_user()
    data = request.get_json(silent=True) or request.form

    try:
        activity_id = int(data.get('activity_id'))
        score = int(data.get('score'))
        attempts = int(data.get('attempts'))
        time_spent = int(data.get('time_spent'))
        correct_first_try = int(data.get('correct_first_try'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid activity progress values'}), 400

    if attempts < 0 or time_spent < 0 or correct_first_try < 0:
        return jsonify({'error': 'Progress values cannot be negative'}), 400

    activity = Activity.query.filter_by(id=activity_id, deleted_at=None).first()
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404

    attempts_today = get_attempts_today(current_user.id, activity.id)

    if attempts_today >= 3:
        return jsonify({
            'error': "You've reached today's attempt limit — try again tomorrow."
        }), 403

    progress_log = ProgressLog.query.filter_by(
        student_id=current_user.id,
        activity_id=activity.id,
        deleted_at=None
    ).first()
    if progress_log:
        if score > (progress_log.score or 0):
            progress_log.score = score
            progress_log.time_spent = time_spent
    else:
        progress_log = ProgressLog(
            student_id=current_user.id,
            activity_id=activity.id,
            score=score,
            time_spent=time_spent
        )
        db.session.add(progress_log)

    attempt = AttemptLog(
        student_id=current_user.id,
        activity_id=activity.id,
        attempt_number=attempts_today + 1,
        score=score,
        result='completed',
        feedback=f'Correct on first try: {correct_first_try}; object attempts: {attempts}',
        time_spent=time_spent
    )
    db.session.add(attempt)
    db.session.commit()
    print(
        f'Claw machine saved: student_id={current_user.id} '
        f'activity_id={activity.id} score={score} '
        f'attempt_number={attempt.attempt_number}'
    )
    log_access(current_user, 'activity_progress', f'activity_id={activity.id} attempt_number={attempt.attempt_number}')

    return jsonify({'status': 'ok', 'score': score, 'best_score': progress_log.score})


@student_bp.route('/assignments')
@require_role('student')
def assignments():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'student_assignments')
    lesson_assignments = LessonAssignment.query.filter_by(student_id=current_user.id, deleted_at=None).all()
    activity_assignments = ActivityAssignment.query.filter_by(student_id=current_user.id, deleted_at=None).all()
    return render_template('student/student_assignments.html', current_user=current_user, lesson_assignments=lesson_assignments, activity_assignments=activity_assignments)


@student_bp.route('/activity_attempt', methods=['POST'])
@require_role('student')
def activity_attempt():
    current_user = get_current_user()
    activity_id = request.form.get('activity_id')
    score = int(request.form.get('score', 0))
    feedback_text = request.form.get('feedback', '')
    attempts_today = AttemptLog.query.filter_by(student_id=current_user.id, activity_id=activity_id, deleted_at=None).count()
    attempt_number = attempts_today + 1
    attempt = AttemptLog(student_id=current_user.id, activity_id=activity_id, attempt_number=attempt_number, score=score, feedback=feedback_text)
    db.session.add(attempt)
    db.session.commit()
    log_access(current_user, 'activity_attempt', f'activity_id={activity_id} attempt_number={attempt_number}')
    flash('Activity attempt recorded.', 'success')
    return redirect(url_for('student.activities'))


@student_bp.route('/badges')
@require_role('student')
def badges():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'student_badges')
    badges = UserBadge.query.filter_by(user_id=current_user.id, deleted_at=None).all()
    return render_template('student/student_badges.html', current_user=current_user, badges=badges)
