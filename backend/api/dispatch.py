"""Application requests shared by REST and the portable browser demo."""
from ..engine.health_monitor import DISCLAIMER
from ..engine.simulation_engine import MissionError, SCENARIO
from ..services.discovery_service import CATALOGUE, OBJECTS
from ..services.mission_service import MissionService
from ..services.rag_service import answer

missions = MissionService()


def dispatch(method, path, body=None):
    body = body or {}
    segments = path.strip("/").split("/")
    try:
        if method == "GET" and path == "/scenario":
            return 200, {key: value for key, value in SCENARIO.items() if key != "events"}
        if method == "GET" and path == "/discovery":
            return 200, OBJECTS
        if method == "GET" and len(segments) == 2 and segments[0] == "discovery":
            return 200, CATALOGUE[segments[1]]
        if method == "POST" and path == "/assistant":
            question = body.get("question")
            if not isinstance(question, str) or not 1 <= len(question.strip()) <= 500:
                return 422, {"detail": "Enter a question between 1 and 500 characters."}
            return 200, answer(question, body.get("object_id"))
        if method == "POST" and path == "/missions":
            return 201, missions.create()
        if segments[0] == "missions" and len(segments) in (2, 3):
            mission_id = segments[1]
            if method == "GET" and len(segments) == 2:
                return 200, missions.get(mission_id)
            if method == "GET" and segments[2:] == ["health"]:
                mission = missions.get(mission_id)
                return 200, {"health": mission["health"], "telemetry": mission["telemetry"], "alerts": mission["alerts"], "disclaimer": DISCLAIMER}
            if method == "POST" and segments[2:] == ["choice"]:
                choice = body.get("choice")
                revision = body.get("revision")
                if not isinstance(choice, str) or type(revision) is not int:
                    return 422, {"detail": "A choice and revision are required."}
                return 200, missions.choose(mission_id, choice, revision)
    except KeyError:
        return 404, {"detail": "Mission or archive entry not found."}
    except MissionError as error:
        return 409, {"detail": str(error)}
    return 404, {"detail": "Unknown endpoint."}
