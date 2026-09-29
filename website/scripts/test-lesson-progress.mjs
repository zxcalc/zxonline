// Exercise the real overview/deck scripts with shared browser storage and
// queued cross-tab storage events. Rendering is checked separately in-browser.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { runInNewContext } from 'node:vm';
import test from 'node:test';

const read = name => readFile(new URL(`../${name}`, import.meta.url), 'utf8');
const [overviewHtml, deckHtml, exerciseScript, deckScript] = await Promise.all(['index.html', 'slides.html', 'zx-exercise.js', 'slides.js'].map(read));
const MAX_KEY = 'zx-online:max-unlocked-slide';
const ALL_KEY = 'zx-online:all-slides-unlocked';

class Element {
  constructor(dataset = {}, classes = []) {
    this.dataset = dataset; this.events = new Map(); this.attributes = new Map();
    this.disabled = false; this.hidden = false; this.offsetHeight = 20; this.children = [];
    this.style = { removeProperty(name) { delete this[name]; }, setProperty(name, value) { this[name] = value; } };
    const set = new Set(classes);
    this.classList = { add: value => set.add(value), contains: value => set.has(value), toggle(value, on) { if (on) set.add(value); else set.delete(value); } };
  }
  addEventListener(type, callback) { const list = this.events.get(type) || []; list.push(callback); this.events.set(type, list); }
  dispatchEvent(event) { for (const callback of this.events.get(event.type) || []) callback(event); }
  click() { if (!this.disabled) this.dispatchEvent({ type: 'click', target: this, preventDefault() {} }); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  getAttribute(name) { return this.attributes.get(name) || null; }
  removeAttribute(name) { this.attributes.delete(name); }
  closest(selector) { return selector === 'a, button, input, select, textarea' && this instanceof Button ? this : null; }
  matches(selector) { return [...selector.matchAll(/:not\(\.([^)]*)\)/g)].every(match => !this.classList.contains(match[1])); }
  querySelector() { return null; }
  querySelectorAll() { return []; }
  getBoundingClientRect() { return { left: 0, top: 0, width: 80, height: 40 }; }
}
class Button extends Element {}
class Frame extends Element { constructor(lesson) { super(); this.contentWindow = {}; this.dataset.src = `zx-canvas/index.html?embed=1&lesson=${lesson}`; } }
class FakeEvent { constructor(type, options = {}) { this.type = type; Object.assign(this, options); } }

