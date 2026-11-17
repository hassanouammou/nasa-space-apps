from copy import deepcopy
from threading import RLock
from uuid import uuid4
from ..engine.simulation_engine import SCENARIO, SimulationEngine, MissionError


class MissionService:
    def __init__(self):
        self.engine = SimulationEngine()
        self._sessions = {}
        self._lock = RLock()

    def create(self):
        with self._lock:
            key = uuid4().hex
            self._sessions[key] = self.engine.new_mission()
            return self._view(key, self._sessions[key])

    def _view(self, key, state):
        return {"id": key, "mission": SCENARIO["id"], **self.engine.view(state)}

    def get(self, key):
        with self._lock:
            return self._view(key, self._sessions[key])

    def choose(self, key, choice, revision):
        with self._lock:
            state = self._sessions[key]
            if revision != state["revision"]:
                raise MissionError("Mission has changed. Reload the latest telemetry.")
            self._sessions[key] = self.engine.apply_choice(state, choice)
            return self._view(key, self._sessions[key])

    def snapshot(self, key):
        with self._lock:
            return deepcopy(self._sessions[key])

    def restore(self, key, state):
        # Portable demo only. REST sessions are never restored from client data.
        self.engine.view(state)
        with self._lock:
            self._sessions[key] = deepcopy(state)
