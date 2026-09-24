import { parseMidi, type MidiNote } from './midi';
import { makeChart, type ChartNote } from './chart';
import { buildAccompanimentLayers, type AccompanimentLayer } from './progression';
import './style.css';

type Piece = {
  title: string;
  subtitle: string;
  note: string;
  composer: string;
  year: string;
  file: string;
  mood: string;
  difficulty: string;
  defaultLevel: number;
  leadTrack?: number;
  melodyMode?: 'sustained';
  startAt?: number;
  number: string;
  mark: string;
};

type Result = { score: number; perfect: number; great: number; good: number; missed: number; offbeat: number; maxCombo: number; total: number };
type RecordEntry = { score: number; accuracy: number; maxStreak: number };
type Spark = { lane: number; at: number; angle: number; speed: number; size: number };
type Impact = { lane: number; at: number; kind: 'hit' | 'miss' | 'offbeat' };

const pieces: Piece[] = [
  { title: 'Minuet in G', subtitle: 'A graceful first dance', composer: 'Christian Petzold', year: 'c. 1725', file: 'minuet-in-g.mid', note: 'Long filed under Bach’s name, this graceful minuet is now attributed to Christian Petzold.', mood: 'A gentle invitation', difficulty: 'I · Beginner', defaultLevel: 1, number: '01', mark: '♢' },
  { title: 'Für Elise', subtitle: 'The familiar piano reverie', composer: 'Ludwig van Beethoven', year: '1810', file: 'fur-elise.mid', note: 'The tiny E–D♯–E turn keeps returning, like a thought the piano cannot quite leave behind.', mood: 'Tender & restless', difficulty: 'II · Moderate', defaultLevel: 2, number: '02', mark: '❧' },
  { title: 'Eine kleine Nachtmusik', subtitle: 'A serenade after dark', composer: 'Wolfgang A. Mozart', year: '1787', file: 'eine-kleine-nachtmusik.mid', note: 'Its bold opening gives the strings a bright call to answer and pass around.', mood: 'Bright & spirited', difficulty: 'III · Lively', defaultLevel: 3, number: '03', mark: '✦' },
  { title: 'Rondo alla Turca', subtitle: 'The Turkish march', composer: 'Wolfgang A. Mozart', year: '1783', file: 'alla-turca.mid', note: 'Repeated notes and sharp accents give Mozart’s final movement its irresistible marching pulse.', mood: 'A daring finale', difficulty: 'IV · Virtuoso', defaultLevel: 4, number: '04', mark: '❖' },
  { title: 'Toccata and Fugue', subtitle: 'A dramatic organ overture', composer: 'Johann Sebastian Bach', year: 'c. 1704', file: 'toccata-and-fugue.mid', note: 'An opening flourish becomes a storm of quick runs: a grand entrance for the organ.', mood: 'Storm & splendour', difficulty: 'V · Grand', defaultLevel: 5, number: '05', mark: '✥' },
  { title: 'Canon in D', subtitle: 'A graceful round in three voices', composer: 'Johann Pachelbel', year: '1694', file: 'canon-in-d.mid', note: 'Three violin lines follow the same tune, one after another, over a repeating bass.', mood: 'An unfolding procession', difficulty: 'II · Gentle', defaultLevel: 2, leadTrack: 1, startAt: 8.6, number: '06', mark: '❈' },
  { title: 'Ode to Joy', subtitle: 'A jubilant anthem', composer: 'Ludwig van Beethoven', year: 'c. 1800', file: 'ode-to-joy.mid', note: 'Beethoven builds the tune from small, stepwise motions before it opens into a jubilant anthem.', mood: 'Joy without measure', difficulty: 'I · Beginner', defaultLevel: 1, number: '07', mark: '✺' },
  { title: 'Clair de lune', subtitle: 'Moonlight on the keys', composer: 'Claude Debussy', year: 'c. 1905', file: 'clair-de-lune.mid', note: 'Debussy lets the melody shimmer and recede, with the piano’s soft harmonies doing as much as the tune.', mood: 'Silver & stillness', difficulty: 'III · Poetic', defaultLevel: 3, number: '08', mark: '☾' },
  { title: 'Moonlight Sonata', subtitle: 'Adagio sostenuto', composer: 'Ludwig van Beethoven', year: '1802', file: 'moonlight-sonata.mid', note: 'Listen past the rippling triplets: the real melody sings slowly above them.', mood: 'A nocturnal hush', difficulty: 'II · Reflective', defaultLevel: 2, leadTrack: 1, melodyMode: 'sustained', startAt: 19, number: '09', mark: '☽' },
  { title: 'Spring', subtitle: 'The Four Seasons, first movement', composer: 'Antonio Vivaldi', year: '1725', file: 'spring.mid', note: 'Bright violin figures suggest birdsong before the solo line starts to dance.', mood: 'A world awakening', difficulty: 'III · Lively', defaultLevel: 3, leadTrack: 1, startAt: 3.6, number: '10', mark: '❀' },
  { title: 'Nocturne Op. 9 No. 2', subtitle: 'In E-flat major', composer: 'Frédéric Chopin', year: '1833', file: 'nocturne-op9-no2.mid', note: 'Chopin’s singing melody returns with ever more elaborate ornament, as though improvising after midnight.', mood: 'The midnight salon', difficulty: 'III · Lyrical', defaultLevel: 3, number: '11', mark: '✧' },
  { title: 'Gymnopédie No. 1', subtitle: 'A slow Parisian reverie', composer: 'Erik Satie', year: '1888', file: 'gymnopedie-no1.mid', note: 'Marked “Lent et douloureux,” its melody floats over a gentle three-beat piano sway.', mood: 'Still & wistful', difficulty: 'I · Gentle', defaultLevel: 1, leadTrack: 1, number: '12', mark: '☼' },
  { title: 'Prelude in C', subtitle: 'The Well-Tempered Clavier', composer: 'Johann Sebastian Bach', year: 'c. 1722', file: 'prelude-in-c.mid', note: 'A rolling arpeggio pattern unfolds almost without pause.', mood: 'Clear & flowing', difficulty: 'II · Flowing', defaultLevel: 2, leadTrack: 2, number: '13', mark: '◇' },
  { title: 'Symphony No. 5', subtitle: 'First movement · Allegro con brio', composer: 'Ludwig van Beethoven', year: '1808', file: 'beethoven-fifth.mid', note: 'The famous four-note call passes around the orchestra.', mood: 'Urgent & fateful', difficulty: 'IV · Grand', defaultLevel: 4, leadTrack: 8, number: '14', mark: '✸' },
  { title: 'In the Hall of the Mountain King', subtitle: 'Peer Gynt · piano arrangement', composer: 'Edvard Grieg', year: '1874', file: 'hall-of-the-mountain-king.mid', note: 'A small, repeating tune gathers weight as it goes.', mood: 'Mischief gathering', difficulty: 'III · Gathering', defaultLevel: 3, number: '15', mark: '♜' },
  { title: 'The Entertainer', subtitle: 'A ragtime classic', composer: 'Scott Joplin', year: '1902', file: 'the-entertainer.mid', note: 'The right-hand tune keeps slipping across the steady bass.', mood: 'Jaunty & bright', difficulty: 'III · Ragtime', defaultLevel: 3, number: '16', mark: '♠' },
  { title: 'Maple Leaf Rag', subtitle: 'A syncopated showpiece', composer: 'Scott Joplin', year: '1899', file: 'maple-leaf-rag.mid', note: 'Bright offbeat phrases bounce above a marching bass.', mood: 'Quick & playful', difficulty: 'IV · Ragtime', defaultLevel: 4, number: '17', mark: '❁' },
  { title: 'Minute Waltz', subtitle: 'Waltz in D-flat major', composer: 'Frédéric Chopin', year: '1847', file: 'minute-waltz.mid', note: 'The melody whirls over a quick three-beat pulse.', mood: 'Whirling & light', difficulty: 'III · Brisk', defaultLevel: 3, number: '18', mark: '❋' },
  { title: 'Fantaisie-Impromptu', subtitle: 'A brilliant piano fantasy', composer: 'Frédéric Chopin', year: '19th c.', file: 'fantaisie-impromptu.mid', note: 'Rapid runs frame a gentler central melody.', mood: 'Fierce & tender', difficulty: 'V · Virtuoso', defaultLevel: 5, number: '19', mark: '✧' },
  { title: 'Winter', subtitle: 'The Four Seasons · first movement', composer: 'Antonio Vivaldi', year: '1725', file: 'winter.mid', note: 'Sharp string attacks give way to quick violin runs.', mood: 'Icy & restless', difficulty: 'IV · Lively', defaultLevel: 4, leadTrack: 1, number: '20', mark: '❄' },
  { title: 'Hallelujah Chorus', subtitle: 'Messiah · four-voice chorus', composer: 'George Frideric Handel', year: '1741', file: 'hallelujah-chorus.mid', note: 'Four vocal lines answer and overlap in bright harmony.', mood: 'Radiant & bold', difficulty: 'III · Choral', defaultLevel: 3, leadTrack: 1, number: '21', mark: '✠' },
  { title: 'Wedding March', subtitle: 'A Midsummer Night’s Dream · organ', composer: 'Felix Mendelssohn', year: '1842', file: 'wedding-march.mid', note: 'Broad opening chords lead into a ceremonial procession.', mood: 'Grand & festive', difficulty: 'III · Processional', defaultLevel: 3, leadTrack: 1, number: '22', mark: '♛' },
  { title: 'Jupiter Theme · Thaxted', subtitle: 'The broad hymn from The Planets', composer: 'Gustav Holst', year: '1921', file: 'holst-jupiter-thaxted.mid', note: 'Holst adapted Jupiter’s sweeping central melody into the hymn tune “Thaxted.”', mood: 'Noble & radiant', difficulty: 'II · Hymn', defaultLevel: 2, leadTrack: 1, number: '23', mark: '♃' },
  { title: 'Mars, the Bringer of War', subtitle: 'The Planets · I', composer: 'Gustav Holst', year: '1914', file: 'holst-mars.mid', note: 'A relentless five-beat rhythm drives this movement forward like an unstoppable machine.', mood: 'Menacing & martial', difficulty: 'V · Ferocious', defaultLevel: 5, leadTrack: 1, number: '24', mark: '♂' },
  { title: 'Venus, the Bringer of Peace', subtitle: 'The Planets · II', composer: 'Gustav Holst', year: '1914', file: 'holst-venus.mid', note: 'After Mars, delicate solo lines and spacious chords offer a long breath of calm.', mood: 'Quiet & luminous', difficulty: 'II · Serene', defaultLevel: 2, leadTrack: 1, number: '25', mark: '♀' },
  { title: 'Mercury, the Winged Messenger', subtitle: 'The Planets · III', composer: 'Gustav Holst', year: '1916', file: 'holst-mercury.mid', note: 'Quick figures dart between instruments, giving Mercury its fleet-footed character.', mood: 'Quick & mercurial', difficulty: 'IV · Nimble', defaultLevel: 4, leadTrack: 1, number: '26', mark: '☿' },
  { title: 'Jupiter, the Bringer of Jollity', subtitle: 'The Planets · IV', composer: 'Gustav Holst', year: '1914', file: 'holst-jupiter.mid', note: 'Boisterous dances open into the broad tune Holst later adapted as “Thaxted.”', mood: 'Jubilant & grand', difficulty: 'IV · Grand', defaultLevel: 4, leadTrack: 1, number: '27', mark: '♃' },
  { title: 'Saturn, the Bringer of Old Age', subtitle: 'The Planets · V', composer: 'Gustav Holst', year: '1915', file: 'holst-saturn.mid', note: 'A slow, tolling tread grows into a great swell, then settles into stillness.', mood: 'Solemn & tender', difficulty: 'II · Measured', defaultLevel: 2, leadTrack: 1, number: '28', mark: '♄' },
  { title: 'Uranus, the Magician', subtitle: 'The Planets · VI', composer: 'Gustav Holst', year: '1915', file: 'holst-uranus.mid', note: 'A four-note spell sets off a mischievous march full of sudden theatrical turns.', mood: 'Impish & theatrical', difficulty: 'IV · Dramatic', defaultLevel: 4, leadTrack: 1, number: '29', mark: '♅' },
  { title: 'Neptune, the Mystic', subtitle: 'The Planets · VII', composer: 'Gustav Holst', year: '1915', file: 'holst-neptune.mid', note: 'The suite ends in an eerie haze: in the original score, unseen voices fade into silence.', mood: 'Otherworldly & distant', difficulty: 'III · Dreamlike', defaultLevel: 3, leadTrack: 1, number: '30', mark: '♆' },
];

