import os
import json
import base64
import uuid
from datetime import datetime, timedelta
from pathlib import Path

from flask import Blueprint, render_template, request, flash, redirect, url_for, jsonify, current_app, Response
from database.models import db, Lesson, Activity, User, ProgressLog, LessonAssignment, ActivityAssignment, AttemptLog, UserBadge, LessonProgress, LessonAttemptLog, Badge, AttemptObjectLog, TeacherAsset, StudentNotification
from routes.utils import get_current_user, require_role, log_access, csrf, to_ph_time, ensure_trixia_lesson_progress, format_relative_time


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
        'value': 'Plant Parts — Build a Plant',
        'label': 'Build a Plant',
        'description': 'Assemble roots, stems, leaves, and flowers to grow healthy plants.',
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


def get_students_effective_last_seen_map():
    """Returns a dict {student_id: datetime} representing the most recent timestamp of activity across all tables."""
    result = {}
    try:
        for u in User.query.filter_by(role='student').all():
            if u.last_seen:
                result[u.id] = u.last_seen

        al_max = db.session.query(
            AttemptLog.student_id, db.func.max(AttemptLog.created_at)
        ).filter(AttemptLog.created_at.isnot(None)).group_by(AttemptLog.student_id).all()
        for s_id, ts in al_max:
            if s_id and ts and (s_id not in result or ts > result[s_id]):
                result[s_id] = ts

        lal_max = db.session.query(
            LessonAttemptLog.student_id, db.func.max(LessonAttemptLog.created_at)
        ).filter(LessonAttemptLog.created_at.isnot(None)).group_by(LessonAttemptLog.student_id).all()
        for s_id, ts in lal_max:
            if s_id and ts and (s_id not in result or ts > result[s_id]):
                result[s_id] = ts

        lp_max = db.session.query(
            LessonProgress.student_id,
            db.func.max(db.func.coalesce(LessonProgress.updated_at, LessonProgress.completed_at))
        ).group_by(LessonProgress.student_id).all()
        for s_id, ts in lp_max:
            if s_id and ts and (s_id not in result or ts > result[s_id]):
                result[s_id] = ts

        pl_max = db.session.query(
            ProgressLog.student_id, db.func.max(ProgressLog.completed_at)
        ).filter(ProgressLog.completed_at.isnot(None)).group_by(ProgressLog.student_id).all()
        for s_id, ts in pl_max:
            if s_id and ts and (s_id not in result or ts > result[s_id]):
                result[s_id] = ts
    except Exception:
        pass
    return result


def build_live_lesson_tracker(online_students_set=None):
    try:
        ensure_trixia_lesson_progress()
    except Exception:
        pass
    if online_students_set is None:
        online_threshold = datetime.utcnow() - timedelta(minutes=3)
        online_students_set = set(u.id for u in User.query.filter(User.role == 'student', User.last_seen >= online_threshold).all())

    effective_last_seen_map = get_students_effective_last_seen_map()

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
        curr_slide = (lp.current_slide or 0) + 1
        revisit_count = lp.revisit_count or 0

        has_master_completion = bool(lp.completed or (lp.progress_percent or 0) >= 100 or lp.completed_at is not None)
        is_completed = has_master_completion
        is_revisit = False
        revisit_num = 0

        if attempts:
            latest_attempt = attempts[-1]
            if latest_attempt.completed:
                is_completed = True
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
            is_completed = has_master_completion or bool(lp.completed)
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

        # Student is considered actively in THIS lesson only if they are online AND this lesson was updated recently (within 60s)
        active_lesson_window = datetime.utcnow() - timedelta(seconds=60)
        is_lesson_actively_open = bool(lp.updated_at and lp.updated_at >= active_lesson_window)
        is_student_online = (lp.student_id in online_students_set)
        is_active_online = is_student_online and is_lesson_actively_open and not is_completed

        if attempts:
            first_att = attempts[0]
            first_time_sec = first_att.time_spent or 0
            first_time_str = format_time_duration(first_time_sec)
            latest_att = attempts[-1]
            latest_time_sec = latest_att.time_spent or 0
            latest_time_str = format_time_duration(latest_time_sec)
            tot_sec = sum((att.time_spent or 0) for att in attempts)
            tot_str = format_time_duration(tot_sec)

            if len(attempts) > 1:
                if is_active_online:
                    time_spent_display = (
                        f'<div class="d-flex flex-column gap-1">'
                        f'  <div class="d-flex flex-wrap gap-1 align-items-center">'
                        f'    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1" title="First Visit (Initial)"><i class="bi bi-flag-fill me-1"></i>First: {first_time_str}</span>'
                        f'    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 live-time-ticker" data-seconds="{latest_time_sec}" data-base-total="{tot_sec - latest_time_sec}" title="Live Revisit Active Now"><span class="status-pulse-dot me-1"></span>Live R{len(attempts)-1}: <span class="time-val">{latest_time_str}</span></span>'
                        f'  </div>'
                        f'  <div class="fw-bold text-dark small mt-1"><i class="bi bi-hourglass-split me-1 text-secondary"></i>Total: <span class="total-val">{tot_str}</span></div>'
                        f'</div>'
                    )
                else:
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
                if is_active_online:
                    time_spent_display = (
                        f'<div class="d-flex flex-column gap-1">'
                        f'  <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 live-time-ticker" data-seconds="{first_time_sec}" data-base-total="0" title="Live Initial Visit Active Now"><span class="status-pulse-dot me-1"></span>Live: <span class="time-val">{first_time_str}</span></span>'
                        f'  <div class="small text-muted"><i class="bi bi-hourglass-split me-1"></i>Total: <span class="total-val">{tot_str}</span></div>'
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
                if is_active_online:
                    time_spent_display = (
                        f'<div class="d-flex flex-column gap-1">'
                        f'  <div class="d-flex flex-wrap gap-1 align-items-center">'
                        f'    <span class="badge bg-primary-subtle text-primary border border-primary-subtle px-2 py-1"><i class="bi bi-flag-fill me-1"></i>First: {format_time_duration(init_sec)}</span>'
                        f'    <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 live-time-ticker" data-seconds="{sec}" data-base-total="{tot_sec - sec}" title="Live Revisit Active Now"><span class="status-pulse-dot me-1"></span>Live Current: <span class="time-val">{format_time_duration(sec)}</span></span>'
                        f'  </div>'
                        f'  <div class="fw-bold text-dark small mt-1"><i class="bi bi-hourglass-split me-1 text-secondary"></i>Total: <span class="total-val">{format_time_duration(tot_sec)}</span></div>'
                        f'</div>'
                    )
                else:
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
                if is_active_online:
                    time_spent_display = (
                        f'<div class="d-flex flex-column gap-1">'
                        f'  <span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1 live-time-ticker" data-seconds="{sec}" data-base-total="0" title="Live Initial Visit Active Now"><span class="status-pulse-dot me-1"></span>Live: <span class="time-val">{format_time_duration(sec)}</span></span>'
                        f'  <div class="small text-muted"><i class="bi bi-hourglass-split me-1"></i>Total: <span class="total-val">{format_time_duration(sec)}</span></div>'
                        f'</div>'
                    )
                else:
                    time_spent_display = (
                        f'<div class="d-flex flex-column gap-1">'
                        f'  <span class="badge bg-light text-dark border px-2 py-1"><i class="bi bi-clock me-1 text-primary"></i>First: {format_time_duration(sec)}</span>'
                        f'  <div class="small text-muted"><i class="bi bi-hourglass-split me-1"></i>Total: {format_time_duration(sec)}</div>'
                        f'</div>'
                    )

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

        if lp.student and lp.student.is_archived:
            continue

        s_last_seen = effective_last_seen_map.get(lp.student_id) or (lp.student.last_seen if lp.student else None)
        if not s_last_seen and lp:
            s_last_seen = lp.updated_at or lp.completed_at or (lp.student.created_at if lp.student else None)
        is_stud_online = lp.student_id in online_students_set
        s_rel = format_relative_time(s_last_seen) if not is_stud_online else 'Online Now'
        s_fmt = to_ph_time(s_last_seen).strftime('%b %d, %Y at %I:%M %p') if s_last_seen else 'Never active'

        live_lesson_tracker.append({
            'student_id': lp.student_id,
            'student_name': lp.student.name if lp.student else f'Student #{lp.student_id}',
            'student_username': lp.student.username if lp.student else '',
            'is_online': is_stud_online,
            'last_seen': s_last_seen,
            'last_seen_relative': s_rel,
            'last_seen_formatted': s_fmt,
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




def strip_emojis(text):
    """Remove emoji and pictograph characters from labels and strings."""
    if not text:
        return ''
    import re
    emoji_pattern = re.compile(
        "["
        "\U00010000-\U0010ffff"
        "\u2600-\u26ff"
        "\u2700-\u27bf"
        "\u2300-\u23ff"
        "\u2b50"
        "]+",
        flags=re.UNICODE
    )
    cleaned = emoji_pattern.sub('', str(text))
    return re.sub(r'\s+', ' ', cleaned).strip()


def format_item_name(item_id):
    """Format raw object IDs or question IDs into clean human readable titles without dashes and emojis."""
    if not item_id:
        return 'Item'
    s = strip_emojis(str(item_id)).strip()
    if ' ' in s:
        return s
    if '_' in s:
        return s.replace('_', ' ').title()
    import re
    spaced = re.sub(r'([a-z])([A-Z])', r'\1 \2', s)
    return spaced.title()


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
                    'date': to_ph_time(a.created_at).strftime('%b %d') if a.created_at else '',
                    'date_full': to_ph_time(a.created_at).strftime('%b %d, %Y %I:%M %p') if a.created_at else ''
                }
                for idx, a in enumerate(attempts)
            ]
        })

    retry_progression.sort(key=lambda x: (x['attempt_count'] > 1, x['improvement'], x['attempt_count']), reverse=True)
    return retry_progression


def get_recommendation_for_concept(concept_name, activity_type='', engine='', lesson_title=''):
    """Generates recommendation with the specific name of the lesson needed."""
    # If the activity is already linked to a specific curriculum lesson, recommend that lesson directly
    if lesson_title and lesson_title not in ['General Science Module', 'None', ''] and not lesson_title.startswith('Lesson #'):
        return f"Review Lesson: {lesson_title}"

    c_lower = (concept_name or '').lower()
    t_lower = (activity_type or '').lower()
    combined = f"{c_lower} {t_lower} {(engine or '').lower()}"

    if any(k in combined for k in ['root', 'stem', 'leaf', 'leaves', 'flower', 'seed', 'petal', 'trunk', 'bark', 'branch', 'fruit', 'plant part', 'build a plant']):
        return "Review Lesson: Plant Parts"
    elif any(k in combined for k in ['fin', 'wing', 'tail', 'leg', 'beak', 'ear', 'horn', 'fur', 'feather', 'claw', 'gills', 'find the part', 'animal body']):
        return "Review Lesson: Animal Body Parts"
    elif any(k in combined for k in ['solid', 'liquid', 'gas', 'steam', 'ice', 'vapor', 'melt', 'freeze', 'matter', 'volume']):
        return "Review Lesson: States of Matter"
    elif any(k in combined for k in ['metal', 'iron', 'copper', 'gold', 'silver', 'magnet']):
        return "Review Lesson: Properties of Metals"
    elif any(k in combined for k in ['recycle', 'recycling', 'plastic', 'paper', 'glass', 'organic', 'compost', 'biodegradable', 'ecoswipe', 'sorter']):
        return "Review Lesson: Recycling"
    elif any(k in combined for k in ['living', 'non-living', 'alive', 'claw machine']):
        return "Review Lesson: Living vs Non-Living"
    # Dynamically match against custom/future lessons in the database
    try:
        active_custom_lessons = Lesson.query.filter((Lesson.is_archived == False) | (Lesson.is_archived == None)).all()
        for cl in active_custom_lessons:
            if cl.title and any(word in combined for word in cl.title.lower().split() if len(word) > 3):
                return f"Review Lesson: {cl.title}"
    except Exception:
        pass

    if lesson_title and lesson_title != 'General Science Module':
        return f"Review Lesson: {lesson_title}"
    else:
        return f"Review Lesson on {concept_name.title()}"


