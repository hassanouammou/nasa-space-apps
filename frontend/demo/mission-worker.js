/* Runs the same Python services as FastAPI inside the standalone demo. */
importScripts('/demo/runtime/pyodide.js');

const runtime = (async () => {
  const py = await loadPyodide({ indexURL: '/demo/runtime/' });
  const source = await fetch('/demo/engine.zip');
  if (!source.ok) throw new Error('The mission engine archive failed to load.');
  py.unpackArchive(await source.arrayBuffer(), 'zip', {extractDir: '/'});
  py.runPython(`
import json
import sys
sys.path.insert(0, "/")
from backend.api.dispatch import dispatch, missions

def restore_session(raw):
    data = json.loads(raw)
    if data and data.get("schema") == 1:
        missions.restore(data["key"], data["state"])

def run_request(raw):
    request = json.loads(raw)
    status, data = dispatch(request["method"], request["path"], request.get("body"))
    result = {"status": status, "data": data}
    if status < 300 and request["method"] == "POST" and request["path"].startswith("/missions"):
        key = data["id"]
        result["snapshot"] = {"schema": 1, "key": key, "state": missions.snapshot(key)}
    return json.dumps(result)
`);
  return py;
})();

let queue = Promise.resolve();
self.onmessage = ({data}) => {
  queue = queue.then(async () => {
    const py = await runtime;
    if (!data.id) {
      if (data.snapshot) {
        const restore = py.globals.get('restore_session');
        try { restore(data.snapshot); }
        catch (error) { console.warn('The previous flight snapshot is unreadable.', error); }
        finally { restore.destroy(); }
      }
      return;
    }
    const run = py.globals.get('run_request');
    try {
      self.postMessage({id: data.id, ...JSON.parse(run(JSON.stringify(data)))});
    } finally {
      run.destroy();
    }
  }).catch(error => {
    if (data.id) self.postMessage({id: data.id, error: 'The demo engine could not complete the request. Refresh the tab and try again.'});
    console.error(error);
  });
};