function browserTabs(initial = {}) {
  const values = new Map(Object.entries(initial)), tabs = [], queue = [];
  function create(page = 'deck', hash = '') {
    const win = new Element();
    win.location = { origin: 'http://localhost:8765', href: '', hash };
    win.localStorage = {
      getItem: key => values.get(key) ?? null,
      setItem(key, value) {
        const oldValue = values.get(key) ?? null;
        values.set(key, String(value));
        if (oldValue !== String(value)) tabs.filter(tab => tab.window !== win).forEach(tab => queue.push(() => tab.window.dispatchEvent(new FakeEvent('storage', { key, oldValue, newValue: String(value) }))));
      },
      removeItem(key) {
        const oldValue = values.get(key) ?? null; values.delete(key);
        if (oldValue !== null) tabs.filter(tab => tab.window !== win).forEach(tab => queue.push(() => tab.window.dispatchEvent(new FakeEvent('storage', { key, oldValue, newValue: null }))));
      },
    };
    win.history = { replaceState: (_, __, nextHash) => { win.location.hash = nextHash; } };
    win.matchMedia = () => ({ matches: false }); win.requestAnimationFrame = () => 1;
    win.innerWidth = 1000; win.innerHeight = 800; win.devicePixelRatio = 1;
    const stages = [];
    const slides = [...deckHtml.matchAll(/<section\b([^>]*)>([\s\S]*?)<\/section>/g)]
      .filter(match => /class="[^"]*\bslide\b/.test(match[1])).map(match => {
        const slide = new Element();
        const lesson = match[2].match(/data-lesson-id="([^"]+)"/);
        if (lesson) {
          const stage = new Element({ lessonId: lesson[1] });
          const open = new Button(), frame = new Frame(lesson[1]), goal = new Element(), label = new Element(), shell = new Element();
          shell.hidden = true;
          const children = { '.zx-open-canvas': open, '.zx-canvas-frame': frame, iframe: frame, '.zx-canvas-embed-shell': shell, '.zx-goal-canvas': goal, '.zx-goal-label': label };
          stage.querySelector = selector => children[selector] || null;
          slide.querySelector = selector => selector === '[data-zx-exercise]' ? stage : null;
          stages.push(stage); slide.exercise = stage;
        }
        return slide;
      });
    const links = page === 'overview' ? [...overviewHtml.matchAll(/data-game-slide="(\d+)"/g)].map(match => new Element({ gameSlide: match[1] })) : [];
    const actions = page === 'overview' ? ['unlock-all', 'start-over'].map(progressAction => new Button({ progressAction })) : [];
    const back = new Button(), next = new Button(), appended = [];
    const document = {
      querySelectorAll(selector) { return selector === '.slide' ? slides : selector === '[data-zx-exercise]' ? page === 'deck' ? stages : [] : selector === '[data-game-slide]' ? links : selector === '[data-progress-action]' ? actions : []; },
      querySelector: selector => selector === '#back-button' ? back : selector === '#next-button' ? next : { offsetHeight: 20 },
      createElement: () => ({ setAttribute() {}, getContext: () => ({ setTransform() {} }) }),
      body: { append: canvas => appended.push(canvas) },
    };
    const context = { window: win, document, HTMLElement: Element, HTMLButtonElement: Button, HTMLIFrameElement: Frame, CustomEvent: FakeEvent, Event: FakeEvent, requestAnimationFrame: () => 1, performance: { now: () => 0 }, getComputedStyle: () => ({ paddingTop: '0', paddingBottom: '0', marginTop: '0', marginBottom: '0' }) };
    runInNewContext(exerciseScript, context);
    if (page === 'deck') runInNewContext(deckScript, context);
    const tab = { window: win, slides, stages, links, next, back, appended, action(name) { actions.find(action => action.dataset.progressAction === name).click(); } };
    tabs.push(tab); return tab;
  }
  function flush() { let count = 0; while (queue.length) { assert.ok(++count < 100, 'Storage synchronization must not loop'); queue.shift()(); } }
  return { create, flush, values };
}

test('normal progression gates an unsolved exercise and only genuine completion emits confetti', () => {
  const browser = browserTabs(), deck = browser.create();
  deck.next.click(); deck.next.click();
  assert.equal(deck.window.location.hash, '#slide-2'); assert.equal(deck.next.textContent, 'OK');
  deck.next.click(); assert.equal(deck.next.disabled, true);
  deck.next.click(); assert.equal(deck.window.location.hash, '#slide-2');
  const stage = deck.slides[2].exercise;
  deck.window.dispatchEvent(new FakeEvent('message', { origin: 'https://wrong.example', source: stage.querySelector('iframe').contentWindow, data: { type: 'zx-online:lesson-solved', lessonId: stage.dataset.lessonId } }));
  assert.equal(deck.next.disabled, true);
  deck.window.dispatchEvent(new FakeEvent('message', { origin: deck.window.location.origin, source: stage.querySelector('iframe').contentWindow, data: { type: 'zx-online:lesson-solved', lessonId: stage.dataset.lessonId } }));
  assert.equal(deck.next.disabled, false); assert.equal(deck.appended.length, 1);
  deck.next.click(); assert.equal(deck.window.location.hash, '#slide-3');
});

test('only Nico’s three built-in lessons are mounted, through their original iframe API', () => {
  const lessons=[...deckHtml.matchAll(/data-zx-exercise\s+data-lesson-id="([^"]+)"/g)].map(match=>match[1]);
  assert.deepEqual(lessons,['yanking','spider-fusion','identity-removal']);
  for (const lesson of lessons) assert.ok(deckHtml.includes(`data-src="zx-canvas/index.html?embed=1&amp;lesson=${lesson}"`));
  assert.ok(!deckHtml.includes('course=1'));
  assert.ok(!deckHtml.includes('book-practice.js'));
  const browser=browserTabs({[ALL_KEY]:'true'}),deck=browser.create();
  for(const index of [2,4,6]) {
    while(deck.window.location.hash!==`#slide-${index}`) deck.next.click();
    const stage=deck.slides[index].exercise,frame=stage.querySelector('iframe');
    stage.querySelector('.zx-open-canvas').click();
    assert.equal(frame.getAttribute('src'),`zx-canvas/index.html?embed=1&lesson=${stage.dataset.lessonId}`);
    deck.window.dispatchEvent(new FakeEvent('message',{origin:deck.window.location.origin,source:frame.contentWindow,data:{type:'zx-online:lesson-solved',lessonId:stage.dataset.lessonId}}));
    assert.ok(stage.classList.contains('is-resolved'));
  }
  assert.equal(deck.appended.length,3,'All three original lesson completion messages retain confetti');
});

