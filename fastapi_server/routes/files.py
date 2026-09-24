import os
import shutil
import librosa
import numpy as np
from pathlib import Path
from fastapi import APIRouter, UploadFile
from fastapi_server.audio.key_detection import estimate_key
from fastapi_server.audio.harmonic_ratio import harmonic_ratio
from fastapi_server.audio.constants import TONAL_THRESHOLD, ANALYSIS_VERSION

UPLOAD_DIR = Path(os.environ.get("UPLOAD_DIR", "../uploads"))

router = APIRouter(prefix="/files", tags=["files"])

@router.post("/upload")
def upload(file: UploadFile):
    with open(UPLOAD_DIR / "U8rLB63r5VVtCwTN0oZjSoklagKaJhC0" / file.filename, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    y, sr = librosa.load(UPLOAD_DIR / "U8rLB63r5VVtCwTN0oZjSoklagKaJhC0" / file.filename)
    tempo, beats = librosa.beat.beat_track(y=y, sr=sr)
    duration = f"{librosa.get_duration(y=y, sr=sr):.2f} seconds"

    return {
        "filename": file.filename, 
        "tempo": float(np.atleast_1d(tempo)[0]),
        "sample_rate": sr,
        "duration": duration,  
        "status": 200
    }

@router.get("/analyse/{user_id}/{filename}")
def analyse_audio(user_id: str, filename: str):
    y, sr = librosa.load(UPLOAD_DIR / user_id / filename)
    tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)

    y_harmonic, y_percussive = librosa.effects.hpss(y)

    harm_ratio = harmonic_ratio(y_harmonic, y_percussive)

    if harm_ratio is None:
        tonality = None
    elif harm_ratio >= TONAL_THRESHOLD:
        tonality = 'tonal'
    else:
        tonality = 'noisy'

    duration = librosa.get_duration(y=y, sr=sr)
    key = estimate_key(y, sr)

    return {
        "bpm": float(np.atleast_1d(tempo)[0]),
        "duration": float(duration),
        "sampleRate": int(sr),
        "key": key,
        "harmonicRatio": harm_ratio,
        "tonality": tonality,
        ANALYSIS_VERSION
    }



