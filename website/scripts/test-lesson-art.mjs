// Focused artwork/integration regressions. This is not a tensor-equivalence proof
// or a browser layout test; those checks are recorded separately.
// Run from any directory: node website/scripts/test-lesson-art.mjs
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import { originalExercises } from '../original-exercises.js';

const root = new URL('../', import.meta.url);
const read = name => readFile(new URL(name, root), 'utf8');
const nativeFetch = globalThis.fetch;
let art;
try {
  // Only the renderer's local graph-data request is substituted. No server or
  // browser is launched, and ordinary network fetch behaviour is preserved.
  globalThis.fetch = async (input, options) => {
    const url = new URL(input instanceof Request ? input.url : input);
    return url.protocol === 'file:'
      ? new Response(await readFile(url), { headers: { 'content-type': 'application/json' } })
      : nativeFetch(input, options);
  };
  art = await import('../lesson-diagrams.js');
} finally {
  globalThis.fetch = nativeFetch;
}
const [overview, deck] = await Promise.all(['index.html', 'slides.html'].map(read));
const allIds = Array.from({ length: 21 }, (_, i) => `image-${String(i + 2).padStart(3, '0')}`);
const exerciseIds = [3, 6, 8, 11, 13, 15, 17, 19, 21, 22].map(n => `image-${String(n).padStart(3, '0')}`);
const ruleIds = allIds.filter(id => !exerciseIds.includes(id));
const boundaryNames = new Set(Object.values(originalExercises).flatMap(exercise => exercise.start.boundaries));
const normalize = markup => markup.replace(/lesson-figure-\d+/g, 'lesson-figure-ID').replace(/intro-gate-mask-\d+/g, 'intro-gate-mask-ID');
const visibleText = markup => [...markup.matchAll(/<text\b[^>]*>([\s\S]*?)<\/text>/g)].map(match => match[1].replace(/<[^>]+>/g, '').trim());
function checkSvg(markup, name) {
  assert.match(markup, /<svg\b/, `${name}: contains an SVG`);
  assert.doesNotMatch(markup, /NaN|Infinity|undefined/, `${name}: all geometry is finite`);
  assert.match(markup, /<path\b[^>]*d="[^\"]*C /, `${name}: uses curved wire geometry`);
  assert.doesNotMatch(markup, /<(?:script|animate|animateTransform)\b/, `${name}: no embedded script or implicit animation`);
  for (const label of visibleText(markup)) assert.ok(!boundaryNames.has(label), `${name}: boundary ${label} must not be visible`);
}

test('the original introduction is static and all 21 remaining drawings keep their overview destinations', () => {
  for (const [name, html] of [['overview', overview], ['deck', deck]]) {
    const ids = [...html.matchAll(/data-lesson-art="([^"]+)"/g)].map(match => match[1]);
    assert.deepEqual(ids, allIds, `${name}: exactly one mount per original artwork, in order`);
    assert.equal((html.match(/<img\b[^>]*intro-circuit\.png/g)||[]).length,1,`${name}: original introduction is restored exactly once`);
    assert.doesNotMatch(html, /data-lesson-art="intro-circuit"/, `${name}: intro never animates`);
    assert.match(html, /<script\b[^>]*src="lesson-additions\.js"/, `${name}: replacement artwork is mounted`);
  }
  const figures = [...overview.matchAll(/<figure\b[^>]*data-game-slide="(\d+)"[^>]*>([\s\S]*?)<\/figure>/g)];
  const links = figures.filter(match => /data-lesson-art=/.test(match[2])).map(match => Number(match[1]));
  assert.deepEqual(links, [1, 2, 3, 3, ...Array.from({ length: 17 }, (_, i) => i + 4)]);
  assert.deepEqual([...art.originalExerciseIds].sort(), [...exerciseIds].sort());
});

test('all 11 rules render finite curves at 41 motion samples', () => {
  assert.equal(art.availableRules.length, 11);
  for (const id of ruleIds) for(let sample=0;sample<=40;sample++) checkSvg(art.ruleDiagram(id,{progress:sample/40}),`${id}@${sample}/40`);
});

test('yanking endpoints and boundary tangents stay vertical, and Hopf spiders never move',()=>{
  for(let sample=0;sample<=40;sample++){
    const frame=art.ruleDiagram('yanking',{progress:sample/40});
    const path=frame.match(/<path d="([^"]+)"/)[1];
    const numbers=path.match(/-?\d+(?:\.\d+)?/g).map(Number);
    assert.equal(numbers[0],300);assert.equal(numbers[2],300);assert.equal(numbers[4],300);
    assert.equal(numbers.at(-2),300);assert.equal(numbers.at(-4),300);assert.equal(numbers.at(-6),300);
    const hopf=art.ruleDiagram('hopf',{progress:sample/40});
    const nodes=[...hopf.matchAll(/<g transform="translate\(([^)]+)\) scale\(1\)"/g)].map(m=>m[1]);
    assert.deepEqual(nodes,['225 170','375 170']);
  }
  assert.equal(originalExercises['image-006'].goal.edges.filter(e=>e.includes('z')&&e.includes('x')).length,1,'Fusion target has exactly one connecting wire');
});

