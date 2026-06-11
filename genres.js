/**
 * GenreNav — navbar genre dropdown (desktop mega-panel + mobile accordion)
 * Called by ContentManager.loadGenres() after genres are fetched.
 */
const GenreNav = {
  isOpen: false,
  isMobileOpen: false,
  activeTab: 'movie',
  activeMobileTab: 'movie',
  selectedMovie: null,   // null = All
  selectedTV: null,

  // ── Called by ContentManager after genre data arrives ──────────────────────
  populateDesktop(movieGenres, tvGenres) {
    this._fillPanel('gnMovieGenres', movieGenres, 'movie', false);
    this._fillPanel('gnTVGenres',    tvGenres,    'tv',    true);
    // Close on outside click (safe to register multiple times — idempotent check)
    if (!this._outsideListenerAdded) {
      this._outsideListenerAdded = true;
      document.addEventListener('click', (e) => {
        if (this.isOpen && !document.getElementById('genreNavWrapper')?.contains(e.target)) {
          this.close();
        }
      });
    }
  },

  populateMobile(movieGenres, tvGenres) {
    this._fillMobilePanel('mgnMovieGenres', movieGenres, 'movie');
    this._fillMobilePanel('mgnTVGenres',    tvGenres,    'tv');
    document.getElementById('mgnTVGenres')?.classList.add('hidden');
  },

  // ── Desktop dropdown ────────────────────────────────────────────────────────
  toggle() { this.isOpen ? this.close() : this.open(); },

  open() {
    this.isOpen = true;
    document.getElementById('genreNavPanel')?.classList.remove('hidden');
    document.getElementById('genreNavCaret')?.classList.add('rotate-180');
  },

  close() {
    this.isOpen = false;
    document.getElementById('genreNavPanel')?.classList.add('hidden');
    document.getElementById('genreNavCaret')?.classList.remove('rotate-180');
  },

  switchTab(tab) {
    this.activeTab = tab;
    const activeC  = 'gn-tab flex-1 py-2 rounded-xl text-sm font-bold bg-brand-500 text-white transition';
    const inactiveC = 'gn-tab flex-1 py-2 rounded-xl text-sm font-bold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition';
    document.getElementById('gnTabMovie').className = tab === 'movie' ? activeC : inactiveC;
    document.getElementById('gnTabTV').className    = tab === 'tv'    ? activeC : inactiveC;
    document.getElementById('gnMovieGenres')?.classList.toggle('hidden', tab !== 'movie');
    document.getElementById('gnTVGenres')?.classList.toggle('hidden',    tab !== 'tv');
  },

  select(genreId, mediaType) {
    const numId = genreId === 'all' ? null : parseInt(genreId);
    if (mediaType === 'movie') this.selectedMovie = numId;
    else                       this.selectedTV    = numId;

    // Highlight pills in both desktop & mobile panels
    this._syncHighlight('gnMovieGenres',  'gnTVGenres',  genreId, mediaType, false);
    this._syncHighlight('mgnMovieGenres', 'mgnTVGenres', genreId, mediaType, true);

    // Load filtered content and scroll
    if (mediaType === 'movie') {
      ContentManager.state.movieGenre = numId;
      ContentManager.loadMovies(true);
      document.getElementById('movies')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      ContentManager.state.tvGenre = numId;
      ContentManager.loadTV(true);
      document.getElementById('tvseries')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
    this.close();
  },

  // ── Mobile accordion ─────────────────────────────────────────────────────────
  toggleMobile() {
    this.isMobileOpen = !this.isMobileOpen;
    document.getElementById('mobileGenrePanel')?.classList.toggle('hidden', !this.isMobileOpen);
    document.getElementById('mobileGenreCaret')?.classList.toggle('rotate-180', this.isMobileOpen);
  },

  switchMobileTab(tab) {
    this.activeMobileTab = tab;
    const activeC  = 'mgn-tab flex-1 py-1.5 rounded-lg text-xs font-bold bg-brand-500 text-white transition';
    const inactiveC = 'mgn-tab flex-1 py-1.5 rounded-lg text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 transition';
    document.getElementById('mgnTabMovie').className = tab === 'movie' ? activeC : inactiveC;
    document.getElementById('mgnTabTV').className    = tab === 'tv'    ? activeC : inactiveC;
    document.getElementById('mgnMovieGenres')?.classList.toggle('hidden', tab !== 'movie');
    document.getElementById('mgnTVGenres')?.classList.toggle('hidden',    tab !== 'tv');
  },

  selectMobile(genreId, mediaType) {
    // Reuse desktop select logic — it syncs mobile pills too
    this.select(genreId, mediaType);
    UI.closeMobileMenu();
  },

  // ── Internal helpers ─────────────────────────────────────────────────────────
  _fillPanel(containerId, genres, mediaType, startHidden) {
    const el = document.getElementById(containerId);
    if (!el) return;
    const baseClass = `flex flex-wrap gap-2 max-h-52 overflow-y-auto scrollbar-thin pr-1${startHidden ? ' hidden' : ''}`;
    el.className = baseClass;
    el.innerHTML = this._pill('all', '✦ All', mediaType, null, false)
      + genres.map(g => this._pill(g.id, g.name, mediaType, g.id, false)).join('');
  },

  _fillMobilePanel(containerId, genres, mediaType) {
    const el = document.getElementById(containerId);
    if (!el) return;
    el.innerHTML = this._pill('all', '✦ All', mediaType, null, true)
      + genres.map(g => this._pill(g.id, g.name, mediaType, g.id, true)).join('');
  },

  _pill(id, name, mediaType, numericId, isMobile) {
    const isSelected = mediaType === 'movie'
      ? (numericId === null ? this.selectedMovie === null : this.selectedMovie === numericId)
      : (numericId === null ? this.selectedTV   === null : this.selectedTV   === numericId);
    const size = isMobile ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
    const fn   = isMobile
      ? `GenreNav.selectMobile('${id}','${mediaType}')`
      : `GenreNav.select('${id}','${mediaType}')`;
    return `<button onclick="${fn}" data-genre="${id}" data-media="${mediaType}"
      class="genre-nav-pill flex-shrink-0 ${size} rounded-full font-semibold border transition
        ${isSelected
          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400'}">
      ${name}
    </button>`;
  },

  _syncHighlight(moviePanelId, tvPanelId, activeGenreId, mediaType, isMobile) {
    const panelId = mediaType === 'movie' ? moviePanelId : tvPanelId;
    const el = document.getElementById(panelId);
    if (!el) return;
    const size = isMobile ? 'px-3 py-1 text-xs' : 'px-3.5 py-1.5 text-sm';
    el.querySelectorAll('.genre-nav-pill').forEach(b => {
      const active = b.dataset.genre === String(activeGenreId);
      b.className = `genre-nav-pill flex-shrink-0 ${size} rounded-full font-semibold border transition
        ${active
          ? 'bg-brand-500 text-white border-brand-500 shadow-sm'
          : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-400'}`;
    });
  }
};
