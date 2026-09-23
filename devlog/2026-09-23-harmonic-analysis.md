# Dev log: Collections, library UI, harmonic analysis and key detection (2026-09-19 → 2026-09-23)

Source notes for a blog post. Covers the Sample Manager work from the start of the collections feature (`b074c8e`, 2026-09-19) up to 2026-09-23:
- **Part A:** building collections (commits `b074c8e` → `e927f19`).
- **Part 0:** further SvelteKit UI work (commits `6bb60fc` → `a554ea7`, plus the SvelteKit side of `e4d13b7`).
- **Parts 1–2:** a mentored session on audio analysis in the FastAPI/librosa service: the harmonic/percussive ratio, then first attempts at better key detection.
- **Part 3:** building a labelled key detection test set and scoring script, and what three rounds of results showed.
- **Part 4:** implementing the changes the results pointed to, a tonality bug and a silent-file bug found by testing, and the final state of the code (`fast-api` commits `cce33f8` → `779782a`).

## Context

- **Project:** Sample Manager, a web app for organising music production samples (mostly 172–174 BPM drum & bass: loops and one-shots).
- **Stack:** SvelteKit + TypeScript frontend/backend, Drizzle ORM on Postgres, better-auth, and a separate **FastAPI + librosa** Python service that analyses uploaded audio.
- **Before this session**, the FastAPI `/files/analyse/{user_id}/{filename}` endpoint returned BPM (`librosa.beat.beat_track`), duration, sample rate, and a key estimate (`audio/key_detection.py`: average `chroma_cqt` correlated against the 24 rotations of the Krumhansl–Schmuckler major/minor profiles).
- **Working style:** the developer wrote all the code. The AI assistant acted as a mentor, giving explanations, hints, questions and reviews rather than finished code.

## Part A: Collections (2026-09-19 → 2026-09-20)

Collections are user-defined groups of samples (e.g. "Rollers", "Neuro basses"), each with a highlight colour. A sample can belong to many collections, and a collection holds many samples.

### Schema: many-to-many via a join table (`b074c8e`, migration `0004`)
- **`collections`:** `id` (UUID via `$defaultFn(() => crypto.randomUUID())`), `name`, `highlight` (nullable text, a hex colour), `createdAt`/`updatedAt` (with `$onUpdate`), and `userId` → `user.id`.
- **`collection_samples`** (join table):
  - `collectionId` and `sampleId`, **both with `onDelete: 'cascade'`**, so deleting a collection or a sample automatically cleans up its memberships.
  - An `addedAt` timestamp, so a collection can be sorted by when samples were added.
  - A **composite primary key** `(collectionId, sampleId)`, so the same sample can't be in the same collection twice at the database level.
- **Drizzle relations:** `collections.collectionSamples: many`, `samples.collectionSamples: many`, and `collectionSamples.collection/sample: one`. These enable the relational query API (`db.query.samples.findMany({ with: … })`) used later for sample lists.
- **Small formatting helpers added in the same commit:** `formatDuration` (m:ss), `formatSize` (B/KB/MB), `formatLabel` (file extension or MIME subtype, upper-cased).

### Create flow and collections page (`952e489`)
- **`/dashboard/collections`:** `load` returns the user's collections, and a `create` form action inserts `{ name, highlight, userId }`, returning `fail(400)` when the name is missing.
- **`CreateCollectionModal.svelte`:** established the modal pattern reused by every later modal:
  - `$bindable` `open`
  - `use:enhance` with a `SubmitFunction` that tracks `submitting` / `error`
  - Escape to close
  - a manual Tab/Shift+Tab **focus trap**
  - a click-to-close backdrop button.

  At this stage the highlight colour was a free-text hex input; it was later replaced by swatches (see Part 0).
- **Collections page:** a 5-column grid of cards, each with a colour square taken from the collection's highlight via a CSS custom property (`style="--highlight: {collection.highlight}"` with Tailwind's `bg-(--highlight)`), the name, and a click-through to the detail route via `goto`.

