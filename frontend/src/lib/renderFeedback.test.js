import {renderFeedback} from './renderFeedback';
test.each(['queued','pending','running','processing'])('explains active state %s',status=>{
  expect(renderFeedback(status).busy).toBe(true);
  expect(renderFeedback(status).message).toBeTruthy();
});
test('submission takes precedence over a previous finished render',()=>{
  expect(renderFeedback('done',true).label).toBe('Submitting…');
  expect(renderFeedback('done').label).toBe('Ready to view');
});
test.each(['failed','offline','cancelled'])('retains distinct recovery state %s',status=>{
  expect(renderFeedback(status).state).toBe(status);
  expect(renderFeedback(status).busy).toBe(false);
});
