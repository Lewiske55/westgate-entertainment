// ─── Watchlist Manager ───────────────────────────────────────────────────────
const WatchlistManager = {
  STORAGE_KEY: 'westgate-watchlist',

  getAll() {
    try { return JSON.parse(localStorage.getItem(this.STORAGE_KEY) || '[]'); }
    catch { return []; }
  },

  has(id) { return this.getAll().some(item => item.id === id); },

  toggle(item) {
    let list = this.getAll();
    const idx = list.findIndex(i => i.id === item.id);
    if (idx > -1) list.splice(idx, 1);
    else list.push({ id: item.id, type: item.type, title: item.title || item.name,
      poster_path: item.poster_path, vote_average: item.vote_average,
      release_date: item.release_date || item.first_air_date });
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
    this.updateAllButtons(item.id);
    this.updateBadge();
    return idx === -1;
  },

  updateAllButtons(id) {
    document.querySelectorAll(`[data-watchlist-id="${id}"]`).forEach(btn => {
      const inList = this.has(id);
      btn.classList.toggle('in-watchlist', inList);
      btn.title = inList ? 'Remove from Watchlist' : 'Add to Watchlist';
      btn.querySelector('i').className = inList ? 'ph-fill ph-bookmark-simple' : 'ph ph-bookmark-simple';
    });
  },

  updateBadge() {
    const count = this.getAll().length;
    ['watchlistBadge','watchlistBadgeMobile'].forEach(id => {
      const badge = document.getElementById(id);
      if (badge) { badge.textContent = count; badge.classList.toggle('hidden', count === 0); }
    });
  },

  renderModal() {
    const list = this.getAll();
    const content = document.getElementById('watchlistContent');
    if (!content) return;
    if (list.length === 0) {
      content.innerHTML = `<div class="flex flex-col items-center justify-center py-16 text-center">
        <i class="ph-fill ph-bookmark-simple text-5xl text-gray-300 dark:text-gray-600 mb-4"></i>
        <p class="text-gray-500 dark:text-gray-400 font-medium">Your watchlist is empty.</p>
        <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Click the bookmark icon on any movie or show to save it here.</p></div>`;
      return;
    }
    content.innerHTML = `<div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      ${list.map(item => {
        const poster = item.poster_path ? `${CONFIG.TMDB.IMAGE_URL}${item.poster_path}` : CONFIG.TMDB.PLACEHOLDER_IMAGE;
        const year = (item.release_date || '').substring(0, 4) || '';
        return `<div class="group relative bg-gray-100 dark:bg-gray-800 rounded-xl overflow-hidden cursor-pointer border border-gray-200 dark:border-gray-700 hover:border-brand-500 transition"
            onclick="MovieDetailManager.open(${item.id}, '${item.type}')">
          <div class="aspect-[2/3] relative overflow-hidden">
            <img src="${poster}" alt="${item.title}" class="w-full h-full object-cover group-hover:scale-105 transition duration-500"
              onerror="this.src='${CONFIG.TMDB.PLACEHOLDER_IMAGE}'">
            <div class="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition flex items-end p-2">
              <span class="text-white text-xs font-semibold">${item.type === 'tv' ? '📺 TV' : '🎬 Movie'}</span>
            </div>
          </div>
          <div class="p-2">
            <p class="text-xs font-bold text-gray-900 dark:text-white line-clamp-1">${item.title}</p>
            <div class="flex items-center justify-between mt-1">
              <span class="text-xs text-gray-400">${year}</span>
              <button onclick="event.stopPropagation(); WatchlistManager.toggle({id:${item.id},type:'${item.type}'}); WatchlistManager.renderModal()"
                class="text-red-400 hover:text-red-500 transition text-xs">
                <i class="ph-fill ph-trash"></i>
              </button>
            </div>
          </div>
        </div>`;
      }).join('')}
    </div>`;
  },

  openModal() {
    const modal = document.getElementById('watchlistModal');
    if (!modal) return;
    this.renderModal();
    modal.classList.remove('hidden'); modal.classList.add('flex');
    void modal.offsetWidth;
    modal.classList.remove('opacity-0');
    document.getElementById('watchlistModalBox').classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
  },

  closeModal() {
    const modal = document.getElementById('watchlistModal');
    if (!modal) return;
    modal.classList.add('opacity-0');
    document.getElementById('watchlistModalBox').classList.add('scale-95');
    setTimeout(() => { modal.classList.add('hidden'); modal.classList.remove('flex'); document.body.style.overflow = ''; }, 300);
  },

  initModal() {
    const modal = document.createElement('div');
    modal.id = 'watchlistModal';
    modal.className = 'fixed inset-0 z-[115] hidden items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 opacity-0 transition-opacity duration-300';
    modal.innerHTML = `
      <div id="watchlistModalBox" class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col scale-95 transition-transform duration-300 border border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <h3 class="font-bold text-lg flex items-center gap-2">
            <i class="ph-fill ph-bookmark-simple text-brand-500"></i> My Watchlist
          </h3>
          <button onclick="WatchlistManager.closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">
            <i class="ph-bold ph-x text-xl"></i>
          </button>
        </div>
        <div id="watchlistContent" class="overflow-y-auto p-5 flex-1"></div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) this.closeModal(); });
    this.updateBadge();
  }
};

// ─── Pagination Helper ────────────────────────────────────────────────────────
function renderPagination(containerId, currentPage, totalPages, onPageChange) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (totalPages <= 1) { el.innerHTML = ''; return; }

  const maxVisible = 9;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end   = Math.min(totalPages, start + maxVisible - 1);
  if (end - start < maxVisible - 1) start = Math.max(1, end - maxVisible + 1);

  // Store callback in a global map to avoid inline function serialization issues
  if (!window._paginationCallbacks) window._paginationCallbacks = {};
  const cbKey = 'pgcb_' + containerId.replace(/\W/g,'_');
  window._paginationCallbacks[cbKey] = onPageChange;

  const mkBtn = (label, page, active = false, disabled = false) => {
    const action = disabled ? 'return false' : `window._paginationCallbacks['${cbKey}'](${page})`;
    return `<button onclick="${action}" class="min-w-[2rem] h-8 px-2 rounded-lg text-xs font-semibold transition
      ${active   ? 'bg-brand-500 text-white shadow-md ring-2 ring-brand-500/30' : ''}
      ${disabled ? 'opacity-30 cursor-not-allowed' : !active ? 'hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 cursor-pointer' : ''}">${label}</button>`;
  };

  const jumpId = `jump_${containerId}`;

  let pages = '';
  if (start > 1) {
    pages += mkBtn('1', 1);
    if (start > 2) pages += '<span class="px-0.5 text-gray-400 text-xs self-center">…</span>';
  }
  for (let p = start; p <= end; p++) pages += mkBtn(p, p, p === currentPage);
  if (end < totalPages) {
    if (end < totalPages - 1) pages += '<span class="px-0.5 text-gray-400 text-xs self-center">…</span>';
    pages += mkBtn(totalPages, totalPages);
  }

  el.innerHTML = `
    <div class="flex flex-col items-center gap-3 mt-8">
      <div class="flex items-center gap-1 flex-wrap justify-center">
        ${mkBtn('«', 1, false, currentPage === 1)}
        ${mkBtn('‹', currentPage - 1, false, currentPage === 1)}
        ${pages}
        ${mkBtn('›', currentPage + 1, false, currentPage === totalPages)}
        ${mkBtn('»', totalPages, false, currentPage === totalPages)}
      </div>
      <div class="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <span>Page <strong class="text-gray-900 dark:text-white">${currentPage}</strong> of <strong class="text-gray-900 dark:text-white">${totalPages}</strong></span>
        <span class="text-gray-300 dark:text-gray-600">|</span>
        <span class="flex items-center gap-1">Go to:
          <input id="${jumpId}" type="number" min="1" max="${totalPages}" placeholder="${currentPage}"
            onkeydown="if(event.key==='Enter'){var v=parseInt(this.value);if(v>=1&&v<=${totalPages})window._paginationCallbacks['${cbKey}'](v);}"
            class="w-16 px-2 py-0.5 rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-xs focus:border-brand-500 outline-none">
          <button onclick="var v=parseInt(document.getElementById('${jumpId}').value);if(v>=1&&v<=${totalPages})window._paginationCallbacks['${cbKey}'](v);"
            class="px-2 py-0.5 rounded-md bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition">Go</button>
        </span>
      </div>
    </div>`;
}