### Assigning collections during upload (`e057b0e`)
- **`UploadModal`:** a type-to-filter picker. Typing shows a dropdown of matching collections that aren't already selected (tracked with a `$derived` `Set` of selected ids), and selected collections appear as removable chips. On submit, each is appended to the `FormData` as `collectionIds`.
- **The `upload` action:**
  - de-duplicates the ids with `new Set`
  - keeps only the ones that exist in `collections`
  - after inserting the sample, bulk-inserts the join rows with `onConflictDoNothing()`, then continues with the existing FastAPI analysis call.

### Collection detail route (`e927f19`)
- **`/dashboard/collections/[collectionId]`:** `load` returns 401 if not signed in and 404 if the collection doesn't exist.
- First version: an inner join `samples ⋈ collection_samples`, filtered by collection and by the sample's owner, ordered by `addedAt DESC` ("sorted by recently added").
  - Later replaced with a relational `findMany` so samples carry their collections (see Part 0). That change **dropped the `addedAt` ordering**, even though the page still says "sorted by recently added".
- Reuses the shared `SampleList` component, so playback, selection and the play queue all work inside a collection.

### Collections loose ends (still present in the current code)
- **Ownership gaps:**
  - The `upload` action validates requested collection ids by existence only (no `userId` filter), so a crafted request could attach a sample to another user's collection. The later bulk-edit action does check ownership.
  - The detail route loads the collection by id without checking `userId`. Other users' samples are filtered out, but the collection's name and colour are visible to anyone who has its id.
- **Collections page:**
  - The card's "142 samples" is a hard-coded placeholder.
  - `{#if data.collectionsList}` is always truthy (an empty array is truthy), so the "No collections found" state never shows.
  - The count label reads "0 Collection" (only `> 1` is pluralised).
- **Create action:** a missing name returns `{ missing: true }`, but the modal reads `result.data?.error`, so the user sees the generic "Something went wrong" message.

## Part 0: Further SvelteKit UI work (2026-09-20 → 2026-09-23)

### Recently played tracking (`06933d3`, `589d386`)
- **Schema:** `sample` gained `lastPlayedAt` (timestamp) and `playCount` (integer, default 0).
- **API:** `POST /api/samples/[id]/played` sets `lastPlayedAt = now()` and increments the counter atomically in SQL (`playCount + 1`). It's scoped to the signed-in user, returning 401 if not signed in and 404 if the sample isn't theirs.
- **`src/lib/helpers/playTracker.ts`:** a small `createPlayTracker(report, qualifyAfterMs)` that decides **when a play counts**:
  - Starting playback starts a timer (1000 ms in the player). If playback continues that long, the play is reported.
  - Pausing, seeking or switching samples cancels a pending, not-yet-qualified play (`teardownSource()` calls `tracker.cancel()`).
  - **Short one-shots end before the timer fires**, so the audio source's natural `onended` calls `tracker.finish()` to report them anyway.
  - A `playCounted` flag stops pause/resume or seeking from counting the same play twice. It resets only when playback starts again from offset 0.
  - `reportPlay` uses `fetch(..., { keepalive: true })` so the request survives navigation, and swallows errors: *"A failed report must never interrupt playback."*
- **Live UI refresh:** the dashboard layout's `load` calls `depends('app:recent-samples')`, and a successful report calls `invalidate('app:recent-samples')`. The sidebar and dashboard "Recently Played" lists update without a page reload.
- **Query:** the 5 most recent samples where `lastPlayedAt IS NOT NULL`, ordered by `lastPlayedAt DESC`. Shown in a "Recent" section of `SidebarNav` and in the dashboard's "Recently Played" card.