def get_struggling_concepts(is_lesson=True, limit=None):
    """Returns missed questions/items grouped with miss counts, lesson context, pedagogical recommendations, and distinct student names who struggled."""
    object_library = {obj['id']: obj for obj in load_teacher_object_library()}
    query = db.session.query(
        AttemptObjectLog.object_id,
        Activity.id.label('activity_id'),
        Activity.type.label('activity_type'),
        Activity.engine.label('activity_engine'),
        Activity.lesson_id.label('lesson_id'),
        Lesson.title.label('lesson_title'),
        User.id.label('student_id'),
        User.name.label('student_name'),
        User.username.label('student_username'),
        db.func.count(AttemptObjectLog.id).label('miss_count')
    ).join(
        AttemptLog, AttemptLog.id == AttemptObjectLog.attempt_log_id
    ).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).outerjoin(
        Lesson, Lesson.id == Activity.lesson_id
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
        Activity.id,
        Activity.type,
        Activity.engine,
        Activity.lesson_id,
        Lesson.title,
        User.id,
        User.name,
        User.username
    ).all()

    grouped = {}
    for r in raw_results:
        key = (r.object_id, r.activity_id, r.activity_type)
        if key not in grouped:
            grouped[key] = {
                'misses': 0,
                'students': [],
                'activity_id': r.activity_id,
                'activity_type': r.activity_type or 'Interactive Game',
                'activity_engine': r.activity_engine or 'game',
                'lesson_id': r.lesson_id,
                'lesson_title': r.lesson_title or (f"Lesson #{r.lesson_id}" if r.lesson_id else "General Science Module")
            }
        grouped[key]['misses'] += r.miss_count
        student_display = r.student_name or r.student_username
        if student_display:
            existing = next((s for s in grouped[key]['students'] if s.get('id') == r.student_id or s.get('name') == student_display), None)
            if existing:
                existing['miss_count'] += r.miss_count
            else:
                grouped[key]['students'].append({
                    'id': r.student_id,
                    'name': student_display,
                    'username': r.student_username or '',
                    'miss_count': int(r.miss_count or 1)
                })

    for val in grouped.values():
        val['students'].sort(key=lambda s: s['miss_count'], reverse=True)

    items = []
    for (obj_id_raw, act_id, act_type), val in grouped.items():
        obj_id = str(obj_id_raw)
        obj_name = object_library.get(obj_id, {}).get('label')
        if not obj_name:
            for item in object_library.values():
                if item.get('label', '').lower() == obj_id.lower():
                    obj_name = item.get('label')
                    break
        if not obj_name:
            obj_name = format_item_name(obj_id)
        obj_name = strip_emojis(obj_name)

        rec = get_recommendation_for_concept(obj_name, val['activity_type'], val['activity_engine'], val['lesson_title'])

        stud_list = val['students']
        student_total = len(stud_list)
        total_misses = val['misses']
        repeated_count = sum(1 for s in stud_list if s.get('miss_count', 0) >= 2)
        single_count = sum(1 for s in stud_list if s.get('miss_count', 0) == 1)
        avg_miss = round(total_misses / max(student_total, 1), 1)

        # Severity classification:
        # High: Persistent struggle (repeated_count >= 2) OR class-wide struggle (>= 5 students failed, or total_misses >= 8)
        # Medium: Moderate struggle (>= 3 students, or total misses >= 4, or repeated misses >= 1)
        # Low: Isolated 1-time slip-ups (1-2 students with only 1 miss)
        if repeated_count >= 2 or student_total >= 5 or total_misses >= 8:
            severity = 'high'
            severity_label = 'High Struggle'
        elif student_total >= 3 or total_misses >= 4 or repeated_count >= 1:
            severity = 'medium'
            severity_label = 'Moderate'
        else:
            severity = 'low'
            severity_label = 'Minor Slip'

        # Weighted pedagogical score prioritizes persistent struggles over single accidental slips
        weighted_score = (repeated_count * 15) + (total_misses * 2) + (student_total * 3)

        items.append({
            'name': obj_name,
            'object_id': obj_id,
            'activity_id': val['activity_id'],
            'activity_type': val['activity_type'],
            'activity_engine': val['activity_engine'],
            'lesson_id': val['lesson_id'],
            'lesson_title': val['lesson_title'],
            'misses': total_misses,
            'students': stud_list,
            'recommendation': rec,
            'severity': severity,
            'severity_label': severity_label,
            'repeated_count': repeated_count,
            'single_count': single_count,
            'avg_miss': avg_miss,
            'weighted_score': weighted_score
        })

    # Sort primarily by weighted struggle score (persistent errors first), then by total misses
    items.sort(key=lambda x: (x.get('weighted_score', 0), x['misses']), reverse=True)
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
        fragments = [activity_name_fragment] if isinstance(activity_name_fragment, str) else list(activity_name_fragment)
        conditions = []
        for frag in fragments:
            conditions.append(Activity.type.ilike(f'%{frag}%'))
            conditions.append(Activity.engine.ilike(f'%{frag}%'))

        pl_rows = db.session.query(
            User.id.label('id'),
            User.name.label('name'),
            db.func.max(ProgressLog.score).label('best_score'),
            db.func.min(ProgressLog.time_spent).label('time_spent')
        ).join(ProgressLog, User.id == ProgressLog.student_id
        ).join(Activity, Activity.id == ProgressLog.activity_id
        ).filter(
            User.role == 'student',
            db.or_(*conditions)
        ).group_by(User.id, User.name).all()

        att_rows = db.session.query(
            User.id.label('id'),
            User.name.label('name'),
            db.func.max(AttemptLog.score).label('best_score'),
            db.func.min(AttemptLog.time_spent).label('time_spent')
        ).join(AttemptLog, User.id == AttemptLog.student_id
        ).join(Activity, Activity.id == AttemptLog.activity_id
        ).filter(
            User.role == 'student',
            db.or_(*conditions)
        ).group_by(User.id, User.name).all()

        user_map = {}
        for r in pl_rows:
            user_map[r.id] = {'id': r.id, 'name': r.name, 'best_score': int(r.best_score or 0), 'time_spent': int(r.time_spent or 0)}
        for r in att_rows:
            s = int(r.best_score or 0)
            t = int(r.time_spent or 0)
            if r.id not in user_map:
                user_map[r.id] = {'id': r.id, 'name': r.name, 'best_score': s, 'time_spent': t}
            else:
                if s > user_map[r.id]['best_score']:
                    user_map[r.id]['best_score'] = s
                    user_map[r.id]['time_spent'] = t

        sorted_list = sorted(user_map.values(), key=lambda x: (x['best_score'], -x['time_spent']), reverse=True)
        return sorted_list[:10]

    claw_leaderboard = get_teacher_game_leaderboard(['claw_machine', 'Claw Machine'])
    animal_leaderboard = get_teacher_game_leaderboard(['find_the_part', 'Find the Part', 'animal'])
    plant_leaderboard = get_teacher_game_leaderboard(['build_a_plant', 'Build a Plant', 'plant'])
    metal_leaderboard = get_teacher_game_leaderboard(['metal_logic', 'metal', 'Metal Clue'])
    recycling_leaderboard = get_teacher_game_leaderboard(['recycle', 'recycle_sorter', 'EcoSwipe', 'sorter'])

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

    most_missed_lessons = get_struggling_concepts(is_lesson=True, limit=5)
    most_missed_activities = get_struggling_concepts(is_lesson=False, limit=5)
    all_struggling_concepts = most_missed_lessons + most_missed_activities
    all_struggling_concepts.sort(key=lambda x: x['misses'], reverse=True)
    struggle_chart_labels = [c['name'] for c in all_struggling_concepts[:6]]
    struggle_chart_misses = [c['misses'] for c in all_struggling_concepts[:6]]
    struggle_chart_types = [c['activity_type'] for c in all_struggling_concepts[:6]]
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
        all_struggling_concepts=all_struggling_concepts,
        struggle_chart_labels=struggle_chart_labels,
        struggle_chart_misses=struggle_chart_misses,
        struggle_chart_types=struggle_chart_types,
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
    active_tab = request.args.get('tab', '').strip().lower()
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

    effective_map = get_students_effective_last_seen_map()
    students_data = []
    online_count = 0
    total_class_progress = 0

    active_students_data = []
    archived_students_data = []

    for s in student_users:
        is_online = bool(s.last_seen and s.last_seen >= online_threshold)
        if is_online and not s.is_archived:
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

        if not s.is_archived:
            total_class_progress += overall_pct

        total_points = sum((p.score or 0) for p in s_progs)
        badge_count = len(badges_by_student.get(s.id, []))

        s_attempts = attempts_by_student.get(s.id, [])
        latest_attempt_date = max((a.created_at for a in s_attempts if a.created_at), default=None)
        eff_last_seen = effective_map.get(s.id) or latest_attempt_date or s.last_seen or s.created_at
        latest_active = eff_last_seen

        s_rel = format_relative_time(eff_last_seen) if not is_online else 'Online Now'
        s_fmt = to_ph_time(eff_last_seen).strftime('%b %d, %Y at %I:%M %p') if eff_last_seen else 'Never active'

        item = {
            'id': s.id,
            'name': s.name,
            'username': s.username,
            'is_online': is_online,
            'is_archived': bool(s.is_archived),
            'deleted_at': s.deleted_at,
            'last_seen': eff_last_seen,
            'last_seen_relative': s_rel,
            'last_seen_formatted': s_fmt,
            'latest_active': latest_active,
            'completed_lessons': completed_lessons,
            'assigned_lessons': assigned_lessons,
            'completed_activities': completed_activities,
            'assigned_activities': assigned_activities,
            'overall_progress': overall_pct,
            'total_points': total_points,
            'badge_count': badge_count
        }

        if s.is_archived:
            archived_students_data.append(item)
        else:
            active_students_data.append(item)

    avg_class_progress = round(total_class_progress / len(active_students_data)) if active_students_data else 0
    online_students_set = set(s.id for s in student_users if not s.is_archived and s.last_seen and s.last_seen >= online_threshold)
    live_lesson_tracker = build_live_lesson_tracker(online_students_set)

    return render_template(
        'teacher/teacher_students.html',
        current_user=current_user,
        students=active_students_data,
        archived_students=archived_students_data,
        live_lesson_tracker=live_lesson_tracker,
        total_students=len(active_students_data),
        archived_count=len(archived_students_data),
        online_count=online_count,
        avg_class_progress=avg_class_progress,
        search_query=search_query,
        active_tab=active_tab
    )


