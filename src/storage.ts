import type { Difficulty } from './music/chart';
import type { LeadKind } from './music/types';

export type Strictness = 'lenient' | 'standard' | 'strict';
export type Soloist = 'composer' | LeadKind;

export interface Settings {
  /** Seconds a gem takes to travel the floor. */
  approach: number;
  /** Calibration offset in milliseconds (positive = you play late). */
  offsetMs: number;
  volume: number;
  missSounds: boolean;
  soloist: Soloist;
  strictness: Strictness;
  showKeyLetters: boolean;
  showTimingStrip: boolean;
  effects: 'full' | 'reduced';
  /** KeyboardEvent.code for each lane, and the label engraved on its ring. */
  laneCodes: string[];
  laneLabels: string[];
}

export interface ScoreRecord {
  score: number;
  stars: number;
  accuracy: number;
  maxStreak: number;
}

export interface ImportedScore {
  id: string;
  name: string;
  /** The MIDI file, base64-encoded. */
  data: string;
}

interface Saved {
  settings: Settings;
  records: { [song: string]: Partial<{ [d in Difficulty]: ScoreRecord }> };
  lastSong?: string;
  lastDifficulty?: Difficulty;
}

const KEY = 'sitar-hero:v1';
const IMPORTS_KEY = 'sitar-hero:imports';
/** Keep stored MIDI files small enough not to crowd out everything else. */
const IMPORTS_BUDGET_CHARS = 1_500_000;

export const DEFAULT_SETTINGS: Settings = {
  approach: 1.7,
  offsetMs: 0,
  volume: 0.85,
  missSounds: true,
  soloist: 'composer',
  strictness: 'standard',
  showKeyLetters: true,
  showTimingStrip: true,
  effects: 'full',
  laneCodes: ['KeyD', 'KeyF', 'KeyJ', 'KeyK'],
  laneLabels: ['D', 'F', 'J', 'K'],
};

function read<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

function write(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    // Storage unavailable or full; the data lasts only for this visit.
    return false;
  }
}

function load(): Saved {
  const parsed = read<Partial<Saved>>(KEY);
  const settings = { ...DEFAULT_SETTINGS, ...parsed?.settings };
  if (settings.laneCodes?.length !== 4 || settings.laneLabels?.length !== 4) {
    settings.laneCodes = [...DEFAULT_SETTINGS.laneCodes];
    settings.laneLabels = [...DEFAULT_SETTINGS.laneLabels];
  }
  return { settings, records: parsed?.records ?? {}, lastSong: parsed?.lastSong, lastDifficulty: parsed?.lastDifficulty };
}

const saved = load();
let imports: ImportedScore[] = read<ImportedScore[]>(IMPORTS_KEY) ?? [];

const persist = () => write(KEY, saved);

export const store = {
  get settings(): Readonly<Settings> {
    return saved.settings;
  },
  updateSettings(patch: Partial<Settings>) {
    Object.assign(saved.settings, patch);
    persist();
  },
  record(song: string, d: Difficulty): ScoreRecord | undefined {
    return saved.records[song]?.[d];
  },
  /** Saves if it beats the previous best; returns true for a new record. */
  submit(song: string, d: Difficulty, r: ScoreRecord): boolean {
    const prev = saved.records[song]?.[d];
    if (prev && prev.score >= r.score) return false;
    saved.records[song] = { ...saved.records[song], [d]: r };
    persist();
    return true;
  },
  clearRecords() {
    saved.records = {};
    persist();
  },
  get last() {
    return { song: saved.lastSong, difficulty: saved.lastDifficulty };
  },
  setLast(song: string, d: Difficulty) {
    saved.lastSong = song;
    saved.lastDifficulty = d;
    persist();
  },
  get imports(): readonly ImportedScore[] {
    return imports;
  },
  /** Remember an imported score; returns false if it could only be kept for this visit. */
  addImport(score: ImportedScore): boolean {
    imports = [...imports.filter((s) => s.id !== score.id), score];
    // Drop the oldest imports until they fit the budget.
    while (imports.length > 1 && imports.reduce((n, s) => n + s.data.length, 0) > IMPORTS_BUDGET_CHARS) imports.shift();
    return write(IMPORTS_KEY, imports);
  },
  removeImport(id: string) {
    imports = imports.filter((s) => s.id !== id);
    write(IMPORTS_KEY, imports);
  },
};
