import { AudioEngine } from '../audio/engine';
import { bufferKindFor, type BufferKind } from '../audio/voices';
import { Game, STRICTNESS } from '../game/game';
import { compileSong, parseScore, type CompiledSong } from '../music/arrange';
import { DIFFICULTIES, buildChart, type Difficulty } from '../music/chart';
import { importMidi } from '../music/midi';
import { ERAS, SONGS } from '../music/songs';
import { LEAD_NAMES, type LeadKind, type Score, type SongDef } from '../music/types';
import type { Renderer } from '../render/renderer';
import { store, type Soloist, type Strictness } from '../storage';
import { gazetteDate, writeReview } from './gazette';
import { drawTimeline, type TimelineData } from './timeline';

const SPEEDS = [1, 0.75, 0.5];
/** Harpsichord notes for menu navigation (a G major pentatonic). */
const TICKS = [67, 69, 71, 74, 76, 79, 81];
const LEADS: LeadKind[] = ['sitar', 'harpsichord', 'piano', 'grand', 'violin', 'guitar', 'organ', 'flute', 'trumpet'];
const SOLOISTS: Soloist[] = ['composer', ...LEADS];
const STRICTNESSES: Strictness[] = ['lenient', 'standard', 'strict'];
const LANE_NAMES = ['ruby', 'sapphire', 'emerald', 'topaz'];
/** Keys that can never be lane keys: they drive the menus and Fortissimo. */
const RESERVED = new Set(['Escape', 'Enter', 'NumpadEnter', 'Space', 'Tab']);
const TEMPO_NAMES = ['Largo', 'Largo', 'Adagio', 'Andante', 'Andante', 'Moderato', 'Moderato', 'Allegro', 'Allegro', 'Presto', 'Prestissimo'];

type Mode = 'title' | 'programme' | 'options' | 'howto' | 'import' | 'loading' | 'play' | 'pause' | 'results';

interface Entry {
  def: SongDef;
  /** Imported scores carry their parsed score; notated ones are parsed on demand. */
  score?: Score;
  stats?: { grade: number; seconds: number };
}

interface Selection {
  index: number;
  difficulty: Difficulty;
  speed: number;
  noFail: boolean;
}

interface OptionRow {
  label: string;
  value: () => string;
  desc?: () => string;
  step?: (dir: 1 | -1) => void;
  act?: () => void;
  actLabel?: string;
}

const esc = (s: string) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]!);

