import type { ChordEvent, NoteEvent } from './notation';
import { TempoMap } from './tempo';
import { CHORD_TEMPLATES, estimateKey, type Chord } from './theory';
import { song, type Score, type SongDef } from './types';

/**
 * Standard MIDI File import.
 *
 * The hard part is not parsing but deciding what the player should play: we pick
 * the most melodic track (high, busy, mostly one note at a time), take its top
 * line, quantise it, and hand everything else to the accompaniment. Harmony for
 * the generated orchestra is inferred beat by beat from the accompaniment.
 */

interface RawNote {
  tick: number;
  end: number;
  pitch: number;
  vel: number;
  group: number;
}

interface Smf {
  ppq: number;
  notes: RawNote[];
  tempos: { tick: number; mpq: number }[];
  timeSig: { num: number; den: number } | null;
  groupNames: Map<number, string>;
}

export interface MidiImport {
  def: SongDef;
  score: Score;
}

const MAX_ACCOMPANIMENT_NOTES = 6000;

export function importMidi(buf: ArrayBuffer, fileName: string, id: string): MidiImport {
  const smf = parseSmf(buf);
  if (!smf.notes.length) throw new Error('This score contains no notes.');
  const ppq = smf.ppq;

  // 1 · Choose the melody group (track × channel).
  const groups = new Map<number, RawNote[]>();
  for (const n of smf.notes) {
    let g = groups.get(n.group);
    if (!g) groups.set(n.group, (g = []));
    g.push(n);
  }
  let best: { group: number; score: number } | null = null;
  for (const [group, ns] of groups) {
    ns.sort((a, b) => a.tick - b.tick);
    const mean = ns.reduce((s, n) => s + n.pitch, 0) / ns.length;
    let overlapping = 0;
    let lastEnd = -1;
    for (const n of ns) {
      if (n.tick < lastEnd - ppq / 16) overlapping++;
      lastEnd = Math.max(lastEnd, n.end);
    }
    const poly = overlapping / ns.length;
    const name = smf.groupNames.get(group) ?? '';
    const bonus = /melod|lead|solo|voice|vocal|sopran|right|flute|violin|trumpet/i.test(name) ? 1.6 : 1;
    const score = Math.sqrt(ns.length) * Math.max(1, mean - 48) * (1 - 0.5 * poly) * bonus;
    if (!best || score > best.score) best = { group, score };
  }
  const chosen = groups.get(best!.group)!;

  // 2 · Skyline: the highest note at each onset, cut short where the next begins.
  const onsetSlop = ppq / 24;
  const line: RawNote[] = [];
  for (let i = 0; i < chosen.length; ) {
    let top = chosen[i];
    let j = i + 1;
    for (; j < chosen.length && chosen[j].tick - chosen[i].tick <= onsetSlop; j++) if (chosen[j].pitch > top.pitch) top = chosen[j];
    line.push(top);
    i = j;
  }
  const inLine = new Set(line);

  // 3 · Quantise to twelfths of a beat (catches both semiquavers and triplets).
  const q = (tick: number) => Math.round((tick / ppq) * 12) / 12;
  const melody: NoteEvent[] = [];
  for (let i = 0; i < line.length; i++) {
    const n = line[i];
    const beat = q(n.tick);
    const nextBeat = i + 1 < line.length ? q(line[i + 1].tick) : Infinity;
    const end = Math.min(q(n.end), nextBeat);
    if (melody.length && Math.abs(melody[melody.length - 1].beat - beat) < 1e-6) continue;
    melody.push({ beat, dur: Math.max(1 / 12, end - beat), midi: n.pitch, vel: n.vel / 127 });
  }
  if (melody.length < 12) throw new Error('No melody could be found in this score.');

  // 4 · Everything else accompanies, loudest and longest first if there is too much of it.
  let accomp = smf.notes.filter((n) => !inLine.has(n));
  if (accomp.length > MAX_ACCOMPANIMENT_NOTES) {
    accomp = [...accomp].sort((a, b) => b.vel * (b.end - b.tick) - a.vel * (a.end - a.tick)).slice(0, MAX_ACCOMPANIMENT_NOTES);
  }
  const keysNotes = accomp
    .map((n) => ({ beat: q(n.tick), dur: Math.max(1 / 12, q(n.end) - q(n.tick)), midi: n.pitch, vel: n.vel / 127 }))
    .sort((a, b) => a.beat - b.beat);

  const lastBeat = Math.max(...smf.notes.map((n) => n.end)) / ppq;
  const num = smf.timeSig?.num ?? 4;
  const den = smf.timeSig?.den ?? 4;
  const beatsPerBar = (num * 4) / den;
  const pulse = den === 8 && num % 3 === 0 ? 1.5 : 1;
  const totalBeats = Math.ceil(lastBeat / beatsPerBar) * beatsPerBar;

  // 5 · Harmony, one pulse at a time.
  const chords = inferChords(keysNotes, melody, totalBeats, pulse);

  // 6 · Key, from every note weighted by length.
  const hist = new Array(12).fill(0);
  for (const n of smf.notes) hist[n.pitch % 12] += n.end - n.tick;
  const { tonic } = estimateKey(hist);

  const tempo = new TempoMap(
    (smf.tempos.length ? smf.tempos : [{ tick: 0, mpq: 500000 }]).map((t, i) => ({ beat: i === 0 ? 0 : t.tick / ppq, bpm: 60_000_000 / t.mpq })),
  );
  const title = fileName.replace(/\.(mid|midi)$/i, '').replace(/[_-]+/g, ' ').trim() || 'Imported score';
  const trackName = smf.groupNames.get(best!.group);
  const def = song({
    id, title, composer: 'Imported score', year: '', era: 'imported',
    subtitle: trackName ? `melody from “${trackName}”` : 'melody from the uppermost voice',
    blurb: `${melody.length} melody notes and ${keysNotes.length} accompanying notes, brought from abroad.`,
    bpm: Math.round(tempo.initialBpm), beatsPerBar, pulse, tonic,
    melody: '', chords: '', keys: 'grand', keysStyle: 'explicit', lead: 'grand',
  });
  return { def, score: { melody, chords, bass: [], keysNotes, tempo, totalBeats } };
}

