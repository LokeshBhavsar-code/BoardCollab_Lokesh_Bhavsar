# Frontend

React + Vite application. Frontend dependencies are declared in `package.json` and synchronized automatically when the Compose service starts.

From the repository root, start the frontend and its backend dependencies with:

```sh
docker compose up --build frontend
```

The app is available at `http://localhost:5173/` by default. For local development without Docker, run `npm install` and then `npm run dev` from this directory.