function roman(n: number): string {
  const table: [number, string][] = [[40, 'XL'], [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']];
  let out = '';
  for (const [v, s] of table) while (n >= v) (out += s), (n -= v);
  return out;
}

function meterLabel(def: SongDef): string {
  if (def.pulse === 1.5) return `${def.beatsPerBar * 2}/8`;
  if (!Number.isInteger(def.beatsPerBar)) return `${def.beatsPerBar * 2}/8`;
  return `${def.beatsPerBar}/4`;
}

const clock = (s: number) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
const fleurons = (n: number) => `${'❦'.repeat(n)}<span class="off">${'❦'.repeat(5 - n)}</span>`;
const stars = (n: number) => `${'★'.repeat(n)}<span class="off">${'★'.repeat(5 - n)}</span>`;

function keyLabel(e: KeyboardEvent): string {
  const arrows: Record<string, string> = { ArrowLeft: '←', ArrowRight: '→', ArrowUp: '↑', ArrowDown: '↓' };
  if (arrows[e.code]) return arrows[e.code];
  if (e.code === 'Space') return 'Space';
  if (e.key.length === 1) return e.key.toUpperCase();
  return e.code.replace(/^(Key|Digit|Numpad)/, '').replace(/(Left|Right)$/, '').slice(0, 5);
}

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

function fromBase64(b64: string): ArrayBuffer {
  const s = atob(b64);
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) bytes[i] = s.charCodeAt(i);
  return bytes.buffer;
}

/** FNV-1a, for stable ids of imported files. */
function hashBytes(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let h = 0x811c9dc5;
  for (let i = 0; i < bytes.length; i++) h = Math.imul(h ^ bytes[i], 0x01000193);
  return (h >>> 0).toString(16);
}

export class App {
  private readonly ui = document.getElementById('ui')!;
  private engine: AudioEngine | null = null;
  private mode: Mode = 'title';
  private game: Game | null = null;
  private keyHandler: ((e: KeyboardEvent) => void) | null = null;
  private readonly pointerLanes = new Map<number, number>();
  private tickIndex = 0;
  private readonly catalogue: Entry[] = SONGS.map((def) => ({ def }));
  private readonly sel: Selection;
  private timeline: TimelineData | null = null;

  constructor(
    private readonly canvas: HTMLCanvasElement,
    private readonly renderer: Renderer,
  ) {
    for (const imp of store.imports) {
      try {
        const { def, score } = importMidi(fromBase64(imp.data), imp.name, imp.id);
        this.catalogue.push({ def, score });
      } catch {
        store.removeImport(imp.id);
      }
    }
    const last = store.last;
    this.sel = {
      index: Math.max(0, this.catalogue.findIndex((e) => e.def.id === last.song)),
      difficulty: last.difficulty ?? 'amateur',
      speed: 1,
      noFail: false,
    };
    this.applyDisplay();

    window.addEventListener('keydown', (e) => this.onKeyDown(e));
    window.addEventListener('keyup', (e) => this.onKeyUp(e));
    window.addEventListener('blur', () => this.mode === 'play' && this.pause());
    window.addEventListener('resize', () => this.mode === 'results' && this.redrawTimeline());
    document.addEventListener('visibilitychange', () => document.hidden && this.mode === 'play' && this.pause());
    canvas.addEventListener('pointerdown', (e) => this.onPointerDown(e));
    canvas.addEventListener('pointerup', (e) => this.onPointerUp(e));
    canvas.addEventListener('pointercancel', (e) => this.onPointerUp(e));
    this.ui.addEventListener('focusin', (e) => {
      const t = e.target as HTMLElement;
      if (t.tagName === 'BUTTON' || t.classList.contains('opt')) this.tick();
    });

    this.showTitle();
  }

  // ─── Plumbing ───────────────────────────────────────────────────────────

  private async ensureEngine(): Promise<AudioEngine> {
    if (!this.engine) {
      this.engine = new AudioEngine();
      this.engine.setVolume(store.settings.volume);
      if (import.meta.env.DEV) Object.assign(window, { __engine: this.engine });
    }
    await this.engine.unlock();
    return this.engine;
  }

  private isMode(mode: Mode): boolean {
    return this.mode === mode;
  }

  private applyDisplay() {
    const s = store.settings;
    this.renderer.configure({
      labels: s.showKeyLetters ? s.laneLabels : null,
      timingStrip: s.showTimingStrip,
      reduced: s.effects === 'reduced',
    });
  }

  private tick() {
    if (!this.engine || this.engine.ctx.state !== 'running') return;
    this.tickIndex = (this.tickIndex + 1) % TICKS.length;
    this.engine.voices.tick(this.engine.ui, TICKS[this.tickIndex], 0.35);
  }

  private flourish(lead: LeadKind | null = null) {
    const e = this.engine;
    if (!e) return;
    const t = e.ctx.currentTime + 0.02;
    [55, 59, 62, 67, 71, 74, 79].forEach((m, i) => {
      if (lead) e.voices.lead(lead, e.ui, t + i * 0.09, m + 12, 0.25, 0.5);
      else e.voices.harpsichord(e.ui, t + i * 0.055, m, 0.9 - i * 0.05, 0.45);
    });
  }

  private show(mode: Mode, html: string, onKey: ((e: KeyboardEvent) => void) | null = null) {
    this.mode = mode;
    this.ui.innerHTML = html;
    this.keyHandler = onKey;
  }

  private bind(actions: Record<string, (el: HTMLElement) => void>, root: ParentNode = this.ui) {
    root.querySelectorAll<HTMLElement>('[data-act]').forEach((el) => {
      el.addEventListener('click', () => actions[el.dataset.act!]?.(el));
    });
  }

  /** Arrow-key focus movement between the focusable items of a menu. */
  private arrowNav(e: KeyboardEvent, selector = 'button', horizontal = false) {
    const back = e.key === 'ArrowUp' || (horizontal && e.key === 'ArrowLeft');
    const fwd = e.key === 'ArrowDown' || (horizontal && e.key === 'ArrowRight');
    if (!back && !fwd) return false;
    const items = [...this.ui.querySelectorAll<HTMLElement>(selector)];
    if (!items.length) return false;
    const i = items.indexOf(document.activeElement as HTMLElement);
    const next = i < 0 ? 0 : fwd ? (i + 1) % items.length : (i - 1 + items.length) % items.length;
    items[next].focus();
    e.preventDefault();
    return true;
  }

  private onKeyDown(e: KeyboardEvent) {
    const game = this.game;
    if (this.mode === 'play' && game) {
      const lane = store.settings.laneCodes.indexOf(e.code);
      if (lane >= 0) {
        e.preventDefault();
        if (!e.repeat) game.press(lane, e.timeStamp);
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        if (!e.repeat) game.activateFortissimo();
        return;
      }
      if (e.code === 'Escape') {
        e.preventDefault();
        this.pause();
      }
      return;
    }
    this.keyHandler?.(e);
  }

  private onKeyUp(e: KeyboardEvent) {
    const lane = store.settings.laneCodes.indexOf(e.code);
    if (lane >= 0 && this.game) this.game.release(lane, e.timeStamp);
  }

  private onPointerDown(e: PointerEvent) {
    if (this.mode !== 'play' || !this.game) return;
    e.preventDefault();
    if (e.clientY < this.renderer.cam.H * 0.35) {
      this.game.activateFortissimo();
      return;
    }
    const lane = this.renderer.laneAt(e.clientX);
    this.pointerLanes.set(e.pointerId, lane);
    this.canvas.setPointerCapture(e.pointerId);
    this.game.press(lane, e.timeStamp);
  }

  private onPointerUp(e: PointerEvent) {
    const lane = this.pointerLanes.get(e.pointerId);
    if (lane === undefined) return;
    this.pointerLanes.delete(e.pointerId);
    this.game?.release(lane, e.timeStamp);
  }

  private soloistFor(def: SongDef): LeadKind {
    const s = store.settings.soloist;
    return s === 'composer' ? def.lead : s;
  }

  private scoreOf(entry: Entry): Score {
    return (entry.score ??= parseScore(entry.def));
  }

  /** Grade (from gem density at Virtuoso) and duration, computed once per piece. */
  private statsOf(entry: Entry) {
    if (!entry.stats) {
      const song = compileSong(entry.def, 1, this.scoreOf(entry));
      const nps = buildChart(song, 'virtuoso').notes.length / Math.max(1, song.length);
      const grade = nps < 1.6 ? 1 : nps < 2.3 ? 2 : nps < 3 ? 3 : nps < 3.8 ? 4 : 5;
      entry.stats = { grade, seconds: song.length };
    }
    return entry.stats;
  }

  // ─── Title ──────────────────────────────────────────────────────────────

  private showTitle() {
    this.renderer.idleLight = 0.32;
    const keys = store.settings.laneLabels.map((k) => `<kbd>${esc(k)}</kbd>`).join(' ');
    this.show(
      'title',
      `<div class="title">
        <div class="kicker">A Grand Entertainment · Anno MDCCXXX</div>
        <h1>Sitar Hero</h1>
        <p class="sub">for four fingers &amp; full orchestra</p>
        <span class="fleuron">❦ ❦ ❦</span>
        <div class="menu">
          <button data-act="enter">Enter the Hall</button>
          <button data-act="options">Options</button>
          <button data-act="howto">How to Play</button>
          <button data-act="import">Import a Score</button>
        </div>
        <div class="hint">Strike ${keys} as the jewels reach the rings · ↑ ↓ and Enter to choose</div>
      </div>`,
      (e) => this.arrowNav(e),
    );
    const go = (fn: () => void) => async () => {
      await this.ensureEngine();
      fn();
    };
    this.bind({
      enter: go(() => {
        this.flourish();
        this.showProgramme();
      }),
      options: go(() => this.showOptions()),
      howto: go(() => this.showHowTo()),
      import: go(() => this.showImport()),
    });
    this.ui.querySelector<HTMLElement>('button')?.focus({ preventScroll: true });
  }

  // ─── Programme ──────────────────────────────────────────────────────────

  private showProgramme() {
    this.renderer.idleLight = 0.45;
    let n = 0;
    const sections = ERAS.map((era) => {
      const items = this.catalogue.map((e, i) => [e, i] as const).filter(([e]) => e.def.era === era.id);
      if (!items.length) return '';
      return `<div class="era-group" role="group" aria-label="${esc(era.title)}"><div class="era" role="presentation"><span>${esc(era.title)}</span><small>${esc(era.note)}</small></div>
        ${items.map(([e, i]) => `<div class="piece" role="option" id="piece-${i}" data-i="${i}"><span class="num">${roman(++n)}</span><span class="pc"><span class="name">${esc(e.def.title)}</span><span class="meta">${esc(e.def.composer)}${e.def.year ? ` · ${esc(e.def.year)}` : ''}</span></span><span class="right" data-best="${i}"></span></div>`).join('')}</div>`;
    }).join('');

    this.show(
      'programme',
      `<div class="paper programme-card">
        <div class="overline">Tonight’s Programme</div>
        <h2>A Concert of Musick</h2>
        <div class="prog">
          <div class="prog-list" role="listbox" aria-label="Pieces" tabindex="-1">${sections}</div>
          <div class="prog-detail" id="detail" aria-live="polite"></div>
        </div>
        <div class="keys-hint">
          <span><kbd>↑</kbd><kbd>↓</kbd> piece</span><span><kbd>PgUp</kbd><kbd>PgDn</kbd> section</span>
          <span><kbd>←</kbd><kbd>→</kbd> level</span><span><kbd>S</kbd> soloist</span><span><kbd>T</kbd> tempo</span>
          <span><kbd>C</kbd> clemency</span><span><kbd>Enter</kbd> begin</span><span><kbd>O</kbd> options</span>
          <span><kbd>I</kbd> import</span><span><kbd>Esc</kbd> back</span>
        </div>
      </div>`,
      (e) => this.programmeKey(e),
    );
    this.ui.querySelectorAll<HTMLElement>('.piece').forEach((el) =>
      el.addEventListener('click', () => {
        const i = Number(el.dataset.i);
        if (i === this.sel.index) void this.begin();
        else this.select(i);
      }),
    );
    this.renderBests();
    this.select(this.sel.index, true);
    (document.activeElement as HTMLElement | null)?.blur();
  }

  private renderBests() {
    this.ui.querySelectorAll<HTMLElement>('[data-best]').forEach((el) => {
      const entry = this.catalogue[Number(el.dataset.best)];
      const rec = store.record(entry.def.id, this.sel.difficulty);
      el.innerHTML = `<span class="stars">${rec ? stars(rec.stars) : ''}</span>`;
    });
  }

  private select(i: number, instant = false) {
    this.sel.index = Math.max(0, Math.min(this.catalogue.length - 1, i));
    this.ui.querySelectorAll('.piece.selected').forEach((el) => el.classList.remove('selected'));
    const row = this.ui.querySelector<HTMLElement>(`#piece-${this.sel.index}`);
    row?.classList.add('selected');
    row?.scrollIntoView({ block: 'nearest', behavior: instant ? 'auto' : 'smooth' });
    this.ui.querySelector('.prog-list')?.setAttribute('aria-activedescendant', `piece-${this.sel.index}`);
    this.renderDetail();
  }

  private renderDetail() {
    const box = this.ui.querySelector<HTMLElement>('#detail');
    if (!box) return;
    const entry = this.catalogue[this.sel.index];
    const def = entry.def;
    const s = this.sel;
    const st = this.statsOf(entry);
    const lead = this.soloistFor(def);
    const written = store.settings.soloist === 'composer';
    const diffs = DIFFICULTIES.map((d) => `<button class="${d.id === s.difficulty ? 'on' : ''}" data-act="diff" data-diff="${d.id}">${d.name}</button>`).join('');
    const speeds = SPEEDS.map((v) => `<button class="${v === s.speed ? 'on' : ''}" data-act="speed" data-speed="${v}">${Math.round(v * 100)}%</button>`).join('');
    const bests = DIFFICULTIES.map((d) => {
      const rec = store.record(def.id, d.id);
      return `<tr class="${d.id === s.difficulty ? 'on' : ''}"><td>${d.name}</td><td>${rec ? rec.score.toLocaleString('en-GB') : '—'}</td><td class="stars">${rec ? stars(rec.stars) : ''}</td></tr>`;
    }).join('');
    box.innerHTML = `
      <div class="d-title">${esc(def.title)}</div>
      ${def.subtitle ? `<div class="d-sub">${esc(def.subtitle)}</div>` : ''}
      <div class="d-meta">${esc(def.composer)}${def.year ? ` · ${esc(def.year)}` : ''}</div>
      <p class="d-blurb">${esc(def.blurb)}</p>
      <div class="d-facts"><span class="grade" title="Difficulty">${fleurons(st.grade)}</span><span>♩ = ${def.bpm}${def.accel ? `→${def.accel}` : ''}</span><span>${meterLabel(def)}</span><span>${clock(st.seconds)}</span></div>
      <div class="d-row"><span class="control-label">Soloist</span>
        <span class="stepper"><button data-act="solo" data-dir="-1" aria-label="Previous soloist">◀</button><span class="d-val">${LEAD_NAMES[lead]}${written ? ' <small>as written</small>' : ''}</span><button data-act="solo" data-dir="1" aria-label="Next soloist">▶</button></span><kbd>S</kbd></div>
      <div class="d-row"><span class="control-label">Level</span><span class="segmented">${diffs}</span><kbd>←→</kbd></div>
      <div class="d-row"><span class="control-label">Tempo</span><span class="segmented">${speeds}</span><kbd>T</kbd></div>
      <div class="d-row"><span class="control-label">Clemency</span><button class="toggle${s.noFail ? ' on' : ''}" data-act="clemency">${s.noFail ? 'Granted' : 'Not granted'}</button><kbd>C</kbd></div>
      <div class="diff-blurb">${esc(DIFFICULTIES.find((d) => d.id === s.difficulty)!.blurb)}${s.speed < 1 || s.noFail ? ' Rehearsals are not entered in the records.' : ''}</div>
      <table class="bests">${bests}</table>
      <div class="actions"><button class="btn" data-act="begin">Begin the Performance</button>
      ${def.era === 'imported' ? '<button class="btn quiet" data-act="remove">Remove score</button>' : ''}</div>`;
    this.bind(
      {
        diff: (el) => this.setDifficulty(el.dataset.diff as Difficulty),
        speed: (el) => this.setSpeed(Number(el.dataset.speed)),
        clemency: () => this.toggleClemency(),
        solo: (el) => this.cycleSoloist(Number(el.dataset.dir) as 1 | -1),
        begin: () => void this.begin(),
        remove: () => this.removeImport(this.sel.index),
      },
      box,
    );
  }

  private setDifficulty(d: Difficulty) {
    this.sel.difficulty = d;
    this.renderBests();
    this.renderDetail();
  }

  private setSpeed(v: number) {
    this.sel.speed = v;
    this.renderDetail();
  }

  private toggleClemency() {
    this.sel.noFail = !this.sel.noFail;
    this.renderDetail();
  }

  private cycleSoloist(dir: 1 | -1) {
    const i = SOLOISTS.indexOf(store.settings.soloist);
    const next = SOLOISTS[(i + dir + SOLOISTS.length) % SOLOISTS.length];
    store.updateSettings({ soloist: next });
    this.renderDetail();
    this.preview(this.soloistFor(this.catalogue[this.sel.index].def));
  }

  /** Let the player hear an instrument when they choose it. */
  private preview(lead: LeadKind) {
    const e = this.engine;
    if (!e || e.ctx.state !== 'running') return;
    const t = e.ctx.currentTime + 0.02;
    [67, 71, 74].forEach((m, i) => e.voices.lead(lead, e.ui, t + i * 0.12, m, i === 2 ? 0.5 : 0.14, 0.55));
  }

  private removeImport(index: number) {
    const entry = this.catalogue[index];
    if (entry?.def.era !== 'imported') return;
    store.removeImport(entry.def.id);
    this.catalogue.splice(index, 1);
    this.sel.index = Math.min(index, this.catalogue.length - 1);
    this.showProgramme();
  }

  private programmeKey(e: KeyboardEvent) {
    const active = document.activeElement as HTMLElement | null;
    const onButton = active?.tagName === 'BUTTON' && this.ui.contains(active);
    const pieces = this.catalogue.length;
    const eraStart = (dir: number) => {
      const eras = ERAS.map((er) => er.id);
      const cur = eras.indexOf(this.catalogue[this.sel.index].def.era);
      for (let k = cur + dir; k >= 0 && k < eras.length; k += dir) {
        const idx = this.catalogue.findIndex((en) => en.def.era === eras[k]);
        if (idx >= 0) return idx;
      }
      return dir < 0 ? 0 : this.sel.index;
    };
    const handled = () => e.preventDefault();
    switch (e.key) {
      case 'ArrowDown':
        handled();
        this.select((this.sel.index + 1) % pieces);
        break;
      case 'ArrowUp':
        handled();
        this.select((this.sel.index - 1 + pieces) % pieces);
        break;
      case 'PageDown':
        handled();
        this.select(eraStart(1));
        break;
      case 'PageUp':
        handled();
        this.select(eraStart(-1));
        break;
      case 'Home':
        handled();
        this.select(0);
        break;
      case 'End':
        handled();
        this.select(pieces - 1);
        break;
      case 'ArrowLeft':
      case 'ArrowRight': {
        handled();
        const i = DIFFICULTIES.findIndex((d) => d.id === this.sel.difficulty);
        const j = Math.max(0, Math.min(DIFFICULTIES.length - 1, i + (e.key === 'ArrowRight' ? 1 : -1)));
        if (j !== i) this.setDifficulty(DIFFICULTIES[j].id);
        break;
      }
      case 'Enter':
        if (!onButton) {
          handled();
          void this.begin();
        }
        break;
      case 'Escape':
        this.showTitle();
        break;
      case 'Delete':
      case 'Backspace':
        if (this.catalogue[this.sel.index].def.era === 'imported') this.removeImport(this.sel.index);
        break;
      default:
        switch (e.code) {
          case 'KeyS':
            this.cycleSoloist(e.shiftKey ? -1 : 1);
            break;
          case 'KeyT':
            this.setSpeed(SPEEDS[(SPEEDS.indexOf(this.sel.speed) + 1) % SPEEDS.length]);
            break;
          case 'KeyC':
            this.toggleClemency();
            break;
          case 'KeyO':
            this.showOptions(() => this.showProgramme());
            break;
          case 'KeyI':
            this.showImport();
            break;
        }
    }
  }

  // ─── Options ────────────────────────────────────────────────────────────

  private showOptions(onBack: () => void = () => this.showTitle()) {
    this.renderer.idleLight = 0.45;
    const st = () => store.settings;
    const set = (patch: Parameters<typeof store.updateSettings>[0]) => {
      store.updateSettings(patch);
      this.applyDisplay();
    };
    const speedStep = () => Math.round((2.5 - st().approach) / 0.15);
    let confirmErase = 0;
    const rows: OptionRow[] = [
      {
        label: 'Soloist',
        value: () => (st().soloist === 'composer' ? 'As the composer intended' : LEAD_NAMES[st().soloist as LeadKind]),
        desc: () => 'Which instrument plays the melody you strike. The composer’s choice varies from piece to piece.',
        step: (d) => {
          const i = SOLOISTS.indexOf(st().soloist);
          set({ soloist: SOLOISTS[(i + d + SOLOISTS.length) % SOLOISTS.length] });
          const s = st().soloist;
          this.preview(s === 'composer' ? 'harpsichord' : s);
        },
      },
      {
        label: 'Timing',
        value: () => STRICTNESS[st().strictness].label,
        desc: () => {
          const w = STRICTNESS[st().strictness];
          return `${w.blurb} Magnifique within ±${w.perfect * 1000} ms, Bravo ±${w.great * 1000}, Passable ±${w.good * 1000}.`;
        },
        step: (d) => {
          const i = STRICTNESSES.indexOf(st().strictness);
          set({ strictness: STRICTNESSES[Math.max(0, Math.min(2, i + d))] });
        },
      },
      {
        label: 'Key letters on the rings',
        value: () => (st().showKeyLetters ? 'Shown' : 'Hidden'),
        desc: () => 'Hide them once your fingers know the way.',
        step: () => set({ showKeyLetters: !st().showKeyLetters }),
      },
      {
        label: 'Timing strip',
        value: () => (st().showTimingStrip ? 'Shown' : 'Hidden'),
        desc: () => 'A bar beneath the rings showing whether your recent strikes were early or late.',
        step: () => set({ showTimingStrip: !st().showTimingStrip }),
      },
      {
        label: 'Jewel speed',
        value: () => `${TEMPO_NAMES[speedStep()]} (${st().approach.toFixed(2)} s)`,
        desc: () => 'How swiftly the jewels glide down the carpet.',
        step: (d) => set({ approach: Math.round((2.5 - Math.max(1, Math.min(10, speedStep() + d)) * 0.15) * 100) / 100 }),
      },
      {
        label: 'Timing offset',
        value: () => `${st().offsetMs > 0 ? '+' : ''}${st().offsetMs} ms`,
        desc: () => 'Raise it if your strikes are judged late though they sound right. Press Enter to calibrate with the metronome.',
        step: (d) => set({ offsetMs: Math.max(-200, Math.min(200, st().offsetMs + d * 5)) }),
        act: () => void this.calibrate(),
        actLabel: 'Calibrate',
      },
      {
        label: 'Volume',
        value: () => `${Math.round(st().volume * 100)}%`,
        step: (d) => {
          set({ volume: Math.max(0, Math.min(1, Math.round((st().volume + d * 0.05) * 100) / 100)) });
          this.engine?.setVolume(st().volume);
          this.tick();
        },
      },
      {
        label: 'Miss sounds',
        value: () => (st().missSounds ? 'On' : 'Off'),
        desc: () => 'The muffled thunk of a fumbled string.',
        step: () => set({ missSounds: !st().missSounds }),
      },
      {
        label: 'Effects',
        value: () => (st().effects === 'full' ? 'Full' : 'Reduced'),
        desc: () => 'Reduced turns off screen shake, fireworks and petal showers.',
        step: () => set({ effects: st().effects === 'full' ? 'reduced' : 'full' }),
      },
      {
        label: 'Lane keys',
        value: () => st().laneLabels.join('  '),
        desc: () => 'Press Enter, then the four keys from left to right. Escape cancels.',
        act: () => this.rebind(),
        actLabel: 'Rebind',
      },
      {
        label: 'Records',
        value: () => (confirmErase > Date.now() ? 'Press Enter again to erase' : 'Kept'),
        desc: () => 'Erase every best score and star.',
        act: () => {
          if (confirmErase > Date.now()) {
            store.clearRecords();
            confirmErase = 0;
          } else confirmErase = Date.now() + 3000;
        },
        actLabel: 'Erase',
      },
    ];

    const rowHtml = (r: OptionRow, i: number) => `
      <div class="opt" tabindex="0" role="group" aria-label="${esc(r.label)}" data-row="${i}">
        <span class="opt-label">${esc(r.label)}</span>
        <span class="opt-ctrl">
          ${r.step ? '<button class="arrow" tabindex="-1" data-dir="-1" aria-hidden="true">◀</button>' : '<span></span>'}
          <span class="opt-value">${esc(r.value())}</span>
          ${r.step ? '<button class="arrow" tabindex="-1" data-dir="1" aria-hidden="true">▶</button>' : '<span></span>'}
          ${r.act ? `<button class="mini" tabindex="-1" data-run>${esc(r.actLabel ?? 'Go')}</button>` : '<span></span>'}
        </span>
        ${r.desc ? `<span class="opt-desc">${esc(r.desc())}</span>` : ''}
      </div>`;

    this.show(
      'options',
      `<div class="paper options-card">
        <div class="overline">The Music Room</div>
        <h2>Options</h2>
        <div class="rule">❦</div>
        <div class="opts">${rows.map(rowHtml).join('')}</div>
        <div class="calibrate" id="calib" hidden></div>
        <div class="actions"><button class="btn quiet" data-act="back">Return</button></div>
        <div class="keys-hint"><span><kbd>↑</kbd><kbd>↓</kbd> choose</span><span><kbd>←</kbd><kbd>→</kbd> change</span><span><kbd>Enter</kbd> calibrate · rebind</span><span><kbd>Esc</kbd> return</span></div>
      </div>`,
      (e) => {
        const focused = document.activeElement as HTMLElement | null;
        const rowEl = focused?.closest<HTMLElement>('.opt');
        const row = rowEl ? rows[Number(rowEl.dataset.row)] : null;
        if (e.key === 'Escape') {
          e.preventDefault();
          onBack();
        } else if (this.arrowNav(e, '.opt, .actions .btn')) {
          // moved focus
        } else if (row && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
          e.preventDefault();
          row.step?.(e.key === 'ArrowRight' ? 1 : -1);
          refresh(rowEl!, row);
        } else if (row && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          if (row.act) row.act();
          else row.step?.(1);
          // A key capture owns the row's text until it finishes.
          if (!rowEl!.classList.contains('capturing')) refresh(rowEl!, row);
        }
      },
    );
    const refresh = (el: HTMLElement, r: OptionRow) => {
      el.querySelector('.opt-value')!.textContent = r.value();
      const d = el.querySelector('.opt-desc');
      if (d && r.desc) d.textContent = r.desc();
    };
    this.ui.querySelectorAll<HTMLElement>('.opt').forEach((el) => {
      const r = rows[Number(el.dataset.row)];
      el.querySelectorAll<HTMLElement>('.arrow').forEach((b) =>
        b.addEventListener('click', () => {
          r.step?.(Number(b.dataset.dir) as 1 | -1);
          refresh(el, r);
          el.focus();
        }),
      );
      el.querySelector<HTMLElement>('[data-run]')?.addEventListener('click', () => {
        el.focus();
        r.act?.();
        if (!el.classList.contains('capturing')) refresh(el, r);
      });
    });
    this.bind({ back: () => onBack() });
    this.ui.querySelector<HTMLElement>('.opt')?.focus();
  }

  /** Capture four new lane keys, left to right. */
  private rebind() {
    const row = [...this.ui.querySelectorAll<HTMLElement>('.opt')].find((el) => el.getAttribute('aria-label') === 'Lane keys');
    if (!row) return;
    const value = row.querySelector<HTMLElement>('.opt-value')!;
    const desc = row.querySelector<HTMLElement>('.opt-desc');
    const codes: string[] = [];
    const labels: string[] = [];
    const prev = this.keyHandler;
    const prompt = (extra = '') => {
      value.textContent = [...labels, '…'].join('  ');
      if (desc) desc.textContent = `${extra}Press the key for the ${LANE_NAMES[codes.length]} lane. Escape cancels.`;
    };
    const finish = (message: string) => {
      this.keyHandler = prev;
      value.textContent = store.settings.laneLabels.join('  ');
      if (desc) desc.textContent = message;
    };
    row.classList.add('capturing');
    prompt();
    this.keyHandler = (e) => {
      e.preventDefault();
      if (e.repeat) return;
      if (e.code === 'Escape') {
        row.classList.remove('capturing');
        return finish('Unchanged.');
      }
      if (RESERVED.has(e.code)) return prompt(`${keyLabel(e)} is reserved for the menus and Fortissimo. `);
      if (codes.includes(e.code)) return prompt(`${keyLabel(e)} is already taken. `);
      codes.push(e.code);
      labels.push(keyLabel(e));
      this.tick();
      if (codes.length < 4) return prompt();
      row.classList.remove('capturing');
      store.updateSettings({ laneCodes: codes, laneLabels: labels });
      this.applyDisplay();
      finish(`The lanes now answer to ${labels.join(', ')}.`);
    };
  }

  private async calibrate() {
    const engine = await this.ensureEngine();
    const box = this.ui.querySelector<HTMLElement>('#calib');
    if (!box) return;
    box.hidden = false;
    const count = 16;
    const spb = 0.6;
    box.innerHTML = `<p>The Kapellmeister strikes the floor sixteen times. Tap <kbd>Space</kbd> or a lane key with each strike from the third.</p>
      <div class="metronome">${'<span></span>'.repeat(count)}</div><p id="calib-msg">&nbsp;</p>`;
    box.scrollIntoView({ block: 'nearest' });
    const dots = [...box.querySelectorAll('span')];
    const t0 = engine.ctx.currentTime + 0.6;
    const clicks: number[] = [];
    for (let k = 0; k < count; k++) {
      clicks.push(t0 + k * spb);
      engine.voices.cane(engine.ui, t0 + k * spb, k % 4 === 0);
    }
    // Light each dot as its strike is heard, driven by the audio clock.
    const pulse = () => {
      if (!box.isConnected) return;
      const beat = (engine.heardTime() - t0) / spb;
      const k = Math.floor(beat);
      dots.forEach((d, i) => d.classList.toggle('lit', i === k && beat - k < 0.2));
      if (k < count) requestAnimationFrame(pulse);
    };
    requestAnimationFrame(pulse);
    const taps: number[] = [];
    const prev = this.keyHandler;
    const codes = store.settings.laneCodes;
    this.keyHandler = (e) => {
      if (e.repeat) return;
      if (e.code === 'Escape') {
        this.keyHandler = prev;
        box.hidden = true;
        return;
      }
      if (e.code !== 'Space' && !codes.includes(e.code)) return;
      e.preventDefault();
      const at = engine.heardTimeAt(e.timeStamp);
      let k = 0;
      for (let i = 1; i < clicks.length; i++) if (Math.abs(clicks[i] - at) < Math.abs(clicks[k] - at)) k = i;
      const d = at - clicks[k];
      if (Math.abs(d) < spb / 2 && k >= 2) {
        taps.push(d);
        dots[k]?.classList.add('done');
      }
    };
    const wait = (t0 + count * spb - engine.ctx.currentTime + 0.6) * 1000;
    setTimeout(() => {
      if (this.mode !== 'options' || !box.isConnected) return;
      this.keyHandler = prev;
      const msg = box.querySelector<HTMLElement>('#calib-msg')!;
      if (taps.length < 6) {
        msg.textContent = 'Too few taps were heard. Press Enter on “Timing offset” to try again.';
        return;
      }
      taps.sort((a, b) => a - b);
      const ms = Math.max(-200, Math.min(200, Math.round((taps[taps.length >> 1] * 1000) / 5) * 5));
      store.updateSettings({ offsetMs: ms });
      msg.innerHTML = `Your taps landed <b>${Math.abs(ms)} ms ${ms >= 0 ? 'late' : 'early'}</b> on average. The offset has been set to match.`;
      const row = [...this.ui.querySelectorAll<HTMLElement>('.opt')].find((el) => el.getAttribute('aria-label') === 'Timing offset');
      const v = row?.querySelector('.opt-value');
      if (v) v.textContent = `${ms > 0 ? '+' : ''}${ms} ms`;
    }, wait);
  }

  // ─── How to play ────────────────────────────────────────────────────────

  private showHowTo() {
    this.renderer.idleLight = 0.45;
    const colors = ['var(--ruby)', 'var(--sapphire)', 'var(--emerald)', 'var(--topaz)'];
    const names = ['Ruby', 'Sapphire', 'Emerald', 'Topaz'];
    const keys = store.settings.laneLabels.map((k, i) => `<div class="keycap" style="background:${colors[i]}">${esc(k)}<small>${names[i]}</small></div>`).join('');
    this.show(
      'howto',
      `<div class="paper" style="max-width:860px">
        <div class="overline">A Guide for the Soloist</div>
        <h2>How to Play</h2>
        <div class="rule">❦</div>
        <div class="keys">${keys}</div>
        <div class="cols">
          <div><h3>Strike the jewels</h3><p>Press each jewel’s key as it reaches its gilded ring. Every jewel is a note of the melody, and only you can play it. Strike too soon and it shatters: <i>Trop tôt!</i></p></div>
          <div><h3>Hold the ribbons</h3><p>A silk ribbon behind a jewel is a long note. Keep the key held until the ribbon ends and your instrument sings on.</p></div>
          <div><h3>Double-stops</h3><p>Two jewels joined by a gold bar are a chord: strike both keys together. They appear at Virtuoso and Maestro.</p></div>
          <div><h3>Build the orchestra</h3><p>Hit notes in a row and the ensemble joins you, section by section, up to a Grand Tutti. Each miss muffles your melody and sends one section home.</p></div>
          <div><h3>Fortissimo</h3><p>Jewels set in gold form gilded phrases. Play one without error to charge the Fortissimo, then press <kbd>Space</kbd> for the full orchestra and double points.</p></div>
          <div><h3>The Count’s favour</h3><p>His Excellency is watching. Misses try his patience, and if his favour runs dry you will be dismissed from court. Grant yourself <i>Clemency</i> to rehearse in peace.</p></div>
          <div><h3>Timing</h3><p>The strip under the rings shows where your recent strikes landed, early to the left, late to the right. Adjust strictness and the offset in Options.</p></div>
          <div><h3>Your own music</h3><p>Import a MIDI file from the title screen and the Count’s musicians will do their best with it.</p></div>
        </div>
        <div class="actions"><button class="btn" data-act="back">Very Good</button></div>
      </div>`,
      (e) => {
        if (e.key === 'Escape') this.showTitle();
      },
    );
    this.bind({ back: () => this.showTitle() });
    this.ui.querySelector<HTMLElement>('.btn')?.focus();
  }

  // ─── MIDI import ────────────────────────────────────────────────────────

  private showImport(message = '') {
    this.renderer.idleLight = 0.45;
    const list = store.imports
      .map((s) => `<li><span>${esc(s.name)}</span><button class="mini" data-act="drop" data-id="${esc(s.id)}">Remove</button></li>`)
      .join('');
    this.show(
      'import',
      `<div class="paper import-card">
        <div class="overline">Scores Brought from Abroad</div>
        <h2>Import a MIDI Score</h2>
        <div class="rule">❦</div>
        <p>The Count’s musicians will read any Standard MIDI File. They take the most melodic part as your line, keep everything else as the accompaniment, and work out the harmony so the rest of the orchestra can join in.</p>
        <p class="small">Works best with files that have a clear melody in its own track. Busy piano files work too: the top notes become the melody. Recordings of live playing, with their loose timing, make untidy charts.</p>
        <button class="dropzone" data-act="choose">Drop a <b>.mid</b> file here, or press <kbd>Enter</kbd> to choose one</button>
        <input type="file" id="midi-file" accept=".mid,.midi,audio/midi,audio/x-midi" hidden>
        <p id="import-msg" class="import-msg" aria-live="polite">${message}</p>
        ${list ? `<ul class="imports">${list}</ul>` : ''}
        <div class="actions"><button class="btn quiet" data-act="back">Return</button></div>
      </div>`,
      (e) => {
        if (e.key === 'Escape') this.showTitle();
        else this.arrowNav(e);
      },
    );
    const input = this.ui.querySelector<HTMLInputElement>('#midi-file')!;
    input.addEventListener('change', () => input.files?.[0] && void this.importFile(input.files[0]));
    const zone = this.ui.querySelector<HTMLElement>('.dropzone')!;
    zone.addEventListener('dragover', (e) => {
      e.preventDefault();
      zone.classList.add('over');
    });
    zone.addEventListener('dragleave', () => zone.classList.remove('over'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault();
      zone.classList.remove('over');
      const file = e.dataTransfer?.files[0];
      if (file) void this.importFile(file);
    });
    this.bind({
      choose: () => input.click(),
      back: () => this.showTitle(),
      drop: (el) => {
        const idx = this.catalogue.findIndex((c) => c.def.id === el.dataset.id);
        store.removeImport(el.dataset.id!);
        if (idx >= 0) this.catalogue.splice(idx, 1);
        this.showImport('Removed.');
      },
    });
    zone.focus();
  }

  private async importFile(file: File) {
    const msg = this.ui.querySelector<HTMLElement>('#import-msg');
    try {
      if (file.size > 2_000_000) throw new Error('That file is too large for the Count’s library (2 MB at most).');
      const buf = await file.arrayBuffer();
      const id = `midi-${hashBytes(buf)}`;
      const { def, score } = importMidi(buf, file.name, id);
      const existing = this.catalogue.findIndex((c) => c.def.id === id);
      if (existing >= 0) this.catalogue.splice(existing, 1);
      this.catalogue.push({ def, score });
      const kept = store.addImport({ id, name: file.name, data: toBase64(buf) });
      this.sel.index = this.catalogue.length - 1;
      this.showImport(
        `<b>${esc(def.title)}</b> is ready: ${score.melody.length} melody notes. ${kept ? '' : '(It will be forgotten when you leave: storage is full.) '}Press <kbd>Enter</kbd> on “Open in the programme”.`,
      );
      const actions = this.ui.querySelector('.actions')!;
      actions.insertAdjacentHTML('afterbegin', '<button class="btn" data-act="open">Open in the programme</button>');
      this.bind({ open: () => this.showProgramme() }, actions);
      actions.querySelector<HTMLElement>('[data-act="open"]')?.focus();
    } catch (err) {
      if (msg) msg.textContent = err instanceof Error ? err.message : 'That file could not be read.';
    }
  }

  // ─── Performance ────────────────────────────────────────────────────────

  private async begin() {
    if (this.mode === 'loading') return;
    const s = { ...this.sel };
    const entry = this.catalogue[s.index];
    const def = entry.def;
    store.setLast(def.id, s.difficulty);
    this.show('loading', `<div class="loading">The musicians are tuning<span class="dots"></span></div>`);
    const engine = await this.ensureEngine();
    const song: CompiledSong = compileSong(def, s.speed, this.scoreOf(entry));
    const chart = buildChart(song, s.difficulty);
    const lead = this.soloistFor(def);
    const settings = store.settings;

    const jobs: [BufferKind, number][] = [];
    const leadBuf = bufferKindFor(lead);
    const keysBuf = bufferKindFor(def.keys);
    for (const n of chart.notes) {
      jobs.push(['guitar', n.midi]);
      if (leadBuf) {
        jobs.push([leadBuf, n.midi]);
        for (const f of n.followers) jobs.push([leadBuf, f.midi]);
      }
    }
    if (keysBuf) for (const n of song.layers.keys) jobs.push([keysBuf, n.midi]);
    jobs.push(['guitar', 60 + def.tonic], ['harpsichord', 43], ['harpsichord', 44], ['harpsichord', 50], ['harpsichord', 55], ['harpsichord', 56], ['harpsichord', 61]);
    await engine.voices.warm(jobs);
    // The player may have left while the instruments were tuning.
    if (!this.isMode('loading')) return;

    const autoplay = new URLSearchParams(location.search).has('autoplay');
    const game = new Game(engine, song, chart, {
      difficulty: s.difficulty,
      speed: s.speed,
      noFail: s.noFail,
      approach: settings.approach,
      offsetMs: settings.offsetMs,
      lead,
      strictness: settings.strictness,
      missSounds: settings.missSounds,
      autoplay,
    });
    game.on((e) => {
      if (e.type === 'finish') setTimeout(() => this.game === game && this.showResults(game, s), 2600);
      if (e.type === 'fail') setTimeout(() => this.game === game && this.showResults(game, s), 3200);
    });
    this.game = game;
    if (import.meta.env.DEV) Object.assign(window, { __game: game });
    this.renderer.attach(game, settings.approach);
    game.start();
    this.showPlayChrome();
  }

  private showPlayChrome() {
    this.show('play', `<div class="play-chrome"><button data-act="pause">❚❚ Intermission <kbd>Esc</kbd></button></div>`);
    this.bind({ pause: () => this.pause() });
    (document.activeElement as HTMLElement | null)?.blur();
  }

  private pause() {
    const game = this.game;
    if (!game || this.mode !== 'play' || game.state === 'done') return;
    game.pause();
    this.show(
      'pause',
      `<div class="paper intermission">
        <div class="overline">The orchestra rests</div>
        <h2>Intermission</h2>
        <div class="rule">❦</div>
        <div class="menu">
          <button data-act="resume">Resume the Performance</button>
          <button data-act="restart">Begin Again</button>
          <button data-act="leave">Return to the Programme</button>
        </div>
      </div>`,
      (e) => {
        if (e.key === 'Escape') {
          e.preventDefault();
          void this.resume();
        } else this.arrowNav(e);
      },
    );
    this.bind({
      resume: () => void this.resume(),
      restart: () => {
        this.leave();
        void this.begin();
      },
      leave: () => {
        this.leave();
        this.showProgramme();
      },
    });
    this.ui.querySelector<HTMLElement>('button')?.focus();
  }

  private async resume() {
    if (!this.game) return;
    this.showPlayChrome();
    await this.game.resume();
  }

  private leave() {
    this.game?.abort();
    this.game = null;
    this.renderer.attach(null);
    this.pointerLanes.clear();
  }

  // ─── Results ────────────────────────────────────────────────────────────

  private showResults(game: Game, s: Selection) {
    const r = game.results();
    const def = game.song.def;
    const official = s.speed === 1 && !s.noFail && !r.failed && !game.opts.autoplay;
    const isRecord =
      official && store.submit(def.id, s.difficulty, { score: r.score, stars: r.stars, accuracy: r.accuracy, maxStreak: r.maxStreak });
    this.timeline = {
      duration: game.song.length,
      notes: game.chart.notes.map((n) => ({ time: n.time, judgment: n.judgment, offset: n.offset })),
      tiers: game.tierLog.slice(),
      failedAt: r.failedAt,
      window: game.windows.good,
    };
    this.leave();
    this.renderer.idleLight = r.failed ? 0.25 : 0.55;
    const review = writeReview(r, def, s.difficulty, s.speed);
    const pct = (x: number) => `${Math.round(x * 1000) / 10}%`;
    const third = (x: number) => (Number.isNaN(x) ? '—' : pct(x));
    this.show(
      'results',
      `<div class="paper gazette">
        <div class="masthead">The Court Gazette</div>
        <div class="dateline"><span>${gazetteDate()}</span><span>Price: One Sou</span></div>
        <div class="headline">${esc(review.headline)}</div>
        <div class="deck">${esc(review.deck)}</div>
        <div class="big-stars">${stars(r.failed ? 0 : r.stars)}</div>
        <figure class="timeline">
          <canvas id="timeline" role="img" aria-label="Timeline of the performance: accuracy ${third(r.thirds[0])} at the opening, ${third(r.thirds[1])} in the middle, ${third(r.thirds[2])} at the close"></canvas>
          <figcaption><span>Opening <b>${third(r.thirds[0])}</b></span><span>Middle <b>${third(r.thirds[1])}</b></span><span>Finale <b>${third(r.thirds[2])}</b></span>
            <span class="legend"><i class="dot perfect"></i>Magnifique <i class="dot great"></i>Bravo <i class="dot good"></i>Passable <i class="tick"></i>Faux pas · early above, late below</span></figcaption>
        </figure>
        <div class="body">
          <div>
            <div class="score">${r.score.toLocaleString('en-GB')}</div>
            ${isRecord ? '<div class="record">A new record for the annals!</div>' : ''}
            <table>
              <tr><td><i>Magnifique</i></td><td>${r.counts.perfect}</td></tr>
              <tr><td><i>Bravo</i></td><td>${r.counts.great}</td></tr>
              <tr><td><i>Passable</i></td><td>${r.counts.good}</td></tr>
              <tr><td><i>Faux pas</i>${r.early ? ` <small>(${r.early} too soon)</small>` : ''}</td><td>${r.counts.miss}</td></tr>
              <tr><td>Accuracy</td><td>${pct(r.accuracy)}</td></tr>
              <tr><td>Average timing</td><td>${Math.abs(Math.round(r.meanOffsetMs))} ms ${r.meanOffsetMs < 0 ? 'early' : 'late'}</td></tr>
              <tr><td>Longest run</td><td>${r.maxStreak}</td></tr>
              <tr><td>Ribbons held</td><td>${r.holdsCompleted} / ${r.holdCount}</td></tr>
            </table>
          </div>
          <div class="review">
            ${review.paragraphs.map((p) => `<p>${esc(p)}</p>`).join('')}
            <div class="byline">— ${esc(review.critic)}</div>
          </div>
        </div>
        <div class="actions">
          <button class="btn" data-act="encore">Encore!</button>
          <button class="btn quiet" data-act="programme">Return to the Programme</button>
        </div>
        <div class="keys-hint"><span><kbd>Enter</kbd> encore</span><span><kbd>←</kbd><kbd>→</kbd> choose</span><span><kbd>Esc</kbd> programme</span></div>
      </div>`,
      (e) => {
        if (e.key === 'Escape') this.showProgramme();
        else if (e.code === 'KeyR') void this.begin();
        else this.arrowNav(e, '.actions .btn', true);
      },
    );
    this.bind({
      encore: () => void this.begin(),
      programme: () => this.showProgramme(),
    });
    this.redrawTimeline();
    this.ui.querySelector<HTMLElement>('.btn')?.focus();
  }

  private redrawTimeline() {
    const canvas = this.ui.querySelector<HTMLCanvasElement>('#timeline');
    if (canvas && this.timeline) drawTimeline(canvas, this.timeline);
  }
}
