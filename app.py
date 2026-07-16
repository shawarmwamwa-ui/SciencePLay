import os
from flask import Flask, redirect, url_for
from database.models import db
from routes.admin_routes import admin_bp
from routes.teacher_routes import teacher_bp
from routes.student_routes import student_bp
from routes.auth_routes import auth_bp

app = Flask(__name__)

# Secret key for sessions and flash messages
app.secret_key = "supersecretkey"

# Database configuration
mysql_user = os.getenv("MYSQL_USER", "root")
mysql_password = os.getenv("MYSQL_PASSWORD", "")
mysql_host = os.getenv("MYSQL_HOST", "localhost")
mysql_port = os.getenv("MYSQL_PORT", "3306")
mysql_db = os.getenv("MYSQL_DB", "scienceplay")

database_url = os.getenv("DATABASE_URL") or os.getenv("SQLALCHEMY_DATABASE_URI") or (
    f"mysql+pymysql://{mysql_user}:{mysql_password}@{mysql_host}:{mysql_port}/{mysql_db}"
)

app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  # optional, avoids warnings

# Initialize database
db.init_app(app)

@app.route('/')
def index():
    return redirect(url_for('auth.login'))

# Register blueprints
app.register_blueprint(auth_bp)      # login/logout routes
app.register_blueprint(admin_bp)     # admin dashboard
app.register_blueprint(teacher_bp)   # teacher dashboard
app.register_blueprint(student_bp)   # student dashboard

if __name__ == "__main__":
    with app.app_context():
        db.create_all()
    app.run(debug=True)
