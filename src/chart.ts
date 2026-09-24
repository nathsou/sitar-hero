import type { MidiNote } from './midi';

export type ChartNote = {
  time: number;
  lane: number;
  source: MidiNote;
  status: 'pending' | 'hit' | 'miss';
};

export function makeChart(notes: MidiNote[], length: number, difficulty = 3, preferredLeadTrack?: number, mode?: 'sustained'): { chart: ChartNote[]; leadTrack: number; melody: MidiNote[] } {
  const byTrack = new Map<number, MidiNote[]>();
  for (const note of notes) {
    if (note.time > length) break;
    const track = byTrack.get(note.track) || [];
    track.push(note);
    byTrack.set(note.track, track);
  }
  const leads = [...byTrack].filter(([, track]) => track.length >= 8);
  if (!leads.length) throw new Error('This score has no playable lead part.');
  // These editions separate melody and accompaniment into MIDI tracks.
  // The highest substantial part is the one the player performs.
  leads.sort((a, b) => {
    const avg = (track: MidiNote[]) => track.reduce((sum, note) => sum + note.pitch, 0) / track.length;
    return avg(b[1]) - avg(a[1]);
  });
  const [leadTrack, leadNotes] = leads.find(([track]) => track === preferredLeadTrack) || leads[0];
  const candidates: MidiNote[] = [];
  let group: MidiNote[] = [];
  const flush = () => {
    if (!group.length) return;
    candidates.push(group.reduce((a, b) => a.pitch > b.pitch ? a : b));
    group = [];
  };
  for (const note of leadNotes) {
    // This Moonlight edition merges the upper voice with its triplets.
    // The melody uses quarters/dotted rhythms; triplets last exactly 1/3s.
    if (mode === 'sustained' && note.duration > 0.30 && note.duration < 0.36) continue;
    if (group.length && note.time - group[0].time > 0.055) flush();
    group.push(note);
  }
  flush();
  const spaced: MidiNote[] = [];
  let sounding: MidiNote | undefined;
  for (const note of candidates) {
    if (sounding && note.time < sounding.time + sounding.duration - 0.035 && note.pitch < sounding.pitch) continue;
    sounding = note;
    if (!spaced.length || note.time - spaced[spaced.length - 1].time >= 0.12) spaced.push(note);
  }
  const density = [0.42, 0.56, 0.70, 0.84, 1][Math.max(0, Math.min(4, Math.round(difficulty) - 1))];
  // A low-discrepancy pattern thins the same lead phrase evenly at easier levels.
  // Higher levels add notes without changing the notes already learned.
  const playable = spaced.filter((_, i) => i === 0 || ((i * 0.61803398875) % 1) < density);
  const pitches = [...new Set(spaced.map(note => note.pitch))].sort((a, b) => a - b);
  return {
    leadTrack,
    melody: spaced,
    chart: playable.map(source => ({
      time: source.time,
      lane: Math.min(3, Math.floor(pitches.indexOf(source.pitch) * 4 / pitches.length)),
      source,
      status: 'pending',
    })),
  };
}
