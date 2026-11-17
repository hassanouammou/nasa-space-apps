import unittest

from backend.engine.simulation_engine import MissionError, SCENARIO, SimulationEngine


class MissionTests(unittest.TestCase):
    def setUp(self):
        self.engine = SimulationEngine()

    def fly(self, *choices):
        state = self.engine.new_mission()
        for choice in choices:
            state = self.engine.apply_choice(state, choice)
        return state

    def test_successful_mission(self):
        state = self.fly("start", "check", "valley", "scan", "rest", "two", "safer")
        self.assertEqual(state["result"], "Successful Mission")
        self.assertEqual(state["position"], "base")
        self.assertEqual(state["discoveries"], ["H01"])
        self.assertEqual(len(state["samples"]), 2)
        self.assertEqual(state["minute"], 345)
        self.assertEqual(len(state["telemetry"]), len(state["history"])+1)
        self.assertEqual(self.engine.summary(state)["score"], 100)

    def test_safe_early_return(self):
        state = self.fly("start", "check", "ridge", "scan", "early")
        self.assertEqual(state["result"], "Safe Early Return")
        self.assertEqual(state["position"], "base")
        self.assertEqual(len(state["samples"]), 0)
        self.assertEqual(self.engine.summary(state)["safety"], 50)

    def test_emergency_interruption(self):
        state = self.fly("start", "check", "ridge", "scan", "continue", "skip", "direct")
        self.assertEqual(state["result"], "Emergency / Mission Interrupted")
        self.assertNotEqual(state["position"], "base")
        self.assertTrue(state["emergency"])

    def test_critical_state_blocks_two_sample_collection(self):
        state = self.fly("start", "check", "ridge", "scan", "continue")
        self.assertEqual(state["health"]["level"], "CRITICAL")
        options = {option["id"]: option for option in self.engine.view(state)["current"]["choices"]}
        self.assertEqual(options["two"]["disabled_reason"], "Current telemetry is critical.")
        with self.assertRaises(MissionError):
            self.engine.apply_choice(state, "two")

    def test_invalid_choice_is_rejected(self):
        state = self.engine.new_mission()
        with self.assertRaises(MissionError):
            self.engine.apply_choice(state, "two")
        self.assertEqual(state["event"], "E00")

    def test_low_resource_blocks_sample_collection(self):
        state = self.fly("start", "check", "valley", "scan", "rest")
        state["values"]["oxygen"] = 34
        options = {option["id"]: option for option in self.engine.view(state)["current"]["choices"]}
        self.assertIsNotNone(options["two"]["disabled_reason"])
        self.assertIsNone(options["one"]["disabled_reason"])

    def test_return_checks_all_reserves_time_and_physiology(self):
        state = self.fly("start", "check", "valley", "scan", "rest", "skip")
        state["values"].update(oxygen=11, battery=11, water=12, suit=30, hr=126)
        state["minute"] = SCENARIO["duration"]-10
        direct = self.engine.view(state)["current"]["choices"][0]
        self.assertEqual(len(direct["return_warnings"]), 6)
        result = self.engine.apply_choice(state, "direct")
        self.assertEqual(result["emergency"], direct["return_warnings"])

    def test_preview_includes_only_effects_that_will_be_applied(self):
        state = self.fly("start", "check", "ridge", "scan", "continue", "skip")
        option = self.engine.view(state)["current"]["choices"][0]
        next_state = self.engine.apply_choice(state, option["id"])
        self.assertEqual(option["effects"]["fatigue"], 2)
        for key, effect in option["effects"].items():
            delta = next_state["minute"]-state["minute"] if key == "time" else next_state["values"][key]-state["values"][key]
            self.assertAlmostEqual(effect, delta)