### Sample edit toolbar and bulk actions (`7e6ea42`, `1e210e7`, `2bd213a`, `ad53caa`)
- `SampleList` already had multi-select (a `SvelteSet` of selected ids, plus select-all / indeterminate state). A **floating action bar** now flies in at the bottom of the list whenever anything is selected, with **Rename Sample**, **Edit Collection** and **Delete Sample**.
- **`EditCollectionsModal.svelte`:** one row per selected sample, each with a type-to-filter collection picker. It hides collections already chosen, shows the selected ones as removable chips, and submits them as hidden `collectionIds_<sampleId>` inputs. An `$effect` seeds each row from the sample's current collections every time the modal opens.
- **`RenameSamplesModal.svelte`:** one name input per selected sample (`sampleName_<sampleId>`), seeded from the current names when the modal opens.
- **Delete:** a native `confirm()` ("Delete these N samples? This can't be undone.") followed by a hidden form submitted with `requestSubmit()`. The selection clears on success.
- **Both modals share one pattern:** `$bindable` `open`, `use:enhance` with a `SubmitFunction` that tracks `submitting` / `error`, `invalidateAll()` on success, Escape to close, a manual focus trap on Tab/Shift+Tab, and `fade`/`fly` transitions.
- **Server actions** (`editSampleCollection`, `renameSamples`, `deleteSamples`) exist on both `/dashboard/samples` and `/dashboard/collections/[collectionId]`. Each one:
  - de-duplicates the submitted ids
  - **filters them to samples the current user owns** (and collections they own) before writing anything
  - returns `fail(400)` / `fail(403)` with a message the modal displays.
  - Editing collections replaces a sample's memberships (delete all, then insert the valid set with `onConflictDoNothing`).
  - Deleting removes the DB rows (join rows cascade), then `unlink`s the audio files, ignoring errors if a file is already gone.
- **Data loading:** sample lists now use Drizzle's relational query (`db.query.samples.findMany({ with: { collectionSamples: { with: { collection: true } } } })`) so each sample arrives with its collections. The collection page switched from an inner join to looking up membership ids and then running `findMany` with `inArray`, so it gets the same shape.

### Dashboard and defaults (`6bb60fc`, `59f73be`, `a554ea7`)
- Dashboard grid moved from 6 to 12 columns, with cards for All Samples (count), Recently Played, Collections, BPM and Key.
- **`defaults/colours.svelte.ts`:** 18 named highlight colours (Graphite, Slate, Rose, Coral, …, Pink). The create-collection modal's free-text hex field became a hidden input driven by a 12-column grid of colour swatches with a ring on the selected one. Collections render as chips using a CSS variable (`style="--highlight: {colour}"` with Tailwind's `bg-(--highlight)`).
- **`defaults/keys.svelte.ts`:** the 24 keys as `{ key: 'C', type: 'Min' | 'Maj' }`, shown as a 6-column grid of buttons in the dashboard's Key card (the start of filtering by key).
- Small style tweaks: collection page heading is now "Browse {name}", and placeholder filter buttons were removed.

### Wiring the new analysis fields (`e4d13b7`, merged in PR #7)
- Drizzle migrations `0006`/`0007` add `harmonicRatio` (`doublePrecision`, nullable) and `tonality` (`text`) to `sample`.
- `src/routes/api/analysis/+server.ts` writes `librosaRes.harmonicRatio` and `librosaRes.tonality` along with bpm, sample rate, duration and key, and marks the row `complete`.

### UI loose ends noticed while writing this up
- **The key format doesn't match:** the dashboard key grid uses `'C#' + 'Min'/'Maj'`, while FastAPI returns strings like `"C# minor"`. This needs normalising before key filtering works.
- On `/dashboard/collections/[collectionId]`, `<SampleList>` isn't passed `collections`, so the Edit Collection modal there has no options to pick from, even though the layout already loads `data.collections`.
- The three bulk actions are duplicated in both route files. They're candidates for a shared server helper.
- The dashboard's "29.3GB" storage figure is hard-coded, and the Key/Collection buttons don't have click handlers yet.

## Goals set at the start of the analysis session

1. Detect **percussive vs melodic** content in a sample.
2. **Improve key detection.** Key matters for everything, drums included ("is this kick in key?").
3. The library contains both **loops and one-shots**.

The four meanings of "harmonic analysis" in librosa considered were: HPSS (harmonic/percussive source separation), cleaner key detection, root note / pitch for one-shots (`pyin`), and chord progression over time. Chord progression was judged overkill for a sample manager.

