// Progressive enhancement: the site works without this script, it adds the
// menu toggle, the package and version switchers, the copy button and search.
const root = document.documentElement;

// Where supported (Chrome and other Chromium browsers, including the back gesture of
// Android), a CloseWatcher turns a close request into "close the open layer" instead
// of leaving the page. Elsewhere the back button navigates, as it always did.
function watchClose(onclose) {
  if (!('CloseWatcher' in window)) return () => {};

  try {
    const watcher = new CloseWatcher();
    watcher.onclose = onclose;
    return () => watcher.destroy();
  } catch {
    return () => {};
  }
}

// Small screens: the menu button and the search sit in a bar at the bottom, and
// the menu opens as a sheet above it.
const toggle = document.querySelector('.menu-toggle');
const menu = document.getElementById('menu');
const scrim = document.querySelector('.scrim');
const slot = document.querySelector('.bar-search');
const search = document.getElementById('search');
const small = matchMedia('(max-width: 59.99rem)');
const behind = document.querySelectorAll('.site-header, main, .site-footer');

if (toggle && menu && scrim && slot && search) {
  const searchHome = { parent: search.parentNode, next: search.nextSibling };
  const place = () => (small.matches ? slot.append(search) : searchHome.parent.insertBefore(search, searchHome.next));

  let unwatch = () => {};
  const setOpen = (open) => {
    unwatch();
    unwatch = open ? watchClose(() => { setOpen(false); toggle.focus(); }) : () => {};
    toggle.setAttribute('aria-expanded', String(open));
    menu.classList.toggle('open', open);
    scrim.hidden = !open;
    // The page behind the sheet cannot be reached while it is open.
    for (const element of behind) element.inert = open && small.matches;
    if (open) {
      menu.focus({ preventScroll: true });
      // A current page below the fold is scrolled into view; otherwise the sheet opens at its top.
      menu.querySelector('[aria-current="page"]')?.scrollIntoView({ block: 'nearest' });
    }
  };

  toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
  scrim.addEventListener('click', () => setOpen(false));
  search.addEventListener('focusin', () => setOpen(false));
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape') return;
    if (toggle.getAttribute('aria-expanded') === 'true') {
      setOpen(false);
      toggle.focus();
    } else {
      search.querySelector('.pagefind-ui__search-clear')?.click();
    }
  });
  small.addEventListener('change', () => { setOpen(false); place(); });
  // A page restored from the back-forward cache comes back as it was left, with the menu open.
  addEventListener('pageshow', (event) => { if (event.persisted) setOpen(false); });
  place();

  // The back button also dismisses the search results.
  let unwatchResults = null;
  const stopWatching = () => { unwatchResults?.(); unwatchResults = null; };
  search.addEventListener('input', () => {
    const typed = Boolean(search.querySelector('input')?.value);
    if (typed && !unwatchResults) unwatchResults = watchClose(() => search.querySelector('.pagefind-ui__search-clear')?.click());
    if (!typed) stopWatching();
  });
  search.addEventListener('click', (event) => { if (event.target.closest('.pagefind-ui__search-clear')) stopWatching(); });
}

// Copies text with the clipboard API, or by selecting it where the API is refused.
async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.cssText = 'position:fixed;top:0;opacity:0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('Copy refused');
  }
}

// Code blocks: the copy button copies the code before it.
const announcer = document.createElement('div');
announcer.className = 'visually-hidden';
announcer.setAttribute('role', 'status');
document.body.append(announcer);

for (const button of document.querySelectorAll('.copy-code')) {
  button.addEventListener('click', async () => {
    try {
      await copyText(button.previousElementSibling.textContent.replace(/\n$/, ''));
      button.dataset.state = 'copied';
      announcer.textContent = 'Code copied';
    } catch {
      button.dataset.state = 'failed';
      announcer.textContent = 'Copy failed';
    }
    setTimeout(() => { delete button.dataset.state; announcer.textContent = ''; }, 2000);
  });
}

