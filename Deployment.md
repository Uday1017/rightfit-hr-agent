# RightFit — Deployment Guide

This document covers the complete production deployment of RightFit on Railway, using MongoDB Atlas, Qdrant Cloud, and Redis Cloud as managed services.

---

## Architecture Overview

```
GitHub (source code)
        ↓
Railway CI/CD (auto-deploys on every push to main)
        ↓
┌─────────────────────────────────────────┐
│  Railway Project: zonal-intuition       │
│                                         │
│  ┌─────────────┐   ┌─────────────────┐  │
│  │  Backend    │   │    Frontend     │  │
│  │  Node.js    │   │  Nginx + React  │  │
│  │  Port 5001  │   │    Port 80      │  │
│  └──────┬──────┘   └────────┬────────┘  │
│         │                   │           │
│         │   /api/* proxy    │           │
│         └───────────────────┘           │
└─────────────────────────────────────────┘
        ↓                ↓              ↓
MongoDB Atlas      Qdrant Cloud    Redis Cloud
(sessions, users)  (vectors)       (job queue, cache)
```

---

## Live URLs

| Service | URL |
|---|---|
| Frontend | https://your-frontend.up.railway.app |
| Backend API | https://rightfit-hr-agent-production.up.railway.app |
| Health Check | https://rightfit-hr-agent-production.up.railway.app/api/health |

---

## Managed Cloud Services

### MongoDB Atlas
- **Provider:** MongoDB Atlas (Free M0 tier)
- **Project:** RightFit
- **Cluster:** rightfit-prod
- **Region:** AWS ap-south-2 (Hyderabad)
- **Database:** rightfit
- **Collections:** sessions, users
- **Network Access:** 0.0.0.0/0 (all IPs allowed)
- **Dashboard:** https://cloud.mongodb.com

### Qdrant Cloud
- **Provider:** Qdrant Cloud (Free tier)
- **Cluster:** rightfit-prod
- **Region:** AWS us-east-1
- **Collection:** resumes (created automatically on first upload)
- **Dashboard:** https://cloud.qdrant.io

### Redis Cloud
- **Provider:** Redis Cloud (Free tier — 30MB)
- **Database:** rightfit-prod
- **Database ID:** 14458178
- **Region:** AWS us-east-1
- **Used for:** BullMQ job queue, content hash dedup cache, circuit breaker state
- **Dashboard:** https://app.redislabs.com

---

## Railway Deployment

### Project Structure on Railway

```
Railway Project (zonal-intuition)
├── Service 1: rightfit-hr-agent (backend)
│   ├── Builder: Dockerfile
│   ├── Dockerfile path: /backend/Dockerfile
│   ├── Root directory: backend
│   ├── Port: 5001
│   └── Region: US West (sfo)
└── Service 2: frontend (frontend)
    ├── Builder: Dockerfile
    ├── Dockerfile path: /frontend/Dockerfile
    ├── Root directory: frontend
    ├── Port: 80
    └── Region: US West (sfo)
```

### Backend Environment Variables

Set these in Railway → backend service → Variables:

```
PORT=5001
NODE_ENV=production
MONGODB_URI=mongodb+srv://<user>:<password>@rightfit-prod.me4hsyv.mongodb.net/rightfit?appName=rightfit-prod
QDRANT_URL=https://c2832d6c-7098-471a-8367-cd884909b06d.us-east-1-1.aws.cloud.qdrant.io
QDRANT_API_KEY=<your-qdrant-api-key>
REDIS_HOST=joyful-placid-pen-83092.db.redis.io
REDIS_PORT=10776
REDIS_PASSWORD=<your-redis-password>
GEMINI_API_KEY=<your-gemini-api-key>
JWT_SECRET=<your-strong-jwt-secret>
EMAIL_USER=<your-gmail>
EMAIL_PASS=<your-gmail-app-password>
COMPANY_NAME=RightFit
LANGFUSE_PUBLIC_KEY=<optional>
LANGFUSE_SECRET_KEY=<optional>
LANGFUSE_HOST=<optional>
FRONTEND_URL=https://<your-frontend>.up.railway.app
```

### Frontend Environment Variables

None required. The frontend is a static React app served by Nginx.

---

## How Auto-Deploy Works

Every push to the `main` branch on GitHub triggers an automatic redeploy on Railway:

```
git push origin main
        ↓
Railway detects new commit
        ↓
Builds Docker image from /backend/Dockerfile or /frontend/Dockerfile
        ↓
Replaces running container with new one (zero downtime)
        ↓
New version is live within 2-3 minutes
```

No manual deploy steps needed after initial setup.

---

## Local Development

For local development, all services run on your machine:

### Prerequisites
- Node.js 18+
- MongoDB running locally
- Redis running locally
- Qdrant running locally (via Docker)
- Gemini API key

### Start local services