## Part 1: Harmonic/percussive ratio

### Approach
- `librosa.effects.hpss(y)` returns `y_harmonic` and `y_percussive`, two time-domain signals the same length as `y` that (with default settings) add back up to `y`.
- Energy of each = sum of squared samples (`np.sum(np.square(x))`).
- **Ratio = harmonic_energy / (harmonic_energy + percussive_energy)**: 1.0 = fully harmonic, 0.0 = fully percussive.

### Things learned along the way
- **Shapes:** `y`, `y_harmonic` and `y_percussive` all had the same shape, e.g. `(11538,)`. At librosa's default 22050 Hz that's ≈ 0.52 s, which is how duration can be read straight off the sample count.
- **The `margin` bug.** The first version used `hpss(y, margin=(1.0, 5.0))`, probably copied from an example. The energies didn't add up: `y` had 3605 energy, while harmonic (775) + percussive (52) = 827. By Cauchy–Schwarz the cross term 2·Σ(h·p) can't exceed ~2·√(775·52) ≈ 400, so this was impossible *if* y = h + p. The cause: a margin > 1 makes HPSS masks stricter, the masks no longer sum to 1, and a third **residual** component (neither clearly harmonic nor percussive) is discarded. The strict percussive margin also pushed the ratio toward "harmonic". Fix: remove the margin. (Strict margins suit extracting clean stems, not measuring proportions.)
- **Verifying reconstruction with `np.allclose(y, y_harmonic + y_percussive)`** returned `False`, but the max absolute error was `1.19e-07`, i.e. 2⁻²³, float32 rounding. The default `allclose` tolerance `atol=1e-8` is stricter than float32 precision, so it fails near zero. Lesson: check the actual error size; don't trust the boolean alone.
- **Sample-level oddities:** at the start of a file, the harmonic and percussive samples were each ~10,000× louder than `y` but nearly equal and opposite, so they cancel. That's STFT-frame smearing in HPSS. Individual samples are meaningless; only aggregate energy matters.
- **A `UserWarning: n_fft=1024 is too large for input signal of length=951`** appeared. 951 ≈ 60828 / 64: it comes from `chroma_cqt` (in key detection) repeatedly downsampling for its lowest octaves. On short files, low-octave chroma has very little data, which matters for kicks/808s.
- Docker log ordering: warnings (stderr) and prints (stdout) can appear out of order unless `PYTHONUNBUFFERED=1`.

### Final function (`fast-api/fastapi_server/audio/harmonic_ratio.py`)
```python
import numpy as np

def harmonic_ratio(y_harmonic: np.ndarray, y_percussive: np.ndarray) -> float | None:
    harm_energy = np.sum(np.square(y_harmonic))
    perc_energy = np.sum(np.square(y_percussive))

    total = harm_energy + perc_energy

    if total < 1e-10:
        return None

    ratio = harm_energy / total

    return float(ratio)
```
Design decisions:
- HPSS runs **once in the route** and the components are passed in, so key detection can reuse `y_harmonic`.
- **Silence returns `None`**, not 0.5 or 0.0, because those would be false claims ("mixed" / "percussive").
- Returns a plain Python `float` so FastAPI can serialise it.
- Named after what it returns (`harmonic_ratio`), not `harmonic_detection`.

### Results on real samples
| Sample | Ratio |
|---|---|
| Perc loop | 0.0004 |
| Hat loop | 0.054 |
| Synth loop (stabby) | 0.057 |
| Kick one-shot | 0.868 |
| Bass loop | 0.884 |
| Melodic synth FX | 0.953 |
| Vocal atmos | 0.996 |

Two surprises that changed how the feature is framed:
- **Kicks read as harmonic.** A kick is a short click plus a sustained low sine body. In a spectrogram that body is a horizontal line, which HPSS calls harmonic, and sum-of-squares energy is dominated by loud low frequencies. So the ratio measures **"sustained tone vs transient/noise"**, not "drum vs instrument". That's useful for the "is this drum in key?" goal: a kick *has* a pitch.
- **A very stabby synth loop read as percussive.** HPSS's harmonic median filter spans `kernel_size=31` frames × (512 / 22050 s) ≈ 0.72 s. A median only keeps a value that holds for about half the window, so notes shorter than ~0.36 s don't count as "horizontal". Short synth stabs are treated as transients.

