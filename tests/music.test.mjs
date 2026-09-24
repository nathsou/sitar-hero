import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMidi} from '../src/midi.ts';
import {makeChart} from '../src/chart.ts';
import {buildAccompanimentLayers} from '../src/progression.ts';
function read(name) {
  const bytes = fs.readFileSync(new URL(`../public/midi/${name}.mid`, import.meta.url));
  return parseMidi(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}
const catalogSource = fs.readFileSync(new URL('../src/main.ts', import.meta.url), 'utf8');
const catalogEntries = [...catalogSource.matchAll(/^  \{ title: .+ file: '([^']+\.mid)'.+ \},?$/gm)].map(([row, file]) => ({file, leadTrack: Number(row.match(/leadTrack: (\d+)/)?.[1] || 0), sustained: row.includes("melodyMode: 'sustained'")}));
const catalog = catalogEntries.map(entry => entry.file);
const settingsByFile = new Map(catalogEntries.map(entry => [entry.file, entry]));
const bundled = fs.readdirSync(new URL('../public/midi/', import.meta.url)).filter(n => n.endsWith('.mid')).sort();
assert(catalog.length >= 22, 'The full score programme must be present');
assert.equal(new Set(catalog).size, catalog.length, 'Each score needs its own MIDI file');
assert.deepEqual(catalog.sort(), bundled, 'Every catalogue score must have a bundled MIDI and every MIDI must be listed');
const moonlight = read('moonlight-sonata');
const moon = makeChart(moonlight.notes, 62, 5, 1, 'sustained');
assert.deepEqual(moon.melody.slice(0, 8).map(n => n.pitch), [68,68,68,68,68,68,69,68]);
assert(Math.abs(moon.melody[0].time - 19) < 1e-6);
assert(moon.melody.every(n => Math.abs(n.duration - 1/3) > 0.01), 'Triplet accompaniment must not become targets');
const spring = read('spring');
assert(makeChart(spring.notes, 62, 5, 1).chart.every(n => n.source.track === 1), 'Spring must follow the solo violin');
const satie = read('gymnopedie-no1');
const satieChart = makeChart(satie.notes, satie.duration, 1, 1).chart;
assert(satieChart.some(n => n.holdDuration >= 1), 'Satie must include sustained notes to hold');
const elise = read('fur-elise');
assert.deepEqual(makeChart(elise.notes, 62, 5, 1).melody.slice(0, 5).map(n => n.pitch), [76,75,76,75,76]);
for (const filename of bundled) {
  const midi = read(filename.slice(0,-4));
  const settings = settingsByFile.get(filename);
  let previous = new Set();
  for (let level=1;level<=5;level++) {
    const {chart, melody} = makeChart(midi.notes, midi.duration, level, settings.leadTrack || undefined, settings.sustained ? 'sustained' : undefined);
    assert(chart.length >= 8, `${filename} level ${level} needs playable notes`);
    const selected = new Set(chart.map(n => n.source));
    for(const note of previous) assert(selected.has(note), 'Increasing difficulty must preserve learned notes');
    assert(chart.every(n => melody.includes(n.source) && n.time === n.source.time));
    for (let i = 0; i < chart.length; i++) {
      const note = chart[i];
      assert(note.holdDuration >= 0 && note.holdDuration <= note.source.duration, `${filename} has an invalid hold length`);
      if (!note.holdDuration) continue;
      const nextInLane = chart.slice(i + 1).find(other => other.lane === note.lane);
      if (nextInLane) assert(note.time + note.holdDuration < nextInLane.time, `${filename} has overlapping holds in one lane`);
    }
    if (/^holst-(?!jupiter-thaxted)/.test(filename) && level === 5) {
      assert(chart[0].time <= 5, `${filename} needs a playable opening`);
      assert(midi.duration - chart.at(-1).time <= 12, `${filename} needs a playable ending`);
      for (let i = 1; i < chart.length; i++) assert(chart[i].time - chart[i-1].time <= 15, `${filename} cannot leave a long silent gap in the chart`);
    }
    if (midi.duration > 80) assert(chart.at(-1).time > 62, `${filename} must chart the full piece`);
    for(let i=1;i<chart.length;i++) assert(chart[i].time > chart[i-1].time);
    previous = selected;
  }
  const {melody} = makeChart(midi.notes, midi.duration, 3, settings.leadTrack || undefined, settings.sustained ? 'sustained' : undefined);
  const layers = buildAccompanimentLayers(midi.notes, new Set(melody));
  assert(layers.length >= 1, `${filename} must have accompaniment to unlock`);
  const notesInLayers = layers.flatMap(layer => layer.notes);
  assert.equal(new Set(notesInLayers).size, notesInLayers.length, `${filename} must not duplicate accompaniment`);
  assert.equal(notesInLayers.length + melody.length, midi.notes.length, `${filename} must route every note`);
  assert.equal(layers[0].unlockAt, 5);
  for (let i=1;i<layers.length;i++) assert(layers[i].unlockAt > layers[i-1].unlockAt);
}
console.log(`${bundled.length} MIDI editions: catalogue assets, melody excerpts, solo routing, timing, and all difficulty levels passed.`);
