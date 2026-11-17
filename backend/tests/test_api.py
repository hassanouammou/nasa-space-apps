import unittest

from fastapi.testclient import TestClient

from backend.main import app


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_complete_rest_flow(self):
        response = self.client.post("/api/missions")
        self.assertEqual(response.status_code, 201)
        state = response.json()
        path = "/api/missions/" + state["id"]
        for choice in ("start", "check", "valley", "scan", "rest", "two", "safer"):
            response = self.client.post(path + "/choice", json={"choice":choice, "revision":state["revision"]})
            self.assertEqual(response.status_code, 200, response.text)
            state = response.json()
        self.assertEqual(state["report"]["score"], 100)
        health = self.client.get(path + "/health").json()
        self.assertEqual(health["telemetry"], state["telemetry"])
        self.assertIn("Educational simulation", health["disclaimer"])

    def test_stale_revision_is_rejected_and_sessions_are_isolated(self):
        first = self.client.post("/api/missions").json()
        second = self.client.post("/api/missions").json()
        path = "/api/missions/" + first["id"]
        self.assertEqual(self.client.post(path + "/choice", json={"choice":"start","revision":0}).status_code, 200)
        self.assertEqual(self.client.post(path + "/choice", json={"choice":"start","revision":0}).status_code, 409)
        self.assertEqual(self.client.get("/api/missions/" + second["id"]).json()["event"], "E00")

    def test_historical_questions_return_relevant_sources(self):
        questions = {
            "What is the Lunar Roving Vehicle?": "battery-powered",
            "Why did Apollo astronauts leave equipment on the Moon?": "two-stage",
            "What was the purpose of ALSEP?": "heat flow",
            "How did Apollo 17 explore Taurus-Littrow?": "30.5 km",
            "What can we learn from these historical artifacts?": "Apollo hardware and tracks",
        }
        for question, fragment in questions.items():
            with self.subTest(question=question):
                response = self.client.post("/api/assistant", json={"question":question})
                self.assertEqual(response.status_code, 200)
                self.assertIn(fragment, response.json()["answer"])
                self.assertTrue(response.json()["sources"])

    def test_assistant_can_use_an_artifact_and_acknowledge_missing_sources(self):
        context = self.client.post("/api/assistant", json={"question":"What is its purpose?", "object_id":"H03"}).json()
        self.assertIn("heat flow", context["answer"])
        out_of_scope = self.client.post("/api/assistant", json={"question":"How do I bake bread?"}).json()
        self.assertEqual(out_of_scope["sources"], [])

    def test_request_validation_and_missing_mission(self):
        self.assertEqual(self.client.post("/api/assistant", json={"question":"   "}).status_code, 422)
        self.assertEqual(self.client.get("/api/missions/unknown").status_code, 404)
        self.assertEqual(len(self.client.get("/api/discovery").json()), 3)