// ─── Content Manager ──────────────────────────────────────────────────────────
const ContentManager = {
  state: {
    moviePage: 1, movieTotalPages: 1, movieGenre: null,
    tvPage: 1,    tvTotalPages: 1,    tvGenre: null,
    nowPage: 1,   nowTotalPages: 1,
    upcomingPage: 1, upcomingTotalPages: 1,
    trendingPage: 1, trendingTotalPages: 1, trendingWindow: 'day',
    activeTab: 'trending',
    searchQuery: '', searchTimeout: null,
    movieGenres: [], tvGenres: []
  },

  init() {
    this.renderProducts();
    this.renderServices();
    WatchlistManager.initModal();
    this.loadGenres();
    this.initNowShowingSection();
  },

  async loadGenres() {
    const [mg, tg] = await Promise.all([APIService.getMovieGenres(), APIService.getTVGenres()]);
    this.state.movieGenres = mg;
    this.state.tvGenres = tg;
    if (typeof GenreNav !== 'undefined') {
      GenreNav.populateDesktop(mg, tg);
      GenreNav.populateMobile(mg, tg);
    }
  },

  initNowShowingSection() {
    const moviesSection = document.getElementById('movies');
    if (!moviesSection) return;
    const section = document.createElement('section');
    section.id = 'nowshowing';
    section.className = 'scroll-mt-24';
    section.innerHTML = `
      <div class="flex items-center gap-3 mb-5 flex-wrap">
        <button id="tabTrending" onclick="ContentManager.switchCinemaTab('trending')"
          class="cinema-tab text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white transition-opacity">
          <i class="ph-fill ph-fire text-orange-500"></i> Trending
        </button>
        <span class="text-gray-300 dark:text-gray-600 text-2xl font-thin">|</span>
        <button id="tabNowPlaying" onclick="ContentManager.switchCinemaTab('now')"
          class="cinema-tab opacity-40 text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white transition-opacity">
          <i class="ph-fill ph-film-slate text-brand-500"></i> Now Showing
        </button>
        <span class="text-gray-300 dark:text-gray-600 text-2xl font-thin">|</span>
        <button id="tabUpcoming" onclick="ContentManager.switchCinemaTab('upcoming')"
          class="cinema-tab opacity-40 text-2xl sm:text-3xl font-bold flex items-center gap-2 text-gray-900 dark:text-white transition-opacity">
          <i class="ph-fill ph-calendar-star text-purple-500"></i> Coming Soon
        </button>
      </div>
      <div id="trendingControls" class="flex items-center gap-2 mb-5">
        <span class="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Window:</span>
        <button id="trendingDay" onclick="ContentManager.setTrendingWindow('day')"
          class="px-3 py-1 rounded-full text-xs font-bold bg-orange-500 text-white transition">Today</button>
        <button id="trendingWeek" onclick="ContentManager.setTrendingWindow('week')"
          class="px-3 py-1 rounded-full text-xs font-bold bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-500 hover:text-orange-500 transition">This Week</button>
      </div>
      <div id="trendingList" class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"></div>
      <div id="trendingLoader" class="loader hidden"></div>
      <div id="trendingPagination"></div>
      <div id="nowShowingList" class="hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"></div>
      <div id="nowShowingLoader" class="loader hidden"></div>
      <div id="nowShowingPagination" class="hidden"></div>
      <div id="upcomingList" class="hidden grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6"></div>
      <div id="upcomingLoader" class="loader hidden"></div>
      <div id="upcomingPagination" class="hidden"></div>`;
    moviesSection.parentNode.insertBefore(section, moviesSection);
    this.loadTrending(true);
  },

  async switchCinemaTab(tab) {
    this.state.activeTab = tab;
    const tabs = { trending: 'tabTrending', now: 'tabNowPlaying', upcoming: 'tabUpcoming' };
    Object.entries(tabs).forEach(([key, id]) => {
      document.getElementById(id)?.classList.toggle('opacity-40', key !== tab);
    });
    const panels = {
      trending: ['trendingControls','trendingList','trendingPagination'],
      now:      ['nowShowingList','nowShowingPagination'],
      upcoming: ['upcomingList','upcomingPagination']
    };
    Object.entries(panels).forEach(([key, ids]) => {
      ids.forEach(id => document.getElementById(id)?.classList.toggle('hidden', key !== tab));
    });
    if (tab === 'now' && document.getElementById('nowShowingList').children.length === 0) await this.loadNowShowing(true);
    if (tab === 'upcoming' && document.getElementById('upcomingList').children.length === 0) await this.loadUpcoming(true);
  },

  async setTrendingWindow(win) {
    this.state.trendingWindow = win;
    document.getElementById('trendingDay').className = `px-3 py-1 rounded-full text-xs font-bold transition ${win === 'day' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-500 hover:text-orange-500'}`;
    document.getElementById('trendingWeek').className = `px-3 py-1 rounded-full text-xs font-bold transition ${win === 'week' ? 'bg-orange-500 text-white' : 'bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-orange-500 hover:text-orange-500'}`;
    await this.loadTrending(true);
  },

  async loadTrending(clear = false) {
    if (clear) this.state.trendingPage = 1;
    UI.loader.show('trendingLoader');
    const { results, totalPages } = await APIService.getTrending(this.state.trendingWindow, this.state.trendingPage);
    this.state.trendingTotalPages = totalPages;
    UI.loader.hide('trendingLoader');
    const mapped = results.map(item => ({ ...item, _type: item.media_type === 'tv' ? 'tv' : 'movie' }));
    this.renderTrendingItems(mapped, 'trendingList', clear);
    renderPagination('trendingPagination', this.state.trendingPage, totalPages, (p) => {
      ContentManager.state.trendingPage = p; ContentManager.loadTrending(true);
      document.getElementById('nowshowing')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  },

  renderTrendingItems(items, containerId, clear = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (clear) container.innerHTML = '';
    if (items.length === 0 && clear) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-16">No results found.</p>';
      return;
    }
    items.forEach((item, index) => {
      const card = this.createCard(item, item._type || 'movie');
      if (index < 10) {
        const rankBadge = document.createElement('div');
        rankBadge.className = 'absolute bottom-2 left-2 w-7 h-7 bg-orange-500 text-white text-xs font-black rounded-full flex items-center justify-center shadow-lg z-10';
        rankBadge.textContent = (this.state.trendingPage - 1) * 20 + index + 1;
        card.querySelector('.relative.overflow-hidden')?.appendChild(rankBadge);
      }
      const typeBadge = document.createElement('div');
      typeBadge.className = `absolute top-2 left-2 text-white text-[10px] font-bold px-1.5 py-0.5 rounded ${item._type === 'tv' ? 'bg-blue-600' : 'bg-gray-900/80'}`;
      typeBadge.textContent = item._type === 'tv' ? 'TV' : 'Film';
      card.querySelector('.relative.overflow-hidden')?.appendChild(typeBadge);
      container.appendChild(card);
    });
  },

  async loadNowShowing(clear = false) {
    if (clear) this.state.nowPage = 1;
    UI.loader.show('nowShowingLoader');
    const { results, totalPages } = await APIService.getNowPlaying(this.state.nowPage);
    this.state.nowTotalPages = totalPages;
    UI.loader.hide('nowShowingLoader');
    this.renderItems(results, 'nowShowingList', 'movie', clear);
    renderPagination('nowShowingPagination', this.state.nowPage, totalPages, (p) => {
      ContentManager.state.nowPage = p; ContentManager.loadNowShowing(true);
      document.getElementById('nowshowing')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  },

  async loadUpcoming(clear = false) {
    if (clear) this.state.upcomingPage = 1;
    UI.loader.show('upcomingLoader');
    const { results, totalPages } = await APIService.getUpcoming(this.state.upcomingPage);
    this.state.upcomingTotalPages = totalPages;
    UI.loader.hide('upcomingLoader');
    this.renderItems(results, 'upcomingList', 'movie', clear);
    results.forEach(item => {
      if (!item.release_date) return;
      const card = document.querySelector(`#upcomingList [data-item-id="${item.id}"]`);
      if (!card) return;
      const badge = document.createElement('div');
      badge.className = 'absolute bottom-0 left-0 right-0 bg-purple-600/90 text-white text-xs font-bold px-2 py-1 text-center backdrop-blur-sm';
      const d = new Date(item.release_date);
      badge.textContent = d.toLocaleDateString('en-KE', { day:'numeric', month:'short', year:'numeric' });
      card.querySelector('.relative.overflow-hidden')?.appendChild(badge);
    });
    renderPagination('upcomingPagination', this.state.upcomingPage, totalPages, (p) => {
      ContentManager.state.upcomingPage = p; ContentManager.loadUpcoming(true);
      document.getElementById('nowshowing')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  },

  async loadMovies(clear = false) {
    if (clear) this.state.moviePage = 1;
    UI.loader.show('movieLoader');
    const { results, totalPages } = this.state.movieGenre
      ? await APIService.getMoviesByGenre(this.state.movieGenre, this.state.moviePage)
      : await APIService.getPopularMovies(this.state.moviePage);
    this.state.movieTotalPages = totalPages;
    UI.loader.hide('movieLoader');
    this.renderItems(results, 'movieList', 'movie', clear);
    renderPagination('moviePagination', this.state.moviePage, totalPages, (p) => {
      ContentManager.state.moviePage = p; ContentManager.loadMovies(true);
      document.getElementById('movies')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  },

  async loadTV(clear = false) {
    if (clear) this.state.tvPage = 1;
    UI.loader.show('tvLoader');
    const { results, totalPages } = this.state.tvGenre
      ? await APIService.getTVByGenre(this.state.tvGenre, this.state.tvPage)
      : await APIService.getPopularTV(this.state.tvPage);
    this.state.tvTotalPages = totalPages;
    UI.loader.hide('tvLoader');
    this.renderItems(results, 'tvList', 'tv', clear);
    renderPagination('tvPagination', this.state.tvPage, totalPages, (p) => {
      ContentManager.state.tvPage = p; ContentManager.loadTV(true);
      document.getElementById('tvseries')?.scrollIntoView({ behavior:'smooth', block:'start' });
    });
  },

  loadMoreMovies() { this.state.moviePage++; this.loadMovies(); },
  loadMoreTV()     { this.state.tvPage++;     this.loadTV();     },

  handleSearch(query) {
    clearTimeout(this.state.searchTimeout);
    this.state.searchTimeout = setTimeout(async () => {
      if (query.length < 3) {
        if (query.length === 0) { this.loadMovies(true); this.loadTV(true); }
        return;
      }
      UI.loader.show('movieLoader'); UI.loader.show('tvLoader');
      const { results } = await APIService.search(query);
      const movies = (results||[]).filter(i => i.media_type==='movie');
      const tv     = (results||[]).filter(i => i.media_type==='tv');
      this.renderItems(movies, 'movieList', 'movie', true);
      this.renderItems(tv,     'tvList',    'tv',    true);
      document.getElementById('moviePagination').innerHTML = '';
      document.getElementById('tvPagination').innerHTML = '';
      UI.loader.hide('movieLoader'); UI.loader.hide('tvLoader');
    }, 600);
  },

  createCard(item, type) {
    const title  = item.title || item.name || 'Unknown';
    const year   = (item.release_date || item.first_air_date || '').substring(0, 4) || 'N/A';
    const poster = item.poster_path ? `${CONFIG.TMDB.IMAGE_URL}${item.poster_path}` : CONFIG.TMDB.PLACEHOLDER_IMAGE;
    const rating = item.vote_average ? item.vote_average.toFixed(1) : '';
    const inWL   = WatchlistManager.has(item.id);

    const safeTitle = title.replace(/'/g, "\\'").replace(/"/g, '&quot;');
    const itemData  = JSON.stringify({ id:item.id, type, title, poster_path:item.poster_path,
      vote_average:item.vote_average, release_date:item.release_date||item.first_air_date }).replace(/"/g,'&quot;');

    const card = document.createElement('div');
    card.className = 'movie-card bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-700 group cursor-pointer flex flex-col';
    card.setAttribute('data-item-id', item.id);
    card.onclick = () => MovieDetailManager.open(item.id, type);

    card.innerHTML = `
      <div class="relative overflow-hidden aspect-[2/3] bg-gray-200 dark:bg-gray-700">
        <img src="${poster}" alt="${title}" loading="lazy"
          class="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          onerror="this.src='${CONFIG.TMDB.PLACEHOLDER_IMAGE}'">
        <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col items-center justify-center gap-3">
          <button onclick="event.stopPropagation(); TrailerManager.play(${item.id}, '${type}', '${safeTitle}')"
            class="bg-brand-500 hover:bg-brand-600 text-white rounded-full px-4 py-2 text-xs font-bold flex items-center gap-1 shadow-lg transition transform hover:scale-105">
            <i class="ph-fill ph-play text-sm"></i> Trailer
          </button>
          <button onclick="event.stopPropagation(); MovieDetailManager.open(${item.id}, '${type}')"
            class="bg-white/20 hover:bg-white/30 text-white rounded-full px-4 py-2 text-xs font-semibold flex items-center gap-1 backdrop-blur-sm transition">
            <i class="ph-fill ph-info text-sm"></i> Cast & Info
          </button>
        </div>
        ${rating ? `<span class="absolute top-2 left-2 ${UI.ratingBadgeColor(item.vote_average)} text-white text-xs font-bold px-2 py-0.5 rounded-md shadow">${rating}</span>` : ''}
        <button data-watchlist-id="${item.id}" data-item="${itemData}"
          onclick="event.stopPropagation(); WatchlistManager.toggle(JSON.parse(this.dataset.item))"
          title="${inWL ? 'Remove from Watchlist' : 'Add to Watchlist'}"
          class="watchlist-btn absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 hover:bg-black/80 flex items-center justify-center text-white transition ${inWL ? 'in-watchlist' : ''}">
          <i class="${inWL ? 'ph-fill ph-bookmark-simple' : 'ph ph-bookmark-simple'} text-sm"></i>
        </button>
      </div>
      <div class="p-3 flex flex-col flex-grow">
        <h3 class="font-bold text-gray-900 dark:text-white line-clamp-1 text-sm">${title}</h3>
        <div class="flex items-center justify-between mt-auto pt-2">
          <span class="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 py-0.5 px-2 rounded-md">${year}</span>
          <div class="flex text-xs">${UI.generateStars(item.vote_average)}</div>
        </div>
      </div>`;
    return card;
  },

  renderItems(items, containerId, type, clear = false) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (clear) container.innerHTML = '';
    if (items.length === 0 && clear) {
      container.innerHTML = '<p class="col-span-full text-center text-gray-500 dark:text-gray-400 py-16">No results found.</p>';
      return;
    }
    items.forEach(item => container.appendChild(this.createCard(item, type)));
  },

  renderProducts() {
    const container = document.getElementById('productsGrid');
    if (!container) return;
    container.innerHTML = CONFIG.PRODUCTS.map(product => `
      <div class="group bg-gray-50 dark:bg-gray-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 dark:border-gray-700 flex flex-col">
        <div class="h-48 bg-gray-200 dark:bg-gray-700 relative overflow-hidden">
          <img src="${product.image}" alt="${product.name}"
            onerror="this.onerror=null;this.src='https://placehold.co/400x300/1f2937/9ca3af?text=${encodeURIComponent(product.name)}'"
            class="object-cover w-full h-full group-hover:scale-105 transition duration-500">
        </div>
        <div class="p-5 text-center flex flex-col flex-1">
          <h3 class="text-base font-bold text-gray-900 dark:text-white flex-1">${product.name}</h3>
          <p class="text-brand-500 font-extrabold text-xl my-3">KES ${product.price.toLocaleString()}</p>
          <button onclick="PesaPalManager.open('${product.name.replace(/'/g,"\\'")}', ${product.price})"
            class="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition shadow-md flex items-center justify-center gap-2 text-sm">
            <i class="ph-fill ph-credit-card"></i> Buy via PesaPal
          </button>
          <a href="https://wa.me/${CONFIG.CONTACT.WHATSAPP}?text=${encodeURIComponent('Hi! I want to order: '+product.name+' (KES '+product.price.toLocaleString()+')')}"
            target="_blank" rel="noopener noreferrer"
            class="mt-2 w-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-semibold py-2.5 px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm">
            <i class="ph-fill ph-whatsapp-logo text-green-500"></i> Order via WhatsApp
          </a>
        </div>
      </div>`).join('');
  },

  renderServices() {
    // Services are now rendered directly in index.html as static HTML sections
    // This function is kept for backward compatibility
  },

  onDragOver(e,idx){e.preventDefault();document.getElementById(`dropZone${idx}`)?.classList.add('border-brand-500','bg-brand-500/5');},
  onDragLeave(e,idx){document.getElementById(`dropZone${idx}`)?.classList.remove('border-brand-500','bg-brand-500/5');},
  onDrop(e,idx){
    e.preventDefault();this.onDragLeave(e,idx);
    const f=e.dataTransfer.files[0];
    if(f) this.processFile(f, idx, document.getElementById(`serviceTitle${idx}`)?.textContent || 'Service');
  },
  handleFileUpload(e,idx,t){const f=e.target.files[0];if(f)this.processFile(f,idx,t);},
  processFile(file, idx, serviceTitle){
    const maxSize=20*1024*1024;
    const statusEl=document.getElementById(`fileStatus${idx}`);
    const dropZone=document.getElementById(`dropZone${idx}`);
    if(!statusEl||!dropZone) return;
    if(file.size>maxSize){
      statusEl.innerHTML='<span class="text-red-500"><i class="ph-fill ph-warning"></i> File too large (max 20 MB)</span>';
      statusEl.classList.remove('hidden');return;
    }
    dropZone.innerHTML=`<i class="ph-fill ph-file-text text-2xl text-brand-500"></i><p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mt-1 truncate px-2">${file.name}</p><p class="text-xs text-gray-400">${(file.size/1024).toFixed(1)} KB</p>`;
    const waMsg=encodeURIComponent(`Hi! I'd like the "${serviceTitle}" service.\n\nDocument: ${file.name} (${(file.size/1024).toFixed(1)} KB)\n\nPlease advise on how to send the file.`);
    statusEl.innerHTML=`<div class="flex flex-col gap-2 mt-2"><p class="text-green-600 dark:text-green-400 font-medium"><i class="ph-fill ph-check-circle"></i> File selected!</p><a href="https://wa.me/${CONFIG.CONTACT.WHATSAPP}?text=${waMsg}" target="_blank" rel="noopener noreferrer" class="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-3 rounded-lg text-xs flex items-center justify-center gap-1 transition"><i class="ph-fill ph-whatsapp-logo text-sm"></i> Send via WhatsApp</a><button onclick="ContentManager.resetUpload(${idx})" class="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition">✕ Remove file</button></div>`;
    statusEl.classList.remove('hidden');
  },
  resetUpload(idx){
    const dropZone=document.getElementById(`dropZone${idx}`);
    const input=document.getElementById(`fileInput${idx}`);
    const hint=document.getElementById(`uploadHint${idx}`)||{textContent:''};
    if(dropZone) dropZone.innerHTML=`<i class="ph-fill ph-cloud-arrow-up text-2xl text-gray-400 dark:text-gray-500"></i><p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Click or drag & drop</p><p class="text-xs text-gray-400 dark:text-gray-500">${hint.textContent}</p>`;
    const s=document.getElementById(`fileStatus${idx}`);
    if(s) s.classList.add('hidden');
    if(input) input.value='';
  }
};
