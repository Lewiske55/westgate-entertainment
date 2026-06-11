const TrailerManager = {
  currentIframe: null,
  modal: null,

  init() {
    this.modal = document.createElement('div');
    this.modal.id = 'trailerModal';
    this.modal.className = 'fixed inset-0 z-[100] hidden items-center justify-center bg-black/95 backdrop-blur-sm px-4 opacity-0 transition-opacity duration-300';
    this.modal.innerHTML = `
      <div id="trailerModalContent" class="relative w-full max-w-5xl mx-auto bg-black rounded-xl overflow-hidden shadow-2xl scale-95 transition-transform duration-300 border border-gray-800">
        <div class="flex items-center justify-between px-4 py-3 bg-gray-900 border-b border-gray-800">
          <span id="trailerTitle" class="text-white font-semibold text-sm truncate pr-4"></span>
          <button onclick="TrailerManager.close()" class="flex-shrink-0 bg-gray-800 hover:bg-red-600 text-white rounded-full w-9 h-9 flex items-center justify-center transition-colors">
            <i class="ph-bold ph-x text-lg"></i>
          </button>
        </div>
        <div id="trailerContainer" class="relative pb-[56.25%] h-0 w-full bg-black"></div>
        <div class="px-4 py-3 bg-gray-900 flex items-center gap-3">
          <i class="ph-fill ph-youtube-logo text-red-500 text-xl"></i>
          <span class="text-gray-400 text-xs">Powered by YouTube — ensure pop-ups are allowed if the video doesn't load.</span>
        </div>
      </div>
    `;
    document.body.appendChild(this.modal);

    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) this.close();
    });

    // ESC key closes modal
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !this.modal.classList.contains('hidden')) {
        this.close();
      }
    });
  },

  openLoading(title = '') {
    document.getElementById('trailerTitle').textContent = title ? `Trailer: ${title}` : 'Loading trailer…';
    const container = document.getElementById('trailerContainer');
    container.innerHTML = `
      <div class="absolute inset-0 flex flex-col items-center justify-center bg-black gap-4">
        <div class="loader"></div>
        <p class="text-gray-400 text-sm">Fetching trailer…</p>
      </div>`;

    this.modal.classList.remove('hidden');
    this.modal.classList.add('flex');
    void this.modal.offsetWidth;
    this.modal.classList.remove('opacity-0');
    document.getElementById('trailerModalContent').classList.remove('scale-95');
    document.body.style.overflow = 'hidden';
  },

  loadVideo(videoKey, title = '') {
    const container = document.getElementById('trailerContainer');
    container.innerHTML = '';
    if (title) document.getElementById('trailerTitle').textContent = `Trailer: ${title}`;

    const iframe = document.createElement('iframe');
    iframe.className = 'absolute top-0 left-0 w-full h-full';
    // autoplay=1, mute=0 for sound, rel=0 no suggestions, modestbranding=1
    iframe.src = `https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`;
    iframe.title = 'YouTube video player';
    iframe.setAttribute('frameborder', '0');
    iframe.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
    iframe.setAttribute('allow', 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share');
    iframe.setAttribute('allowfullscreen', 'true');

    this.currentIframe = iframe;
    container.appendChild(iframe);
  },

  async play(id, type, title = '') {
    this.openLoading(title);

    try {
      const video = await APIService.findTrailer(id, type);

      if (video && video.key) {
        this.loadVideo(video.key, title);
      } else {
        this.close();
        UI.modals.alert.show(
          'No Trailer Found',
          'Sorry, we couldn\'t find a trailer for this title on YouTube.',
          'ph-video-camera-slash',
          'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30 dark:text-yellow-400'
        );
      }
    } catch (err) {
      console.error('Trailer error:', err);
      this.close();
      UI.modals.alert.show(
        'Error',
        'Failed to load trailer. Please try again.',
        'ph-warning-circle',
        'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400'
      );
    }
  },

  close() {
    if (this.currentIframe) {
      this.currentIframe.src = '';
      this.currentIframe = null;
    }
    document.getElementById('trailerContainer').innerHTML = '';
    this.modal.classList.add('opacity-0');
    document.getElementById('trailerModalContent').classList.add('scale-95');

    setTimeout(() => {
      this.modal.classList.add('hidden');
      this.modal.classList.remove('flex');
      document.body.style.overflow = '';
    }, 300);
  }
};
