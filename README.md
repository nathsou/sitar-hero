# Sitar Hero

A four-lane classical rhythm game dressed as an eighteenth-century music salon. Choose a piece, then press **D**, **F**, **J**, or **K** when its approaching jeweled notes reach the gilded rings. The on-screen keys also work with a pointer or touch.

In the programme, **D/F** choose a piece or adjust the highlighted slider, **J/K** move between the piece list, difficulty, speed, and start button, and **Space** starts immediately. Previews are on by default: the selected piece plays automatically, crossfades to the next selection, and loops until you begin. **L** toggles previews. Browser autoplay rules may require the first key press or click before sound begins. During play, **Space** pauses. In the pause menu, **J** resumes and **K** returns to the programme. On the results screen, **J** replays and **K** returns to the programme. **Shift+F** toggles full screen; the visible buttons, Tab, and standard slider arrow keys also work.

Difficulty 1–5 adjusts the number of notes to play, and speed 0.70×–1.50× changes both music playback and the moving chart. Each piece remembers its own settings in local storage. There is a five-second countdown before the first note.

Each chart follows the score's lead MIDI part. Music is scheduled on the score's exact timing; hits restore the melody, and missed or off-beat strikes fade it until the next successful hit. Hits do not retrigger late notes or add unrelated harmonies. The piece begins as a solo melody: accompaniment voices join at streaks of 5, 12, 20, and 28 hits, then fade out immediately after a mistake. The current streak and next voice are shown on the stage. The stage and hit windows use the browser's audio output timestamp to stay aligned with what reaches the speakers.

Perfect, great, and good hits earn 1,000, 650, and 350 points, plus a streak bonus. The result screen shows your accuracy and best streak. Personal bests are saved in local storage for each piece, difficulty, and speed setting, and appear in the programme when you return.

## Run locally

```bash
npm install
npm run dev
```

For a production build, run `npm run build`, then `npm run preview`. Melody regression checks run with `node tests/music.test.mjs` (Node 24).

The only direct dependencies are Vite and TypeScript. The game reads Standard MIDI Files itself and synthesizes the music with the browser's Web Audio API. Each performance continues to the end of its MIDI file, starting at the melody entrance for Canon, Moonlight Sonata, and Spring. Thirty libre MIDI editions are bundled in `public/midi`, including all seven movements of Holst’s *The Planets*, Satie’s *Gymnopédie No. 1*, and ten more classical and ragtime pieces. The Holst movements are curated reductions of public-domain scores; each plays to its end. Original links, attribution, licenses, and the reduction method are recorded in [public/midi/README.md](public/midi/README.md).

The source files can be used offline after the application has been built. The optional web font falls back to installed serif fonts when unavailable.

## GitHub Pages

Pushing `main` runs the MIDI checks, builds the game, and deploys `dist` through GitHub Actions. Set **Settings → Pages → Build and deployment → Source** to **GitHub Actions** in the repository. Once the first deployment succeeds, play at [nathsou.github.io/sitar-hero](https://nathsou.github.io/sitar-hero/).

The Vite production base is `/sitar-hero/`; local development continues to run at `/`.
