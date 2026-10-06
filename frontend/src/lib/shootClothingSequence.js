import { EXPOSURE_CHOICES } from './wardrobeNudity';
export const DEFAULT_CLOTHING_STAGES = EXPOSURE_CHOICES.filter(stage => stage !== 'open or shifted outfit');
export function clothingSequence(stages, shotsPerStage = 4, outfitSet = '') {
  const shots = Math.max(1, Math.min(5, Math.floor(Number(shotsPerStage) || 4)));
  return EXPOSURE_CHOICES.filter(stage => stages.includes(stage)).flatMap(exposure_mode => Array.from({ length: shots }, () => ({
    exposure_mode, nudity_level: 0, nudity_outfit: '',
    ...(outfitSet ? { outfit_mode: 'full', outfit_set: outfitSet } : {}),
  })));
}
