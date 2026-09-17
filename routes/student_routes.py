from flask import Blueprint, render_template, flash, redirect, url_for, session, request, jsonify
from database.models import db, Lesson, Activity, ProgressLog, LessonProgress, LessonAttemptLog, User, LessonAssignment, ActivityAssignment, AttemptLog, AttemptObjectLog, UserBadge, Badge
from routes.utils import get_current_user, require_role, log_access, csrf
from types import SimpleNamespace
from datetime import datetime, time
import json
from pathlib import Path

student_bp = Blueprint('student', __name__, url_prefix='/student')


DEFAULT_SORTING_OBJECTS = [
    {"id": 1, "label": "Tree", "categoryId": "living", "explanation": "Watch a tree over time: it grows, needs water and sunlight.", "image": "/static/images/tree.webp", "icon": "/static/images/tree.webp"},
    {"id": 2, "label": "Rock", "categoryId": "non-living", "explanation": "A rock sits outside, but it never breathes, eats, or grows.", "image": "/static/images/rock.webp", "icon": "/static/images/rock.webp"},
    {"id": 3, "label": "Bird", "categoryId": "living", "explanation": "A bird flies around, looks for food, and breathes on its own.", "image": "/static/images/bird.webp", "icon": "/static/images/bird.webp"},
    {"id": 4, "label": "Bicycle", "categoryId": "non-living", "explanation": "Bicycles only move when someone rides them.", "image": "/static/images/bicycle.webp", "icon": "/static/images/bicycle.webp"},
    {"id": 5, "label": "Fish", "categoryId": "living", "explanation": "A fish breathes through gills and swims by itself.", "image": "/static/images/fish.webp", "icon": "/static/images/fish.webp"},
    {"id": 6, "label": "Ball", "categoryId": "non-living", "explanation": "A ball rolls only after a person kicks or throws it.", "image": "/static/images/ball.webp", "icon": "/static/images/ball.webp"},
    {"id": 7, "label": "Plant", "categoryId": "living", "explanation": "A plant grows and needs sunlight and water to stay healthy.", "image": "/static/images/plant.webp", "icon": "/static/images/plant.webp"},
    {"id": 8, "label": "Chair", "categoryId": "non-living", "explanation": "A chair is non-living. It does not breathe, eat, or grow.", "image": "/static/images/chair.webp", "icon": "/static/images/chair.webp"},
    {"id": 9, "label": "Cat", "categoryId": "living", "explanation": "A cat grows from a kitten, breathes, eats, and moves.", "image": "/static/images/cat.webp", "icon": "/static/images/cat.webp"},
    {"id": 10, "label": "Flower", "categoryId": "living", "explanation": "A flower blooms and needs water to stay alive.", "image": "/static/images/flower.webp", "icon": "/static/images/flower.webp"},
    {"id": 11, "label": "Butterfly", "categoryId": "living", "explanation": "A butterfly flutters around, breathes, and eats.", "image": "/static/images/butterfly.webp", "icon": "/static/images/butterfly.webp"},
    {"id": 12, "label": "Puddle", "categoryId": "non-living", "explanation": "A puddle is water on the ground. It does not breathe or eat.", "image": "/static/images/puddle.webp", "icon": "/static/images/puddle.webp"}
]

def load_sorting_activity_config(activity_id):
    """Load teacher-configurable sorting activity data by activity_id from DB."""
    default_payload = {
        "title": "Sorting Claw Machine",
        "instructions": "Sort each object into the correct chute to win stars.",
        "round_size": 12,
        "bins": [
            {"id": "living", "label": "Living", "icon": "🌱", "color": "#4ade80"},
            {"id": "non-living", "label": "Non-Living", "icon": "🪨", "color": "#fb923c"}
        ],
        "objects": DEFAULT_SORTING_OBJECTS
    }
    
    activity = Activity.query.get(activity_id)
    if activity and activity.config:
        merged = dict(default_payload)
        merged.update(activity.config)
        if not merged.get("objects") or not isinstance(merged.get("objects"), list) or len(merged.get("objects")) == 0:
            merged["objects"] = DEFAULT_SORTING_OBJECTS
        return merged
        
    return default_payload


def get_or_create_badge(name, description, icon='🏅'):
    """Get or create a badge by name"""
    badge = Badge.query.filter_by(name=name).first()
    if not badge:
        badge = Badge(name=name, description=description, icon=icon)
        db.session.add(badge)
        db.session.commit()
    return badge


def award_badge_if_earned(student_id, badge_name, description, icon='🏅'):
    """Award a badge to a student if they don't already have it"""
    badge = get_or_create_badge(badge_name, description, icon)
    
    # Check if already awarded
    existing = UserBadge.query.filter_by(user_id=student_id, badge_id=badge.id).first()
    if not existing:
        user_badge = UserBadge(user_id=student_id, badge_id=badge.id)
        db.session.add(user_badge)
        db.session.commit()
        return True
    return False


RATING_HINTS = {
    'Excellent':         'Outstanding! You sorted almost everything correctly on the first try. Keep it up!',
    'Very Good':         "Great work! You got most objects right on the first try. A little more practice and you'll be perfect!",
    'Good':              'Good effort! Try to think carefully before placing each object — you can do even better!',
    'Needs Improvement': 'Keep practicing! Review the lesson again and think about what makes something living or non-living.',
}


def compute_rating(score, correct_first_try):
    """Return a 4-tier rating string from activity scoring data (100-point scale)."""
    if score <= 0:
        return 'Needs Improvement'
    if score >= 90:
        return 'Excellent'
    if score >= 75:
        return 'Very Good'
    if score >= 50:
        return 'Good'
    return 'Needs Improvement'


DEDICATED_LESSON_BADGES = {
    'living': {
        'name': 'Living Explorer',
        'icon': '🌱',
        'description': 'Mastered the Living vs Non-Living lesson!'
    },
    'animal': {
        'name': 'Animal Scout',
        'icon': '🦁',
        'description': 'Mastered the Animal Body Parts lesson!'
    },
    'plant': {
        'name': 'Junior Botanist',
        'icon': '🌻',
        'description': 'Mastered the Plant Parts lesson!'
    },
    'metal': {
        'name': 'Metal Specialist',
        'icon': '🧲',
        'description': 'Mastered the Properties of Metals lesson!'
    },
    'recycl': {
        'name': 'Eco Champion',
        'icon': '🌍',
        'description': 'Mastered the Recycling & Conservation lesson!'
    },
}

DEDICATED_ACTIVITY_BADGES = {
    'claw': {
        'name': 'Claw Master',
        'icon': '🕹️',
        'description': 'Conquered the Living vs Non-Living Claw Machine!'
    },
    'find_the_part': {
        'name': 'Eagle Eye',
        'icon': '🦅',
        'description': 'Identified every animal feature in Find the Part!'
    },
    'build_a_plant': {
        'name': 'Master Gardener',
        'icon': '🌿',
        'description': 'Constructed roots, stems, and petals in Build a Plant!'
    },
    'metal_logic': {
        'name': 'Metal Detective',
        'icon': '🔍',
        'description': 'Cracked mystery element puzzles in Metal Clue Detective!'
    },
    'recycle_sorter': {
        'name': 'Sorting Hero',
        'icon': '♻️',
        'description': 'Sorted scrap with lightning reflexes in EcoSwipe Sorter!'
    },
}


def get_lesson_badge_meta(lesson):
    title_lower = (lesson.title or '').lower()
    for key, meta in DEDICATED_LESSON_BADGES.items():
        if key in title_lower:
            return meta['name'], meta['description'], meta['icon']
    return f"{lesson.title} Graduate", f"Mastered the {lesson.title} lesson!", "🎓"


