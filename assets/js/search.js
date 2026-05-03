(function () {
  const input = document.getElementById('search-input');
  const filtersEl = document.getElementById('active-filters');
  const countEl = document.getElementById('result-count');
  const emptyEl = document.getElementById('empty-state');
  const cards = Array.from(document.querySelectorAll('#results .card'));

  const state = {
    query: '',
    tags: new Set(),
  };

  function readHash() {
    const hash = window.location.hash.replace(/^#/, '');
    if (!hash) return;
    state.tags.clear();
    state.query = '';
    hash.split('&').forEach(part => {
      const [k, v] = part.split('=');
      if (!k || v === undefined) return;
      const value = decodeURIComponent(v.replace(/\+/g, ' '));
      if (k === 'tag' && value) state.tags.add(value.toLowerCase());
      if (k === 'q' && value) state.query = value;
    });
    if (input) input.value = state.query;
  }

  function writeHash() {
    const parts = [];
    if (state.query) parts.push('q=' + encodeURIComponent(state.query));
    state.tags.forEach(t => parts.push('tag=' + encodeURIComponent(t)));
    const next = parts.length ? '#' + parts.join('&') : '';
    if (window.location.hash !== next) {
      history.replaceState(null, '', window.location.pathname + window.location.search + next);
    }
  }

  function renderFilters() {
    filtersEl.innerHTML = '';
    state.tags.forEach(t => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = 'filter-chip';
      chip.setAttribute('aria-label', 'הסר סינון ' + t);
      chip.innerHTML = '<span>' + t + '</span><span class="x" aria-hidden="true">×</span>';
      chip.addEventListener('click', () => {
        state.tags.delete(t);
        writeHash();
        apply();
      });
      filtersEl.appendChild(chip);
    });
  }

  function apply() {
    renderFilters();
    const q = state.query.trim().toLowerCase();
    let visible = 0;
    cards.forEach(card => {
      const haystack = [
        card.dataset.name,
        card.dataset.category,
        card.dataset.tags,
        card.dataset.description,
      ].join(' ');
      const matchesQuery = !q || haystack.indexOf(q) !== -1;
      const cardTags = (card.dataset.tags || '').split(',').map(s => s.trim()).filter(Boolean);
      const matchesTags = state.tags.size === 0 ||
        Array.from(state.tags).every(t => cardTags.indexOf(t) !== -1);
      const show = matchesQuery && matchesTags;
      card.hidden = !show;
      if (show) visible++;
    });
    countEl.textContent = visible + ' מתוך ' + cards.length + ' עסקים';
    emptyEl.hidden = visible !== 0;
  }

  if (input) {
    input.addEventListener('input', e => {
      state.query = e.target.value;
      writeHash();
      apply();
    });
  }

  document.querySelectorAll('.tag[data-tag]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      const tag = btn.dataset.tag.toLowerCase();
      if (state.tags.has(tag)) state.tags.delete(tag);
      else state.tags.add(tag);
      writeHash();
      apply();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  window.addEventListener('hashchange', () => { readHash(); apply(); });

  readHash();
  apply();
})();
