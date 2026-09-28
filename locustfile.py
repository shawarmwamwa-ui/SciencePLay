"""
SciencePlay - Load and Concurrency Testing Suite (Locust)
Simulates exact real-world classroom ratios:
- 11 Student Users (Weight 11)
- 1 Teacher User (Weight 1)
- 1 Admin User (Weight 1)

Total: 13 users base (scales proportionally to 50 and 100 users).
"""

from locust import HttpUser, task, between


class StudentUser(HttpUser):
    """Simulates Grade 3 pupils navigating lessons, playing games, and submitting heartbeats."""
    weight = 11
    wait_time = between(2, 5)

    def on_start(self):
        self.client.headers.update({
            "User-Agent": "LocustStudentClient/1.0 (AbraES-Grade3)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        })

    @task(4)
    def view_student_dashboard(self):
        self.client.get("/student/dashboard", name="[Student] View Dashboard")

    @task(3)
    def view_activities_playground(self):
        self.client.get("/student/activities", name="[Student] View Activities")

    @task(2)
    def view_lessons_hub(self):
        self.client.get("/student/lessons", name="[Student] View Lessons Hub")

    @task(3)
    def play_claw_machine(self):
        self.client.get("/student/claw_machine", name="[Game] Claw Machine (Living/Non-Living)")

    @task(3)
    def play_recycling_game(self):
        self.client.get("/student/recycling_game", name="[Game] EcoSwipe Recycling Sorter")

    @task(2)
    def play_materials_game(self):
        self.client.get("/student/materials_game", name="[Game] Metal Clue Detective")

    @task(2)
    def play_build_a_plant(self):
        self.client.get("/student/build_a_plant", name="[Game] Build a Plant")

    @task(2)
    def play_find_the_part(self):
        self.client.get("/student/find_the_part", name="[Game] Animal Body Parts")

    @task(4)
    def send_online_heartbeat(self):
        with self.client.post("/api/heartbeat", json={"status": "online"}, name="[Realtime] Heartbeat Ping", catch_response=True) as res:
            if res.status_code in (200, 401, 302):
                res.success()

    @task(1)
    def view_leaderboard(self):
        self.client.get("/student/leaderboard", name="[Student] Leaderboard & Badges")


class TeacherUser(HttpUser):
    """Simulates an educator monitoring classroom analytics and lesson submissions."""
    weight = 1
    wait_time = between(2, 4)

    def on_start(self):
        self.client.headers.update({
            "User-Agent": "LocustTeacherClient/1.0 (AbraES-Educator)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        })

    @task(4)
    def view_teacher_dashboard(self):
        self.client.get("/teacher/dashboard", name="[Teacher] View Dashboard")

    @task(3)
    def view_class_analytics(self):
        self.client.get("/teacher/analytics", name="[Teacher] Class Analytics & Trends")

    @task(2)
    def view_teacher_lessons(self):
        self.client.get("/teacher/lessons", name="[Teacher] Lesson Management")

    @task(2)
    def view_teacher_students(self):
        self.client.get("/teacher/students", name="[Teacher] Student Roster & Scores")


class AdminUser(HttpUser):
    """Simulates a school administrator reviewing system health, users, and audit logs."""
    weight = 1
    wait_time = between(2, 5)

    def on_start(self):
        self.client.headers.update({
            "User-Agent": "LocustAdminClient/1.0 (AbraES-SysAdmin)",
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8"
        })

    @task(4)
    def view_admin_dashboard(self):
        self.client.get("/admin/dashboard", name="[Admin] View Dashboard")

    @task(3)
    def view_user_management(self):
        self.client.get("/admin/users", name="[Admin] User Management")

    @task(2)
    def view_compliance_logs(self):
        self.client.get("/admin/compliance", name="[Admin] Compliance & Audit Logs")

    @task(1)
    def check_system_health(self):
        self.client.get("/healthz", name="[System] Health Check")
