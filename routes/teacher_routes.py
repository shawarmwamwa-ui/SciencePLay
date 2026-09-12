import json
from datetime import datetime, timedelta
from pathlib import Path

from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify
from database.models import db, Lesson, Activity, User, ProgressLog, LessonAssignment, ActivityAssignment, AttemptLog, UserBadge, LessonProgress, LessonAttemptLog, Badge, LessonContent, AttemptObjectLog
from routes.utils import get_current_user, require_role, log_access, csrf

teacher_bp = Blueprint('teacher', __name__, url_prefix='/teacher')


@teacher_bp.context_processor
def inject_teacher_nav_globals():
    """Provides needs_feedback_count globally across all teacher template sidebars"""
    current_user = get_current_user()
    if current_user and current_user.role == 'teacher':
        try:
            needs_count = db.session.query(AttemptLog).join(
                Activity, Activity.id == AttemptLog.activity_id
            ).join(
                User, User.id == AttemptLog.student_id
            ).filter(
                User.role == 'student',
                ~Activity.engine.in_(['quick_check', 'lesson']),
                ~Activity.type.ilike('%Quick Check%'),
                ~Activity.type.ilike('%Slide Questions%'),
                db.or_(AttemptLog.teacher_feedback == None, AttemptLog.teacher_feedback == '')
            ).count()
            return {'needs_feedback_count': needs_count}
        except Exception:
            return {'needs_feedback_count': 0}
    return {'needs_feedback_count': 0}


GAME_TYPE_PRESETS = [
    {
        'value': 'Living vs Non-Living Claw Machine',
        'label': 'Claw Machine',
        'description': 'Students grab and sort objects into the correct chute.',
        'points': 20,
        'badge_class': 'preset-claw'
    },
    {
        'value': 'Animal Body Parts — Find the Part',
        'label': 'Find the Part',
        'description': 'Match animal outer body parts to body zones on characters.',
        'points': 20,
        'badge_class': 'preset-hotspot'
    },
    {
        'value': 'Plant Parts — Streak Race',
        'label': 'Streak Race',
        'description': 'Answer plant part questions in a race to the finish line.',
        'points': 20,
        'badge_class': 'preset-trait'
    },
]


def get_lesson_total_slides(lesson):
    if not lesson:
        return 7
    title = getattr(lesson, 'title', '') or ''
    if 'Animal Body Parts' in title or 'Plant Parts' in title:
        return 12
    return 7


def format_time_duration(seconds):
    if not seconds:
        return "0s"
    mins, secs = divmod(int(seconds), 60)
    return f"{mins}m {secs}s" if mins > 0 else f"{secs}s"


def build_live_lesson_tracker(online_students_set=None):
    if online_students_set is None:
        online_threshold = datetime.utcnow() - timedelta(minutes=3)
        online_students_set = set(u.id for u in User.query.filter(User.role == 'student', User.last_seen >= online_threshold).all())

    lesson_progress_records = LessonProgress.query.join(
        User, User.id == LessonProgress.student_id
    ).filter(
        User.role == 'student'
    ).order_by(LessonProgress.updated_at.desc()).all()

    live_lesson_tracker = []
    for lp in lesson_progress_records:
        attempts = LessonAttemptLog.query.filter_by(
            student_id=lp.student_id, lesson_id=lp.lesson_id
        ).order_by(LessonAttemptLog.attempt_number.asc()).all()

        total_slides = get_lesson_total_slides(lp.lesson)
        curr = (lp.current_slide or 0) + 1
        revisit_count = lp.revisit_count or 0

        if attempts:
            first_att = attempts[0]
            first_time_str = format_time_duration(first_att.time_spent)
            latest_att = attempts[-1]
            latest_time_str = format_time_duration(latest_att.time_spent)
            tot_sec = sum((att.time_spent or 0) for att in attempts)
            tot_str = format_time_duration(tot_sec)

            if len(attempts) > 1:
                time_spent_display = (
                    f'<div class="d-flex flex-column gap-1">'
                    f'  <div class="d-flex flex-wrap gap-1 align-items-center">'
                    f'    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" title="First Visit (Initial)"><i class="bi bi-flag-fill me-1"></i>First: {first_time_str}</span>'
                    f'    <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1" title="Latest Revisit"><i class="bi bi-arrow-repeat me-1"></i>R{len(attempts)-1}: {latest_time_str}</span>'
                    f'  </div>'
                    f'  <div class="fw-bold text-dark small mt-1"><i class="bi bi-hourglass-split me-1 text-secondary"></i>Total: {tot_str}</div>'
                    f'</div>'
                )
            else:
                time_spent_display = (
                    f'<div class="d-flex flex-column gap-1">'
                    f'  <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-clock me-1 text-primary"></i>First: {first_time_str}</span>'
                    f'  <div class="small text-muted"><i class="bi bi-hourglass-split me-1"></i>Total: {tot_str}</div>'
                    f'</div>'
                )
        else:
            sec = lp.time_spent or 0
            init_sec = lp.initial_time_spent or sec
            tot_sec = lp.total_time_spent or (init_sec + (sec if revisit_count > 0 else 0))
            if revisit_count > 0:
                time_spent_display = (
                    f'<div class="d-flex flex-column gap-1">'
                    f'  <div class="d-flex flex-wrap gap-1 align-items-center">'
                    f'    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i class="bi bi-flag-fill me-1"></i>First: {format_time_duration(init_sec)}</span>'
                    f'    <span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-1"><i class="bi bi-arrow-repeat me-1"></i>Current: {format_time_duration(sec)}</span>'
                    f'  </div>'
                    f'  <div class="fw-bold text-dark small mt-1"><i class="bi bi-hourglass-split me-1 text-secondary"></i>Total: {format_time_duration(tot_sec)}</div>'
                    f'</div>'
                )
            else:
                time_spent_display = (
                    f'<div class="d-flex flex-column gap-1">'
                    f'  <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-clock me-1 text-primary"></i>First: {format_time_duration(sec)}</span>'
                    f'  <div class="small text-muted"><i class="bi bi-hourglass-split me-1"></i>Total: {format_time_duration(sec)}</div>'
                    f'</div>'
                )

        is_completed = False
        is_revisit = False
        revisit_num = 0

        curr_slide = (lp.current_slide or 0) + 1

        if attempts:
            latest_attempt = attempts[-1]
            is_completed = bool(latest_attempt.completed)
            if latest_attempt.attempt_number > 1:
                is_revisit = True
                revisit_num = latest_attempt.attempt_number - 1
            if is_completed:
                pct = 100
            else:
                att_pct = getattr(latest_attempt, 'progress_percent', None)
                if att_pct is not None and 0 < att_pct < 100:
                    pct = att_pct
                else:
                    pct = min(int(round((curr_slide / max(total_slides, 1)) * 100)), 99)
                    pct = max(pct, 1 if curr_slide > 0 else 0)
        else:
            is_completed = bool(lp.completed)
            is_revisit = (revisit_count > 0)
            revisit_num = revisit_count
            if is_completed:
                pct = 100
            else:
                if lp.progress_percent is not None and 0 < lp.progress_percent < 100:
                    pct = lp.progress_percent
                else:
                    pct = min(int(round((curr_slide / max(total_slides, 1)) * 100)), 99)
                    pct = max(pct, 1 if curr_slide > 0 else 0)

        if is_completed:
            status_text = 'Completed'
            status_badge_class = 'bg-success text-white'
            bar_color = 'bg-success'
            text_color = 'text-success'
            tooltip_title = f"Completed ({pct}%)"
        elif is_revisit:
            status_text = f'In Progress (Revisit #{revisit_num})'
            status_badge_class = 'bg-warning text-dark'
            bar_color = 'bg-primary'
            text_color = 'text-primary'
            tooltip_title = f"Revisit #{revisit_num} · Slide {curr_slide} of {total_slides} ({pct}%)"
        else:
            status_text = 'In Progress'
            status_badge_class = 'bg-warning text-dark'
            bar_color = 'bg-primary'
            text_color = 'text-primary'
            tooltip_title = f"Slide {curr_slide} of {total_slides} ({pct}%)"

        progress_bar_display = (
            f'<div class="d-flex align-items-center gap-2" style="min-width: 140px;" title="{tooltip_title}">'
            f'  <div class="progress flex-grow-1" style="height: 8px; border-radius: 6px; background-color: #e2e8f0;">'
            f'    <div class="progress-bar {bar_color}" role="progressbar" style="width: {pct}%; border-radius: 6px;" '
            f'aria-valuenow="{pct}" aria-valuemin="0" aria-valuemax="100"></div>'
            f'  </div>'
            f'  <span class="fw-bold {text_color} small" style="min-width: 38px;">{pct}%</span>'
            f'</div>'
        )

        history_url = url_for('teacher.lesson_history', student_id=lp.student_id, lesson_id=lp.lesson_id)
        if revisit_count > 0 or len(attempts) > 1:
            revisit_display = (
                f'<a href="{history_url}" class="btn btn-sm btn-outline-info rounded-pill px-3 py-1 fw-semibold text-nowrap">'
                f'<i class="bi bi-arrow-repeat me-1"></i>View History ({max(revisit_count, len(attempts)-1)}x) <i class="bi bi-chevron-right ms-1"></i></a>'
            )
        else:
            revisit_display = (
                f'<a href="{history_url}" class="btn btn-sm btn-outline-secondary rounded-pill px-3 py-1 fw-semibold text-nowrap">'
                f'<i class="bi bi-clock-history me-1"></i>First Visit <i class="bi bi-chevron-right ms-1"></i></a>'
            )

        live_lesson_tracker.append({
            'student_id': lp.student_id,
            'student_name': lp.student.name if lp.student else f'Student #{lp.student_id}',
            'student_username': lp.student.username if lp.student else '',
            'is_online': lp.student_id in online_students_set,
            'lesson_title': lp.lesson.title if lp.lesson else f'Lesson #{lp.lesson_id}',
            'status': status_text,
            'status_badge_class': status_badge_class,
            'progress_percent': pct,
            'current_slide_display': progress_bar_display,
            'progress_bar_display': progress_bar_display,
            'time_spent_display': time_spent_display,
            'revisit_display': revisit_display
        })

    return live_lesson_tracker