### Labelling and storage decisions
- Label renamed from percussive/melodic to **`tonal` / `noisy`**, to match what the ratio actually measures.
- **Threshold 0.5**: noisy samples topped out at 0.057 and tonal ones started at 0.868. A "mixed" band (e.g. 0.3–0.7) may be added later.
- Drizzle `sample` table gained `harmonicRatio: doublePrecision()` (nullable, for silence) and `tonality: text()`. Committed in `e4d13b7` / merged in PR #7 (`d0e8c4a`), along with the SvelteKit analysis route storing the new fields.
- Advice given (and noted as a trade-off): the label is derivable from the ratio, so storing it means a backfill whenever the threshold changes.

## Part 2: Key detection improvements

### Change made
`estimate_key(y_harmonic, sr)` instead of `estimate_key(y, sr)`. The reasoning: hats/snares are broadband noise that adds energy to all 12 chroma bins, flattening the profile and weakening its correlation with the key profiles.

### Before/after on samples with known keys (from filenames; mode not given)
| File | Labelled | Before (raw `y`) | After (`y_harmonic`) | Notes |
|---|---|---|---|---|
| synthfx | D# | C# major | C# major | near miss (C# major shares 6/7 notes with D# minor) |
| vocal atmo | G | E minor | E minor | relative minor of G major (same notes) |
| synth loop | F | C minor | C major | fifth-related either way; mode needed to judge |
| bassloop | D# | **D minor** | **D# minor** ✅ | semitone error fixed |

The bassloop fix suggests the attack transients of bass notes were spreading energy into the wrong chroma bins. One clear improvement, no regressions, so `y_harmonic` was kept.

Drum/perc files (hats, beats, perc loops, fills) always got a confident-sounding key (e.g. "G# minor"), and it changed between runs. These keys are meaningless.

### Can we detect when a key is meaningless? (No, not yet.)
Two candidate signals, measured on 8 files:

| File | Group | harmonicRatio | best_score (max Krumhansl correlation) |
|---|---|---|---|
| synthfx | melodic | 0.953 | 0.588 |
| basic beat | drums | 0.027 | 0.514 |
| fillperc | drums | 0.602 | 0.498 |
| synth loop | melodic | 0.057 | 0.477 |
| perc loop | drums | 0.274 | 0.419 |
| cool hats | drums | 0.193 | 0.413 |
| vocal atmo | melodic | 0.996 | 0.327 |
| bassloop | melodic (correct key) | 0.884 | 0.311 |