// Package and version selects navigate on change.
const selects = document.querySelectorAll('select[data-navigate]');
for (const select of selects) {
  select.addEventListener('change', () => { location.href = select.value; });
}

// Going back restores the page from the back-forward cache as it was left, with the
// option chosen before leaving. The selects show this page again.
addEventListener('pageshow', (event) => {
  if (!event.persisted) return;
  for (const select of selects) {
    for (const option of select.options) option.selected = option.defaultSelected;
  }
});

// Copy the page as Markdown, for pasting into an agent or an editor. The button says what
// happened and keeps its width, so nothing on the page moves.
const copy = document.querySelector('[data-copy-markdown]');
if (copy) {
  const label = copy.textContent;
  copy.addEventListener('click', async () => {
    copy.style.minInlineSize = `${copy.offsetWidth}px`;
    try {
      const response = await fetch(copy.dataset.copyMarkdown);
      await copyText(await response.text());
      copy.textContent = 'Copied';
      announcer.textContent = 'Page copied as Markdown';
    } catch {
      copy.textContent = 'Copy failed';
      announcer.textContent = 'Copy failed';
    }
    setTimeout(() => { copy.textContent = label; announcer.textContent = ''; }, 2500);
  });
}

// Plain text of an excerpt, with the matched words marked by control characters.
function markedText(html) {
  const marked = html.replace(/<mark>/g, '\u0001').replace(/<\/mark>/g, '\u0002');
  return new DOMParser().parseFromString(marked, 'text/html').body.textContent.replace(/\s+/g, ' ');
}

// A text fragment (`#:~:text=`) for the first match of an excerpt, with a few words
// around it to find the right place. Browsers scroll to it and highlight it; where
// unsupported, or where the text is not found, the link opens the section instead.
// Pagefind joins table cells and other blocks with a full stop, and a fragment cannot
// match across blocks, so the phrase stays within the sentence of the match.
function textFragment(excerpt) {
  const sentence = markedText(excerpt).split(/(?<=[.!?]\u0002?)\s+/).find((part) => part.includes('\u0001'));
  const words = sentence?.split(' ') ?? [];
  const hit = words.findIndex((word) => word.includes('\u0001'));
  if (hit < 0) return '';

  const phrase = words.slice(Math.max(0, hit - 2), hit + 4).join(' ')
    .replace(/[\u0001\u0002]/g, '')
    .replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  // A short phrase could match the sidebar or the title first, so it is not worth a fragment.
  return phrase.split(' ').length >= 3 ? `:~:text=${encodeURIComponent(phrase).replace(/-/g, '%2D')}` : '';
}

// Results link to the best matching section of the page and highlight the match.
function resultWithFragment(result) {
  const section = result.sub_results?.[0];
  const url = (section?.url ?? result.url).split(':~:')[0];
  const fragment = textFragment(section?.excerpt ?? result.excerpt);
  const target = fragment ? `${url}${url.includes('#') ? '' : '#'}${fragment}` : url;

  return { ...result, url: target };
}

// Search: Pagefind indexes the latest docs at build time, so it is missing
// from a plain `eleventy --serve` run and the search box is removed then. The
// box has its height reserved in CSS, so it does not shift the sidebar.
if (search) {
  const base = `${root.dataset.base}pagefind/`;
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `${base}pagefind-ui.css`;
  const script = document.createElement('script');
  script.src = `${base}pagefind-ui.js`;
  script.onload = () => {
    new PagefindUI({ element: search, showImages: false, showSubResults: false, baseUrl: root.dataset.base, translations: { placeholder: 'Search docs' }, processResult: resultWithFragment });
    // The input only has a placeholder, which is not a label.
    search.querySelector('input')?.setAttribute('aria-label', 'Search docs');
  };
  script.onerror = () => search.remove();
  // The widget's stylesheet goes before ours, so our overrides win at equal specificity.
  const ours = document.querySelector('link[rel="stylesheet"][href*="style.css"]');
  if (ours) ours.before(link);
  else document.head.append(link);
  document.head.append(script);
}