def load_teacher_object_library():
    config_file = Path(__file__).resolve().parent.parent / 'static' / 'data' / 'sortingActivities.json'
    if not config_file.exists():
        return []

    try:
        with config_file.open('r', encoding='utf-8') as file:
            configs = json.load(file)
    except (json.JSONDecodeError, OSError):
        return []

    default_config = configs.get('default') if isinstance(configs, dict) else None
    objects = default_config.get('objects', []) if isinstance(default_config, dict) else []
    bins = default_config.get('bins', []) if isinstance(default_config, dict) else []
    bin_labels = {bin_entry.get('id'): bin_entry.get('label') for bin_entry in bins if isinstance(bin_entry, dict)}

    library = []
    for idx, object_entry in enumerate(objects):
        if not isinstance(object_entry, dict):
            continue
        category_id = object_entry.get('categoryId')
        library.append({
            'id': str(object_entry.get('id', idx + 1)),
            'label': object_entry.get('name') or object_entry.get('label') or 'Unnamed object',
            'category_id': category_id,
            'category_label': bin_labels.get(category_id, category_id or 'Unknown'),
            'explanation': object_entry.get('explanation') or 'Shared object content comes from the current lesson library.',
        })

    return library



def save_lesson_content(lesson_id, payload, status='draft'):
    existing = LessonContent.query.filter_by(lesson_id=lesson_id, status=status).order_by(LessonContent.version.desc()).first()
    version = 1 if not existing else (existing.version + 1)
    content = LessonContent(
        lesson_id=lesson_id,
        version=version,
        status=status,
        payload=json.dumps(payload)
    )
    db.session.add(content)
    db.session.commit()
    return content


def get_student_retry_progression():
    """Query all game attempts by students and calculate progression across retries."""
    all_game_attempts = AttemptLog.query.join(
        Activity, Activity.id == AttemptLog.activity_id
    ).join(
        User, User.id == AttemptLog.student_id
    ).filter(
        User.role == 'student',
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).order_by(AttemptLog.student_id, AttemptLog.activity_id, AttemptLog.created_at.asc(), AttemptLog.id.asc()).all()

    from collections import defaultdict
    retry_groups = defaultdict(list)
    for a in all_game_attempts:
        key = (a.student_id, a.activity_id)
        retry_groups[key].append(a)

    retry_progression = []
    for (student_id, activity_id), attempts in retry_groups.items():
        if len(attempts) < 1:
            continue  # Needs at least 1 attempt to show performance
        first_score = attempts[0].score or 0
        best_score = max(a.score or 0 for a in attempts)
        latest_score = attempts[-1].score or 0
        improvement = best_score - first_score
        student_name = attempts[0].student.name if attempts[0].student else f'Student #{student_id}'
        activity_name = attempts[0].activity.type if attempts[0].activity else f'Activity #{activity_id}'
        retry_progression.append({
            'student_name': student_name,
            'student_id': student_id,
            'activity_id': activity_id,
            'activity_name': activity_name,
            'attempt_count': len(attempts),
            'first_score': first_score,
            'best_score': best_score,
            'latest_score': latest_score,
            'improvement': improvement,
            'improved': improvement > 0,
            'attempts': [
                {
                    'num': idx + 1,
                    'score': a.score or 0,
                    'time': a.time_spent or 0,
                    'date': a.created_at.strftime('%b %d') if a.created_at else '',
                    'date_full': a.created_at.strftime('%b %d, %Y %I:%M %p') if a.created_at else ''
                }
                for idx, a in enumerate(attempts)
            ]
        })

    retry_progression.sort(key=lambda x: (x['attempt_count'] > 1, x['improvement'], x['attempt_count']), reverse=True)
    return retry_progression


def get_struggling_concepts(is_lesson=True, limit=None):
    """Returns missed questions/items grouped with miss counts and distinct student names who struggled."""
    object_library = {obj['id']: obj for obj in load_teacher_object_library()}
    query = db.session.query(
        AttemptObjectLog.object_id,
        Activity.type.label('activity_type'),
        Activity.engine.label('activity_engine'),
        User.name.label('student_name'),
        User.username.label('student_username'),
        db.func.count(AttemptObjectLog.id).label('miss_count')
    ).join(
        AttemptLog, AttemptLog.id == AttemptObjectLog.attempt_log_id
    ).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).join(
        User, User.id == AttemptLog.student_id
    ).filter(
        AttemptObjectLog.was_correct == False
    )

    lesson_filter = (
        Activity.type.ilike('%Lesson%') | 
        Activity.type.ilike('%Quick Check%') | 
        (Activity.engine == 'lesson') | 
        (Activity.engine == 'quick_check')
    )
    if is_lesson:
        query = query.filter(lesson_filter)
    else:
        query = query.filter(~lesson_filter)

    raw_results = query.group_by(
        AttemptObjectLog.object_id,
        Activity.type,
        Activity.engine,
        User.name,
        User.username
    ).all()

    grouped = {}
    for r in raw_results:
        key = (r.object_id, r.activity_type)
        if key not in grouped:
            grouped[key] = {'misses': 0, 'students': []}
        grouped[key]['misses'] += r.miss_count
        student_display = r.student_name or r.student_username
        if student_display and student_display not in grouped[key]['students']:
            grouped[key]['students'].append(student_display)

    items = []
    for (obj_id_raw, act_type), val in grouped.items():
        obj_id = str(obj_id_raw)
        obj_name = object_library.get(obj_id, {}).get('label')
        if not obj_name:
            for item in object_library.values():
                if item.get('label', '').lower() == obj_id.lower():
                    obj_name = item.get('label')
                    break
        if not obj_name:
            obj_name = obj_id

        items.append({
            'name': obj_name,
            'activity_type': act_type,
            'misses': val['misses'],
            'students': val['students']
        })

    items.sort(key=lambda x: x['misses'], reverse=True)
    return items[:limit] if limit else items