```bash
# MongoDB
mkdir -p ~/data/db
mongod --dbpath ~/data/db

# Redis
brew services start redis

# Qdrant
docker run -p 6333:6333 qdrant/qdrant
```

### Backend .env for local development

```
PORT=5001
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/rightfit
QDRANT_URL=http://localhost:6333
REDIS_HOST=localhost
REDIS_PORT=6379
GEMINI_API_KEY=your_key_here
JWT_SECRET=local_dev_secret
EMAIL_USER=your_gmail
EMAIL_PASS=your_app_password
COMPANY_NAME=RightFit
```

### Run

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

Open http://localhost:5173

---

## Docker (Full Stack Local)

Run the entire stack with one command using Docker Compose:

```bash
# Create root .env
echo "GEMINI_API_KEY=your_key" > .env
echo "JWT_SECRET=your_secret" >> .env
echo "EMAIL_USER=your_email" >> .env
echo "EMAIL_PASS=your_password" >> .env

# Start everything
docker compose up --build
```

Open http://localhost

Services started by Docker Compose:
- **mongo** — MongoDB on internal network
- **qdrant** — Qdrant on internal network
- **redis** — Redis on internal network
- **backend** — Node.js API on port 5001
- **frontend** — Nginx + React on port 80

MongoDB and Qdrant have no host ports exposed — they are only reachable from within the Docker network by the backend service. This mirrors production security practices.

---

## Updating the Deployment

### Deploy a new version

```bash
# Make your changes locally
git add .
git commit -m "feat: your change description"
git push origin main
```

Railway automatically picks up the push and redeploys within 2-3 minutes.

### Update environment variables

1. Go to Railway → your service → Variables
2. Add or update the variable
3. Railway automatically restarts the service with the new value

### Roll back a deployment

1. Go to Railway → your service → Deployments tab
2. Find the last working deployment
3. Click the three dots menu → **Redeploy**

---

## Monitoring

### Health Check

```bash
curl https://rightfit-hr-agent-production.up.railway.app/api/health
# Returns: {"status":"ok","model":"gemini-2.5-flash"}
```

### Railway Logs

View real-time logs in Railway → service → **Deploy Logs** tab.

Or via CLI:
```bash
railway logs
```

### LLM Observability — Langfuse

Every Gemini API call is traced in Langfuse when keys are configured:
- Prompt input and output
- Token count and estimated cost
- Latency per call
- Trace by operation type: `resume.upload`, `chat.agent`, `interview.generate`

To enable: add `LANGFUSE_PUBLIC_KEY`, `LANGFUSE_SECRET_KEY`, and `LANGFUSE_HOST` to Railway variables.

### MongoDB Atlas Monitoring

Go to MongoDB Atlas → your cluster → **Metrics** tab to view:
- Active connections
- Query performance
- Storage usage

### Redis Cloud Monitoring

Go to Redis Cloud → your database → **Metrics** tab to view:
- Memory usage
- Commands per second
- Connected clients

---

## Troubleshooting

### Backend crashes on startup

Check Railway deploy logs for the error. Most common causes:

**MongoDB connection failed:**
- Verify `MONGODB_URI` is correct with password replaced
- Check MongoDB Atlas → Network Access → `0.0.0.0/0` is in the list

**Redis connection failed (ENOTFOUND):**
- Check `REDIS_HOST` has no trailing newline or space
- Verify `REDIS_PASSWORD` is correct

**Qdrant connection warning:**
- `Failed to obtain server version` is normal for Qdrant Cloud — not an error

### Frontend shows blank page

- Check that `frontend/nginx.conf` proxy points to the correct backend Railway URL
- Verify the backend service is running and health check returns 200

### Emails not sending

- Verify `EMAIL_USER` and `EMAIL_PASS` are set correctly
- `EMAIL_PASS` must be a Gmail App Password, not your regular Gmail password
- Enable 2FA on Gmail first, then generate an App Password under Google Account → Security

### Resume processing stuck

- Check Redis Cloud is connected — BullMQ needs Redis for the job queue
- Check Railway logs for worker errors
- Verify Gemini API key has available quota

---

## Security Notes

- Never commit `.env` files to GitHub — all secrets are in Railway Variables
- MongoDB Atlas network access is set to `0.0.0.0/0` for Railway compatibility — restrict to Railway's IP range for stricter security
- JWT secret should be a random string of at least 32 characters
- Gmail App Password is used instead of your actual Gmail password
- Qdrant API key restricts access to your vector database

---

## Cost Summary

All services used are on free tiers:

| Service | Plan | Cost |
|---|---|---|
| Railway | Trial ($5 credit) | Free |
| MongoDB Atlas | M0 Free (512MB) | Free |
| Qdrant Cloud | Free tier (1GB) | Free |
| Redis Cloud | Free (30MB) | Free |
| Gemini API | Free tier | Free |

Total monthly cost: **$0**