def get_activity_badge_meta(activity):
    engine_lower = (activity.engine or '').lower()
    type_lower = (activity.type or '').lower()
    for key, meta in DEDICATED_ACTIVITY_BADGES.items():
        if key in engine_lower or key in type_lower:
            return meta['name'], meta['description'], meta['icon']
    return f"{activity.type} Champion", f"Conquered the {activity.type} activity!", "🎮"


def has_student_completed_lesson(user_id, lesson_id):
    """Check if the student has ever completed this lesson."""
    if not user_id or not lesson_id:
        return False

    # 1. Check direct LessonProgress record
    lp = LessonProgress.query.filter_by(student_id=user_id, lesson_id=lesson_id).first()
    if lp and (lp.completed_at is not None or lp.completed or (lp.revisit_count or 0) > 0 or (lp.progress_percent or 0) >= 100):
        return True

    # 2. Check direct LessonAttemptLog record
    attempt = LessonAttemptLog.query.filter(
        LessonAttemptLog.student_id == user_id,
        LessonAttemptLog.lesson_id == lesson_id
    ).filter(
        (LessonAttemptLog.completed == True) | (LessonAttemptLog.progress_percent >= 100)
    ).first()
    if attempt:
        return True

    # 3. Check direct LessonAssignment record
    assignment = LessonAssignment.query.filter_by(student_id=user_id, lesson_id=lesson_id, status='completed').first()
    if assignment:
        return True

    # 4. Check by matching lesson title to protect against duplicate/re-seeded lesson rows
    target_lesson = Lesson.query.get(lesson_id)
    if target_lesson and target_lesson.title:
        title_stripped = target_lesson.title.strip()
        matching_lesson_ids = [l.id for l in Lesson.query.filter(Lesson.title.ilike(title_stripped)).all() if l.id != lesson_id]
        if matching_lesson_ids:
            alt_lp = LessonProgress.query.filter(
                LessonProgress.student_id == user_id,
                LessonProgress.lesson_id.in_(matching_lesson_ids)
            ).filter(
                (LessonProgress.completed == True) |
                (LessonProgress.completed_at.isnot(None)) |
                (LessonProgress.revisit_count > 0) |
                (LessonProgress.progress_percent >= 100)
            ).first()
            if alt_lp:
                return True
            alt_att = LessonAttemptLog.query.filter(
                LessonAttemptLog.student_id == user_id,
                LessonAttemptLog.lesson_id.in_(matching_lesson_ids)
            ).filter(
                (LessonAttemptLog.completed == True) | (LessonAttemptLog.progress_percent >= 100)
            ).first()
            if alt_att:
                return True
            alt_assign = LessonAssignment.query.filter(
                LessonAssignment.student_id == user_id,
                LessonAssignment.lesson_id.in_(matching_lesson_ids),
                LessonAssignment.status == 'completed'
            ).first()
            if alt_assign:
                return True

    # 5. Check paired activity attempts: if student already played and scored in the paired game, lesson was completed
    paired_acts = Activity.query.filter_by(lesson_id=lesson_id).all()
    if paired_acts:
        paired_ids = [a.id for a in paired_acts]
        has_score = AttemptLog.query.filter(
            AttemptLog.student_id == user_id,
            AttemptLog.activity_id.in_(paired_ids),
            AttemptLog.score.isnot(None)
        ).first() or ProgressLog.query.filter(
            ProgressLog.student_id == user_id,
            ProgressLog.activity_id.in_(paired_ids),
            ProgressLog.score.isnot(None)
        ).first()
        if has_score:
            return True

    return False


PLAYABLE_GAME_ENGINES = {'claw_machine', 'find_the_part', 'build_a_plant', 'metal_logic', 'recycle_sorter'}


def check_and_award_badges(student_id):
    """Check if student has earned any new badges based on their actual lesson and game progress."""
    student = User.query.get(student_id)
    if not student:
        return
    
    # 1. Get student's progress records
    progress_logs = ProgressLog.query.filter_by(student_id=student_id).all()
    attempts = AttemptLog.query.filter_by(student_id=student_id).all()
    all_activities = Activity.query.all()
    act_map = {a.id: a for a in all_activities}
    
    # Strictly filter for real playable games — SLIDE QUESTIONS / QUICK CHECKS ARE NEVER GAMES!
    game_progress_logs = [
        pl for pl in progress_logs
        if pl.activity_id in act_map and act_map[pl.activity_id].engine in PLAYABLE_GAME_ENGINES
    ]
    game_attempts = [
        att for att in attempts
        if att.activity_id in act_map and act_map[att.activity_id].engine in PLAYABLE_GAME_ENGINES
    ]

    completed_game_ids = set()
    for pl in game_progress_logs:
        if pl.score is not None and pl.score >= 50:
            completed_game_ids.add(pl.activity_id)
    for att in game_attempts:
        if att.score is not None and att.score >= 50:
            completed_game_ids.add(att.activity_id)

    # 2. Dedicated Lesson Achievements (Every single lesson has a dedicated badge)
    all_lessons = Lesson.query.all()
    completed_lesson_count = 0
    for lesson in all_lessons:
        if has_student_completed_lesson(student_id, lesson.id):
            completed_lesson_count += 1
            badge_name, desc, icon = get_lesson_badge_meta(lesson)
            award_badge_if_earned(student_id, badge_name, desc, icon)

    # 3. Dedicated Activity Achievements (Only for real games actually completed by the student)
    for activity in all_activities:
        if activity.engine in PLAYABLE_GAME_ENGINES and activity.id in completed_game_ids:
            badge_name, desc, icon = get_activity_badge_meta(activity)
            award_badge_if_earned(student_id, badge_name, desc, icon)

    # 4. Milestone Achievements (Only based on actual games, never slide clicks)
    # First Success - Complete first real arcade game
    if len(completed_game_ids) >= 1:
        award_badge_if_earned(student_id, 'First Success', 'Completed your first activity!', '🎯')
    
    # Perfect Score - Get 100 on a real arcade game
    perfect_game_scores = [p for p in game_progress_logs if p.score and p.score >= 100] or [a for a in game_attempts if a.score and a.score >= 100]
    if perfect_game_scores:
        award_badge_if_earned(student_id, 'Perfect Score', 'Achieved a perfect score on an activity!', '⭐')
    
    # Lesson Master - Complete at least 1 lesson
    if completed_lesson_count >= 1:
        award_badge_if_earned(student_id, 'Lesson Master', 'Completed an entire lesson!', '🎓')
    
    # Speedster - Complete a real arcade game in under 3 minutes with passing score
    fast_game_attempts = [a for a in game_attempts if a.time_spent and 5 < a.time_spent < 180 and (a.score or 0) >= 50]
    if fast_game_attempts:
        award_badge_if_earned(student_id, 'Speedster', 'Completed an activity in lightning speed!', '⚡')
    
    # Consistency - Complete 5 real game plays
    passed_attempts = [a for a in game_attempts if (a.score or 0) >= 50]
    if len(passed_attempts) >= 5 or len(completed_game_ids) >= 5:
        award_badge_if_earned(student_id, 'Consistency', 'Completed 5 activities!', '🔥')
    
    # Scholar - Complete 10 real game plays
    if len(passed_attempts) >= 10 or len(completed_game_ids) >= 10:
        award_badge_if_earned(student_id, 'Scholar', 'Completed 10 activities!', '📚')
    
    # Lesson Complete - Complete 3 lessons
    if completed_lesson_count >= 3:
        award_badge_if_earned(student_id, 'Lesson Complete', 'Completed 3 entire lessons!', '🏆')

    # Curriculum Champion - Complete all 5 lessons
    if completed_lesson_count >= 5:
        award_badge_if_earned(student_id, 'Curriculum Champion', 'Mastered all 5 science lessons in the curriculum!', '👑')


def get_or_create_default_lesson():
    lesson = Lesson.query.filter_by(title='Living vs Non-Living').first()
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
        type='Living vs Non-Living Claw Machine'
    ).first()
    if activity:
        return activity

    activity = Activity(
        lesson_id=lesson.id,
        type='Living vs Non-Living Claw Machine',
        points=100
    )
    db.session.add(activity)
    db.session.commit()
    return activity


