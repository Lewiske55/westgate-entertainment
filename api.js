const APIService = {
  async fetchRaw(endpoint) {
    try {
      const url = `${CONFIG.TMDB.BASE_URL}${endpoint}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      return null;
    }
  },

  async fetch(endpoint) {
    const data = await this.fetchRaw(endpoint);
    if (!data) return null;
    return data.results !== undefined ? data.results : data;
  },

  async getPopularMovies(page = 1) {
    const data = await this.fetchRaw(`/movie/popular?api_key=${CONFIG.TMDB.API_KEY}&page=${page}`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 100) };
  },

  async getPopularTV(page = 1) {
    const data = await this.fetchRaw(`/tv/popular?api_key=${CONFIG.TMDB.API_KEY}&page=${page}`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 100) };
  },

  async getMoviesByGenre(genreId, page = 1) {
    const data = await this.fetchRaw(`/discover/movie?api_key=${CONFIG.TMDB.API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 100) };
  },

  async getTVByGenre(genreId, page = 1) {
    const data = await this.fetchRaw(`/discover/tv?api_key=${CONFIG.TMDB.API_KEY}&with_genres=${genreId}&page=${page}&sort_by=popularity.desc`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 100) };
  },

  async getMovieGenres() {
    const data = await this.fetch(`/genre/movie/list?api_key=${CONFIG.TMDB.API_KEY}`);
    return data?.genres || data || [];
  },

  async getTVGenres() {
    const data = await this.fetch(`/genre/tv/list?api_key=${CONFIG.TMDB.API_KEY}`);
    return data?.genres || data || [];
  },

  async getTrending(timeWindow = 'day', page = 1) {
    // timeWindow: 'day' or 'week'
    const data = await this.fetchRaw(`/trending/all/${timeWindow}?api_key=${CONFIG.TMDB.API_KEY}&page=${page}`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 500) };
  },

  async getNowPlaying(page = 1) {
    const data = await this.fetchRaw(`/movie/now_playing?api_key=${CONFIG.TMDB.API_KEY}&page=${page}&region=KE`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 500) };
  },

  async getUpcoming(page = 1) {
    const data = await this.fetchRaw(`/movie/upcoming?api_key=${CONFIG.TMDB.API_KEY}&page=${page}&region=KE`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 500) };
  },

  async search(query, page = 1) {
    const data = await this.fetchRaw(`/search/multi?api_key=${CONFIG.TMDB.API_KEY}&query=${encodeURIComponent(query)}&page=${page}`);
    return { results: data?.results || [], totalPages: Math.min(data?.total_pages || 1, 500) };
  },

  async getMovieDetails(id, type) {
    const data = await this.fetchRaw(
      `/${type}/${id}?api_key=${CONFIG.TMDB.API_KEY}&append_to_response=credits,videos,similar`
    );
    return data;
  },

  async findTrailer(id, type) {
    const data = await this.fetch(`/${type}/${id}/videos?api_key=${CONFIG.TMDB.API_KEY}`);
    const videos = data || [];
    if (!videos.length) return null;

    return (
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer' && v.official === true) ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Trailer') ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Teaser') ||
      videos.find(v => v.site === 'YouTube' && v.type === 'Clip') ||
      videos.find(v => v.site === 'YouTube')
    );
  }
};
