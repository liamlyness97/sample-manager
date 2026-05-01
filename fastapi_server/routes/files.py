import shutil
from pathlib import Path
from fastapi import APIRouter, UploadFile

UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
async def upload(file: UploadFile):
    with open(UPLOAD_DIR / file.filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
    return {"filename": file.filename, "status": 200}