test('all 10 exercise IDs reject rule animation and return only their unchanged authored endpoints', () => {
  const frozenData = JSON.stringify(originalExercises);
  for (const id of exerciseIds) {
    assert.throws(() => art.ruleDiagram(id), /No approved lesson animation/, id);
    const exercise = originalExercises[id];
    const start = normalize(art.drawGraph(exercise.start, { label: 'Exercise diagram' }));
    const goal = normalize(art.drawGraph(exercise.goal, { label: 'Goal diagram' }));
    assert.equal(normalize(art.exerciseDiagram(id, { variant: 'start' })), start);
    assert.equal(normalize(art.exerciseDiagram(id, { variant: 'goal' })), goal);
    const pair = normalize(art.exerciseDiagram(id));
    assert.equal(pair, `<div class="lesson-art-pair">${start}<span aria-hidden="true">→</span>${goal}</div>`);
    checkSvg(pair, id);
    for (const progress of [0, .25, .5, .75, 1]) {
      assert.equal(normalize(art.exerciseDiagram(id, { progress })), pair, `${id}: progress never transforms a puzzle into its answer`);
    }
    assert.ok(Object.keys(exercise).every(key => ['start', 'goal', 'editorStart', 'goalAlternatives'].includes(key)), `${id}: no solution trace is shipped`);
  }
  assert.equal(JSON.stringify(originalExercises), frozenData, 'Rendering does not mutate any authored graph');
});

function animationHarness(reducedMotion = false) {
  const frames = new Map();
  let nextFrame = 0, intersection;
  const mediaListeners = new Set();
  const media = {
    matches: reducedMotion,
    addEventListener(type, callback) { if (type === 'change') mediaListeners.add(callback); },
    removeEventListener(type, callback) { if (type === 'change') mediaListeners.delete(callback); },
  };
  const win = {
    matchMedia: () => media,
    requestAnimationFrame: callback => { frames.set(++nextFrame, callback); return nextFrame; },
    cancelAnimationFrame: id => frames.delete(id), dispatchEvent() {},
    IntersectionObserver: class { constructor(callback) { intersection = callback; } observe() {} disconnect() {} },
  };
  const doc = {
    defaultView: win, hidden: false, addEventListener() {}, removeEventListener() {},
    createElement: tagName => ({ tagName, innerHTML: '', setAttribute() {}, addEventListener() {}, removeEventListener() {} }),
  };
  const container = { ownerDocument: doc, host: null, closest: () => null, replaceChildren(host) { this.host = host; } };
  return {
    container,
    visible() { intersection([{ isIntersecting: true, intersectionRatio: 1 }]); },
    tick(now) { const callbacks = [...frames.values()]; frames.clear(); callbacks.forEach(callback => callback(now)); },
    setReducedMotion(value) { media.matches = value; [...mediaListeners].forEach(callback => callback({ matches: value })); },
    pending: () => frames.size,
  };
}
test('exercise previews are static start-to-target pairs with no replay button or entrance animation',()=>{
  for(const id of exerciseIds){
    for(const interactive of [true,false]){
      const harness=animationHarness();
      art.mountExercise(harness.container,id,{interactive});
      assert.equal(normalize(harness.container.innerHTML),normalize(art.exerciseDiagram(id)));
      assert.equal(harness.container.host,null);
      assert.equal(harness.pending(),0);
    }
  }
});

test('rule animations retain reduced-motion stills, while every exercise stays static',()=>{
  const harness=animationHarness(true);
  const cleanup=art.mountRule(harness.container,'identity');
  harness.visible();
  assert.equal(harness.pending(),0);
  assert.equal((harness.container.host.innerHTML.match(/<svg/g)||[]).length,2);
  harness.setReducedMotion(false);assert.equal(harness.pending(),1);
  harness.tick(0);harness.tick(1300);
  harness.setReducedMotion(true);assert.equal(harness.pending(),0);
  assert.equal((harness.container.host.innerHTML.match(/<svg/g)||[]).length,2);
  cleanup();
});

test('fusion dots are horizontal in the same-spider wire gaps',()=>{
  for(const progress of [0,.5,1]){
    const svg=art.ruleDiagram('fusion',{progress});
    const dots=[...svg.matchAll(/<circle cx="([\d.]+)" cy="([\d.]+)" r="2.4"/g)].map(m=>[Number(m[1]),Number(m[2])]);
    assert.deepEqual(dots,[[178,60],[192,60],[206,60],[380,281],[394,281],[408,281]]);
  }
});

