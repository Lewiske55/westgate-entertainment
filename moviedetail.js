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

      // Cross-type recommendations: e.g. for a movie, pull TV series sharing its
      // top genres (and vice versa), so the modal recommends both movies & TV series.
      const crossType = type === 'movie' ? 'tv' : 'movie';
      const genreIds = (details.genres || []).slice(0, 2).map(g => g.id).join(',');
      let crossRecs = [];
      if (genreIds) {
        const crossData = crossType === 'tv'
          ? await APIService.getTVByGenre(genreIds, 1)
          : await APIService.getMoviesByGenre(genreIds, 1);
        crossRecs = (crossData.results || []).map(r => ({ ...r, media_type: crossType }));
      }

      this.render(details, type, crossRecs);
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

  render(d, type, crossRecs = []) {
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

    // TV-only: seasons / episodes count + status (Returning Series, Ended, etc.)
    const isTV = type === 'tv';
    const seasonCount   = d.number_of_seasons;
    const episodeCount  = d.number_of_episodes;
    const seasonsEpisodesLabel = isTV && (seasonCount || episodeCount)
      ? [
          seasonCount  ? `${seasonCount} Season${seasonCount === 1 ? '' : 's'}` : null,
          episodeCount ? `${episodeCount} Episode${episodeCount === 1 ? '' : 's'}` : null
        ].filter(Boolean).join(' • ')
      : '';
    const showStatus = isTV && d.status ? d.status : '';

    // Per-season breakdown (skip "Specials" season 0 unless it's the only one)
    const seasonsList = (isTV && Array.isArray(d.seasons))
      ? d.seasons.filter(s => s.season_number !== 0 || d.seasons.length === 1)
      : [];

    // Cast — top 8
    const cast = (d.credits?.cast || []).slice(0, 8);

    // Recommendations — mix of same-type "similar" titles (TMDB similar endpoint) and
    // cross-type titles sharing genres, so movies recommend TV series and vice versa.
    const sameTypeRecs = (d.similar?.results || [])
      .filter(r => r.poster_path)
      .map(r => ({ ...r, media_type: type }))
      .slice(0, 8);
    const crossTypeRecs = crossRecs
      .filter(r => r.poster_path && r.id !== d.id)
      .slice(0, 6);
    const recs = [...sameTypeRecs, ...crossTypeRecs];

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

    const seasonsHTML = seasonsList.length
      ? `<div class="mt-5">
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">Seasons</h4>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            ${seasonsList.map(s => {
              const poster = s.poster_path
                ? `${CONFIG.TMDB.IMAGE_URL}${s.poster_path}`
                : CONFIG.TMDB.PLACEHOLDER_IMAGE;
              const epCount = typeof s.episode_count === 'number' ? `${s.episode_count} ep${s.episode_count === 1 ? '' : 's'}` : '';
              return `
                <div class="flex-shrink-0 w-24 text-center">
                  <img src="${poster}" alt="${s.name}" onerror="this.src='${CONFIG.TMDB.PLACEHOLDER_IMAGE}'"
                    class="w-24 h-36 object-cover rounded-lg mb-1 border border-gray-200 dark:border-gray-700">
                  <p class="text-xs font-semibold text-gray-800 dark:text-white leading-tight line-clamp-1">${s.name}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">${epCount}</p>
                </div>`;
            }).join('')}
          </div>
        </div>`
      : '';

    const recsHTML = recs.length
      ? `<div class="mt-5">
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">You Might Also Like</h4>
          <div class="flex gap-3 overflow-x-auto pb-2 scrollbar-thin">
            ${recs.map(r => {
              const rType   = r.media_type || type;
              const rTitle  = r.title || r.name || 'Unknown';
              const rPoster = r.poster_path ? `${CONFIG.TMDB.IMAGE_URL}${r.poster_path}` : CONFIG.TMDB.PLACEHOLDER_IMAGE;
              const rYear   = (r.release_date || r.first_air_date || '').substring(0, 4);
              const rRating = r.vote_average ? r.vote_average.toFixed(1) : null;
              const rBadge  = rType === 'tv'
                ? '<span class="text-[9px] font-bold bg-blue-600 text-white px-1 py-0.5 rounded">TV</span>'
                : '<span class="text-[9px] font-bold bg-gray-700 text-white px-1 py-0.5 rounded">Film</span>';
              return `
                <button onclick="MovieDetailManager.open(${r.id}, '${rType}')"
                  class="flex-shrink-0 w-28 text-left group">
                  <div class="relative">
                    <img src="${rPoster}" alt="${rTitle}" onerror="this.src='${CONFIG.TMDB.PLACEHOLDER_IMAGE}'"
                      class="w-28 h-40 object-cover rounded-lg mb-1 border border-gray-200 dark:border-gray-700 group-hover:border-brand-500 transition">
                    <div class="absolute top-1 left-1">${rBadge}</div>
                    ${rRating ? `
                      <span class="absolute top-1 right-1 inline-flex items-center gap-0.5 ${UI.ratingBadgeColor(r.vote_average)} text-white text-[10px] font-bold px-1.5 py-0.5 rounded-md">
                        <i class="ph-fill ph-star text-[9px]"></i>${rRating}
                      </span>` : ''}
                  </div>
                  <p class="text-xs font-semibold text-gray-800 dark:text-white leading-tight line-clamp-2 group-hover:text-brand-500 transition">${rTitle}</p>
                  ${rYear ? `<p class="text-xs text-gray-500 dark:text-gray-400 leading-tight">${rYear}</p>` : ''}
                </button>`;
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
              ${seasonsEpisodesLabel ? `
                <span class="text-gray-300 dark:text-gray-600">•</span>
                <span class="inline-flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                  <i class="ph-fill ph-television-simple text-xs"></i> ${seasonsEpisodesLabel}
                </span>` : ''}
              <span class="inline-flex items-center gap-1 ${UI.ratingBadgeColor(d.vote_average)} text-white text-xs font-bold px-2 py-0.5 rounded-md">
                <i class="ph-fill ph-star text-xs"></i> ${rating}
              </span>
              ${showStatus ? `<span class="text-[10px] font-bold uppercase tracking-wide bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md">${showStatus}</span>` : ''}
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">${genres}</p>
          </div>
        </div>

        <!-- Overview -->
        <div class="mt-5">
          <h4 class="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-2">Synopsis</h4>
          <p class="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">${overview}</p>
        </div>

        ${seasonsHTML}
        ${castHTML}
        ${recsHTML}

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
