// ─── Search Dropdown ──────────────────────────────────────────────────────────
const SearchDropdown = {
  timeout: null,
  isOpen: false,

  init() {
    const box = document.getElementById('searchBox');
    if (!box) return;
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
      if (!document.getElementById('searchWrapper')?.contains(e.target)) {
        this.hide();
      }
    });
    // Keyboard: Escape closes, Enter/arrows navigate
    box.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') { this.hide(); box.blur(); }
    });
  },

  show() {
    document.getElementById('searchDropdown')?.classList.remove('hidden');
    this.isOpen = true;
  },

  hide() {
    document.getElementById('searchDropdown')?.classList.add('hidden');
    this.isOpen = false;
  },

  clear() {
    document.getElementById('searchBox').value = '';
    this.hide();
    ContentManager.loadMovies(true);
    ContentManager.loadTV(true);
  },

  async search(query) {
    clearTimeout(this.timeout);
    if (!query || query.trim().length < 2) {
      this.hide();
      if (!query) { ContentManager.loadMovies(true); ContentManager.loadTV(true); }
      return;
    }

    this.timeout = setTimeout(async () => {
      this.renderLoading();
      this.show();

      const { results } = await APIService.search(query);
      const filtered = (results || []).filter(i => i.media_type === 'movie' || i.media_type === 'tv');

      if (!filtered.length) {
        this.renderEmpty(query);
        return;
      }

      // Split into movies and TV
      const movies = filtered.filter(i => i.media_type === 'movie').slice(0, 8);
      const tv     = filtered.filter(i => i.media_type === 'tv').slice(0, 8);
      this.renderResults(movies, tv, query);
    }, 350);
  },

  renderLoading() {
    const inner = document.getElementById('searchDropdownInner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="flex items-center gap-3 px-5 py-4 text-gray-400 text-sm">
        <div class="w-4 h-4 border-2 border-gray-600 border-t-brand-500 rounded-full animate-spin flex-shrink-0"></div>
        Searching…
      </div>`;
  },

  renderEmpty(query) {
    const inner = document.getElementById('searchDropdownInner');
    if (!inner) return;
    inner.innerHTML = `
      <div class="px-5 py-6 text-center">
        <i class="ph-fill ph-film-slash text-3xl text-gray-600 mb-2 block"></i>
        <p class="text-gray-400 text-sm">No results for "<strong class="text-white">${query}</strong>"</p>
      </div>`;
  },

  renderResults(movies, tv, query) {
    const inner = document.getElementById('searchDropdownInner');
    if (!inner) return;

    const makeRow = (item, type) => {
      const title   = item.title || item.name || 'Unknown';
      const year    = (item.release_date || item.first_air_date || '').substring(0, 4);
      const poster  = item.poster_path
        ? `${CONFIG.TMDB.IMAGE_URL}${item.poster_path}`
        : CONFIG.TMDB.PLACEHOLDER_IMAGE;
      const rating  = item.vote_average ? item.vote_average.toFixed(1) : '';
      const typeBadge = type === 'tv'
        ? '<span class="text-[10px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded">TV</span>'
        : '<span class="text-[10px] font-bold bg-gray-700 text-white px-1.5 py-0.5 rounded">Film</span>';
      const ratingBadge = rating
        ? `<span class="text-[10px] font-bold ${UI.ratingBadgeColor(item.vote_average)} text-white px-1.5 py-0.5 rounded flex items-center gap-0.5"><i class="ph-fill ph-star text-[9px]"></i>${rating}</span>`
        : '';

      return `
        <button onclick="SearchDropdown.pick(${item.id}, '${type}', '${title.replace(/'/g,"\\'")}')"
          class="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/5 transition text-left group">
          <img src="${poster}" alt="${title}"
            onerror="this.src='${CONFIG.TMDB.PLACEHOLDER_IMAGE}'"
            class="w-10 h-14 object-cover rounded-lg flex-shrink-0 border border-gray-700 group-hover:border-brand-500 transition">
          <div class="flex-1 min-w-0">
            <p class="text-white text-sm font-semibold truncate leading-tight">${title}</p>
            <div class="flex items-center gap-1.5 mt-1 flex-wrap">
              ${typeBadge}
              ${year ? `<span class="text-gray-400 text-xs">${year}</span>` : ''}
              ${ratingBadge}
            </div>
          </div>
          <i class="ph ph-caret-right text-gray-600 group-hover:text-brand-500 flex-shrink-0 transition"></i>
        </button>`;
    };

    const section = (title, icon, items, type) => items.length ? `
      <div class="px-4 pt-3 pb-1">
        <p class="text-xs font-bold uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
          <i class="${icon} text-sm"></i> ${title}
        </p>
      </div>
      <div class="divide-y divide-gray-800">
        ${items.map(i => makeRow(i, type)).join('')}
      </div>` : '';

    // "See all results" footer button
    const footer = `
      <div class="border-t border-gray-800 px-4 py-2.5 flex items-center justify-between">
        <span class="text-xs text-gray-500">Showing top results for "<span class="text-gray-300">${query}</span>"</span>
        <button onclick="SearchDropdown.showAllResults('${query.replace(/'/g,"\\'")}') "
          class="text-xs font-semibold text-brand-500 hover:text-brand-400 flex items-center gap-1 transition">
          See all in grid <i class="ph ph-arrow-right text-xs"></i>
        </button>
      </div>`;

    inner.innerHTML =
      section('Movies', 'ph-fill ph-popcorn', movies, 'movie') +
      section('TV Series', 'ph-fill ph-television', tv, 'tv') +
      footer;
  },

  pick(id, type, title) {
    this.hide();
    MovieDetailManager.open(id, type);
  },

  // Push results into the main grids
  showAllResults(query) {
    this.hide();
    document.getElementById('searchBox').value = query;
    ContentManager.handleSearch(query);
    document.getElementById('movies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

// ─── Bootstrap ────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  ThemeManager.init();
  TrailerManager.init();
  MovieDetailManager.init();
  PesaPalManager.init();
  ContentManager.init();
  SearchDropdown.init();

  ContentManager.loadMovies(true);
  ContentManager.loadTV(true);
});

// ─── Global helpers ───────────────────────────────────────────────────────────
function toggleTheme()      { ThemeManager.toggle(); }
function toggleMobileMenu() { UI.toggleMobileMenu(); }

function handleSearch() {
  const query = document.getElementById('searchBox').value.trim();
  SearchDropdown.search(query);
  // Also push to grids for full results when query is long enough
  if (query.length >= 3) ContentManager.handleSearch(query);
  else if (!query) { ContentManager.loadMovies(true); ContentManager.loadTV(true); }
}

function loadMoreMovies() { ContentManager.loadMoreMovies(); }
function loadMoreTV()     { ContentManager.loadMoreTV(); }

function sendConfirmation(e) {
  e.preventDefault();
  const form  = e.target;
  const name  = form.querySelector('input[type=text]').value;
  const email = form.querySelector('input[type=email]').value;
  const message = form.querySelector('textarea').value;
  const waMsg = encodeURIComponent(`*New Message from ${name}*\nEmail: ${email}\n\n${message}`);
  window.open(`https://wa.me/${CONFIG.CONTACT.WHATSAPP}?text=${waMsg}`, '_blank', 'noopener,noreferrer');
  UI.modals.alert.show(
    'Message Sent!',
    "Thank you for reaching out. We'll reply shortly on WhatsApp.",
    'ph-check-circle',
    'text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400'
  );
  form.reset();
}

// Smooth scroll for nav links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    e.preventDefault();
    const target = document.getElementById(this.getAttribute('href').substring(1));
    if (target) { target.scrollIntoView({ behavior: 'smooth', block: 'start' }); UI.closeMobileMenu(); }
  });
});
