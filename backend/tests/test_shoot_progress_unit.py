import unittest
from shoot_progress import refresh_shoot_progress


class ShootProgressTests(unittest.TestCase):
    def shoot(self, statuses, status="done"):
        return {"status": status, "progress": 1, "frames": [{"status": s} for s in statuses]}

    def test_submitted_jobs_are_not_completed_shoots(self):
        shoot = self.shoot(["running", "running"])
        refresh_shoot_progress(shoot, [{"status": "running"}, {"status": "running"}])
        self.assertEqual((shoot["status"], shoot["progress"], shoot["rendered_count"]), ("running", 0, 0))

    def test_partial_outputs_keep_shoot_running(self):
        shoot = self.shoot(["running", "running"])
        refresh_shoot_progress(shoot, [{"status": "done", "output_files": ["one.png"]}, {"status": "running"}])
        self.assertEqual((shoot["status"], shoot["progress"], shoot["rendered_count"]), ("running", .5, 1))
        self.assertEqual(shoot["frames"][0]["status"], "done")

    def test_all_outputs_finish_and_enhanced_outputs_count(self):
        shoot = self.shoot(["running", "running"])
        refresh_shoot_progress(shoot, [{"output_files": ["one.png"]}, {"output_variants": {"enhanced": ["two.png"]}}])
        self.assertEqual((shoot["status"], shoot["progress"], shoot["rendered_count"]), ("done", 1, 2))

    def test_failure_does_not_finish_other_active_frames(self):
        shoot = self.shoot(["failed", "running"], "failed")
        refresh_shoot_progress(shoot, [None, {"status": "running"}])
        self.assertEqual((shoot["status"], shoot["progress"]), ("running", .5))
        refresh_shoot_progress(shoot, [None, {"status": "done", "output_files": ["two.png"]}])
        self.assertEqual((shoot["status"], shoot["progress"]), ("failed", 1))

    def test_pending_and_missing_render_slots_are_not_done(self):
        shoot = self.shoot(["done", "pending"])
        refresh_shoot_progress(shoot, [None])
        self.assertEqual((shoot["status"], shoot["progress"]), ("running", 0))
        self.assertEqual(shoot["frames"][0]["status"], "pending")

    def test_initial_queue_remains_queued(self):
        shoot = self.shoot(["pending"], "queued")
        refresh_shoot_progress(shoot, [])
        self.assertEqual(shoot["status"], "queued")
