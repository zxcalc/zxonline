# ZX Online

The site retains the original overview, first 21 lesson positions, Back/Next flow and completion confetti. Overview, Learn and Playground are linked in the header. Five harder book challenges follow the original lessons at slide indices 21–25.

## Run locally

From the repository root:

```sh
node website/scripts/build-website.mjs
node website/scripts/serve-website.mjs --port 8766
```

Open http://127.0.0.1:8766/. The server binds to localhost. Fonts and runtime assets are local; the separate installed site copy is `/Users/harry/Documents/ZX Online`.

## Artwork and exercises

The original introductory circuit image is static. The remaining original drawings use SVGs in the existing palette: rule illustrations animate individual transformations, with replay on the Learn artwork and a reduced-motion fallback. All exercise previews, including yanking, show static start/target pairs. Multistep exercise solutions never animate.

Only the original yanking, spider-fusion and identity-removal exercises open Nico’s editor. The other seven original exercises and all five book challenges remain static diagrams until his editor supports them. There are no added exercise controls, gesture instructions, hints or rewrite adapters.

The five added challenges come from *Picturing Quantum Software*: the larger bialgebra diagram in Eq. (3.70), Exercise 3.11, and the phase-gadget problems in Exercise 3.12(a), (d) and (b). Their starts and targets are stored in `course/graphs.json`. Independent mathematical checks and author proof records are retained separately from the website; they do not provide an editor implementation. There are no learner-facing source panels or word quizzes.

## Editor and progress

All 35 files under `src/` match upstream commit `55fbac4c1a02fb227c797460ec87fc3e333c11b0` exactly. The editor, gestures, rewrite operations and completion predicates are Nico’s unchanged implementation. The three lesson frames use `?embed=1&lesson=yanking`, `spider-fusion` or `identity-removal`; Playground uses `?embed=1`. The site listens for the original `zx-online:lesson-solved` message from the matching same-origin frame to retain confetti and Next.

The site’s corrected fusion target shows one green–red wire. Nico’s current built-in fusion completion still expects three parallel green–red wires; this upstream behavior is preserved rather than overridden by the website.

Navigation progress persists in local browser storage for that origin. **Unlock all** synchronizes Overview and already-open Learn tabs and permits skipping exercises without marking them solved or firing confetti. **Start over** resets navigation progress across those tabs. The site adds no editor attempt storage, undo or reset behavior. These navigation controls do not use an account or server-side progress store.

## Verification

Run the focused artwork and navigation checks:

```sh
node website/scripts/test-lesson-art.mjs
node website/scripts/test-lesson-progress.mjs
```

Check that the restored editor source is unchanged from upstream:

```sh
git diff --exit-code 55fbac4c1a02fb227c797460ec87fc3e333c11b0 -- src
```

Artwork tests cover finite curved geometry, static introduction and puzzle pairs, reduced motion, and the original lesson flow. Navigation tests cover the three original iframe URLs and completion messages, confetti, shared Unlock all and Start over, and unrestricted navigation through static exercises. Separate source-level smoke checks confirmed that Nico’s own operations can satisfy each of his three built-in completion predicates. Browser interaction and layout checks are separate from these automated tests.

The full upstream TypeScript/test suite still has pre-existing obsolete wire/parser API errors; this work does not claim to fix them.
