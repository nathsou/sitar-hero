import assert from 'node:assert/strict';
import fs from 'node:fs';
import {parseMidi} from '../src/midi.ts';
import {makeChart} from '../src/chart.ts';
import {buildAccompanimentLayers} from '../src/progression.ts';
function read(name) {
  const bytes = fs.readFileSync(new URL(`../public/midi/${name}.mid`, import.meta.url));
  return parseMidi(bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength));
}
const moonlight = read('moonlight-sonata');
const moon = makeChart(moonlight.notes, 62, 5, 1, 'sustained');
assert.deepEqual(moon.melody.slice(0, 8).map(n => n.pitch), [68,68,68,68,68,68,69,68]);
assert(Math.abs(moon.melody[0].time - 19) < 1e-6);
assert(moon.melody.every(n => Math.abs(n.duration - 1/3) > 0.01), 'Triplet accompaniment must not become targets');
const spring = read('spring');
assert(makeChart(spring.notes, 62, 5, 1).chart.every(n => n.source.track === 1), 'Spring must follow the solo violin');
const elise = read('fur-elise');
assert.deepEqual(makeChart(elise.notes, 62, 5, 1).melody.slice(0, 5).map(n => n.pitch), [76,75,76,75,76]);
for (const filename of fs.readdirSync(new URL('../public/midi/', import.meta.url)).filter(n => n.endsWith('.mid'))) {
  const midi = read(filename.slice(0,-4));
  let previous = new Set();
  for (let level=1;level<=5;level++) {
    const {chart, melody} = makeChart(midi.notes, midi.duration, level, 1, filename.startsWith('moonlight') ? 'sustained' : undefined);
    assert(chart.length >= 8, `${filename} level ${level} needs playable notes`);
    const selected = new Set(chart.map(n => n.source));
    for(const note of previous) assert(selected.has(note), 'Increasing difficulty must preserve learned notes');
    assert(chart.every(n => melody.includes(n.source) && n.time === n.source.time));
    if (midi.duration > 80) assert(chart.at(-1).time > 62, `${filename} must chart the full piece`);
    for(let i=1;i<chart.length;i++) assert(chart[i].time > chart[i-1].time);
    previous = selected;
  }
  const {melody} = makeChart(midi.notes, midi.duration, 3, 1, filename.startsWith('moonlight') ? 'sustained' : undefined);
  const layers = buildAccompanimentLayers(midi.notes, new Set(melody));
  assert(layers.length >= 1, `${filename} must have accompaniment to unlock`);
  const notesInLayers = layers.flatMap(layer => layer.notes);
  assert.equal(new Set(notesInLayers).size, notesInLayers.length, `${filename} must not duplicate accompaniment`);
  assert.equal(notesInLayers.length + melody.length, midi.notes.length, `${filename} must route every note`);
  assert.equal(layers[0].unlockAt, 5);
  for (let i=1;i<layers.length;i++) assert(layers[i].unlockAt > layers[i-1].unlockAt);
}
console.log('11 MIDI editions: melody excerpts, solo routing, timing, and all difficulty levels passed.');
