const COLORS = ['#e63946', '#2a9d8f', '#f4a261', '#264653', '#9b5de5', '#00bbf9', '#fb5607', '#3a86ff'];
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'anthropic/claude-haiku-4-5';
const OVERLAP_THRESHOLD = 12;
const USER_DOT_ID = '__user__';
const STORAGE_KEY = 'wsm:map:v1';
const LIBRARY_KEY = 'wsm:library:v1';
const ONBOARDING_KEY = 'wsm:onboarding:v1';

let library = [];

const state = {
  title: 'Workstyle Stereotype Map',
  notes: '',
  items: [],
  userPositions: null,
  userMatch: null,
  aiTouched: false,
  currentMapId: null,
};

const $ = (sel) => document.querySelector(sel);

const uid = () => Math.random().toString(36).slice(2, 9);

const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[c]));

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function isImageUrl(s) {
  return typeof s === 'string' && /^(https?:|data:)/.test(s.trim());
}

function renderIconHtml(icon) {
  if (!icon) return '';
  if (isImageUrl(icon)) {
    return `<img class="icon-img" src="${escapeHtml(icon)}" alt="" />`;
  }
  return `<span class="icon-emoji">${escapeHtml(icon)}</span>`;
}

function loadMap(data, { keepMatch = false } = {}) {
  state.title = data.title || 'Workstyle Stereotype Map';
  state.notes = data.notes || '';
  state.aiTouched = !!data.aiTouched;
  state.currentMapId = data.currentMapId || null;
  if (!keepMatch) {
    state.userPositions = null;
    state.userMatch = null;
  } else {
    state.userPositions = data.userPositions || null;
    state.userMatch = data.userMatch || null;
  }
  state.items = (data.items || []).map((it, i) => {
    const positions = {};
    DIMENSIONS.forEach((d) => {
      const v = it.positions && it.positions[d.id];
      positions[d.id] = typeof v === 'number' ? clamp(v, 0, 100) : 50;
    });
    return {
      id: it.id || uid(),
      name: String(it.name || `Item ${i + 1}`),
      icon: it.icon || '',
      note: it.note || '',
      color: it.color || COLORS[i % COLORS.length],
      positions,
    };
  });
  render();
  persist();
}

function persist() {
  try {
    const data = {
      title: state.title,
      notes: state.notes,
      items: state.items.map(({ id, name, icon, note, color, positions }) => ({
        id, name, icon, note, color, positions,
      })),
      userPositions: state.userPositions,
      userMatch: state.userMatch,
      aiTouched: state.aiTouched,
      currentMapId: state.currentMapId,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    // localStorage may be unavailable (private mode, quota) — fail silently
  }
  syncCurrentToLibrary();
}

function loadLibrary() {
  try {
    const raw = localStorage.getItem(LIBRARY_KEY);
    library = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(library)) library = [];
  } catch (e) {
    library = [];
  }
}

function persistLibrary() {
  try {
    localStorage.setItem(LIBRARY_KEY, JSON.stringify(library));
  } catch (e) {}
}

function snapshotMap() {
  return {
    title: state.title,
    notes: state.notes,
    items: state.items.map(({ id, name, icon, note, color, positions }) => ({
      id, name, icon, note, color, positions,
    })),
    aiTouched: state.aiTouched,
    userPositions: state.userPositions,
    userMatch: state.userMatch,
  };
}

function uniqueLibraryTitle(base, excludeId = null) {
  let title = (base || '').trim() || 'Untitled map';
  const used = new Set(library.filter((m) => m.id !== excludeId).map((m) => m.title));
  if (!used.has(title)) return title;
  let i = 2;
  while (used.has(`${title} (${i})`)) i++;
  return `${title} (${i})`;
}

function saveCurrentToLibrary({ forceNew = false } = {}) {
  if (forceNew || !state.currentMapId) {
    const title = uniqueLibraryTitle(state.title);
    if (title !== state.title) {
      state.title = title;
      $('#mapTitle').value = title;
    }
    const entry = {
      id: uid(),
      ...snapshotMap(),
      savedAt: new Date().toISOString(),
    };
    library.push(entry);
    state.currentMapId = entry.id;
    persistLibrary();
  } else {
    // Renaming/updating an existing entry — enforce uniqueness against other entries
    const title = uniqueLibraryTitle(state.title, state.currentMapId);
    if (title !== state.title) {
      state.title = title;
      $('#mapTitle').value = title;
    }
  }
  persist();              // writes scratch + syncs entry (snapshot diff inside)
  renderMyMapsOptgroup(); // refresh the dropdown immediately
  return state.currentMapId;
}

function syncCurrentToLibrary() {
  if (!state.currentMapId) return;
  const entry = library.find((m) => m.id === state.currentMapId);
  if (!entry) {
    state.currentMapId = null;
    return;
  }
  const snapshot = snapshotMap();
  const entrySnap = {
    title: entry.title,
    notes: entry.notes,
    items: entry.items,
    aiTouched: entry.aiTouched,
    userPositions: entry.userPositions,
    userMatch: entry.userMatch,
  };
  // Skip when content is unchanged (e.g. a read-only load).
  // Keeps savedAt meaningful as "last edited" rather than "last opened".
  if (JSON.stringify(snapshot) === JSON.stringify(entrySnap)) return;
  Object.assign(entry, snapshot, { savedAt: new Date().toISOString() });
  persistLibrary();
}

