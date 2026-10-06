// Editable visual starting points, not definitions of how everyone of a heritage looks.
// Stable keys preserve saved characters. Explicit appearance selections take priority.
const rows = {
  Latin: [
    'latina|Latina heritage, mixed Indigenous and European ancestry|warm olive skin|dark hair|dark expressive eyes, full lips|curvy build',
    'mexican|Mexican heritage, Indigenous and European ancestry, mestizo features|warm brown skin|dark hair|prominent cheekbones|',
    'brazilian|Brazilian heritage, Portuguese, African and Indigenous ancestry|caramel to deep skin|dark hair|diverse Brazilian facial features|athletic build',
    'colombian|Colombian heritage, European and Indigenous ancestry|warm skin tones|dark hair|expressive features|',
    'puerto rican|Puerto Rican heritage, Taíno, African and Spanish ancestry|warm brown skin|curly dark hair|expressive features|',
    'cuban|Cuban heritage, Spanish and African ancestry|varied skin tones|dark hair|strong facial structure|',
    'dominican|Dominican heritage, African and Spanish ancestry|warm to deep skin|dark hair|expressive features|curvy build',
    'venezuelan|Venezuelan heritage, European and Indigenous ancestry|warm skin|dark hair|defined features|',
    'argentinian|Argentinian heritage, European and Latin American ancestry|fair to olive skin||refined features|',
    'peruvian|Peruvian heritage, Indigenous Quechua ancestry|olive to brown skin|dark hair|prominent cheekbones|',
  ],
  'East Asian': [
    'east asian|East Asian heritage|warm skin undertones|straight black hair|epicanthic eye folds, delicate features|',
    'japanese|Japanese heritage|porcelain to olive skin|straight dark hair|refined facial structure, subtle features|',
    'korean|Korean heritage|fair skin with natural texture|sleek black hair|V-line jaw, straight brows|',
    'chinese|Chinese heritage, regional diversity|fair to olive skin|straight black hair|almond-shaped eyes|',
  ],
  'Southeast Asian': [
    'vietnamese|Vietnamese heritage, Southeast Asian features|warm golden skin|dark hair|delicate facial features|slender build',
    'thai|Thai heritage, Southeast Asian features|golden-brown skin|dark hair|soft rounded facial structure|',
    'filipina|Filipino heritage, diverse island ancestry|tan to brown skin|dark hair|large expressive eyes|',
    'indonesian|Indonesian heritage, diverse island ancestry|warm brown skin|dark hair|Southeast Asian features|',
    'cambodian|Cambodian heritage, Khmer ancestry|warm golden-brown skin|dark hair|gentle facial structure|',
    'malaysian|Malaysian heritage, Malay ancestry|warm brown skin|dark hair|soft Southeast Asian features|',
    'burmese|Burmese / Myanmar heritage|golden skin|dark hair|gentle Southeast Asian facial structure|',
  ],
  'South Asian': [
    'south asian|South Asian heritage|warm brown skin|dark hair|expressive eyes, defined nose|',
    'indian|Indian heritage, regional diversity|warm to deep brown skin|thick dark hair|dark eyes, defined features|',
    'pakistani|Pakistani heritage|warm olive to brown skin|thick dark hair|defined South Asian features|',
    'bangladeshi|Bangladeshi heritage|warm brown skin|dark hair|dark eyes, delicate South Asian features|',
    'sri lankan|Sri Lankan heritage, diverse ethnic backgrounds|warm brown skin|dark hair|South Asian features|',
  ],
  'Central Asian': [
    'kazakh|Kazakh heritage, Central Asian ancestry|fair to tan skin|dark hair|high cheekbones, epicanthic eye folds|',
    'uzbek|Uzbek heritage, Central Asian Turkic and Persian influences|warm olive skin|dark hair|defined facial features|',
    'mongolian|Mongolian heritage|fair to tan skin|dark hair|high cheekbones, almond-shaped eyes|strong build',
  ],
  Black: [
    'black|Black heritage, African ancestry|deep rich skin tones||full lips, expressive features|curvy build',
    'african american|African American heritage, diverse ancestry|varied skin tones|varied natural hair textures|full expressive features|',
    'ebony|African heritage|very deep rich black-brown skin, natural skin texture||defined features|',
    'afro-caribbean|Afro-Caribbean heritage, African and Caribbean ancestry|warm brown skin||expressive features|',
    'nigerian|Nigerian heritage, West African ancestry|deep brown skin||strong facial structure, full lips|',
    'ethiopian|Ethiopian heritage, East African ancestry|reddish-brown skin||high cheekbones, slender nose|',
    'somali|Somali heritage, East African ancestry|soft brown skin||delicate facial structure|',
    'kenyan|Kenyan heritage, diverse East African ancestry|deep brown skin||high cheekbones|slender build',
    'ghanaian|Ghanaian heritage, West African ancestry|deep rich skin||defined features, full lips|',
    'south african|South African heritage, diverse ancestry|varied skin tones||diverse facial features|',
  ],
  Caribbean: [
    'jamaican|Jamaican heritage, Afro-Caribbean ancestry|warm brown skin||defined features|',
    'haitian|Haitian heritage, African and Caribbean ancestry|deep brown skin||expressive features|',
    'trinidadian|Trinidadian heritage, Indian, African and Caribbean ancestry|warm skin||blended facial features|',
  ],
  European: [
    'white|European heritage|fair skin|varied hair colors|varied European features|',
    'caucasian|European heritage|fair to medium skin||varied European features|',
    'european|European heritage, regional diversity|fair to olive skin||varied facial features|',
    'british|British heritage|fair skin, rosy cheeks||varied facial features|',
    'french|French heritage|fair to olive skin||refined bone structure|',
    'german|German heritage|fair skin|blonde or light brown hair|strong bone structure|',
    'italian|Italian heritage, Mediterranean ancestry|olive skin|dark hair|defined profile, Roman nose|',
    'spanish|Spanish heritage, Mediterranean ancestry|olive skin|dark hair|dark expressive eyes|',
    'irish|Irish heritage|very fair skin, light freckles|red or dark hair|green eyes|',
    'russian|Russian heritage, Slavic ancestry|fair skin||high cheekbones, light eyes|',
    'polish|Polish heritage, Slavic ancestry|fair skin|light hair|strong bone structure|',
    'portuguese|Portuguese heritage|olive skin|dark hair|Mediterranean facial features|',
    'dutch|Dutch heritage|fair skin|blonde hair|defined facial features|tall stature',
    'scottish|Scottish heritage|fair skin, light freckles|red or dark hair|defined features|',
  ],
  Nordic: [
    'nordic|Nordic heritage|very fair skin|blonde hair|blue eyes, angular features|tall stature',
    'scandinavian|Scandinavian heritage|fair skin|blonde or light hair|light eyes|',
    'swedish|Swedish heritage|fair skin|blonde hair|blue eyes|tall athletic build',
    'norwegian|Norwegian heritage|fair skin|light hair|strong features|',
    'icelandic|Icelandic heritage|very fair skin|light hair|light eyes, Nordic features|',
  ],
  'Middle Eastern': [
    'middle eastern|Middle Eastern heritage|olive skin|dark hair|expressive eyes, defined nose|',
    'arab|Arab heritage|olive to tan skin|dark hair|large expressive eyes, defined features|',
    'persian|Persian heritage|olive skin|thick dark hair|prominent cheekbones, defined nose, expressive eyes|',
    'turkish|Turkish heritage, Anatolian ancestry|olive skin|dark hair|European and Middle Eastern facial influences|',
    'lebanese|Lebanese heritage, Levantine ancestry|olive skin|dark hair|refined Mediterranean and Middle Eastern features|',
    'egyptian|Egyptian heritage|olive to brown skin|dark hair|defined features|',
    'moroccan|Moroccan heritage, Amazigh and Arab ancestry|olive to deep skin|dark hair|North African features|',
    'israeli|Israeli heritage, diverse backgrounds|olive skin||varied Mediterranean facial features|',
  ],
  'Jewish heritage': [
    'ashkenazi|Ashkenazi Jewish heritage, European Jewish ancestry|fair to olive skin||diverse facial features|',
    'sephardic|Sephardic Jewish heritage, Iberian and Mediterranean ancestry|olive skin||Mediterranean facial features|',
    'mizrahi|Mizrahi Jewish heritage, Middle Eastern and North African ancestry|olive to tan skin||Middle Eastern facial features|',
  ],
  Caucasus: [
    'armenian|Armenian heritage, Caucasus ancestry|olive skin|dark hair|defined profile, expressive eyes|',
    'georgian|Georgian heritage, Caucasus ancestry|fair to olive skin||strong bone structure|',
  ],
  Islander: [
    'polynesian|Polynesian heritage|warm brown skin|dark hair|broad facial features|strong build',
    'hawaiian|Native Hawaiian heritage, Polynesian ancestry|warm golden-brown skin|dark hair|gentle expressive eyes|',
    'samoan|Samoan heritage, Polynesian ancestry|warm brown skin|dark hair|broad facial structure|strong athletic build',
    'maori|Māori heritage, Polynesian ancestry|warm skin|dark hair|defined Polynesian facial features|',
  ],
  Indigenous: [
    'native american|Native American heritage, diverse tribal ancestry|tan skin|dark hair|high cheekbones, defined features|',
    'indigenous|Indigenous heritage, diverse communities|warm skin||distinctive facial features|',
    'mayan|Maya heritage, Indigenous Mesoamerican ancestry|warm skin|dark hair|defined facial profile|',
    'aztec|Mexica / Nahua heritage, Indigenous Mexican ancestry|warm brown skin|dark hair|defined facial profile|',
    'inca|Quechua / Andean heritage|olive skin|dark hair|defined Andean features|strong build',
    'native brazilian|Indigenous Brazilian heritage, diverse Amazonian communities|warm skin|dark hair|defined facial features|',
  ],
  Mixed: [
    'mixed|Mixed heritage, blended ancestry|varied skin tones|varied hair textures|blended facial features|',
    'blasian|Black and Asian mixed heritage|varied skin tones|varied hair textures|blended African and Asian facial features|',
    'afro-latina|African and Latin American mixed heritage|warm brown skin|curly hair|blended facial features|',
    'eurasian|European and Asian mixed heritage|varied skin tones||blended European and Asian facial features|',
    'mulatto|Black and European mixed heritage|caramel skin||blended facial features|',
    'mestiza|Indigenous and European mixed heritage, Latin American ancestry|olive skin||blended facial features|',
    'creole|Creole heritage, diverse European, African and Caribbean ancestry|varied skin tones||blended facial features|',
    'amerasian|Amerasian heritage, Asian and American ancestry|varied skin tones||blended facial features|',
    'hapa|Hapa heritage, mixed Asian ancestry|varied skin tones||blended facial features|',
    'chindian|Chinese and Indian mixed heritage|warm skin||blended East Asian and South Asian facial features|',
  ],
  Mediterranean: [
    'mediterranean|Mediterranean heritage, Southern European, North African and Middle Eastern influences|olive skin|dark hair|warm expressive eyes|',
    'greek|Greek heritage, Mediterranean ancestry|olive skin|dark hair|defined profile, prominent nose|',
  ],
};

