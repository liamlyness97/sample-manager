import numpy as np

def harmonic_ratio(y_harmonic: np.ndarray, y_percussive: np.ndarray) -> float | None:
    harm_energy = np.sum(np.square(y_harmonic))
    perc_energy = np.sum(np.square(y_percussive))
    
    total = harm_energy + perc_energy
    
    if total < 1e-10:
        return None

    ratio = harm_energy / total

    return float(ratio)

