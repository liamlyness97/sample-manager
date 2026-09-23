"""Evaluate key detection against a labelled set of samples.

Scores the app's current estimate_key() and a grid of experimental variants
(input signal x chroma type x key profile) against key-samples/manifest.csv,
using MIREX-style weighted scoring. Nothing in the app is changed; this is a
harness for deciding what to change.

Run inside the dev container (./fast-api is mounted at /app):
    docker exec sample-manager-fastapi-1 python scripts/evaluate_keys.py

Options:
    --manifest PATH   manifest CSV (default: key-samples/manifest.csv)
    --out PATH        per-file, per-variant results CSV (default: key-samples/results.csv)
"""

import argparse
import csv
import sys
from pathlib import Path

import librosa
import numpy as np

FAST_API_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(FAST_API_ROOT))

from fastapi_server.audio.key_detection import estimate_key  # noqa: E402
from fastapi_server.audio.constants import NOTE_NAMES  # noqa: E402

# Key profiles, index 0 = tonic. Values copied from Essentia's key.cpp
# (github.com/MTG/essentia, src/algorithms/tonal/key.cpp), which also cites
# the original sources. Krumhansl matches the app's constants.py.
PROFILES = {
    "krumhansl": (
        [6.35, 2.23, 3.48, 2.33, 4.38, 4.09, 2.52, 5.19, 2.39, 3.66, 2.29, 2.88],
        [6.33, 2.68, 3.52, 5.38, 2.60, 3.53, 2.54, 4.75, 3.98, 2.69, 3.34, 3.17],
    ),
    # Temperley's revised profiles (1999)
    "temperley": (
        [5.0, 2.0, 3.5, 2.0, 4.5, 4.0, 2.0, 4.5, 2.0, 3.5, 1.5, 4.0],
        [5.0, 2.0, 3.5, 4.5, 2.0, 4.0, 2.0, 4.5, 3.5, 2.0, 1.5, 4.0],
    ),
    # Temperley, MIREX 2005 (corpus-derived)
    "temperley2005": (
        [0.748, 0.060, 0.488, 0.082, 0.67, 0.46, 0.096, 0.715, 0.104, 0.366, 0.057, 0.4],
        [0.712, 0.084, 0.474, 0.618, 0.049, 0.46, 0.105, 0.747, 0.404, 0.067, 0.133, 0.33],
    ),
    "shaath": (
        [6.6, 2.0, 3.5, 2.3, 4.6, 4.0, 2.5, 5.2, 2.4, 3.7, 2.3, 3.4],
        [6.5, 2.7, 3.5, 5.4, 2.6, 3.5, 2.5, 5.2, 4.0, 2.7, 4.3, 3.2],
    ),
    # Faraldo et al., profiles for electronic dance music.
    # (Essentia also has a third "other" profile for these; not used here.)
    "bgate": (
        [1.00, 0.00, 0.42, 0.00, 0.53, 0.37, 0.00, 0.77, 0.00, 0.38, 0.21, 0.30],
        [1.00, 0.00, 0.36, 0.39, 0.00, 0.38, 0.00, 0.74, 0.27, 0.00, 0.42, 0.23],
    ),
    "edma": (
        [1.00, 0.29, 0.50, 0.40, 0.60, 0.56, 0.32, 0.80, 0.31, 0.45, 0.42, 0.39],
        [1.00, 0.31, 0.44, 0.58, 0.33, 0.49, 0.29, 0.78, 0.43, 0.29, 0.53, 0.32],
    ),
}

# The configuration the app currently uses, for the sanity check.
# Keep in sync with estimate_key() and constants.py.
APP_VARIANT = ("raw", "cqt", "bgate")

FLATS = {"Db": "C#", "Eb": "D#", "Gb": "F#", "Ab": "G#", "Bb": "A#"}


def note_index(name: str) -> int:
    return NOTE_NAMES.index(FLATS.get(name, name))


def parse_app_key(key: str) -> tuple[int, str]:
    """'C# major' -> (1, 'major')"""
    tonic, mode = key.split()
    return note_index(tonic), mode


def format_key(tonic: int, mode: str) -> str:
    return f"{NOTE_NAMES[tonic]} {mode}"


# --- Scoring (MIREX weighting, as implemented by mir_eval.key) ---------------

CATEGORY_SCORES = {"exact": 1.0, "fifth": 0.5, "relative": 0.3, "parallel": 0.2, "wrong": 0.0}


def categorise(ref_tonic: int, ref_mode: str, est_tonic: int, est_mode: str) -> str:
    if est_tonic == ref_tonic and est_mode == ref_mode:
        return "exact"
    # mir_eval only credits a fifth ABOVE the reference.
    if est_mode == ref_mode and est_tonic == (ref_tonic + 7) % 12:
        return "fifth"
    if ref_mode == "major" and est_mode == "minor" and est_tonic == (ref_tonic + 9) % 12:
        return "relative"
    if ref_mode == "minor" and est_mode == "major" and est_tonic == (ref_tonic + 3) % 12:
        return "relative"
    if est_tonic == ref_tonic:
        return "parallel"
    return "wrong"