def get_or_create_quick_check_activity():
    lesson = get_or_create_default_lesson()
    activity = Activity.query.filter_by(
        lesson_id=lesson.id,
        type='Living vs Non-Living Quick Check'
    ).first()
    if activity:
        return activity

    activity = Activity(
        lesson_id=lesson.id,
        type='Living vs Non-Living Quick Check',
        engine='quick_check',
        points=10
    )
    db.session.add(activity)
    db.session.commit()
    return activity


def get_attempts_today(student_id, activity_id):
    today_start = datetime.combine(datetime.utcnow().date(), time.min)
    today_end = datetime.combine(datetime.utcnow().date(), time.max)
    
    # Check if there is an active assignment for this student & activity
    assignment = ActivityAssignment.query.filter(
        ActivityAssignment.student_id == student_id,
        ActivityAssignment.activity_id == activity_id,
        ActivityAssignment.status.in_(['assigned', 'completed', 'attempts_exhausted'])
    ).order_by(ActivityAssignment.assigned_at.desc()).first()

    # If the assignment was assigned recently, count attempts since this assignment began
    if assignment and assignment.assigned_at:
        since_time = max(today_start, assignment.assigned_at)
    else:
        since_time = today_start

    return AttemptLog.query.filter(
        AttemptLog.student_id == student_id,
        AttemptLog.activity_id == activity_id,
        AttemptLog.created_at >= since_time,
        AttemptLog.created_at <= today_end
    ).count()


def is_activity_unlocked(user_id, activity):
    if not activity or activity.id is None:
        return False

    # If the activity is linked to a lesson, student must have completed the lesson
    if activity.lesson_id:
        return has_student_completed_lesson(user_id, activity.lesson_id)

    # Standalone activity with no lesson requirement
    return True


@student_bp.route('/dashboard')
@require_role('student')
def dashboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'student_dashboard')
    user_id = current_user.id
    # Only show content explicitly assigned to this student — never fall back to the full library
    lesson_assignment_rows = db.session.query(LessonAssignment, Lesson).join(
        Lesson, Lesson.id == LessonAssignment.lesson_id
    ).filter(
        LessonAssignment.student_id == user_id
    ).all()
    lessons = [lesson for _, lesson in lesson_assignment_rows]
    lesson_due_dates = {lesson.id: assignment.due_date for assignment, lesson in lesson_assignment_rows}

    activity_assignment_rows = db.session.query(ActivityAssignment, Activity).join(
        Activity, Activity.id == ActivityAssignment.activity_id
    ).filter(
        ActivityAssignment.student_id == user_id,
        ActivityAssignment.status.in_(['assigned', 'completed']),
        Activity.engine.in_(['claw_machine', 'find_the_part', 'build_a_plant', 'metal_logic', 'recycle_sorter'])
    ).all()
    activities = [activity for _, activity in activity_assignment_rows]
    activity_due_dates = {activity.id: assignment.due_date for assignment, activity in activity_assignment_rows}
    progress_logs = []
    completed_by_activity = {}

    current_user = User.query.get(user_id) if user_id else None
    if user_id:
        progress_logs = ProgressLog.query.filter_by(student_id=user_id).all()
        completed_by_activity = {log.activity_id: log for log in progress_logs}

    completed_activities = len(completed_by_activity)
    total_activities = len(activities)
    total_score = sum((log.score or 0) for log in progress_logs)

    lesson_progress = []
    for lesson in lessons:
        lesson_activities = [activity for activity in activities if activity.lesson_id == lesson.id]
        is_done = has_student_completed_lesson(user_id, lesson.id)
        matching_lesson_ids = [l.id for l in Lesson.query.filter(Lesson.title.ilike(lesson.title.strip())).all()]
        log = LessonProgress.query.filter(
            LessonProgress.student_id == user_id,
            LessonProgress.lesson_id.in_(matching_lesson_ids)
        ).first() if user_id else None

        pct = 100 if is_done else ((log.progress_percent or 0) if log else 0)
        lesson_progress.append({
            'lesson': lesson,
            'completed': is_done,
            'total': len(lesson_activities),
            'percent': pct
        })

    # Overall Progress = (Completed Lessons + Completed Activities) / (Total Assigned Lessons + Total Assigned Activities)
    completed_lessons_count = sum(1 for lp in lesson_progress if bool(lp.get('completed')) or lp.get('percent', 0) >= 100)
    total_lessons_count = len(lessons)
    assigned_activity_ids = {a.id for a in activities}
    completed_activities_count = sum(1 for aid in completed_by_activity if aid in assigned_activity_ids) if assigned_activity_ids else completed_activities

    total_tasks_count = total_lessons_count + total_activities
    completed_tasks_count = completed_lessons_count + completed_activities_count
    student_progress = round((completed_tasks_count / total_tasks_count) * 100) if total_tasks_count else 0

    # Get student's badges and recent feedback
    user_badges = db.session.query(UserBadge, Badge).join(
        Badge, Badge.id == UserBadge.badge_id
    ).filter(UserBadge.user_id == user_id).all()
    
    feedback_messages = []
    # 1. Teacher Personalized Notes
    teacher_notes = db.session.query(AttemptLog, Activity).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).filter(
        AttemptLog.student_id == user_id,
        AttemptLog.teacher_feedback != None,
        AttemptLog.teacher_feedback != ''
    ).order_by(
        AttemptLog.created_at.desc()
    ).limit(5).all()

    for attempt, activity in teacher_notes:
        feedback_messages.append({
            'activity': activity.type,
            'rating': None,
            'text': attempt.teacher_feedback,
            'source': 'Teacher Note',
            'is_teacher': True
        })

    # 2. System Attempt Evaluations (from AttemptLog)
    system_attempts = db.session.query(AttemptLog, Activity).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).filter(
        AttemptLog.student_id == user_id,
        AttemptLog.feedback != None,
        AttemptLog.feedback != ''
    ).order_by(
        AttemptLog.created_at.desc()
    ).limit(5).all()

    for attempt, activity in system_attempts:
        feedback_messages.append({
            'activity': activity.type,
            'rating': attempt.rating,
            'text': attempt.hints or attempt.feedback,
            'source': 'System Evaluation',
            'is_teacher': False
        })

    feedback_messages = feedback_messages[:4]

    # Leaderboard: top 5 students by total score
    leaderboard_query = db.session.query(
        User.id,
        User.name,
        db.func.coalesce(db.func.sum(ProgressLog.score), 0).label('total_points')
    ).outerjoin(
        ProgressLog, (ProgressLog.student_id == User.id)
    ).filter(
        User.role == 'student'
    ).group_by(
        User.id, User.name
    ).order_by(
        db.desc('total_points'), User.name
    ).limit(5).all()

    leaderboard = [
        {
            'rank': idx + 1,
            'student_id': row.id,
            'name': row.name,
            'points': int(row.total_points or 0),
            'is_current': (row.id == user_id)
        }
        for idx, row in enumerate(leaderboard_query)
    ]

    assigned_tasks = []
    for assignment, lesson in lesson_assignment_rows:
        due_str = assignment.due_date.strftime('%b %d, %Y at %I:%M %p') if (assignment.due_date and hasattr(assignment.due_date, 'strftime')) else (str(assignment.due_date) if assignment.due_date else 'No due date')
        title = lesson.title or ''
        if 'Animal Body Parts' in title or 'Parts of an Animal' in title:
            lesson_url = url_for('student.animal_body_parts_lesson')
        elif 'Plant Parts' in title:
            lesson_url = url_for('student.plant_parts_lesson')
        else:
            lesson_url = url_for('student.living_non_living_lesson')

        assigned_tasks.append({
            'type': 'Lesson',
            'title': lesson.title,
            'due_date_display': due_str,
            'status': assignment.status or 'assigned',
            'action_url': lesson_url,
            'assigned_at': assignment.assigned_at
        })
    for assignment, activity in activity_assignment_rows:
        due_str = assignment.due_date.strftime('%b %d, %Y at %I:%M %p') if (assignment.due_date and hasattr(assignment.due_date, 'strftime')) else (str(assignment.due_date) if assignment.due_date else 'No due date')
        act_type = activity.type or ''
        act_engine = activity.engine or ''
        if 'find_the_part' in act_engine or 'Find the Part' in act_type:
            act_url = url_for('student.find_the_part_game')
        elif 'build_a_plant' in act_engine or 'Build a Plant' in act_type:
            act_url = url_for('student.build_a_plant_game')
        elif 'metal_logic' in act_engine or 'Metal' in act_type:
            act_url = url_for('student.materials_game')
        elif 'recycle_sorter' in act_engine or 'EcoSwipe' in act_type or 'Recycl' in act_type:
            act_url = url_for('student.recycling_game')
        else:
            act_url = url_for('student.claw_machine')

        assigned_tasks.append({
            'type': 'Activity',
            'title': activity.type,
            'due_date_display': due_str,
            'status': assignment.status or 'assigned',
            'action_url': act_url,
            'assigned_at': assignment.assigned_at
        })
    assigned_tasks.sort(key=lambda t: t['assigned_at'] or datetime.min, reverse=True)

    return render_template(
        'student/student_dashboard.html',
        lessons=lessons,
        activities=activities,
        assigned_tasks=assigned_tasks,
        completed_by_activity=completed_by_activity,
        completed_activities=completed_activities,
        completed_activities_count=completed_activities_count,
        total_activities=total_activities,
        completed_lessons_count=completed_lessons_count,
        total_lessons_count=total_lessons_count,
        student_progress=student_progress,
        total_score=total_score,
        lesson_progress=lesson_progress,
        current_user=current_user,
        badges=user_badges,
        feedback_messages=feedback_messages,
        lesson_due_dates=lesson_due_dates,
        activity_due_dates=activity_due_dates,
        leaderboard=leaderboard,
    )


