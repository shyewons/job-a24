const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const statePath = path.join(__dirname, '../js/state.js');
test('session implementation exists', () => assert.ok(fs.existsSync(statePath), 'state.js is not implemented'));
if (fs.existsSync(statePath)) {
  const { createSession } = require(statePath);
  test('applying records one decision and advances the remaining count', () => {
    const s = createSession(2);
    assert.equal(s.apply(0), true);
    assert.equal(s.apply(0), false);
    assert.equal(s.snapshot().remaining, 1);
    assert.equal(s.snapshot().decisions[0].type, 'applied');
  });
  test('feedback does not consume a job and can be cancelled', () => {
    const s = createSession(2);
    s.openFeedback();
    assert.equal(s.snapshot().face, 'back');
    assert.equal(s.snapshot().remaining, 2);
    assert.equal(s.apply(0), false);
    s.cancelFeedback();
    assert.equal(s.snapshot().face, 'front');
    assert.equal(s.snapshot().decisions.length, 0);
  });
  test('reject requires valid reasons, with nonblank details for other', () => {
    const s = createSession(2);
    assert.equal(s.reject(0, ['급여'], ''), false);
    s.openFeedback();
    for (const [reasons, detail] of [[[], ''], [['unknown'], ''], [['기타'], '   '], [['급여', '기타'], '']]) {
      assert.equal(s.reject(0, reasons, detail), false);
      assert.equal(s.snapshot().remaining, 2);
    }
    assert.equal(s.reject(0, ['급여', '거리'], ''), true);
    assert.deepEqual(s.snapshot().decisions[0].reasons, ['급여', '거리']);
    assert.equal(s.reject(0, ['급여'], ''), false);
  });
  test('last card completes and restart clears decisions', () => {
    const s = createSession(1);
    s.openFeedback();
    assert.equal(s.reject(0, ['기타'], '  근무일 불일치  '), true);
    assert.equal(s.snapshot().decisions[0].detail, '근무일 불일치');
    assert.equal(s.snapshot().remaining, 0);
    assert.equal(s.snapshot().face, 'done');
    assert.equal(s.apply(1), false);
    assert.equal(s.openFeedback(), false);
    s.restart();
    assert.equal(s.snapshot().remaining, 1);
    assert.equal(s.snapshot().face, 'front');
    assert.deepEqual(s.snapshot().decisions, []);
  });
  test('snapshot does not expose mutable internal decisions', () => {
    const s = createSession(2);
    s.openFeedback(); s.reject(0, ['급여'], '');
    s.snapshot().decisions[0].reasons.push('거리');
    assert.deepEqual(s.snapshot().decisions[0].reasons, ['급여']);
  });
}
