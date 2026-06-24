# MediDesk — Production Deployment Guide

This guide walks you through deploying MediDesk to a production environment with Docker Compose or Kubernetes.

---

## Prerequisites

| Tool | Minimum Version |
|------|----------------|
| Docker | 24.x |
| Docker Compose | v2.x |
| Node.js | 18.x LTS |
| PostgreSQL | 15.x |
| Redis | 7.x |
| Elasticsearch | 7.17.x |

---

## 1. Clone & Configure

```bash
git clone https://github.com/your-org/medidesk.git
cd medidesk
```

Copy and fill environment files:

```bash
cp apps/backend/.env.example apps/backend/.env
cp apps/frontend/.env.example apps/frontend/.env
```

**Critical backend `.env` settings for production:**

```env
NODE_ENV=production
DATABASE_URL=postgresql://user:password@db-host:5432/medidesk
JWT_SECRET=<generate with: openssl rand -base64 48>
AWS_ACCESS_KEY_ID=<your-key>
AWS_SECRET_ACCESS_KEY=<your-secret>
AWS_S3_BUCKET=medidesk-uploads
ELASTICSEARCH_NODE=http://es-host:9200
```

---

## 2. Launch Infrastructure with Docker Compose

Start all backing services (Postgres, Redis, Elasticsearch, Prometheus, Grafana):

```bash
docker-compose up -d
```

Verify all services are healthy:

```bash
docker-compose ps
```

---

## 3. Database Migration

Generate Prisma client and run migrations:

```bash
npm install
npm run prisma:generate
npx prisma migrate deploy
```

---

## 4. Build & Start Applications

```bash
# Build all workspaces
npm run build

# Start backend (port 4000)
node apps/backend/dist/src/main.js

# Start frontend (port 3000)
npm start --workspace=frontend
```

---

## 5. Running with Docker (Full Stack)

Build all Docker images:

```bash
docker build -f apps/backend/Dockerfile -t medidesk-backend:latest .
docker build -f apps/frontend/Dockerfile -t medidesk-frontend:latest .
```

Add frontend and backend services to `docker-compose.yml`:

```yaml
  backend:
    image: medidesk-backend:latest
    ports:
      - "4000:4000"
    env_file:
      - ./apps/backend/.env
    depends_on:
      - postgres
      - redis
    networks:
      - medidesk-network

  frontend:
    image: medidesk-frontend:latest
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_API_URL=https://api.medidesk.com
    networks:
      - medidesk-network
```

---

## 6. Observability

| Service | URL | Credentials |
|---------|-----|-------------|
| Prometheus | http://localhost:9090 | — |
| Grafana | http://localhost:3001 | admin / admin |
| Swagger | http://localhost:4000/api/docs | — |

### Grafana Setup

1. Open Grafana → **Add data source** → Select **Prometheus**
2. URL: `http://prometheus:9090`
3. Import dashboards for Node.js process metrics and custom MediDesk metrics

---

## 7. Security Checklist

- [ ] Rotate `JWT_SECRET` before deploying — minimum 48 random bytes
- [ ] Enable HTTPS with a reverse proxy (Nginx/Caddy/Traefik)
- [ ] Set `NODE_ENV=production` — disables stack traces in API errors
- [ ] Restrict Postgres and Redis to internal Docker network only
- [ ] Enable AWS S3 bucket policy (private ACL) for uploaded files
- [ ] Set `CORS` origin to exact frontend domain, not wildcard
- [ ] Enable rate limiting on `/auth/login` route (already configured in NestJS)
- [ ] Set up automated database backups (e.g., `pg_dump` cron)

---

## 8. CI/CD (GitHub Actions)

Push to `main` branch triggers the workflow in `.github/workflows/ci-cd.yml` which:
1. Runs `npm install`
2. Generates Prisma client
3. Executes full test suite
4. Builds all workspaces

To enable auto-deployment, add a **deploy** step with your target (e.g., AWS ECS, Railway, Render, or a VPS).

---

## 9. Health Checks

Backend health endpoint:
```
GET http://localhost:4000/health
```

Returns `200 OK` when all services are reachable.