function inferChords(accomp: (NoteEvent & { vel: number })[], melody: NoteEvent[], totalBeats: number, step: number): ChordEvent[] {
  const out: ChordEvent[] = [];
  let a = 0;
  let prev: Chord | null = null;
  const hist = new Float64Array(12);
  for (let b = 0; b < totalBeats - 1e-6; b += step) {
    hist.fill(0);
    let lowest = 999;
    while (a < accomp.length && accomp[a].beat + accomp[a].dur < b - 8) a++;
    for (let i = a; i < accomp.length && accomp[i].beat < b + step; i++) {
      const n = accomp[i];
      const overlap = Math.min(n.beat + n.dur, b + step) - Math.max(n.beat, b);
      if (overlap <= 0) continue;
      hist[n.midi % 12] += overlap * (0.5 + n.vel);
      if (n.midi < lowest) lowest = n.midi;
    }
    for (const n of melody) {
      if (n.beat >= b + step) break;
      const overlap = Math.min(n.beat + n.dur, b + step) - Math.max(n.beat, b);
      if (overlap > 0) hist[n.midi % 12] += overlap * 0.3;
    }
    let total = 0;
    for (let i = 0; i < 12; i++) total += hist[i];
    let chord: Chord | null = prev;
    if (total > 0) {
      let bestScore = -Infinity;
      for (let root = 0; root < 12; root++) {
        for (const t of CHORD_TEMPLATES) {
          const tones = t.intervals.map((i) => (root + i) % 12);
          let s = 0;
          for (let pc = 0; pc < 12; pc++) s += tones.includes(pc) ? hist[pc] : -0.35 * hist[pc];
          // Prefer triads over sevenths when the evidence is equal.
          s -= tones.length > 3 ? 0.05 * total : 0;
          if (s > bestScore) {
            bestScore = s;
            chord = { root, tones, bass: lowest < 999 ? lowest % 12 : root };
          }
        }
      }
    }
    const same = prev && chord && prev.root === chord.root && prev.bass === chord.bass && prev.tones.length === chord.tones.length && prev.tones.every((t, i) => t === chord!.tones[i]);
    if (same && out.length) out[out.length - 1].dur += step;
    else out.push({ beat: b, dur: step, chord });
    prev = chord;
  }
  return out;
}

