// Validate the song library outside the browser, and optionally print a song's melody bar by bar.
//   node scripts/check-songs.mjs            check every song (bar lengths, parsing, charts)
//   node scripts/check-songs.mjs mars venus also print those songs' melodies with their chords
import { createServer } from 'vite';

const server = await createServer({ server: { middlewareMode: true, hmr: false }, appType: 'custom', logLevel: 'error' });
const warnings = [];
console.warn = (...a) => warnings.push(a.join(' '));
let failed = false;
try {
  const { SONGS } = await server.ssrLoadModule('/src/music/songs.ts');
  const { compileSong, parseScore } = await server.ssrLoadModule('/src/music/arrange.ts');
  const { buildChart } = await server.ssrLoadModule('/src/music/chart.ts');
  const show = new Set(process.argv.slice(2));
  const NAMES = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'];
  const name = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}`;
  const fmt = (x) => String(Math.round(x * 1000) / 1000);
  for (const def of SONGS) {
    const before = warnings.length;
    try {
      const score = parseScore(def);
      const song = compileSong(def, 1, score);
      const counts = ['amateur', 'virtuoso', 'maestro'].map((d) => buildChart(song, d).notes.length);
      const lo = Math.min(...song.melody.map((n) => n.midi));
      const hi = Math.max(...song.melody.map((n) => n.midi));
      console.log(`${def.id.padEnd(12)} ${fmt(song.length).padStart(7)}s  ${String(song.melody.length).padStart(4)} notes  range ${name(lo)}–${name(hi)}  gems ${counts.join('/')}`);
      if (show.has(def.id)) {
        const bpb = def.beatsPerBar;
        const off = def.pickup ?? 0;
        let bar = -1;
        let line = '';
        for (const n of score.melody) {
          const b = Math.floor((n.beat - off + 1e-6) / bpb);
          if (b !== bar) {
            if (line) console.log(line);
            bar = b;
            const ch = score.chords.filter((c) => c.beat < (b + 1) * bpb + off && c.beat + c.dur > b * bpb + off && c.chord).map((c) => c.chord.root);
            line = `  ${String(b + 1).padStart(3)} [${[...new Set(ch)].map((r) => NAMES[r]).join(' ')}]`;
          }
          line += ` ${name(n.midi)}:${fmt(n.dur)}`;
        }
        if (line) console.log(line);
      }
    } catch (e) {
      failed = true;
      console.log(`${def.id.padEnd(12)} ERROR ${e.message}`);
    }
    for (const w of warnings.slice(before)) {
      failed = true;
      console.log(`${' '.repeat(13)}WARN ${w}`);
    }
  }
} finally {
  await server.close();
}
process.exit(failed ? 1 : 0);
