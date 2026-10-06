import { DEFAULT_DNA } from './dna';

export const CHARACTER_TYPE_GROUPS = ['All', 'Age', 'Roles', 'Looks'];
const wardrobe = values => ({ ...DEFAULT_DNA.wardrobe, exposure_mode: 'use selected outfit', ...values });
const sizeDefaults = { bust_scale: 0, butt_scale: 0, thigh_scale: 0, hip_scale: 0, waist_scale: 0, implant_volume: 0 };
const preset = (name, group, description, dna, tags = []) => ({
  name, group, description, tags: [group.toLowerCase(), ...tags],
  dna: { ...dna, style: { render: 'photorealistic', extra: '', ...dna.style } },
});
export const CHARACTER_TYPE_PRESETS = [
  preset('Grandma', 'Age', 'Age 70, silver hair, mature skin and a gentle expression.', {
    identity: { age: 70 }, hair: { color: 'silver', style: 'wavy', length: 'shoulder' },
    skin: { texture: 'mature skin texture' }, face: { expression: 'smile' },
  }, ['older', 'grandmother', 'senior']),
  preset('Mature', 'Age', 'Age 50, fine lines and a confident expression.', {
    identity: { age: 50 }, skin: { texture: 'fine lines' }, face: { expression: 'smirk' },
  }, ['middle aged']),
  preset('Glamour model', 'Looks', 'Adult editorial look, styled hair and confident posing.', {
    identity: { gender: 'female', age: 30, archetype: 'socialite' },
    hair: { style: 'blowout', length: 'long' }, face: { lips: 'full', expression: 'smirk' },
    physique: { ...sizeDefaults, body_type: 'hourglass', bust: 'large', bust_shape: 'natural', waist: 'slim' },
    skin: { texture: 'natural pores' },
  }, ['glamour', 'model']),
  preset('Maid', 'Roles', 'Classic maid uniform with an apron and tidy updo.', {
    identity: { gender: 'female', age: 30 }, hair: { style: 'sleek bun' },
    wardrobe: wardrobe({ outfit_set: 'classic maid dress with lace headpiece, stockings and pumps', footwear: 'kitten heels' }),
  }, ['housekeeper', 'uniform']),
  preset('Office secretary', 'Roles', 'Adult office look with tailored clothing and an updo.', {
    identity: { gender: 'female', age: 32, archetype: 'scholar' }, hair: { style: 'sleek bun' },
    wardrobe: wardrobe({ outfit_preset: 'tailored pantsuit', glasses_style: 'thin metal frames', footwear: 'kitten heels' }),
  }, ['business', 'professional', 'assistant']),
  preset('Bimbo', 'Looks', 'Adult blonde glamour look with fuller lips and enhanced curves.', {
    identity: { gender: 'female', age: 28, archetype: 'socialite' },
    hair: { color: 'platinum blonde', style: 'blowout', length: 'long' },
    physique: { ...sizeDefaults, body_type: 'hourglass', bust: 'very large', bust_shape: 'augmented', waist: 'cinched', hips: 'wide' },
    face: { lips: 'pouty', expression: 'smirk' }, skin: { texture: 'natural pores' }, style: { anatomy_mode: 'enhanced' },
  }, ['blonde', 'glam', 'enhanced']),
  preset('Bolt-on look', 'Looks', 'Pronounced rounded augmentation with defined projection.', {
    identity: { gender: 'female', age: 30 },
    physique: { bust_scale: 0, implant_volume: 1000, bust: 'very large', bust_shape: 'augmented' },
    skin: { texture: 'natural pores' }, style: { anatomy_mode: 'enhanced' },
  }, ['bolt on', 'implants', 'augmented']),
  preset('Plastic glamour', 'Looks', 'Cosmetic enhancement aesthetic with realistic human skin.', {
    identity: { gender: 'female', age: 30, archetype: 'socialite' },
    physique: { ...sizeDefaults, body_type: 'hourglass', bust: 'large', bust_shape: 'augmented', waist: 'cinched' },
    face: { lips: 'pouty', jawline: 'defined' }, hair: { style: 'straight', length: 'long' },
    skin: { texture: 'natural pores' }, style: { anatomy_mode: 'enhanced' },
  }, ['plastic', 'cosmetic', 'glamour']),
  preset('Fitness model', 'Looks', 'Athletic adult with toned proportions and sporty styling.', {
    identity: { gender: 'female', age: 28, archetype: 'athlete' },
    physique: { ...sizeDefaults, body_type: 'athletic', muscularity: 65, bust: 'medium', bust_shape: 'athletic', butt: 'toned', thighs: 'toned' },
    hair: { style: 'high ponytail' }, skin: { texture: 'natural pores' },
  }, ['athlete', 'sporty']),
  preset('Vintage pin-up', 'Looks', 'Adult vintage styling, curled hair and a playful smile.', {
    identity: { gender: 'female', age: 30, archetype: 'vintage starlet' },
    hair: { style: 'ringlets', length: 'shoulder' }, face: { expression: 'smile' },
    physique: { ...sizeDefaults, body_type: 'hourglass', bust: 'large', bust_shape: 'natural', waist: 'slim' },
    skin: { texture: 'natural pores' },
  }, ['retro', 'pinup']),
  preset('Goth', 'Looks', 'Adult dark fashion styling with black hair and a serious expression.', {
    identity: { gender: 'female', age: 28, archetype: 'goth' },
    hair: { color: 'jet black', style: 'straight', length: 'long' }, face: { expression: 'serious' },
    wardrobe: wardrobe({ outfit_preset: 'streetwear', garment_color: 'black' }),
  }, ['alternative', 'dark']),
];

// Character types layer onto the current character, leaving heritage, cast and
// unrelated controls intact. Explicit empty/default fields clear conflicting choices.
export function applyCharacterTypePreset(currentDna, selected) {
  return Object.fromEntries(Object.keys(DEFAULT_DNA).map(section => [section, {
    ...DEFAULT_DNA[section], ...(section === "wardrobe" && selected.dna.wardrobe ? {} : (currentDna?.[section] || {})), ...(selected.dna[section] || {}),
  }]));
}
