from datetime import datetime
from typing import Optional
from pydantic import BaseModel
from fastapi_users import schemas
import uuid


class PostRead(BaseModel):
    id: uuid.UUID
    user_id: uuid.UUID
    caption: Optional[str]
    url: str
    file_type: str
    file_name: str
    created_at: datetime
    is_owner: bool
    email: str


class FeedResponse(BaseModel):
    posts: list[PostRead]


class DeleteResponse(BaseModel):
    success: bool
    message: str


class UserRead(schemas.BaseUser[uuid.UUID]):
    pass


class UserCreate(schemas.BaseUserCreate):
    pass


class UserUpdate(schemas.BaseUserUpdate):
    pass
