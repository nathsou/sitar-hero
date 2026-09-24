export interface MidiNote {
  pitch: number;
  time: number;
  duration: number;
  velocity: number;
  channel: number;
  track: number;
}

export interface ParsedMidi {
  notes: MidiNote[];
  duration: number;
}

interface RawEvent {
  tick: number;
  kind: 'on' | 'off' | 'tempo';
  channel?: number;
  track?: number;
  pitch?: number;
  velocity?: number;
  tempo?: number;
  order: number;
}

// A compact Standard MIDI File reader. It supports format 0/1, running status,
// tempo changes, and note events. Percussion (channel 10) is skipped.
export function parseMidi(buffer: ArrayBuffer): ParsedMidi {
  const data = new DataView(buffer);
  let pos = 0;
  const u8 = () => data.getUint8(pos++);
  const u16 = () => { const n = data.getUint16(pos); pos += 2; return n; };
  const u32 = () => { const n = data.getUint32(pos); pos += 4; return n; };
  const str = (n: number) => Array.from({ length: n }, () => String.fromCharCode(u8())).join('');
  const varInt = () => {
    let value = 0;
    let byte: number;
    do { byte = u8(); value = (value << 7) | (byte & 0x7f); } while (byte & 0x80);
    return value;
  };

  if (str(4) !== 'MThd') throw new Error('This is not a Standard MIDI File.');
  const headerSize = u32();
  const format = u16();
  const trackCount = u16();
  const division = u16();
  pos = 8 + headerSize;
  if (format > 1 || division & 0x8000) throw new Error('Unsupported MIDI timing format.');
  const events: RawEvent[] = [];
  let order = 0;

  for (let track = 0; track < trackCount; track++) {
    if (str(4) !== 'MTrk') throw new Error('A MIDI track is missing.');
    const trackSize = u32();
    const end = pos + trackSize;
    let tick = 0;
    let running = 0;
    while (pos < end) {
      tick += varInt();
      let status = data.getUint8(pos);
      if (status & 0x80) { pos++; if (status < 0xf0) running = status; }
      else { status = running; if (!status) throw new Error('Invalid MIDI running status.'); }

      if (status === 0xff) {
        const type = u8();
        const length = varInt();
        if (type === 0x51 && length === 3) {
          const tempo = (u8() << 16) | (u8() << 8) | u8();
          events.push({ tick, kind: 'tempo', tempo, order: order++ });
        } else pos += length;
      } else if (status === 0xf0 || status === 0xf7) {
        pos += varInt();
      } else {
        const kind = status & 0xf0;
        const channel = status & 0x0f;
        const first = u8();
        const second = kind === 0xc0 || kind === 0xd0 ? 0 : u8();
        if (channel !== 9 && (kind === 0x90 || kind === 0x80)) {
          events.push({ tick, kind: kind === 0x90 && second > 0 ? 'on' : 'off', channel, track, pitch: first, velocity: second, order: order++ });
        }
      }
    }
    pos = end;
  }

  events.sort((a, b) => a.tick - b.tick || (a.kind === 'tempo' ? -1 : b.kind === 'tempo' ? 1 : 0) || a.order - b.order);
  let lastTick = 0;
  let seconds = 0;
  let tempo = 500000;
  const active = new Map<string, { time: number; velocity: number }[]>();
  const notes: MidiNote[] = [];
  for (const event of events) {
    seconds += (event.tick - lastTick) * tempo / division / 1_000_000;
    lastTick = event.tick;
    if (event.kind === 'tempo') { tempo = event.tempo || tempo; continue; }
    const channel = event.channel!;
    const pitch = event.pitch!;
    const key = `${event.track}:${channel}:${pitch}`;
    if (event.kind === 'on') {
      const stack = active.get(key) || [];
      stack.push({ time: seconds, velocity: event.velocity! });
      active.set(key, stack);
    } else {
      const start = active.get(key)?.shift();
      if (start) notes.push({ pitch, time: start.time, duration: Math.max(0.05, seconds - start.time), velocity: start.velocity, channel, track: event.track! });
    }
  }
  if (!notes.length) throw new Error('This MIDI contains no playable notes.');
  notes.sort((a, b) => a.time - b.time || b.pitch - a.pitch);
  return { notes, duration: Math.max(...notes.map(n => n.time + n.duration)) };
}