function loadLibraryEntry(id) {
  const entry = library.find((m) => m.id === id);
  if (!entry) return;
  loadMap({ ...entry, currentMapId: id }, { keepMatch: true });
}

function deleteLibraryEntry(id) {
  library = library.filter((m) => m.id !== id);
  if (state.currentMapId === id) {
    state.currentMapId = null;
    persist();
  }
  persistLibrary();
  renderMyMapsOptgroup();
  renderManageList();
}

function renderMyMapsOptgroup() {
  const sel = $('#presetSelect');
  if (!sel) return;
  const existing = sel.querySelector('optgroup[label="My maps"]');
  if (existing) existing.remove();
  if (library.length === 0) {
    const btn = $('#manageMapsBtn');
    if (btn) btn.hidden = true;
    return;
  }
  const og = document.createElement('optgroup');
  og.label = 'My maps';
  og.innerHTML = library
    .slice()
    .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
    .map((m) => `<option value="lib:${m.id}">${escapeHtml(m.title || 'Untitled')}</option>`)
    .join('');
  sel.appendChild(og);
  const btn = $('#manageMapsBtn');
  if (btn) btn.hidden = false;
}

function renderManageList() {
  const list = $('#manageMapsList');
  const empty = $('#manageMapsEmpty');
  if (!list) return;
  list.innerHTML = '';
  if (library.length === 0) {
    if (empty) empty.hidden = false;
    return;
  }
  if (empty) empty.hidden = true;
  library
    .slice()
    .sort((a, b) => (b.savedAt || '').localeCompare(a.savedAt || ''))
    .forEach((m) => {
      const items = (m.items || []).length;
      const when = m.savedAt ? new Date(m.savedAt).toLocaleString() : '';
      const li = document.createElement('li');
      li.className = 'saved-map' + (m.id === state.currentMapId ? ' current' : '');
      li.innerHTML = `
        <div class="saved-map-body">
          <div class="saved-map-title">${escapeHtml(m.title || 'Untitled')}${m.id === state.currentMapId ? ' <span class="saved-map-tag">current</span>' : ''}</div>
          <div class="saved-map-meta">${items} element${items === 1 ? '' : 's'} · saved ${escapeHtml(when)}</div>
        </div>
        <div class="saved-map-actions">
          <button type="button" class="saved-map-load" data-id="${m.id}">Load</button>
          <button type="button" class="saved-map-delete" data-id="${m.id}">Delete</button>
        </div>
      `;
      list.appendChild(li);
    });
}

function loadFromStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.items)) return false;
    loadMap(data, { keepMatch: true });
    return true;
  } catch (e) {
    return false;
  }
}

function matchedItemIds() {
  if (!state.userMatch) return new Set();
  const names = new Set(state.userMatch.items.map((n) => String(n).toLowerCase()));
  return new Set(state.items.filter((it) => names.has(it.name.toLowerCase())).map((it) => it.id));
}

function render() {
  $('#mapTitle').value = state.title;
  renderMapNotes();
  renderMatchPanel();
  renderItemList();
  renderMap();
  renderBadge();
}

function renderBadge() {
  const el = $('#mapBadge');
  if (!el) return;
  if (state.aiTouched) {
    el.classList.add('ai');
    el.querySelector('.map-badge-tag').textContent = 'AI-GENERATED · STEREOTYPE';
  } else {
    el.classList.remove('ai');
    el.querySelector('.map-badge-tag').textContent = 'STEREOTYPE';
  }
}

function renderMapNotes() {
  const el = $('#mapNotes');
  if (state.notes) {
    el.textContent = state.notes;
    el.hidden = false;
  } else {
    el.hidden = true;
    el.textContent = '';
  }
}

function renderMatchPanel() {
  const el = $('#matchPanel');
  if (state.userMatch) {
    const m = state.userMatch;
    const axisEntries = Object.entries(m.axisNotes || {})
      .filter(([dimId, note]) => note && DIMENSIONS.find((d) => d.id === dimId))
      .slice(0, 4);

    const itemChips = m.items.map((name) => {
      const item = state.items.find((it) => it.name.toLowerCase() === String(name).toLowerCase());
      const icon = item ? renderIconHtml(item.icon) : '';
      const color = item ? item.color : '#888';
      return `<span class="match-chip" style="--c:${color}">${icon}<span>${escapeHtml(name)}</span></span>`;
    }).join('');

    el.innerHTML = `
      <div class="match-card">
        <div class="match-card-head">
          <span class="match-label">${m.type === 'combo' ? 'Recommended combo' : 'Recommended'}</span>
          <div class="match-chips">${itemChips}</div>
        </div>
        <p class="match-summary">${escapeHtml(m.summary)}</p>
        ${axisEntries.length ? `
          <ul class="axis-notes">
            ${axisEntries.map(([dimId, note]) => {
              const dim = DIMENSIONS.find((d) => d.id === dimId);
              return `<li><span class="axis-tag">${escapeHtml(dim.label)}</span><span>${escapeHtml(note)}</span></li>`;
            }).join('')}
          </ul>
        ` : ''}
        <div class="match-actions">
          <button id="matchAgainBtn">Refine description</button>
          <button id="clearMatchBtn" class="ghost">Clear match</button>
        </div>
      </div>
    `;
    $('#matchAgainBtn').addEventListener('click', openMatchDialog);
    $('#clearMatchBtn').addEventListener('click', clearMatch);
  } else {
    const disabled = state.items.length === 0;
    el.innerHTML = `
      <button id="findMatchBtn" class="match-cta" ${disabled ? 'disabled' : ''}>
        <span class="match-cta-icon">→</span>
        <span class="match-cta-text">
          <span class="match-cta-title">Find your match</span>
          <span class="match-cta-sub">${disabled ? 'Add some elements to the map first.' : 'Describe yourself or what you need — get a recommendation, with reasoning per axis.'}</span>
        </span>
      </button>
    `;
    if (!disabled) {
      $('#findMatchBtn').addEventListener('click', openMatchDialog);
    }
  }
}

