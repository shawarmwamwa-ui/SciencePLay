"""
SciencePlay - Load and Concurrency Testing Suite (Locust)
Simulates concurrent students, teachers, and anonymous visitors.

To run:
    pip install locust
    locust -f locustfile.py --host=http://127.0.0.1:5000

Or headless with reports:
    locust -f locustfile.py --host=http://127.0.0.1:5000 --headless -u 100 -r 10 --run-time 2m --html locust_report.html
"""

import random
from locust import HttpUser, task, between, events


class StudentUser(HttpUser):
    """Simulates a concurrent Grade 3 student using SciencePlay."""
    wait_time = between(1, 3)

    def on_start(self):
        """Simulate student login or session initialization."""
        self.client.headers.update({
            "User-Agent": "LocustLoadTest-StudentClient/1.0",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        })

    @task(3)
    def view_student_dashboard(self):
        """Simulate loading the student dashboard and gamification stats."""
        self.client.get("/student/dashboard", name="[Student] View Dashboard")

    @task(4)
    def view_activities_playground(self):
        """Simulate visiting the Science Playground to pick an arcade game."""
        self.client.get("/student/activities", name="[Student] View Activities / Playground")

    @task(2)
    def view_lessons_hub(self):
        """Simulate browsing available interactive science lessons."""
        self.client.get("/student/lessons", name="[Student] View Lessons Hub")

    @task(3)
    def play_claw_machine_game(self):
        """Simulate loading the Living vs Non-Living Claw Machine arcade game."""
        self.client.get("/student/claw_machine", name="[Game] Claw Machine (Living vs Non-Living)")

    @task(3)
    def play_metal_clue_detective(self):
        """Simulate loading Properties of Metals - Metal Clue Detective."""
        self.client.get("/student/materials_game", name="[Game] Metal Clue Detective")

    @task(3)
    def play_recycling_game(self):
        """Simulate loading Recycling - EcoSwipe Sorter."""
        self.client.get("/student/recycling_game", name="[Game] EcoSwipe Recycling Sorter")

    @task(2)
    def play_build_a_plant(self):
        """Simulate loading Plant Parts - Build a Plant."""
        self.client.get("/student/build_a_plant", name="[Game] Build a Plant")

    @task(2)
    def play_find_the_part(self):
        """Simulate loading Animal Body Parts - Find the Part."""
        self.client.get("/student/find_the_part", name="[Game] Find the Part")

    @task(4)
    def send_online_heartbeat(self):
        """Simulate periodic 30s background online tracker heartbeat."""
        self.client.post("/heartbeat", json={"status": "online"}, name="[Realtime] Heartbeat Ping")

    @task(1)
    def view_leaderboard_and_badges(self):
        """Simulate viewing class leaderboard and unlocked achievements."""
        self.client.get("/student/leaderboard", name="[Student] View Leaderboard")
        self.client.get("/student/badges", name="[Student] View Badges")


class TeacherAdminUser(HttpUser):
    """Simulates a teacher/admin monitoring student progress and struggles."""
    wait_time = between(2, 5)

    @task(3)
    def view_teacher_dashboard(self):
        self.client.get("/teacher/dashboard", name="[Teacher] View Dashboard")

    @task(2)
    def view_struggling_students_breakdown(self):
        """Simulate checking most missed questions and struggle logs."""
        self.client.get("/teacher/analytics", name="[Teacher] View Analytics & Struggles")

    @task(1)
    def check_health(self):
        self.client.get("/healthz", name="[System] Health Check")


class PublicVisitor(HttpUser):
    """Simulates landing page traffic or public verification checks."""
    wait_time = between(2, 6)

    @task(3)
    def visit_homepage(self):
        self.client.get("/", name="[Public] Home / Landing")

    @task(2)
    def visit_login(self):
        self.client.get("/login", name="[Public] Login Page")

    @task(1)
    def verify_loaderio(self):
        self.client.get("/loaderio-f564c7a48db7d8614ab5b73cb7e3d37a.txt", name="[System] Loader.io Token")
