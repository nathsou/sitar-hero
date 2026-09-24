import type { MidiNote } from './midi';

export const ACCOMPANIMENT_STREAKS = [5, 12, 20, 28];

export type AccompanimentLayer = { name: string; notes: MidiNote[]; unlockAt: number };

export function buildAccompanimentLayers(notes: MidiNote[], melody: Set<MidiNote>): AccompanimentLayer[] {
  const parts = new Map<string, MidiNote[]>();
  for (const note of notes) {
    if (melody.has(note)) continue;
    const key = `${note.track}:${note.channel}`;
    const part = parts.get(key) || [];
    part.push(note);
    parts.set(key, part);
  }

  let groups = [...parts.values()];
  // A two-hand keyboard part is often stored in one MIDI track. Give its low
  // and high notes separate entrances so the arrangement can build in stages.
  if (groups.length === 1 && groups[0].length >= 16) {
    const sortedPitches = groups[0].map(note => note.pitch).sort((a, b) => a - b);
    const split = sortedPitches[Math.floor(sortedPitches.length / 2)];
    const low = groups[0].filter(note => note.pitch <= split);
    const high = groups[0].filter(note => note.pitch > split);
    if (low.length >= 4 && high.length >= 4) groups = [low, high];
  }

  groups.sort((a, b) => averagePitch(a) - averagePitch(b));
  return groups.map((part, index) => ({
    name: index === 0 ? 'BASS' : index === 1 ? 'HARMONY' : `VOICE ${index + 1}`,
    notes: part,
    unlockAt: ACCOMPANIMENT_STREAKS[Math.min(index, ACCOMPANIMENT_STREAKS.length - 1)],
  }));
}

function averagePitch(notes: MidiNote[]) {
  return notes.reduce((sum, note) => sum + note.pitch, 0) / notes.length;
}
