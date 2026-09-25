import type { Results } from '../game/game';
import { layerNames } from '../music/arrange';
import { DIFFICULTIES, type Difficulty } from '../music/chart';
import type { SongDef } from '../music/songs';

export interface Review {
  headline: string;
  deck: string;
  paragraphs: string[];
  critic: string;
}

const HEADLINES = [
  'Soloist Dismissed from Court!',
  'A Night the Court Would Rather Forget',
  'Murmurs Behind the Fans',
  'Received with Polite Approval',
  'Warm Applause in the Gallery',
  'A Triumph Worthy of Versailles!',
];

const OPENINGS = [
  (s: string) =>
    `Scarcely had the ${s} begun than His Excellency rose, took up his hat, and swept from the Hall of Mirrors. The orchestra fell silent mid-phrase; a lady in the third row fainted, though whether from shock or from relief this correspondent cannot say.`,
  (s: string) =>
    `The ${s} was attempted last evening before a patient court. It is the duty of this Gazette to report it, and we do so with a heavy quill.`,
  (s: string) =>
    `Last evening’s ${s} provoked much whispering behind lace fans. There were passages of promise, but also stumbles enough to set the powdered wigs a-trembling.`,
  (s: string) =>
    `The ${s} was given a creditable reading last evening. The court applauded politely, and more than one courtier was seen to tap a buckled shoe in time.`,
  (s: string) =>
    `A fine account of the ${s} delighted the gallery last evening. The candles burned bright, the orchestra swelled, and the applause went on for some minutes.`,
  (s: string) =>
    `Never has the Hall of Mirrors reflected such brilliance! The ${s} was dispatched with such grace that the chandeliers themselves seemed to sway, and His Excellency was moved to wipe away a tear with a lace handkerchief.`,
];

const CRITICS = [
  'The Abbé de Contrepoint',
  'Madame de la Cadence',
  'Our correspondent in the gallery',
  'Le Chevalier de Basso-Continuo',
  'The Marquise de Fioritura',
];

export function writeReview(r: Results, song: SongDef, diff: Difficulty, speed: number): Review {
  const level = DIFFICULTIES.find((d) => d.id === diff)!.name;
  const lines: string[] = [];
  const hits = r.counts.perfect + r.counts.great + r.counts.good;
  const perfectShare = hits ? r.counts.perfect / hits : 0;

  const arc = shape(r.thirds);
  if (arc) lines.push(arc);

  if (r.counts.miss === 0 && !r.failed) lines.push('Not a single faux pas the whole evening, a thing unheard of in living memory.');
  else if (perfectShare > 0.8) lines.push('One could have set a pocket-watch by those fingers.');
  else if (perfectShare < 0.35 && hits > 10) lines.push('The notes arrived, as a rule, though rarely at quite the appointed moment.');

  if (hits > 10 && Math.abs(r.meanOffsetMs) > 18) {
    lines.push(
      r.meanOffsetMs < 0
        ? 'If anything, the soloist was over-eager, forever rushing ahead of the harpsichordist.'
        : 'The soloist lagged a hair behind the beat, like a courtier late to supper.',
    );
  }

  if (r.early >= 3) lines.push('Several jewels were struck before their time, much to the harpsichordist’s alarm.');

  if (r.holdCount > 0 && !r.failed) {
    if (r.holdsCompleted === r.holdCount) lines.push('Every silken ribbon was sustained to its very last breath.');
    else if (r.holdsCompleted < r.holdCount / 2) lines.push('Alas, several of the silken ribbons slipped from the soloist’s grasp.');
  }

  if (r.maxStreak >= 100) lines.push(`A run of ${r.maxStreak} notes without blemish drew audible gasps.`);
  else if (r.maxStreak >= 40) lines.push(`At one point ${r.maxStreak} notes fell in unbroken succession.`);

  if (r.maxTier >= 4) lines.push('By the finale the trumpets and timpani had joined in full splendour, and fireworks bloomed beyond the windows.');
  else if (r.maxTier <= 1) lines.push('The orchestra, sensing uncertainty, never quite dared to join in.');
  else lines.push(`The ${layerNames(song)[r.maxTier].toLowerCase()} joined in at the height of the evening, though the ${layerNames(song)[4].toLowerCase()} stayed in their cases.`);

  if (r.fortissimos > 0) {
    lines.push(r.fortissimos > 1 ? `The Fortissimo was unleashed ${r.fortissimos} times, to thunderous effect.` : 'The Fortissimo, when it came, rattled the very mirrors.');
  }

  if (speed < 1) lines.push(`(The performance was given at a gentle ${Math.round(speed * 100)}% of the proper tempo, as a rehearsal, and is not entered in the records.)`);

  const stars = r.failed ? 0 : r.stars;
  return {
    headline: HEADLINES[stars],
    deck: `${song.title}, by ${song.composer}: performed at the ${level} level`,
    paragraphs: [OPENINGS[stars](song.title), lines.join(' ')],
    critic: CRITICS[Math.floor(Math.random() * CRITICS.length)],
  };
}

export function gazetteDate(): string {
  const now = new Date();
  const day = now.toLocaleDateString('en-GB', { weekday: 'long' });
  const month = now.toLocaleDateString('en-GB', { month: 'long' });
  return `${day}, the ${ordinal(now.getDate())} of ${month}, 1730`;
}

function ordinal(n: number): string {
  const s = n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] ?? 'th';
  return `${n}${s}`;
}

const an = (word: string) => (/^[aeiou]/.test(word) ? `an ${word}` : `a ${word}`);
const describe = (x: number) => (x >= 0.93 ? 'immaculate' : x >= 0.82 ? 'assured' : x >= 0.66 ? 'uneven' : x >= 0.45 ? 'shaky' : 'ragged');

/** One sentence on how the performance developed, from accuracy over its three thirds. */
function shape(thirds: number[]): string | null {
  const [a, b, c] = thirds;
  if ([a, b, c].some((x) => Number.isNaN(x))) return null;
  const hi = Math.max(a, b, c);
  const lo = Math.min(a, b, c);
  if (hi - lo < 0.08) return `The playing was ${describe(a)} from the first bar to the last.`;
  if (b < a - 0.1 && b < c - 0.1) return `${cap(an(describe(a)))} opening gave way to ${an(describe(b))} middle passage, before ${an(describe(c))} finale restored the room’s composure.`;
  if (c < a - 0.1) return `What began ${describe(a)} grew ${describe(c)} as the evening wore on.`;
  if (c > a + 0.1) return `${cap(an(describe(a)))} start warmed into ${an(describe(c))} finish.`;
  return `The opening was ${describe(a)}, the middle ${describe(b)}, the close ${describe(c)}.`;
}

const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