test('Unlock All changes overview links immediately and bypasses Next in an already-open Learn tab', () => {
  const browser = browserTabs(), overview = browser.create('overview'), deck = browser.create();
  deck.next.click(); deck.next.click(); deck.next.click(); browser.flush();
  assert.equal(deck.next.disabled, true);
  overview.action('unlock-all');
  assert.equal(browser.values.get(ALL_KEY), 'true');
  assert.ok(overview.links.every(link => link.classList.contains('is-game-link')));
  browser.flush();
  assert.equal(deck.next.disabled, false); assert.equal(deck.next.textContent, 'Next');
  assert.equal(deck.appended.length, 0, 'Unlock All is navigation permission, not mathematical completion');
  assert.ok(deck.stages.every(stage => !stage.classList.contains('is-resolved')));
  deck.next.click(); assert.equal(deck.window.location.hash, '#slide-3');
  deck.next.click(); assert.equal(deck.window.location.hash, '#slide-4');
  assert.equal(deck.next.textContent, 'Next', 'An unopened exercise can also be skipped');
  const stage = deck.slides[4].exercise;
  assert.equal(stage.querySelector('.zx-open-canvas').style.display, 'inline-block', 'The existing OK button still lets the user try the exercise');
  stage.querySelector('.zx-open-canvas').click();
  assert.ok(stage.classList.contains('is-canvas-open'));
  assert.equal(deck.next.disabled, false);
  const solved = new FakeEvent('message', { origin: deck.window.location.origin, source: stage.querySelector('iframe').contentWindow, data: { type: 'zx-online:lesson-solved', lessonId: stage.dataset.lessonId } });
  deck.window.dispatchEvent(solved);
  assert.equal(deck.appended.length, 1, 'A real new completion still celebrates in free navigation');
  deck.window.dispatchEvent(solved);
  assert.equal(deck.appended.length, 1, 'Repeated completion messages do not replay confetti');
  const another = browser.create('deck', '#slide-12');
  assert.equal(another.window.location.hash, '#slide-12'); assert.equal(another.next.disabled, false);
});

test('Start Over synchronizes existing tabs and cannot restore the old unlocked maximum', () => {
  const browser = browserTabs({ [ALL_KEY]: 'true', [MAX_KEY]: '999' });
  const overview = browser.create('overview'), first = browser.create('deck', '#slide-10'), second = browser.create('deck', '#slide-14');
  overview.action('start-over'); browser.flush();
  assert.equal(browser.values.has(ALL_KEY), false);
  assert.equal(browser.values.get(MAX_KEY), '0');
  for (const deck of [first, second]) {
    assert.equal(deck.window.location.hash, '#slide-0');
    deck.next.click(); deck.next.click(); assert.equal(deck.next.textContent, 'OK');
    deck.next.click(); assert.equal(deck.next.disabled, true);
  }
  assert.ok(overview.links.filter(link => Number(link.dataset.gameSlide) > 0).every(link => !link.classList.contains('is-game-link')));
});

test('stale numeric maxima clamp to the current deck, while explicit Unlock All remains future-proof', () => {
  const normalBrowser = browserTabs({ [MAX_KEY]: '999' });
  const normal = normalBrowser.create('deck', '#slide-999');
  assert.equal(normal.window.location.hash, `#slide-${normal.slides.length - 1}`);
  assert.equal(normalBrowser.values.get(MAX_KEY), String(normal.slides.length - 1));
  assert.equal(normal.next.textContent, 'Done!', 'The final static exercise does not wait for an unsupported editor');
  const unsolved=normalBrowser.create('deck','#slide-6');
  assert.equal(unsolved.next.textContent,'OK','A historic numeric maximum does not imply permission to bypass Nico’s unsolved lessons');
  const freeBrowser = browserTabs({ [ALL_KEY]: 'true', [MAX_KEY]: '1' });
  const free = freeBrowser.create('deck', '#slide-999');
  assert.equal(free.window.location.hash, `#slide-${free.slides.length - 1}`);
  assert.equal(free.next.textContent, 'Done!'); assert.equal(free.next.disabled, false);
});
