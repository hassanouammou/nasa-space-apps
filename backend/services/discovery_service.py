import json
from pathlib import Path

DATA = Path(__file__).resolve().parents[1] / "data"
OBJECTS = json.loads((DATA / "historical_objects.json").read_text(encoding="utf-8"))
CATALOGUE = {entry["id"]: entry for entry in OBJECTS}