const KEYS = ['D', 'F', 'J', 'K'];
const app = document.querySelector<HTMLDivElement>('#app')!;
let selected = 0;
let volume = 0.65;
const difficultyByPiece = pieces.map(piece => piece.defaultLevel);
const speedByPiece = pieces.map(() => 1);
const records: Record<string, RecordEntry> = {};
type MenuZone = 'pieces' | 'difficulty' | 'speed' | 'start';
const menuZones: MenuZone[] = ['pieces', 'difficulty', 'speed', 'start'];
let menuZone: MenuZone = 'pieces';

try {
  const saved = JSON.parse(localStorage.getItem('royal-refrain-settings') || '{}') as { difficulty?: number[]; speed?: number[] };
  pieces.forEach((_, i) => {
    if (Number.isFinite(saved.difficulty?.[i])) difficultyByPiece[i] = Math.max(1, Math.min(5, Math.round(saved.difficulty![i])));
    if (Number.isFinite(saved.speed?.[i])) speedByPiece[i] = Math.max(0.7, Math.min(1.5, Math.round(saved.speed![i] * 20) / 20));
  });
} catch { /* Storage may be unavailable in a private browser. */ }

try {
  const saved = JSON.parse(localStorage.getItem('royal-refrain-records') || '{}') as Record<string, RecordEntry>;
  for (const [key, entry] of Object.entries(saved)) {
    if (entry && Number.isFinite(entry.score) && entry.score >= 0 && Number.isFinite(entry.accuracy) && Number.isFinite(entry.maxStreak)) records[key] = entry;
  }
} catch { /* A fresh record book is fine when storage is unavailable. */ }

function recordKey() {
  return `${pieces[selected].file}:${difficultyByPiece[selected]}:${speedByPiece[selected].toFixed(2)}`;
}

function currentRecord() {
  return records[recordKey()];
}

function recordLabel() {
  const best = currentRecord();
  return best ? `PERSONAL BEST · ${best.score.toLocaleString()} PTS · ${best.accuracy}% ACCURACY` : 'PERSONAL BEST · A NEW SCORE AWAITS';
}

function saveRecord(accuracy: number) {
  const key = recordKey();
  const previous = records[key];
  const isBest = !previous || result.score > previous.score;
  if (isBest) records[key] = { score: result.score, accuracy, maxStreak: result.maxCombo };
  try { localStorage.setItem('royal-refrain-records', JSON.stringify(records)); } catch { /* Scores still display for this session. */ }
  return { previous, isBest };
}

function saveSettings() {
  try { localStorage.setItem('royal-refrain-settings', JSON.stringify({ difficulty: difficultyByPiece, speed: speedByPiece })); } catch { /* Optional. */ }
}

function playUiTick(up = true) {
  if (!volume || performance.now() - lastUiTickAt < 45) return;
  lastUiTickAt = performance.now();
  if (!uiContext) uiContext = new AudioContext({ latencyHint: 'interactive' });
  void uiContext.resume().catch(() => {});
  const when = uiContext.currentTime;
  const oscillator = uiContext.createOscillator();
  const amp = uiContext.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(up ? 880 : 660, when);
  oscillator.frequency.exponentialRampToValueAtTime(up ? 1175 : 540, when + 0.07);
  amp.gain.setValueAtTime(0.018 * volume, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.085);
  oscillator.connect(amp).connect(uiContext.destination);
  oscillator.start(when);
  oscillator.stop(when + 0.09);
  oscillator.onended = () => { oscillator.disconnect(); amp.disconnect(); };
}

const levelNames = ['Prelude', 'Gentle', 'Classical', 'Brisk', 'Virtuoso'];
const fullscreenLabel = () => `<kbd class="key-hint">⇧ F</kbd> ${document.fullscreenElement ? 'WINDOWED' : 'FULL SCREEN'}`;
const fullscreenButton = () => `<button class="fullscreen-button" id="fullscreen-button" type="button" aria-label="Toggle full screen">${fullscreenLabel()}</button>`;
let context: AudioContext | null = null;
let uiContext: AudioContext | null = null;
let master: GainNode | null = null;
let unplayedLead: GainNode | null = null;
let previewContext: AudioContext | null = null;
let previewGain: GainNode | null = null;
let previewEnabled = true;
let previewGeneration = 0;
let previewTimer = 0;
let previewNotes: MidiNote[] = [];
let previewNext = 0;
let previewStartAt = 0;
let accompanimentBuses: GainNode[] = [];
let accompanimentLayers: AccompanimentLayer[] = [];
let accompanimentForNote = new Map<MidiNote, number>();
let accompanimentActiveCount = -1;
let melodyDucked = false;

