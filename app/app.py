from fastapi import FastAPI , HTTPException
from app.schemas import PostCreate
from app.db import Post , get_async_session,  create_db_and_tables
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    await create_db_and_tables()
    yield


app = FastAPI(lifespan=lifespan)

text_posts = {
    1: {
        "title": "First Post",
        "content": "This is the first post content"
    },
    2: {
        "title": "Learning FastAPI",
        "content": "FastAPI makes building APIs with Python simple and efficient"
    },
    3: {
        "title": "Python Tips",
        "content": "Writing clean and readable Python code is an important skill"
    },
    4: {
        "title": "Getting Started with APIs",
        "content": "An API allows different applications to communicate with each other"
    },
    5: {
        "title": "Database Basics",
        "content": "Databases help us store and retrieve application data"
    },
    6: {
        "title": "My Coding Journey",
        "content": "I am learning backend development one step at a time"
    },
    7: {
        "title": "Understanding HTTP",
        "content": "HTTP methods such as GET POST PUT and DELETE are used to interact with resources"
    },
    8: {
        "title": "Git and GitHub",
        "content": "Git tracks code changes and GitHub hosts repositories online"
    },
    9: {
        "title": "Building Projects",
        "content": "Practical projects help turn programming concepts into real skills"
    },
    10: {
        "title": "Next Steps",
        "content": "I plan to learn request validation authentication and database integration"
    }
}

@app.get("/posts")
def get_all_posts(limit:int=None):
    if limit:
        return list(text_posts.values())[:limit]
    return text_posts

@app.get("/posts/{id}")
def get_post(id:int):
    if id not in text_posts:
        raise HTTPException(status_code=404, detail=f"Post with id {id} not found")
    return text_posts.get( id)


@app.post("/posts")
def create_post(post: PostCreate):
    new_post = { "title": post.title, "content": post.content}
    text_posts[max(text_posts.keys())+1]=new_post
    return new_post 
 