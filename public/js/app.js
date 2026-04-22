/* =====================================================
   Campus Swap & Drop — Main Client JS
   All inline scripts have been moved here so the
   Content-Security-Policy can drop 'unsafe-inline'.
   ===================================================== */

document.addEventListener('DOMContentLoaded', () => {

  // --------------------------------------------------
  // 1. Feed tab switching (index page)
  // --------------------------------------------------
  const haveBtn  = document.getElementById('have-btn');
  const needBtn  = document.getElementById('need-btn');
  const haveList = document.getElementById('have-list');
  const needList = document.getElementById('need-list');
  const havePagination = document.getElementById('have-pagination');
  const needPagination = document.getElementById('need-pagination');

  function switchTab(tab) {
    if (tab === 'have') {
      haveList && haveList.classList.remove('hidden');
      needList && needList.classList.add('hidden');
      havePagination && havePagination.classList.remove('hidden');
      needPagination && needPagination.classList.add('hidden');

      haveBtn && haveBtn.classList.add('border-cyan-500', 'text-cyan-400');
      haveBtn && haveBtn.classList.remove('border-transparent', 'text-slate-400');
      needBtn && needBtn.classList.remove('border-cyan-500', 'text-cyan-400');
      needBtn && needBtn.classList.add('border-transparent', 'text-slate-400');
    } else {
      haveList && haveList.classList.add('hidden');
      needList && needList.classList.remove('hidden');
      havePagination && havePagination.classList.add('hidden');
      needPagination && needPagination.classList.remove('hidden');

      needBtn && needBtn.classList.add('border-cyan-500', 'text-cyan-400');
      needBtn && needBtn.classList.remove('border-transparent', 'text-slate-400');
      haveBtn && haveBtn.classList.remove('border-cyan-500', 'text-cyan-400');
      haveBtn && haveBtn.classList.add('border-transparent', 'text-slate-400');
    }
  }

  haveBtn && haveBtn.addEventListener('click', () => switchTab('have'));
  needBtn && needBtn.addEventListener('click', () => switchTab('need'));

  // --------------------------------------------------
  // 2. Mobile navigation drawer
  // --------------------------------------------------
  const openMenuBtn  = document.getElementById('open-menu');
  const closeMenuBtn = document.getElementById('close-menu');
  const mobileMenu   = document.getElementById('mobile-menu');
  const menuOverlay  = document.getElementById('menu-overlay');

  function openMenu() {
    if (mobileMenu) {
      mobileMenu.classList.remove('drawer-closed');
      mobileMenu.classList.add('drawer-open');
    }
    if (menuOverlay) {
      menuOverlay.classList.remove('overlay-hidden');
      menuOverlay.classList.add('overlay-visible');
    }
    document.body.style.overflow = 'hidden';
  }

  function closeMenu() {
    if (mobileMenu) {
      mobileMenu.classList.add('drawer-closed');
      mobileMenu.classList.remove('drawer-open');
    }
    if (menuOverlay) {
      menuOverlay.classList.add('overlay-hidden');
      menuOverlay.classList.remove('overlay-visible');
    }
    document.body.style.overflow = '';
  }

  openMenuBtn  && openMenuBtn.addEventListener('click', openMenu);
  closeMenuBtn && closeMenuBtn.addEventListener('click', closeMenu);
  menuOverlay  && menuOverlay.addEventListener('click', closeMenu);

  // Close drawer on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  // --------------------------------------------------
  // 3. Transaction page: auto-scroll comment list
  // --------------------------------------------------
  const commentList = document.getElementById('comment-list');
  if (commentList) {
    commentList.scrollTop = commentList.scrollHeight;
  }

  // --------------------------------------------------
  // 4. Flash message auto-dismiss
  // --------------------------------------------------
  const flashBanner = document.querySelector('[data-flash]');
  if (flashBanner) {
    setTimeout(() => {
      flashBanner.style.transition = 'opacity 0.5s ease';
      flashBanner.style.opacity = '0';
      setTimeout(() => flashBanner.remove(), 500);
    }, 4000);
  }

  // --------------------------------------------------
  // 5. Password visibility toggles
  // --------------------------------------------------
  document.querySelectorAll('[data-password-toggle]').forEach((toggleButton) => {
    const targetId = toggleButton.getAttribute('data-password-toggle');
    const passwordInput = document.getElementById(targetId);

    if (!passwordInput) return;

    toggleButton.addEventListener('click', () => {
      const isHidden = passwordInput.type === 'password';
      passwordInput.type = isHidden ? 'text' : 'password';
      toggleButton.setAttribute('aria-label', isHidden ? 'Hide password' : 'Show password');
      toggleButton.setAttribute('aria-pressed', String(isHidden));

      const showIcon = toggleButton.querySelector('[data-icon="show"]');
      const hideIcon = toggleButton.querySelector('[data-icon="hide"]');

      showIcon && showIcon.classList.toggle('hidden', !isHidden);
      hideIcon && hideIcon.classList.toggle('hidden', isHidden);
    });
  });

  // --------------------------------------------------
  // 6. CSP-safe confirm-on-submit forms
  // --------------------------------------------------
  document.querySelectorAll('form[data-confirm-submit]').forEach((form) => {
    form.addEventListener('submit', (event) => {
      const message = form.getAttribute('data-confirm-submit') || 'Are you sure?';
      if (!window.confirm(message)) {
        event.preventDefault();
      }
    });
  });

});