def get_dashboard_charts_data(lessons, activities, students):
    """Pre-aggregates lesson completion and activity scores for visual dashboard charts."""
    lesson_labels = []
    lesson_completion_rates = []
    lesson_avg_scores = []
    total_stud_count = len(students) if students else 1

    for l in lessons:
        lesson_labels.append(l.title)
        comp_count = LessonProgress.query.filter_by(lesson_id=l.id, completed=True).count()
        rate = round((comp_count / total_stud_count) * 100)
        lesson_completion_rates.append(min(rate, 100))

        qc_attempts = AttemptLog.query.join(Activity, Activity.id == AttemptLog.activity_id).filter(
            Activity.lesson_id == l.id
        ).all()
        avg_s = round(sum((a.score or 0) for a in qc_attempts) / len(qc_attempts)) if qc_attempts else 0
        lesson_avg_scores.append(avg_s)

    act_labels = []
    act_attempts_count = []
    act_avg_scores = []
    for a in activities:
        act_labels.append(a.type.split('—')[-1].strip() if '—' in a.type else a.type)
        attempts = AttemptLog.query.filter_by(activity_id=a.id).all()
        act_attempts_count.append(len(attempts))
        if attempts:
            avg_s = round(sum((att.score or 0) for att in attempts) / len(attempts))
            act_avg_scores.append(avg_s)
        else:
            act_avg_scores.append(0)

    return {
        'lesson_labels': lesson_labels,
        'lesson_completion_rates': lesson_completion_rates,
        'lesson_avg_scores': lesson_avg_scores,
        'act_labels': act_labels,
        'act_attempts_count': act_attempts_count,
        'act_avg_scores': act_avg_scores
    }


@teacher_bp.route('/dashboard')
@require_role('teacher')
def dashboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_dashboard')

    lessons = Lesson.query.all()
    activities = Activity.query.filter(
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).all()
    claw_activity = Activity.query.filter_by(type='Living vs Non-Living Claw Machine').first()
    students = User.query.filter_by(role='student').all()
    student_count = len(students)

    online_threshold = datetime.utcnow() - timedelta(minutes=3)
    online_students = User.query.filter(
        User.role == 'student',
        User.last_seen >= online_threshold
    ).order_by(User.name.asc()).all()

    lesson_assignments = LessonAssignment.query.all()
    activity_assignments = ActivityAssignment.query.all()
    total_assignments = len(lesson_assignments) + len(activity_assignments)

    # Average Curriculum Progress (Lessons + Playable Activities across all enrolled students)
    lesson_progress_records = LessonProgress.query.all()
    lp_sum = sum(min(100, (lp.progress_percent or 0)) for lp in lesson_progress_records)

    activity_completed_count = 0
    if student_count > 0 and len(activities) > 0:
        ap_set = set((al.student_id, al.activity_id) for al in AttemptLog.query.all())
        ap_set.update((pl.student_id, pl.activity_id) for pl in ProgressLog.query.all())
        activity_completed_count = len(ap_set)

    total_curriculum_slots = student_count * (len(lessons) + len(activities))
    if total_curriculum_slots > 0:
        total_progress_points = lp_sum + (activity_completed_count * 100)
        avg_progress = min(100, round(total_progress_points / total_curriculum_slots))
    else:
        avg_progress = 0

    progress_logs = ProgressLog.query.all()
    avg_time_spent = 0
    if progress_logs:
        total_time = sum((log.time_spent or 0) for log in progress_logs)
        avg_time_spent = round(total_time / len(progress_logs))

    # Calculate replay rate (§1.3 engagement metric)
    total_players = db.session.query(db.func.count(db.func.distinct(AttemptLog.student_id))).scalar() or 0
    replayers = db.session.query(db.func.count(db.func.distinct(AttemptLog.student_id))).filter(AttemptLog.attempt_number > 1).scalar() or 0
    replay_rate = round((replayers / total_players * 100)) if total_players > 0 else 0

    claw_leaderboard = []
    animal_leaderboard = []
    plant_leaderboard = []

    def get_teacher_game_leaderboard(activity_name_fragment):
        return db.session.query(
            User.id.label('id'),
            User.name.label('name'),
            db.func.max(ProgressLog.score).label('best_score'),
            db.func.min(ProgressLog.time_spent).label('time_spent')
        ).join(ProgressLog, User.id == ProgressLog.student_id
        ).join(Activity, Activity.id == ProgressLog.activity_id
        ).filter(
            User.role == 'student',
            Activity.type.ilike(f'%{activity_name_fragment}%')
        ).group_by(User.id, User.name).order_by(
            db.desc('best_score'), User.name
        ).limit(10).all()

    claw_leaderboard = get_teacher_game_leaderboard('Claw Machine')
    animal_leaderboard = get_teacher_game_leaderboard('Find the Part')
    plant_leaderboard = get_teacher_game_leaderboard('Build a Plant')
    metal_leaderboard = get_teacher_game_leaderboard('Metal Clue')
    recycling_leaderboard = get_teacher_game_leaderboard('EcoSwipe')

    top_students = db.session.query(
        User.id.label('id'),
        User.name.label('name'),
        db.func.sum(ProgressLog.score).label('total_score')
    ).join(ProgressLog, User.id == ProgressLog.student_id).filter(
        User.role == 'student'
    ).group_by(User.id).order_by(db.desc('total_score')).limit(5).all()

    recent_activity = db.session.query(
        ProgressLog,
        User.name.label('student_name'),
        Activity.type.label('activity_type')
    ).join(User, User.id == ProgressLog.student_id).join(Activity, Activity.id == ProgressLog.activity_id
    ).order_by(ProgressLog.created_at.desc()).limit(5).all()

    most_missed_lessons = get_struggling_concepts(is_lesson=True, limit=3)
    most_missed_activities = get_struggling_concepts(is_lesson=False, limit=3)
    dashboard_charts = get_dashboard_charts_data(lessons, activities, students)

    return render_template(
        'teacher/teacher_dashboard.html',
        lessons=lessons,
        activities=activities,
        students=students,
        student_count=student_count,
        online_students=online_students,
        avg_progress=avg_progress,
        avg_time_spent=avg_time_spent,
        total_assignments=total_assignments,
        replay_rate=replay_rate,
        badges_count=0,
        claw_activity=claw_activity,
        claw_leaderboard=claw_leaderboard,
        animal_leaderboard=animal_leaderboard,
        plant_leaderboard=plant_leaderboard,
        metal_leaderboard=metal_leaderboard,
        recycling_leaderboard=recycling_leaderboard,
        top_students=top_students,
        recent_activity=recent_activity,
        most_missed_lessons=most_missed_lessons,
        most_missed_activities=most_missed_activities,
        retry_progression=get_student_retry_progression(),
        dashboard_charts=dashboard_charts,
        current_user=current_user
    )