def score(ref_tonic: int, ref_mode: str, est_tonic: int, est_mode: str) -> tuple[str, float]:
    """With an unknown reference mode, give the benefit of the doubt: take the
    better of the two possible modes, and mark the category with '?'."""
    if ref_mode:
        cat = categorise(ref_tonic, ref_mode, est_tonic, est_mode)
        return cat, CATEGORY_SCORES[cat]
    cats = [categorise(ref_tonic, m, est_tonic, est_mode) for m in ("major", "minor")]
    best = max(cats, key=CATEGORY_SCORES.get)
    return best + "?", CATEGORY_SCORES[best]


# --- Experimental key estimation ---------------------------------------------

def chroma_variants(y: np.ndarray, sr: int) -> dict[str, np.ndarray]:
    """12-bin chroma summaries for one signal, one per chroma method."""
    cqt = librosa.feature.chroma_cqt(y=y, sr=sr)
    # chroma_* normalise every frame to max 1, so quiet frames (tails, gaps)
    # count as much as loud ones in a plain mean. Weight frames by loudness.
    rms = librosa.feature.rms(y=y)[0]
    n = min(len(rms), cqt.shape[1])
    weights = rms[:n]
    cqt_weighted = (
        np.average(cqt[:, :n], axis=1, weights=weights) if weights.sum() > 0 else cqt.mean(axis=1)
    )
    return {
        "cqt": cqt.mean(axis=1),
        "cqt-rmsw": cqt_weighted,
        "cens": librosa.feature.chroma_cens(y=y, sr=sr).mean(axis=1),
        "stft": librosa.feature.chroma_stft(y=y, sr=sr).mean(axis=1),
    }


def rank_keys(chroma_avg: np.ndarray, profile: str) -> list[tuple[float, int, str]]:
    """All 24 keys as (correlation, tonic, mode), best first. Candidate order
    matches estimate_key() (for each tonic: major then minor) so ties resolve
    the same way."""
    major, minor = (np.array(p) for p in PROFILES[profile])
    candidates = []
    for i in range(12):
        candidates.append((np.corrcoef(chroma_avg, np.roll(major, i))[0, 1], i, "major"))
        candidates.append((np.corrcoef(chroma_avg, np.roll(minor, i))[0, 1], i, "minor"))
    # Stable sort keeps the first of equal scores first, like estimate_key's strict '>'.
    return sorted(candidates, key=lambda c: -c[0])


def confidence(ranked: list[tuple[float, int, str]]) -> tuple[float, float]:
    """Margin between the winner and the runner-up, two ways:
    - margin: vs the second-best key overall
    - margin_norel: vs the best key that isn't the winner's relative
      (relative major/minor share the same notes, so they always score close)"""
    best_score, tonic, mode = ranked[0]
    margin = best_score - ranked[1][0]
    rel = ((tonic + 9) % 12, "minor") if mode == "major" else ((tonic + 3) % 12, "major")
    runner = next(c for c in ranked[1:] if (c[1], c[2]) != rel)
    return margin, best_score - runner[0]


# --- Main --------------------------------------------------------------------

def load_manifest(path: Path) -> list[dict]:
    with open(path, newline="") as f:
        return list(csv.DictReader(f))


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--manifest", type=Path, default=FAST_API_ROOT / "key-samples" / "manifest.csv")
    parser.add_argument("--out", type=Path, default=FAST_API_ROOT / "key-samples" / "results.csv")
    args = parser.parse_args()

    rows = load_manifest(args.manifest)
    sample_dir = args.manifest.parent
    results = []  # one dict per (file, variant)
    app_rows = []  # one dict per file: the app's actual output

    for n, row in enumerate(rows, 1):
        name = row["filename"]
        print(f"[{n}/{len(rows)}] {name}", file=sys.stderr)
        y, sr = librosa.load(sample_dir / name)  # default sr=22050, same as the app
        y_harmonic, _ = librosa.effects.hpss(y)
        ref_tonic, ref_mode = note_index(row["tonic"]), row["mode"].strip()

        app_raw = parse_app_key(estimate_key(y, sr))
        app_harm = parse_app_key(estimate_key(y_harmonic, sr))
        app_rows.append({"row": row, "raw": app_raw, "harmonic": app_harm})

        for signal_name, signal in (("raw", y), ("harmonic", y_harmonic)):
            for chroma_name, chroma_avg in chroma_variants(signal, sr).items():
                for profile in PROFILES:
                    ranked = rank_keys(chroma_avg, profile)
                    best, tonic, mode = ranked[0]
                    margin, margin_norel = confidence(ranked)
                    cat, pts = score(ref_tonic, ref_mode, tonic, mode)
                    results.append({
                        "filename": name,
                        "kind": row["kind"],
                        "label": f"{row['tonic']} {ref_mode or '?'}",
                        "signal": signal_name,
                        "chroma": chroma_name,
                        "profile": profile,
                        "estimate": format_key(tonic, mode),
                        "category": cat,
                        "score": pts,
                        "best_corr": round(float(best), 4),
                        "margin": round(float(margin), 4),
                        "margin_norel": round(float(margin_norel), 4),
                    })

    write_csv(args.out, results)
    report(app_rows, results)
    print(f"\nFull results: {args.out}", file=sys.stderr)


