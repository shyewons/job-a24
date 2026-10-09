(() => {
    'use strict';
    const $ = id => document.getElementById(id);
    const header = document.querySelector('.header');
    const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  let previousScroll = window.scrollY, scrollDistance = 0, scrollFrame = 0;
  function showHeader() {
    header.classList.remove('header-hidden');
    previousScroll = window.scrollY; scrollDistance = 0;
  }
  addEventListener('scroll', () => {
    if (scrollFrame) return;
    scrollFrame = requestAnimationFrame(() => {
      scrollFrame = 0;
      const y = Math.max(0, Math.min(window.scrollY, document.documentElement.scrollHeight - innerHeight));
      const delta = y - previousScroll;
      previousScroll = y;
      if (y <= 8) { showHeader(); return; }
      if (!delta) return;
      scrollDistance = Math.sign(delta) === Math.sign(scrollDistance) ? scrollDistance + delta : delta;
      if (scrollDistance <= -4) header.classList.remove('header-hidden');
      else if (scrollDistance >= 8 && y > header.offsetHeight) header.classList.add('header-hidden');
    });
  }, { passive: true });
  header.addEventListener('focusin', showHeader);

  const menu = $('menu-dialog'), panel = menu.querySelector('.side-panel');
  let menuClosing = null, previousOverflow = '';
  function closeMenu() {
    if (!menu.open) return Promise.resolve();
    if (menuClosing) return menuClosing;
    const animation = reduced.matches ? null : panel.animate(
      [{ transform: getComputedStyle(panel).transform }, { transform: 'translateX(100%)' }],
      { duration: 180, easing: 'ease-in', fill: 'forwards' }
    );
    menuClosing = (animation ? animation.finished.catch(() => {}) : Promise.resolve()).then(() => {
      menu.close(); animation?.cancel(); menuClosing = null;
    });
    return menuClosing;
  }
  $('menu-button').addEventListener('click', () => {
    if (menu.open) return;
    showHeader();
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    $('menu-button').setAttribute('aria-expanded', 'true');
    menu.showModal();
  });
  $('close-menu').addEventListener('click', closeMenu);
  menu.addEventListener('click', event => { if (event.target === menu) closeMenu(); });
  menu.addEventListener('cancel', event => { event.preventDefault(); closeMenu(); });
  menu.addEventListener('close', () => {
    document.documentElement.style.overflow = previousOverflow;
    $('menu-button').setAttribute('aria-expanded', 'false');
  });



  const key = 'job-a24-feedback';
  let state = { coupons: 2, unlocked: [2] }, toastTimer;
  try { const saved = JSON.parse(sessionStorage.getItem(key)); if (saved && Number.isInteger(saved.coupons) && saved.coupons >= 0 && Array.isArray(saved.unlocked)) state = saved; } catch (_) {}
  function notify(message) {
    $('toast').textContent = message; $('toast').classList.add('visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 2400);
  }
  function renderReports() {
    $('coupon-count').textContent = state.coupons + '장';
    document.querySelectorAll('.report-action').forEach(button => {
      const card = button.closest('.report-card'), id = Number(card.dataset.report), unlocked = state.unlocked.includes(id);
      button.dataset.unlocked = String(unlocked); button.disabled = !unlocked && state.coupons === 0;
      button.textContent = unlocked ? '다시 보기 →' : state.coupons ? '쿠폰 1장으로 열람하기' : '쿠폰이 필요해요';
      button.classList.toggle('primary-button', !unlocked); button.classList.toggle('is-unlocked', unlocked);
      button.setAttribute('aria-label', card.querySelector('h3').textContent + ' ' + button.textContent);
      card.querySelector('.report-read').textContent = unlocked ? '열람 완료' : '미열람';
      card.querySelector('.report-read').classList.toggle('is-unread', !unlocked);
    });
  }
  $('coupon-help').addEventListener('click', () => $('coupon-dialog').showModal());
  ['close-help', 'help-done'].forEach(id => $(id).addEventListener('click', () => $('coupon-dialog').close()));
  $('nav-explore').addEventListener('click', () => closeMenu().then(() => location.href = '../index.html'));
  $('nav-matches').addEventListener('click', () => closeMenu().then(() => location.href = 'matching.html'));
  $('nav-feedback').addEventListener('click', closeMenu);
  document.querySelectorAll('.report-action').forEach(button => button.addEventListener('click', () => {
    const id = Number(button.closest('.report-card').dataset.report);
    if (!state.unlocked.includes(id)) {
      if (!state.coupons) { notify('쿠폰이 필요해요.'); return; }
      state.coupons--; state.unlocked.push(id);
    }
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch (_) {}
    renderReports(); location.href = `feedback-report.html?report=${id}`;
  }));
  renderReports();
})();
