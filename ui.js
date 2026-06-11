const UI = {
  modals: {
    alert: {
      show(title, message, iconClass = 'ph-info', iconColorClass = 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400') {
        // Remove existing alert if any
        UI.modals.alert.close();

        const modal = document.createElement('div');
        modal.id = 'alertModal';
        modal.className = 'fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm px-4 animate-fade-in';
        modal.innerHTML = `
          <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 md:p-8 max-w-sm w-full text-center border border-gray-200 dark:border-gray-700 scale-100">
            <div class="mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 text-3xl ${iconColorClass}">
              <i class="ph-fill ${iconClass}"></i>
            </div>
            <h3 class="text-xl font-bold mb-2 text-gray-900 dark:text-white">${title}</h3>
            <p class="text-gray-600 dark:text-gray-300 mb-6 text-sm">${message}</p>
            <button onclick="UI.modals.alert.close()" class="w-full bg-brand-500 hover:bg-brand-600 text-white font-semibold py-3 px-6 rounded-xl transition duration-200 shadow-md">
              Understood
            </button>
          </div>
        `;
        document.body.appendChild(modal);
        document.body.style.overflow = 'hidden';

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
          if (e.target === modal) UI.modals.alert.close();
        });
      },
      close() {
        const modal = document.getElementById('alertModal');
        if (modal) {
          modal.remove();
          // Only restore scroll if no other modals are open
          if (!document.getElementById('trailerModal')?.classList.contains('flex') &&
              !document.getElementById('mpesaModal')?.classList.contains('flex') &&
              !document.getElementById('movieDetailModal')?.classList.contains('flex')) {
            document.body.style.overflow = '';
          }
        }
      }
    }
  },

  loader: {
    show(elementId) {
      const el = document.getElementById(elementId);
      if (el) el.classList.remove('hidden');
    },
    hide(elementId) {
      const el = document.getElementById(elementId);
      if (el) el.classList.add('hidden');
    }
  },

  generateStars(rating) {
    const normalized = Math.round((rating || 0) / 2);
    let html = '';
    for (let i = 1; i <= 5; i++) {
      html += i <= normalized
        ? '<i class="ph-fill ph-star text-yellow-400"></i>'
        : '<i class="ph ph-star text-gray-300 dark:text-gray-600"></i>';
    }
    return html;
  },

  ratingBadgeColor(rating) {
    if (rating >= 7.5) return 'bg-green-500';
    if (rating >= 6)   return 'bg-yellow-500';
    if (rating >= 4)   return 'bg-orange-500';
    return 'bg-red-500';
  },

  toggleMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.toggle('hidden');
  },

  closeMobileMenu() {
    const menu = document.getElementById('mobileMenu');
    if (menu) menu.classList.add('hidden');
  }
};
