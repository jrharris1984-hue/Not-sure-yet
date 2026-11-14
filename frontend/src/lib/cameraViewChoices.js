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
// Combined orbit viewpoints: horizontal position around the subject plus vertical elevation.
// These are descriptive camera directions, not guaranteed 3D camera coordinates.
const ORBIT_DIRECTIONS = {
  'front': 'direct front view',
  'front left three-quarter': 'front three-quarter view from the subject’s left',
  'left profile': 'direct left-side profile',
  'rear left three-quarter': 'rear three-quarter view from the subject’s left',
  'back': 'direct back view',
  'rear right three-quarter': 'rear three-quarter view from the subject’s right',
  'right profile': 'direct right-side profile',
  'front right three-quarter': 'front three-quarter view from the subject’s right',
};
const ORBIT_ELEVATIONS = {
  'from below': 'camera positioned below the subject, looking upward',
  'from above': 'camera positioned above the subject, looking downward',
  'at eye level': 'camera at the subject’s eye level',
  'from ground level': 'camera close to the ground, looking sharply upward',
  'from high overhead': 'camera high above the subject, looking steeply downward',
};
export const SPHERICAL_SUBJECT_VIEWS = Object.fromEntries(
  Object.entries(ORBIT_DIRECTIONS).flatMap(([direction,description]) =>
    Object.entries(ORBIT_ELEVATIONS).map(([elevation,camera]) => [`${direction} ${elevation}`,`${description}; ${camera}; preserve this exact subject orientation and camera elevation`])
  )
);

export const cameraViewPrompt = value => EXTRA_CAMERA_ANGLES[value] || (value ? `${value} camera angle` : '');
export const subjectViewPrompt = value => SPHERICAL_SUBJECT_VIEWS[value] || EXTRA_SUBJECT_VIEWS[value] || value;
