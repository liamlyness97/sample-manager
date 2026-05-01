from fastapi import FastAPI, UploadFile, File
import shutil

app = FastAPI()

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.get("/items/{item_id}")
def read_root(item_id: int, q: str | None = None):
    return {"item_id": item_id, "q": q}

@app.post("/file")
async def upload(file: UploadFile):
    with open(f"uploads/{file.filename}", "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename}