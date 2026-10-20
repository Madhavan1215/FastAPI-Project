import os
import uuid
from contextlib import asynccontextmanager
from datetime import timezone

import imagekitio
from fastapi import FastAPI, HTTPException, File, UploadFile, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import Post, User, get_async_session, create_db_and_tables
from app.images import imagekit
from app.schemas import PostRead, FeedResponse, DeleteResponse, UserRead, UserCreate, UserUpdate
from app.users import current_active_user, fastapi_users, auth_backend

MAX_UPLOAD_BYTES = 50 * 1024 * 1024  # 50 MB
FRONTEND_ORIGINS = os.getenv("FRONTEND_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173").split(",")


@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield


app = FastAPI(title="Snapshare API", lifespan=lifespan)

# Lets the React app (running on a different port) call this API from the browser.
app.add_middleware(
    CORSMiddleware,
    allow_origins=FRONTEND_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(fastapi_users.get_auth_router(auth_backend), prefix="/auth/jwt", tags=["auth"])
app.include_router(fastapi_users.get_register_router(UserRead, UserCreate), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_reset_password_router(), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_verify_router(UserRead), prefix="/auth", tags=["auth"])
app.include_router(fastapi_users.get_users_router(UserRead, UserUpdate), prefix="/users", tags=["users"])


def to_post_read(post: Post, email: str, current_user: User) -> PostRead:
    return PostRead(
        id=post.id,
        user_id=post.user_id,
        caption=post.caption,
        url=post.url,
        file_type=post.file_type,
        file_name=post.file_name,
        # SQLite drops timezone info, so mark the stored UTC time as UTC again.
        created_at=post.created_at.replace(tzinfo=timezone.utc),
        is_owner=post.user_id == current_user.id,
        email=email,
    )


@app.post("/upload", response_model=PostRead, status_code=201, tags=["posts"])
async def upload_file(
    file: UploadFile = File(...),
    caption: str = Form(""),
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    content_type = file.content_type or ""
    if content_type.startswith("image/"):
        file_type = "image"
    elif content_type.startswith("video/"):
        file_type = "video"
    else:
        raise HTTPException(status_code=400, detail="Only image and video files are allowed")

    contents = await file.read()
    if len(contents) > MAX_UPLOAD_BYTES:
        raise HTTPException(status_code=413, detail="File is larger than 50 MB")

    try:
        upload_result = await imagekit.files.upload(
            file=(file.filename, contents, content_type),
            file_name=file.filename or "upload",
            use_unique_file_name=True,
            tags=["backend-upload"]
        )
    except imagekitio.APIError as e:
        raise HTTPException(status_code=502, detail=f"Upload to ImageKit failed: {e}")

    post = Post(
        user_id=user.id,
        caption=caption.strip() or None,
        url=upload_result.url,
        file_id=upload_result.file_id,
        file_type=file_type,
        file_name=upload_result.name
    )
    session.add(post)
    try:
        await session.commit()
    except Exception:
        # Don't leave an orphaned file in ImageKit if the database save fails.
        await imagekit.files.delete(upload_result.file_id)
        raise
    await session.refresh(post)

    return to_post_read(post, user.email, user)


@app.get("/feed", response_model=FeedResponse, tags=["posts"])
async def get_feed(
    user: User = Depends(current_active_user),
    session: AsyncSession = Depends(get_async_session)
):
    # One query that joins each post with its author's email.
    result = await session.execute(
        select(Post, User.email)
        .join(User, Post.user_id == User.id)
        .order_by(Post.created_at.desc())
    )
    posts = [to_post_read(post, email, user) for post, email in result.all()]
    return {"posts": posts}


@app.delete("/posts/{post_id}", response_model=DeleteResponse, tags=["posts"])
async def delete_post(
    post_id: uuid.UUID,
    session: AsyncSession = Depends(get_async_session),
    user: User = Depends(current_active_user)
):
    result = await session.execute(select(Post).where(Post.id == post_id))
    post = result.scalars().first()

    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
    if post.user_id != user.id:
        raise HTTPException(status_code=403, detail="Not authorized to delete this post")

    try:
        await imagekit.files.delete(post.file_id)
    except imagekitio.NotFoundError:
        pass  # already gone from ImageKit, still remove it from our database
    except imagekitio.APIError as e:
        raise HTTPException(status_code=502, detail=f"Could not delete file from ImageKit: {e}")

    await session.delete(post)
    await session.commit()

    return {"success": True, "message": "Post deleted successfully"}