@student_bp.route('/feedback')
@require_role('student')
def feedback():
    """Detailed Feedback & Evaluation page for student"""
    current_user = get_current_user()
    user_id = current_user.id
    log_access(current_user, 'page_view', 'student_feedback')

    # Get all student attempts
    attempts = db.session.query(AttemptLog, Activity).join(
        Activity, Activity.id == AttemptLog.activity_id
    ).filter(
        AttemptLog.student_id == user_id
    ).order_by(
        AttemptLog.created_at.desc()
    ).all()

    from collections import OrderedDict
    activity_groups_dict = OrderedDict()
    teacher_notes_count = 0
    system_evaluations_count = 0

    for attempt, activity in attempts:
        act_title = activity.type
        if act_title not in activity_groups_dict:
            if 'Claw Machine' in act_title:
                icon = 'bi-controller'
                icon_color = 'text-primary'
                badge_bg = 'brutal-badge-blue'
            elif 'Slide Questions' in act_title or 'Quick Check' in act_title or 'Lesson' in act_title:
                icon = 'bi-journal-check'
                icon_color = 'text-success'
                badge_bg = 'brutal-badge-green'
            elif 'Safari Quest' in act_title:
                icon = 'bi-compass'
                icon_color = 'text-warning'
                badge_bg = 'brutal-badge-yellow'
            else:
                icon = 'bi-puzzle-fill'
                icon_color = 'text-primary'
                badge_bg = 'brutal-badge-blue'

            activity_groups_dict[act_title] = {
                'title': act_title,
                'icon': icon,
                'icon_color': icon_color,
                'badge_bg': badge_bg,
                'attempts': []
            }

        has_teacher_note = bool(attempt.teacher_feedback and attempt.teacher_feedback.strip())
        if has_teacher_note:
            teacher_notes_count += 1
        
        has_system_fb = bool(attempt.feedback and attempt.feedback.strip())
        if has_system_fb:
            system_evaluations_count += 1

        is_lesson_check = ('Slide' in act_title or 'Quick Check' in act_title or 'Lesson' in act_title or 'Question' in act_title)
        activity_groups_dict[act_title]['is_lesson_check'] = is_lesson_check

        if is_lesson_check:
            is_correct = (attempt.score > 0) or ('Correct' in (attempt.feedback or ''))
            outcome_label = 'Correct Answer' if is_correct else 'Needs Practice'
            outcome_type = 'correct' if is_correct else 'incorrect'
        else:
            is_high_score = (attempt.score >= 140)
            is_good_score = (attempt.score >= 100)
            if is_high_score:
                outcome_label = 'Outstanding Sorting'
                outcome_type = 'correct'
            elif is_good_score:
                outcome_label = 'Good Effort'
                outcome_type = 'good'
            else:
                outcome_label = 'Needs Practice'
                outcome_type = 'incorrect'

        formatted_date = attempt.created_at.strftime('%b %d, %Y at %I:%M %p') if attempt.created_at else 'Recently'

        activity_groups_dict[act_title]['attempts'].append({
            'id': attempt.id,
            'attempt_number': attempt.attempt_number,
            'score': attempt.score or 0,
            'is_lesson_check': is_lesson_check,
            'time_spent': attempt.time_spent or 0,
            'system_feedback': attempt.feedback,
            'teacher_feedback': attempt.teacher_feedback,
            'has_teacher_note': has_teacher_note,
            'has_system_feedback': has_system_fb,
            'outcome_type': outcome_type,
            'outcome_label': outcome_label,
            'formatted_date': formatted_date,
            'created_at': attempt.created_at
        })

    activity_groups = list(activity_groups_dict.values())
    total_count = sum(len(g['attempts']) for g in activity_groups)

    return render_template(
        'student/student_feedback.html',
        activity_groups=activity_groups,
        total_feedback_count=total_count,
        teacher_notes_count=teacher_notes_count,
        system_evaluations_count=system_evaluations_count
    )


@student_bp.route('/lessons')
def lessons():
    user_id = session.get('user_id')
    # Only show content explicitly assigned to this student — never fall back to the full library
    if user_id:
        lesson_assignment_rows = db.session.query(LessonAssignment, Lesson).join(
            Lesson, Lesson.id == LessonAssignment.lesson_id
        ).filter(
            LessonAssignment.student_id == user_id
        ).all()
        lessons = [lesson for _, lesson in lesson_assignment_rows]

        activity_assignment_rows = db.session.query(ActivityAssignment, Activity).join(
            Activity, Activity.id == ActivityAssignment.activity_id
        ).filter(
            ActivityAssignment.student_id == user_id
        ).all()
        activities = [activity for _, activity in activity_assignment_rows]
    else:
        lessons = []
        activities = []
    progress_logs = []
    completed_by_activity = {}

    if user_id:
        progress_logs = ProgressLog.query.filter_by(student_id=user_id).all()
        completed_by_activity = {log.activity_id: log for log in progress_logs}

    lesson_progress = []
    for lesson in lessons:
        lesson_activities = [activity for activity in activities if activity.lesson_id == lesson.id]
        is_locked = False
        is_done = has_student_completed_lesson(user_id, lesson.id)
        matching_lesson_ids = [l.id for l in Lesson.query.filter(Lesson.title.ilike(lesson.title.strip())).all()]
        log = LessonProgress.query.filter(
            LessonProgress.student_id == user_id,
            LessonProgress.lesson_id.in_(matching_lesson_ids)
        ).first() if user_id else None

        pct = 100 if is_done else ((log.progress_percent or 0) if log else 0)
        lesson_progress.append({
            'lesson': lesson,
            'completed': is_done,
            'total': len(lesson_activities),
            'percent': pct,
            'is_locked': is_locked
        })

    return render_template('student/lessons.html', lesson_progress=lesson_progress)

