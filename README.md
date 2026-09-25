# Sitar Hero

A Baroque rhythm game set in a candlelit Hall of Mirrors, anno 1730. Jewels glide down a royal carpet; strike **D F J K** as they reach the gilded rings and hold the keys through silk ribbons. Every jewel is a note of the melody. Streaks bring in the orchestra, and misses muffle the melody and send a section home.

Everything is drawn on a canvas and synthesised with the Web Audio API. There are no samples, fonts, CDNs or runtime dependencies.

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # type-check with TypeScript 7, then bundle to dist/
npm run typecheck  # type-check only
npm run preview    # serve the production build
```

## Playing

| Key | Action |
| --- | --- |
| `D` `F` `J` `K` | Strike the ruby, sapphire, emerald and topaz lanes |
| hold | Sustain a ribbon until it ends |
| `Space` | Unleash **Fortissimo** once the gauge is at least half full |
| `Esc` / `P` | Intermission (pause) |

Lanes can be rebound to any keys from the Options screen. On touch screens, tap the lanes; tap the upper part of the screen for Fortissimo.

- **The orchestra.** The harpsichord always plays. Consecutive hits bring in the violoncello, strings, timpani and finally trumpets, with fireworks outside the windows. Each miss sends one section home and muffles your melody with a low-pass filter until you recover.
- **Notes.** Jewels are plain taps, held ribbons, chord gems (a double-stop struck with a neighbouring lane), gilded phrases, and — at Maestro — written-out ornaments in the melody itself.
- **Gilded phrases.** Jewels set in gold form a phrase. Play one without a miss to charge Fortissimo by 25%. Fortissimo brings in the full orchestra and doubles your points.
- **The Count's favour.** Misses drain it. If it runs dry you are dismissed from court, unless you granted yourself *Clemency* on the programme.
- **Levels.** *Amateur* plays the principal beats. *Virtuoso* plays every quaver and the odd chord gem. *Maestro* plays every semiquaver, adds chords each bar, and ornaments the melody with written-out Baroque mordents.
- **Timing.** Three judgments — Magnifique, Bravo, Passable — plus a miss. Strictness (Lenient/Standard/Strict, in Options) sets the windows. A press well before its jewel is a miss ("*Trop tôt!*"); a stray press just after a missed jewel is flagged as late ("*Trop tard!*").

Append `?autoplay` to the URL to watch the game play itself (useful for testing; autoplay runs are never recorded).

## Options

Reached from the title screen or with `O` from the programme. All settings persist to `localStorage`.

| Setting | What it does |
| --- | --- |
| Soloist | Which instrument plays the melody — the composer's own choice, or any instrument in the ensemble |
| Timing | Strictness of the judgment windows: Lenient, Standard or Strict |
| Key letters on the rings | Show or hide the letter engraved on each ring |
| Timing strip | A bar beneath the rings showing whether recent strikes were early or late |
| Jewel speed | How swiftly jewels glide down the carpet |
| Timing offset | Millisecond calibration, adjustable by hand or with a metronome (press Enter to calibrate) |
| Volume | Master volume |
| Miss sounds | The muffled thunk of a fumbled string |
| Effects | Full, or Reduced (turns off screen shake, fireworks and petal showers) |
| Lane keys | Rebind the four lane keys (press Enter, then the four keys left to right) |
| Records | Erase every saved best score and star rating |

### Menu keys

| Key | In the programme | In options |
| --- | --- | --- |
| `↑` `↓` | Move by one piece | Move between rows |
| `PgUp` `PgDn` | Jump to the previous/next era | — |
| `Home` `End` | First / last piece | — |
| `←` `→` | Change difficulty | Change the selected row's value |
| `Enter` | Begin the performance | Run the row's action (calibrate, rebind, erase) |
| `Esc` | Return to the title | Return |
| `S` / `T` / `C` / `O` / `I` | Cycle soloist / tempo, toggle Clemency, open Options, Import a Score | — |

## Importing scores

**Import a Score** on the title screen reads a Standard MIDI File and builds a chart from it (`src/music/midi.ts`): it picks the most melodic track, takes its skyline (the highest note at each onset), quantises it to twelfths of a beat, and infers chords for the accompaniment beat by beat. Imported scores are saved as base64 in `localStorage` (with an overall size budget) and appear under "Scores Brought from Abroad" in the programme.

## The programme

34 pieces across five eras, in concert order:

**The Baroque, 1700–1740** — Canon in D (Pachelbel) · Toccata and Fugue in D minor (Bach) · Prelude in C, WTC I (Bach) · Jesu, Joy of Man's Desiring (Bach) · Minuet in G (Petzold) · Spring, Summer, Autumn, Winter, from *The Four Seasons* (Vivaldi) · Badinerie (Bach)

**Prophecies of the Classical Age** — Rondo alla Turca (Mozart) · Eine kleine Nachtmusik (Mozart) · Moonlight Sonata (Beethoven) · Symphony No. 5 (Beethoven) · Für Elise (Beethoven) · Ode to Joy (Beethoven)

**Visions of the Romantic Century** — William Tell Overture (Rossini) · Nocturne in E-flat (Chopin) · Fantaisie-Impromptu (Chopin) · Minute Waltz (Chopin) · Infernal Galop (Offenbach) · The Blue Danube (Strauss II) · In the Hall of the Mountain King (Grieg) · Gymnopédie No. 1 (Satie)

**Dreams of a Distant Epoch** — The Entertainer (Joplin) · Clair de lune (Debussy)

**The Astrologer's Suite: The Planets** (Holst) — Mars, Venus, Mercury, Jupiter, Saturn, Uranus, Neptune, and the Jupiter theme as it stands alone at Thaxted ("I Vow to Thee, My Country")

These are simplified arrangements after the originals, which are all in the public domain.

## After the performance

Every run ends with a **Court Gazette** review (`src/ui/gazette.ts`): a headline, a randomly-cast critic, and a few sentences generated from your accuracy, timing bias, streaks, holds and how the orchestra built up — plus a **performance timeline** (`src/ui/timeline.ts`), a canvas strip showing each note's timing, misses, orchestra tier and any dismissal, across the whole piece.

## How it works

```
src/
  music/
    theory.ts     pitch names, chord symbols, voice leading
    notation.ts   tiny score notation ("F#5e. G5s | …") with per-bar validation
    songs.ts      the 34 pieces: melody, harmony, style (see library/*.ts, grouped by era)
    arrange.ts    builds the five accompaniment layers from the harmony
    chart.ts      turns the melody into gems per level: lane mapping, ribbons, chords, ornaments
    midi.ts       imports a Standard MIDI File into a playable score
  audio/
    karplus.ts    Karplus–Strong string with fractional tuning and a sitar "jawari" bridge buzz
    voices.ts     sitar, harpsichord, cello, strings, trumpets, timpani, piano, conductor's cane
    engine.ts     master bus, synthetic hall reverb, heard-time clock, per-performance buses
  game/game.ts    judging, scoring, streak tiers, ribbons, Fortissimo, favour
  render/         perspective camera, Hall of Mirrors, runway, gem sprites, particles, HUD
  ui/             menus (programme, options, how to play, import), the Gazette review, the timeline
  storage.ts      settings, best scores and imported scores, all in localStorage
```

- **One source of truth.** The chart and the music come from the same score. Notes too quick for your level still sound, as "followers" of the gem before them, and only if you hit that gem.
- **Timing.** Judging and drawing both use the moment audio actually reaches your ears (`AudioContext.getOutputTimestamp`), not the moment it is scheduled. Key presses are placed on that clock from their event timestamps.
