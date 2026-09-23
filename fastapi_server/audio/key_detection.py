import numpy as np
import librosa
from fastapi_server.audio.constants import MAJOR_PROFILE, MINOR_PROFILE, NOTE_NAMES

def estimate_key(y: np.ndarray, sr: int) -> str:
    chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
    chroma_avg = np.mean(chroma, axis=1)

    best_score = -1
    best_key = None
    best_mode = None

    for i in range(12):
        major_rotated = np.roll(MAJOR_PROFILE, i)
        minor_rotated = np.roll(MINOR_PROFILE, i)

        major_score = np.corrcoef(chroma_avg, major_rotated)[0, 1]
        minor_score = np.corrcoef(chroma_avg, minor_rotated)[0, 1]

        if major_score > best_score:
            best_score = major_score
            best_key = NOTE_NAMES[i]
            best_mode = 'major'

        if minor_score > best_score:
            best_score = minor_score
            best_key = NOTE_NAMES[i]
            best_mode = 'minor'

        

    return f"{best_key} {best_mode}"