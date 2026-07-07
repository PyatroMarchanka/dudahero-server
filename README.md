# dudahero-server

**Overview**
- **What:** Backend for Duda Hero (Express + TypeScript).

**Prerequisites**
- **Docker:** Install Docker Desktop (includes `docker compose`).

**Start services (with local Mongo)**
- **Command:** Use the local overlay to start `redis`, `mongo`, and the server together:

```bash
docker compose -f compose.yml -f compose.local.yml up --build
```

- **Detached:**

```bash
docker compose -f compose.yml -f compose.local.yml up -d --build
```

**Start services (use remote Mongo / default)**
- **Command:** Start services using the default [compose.yml](compose.yml) (uses MONGO_DB_URL from [.env](.env)):

```bash
docker compose up --build
```

**Environment**
- **File:** The project reads environment variables from [.env](.env). Key variables include `BACKEND_HOST`, `BACKEND_PORT`, and `MONGO_DB_URL`.

**Access & Logs**
- **Backend URL:** Based on your `.env` (example: `http://127.0.0.1:4000`).
- **View logs:**

```bash
docker compose logs -f dudahero_server
```

**Connect with MongoDB Compass**
- **URI:** `mongodb://localhost:27017`
- **Notes:** The local Mongo started by [compose.local.yml](compose.local.yml) exposes port `27017` and runs without authentication by default.

**Stop and remove containers & volumes**

```bash
docker compose -f compose.yml -f compose.local.yml down -v
```

**Troubleshooting**
- **Container health & logs:**

```bash
docker compose ps
docker compose logs mongo --tail=200
docker inspect --format='{{json .State.Health}}' dudahero_mongo
```

If a container is `unhealthy`, check the logs above and ensure ports/volumes are not in use by other processes.

---