def write_csv(path: Path, results: list[dict]):
    with open(path, "w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(results[0].keys()))
        writer.writeheader()
        writer.writerows(results)


TONAL_KINDS = ("loop", "pad")


def report(app_rows: list[dict], results: list[dict]):
    # 1. Sanity check: the reimplementation must reproduce the app exactly.
    mismatches = [
        r["filename"] for r in results
        if (r["signal"], r["chroma"], r["profile"]) == APP_VARIANT
        and r["estimate"] != format_key(*next(a for a in app_rows if a["row"]["filename"] == r["filename"])[APP_VARIANT[0]])
    ]
    print("\n== Sanity check ==")
    print(f"Reimplementation of {'/'.join(APP_VARIANT)} matches app estimate_key() on all files."
          if not mismatches else f"MISMATCH on: {mismatches}")

    # 2. What the app does today, per file.
    print("\n== App\'s estimate_key(), fed raw y vs y_harmonic ==")
    print(f"{'file':<62} {'kind':<10} {'label':<9} {'raw':<10} {'':<10} {'harmonic':<10} {''}")
    for a in app_rows:
        row = a["row"]
        ref = (note_index(row["tonic"]), row["mode"].strip())
        cells = []
        for key in (a["raw"], a["harmonic"]):
            cat, _ = score(*ref, *key)
            cells += [format_key(*key), cat]
        label = f"{row['tonic']} {row['mode'] or '?'}"
        print(f"{row['filename'][:61]:<62} {row['kind']:<10} {label:<9} "
              f"{cells[0]:<10} {cells[1]:<10} {cells[2]:<10} {cells[3]}")

    # 3. Variant leaderboard on the tonal loops + pads.
    variants = sorted({(r["signal"], r["chroma"], r["profile"]) for r in results})
    board = []
    for v in variants:
        rs = [r for r in results if (r["signal"], r["chroma"], r["profile"]) == v]
        tonal = [r for r in rs if r["kind"] in TONAL_KINDS]
        oneshot = [r for r in rs if r["kind"] == "one-shot"]
        known = [r for r in tonal if not r["category"].endswith("?")]
        board.append({
            "v": v,
            "tonal": np.mean([r["score"] for r in tonal]),
            "exact": sum(r["category"].startswith("exact") for r in tonal),
            "known": np.mean([r["score"] for r in known]) if known else float("nan"),
            "oneshot": np.mean([r["score"] for r in oneshot]) if oneshot else float("nan"),
            "n": len(tonal),
            "n_known": len(known),
        })
    board.sort(key=lambda b: (-b["tonal"], -b["exact"]))

    n, n_known = board[0]["n"], board[0]["n_known"]
    print(f"\n== Leaderboard: loops + pads (n={n}), MIREX weighted score ==")
    print(f"'known' = only the {n_known} files whose label includes the mode. "
          "Unknown-mode files get the better of major/minor.")
    print(f"{'signal':<9} {'chroma':<9} {'profile':<14} {'score':>6} {'exact':>7} {'known':>6} {'1-shot':>7}")
    for b in board:
        marker = "  <- app today" if b["v"] == APP_VARIANT else ""
        s, c, p = b["v"]
        print(f"{s:<9} {c:<9} {p:<14} {b['tonal']:6.3f} {b['exact']:>4}/{b['n']:<2} "
              f"{b['known']:6.3f} {b['oneshot']:7.3f}{marker}")

    # 4. Does confidence predict correctness? For the app's variant and the top one.
    for label, v in (("app today", APP_VARIANT), ("top variant", board[0]["v"])):
        rs = [r for r in results if (r["signal"], r["chroma"], r["profile"]) == v]
        rs.sort(key=lambda r: -r["margin_norel"])
        print(f"\n== Confidence vs correctness ({label}: {'/'.join(v)}), sorted by margin_norel ==")
        print(f"{'file':<62} {'kind':<10} {'estimate':<10} {'category':<10} {'best':>6} {'margin':>7} {'m_norel':>8}")
        for r in rs:
            print(f"{r['filename'][:61]:<62} {r['kind']:<10} {r['estimate']:<10} {r['category']:<10} "
                  f"{r['best_corr']:6.3f} {r['margin']:7.3f} {r['margin_norel']:8.3f}")


if __name__ == "__main__":
    main()