@teacher_bp.route('/students')
@require_role('teacher')
def students():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_students')

    search_query = request.args.get('search', '').strip()
    online_threshold = datetime.utcnow() - timedelta(minutes=3)

    query = User.query.filter(User.role == 'student')
    if search_query:
        query = query.filter(
            (User.name.ilike(f'%{search_query}%')) |
            (User.username.ilike(f'%{search_query}%'))
        )
    student_users = query.order_by(User.name.asc()).all()

    # Pre-fetch all progress and assignment records to compute metrics efficiently
    all_lp = LessonProgress.query.all()
    all_progress = ProgressLog.query.all()
    all_attempts = AttemptLog.query.all()
    all_badges = UserBadge.query.all()
    all_lesson_assignments = LessonAssignment.query.all()
    all_activity_assignments = ActivityAssignment.query.all()

    lp_by_student = {}
    for lp in all_lp:
        lp_by_student.setdefault(lp.student_id, []).append(lp)

    progress_by_student = {}
    for p in all_progress:
        progress_by_student.setdefault(p.student_id, []).append(p)

    attempts_by_student = {}
    for a in all_attempts:
        attempts_by_student.setdefault(a.student_id, []).append(a)

    badges_by_student = {}
    for b in all_badges:
        badges_by_student.setdefault(b.user_id, []).append(b)

    la_by_student = {}
    for la in all_lesson_assignments:
        la_by_student.setdefault(la.student_id, []).append(la)

    aa_by_student = {}
    for aa in all_activity_assignments:
        aa_by_student.setdefault(aa.student_id, []).append(aa)

    students_data = []
    online_count = 0
    total_class_progress = 0

    for s in student_users:
        is_online = bool(s.last_seen and s.last_seen >= online_threshold)
        if is_online:
            online_count += 1

        s_lps = lp_by_student.get(s.id, [])
        completed_lessons = sum(1 for lp in s_lps if lp.completed or (lp.progress_percent or 0) >= 100 or (lp.revisit_count or 0) > 0)

        s_las = la_by_student.get(s.id, [])
        s_aas = aa_by_student.get(s.id, [])
        assigned_lessons = len(s_las)
        assigned_activities = len(s_aas)
        total_tasks = assigned_lessons + assigned_activities

        s_progs = progress_by_student.get(s.id, [])
        completed_activities = len(s_progs)

        if total_tasks > 0:
            overall_pct = min(100, round(((completed_lessons + completed_activities) / total_tasks) * 100))
        elif (completed_lessons + completed_activities) > 0:
            overall_pct = 100
        else:
            overall_pct = 0
        total_class_progress += overall_pct

        total_points = sum((p.score or 0) for p in s_progs)
        badge_count = len(badges_by_student.get(s.id, []))

        s_attempts = attempts_by_student.get(s.id, [])
        latest_attempt_date = max((a.created_at for a in s_attempts if a.created_at), default=None)
        latest_active = latest_attempt_date or s.last_seen or s.created_at

        students_data.append({
            'id': s.id,
            'name': s.name,
            'username': s.username,
            'is_online': is_online,
            'last_seen': s.last_seen,
            'latest_active': latest_active,
            'completed_lessons': completed_lessons,
            'assigned_lessons': assigned_lessons,
            'completed_activities': completed_activities,
            'assigned_activities': assigned_activities,
            'overall_progress': overall_pct,
            'total_points': total_points,
            'badge_count': badge_count
        })

    avg_class_progress = round(total_class_progress / len(students_data)) if students_data else 0
    online_students_set = set(s.id for s in student_users if s.last_seen and s.last_seen >= online_threshold)
    live_lesson_tracker = build_live_lesson_tracker(online_students_set)

    return render_template(
        'teacher/teacher_students.html',
        current_user=current_user,
        students=students_data,
        live_lesson_tracker=live_lesson_tracker,
        total_students=len(students_data),
        online_count=online_count,
        avg_class_progress=avg_class_progress,
        search_query=search_query
    )


@teacher_bp.route('/lessons')
@require_role('teacher')
def lessons():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_lessons')

    lessons = Lesson.query.order_by(Lesson.id.asc()).all()
    activities = Activity.query.filter(
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).order_by(Activity.created_at.desc()).all()
    students = User.query.filter_by(role='student').order_by(User.name.asc()).all()

    lesson_assignments = LessonAssignment.query.order_by(LessonAssignment.created_at.desc()).all()
    activity_assignments = ActivityAssignment.query.order_by(ActivityAssignment.created_at.desc()).all()

    # Map each lesson to its primary paired game activity (e.g. Claw Machine, Streak Race)
    lesson_activity_map = {}
    for lesson in lessons:
        paired_act = Activity.query.filter_by(lesson_id=lesson.id).filter(
            Activity.engine.in_(['claw_machine', 'find_the_part', 'build_a_plant', 'streak_race', 'metal_logic', 'recycle_sorter']),
            ~Activity.type.ilike('%Quick Check%'),
            ~Activity.type.ilike('%Slide Questions%')
        ).first()

        if paired_act:
            lesson_activity_map[str(lesson.id)] = {
                'id': paired_act.id,
                'name': paired_act.type,
                'engine': paired_act.engine
            }

    completed_lessons = [
        {'student_id': lp.student_id, 'lesson_id': lp.lesson_id}
        for lp in LessonProgress.query.filter(
            (LessonProgress.completed_at.isnot(None)) | 
            (LessonProgress.completed == True) | 
            (LessonProgress.revisit_count > 0)
        ).all()
    ]

    # Synchronize activity assignment statuses based on attempts logged after assigned_at
    for aa in activity_assignments:
        if aa.status == 'assigned':
            has_attempt = False
            if aa.assigned_at:
                has_attempt = AttemptLog.query.filter(
                    AttemptLog.student_id == aa.student_id,
                    AttemptLog.activity_id == aa.activity_id,
                    AttemptLog.created_at >= aa.assigned_at
                ).first() is not None
            else:
                has_attempt = AttemptLog.query.filter_by(student_id=aa.student_id, activity_id=aa.activity_id).first() is not None
            if has_attempt:
                aa.status = 'completed'
                db.session.add(aa)
    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    existing_assignments = {
        'lessons': [{'student_id': la.student_id, 'lesson_id': la.lesson_id} for la in lesson_assignments],
        'activities': [{'student_id': aa.student_id, 'activity_id': aa.activity_id, 'status': aa.status} for aa in activity_assignments]
    }

    return render_template(
        'teacher/teacher_lessons.html',
        current_user=current_user,
        lessons=lessons,
        activities=activities,
        students=students,
        lesson_assignments=lesson_assignments,
        activity_assignments=activity_assignments,
        lesson_activity_map=lesson_activity_map,
        existing_assignments=existing_assignments,
        completed_lessons=completed_lessons,
        game_presets=GAME_TYPE_PRESETS
    )


@teacher_bp.route('/assignments')
@require_role('teacher')
def assignments():
    return redirect(url_for('teacher.lessons'))


