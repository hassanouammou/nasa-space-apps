"""Create the static demo payload after the frontend production build."""
from pathlib import Path
from shutil import copy2
from zipfile import ZIP_DEFLATED, ZipFile

root = Path(__file__).resolve().parents[1]
frontend = root / "frontend"
target = root / "dist"
demo = target / "demo"
runtime = demo / "runtime"
runtime.mkdir(parents=True, exist_ok=True)
copy2(frontend / "demo" / "mission-worker.js", demo)
for name in ("pyodide.js", "pyodide.asm.js", "pyodide.asm.wasm", "pyodide-lock.json", "python_stdlib.zip"):
    copy2(frontend / "node_modules" / "pyodide" / name, runtime)

with ZipFile(demo / "engine.zip", "w", ZIP_DEFLATED) as archive:
    for directory in ("engine", "services", "api", "data"):
        for path in sorted((root / "backend" / directory).glob("*")):
            if path.suffix in (".py", ".json"):
                archive.write(path, path.relative_to(root))
