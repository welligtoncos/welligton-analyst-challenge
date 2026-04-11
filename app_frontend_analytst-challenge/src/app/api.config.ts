/**
 * Com `ng serve`, o proxy (proxy.conf.json) encaminha `/api/*` → FastAPI na 8000.
 * O browser só vê `localhost:4200` → não há preflight CORS cross-origin.
 * Ex.: POST `/api/auth/login` → `http://127.0.0.1:8000/auth/login`
 */
export const API_BASE_URL = '/api';
