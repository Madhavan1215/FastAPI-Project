from fastapi import FastAPI

app = FastAPI()

@app.get("/hello-world")
def hellor_world():
    return {"message": "Hello World!"}