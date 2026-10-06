import { DEFAULT_DNA } from './dna';

export const CHARACTER_TYPE_GROUPS = ['All', 'Age', 'Roles', 'Looks'];
const wardrobe = values => ({ ...DEFAULT_DNA.wardrobe, exposure_mode: 'use selected outfit', ...values });
const sizeDefaults = { bust_scale: 0, butt_scale: 0, thigh_scale: 0, hip_scale: 0, waist_scale: 0, implant_volume: 0 };
const preset = (name, group, description, dna, tags = []) => ({
  name, group, description, tags: [group.toLowerCase(), ...tags],
  dna: { ...dna, style: { render: 'photorealistic', extra: '', ...dna.style } },
});
export const CHARACTER_TYPE_PRESETS = [
  preset('Young adult', 'Age', 'Age 25, natural pores and an editable adult portrait.', { identity: { age: 25 }, skin: { texture: 'natural pores' }, face: { expression: 'smile' } }),
  preset('Adult', 'Age', 'Age 35, natural pores and an editable adult portrait.', { identity: { age: 35 }, skin: { texture: 'natural pores' }, face: { expression: 'neutral' } }),
  preset('Middle-aged', 'Age', 'Age 45, fine lines and an editable adult portrait.', { identity: { age: 45 }, skin: { texture: 'fine lines' }, face: { expression: 'smile' } }),
  preset('Older mature', 'Age', 'Age 60, mature skin texture and an editable adult portrait.', { identity: { age: 60 }, skin: { texture: 'mature skin texture' }, face: { expression: 'smile' } }),
  preset('Senior', 'Age', 'Age 75, mature skin texture and an editable adult portrait.', { identity: { age: 75 }, skin: { texture: 'mature skin texture' }, face: { expression: 'smile' } }),
  preset('Elder', 'Age', 'Age 80, mature skin texture and an editable adult portrait.', { identity: { age: 80 }, skin: { texture: 'mature skin texture' }, face: { expression: 'neutral' } }),
  preset('Mature gentleman', 'Age', 'Age 55, mature skin and a composed expression.', { identity: { gender: 'male', age: 55 }, skin: { texture: 'fine lines' }, face: { expression: 'neutral' } }),
  preset('Grandfather', 'Age', 'Age 70, silver hair and mature skin.', { identity: { gender: 'male', age: 70 }, hair: { color: 'silver' }, skin: { texture: 'mature skin texture' }, face: { expression: 'smile' } }),
  preset('Teacher', 'Roles', 'Teacher styling with a cardigan and glasses.', { identity: { gender: 'female', age: 32, archetype: 'scholar' }, hair: { style: 'sleek bun' }, wardrobe: wardrobe({ outfit_preset: 'cardigan and slip dress', glasses_style: 'thin metal frames' }) }),
  preset('Librarian', 'Roles', 'Library styling with a sweater and glasses.', { identity: { gender: 'female', age: 32, archetype: 'scholar' }, hair: { style: 'chignon' }, wardrobe: wardrobe({ outfit_preset: 'oversized sweater', glasses_style: 'thin metal frames' }) }),
  preset('Businesswoman', 'Roles', 'Tailored business outfit and composed styling.', { identity: { gender: 'female', age: 32, archetype: 'socialite' }, hair: { style: 'sleek bun' }, wardrobe: wardrobe({ outfit_preset: 'tailored pantsuit' }) }),
  preset('Nurse', 'Roles', 'Adult nurse costume and tidy hair.', { identity: { gender: 'female', age: 32, archetype: 'girl next door' }, hair: { style: 'sleek bun' }, wardrobe: wardrobe({ outfit_preset: 'naughty nurse' }) }),
  preset('Flight attendant', 'Roles', 'Adult flight attendant costume and an updo.', { identity: { gender: 'female', age: 32, archetype: 'socialite' }, hair: { style: 'chignon' }, wardrobe: wardrobe({ outfit_preset: 'flight attendant undone' }) }),
  preset('Cowgirl', 'Roles', 'Western costume styling with braided hair.', { identity: { gender: 'female', age: 32, archetype: 'girl next door' }, hair: { style: 'braids' }, wardrobe: wardrobe({ outfit_preset: 'cowgirl chaps' }) }),
  preset('Artist', 'Roles', 'Creative casual clothing with a relaxed hairstyle.', { identity: { gender: 'female', age: 32, archetype: 'artist' }, hair: { style: 'messy bun' }, wardrobe: wardrobe({ outfit_preset: 'streetwear' }) }),
  preset('Fitness trainer', 'Roles', 'Adult gym styling with a practical ponytail.', { identity: { gender: 'female', age: 32, archetype: 'athlete' }, hair: { style: 'high ponytail' }, wardrobe: wardrobe({ outfit_preset: 'gym set' }) }),
  preset('Evening hostess', 'Roles', 'Cocktail attire with elegant hair.', { identity: { gender: 'female', age: 32, archetype: 'socialite' }, hair: { style: 'updo' }, wardrobe: wardrobe({ outfit_preset: 'cocktail dress' }) }),
  preset('Biker', 'Roles', 'Adult biker costume with practical tied-back hair.', { identity: { gender: 'female', age: 32, archetype: 'warrior' }, hair: { style: 'ponytail' }, wardrobe: wardrobe({ outfit_preset: 'biker chick' }) }),
  preset('Vintage starlet', 'Roles', 'Vintage evening gown and styled curls.', { identity: { gender: 'female', age: 32, archetype: 'vintage starlet' }, hair: { style: 'ringlets' }, wardrobe: wardrobe({ outfit_preset: 'velvet gown' }) }),
  preset('Royal queen', 'Roles', 'Royal gown, coordinated jewelry and elegant hair.', { identity: { gender: 'female', age: 32, archetype: 'queen' }, hair: { style: 'updo' }, wardrobe: wardrobe({ outfit_preset: 'Bollywood princess gown with jewelry' }) }),
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