function renderItemList() {
  const ul = $('#itemList');
  const matched = matchedItemIds();
  ul.innerHTML = '';
  if (state.items.length === 0) {
    ul.innerHTML = '<li class="empty-state">No elements yet. Add one below or load a preset.</li>';
    return;
  }
  state.items.forEach((item) => {
    const li = document.createElement('li');
    li.className = 'item' + (matched.has(item.id) ? ' matched' : '');
    li.innerHTML = `
      <span class="swatch" style="background:${item.color}"></span>
      <button type="button" class="item-icon" data-id="${item.id}" title="View details" aria-label="View ${escapeHtml(item.name)} details">${renderIconHtml(item.icon) || '<span class="icon-fallback"></span>'}</button>
      <div class="item-body">
        <input class="item-name" data-id="${item.id}" value="${escapeHtml(item.name)}" aria-label="Name" />
        ${item.note ? `<span class="item-note" title="${escapeHtml(item.note)}">${escapeHtml(item.note)}</span>` : ''}
      </div>
      <button class="remove" data-id="${item.id}" title="Remove" aria-label="Remove ${escapeHtml(item.name)}">&times;</button>
    `;
    ul.appendChild(li);
  });
}

function renderMap() {
  const map = $('#map');
  map.innerHTML = '';
  DIMENSIONS.forEach((dim) => {
    const row = document.createElement('div');
    row.className = 'axis';
    row.dataset.dimId = dim.id;
    row.innerHTML = `
      <button type="button" class="axis-name" data-dim-id="${dim.id}" title="${escapeHtml(dim.description || '')} (click for details)">${escapeHtml(dim.label)}</button>
      <div class="axis-header">
        <span class="pole left">${escapeHtml(dim.leftLabel)}</span>
        <span class="pole right">${escapeHtml(dim.rightLabel)}</span>
      </div>
      <div class="track">
        <div class="line"></div>
        <div class="dots"></div>
      </div>
    `;
    map.appendChild(row);
    renderAxisDots(dim);
  });
}

function computeLabelLevels(dimId) {
  const points = state.items.map((it) => ({ id: it.id, p: it.positions[dimId] }));
  if (state.userPositions && state.userPositions[dimId] != null) {
    points.push({ id: USER_DOT_ID, p: state.userPositions[dimId] });
  }
  points.sort((a, b) => a.p - b.p);
  const levels = {};
  let prev = -Infinity;
  let level = 0;
  points.forEach((pt) => {
    if (pt.p - prev < OVERLAP_THRESHOLD) level += 1;
    else level = 0;
    levels[pt.id] = level;
    prev = pt.p;
  });
  return levels;
}

function renderAxisDots(dim) {
  const dotsEl = document.querySelector(`.axis[data-dim-id="${dim.id}"] .dots`);
  if (!dotsEl) return;
  dotsEl.innerHTML = '';
  const levels = computeLabelLevels(dim.id);
  const matched = matchedItemIds();

  state.items.forEach((item) => {
    const p = item.positions[dim.id];
    const dot = document.createElement('div');
    dot.className = 'dot' + (matched.has(item.id) ? ' matched' : '');
    dot.dataset.itemId = item.id;
    dot.dataset.dimId = dim.id;
    dot.style.left = `${p}%`;
    dot.style.setProperty('--c', item.color);
    const tooltip = item.note ? `${item.name} — ${item.note}` : item.name;
    const beadClass = item.icon ? 'bead' : 'bead no-icon';
    dot.innerHTML = `
      <span class="label" style="--lvl:${levels[item.id]}">${escapeHtml(item.name)}</span>
      <span class="${beadClass}" title="${escapeHtml(tooltip)}">${renderIconHtml(item.icon)}</span>
    `;
    dotsEl.appendChild(dot);
    makeDraggable(dot);
  });

  if (state.userPositions && state.userPositions[dim.id] != null) {
    const p = state.userPositions[dim.id];
    const dot = document.createElement('div');
    dot.className = 'dot user-dot';
    dot.dataset.dimId = dim.id;
    dot.style.left = `${p}%`;
    dot.innerHTML = `
      <span class="label user-label" style="--lvl:${levels[USER_DOT_ID]}">You</span>
      <span class="bead user-bead" title="Your estimated position"></span>
    `;
    dotsEl.appendChild(dot);
  }
}

