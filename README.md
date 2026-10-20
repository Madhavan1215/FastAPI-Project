# Snapshare

A media-sharing app: sign up, upload photos and videos, browse a shared feed, and delete your own posts.

- **Backend:** FastAPI, SQLAlchemy (async, SQLite), fastapi-users (JWT auth), ImageKit (file storage/CDN)
- **Frontend:** React + Vite, Framer Motion

## Setup

Create a `.env` file in the project root:

```
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
JWT_SECRET=a_long_random_string   # python -c "import secrets; print(secrets.token_urlsafe(64))"
```

## Run

Backend (http://localhost:8000, API docs at http://localhost:8000/docs):

```
uv sync
uv run python main.py
```

Frontend (http://localhost:5173):

```
cd frontend
npm install
npm run dev
```

The frontend expects the API at `http://localhost:8000`. To change it, set `VITE_API_URL` in `frontend/.env`.

## API

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | – | Create an account (JSON `email`, `password`) |
| POST | `/auth/jwt/login` | – | Log in (form `username`, `password`), returns a JWT |
| GET | `/users/me` | ✔ | Current user |
| POST | `/upload` | ✔ | Upload an image/video (multipart `file`, `caption`), max 50 MB |
| GET | `/feed` | ✔ | All posts, newest first |
| DELETE | `/posts/{post_id}` | ✔ | Delete your own post (also removes it from ImageKit) |