let pieceNotes: MidiNote[] = [];
let chart: ChartNote[] = [];
let melodySources = new Set<MidiNote>();
let songLength = 0;
let playAt = 0;
let scheduleIndex = 0;
let missIndex = 0;
let frame = 0;
let paused = false;
let playing = false;
let preparingGame = false;
let canvas: HTMLCanvasElement | null = null;
let result: Result = freshResult();
let combo = 0;
let judgment: { text: string; at: number; color: string } | null = null;
let keyGlow = [-1, -1, -1, -1];
let sparks: Spark[] = [];
let impacts: Impact[] = [];
let comboCelebrationAt = -Infinity;
let comboCelebrationCount = 0;
let resizeObserver: ResizeObserver | null = null;
let lastOffbeatAt = -Infinity;
let pausedSongTime = 0;
let lastUiTickAt = -Infinity;
let lastMissSoundAt = -Infinity;

function freshResult(): Result {
  return { score: 0, perfect: 0, great: 0, good: 0, missed: 0, offbeat: 0, maxCombo: 0, total: 0 };
}

function menuMarkup() {
  return `
    <div class="salon-shell">
      <header class="masthead">
        <a class="brand" href="#" aria-label="Sitar Hero home"><span class="brand-seal">♬</span><span>SITAR <em>HERO</em></span></a>
        <div class="masthead-right"><span class="edition">A SALON OF RHYTHM · EST. MMXXVI</span><span class="header-rule">✦</span>${fullscreenButton()}</div>
      </header>
      <main class="menu-layout">
        <section class="program-panel" aria-labelledby="program-title">
          <div class="program-heading"><div><div class="section-kicker">TONIGHT'S PROGRAMME · <span id="programme-position">${String(selected + 1).padStart(2, '0')} / ${String(pieces.length).padStart(2, '0')}</span></div><h1 id="program-title">Choose your composition<span>.</span></h1></div><aside class="program-note" aria-live="polite"><span>✦ &nbsp; A NOTE FROM THE SCORE</span><p id="piece-note">${pieces[selected].note}</p></aside></div>
          <div class="control-strip"><span>PIECES</span><span><kbd>D</kbd> PREVIOUS <kbd>F</kbd> NEXT <kbd>J</kbd><kbd>K</kbd> MOVE</span></div>
          <div class="piece-list" role="listbox" aria-label="Choose a composition">${pieces.map((piece, i) => `
            <button class="piece-card ${i === selected ? 'selected' : ''}" data-piece="${i}" role="option" aria-selected="${i === selected}">
              <span class="piece-number">${piece.number}</span><span class="piece-mark" aria-hidden="true">${piece.mark}</span>
              <span class="piece-main"><strong>${piece.title}</strong><small>${piece.composer} <span class="bullet">·</span> ${piece.year}</small></span>
              <span class="piece-end"><small>LEVEL ${difficultyByPiece[i]}</small><span class="card-arrow">↗</span></span>
            </button>`).join('')}</div>
          <div class="settings-heading"><span class="section-kicker">YOUR ARRANGEMENT</span><span><kbd>D</kbd> LOWER <kbd>F</kbd> RAISE</span></div>
          <div class="settings-grid">
            <div class="setting-card" id="difficulty-control"><label for="difficulty-slider">DIFFICULTY <output id="difficulty-value">${difficultyByPiece[selected]} · ${levelNames[difficultyByPiece[selected] - 1]}</output></label><input id="difficulty-slider" type="range" min="1" max="5" step="1" value="${difficultyByPiece[selected]}"/><div class="range-ends"><span>1 · GENTLE</span><span>5 · VIRTUOSO</span></div></div>
            <div class="setting-card" id="speed-control"><label for="speed-slider">SPEED <output id="speed-value">${speedByPiece[selected].toFixed(2)}×</output></label><input id="speed-slider" type="range" min="0.7" max="1.5" step="0.05" value="${speedByPiece[selected]}"/><div class="range-ends"><span>0.70×</span><span>1.50×</span></div></div>
          </div>
          <div class="selection-foot"><div class="selection-info"><span class="section-kicker">NOW SELECTED</span><strong id="selected-title">${pieces[selected].title}</strong><small id="selected-subtitle">${pieces[selected].subtitle}</small><small id="selected-record">${recordLabel()}</small></div><div class="selection-actions"><button class="secondary-button" id="preview-button" type="button"><kbd class="button-key">L</kbd><span>${previewEnabled ? 'PREVIEW ON' : 'PREVIEW OFF'}</span></button><button class="primary-button" id="start-button"><kbd class="button-key">SPACE</kbd><span>BEGIN PERFORMANCE</span><span class="button-arrow">→</span></button></div></div>
          <p class="source-note">Libre MIDI editions from Mutopia and PDMX · <a href="${import.meta.env.BASE_URL}midi/README.md" target="_blank" rel="noopener">Credits &amp; licenses</a></p>
        </section>
      </main>
      <footer class="site-footer"><span>D/F CHOOSE · J/K MOVE · L PREVIEW · SPACE PLAY</span><span class="footer-center">KEEP YOUR HANDS ON THE KEYS</span><span>USE HEADPHONES FOR THE FULL EXPERIENCE</span></footer>
    </div>`;
}

function showMenu() {
  stopPreview();
  stopGame();
  app.innerHTML = menuMarkup();
  window.scrollTo(0, 0);
  document.querySelectorAll<HTMLButtonElement>('[data-piece]').forEach(button => {
    button.addEventListener('click', () => selectPiece(Number(button.dataset.piece)));
  });
  document.querySelector<HTMLInputElement>('#difficulty-slider')?.addEventListener('input', event => setDifficulty(Number((event.target as HTMLInputElement).value)));
  document.querySelector<HTMLInputElement>('#speed-slider')?.addEventListener('input', event => setSpeed(Number((event.target as HTMLInputElement).value)));
  document.querySelector('#difficulty-control')?.addEventListener('pointerdown', () => setMenuZone('difficulty', false));
  document.querySelector('#speed-control')?.addEventListener('pointerdown', () => setMenuZone('speed', false));
  document.querySelector<HTMLButtonElement>('#start-button')?.addEventListener('click', startGame);
  document.querySelector<HTMLButtonElement>('#preview-button')?.addEventListener('click', () => void togglePreview());
  document.querySelector('#start-button')?.addEventListener('pointerdown', () => setMenuZone('start', false));
  bindFullscreenButton();
  document.querySelector('.brand')?.addEventListener('click', event => event.preventDefault());
  setMenuZone('pieces', false);
  if (previewEnabled) void startPreview();
}

function selectPiece(index: number) {
  if ((index + pieces.length) % pieces.length === selected) { setMenuZone('pieces'); return; }
  const up = index >= selected;
  selected = (index + pieces.length) % pieces.length;
  playUiTick(up);
  setMenuZone('pieces', false);
  document.querySelectorAll<HTMLButtonElement>('[data-piece]').forEach(button => {
    const active = Number(button.dataset.piece) === selected;
    button.classList.toggle('selected', active);
    button.setAttribute('aria-selected', String(active));
  });
  document.querySelector('#selected-title')!.textContent = pieces[selected].title;
  document.querySelector('#selected-subtitle')!.textContent = pieces[selected].subtitle;
  document.querySelector('#piece-note')!.textContent = pieces[selected].note;
  updateRecordLabel();
  document.querySelector('#programme-position')!.textContent = `${String(selected + 1).padStart(2, '0')} / ${String(pieces.length).padStart(2, '0')}`;
  (document.querySelector('#difficulty-slider') as HTMLInputElement).value = String(difficultyByPiece[selected]);
  (document.querySelector('#speed-slider') as HTMLInputElement).value = String(speedByPiece[selected]);
  document.querySelector('#difficulty-value')!.textContent = `${difficultyByPiece[selected]} · ${levelNames[difficultyByPiece[selected] - 1]}`;
  document.querySelector('#speed-value')!.textContent = `${speedByPiece[selected].toFixed(2)}×`;
  const card = document.querySelector<HTMLButtonElement>(`[data-piece="${selected}"]`)!;
  card.scrollIntoView({ block: 'nearest' });
  card.focus({ preventScroll: true });
  if (previewEnabled) void startPreview();
}

function setMenuZone(zone: MenuZone, focus = true) {
  menuZone = zone;
  document.querySelectorAll('.menu-zone-active').forEach(element => element.classList.remove('menu-zone-active'));
  const target = zone === 'pieces' ? document.querySelector<HTMLButtonElement>(`[data-piece="${selected}"]`)
    : zone === 'difficulty' ? document.querySelector<HTMLInputElement>('#difficulty-slider')
    : zone === 'speed' ? document.querySelector<HTMLInputElement>('#speed-slider')
    : document.querySelector<HTMLButtonElement>('#start-button');
  const decoration = zone === 'pieces' ? document.querySelector('.piece-list')
    : zone === 'difficulty' ? document.querySelector('#difficulty-control')
    : zone === 'speed' ? document.querySelector('#speed-control')
    : document.querySelector('#start-button');
  decoration?.classList.add('menu-zone-active');
  if (focus) target?.focus({ preventScroll: true });
}