function makeDraggable(dot) {
  const onDown = (ev) => {
    ev.preventDefault();
    const itemId = dot.dataset.itemId;
    const dimId = dot.dataset.dimId;
    const item = state.items.find((i) => i.id === itemId);
    if (!item) return;
    const startX = ev.touches ? ev.touches[0].clientX : ev.clientX;
    const startY = ev.touches ? ev.touches[0].clientY : ev.clientY;
    let moved = false;
    const move = (e) => {
      const cx = e.touches ? e.touches[0].clientX : e.clientX;
      const cy = e.touches ? e.touches[0].clientY : e.clientY;
      if (!moved && Math.hypot(cx - startX, cy - startY) > 4) {
        moved = true;
        dot.classList.add('dragging');
      }
      if (!moved) return;
      const track = document.querySelector(`.axis[data-dim-id="${dimId}"] .track`);
      if (!track) return;
      const rect = track.getBoundingClientRect();
      const pct = clamp(((cx - rect.left) / rect.width) * 100, 0, 100);
      item.positions[dimId] = Math.round(pct);
      dot.style.left = `${item.positions[dimId]}%`;
    };
    const up = () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('touchmove', move);
      window.removeEventListener('touchend', up);
      if (moved) {
        dot.classList.remove('dragging');
        const dim = DIMENSIONS.find((d) => d.id === dimId);
        if (dim) renderAxisDots(dim);
        persist();
      } else {
        openItemDialog(item);
      }
    };
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('touchmove', move, { passive: false });
    window.addEventListener('touchend', up);
  };
  dot.addEventListener('mousedown', onDown);
  dot.addEventListener('touchstart', onDown, { passive: false });
}

function createThinkingAnimation(mode = 'match', subject = '') {
  const subj = subject ? ` ${subject}` : '';
  const messages = {
    match: [
      'Reading your description…',
      'Placing you on Communicating…',
      'Placing you on Evaluating…',
      'Placing you on Leading…',
      'Placing you on Deciding…',
      'Placing you on Trusting…',
      'Placing you on Disagreeing…',
      'Placing you on Scheduling…',
      'Comparing with the map…',
      'Picking a recommendation…',
    ],
    generate: [
      'Reading the topic…',
      'Picking three sharp elements…',
      'Placing them on Communicating…',
      'Placing them on Evaluating…',
      'Placing them on Leading…',
      'Placing them on Deciding…',
      'Placing them on Trusting…',
      'Placing them on Disagreeing…',
      'Placing them on Scheduling…',
      'Writing the workstyle notes…',
      'Almost there…',
    ],
    suggest: [
      'Reading the existing map…',
      `Calibrating${subj}…`,
      `Placing${subj} on Communicating…`,
      `Placing${subj} on Evaluating…`,
      `Placing${subj} on Leading…`,
      `Placing${subj} on Deciding…`,
      `Placing${subj} on Trusting…`,
      `Placing${subj} on Disagreeing…`,
      `Placing${subj} on Scheduling…`,
      'Writing the note…',
    ],
  }[mode] || ['Thinking…'];

  const root = document.createElement('div');
  root.className = `thinking-anim thinking-${mode}`;
  const axisRows = Array.from({ length: 7 }, () => {
    const dur = (1.4 + Math.random() * 1.2).toFixed(2);
    const delay = (Math.random() * 1.0).toFixed(2);
    const dir = Math.random() > 0.5 ? 'reverse' : 'normal';
    return `<div class="thinking-axis"><span class="thinking-dot" style="--dur:${dur}s; --delay:${delay}s; --dir:${dir}"></span></div>`;
  }).join('');
  root.innerHTML = `
    <div class="thinking-axes" aria-hidden="true">${axisRows}</div>
    <div class="thinking-label" role="status" aria-live="polite">${messages[0]}</div>
  `;
  const label = root.querySelector('.thinking-label');
  let i = 0;
  const interval = setInterval(() => {
    i = (i + 1) % messages.length;
    label.style.opacity = '0';
    setTimeout(() => {
      label.textContent = messages[i];
      label.style.opacity = '1';
    }, 180);
  }, 1200);
  return {
    el: root,
    stop() {
      clearInterval(interval);
      if (root.parentElement) root.remove();
    },
  };
}

function openAxisDialog(dim) {
  $('#axisDialogTitle').textContent = dim.label;
  $('#axisDialogDesc').textContent = dim.description || '';
  $('#axisLeftTag').textContent = `0 — ${dim.leftLabel}`;
  $('#axisRightTag').textContent = `100 — ${dim.rightLabel}`;
  $('#axisLeftDesc').textContent = dim.leftDescription || '';
  $('#axisRightDesc').textContent = dim.rightDescription || '';
  $('#axisDialog').showModal();
}

function openItemDialog(item) {
  const iconHtml = renderIconHtml(item.icon);
  const iconEl = $('#itemDialogIcon');
  iconEl.style.setProperty('--c', item.color);
  iconEl.innerHTML = iconHtml || '<span class="icon-fallback"></span>';
  $('#itemDialogName').textContent = item.name;

  const noteEl = $('#itemDialogNote');
  if (item.note) {
    noteEl.textContent = item.note;
    noteEl.hidden = false;
  } else {
    noteEl.textContent = 'No description yet — use ✨ when adding to get an AI-generated one.';
    noteEl.hidden = false;
  }

  const bars = $('#itemDialogBars');
  bars.innerHTML = '';
  DIMENSIONS.forEach((dim) => {
    const p = item.positions[dim.id] ?? 50;
    const leftCloser = p < 45;
    const rightCloser = p > 55;
    const bar = document.createElement('div');
    bar.className = 'axis-bar';
    bar.style.setProperty('--c', item.color);
    bar.innerHTML = `
      <button type="button" class="axis-bar-name" data-dim-id="${dim.id}" title="${escapeHtml(dim.description || '')} (click for details)">${escapeHtml(dim.label)}</button>
      <div class="axis-bar-value">${p} <span class="axis-bar-of">/ 100</span></div>
      <div class="axis-bar-track">
        <span class="axis-bar-pole left${leftCloser ? ' closer' : ''}">${escapeHtml(dim.leftLabel)}</span>
        <div class="axis-bar-line"><div class="axis-bar-fill" style="left:${p}%"></div></div>
        <span class="axis-bar-pole right${rightCloser ? ' closer' : ''}">${escapeHtml(dim.rightLabel)}</span>
      </div>
    `;
    bars.appendChild(bar);
  });

  $('#itemDialog').showModal();
}