export const HERITAGE_LABELS = {
  mulatto: 'Mixed Black / European', ebony: 'Deep ebony complexion',
  mayan: 'Maya', aztec: 'Mexica / Nahua', inca: 'Quechua / Andean',
  maori: 'Māori', burmese: 'Burmese / Myanmar', 'native brazilian': 'Indigenous Brazilian',
};
const titleCase = value => value.replace(/\b\w/g, letter => letter.toUpperCase());
export const heritageLabel = key => HERITAGE_LABELS[key] || titleCase(key);
export const HERITAGE_GROUPS = Object.entries(rows).map(([name, entries]) => ({ name, options: entries.map(row => row.split('|')[0]) }));
export const HERITAGE_PROFILES = Object.fromEntries(Object.entries(rows).flatMap(([group, entries]) => entries.map(row => {
  const [key, ancestry, skin, hair, face, body] = row.split('|');
  const traits = [
    { section: 'skin', fields: ['tone', 'texture', 'freckles'], text: skin },
    { section: 'hair', fields: ['color', 'style', 'texture'], text: hair },
    { section: 'face', fields: ['eye_shape', 'eye_color', 'jawline', 'nose', 'lips'], text: face },
    { section: 'physique', fields: ['height', 'body_type', 'muscularity', 'curves', 'bust_scale', 'butt_scale', 'thigh_scale', 'hip_scale', 'waist_scale'], text: body },
  ].filter(trait => trait.text);
  return [key, { group, ancestry, traits, description: [ancestry, skin, hair, face, body].filter(Boolean).join(', ') }];
})));
const selected = value => Array.isArray(value) ? value.some(selected) : typeof value === 'number' ? value > 0 : !!value && !['none', 'default', 'off'].includes(String(value).toLowerCase());
export function heritagePrompt(key, dna = {}) {
  const profile = HERITAGE_PROFILES[key];
  if (!profile) return key || '';
  return [profile.ancestry, ...profile.traits.filter(trait => !trait.fields.some(field => selected(dna[trait.section]?.[field]))).map(trait => trait.text)].join(', ');
}
