# BoardCollab — Real-Time Collaborative Whiteboard

A real-time collaborative whiteboard application that lets multiple users draw, collaborate, and share ideas on a common canvas.

- GitHub: https://github.com/LokeshBhavsar-code/BoardCollab_Lokesh_Bhavsar
- Live Frontend: https://boardcollab-frontend.onrender.com
- Live Backend: https://boardcollab-backend.onrender.com
- Health Check: https://boardcollab-backend.onrender.com/api/health

## Overview

BoardCollab is a collaborative whiteboard platform built for shared ideation, live editing, and room-based teamwork. It combines a React frontend with a Node.js backend, Socket.IO real-time communication, MongoDB persistence, and Docker-based local development.

## Features

- Real-time collaboration on a shared whiteboard
- JWT-based user authentication
- Collaborative room creation and membership
- Live user presence tracking
- Drawing tools and canvas interactions
- Undo and redo support
- Offline queueing and synchronization
- Export to JSON, PNG, and SVG
- Shape recognition using TensorFlow.js
- Redis integration for real-time system support
- Docker Compose setup for local development

## Tech Stack

| Category | Technologies |
| --- | --- |
| Frontend | React, Vite, Redux Toolkit, Konva |
| Backend | Node.js, Express.js |
| Database | MongoDB, Mongoose |
| Real-Time | Socket.IO |
| Cache / Shared State | Redis |
| Authentication | JWT, bcryptjs |
| ML / Recognition | TensorFlow.js |
| Containerization | Docker, Docker Compose |

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Git](https://git-scm.com/)

Docker must be running before you start the app.

## Getting Started

### 1) Clone the repository

```bash
git clone https://github.com/LokeshBhavsar-code/BoardCollab_Lokesh_Bhavsar.git
cd BoardCollab_Lokesh_Bhavsar
```

### 2) Configure environment variables

Create your local environment file from the example:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**macOS / Linux:**

```bash
cp .env.example .env
```

Then review `.env` and update any required local values.

### 3) Start the app with Docker

From the project root, run:

```bash
docker compose up --build
```

This builds the app and starts the frontend, backend, MongoDB, and Redis services.

### 4) Open the application

Once the containers are running:

- Frontend: http://localhost:5173
- Backend: http://localhost:5000
- Health check: http://localhost:5000/api/health

### 5) Run backend tests

Open a second terminal in the project root and run:

```bash
docker compose exec backend npm test
```

## Demo Accounts

The app includes seed users for local development and testing.

| Username | Email | Password |
| --- | --- | --- |
| `aarav_sharma` | `aarav.sharma@boardcollab.dev` | `Aarav@2024` |
| `priya_patel` | `priya.patel@boardcollab.dev` | `Priya#4521` |
| `rohan_mehta` | `rohan.mehta@boardcollab.dev` | `Rohan!8899` |
| `ananya_iyer` | `ananya.iyer@boardcollab.dev` | `Ananya@3311` |
| `vikram_nair` | `vikram.nair@boardcollab.dev` | `Vikram#7765` |

> These are demo credentials intended for local testing only. Do not use them in production.

## Docker Commands

Run these from the project root:

### Start the app

```bash
docker compose up
```

### Rebuild and start

```bash
docker compose up --build
```

### Run in the background

```bash
docker compose up -d
```

### View logs

```bash
docker compose logs -f
```

### View backend logs

```bash
docker compose logs -f backend
```

### Stop the app

```bash
docker compose down
```

### Stop and remove volumes

```bash
docker compose down --volumes
```

> This removes local MongoDB and Redis data, so only use it when you want a full reset.

## Project Structure

```text
BoardCollab_Lokesh_Bhavsar/
├── backend/
│   ├── src/
│   ├── tests/
│   ├── Dockerfile
│   └── package.json
├── frontend/
│   ├── src/
│   ├── public/
│   ├── Dockerfile
│   └── package.json
├── docs/
├── .env.example
├── docker-compose.yml
├── docker-compose.prod.yml
├── package.json
├── README.md
└── .gitignore
```

## API Overview

The backend exposes REST API routes under `/api` and also supports real-time collaboration over Socket.IO.

Common endpoints include:

- `/api/health`
- `/api/auth/register`
- `/api/auth/login`
- `/api/auth/me`
- `/api/rooms`
- `/api/rooms/:id`
- `/api/rooms/:id/export`
- `/api/rooms/:id/sync`

See the documentation in the `docs/` folder for the detailed API contract and event model.

## Deployment

The project is currently deployed on Render.

| Component | URL |
| --- | --- |
| Frontend | https://boardcollab-frontend.onrender.com |
| Backend | https://boardcollab-backend.onrender.com |
| API Health Check | https://boardcollab-backend.onrender.com/api/health |

## Security Notes

- Keep secrets and environment variables out of source control.
- Use strong JWT secrets in production.
- Do not use demo credentials in a live environment.
- Use HTTPS for production deployment.
- Restrict database access to trusted networks.

## Author

**Lokesh Bhavsar**

- GitHub: https://github.com/LokeshBhavsar-code
- Project Repo: https://github.com/LokeshBhavsar-code/BoardCollab_Lokesh_Bhavsar

## License

This project does not currently declare a license in the repository.

See the repository for license information.