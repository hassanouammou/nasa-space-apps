import type {Answer, Artifact, Mission, Scenario} from './types';

type DemoRequest = {method: string; path: string; body?: object};
type DemoResponse = {status:number; data:unknown; snapshot?:unknown};

export class ApiError extends Error {
  constructor(public status:number, detail:string) { super(detail); }
}

let worker: Worker | undefined;
let sequence = 0;
const pending = new Map<number, {resolve:(response:DemoResponse)=>void; reject:(error:Error)=>void}>();
function demoRequest(request:DemoRequest) {
  if (!worker) {
    const snapshot = sessionStorage.getItem('luna-demo-state');
    worker = new Worker('/demo/mission-worker.js');
    worker.onmessage = ({data}) => {
      const operation = pending.get(data.id);
      if (!operation) return;
      pending.delete(data.id);
      if (data.error) {
        operation.reject(new Error(data.error));
        return;
      }
      if (data.snapshot) sessionStorage.setItem('luna-demo-state', JSON.stringify(data.snapshot));
      operation.resolve(data as DemoResponse);
    };
    worker.onerror = () => {
      for (const operation of pending.values()) operation.reject(new Error('The demo runtime failed to load. Try refreshing this tab.'));
      pending.clear();
      worker?.terminate();
      worker = undefined;
    };
    worker.postMessage({snapshot});
  }
  return new Promise<DemoResponse>((resolve, reject) => {
    const id = ++sequence;
    pending.set(id, {resolve, reject});
    worker?.postMessage({...request,id});
  });
}
async function request<T>(path:string, body?:object):Promise<T> {
  const method = body ? 'POST' : 'GET';
  let response:DemoResponse;
  if (import.meta.env.VITE_PORTABLE_DEMO === '1') {
    response = await demoRequest({method,path,body});
  } else {
    const result = await fetch('/api'+path, {
      method,
      headers: body ? {'Content-Type':'application/json'} : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    response = {status:result.status,data:await result.json().catch(() => null)};
  }
  if (response.status >= 400) {
    const error = response.data as {detail?: unknown} | null;
    throw new ApiError(response.status, typeof error?.detail === 'string' ? error.detail : 'Mission services are unavailable. Try again.');
  }
  return response.data as T;
}
export const api = {
  scenario: () => request<Scenario>('/scenario'),
  create: () => request<Mission>('/missions', {}),
  mission: (id:string) => request<Mission>('/missions/'+id),
  choose: (state:Mission, choice:string) => request<Mission>('/missions/'+state.id+'/choice', {choice,revision:state.revision}),
  catalogue: () => request<Artifact[]>('/discovery'),
  ask: (question:string, object_id?:string) => request<Answer>('/assistant',{question,object_id}),
};