def start_or_resume_lesson_attempt(user_id, lesson_id):
    """Called ONLY when a student opens the lesson page in the browser."""
    log = LessonProgress.query.filter_by(student_id=user_id, lesson_id=lesson_id).first()
    latest_attempt = LessonAttemptLog.query.filter_by(
        student_id=user_id, lesson_id=lesson_id
    ).order_by(LessonAttemptLog.attempt_number.desc()).first()

    if not latest_attempt:
        # First visit ever
        attempt = LessonAttemptLog(
            student_id=user_id,
            lesson_id=lesson_id,
            attempt_number=1,
            time_spent=0,
            completed=False,
            progress_percent=0
        )
        db.session.add(attempt)
        if not log:
            log = LessonProgress(
                student_id=user_id,
                lesson_id=lesson_id,
                progress_percent=0,
                current_slide=0,
                completed=False,
                time_spent=0,
                initial_time_spent=0,
                total_time_spent=0,
                revisit_count=0
            )
            db.session.add(log)
        db.session.commit()
        return attempt, log
    elif latest_attempt.completed:
        # Student explicitly reopened a completed lesson -> start a new revisit attempt!
        next_attempt_number = latest_attempt.attempt_number + 1
        attempt = LessonAttemptLog(
            student_id=user_id,
            lesson_id=lesson_id,
            attempt_number=next_attempt_number,
            time_spent=0,
            completed=False,
            progress_percent=0
        )
        db.session.add(attempt)
        if log:
            log.revisit_count = next_attempt_number - 1
            # Maintain master completed status for curriculum achievements
            log.current_slide = 0
            log.time_spent = 0
        db.session.commit()
        return attempt, log
    else:
        # Resume active in-progress attempt
        return latest_attempt, log


def get_active_lesson_attempt(user_id, lesson_id):
    """Called by lesson_progress_api to update the currently active attempt."""
    log = LessonProgress.query.filter_by(student_id=user_id, lesson_id=lesson_id).first()
    latest_attempt = LessonAttemptLog.query.filter_by(
        student_id=user_id, lesson_id=lesson_id
    ).order_by(LessonAttemptLog.attempt_number.desc()).first()

    if not latest_attempt:
        attempt = LessonAttemptLog(
            student_id=user_id,
            lesson_id=lesson_id,
            attempt_number=1,
            time_spent=0,
            completed=False,
            progress_percent=0
        )
        db.session.add(attempt)
        if not log:
            log = LessonProgress(
                student_id=user_id,
                lesson_id=lesson_id,
                progress_percent=0,
                current_slide=0,
                completed=False,
                time_spent=0,
                initial_time_spent=0,
                total_time_spent=0,
                revisit_count=0
            )
            db.session.add(log)
        db.session.commit()
        return attempt, log
    return latest_attempt, log


@student_bp.route('/lesson_progress', methods=['POST'])
@csrf.exempt  # JSON fetch() from lesson JS — no form token
def lesson_progress_api():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    user = User.query.get(user_id)
    if not user or user.role != 'student':
        return jsonify({'status': 'ignored', 'message': 'Only student progress is tracked'}), 200

    data = request.get_json(silent=True) or request.form
    lesson_id = data.get('lesson_id')
    if lesson_id is None:
        return jsonify({'error': 'lesson_id is required'}), 400

    try:
        lesson_id = int(lesson_id)
        progress_percent = int(data.get('progress_percent', 0))
        current_slide = int(data.get('current_slide', 0))
        time_spent_delta = int(data.get('time_spent', 0))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid numeric values'}), 400

    completed = str(data.get('completed')).lower() in ('true', '1', 'yes')
    lesson = Lesson.query.get(lesson_id)
    if not lesson:
        return jsonify({'error': 'Lesson not found'}), 404

    attempt, log = get_active_lesson_attempt(user_id, lesson_id)
    if completed or progress_percent >= 100:
        attempt.completed = True
        attempt.progress_percent = 100
        if log:
            log.completed = True
            log.progress_percent = 100
            if not log.completed_at:
                log.completed_at = datetime.utcnow()
    elif not attempt.completed:
        attempt.progress_percent = progress_percent
        if log:
            if not log.completed and (log.revisit_count or 0) == 0:
                log.progress_percent = progress_percent
            log.current_slide = current_slide

    # Update attempt time spent
    attempt.time_spent = (attempt.time_spent or 0) + time_spent_delta

    if log:
        log.time_spent = attempt.time_spent
        log.total_time_spent = (log.total_time_spent or 0) + time_spent_delta
        if attempt.attempt_number == 1 and (log.initial_time_spent or 0) == 0:
            log.initial_time_spent = attempt.time_spent

    db.session.commit()
    
    # Sync assignment status to completed when lesson is finished
    if completed or progress_percent >= 100:
        matching_lesson_ids = [l.id for l in Lesson.query.filter(Lesson.title.ilike(lesson.title.strip())).all()]
        assignments = LessonAssignment.query.filter(
            LessonAssignment.student_id == user_id,
            LessonAssignment.lesson_id.in_(matching_lesson_ids)
        ).all()
        for la in assignments:
            la.status = 'completed'
            
        # Also ensure any LessonProgress records for matching lessons are marked completed
        for match_id in matching_lesson_ids:
            other_lp = LessonProgress.query.filter_by(student_id=user_id, lesson_id=match_id).first()
            if other_lp:
                other_lp.completed = True
                other_lp.progress_percent = 100
                if not other_lp.completed_at:
                    other_lp.completed_at = datetime.utcnow()

        check_and_award_badges(user_id)
    db.session.commit()
    
    return jsonify({'status': 'ok'})

@student_bp.route('/lesson_question_attempt', methods=['POST'])
@csrf.exempt
def lesson_question_attempt():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'error': 'Authentication required'}), 401

    data = request.get_json(silent=True) or request.form or {}
    lesson_id = data.get('lesson_id', 1)
    question = (data.get('question') or 'Lesson Question').strip()
    was_correct = bool(data.get('was_correct', False))

    try:
        lesson_id = int(lesson_id)
    except (TypeError, ValueError):
        lesson_id = 1

    lesson = Lesson.query.get(lesson_id) or get_or_create_default_lesson()
    activity = Activity.query.filter_by(lesson_id=lesson.id, engine='lesson').first()
    if not activity:
        activity = Activity(
            lesson_id=lesson.id,
            type=f'{lesson.title} Slide Questions',
            engine='lesson',
            points=0
        )
        db.session.add(activity)
        db.session.commit()
    elif activity.points != 0:
        activity.points = 0
        db.session.commit()

    current_lesson_attempt = LessonAttemptLog.query.filter_by(
        student_id=user_id, lesson_id=lesson.id
    ).order_by(LessonAttemptLog.attempt_number.desc()).first()
    
    lesson_att_num = current_lesson_attempt.attempt_number if current_lesson_attempt else 1

    attempt = AttemptLog.query.filter_by(
        student_id=user_id, 
        activity_id=activity.id, 
        attempt_number=lesson_att_num
    ).first()

    if not attempt:
        attempt = AttemptLog(
            student_id=user_id,
            activity_id=activity.id,
            attempt_number=lesson_att_num,
            score=0,
            result='completed',
            feedback=f"Slide Checks for {lesson.title}"
        )
        db.session.add(attempt)
        db.session.flush()

    obj_log = AttemptObjectLog(
        attempt_log_id=attempt.id,
        object_id=question,
        was_correct=was_correct,
        attempt_number=1
    )
    db.session.add(obj_log)
    db.session.commit()

    return jsonify({'status': 'ok'})