- **harmonicRatio fails both ways:** the stabby synth (melodic) at 0.057 would be hidden; fillperc (drums) at 0.60 would be shown.
- **best_score doesn't separate the groups at all.** The drum beat scores higher than two melodic loops, and the one *correctly* detected key has the lowest score. Why: the Krumhansl profiles are smooth (all values between ~2 and 6.4), so almost any chroma correlates moderately with them, and taking the best of 24 candidates inflates chance scores. Drum loops get ~0.4–0.5 "for free".
- Idea noted for later: use the **margin** between the best and second-best key (possibly excluding the winner's relative key) as confidence.
- Debugging moment: a `print(best_score)` placed inside the 12-iteration loop printed 12 lines, which accidentally showed the running maximum climbing to its final value.

### Decision
Take the pragmatic route for now: **always show the key**, and use `tonality` in the UI to de-emphasise it for noisy samples. Automatic key detection on short samples is hard, and commercial tools get it wrong too.

*(This decision, and the choice of `y_harmonic` as the key-detection input, were revisited in Parts 3–4 once there was a proper test set.)*

## Part 3: Key detection test setup and results

The developer collected labelled samples in `fast-api/key-samples/`: 20 at first, growing to 40 over three rounds. The assistant, at the developer's request, built the test setup; application changes were left to the developer.
- **`key-samples/manifest.csv`:** `filename, tonic, mode, kind, notes`. The mode is only filled in where the filename states it (10 files); the rest are left blank rather than guessed. Kinds: loop, pad, one-shot, perc-loop.
- **`scripts/evaluate_keys.py`:** run with `docker exec -w /app sample-manager-fastapi-1 python scripts/evaluate_keys.py`.
  - Compares 48 setups: {raw, harmonic} input × {chroma_cqt, chroma_cqt weighted by frame loudness, chroma_cens, chroma_stft} × {Krumhansl, Temperley, Temperley 2005, Shaath, bgate, edma}.
  - The profile values were copied from Essentia's `key.cpp` source. Its Krumhansl values match the app's exactly.
  - Scoring uses the MIREX weights, as in `mir_eval`: exact 1.0, fifth above 0.5, relative 0.3, parallel 0.2. Files with an unknown mode get the better of major/minor.
  - A sanity check confirms the script reproduces the app's `estimate_key` output on every file. Per-file results are written to `key-samples/results.csv`.

### Findings (25 tonal loops/pads, 10 with a known mode, all 10 minor)
- **Raw input beat the harmonic component.** With the app's chroma and profile, raw scored 0.640 against 0.560 for harmonic, and got the tonic right on 16/25 files against 14/25. Raw came out equal or ahead in most pairs.
  - Harmonic broke a stab loop (C# → G minor) and a bass loop (F minor → F# minor). Both are short-note material, which fits HPSS's roughly 0.72 s median window treating short notes as percussive.
  - Harmonic only fixed one one-shot. The set still has no melodic loops *with drums*, which is the case HPSS is meant to help.
- **Profiles:** Shaath (a small revision of Krumhansl) was narrowly best overall (raw/cqt/shaath 0.680, tonic 17/25). The EDM profiles (bgate, edma) scored 0.93 on the known-mode subset, but they answer "minor" for 72–84% of all files. Since every known-mode file is minor, that advantage can't be separated from a minor bias. Temperley and `chroma_stft` were consistently worst.
- **Mode is the weak point, not the tonic.** Counting a relative-key answer as correct (Camelot-style: F major = D minor) lifts the best setups from about 17/25 to 19/25.
- **Confidence (the winner's lead over the runner-up) still doesn't predict correctness.** A wrong answer had a margin of 0.001, and correct answers go as low as 0.004.
- **Consistently hard files** (wrong in nearly every variant): JOEFORD B loop, `21 PYTH Pad 3 D#`, PROX F loop, NL stab F loop. Their labels are worth checking by ear. The two "PYTH Pad 3 D#" files are different audio, not duplicates (correlation 0.005).
- **Duration can't separate one-shots from loops:** the one-shots in the set are 14–44 s long.

### Third run: major-key files added (36 tonal loops/pads; 21 with a known mode: 7 major, 14 minor)
- **Raw input still beats harmonic**, three runs in a row. App today (harmonic/cqt/krumhansl) scored 0.492 and ranked 23rd of 48; raw/cqt/krumhansl scored 0.547.
- **The bgate advantage held up once major files were included.** Exact matches on known-mode files: raw/cqt/bgate got 2/7 major and 9/14 minor; raw/cqt/krumhansl got 2/7 and 6/14. So bgate isn't worse on major keys, and it's better on minor ones. Its lean towards "minor" also suits drum & bass.
- **Major keys are hard for every setup:** the best managed 3/7.
- **Ceiling:** the best setups get the tonic right on roughly 19–21 of 36 files (~55%). The top variants are within 1–2 files of each other.
- **The biggest error class is fifth/fourth confusion:** 7–10 files per setup are off by a fifth either way. Examples: D minor pad → G, A minor pad → D major, B major bass → F#. That's the classic tonic vs dominant/subdominant ambiguity, and averaging chroma over the whole file can't resolve it. MIREX scoring credits only a fifth *above* the label.
- **Decision (for the developer to implement):** pass raw `y` to `estimate_key`, and swap Krumhansl for the bgate profiles in `constants.py`. Keep `chroma_cqt`. Show keys in Camelot notation, where relative keys match. Going meaningfully beyond this would need a different algorithm (e.g. a CNN key model), not more tuning.

## Part 4: Implementing the changes and wrapping up (2026-09-23, evening)

All commits below are in the `fast-api` repo.

### Key detection changes (`cce33f8` "Evaluated key detection to refine")
The developer made both changes the test results recommended:
- `routes/files.py`: `estimate_key(y, sr)`, the **raw signal**, replaces `estimate_key(y_harmonic, sr)`. HPSS still runs, but only to feed `harmonic_ratio`.
- `audio/constants.py`: the Krumhansl `MAJOR_PROFILE` / `MINOR_PROFILE` values were replaced with the **bgate** EDM profiles (Faraldo et al.). All 24 values were checked against Essentia's source.
- The same commit added `scripts/evaluate_keys.py`.

**How the change was checked:** the script's "app configuration" setting was moved to `raw / cqt / bgate`.
- The sanity check reported that the reimplementation matches the app's `estimate_key()` on every file.
- The app's row on the leaderboard landed on the predicted figures, **0.536 and 17/36 exact**, up from 0.492 and 14/36.

This pattern is worth reusing: predict the exact score *before* making the change, then confirm the app hits it.

### Tonality bug and repo hygiene (`f5c4edb` "Wrapping up latest changes")
**The tonality bug:** the old code was
```python
if harm_ratio >= 0.5: tonality = 'tonal'
if harm_ratio < 0.5:  tonality = 'noisy'
else:                 tonality: 'n/a'
```
Two separate bugs were hiding in it:
- **`tonality: 'n/a'` is a type annotation, not an assignment.** It did nothing, so `'tonal'` survived only by accident.
- **For a silent file, `harmonic_ratio` returns `None`, and `None >= 0.5` raises a `TypeError`**, so the request crashes.

It was replaced with one chain that checks for `None` first:
```python
if harm_ratio is None:
    tonality = None
elif harm_ratio >= TONAL_THRESHOLD:
    tonality = 'tonal'
else:
    tonality = 'noisy'
```
- `TONAL_THRESHOLD = 0.5` now lives in `constants.py`.
- A silent file gets `tonality = None`, which matches its null `harmonicRatio`. The DB column is nullable.

**Repo hygiene:**
- Added `fast-api/.gitignore` for `__pycache__/` and `*.pyc`. The 13 compiled `.pyc` files that had been committed were untracked with `git rm --cached`.
- The same `.gitignore` excludes `key-samples/*` except `manifest.csv`, so the audio (around 40 files of commercial samples) and the generated `results.csv` stay out of git, while the labels are versioned.

### A bug found by testing the fix (`5e14cf5`, `779782a`)
The analysis route was run inside the container on three files: a generated 2-second silent WAV, an F minor arp, and a perc loop.

| File | harmonicRatio | tonality | key |
|---|---|---|---|
| silent | `None` | `None` | `'None None'` ← bug |
| F minor arp | 0.62 | tonal | F minor |
| perc loop | 0.03 | noisy | F# minor |

**Why `'None None'`:**
1. For silence, `chroma_avg` is all zeros.
2. Pearson correlation divides by the standard deviation, which is 0 here, so every `np.corrcoef` returns `nan`.
3. `nan > best_score` is always `False`, so `best_key` and `best_mode` keep their initial `None`.
4. The f-string then turns them into the *text* `"None None"`, which would be stored as a real-looking key.

**The fix** (written by the developer): `estimate_key` returns `None` when nothing won, and its signature became `-> str | None`, matching `harmonic_ratio`'s `-> float | None`. `None` passes through as JSON `null` into the nullable `estimatedKey` column. The guard goes *after* the loop, so it catches any input where no key wins, not only all-zero chroma.

**Follow-up (`779782a` "Fixed indentation within for loop"):** the first version of the guard was indented inside the `for` loop. It happened to behave correctly, because any real correlation beats the initial `-1` on the first pass, and silence returns on the first pass. But it read as "stop if this tonic didn't win", and it quietly depended on that first-pass assumption. It was moved out of the loop.

**Re-test after the fix:** the silent file gives `key: None`, `harmonicRatio: None`, `tonality: None`. The arp still gives F minor / tonal. The test script's sanity check still passes, still at 0.536 and 17/36.

### Current state of the analysis code
- **`audio/harmonic_ratio.py`:** `harmonic_ratio(y_harmonic, y_percussive) -> float | None`. It returns harmonic energy ÷ total energy, or `None` for silence.
- **`audio/key_detection.py`:** `estimate_key(y, sr) -> str | None`. It uses `chroma_cqt` averaged over time, correlated against the 24 rotations of the bgate profiles, and returns `None` if nothing wins.
- **`audio/constants.py`:** bgate `MAJOR_PROFILE` / `MINOR_PROFILE`, `NOTE_NAMES`, `TONAL_THRESHOLD = 0.5`.
- **`routes/files.py` `analyse_audio`:** load → `beat_track` → `hpss` → `harmonic_ratio` → tonality (`None` / tonal / noisy) → duration → `estimate_key(y, sr)`. Returns `bpm, duration, sampleRate, key, harmonicRatio, tonality`, and any of `key`, `harmonicRatio` and `tonality` can be null.
- **`scripts/evaluate_keys.py` + `key-samples/manifest.csv`:** the key test setup (40 labelled samples; audio not committed).
- **Repo layout:** `fast-api/` is its **own git repository**, and the parent repo ignores it via `.gitignore`. Python history for this work: `d1e785d`, `d2cbeab`, `c890aa7`, `cce33f8`, `f5c4edb`, `5e14cf5`, `779782a`. The SvelteKit/Drizzle side is in the parent repo (PR #7).

## Open issues / backlog

- **Camelot display and filtering** in the dashboard, where relative keys match. It needs the key format normalised first: the UI uses `'C#' + 'Min'/'Maj'`, while the API returns `"C# minor"` or `null`.
- **Half-time BPM:** `beat_track` reported 86 BPM for a 174 BPM arp during testing. That's a common octave error for drum & bass tempos; consider a tempo prior or doubling below a threshold.
- **Failed analysis leaves rows stuck in `pending`** with nulls and no error recorded (seen when a syntax error crashed analysis for three uploads). Consider a `'failed'` value in `statusEnum`.
- **Re-analyse action**: old rows have null `harmonicRatio`/`tonality`. This will recur each time the analysis improves.
- Duplicate uploads are allowed (currently just leftover test rows).
- `librosa` / `numpy` aren't listed in `fast-api/pyproject.toml` dependencies.
- The Drizzle schema mixes explicit snake_case column names with implicit camelCase ones.

## Planned next steps

Done in this session:
- ~~Build a key detection test set and scoring script~~ (Part 3).
- ~~Try other key profiles~~: tested 6, adopted bgate (Parts 3–4).
- ~~Chroma refinements~~: tested loudness-weighted chroma, `chroma_cens` and `chroma_stft`. None clearly beat `chroma_cqt`, and `stft` was worst.

Still to do:
1. **Grow the test set:**
   - melodic loops *with drums* (the one case where harmonic input might still win)
   - more major-key files
   - labels checked by ear for the four files that fail in every variant.

   Re-run `scripts/evaluate_keys.py` after each change.
2. **One-shot vs loop detection:** duration is ruled out (one-shots in the set are 14–44 s). Remaining candidates are onset count (`librosa.onset.onset_detect`), `beat_track` behaviour on single hits, or user input with auto-detection as the default guess.
3. **Root note for tonal one-shots** (kicks, 808s, bass) using `librosa.pyin` with a low `fmin`, instead of key profiles. `manifest.csv` could gain a `root` column to test it.
4. **Beyond template matching:** if around 55% tonic accuracy isn't enough, a different algorithm would be needed (e.g. a CNN key model), since fifth/fourth confusion is built into whole-file chroma averaging.
