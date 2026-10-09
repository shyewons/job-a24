(function (root) {
  'use strict';
  const REASONS = ['급여', '거리', '업무', '정보부족', '기타'];
  function createSession(total) {
    if (!Number.isInteger(total) || total < 0) throw new RangeError('Invalid job count');
    let index = 0, face = total ? 'front' : 'done', decisions = [];
    function commit(decision) {
      decisions.push({ index, ...decision });
      index++;
      face = index < total ? 'front' : 'done';
      return true;
    }
    return {
      snapshot: () => ({ index, remaining: total - index, face,
        decisions: decisions.map(d => ({ ...d, ...(d.reasons ? { reasons: [...d.reasons] } : {}) })) }),
      openFeedback() {
        if (face !== 'front') return false;
        face = 'back'; return true;
      },
      cancelFeedback() {
        if (face !== 'back') return false;
        face = 'front'; return true;
      },
      apply(expectedIndex) {
        if (expectedIndex !== index || face !== 'front') return false;
        return commit({ type: 'applied' });
      },
      reject(expectedIndex, reasons, detail = '') {
        if (expectedIndex !== index || face !== 'back' || !Array.isArray(reasons) || !reasons.length) return false;
        if (reasons.some(r => !REASONS.includes(r)) || typeof detail !== 'string') return false;
        if (reasons.includes('기타') && !detail.trim()) return false;
        return commit({ type: 'rejected', reasons: [...new Set(reasons)], detail: reasons.includes('기타') ? detail.trim().slice(0, 160) : '' });
      },
      restart() { index = 0; face = total ? 'front' : 'done'; decisions = []; }
    };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { createSession };
  else root.JobExplorer = { createSession };
})(globalThis);