@student_bp.route('/activities')
@require_role('student')
def activities():
    current_user = get_current_user()
    user_id = current_user.id
    claw_machine_activity = get_or_create_claw_machine_activity()
    assigned_activity_ids = [
        a.activity_id for a in ActivityAssignment.query.filter(
            ActivityAssignment.student_id == user_id,
            ActivityAssignment.status.in_(['assigned', 'completed', 'attempts_exhausted'])
        ).all()
    ]
    activities = Activity.query.filter(
        Activity.id.in_(assigned_activity_ids),
        Activity.engine.in_(playable_engines)
    ).all() if assigned_activity_ids else []
    progress_logs = []
    completed_by_activity = {}

    # Seed attempts_today for all game-engine activities the student is assigned
    attempts_today_by_activity = {
        claw_machine_activity.id: get_attempts_today(user_id, claw_machine_activity.id)
    }
    for act in activities:
        if act.id not in attempts_today_by_activity:
            attempts_today_by_activity[act.id] = get_attempts_today(user_id, act.id)

    unlocked_by_activity = {}

    if user_id:
        progress_logs = ProgressLog.query.filter_by(student_id=user_id).all()
        completed_by_activity = {log.activity_id: log for log in progress_logs}

        lesson_progress = LessonProgress.query.filter_by(student_id=user_id).all()
        lesson_progress_by_lesson = {log.lesson_id: log for log in lesson_progress}

        for activity in activities:
            unlocked_by_activity[activity.id] = is_activity_unlocked(user_id, activity)

    return render_template(
        'student/activities.html',
        activities=activities,
        completed_by_activity=completed_by_activity,
        attempts_today_by_activity=attempts_today_by_activity,
        unlocked_by_activity=unlocked_by_activity,
    )

@student_bp.route('/activity_complete/<int:activity_id>/<int:score>')
def activity_complete(activity_id, score):
    user_id = session.get('user_id')
    if user_id:
        log = ProgressLog.query.filter_by(student_id=user_id, activity_id=activity_id).first()
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
    user_id = session.get('user_id')
    lesson = get_or_create_default_lesson()
    if user_id:
        attempt, log = start_or_resume_lesson_attempt(user_id, lesson.id)
        initial_slide = log.current_slide if log else 0
    else:
        initial_slide = 0
    return render_template('student/living_non_living_lesson.html', lesson=lesson, initial_slide=initial_slide)

@student_bp.route('/lesson/characters-of-living-things')
@student_bp.route('/lesson/parts-of-an-animal')
@require_role('student')
def characters_lesson():
    return redirect(url_for('student.animal_body_parts_lesson'))

@student_bp.route('/claw_machine')
@require_role('student')
def claw_machine():
    current_user = get_current_user()
    activity = get_or_create_claw_machine_activity()
    if not is_activity_unlocked(current_user.id, activity):
        flash('Please complete the Living vs Non-Living lesson before playing the claw machine.', 'warning')
        return redirect(url_for('student.lessons'))

    used_today = get_attempts_today(current_user.id, activity.id)
    if used_today >= 3:
        flash("You have already used all 3 attempts for today on this activity. Please check back tomorrow!", "warning")
        return redirect(url_for('student.activities'))

    return render_template('student/claw_machine_game.html', activity_id=activity.id)

@student_bp.route('/characters_game')
@student_bp.route('/part_dash')
@require_role('student')
def characters_game():
    return redirect(url_for('student.find_the_part_game'))


# ── Lesson 2A — Animal Body Parts ────────────────────────────────────────────

def get_or_create_animal_body_parts_lesson():
    lesson = Lesson.query.filter_by(title='Animal Body Parts').first()
    if lesson:
        return lesson
    lesson = Lesson(
        title='Animal Body Parts',
        description='Discover how the head, legs, and wings help animals move and find food.',
    )
    db.session.add(lesson)
    db.session.commit()
    return lesson


def get_or_create_find_the_part_activity():
    lesson = get_or_create_animal_body_parts_lesson()
    activity = Activity.query.filter_by(
        lesson_id=lesson.id,
        engine='find_the_part',
    ).first()
    if activity:
        return activity
    activity = Activity(
        lesson_id=lesson.id,
        type='Animal Body Parts — Find the Part',
        engine='find_the_part',
        points=100,
    )
    db.session.add(activity)
    db.session.commit()
    return activity


@student_bp.route('/lesson/animal-body-parts')
@require_role('student')
def animal_body_parts_lesson():
    current_user = get_current_user()
    lesson = get_or_create_animal_body_parts_lesson()
    attempt, log = start_or_resume_lesson_attempt(current_user.id, lesson.id)
    initial_slide = log.current_slide if log else 0
    return render_template(
        'student/animal_body_parts_lesson.html',
        lesson=lesson,
        initial_slide=initial_slide,
    )


@student_bp.route('/find_the_part')
@require_role('student')
def find_the_part_game():
    current_user = get_current_user()
    activity = get_or_create_find_the_part_activity()

    if not is_activity_unlocked(current_user.id, activity):
        lesson_title = activity.lesson.title if activity.lesson else 'lesson'
        flash(f'Please complete the "{lesson_title}" lesson before playing Find the Part.', 'warning')
        return redirect(url_for('student.lessons'))

    used_today = get_attempts_today(current_user.id, activity.id)
    if used_today >= 3:
        flash('You have already used all 3 attempts for today on this activity. Check back tomorrow!', 'warning')
        return redirect(url_for('student.activities'))

    log_access(current_user, 'page_view', f'find_the_part activity_id={activity.id}')
    return render_template('student/find_the_part_game.html', activity_id=activity.id, attempts_today=used_today)


# ── Lesson 2B — Plant Parts ───────────────────────────────────────────────────

def get_or_create_plant_parts_lesson():
    lesson = Lesson.query.filter_by(title='Plant Parts').first()
    if lesson:
        return lesson
    lesson = Lesson(
        title='Plant Parts',
        description='Explore how roots, stem, and leaves work together to keep a plant alive.',
    )
    db.session.add(lesson)
    db.session.commit()
    return lesson


def get_or_create_streak_race_activity():
    # Streak Race has been replaced by Build a Plant.
    # Delegate to the build_a_plant helper to keep existing code paths working.
    return get_or_create_build_a_plant_activity()


@student_bp.route('/lesson/plant-parts')
@require_role('student')
def plant_parts_lesson():
    current_user = get_current_user()
    lesson = get_or_create_plant_parts_lesson()
    attempt, log = start_or_resume_lesson_attempt(current_user.id, lesson.id)
    initial_slide = log.current_slide if log else 0
    return render_template(
        'student/plant_parts_lesson.html',
        lesson=lesson,
        initial_slide=initial_slide,
    )


@student_bp.route('/streak_race')
@require_role('student')
def streak_race_game():
    # Streak Race has been replaced by Build a Plant — redirect transparently.
    return redirect(url_for('student.build_a_plant_game'))


# ── Plant Parts — Build a Plant ───────────────────────────────────────────────

def get_or_create_build_a_plant_activity():
    lesson = get_or_create_plant_parts_lesson()
    activity = Activity.query.filter_by(
        lesson_id=lesson.id,
        engine='build_a_plant',
    ).first()
    if activity:
        return activity
    activity = Activity(
        lesson_id=lesson.id,
        type='Plant Parts — Build a Plant',
        engine='build_a_plant',
        points=100,
    )
    db.session.add(activity)
    db.session.commit()
    return activity


@student_bp.route('/build_a_plant')
@require_role('student')
def build_a_plant_game():
    current_user = get_current_user()
    activity = get_or_create_build_a_plant_activity()

    if not is_activity_unlocked(current_user.id, activity):
        lesson_title = activity.lesson.title if activity.lesson else 'lesson'
        flash(f'Please complete the "{lesson_title}" lesson before playing Build a Plant.', 'warning')
        return redirect(url_for('student.lessons'))

    used_today = get_attempts_today(current_user.id, activity.id)
    if used_today >= 3:
        flash('You have already used all 3 attempts for today on this activity. Check back tomorrow!', 'warning')
        return redirect(url_for('student.activities'))

    log_access(current_user, 'page_view', f'build_a_plant activity_id={activity.id}')
    return render_template('student/build_a_plant_game.html', activity_id=activity.id, attempts_today=used_today)


