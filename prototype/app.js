(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const jobs = window.DEMO_JOBS;
  const session = window.JobExplorer.createSession(jobs.length);
  const selected = new Set();
  let busy = false, exiting = false, drag = null, toastTimer, nextTimer, hintTimer, suppressClickUntil = 0;
  const motion = $('card-motion'), card = $('card'), handle = $('handle');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const duration = () => reduced.matches ? 0 : 360;
  const text = (id, value) => { $(id).textContent = value; };

  function cancelHandleHint() {
    clearTimeout(hintTimer);
    handle.classList.remove('handle-hint');
  }
  function scheduleHandleHint() {
    cancelHandleHint();
    if (reduced.matches) return;
    const index = session.snapshot().index;
    hintTimer = setTimeout(() => {
      const current = session.snapshot();
      if (busy || drag || reduced.matches || document.hidden || $('info-dialog').open || current.face !== 'front' || current.index !== index) return;
      handle.classList.add('handle-hint');
    }, 3000);
  }
  motion.addEventListener('pointerdown', cancelHandleHint, { capture: true });
  motion.addEventListener('keydown', cancelHandleHint, { capture: true });
  handle.addEventListener('animationend', event => {
    if (event.animationName === 'handle-nudge') cancelHandleHint();
  });
  reduced.addEventListener('change', cancelHandleHint);
  document.addEventListener('visibilitychange', () => { if (document.hidden) cancelHandleHint(); });

  function toast(message) {
    clearTimeout(toastTimer); text('toast', message); $('toast').classList.add('visible');
    toastTimer = setTimeout(() => $('toast').classList.remove('visible'), 3000);
  }
  function resetFeedback() {
    selected.clear(); $('other-detail').value = '';
    document.querySelectorAll('.reason').forEach(b => b.setAttribute('aria-pressed', 'false'));
    updateSelection();
  }
  function updateSelection() {
    const other = selected.has('기타');
    $('other-field').hidden = !other;
    $('other-detail').required = other;
    const valid = selected.size > 0 && (!other || $('other-detail').value.trim().length > 0);
    $('confirm-reject').disabled = !valid || busy;
    text('selection-hint', !selected.size ? '사유를 1개 이상 선택해 주세요.' : !valid ? '기타 사유를 짧게 입력해 주세요.' : `${selected.size}개 선택했어요. 완료하면 다음 공고로 넘어가요.`);
  }
  function setFace(face, focus = false) {
    const back = face === 'back', applied = face === 'applied', front = face === 'front';
    card.dataset.face = face;
    // Move focus out before hiding the currently focused face from assistive technology.
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    $('card-front').inert = !front;
    $('card-front').setAttribute('aria-hidden', String(!front));
    $('card-back').inert = !back;
    $('card-back').hidden = applied;
    $('card-back').setAttribute('aria-hidden', String(!back));
    $('card-success').hidden = !applied;
    $('card-success').inert = !applied;
    $('card-success').setAttribute('aria-hidden', String(!applied));
    handle.inert = !front;
    handle.classList.toggle('feedback-open', !front);
    text('gesture-hint', applied ? '마음에 드는 일에 플러팅을 보냈어요.' : back ? '사유를 선택한 뒤 완료해 주세요. 공고는 아직 넘어가지 않았어요.' : '');
    if (front) {
      const hint = document.createElement('span');
      hint.textContent = '버튼을 눌러도 같은 동작을 할 수 있어요'; $('gesture-hint').append(hint);
    }
    if (focus) (applied ? $('applied-title') : back ? $('feedback-title') : $('push-button')).focus({ preventScroll: true });
  }
  function updateCounts() {
    const s = session.snapshot();
    text('remaining', `남은 공고 ${s.remaining}개`);
    const applied = s.decisions.filter(d => d.type === 'applied').length;
    text('applied-count', applied); $('applied-count').hidden = applied === 0;
    return applied;
  }
  function render() {
    cancelHandleHint();
    const s = session.snapshot(), done = s.face === 'done';
    const applied = updateCounts();
    $('explorer').hidden = done; $('complete').hidden = !done;
    document.querySelector('.stack-one').hidden = s.remaining < 2;
    document.querySelector('.stack-two').hidden = s.remaining < 3;
    if (done) {
      $('completion-summary').replaceChildren(...[['지원', applied], ['피드백', s.decisions.length - applied]].map(([label, n]) => {
        const div = document.createElement('div'), strong = document.createElement('strong');
        strong.textContent = `${n}개`; div.append(strong, label); return div;
      }));
      $('complete').focus({ preventScroll: true }); return;
    }
    const job = jobs[s.index];
    for (const [id, key] of Object.entries({ 'company-name': 'company', 'company-industry': 'industry', 'job-title': 'title', salary: 'salary', location: 'location', hours: 'hours', career: 'career', deadline: 'deadline' })) text(id, job[key]);
    $('tags').replaceChildren(...job.tags.map(tag => { const el = document.createElement('span'); el.className = 'tag'; el.textContent = '#' + tag; return el; }));
    resetFeedback(); setFace('front'); scheduleHandleHint();
  }
  function openFeedback() {
    if (busy || !session.openFeedback()) return;
    cancelHandleHint();
    resetFeedback(); setFace('back', true);
  }
  function cancelFeedback() {
    if (busy || !session.cancelFeedback()) return;
    setFace('front', true);
    // Keep the visible back intact until the flip finishes, then clear its values.
    setTimeout(() => { if (session.snapshot().face === 'front') resetFeedback(); }, reduced.matches ? 0 : 600);
  }
  function advance(type) {
    if (busy) return;
    const s = session.snapshot();
    const ok = type === 'applied' ? session.apply(s.index) : session.reject(s.index, [...selected], $('other-detail').value);
    if (!ok) return;
    cancelHandleHint();
    busy = true; updateSelection(); updateCounts();
    if (type === 'applied') {
      // Show the confirmation on a real back face before retiring the card.
      clearTimeout(toastTimer); $('toast').classList.remove('visible');
      resetFeedback(); setFace('applied', true);
      text('next-job', session.snapshot().face === 'done' ? '탐색 결과 보기' : '다음 공고 보기');
      nextTimer = setTimeout(nextJob, reduced.matches ? 1600 : 2200);
    } else {
      toast('피드백을 남겼습니다'); nextJob();
    }
  }
  function nextJob() {
    if (!busy || exiting) return;
    exiting = true; clearTimeout(nextTimer); motion.inert = true;
    motion.classList.add('leaving-up');
    setTimeout(() => {
      // Reset the back while invisible so the new job never animates through stale feedback.
      card.style.transition = 'none'; render();
      motion.classList.remove('leaving-down', 'leaving-up'); motion.classList.add('entering');
      void card.offsetWidth; card.style.transition = '';
      busy = false; exiting = false; motion.inert = false; updateSelection();
      if (session.snapshot().face !== 'done') $('push-button').focus({ preventScroll: true });
      setTimeout(() => motion.classList.remove('entering'), 360);
    }, duration());
  }
  $('next-job').addEventListener('click', nextJob);
  $('push-button').addEventListener('click', () => { if (performance.now() > suppressClickUntil) openFeedback(); });
  $('pull-button').addEventListener('click', () => { if (performance.now() > suppressClickUntil) advance('applied'); });
  $('grip').addEventListener('keydown', e => {
    if (e.key === 'ArrowUp') { e.preventDefault(); openFeedback(); }
    if (e.key === 'ArrowDown') { e.preventDefault(); advance('applied'); }
  });
  $('grip').addEventListener('click', () => { if (performance.now() > suppressClickUntil) toast('위로 밀면 거절 사유, 아래로 당기면 지원'); });
  $('cancel-feedback').addEventListener('click', cancelFeedback);
  $('feedback-form').addEventListener('submit', e => { e.preventDefault(); advance('rejected'); });
  document.querySelectorAll('.reason').forEach(button => button.addEventListener('click', () => {
    if (busy) return;
    const reason = button.dataset.reason;
    if (selected.has(reason)) selected.delete(reason); else selected.add(reason);
    button.setAttribute('aria-pressed', String(selected.has(reason))); updateSelection();
    if (reason === '기타' && selected.has(reason)) $('other-detail').focus({ preventScroll: true });
  }));
  $('other-detail').addEventListener('input', updateSelection);

  function clearDrag() {
    drag = null; motion.style.removeProperty('--drag-y'); motion.classList.remove('dragging');
    $('gesture-indicator').classList.remove('visible', 'apply');
  }
  function startDrag(e) {
    if (busy || drag || session.snapshot().face !== 'front' || !e.isPrimary || e.button !== 0) return;
    if (e.target.closest('button') && e.target.closest('button') !== $('grip')) return;
    drag = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, dy: 0, target: e.currentTarget };
    e.currentTarget.setPointerCapture(e.pointerId);
  }
  function moveDrag(e) {
    if (!drag || drag.id !== e.pointerId) return;
    drag.dx = e.clientX - drag.x; drag.dy = e.clientY - drag.y;
    if (Math.abs(drag.dy) < 6 || Math.abs(drag.dx) > Math.abs(drag.dy)) return;
    motion.classList.add('dragging');
    motion.style.setProperty('--drag-y', `${Math.max(-55, Math.min(85, drag.dy * .55))}px`);
    const ready = Math.abs(drag.dy) >= 64;
    $('gesture-indicator').classList.toggle('visible', Math.abs(drag.dy) > 24);
    $('gesture-indicator').classList.toggle('apply', drag.dy > 0);
    text('gesture-indicator', drag.dy > 0 ? (ready ? '놓으면 지원해요 ↓' : '아래로 조금 더 당겨요') : (ready ? '놓으면 사유를 선택해요 ↑' : '위로 조금 더 밀어요'));
  }
  function endDrag(e, cancelled = false) {
    if (!drag || drag.id !== e.pointerId) return;
    const { dy, dx, target, id } = drag;
    const moved = Math.abs(dy) > 6 || Math.abs(dx) > 6;
    clearDrag();
    if (target.hasPointerCapture(id)) target.releasePointerCapture(id);
    if (moved) suppressClickUntil = performance.now() + 450;
    if (cancelled || Math.abs(dy) < 64 || Math.abs(dx) > Math.abs(dy)) return;
    if (dy > 0) advance('applied'); else openFeedback();
  }
  [$('card-front'), $('grip')].forEach(el => {
    el.addEventListener('pointerdown', startDrag);
    el.addEventListener('pointermove', moveDrag);
    el.addEventListener('pointerup', e => endDrag(e));
    el.addEventListener('pointercancel', e => endDrag(e, true));
    el.addEventListener('lostpointercapture', e => endDrag(e, true));
  });
  addEventListener('blur', clearDrag);

  function openDialog(title, nodes) {
    if (busy) return;
    cancelHandleHint();
    text('dialog-title', title); $('dialog-content').replaceChildren(...nodes); $('info-dialog').showModal();
  }
  function paragraph(value, className = '') { const p = document.createElement('p'); p.textContent = value; p.className = className; return p; }
  function help() {
    openDialog('작은 움직임으로, 새로운 시작', [paragraph('↓ 아래로 당기면 아래에서 위로 뒤집힌 뒷면에 “플러팅을 날렸습니다”가 나타나요. 잠시 후 다음 공고로 이동해요.'), paragraph('↑ 위로 밀면 위에서 아래로 카드가 뒤집혀요. 뒷면에서 거절 사유를 클릭하고 완료하면 다음 공고로 넘어가요.'), paragraph('손잡이 위·아래 버튼으로도 조작할 수 있어요. 키보드는 Tab으로 이동하고 Enter로 선택하세요. 손잡이에서는 ↑ / ↓ 키도 사용할 수 있어요.'), paragraph('이 시안의 공고는 가상 데이터입니다. 실제 지원은 전송되지 않으며 새로고침하면 체험 기록이 초기화됩니다.', 'dialog-note')]);
  }
  $('help-button').addEventListener('click', help); $('back-button').addEventListener('click', help);
  $('close-dialog').addEventListener('click', () => $('info-dialog').close());
  $('dialog-done').addEventListener('click', () => $('info-dialog').close());
  $('info-dialog').addEventListener('click', e => { if (e.target === $('info-dialog')) { const r = e.target.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) e.target.close(); } });
  $('detail-button').addEventListener('click', () => {
    const job = jobs[session.snapshot().index]; if (!job) return;
    const heading = document.createElement('h3'); heading.textContent = job.title;
    openDialog('공고 상세보기', [paragraph(job.company + ' · ' + job.industry), heading, paragraph(job.description), paragraph(`${job.salary} / ${job.location}`), paragraph(`${job.hours} / ${job.career}`), paragraph('체험을 위한 가상 공고입니다.', 'dialog-note')]);
  });
  function showHistory(type) {
    const decisions = session.snapshot().decisions.filter(d => d.type === type);
    const nodes = decisions.map(d => {
      const el = document.createElement('div'); el.className = 'dialog-list';
      const title = document.createElement('strong'); title.textContent = jobs[d.index].title;
      const desc = document.createElement('span'); desc.textContent = type === 'applied' ? `${jobs[d.index].company} · 플러팅을 보냈어요` : `${d.reasons.join(', ')}${d.detail ? ' · ' + d.detail : ''}`;
      el.append(title, desc); return el;
    });
    if (!nodes.length) nodes.push(paragraph(type === 'applied' ? '아직 지원한 공고가 없어요. 마음에 드는 공고를 아래로 당겨 보세요.' : '아직 남긴 피드백이 없어요. 공고를 위로 밀면 사유를 선택할 수 있어요.'));
    nodes.push(paragraph('현재 체험에서 남긴 기록입니다. 실제 기업 매칭 및 추천 반영은 연결되어 있지 않습니다.', 'dialog-note'));
    openDialog(type === 'applied' ? '나의 매칭 · 지원 기록' : '내가 남긴 피드백', nodes);
  }
  $('nav-matches').addEventListener('click', () => showHistory('applied'));
  $('nav-feedback').addEventListener('click', () => showHistory('rejected'));
  $('nav-explore').addEventListener('click', () => { if ($('info-dialog').open) $('info-dialog').close(); if (!busy && session.snapshot().face === 'back') cancelFeedback(); window.scrollTo({ top: 0, behavior: reduced.matches ? 'instant' : 'smooth' }); });
  $('restart').addEventListener('click', () => { if (busy) return; session.restart(); render(); $('toast').classList.remove('visible'); $('push-button').focus({ preventScroll: true }); });
  render();
})();