function addItem(name) {
  const positions = {};
  DIMENSIONS.forEach((d) => { positions[d.id] = 50; });
  state.items.push({
    id: uid(),
    name,
    icon: '',
    note: '',
    color: COLORS[state.items.length % COLORS.length],
    positions,
  });
  render();
  persist();
}

function removeItem(id) {
  const item = state.items.find((i) => i.id === id);
  state.items = state.items.filter((i) => i.id !== id);
  if (item && state.userMatch) {
    const matched = state.userMatch.items.map((n) => String(n).toLowerCase());
    if (matched.includes(item.name.toLowerCase())) {
      state.userMatch = null;
      state.userPositions = null;
    }
  }
  render();
  persist();
}

function clearMatch() {
  state.userMatch = null;
  state.userPositions = null;
  render();
  persist();
}

function exportJson() {
  const data = {
    title: state.title,
    notes: state.notes,
    aiTouched: state.aiTouched,
    dimensions: DIMENSIONS,
    items: state.items.map(({ id, name, icon, note, color, positions }) => ({
      id, name, icon, note, color, positions,
    })),
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = (state.title || 'map').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '.json';
  a.click();
  URL.revokeObjectURL(url);
}

function extractJson(text) {
  const candidates = [];
  candidates.push(text);
  const fences = text.matchAll(/```(?:json)?\s*([\s\S]*?)```/g);
  for (const m of fences) candidates.push(m[1]);
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start >= 0 && end > start) candidates.push(text.slice(start, end + 1));

  for (const c of candidates) {
    const trimmed = c.trim();
    if (!trimmed) continue;
    try { return JSON.parse(trimmed); } catch (_) {}
    // Try cleaning up common LLM JSON mistakes
    const cleaned = trimmed
      .replace(/,(\s*[}\]])/g, '$1')        // trailing commas
      .replace(/^\s*\/\/.*$/gm, '')          // line comments
      .replace(/\/\*[\s\S]*?\*\//g, '');     // block comments
    try { return JSON.parse(cleaned); } catch (_) {}
  }

  const preview = text.slice(0, 240).replace(/\s+/g, ' ').trim();
  const err = new Error(`Model did not return parseable JSON. It said: "${preview}${text.length > 240 ? '…' : ''}". Try a different model in Settings.`);
  err.rawResponse = text;
  throw err;
}

async function openRouterChat(systemPrompt, userContent) {
  const apiKey = localStorage.getItem('openrouter_api_key');
  const model = localStorage.getItem('openrouter_model') || DEFAULT_MODEL;
  if (!apiKey) throw new Error('Set your OpenRouter API key in Settings first.');

  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': location.href,
      'X-Title': 'Workstyle Stereotype Map Builder',
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      response_format: { type: 'json_object' },
    }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter ${res.status}: ${text.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error('Empty response from model.');
  try {
    return extractJson(content);
  } catch (err) {
    console.warn('[wsm] Raw model response was:\n', content);
    throw err;
  }
}

async function generateWithAI(topic) {
  const axesDescription = DIMENSIONS.map(
    (d) => `- ${d.id}: 0 = ${d.leftLabel}, 100 = ${d.rightLabel}`
  ).join('\n');

  const systemPrompt = `You generate a Workstyle Stereotype Map. The map has 7 fixed behavioral axes (inspired by Erin Meyer's Culture Map).

SCOPE — the tool applies ONLY to:
- tech products, frameworks, languages, platforms
- fictional characters, fictional worlds
- professional roles or activities defined by what people DO (e.g. "Italian football coaches", "jazz drummers", "open-source maintainers")
- abstract systems (project methodologies, decision styles, etc.)

DO NOT stereotype real people by identity, including but not limited to: ethnicities, nationalities-as-people, religions, races, genders, sexual orientations, political ideologies, mental-health conditions, disabilities, or any vulnerable group. Use your judgement on edge cases — the question is "does this stereotype real human beings by who they are, rather than what they do?".

If the user asks for a disallowed or sensitive topic, DO NOT stop with a refusal. Instead, redirect to a clearly safer adjacent topic and say so briefly inside the JSON.

The redirect must be:
- clearly safe
- adjacent enough to feel responsive
- explicitly acknowledged in one short sentence
- never deceptive: the user must be able to tell that you changed the topic

Otherwise, for the given topic, pick EXACTLY 3 elements (three is the smallest number that produces real contrast — never more than 3). For each element, place it on every axis with a value from 0 to 100, where 0 is the left pole and 100 is the right pole.

Axes:
${axesDescription}

A "Workstyle Stereotype Map" is intentionally simplified, partial and debatable — not a scientific classification. Pick elements that produce sharp, distinct workstyles.

Return ONLY valid JSON, no prose:
{
  "title": "string — short, ends with 'Workstyle Stereotypes'",
  "notes": "1-2 sentences explaining why these three elements were chosen (the editorial choice, not the methodology)",
  "safety": {
    "redirected": true or false,
    "message": "empty string if not redirected, otherwise one short sentence explaining the redirect"
  },
  "items": [
    {
      "name": "string",
      "icon": "a single emoji that represents the element",
      "note": "1-2 sentences describing the workstyle in plain language — this is the matcher's main signal, so make it concrete",
      "positions": {
        "communicating": 0-100,
        "evaluating": 0-100,
        "leading": 0-100,
        "deciding": 0-100,
        "trusting": 0-100,
        "disagreeing": 0-100,
        "scheduling": 0-100
      }
    }
  ]
}`;

  const parsed = await openRouterChat(systemPrompt, `Topic: ${topic}`);
  if (!parsed || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('Model response missing "items" array.');
  }
  if (parsed.safety && parsed.safety.redirected && parsed.safety.message) {
    parsed.notes = parsed.notes
      ? `${parsed.safety.message} ${parsed.notes}`
      : parsed.safety.message;
  }
  parsed.aiTouched = true;
  loadMap(parsed);
  saveCurrentToLibrary({ forceNew: true });
}