# ── Week 10, Lesson 1 — Properties of Metals ─────────────────────────────────

def get_or_create_properties_of_metals_lesson():
    lesson = Lesson.query.filter_by(title='Properties of Metals').first()
    if lesson:
        return lesson
    lesson = Lesson(
        title='Properties of Metals',
        description='Explore the properties of Iron, Copper, Gold, and Silver through interactive experiments.',
    )
    db.session.add(lesson)
    db.session.commit()
    return lesson


@student_bp.route('/lesson/properties-of-metals')
@require_role('student')
def properties_of_metals_lesson():
    current_user = get_current_user()
    lesson = get_or_create_properties_of_metals_lesson()
    attempt, log = start_or_resume_lesson_attempt(current_user.id, lesson.id)
    initial_slide = log.current_slide if log else 0
    return render_template(
        'student/properties_of_metals_lesson.html',
        lesson=lesson,
        initial_slide=initial_slide,
    )


# ── Week 10, Lesson 2 — Recycling ───────────────────────────────────────────

def get_or_create_recycling_lesson():
    lesson = Lesson.query.filter_by(title='Recycling').first()
    if lesson:
        return lesson
    lesson = Lesson(
        title='Recycling',
        description='Discover the recycling process and practice sorting recyclable materials from food waste.',
    )
    db.session.add(lesson)
    db.session.commit()
    return lesson


@student_bp.route('/lesson/recycling')
@require_role('student')
def recycling_lesson():
    current_user = get_current_user()
    lesson = get_or_create_recycling_lesson()
    attempt, log = start_or_resume_lesson_attempt(current_user.id, lesson.id)
    initial_slide = log.current_slide if log else 0
    return render_template(
        'student/recycling_lesson.html',
        lesson=lesson,
        initial_slide=initial_slide,
    )


def get_or_create_metals_game_activity():
    lesson = get_or_create_properties_of_metals_lesson()
    activity = Activity.query.filter_by(
        lesson_id=lesson.id,
        engine='metal_logic'
    ).first()
    if activity:
        return activity
    activity = Activity(
        lesson_id=lesson.id,
        type='Properties of Metals — Metal Clue Detective',
        engine='metal_logic',
        points=100
    )
    db.session.add(activity)
    db.session.commit()
    return activity


@student_bp.route('/materials_game')
@require_role('student')
def materials_game():
    current_user = get_current_user()
    activity = get_or_create_metals_game_activity()
    if not activity:
        flash('Metal Clue Detective activity is not available.', 'danger')
        return redirect(url_for('student.activities'))

    if not is_activity_unlocked(current_user.id, activity):
        flash('Please complete the "Properties of Metals" lesson before playing Metal Clue Detective.', 'warning')
        return redirect(url_for('student.lessons'))

    used_today = get_attempts_today(current_user.id, activity.id)
    if used_today >= 3:
        flash('You have already used all 3 attempts for today on this activity. Check back tomorrow!', 'warning')
        return redirect(url_for('student.activities'))

    log_access(current_user, 'page_view', f'materials_game activity_id={activity.id}')
    return render_template('student/materials_game.html', activity_id=activity.id, attempts_today=used_today)


def get_or_create_recycling_game_activity():
    lesson = get_or_create_recycling_lesson()
    activity = Activity.query.filter_by(
        lesson_id=lesson.id,
        engine='recycle_sorter'
    ).first()
    if activity:
        return activity
    activity = Activity(
        lesson_id=lesson.id,
        type='Recycling — EcoSwipe Sorter',
        engine='recycle_sorter',
        points=100
    )
    db.session.add(activity)
    db.session.commit()
    return activity


@student_bp.route('/recycling_game')
@require_role('student')
def recycling_game():
    current_user = get_current_user()
    activity = get_or_create_recycling_game_activity()
    if not activity:
        flash('EcoSwipe activity is not available.', 'danger')
        return redirect(url_for('student.activities'))

    if not is_activity_unlocked(current_user.id, activity):
        flash('Please complete the "Recycling" lesson before playing EcoSwipe.', 'warning')
        return redirect(url_for('student.lessons'))

    used_today = get_attempts_today(current_user.id, activity.id)
    if used_today >= 3:
        flash('You have already used all 3 attempts for today on this activity. Check back tomorrow!', 'warning')
        return redirect(url_for('student.activities'))

    log_access(current_user, 'page_view', f'recycling_game activity_id={activity.id}')
    return render_template('student/recycling_game.html', activity_id=activity.id, attempts_today=used_today)


@student_bp.route('/sorting_activity_config/<int:activity_id>')
@require_role('student')
def sorting_activity_config(activity_id):
    activity = Activity.query.filter_by(id=activity_id).first()
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404

    config = load_sorting_activity_config(activity_id)
    bins = config.get('bins') if isinstance(config.get('bins'), list) else []
    objects = config.get('objects') if isinstance(config.get('objects'), list) else []

    if len(bins) < 2 or len(bins) > 4:
        return jsonify({'error': 'Activity config must have 2-4 bins'}), 400

    return jsonify({
        'title': config.get('title') or activity.type or 'Sorting Activity',
        'instructions': config.get('instructions') or 'Sort the objects into the correct bins.',
        'round_size': int(config.get('round_size') or 12),
        'bins': bins,
        'objects': objects,
    })


@student_bp.route('/activity_attempts/<int:activity_id>')
@require_role('student')
def activity_attempts(activity_id):
    current_user = get_current_user()
    activity = Activity.query.filter_by(id=activity_id).first()
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404

    used = get_attempts_today(current_user.id, activity.id)
    return jsonify({'used': used, 'remaining': max(0, 3 - used), 'limit': 3})