function setDifficulty(value: number) {
  const next = Math.max(1, Math.min(5, Math.round(value)));
  if (next !== difficultyByPiece[selected]) playUiTick(next > difficultyByPiece[selected]);
  difficultyByPiece[selected] = next;
  (document.querySelector('#difficulty-slider') as HTMLInputElement).value = String(difficultyByPiece[selected]);
  document.querySelector('#difficulty-value')!.textContent = `${difficultyByPiece[selected]} · ${levelNames[difficultyByPiece[selected] - 1]}`;
  document.querySelector(`[data-piece="${selected}"] .piece-end small`)!.textContent = `LEVEL ${difficultyByPiece[selected]}`;
  saveSettings();
  updateRecordLabel();
}

function setSpeed(value: number) {
  const next = Math.max(0.7, Math.min(1.5, Math.round(value * 20) / 20));
  if (next === speedByPiece[selected]) return;
  if (next !== speedByPiece[selected]) playUiTick(next > speedByPiece[selected]);
  speedByPiece[selected] = next;
  (document.querySelector('#speed-slider') as HTMLInputElement).value = String(speedByPiece[selected]);
  document.querySelector('#speed-value')!.textContent = `${speedByPiece[selected].toFixed(2)}×`;
  saveSettings();
  updateRecordLabel();
  if (previewEnabled) void startPreview();
}

function updateRecordLabel() {
  const label = document.querySelector('#selected-record');
  if (label) label.textContent = recordLabel();
}

function updatePreviewButton(label = previewEnabled ? 'PREVIEW ON' : 'PREVIEW OFF') {
  const button = document.querySelector<HTMLButtonElement>('#preview-button');
  if (!button) return;
  button.innerHTML = `<kbd class="button-key">L</kbd><span>${label}</span>`;
  button.classList.toggle('preview-active', previewEnabled);
  button.setAttribute('aria-pressed', String(previewEnabled));
}

function stopPreview(fade = false) {
  previewGeneration++;
  if (previewTimer) window.clearInterval(previewTimer);
  previewTimer = 0;
  previewNotes = [];
  previewNext = 0;
  if (previewContext) {
    const oldContext = previewContext;
    if (fade && previewGain && oldContext.state === 'running') {
      previewGain.gain.cancelScheduledValues(oldContext.currentTime);
      previewGain.gain.setTargetAtTime(0.0001, oldContext.currentTime, 0.055);
      window.setTimeout(() => { void oldContext.close().catch(() => {}); }, 300);
    } else void oldContext.close().catch(() => {});
    previewContext = null;
    previewGain = null;
  }
  updatePreviewButton();
}

function schedulePreview() {
  const ctx = previewContext;
  const gain = previewGain;
  if (!ctx || !gain || ctx.state !== 'running') return;
  if (ctx.currentTime >= previewStartAt + 12) {
    previewStartAt = ctx.currentTime + 0.05;
    previewNext = 0;
    gain.gain.setValueAtTime(0.0001, previewStartAt);
    gain.gain.linearRampToValueAtTime(volume * 0.5, previewStartAt + 0.18);
    gain.gain.setValueAtTime(volume * 0.5, previewStartAt + 10.8);
    gain.gain.linearRampToValueAtTime(0.0001, previewStartAt + 11.8);
  }
  while (previewNext < previewNotes.length && previewStartAt + previewNotes[previewNext].time < ctx.currentTime + 0.35) {
    const note = previewNotes[previewNext++];
    if (previewStartAt + note.time < ctx.currentTime - 0.03) continue;
    playMidiNote(note, Math.max(ctx.currentTime, previewStartAt + note.time), gain, 0.7, ctx);
  }
}

