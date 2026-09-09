import os
import shutil
import librosa
from pathlib import Path
from fastapi import APIRouter, UploadFile

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "../uploads"))

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
async def upload(file: UploadFile):
    with open(UPLOAD_DIR / file.filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    y, sr = librosa.load(UPLOAD_DIR / file.filename)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    duration = f"{librosa.get_duration(y=y, sr=sr):.2f} seconds"

    return {
        "filename": file.filename, 
        "tempo": float(tempo[0]), 
        "sample_rate": sr,
        "duration": duration,  
        "status": 200
    }

@router.get("/test")
async def test_file():
    y, sr = librosa.load(UPLOAD_DIR / 'U8rLB63r5VVtCwTN0oZjSoklagKaJhC0/66f0f87d-a988-44bf-8b6a-836a5feefe64.wav')
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
    return {"temp": 'Estimated tempo: {:.2f}'.format(tempo[0])}