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


    const reportId = Math.max(0, Math.min(2, Number(new URLSearchParams(location.search).get('report')) || 0));
    const periods = ['2026.09.28 ~ 2026.10.04', '2026.09.21 ~ 2026.09.27', '2026.09.14 ~ 2026.09.20'];
    const totals = [6, 5, 8], total = totals[reportId], passed = total - 4, percent = passed / total * 100;
    $('report-period').textContent = '집계기간 : ' + periods[reportId];
    $('chart-title').textContent = `총 지원 ${total}건 중 서류 통과 ${passed}건, 미통과 4건`;
    document.querySelector('.chart-legend strong').textContent = passed;
    const cards = [
        ['가온테크', '서비스 기획자 채용', '2026.10.02', '학력', '학사 이상 학력 조건 미충족'],
        ['라온스튜디오', 'UX/UI 디자이너 채용', '2026.09.29', '기타', '“제출한 포트폴리오에서 모바일 앱 디자인 작업을 확인하기 어려웠습니다.”'],
        ['나래커머스', '콘텐츠 마케터 채용', '2026.10.01', '경력', '관련 직무 경력 3년 이상 조건 미충족'],
        ['다온솔루션', '데이터 분석가 채용', '2026.09.30', '학력', '학사 이상 학력 조건 미충족']
    ];
    const make = (tag, cls, text) => { const e = document.createElement(tag); e.className = cls; e.textContent = text; return e; };
    cards.forEach(([company, title, date, category, reason]) => {
        const card = make('article', 'weekly-feedback-card', '');
        const d = new Date(date.replaceAll('.', '-') + 'T12:00:00Z'); d.setUTCDate(d.getUTCDate() - reportId * 7);
        const dateText = d.toISOString().slice(0, 10).replaceAll('-', '.');
        card.append(make('p', 'weekly-company', company), make('h3', '', title), make('p', 'weekly-caption', '결과 확정일 ' + dateText));
        const detail = make('div', 'weekly-reason', ''); detail.append(make('span', 'weekly-reason-label', category));
        if (category === '기타') detail.append(make('p', 'weekly-caption', '기업이 남긴 사유'));
        detail.append(make('p', '', reason)); card.append(detail); $('weekly-cards').append(card);
    });
    $('nav-explore').addEventListener('click', () => closeMenu().then(() => location.href = '../index.html'));
    $('nav-matches').addEventListener('click', () => closeMenu().then(() => location.href = 'matching.html'));
    $('nav-feedback').addEventListener('click', () => closeMenu().then(() => location.href = 'feedback.html'));
    const arc = document.querySelector('.donut-value');
    const chart = document.querySelector('.report-donut');
    let frame, start, observer;
    function finishChart() {
        cancelAnimationFrame(frame); arc.style.strokeDasharray = `${percent} ${100 - percent}`;
        chart.style.clipPath = 'none'; $('total-count').textContent = total;
    }
    function animateChart(now) {
        start ??= now; const progress = Math.min(1, (now - start) / 1100), eased = 1 - Math.pow(1 - progress, 3);
        // Reveal the complete two-segment ring clockwise with a polar clip sector.
        const points = ['80px 80px'];
        for (let angle = 0; angle <= eased * 360; angle += 4) {
            const r = (angle - 90) * Math.PI / 180; points.push(`${80 + 120 * Math.cos(r)}px ${80 + 120 * Math.sin(r)}px`);
        }
        const end = (eased * 360 - 90) * Math.PI / 180; points.push(`${80 + 120 * Math.cos(end)}px ${80 + 120 * Math.sin(end)}px`);
        chart.style.clipPath = `polygon(${points.join(',')})`;
        $('total-count').textContent = Math.round(total * eased);
        if (progress < 1) frame = requestAnimationFrame(animateChart); else finishChart();
    }
    finishChart();
    if (!reduced.matches) {
        chart.style.clipPath = 'polygon(50% 50%,50% 0,50% 0)'; $('total-count').textContent = '0';
        frame = requestAnimationFrame(animateChart);
        observer = new IntersectionObserver(entries => entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            entry.target.classList.remove('awaiting-reveal'); entry.target.classList.add('card-reveal'); observer.unobserve(entry.target);
        }), { threshold: 0.12 });
        document.querySelectorAll('.weekly-feedback-card').forEach(card => { card.classList.add('awaiting-reveal'); observer.observe(card); });
    }
    reduced.addEventListener('change', () => {
        if (!reduced.matches) return; finishChart(); observer?.disconnect();
        document.querySelectorAll('.awaiting-reveal').forEach(card => card.classList.remove('awaiting-reveal'));
    });
})();
