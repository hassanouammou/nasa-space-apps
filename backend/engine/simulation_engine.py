"""LUNA-01 simulation without dependencies on its transport or interface."""
from copy import deepcopy
import json
from pathlib import Path
from .health_monitor import HealthMonitor

SCENARIO = json.loads(Path(__file__).with_name("mission_scenario.json").read_text(encoding="utf-8"))
RESOURCES = ("oxygen", "battery", "water", "suit")
PERCENTAGES = (*RESOURCES, "fatigue", "spo2")


class MissionError(ValueError):
    pass


class SimulationEngine:
    def __init__(self):
        self.monitor = HealthMonitor()

    def new_mission(self):
        state = dict(event="E00", minute=0, values=SCENARIO["initial"].copy(), position="base",
                     route=None, discoveries=[], samples=[], history=[], telemetry=[], alerts=[], result=None,
                     emergency=[], revision=0)
        self._record(state)
        return state

    def _record(self, state):
        health = self.monitor.evaluate(state["values"])
        previous = state.get("health")
        state["health"] = health
        state["telemetry"].append({"minute": state["minute"], **state["values"]})
        if health["level"] != "NORMAL" and health != previous:
            state["alerts"].append({"minute": state["minute"], **health})

    def _project(self, state, choice):
        values = state["values"].copy()
        for key, delta in choice["effects"].items():
            if key == "time":
                continue
            updated = round(values[key] + delta, 1)
            values[key] = min(100, max(0, updated)) if key in PERCENTAGES else updated
        return values, state["minute"] + choice["effects"].get("time", 0)

    def _return_failures(self, values, minute):
        failures = [f"{key.capitalize()} below return reserve" for key, limit in SCENARIO["reserve"].items()
                    if values[key] < limit]
        if minute > SCENARIO["duration"]:
            failures.append("Mission time exceeded")
        if self.monitor.evaluate(values)["level"] == "CRITICAL":
            failures.append("Critical simulated telemetry after route")
        return failures

    def _blocked(self, state, choice, projected, minute):
        if not choice.get("samples"):
            return None
        if state["health"]["level"] == "CRITICAL":
            return "Current telemetry is critical."
        if all(self._return_failures(values, final_minute) for values, final_minute in (
                self._project({"values": projected, "minute": minute}, route)
                for route in SCENARIO["events"]["E07"]["choices"])):
            return "Collection would leave no viable return route."
        return None

    def view(self, state):
        event = SCENARIO["events"][state["event"]]
        choices = []
        for choice in event["choices"]:
            values, minute = self._project(state, choice)
            applied = {key: round(values[key]-state["values"][key], 1) for key in choice["effects"] if key != "time"}
            if minute != state["minute"]:
                applied["time"] = minute - state["minute"]
            choices.append({**choice, "effects": applied, "disabled_reason": self._blocked(state, choice, values, minute),
                            "return_warnings": self._return_failures(values, minute) if choice.get("return") else []})
        return {**deepcopy(state), "current": {"title": event["title"], "description": event["description"], "choices": choices},
                "remaining": max(0, SCENARIO["duration"] - state["minute"]), "objectives": self.objectives(state),
                "report": self.summary(state) if state["result"] else None}

    def apply_choice(self, state, choice_id):
        choice = next((item for item in SCENARIO["events"][state["event"]]["choices"] if item["id"] == choice_id), None)
        if choice is None:
            raise MissionError("This choice is unavailable for the current event.")
        values, minute = self._project(state, choice)
        blocked = self._blocked(state, choice, values, minute)
        if blocked:
            raise MissionError(blocked)

        updated = deepcopy(state)
        updated.update(values=values, minute=minute, event=choice["next"], revision=state["revision"]+1)
        updated["history"].append({"minute": minute, "event": state["event"], "choice": choice["label"]})
        if choice_id in ("ridge", "valley"):
            updated["route"] = choice_id
        if "discover" in choice:
            updated["discoveries"].append(choice["discover"])
        if choice.get("samples"):
            updated["samples"] = ["Basalt fragment", "Regolith sample"][:choice["samples"]]
        if choice.get("return"):
            failures = self._return_failures(values, minute)
            if failures:
                updated["emergency"] = failures
                updated["result"] = "Emergency / Mission Interrupted"
            else:
                updated["position"] = "base"
                updated["result"] = "Successful Mission" if len(updated["samples"]) == 2 else "Safe Early Return"
        elif minute > SCENARIO["duration"] or any(values[key] <= 0 for key in RESOURCES):
            updated.update(event="E08", result="Emergency / Mission Interrupted", emergency=["Mission clock or suit supply exhausted"])
        elif "position" in choice:
            updated["position"] = choice["position"]
        self._record(updated)
        return updated

    def objectives(self, state):
        return [
            {"label":"Prepare suit and equipment","complete":any(item["event"] == "E01" for item in state["history"])},
            {"label":"Explore the surface","complete":bool(state["route"])},
            {"label":"Record an Apollo discovery","complete":bool(state["discoveries"])},
            {"label":"Collect two science samples","complete":len(state["samples"]) == 2},
            {"label":"Check astronaut telemetry","complete":any(item["event"] == "E05" for item in state["history"])},
            {"label":"Preserve reserves and return safely","complete":state["result"] in ("Successful Mission", "Safe Early Return") and state["position"] == "base"},
        ]

    def summary(self, state):
        safe = state["result"] in ("Successful Mission", "Safe Early Return")
        safety = 50 if safe else 0
        exploration = 20 if state["discoveries"] else 0
        science = len(state["samples"])*15
        lesson = {
            "Successful Mission":"Your recovery and route decisions preserved enough reserve to complete the science objectives.",
            "Safe Early Return":"Protecting the crew and preserving return reserves earns full safety credit. Uncollected samples can wait for another traverse.",
            "Emergency / Mission Interrupted":"Review the first critical alert and the projected return warnings. Try recovery or an earlier return on the next traverse.",
        }[state["result"]]
        return {"score":safety+exploration+science, "safety":safety, "exploration":exploration, "science":science,
                "consumed":{key:SCENARIO["initial"][key]-state["values"][key] for key in RESOURCES},
                "elapsed":state["minute"], "lesson":lesson}