async function findMatch(description) {
  if (state.items.length === 0) throw new Error('Add some elements to the map first.');

  const axesDescription = DIMENSIONS.map(
    (d) => `- ${d.id}: 0 = ${d.leftLabel}, 100 = ${d.rightLabel}`
  ).join('\n');

  const mapPayload = {
    title: state.title,
    notes: state.notes,
    items: state.items.map(({ name, note, positions }) => ({ name, note, positions })),
  };

  const systemPrompt = `You match a user to elements on a Workstyle Stereotype Map.

You MUST respond with a single valid JSON object and nothing else. No prose before, no prose after, no markdown code fences. The very first character of your response MUST be { and the very last character MUST be }.

If the user description is vague or short, do not refuse — infer their likely intent and make your best guess. Always produce the JSON.

You receive:
1. The 7 fixed axes (each 0-100).
2. The current map: a set of elements, each with positions on the 7 axes and a short workstyle "note".
3. A user self-description.

Your job:
1. Estimate the user's own position on each of the 7 axes (integer 0-100).
2. Recommend ONE element if it clearly fits best, OR a COMBO of EXACTLY TWO elements if the user has split needs that no single element covers well.
3. Explain in 2-3 plain-language sentences. Reference axes by name where it sharpens the reasoning.
4. Provide axis-level reasoning for the 2-4 axes that most drove the recommendation.

Axes:
${axesDescription}

Map:
${JSON.stringify(mapPayload, null, 2)}

Required JSON shape:
{
  "userPositions": {
    "communicating": 0-100, "evaluating": 0-100, "leading": 0-100,
    "deciding": 0-100, "trusting": 0-100, "disagreeing": 0-100, "scheduling": 0-100
  },
  "type": "single" | "combo",
  "items": ["element name exactly as in the map", ...],
  "summary": "2-3 sentence explanation in plain language",
  "axisNotes": {
    "communicating": "one-line reasoning for this axis"
  }
}

Rules:
- The names in "items" MUST match element names from the map exactly (case-insensitive is OK, but spelling must match).
- type "combo" requires exactly 2 items; type "single" requires exactly 1.
- Pick "combo" only if the user genuinely has split needs (e.g. routine vs. critical work). Otherwise prefer "single".
- axisNotes keys must be axis ids from the list above.
- Include axisNotes for 2-4 axes maximum — the ones that most drove your choice.`;

  const parsed = await openRouterChat(systemPrompt, description);
  if (!parsed || !parsed.userPositions || !Array.isArray(parsed.items) || parsed.items.length === 0) {
    throw new Error('Malformed match response.');
  }

  const knownNames = new Map(state.items.map((it) => [it.name.toLowerCase(), it.name]));
  const matchedItems = parsed.items
    .map((n) => knownNames.get(String(n).toLowerCase()))
    .filter(Boolean);
  if (matchedItems.length === 0) {
    throw new Error('Matched element not found in the current map.');
  }

  const positions = {};
  DIMENSIONS.forEach((d) => {
    const v = parsed.userPositions[d.id];
    positions[d.id] = typeof v === 'number' ? clamp(Math.round(v), 0, 100) : 50;
  });

  state.userPositions = positions;
  state.userMatch = {
    type: matchedItems.length >= 2 ? 'combo' : 'single',
    items: matchedItems,
    summary: parsed.summary || '',
    axisNotes: parsed.axisNotes && typeof parsed.axisNotes === 'object' ? parsed.axisNotes : {},
  };
  render();
  persist();
}