async function startPreview() {
  if (!previewEnabled || playing || !document.querySelector('#preview-button')) return;
  stopPreview(true);
  const generation = previewGeneration;
  const index = selected;
  updatePreviewButton('PREPARING…');
  const ctx = new AudioContext({ latencyHint: 'interactive' });
  previewContext = ctx;
  void ctx.resume().catch(() => {});
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}midi/${pieces[index].file}`);
    if (!response.ok) throw new Error('Preview unavailable');
    const midi = parseMidi(await response.arrayBuffer());
    if (generation !== previewGeneration || index !== selected) return;
    const gain = ctx.createGain();
    previewGain = gain;
    previewStartAt = ctx.currentTime + 0.08;
    gain.gain.setValueAtTime(0.0001, previewStartAt);
    gain.gain.linearRampToValueAtTime(volume * 0.5, previewStartAt + 0.18);
    gain.gain.setValueAtTime(volume * 0.5, previewStartAt + 10.8);
    gain.gain.linearRampToValueAtTime(0.0001, previewStartAt + 11.8);
    gain.connect(ctx.destination);
    const offset = Math.max(midi.notes[0].time, pieces[index].startAt || 0);
    const speed = speedByPiece[index];
    previewNotes = midi.notes.filter(note => note.time + note.duration > offset && (note.time - offset) / speed < 11.8)
      .map(note => ({ ...note, time: Math.max(0, note.time - offset) / speed, duration: Math.max(0.06, Math.min(note.duration - Math.max(0, offset - note.time), 11.8 * speed - Math.max(0, note.time - offset)) / speed) }));
    previewNext = 0;
    updatePreviewButton();
    previewTimer = window.setInterval(schedulePreview, 50);
    schedulePreview();
  } catch {
    if (generation !== previewGeneration) return;
    stopPreview();
    updatePreviewButton('PREVIEW UNAVAILABLE');
  }
}

function togglePreview() {
  previewEnabled = !previewEnabled;
  if (previewEnabled) void startPreview();
  else stopPreview();
  updatePreviewButton();
}

function bindFullscreenButton() {
  document.querySelector('#fullscreen-button')?.addEventListener('click', () => void toggleFullscreen());
}

async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else await app.requestFullscreen();
  } catch { /* Some embedded browsers do not allow the Fullscreen API. */ }
}

document.addEventListener('fullscreenchange', () => {
  const button = document.querySelector('#fullscreen-button');
  if (button) button.innerHTML = fullscreenLabel();
  resizeCanvas();
});

async function prepareAudio() {
  if (!context) {
    context = new AudioContext({ latencyHint: 'interactive' });
    master = context.createGain();
    master.gain.value = volume;
    unplayedLead = context.createGain();
    unplayedLead.gain.value = 1;
    unplayedLead.connect(master);
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.ratio.value = 3;
    master.connect(compressor).connect(context.destination);

  }
  await context.resume();
}

function playMidiNote(note: MidiNote, when: number, destination: AudioNode = master!, accent = 1, audioContext: AudioContext | null = context) {
  if (!audioContext || !destination) return;
  const ctx = audioContext;
  const frequency = 440 * 2 ** ((note.pitch - 69) / 12);
  const velocity = Math.pow(note.velocity / 127, 1.4);
  const peak = (0.015 + velocity * 0.07) * accent;
  const held = Math.max(0.06, note.duration);
  const release = Math.min(0.45, 0.16 + 22 / frequency);
  // Piano partials decay individually: the bright attack falls away quickly,
  // leaving a round fundamental. Respect held notes instead of truncating at 2.6s.
  [1, 0.3, 0.12, 0.045].forEach((strength, i) => {
    if (frequency * (i + 1) > ctx.sampleRate * 0.45) return;
    const oscillator = ctx.createOscillator();
    const amp = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency * (i + 1);
    const decay = Math.max(0.22, (2.8 - i * 0.6) * Math.pow(220 / frequency, 0.25));
    const sustain = Math.max(0.00001, peak * strength * Math.exp(-held / decay));
    amp.gain.setValueAtTime(0.00001, when);
    amp.gain.linearRampToValueAtTime(peak * strength, when + 0.006);
    amp.gain.exponentialRampToValueAtTime(sustain, when + held);
    amp.gain.exponentialRampToValueAtTime(0.00001, when + held + release);
    oscillator.connect(amp).connect(destination);
    oscillator.start(when);
    oscillator.stop(when + held + release + 0.01);
    oscillator.onended = () => { oscillator.disconnect(); amp.disconnect(); };
  });
}

function heardSongTime() {
  if (!context) return 0;
  if (paused) return pausedSongTime;
  const stamp = context.getOutputTimestamp();
  if (typeof stamp.contextTime === 'number' && stamp.contextTime > 0 && typeof stamp.performanceTime === 'number' && stamp.performanceTime > 0) {
    const outputNow = stamp.contextTime + (performance.now() - stamp.performanceTime) / 1000;
    return Math.min(context.currentTime, outputNow) - playAt;
  }
  return context.currentTime - (context.outputLatency || 0) - playAt;
}

function duckMelody() {
  if (!context || !unplayedLead || melodyDucked) return;
  melodyDucked = true;
  const now = context.currentTime;
  unplayedLead.gain.cancelScheduledValues(now);
  unplayedLead.gain.setValueAtTime(unplayedLead.gain.value, now);
  unplayedLead.gain.setTargetAtTime(0.12, now, 0.028);
  document.querySelector('#melody-feedback')?.classList.add('faded');
  const message = document.querySelector('#melody-message');
  if (message) message.textContent = 'The lead part is fading. Catch the next note to bring it back.';
}

function restoreMelody() {
  if (!context || !unplayedLead || !melodyDucked) return;
  melodyDucked = false;
  const now = context.currentTime;
  unplayedLead.gain.cancelScheduledValues(now);
  unplayedLead.gain.setValueAtTime(unplayedLead.gain.value, now);
  unplayedLead.gain.setTargetAtTime(1, now, 0.035);
  document.querySelector('#melody-feedback')?.classList.remove('faded');
  const message = document.querySelector('#melody-message');
  if (message) message.textContent = 'The melody is yours. Keep the rhythm flowing.';
}

function updateAccompaniment() {
  if (!context) return;
  const unlockedCount = accompanimentLayers.filter(layer => combo >= layer.unlockAt).length;
  if (unlockedCount === accompanimentActiveCount) return;
  accompanimentActiveCount = unlockedCount;
  const now = context.currentTime;
  accompanimentBuses.forEach((bus, index) => {
    const gain = index < unlockedCount ? 1 : 0;
    bus.gain.cancelScheduledValues(now);
    bus.gain.setValueAtTime(bus.gain.value, now);
    bus.gain.setTargetAtTime(gain, now, gain ? 0.12 : 0.025);
  });
  const next = accompanimentLayers[unlockedCount];
  const status = document.querySelector('#ensemble-status');
  if (status) status.textContent = next
    ? `${unlockedCount ? `${unlockedCount} VOICE${unlockedCount === 1 ? '' : 'S'} JOINED` : 'SOLO MELODY'} · ${next.name} AT ${next.unlockAt}`
    : 'FULL ENSEMBLE ✦';
}

function playWrongStrike(lane: number) {
  if (!context || !master) return;
  const when = context.currentTime;
  const oscillator = context.createOscillator();
  const amp = context.createGain();
  oscillator.type = 'triangle';
  oscillator.frequency.setValueAtTime(150 + lane * 17, when);
  oscillator.frequency.exponentialRampToValueAtTime(85, when + 0.12);
  amp.gain.setValueAtTime(0.014, when);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.14);
  oscillator.connect(amp).connect(master);
  oscillator.start(when);
  oscillator.stop(when + 0.15);
  oscillator.onended = () => { oscillator.disconnect(); amp.disconnect(); };
}

function playMissEffect() {
  if (!context || !master || performance.now() - lastMissSoundAt < 260) return;
  lastMissSoundAt = performance.now();
  const when = context.currentTime;
  const oscillator = context.createOscillator();
  const amp = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(180, when);
  oscillator.frequency.exponentialRampToValueAtTime(65, when + 0.16);
  amp.gain.setValueAtTime(0.0001, when);
  amp.gain.exponentialRampToValueAtTime(0.007, when + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.0001, when + 0.17);
  oscillator.connect(amp).connect(master);
  oscillator.start(when);
  oscillator.stop(when + 0.18);
  oscillator.onended = () => { oscillator.disconnect(); amp.disconnect(); };
}

function gameMarkup(piece: Piece) {
  return `<div class="salon-shell game-shell">
    <header class="masthead"><button class="back-link" id="back-button">← &nbsp; BACK TO PROGRAMME</button><div class="header-actions"><button class="sound-button" id="volume-button" aria-label="Toggle sound">SOUND <span id="sound-state">${volume ? 'ON' : 'OFF'}</span> ♫</button>${fullscreenButton()}</div></header>
    <main class="game-layout"><aside class="game-sidebar">
      <div class="section-kicker">THE CURRENT PIECE <span class="tiny-star">✦</span> NO. ${piece.number}</div>
      <h1>${piece.title}</h1><p class="composer-line">${piece.composer} <span>·</span> ${piece.year}</p><p class="performance-setup">LEVEL ${difficultyByPiece[selected]} &nbsp; ✦ &nbsp; ${speedByPiece[selected].toFixed(2)}× SPEED</p>
      <div class="sidebar-ornament">❦</div><p class="piece-mood">${piece.mood}</p>
      <div class="score-block"><span class="stat-label">YOUR SCORE</span><strong id="score-display">000000</strong><small class="score-rule">PERFECT 1000 · GREAT 650 · GOOD 350<br/>STREAK ADDS BONUS POINTS</small><small id="game-record">${recordLabel()}</small></div>
      <div class="sidebar-stats"><div><span class="stat-label">STREAK</span><strong id="combo-display">0</strong></div><div><span class="stat-label">ACCURACY</span><strong id="accuracy-display">100%</strong></div></div>
      <div class="progress-heading"><span class="stat-label">PERFORMANCE</span><span id="progress-text">0%</span></div><div class="progress-track"><div id="progress-fill"></div></div>
      <div class="sidebar-tip" id="melody-feedback"><span>✦</span><p id="melody-message">The melody follows your touch.<br/>Miss a note and the music falls quiet.</p></div>
    </aside><section class="stage-wrap"><div class="stage-top"><span>✦ &nbsp; THE STAGE &nbsp; ✦</span><span id="stage-status">READY YOUR FINGERS</span></div><div class="stage-frame"><canvas id="game-canvas" aria-label="Four lane rhythm game"></canvas><div class="stage-streak" aria-live="polite"><span>CURRENT STREAK</span><strong id="stage-streak-count">0</strong><small id="ensemble-status">SOLO MELODY</small></div><div class="countdown" id="countdown" aria-live="polite"><span>PREPARE TO PLAY</span><strong id="countdown-number">5</strong><small>FINGERS ON D F J K</small></div><div class="lane-keys">${KEYS.map((key, i) => `<button class="lane-key" data-lane="${i}" aria-label="Play lane ${key}">${key}</button>`).join('')}</div><div class="stage-overlay hidden" id="pause-overlay"><span>INTERMISSION</span><h2>Take a breath.</h2><p>CHOOSE WITH A SINGLE KEY</p><div class="pause-actions"><button class="primary-button" id="resume-button"><kbd class="button-key">J</kbd> RESUME PERFORMANCE <span>→</span></button><button class="secondary-button" id="pause-menu-button"><kbd class="button-key">K</kbd> BACK TO PROGRAMME</button></div><small class="menu-shortcut-note">SPACE ALSO RESUMES</small></div></div><div class="stage-bottom"><span>LEFT HAND &nbsp; D &nbsp; F</span><span class="bottom-flourish">❧</span><span>J &nbsp; K &nbsp; RIGHT HAND</span></div></section></main>
    <footer class="site-footer"><span>SPACE TO PAUSE · SHIFT+F FULL SCREEN</span><span class="footer-center">IN TEMPO · IN SPIRIT</span><span>GOOD FORTUNE, MAESTRO</span></footer>
  </div>`;
}

async function startGame() {
  if (playing || preparingGame) return;
  preparingGame = true;
  stopPreview();
  const button = document.querySelector<HTMLButtonElement>('#start-button');
  if (button?.disabled) { preparingGame = false; return; }
  if (button) { button.disabled = true; button.querySelector('span')!.textContent = 'PREPARING THE SCORE…'; }
  try {
    const response = await fetch(`${import.meta.env.BASE_URL}midi/${pieces[selected].file}`);
    if (!response.ok) throw new Error(`MIDI file could not be loaded (${response.status}).`);
    const parsed = parseMidi(await response.arrayBuffer());
    const offset = Math.max(parsed.notes[0].time, pieces[selected].startAt || 0);
    const originalLength = parsed.duration - offset;
    pieceNotes = parsed.notes.filter(n => n.time + n.duration > offset && n.time <= offset + originalLength).map(n => ({ ...n, time: Math.max(0, n.time - offset), duration: n.duration - Math.max(0, offset - n.time) }));
    const arrangement = makeChart(pieceNotes, originalLength, difficultyByPiece[selected], pieces[selected].leadTrack ?? 1, pieces[selected].melodyMode);
    chart = arrangement.chart;
    melodySources = new Set(arrangement.melody);
    const speed = speedByPiece[selected];
    for (const note of pieceNotes) { note.time /= speed; note.duration /= speed; }
    for (const note of chart) note.time = note.source.time;
    songLength = originalLength / speed;
    if (chart.length < 8) throw new Error('This score has too few playable notes.');
    await prepareAudio();
    accompanimentLayers = buildAccompanimentLayers(pieceNotes, melodySources);
    accompanimentForNote = new Map(accompanimentLayers.flatMap((layer, index) => layer.notes.map(note => [note, index] as const)));
    accompanimentBuses = accompanimentLayers.map(() => {
      const bus = context!.createGain();
      bus.gain.value = 0;
      bus.connect(master!);
      return bus;
    });
    result = freshResult();
    result.total = chart.length;
    combo = 0;
    accompanimentActiveCount = -1;
    melodyDucked = false;
    scheduleIndex = 0;
    missIndex = 0;
    paused = false;
    playing = true;
    judgment = null;
    sparks = [];
    impacts = [];
    comboCelebrationAt = -Infinity;
    comboCelebrationCount = 0;
    lastOffbeatAt = -Infinity;
    playAt = context!.currentTime + 5;
    app.innerHTML = gameMarkup(pieces[selected]);
    window.scrollTo(0, 0);
    canvas = document.querySelector<HTMLCanvasElement>('#game-canvas');
    resizeObserver = new ResizeObserver(resizeCanvas);
    resizeObserver.observe(canvas!);
    resizeCanvas();
    document.querySelector('#back-button')?.addEventListener('click', showMenu);
    document.querySelector('#volume-button')?.addEventListener('click', toggleVolume);
    document.querySelector('#resume-button')?.addEventListener('click', togglePause);
    document.querySelector('#pause-menu-button')?.addEventListener('click', showMenu);
    bindFullscreenButton();
    updateAccompaniment();
    document.querySelectorAll<HTMLButtonElement>('.lane-key').forEach(button => button.addEventListener('pointerdown', () => hitLane(Number(button.dataset.lane))));
    frame = requestAnimationFrame(loop);
  } catch (error) {
    showMenu();
    const message = error instanceof Error ? error.message : 'Unknown error';
    const note = document.querySelector('.source-note');
    if (note) { note.textContent = `Could not prepare this score: ${message}`; note.classList.add('error'); }
  } finally {
    preparingGame = false;
  }
}

function toggleVolume() {
  volume = volume ? 0 : 0.65;
  if (master && context) master.gain.setTargetAtTime(volume, context.currentTime, 0.03);
  document.querySelector('#sound-state')!.textContent = volume ? 'ON' : 'OFF';
}

function stopGame() {
  playing = false;
  cancelAnimationFrame(frame);
  resizeObserver?.disconnect();
  resizeObserver = null;
  canvas = null;
  accompanimentBuses = [];
  accompanimentLayers = [];
  accompanimentForNote.clear();
  accompanimentActiveCount = -1;
  melodyDucked = false;
  pieceNotes = [];
  chart = [];
  melodySources.clear();
  scheduleIndex = 0;
  missIndex = 0;
  if (context) { void context.close(); context = null; master = null; unplayedLead = null; }
}

async function togglePause() {
  if (!playing || !context) return;
  if (!paused) pausedSongTime = heardSongTime();
  paused = !paused;
  document.querySelector('#pause-overlay')?.classList.toggle('hidden', !paused);
  document.querySelector('#stage-status')!.textContent = paused ? 'INTERMISSION' : 'PLAY IN TEMPO';
  if (paused) document.querySelector<HTMLButtonElement>('#resume-button')?.focus({ preventScroll: true });
  if (paused) await context.suspend(); else await context.resume();
}

function hitLane(lane: number) {
  if (!playing || paused || !context) return;
  const now = heardSongTime();
  keyGlow[lane] = performance.now();
  let chosen: ChartNote | undefined;
  let distance = Infinity;
  for (let i = firstChartAtOrAfter(now - 0.18); i < chart.length; i++) {
    const note = chart[i];
    if (note.time > now + 0.18) break;
    if (note.status !== 'pending' || note.lane !== lane) continue;
    const delta = Math.abs(note.time - now);
    if (delta < distance) { distance = delta; chosen = note; }
  }
  if (!chosen || distance > 0.18) {
    if (now < 0 || now > songLength || performance.now() - lastOffbeatAt < 110) return;
    lastOffbeatAt = performance.now();
    result.offbeat++;
    combo = 0;
    updateAccompaniment();
    duckMelody();
    playWrongStrike(lane);
    impacts.push({ lane, at: performance.now(), kind: 'offbeat' });
    judgment = { text: 'OFF BEAT', at: performance.now(), color: '#e7a59e' };
    updateHud();
    return;
  }
  chosen.status = 'hit';
  restoreMelody();
  combo++;
  updateAccompaniment();
  result.maxCombo = Math.max(result.maxCombo, combo);
  const kind = distance <= 0.065 ? 'PERFECT' : distance <= 0.115 ? 'GREAT' : 'GOOD';
  if (kind === 'PERFECT') { result.perfect++; result.score += 1000 + combo * 8; }
  if (kind === 'GREAT') { result.great++; result.score += 650 + combo * 5; }
  if (kind === 'GOOD') { result.good++; result.score += 350 + combo * 3; }
  const flourish = combo > 0 && combo % 10 === 0;
  if (flourish) { comboCelebrationAt = performance.now(); comboCelebrationCount = combo; }
  impacts.push({ lane, at: performance.now(), kind: 'hit' });
  judgment = { text: kind, at: performance.now(), color: kind === 'PERFECT' ? '#f4d28a' : kind === 'GREAT' ? '#f6e4b8' : '#e7c3a1' };
  const sparkCount = kind === 'PERFECT' ? 28 : 18;
  for (let i = 0; i < sparkCount; i++) sparks.push({ lane, at: performance.now(), angle: Math.PI * 2 * i / sparkCount, speed: 42 + Math.random() * 112, size: 1.5 + Math.random() * 3.3 });
  updateHud();
}

function updateHud() {
  const judged = result.perfect + result.great + result.good + result.missed + result.offbeat;
  const accuracy = judged ? Math.round((result.perfect + result.great * 0.7 + result.good * 0.4) / judged * 100) : 100;
  document.querySelector('#score-display')!.textContent = String(result.score).padStart(6, '0');
  document.querySelector('#combo-display')!.textContent = String(combo);
  document.querySelector('#stage-streak-count')!.textContent = String(combo);
  document.querySelector('#accuracy-display')!.textContent = `${accuracy}%`;
}

function setTextIfChanged(selector: string, value: string) {
  const element = document.querySelector(selector);
  if (element && element.textContent !== value) element.textContent = value;
}

function resizeCanvas() {
  if (!canvas) return;
  const rect = canvas.getBoundingClientRect();
  if (!rect.width || !rect.height) return;
  const ratio = Math.min(2, window.devicePixelRatio || 1, Math.sqrt(2_400_000 / (rect.width * rect.height)));
  const width = Math.round(rect.width * ratio);
  const height = Math.round(rect.height * ratio);
  if (canvas.width !== width) canvas.width = width;
  if (canvas.height !== height) canvas.height = height;
}

function firstChartAtOrAfter(time: number) {
  let lo = 0;
  let hi = chart.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (chart[mid].time < time) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

const jewels = [
  { light: '#ffd0c3', mid: '#e8676d', dark: '#792d42', glow: '231,84,104' },
  { light: '#fff2bb', mid: '#ebbd61', dark: '#8d572f', glow: '243,193,92' },
  { light: '#d5efff', mid: '#6db8e1', dark: '#284c85', glow: '99,181,238' },
  { light: '#d5ffdc', mid: '#82cba0', dark: '#356b61', glow: '121,220,157' },
];

function trackX(boundary: number, y: number, w: number, h: number) {
  const depth = Math.max(0, Math.min(1, y / h));
  const inset = w * 0.21 * (1 - depth) ** 1.15;
  return inset + (w - inset * 2) * boundary / 4;
}

function laneX(lane: number, y: number, w: number, h: number) {
  return trackX(lane + 0.5, y, w, h);
}

function draw(time: number) {
  if (!canvas || !context) return;
  const ctx = canvas.getContext('2d')!;
  const scale = canvas.width / canvas.clientWidth;
  const w = canvas.clientWidth;
  const h = canvas.clientHeight;
  const targetY = h - 94;
  const uiScale = Math.max(1, Math.min(1.55, w / 620));
  const now = heardSongTime();
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const backdrop = ctx.createLinearGradient(0, 0, 0, h);
  backdrop.addColorStop(0, '#130d1d'); backdrop.addColorStop(0.5, '#292032'); backdrop.addColorStop(1, '#4d3032');
  ctx.fillStyle = backdrop; ctx.fillRect(0, 0, w, h);
  const spotlight = ctx.createRadialGradient(w / 2, 2, 6, w / 2, 15, w * 0.75);
  spotlight.addColorStop(0, 'rgba(248,206,132,.29)'); spotlight.addColorStop(1, 'rgba(248,206,132,0)');
  ctx.fillStyle = spotlight; ctx.fillRect(0, 0, w, h);

  // A receding, gilded runway makes the round notes feel as though they approach.
  for (let lane = 0; lane < 4; lane++) {
    const glow = Math.max(0, 1 - (time - keyGlow[lane]) / 180);
    ctx.beginPath();
    ctx.moveTo(trackX(lane, 0, w, h), 0); ctx.lineTo(trackX(lane + 1, 0, w, h), 0);
    ctx.lineTo(trackX(lane + 1, h, w, h), h); ctx.lineTo(trackX(lane, h, w, h), h); ctx.closePath();
    const laneFill = ctx.createLinearGradient(0, 0, 0, h);
    laneFill.addColorStop(0, lane % 2 ? 'rgba(75,53,65,.38)' : 'rgba(92,60,67,.38)');
    laneFill.addColorStop(1, `rgba(${jewels[lane].glow},${0.06 + glow * 0.25})`);
    ctx.fillStyle = laneFill; ctx.fill();
  }
  for (let boundary = 0; boundary <= 4; boundary++) {
    ctx.beginPath(); ctx.moveTo(trackX(boundary, 0, w, h), 0); ctx.lineTo(trackX(boundary, h, w, h), h);
    ctx.strokeStyle = boundary === 0 || boundary === 4 ? 'rgba(250,211,143,.7)' : 'rgba(244,193,125,.32)';
    ctx.lineWidth = boundary === 0 || boundary === 4 ? 2 : 1;
    ctx.shadowColor = '#d6a76e'; ctx.shadowBlur = 7; ctx.stroke(); ctx.shadowBlur = 0;
  }
  for (const y of [45, 86, 140, 211, 305, 427, 570]) {
    if (y > targetY - 30) continue;
    ctx.beginPath(); ctx.moveTo(trackX(0, y, w, h), y); ctx.lineTo(trackX(4, y, w, h), y);
    ctx.strokeStyle = 'rgba(244,206,150,.13)'; ctx.lineWidth = 1; ctx.stroke();
  }
  ctx.textAlign = 'center'; ctx.font = '24px Georgia'; ctx.fillStyle = 'rgba(252,217,156,.28)';
  for (let lane = 0; lane < 4; lane++) ctx.fillText('✦', laneX(lane, 45, w, h), 47);

  const beam = ctx.createLinearGradient(0, targetY - 25, 0, targetY + 25);
  beam.addColorStop(0, 'rgba(244,181,105,0)'); beam.addColorStop(0.5, 'rgba(252,216,147,.2)'); beam.addColorStop(1, 'rgba(244,181,105,0)');
  ctx.fillStyle = beam; ctx.fillRect(0, targetY - 25, w, 50);
  ctx.beginPath(); ctx.moveTo(trackX(0, targetY, w, h), targetY); ctx.lineTo(trackX(4, targetY, w, h), targetY);
  ctx.strokeStyle = '#edc686'; ctx.lineWidth = 2; ctx.shadowColor = '#ffdb9a'; ctx.shadowBlur = 18; ctx.stroke(); ctx.shadowBlur = 0;
  for (let lane = 0; lane < 4; lane++) {
    const x = laneX(lane, targetY, w, h);
    const pulse = Math.max(0, 1 - (time - keyGlow[lane]) / 210);
    ctx.beginPath(); ctx.arc(x, targetY, 28 * uiScale + pulse * 5, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${jewels[lane].glow},${0.15 + pulse * 0.38})`; ctx.fill();
    ctx.strokeStyle = pulse ? jewels[lane].light : '#dab880'; ctx.lineWidth = 3;
    ctx.shadowColor = jewels[lane].mid; ctx.shadowBlur = 14 + pulse * 16; ctx.stroke(); ctx.shadowBlur = 0;
    ctx.beginPath(); ctx.arc(x, targetY, 19 * uiScale, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,236,196,.6)'; ctx.lineWidth = 1; ctx.stroke();
  }

  const firstVisible = firstChartAtOrAfter(now - 0.62);
  const afterVisible = firstChartAtOrAfter(now + 2.8);
  for (let i = afterVisible - 1; i >= firstVisible; i--) {
    const note = chart[i];
    if (note.status !== 'pending') continue;
    const progress = 1 - (note.time - now) / 2.8;
    if (progress < 0 || progress > 1.22) continue;
    const y = 30 + Math.max(0, progress) ** 1.4 * (targetY - 30);
    if (y > h + 30) continue;
    const x = laneX(note.lane, y, w, h);
    const radius = (8 + Math.max(0, progress) * 20) * uiScale;
    const jewel = jewels[note.lane];
    const halo = ctx.createRadialGradient(x, y, radius * 0.35, x, y, radius * 2.2);
    halo.addColorStop(0, `rgba(${jewel.glow},.52)`); halo.addColorStop(1, `rgba(${jewel.glow},0)`);
    ctx.fillStyle = halo; ctx.beginPath(); ctx.arc(x, y, radius * 2.2, 0, Math.PI * 2); ctx.fill();
    const body = ctx.createRadialGradient(x - radius * 0.36, y - radius * 0.48, radius * 0.08, x, y, radius);
    body.addColorStop(0, '#fff8e8'); body.addColorStop(0.22, jewel.light); body.addColorStop(0.62, jewel.mid); body.addColorStop(1, jewel.dark);
    ctx.fillStyle = body; ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = 'rgba(255,246,215,.95)'; ctx.lineWidth = Math.max(1, radius * 0.075); ctx.stroke();
    ctx.beginPath(); ctx.ellipse(x - radius * 0.27, y - radius * 0.35, radius * 0.25, radius * 0.13, -.5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(255,255,255,.78)'; ctx.fill();
  }

  sparks = sparks.filter(spark => time - spark.at < 650);
  for (const spark of sparks) {
    const age = (time - spark.at) / 1000;
    const distance = spark.speed * age;
    const x = laneX(spark.lane, targetY, w, h) + Math.cos(spark.angle) * distance;
    const y = targetY + Math.sin(spark.angle) * distance + 80 * age * age;
    ctx.globalAlpha = 1 - age / 0.65;
    ctx.fillStyle = jewels[spark.lane].light;
    ctx.beginPath(); ctx.arc(x, y, spark.size * (1 - age), 0, Math.PI * 2); ctx.fill();
  }
  ctx.globalAlpha = 1;

  impacts = impacts.filter(impact => time - impact.at < 560);
  for (const impact of impacts) {
    const age = Math.max(0, (time - impact.at) / 560);
    const x = laneX(impact.lane, targetY, w, h);
    const radius = (32 + age * 90) * uiScale;
    ctx.globalAlpha = (1 - age) * (impact.kind === 'hit' ? 0.8 : 0.6);
    ctx.beginPath(); ctx.arc(x, targetY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = impact.kind === 'hit' ? jewels[impact.lane].light : '#e88684';
    ctx.lineWidth = impact.kind === 'hit' ? 4 * (1 - age) + 1 : 2;
    ctx.shadowBlur = 18; ctx.shadowColor = ctx.strokeStyle; ctx.stroke(); ctx.shadowBlur = 0;
    if (impact.kind === 'hit') {
      const flash = ctx.createRadialGradient(x, targetY, 0, x, targetY, radius * 1.7);
      flash.addColorStop(0, `rgba(${jewels[impact.lane].glow},${0.22 * (1 - age)})`);
      flash.addColorStop(1, `rgba(${jewels[impact.lane].glow},0)`);
      ctx.fillStyle = flash; ctx.beginPath(); ctx.arc(x, targetY, radius * 1.7, 0, Math.PI * 2); ctx.fill();
    }
  }
  ctx.globalAlpha = 1;

  if (time - comboCelebrationAt < 1000) {
    const age = (time - comboCelebrationAt) / 1000;
    ctx.globalAlpha = 1 - age;
    ctx.textAlign = 'center'; ctx.font = `bold ${30 + age * 12}px Georgia`;
    ctx.fillStyle = '#ffdf9b'; ctx.shadowBlur = 20; ctx.shadowColor = '#e8a85e';
    ctx.fillText(`✦ ${comboCelebrationCount} NOTE STREAK ✦`, w / 2, h * 0.29 - age * 25);
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  if (judgment && time - judgment.at < 700) {
    const age = (time - judgment.at) / 700;
    ctx.globalAlpha = 1 - age;
    ctx.textAlign = 'center'; ctx.font = `bold ${25 + age * 9}px Georgia`; ctx.shadowColor = '#111'; ctx.shadowBlur = 8;
    ctx.fillStyle = judgment.color; ctx.fillText(judgment.text, w / 2, targetY - 65 - age * 24);
    if (combo > 1) { ctx.font = '13px Georgia'; ctx.fillText(`${combo} NOTE STREAK`, w / 2, targetY - 43 - age * 24); }
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
}

function loop(time: number) {
  if (!playing || !context) return;
  if (!paused) {
    const now = heardSongTime();
    const scheduledTime = context.currentTime - playAt;
    while (scheduleIndex < pieceNotes.length && pieceNotes[scheduleIndex].time - scheduledTime < 0.32) {
      const note = pieceNotes[scheduleIndex++];
      const when = playAt + note.time;
      if (when >= context.currentTime - 0.03) {
        const melody = melodySources.has(note);
        const layer = accompanimentForNote.get(note);
        if (layer !== undefined && combo < accompanimentLayers[layer].unlockAt) continue;
        const destination = melody ? unplayedLead : layer === undefined ? master : accompanimentBuses[layer];
        playMidiNote(note, Math.max(context.currentTime, when), destination!, melody ? 1.1 : 0.65);
      }
    }
    let changed = false;
    while (missIndex < chart.length && now > chart[missIndex].time + 0.18) {
      const note = chart[missIndex++];
      if (note.status === 'pending' && now > note.time + 0.18) {
        note.status = 'miss'; result.missed++; combo = 0; changed = true;
        updateAccompaniment();
        duckMelody();
        playMissEffect();
        impacts.push({ lane: note.lane, at: time, kind: 'miss' });
        judgment = { text: 'MISSED', at: time, color: '#d7a9a0' };
      }
    }
    if (changed) updateHud();
    const progress = Math.min(100, Math.max(0, now / songLength * 100));
    (document.querySelector('#progress-fill') as HTMLElement).style.width = `${progress}%`;
    setTextIfChanged('#progress-text', `${Math.round(progress)}%`);
    const countdown = document.querySelector<HTMLElement>('#countdown')!;
    countdown.classList.toggle('hidden', now >= 0);
    if (now < 0) {
      const remaining = Math.max(1, Math.min(5, Math.ceil(-now)));
      setTextIfChanged('#countdown-number', String(remaining));
      setTextIfChanged('#stage-status', `BEGINNING IN ${remaining}`);
    } else setTextIfChanged('#stage-status', judgment && time - judgment.at < 550 && (judgment.text === 'MISSED' || judgment.text === 'OFF BEAT') ? 'THE MELODY FADES' : combo >= 10 ? 'BRAVO! KEEP THE RHYTHM' : 'PLAY IN TEMPO');
    if (now > songLength + 1.15) { showResults(); return; }
  }
  draw(time);
  frame = requestAnimationFrame(loop);
}

function showResults() {
  const piece = pieces[selected];
  const accuracy = result.total ? Math.round((result.perfect + result.great * 0.7 + result.good * 0.4) / (result.total + result.offbeat) * 100) : 0;
  const grade = accuracy >= 94 ? 'S' : accuracy >= 83 ? 'A' : accuracy >= 68 ? 'B' : accuracy >= 48 ? 'C' : 'D';
  const praise = grade === 'S' ? 'An exquisite performance.' : grade === 'A' ? 'The salon applauds you.' : grade === 'B' ? 'A fine rendition.' : 'Every maestro begins somewhere.';
  const { previous, isBest } = saveRecord(accuracy);
  stopGame();
  app.innerHTML = `<div class="salon-shell result-shell"><header class="masthead"><a class="brand" href="#"><span class="brand-seal">♬</span><span>SITAR <em>HERO</em></span></a>${fullscreenButton()}</header><main class="result-main"><div class="result-card"><div class="eyebrow"><span class="thin-line"></span> THE FINAL ENCORE <span class="thin-line"></span></div><span class="result-flourish">❦</span><h1>${praise}</h1><p>${piece.title} <span>·</span> ${piece.composer}</p><div class="result-medallion"><span>RANK</span><strong>${grade}</strong></div><div class="result-grid"><div><span>SCORE</span><strong>${result.score.toLocaleString()}</strong></div><div><span>ACCURACY</span><strong>${accuracy}%</strong></div><div><span>BEST STREAK</span><strong>${result.maxCombo}</strong></div></div><div class="record-banner">${isBest ? '✦ NEW PERSONAL BEST ✦' : `PERSONAL BEST · ${previous?.score.toLocaleString()} PTS`} <small>LEVEL ${difficultyByPiece[selected]} · ${speedByPiece[selected].toFixed(2)}× SPEED · SAVED ON THIS DEVICE</small></div><div class="result-detail">${result.perfect} perfect &nbsp;·&nbsp; ${result.great} great &nbsp;·&nbsp; ${result.good} good &nbsp;·&nbsp; ${result.missed} missed &nbsp;·&nbsp; ${result.offbeat} off beat</div><div class="result-actions"><button class="primary-button" id="replay-button"><kbd class="button-key">J</kbd> PLAY AGAIN <span>↻</span></button><button class="secondary-button" id="menu-button"><kbd class="button-key">K</kbd> CHOOSE ANOTHER PIECE</button></div></div></main><footer class="site-footer"><span>J PLAY AGAIN · K PROGRAMME</span><span>BUTTONS ALSO WORK WITH TAB AND ENTER</span></footer></div>`;
  window.scrollTo(0, 0);
  document.querySelector('#replay-button')?.addEventListener('click', startGame);
  document.querySelector('#menu-button')?.addEventListener('click', showMenu);
  bindFullscreenButton();
  document.querySelector('.brand')?.addEventListener('click', event => { event.preventDefault(); showMenu(); });
  document.querySelector<HTMLButtonElement>('#replay-button')?.focus({ preventScroll: true });
}

function resumePreviewFromGesture() {
  if (previewEnabled && previewContext?.state === 'suspended') void previewContext.resume().then(schedulePreview).catch(() => {});
}

window.addEventListener('pointerdown', resumePreviewFromGesture, { capture: true });
window.addEventListener('keydown', resumePreviewFromGesture, { capture: true });

window.addEventListener('keydown', event => {
  const key = event.key.toUpperCase();
  if (event.shiftKey && key === 'F') { event.preventDefault(); if (!event.repeat) void toggleFullscreen(); return; }
  if (event.repeat && !document.querySelector('#start-button')) return;

  if (playing && paused) {
    if (key === 'ESCAPE' || key === ' ' || key === 'D' || key === 'J') { event.preventDefault(); if (!event.repeat) void togglePause(); return; }
    if (key === 'F' || key === 'K') { event.preventDefault(); if (!event.repeat) showMenu(); return; }
    if (key === 'ENTER') { event.preventDefault(); if (document.activeElement?.id === 'pause-menu-button') showMenu(); else void togglePause(); return; }
    return;
  }

  if (playing) {
    if (key === 'ESCAPE' && document.fullscreenElement) return;
    if (key === 'ESCAPE' || key === ' ') { event.preventDefault(); if (!event.repeat) void togglePause(); return; }
    const lane = KEYS.indexOf(key);
    if (lane >= 0) { event.preventDefault(); if (!event.repeat) hitLane(lane); }
    return;
  }

  if (document.querySelector('#start-button')) {
    if (key === 'L') { event.preventDefault(); if (!event.repeat) void togglePreview(); return; }
    if (key === ' ' && !event.repeat) { event.preventDefault(); void startGame(); return; }
    if (key === 'J' || key === 'K') {
      event.preventDefault();
      const next = (menuZones.indexOf(menuZone) + (key === 'K' ? 1 : -1) + menuZones.length) % menuZones.length;
      setMenuZone(menuZones[next]);
      return;
    }
    if (key === 'D' || key === 'F') {
      event.preventDefault();
      const step = key === 'F' ? 1 : -1;
      if (menuZone === 'pieces') selectPiece(selected + step);
      else if (menuZone === 'difficulty') setDifficulty(difficultyByPiece[selected] + step);
      else if (menuZone === 'speed') setSpeed(speedByPiece[selected] + step * 0.05);
      else if (key === 'F' && !event.repeat) void startGame();
      return;
    }
    if ((key === 'ARROWUP' || key === 'ARROWDOWN') && menuZone === 'pieces') { event.preventDefault(); selectPiece(selected + (key === 'ARROWDOWN' ? 1 : -1)); }
    return;
  }

  if (document.querySelector('#replay-button')) {
    if (key === 'J' || key === 'D') { event.preventDefault(); if (!event.repeat) void startGame(); return; }
    if (key === 'K' || key === 'F') { event.preventDefault(); if (!event.repeat) showMenu(); return; }
    if (key === 'ENTER' || key === ' ') { event.preventDefault(); if (!event.repeat) { if (document.activeElement?.id === 'menu-button') showMenu(); else void startGame(); } }
  }
});

showMenu();
