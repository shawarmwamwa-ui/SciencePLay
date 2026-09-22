import os
from datetime import datetime, timedelta
from flask import Flask, redirect, url_for, session, jsonify
from flask_wtf.csrf import CSRFProtect
from sqlalchemy import text
from database.models import db, User
from routes.admin_routes import admin_bp
from routes.teacher_routes import teacher_bp
from routes.student_routes import student_bp
from routes.auth_routes import auth_bp
from routes.utils import get_current_user

app = Flask(__name__)

# Secret key — configurable via environment variable
app.secret_key = os.environ.get("SECRET_KEY", "supersecretkey")

# CSRF protection (manuscript §3.1)
app.config['WTF_CSRF_ENABLED'] = True
app.config['WTF_CSRF_TIME_LIMIT'] = 3600  # token valid for 1 hour

from routes.utils import csrf
csrf.init_app(app)

# Database configuration — supports local XAMPP and Cloud databases (Render, Aiven, TiDB, etc.)
raw_db_uri = os.environ.get('DATABASE_URL') or 'mysql+pymysql://root:@localhost/scienceplay'
if raw_db_uri.startswith('postgres://'):
    raw_db_uri = raw_db_uri.replace('postgres://', 'postgresql://', 1)
elif raw_db_uri.startswith('mysql://'):
    raw_db_uri = raw_db_uri.replace('mysql://', 'mysql+pymysql://', 1)

engine_options = {
    'pool_pre_ping': True,
    'pool_recycle': 280,
    'pool_timeout': 20,
}

# If connecting to Cloud MySQL (Aiven, TiDB, etc.), clean query string and enable SSL
if 'aivencloud.com' in raw_db_uri or 'tidbcloud.com' in raw_db_uri or 'ssl-mode' in raw_db_uri:
    import urllib.parse
    parsed = urllib.parse.urlparse(raw_db_uri)
    raw_db_uri = f"{parsed.scheme}://{parsed.netloc}{parsed.path}"
    engine_options['connect_args'] = {'ssl': {}}

app.config['SQLALCHEMY_DATABASE_URI'] = raw_db_uri
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = engine_options

db.init_app(app)

from routes.utils import to_ph_time

@app.template_filter('to_ph_time')
def to_ph_time_filter(dt, fmt='%b %d, %Y at %I:%M %p'):
    if not dt:
        return ''
    ph_dt = to_ph_time(dt)
    return ph_dt.strftime(fmt)

app.jinja_env.globals.update(to_ph_time=to_ph_time)


def ensure_attempt_log_teacher_feedback_column():
    with app.app_context():
        inspector = db.inspect(db.engine)
        columns = [column['name'] for column in inspector.get_columns('attempt_log')]
        if 'teacher_feedback' not in columns:
            db.session.execute(text('ALTER TABLE attempt_log ADD COLUMN teacher_feedback TEXT NULL'))
            db.session.commit()

        lp_columns = [column['name'] for column in inspector.get_columns('lesson_progress')]
        if 'initial_time_spent' not in lp_columns:
            db.session.execute(text('ALTER TABLE lesson_progress ADD COLUMN initial_time_spent INT DEFAULT 0'))
            db.session.commit()
        if 'total_time_spent' not in lp_columns:
            db.session.execute(text('ALTER TABLE lesson_progress ADD COLUMN total_time_spent INT DEFAULT 0'))
            db.session.commit()


def ensure_default_users():
    with app.app_context():
        if User.query.count() == 0:
            # Seed default starter accounts on fresh deployment
            admin = User(name='Admin', username='admin', role='admin')
            admin.set_password('admin123')

            teacher = User(name='Teacher', username='teacher', role='teacher')
            teacher.set_password('teacher123')

            student = User(name='Student 1', username='student1', role='student')
            student.set_password('student123')

            db.session.add_all([admin, teacher, student])
            db.session.commit()
            print("Default starter users seeded: admin, teacher, student1")


