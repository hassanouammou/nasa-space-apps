from pathlib import Path

from fastapi import FastAPI, HTTPException
from fastapi.responses import FileResponse, JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field

from .api.dispatch import dispatch

app = FastAPI(title="Junior Astronaut · LUNA-01", version="1.0.0")


class ChoiceRequest(BaseModel):
    choice: str = Field(min_length=1, max_length=40)
    revision: int = Field(ge=0, strict=True)


class AssistantRequest(BaseModel):
    question: str = Field(min_length=1, max_length=500)
    object_id: str | None = Field(default=None, pattern="^H0[1-3]$")


def respond(method, path, body=None):
    status, data = dispatch(method, path, body)
    return JSONResponse(data, status_code=status)


@app.get("/api/scenario")
def scenario():
    return respond("GET", "/scenario")


@app.post("/api/missions", status_code=201)
def create_mission():
    return respond("POST", "/missions")


@app.get("/api/missions/{mission_id}")
def get_mission(mission_id: str):
    return respond("GET", f"/missions/{mission_id}")


@app.post("/api/missions/{mission_id}/choice")
def choose(mission_id: str, payload: ChoiceRequest):
    return respond("POST", f"/missions/{mission_id}/choice", payload.model_dump())


@app.get("/api/missions/{mission_id}/health")
def get_health(mission_id: str):
    return respond("GET", f"/missions/{mission_id}/health")


@app.get("/api/discovery")
def catalogue():
    return respond("GET", "/discovery")


@app.get("/api/discovery/{object_id}")
def discovery(object_id: str):
    return respond("GET", f"/discovery/{object_id}")


@app.post("/api/assistant")
def assistant(payload: AssistantRequest):
    return respond("POST", "/assistant", payload.model_dump())


dist = Path(__file__).resolve().parents[1] / "frontend" / "dist"
if dist.is_dir():
    app.mount("/assets", StaticFiles(directory=dist / "assets"))
    app.mount("/images", StaticFiles(directory=dist / "images"))

    @app.get("/{path:path}", include_in_schema=False)
    def frontend(path: str):
        if path.startswith("api/"):
            raise HTTPException(404, "Unknown API endpoint")
        return FileResponse(dist / "index.html")
