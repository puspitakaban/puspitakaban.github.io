// The story is authored in index.html. This only animates its existing text.
const story = document.querySelector('.bottle-story');
const title = document.querySelector('#bottle-title');
const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
const readingWordsPerMinute = 250;
const paragraphPause = 350;
const letterFade = 180;
const reveals = new Set();
const queue = [];
let intersection;
let active;
let timer;
let loadingTimeout;
let stopped = false;

function finishReveal(state) {
  if (!reveals.has(state)) return;
  // Keep the same layout after completion; only letter opacity changes.
  for (const letter of state.characters) letter.classList.add('is-visible');
  reveals.delete(state);
  if (!reveals.size) intersection?.disconnect();
}

function revealAll() {
  stopped = true;
  clearTimeout(timer);
  clearTimeout(loadingTimeout);
  intersection?.disconnect();
  story?.classList.remove('story-reveal-loading');
  title?.classList.remove('story-reveal-loading');
  for (const state of [...reveals]) finishReveal(state);
  active = null;
  queue.length = 0;
}

function pauseAfter(character) {
  if (/[.!?]/u.test(character)) return 120;
  if (/[,;:]/u.test(character)) return 50;
  return 0;
}

function prepareReveal(element) {
  if (element.childNodes.length !== 1 || element.firstChild.nodeType !== Node.TEXT_NODE) return;
  const textNode = element.firstChild;
  const text = textNode.textContent;
  const original = document.createElement('span');
  original.className = 'story-original visually-hidden';
  original.append(textNode);
  const visual = document.createElement('span');
  visual.className = 'story-visual';
  visual.setAttribute('aria-hidden', 'true');
  const characters = [];
  for (const token of text.match(/\S+|\s+/gu) ?? []) {
    if (/^\s/u.test(token)) {
      visual.append(document.createTextNode(token));
      continue;
    }
    const word = document.createElement('span');
    word.className = 'story-word';
    for (const character of token) {
      const letter = document.createElement('span');
      letter.className = 'story-letter';
      letter.textContent = character;
      characters.push(letter);
      word.append(letter);
    }
    visual.append(word);
  }
  element.append(original, visual);
  element.classList.add('story-revealing');
  const state = { element, original, visual, characters, cursor:0, started:false };
  reveals.add(state);
  return state;
}

async function startStory() {
  if (!story || reducedMotion.matches || !('IntersectionObserver' in window)) return;
  story.classList.add('story-reveal-loading');
  title?.classList.add('story-reveal-loading');
  loadingTimeout = setTimeout(revealAll, 2500);
  await document.fonts.ready;
  clearTimeout(loadingTimeout);
  if (stopped || reducedMotion.matches) return revealAll();
  const bodySource = [...story.querySelectorAll('p')];
  const source = [title, ...bodySource].filter(Boolean);
  const text = bodySource.map(element => element.textContent).join(' ');
  const words = text.match(/\S+/gu)?.length ?? 0;
  const characters = [...text].filter(character => !/\s/u.test(character));
  const pauses = characters.reduce((sum, character) => sum + pauseAfter(character), 0)
    + paragraphPause * Math.max(0, bodySource.length - 1);
  // Account for punctuation and paragraph pauses within the reading budget.
  const interval = Math.max(20, (words * 60000 / readingWordsPerMinute - pauses) / characters.length);
  const states = source.map(prepareReveal).filter(Boolean);
  story.classList.remove('story-reveal-loading');
  title?.classList.remove('story-reveal-loading');

  function advance() {
    if (stopped || document.hidden) return;
    active ??= queue.shift();
    if (!active) return;
    const letter = active.characters[active.cursor++];
    if (!letter) {
      finishReveal(active);
      active = null;
      timer = setTimeout(advance, paragraphPause);
      return;
    }
    letter.classList.add('is-visible');
    const pace = active.element === title ? 1.3 : 1;
    const delay = active.cursor === active.characters.length ? letterFade : interval * pace + pauseAfter(letter.textContent);
    timer = setTimeout(advance, delay);
  }

  intersection = new IntersectionObserver(entries => {
    const entering = new Set(entries.filter(entry => entry.isIntersecting).map(entry => entry.target));
    for (const state of states) {
      if (state.started || !entering.has(state.element)) continue;
      state.started = true;
      intersection.unobserve(state.element);
      queue.push(state);
    }
    if (!active && queue.length) {
      clearTimeout(timer);
      timer = setTimeout(advance, 200);
    }
  }, { threshold:0.06 });
  for (const state of states) intersection.observe(state.element);
  document.addEventListener('visibilitychange', () => {
    clearTimeout(timer);
    if (!document.hidden && !stopped) timer = setTimeout(advance, 100);
  });
}

reducedMotion.addEventListener('change', event => {
  if (event.matches) revealAll();
});
startStory().catch(revealAll);
