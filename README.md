# Sitar Hero

A Baroque rhythm game set in a candlelit Hall of Mirrors, anno 1730. Jewels glide down a royal carpet; strike **D F J K** as they reach the gilded rings and hold the keys through silk ribbons. Every jewel is a note of the melody. Streaks bring in the orchestra, and misses muffle the melody and send a section home.

Everything is drawn on a canvas and synthesised with the Web Audio API. There are no samples, fonts, CDNs or runtime dependencies.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check with TypeScript 7, then bundle to dist/
```

## Playing

| Key | Action |
| --- | --- |
| `D` `F` `J` `K` | Strike the ruby, sapphire, emerald and topaz lanes |
| hold | Sustain a ribbon until it ends |
| `Space` | Unleash **Fortissimo** once the gauge is at least half full |
| `Esc` / `P` | Intermission (pause) |

On touch screens, tap the lanes. Tap the upper part of the screen for Fortissimo.

- **The orchestra.** The harpsichord always plays. Consecutive hits bring in the violoncello, strings, timpani and finally trumpets, with fireworks outside the windows. Each miss sends one section home and muffles your melody with a low-pass filter until you recover.
- **Gilded phrases.** Jewels set in gold form a phrase. Play one without a miss to charge Fortissimo by 25%. Fortissimo brings in the full orchestra and doubles your points.
- **The Count's favour.** Misses drain it. If it runs dry you are dismissed from court, unless you granted yourself *Clemency* on the programme.
- **Levels.** *Amateur* plays the principal beats and *Virtuoso* every quaver. *Maestro* plays every semiquaver and adds written-out Baroque ornaments (mordents).
- **Tuning & Calibration** sets jewel speed and volume. It also has a metronome that measures your timing offset.

Append `?autoplay` to the URL to watch the game play itself (useful for testing; autoplay runs are never recorded).

## The programme

| | Piece | Composer | Metre |
| --- | --- | --- | --- |
| I | Minuet in G | Christian Petzold, c. 1725 | 3/4 |
| II | Canon in D | Johann Pachelbel, c. 1700 | 4/4 |
| III | Spring (*La Primavera*), I. Allegro | Antonio Vivaldi, 1725 | 4/4 |
| IV | Badinerie | J. S. Bach, c. 1739 | 2/4 |

These are simplified arrangements after the originals, which are all in the public domain.

## How it works

```
src/
  music/
    theory.ts     pitch names, chord symbols, voice leading
    notation.ts   tiny score notation ("F#5e. G5s | …") with per-bar validation
    songs.ts      the four pieces: melody, harmony, style
    arrange.ts    builds the five accompaniment layers from the harmony
    chart.ts      turns the melody into gems per level: lane mapping by pitch contour, ribbons, ornaments
  audio/
    karplus.ts    Karplus–Strong string with fractional tuning and a sitar "jawari" bridge buzz
    voices.ts     sitar, harpsichord, cello, strings, trumpets, timpani, conductor's cane
    engine.ts     master bus, synthetic hall reverb, heard-time clock, per-performance buses
  game/game.ts    judging, scoring, streak tiers, ribbons, Fortissimo, favour
  render/         perspective camera, Hall of Mirrors, runway, gem sprites, particles, HUD
  ui/             menus (programme, calibration, how to play) and the Court Gazette review
```

- **One source of truth.** The chart and the music come from the same score. Notes too quick for your level still sound, as "followers" of the gem before them, and only if you hit that gem.
- **Timing.** Judging and drawing both use the moment audio actually reaches your ears (`AudioContext.getOutputTimestamp`), not the moment it is scheduled. Key presses are placed on that clock from their event timestamps.
