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

    const company = '(주)넥스트커머스';
    const samples = [
        { id: 'docs', title: '핀테크 웹 프론트엔드 개발자', status: 'progress', label: '추가 서류 요청', step: 2, action: '요청 확인하기', days: 7, dates: ['10.07', '10.09'], fresh: true, updated: 8 },
        { id: 'interview', title: '서비스 기획자', status: 'progress', label: '면접', step: 3, action: '면접 제안 확인', days: 2, dates: ['10.02', '10.05', '10.08'], fresh: true, updated: 7 },
        { id: 'review', title: '서비스 기획자', status: 'progress', label: '검토 대기중', step: 0, updated: 6 },
        { id: 'passed', title: '서비스 기획자', status: 'passed', label: '넘긴 공고', action: '공고 다시 보기', updated: 5 },
        { id: 'success', title: '프로덕트 디자이너', status: 'success', label: '매칭 성사', step: 4, action: '매칭 내용 보기', updated: 4 },
        { id: 'closed', title: '콘텐츠 마케터', status: 'closed', label: '전형 종료', action: '결과 확인하기', updated: 3 },
        { id: 'review2', title: '데이터 분석가', status: 'progress', label: '서류 검토 중', step: 1, updated: 2 },
        { id: 'closed2', title: '서비스 운영 매니저', status: 'closed', label: '공고 마감', action: '공고 다시 보기', updated: 1 }
    ].map(item => ({ company, ...item }));
    const items = samples;
    let filter = 'all', attentionOnly = false;
    const el = (tag, className, text) => { const node = document.createElement(tag); node.className = className; if (text) node.textContent = text; return node; };
    function openInfo(title, paragraphs) {
        $('dialog-title').textContent = title;
        $('dialog-content').replaceChildren(...paragraphs.map(t => el('p', '', t)));
        $('info-dialog').showModal();
    }
    function showItem(item) {
        if (item.id === 'docs') openInfo('추가 서류 요청', [item.title, `포트폴리오와 경력기술서를 준비해 주세요. 제출 마감은 D-${item.days}입니다.`, '제출용 시안의 예시 요청입니다. 실제 서류 제출은 연결되어 있지 않습니다.']);
        else if (item.id === 'interview') openInfo('면접 제안 확인', [item.title, `서류 검토를 통과해 면접 제안이 도착했습니다. 제안 확인 마감은 D-${item.days}입니다.`, '일정 조율과 기업 연락은 실제 서비스 연결 후 이용할 수 있습니다.']);
        else openInfo(item.label, [item.company, item.title, item.description || (item.status === 'success' ? '축하합니다! 기업과의 매칭이 성사된 예시입니다.' : item.status === 'closed' ? '이 공고의 채용 전형이 종료되었습니다.' : '서울 강남구 · 주 5일 · 경력 2년 이상'), item.reasons ? `넘긴 사유: ${item.reasons.join(', ')}` : '제출용 시안의 예시 공고입니다.']);
    }
    function render() {
        const visible = items.filter(item => (filter === 'all' || item.status === filter) && (!attentionOnly || item.fresh));
        visible.sort((a, b) => $('match-sort').value === 'deadline' ? (a.days ?? Infinity) - (b.days ?? Infinity) || b.updated - a.updated : b.updated - a.updated);
        $('match-count').textContent = `총 ${visible.length}건`;
        $('match-notice').setAttribute('aria-pressed', String(attentionOnly));
        $('match-list').replaceChildren(...visible.map(item => {
            const card = el('article', 'match-card');
            const top = el('div', 'match-card-top');
            const badges = el('div', 'match-badges');
            if (item.fresh) badges.append(el('span', 'match-badge match-new', 'NEW'));
            badges.append(el('span', `match-badge ${item.status === 'passed' || item.status === 'closed' ? 'match-neutral' : ''}`, item.label));
            top.append(badges);
            if (item.days) top.append(el('span', 'match-deadline', `마감 D-${item.days}`));
            card.append(top, el('p', 'match-company', item.company), el('h2', '', item.title));
            if (item.step !== undefined) {
                const steps = el('ol', 'match-steps');
                ['지원 완료', '서류 검토', '추가 서류', '면접'].forEach((label, i) => {
                    const done = i < item.step || i === 0, active = i === item.step && i > 0 && item.step < 4;
                    const step = el('li', `${done ? 'is-done' : ''} ${active ? 'is-current' : ''}`);
                    if (active) step.setAttribute('aria-current', 'step');
                    const dot = el('span', 'step-dot', done ? '✓' : ''); dot.setAttribute('aria-hidden', 'true');
                    step.append(dot, el('span', 'step-label', label));
                    const date = done ? (item.dates || ['10.08', '10.10', '10.12', '10.14'])[i] : '';
                    step.append(el('span', 'step-date', date)); steps.append(step);
                });
                card.append(steps);
            }
            if (item.action) {
                const button = el('button', `match-action ${item.id === 'docs' ? 'primary-button' : item.id === 'interview' ? 'match-action-accent' : 'secondary-button'}`, item.action);
                button.addEventListener('click', () => showItem(item)); card.append(button);
            }
            return card;
        }));
        if (!visible.length) $('match-list').append(el('p', 'match-empty', '해당하는 공고가 아직 없어요.'));
    }
    document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
        filter = button.dataset.filter; attentionOnly = false;
        document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
        render();
    }));
    $('match-sort').addEventListener('change', render);
    $('match-notice').addEventListener('click', () => {
        attentionOnly = !attentionOnly; filter = 'all';
        document.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.filter === 'all'))); render();
    });
    $('nav-explore').addEventListener('click', () => closeMenu().then(() => { location.href = '../index.html'; }));
    $('nav-matches').addEventListener('click', () => closeMenu().then(() => window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' })));
    $('nav-feedback').addEventListener('click', () => closeMenu().then(() => { location.href = 'feedback.html'; }));
    $('close-dialog').addEventListener('click', () => $('info-dialog').close());
    $('dialog-done').addEventListener('click', () => $('info-dialog').close());
    $('info-dialog').addEventListener('click', event => { if (event.target === $('info-dialog')) { const r = event.target.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) event.target.close(); } });
    render();
})();