async function suggestItem(name) {
  const axesDescription = DIMENSIONS.map(
    (d) => `- ${d.id}: 0 = ${d.leftLabel}, 100 = ${d.rightLabel}`
  ).join('\n');

  const mapPayload = {
    title: state.title,
    notes: state.notes,
    items: state.items.map(({ name, note, positions }) => ({ name, note, positions })),
  };

  const systemPrompt = `You are extending an existing Workstyle Stereotype Map by adding ONE new element. Use the current map as calibration — the positions and notes of existing items define the scale.

SCOPE — same as the rest of this tool: tech, fiction, professional roles, abstract systems.

DO NOT add an element that stereotypes real people by identity (ethnicity, religion, gender, sexual orientation, political ideology, mental-health condition, disability or any vulnerable group). Use judgement on edge cases.

If the requested element is disallowed or too sensitive, DO NOT stop with a refusal. Instead, redirect to a clearly safer adjacent element and say so briefly inside the JSON.

The redirect must be:
- clearly safe
- adjacent enough to feel responsive
- explicitly acknowledged in one short sentence
- never deceptive: the user must be able to tell that you changed the element

Otherwise:

Axes:
${axesDescription}

Current map (calibrate against this):
${JSON.stringify(mapPayload, null, 2)}

For the new element name provided by the user, return positions, a representative emoji icon, and a short workstyle note. The note should be calibrated against the existing notes — same tone, same level of opinion.

Return ONLY valid JSON, no prose:
{
  "safety": {
    "redirected": true or false,
    "message": "empty string if not redirected, otherwise one short sentence explaining the redirect",
    "replacementName": "string - the safer replacement name if redirected, otherwise empty string"
  },
  "icon": "a single emoji that represents the element",
  "note": "1-2 sentences describing the workstyle in plain language",
  "positions": {
    "communicating": 0-100, "evaluating": 0-100, "leading": 0-100,
    "deciding": 0-100, "trusting": 0-100, "disagreeing": 0-100, "scheduling": 0-100
  }
}`;

  const parsed = await openRouterChat(systemPrompt, `New element name: ${name}`);
  if (!parsed || !parsed.positions) {
    throw new Error('Malformed suggestion response.');
  }

  const positions = {};
  DIMENSIONS.forEach((d) => {
    const v = parsed.positions[d.id];
    positions[d.id] = typeof v === 'number' ? clamp(Math.round(v), 0, 100) : 50;
  });

  const finalName = parsed.safety && parsed.safety.redirected && parsed.safety.replacementName
    ? parsed.safety.replacementName
    : name;
  const finalNote = parsed.safety && parsed.safety.redirected && parsed.safety.message
    ? `${parsed.safety.message} ${parsed.note || ''}`.trim()
    : (parsed.note || '');

  state.items.push({
    id: uid(),
    name: finalName,
    icon: parsed.icon || '',
    note: finalNote,
    color: COLORS[state.items.length % COLORS.length],
    positions,
  });
  state.aiTouched = true;
  render();
  persist();
}

function openMatchDialog() {
  $('#matchInput').value = '';
  const status = $('#matchStatus');
  status.textContent = '';
  status.className = 'status';
  $('#matchDialog').showModal();
  setTimeout(() => $('#matchInput').focus(), 50);
}

