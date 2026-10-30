// Values remain human-readable in custom and model-specific prompt paths.
export const EXTRA_CAMERA_ANGLES = {
  'slightly high': 'camera slightly above eye level, angled gently downward',
  'slightly low': 'camera slightly below eye level, angled gently upward',
  'chest level': 'camera at chest height with a level optical axis',
  'waist level': 'camera at waist height, angled gently upward',
  'knee level': 'camera at knee height, looking upward',
  'overhead diagonal': 'camera above the subject at a diagonal downward angle, not directly overhead',
};
export const EXTRA_SUBJECT_VIEWS = {
  'front left three-quarter': 'front three-quarter view from the subject’s left side',
  'front right three-quarter': 'front three-quarter view from the subject’s right side',
  'rear left three-quarter': 'rear three-quarter view from the subject’s left side',
  'rear right three-quarter': 'rear three-quarter view from the subject’s right side',
  'left profile': 'left-side profile view of the subject',
  'right profile': 'right-side profile view of the subject',
};
export const cameraViewPrompt = value => EXTRA_CAMERA_ANGLES[value] || (value ? `${value} camera angle` : '');
export const subjectViewPrompt = value => EXTRA_SUBJECT_VIEWS[value] || value;