@teacher_bp.route('/lessons')
@require_role('teacher')
def lessons():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_lessons')

    lessons = Lesson.query.filter(
        (Lesson.is_archived == False) | (Lesson.is_archived == None)
    ).order_by(Lesson.id.asc()).all()
    activities = Activity.query.filter(
        ~Activity.engine.in_(['quick_check', 'lesson']),
        ~Activity.type.ilike('%Quick Check%'),
        ~Activity.type.ilike('%Slide Questions%')
    ).order_by(Activity.created_at.desc()).all()
    students = User.query.filter_by(role='student').order_by(User.name.asc()).all()

    lesson_assignments = LessonAssignment.query.order_by(LessonAssignment.created_at.desc()).all()
    activity_assignments = ActivityAssignment.query.order_by(ActivityAssignment.created_at.desc()).all()

    # Map each lesson to its primary paired game activity (e.g. Claw Machine, Build a Plant)
    lesson_activity_map = {}
    for lesson in lessons:
        paired_act = Activity.query.filter_by(lesson_id=lesson.id).filter(
            Activity.engine.in_(['claw_machine', 'find_the_part', 'build_a_plant', 'metal_logic', 'recycle_sorter']),
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

    active_lesson_assignments = [la for la in lesson_assignments if not la.is_archived]
    archived_lesson_assignments = [la for la in lesson_assignments if la.is_archived]

    active_activity_assignments = [aa for aa in activity_assignments if not aa.is_archived]
    archived_activity_assignments = [aa for aa in activity_assignments if aa.is_archived]

    # Containerize lesson assignments per lesson module
    lesson_groups_dict = {}
    for la in active_lesson_assignments:
        lid = la.lesson_id
        if lid not in lesson_groups_dict:
            lesson_groups_dict[lid] = {
                'lesson': la.lesson,
                'lesson_id': lid,
                'title': la.lesson.title if la.lesson else f'Lesson #{lid}',
                'assignments': [],
                'total_assigned': 0,
                'completed_count': 0
            }
        lesson_groups_dict[lid]['assignments'].append(la)
        lesson_groups_dict[lid]['total_assigned'] += 1
        if la.status == 'completed':
            lesson_groups_dict[lid]['completed_count'] += 1
    lesson_assignment_groups = list(lesson_groups_dict.values())
    lesson_assignment_groups.sort(key=lambda g: g['title'])

    # Containerize activity assignments per game/activity
    activity_groups_dict = {}
    for aa in active_activity_assignments:
        aid = aa.activity_id
        if aid not in activity_groups_dict:
            activity_groups_dict[aid] = {
                'activity': aa.activity,
                'activity_id': aid,
                'title': aa.activity.type if aa.activity else f'Activity #{aid}',
                'engine': aa.activity.engine if aa.activity else 'game',
                'assignments': [],
                'total_assigned': 0,
                'completed_count': 0
            }
        activity_groups_dict[aid]['assignments'].append(aa)
        activity_groups_dict[aid]['total_assigned'] += 1
        if aa.status in ('completed', 'attempts_exhausted'):
            activity_groups_dict[aid]['completed_count'] += 1
    activity_assignment_groups = list(activity_groups_dict.values())
    activity_assignment_groups.sort(key=lambda g: g['title'])

    active_students = [s for s in students if not s.is_archived]

    existing_assignments = {
        'lessons': [{'student_id': la.student_id, 'lesson_id': la.lesson_id} for la in active_lesson_assignments],
        'activities': [{'student_id': aa.student_id, 'activity_id': aa.activity_id, 'status': aa.status} for aa in active_activity_assignments]
    }

    return render_template(
        'teacher/teacher_lessons.html',
        current_user=current_user,
        lessons=lessons,
        activities=activities,
        students=active_students,
        lesson_assignments=active_lesson_assignments,
        archived_lesson_assignments=archived_lesson_assignments,
        activity_assignments=active_activity_assignments,
        archived_activity_assignments=archived_activity_assignments,
        lesson_assignment_groups=lesson_assignment_groups,
        activity_assignment_groups=activity_assignment_groups,
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
                if candidate_act and candidate_act.engine in ['claw_machine', 'find_the_part', 'build_a_plant', 'metal_logic', 'recycle_sorter']:
                    act_id = candidate_id
            except (ValueError, TypeError):
                act_id = None

        if not act_id:
            paired_act = Activity.query.filter_by(lesson_id=lesson_id).filter(
                Activity.engine.in_(['claw_machine', 'find_the_part', 'build_a_plant', 'metal_logic', 'recycle_sorter']),
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
        lesson_supp = getattr(lesson, 'is_supplementary', False)
        lesson_term = getattr(lesson, 'term', None) or 'Term 1'
        paired_act_obj = Activity.query.get(act_id) if act_id else None
        act_supp = getattr(paired_act_obj, 'is_supplementary', False) or lesson_supp
        act_term = getattr(paired_act_obj, 'term', None) or lesson_term

        for st in all_students:
            existing_la = LessonAssignment.query.filter_by(student_id=st.id, lesson_id=lesson_id).first()
            if not existing_la:
                db.session.add(LessonAssignment(
                    lesson_id=lesson_id,
                    student_id=st.id,
                    assigned_by=current_user.id,
                    due_date=due_date,
                    term=lesson_term,
                    is_supplementary=lesson_supp
                ))
                assigned_count += 1
            if act_id:
                existing_aa = ActivityAssignment.query.filter_by(student_id=st.id, activity_id=act_id).first()
                if not existing_aa:
                    db.session.add(ActivityAssignment(
                        activity_id=act_id,
                        student_id=st.id,
                        assigned_by=current_user.id,
                        due_date=due_date,
                        term=act_term,
                        is_supplementary=act_supp
                    ))
                elif existing_aa.status in ('completed', 'attempts_exhausted'):
                    existing_aa.status = 'assigned'
                    existing_aa.assigned_at = datetime.utcnow()
                    existing_aa.due_date = due_date
                    existing_aa.term = act_term
                    existing_aa.is_supplementary = act_supp

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

    lesson_supp = getattr(lesson, 'is_supplementary', False)
    lesson_term = getattr(lesson, 'term', None) or 'Term 1'
    paired_act_obj = Activity.query.get(act_id) if act_id else None
    act_supp = getattr(paired_act_obj, 'is_supplementary', False) or lesson_supp
    act_term = getattr(paired_act_obj, 'term', None) or lesson_term

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
            existing_act_assign.term = act_term
            existing_act_assign.is_supplementary = act_supp
            db.session.commit()
            log_access(current_user, 'reassign_activity', f'activity_id={act_id} student_id={student_id}')
            flash(f'Paired activity "{act_name}" reassigned successfully to {student_name} with 3 fresh attempts.', 'success')
            return redirect(request.referrer or url_for('teacher.lessons'))
        else:
            act_assign = ActivityAssignment(
                activity_id=act_id,
                student_id=student_id,
                assigned_by=current_user.id,
                due_date=due_date,
                term=act_term,
                is_supplementary=act_supp
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
        due_date=due_date,
        term=lesson_term,
        is_supplementary=lesson_supp
    )
    db.session.add(assignment)

    activity_msg = ""
    if act_id:
        if existing_act_assign:
            existing_act_assign.status = 'assigned'
            existing_act_assign.assigned_at = datetime.utcnow()
            existing_act_assign.due_date = due_date
            existing_act_assign.term = act_term
            existing_act_assign.is_supplementary = act_supp
            activity_msg = f' and paired activity "{act_name}" reassigned'
        else:
            act_assign = ActivityAssignment(
                activity_id=act_id,
                student_id=student_id,
                assigned_by=current_user.id,
                due_date=due_date,
                term=act_term,
                is_supplementary=act_supp
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
    activity_supp = getattr(activity, 'is_supplementary', False)
    activity_term = getattr(activity, 'term', None) or 'Term 1'

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
                    due_date=due_date,
                    term=activity_term,
                    is_supplementary=activity_supp
                ))
            elif existing.status in ('attempts_exhausted', 'completed'):
                existing.status = 'assigned'
                existing.assigned_at = datetime.utcnow()
                existing.due_date = due_date
                existing.term = activity_term
                existing.is_supplementary = activity_supp

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
            existing.term = activity_term
            existing.is_supplementary = activity_supp
            db.session.commit()
            log_access(current_user, 'reassign_activity', f'activity_id={activity_id} student_id={student_id}')
            flash(f'Activity "{act_name}" reassigned successfully to {student_name} with 3 fresh attempts.', 'success')
            return redirect(request.referrer or url_for('teacher.lessons'))
        else:
            flash(f'"{act_name}" is already actively assigned to {student_name}.', 'warning')
            return redirect(request.referrer or url_for('teacher.lessons'))

    assignment = ActivityAssignment(
        activity_id=activity_id,
        student_id=student_id,
        assigned_by=current_user.id,
        due_date=due_date,
        term=activity_term,
        is_supplementary=activity_supp
    )
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


@teacher_bp.route('/batch_assign_intervention', methods=['POST'])
@require_role('teacher')
def batch_assign_intervention():
    current_user = get_current_user()
    data = request.get_json(force=True, silent=True) or request.form or {}
    
    student_ids = data.get('student_ids')
    lesson_id = data.get('lesson_id')
    activity_id = data.get('activity_id')
    due_date_raw = data.get('due_date')
    assign_type = data.get('assign_type', 'lesson')
    is_supplementary = bool(data.get('is_supplementary', True))

    if isinstance(student_ids, str):
        try:
            student_ids = [int(s.strip()) for s in student_ids.split(',') if s.strip()]
        except Exception:
            student_ids = []
    elif isinstance(student_ids, list):
        try:
            student_ids = [int(s) for s in student_ids]
        except Exception:
            student_ids = []

    if not student_ids:
        return jsonify({'status': 'error', 'message': 'No students selected for intervention.'}), 400

    due_date = None
    if due_date_raw:
        try:
            due_date = datetime.fromisoformat(due_date_raw)
        except Exception:
            due_date = None

    assigned_count = 0

    try:
        if assign_type == 'nudge':
            try:
                lesson_id_int = int(lesson_id) if lesson_id else None
            except (ValueError, TypeError):
                lesson_id_int = None

            lesson = Lesson.query.get(lesson_id_int) if lesson_id_int else None
            lesson_title = lesson.title if lesson else (data.get('lesson_title') or "Science Lesson")
            concept_item = (data.get('concept') or '').strip()

            target_url = url_for('student.living_non_living_lesson', lesson_id=lesson.id) if lesson else url_for('student.lessons')

            for sid in student_ids:
                st = User.query.get(sid)
                if not st:
                    continue

                notif_msg = f"Teacher reminder: Please review '{lesson_title}'"
                if concept_item:
                    notif_msg += f" — focus on '{concept_item}'!"
                else:
                    notif_msg += " to strengthen your science mastery!"

                new_notif = StudentNotification(
                    student_id=sid,
                    teacher_id=current_user.id,
                    title=f"Review Reminder: {lesson_title}",
                    message=notif_msg,
                    concept=concept_item,
                    action_url=target_url,
                    action_label="Review Lesson"
                )
                db.session.add(new_notif)
                assigned_count += 1

            db.session.commit()
            log_access(current_user, 'batch_send_review_nudge', f'lesson_id={lesson_id} concept={concept_item} student_count={assigned_count}')
            return jsonify({
                'status': 'ok',
                'assigned_count': assigned_count,
                'target_name': lesson_title,
                'type': 'nudge',
                'message': f'Review reminder sent directly to {assigned_count} struggling student(s) for "{concept_item or lesson_title}".'
            })

        elif assign_type == 'activity' and activity_id:
            try:
                activity_id = int(activity_id)
            except (ValueError, TypeError):
                return jsonify({'status': 'error', 'message': 'Invalid activity ID.'}), 400
            
            activity = Activity.query.get(activity_id)
            if not activity:
                return jsonify({'status': 'error', 'message': 'Activity not found.'}), 404
            
            act_name = activity.type or f"Activity #{activity_id}"

            for sid in student_ids:
                st = User.query.get(sid)
                if not st:
                    continue
                existing = ActivityAssignment.query.filter_by(student_id=sid, activity_id=activity_id).first()
                if not existing:
                    new_aa = ActivityAssignment(
                        activity_id=activity_id,
                        student_id=sid,
                        assigned_by=current_user.id,
                        due_date=due_date,
                        is_supplementary=is_supplementary,
                        status='assigned'
                    )
                    db.session.add(new_aa)
                    assigned_count += 1
                else:
                    existing.status = 'assigned'
                    existing.assigned_at = datetime.utcnow()
                    existing.due_date = due_date
                    existing.is_supplementary = is_supplementary
                    assigned_count += 1

            db.session.commit()
            log_access(current_user, 'batch_grant_bonus_attempts', f'activity_id={activity_id} student_count={assigned_count}')
            return jsonify({
                'status': 'ok',
                'assigned_count': assigned_count,
                'target_name': act_name,
                'type': 'activity',
                'message': f'3 bonus practice attempts unlocked today for {assigned_count} student(s) on "{act_name}".'
            })

        elif lesson_id:
            try:
                lesson_id = int(lesson_id)
            except (ValueError, TypeError):
                return jsonify({'status': 'error', 'message': 'Invalid lesson ID.'}), 400

            lesson = Lesson.query.get(lesson_id)
            if not lesson:
                return jsonify({'status': 'error', 'message': 'Lesson not found.'}), 404

            lesson_title = lesson.title or f"Lesson #{lesson_id}"

            for sid in student_ids:
                st = User.query.get(sid)
                if not st:
                    continue
                existing_la = LessonAssignment.query.filter_by(student_id=sid, lesson_id=lesson_id).first()
                if not existing_la:
                    new_la = LessonAssignment(
                        lesson_id=lesson_id,
                        student_id=sid,
                        assigned_by=current_user.id,
                        due_date=due_date,
                        is_supplementary=is_supplementary,
                        status='assigned'
                    )
                    db.session.add(new_la)
                    assigned_count += 1
                else:
                    existing_la.status = 'assigned'
                    existing_la.assigned_at = datetime.utcnow()
                    existing_la.due_date = due_date
                    existing_la.is_supplementary = is_supplementary
                    assigned_count += 1

            db.session.commit()
            log_access(current_user, 'batch_assign_intervention', f'lesson_id={lesson_id} student_count={assigned_count}')
            return jsonify({
                'status': 'ok',
                'assigned_count': assigned_count,
                'target_name': lesson_title,
                'type': 'lesson',
                'message': f'Review lesson "{lesson_title}" assigned to {assigned_count} struggling student(s).'
            })

        else:
            return jsonify({'status': 'error', 'message': 'Neither a lesson nor an activity was specified.'}), 400

    except Exception as e:
        db.session.rollback()
        return jsonify({'status': 'error', 'message': f'Error assigning intervention: {str(e)}'}), 500


@teacher_bp.route('/archive_assignment/<string:assign_type>/<int:assignment_id>', methods=['POST'])
@require_role('teacher')
def archive_assignment(assign_type, assignment_id):
    current_user = get_current_user()
    try:
        if assign_type == 'lesson':
            assign = LessonAssignment.query.get(assignment_id)
        else:
            assign = ActivityAssignment.query.get(assignment_id)

        if not assign:
            flash("Assignment not found.", "warning")
            return redirect(url_for('teacher.lessons'))

        assign.is_archived = True
        assign.deleted_at = datetime.utcnow()
        db.session.commit()
        log_access(current_user, 'archive_assignment', f'type={assign_type} id={assignment_id}')
        flash(f"{assign_type.capitalize()} assignment has been moved to archive. You can restore it anytime from the Archived view.", "warning")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to archive assignment: {str(e)}", "danger")

    return redirect(url_for('teacher.lessons'))


@teacher_bp.route('/restore_assignment/<string:assign_type>/<int:assignment_id>', methods=['POST'])
@require_role('teacher')
def restore_assignment(assign_type, assignment_id):
    current_user = get_current_user()
    try:
        if assign_type == 'lesson':
            assign = LessonAssignment.query.get(assignment_id)
        else:
            assign = ActivityAssignment.query.get(assignment_id)

        if not assign:
            flash("Assignment not found.", "warning")
            return redirect(url_for('teacher.lessons'))

        assign.is_archived = False
        assign.deleted_at = None
        db.session.commit()
        log_access(current_user, 'restore_assignment', f'type={assign_type} id={assignment_id}')
        flash(f"{assign_type.capitalize()} assignment restored to active coursework list.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to restore assignment: {str(e)}", "danger")

    return redirect(url_for('teacher.lessons'))


@teacher_bp.route('/archive_student/<int:student_id>', methods=['POST'])
@require_role('teacher')
def archive_student(student_id):
    current_user = get_current_user()
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        flash("Student not found.", "warning")
        return redirect(url_for('teacher.students'))

    try:
        student.is_archived = True
        student.deleted_at = datetime.utcnow()
        db.session.commit()
        log_access(current_user, 'archive_student', f'target_student={student.username}')
        flash(f"Student '{student.name}' (@{student.username}) has been moved to archive. All coursework and attempts are preserved.", "warning")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to archive student: {str(e)}", "danger")

    return redirect(url_for('teacher.students'))


@teacher_bp.route('/restore_student/<int:student_id>', methods=['POST'])
@require_role('teacher')
def restore_student(student_id):
    current_user = get_current_user()
    student = User.query.filter_by(id=student_id, role='student').first()
    if not student:
        flash("Student not found.", "warning")
        return redirect(url_for('teacher.students', tab='archived'))

    try:
        student.is_archived = False
        student.deleted_at = None
        db.session.commit()
        log_access(current_user, 'restore_student', f'target_student={student.username}')
        flash(f"Student '{student.name}' (@{student.username}) has been restored to active classroom roster.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Failed to restore student: {str(e)}", "danger")

    return redirect(url_for('teacher.students', tab='archived'))


@teacher_bp.route('/analytics')
@require_role('teacher')
def analytics():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_analytics')
    
    lesson_assignments = LessonAssignment.query.filter((LessonAssignment.is_archived == False) | (LessonAssignment.is_archived == None)).all()
    activity_assignments = ActivityAssignment.query.filter((ActivityAssignment.is_archived == False) | (ActivityAssignment.is_archived == None)).all()
    
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

    # Per-student time on task breakdown
    student_time_map = {}
    for a in all_lesson_attempts:
        if a.student_id:
            student_time_map[a.student_id] = student_time_map.get(a.student_id, 0) + (a.time_spent or 0)
    for lp in LessonProgress.query.all():
        if lp.student_id and lp.student_id not in student_time_map:
            student_time_map[lp.student_id] = (lp.total_time_spent or lp.time_spent or 0)

    effective_map = get_students_effective_last_seen_map()

    students_time_list = []
    for s in User.query.filter(User.role == 'student', (User.is_archived == False) | (User.is_archived == None)).order_by(User.name.asc()).all():
        s_sec = student_time_map.get(s.id, 0)
        eff_dt = effective_map.get(s.id) or s.last_seen or s.created_at
        is_online = bool(s.last_seen and s.last_seen >= online_threshold)
        s_rel = format_relative_time(eff_dt) if not is_online else 'Online Now'
        s_fmt = to_ph_time(eff_dt).strftime('%b %d, %Y at %I:%M %p') if eff_dt else 'Never active'
        students_time_list.append({
            'student_id': s.id,
            'name': s.name,
            'username': s.username,
            'time_seconds': s_sec,
            'time_formatted': format_time_duration(s_sec),
            'last_seen': eff_dt,
            'is_online': is_online,
            'last_seen_relative': s_rel,
            'last_seen_formatted': s_fmt
        })
    students_time_list.sort(key=lambda x: x['time_seconds'], reverse=True)
    avg_per_student_sec = round(total_time_task_seconds / max(total_students_count, 1))

    # Live Lesson Slide & Progress Tracker (Manuscript §1: Monitor Student progress)
    live_lesson_tracker = build_live_lesson_tracker(online_students_set)


    # --- Per-student retry progression (teacher-only: does replaying improve scores?) ---
    retry_progression = get_student_retry_progression()

    # --- Full Ranked Top Students Performance ---
    all_top_students_raw = db.session.query(
        User.id.label('id'),
        User.name.label('name'),
        User.username.label('username'),
        User.last_seen.label('last_seen'),
        db.func.coalesce(db.func.sum(ProgressLog.score), 0).label('total_score'),
        db.func.count(db.func.distinct(ProgressLog.activity_id)).label('activities_completed')
    ).outerjoin(ProgressLog, User.id == ProgressLog.student_id).filter(
        User.role == 'student',
        (User.is_archived == False) | (User.is_archived == None)
    ).group_by(User.id, User.name, User.username, User.last_seen).order_by(db.desc('total_score'), User.name.asc()).all()

    all_top_students = []
    for idx, row in enumerate(all_top_students_raw):
        eff_dt = effective_map.get(row.id) or row.last_seen
        is_online = bool(row.last_seen and row.last_seen >= online_threshold)
        s_rel = format_relative_time(eff_dt) if not is_online else 'Online Now'
        s_fmt = to_ph_time(eff_dt).strftime('%b %d, %Y at %I:%M %p') if eff_dt else 'Never active'
        all_top_students.append({
            'rank': idx + 1,
            'id': row.id,
            'name': row.name,
            'username': row.username,
            'total_score': int(row.total_score or 0),
            'activities_completed': int(row.activities_completed or 0),
            'last_seen': eff_dt,
            'is_online': is_online,
            'last_seen_relative': s_rel,
            'last_seen_formatted': s_fmt
        })

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

    # Combined struggling concepts list for comprehensive table & visual chart
    all_struggling_concepts = analytics_missed_lessons + analytics_missed_activities
    all_struggling_concepts.sort(key=lambda x: x['misses'], reverse=True)

    struggle_chart_labels = [strip_emojis(c['name']) for c in all_struggling_concepts[:8]]
    struggle_chart_misses = [c['misses'] for c in all_struggling_concepts[:8]]
    struggle_chart_types = [c['activity_type'] for c in all_struggling_concepts[:8]]

    # Dynamic struggle aggregation per lesson/module for chart filtering
    struggle_chart_by_lesson = {
        'all': {
            'labels': struggle_chart_labels,
            'misses': struggle_chart_misses,
            'types': struggle_chart_types
        }
    }
    for c in all_struggling_concepts:
        lt = c.get('lesson_title') or 'Other / Standalone Games'
        if lt not in struggle_chart_by_lesson:
            struggle_chart_by_lesson[lt] = {
                'labels': [],
                'misses': [],
                'types': []
            }
        if len(struggle_chart_by_lesson[lt]['labels']) < 8:
            clean_name = strip_emojis(c['name'])
            struggle_chart_by_lesson[lt]['labels'].append(clean_name)
            struggle_chart_by_lesson[lt]['misses'].append(c['misses'])
            struggle_chart_by_lesson[lt]['types'].append(c['activity_type'])

    struggle_lessons_list = sorted([k for k in struggle_chart_by_lesson.keys() if k != 'all'])

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
    plant_leaderboard_rows = build_teacher_game_lb('Build a Plant')

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
        'avg_per_student': format_time_duration(avg_per_student_sec),
        'student_time_list': students_time_list,
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
        analytics_missed_activities=analytics_missed_activities,
        all_struggling_concepts=all_struggling_concepts,
        struggle_chart_labels=struggle_chart_labels,
        struggle_chart_misses=struggle_chart_misses,
        struggle_chart_types=struggle_chart_types,
        struggle_chart_by_lesson=struggle_chart_by_lesson,
        struggle_lessons_list=struggle_lessons_list
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

        # Analyze granular questions and clues for this attempt
        obj_logs = attempt.object_logs
        missed_items = []
        correct_items = []
        if obj_logs:
            seen_objects = {}
            for obj in obj_logs:
                oid = obj.object_id
                if oid not in seen_objects:
                    seen_objects[oid] = []
                seen_objects[oid].append(obj.was_correct)
            for oid, corrects in seen_objects.items():
                name = format_item_name(oid)
                if not all(corrects):
                    if name not in missed_items:
                        missed_items.append(name)
                else:
                    if name not in correct_items:
                        correct_items.append(name)

        total_items = (len(correct_items) + len(missed_items)) if obj_logs else 0
        correct_count = len(correct_items) if obj_logs else 0
        missed_count = len(missed_items) if obj_logs else 0

        if total_items > 0:
            if missed_count == 0:
                system_feedback = f"Perfect! Answered all {total_items} items correctly."
            else:
                acc = int(round((correct_count / total_items) * 100))
                system_feedback = f"Answered {correct_count} of {total_items} items correctly ({acc}% accuracy)."
        else:
            raw_fb = (attempt.feedback or '').strip()
            if raw_fb and not raw_fb.startswith('Correct on first try'):
                system_feedback = raw_fb
            else:
                system_feedback = f"Scored {attempt.score or 0} points."

        enriched_attempts.append({
            'attempt': attempt,
            'activity': activity,
            'student': student,
            'has_feedback': has_feedback,
            'total_attempts': total_for_activity,
            'system_feedback': system_feedback,
            'missed_items': missed_items,
            'correct_items': correct_items,
            'total_items': total_items
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
    
    # Activity progress with specific activity names and metadata
    raw_progress_logs = ProgressLog.query.filter_by(student_id=student_id).all()
    all_activities = Activity.query.all()
    activity_map = {a.id: a for a in all_activities}

    activity_performance = []
    for log in raw_progress_logs:
        act = getattr(log, 'activity', None) or activity_map.get(log.activity_id)
        act_name = act.type if (act and act.type) else f"Activity #{log.activity_id}"
        lesson_name = act.lesson.title if (act and act.lesson) else None

        icon = 'bi-controller'
        if act and act.engine:
            if act.engine == 'claw_machine':
                icon = 'bi-joystick'
            elif act.engine == 'find_the_part':
                icon = 'bi-search'
            elif act.engine == 'build_a_plant':
                icon = 'bi-flower1'
            elif act.engine == 'metal_logic':
                icon = 'bi-magnet-fill'
            elif act.engine == 'recycle_sorter':
                icon = 'bi-recycle'

        activity_performance.append({
            'log': log,
            'activity': act,
            'name': act_name,
            'lesson_name': lesson_name,
            'icon': icon,
            'score': log.score or 0,
            'time_spent': log.time_spent or 0,
            'created_at': log.created_at
        })
    
    # Lesson progress  
    if student and ('trixia' in (student.name or '').lower() or 'trixia' in (student.username or '').lower()):
        try:
            ensure_trixia_lesson_progress()
        except Exception:
            pass
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
    
    # Badges earned (evaluate any pending newly completed milestones)
    from routes.student_routes import check_and_award_badges
    check_and_award_badges(student_id)
    badges = db.session.query(UserBadge, Badge).join(
        Badge, Badge.id == UserBadge.badge_id
    ).filter(UserBadge.user_id == student_id).order_by(UserBadge.awarded_at.desc()).all()
    
    # Overall stats
    total_score = sum((log.score or 0) for log in raw_progress_logs)
    avg_score = round(total_score / len(raw_progress_logs)) if raw_progress_logs else 0

    online_threshold = datetime.utcnow() - timedelta(minutes=3)
    is_online = bool(student.last_seen and student.last_seen >= online_threshold)
    last_seen_relative = format_relative_time(student.last_seen) if not is_online else 'Online Now'
    last_seen_formatted = to_ph_time(student.last_seen).strftime('%b %d, %Y at %I:%M %p') if student.last_seen else 'Never active'

    return render_template(
        'teacher/student_performance.html',
        student=student,
        is_online=is_online,
        last_seen_relative=last_seen_relative,
        last_seen_formatted=last_seen_formatted,
        progress_logs=raw_progress_logs,
        activity_performance=activity_performance,
        activity_map=activity_map,
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
        created_str = to_ph_time(log.created_at).strftime('%b %d, %Y · %I:%M %p') if log.created_at else 'N/A'
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
            created_str = to_ph_time(a.created_at).strftime('%b %d, %Y · %I:%M %p') if a.created_at else 'N/A'
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


@teacher_bp.route('/api/live_lesson_tracker')
@require_role('teacher')
def api_live_lesson_tracker():
    """Real-time JSON endpoint for live polling the Live Student Lesson Progress Tracker"""
    online_threshold = datetime.utcnow() - timedelta(minutes=3)
    student_users = User.query.filter(User.role == 'student').all()
    online_students_set = set(s.id for s in student_users if s.last_seen and s.last_seen >= online_threshold)
    live_tracker = build_live_lesson_tracker(online_students_set)
    return jsonify({
        'success': True,
        'tracker': live_tracker,
        'online_count': len(online_students_set),
        'total_active': len(live_tracker)
    })


# ══════════════════════════════════════════════════════════════════════════════
# TEACHER CONTENT STUDIO & TEMPLATE WORKSPACE
# ══════════════════════════════════════════════════════════════════════════════

def _get_active_game_cards(default_claw_id):
    """Helper to load all active Claw Machine sorting activity cards"""
    from routes.student_routes import load_sorting_activity_config
    raw_activities = Activity.query.filter(
        Activity.engine == 'claw_machine',
        (Activity.is_archived == False) | (Activity.is_archived == None)
    ).order_by(Activity.id.asc()).all()

    activity_cards = []
    for act in raw_activities:
        cfg = load_sorting_activity_config(act.id)
        is_supp = bool(getattr(act, 'is_supplementary', False))
        term = getattr(act, 'term', None) or 'Term 1'
        activity_cards.append({
            'activity': act,
            'config': cfg,
            'title': cfg.get('title') or act.type or 'Sorting Game',
            'instructions': cfg.get('instructions') or '',
            'bins': cfg.get('bins', []),
            'objects_count': len(cfg.get('objects', [])),
            'round_size': cfg.get('round_size', 12),
            'is_default': (act.id == default_claw_id),
            'is_supplementary': is_supp,
            'term': term
        })
    return activity_cards


def _get_archived_game_cards():
    """Helper to load all archived Claw Machine sorting activity cards"""
    from routes.student_routes import load_sorting_activity_config
    raw_activities = Activity.query.filter(
        Activity.is_archived == True
    ).order_by(Activity.deleted_at.desc(), Activity.id.desc()).all()

    archived_cards = []
    for act in raw_activities:
        cfg = load_sorting_activity_config(act.id)
        archived_cards.append({
            'activity': act,
            'config': cfg,
            'title': cfg.get('title') or act.type or 'Sorting Game',
            'instructions': cfg.get('instructions') or '',
            'bins': cfg.get('bins', []),
            'objects_count': len(cfg.get('objects', [])),
            'round_size': cfg.get('round_size', 12),
            'deleted_at': act.deleted_at.strftime('%b %d, %Y %I:%M %p') if act.deleted_at else 'Archived'
        })
    return archived_cards


def _get_default_lesson_slide_count(title):
    """Returns the actual slide count for default core curriculum lessons"""
    t_lower = (title or '').lower()
    if 'living' in t_lower:
        return 7
    elif 'animal' in t_lower:
        return 12
    elif 'plant' in t_lower:
        return 12
    elif 'metal' in t_lower:
        return 20
    elif 'recycl' in t_lower:
        return 13
    return 7


def _get_active_lesson_cards():
    """Helper to load all active Lesson slide cards"""
    lesson_cards = []
    try:
        raw_lessons = Lesson.query.filter(
            (Lesson.is_archived == False) | (Lesson.is_archived == None)
        ).order_by(Lesson.id.asc()).all()

        for lsn in raw_lessons:
            cfg = getattr(lsn, 'config', None) or {}
            slides = cfg.get('slides', []) if isinstance(cfg, dict) else []
            slides_count = len(slides) if slides else _get_default_lesson_slide_count(lsn.title)
            is_supp = bool(getattr(lsn, 'is_supplementary', False))
            term = getattr(lsn, 'term', None) or 'Term 1'
            lesson_cards.append({
                'lesson': lsn,
                'title': lsn.title,
                'description': lsn.description or '',
                'slides_count': slides_count,
                'has_custom_slides': bool(slides),
                'grade_level': cfg.get('grade_level', 'Grade 3') if isinstance(cfg, dict) else 'Grade 3',
                'config': cfg,
                'is_supplementary': is_supp,
                'term': term
            })
    except Exception as e:
        print("[Lesson Studio] Notice loading lessons:", e)
        db.session.rollback()
    return lesson_cards


def _get_archived_lesson_cards():
    """Helper to load all archived Lesson slide cards"""
    lesson_cards = []
    try:
        raw_lessons = Lesson.query.filter(
            Lesson.is_archived == True
        ).order_by(Lesson.deleted_at.desc(), Lesson.id.desc()).all()

        for lsn in raw_lessons:
            cfg = getattr(lsn, 'config', None) or {}
            slides = cfg.get('slides', []) if isinstance(cfg, dict) else []
            slides_count = len(slides) if slides else _get_default_lesson_slide_count(lsn.title)
            lesson_cards.append({
                'lesson': lsn,
                'title': lsn.title,
                'description': lsn.description or '',
                'slides_count': slides_count,
                'has_custom_slides': bool(slides),
                'deleted_at': lsn.deleted_at.strftime('%b %d, %Y %I:%M %p') if lsn.deleted_at else 'Archived',
                'config': cfg
            })
    except Exception as e:
        print("[Lesson Studio] Notice loading archived lessons:", e)
        db.session.rollback()
    return lesson_cards


def _get_game_engine_templates():
    """Metadata for reusable game engine cards"""
    return [
        {
            'engine': 'claw_machine',
            'name': 'Sorting Claw Machine',
            'category': 'Classification & Categorization',
            'icon': 'bi-joystick',
            'accent': '#4318ff',
            'description': 'An interactive arcade claw game where students sort and classify items into two customizable categories.',
            'status': 'Ready to Customize',
            'is_available': True
        },
        {
            'engine': 'find_the_part',
            'name': 'Find the Part (Hotspot Identifier)',
            'category': 'Anatomy & Diagrams',
            'icon': 'bi-crosshair',
            'accent': '#0284c7',
            'description': 'Interactive click-to-identify game where students pinpoint organs, body parts, or diagram components.',
            'status': 'Engine Template Coming Soon',
            'is_available': False
        },
        {
            'engine': 'build_a_plant',
            'name': 'Assembly Builder',
            'category': 'Structure & Functions',
            'icon': 'bi-puzzle-fill',
            'accent': '#10b981',
            'description': 'Drag-and-assemble building block game to construct plants, life cycles, or systems in order.',
            'status': 'Engine Template Coming Soon',
            'is_available': False
        }
    ]


@teacher_bp.route('/content_management')
@require_role('teacher')
def content_management_alias():
    return redirect(url_for('teacher.content_management', **request.args))

@teacher_bp.route('/claw_machine_builder')
@teacher_bp.route('/claw_machine_builder/<int:activity_id>')
@require_role('teacher')
def claw_machine_builder_alias(activity_id=None):
    if activity_id:
        return redirect(url_for('teacher.claw_machine_builder', activity_id=activity_id, **request.args))
    return redirect(url_for('teacher.claw_machine_builder', **request.args))

@teacher_bp.route('/lesson_builder')
@teacher_bp.route('/lesson_builder/<int:lesson_id>')
@require_role('teacher')
def lesson_builder_alias(lesson_id=None):
    if lesson_id:
        return redirect(url_for('teacher.lesson_builder', lesson_id=lesson_id, **request.args))
    return redirect(url_for('teacher.lesson_builder', **request.args))


@teacher_bp.route('/content')
@require_role('teacher')
def content_management():
    """Content Studio Gateway Hub: Choose between Game Studio and Lesson Studio"""
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_content_management')

    from routes.student_routes import get_or_create_claw_machine_activity
    default_claw = get_or_create_claw_machine_activity()
    activity_cards = _get_active_game_cards(default_claw.id)
    lesson_cards = _get_active_lesson_cards()

    core_lessons_count = sum(1 for c in lesson_cards if not c['is_supplementary'])
    supp_lessons_count = sum(1 for c in lesson_cards if c['is_supplementary'])
    core_games_count = sum(1 for c in activity_cards if not c['is_supplementary'])
    supp_games_count = sum(1 for c in activity_cards if c['is_supplementary'])

    return render_template(
        'teacher/teacher_content.html',
        current_user=current_user,
        games_count=len(activity_cards),
        lessons_count=len(lesson_cards),
        core_lessons_count=core_lessons_count,
        supp_lessons_count=supp_lessons_count,
        core_games_count=core_games_count,
        supp_games_count=supp_games_count,
        active_engines_count=1
    )


@teacher_bp.route('/content/toggle_supplementary/<string:item_type>/<int:item_id>', methods=['POST'])
@require_role('teacher')
def toggle_supplementary(item_type, item_id):
    """Quick 1-click toggle between Core Curriculum and Supplementary/Remedial"""
    current_user = get_current_user()
    if item_type == 'lesson':
        lesson = Lesson.query.get_or_404(item_id)
        lesson.is_supplementary = not bool(lesson.is_supplementary)
        if lesson.config and isinstance(lesson.config, dict):
            lesson.config['is_supplementary'] = lesson.is_supplementary
        db.session.commit()
        status = "Supplementary / Remedial" if lesson.is_supplementary else "Core Curriculum"
        flash(f"Lesson '{lesson.title}' is now categorized as {status}.", "success")
        log_access(current_user, 'toggle_supplementary_lesson', f'lesson_id={item_id} is_supplementary={lesson.is_supplementary}')
        return redirect(request.referrer or url_for('teacher.lesson_studio'))
    elif item_type in ['activity', 'game']:
        act = Activity.query.get_or_404(item_id)
        act.is_supplementary = not bool(act.is_supplementary)
        if act.config and isinstance(act.config, dict):
            act.config['is_supplementary'] = act.is_supplementary
        db.session.commit()
        status = "Supplementary / Remedial Practice" if act.is_supplementary else "Core Curriculum"
        flash(f"Game '{act.type}' is now categorized as {status}.", "success")
        log_access(current_user, 'toggle_supplementary_activity', f'activity_id={item_id} is_supplementary={act.is_supplementary}')
        return redirect(request.referrer or url_for('teacher.game_studio'))
    return redirect(url_for('teacher.content_management'))


@teacher_bp.route('/content/games')
@teacher_bp.route('/content/game_studio')
@require_role('teacher')
def game_studio():
    """Dedicated Arcade Game Studio: Game Engines & Configured Sorting Games"""
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_game_studio')

    from routes.student_routes import get_or_create_claw_machine_activity
    default_claw = get_or_create_claw_machine_activity()
    activity_cards = _get_active_game_cards(default_claw.id)
    archived_cards = _get_archived_game_cards()
    templates = _get_game_engine_templates()
    students = User.query.filter_by(role='student').filter(
        (User.is_archived == False) | (User.is_archived == None)
    ).order_by(User.name.asc()).all()

    return render_template(
        'teacher/teacher_game_studio.html',
        current_user=current_user,
        activity_cards=activity_cards,
        archived_cards=archived_cards,
        templates=templates,
        default_claw_id=default_claw.id,
        students=students
    )


@teacher_bp.route('/content/lessons')
@teacher_bp.route('/content/lesson_studio')
@require_role('teacher')
def lesson_studio():
    """Dedicated Slide Lesson Studio: Slide Deck Workshops & Configured Lessons"""
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'teacher_lesson_studio')

    lesson_cards = _get_active_lesson_cards()
    archived_cards = _get_archived_lesson_cards()
    students = User.query.filter_by(role='student').filter(
        (User.is_archived == False) | (User.is_archived == None)
    ).order_by(User.name.asc()).all()

    return render_template(
        'teacher/teacher_lesson_studio.html',
        current_user=current_user,
        lesson_cards=lesson_cards,
        archived_cards=archived_cards,
        students=students
    )


@teacher_bp.route('/content/claw_machine/builder')
@teacher_bp.route('/content/claw_machine/builder/<int:activity_id>')
@require_role('teacher')
def claw_machine_builder(activity_id=None):
    """Visual workspace for customizing the Claw Machine Sorting Template"""
    current_user = get_current_user()
    from routes.student_routes import load_sorting_activity_config

    activity = None
    if activity_id:
        activity = Activity.query.get_or_404(activity_id)
        config = load_sorting_activity_config(activity.id)
    else:
        mode = request.args.get('mode', '')
        preset_key = request.args.get('preset', '')
        if mode == 'blank':
            # Clean blank arcade cabinet with empty categories and objects
            config = {
                "title": "",
                "instructions": "Sort each object into the correct chute to win stars.",
                "round_size": 6,
                "bins": [
                    {"id": "category_1", "label": "", "icon": "📦", "color": "#3b82f6"},
                    {"id": "category_2", "label": "", "icon": "⭐", "color": "#10b981"}
                ],
                "objects": []
            }
        elif preset_key:
            presets = {
                'states_of_matter': {
                    "title": "Solid vs Liquid Sorting",
                    "instructions": "Sort each object into the correct chute to win stars.",
                    "round_size": 6,
                    "bins": [
                        {"id": "solid", "label": "Solid", "icon": "🧊", "color": "#60a5fa"},
                        {"id": "liquid", "label": "Liquid", "icon": "💧", "color": "#38bdf8"}
                    ],
                    "objects": [
                        {"id": 1, "label": "Ice Cube", "categoryId": "solid", "explanation": "Ice has a fixed shape and volume as a solid.", "image": "/static/images/rock.webp"},
                        {"id": 2, "label": "Water", "categoryId": "liquid", "explanation": "Water flows and takes the shape of its container.", "image": "/static/images/puddle.webp"},
                        {"id": 3, "label": "Wooden Chair", "categoryId": "solid", "explanation": "A chair is solid and keeps its own shape.", "image": "/static/images/chair.webp"},
                        {"id": 4, "label": "Rock", "categoryId": "solid", "explanation": "Rocks are rigid solids that do not flow.", "image": "/static/images/rock.webp"}
                    ]
                },
                'living_vs_nonliving': {
                    "title": "Living vs Non-Living Sorting",
                    "instructions": "Sort objects into Living and Non-Living chutes to win stars.",
                    "round_size": 6,
                    "bins": [
                        {"id": "living", "label": "Living", "icon": "🌱", "color": "#4ade80"},
                        {"id": "non-living", "label": "Non-Living", "icon": "🪨", "color": "#fb923c"}
                    ],
                    "objects": [
                        {"id": 1, "label": "Dog", "categoryId": "living", "explanation": "Dogs are living animals that breathe and grow.", "image": "/static/images/dog.webp"},
                        {"id": 2, "label": "Cat", "categoryId": "living", "explanation": "Cats are living animals.", "image": "/static/images/cat.webp"},
                        {"id": 3, "label": "Tree", "categoryId": "living", "explanation": "Trees are living plants.", "image": "/static/images/tree.webp"},
                        {"id": 4, "label": "Rock", "categoryId": "non-living", "explanation": "Rocks do not eat, breathe, or grow.", "image": "/static/images/rock.webp"},
                        {"id": 5, "label": "Wooden Chair", "categoryId": "non-living", "explanation": "Chairs are non-living objects.", "image": "/static/images/chair.webp"}
                    ]
                },
                'waste_sorting': {
                    "title": "Eco Waste & Recycling Sort",
                    "instructions": "Sort materials into Organic Compost or Recyclable chutes.",
                    "round_size": 6,
                    "bins": [
                        {"id": "organic", "label": "Organic Compost", "icon": "🍂", "color": "#84cc16"},
                        {"id": "recyclable", "label": "Recyclable", "icon": "♻️", "color": "#06b6d4"}
                    ],
                    "objects": [
                        {"id": 1, "label": "Fallen Leaves", "categoryId": "organic", "explanation": "Leaves decompose naturally into compost.", "image": "/static/images/plant.webp"},
                        {"id": 2, "label": "Tree Branch", "categoryId": "organic", "explanation": "Branches break down organically.", "image": "/static/images/tree.webp"},
                        {"id": 3, "label": "Plastic Bottle", "categoryId": "recyclable", "explanation": "Plastics can be recycled into new products.", "image": "/static/images/puddle.webp"}
                    ]
                },
                'herbivore_vs_carnivore': {
                    "title": "Herbivore vs Carnivore Animals",
                    "instructions": "Sort animals by their diet into Herbivore or Carnivore.",
                    "round_size": 6,
                    "bins": [
                        {"id": "herbivore", "label": "Herbivore (Plant Eater)", "icon": "🌿", "color": "#22c55e"},
                        {"id": "carnivore", "label": "Carnivore (Meat Eater)", "icon": "🥩", "color": "#ef4444"}
                    ],
                    "objects": [
                        {"id": 1, "label": "Butterfly", "categoryId": "herbivore", "explanation": "Butterflies feed on plant nectar.", "image": "/static/images/butterfly.webp"},
                        {"id": 2, "label": "Cat", "categoryId": "carnivore", "explanation": "Cats are carnivores that eat meat.", "image": "/static/images/cat.webp"}
                    ]
                }
            }
            config = presets.get(preset_key, presets['states_of_matter'])
        else:
            # Default to blank mode if creating fresh without parameters
            config = {
                "title": "",
                "instructions": "Sort each object into the correct chute to win stars.",
                "round_size": 6,
                "bins": [
                    {"id": "category_1", "label": "", "icon": "📦", "color": "#3b82f6"},
                    {"id": "category_2", "label": "", "icon": "⭐", "color": "#10b981"}
                ],
                "objects": []
            }

    preset_images = [
        {"label": "Dog", "src": "/static/images/dog.webp"},
        {"label": "Cat", "src": "/static/images/cat.webp"},
        {"label": "Bird", "src": "/static/images/bird.webp"},
        {"label": "Fish", "src": "/static/images/fish.webp"},
        {"label": "Butterfly", "src": "/static/images/butterfly.webp"},
        {"label": "Tree", "src": "/static/images/tree.webp"},
        {"label": "Flower", "src": "/static/images/flower.webp"},
        {"label": "Plant", "src": "/static/images/plant.webp"},
        {"label": "Rock", "src": "/static/images/rock.webp"},
        {"label": "Chair", "src": "/static/images/chair.webp"},
        {"label": "Bicycle", "src": "/static/images/bicycle.webp"},
        {"label": "Ball", "src": "/static/images/ball.webp"},
        {"label": "Puddle", "src": "/static/images/puddle.webp"}
    ]

    all_lessons = Lesson.query.filter(
        (Lesson.is_archived == False) | (Lesson.is_archived == None)
    ).order_by(Lesson.title.asc()).all()

    return render_template(
        'teacher/teacher_claw_builder.html',
        current_user=current_user,
        activity=activity,
        config=config,
        preset_images=preset_images,
        all_lessons=all_lessons
    )


@teacher_bp.route('/content/claw_machine/save', methods=['POST'])
@require_role('teacher')
def save_claw_machine():
    """Save or update custom Claw Machine activity configuration and image uploads"""
    import os, uuid
    from flask import current_app

    current_user = get_current_user()
    activity_id = request.form.get('activity_id', type=int)
    title = request.form.get('title', 'Custom Sorting Game').strip()
    instructions = request.form.get('instructions', 'Sort each object into the correct chute.').strip()
    difficulty = request.form.get('difficulty', 'Level 1 — Easy').strip()
    points = request.form.get('points', 100, type=int)
    round_size = request.form.get('round_size', 8, type=int)
    lesson_id = request.form.get('lesson_id', type=int)

    is_supplementary = (str(request.form.get('is_supplementary', '')).strip().lower() in ['1', 'true', 'on'])
    term = request.form.get('term', 'Term 1').strip() or 'Term 1'

    bins_json = request.form.get('bins_data', '[]')
    objects_json = request.form.get('objects_data', '[]')

    try:
        bins = json.loads(bins_json)
        objects = json.loads(objects_json)
    except Exception as e:
        flash(f"Invalid activity configuration: {e}", "danger")
        return redirect(url_for('teacher.content_management'))

    # Claw machine physical arcade cabinet strictly requires exactly 2 chutes (Left & Right)
    if len(bins) != 2:
        flash("The Claw Machine sorting game requires exactly 2 chutes (Left chute and Right chute).", "warning")
        if len(bins) > 2:
            bins = bins[:2]
        elif len(bins) < 2:
            bins = [
                {"id": "category_1", "label": "Chute 1", "icon": "📦", "color": "#60a5fa"},
                {"id": "category_2", "label": "Chute 2", "icon": "📦", "color": "#f59e0b"}
            ]

    # Enforce item limits based on difficulty level: Easy (max 8), Medium (max 12), Hard (max 16)
    diff_lower = difficulty.lower()
    max_items = 8 if 'easy' in diff_lower else (12 if 'medium' in diff_lower else 16)
    if len(objects) > max_items:
        objects = objects[:max_items]
        flash(f"Activity items capped to {max_items} objects to match {difficulty}.", "info")

    round_size = min(len(objects), max_items) if objects else 8

    valid_bin_ids = {b['id'] for b in bins}
    for obj in objects:
        if obj.get('categoryId') not in valid_bin_ids and bins:
            obj['categoryId'] = bins[0]['id']

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'activities')
    os.makedirs(upload_dir, exist_ok=True)

    ALLOWED_IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}
    rejected_files = []

    for idx, obj in enumerate(objects):
        file_key = f"object_file_{idx}"
        if file_key in request.files:
            file = request.files[file_key]
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1].lower()
                mimetype = (file.mimetype or '').lower()
                
                # Strict check: only raster web images allowed; non-image files are blocked
                # No file size cap so teachers can upload high-resolution images freely
                if ext in ALLOWED_IMAGE_EXTS and mimetype.startswith('image/'):
                    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
                    filepath = os.path.join(upload_dir, unique_name)
                    file.save(filepath)
                    obj['image'] = f"/static/uploads/activities/{unique_name}"
                    obj['icon'] = obj['image']
                else:
                    rejected_files.append(f"{file.filename} (unsupported format; only PNG, JPG, JPEG, WEBP allowed)")

    if rejected_files:
        flash(f"Note: Some files could not be uploaded: {', '.join(rejected_files)}", "warning")

    config_payload = {
        "title": title,
        "instructions": instructions,
        "difficulty": difficulty,
        "round_size": round_size,
        "is_supplementary": is_supplementary,
        "term": term,
        "bins": bins,
        "objects": objects
    }

    if activity_id:
        activity = Activity.query.get(activity_id)
        if not activity:
            flash("Activity not found.", "danger")
            return redirect(url_for('teacher.content_management'))
        activity.type = title
        activity.points = points
        activity.term = term
        activity.is_supplementary = is_supplementary
        if lesson_id:
            activity.lesson_id = lesson_id
        activity.config = config_payload
        role_label = "Supplementary Practice" if is_supplementary else "Core Curriculum"
        flash(f"{role_label} game '{title}' updated successfully!", "success")
    else:
        if not lesson_id:
            from routes.student_routes import get_or_create_default_lesson
            def_l = get_or_create_default_lesson()
            lesson_id = def_l.id

        activity = Activity(
            lesson_id=lesson_id,
            type=title,
            engine='claw_machine',
            points=points,
            term=term,
            is_supplementary=is_supplementary,
            config=config_payload
        )
        db.session.add(activity)
        role_label = "Supplementary Practice" if is_supplementary else "Core Curriculum"
        flash(f"New {role_label} custom game '{title}' created successfully!", "success")

    db.session.commit()
    log_access(current_user, 'save_custom_activity', f'activity_id={activity.id} title={title}')
    return redirect(url_for('teacher.game_studio'))


@teacher_bp.route('/content/preview/<int:activity_id>')
@require_role('teacher')
def preview_activity(activity_id):
    """Test play a custom activity as teacher without grade tracking"""
    activity = Activity.query.get_or_404(activity_id)
    if activity.engine == 'claw_machine':
        return render_template('student/claw_machine_game.html', activity_id=activity.id, attempts_today=0, is_preview=True)
    flash("Live preview is only available for Claw Machine activities currently.", "info")
    return redirect(url_for('teacher.game_studio'))


@teacher_bp.route('/content/delete/<int:activity_id>', methods=['POST'])
@require_role('teacher')
def delete_activity(activity_id):
    """Soft-delete a custom activity"""
    current_user = get_current_user()
    activity = Activity.query.get_or_404(activity_id)
    activity.archive()
    db.session.commit()
    log_access(current_user, 'archive_custom_activity', f'activity_id={activity_id}')
    flash(f"Activity '{activity.type}' has been moved to archive.", "warning")
    return redirect(url_for('teacher.game_studio'))


@teacher_bp.route('/content/restore/<int:activity_id>', methods=['POST'])
@require_role('teacher')
def restore_activity(activity_id):
    """Restore an archived custom activity to active games"""
    current_user = get_current_user()
    activity = Activity.query.get_or_404(activity_id)
    activity.restore()
    db.session.commit()
    log_access(current_user, 'restore_custom_activity', f'activity_id={activity_id}')
    flash(f"Activity '{activity.type}' has been successfully restored from archive.", "success")
    return redirect(url_for('teacher.game_studio'))


@teacher_bp.route('/content/permanent_delete/<int:activity_id>', methods=['POST'])
@require_role('teacher')
def permanent_delete_activity(activity_id):
    """Permanently delete an archived custom activity and purge dependent records"""
    current_user = get_current_user()
    activity = Activity.query.get_or_404(activity_id)

    # Core activities (id=1 or default sorting games) can never be permanently deleted
    if activity.id == 1:
        flash("Default core curriculum activities cannot be permanently deleted.", "danger")
        return redirect(url_for('teacher.game_studio'))

    act_title = activity.type or 'Custom Activity'

    try:
        # Clean up dependent records before deleting
        ActivityAssignment.query.filter_by(activity_id=activity.id).delete()
        ProgressLog.query.filter_by(activity_id=activity.id).delete()
        attempt_logs = AttemptLog.query.filter_by(activity_id=activity.id).all()
        for al in attempt_logs:
            AttemptObjectLog.query.filter_by(attempt_log_id=al.id).delete()
        AttemptLog.query.filter_by(activity_id=activity.id).delete()

        db.session.delete(activity)
        db.session.commit()
        log_access(current_user, 'permanent_delete_activity', f'activity_id={activity_id} title={act_title}')
        flash(f"Activity '{act_title}' was permanently deleted.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Could not delete activity: {e}", "danger")

    return redirect(url_for('teacher.game_studio'))


# ══════════════════════════════════════════════════════════════════════════════
def _get_core_lesson_starter_slides(title):
    """Provides the full, authentic curriculum slide decks for each core science topic so teachers can edit real content"""
    t_lower = (title or '').lower()
    if 'animal' in t_lower:
        return [
            {
                "id": "slide-1",
                "title": "How Animals Move & Find Food",
                "type": "concept",
                "image": "/static/images/dog.webp",
                "explanation": "Animals have special body parts that help them walk, fly, eat, and stay safe in nature! 🐾"
            },
            {
                "id": "slide-2",
                "title": "The Head: Eyes & Mouth",
                "type": "concept",
                "image": "/static/images/cat.webp",
                "explanation": "The head holds the eyes for watching and the mouth for eating! 👀 👄"
            },
            {
                "id": "slide-3",
                "title": "The Head: Senses & Eating",
                "type": "concept",
                "image": "/static/images/dog.webp",
                "explanation": "Eyes spot food from far away, while the mouth chews food for daily energy! 🍎"
            },
            {
                "id": "slide-4",
                "title": "Legs: Moving Across Land",
                "type": "concept",
                "image": "/static/images/dog.webp",
                "explanation": "Legs support the body so animals can walk, run, and explore land! 🦊"
            },
            {
                "id": "slide-5",
                "title": "Legs: Finding Food & Safety",
                "type": "concept",
                "image": "/static/images/cat.webp",
                "explanation": "Strong legs help animals search for food and quickly leap away from danger! 🏃"
            },
            {
                "id": "slide-6",
                "title": "Wings: Soaring in the Air",
                "type": "concept",
                "image": "/static/images/bird.webp",
                "explanation": "Wings are light and wide to help birds soar smoothly through the sky! 🦅"
            },
            {
                "id": "slide-7",
                "title": "Wings: High Food & Quick Escape",
                "type": "concept",
                "image": "/static/images/bird.webp",
                "explanation": "Wings fly up to reach fruits in tall trees and quickly escape predators on the ground! 🌳"
            },
            {
                "id": "slide-8",
                "title": "Quick Check: The Head",
                "type": "quick-check",
                "prompt": "Which part of the head helps an animal SEE food? 👀",
                "image": "/static/images/cat.webp",
                "explanation": "Eyes spot food and danger from afar.",
                "options": [
                    {"id": "opt-1", "label": "Tail", "icon": "/static/images/dog.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Eyes", "icon": "/static/images/cat.webp", "isCorrect": True},
                    {"id": "opt-3", "label": "Claws", "icon": "/static/images/bird.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-9",
                "title": "Quick Check: Legs",
                "type": "quick-check",
                "prompt": "How do legs help an animal when it is hungry? 🐾",
                "image": "/static/images/dog.webp",
                "explanation": "Legs let animals roam, walk, and run across the land to find food.",
                "options": [
                    {"id": "opt-1", "label": "Sleep in shade", "icon": "/static/images/cat.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Fly into clouds", "icon": "/static/images/bird.webp", "isCorrect": False},
                    {"id": "opt-3", "label": "Walk and run to find food", "icon": "/static/images/dog.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-10",
                "title": "Quick Check: Wings",
                "type": "quick-check",
                "prompt": "Why do birds need wings to get food in tall trees? 🦅",
                "image": "/static/images/bird.webp",
                "explanation": "Wings allow birds to fly high and reach tall tree branches.",
                "options": [
                    {"id": "opt-1", "label": "To dig deep holes", "icon": "/static/images/rock.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "To fly up and reach branches", "icon": "/static/images/bird.webp", "isCorrect": True},
                    {"id": "opt-3", "label": "To swim under soil", "icon": "/static/images/puddle.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-11",
                "title": "Deepen Thinking: In Water",
                "type": "quick-check",
                "prompt": "A fish has NO legs and NO wings. How does it move through water to find food? 🐟",
                "image": "/static/images/fish.webp",
                "explanation": "Fish use fins and a strong tail to swim through water!",
                "options": [
                    {"id": "opt-1", "label": "Grows temporary legs", "icon": "/static/images/dog.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Flies above water", "icon": "/static/images/bird.webp", "isCorrect": False},
                    {"id": "opt-3", "label": "Uses fins and tail to swim", "icon": "/static/images/fish.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-12",
                "title": "Animal Body Parts: Big Ideas",
                "type": "summary",
                "image": "/static/images/star.webp",
                "explanation": "👀 Head: Eyes spot food and mouth chews food. 🐾 Legs: Walk, run, and leap across land. 🦅 Wings: Fly high into trees and escape danger. 🐟 Animals have body parts built for where they live!"
            }
        ]
    elif 'plant' in t_lower:
        return [
            {
                "id": "slide-1",
                "title": "What Keeps a Plant Alive?",
                "type": "concept",
                "image": "/static/images/plant.webp",
                "explanation": "All plant parts work together to help the plant stand tall, drink water, and make food! 🌿"
            },
            {
                "id": "slide-2",
                "title": "Roots: Underground Network",
                "type": "concept",
                "image": "/static/images/tree.webp",
                "explanation": "Roots spread deep into the soil beneath the plant to grip the ground firmly. 🌱"
            },
            {
                "id": "slide-3",
                "title": "Roots: Drinking Water & Anchoring",
                "type": "concept",
                "image": "/static/images/tree.webp",
                "explanation": "Roots drink up water and minerals from the soil and hold the plant steady in strong winds! 🌧️"
            },
            {
                "id": "slide-4",
                "title": "The Stem: The Central Pillar",
                "type": "concept",
                "image": "/static/images/plant.webp",
                "explanation": "The stem rises above the ground, holding leaves and flowers high toward the sun! ☀️"
            },
            {
                "id": "slide-5",
                "title": "The Stem: The Water Elevator",
                "type": "concept",
                "image": "/static/images/plant.webp",
                "explanation": "Inside the stem, tiny tubes carry water and nutrients up from the roots to the leaves like a straw! 🥤"
            },
            {
                "id": "slide-6",
                "title": "Leaves: Sun Catchers",
                "type": "concept",
                "image": "/static/images/flower.webp",
                "explanation": "Leaves are flat and green to catch as much warm sunlight as possible! 🍃"
            },
            {
                "id": "slide-7",
                "title": "Leaves: Making Food",
                "type": "concept",
                "image": "/static/images/flower.webp",
                "explanation": "Leaves are the plant's kitchen! They use sunlight, air, and water to make food (sugar) through photosynthesis! 🍲"
            },
            {
                "id": "slide-8",
                "title": "Quick Check: Roots",
                "type": "quick-check",
                "prompt": "Which plant part absorbs water from the soil? 💧",
                "image": "/static/images/plant.webp",
                "explanation": "Roots grow underground and absorb water and nutrients from the soil.",
                "options": [
                    {"id": "opt-1", "label": "Leaves", "icon": "/static/images/flower.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Roots", "icon": "/static/images/tree.webp", "isCorrect": True},
                    {"id": "opt-3", "label": "Flower", "icon": "/static/images/flower.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-9",
                "title": "Quick Check: Stem",
                "type": "quick-check",
                "prompt": "What does the stem carry from roots up to leaves? 🌿",
                "image": "/static/images/plant.webp",
                "explanation": "The stem is like a pipe carrying water and nutrients up to the leaves.",
                "options": [
                    {"id": "opt-1", "label": "Seeds only", "icon": "/static/images/tree.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Air bubbles", "icon": "/static/images/puddle.webp", "isCorrect": False},
                    {"id": "opt-3", "label": "Water and nutrients", "icon": "/static/images/plant.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-10",
                "title": "Quick Check: Leaves",
                "type": "quick-check",
                "prompt": "What do leaves need to make food for the plant? ☀️",
                "image": "/static/images/flower.webp",
                "explanation": "Leaves catch sunlight and air to cook plant food.",
                "options": [
                    {"id": "opt-1", "label": "Soil only", "icon": "/static/images/tree.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Sunlight and air", "icon": "/static/images/flower.webp", "isCorrect": True},
                    {"id": "opt-3", "label": "Rocks and sand", "icon": "/static/images/rock.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-11",
                "title": "Deepen Thinking: Sunlight",
                "type": "quick-check",
                "prompt": "A plant has water but is kept in a dark room with no light. Which part suffers first?",
                "image": "/static/images/plant.webp",
                "explanation": "Without sunlight, leaves cannot make food for the rest of the plant!",
                "options": [
                    {"id": "opt-1", "label": "Roots — cannot absorb water", "icon": "/static/images/tree.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Stem — cannot hold water", "icon": "/static/images/plant.webp", "isCorrect": False},
                    {"id": "opt-3", "label": "Leaves — cannot make food without light", "icon": "/static/images/flower.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-12",
                "title": "Plant Parts: Big Ideas",
                "type": "summary",
                "image": "/static/images/star.webp",
                "explanation": "🌱 Roots anchor the plant and drink water. 🌿 The stem holds the plant high and carries water up. 🍃 Leaves catch sunlight and air to make food! 🤝 All parts work together as a team."
            }
        ]
    elif 'metal' in t_lower:
        return [
            {
                "id": "slide-1",
                "title": "Iron Objects Around Us",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Iron is all around us in heavy gates, cooking pans, and nails! It is one of Earth's strongest metals. 🔩"
            },
            {
                "id": "slide-2",
                "title": "Property 1: Hard & Strong",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Iron is super strong and hard. It does not easily bend, crack, or melt in hot soup, which makes it great for building bridges!"
            },
            {
                "id": "slide-3",
                "title": "Property 2: Abundant in Earth",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Iron is one of the most plentiful metals on Earth. Builders use thousands of iron beams to support tall buildings!"
            },
            {
                "id": "slide-4",
                "title": "Property 3: Iron Can Rust",
                "type": "concept",
                "image": "/static/images/chair.webp",
                "explanation": "Rain and air cause iron to turn into reddish-brown rust over time. Painting iron helps protect it from moisture and rust!"
            },
            {
                "id": "slide-5",
                "title": "Quick Check: Iron",
                "type": "quick-check",
                "prompt": "What happens to iron when left outside in wet rainy air? 🌧️",
                "image": "/static/images/rock.webp",
                "explanation": "Iron reacts with rain and air to form rust.",
                "options": [
                    {"id": "opt-1", "label": "It turns into gold", "icon": "/static/images/rock.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "It forms reddish rust", "icon": "/static/images/chair.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-6",
                "title": "Copper: The Power Conductor",
                "type": "concept",
                "image": "/static/images/bicycle.webp",
                "explanation": "Inside power cables hide reddish-orange copper threads! Copper brings electrical power safely into our homes. ⚡"
            },
            {
                "id": "slide-7",
                "title": "Conductors & Plastic Insulation",
                "type": "concept",
                "image": "/static/images/bicycle.webp",
                "explanation": "Copper conducts electricity easily! Plastic coating wraps around copper wires to keep our hands safe from shocks. 🔌"
            },
            {
                "id": "slide-8",
                "title": "Quick Check: Copper Wires",
                "type": "quick-check",
                "prompt": "Why are copper wires coated in plastic? 🔌",
                "image": "/static/images/bicycle.webp",
                "explanation": "Plastic is an insulator that protects us from electric shocks.",
                "options": [
                    {"id": "opt-1", "label": "To make wires heavier", "icon": "/static/images/rock.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "To insulate and protect from shocks", "icon": "/static/images/bicycle.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-9",
                "title": "Gold & Silver: Precious Metals",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Gold and silver never rust! They keep their dazzling shine for centuries in crowns, rings, and medals. 👑"
            },
            {
                "id": "slide-10",
                "title": "Luster & Light Reflection",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Gold and silver have brilliant metallic luster. When light hits them, they sparkle brightly and resist corrosion! ✨"
            },
            {
                "id": "slide-11",
                "title": "Quick Check: Shiny Metals",
                "type": "quick-check",
                "prompt": "Which precious metals reflect light beautifully and do not easily rust? 💍",
                "image": "/static/images/rock.webp",
                "explanation": "Gold and silver do not rust and keep their beautiful shine.",
                "options": [
                    {"id": "opt-1", "label": "Gold and Silver", "icon": "/static/images/rock.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Wood and Plastic", "icon": "/static/images/tree.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-12",
                "title": "Reflect: Metal Detectives",
                "type": "concept",
                "image": "/static/images/chair.webp",
                "explanation": "Look around! Iron protects our gates, copper powers our lights, and gold & silver shine in jewelry! 🔍"
            },
            {
                "id": "slide-13",
                "title": "Real-World Metal Jobs",
                "type": "concept",
                "image": "/static/images/chair.webp",
                "explanation": "Every metal has a special job matched to its unique properties in engineering and medicine! 🛠️"
            },
            {
                "id": "slide-14",
                "title": "Common vs. Rare Metals",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Iron is abundant to build entire cities! Gold and silver are rare treasures. All metals can be recycled! ♻️"
            },
            {
                "id": "slide-15",
                "title": "Properties of Metals: Big Ideas",
                "type": "summary",
                "image": "/static/images/star.webp",
                "explanation": "🔩 Iron: Strong, magnetic, can rust. ⚡ Copper: Reddish, conducts electricity. ✨ Gold & Silver: Shiny, never rust."
            },
            {
                "id": "slide-16",
                "title": "Assessment 1: Electric Cables",
                "type": "quick-check",
                "prompt": "Which metal is the standard choice inside electric cables because electricity flows through it smoothly?",
                "image": "/static/images/bicycle.webp",
                "explanation": "Copper conducts electricity easily and efficiently.",
                "options": [
                    {"id": "opt-1", "label": "Copper", "icon": "/static/images/bicycle.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Iron", "icon": "/static/images/rock.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-17",
                "title": "Assessment 2: Reaction with Water",
                "type": "quick-check",
                "prompt": "What happens when iron is exposed to moisture and oxygen over time?",
                "image": "/static/images/chair.webp",
                "explanation": "Iron reacts to form rust, an orange-brown crust that weakens the metal.",
                "options": [
                    {"id": "opt-1", "label": "It forms rust and weakens", "icon": "/static/images/chair.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "It melts into a puddle", "icon": "/static/images/puddle.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-18",
                "title": "Assessment 3: Jewelry Value",
                "type": "quick-check",
                "prompt": "Why are gold and silver prized for making jewelry and coins?",
                "image": "/static/images/rock.webp",
                "explanation": "They reflect light with bright luster and do not easily rust.",
                "options": [
                    {"id": "opt-1", "label": "They reflect light and resist rust", "icon": "/static/images/rock.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "They are the cheapest metals", "icon": "/static/images/chair.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-19",
                "title": "Assessment 4: Heavy Structures",
                "type": "quick-check",
                "prompt": "Which property makes iron best for heavy bridge beams and skyscraper frames?",
                "image": "/static/images/rock.webp",
                "explanation": "Iron has extreme hardness and high tensile strength.",
                "options": [
                    {"id": "opt-1", "label": "Hardness and high strength", "icon": "/static/images/rock.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Lightness and softness", "icon": "/static/images/plant.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-20",
                "title": "Assessment 5: Wire Safety",
                "type": "quick-check",
                "prompt": "What is the plastic coating around copper wires used for?",
                "image": "/static/images/bicycle.webp",
                "explanation": "Plastic is an insulator that traps current inside the wire to prevent electric shocks.",
                "options": [
                    {"id": "opt-1", "label": "Insulation and shock protection", "icon": "/static/images/bicycle.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Decoration only", "icon": "/static/images/flower.webp", "isCorrect": False}
                ]
            }
        ]
    elif 'recycl' in t_lower:
        return [
            {
                "id": "slide-1",
                "title": "What Happens to Our Trash?",
                "type": "concept",
                "image": "/static/images/puddle.webp",
                "explanation": "We throw away bottles, cans, and paper every day. Recycling gives them a brand new life instead of piling up in dumps!"
            },
            {
                "id": "slide-2",
                "title": "The Recycling Process",
                "type": "concept",
                "image": "/static/images/plant.webp",
                "explanation": "Recycling turns old trash into brand new items! Look for the 3-arrow loop symbol on containers: Collect, Clean, and Remake!"
            },
            {
                "id": "slide-3",
                "title": "Let's Sort: Recyclable or Compost?",
                "type": "concept",
                "image": "/static/images/tree.webp",
                "explanation": "Clean plastics, glass, paper, and cans go into the Recycling Bin. Fruit peels and food scraps go into the Compost Bin!"
            },
            {
                "id": "slide-4",
                "title": "Quick Check: Sorting Right",
                "type": "quick-check",
                "prompt": "Why should leftover food scraps NOT be placed into a bin of clean paper recyclables? 🍎",
                "image": "/static/images/plant.webp",
                "explanation": "Food waste makes dry paper dirty and wet, ruining entire recycling loads.",
                "options": [
                    {"id": "opt-1", "label": "Food scraps contaminate clean paper", "icon": "/static/images/plant.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Food scraps are made of copper", "icon": "/static/images/rock.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-5",
                "title": "Reflect: Recycling at Home",
                "type": "concept",
                "image": "/static/images/tree.webp",
                "explanation": "Having separate bins at home makes sorting easy. Small daily habits keep mountains of trash out of our oceans!"
            },
            {
                "id": "slide-6",
                "title": "Discuss: Sorting Tricky Items",
                "type": "concept",
                "image": "/static/images/puddle.webp",
                "explanation": "We sort trash into Biodegradable, Non-Biodegradable, and Recyclable. Watch out for tricky mixed materials!"
            },
            {
                "id": "slide-7",
                "title": "Deepen: The Wonder of Metal Recycling",
                "type": "concept",
                "image": "/static/images/rock.webp",
                "explanation": "Metals like iron, copper, and aluminum can be melted down and remade again and again forever without losing strength!"
            },
            {
                "id": "slide-8",
                "title": "Big Ideas — Recycling",
                "type": "summary",
                "image": "/static/images/star.webp",
                "explanation": "♻️ Recycling saves trees, saves energy, and keeps our Earth clean for animals and people!"
            },
            {
                "id": "slide-9",
                "title": "Assessment 1: What is Recycling?",
                "type": "quick-check",
                "prompt": "What does recycling mean in science?",
                "image": "/static/images/plant.webp",
                "explanation": "Recycling takes used materials and turns them into brand-new products.",
                "options": [
                    {"id": "opt-1", "label": "Turning used materials into new products", "icon": "/static/images/plant.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Throwing trash into the ocean", "icon": "/static/images/puddle.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-10",
                "title": "Assessment 2: Recyclable Metal",
                "type": "quick-check",
                "prompt": "Which item can be melted down and remade into a new container in just 60 days?",
                "image": "/static/images/rock.webp",
                "explanation": "Aluminum cans are easily melted down and recycled indefinitely.",
                "options": [
                    {"id": "opt-1", "label": "Aluminum soda can", "icon": "/static/images/rock.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Banana peel", "icon": "/static/images/plant.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-11",
                "title": "Assessment 3: Food Waste Safety",
                "type": "quick-check",
                "prompt": "Why must food waste be kept out of the dry paper recycling bin?",
                "image": "/static/images/plant.webp",
                "explanation": "Wet food rots and contaminates dry paper and cardboard fibers.",
                "options": [
                    {"id": "opt-1", "label": "It contaminates other recyclables", "icon": "/static/images/plant.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Food waste is magnetic", "icon": "/static/images/rock.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-12",
                "title": "Assessment 4: Endless Recycling",
                "type": "quick-check",
                "prompt": "Which material can be recycled endlessly with zero loss of quality?",
                "image": "/static/images/rock.webp",
                "explanation": "Aluminum and metals can be melted and reshaped repeatedly.",
                "options": [
                    {"id": "opt-1", "label": "Aluminum can", "icon": "/static/images/rock.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Styrofoam plate", "icon": "/static/images/chair.webp", "isCorrect": False}
                ]
            },
            {
                "id": "slide-13",
                "title": "Assessment 5: Caring for Earth",
                "type": "quick-check",
                "prompt": "How does recycling help protect the environment?",
                "image": "/static/images/tree.webp",
                "explanation": "It conserves natural resources, reduces mining, and cuts down landfill waste.",
                "options": [
                    {"id": "opt-1", "label": "Conserves resources and reduces landfill waste", "icon": "/static/images/tree.webp", "isCorrect": True},
                    {"id": "opt-2", "label": "Makes trash vanish into thin air", "icon": "/static/images/puddle.webp", "isCorrect": False}
                ]
            }
        ]
    else:
        # Default Living vs Non-Living full 7 slides
        return [
            {
                "id": "slide-1",
                "title": "Living vs Non-Living",
                "type": "concept",
                "image": "/static/images/tree.webp",
                "explanation": "Living things grow, breathe, and need food and water! 🌱 Non-living things do not do these on their own. 🪨"
            },
            {
                "id": "slide-2",
                "title": "Tap to Explore",
                "type": "concept",
                "image": "/static/images/tree.webp",
                "explanation": "Observe the world around us: trees grow tall, birds fly and breathe, but bicycles and puddles cannot grow or eat!"
            },
            {
                "id": "slide-3",
                "title": "Quick Check: Living Thing",
                "type": "quick-check",
                "prompt": "Which one can grow and needs water to stay alive? 🌱",
                "image": "/static/images/plant.webp",
                "explanation": "Plants are living things because they absorb water and grow.",
                "options": [
                    {"id": "opt-1", "label": "Rock", "icon": "/static/images/rock.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Plant", "icon": "/static/images/plant.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-4",
                "title": "More Objects to Classify",
                "type": "concept",
                "image": "/static/images/cat.webp",
                "explanation": "Cats eat food and run around. Toys, balls, and chairs are made by people and cannot breathe!"
            },
            {
                "id": "slide-5",
                "title": "Quick Check: Non-Living Thing",
                "type": "quick-check",
                "prompt": "Which object cannot breathe or move by itself? 🪑",
                "image": "/static/images/chair.webp",
                "explanation": "A chair is made of wood or plastic by people and cannot breathe or grow.",
                "options": [
                    {"id": "opt-1", "label": "Butterfly", "icon": "/static/images/butterfly.webp", "isCorrect": False},
                    {"id": "opt-2", "label": "Chair", "icon": "/static/images/chair.webp", "isCorrect": True}
                ]
            },
            {
                "id": "slide-6",
                "title": "Why is this Fish a Living Thing?",
                "type": "concept",
                "image": "/static/images/fish.webp",
                "explanation": "A fish is living because it breathes water through gills, moves on its own, eats food, and grows larger!"
            },
            {
                "id": "slide-7",
                "title": "Living vs Non-Living: Big Ideas",
                "type": "summary",
                "image": "/static/images/star.webp",
                "explanation": "🌱 Living things grow, breathe, and need food. 🪨 Non-living things do not eat, breathe, or grow on their own. Awesome job!"
            }
        ]


@teacher_bp.route('/content/lesson/builder')
@teacher_bp.route('/content/lesson/builder/<int:lesson_id>')
@require_role('teacher')
def lesson_builder(lesson_id=None):
    """Visual workspace for creating and customizing interactive lesson slides"""
    current_user = get_current_user()
    lesson = None
    config = None
    is_core_lesson = False

    mode = request.args.get('mode', '')
    preset_key = request.args.get('preset', '')

    if lesson_id:
        lesson = Lesson.query.get_or_404(lesson_id)
        has_custom = bool(lesson.config and isinstance(lesson.config, dict) and lesson.config.get('slides'))
        # If this is one of the 5 default core curriculum lessons or has no custom slides, initialize starter slides and mark as core
        if lesson.id in [1, 2, 3, 4, 5] or not has_custom:
            is_core_lesson = True
            starter_slides = _get_core_lesson_starter_slides(lesson.title)
            config = {
                "title": f"{lesson.title} (Configured)",
                "description": lesson.description or f"Configured {lesson.title} interactive slide presentation.",
                "grade_level": "Grade 3",
                "slides": starter_slides
            }
        else:
            config = lesson.config or {}
    else:
        # Creating a brand new lesson
        if preset_key:
            lesson_presets = {
                'living_vs_nonliving': {
                    "title": "Living vs Non-Living",
                    "description": "Learn how to tell living things from non-living things!",
                    "grade_level": "Grade 3",
                    "slides": _get_core_lesson_starter_slides("Living vs Non-Living")
                },
                'states_of_matter': {
                    "title": "States of Matter: Solid vs Liquid",
                    "description": "Explore the different forms matter can take around us.",
                    "grade_level": "Grade 3",
                    "slides": [
                        {"id": "slide-1", "title": "What is Matter?", "type": "concept", "image": "/static/images/rock.webp", "explanation": "Everything around us is made of matter! Matter can be a solid, liquid, or gas."},
                        {"id": "slide-2", "title": "Solids Keep Their Shape", "type": "concept", "image": "/static/images/chair.webp", "explanation": "A wooden chair is a solid. It keeps its firm shape and fixed volume."},
                        {"id": "slide-3", "title": "Quick Check: Find the Solid", "type": "quick-check", "prompt": "Which object keeps its rigid shape and is a solid? 🧊", "image": "/static/images/rock.webp", "explanation": "Ice and rocks hold a definite shape as solids.", "options": [{"id": "opt-1", "label": "Ice Cube", "icon": "/static/images/rock.webp", "isCorrect": True}, {"id": "opt-2", "label": "Water Puddle", "icon": "/static/images/puddle.webp", "isCorrect": False}]}
                    ]
                },
                'recycling': {
                    "title": "Eco Recycling & Waste Sorting",
                    "description": "Discover how sorting waste protects our planet.",
                    "grade_level": "Grade 3",
                    "slides": [
                        {"id": "slide-1", "title": "Why Recycle?", "type": "concept", "image": "/static/images/tree.webp", "explanation": "Recycling turns old materials into useful new goods!"},
                        {"id": "slide-2", "title": "Quick Check: Recyclable Items", "type": "quick-check", "prompt": "Which item can be melted and recycled? ♻️", "image": "/static/images/puddle.webp", "explanation": "Clean plastics, metals, and glass can be recycled.", "options": [{"id": "opt-1", "label": "Plastic Bottle", "icon": "/static/images/puddle.webp", "isCorrect": True}, {"id": "opt-2", "label": "Food Waste", "icon": "/static/images/plant.webp", "isCorrect": False}]}
                    ]
                }
            }
            config = lesson_presets.get(preset_key, lesson_presets['living_vs_nonliving'])
        else:
            concept_arg = request.args.get('concept', '').strip()
            mode_arg = request.args.get('mode', '').strip()
            is_supp = (request.args.get('is_supplementary', '') == '1') or (mode_arg == 'supplementary')

            if concept_arg and is_supp:
                matched_img = "/static/images/tree.webp"
                c_low = concept_arg.lower()
                if "leaf" in c_low or "leaves" in c_low or "plant" in c_low:
                    matched_img = "/static/images/plant.webp"
                elif "flower" in c_low:
                    matched_img = "/static/images/flower.webp"
                elif "bird" in c_low or "wing" in c_low or "feather" in c_low:
                    matched_img = "/static/images/bird.webp"
                elif "fish" in c_low or "fin" in c_low:
                    matched_img = "/static/images/fish.webp"
                elif "metal" in c_low or "rock" in c_low or "solid" in c_low:
                    matched_img = "/static/images/rock.webp"
                elif "liquid" in c_low or "water" in c_low or "puddle" in c_low:
                    matched_img = "/static/images/puddle.webp"
                elif "dog" in c_low or "animal" in c_low:
                    matched_img = "/static/images/dog.webp"
                elif "cat" in c_low:
                    matched_img = "/static/images/cat.webp"

                config = {
                    "title": f"Review Focus: {concept_arg}",
                    "description": f"Targeted remedial micro-lesson to reinforce mastery on {concept_arg}.",
                    "grade_level": "Grade 3",
                    "slides": [
                        {
                            "id": "slide-1",
                            "title": f"Review Anchor: {concept_arg}",
                            "type": "concept",
                            "image": matched_img,
                            "explanation": f"Let's review {concept_arg}! Pay close attention to its appearance, traits, and scientific role in this topic."
                        },
                        {
                            "id": "slide-2",
                            "title": f"Quick Check: {concept_arg}",
                            "type": "quick-check",
                            "prompt": f"Which item correctly shows or describes {concept_arg}? ✨",
                            "image": matched_img,
                            "explanation": f"Great job! That correctly identifies {concept_arg}.",
                            "options": [
                                {"id": "opt-1", "label": concept_arg, "icon": matched_img, "isCorrect": True},
                                {"id": "opt-2", "label": "Other Item", "icon": "/static/images/rock.webp", "isCorrect": False}
                            ]
                        }
                    ]
                }
            else:
                # Blank canvas by default when creating from scratch
                config = {
                    "title": "",
                    "description": "",
                    "grade_level": "Grade 3",
                    "slides": []
                }

    preset_images = [
        {"label": "Tree", "src": "/static/images/tree.webp"},
        {"label": "Rock", "src": "/static/images/rock.webp"},
        {"label": "Bird", "src": "/static/images/bird.webp"},
        {"label": "Bicycle", "src": "/static/images/bicycle.webp"},
        {"label": "Fish", "src": "/static/images/fish.webp"},
        {"label": "Ball", "src": "/static/images/ball.webp"},
        {"label": "Plant", "src": "/static/images/plant.webp"},
        {"label": "Chair", "src": "/static/images/chair.webp"},
        {"label": "Cat", "src": "/static/images/cat.webp"},
        {"label": "Flower", "src": "/static/images/flower.webp"},
        {"label": "Butterfly", "src": "/static/images/butterfly.webp"},
        {"label": "Puddle", "src": "/static/images/puddle.webp"},
        {"label": "Dog", "src": "/static/images/dog.webp"}
    ]

    return render_template(
        'teacher/teacher_lesson_builder.html',
        current_user=current_user,
        lesson=lesson,
        config=config,
        is_core_lesson=is_core_lesson,
        preset_images=preset_images
    )


@teacher_bp.route('/content/lesson/save', methods=['POST'])
@require_role('teacher')
def save_lesson():
    """Save or update custom Lesson configuration, slides, and slide image uploads"""
    import os, uuid
    from flask import current_app

    current_user = get_current_user()
    lesson_id = request.form.get('lesson_id', type=int)
    is_core_lesson = (request.form.get('is_core_lesson') == '1') or (lesson_id and lesson_id in [1, 2, 3, 4, 5])
    title = request.form.get('title', 'Science Lesson').strip()
    description = request.form.get('description', '').strip()
    grade_level = request.form.get('grade_level', 'Grade 3').strip()
    slides_json = request.form.get('slides_data', '[]')
    is_supplementary = (str(request.form.get('is_supplementary', '')).strip().lower() in ['1', 'true', 'on'])
    term = request.form.get('term', 'Term 1').strip() or 'Term 1'

    try:
        slides = json.loads(slides_json)
    except Exception as e:
        flash(f"Invalid slide configuration: {e}", "danger")
        return redirect(url_for('teacher.lesson_studio'))

    upload_dir = os.path.join(current_app.root_path, 'static', 'uploads', 'lessons')
    os.makedirs(upload_dir, exist_ok=True)

    ALLOWED_IMAGE_EXTS = {'.png', '.jpg', '.jpeg', '.webp'}

    for idx, slide in enumerate(slides):
        file_key = f"slide_file_{idx}"
        if file_key in request.files:
            file = request.files[file_key]
            if file and file.filename:
                ext = os.path.splitext(file.filename)[1].lower()
                mimetype = (file.mimetype or '').lower()
                if ext in ALLOWED_IMAGE_EXTS and mimetype.startswith('image/'):
                    unique_name = f"{uuid.uuid4().hex[:12]}{ext}"
                    filepath = os.path.join(upload_dir, unique_name)
                    file.save(filepath)
                    slide['image'] = f"/static/uploads/lessons/{unique_name}"

    config_payload = {
        "title": title,
        "description": description,
        "grade_level": grade_level,
        "is_supplementary": is_supplementary,
        "term": term,
        "slides": slides
    }

    # When editing a default core lesson, always create a separate configured lesson so core records are never overwritten
    if is_core_lesson or not lesson_id:
        new_lesson = Lesson(
            title=title,
            description=description,
            config=config_payload,
            term=term,
            is_supplementary=is_supplementary,
            is_archived=False
        )
        db.session.add(new_lesson)
        db.session.commit()
        role_label = "Supplementary / Remedial" if is_supplementary else "Core Curriculum"
        flash(f"New {role_label} lesson '{title}' created successfully! It is now available to assign.", "success")
        log_access(current_user, 'create_configured_lesson', f'lesson_id={new_lesson.id} title={title} is_supplementary={is_supplementary}')
        return redirect(url_for('teacher.lesson_studio'))
    else:
        lesson = Lesson.query.get(lesson_id)
        if not lesson:
            flash("Lesson not found.", "danger")
            return redirect(url_for('teacher.lesson_studio'))
        lesson.title = title
        lesson.description = description
        lesson.config = config_payload
        lesson.term = term
        lesson.is_supplementary = is_supplementary
        db.session.commit()
        role_label = "Supplementary / Remedial" if is_supplementary else "Core Curriculum"
        flash(f"{role_label} lesson '{title}' updated successfully!", "success")
        log_access(current_user, 'save_custom_lesson', f'lesson_id={lesson.id} title={title} is_supplementary={is_supplementary}')
        return redirect(url_for('teacher.lesson_studio'))


@teacher_bp.route('/content/lesson/preview/<int:lesson_id>')
@teacher_bp.route('/content/lesson/preview/<int:lesson_id>', endpoint='lesson_preview')
@require_role('teacher')
def preview_lesson(lesson_id):
    """Test play a lesson slideshow as teacher without recording student progress"""
    lesson = Lesson.query.get_or_404(lesson_id)
    has_custom = bool(lesson.config and isinstance(lesson.config, dict) and lesson.config.get('slides'))

    # If it is a core lesson without custom slide configurations, render its dedicated original template
    if not has_custom:
        t_lower = (lesson.title or '').lower()
        if 'animal' in t_lower:
            return render_template('student/animal_body_parts_lesson.html', lesson=lesson, initial_slide=0, is_preview=True)
        elif 'plant' in t_lower:
            return render_template('student/plant_parts_lesson.html', lesson=lesson, initial_slide=0, is_preview=True)
        elif 'metal' in t_lower:
            return render_template('student/properties_of_metals_lesson.html', lesson=lesson, initial_slide=0, is_preview=True)
        elif 'recycl' in t_lower:
            return render_template('student/recycling_lesson.html', lesson=lesson, initial_slide=0, is_preview=True)

    # For Living vs Non-Living or any customized/new slide deck, use the dynamic slide deck engine
    return render_template(
        'student/living_non_living_lesson.html',
        lesson=lesson,
        initial_slide=0,
        published_payload=lesson.config,
        is_preview=True
    )


@teacher_bp.route('/content/lesson/delete/<int:lesson_id>', methods=['POST'])
@require_role('teacher')
def delete_lesson(lesson_id):
    """Soft-delete a custom lesson"""
    current_user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)
    lesson.archive()
    db.session.commit()
    log_access(current_user, 'archive_custom_lesson', f'lesson_id={lesson_id}')
    flash(f"Lesson '{lesson.title}' has been moved to archive.", "warning")
    return redirect(url_for('teacher.lesson_studio'))


@teacher_bp.route('/content/lesson/restore/<int:lesson_id>', methods=['POST'])
@require_role('teacher')
def restore_lesson(lesson_id):
    """Restore an archived custom lesson to active lessons"""
    current_user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)
    lesson.restore()
    db.session.commit()
    log_access(current_user, 'restore_custom_lesson', f'lesson_id={lesson_id}')
    flash(f"Lesson '{lesson.title}' has been successfully restored from archive.", "success")
    return redirect(url_for('teacher.lesson_studio'))


@teacher_bp.route('/content/lesson/permanent_delete/<int:lesson_id>', methods=['POST'])
@require_role('teacher')
def permanent_delete_lesson(lesson_id):
    """Permanently delete an archived custom lesson and purge dependent records"""
    current_user = get_current_user()
    lesson = Lesson.query.get_or_404(lesson_id)

    # Core curriculum lessons 1-5 can never be deleted
    if lesson.id in [1, 2, 3, 4, 5]:
        flash("Default core curriculum lessons cannot be permanently deleted.", "danger")
        return redirect(url_for('teacher.lesson_studio'))

    lesson_title = lesson.title or 'Custom Lesson'

    try:
        # Clean up dependent records before deleting
        LessonAssignment.query.filter_by(lesson_id=lesson.id).delete()
        LessonProgress.query.filter_by(lesson_id=lesson.id).delete()
        LessonAttemptLog.query.filter_by(lesson_id=lesson.id).delete()
        Activity.query.filter_by(lesson_id=lesson.id).update({'lesson_id': None})

        db.session.delete(lesson)
        db.session.commit()
        log_access(current_user, 'permanent_delete_lesson', f'lesson_id={lesson_id} title={lesson_title}')
        flash(f"Custom lesson '{lesson_title}' was permanently deleted.", "success")
    except Exception as e:
        db.session.rollback()
        flash(f"Could not delete lesson: {e}", "danger")

    return redirect(url_for('teacher.lesson_studio'))


# ═══════════════════════════════════════════════════════════════════════
# TEACHER ASSET LIBRARY (PERMANENT MEDIA STORAGE)
# ═══════════════════════════════════════════════════════════════════════

@teacher_bp.route('/api/assets', methods=['GET'])
@require_role('teacher')
def get_teacher_assets():
    """Returns permanently saved teacher illustration images or Lottie animations."""
    current_user = get_current_user()
    asset_type = request.args.get('type')  # 'image' or 'animation'

    query = TeacherAsset.query.filter(
        (TeacherAsset.is_archived == False) | (TeacherAsset.is_archived == None)
    )
    if asset_type:
        query = query.filter(TeacherAsset.asset_type == asset_type)

    query = query.filter(
        (TeacherAsset.teacher_id == current_user.id) | (TeacherAsset.teacher_id == None)
    )
    assets = query.order_by(TeacherAsset.created_at.desc()).all()

    # Self-heal / restore files to disk if ephemeral disk reset occurred on Render
    upload_dir = os.path.join(current_app.static_folder, 'uploads', 'assets')
    os.makedirs(upload_dir, exist_ok=True)

    data = []
    for a in assets:
        if a.file_url and a.file_url.startswith('/static/uploads/assets/'):
            filename = os.path.basename(a.file_url)
            local_path = os.path.join(upload_dir, filename)
            if not os.path.exists(local_path) and a.file_data:
                try:
                    if a.asset_type == 'animation':
                        with open(local_path, 'w', encoding='utf-8') as f:
                            f.write(a.file_data)
                    elif a.file_data.startswith('data:'):
                        _, b64 = a.file_data.split(',', 1)
                        with open(local_path, 'wb') as f:
                            f.write(base64.b64decode(b64))
                except Exception:
                    pass

        data.append({
            'id': a.id,
            'title': a.title,
            'asset_type': a.asset_type,
            'file_url': a.file_url,
            'file_data': a.file_data if a.asset_type == 'animation' else None,
            'created_at': a.created_at.strftime('%b %d, %Y') if a.created_at else ''
        })

    return jsonify({'status': 'success', 'assets': data})


@teacher_bp.route('/api/assets/upload', methods=['POST'])
@require_role('teacher')
def upload_teacher_asset():
    """Uploads and permanently persists an illustration image or animation to the teacher's library."""
    current_user = get_current_user()
    file = request.files.get('file')
    if not file or not file.filename:
        return jsonify({'status': 'error', 'message': 'No file was provided.'}), 400

    ext = (file.filename.rsplit('.', 1)[-1] if '.' in file.filename else '').lower()
    valid_exts = {'png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'json'}
    if ext not in valid_exts:
        return jsonify({'status': 'error', 'message': f'Unsupported file format .{ext}. Allowed: PNG, JPG, WEBP, SVG, GIF, or JSON.'}), 400

    content = file.read()
    if len(content) > 10 * 1024 * 1024:
        return jsonify({'status': 'error', 'message': 'File exceeds maximum 10MB limit.'}), 400

    title = request.form.get('title', '').strip()
    if not title:
        base_name = file.filename.rsplit('.', 1)[0]
        title = base_name.replace('_', ' ').replace('-', ' ').title()

    asset_type = 'animation' if ext == 'json' else 'image'
    file_data = None

    if asset_type == 'animation':
        try:
            text_content = content.decode('utf-8')
            json.loads(text_content)  # validate valid Lottie JSON
            file_data = text_content
        except Exception:
            return jsonify({'status': 'error', 'message': 'The uploaded file is not valid Lottie JSON.'}), 400
    else:
        mime = f'image/{ext}' if ext != 'svg' else 'image/svg+xml'
        if ext == 'jpg':
            mime = 'image/jpeg'
        b64 = base64.b64encode(content).decode('utf-8')
        file_data = f'data:{mime};base64,{b64}'

    safe_uuid = uuid.uuid4().hex[:10]
    clean_name = "".join(c for c in file.filename if c.isalnum() or c in '._-')
    filename = f"{safe_uuid}_{clean_name}"

    upload_dir = os.path.join(current_app.static_folder, 'uploads', 'assets')
    os.makedirs(upload_dir, exist_ok=True)
    local_path = os.path.join(upload_dir, filename)

    try:
        with open(local_path, 'wb') as f:
            f.write(content)
    except Exception as e:
        return jsonify({'status': 'error', 'message': f'Failed saving asset: {e}'}), 500

    file_url = f"/static/uploads/assets/{filename}"

    asset = TeacherAsset(
        teacher_id=current_user.id,
        title=title,
        asset_type=asset_type,
        file_url=file_url,
        file_data=file_data
    )
    db.session.add(asset)
    db.session.commit()
    log_access(current_user, 'upload_teacher_asset', f'id={asset.id} title={title} type={asset_type}')

    return jsonify({
        'status': 'success',
        'message': f'"{title}" permanently saved to your library!',
        'asset': {
            'id': asset.id,
            'title': asset.title,
            'asset_type': asset.asset_type,
            'file_url': asset.file_url,
            'file_data': asset.file_data if asset.asset_type == 'animation' else None,
            'created_at': asset.created_at.strftime('%b %d, %Y') if asset.created_at else ''
        }
    })


@teacher_bp.route('/api/assets/<int:asset_id>/delete', methods=['POST'])
@require_role('teacher')
def delete_teacher_asset(asset_id):
    """Archives an asset from the teacher's picker."""
    current_user = get_current_user()
    asset = TeacherAsset.query.get_or_404(asset_id)
    if asset.teacher_id and asset.teacher_id != current_user.id and current_user.role != 'admin':
        return jsonify({'status': 'error', 'message': 'Unauthorized'}), 403

    asset.archive()
    db.session.commit()
    log_access(current_user, 'delete_teacher_asset', f'id={asset.id} title={asset.title}')
    return jsonify({'status': 'success', 'message': 'Asset removed from library.'})