const text = html => html.replace(/<[^>]*>/g, '').replace(/&hellip;/g, '…').replace(/&rsquo;/g, '’').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const sections = [...deck.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)].filter(match => /class="[^"]*\bslide\b/.test(match[1]));
const originalCopy = [
  ['0. General Introduction', 'All Quantum circuits are made of spiders and wires…'],
  ['1. Yanking', 'Sometimes wires get a little disorganized. Like normal wires, only their inputs and outputs are what matter, so we can always straighten them out to make a diagram nicer.'],
  ['Exercise: Yanking', 'Shake the wires to straighten them!'],
  ['2. Spider Fusion', 'Spiders of the same colour can fuse into each other if they’re connected by a plain wire. Opposite colours do not.'],
  ['Exercise: Spider Fusion', 'Simplify the following circuit using spider fusion!'],
  ['3. Identity', 'When a phaseless spider only has one input and one out, you can remove it from the wire.'],
  ['Exercise: Identity', 'Use identity removal to turn the following into an identity wire…'],
  ['4. Colour Change', 'This is a Colour Change Box. It might not look like it, but it is actually made of green and red spiders as well:'],
  ['4. Colour Change', 'You can push colour change boxes through green or red spiders to flip their colour. All the other legs get a copied box from this process:'],
  ['Exercise: Colour Change', 'Simplify the diagram using the colour change property:'],
  ['4. Colour Change', 'Two colour change boxes on the same wire cancel each other out.'],
  ['Exercise: Colour Change', 'Use the properties of the colour change box to simplify:'],
  ['5. Leg Chop', 'When a green spider is connected to a red spider by two parallel wires, you can chop them off. (sorry, spiders).'],
  ['Exercise: Leg Chop', 'Use leg chopping to simplify the following diagram.'],
  ['6. Copy', 'We can push blank (or phase pi) red spiders through any blank green spider in the following way. We’re basically copying the red spider across all the wires connected to the green spider.'],
  ['Exercise: Copy', 'Show that we can use this to simplify the following diagram.'],
  ['7. Square Popping', 'Now for one of the most useful rewrites -- square popping. Given a square of spiders in the following setup, you can simplify it to just two.'],
  ['Exercise: Square Popping', 'Let’s use this powerful rewrite to simplify the diagram:'],
  ['7. Square Popping', 'Conversely, we can use this rule to push a green spider through a red spider:'],
  ['Exercise: Square Popping', 'Push the green spider through the red one to simplify the following diagram. [Without the copy rule]'],
  ['8. Final Exercise', 'Prove that Square Popping lets us leg chop! [Without the hopf rule]'],
];

test("the first 21 slide titles, lesson text and captions stay intact with Nico's three lesson integrations", () => {
  originalCopy.forEach(([title, paragraph], index) => {
    assert.equal(sections[index][1].match(/data-title="([^"]*)"/)[1], title, `Title at slide ${index}`);
    assert.equal(text(sections[index][2].match(/<p\b[^>]*>([\s\S]*?)<\/p>/)[1]), paragraph, `Text at slide ${index}`);
  });
  for (const caption of ['Left: Quantum circuit written with unitary boxes', 'Right: The same circuit written with spiders and wires!', '(those yellow boxes are also spiders, as we will soon see)', 'This fact lets us reason about quantum circuits using the ZX calculus.']) assert.ok(text(sections[0][2]).includes(caption));
  assert.ok(sections[0][2].includes('href="https://arxiv.org/pdf/2012.13966"'));
  for (const [index, lesson] of [[2, 'yanking'], [4, 'spider-fusion'], [6, 'identity-removal']]) {
    assert.ok(sections[index][2].includes(`data-lesson-id="${lesson}"`));
    assert.ok(sections[index][2].includes(`data-src="zx-canvas/index.html?embed=1&amp;lesson=${lesson}"`));
    assert.match(sections[index][2], /class="zx-open-canvas"[^>]*>OK<\/button>/);
  }
});

test('the editor boundary has no added controls and the approved fusion row remains',()=>{
  assert.equal((deck.match(/data-zx-exercise/g)||[]).length,3);
  assert.doesNotMatch(deck,/course=1|data-original-exercise|book-practice|book-actions|data-book-hint|data-book-status/);
  assert.match(sections[3][2],/class="fusion-art-row"/);
  assert.equal((sections[3][2].match(/data-lesson-art=/g)||[]).length,2);
  for(const index of [9,11,13,15,17,19,20,21,22,23,24,25]) assert.doesNotMatch(sections[index][2],/iframe|<button/);
});