def ensure_default_curriculum():
    with app.app_context():
        from routes.student_routes import (
            get_or_create_default_lesson,
            get_or_create_claw_machine_activity,
            get_or_create_animal_body_parts_lesson,
            get_or_create_find_the_part_activity,
            get_or_create_plant_parts_lesson,
            get_or_create_build_a_plant_activity,
            get_or_create_properties_of_metals_lesson,
            get_or_create_metals_game_activity,
            get_or_create_recycling_lesson,
            get_or_create_recycling_game_activity
        )
        try:
            get_or_create_default_lesson()
            get_or_create_claw_machine_activity()
            get_or_create_animal_body_parts_lesson()
            get_or_create_find_the_part_activity()
            get_or_create_plant_parts_lesson()
            get_or_create_build_a_plant_activity()
            get_or_create_properties_of_metals_lesson()
            get_or_create_metals_game_activity()
            get_or_create_recycling_lesson()
            get_or_create_recycling_game_activity()
        except Exception as e:
            print("Curriculum auto-seed notice:", e)


with app.app_context():
    db.create_all()
    ensure_attempt_log_teacher_feedback_column()
    ensure_default_users()
    ensure_default_curriculum()



@app.teardown_request
def teardown_request(exception=None):
    if exception:
        db.session.rollback()
    db.session.remove()


@app.before_request
def update_last_seen():
    user_id = session.get('user_id')
    if user_id:
        user = User.query.get(user_id)
        if user:
            now = datetime.utcnow()
            # Throttle DB updates to once every 10 seconds
            if not user.last_seen or (now - user.last_seen).total_seconds() > 10:
                user.last_seen = now
                try:
                    db.session.commit()
                except Exception:
                    db.session.rollback()

@app.after_request
def add_webview_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, OPTIONS, PUT, DELETE'
    response.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With'
    # Ensure X-Frame-Options allows embedding in WebViews
    response.headers.pop('X-Frame-Options', None)
    # Ensure no blocking Content Security Policy is attached
    response.headers.pop('Content-Security-Policy', None)
    return response

@app.route('/')
def index():
    return redirect(url_for('auth.login'))

@app.route('/api/heartbeat', methods=['POST', 'GET'])
@csrf.exempt
def heartbeat():
    user_id = session.get('user_id')
    if not user_id:
        return jsonify({'status': 'unauthorized'}), 401
    user = User.query.get(user_id)
    if user:
        user.last_seen = datetime.utcnow()
        try:
            db.session.commit()
        except Exception:
            db.session.rollback()
    return jsonify({'status': 'ok'})

@app.route('/api/online_users', methods=['GET'])
def get_online_users():
    current_user = get_current_user()
    if not current_user:
        return jsonify({'error': 'Unauthorized'}), 401
    
    if current_user.role not in ('teacher', 'admin'):
        return jsonify({'error': 'Forbidden'}), 403

    online_threshold = datetime.utcnow() - timedelta(minutes=3)

    query = User.query.filter(
        User.last_seen >= online_threshold
    )

    if current_user.role == 'teacher':
        query = query.filter(User.role == 'student')
    elif current_user.role == 'admin':
        query = query.filter(User.role.in_(['teacher', 'student']))

    users = query.order_by(User.name.asc()).all()
    
    users_data = [{
        'id': u.id,
        'name': u.name,
        'username': u.username,
        'role': u.role,
        'last_seen': u.last_seen.strftime('%Y-%m-%d %H:%M:%S') if u.last_seen else None
    } for u in users]

    return jsonify({
        'status': 'ok',
        'count': len(users_data),
        'online_users': users_data
    })

import gzip
from io import BytesIO
from flask import request

@app.after_request
def compress_response(response):
    accept_encoding = request.headers.get('Accept-Encoding', '')
    if (
        response.direct_passthrough
        or request.path.startswith('/static/')
        or 'gzip' not in accept_encoding.lower()
        or response.status_code < 200
        or response.status_code >= 300
        or 'Content-Encoding' in response.headers
        or not response.content_type
        or not any(response.content_type.startswith(t) for t in ('text/html', 'application/json'))
    ):
        return response

    response_data = response.get_data()
    if len(response_data) < 500:
        return response

    gzip_buffer = BytesIO()
    with gzip.GzipFile(mode='wb', fileobj=gzip_buffer, compresslevel=6) as gzip_file:
        gzip_file.write(response_data)

    response.set_data(gzip_buffer.getvalue())
    response.headers['Content-Encoding'] = 'gzip'
    response.headers['Content-Length'] = len(response.get_data())
    return response

# Register blueprints
app.register_blueprint(auth_bp)      # login/logout routes
app.register_blueprint(admin_bp)     # admin dashboard
app.register_blueprint(teacher_bp)   # teacher dashboard
app.register_blueprint(student_bp)   # student dashboard

@app.route('/healthz')
def healthz():
    return "OK", 200

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=True, threaded=True)
