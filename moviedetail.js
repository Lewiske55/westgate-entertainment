const MovieDetailManager = {
  modal: null,

  init() {
    this.modal = document.createElement('div');
    this.modal.id = 'movieDetailModal';
    this.modal.className = 'fixed inset-0 z-[110] hidden items-center justify-center bg-black/80 backdrop-blur-sm px-4 py-6 opacity-0 transition-opacity duration-300';
    this.modal.innerHTML = `
      <div id="movieDetailBox" class="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto scale-95 transition-transform duration-300 border border-gray-200 dark:border-gray-700">
        <button onclick="MovieDetailManager.close()" class="absolute top-3 right-3 z-20 bg-black/50 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors">
          <i class="ph-bold ph-x text-lg"></i>
        </button>
        <div id="movieDetailContent" class="p-0"></div>
      </div>
    `;
    document.body.appendChild(this.modal);

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  },

  async open(id, type) {
    // Show loading state
    const content = document.getElementById('movieDetailContent');
    content.innerHTML = `
      <div class="flex items-center justify-center py-24">
        <div class="loader"></div>
      </div>`;

    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    void this.modal.offsetWidth;
    this.modal.classList.remove('opacity-0');
    document.getElementById('movieDetailBox').classList.remove('scale-95');
    document.body.style.overflow = 'hidden';

    try {
      const details = await APIService.getMovieDetails(id, type);
      if (!details) throw new Error('No details returned');
      this.render(details, type);
    } catch (err) {
      console.error('Detail error:', err);
      content.innerHTML = `
        <div class="p-8 text-center">
          <i class="ph-fill ph-warning-circle text-4xl text-red-400 mb-3 block"></i>
          <p class="text-gray-600 dark:text-gray-300">Failed to load details. Please try again.</p>
          <button onclick="MovieDetailManager.close()" class="mt-4 bg-brand-500 text-white px-5 py-2 rounded-xl">Close</button>
        </div>`;
    }
  },

  render(d, type) {
    const title = d.title || d.name || 'Unknown';
    const year  = (d.release_date || d.first_air_date || '').substring(0, 4) || '—';
    const backdrop = d.backdrop_path
      ? `${CONFIG.TMDB.IMAGE_URL_ORIGINAL}${d.backdrop_path}`
      : null;
    const poster = d.poster_path
      ? `${CONFIG.TMDB.IMAGE_URL}${d.poster_path}`
      : CONFIG.TMDB.PLACEHOLDER_IMAGE;
    const rating  = d.vote_average ? d.vote_average.toFixed(1) : 'N/A';
    const runtime = d.runtime ? `${d.runtime} min` : (d.episode_run_time?.[0] ? `~${d.episode_run_time[0]} min/ep` : '');
    const genres  = (d.genres || []).map(g => g.name).join(', ') || '—';
    const overview = d.overview || 'No synopsis available.';

    // Cast — top 8
    const cast = (d.credits?.cast || []).slice(0, 8);

    // Find trailer key
    const videos = d.videos?.results || [];
    const trailer =
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official) ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find(v => v.site === 'YouTube');

    const castHTML = cast.length
      ? `<div class="mt-5">
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Cast</h4>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            ${cast.map(actor => {
              const photo = actor.profile_path
                ? `${CONFIG.TMDB.IMAGE_URL}${actor.profile_path}`
                : `https://placehold.co/100x150/374151/9ca3af?text=${encodeURIComponent(actor.name.split(' ')[0])}`;
              return `
                <div class="flex-shrink-0 text-center w-20">
                  <img src="${photo}" alt="${actor.name}" onerror="this.src='https://placehold.co/100x150/374151/9ca3af?text=Actor'"
                    class="w-16 h-16 object-cover rounded-full mx-auto mb-1 border-2 border-gray-200 dark:border-gray-700">
                  <p class="text-xs font-medium text-gray-800 dark:text-white leading-tight line-clamp-2">${actor.name}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight line-clamp-1">${actor.character || ''}</p>
                </div>`;
            }).join('')}
          </div>
        </div>`
      : '';

    const content = document.getElementById('movieDetailContent');
    content.innerHTML = `
      <!-- Backdrop -->
      <div class="relative h-48 sm:h-60 overflow-hidden rounded-t-2xl bg-gray-900">
        ${backdrop
          ? `<img src="${backdrop}" alt="${title}" class="w-full h-full object-cover opacity-60">`
          : `<div class="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900"></div>`}
        <div class="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-transparent"></div>
        <!-- Play trailer button over backdrop -->
        ${trailer ? `
          <button onclick="MovieDetailManager.close(); TrailerManager.play(${d.id}, '${type}', '${title.replace(/'/g, "\\'")}');"
            class="absolute inset-0 flex items-center justify-center group">
            <div class="bg-brand-500/90 group-hover:bg-brand-500 text-white rounded-full p-4 shadow-xl transition transform group-hover:scale-110">
              <i class="ph-fill ph-play text-3xl"></i>
            </div>
          </button>` : ''}
      </div>

      <!-- Main info -->
      <div class="p-5 sm:p-6 -mt-12 relative">
        <div class="flex gap-4">
          <!-- Poster -->
          <img src="${poster}" alt="${title}" onerror="this.src='${CONFIG.TMDB.PLACEHOLDER_IMAGE}'"
            class="w-24 sm:w-32 rounded-xl shadow-lg border-2 border-white dark:border-gray-700 flex-shrink-0 object-cover">

          <!-- Title & meta -->
          <div class="pt-12 min-w-0">
            <h2 class="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">${title}</h2>
            <div class="flex flex-wrap items-center gap-2 mt-2">
              <span class="text-sm text-gray-500 dark:text-gray-400">${year}</span>
              ${runtime ? `<span class="text-gray-300 dark:text-gray-600">•</span><span class="text-sm text-gray-500 dark:text-gray-400">${runtime}</span>` : ''}
              <span class="inline-flex items-center gap-1 ${UI.ratingBadgeColor(d.vote_average)} text-white text-xs font-bold px-2 py-0.5 rounded-md">
                <i class="ph-fill ph-star text-xs"></i> ${rating}
              </span>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${genres}</p>
          </div>
        </div>

        <!-- Overview -->
        <div class="mt-5">
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Synopsis</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${overview}</p>
        </div>

        ${castHTML}

        <!-- Action buttons -->
        <div class="mt-6 flex flex-col sm:flex-row gap-3">
          ${trailer ? `
            <button onclick="MovieDetailManager.close(); TrailerManager.play(${d.id}, '${type}', '${title.replace(/'/g, "\\'")}');"
              class="flex-1 bg-brand-500 hover:bg-brand-600 text-white font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-md">
              <i class="ph-fill ph-play-circle text-xl"></i> Watch Trailer
            </button>` : `
            <button disabled class="flex-1 bg-gray-200 dark:bg-gray-700 text-gray-400 font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-not-allowed">
              <i class="ph-fill ph-video-camera-slash text-xl"></i> No Trailer Available
            </button>`}
          <button onclick="MovieDetailManager.close()"
            class="flex-1 sm:flex-none bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-white font-semibold py-3 px-6 rounded-xl transition">
            Close
          </button>
        </div>
      </div>
    `;
  },

  close() {
    this.modal.classList.add('opacity-0');
    document.getElementById('movieDetailBox').classList.add('scale-95');
    setTimeout(() => {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
      document.body.style.overflow = '';
    }, 300);
  }
};