function init() {
  $('#mapTitle').addEventListener('input', (e) => {
    state.title = e.target.value;
    persist();
  });

  $('#addItemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('#newItemName');
    const name = input.value.trim();
    if (!name) return;
    addItem(name);
    input.value = '';
    input.focus();
    $('#addStatus').textContent = '';
    $('#addStatus').className = 'status add-status';
  });

  $('#addAiBtn').addEventListener('click', async () => {
    const input = $('#newItemName');
    const name = input.value.trim();
    const status = $('#addStatus');
    if (!name) {
      status.className = 'status add-status error';
      status.textContent = 'Type a name first.';
      input.focus();
      return;
    }
    const btn = $('#addAiBtn');
    btn.disabled = true;
    btn.classList.add('loading');
    status.className = 'status add-status thinking-host';
    status.innerHTML = '';
    const anim = createThinkingAnimation('suggest', `"${name}"`);
    status.appendChild(anim.el);
    try {
      await suggestItem(name);
      anim.stop();
      input.value = '';
      status.textContent = '';
      status.className = 'status add-status';
      input.focus();
    } catch (err) {
      anim.stop();
      status.className = 'status add-status error';
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
      btn.classList.remove('loading');
    }
  });

  $('#itemList').addEventListener('input', (e) => {
    const t = e.target;
    if (t.classList && t.classList.contains('item-name')) {
      const item = state.items.find((i) => i.id === t.dataset.id);
      if (item) {
        item.name = t.value;
        DIMENSIONS.forEach((d) => renderAxisDots(d));
        persist();
      }
    }
  });
  $('#itemList').addEventListener('click', (e) => {
    const iconBtn = e.target.closest('.item-icon');
    if (iconBtn && iconBtn.dataset.id) {
      const item = state.items.find((i) => i.id === iconBtn.dataset.id);
      if (item) openItemDialog(item);
      return;
    }
    const t = e.target;
    if (t.classList && t.classList.contains('remove')) {
      removeItem(t.dataset.id);
    }
  });

  $('#presetSelect').addEventListener('change', (e) => {
    const value = e.target.value;
    e.target.value = '';
    if (!value) return;
    if (value.startsWith('lib:')) {
      loadLibraryEntry(value.slice(4));
    } else if (PRESETS[value]) {
      loadMap(PRESETS[value]);
    }
  });

  $('#clearBtn').addEventListener('click', () => {
    if (state.items.length === 0 || confirm('Clear the map? (Saved maps in My maps are not affected.)')) {
      state.title = 'Workstyle Stereotype Map';
      state.notes = '';
      state.items = [];
      state.userMatch = null;
      state.userPositions = null;
      state.aiTouched = false;
      state.currentMapId = null;
      render();
      persist();
    }
  });

  $('#settingsBtn').addEventListener('click', () => {
    $('#apiKeyInput').value = localStorage.getItem('openrouter_api_key') || '';
    $('#modelInput').value = localStorage.getItem('openrouter_model') || DEFAULT_MODEL;
    $('#settingsDialog').showModal();
  });
  document.querySelectorAll('.model-chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      $('#modelInput').value = chip.dataset.model;
      $('#modelInput').focus();
    });
  });
  $('#saveSettings').addEventListener('click', (e) => {
    e.preventDefault();
    localStorage.setItem('openrouter_api_key', $('#apiKeyInput').value.trim());
    localStorage.setItem('openrouter_model', $('#modelInput').value.trim() || DEFAULT_MODEL);
    $('#settingsDialog').close();
    // Re-render so the disabled match CTA goes back to enabled state if needed
    render();
  });

  $('#generateBtn').addEventListener('click', () => {
    $('#topicInput').value = '';
    const status = $('#generateStatus');
    status.textContent = '';
    status.className = 'status';
    $('#generateDialog').showModal();
    setTimeout(() => $('#topicInput').focus(), 50);
  });
  $('#confirmGenerate').addEventListener('click', async (e) => {
    e.preventDefault();
    const topic = $('#topicInput').value.trim();
    if (!topic) return;
    const status = $('#generateStatus');
    const btn = $('#confirmGenerate');
    status.className = 'status';
    status.innerHTML = '';
    const anim = createThinkingAnimation('generate');
    status.appendChild(anim.el);
    btn.disabled = true;
    try {
      await generateWithAI(topic);
      anim.stop();
      $('#generateDialog').close();
    } catch (err) {
      anim.stop();
      status.className = 'status error';
      status.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $('#confirmMatch').addEventListener('click', async (e) => {
    e.preventDefault();
    const description = $('#matchInput').value.trim();
    if (!description) return;
    const status = $('#matchStatus');
    const btn = $('#confirmMatch');
    status.className = 'status';
    status.textContent = '';
    btn.disabled = true;

    // Replace the match panel CTA with the thinking animation
    const matchPanel = $('#matchPanel');
    matchPanel.innerHTML = '';
    const anim = createThinkingAnimation('match');
    matchPanel.appendChild(anim.el);
    $('#matchDialog').close();

    try {
      await findMatch(description);
      // findMatch -> render() -> renderMatchPanel() replaces the animation with the result card
    } catch (err) {
      anim.stop();
      renderMatchPanel();
      // Re-open the dialog with the error
      openMatchDialog();
      $('#matchInput').value = description;
      const status2 = $('#matchStatus');
      status2.className = 'status error';
      status2.textContent = err.message;
    } finally {
      btn.disabled = false;
    }
  });

  $('#map').addEventListener('click', (e) => {
    const name = e.target.closest('.axis-name');
    if (name && name.dataset.dimId) {
      const dim = DIMENSIONS.find((d) => d.id === name.dataset.dimId);
      if (dim) openAxisDialog(dim);
    }
  });

  $('#itemDialogBars').addEventListener('click', (e) => {
    const name = e.target.closest('.axis-bar-name');
    if (name && name.dataset.dimId) {
      const dim = DIMENSIONS.find((d) => d.id === name.dataset.dimId);
      if (dim) openAxisDialog(dim);
    }
  });

  document.querySelectorAll('.example-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $('#matchInput').value = btn.dataset.example;
      $('#matchInput').focus();
    });
  });

  $('#exportBtn').addEventListener('click', exportJson);
  $('#importBtn').addEventListener('click', () => $('#importInput').click());
  $('#importInput').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const text = await file.text();
      loadMap(JSON.parse(text));
    } catch (err) {
      alert('Invalid JSON file.');
    }
    e.target.value = '';
  });

  $('#saveBtn').addEventListener('click', () => {
    const status = $('#saveStatus');
    status.textContent = '';
    status.className = 'status';
    $('#saveTitleInput').value = state.title === 'Workstyle Stereotype Map' ? '' : state.title;
    $('#saveDialog').showModal();
    setTimeout(() => $('#saveTitleInput').focus(), 50);
  });
  $('#confirmSave').addEventListener('click', (e) => {
    e.preventDefault();
    const title = $('#saveTitleInput').value.trim();
    if (!title) {
      $('#saveStatus').className = 'status error';
      $('#saveStatus').textContent = 'Give it a name first.';
      return;
    }
    state.title = title;
    $('#mapTitle').value = title;
    saveCurrentToLibrary({ forceNew: !state.currentMapId });
    $('#saveDialog').close();
  });

  $('#manageMapsBtn').addEventListener('click', () => {
    renderManageList();
    $('#manageMapsDialog').showModal();
  });
  $('#manageMapsList').addEventListener('click', (e) => {
    const loadBtn = e.target.closest('.saved-map-load');
    const delBtn = e.target.closest('.saved-map-delete');
    if (loadBtn && loadBtn.dataset.id) {
      loadLibraryEntry(loadBtn.dataset.id);
      $('#manageMapsDialog').close();
      return;
    }
    if (delBtn && delBtn.dataset.id) {
      const entry = library.find((m) => m.id === delBtn.dataset.id);
      const ok = confirm(`Delete "${entry ? entry.title : 'this map'}"? This cannot be undone.`);
      if (ok) deleteLibraryEntry(delBtn.dataset.id);
    }
  });

  $('#aboutBtn').addEventListener('click', () => {
    $('#aboutDialog').showModal();
  });
  $('#aboutDialog').addEventListener('close', () => {
    try { localStorage.setItem(ONBOARDING_KEY, '1'); } catch (e) {}
  });

  loadLibrary();
  renderMyMapsOptgroup();

  if (!loadFromStorage()) {
    loadMap(PRESETS['coding-agents']);
  }

  try {
    if (!localStorage.getItem(ONBOARDING_KEY)) {
      setTimeout(() => $('#aboutDialog').showModal(), 100);
    }
  } catch (e) {}
}

document.addEventListener('DOMContentLoaded', init);