@teacher_bp.route('/assign_lesson', methods=['POST'])
@require_role('teacher')
def assign_lesson():
    current_user = get_current_user()
    lesson_id = request.form.get('lesson_id')
    student_id_raw = request.form.get('student_id')
    include_activity = request.form.get('include_activity') in ['1', 'on', 'true', True]
    paired_activity_id = request.form.get('paired_activity_id')
    due_date_raw = request.form.get('due_date')

    if not lesson_id or not student_id_raw:
        flash('Please select both a student and a lesson.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    try:
        lesson_id = int(lesson_id)
    except (ValueError, TypeError):
        flash('Invalid lesson selection.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    lesson = Lesson.query.get(lesson_id)
    lesson_title = lesson.title if lesson else f"Lesson #{lesson_id}"

    due_date = None
    if due_date_raw:
        try:
            due_date = datetime.fromisoformat(due_date_raw)
        except Exception:
            due_date = None

    # Determine paired activity if requested
    act_id = None
    act_name = ""
    if include_activity:
        if paired_activity_id:
            try:
                candidate_id = int(paired_activity_id)
                candidate_act = Activity.query.get(candidate_id)
                if candidate_act and candidate_act.engine in ['claw_machine', 'find_the_part', 'build_a_plant', 'streak_race', 'metal_logic', 'recycle_sorter']:
                    act_id = candidate_id
            except (ValueError, TypeError):
                act_id = None

        if not act_id:
            paired_act = Activity.query.filter_by(lesson_id=lesson_id).filter(
                Activity.engine.in_(['claw_machine', 'find_the_part', 'build_a_plant', 'streak_race', 'metal_logic', 'recycle_sorter']),
                ~Activity.type.ilike('%Quick Check%'),
                ~Activity.type.ilike('%Slide Questions%')
            ).first()
            if paired_act:
                act_id = paired_act.id

        if act_id:
            activity = Activity.query.get(act_id)
            if activity:
                act_name = activity.type

    is_all_students = str(student_id_raw).strip().lower() == 'all'
    if is_all_students:
        all_students = User.query.filter_by(role='student').all()
        if not all_students:
            flash('No registered students found.', 'warning')
            return redirect(request.referrer or url_for('teacher.lessons'))

        assigned_count = 0
        for st in all_students:
            existing_la = LessonAssignment.query.filter_by(student_id=st.id, lesson_id=lesson_id).first()
            if not existing_la:
                db.session.add(LessonAssignment(
                    lesson_id=lesson_id,
                    student_id=st.id,
                    assigned_by=current_user.id,
                    due_date=due_date
                ))
                assigned_count += 1
            if act_id:
                existing_aa = ActivityAssignment.query.filter_by(student_id=st.id, activity_id=act_id).first()
                if not existing_aa:
                    db.session.add(ActivityAssignment(
                        activity_id=act_id,
                        student_id=st.id,
                        assigned_by=current_user.id,
                        due_date=due_date
                    ))
                elif existing_aa.status in ('completed', 'attempts_exhausted'):
                    existing_aa.status = 'assigned'
                    existing_aa.assigned_at = datetime.utcnow()
                    existing_aa.due_date = due_date

        db.session.commit()
        log_access(current_user, 'assign_lesson_all', f'lesson_id={lesson_id}')
        act_info = f' and paired activity "{act_name}"' if act_id else ''
        flash(f'Successfully assigned "{lesson_title}"{act_info} to all {len(all_students)} students!', 'success')
        return redirect(request.referrer or url_for('teacher.lessons'))

    # Single student assignment flow
    try:
        student_id = int(student_id_raw)
    except (ValueError, TypeError):
        flash('Invalid student selection.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    existing_lesson_assign = LessonAssignment.query.filter_by(student_id=student_id, lesson_id=lesson_id).first()
    student = User.query.get(student_id)
    student_name = student.name if student else f"Student #{student_id}"

    existing_act_assign = ActivityAssignment.query.filter_by(student_id=student_id, activity_id=act_id).first() if act_id else None

    # Case 1: Lesson already assigned and activity already actively assigned (or no activity requested)
    if existing_lesson_assign and (not act_id or (existing_act_assign and existing_act_assign.status == 'assigned')):
        if existing_act_assign and existing_act_assign.status == 'assigned':
            flash(f'Both "{lesson_title}" and "{act_name}" are already actively assigned to {student_name}.', 'warning')
        else:
            flash(f'"{lesson_title}" is already assigned to {student_name}.', 'warning')
        return redirect(request.referrer or url_for('teacher.lessons'))

    # Case 2: Lesson is already assigned (or completed), and paired activity is requested and needs assigning/reassigning
    if existing_lesson_assign and act_id:
        if existing_act_assign:
            existing_act_assign.status = 'assigned'
            existing_act_assign.assigned_at = datetime.utcnow()
            existing_act_assign.due_date = due_date
            db.session.commit()
            log_access(current_user, 'reassign_activity', f'activity_id={act_id} student_id={student_id}')
            flash(f'Paired activity "{act_name}" reassigned successfully to {student_name} with 3 fresh attempts.', 'success')
            return redirect(request.referrer or url_for('teacher.lessons'))
        else:
            act_assign = ActivityAssignment(
                activity_id=act_id,
                student_id=student_id,
                assigned_by=current_user.id,
                due_date=due_date
            )
            db.session.add(act_assign)
            db.session.commit()
            log_access(current_user, 'assign_activity', f'activity_id={act_id} student_id={student_id}')
            flash(f'Paired activity "{act_name}" assigned successfully to {student_name}.', 'success')
            return redirect(request.referrer or url_for('teacher.lessons'))

    # Case 3: Lesson is newly assigned (and optionally paired activity too)
    assignment = LessonAssignment(
        lesson_id=lesson_id,
        student_id=student_id,
        assigned_by=current_user.id,
        due_date=due_date
    )
    db.session.add(assignment)

    activity_msg = ""
    if act_id:
        if existing_act_assign:
            existing_act_assign.status = 'assigned'
            existing_act_assign.assigned_at = datetime.utcnow()
            existing_act_assign.due_date = due_date
            activity_msg = f' and paired activity "{act_name}" reassigned'
        else:
            act_assign = ActivityAssignment(
                activity_id=act_id,
                student_id=student_id,
                assigned_by=current_user.id,
                due_date=due_date
            )
            db.session.add(act_assign)
            activity_msg = f' and paired activity "{act_name}"'

    db.session.commit()
    log_access(current_user, 'assign_lesson', f'lesson_id={lesson_id} student_id={student_id} include_activity={include_activity}')
    flash(f'Lesson{activity_msg} assigned successfully to {student_name}.', 'success')
    return redirect(request.referrer or url_for('teacher.assignments'))


@teacher_bp.route('/assign_activity', methods=['POST'])
@require_role('teacher')
def assign_activity():
    current_user = get_current_user()
    activity_id = request.form.get('activity_id')
    student_id_raw = request.form.get('student_id')
    due_date_raw = request.form.get('due_date')

    if not activity_id or not student_id_raw:
        flash('Please select both a student and an activity.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    try:
        activity_id = int(activity_id)
    except (ValueError, TypeError):
        flash('Invalid activity selection.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    activity = Activity.query.get(activity_id)
    act_name = activity.type if activity else f"Activity #{activity_id}"

    due_date = None
    if due_date_raw:
        try:
            due_date = datetime.fromisoformat(due_date_raw)
        except Exception:
            due_date = None

    is_all_students = str(student_id_raw).strip().lower() == 'all'
    if is_all_students:
        all_students = User.query.filter_by(role='student').all()
        if not all_students:
            flash('No registered students found.', 'warning')
            return redirect(request.referrer or url_for('teacher.lessons'))

        for st in all_students:
            existing = ActivityAssignment.query.filter_by(student_id=st.id, activity_id=activity_id).first()
            if not existing:
                db.session.add(ActivityAssignment(
                    activity_id=activity_id,
                    student_id=st.id,
                    assigned_by=current_user.id,
                    due_date=due_date
                ))
            elif existing.status in ('attempts_exhausted', 'completed'):
                existing.status = 'assigned'
                existing.assigned_at = datetime.utcnow()
                existing.due_date = due_date

        db.session.commit()
        log_access(current_user, 'assign_activity_all', f'activity_id={activity_id}')
        flash(f'Activity "{act_name}" assigned successfully to all {len(all_students)} students!', 'success')
        return redirect(request.referrer or url_for('teacher.lessons'))

    try:
        student_id = int(student_id_raw)
    except (ValueError, TypeError):
        flash('Invalid student selection.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    student = User.query.get(student_id)
    student_name = student.name if student else f"Student #{student_id}"

    # Check for existing activity assignment
    existing = ActivityAssignment.query.filter_by(student_id=student_id, activity_id=activity_id).first()
    if existing:
        if existing.status in ('attempts_exhausted', 'completed'):
            existing.status = 'assigned'
            existing.assigned_at = datetime.utcnow()
            existing.due_date = due_date
            db.session.commit()
            log_access(current_user, 'reassign_activity', f'activity_id={activity_id} student_id={student_id}')
            flash(f'Activity "{act_name}" reassigned successfully to {student_name} with 3 fresh attempts.', 'success')
            return redirect(request.referrer or url_for('teacher.lessons'))
        else:
            flash(f'"{act_name}" is already actively assigned to {student_name}.', 'warning')
            return redirect(request.referrer or url_for('teacher.lessons'))

    assignment = ActivityAssignment(activity_id=activity_id, student_id=student_id, assigned_by=current_user.id, due_date=due_date)
    db.session.add(assignment)
    db.session.commit()
    log_access(current_user, 'assign_activity', f'activity_id={activity_id} student_id={student_id}')
    flash(f'Activity "{act_name}" assigned successfully to {student_name}.', 'success')
    return redirect(request.referrer or url_for('teacher.lessons'))


@teacher_bp.route('/reassign_activity/<int:assignment_id>', methods=['POST'])
@require_role('teacher')
def reassign_activity(assignment_id):
    current_user = get_current_user()
    assignment = ActivityAssignment.query.get(assignment_id)
    if not assignment:
        flash('Assignment not found.', 'danger')
        return redirect(request.referrer or url_for('teacher.lessons'))

    student = User.query.get(assignment.student_id)
    student_name = student.name if student else f"Student #{assignment.student_id}"
    activity = Activity.query.get(assignment.activity_id)
    act_name = activity.type if activity else f"Activity #{assignment.activity_id}"

    assignment.status = 'assigned'
    assignment.assigned_at = datetime.utcnow()
    db.session.commit()

    log_access(current_user, 'reassign_activity', f'activity_id={assignment.activity_id} student_id={assignment.student_id}')
    flash(f'Activity "{act_name}" reassigned to {student_name} with 3 fresh attempts.', 'success')
    return redirect(request.referrer or url_for('teacher.lessons'))


@teacher_bp.route('/analytics')
@require_role('teacher')
def analytics():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_analytics')
    
    lesson_assignments = LessonAssignment.query.all()
    activity_assignments = ActivityAssignment.query.all()
    
    activity_attempts = AttemptLog.query.join(
        Activity, Activity.id == AttemptLog.activity_id
    ).filter(
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).order_by(AttemptLog.created_at.desc()).all()

    # Pre-map student lesson progress and activity completion/attempts for dynamic status resolution
    lp_map = {
        (lp.student_id, lp.lesson_id): lp
        for lp in LessonProgress.query.all()
    }
    ap_map = set()
    for al in AttemptLog.query.all():
        ap_map.add((al.student_id, al.activity_id))
    for pl in ProgressLog.query.all():
        ap_map.add((pl.student_id, pl.activity_id))

    all_assignments = []
    lesson_comp_count = 0
    for la in lesson_assignments:
        lp = lp_map.get((la.student_id, la.lesson_id))
        is_comp = (la.status == 'completed') or (lp and (lp.completed or (lp.progress_percent or 0) >= 100))
        status = 'completed' if is_comp else (la.status or 'assigned')

        if is_comp and la.status != 'completed':
            la.status = 'completed'
            db.session.add(la)

        if is_comp:
            lesson_comp_count += 1

        all_assignments.append({
            'type': 'Lesson',
            'type_badge_class': 'bg-primary-subtle text-primary border border-primary-subtle',
            'title': la.lesson.title if la.lesson else f'Lesson #{la.lesson_id}',
            'student_name': la.student.name if la.student else f'Student #{la.student_id}',
            'student_id': la.student_id,
            'assigned_at': la.assigned_at,
            'due_date': la.due_date,
            'status': status
        })

    activity_comp_count = 0
    for aa in activity_assignments:
        status = aa.status or 'assigned'
        if status in ('completed', 'attempts_exhausted'):
            is_comp = True
        else:
            has_attempt = False
            if aa.assigned_at:
                has_attempt = AttemptLog.query.filter(
                    AttemptLog.student_id == aa.student_id,
                    AttemptLog.activity_id == aa.activity_id,
                    AttemptLog.created_at >= aa.assigned_at
                ).first() is not None
            else:
                has_attempt = (aa.student_id, aa.activity_id) in ap_map
            
            if has_attempt:
                status = 'completed'
                aa.status = 'completed'
                db.session.add(aa)
                is_comp = True
            else:
                is_comp = False

        if is_comp:
            activity_comp_count += 1

        all_assignments.append({
            'type': 'Activity',
            'type_badge_class': 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
            'title': aa.activity.type if aa.activity else f'Activity #{aa.activity_id}',
            'student_name': aa.student.name if aa.student else f'Student #{aa.student_id}',
            'student_id': aa.student_id,
            'assigned_at': aa.assigned_at,
            'due_date': aa.due_date,
            'status': status
        })

    try:
        db.session.commit()
    except Exception:
        db.session.rollback()

    all_assignments.sort(key=lambda x: x['assigned_at'] or datetime.min, reverse=True)

    total_assignments = len(all_assignments)
    completed_count = sum(1 for a in all_assignments if a['status'] in ('completed', 'attempts_exhausted'))
    overall_completion_rate = round((completed_count / total_assignments * 100)) if total_assignments > 0 else 0
    lesson_completion_rate = round((lesson_comp_count / len(lesson_assignments) * 100)) if lesson_assignments else 0
    activity_completion_rate = round((activity_comp_count / len(activity_assignments) * 100)) if activity_assignments else 0

    total_attempts = len(activity_attempts)
    avg_score = round(sum((a.score or 0) for a in activity_attempts) / total_attempts) if total_attempts > 0 else 0

    # Calculate activity replay rate for playable activities
    playable_attempts = AttemptLog.query.join(
        Activity, Activity.id == AttemptLog.activity_id
    ).join(
        User, User.id == AttemptLog.student_id
    ).filter(
        User.role == 'student',
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).all()

    student_activity_counts = {}
    for al in playable_attempts:
        key = (al.student_id, al.activity_id)
        student_activity_counts[key] = student_activity_counts.get(key, 0) + 1

    distinct_players = set(s_id for (s_id, act_id) in student_activity_counts.keys())
    replaying_players = set(s_id for (s_id, act_id), count in student_activity_counts.items() if count > 1)
    replay_rate = round((len(replaying_players) / len(distinct_players) * 100)) if distinct_players else 0

    # Online student presence tracking (Manuscript §5: Real-Time Online Student status)
    online_threshold = datetime.utcnow() - timedelta(minutes=3)
    online_students_set = set(u.id for u in User.query.filter(User.role == 'student', User.last_seen >= online_threshold).all())
    online_students_count = len(online_students_set)
    total_students_count = User.query.filter_by(role='student').count()

    # Time on task tracking (Manuscript §3: Time on task)
    all_lesson_attempts = LessonAttemptLog.query.all()
    first_lesson_attempts = [a for a in all_lesson_attempts if a.attempt_number == 1]
    revisit_lesson_attempts = [a for a in all_lesson_attempts if a.attempt_number > 1]
    avg_first_time = round(sum((a.time_spent or 0) for a in first_lesson_attempts) / len(first_lesson_attempts)) if first_lesson_attempts else 0
    avg_revisit_time = round(sum((a.time_spent or 0) for a in revisit_lesson_attempts) / len(revisit_lesson_attempts)) if revisit_lesson_attempts else 0
    total_time_task_seconds = sum((a.time_spent or 0) for a in all_lesson_attempts)

    # Live Lesson Slide & Progress Tracker (Manuscript §1: Monitor Student progress)
    live_lesson_tracker = build_live_lesson_tracker(online_students_set)


    # --- Per-student retry progression (teacher-only: does replaying improve scores?) ---
    retry_progression = get_student_retry_progression()

    # --- Full Ranked Top Students Performance ---
    all_top_students_raw = db.session.query(
        User.id.label('id'),
        User.name.label('name'),
        User.username.label('username'),
        db.func.coalesce(db.func.sum(ProgressLog.score), 0).label('total_score'),
        db.func.count(db.func.distinct(ProgressLog.activity_id)).label('activities_completed')
    ).outerjoin(ProgressLog, User.id == ProgressLog.student_id).filter(
        User.role == 'student'
    ).group_by(User.id, User.name, User.username).order_by(db.desc('total_score'), User.name.asc()).all()

    all_top_students = [
        {
            'rank': idx + 1,
            'id': row.id,
            'name': row.name,
            'username': row.username,
            'total_score': int(row.total_score or 0),
            'activities_completed': int(row.activities_completed or 0)
        }
        for idx, row in enumerate(all_top_students_raw)
    ]

    # Active students count for Participation Rate calculation
    active_student_ids = set(
        row[0] for row in db.session.query(AttemptLog.student_id).distinct().all()
    ).union(
        row[0] for row in db.session.query(LessonProgress.student_id).distinct().all()
    )
    active_students_count = User.query.filter(User.role == 'student', User.id.in_(active_student_ids)).count() if active_student_ids else 0
    participation_rate = round((active_students_count / total_students_count * 100)) if total_students_count else 0

    # --- Most Missed Items with Student Names ---
    analytics_missed_lessons = get_struggling_concepts(is_lesson=True)
    analytics_missed_activities = get_struggling_concepts(is_lesson=False)

    # --- Per-game leaderboards for dashboard widget ---
    def build_teacher_game_lb(activity_type_fragment):
        rows = db.session.query(
            User.id,
            User.name,
            db.func.max(ProgressLog.score).label('best_score'),
            db.func.min(ProgressLog.time_spent).label('best_time')
        ).join(ProgressLog, ProgressLog.student_id == User.id
        ).join(Activity, Activity.id == ProgressLog.activity_id
        ).filter(
            User.role == 'student',
            Activity.type.ilike(f'%{activity_type_fragment}%')
        ).group_by(User.id, User.name).order_by(db.desc('best_score'), User.name).limit(10).all()
        return rows

    claw_leaderboard_rows = build_teacher_game_lb('Claw Machine')
    animal_leaderboard_rows = build_teacher_game_lb('Find the Part')
    plant_leaderboard_rows = build_teacher_game_lb('Streak Race')

    analytics_stats = {
        'total_assignments': total_assignments,
        'completed_count': completed_count,
        'overall_completion_rate': overall_completion_rate,
        'lesson_comp_count': lesson_comp_count,
        'total_lesson_assignments': len(lesson_assignments),
        'lesson_completion_rate': lesson_completion_rate,
        'activity_comp_count': activity_comp_count,
        'total_activity_assignments': len(activity_assignments),
        'activity_completion_rate': activity_completion_rate,
        'replay_rate': replay_rate,
        'replay_active_players': len(replaying_players),
        'replay_distinct_players': len(distinct_players),
        'class_replay_rate': round((len(replaying_players) / total_students_count * 100)) if total_students_count else 0,
        'total_attempts': total_attempts,
        'avg_score': avg_score,
        'online_count': online_students_count,
        'total_students': total_students_count,
        'online_rate': round((online_students_count / total_students_count * 100)) if total_students_count else 0,
        'active_students_count': active_students_count,
        'participation_rate': participation_rate,
        'avg_first_time': format_time_duration(avg_first_time),
        'avg_revisit_time': format_time_duration(avg_revisit_time),
        'total_time_formatted': format_time_duration(total_time_task_seconds),
        'total_time_seconds': total_time_task_seconds,
        'first_attempts_count': len(first_lesson_attempts),
        'revisit_attempts_count': len(revisit_lesson_attempts)
    }

    return render_template(
        'teacher/teacher_analytics.html',
        current_user=current_user,
        analytics_stats=analytics_stats,
        all_assignments=all_assignments,
        activity_attempts=activity_attempts,
        live_lesson_tracker=live_lesson_tracker,
        retry_progression=retry_progression,
        claw_leaderboard_rows=claw_leaderboard_rows,
        animal_leaderboard_rows=animal_leaderboard_rows,
        plant_leaderboard_rows=plant_leaderboard_rows,
        all_top_students=all_top_students,
        analytics_missed_lessons=analytics_missed_lessons,
        analytics_missed_activities=analytics_missed_activities
    )


@teacher_bp.route('/add_feedback', methods=['POST'])
@csrf.exempt
@require_role('teacher')
def add_feedback():
    """Add teacher feedback to a student's attempt"""
    current_user = get_current_user()
    data = request.get_json(force=True, silent=True) or request.form or {}
    
    try:
        raw_attempt_id = data.get('attempt_id') or request.values.get('attempt_id')
        attempt_id = int(raw_attempt_id)
        teacher_feedback_text = (data.get('teacher_feedback') or data.get('feedback') or request.values.get('teacher_feedback') or '').strip()
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid attempt_id'}), 400
    
    if not teacher_feedback_text:
        return jsonify({'error': 'Feedback cannot be empty'}), 400
    
    attempt = AttemptLog.query.get(attempt_id)
    if not attempt:
        return jsonify({'error': 'Attempt not found'}), 404
    
    attempt.teacher_feedback = teacher_feedback_text
    db.session.commit()
    log_access(current_user, 'add_feedback', f'attempt_id={attempt_id}')
    
    if request.is_json or request.content_type == 'application/json' or request.headers.get('X-Requested-With') == 'XMLHttpRequest':
        return jsonify({'status': 'ok', 'message': 'Feedback saved successfully'})
    return redirect(url_for('teacher.dashboard'))


@teacher_bp.route('/award_badge', methods=['POST'])
@require_role('teacher')
def award_badge():
    """Award a badge to a student"""
    current_user = get_current_user()
    data = request.get_json(silent=True) or request.form
    
    try:
        student_id = int(data.get('student_id'))
        badge_id = int(data.get('badge_id'))
    except (TypeError, ValueError):
        return {'error': 'Invalid student_id or badge_id'}, 400
    
    user = User.query.get(student_id)
    badge = Badge.query.get(badge_id)
    
    if not user or not badge:
        return {'error': 'Student or badge not found'}, 404
    
    # Check if already awarded
    existing = UserBadge.query.filter_by(user_id=student_id, badge_id=badge_id).first()
    if existing:
        return {'error': 'Badge already awarded to this student'}, 400
    
    user_badge = UserBadge(user_id=student_id, badge_id=badge_id)
    db.session.add(user_badge)
    db.session.commit()
    log_access(current_user, 'award_badge', f'student_id={student_id} badge_id={badge_id}')
    
    return {'status': 'ok', 'message': f'Badge "{badge.name}" awarded to {user.name}'} if request.is_json else redirect(url_for('teacher.dashboard'))


@teacher_bp.route('/feedback')
@require_role('teacher')
def feedback():
    """Centralized Teacher Feedback Hub for student activity submissions"""
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_feedback')

    # Get all student game attempts
    attempts = db.session.query(AttemptLog, Activity, User).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).join(
        User, User.id == AttemptLog.student_id
    ).filter(
        User.role == 'student',
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).order_by(
        AttemptLog.created_at.desc()
    ).all()

    enriched_attempts = []
    needs_feedback_count = 0
    feedback_given_count = 0

    for attempt, activity, student in attempts:
        has_feedback = bool(attempt.teacher_feedback and attempt.teacher_feedback.strip())
        if has_feedback:
            feedback_given_count += 1
        else:
            needs_feedback_count += 1

        total_for_activity = AttemptLog.query.filter_by(
            student_id=student.id,
            activity_id=activity.id
        ).count()

        enriched_attempts.append({
            'attempt': attempt,
            'activity': activity,
            'student': student,
            'has_feedback': has_feedback,
            'total_attempts': total_for_activity
        })

    students_list = User.query.filter_by(role='student').order_by(User.name.asc()).all()
    activities_list = Activity.query.filter(
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).all()

    return render_template(
        'teacher/teacher_feedback.html',
        attempts=enriched_attempts,
        total_submissions=len(enriched_attempts),
        needs_feedback_count=needs_feedback_count,
        feedback_given_count=feedback_given_count,
        students=students_list,
        activities=activities_list,
        active_page='feedback'
    )


@teacher_bp.route('/student_performance/<int:student_id>')
@require_role('teacher')
def student_performance(student_id):
    """Get detailed performance report for a student"""
    current_user = get_current_user()
    log_access(current_user, 'page_view', f'student_performance_{student_id}')
    
    student = User.query.get(student_id)
    if not student:
        flash('Student not found', 'danger')
        return redirect(url_for('teacher.dashboard'))
    
    # Activity progress
    progress_logs = ProgressLog.query.filter_by(student_id=student_id).all()
    
    # Lesson progress  
    lesson_progress_raw = LessonProgress.query.filter_by(student_id=student_id).all()
    lesson_progress = []
    lessons_completed = 0
    for lp in lesson_progress_raw:
        att_logs = LessonAttemptLog.query.filter_by(
            student_id=student_id, lesson_id=lp.lesson_id
        ).order_by(LessonAttemptLog.attempt_number.asc()).all()
        tot_time = sum((a.time_spent or 0) for a in att_logs) if att_logs else (lp.total_time_spent or lp.time_spent or 0)
        is_ever_completed = lp.completed or (lp.revisit_count and lp.revisit_count > 0) or bool(lp.initial_time_spent) or any(a.completed for a in att_logs)
        revisit_count = len(att_logs) - 1 if len(att_logs) > 1 else (lp.revisit_count or 0)
        total_visits = len(att_logs) if att_logs else (revisit_count + 1 if is_ever_completed else 1)
        if is_ever_completed:
            lessons_completed += 1

        lesson_progress.append({
            'lp': lp,
            'lesson': lp.lesson,
            'attempts': att_logs,
            'total_time': tot_time,
            'progress_percent': lp.progress_percent,
            'completed': lp.completed,
            'is_ever_completed': is_ever_completed,
            'revisit_count': revisit_count,
            'total_visits': total_visits
        })
    
    # Recent attempts with feedback
    attempts = db.session.query(AttemptLog, Activity).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).filter(AttemptLog.student_id == student_id).order_by(
        AttemptLog.created_at.desc()
    ).limit(10).all()
    
    # Badges earned
    badges = db.session.query(UserBadge, Badge).join(
        Badge, Badge.id == UserBadge.badge_id
    ).filter(UserBadge.user_id == student_id).all()
    
    # Overall stats
    total_score = sum((log.score or 0) for log in progress_logs)
    avg_score = round(total_score / len(progress_logs)) if progress_logs else 0
    
    return render_template(
        'teacher/student_performance.html',
        student=student,
        progress_logs=progress_logs,
        lesson_progress=lesson_progress,
        attempts=attempts,
        badges=badges,
        total_score=total_score,
        avg_score=avg_score,
        lessons_completed=lessons_completed,
        current_user=current_user
    )


def _build_lesson_history_data(student_id, lesson_id):
    student = User.query.get(student_id)
    lesson = Lesson.query.get(lesson_id)
    if not student or not lesson:
        return None

    log = LessonProgress.query.filter_by(student_id=student_id, lesson_id=lesson_id).first()
    attempts = LessonAttemptLog.query.filter_by(
        student_id=student_id, lesson_id=lesson_id
    ).order_by(LessonAttemptLog.attempt_number.asc()).all()

    total_slides = get_lesson_total_slides(lesson)

    def format_time_str(secs):
        if not secs:
            return "0s"
        secs = int(secs)
        if secs >= 60:
            return f"{secs // 60}m {secs % 60}s"
        return f"{secs}s"

    if not attempts and log:
        first_time = log.initial_time_spent or log.time_spent or 0
        pct = log.progress_percent or (100 if log.completed else 0)
        curr_slide = total_slides if log.completed else max(1, min(total_slides, round((pct / 100) * total_slides)))
        created_str = log.created_at.strftime('%b %d, %Y · %I:%M %p') if log.created_at else 'N/A'
        attempts_list = [{
            'attempt_number': 1,
            'visit_title': 'First Visit (Initial)',
            'time_spent': first_time,
            'time_spent_formatted': format_time_str(first_time),
            'completed': bool(log.completed),
            'progress_percent': pct,
            'current_slide': curr_slide,
            'total_slides': total_slides,
            'created_at': log.created_at,
            'created_at_formatted': created_str
        }]
    else:
        attempts_list = []
        for a in attempts:
            title = 'First Visit (Initial)' if a.attempt_number == 1 else f'Revisit #{a.attempt_number - 1}'
            pct = a.progress_percent or (100 if a.completed else 0)
            curr_slide = total_slides if a.completed else max(1, min(total_slides, round((pct / 100) * total_slides)))
            created_str = a.created_at.strftime('%b %d, %Y · %I:%M %p') if a.created_at else 'N/A'
            attempts_list.append({
                'attempt_number': a.attempt_number,
                'visit_title': title,
                'time_spent': a.time_spent or 0,
                'time_spent_formatted': format_time_str(a.time_spent or 0),
                'completed': bool(a.completed),
                'progress_percent': pct,
                'current_slide': curr_slide,
                'total_slides': total_slides,
                'created_at': a.created_at,
                'created_at_formatted': created_str
            })

    total_time_seconds = sum(item['time_spent'] for item in attempts_list) if attempts_list else (log.total_time_spent if log else 0)
    first_visit_time = attempts_list[0]['time_spent'] if attempts_list else 0
    revisit_attempts = attempts_list[1:] if len(attempts_list) > 1 else []
    avg_revisit_time = round(sum(r['time_spent'] for r in revisit_attempts) / len(revisit_attempts)) if revisit_attempts else 0

    return {
        'student': student,
        'lesson': lesson,
        'log': log,
        'attempts': attempts_list,
        'total_time_seconds': total_time_seconds,
        'first_visit_time': first_visit_time,
        'avg_revisit_time': avg_revisit_time,
        'revisit_count': len(revisit_attempts),
        'kpis': {
            'total_attempts': len(attempts_list),
            'revisit_count': len(revisit_attempts),
            'first_visit_time_formatted': format_time_str(first_visit_time),
            'avg_revisit_time_formatted': format_time_str(avg_revisit_time),
            'total_time_formatted': format_time_str(total_time_seconds)
        }
    }


@teacher_bp.route('/lesson_history/<int:student_id>/<int:lesson_id>')
@require_role('teacher')
def lesson_history(student_id, lesson_id):
    """Detailed timeline of a student's initial visit and all revisits for a lesson"""
    current_user = get_current_user()
    log_access(current_user, 'page_view', f'lesson_history_{student_id}_{lesson_id}')

    data = _build_lesson_history_data(student_id, lesson_id)
    if not data:
        flash('Student or lesson not found.', 'danger')
        return redirect(url_for('teacher.analytics'))

    return render_template(
        'teacher/lesson_history.html',
        student=data['student'],
        lesson=data['lesson'],
        log=data['log'],
        attempts=data['attempts'],
        total_time_seconds=data['total_time_seconds'],
        first_visit_time=data['first_visit_time'],
        avg_revisit_time=data['avg_revisit_time'],
        revisit_count=data['revisit_count'],
        current_user=current_user
    )


@teacher_bp.route('/api/lesson_history/<int:student_id>/<int:lesson_id>')
@require_role('teacher')
def api_lesson_history(student_id, lesson_id):
    """Real-time JSON endpoint for live polling student lesson history"""
    data = _build_lesson_history_data(student_id, lesson_id)
    if not data:
        return jsonify({'success': False, 'error': 'Not found'}), 404

    serialized_attempts = []
    for att in data['attempts']:
        serialized_attempts.append({
            'attempt_number': att['attempt_number'],
            'visit_title': att['visit_title'],
            'is_first': (att['attempt_number'] == 1),
            'time_spent': att['time_spent'],
            'time_spent_formatted': att['time_spent_formatted'],
            'completed': att['completed'],
            'progress_percent': att['progress_percent'],
            'current_slide': att['current_slide'],
            'total_slides': att['total_slides'],
            'created_at_formatted': att['created_at_formatted']
        })

    return jsonify({
        'success': True,
        'attempts': serialized_attempts,
        'kpis': data['kpis']
    })