// ─── Standard MIDI File parsing ───────────────────────────────────────────

function parseSmf(buf: ArrayBuffer): Smf {
  const data = new DataView(buf);
  let pos = 0;
  const str = (n: number) => {
    let s = '';
    for (let i = 0; i < n; i++) s += String.fromCharCode(data.getUint8(pos + i));
    pos += n;
    return s;
  };
  if (buf.byteLength < 14 || str(4) !== 'MThd') throw new Error('This does not appear to be a MIDI file.');
  const headerLen = data.getUint32(pos);
  pos += 4;
  const ntracks = data.getUint16(pos + 2);
  const division = data.getUint16(pos + 4);
  pos += headerLen;
  if (division & 0x8000) throw new Error('SMPTE-timed MIDI files are not supported.');
  const ppq = division;

  const notes: RawNote[] = [];
  const tempos: { tick: number; mpq: number }[] = [];
  let timeSig: { num: number; den: number } | null = null;
  const groupNames = new Map<number, string>();

  for (let track = 0; track < ntracks && pos + 8 <= buf.byteLength; track++) {
    const id = str(4);
    const len = data.getUint32(pos);
    pos += 4;
    const end = Math.min(buf.byteLength, pos + len);
    if (id !== 'MTrk') {
      pos = end;
      continue;
    }
    let tick = 0;
    let status = 0;
    let trackName = '';
    const open = new Map<number, { tick: number; vel: number }[]>();
    const vlq = () => {
      let v = 0;
      for (let i = 0; i < 4; i++) {
        const b = data.getUint8(pos++);
        v = (v << 7) | (b & 0x7f);
        if (!(b & 0x80)) break;
      }
      return v;
    };
    while (pos < end) {
      tick += vlq();
      let b = data.getUint8(pos);
      if (b & 0x80) {
        status = b;
        pos++;
      } else if (!status) {
        throw new Error('This MIDI file is damaged.');
      }
      b = status;
      if (b === 0xff) {
        const type = data.getUint8(pos++);
        const l = vlq();
        if (type === 0x51 && l === 3) {
          tempos.push({ tick, mpq: (data.getUint8(pos) << 16) | (data.getUint8(pos + 1) << 8) | data.getUint8(pos + 2) });
        } else if (type === 0x58 && l >= 2 && !timeSig) {
          timeSig = { num: data.getUint8(pos), den: 2 ** data.getUint8(pos + 1) };
        } else if (type === 0x03 || type === 0x04) {
          let s = '';
          for (let i = 0; i < l; i++) s += String.fromCharCode(data.getUint8(pos + i));
          if (!trackName) trackName = s.trim();
        }
        pos += l;
        status = 0;
        continue;
      }
      if (b === 0xf0 || b === 0xf7) {
        pos += vlq();
        status = 0;
        continue;
      }
      const type = b & 0xf0;
      const channel = b & 0x0f;
      const d1 = data.getUint8(pos++);
      const d2 = type === 0xc0 || type === 0xd0 ? 0 : data.getUint8(pos++);
      if (channel === 9) continue; // percussion
      const group = track * 16 + channel;
      const key = group * 128 + d1;
      if (type === 0x90 && d2 > 0) {
        let stack = open.get(key);
        if (!stack) open.set(key, (stack = []));
        stack.push({ tick, vel: d2 });
      } else if (type === 0x80 || (type === 0x90 && d2 === 0)) {
        const on = open.get(key)?.shift();
        if (on && tick > on.tick) notes.push({ tick: on.tick, end: tick, pitch: d1, vel: on.vel, group });
      }
    }
    pos = end;
    if (trackName) for (let ch = 0; ch < 16; ch++) groupNames.set(track * 16 + ch, trackName);
  }
  tempos.sort((a, b) => a.tick - b.tick);
  return { ppq, notes, tempos, timeSig, groupNames };
}
