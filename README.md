# Lumaflect: Harmonic Relay

[![make.fun](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![Rank](https://make.fun/badge/best-game-01/ZiKe3378/lumaflect-harmonic-relay/rank.svg)](https://make.fun/bounty/best-game-01)
[![Reward](https://make.fun/badge/best-game-01/ZiKe3378/lumaflect-harmonic-relay/reward.svg)](https://make.fun/bounty/best-game-01)

An original, polished offline desktop browser game built with vanilla HTML5 Canvas, modern CSS, and procedural Web Audio synthesis. No build step, no third-party libraries, and zero external network requests.

---

## 1. Game Concept & Core Loop

In **Lumaflect**, you command an energetic **Core Resonator** navigating a radiant matrix of orbiting celestial nodes.

### Core Mechanics:
- **Polar Attunement (`[SPACE]` / Left Click):** Switch your polarity instantaneously between **Cyan** and **Amber**.
  - Absorbing radiant pulses matching your current polarity boosts your energy, restores integrity, and builds your **Chain Multiplier** (up to 8.0x).
  - Colliding with pulses of the conflicting polarity damages resonator integrity (-18%) and resets your combo multiplier.
- **Strand Anchoring (`[SHIFT]` / `[E]` / Right Click):** Tether adjacent harmonic nodes together using your stored energy.
  - Formed strands create radiant energy barriers that cleave incoming **Discordant Anomalies** (+400 base score × chain multiplier).
  - Connecting strands requires positioning near active nodes while dodging cross-fire pulses.
- **5 Escalating Harmonic Phases:**
  - **Phase 1: Initiation** &mdash; Calm pulse rhythms, calibration of polarity matching and strand linking.
  - **Phase 2: Orbital Drift** &mdash; Nodes begin orbital rotation, pulse intervals tighten, and the first discordant void shards appear.
  - **Phase 3: Discord Surge** &mdash; Rapid shard incursions requiring strategic defensive strand webs.
  - **Phase 4: Radiant Cascade** &mdash; High-tempo alternating bipolar pulses; split-second reflexes needed.
  - **Phase 5: Harmonic Singularity** &mdash; The climax matrix vortex; survive and stabilize to trigger **Harmonic Transcendence**.

---

## 2. Controls & Keyboard/Mouse Focus

| Action | Keyboard | Mouse |
| :--- | :--- | :--- |
| **Move Resonator** | `W`, `A`, `S`, `D` or `Arrow Keys` | Cursor guidance |
| **Toggle Polarity** | `Spacebar` | Left Click |
| **Anchor Conduit Strand** | `Shift` or `E` | Right Click |
| **Pause / Resume** | `P` or `Escape` | On-screen Pause Button |
| **Toggle Web Audio** | `M` | On-screen Speaker Button |
| **Restart Game** | `R` (on Pause / Game Over / Victory) | On-screen Restart Button |

- **Focus, Blur & Visibility Handling:** Directional input flags are explicitly cleared upon restart, game state change, window blur, and when document visibility becomes hidden. Active play automatically pauses when the window loses focus or becomes hidden. Key repeat events (`e.repeat`) are ignored for discrete toggles to prevent rapid repeat triggering.
- **Scrolling Management:** Browser default arrow/spacebar scroll behaviors are prevented to guarantee keyboard input responsiveness.
- **Audio Autoplay Safety:** Web Audio initializes strictly after the first user gesture (e.g. clicking "Start Harmonization" or pressing a key).

---

## 3. Architecture & File Structure

```
best-game-01/
├── LICENSE             # MIT License with SPDX-License-Identifier: MIT
├── README.md           # Documentation, test matrix, and adapter notes
├── main.ts             # Working Node 22 ESM platform adapter for make.fun dossier
├── test_game.py        # Static file checks and reimplemented math tests (Python 3)
├── vendor/
│   └── makefun-game.ts # Exact official competition kit library (read-only)
├── game/               # Static offline distribution
│   ├── index.html      # Responsive HTML5 entry point
│   ├── style.css       # Visual styles, HUD layout, and animations
│   └── js/
│       ├── audio.js    # Procedural Web Audio synthesizer (zero audio samples)
│       ├── entities.js # Vector math, Resonator, Node, Pulse, Strand, Anomaly
│       ├── renderer.js # High-DPI Canvas 2D vector renderer
│       └── game.js     # State machine, input management, game loop
└── screenshots/        # User-captured browser screenshots
```

---

## 4. Running the Game Locally

Because the game consists of standard static files with no build step:

### Direct File Execution:
Open [game/index.html](game/index.html) directly in Google Chrome or any modern Chromium browser.

### Local HTTP Server (Optional):
```bash
python3 -m http.server 8080 --directory game
```
Then navigate to `http://localhost:8080` in your browser.

---

## 5. Automated Tests: Verified vs. Blockers

### Python Static & Invariant Checks (`test_game.py`):
> **Note on test scope:** The Python test suite performs static file structure inspection and verifies reimplemented mathematical invariants in Python. It does **not** execute or test the actual in-browser JavaScript gameplay loop, rendering canvas, or Web Audio contexts.

Run using standard Python 3:
```bash
python3 -m unittest test_game.py -v
```

#### Actual Test Run Output:
```
test_file_size_limits (test_game.TestBundleIntegrity.test_file_size_limits)
Source must be < 160 KiB useful source and game directory < 48 MiB. ... ok
test_html_ui_screens_and_elements (test_game.TestBundleIntegrity.test_html_ui_screens_and_elements)
Verifies that all required screen elements and HUD elements exist in index.html. ... ok
test_no_symlinks (test_game.TestBundleIntegrity.test_no_symlinks)
Verifies no symlinks exist in the project. ... ok
test_required_files_exist (test_game.TestBundleIntegrity.test_required_files_exist) ... ok
test_strict_offline_no_external_resources (test_game.TestBundleIntegrity.test_strict_offline_no_external_resources)
Ensures index.html contains no external scripts, styles, fonts, or CDNs. ... ok
test_line_intersects_circle_math (test_game.TestGameMechanicsInvariants.test_line_intersects_circle_math)
Tests the line-to-circle intersection algorithm matching Entities.Vec.lineIntersectsCircle. ... ok
test_multiplier_clamping (test_game.TestGameMechanicsInvariants.test_multiplier_clamping)
Verifies chain multiplier caps at 8.0 and floors at 1.0. ... ok
test_polarity_toggle (test_game.TestGameMechanicsInvariants.test_polarity_toggle)
Verifies polarity states alternate deterministically. ... ok
test_adapter_contains_expected_exports (test_game.TestLicenseAndAdapter.test_adapter_contains_expected_exports) ... ok
test_mit_license (test_game.TestLicenseAndAdapter.test_mit_license) ... ok

----------------------------------------------------------------------
Ran 10 tests in 0.003s

OK
```

### Verified vs. Blockers Summary:
- **Verified:**
  - Presence and non-emptiness of required files.
  - Zero symlinks across the repository.
  - Useful source size < 160 KiB (actual ~68 KiB) and bundle size < 48 MiB.
  - Zero external CDN or network requests in `index.html`.
  - DOM structure integrity (HUD widgets, canvas, interactive buttons, modal state screens).
  - Mathematical formulas for vector distances, circle-line segment intersections, and multiplier bounds.
  - MIT license compliance with `SPDX-License-Identifier: MIT`.
  - Adapter contract matching Node 22 ESM structure and exact caps.
- **Verification limits:**
  - Three user-provided browser screenshots are included unchanged. They show the title screen and gameplay; their format, dimensions and file sizes were checked against the competition limits.
  - The official adapter successfully generated dossier.json from this source and these screenshots.
  - Automated static checks and mathematical tests do not establish complete browser gameplay coverage. The coordinating assistant did not directly play the game in a browser.
  - The available build transcript is the recorded Antigravity construction and repair session. The coordinating and testing assistants' complete session logs are unavailable for upload; that limitation must be disclosed with any entry. Local checks do not establish final eligibility or a prize.

---

## 6. Platform Adapter (`main.ts`)

The platform adapter `main.ts` is implemented as an erasable Node 22 ESM module that:
1. Resolves paths relative to `import.meta.url`.
2. Copies `game/` and `screenshots/` to `process.env.MAKEFUN_OUTPUT_DIR || '/output'`.
3. Imports and invokes `buildDossier` from `./vendor/makefun-game.ts` using the contest limits:
   - `text_max_bytes`: 163,840 (160 KiB)
   - `screenshots`: `{ max: 4, max_bytes: 262144 }`
   - `game_max_files`: 993
   - `game_max_bytes`: 50,331,648 (48 MiB)
   - `game_path_max_bytes`: 1,000
4. Writes the resulting canonical JSON bytes directly to `dossier.json` in the output directory.

---

## 7. Screenshot Status

The screenshots were supplied by the user from browser play and copied byte-for-byte into this repository. No synthetic screenshots or pixel edits were made. This set contains the title screen and two gameplay views.

---

## 8. License

SPDX-License-Identifier: MIT

This project is licensed under the terms of the [MIT License](LICENSE).