@student_bp.route('/activity_progress', methods=['POST'])
@csrf.exempt  # JSON fetch() from clawMachineGame.js — no form token
@require_role('student')
def activity_progress():
    current_user = get_current_user()
    data = request.get_json(silent=True) or request.form

    try:
        activity_id = int(data.get('activity_id'))
        score = int(data.get('score'))
        attempts = int(data.get('attempts', 0))
        time_spent = int(data.get('time_spent'))
        correct_first_try = int(data.get('correct_first_try'))
    except (TypeError, ValueError):
        return jsonify({'error': 'Invalid activity progress values'}), 400

    if attempts < 0 or time_spent < 0 or correct_first_try < 0:
        return jsonify({'error': 'Progress values cannot be negative'}), 400

    activity = Activity.query.filter_by(id=activity_id).first()
    if not activity:
        return jsonify({'error': 'Activity not found'}), 404

    attempts_today = get_attempts_today(current_user.id, activity.id)

    if attempts_today >= 3:
        return jsonify({
            'error': "You've reached today's attempt limit — try again tomorrow."
        }), 403

    progress_log = ProgressLog.query.filter_by(
        student_id=current_user.id,
        activity_id=activity.id
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

    total_attempts = AttemptLog.query.filter_by(
        student_id=current_user.id,
        activity_id=activity.id
    ).count()

    attempt = AttemptLog(
        student_id=current_user.id,
        activity_id=activity.id,
        attempt_number=total_attempts + 1,
        score=score,
        result='completed',
        feedback=f'Correct on first try: {correct_first_try}; object attempts: {attempts}',
        time_spent=time_spent
    )
    db.session.add(attempt)
    db.session.flush()  # to get attempt.id

    # Record granular object-level attempts (manuscript §1.2 analytics)
    object_logs = data.get('object_logs', [])
    for obj in object_logs:
        obj_log = AttemptObjectLog(
            attempt_log_id=attempt.id,
            object_id=str(obj.get('object_id', '')),
            was_correct=bool(obj.get('was_correct', False)),
            attempt_number=int(obj.get('attempt_number', 1))
        )
        db.session.add(obj_log)

    db.session.commit()
    print(
        f'Claw machine saved: student_id={current_user.id} '
        f'activity_id={activity.id} score={score} '
        f'attempt_number={attempt.attempt_number}'
    )
    log_access(current_user, 'activity_progress', f'activity_id={activity.id} attempt_number={attempt.attempt_number}')

    # Compute manuscript §1.2 rating and persist to AttemptLog
    rating = compute_rating(score, correct_first_try)
    hint = RATING_HINTS.get(rating, 'Good effort!')
    attempt.rating = rating
    attempt.hints = hint
    db.session.commit()

    # Check for badge achievements
    check_and_award_badges(current_user.id)

    # Transition assignment to completed (or attempts_exhausted if 3 attempts reached today)
    attempts_used = attempts_today + 1
    new_status = 'attempts_exhausted' if attempts_used >= 3 else 'completed'
    act_assignments = ActivityAssignment.query.filter(
        ActivityAssignment.student_id == current_user.id,
        ActivityAssignment.activity_id == activity.id,
        ActivityAssignment.status.in_(['assigned', 'completed'])
    ).all()
    for aa in act_assignments:
        aa.status = new_status
    db.session.commit()

    return jsonify({
        'status': 'ok',
        'score': score,
        'best_score': progress_log.score,
        'rating': rating,
        'hint': hint,
        'attempts_today': attempts_used,
        'attempts_limit': 3,
        'attempts_exhausted': attempts_used >= 3
    })


@student_bp.route('/assignments')
@require_role('student')
def assignments():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'student_assignments')
    lesson_assignments = LessonAssignment.query.filter_by(student_id=current_user.id).all()
    active_activity_assignments = ActivityAssignment.query.filter_by(
        student_id=current_user.id,
        status='assigned'
    ).all()
    exhausted_activity_assignments = ActivityAssignment.query.filter(
        ActivityAssignment.student_id == current_user.id,
        ActivityAssignment.status.in_(['attempts_exhausted', 'completed'])
    ).all()

    unlocked_by_activity = {}
    for aa in active_activity_assignments + exhausted_activity_assignments:
        if aa.activity:
            unlocked_by_activity[aa.activity_id] = is_activity_unlocked(current_user.id, aa.activity)
        else:
            unlocked_by_activity[aa.activity_id] = False

    return render_template(
        'student/student_assignments.html',
        current_user=current_user,
        lesson_assignments=lesson_assignments,
        activity_assignments=active_activity_assignments,
        exhausted_activity_assignments=exhausted_activity_assignments,
        unlocked_by_activity=unlocked_by_activity
    )


@student_bp.route('/activity_attempt', methods=['POST'])
@require_role('student')
def activity_attempt():
    current_user = get_current_user()
    activity_id = request.form.get('activity_id')
    score = int(request.form.get('score', 0))
    feedback_text = request.form.get('feedback', '')
    attempts_today = AttemptLog.query.filter_by(student_id=current_user.id, activity_id=activity_id).count()
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
    check_and_award_badges(current_user.id)
    badges = UserBadge.query.filter_by(user_id=current_user.id).order_by(UserBadge.awarded_at.desc()).all()
    return render_template('student/student_badges.html', current_user=current_user, badges=badges)


@student_bp.route('/leaderboard')
@require_role('student')
def leaderboard():
    current_user = get_current_user()
    log_access(current_user, 'page_view', 'student_leaderboard')
    user_id = current_user.id

    # --- Overall leaderboard (best score per activity summed) ---
    leaderboard_query = db.session.query(
        User.id,
        User.name,
        db.func.coalesce(db.func.sum(ProgressLog.score), 0).label('total_points')
    ).outerjoin(
        ProgressLog, (ProgressLog.student_id == User.id)
    ).filter(
        User.role == 'student'
    ).group_by(
        User.id, User.name
    ).order_by(
        db.desc('total_points'), User.name
    ).all()

    leaderboard_data = [
        {
            'rank': idx + 1,
            'student_id': row.id,
            'name': row.name,
            'points': int(row.total_points or 0),
            'is_current': (row.id == user_id)
        }
        for idx, row in enumerate(leaderboard_query)
    ]

    # --- Per-game leaderboards (best score = ProgressLog.score) ---
    def build_game_leaderboard(activity_type_fragment):
        rows = db.session.query(
            User.id,
            User.name,
            db.func.max(ProgressLog.score).label('best_score')
        ).join(
            ProgressLog, ProgressLog.student_id == User.id
        ).join(
            Activity, Activity.id == ProgressLog.activity_id
        ).filter(
            User.role == 'student',
            Activity.type.ilike(f'%{activity_type_fragment}%')
        ).group_by(User.id, User.name).order_by(db.desc('best_score'), User.name).all()

        return [
            {
                'rank': idx + 1,
                'student_id': row.id,
                'name': row.name,
                'points': int(row.best_score or 0),
                'is_current': (row.id == user_id)
            }
            for idx, row in enumerate(rows)
        ]

    claw_leaderboard = build_game_leaderboard('Claw Machine')
    animal_leaderboard = build_game_leaderboard('Find the Part')
    plant_leaderboard = build_game_leaderboard('Build a Plant')

    # --- My Progress: personal retry history per game (private) ---
    def get_my_attempts(activity_type_fragment):
        attempts = db.session.query(
            AttemptLog.attempt_number,
            AttemptLog.score,
            AttemptLog.time_spent,
            AttemptLog.created_at,
            Activity.type.label('activity_type')
        ).join(
            Activity, Activity.id == AttemptLog.activity_id
        ).filter(
            AttemptLog.student_id == user_id,
            Activity.type.ilike(f'%{activity_type_fragment}%')
        ).order_by(AttemptLog.attempt_number.asc()).all()

        result = []
        prev_score = None
        for a in attempts:
            delta = None
            if prev_score is not None:
                delta = (a.score or 0) - prev_score
            result.append({
                'attempt_number': a.attempt_number,
                'score': a.score or 0,
                'time_spent': a.time_spent or 0,
                'created_at': a.created_at,
                'delta': delta
            })
            prev_score = a.score or 0
        return result

    my_claw_attempts = get_my_attempts('Claw Machine')
    my_animal_attempts = get_my_attempts('Find the Part')
    my_plant_attempts = get_my_attempts('Build a Plant')

    # --- My Lesson Attempts & Revisits ---
    lessons_progress = LessonProgress.query.filter_by(student_id=user_id).all()
    my_lesson_attempts = []
    for lp in lessons_progress:
        att_logs = LessonAttemptLog.query.filter_by(
            student_id=user_id, lesson_id=lp.lesson_id
        ).order_by(LessonAttemptLog.attempt_number.asc()).all()
        tot_time = sum((a.time_spent or 0) for a in att_logs) if att_logs else (lp.total_time_spent or lp.time_spent or 0)
        is_done = bool(lp.completed or (lp.revisit_count or 0) > 0 or any(a.completed for a in att_logs))
        my_lesson_attempts.append({
            'lesson_title': lp.lesson.title if lp.lesson else f'Lesson #{lp.lesson_id}',
            'completed': is_done,
            'progress_percent': 100 if is_done else (lp.progress_percent or 0),
            'attempts': att_logs,
            'total_time': tot_time,
            'revisit_count': lp.revisit_count or 0
        })

    return render_template(
        'student/student_leaderboard.html',
        current_user=current_user,
        leaderboard=leaderboard_data,
        claw_leaderboard=claw_leaderboard,
        animal_leaderboard=animal_leaderboard,
        plant_leaderboard=plant_leaderboard,
        my_claw_attempts=my_claw_attempts,
        my_animal_attempts=my_animal_attempts,
        my_plant_attempts=my_plant_attempts,
        my_lesson_attempts=my_lesson_attempts
    )

