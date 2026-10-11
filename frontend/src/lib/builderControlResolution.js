import { normalizeAnatomyDetails } from "./anatomyDetailControls";
import { POSE_ACTION_PROMPTS } from './photographyPoses';
import { catalogSelection, catalogControl, getPromptCatalog } from './promptCatalog';
import { resolveAgeSkin } from './ageAppearance';
import { resolveWardrobeMode } from "./wardrobeMode";
import {wardrobeStateResolution} from './wardrobeCompatibility';
import { wardrobeNudity } from "./wardrobeNudity";
import { footVisibility } from './footVisibility';
import { CONCEALED_ANATOMY_FIELDS, hasCoveringOuterOutfit } from './coveredOutfitDetails';
// Resolve shared visual controls on a copy. Saved selections remain editable.
const list = value => Array.isArray(value) ? value : value ? [value] : [];
const lower = value => String(value || '').toLowerCase();
export function resolveBuilderControls(source = {}) {
  const copy=JSON.parse(JSON.stringify(normalizeAnatomyDetails(source, getPromptCatalog())));
  const dna = resolveAgeSkin(copy,catalogControl(copy,'skin','texture'));
  dna.kink = {};
  for (const section of ['pose', 'feet', 'wardrobe', 'hair', 'skin', 'scene', 'camera', 'watersports']) dna[section] ||= {};
  const notes = [];
  const choice = (section, field) => catalogControl(dna,section,field);
  const controls = section => Object.fromEntries(Object.keys(dna[section] || {}).map(field=>[field,choice(section,field)]));
  const setChoice = (section,field,value) => {
    dna[section][field]=value;
    if (dna._catalogSelections?.[section]) dna._catalogSelections[section][field]=value;
  };
  if (dna.skin?.texture !== source.skin?.texture && source.skin?.texture) notes.push({section:'skin',field:'texture',text:'The selected age uses age-appropriate skin texture instead of competing smoothing or aging wording.'});
  const omit = (section, field, text) => {
    if (!dna[section][field] || (Array.isArray(dna[section][field]) && !dna[section][field].length)) return;
    dna[section][field] = Array.isArray(dna[section][field]) ? [] : '';
    if (dna._catalogSelections?.[section]) dna._catalogSelections[section][field]=Array.isArray(dna._catalogSelections[section][field])?[]:'';
    notes.push({ section, field, text });
  };
  dna.wardrobe = resolveWardrobeMode(dna.wardrobe);
  const p = dna.pose, f = dna.feet, w = dna.wardrobe, ws = dna.watersports;
  // A named pose with defined arm placement owns the hands; do not ask the
  // same arms to occupy a second position. Custom wording remains untouched.
  const selectedPose = catalogSelection(dna, 'pose', 'action');
  const poseKey = POSE_ACTION_PROMPTS[selectedPose] ? selectedPose : POSE_ACTION_PROMPTS[p.action] ? p.action
    : Object.keys(POSE_ACTION_PROMPTS).find(key => POSE_ACTION_PROMPTS[key] === p.action);
  const handsDefined = new Set([
    'standing thumbs in pockets', 'standing arms loosely crossed', 'standing one hand on waist',
    'standing hands on hips', 'standing arms up', 'seated hands folded in lap',
    'leaning forearms on railing', 'adjusting jacket lapel', 'kneeling hands floor',
    'all fours', 'hands on knees',
  ]);
  const customHands = /\b(?:hands?|forearms?|arms?|wrists?|thumbs?)\s+(?:(?:are|resting|placed|raised|bound|folded|loosely|hooked|planted|leaning)\s+)*(?:on|in|at|over|above|behind|against|crossed|bound|folded|up)\b/i.test([choice('pose','action'),p.action].join(' '));
  if (handsDefined.has(poseKey) || customHands) omit('pose', 'hands', 'The selected pose already defines arm and hand placement. The separate Hand position is inactive for this pose.');
  if (poseKey && p.body_language && lower(POSE_ACTION_PROMPTS[poseKey]).split(/[^a-z-]+/).includes(lower(p.body_language))) {
    omit('pose', 'body_language', 'The selected pose already includes this body language.');
  }
  if ((poseKey === 'reverse view' || choice('pose','action')==='reverse view') && p.angle && choice('pose','angle') !== 'back') {
    setChoice('pose','angle','back');
    notes.push({section:'pose',field:'angle',text:'Reverse view uses the rear camera view instead of a competing body angle.'});
  }

  if (w.outfit_mode === 'full') {
    if (!w.outfit_set) notes.push({ section: 'wardrobe', field: 'outfit_set', text: 'Choose a complete outfit set or switch to Custom for individual garments.' });
    omit('feet', 'hosiery', 'The full outfit set controls hosiery. Switch Wardrobe to Custom to use separate hosiery.');
  }
  const croppedAboveFeet = ['waist-up', 'thigh-up', 'knees-up', 'portrait', 'close-up'].includes(choice('pose','distance'));
  const focus = choice('feet','composition_mode') === 'feet focus' || (!f.composition_mode && choice('pose','focus') === 'feet' && !croppedAboveFeet);
  if (!focus && choice('pose','focus') === 'feet' && croppedAboveFeet) {
    setChoice('pose','focus','full frame');
    notes.push({ section: 'pose', field: 'focus', text: 'This crop excludes feet. Select Feet focus to switch to a foot crop.' });
  }
  if (focus) {
    if (p.focus !== 'feet') notes.push({ section: 'pose', field: 'focus', text: 'Feet focus controls the composition priority. Switch Feet to supporting detail to use the Pose focus.' });
    setChoice('pose','focus','feet');
    if (f.framing) {
      const distance = choice('feet','framing') === 'full body' ? 'full body' : 'detail shot';
      if (p.distance !== distance) notes.push({ section: 'pose', field: 'distance', text: `Feet framing (${f.framing}) controls the crop while Feet focus is active.` });
      setChoice('pose','distance',distance);
    }
  } else {
    if (choice('feet','composition_mode') === 'supporting detail' && choice('pose','focus') === 'feet') {
      setChoice('pose','focus','full frame');
      notes.push({ section: 'pose', field: 'focus', text: 'Feet is set to supporting detail, so the overall frame stays primary.' });
    }
    omit('feet', 'framing', 'Pose & framing controls the crop. Choose Feet focus to use a separate foot crop.');
    omit('feet', 'sole_presentation', 'Sole presentation requires Feet focus; foot appearance stays a supporting detail.');
    if (p.action) omit('feet', 'foot_pose', 'The body pose controls stance. Choose Feet focus to use a separate foot pose.');
  }
  // Resolve stable choice IDs, then keep the corresponding authored phrases.
  const filterChoices = (field, keep, text) => {
    const selected = list(choice('feet', field));
    const emitted = list(f[field]);
    const next = emitted.filter((_, index) => keep(selected[index]));
    if (next.length !== emitted.length) {
      f[field] = next;
      if (dna._catalogSelections?.feet) dna._catalogSelections.feet[field] = selected.filter(keep);
      notes.push({ section: 'feet', field, text });
    }
  };
  for (const [field, groups] of Object.entries({
    toes: [['toe curl', 'toe spread', 'toe point', 'toe scrunch', 'big toe out', 'wiggling toes', 'toes flexed', 'toes gripping fabric']],
    foot_state: [['bare', 'in nylons', 'in socks'], ['dirty', 'muddy', 'freshly washed']],
    foot_accessories: [['anklet', 'double anklet'], ['toe ring', 'multiple toe rings']],
  })) {
    for (const group of groups) {
      const selected = list(choice('feet', field)).filter(value => group.includes(value));
      if (selected.length > 1) {
        const kept = selected.at(-1);
        filterChoices(field, value => !group.includes(value) || value === kept, `Kept ${kept} instead of incompatible saved choices.`);
      }
    }
  }
  // Specialty QC: Watersports controls may coexist with the shared Pose, Scene,
  // Wardrobe and Feet editors, so resolve the overlapping concepts once before
  // they reach any model-specific compiler.
  const wsChoice = key => catalogSelection(dna,'watersports',key);
  const wsSource = wsChoice('source'), wsPhase = wsChoice('phase'), wsView = wsChoice('camera_view');
  const watersportsActive = !!wsSource && wsSource !== 'none';
  if (wsSource === 'none') {
    ws.source='none';
    for (const field of Object.keys(ws)) {
      if (field !== 'source') omit('watersports', field, 'Watersports Source is set to none, so saved scene-specific details are inactive.');
    }
  } else if (watersportsActive) {
    // Self-only controls must not be attached to a partner/group source.
    if (wsSource !== 'self') {
      omit('watersports', 'self_action', 'Self-directed action is inactive because the selected source is not Self.');
      omit('watersports', 'self_aim', 'Self landing-point guidance is inactive because the selected source is not Self.');
    }

    // Phase owns whether an active stream should exist. This prevents common
    // before/after prompts from simultaneously asking for an active stream.
    if (wsPhase === 'before') {
      for (const field of ['direction', 'stream', 'wetness', 'aftermath', 'liquid_visibility', 'self_aim', 'flow_appearance', 'highlight']) {
        omit('watersports', field, 'The Before phase describes setup only; active-stream and aftermath details are inactive.');
      }
      if (ws.garment_detail && !/\bdry\b/i.test(ws.garment_detail)) {
        omit('watersports', 'garment_detail', 'The Before phase keeps clothing dry unless a dry-clothing detail is selected.');
      }
    } else if (wsPhase === 'afterward') {
      for (const field of ['direction', 'stream', 'self_aim', 'flow_appearance', 'highlight']) {
        omit('watersports', field, 'The Afterward phase keeps wetness/aftermath but removes active-stream instructions.');
      }
      if (ws.self_action && !/checking wet clothing|washing afterward/i.test(wsChoice('self_action') || '')) {
        omit('watersports', 'self_action', 'The selected self action describes an active moment and conflicts with the Afterward phase.');
      }
    } else if (['starting', 'in progress', 'ending'].includes(wsPhase)) {
      const wetness = list(wsChoice('wetness'));
      if (wetness.includes('dry')) {
        ws.wetness = list(ws.wetness).filter((value,index)=>wetness[index]!=='dry');
        if (dna._catalogSelections?.watersports) dna._catalogSelections.watersports.wetness=wetness.filter(value=>value!=='dry');
        notes.push({ section: 'watersports', field: 'wetness', text: 'Removed Dry because the selected phase contains an active or ending stream.' });
      }
      if (wsPhase === 'in progress' && list(ws.aftermath).length) {
        omit('watersports', 'aftermath', 'Aftermath details are inactive while the scene is explicitly In progress.');
      }
    }

    // Dry cannot coexist with visible liquid even when no phase was selected.
    if (list(wsChoice('wetness')).includes('dry') && (ws.stream || ws.liquid_visibility || list(ws.direction).length)) {
      const selectedWetness=list(wsChoice('wetness'));
      ws.wetness = list(ws.wetness).filter((value,index)=>selectedWetness[index]!=='dry');
      if (dna._catalogSelections?.watersports) dna._catalogSelections.watersports.wetness=selectedWetness.filter(value=>value!=='dry');
      notes.push({ section: 'watersports', field: 'wetness', text: 'Removed Dry because visible liquid or a stream is selected.' });
    }

    // Both specialty editors can describe the floor. Watersports owns the
    // physical landing/surrounding surface whenever that scene is active.
    if (ws.surface && f.ground_surface) {
      omit('feet', 'ground_surface', 'Watersports Surface controls the shared floor/ground description for this scene.');
    }

    // Feet focus owns the crop. Otherwise the Watersports camera choice owns
    // the broad crop/angle so Pose and Camera cannot contradict it.
    if (ws.camera_view) {
      if (focus) {
        omit('watersports', 'camera_view', 'Feet focus controls the crop, so the separate Watersports camera view is inactive.');
      } else {
        const distanceByView = {
          'full figure': 'full body',
          'three-quarter figure': 'thigh-up',
          'waist-down': 'detail shot',
          'floor-level detail': 'detail shot',
          'side profile': 'full body',
          'rear three-quarter': 'full body',
          'wide environmental view': 'wide shot',
        };
        const targetDistance = distanceByView[wsView];
        if (targetDistance && p.distance !== targetDistance) {
          p.distance = targetDistance;
          notes.push({ section: 'pose', field: 'distance', text: `Watersports camera view (${wsView}) controls the broad crop.` });
        }
        if (wsView === 'side profile' && p.angle !== 'profile') {
          p.angle = 'profile';
          notes.push({ section: 'pose', field: 'angle', text: 'Watersports side-profile view controls the body angle.' });
        } else if (wsView === 'rear three-quarter' && p.angle !== '3/4') {
          p.angle = '3/4';
          notes.push({ section: 'pose', field: 'angle', text: 'Watersports rear three-quarter view controls the broad body angle.' });
        }
        if (wsView === 'floor-level detail' && dna.camera.angle !== 'low') {
          dna.camera.angle = 'low';
          notes.push({ section: 'camera', field: 'angle', text: 'Watersports floor-level view controls camera height.' });
        } else if (wsView !== 'floor-level detail' && dna.camera.angle
          && ['side profile', 'rear three-quarter'].includes(wsView)) {
          omit('camera', 'angle', 'Watersports camera view already controls the angle; the separate Camera angle is inactive.');
        }
      }
    }

    // Watersports stance and the general body pose describe the same body
    // position. Keep the specialty stance when they disagree.
    if (ws.stance && p.action) {
      const action = lower(p.action);
      const compatibility = {
        'standing upright': /standing/,
        'leaning against wall': /standing|lean/,
        'slight forward lean': /standing|lean/,
        'one leg raised': /standing|leg raised|one leg/,
        'walking away': /walking/,
        seated: /sitting|seated/,
        crouching: /crouch|squat/,
        kneeling: /kneel/,
        reclining: /lying|reclin/,
      }[wsChoice('stance')];
      if (compatibility && !compatibility.test(action)) {
        omit('pose', 'action', 'Watersports body position replaces a conflicting general Pose action.');
      }
    }

    // "Outdoors" is unambiguous and should not retain an old indoor studio
    // environment from a different specialty workflow.
    if (wsChoice('container') === 'outdoors') {
      if (dna.scene.environment && /bedroom|bathroom|studio|office|living room|kitchen/i.test(dna.scene.environment)) {
        omit('scene', 'environment', 'Watersports Outdoors context replaces the saved indoor environment.');
      }
      if (dna.scene.indoor_outdoor !== 'outdoor') {
        dna.scene.indoor_outdoor = 'outdoor';
        notes.push({ section: 'scene', field: 'indoor_outdoor', text: 'Watersports Outdoors context controls the location type.' });
      }
    }
  }

  if (w.garment_priority==='separates' && [w.top,w.bottom].some(value=>value && value!=='none')) {
    omit('wardrobe','dress_style','Separate garments were selected last, so the saved dress is inactive.');
    omit('wardrobe','skirt_style','Separate garments were selected last, so the saved skirt is inactive.');
  } else if (w.garment_priority==='skirt' && w.skirt_style) omit('wardrobe','dress_style','The skirt was selected last, so the saved dress is inactive.');
  if (w.dress_style || w.skirt_style || (w.top && w.top !== 'none') || (w.bottom && w.bottom !== 'none')) {
    omit('wardrobe', 'outfit_set', 'Individual garments override the complete outfit set.');
    omit('wardrobe', 'outfit_preset', 'Individual garments override the outfit preset.');
  } else if (w.outfit_set) omit('wardrobe', 'outfit_preset', 'The complete outfit set overrides the outfit preset.');
  if (w.dress_style) {
    omit('wardrobe', 'top', 'The selected dress replaces the separate top.');
    omit('wardrobe', 'bottom', 'The selected dress replaces the separate bottom.');
    omit('wardrobe', 'skirt_style', 'The selected dress replaces the separate skirt.');
  } else if (w.skirt_style) omit('wardrobe', 'bottom', 'The selected skirt replaces the separate bottom.');
  const exposure = wardrobeNudity(w);
  if (exposure.mode !== 'use selected outfit' && ['nude', 'topless', 'bottomless'].includes(w.outfit_preset)) {
    omit('wardrobe', 'outfit_preset', 'Clothing coverage overrides the conflicting Bare preset. Choose Use selected outfit to follow that preset.');
  }
  if (exposure.mode === 'lingerie only') {
    const saved = source.wardrobe || {};
    const lingerie = [saved.outfit_set, saved.outfit_preset].find(value => /lingerie|negligee|chemise|babydoll|bra|bralette|knickers|teddy|corselette|corset and garters|sheer bodysuit/i.test(value || ''));
    for (const field of ['outfit_set', 'outfit_set_color', 'outfit_preset', 'dress_style', 'skirt_style', 'top', 'bottom', 'state', 'material', 'garment_pattern', 'fit']) {
      omit('wardrobe', field, 'Lingerie only replaces outer clothing. Your outfit stays saved for other coverage choices.');
    }
    if (lingerie) w.outfit_preset = lingerie;
    else if (!w.underwear || w.underwear === 'none') {
      w.outfit_preset = 'lace lingerie set';
      notes.push({ section: 'wardrobe', field: 'underwear', text: 'Lingerie only uses a lace lingerie set until you select a lingerie detail or preset.' });
    }
  }
  if (exposure.mode === 'lingerie showing') {
    if (!w.underwear || w.underwear === 'none') w.underwear = 'lace lingerie set';
    omit('wardrobe', 'state', 'Lingerie showing opens the outer outfit instead of the separate clothing-state choice.');
  }
  if (exposure.mode === 'partially nude') {
    omit('wardrobe', 'state', 'Partial nudity controls coverage instead of the separate clothing-state choice. Some clothing stays on.');
    if (![w.outfit_set, w.outfit_preset, w.dress_style, w.skirt_style, w.top, w.bottom, w.underwear].some(item => item && item !== 'none')) {
      w.underwear = 'plain briefs';
      notes.push({ section: 'wardrobe', field: 'exposure_mode', text: 'Partial nudity keeps plain briefs on when no garment is selected. Choose a garment to customize the remaining coverage.' });
    }
  }
  if (exposure.removeUpper || exposure.removeLower) {
    const fields = exposure.removeUpper ? ['top', 'dress_style', 'outfit_set', 'outfit_preset', 'state']
      : ['bottom', 'skirt_style', 'dress_style', 'underwear', 'outfit_set', 'outfit_preset', 'state'];
    for (const field of fields) omit('wardrobe', field, 'The custom coverage behavior replaces this garment. Other separate garment selections remain active.');
    if (exposure.removeUpper && /\bbra\b|bralette|lingerie set/i.test(w.underwear || '')) w.underwear = 'lower underwear';
    if (exposure.removeUpper && ![w.bottom, w.skirt_style, w.underwear].some(value=>value && value!=='none')) w.bottom='lower clothing';
    if (exposure.removeLower && !w.top) w.top='upper clothing';
  }
  if (exposure.suppressClothing) {
    for (const field of ['outfit_set', 'outfit_set_color', 'outfit_preset', 'dress_style', 'skirt_style', 'top', 'bottom', 'underwear', 'material', 'garment_color', 'garment_pattern', 'palette', 'fit', 'state']) {
      omit('wardrobe', field, 'Clothing coverage overrides this garment detail. Your selection stays saved; choose Use selected outfit or Open or shifted outfit to include it.');
    }
  } else if (exposure.mode === 'open or shifted outfit') {
    if (![w.outfit_set, w.outfit_preset, w.dress_style, w.skirt_style, w.top, w.bottom, w.underwear].some(item => item && item !== 'none')) {
      notes.push({ section: 'wardrobe', field: 'exposure_mode', text: 'Choose an outfit preset, complete set, or individual garment for Open or shifted outfit.' });
    }
    omit('wardrobe', 'state', 'Open or shifted outfit controls garment position instead of the separate clothing-state choice.');
  }
  if (exposure.mode === 'topless and barefoot' || ['hosiery only', 'jewelry only'].includes(exposure.mode)) {
    for (const field of ['footwear', 'heel_type', 'heel_color', 'heel_height', 'heel_finish']) omit('wardrobe', field, 'The coverage choice removes footwear.');
  }
  if (['topless and barefoot', 'heels only', 'jewelry only'].includes(exposure.mode)) {
    for (const field of ['hosiery_type', 'hosiery_color', 'hosiery_pattern', 'hosiery_denier']) omit('wardrobe', field, 'The coverage choice removes hosiery.');
    omit('feet', 'hosiery', 'The coverage choice removes hosiery.');
    if (exposure.mode === 'topless and barefoot') omit('feet', 'foot_state', 'Barefoot coverage replaces the separate foot-state choice.');
  }
  if (['hosiery only', 'heels only', 'jewelry only'].includes(exposure.mode)) {
    omit('feet', 'foot_state', 'The coverage choice controls foot coverage.');
    omit('wardrobe', 'glasses_style', 'The coverage choice limits remaining accessories.');
    omit('wardrobe', 'glasses_color', 'The coverage choice limits remaining accessories.');
    if (exposure.mode === 'jewelry only') {
      const jewelry = list(w.accessories).filter(item=>/jewel|chain|necklace|choker|earring|\bring\b|bracelet|anklet/i.test(item));
      w.accessories = jewelry;
      const footJewelry = list(f.foot_accessories).filter(item=>/jewel|chain|\bring\b|anklet/i.test(item));
      f.foot_accessories = footJewelry;
    } else {
      omit('wardrobe', 'accessories', 'The coverage choice removes other accessories.');
      omit('feet', 'foot_accessories', 'The coverage choice removes other accessories.');
    }
    if (exposure.mode === 'heels only' && !w.heel_type) {
      omit('wardrobe', 'footwear', 'Heels only replaces the general footwear choice.');
      w.heel_type = 'high heels';
    }
  }
  if (w.outfit_set) {
    let set = w.outfit_set;
    if (w.heel_type || w.footwear) set = set.replace(/\b(?:(?:embroidered|embellished|platform)\s+)?(?:heels|stilettos|pumps|boots|sandals|flats|shoes)\b/gi, '');
    if (w.hosiery_type || f.hosiery) set = set.replace(/\b(?:(?:sheer|seamed|fishnet|lace)\s+)?(?:stockings|thigh-highs)\b/gi, '');
    if (set !== w.outfit_set) {
      w.outfit_set = set.replace(/\b(with|and)\s*(?=,|$)/gi, '').replace(/,\s*(?=,|$)/g, '').replace(/\s+/g, ' ').trim();
      notes.push({ section: 'wardrobe', field: 'outfit_set', text: 'Separate footwear and hosiery selections replace those items in the complete outfit set; the rest of the set stays active.' });
    }
  }
  if (w.heel_type) omit('wardrobe', 'footwear', 'The selected heel type overrides the general footwear choice.');
  if (hasCoveringOuterOutfit(dna) && dna.intimate) {
    for (const field of CONCEALED_ANATOMY_FIELDS) {
      omit('intimate', field, 'Hidden by the selected covering outfit. This detail is omitted from the prompt; your selection stays saved.');
    }
    // A face piercing may remain visible; do not discard it with the
    // details hidden under a covering outer outfit.
    const piercings = list(dna.intimate.piercings);
    const visible = piercings.filter(value => !/\b(?:nipple|navel|labia|clit|genital)\b/i.test(value));
    if (visible.length !== piercings.length) {
      dna.intimate.piercings = Array.isArray(dna.intimate.piercings) ? visible : visible[0] || '';
      notes.push({section:'intimate',field:'piercings',text:'Piercings hidden by the covering outfit are omitted from the prompt; visible piercing selections stay active.'});
    }
  }
  const wardrobeChoices=controls('wardrobe');
  const stateResolution=wardrobeStateResolution(w,wardrobeChoices);
  if (stateResolution.value !== undefined && stateResolution.value !== w.state) {
    if (!stateResolution.value) omit('wardrobe','state',stateResolution.reason);
    else {w.state=stateResolution.value;notes.push({section:'wardrobe',field:'state',text:'The hem adjustment follows the selected garment rather than adding a skirt.'});}
  }
  if (!w.hosiery_type && !(f.hosiery && !['bare','none'].includes(f.hosiery)) && ![w.bottom,w.underwear,w.outfit_set].some(value=>/stockings|hosiery|pantyhose|tights|nylons|socks/i.test(value || ''))) {
    for (const field of ['hosiery_color','hosiery_pattern','hosiery_denier']) omit('wardrobe',field,'Hosiery details require selected stockings, tights or socks.');
  }
  if (!w.heel_type && ![w.footwear,w.outfit_set].some(value=>/heels|heeled|pumps|stiletto|wedges/i.test(value || ''))) {
    for (const field of ['heel_color','heel_height','heel_finish']) omit('wardrobe',field,'Heel details require selected heels or heeled footwear.');
  }
  if (!w.glasses_style && !list(w.accessories).some(value=>/glasses/i.test(value))) omit('wardrobe','glasses_color','Glasses color requires selected glasses.');
  if (w.heel_height==='flat' && /stiletto|platform|kitten|high|heeled|wedge/i.test(w.heel_type || w.footwear || '')) omit('wardrobe','heel_height','The selected heel style overrides a competing flat heel height.');
  if (w.hosiery_type) omit('feet', 'hosiery', 'Wardrobe hosiery controls coverage; the Feet hosiery fallback is inactive.');
  // A saved foot-state covering must participate in visibility checks, even
  // when no dedicated hosiery field was selected.
  if (!w.hosiery_type && !f.hosiery) {
    const covering = list(choice('feet', 'foot_state')).find(value => ['in socks', 'in nylons'].includes(value));
    if (covering) {
      setChoice('feet', 'hosiery', covering === 'in socks' ? 'ankle socks' : 'sheer stockings');
      notes.push({ section: 'feet', field: 'hosiery', text: 'The saved foot-state covering supplies hosiery when no hosiery control is selected.' });
    }
  }

  const footwear = lower(w.heel_type || w.footwear);
  const visibility = footVisibility(controls('wardrobe'), controls('feet'));
  if (visibility.hasHosiery || visibility.hasShoe || f.hosiery) {
    filterChoices('foot_state', value => (value !== 'bare' || visibility.bare)
      && !['in socks', 'in nylons'].includes(value), 'Selected footwear and hosiery control coverage instead of the conflicting foot-state choice.');
  }
  if (list(choice('feet', 'foot_accessories')).some(value => ['toe ring', 'multiple toe rings'].includes(value))) {
    filterChoices('toes', value => value !== 'toe ring', 'Foot accessories controls toe rings instead of repeating the same accessory in Toe details.');
  }
  const presentation = choice('feet', 'sole_presentation');
  if (['wrinkled soles', 'smooth soles', 'detailed toe pads'].includes(presentation) && f.sole_texture) {
    omit('feet', 'sole_presentation', 'Sole texture controls surface appearance; use Sole presentation for position.');
  }
  if (['dirty soles', 'muddy soles', 'freshly washed'].includes(presentation) && list(choice('feet', 'foot_state')).some(value => ['dirty', 'muddy', 'freshly washed'].includes(value))) {
    omit('feet', 'sole_presentation', 'Foot state controls cleanliness instead of the older sole-detail preset.');
  }
  const nailShape = choice('feet', 'toenail_shape');
  if (nailShape && ['long nails', 'sharp claws'].includes(choice('feet', 'pedicure'))) {
    omit('feet', 'pedicure', 'Toenail shape controls nail length instead of the older length-only pedicure preset.');
  }
  if (footwear === 'barefoot' && !visibility.bare) omit('wardrobe', 'footwear', 'Selected hosiery replaces the barefoot description.');
  if (!visibility.toesVisible) {
    for (const field of ['pedicure', 'pedicure_art', 'toenail_shape', 'toe_length', 'toes', 'foot_accessories']) {
      omit('feet', field, 'Hidden by the selected closed footwear or opaque foot covering. Use bare feet, open footwear, or toeless hosiery to show this detail.');
    }
  }
  if (!visibility.soleVisible) {
    for (const field of ['sole_texture', 'arch', 'sole_presentation']) omit('feet', field, 'Footwear or footed hosiery covers the sole. Select bare feet or footless hosiery to show bare sole details.');
  }
  if (!focus && p.action) {
    const toePositions = ['toe curl', 'toe spread', 'toe point', 'toe scrunch', 'big toe out', 'wiggling toes', 'toes flexed', 'toes gripping fabric'];
    if (list(f.toes).some(value => toePositions.includes(value))) {
      f.toes = list(f.toes).filter(value => !toePositions.includes(value));
      notes.push({ section: 'feet', field: 'toes', text: 'The main body pose controls toe position; foot accessories remain available.' });
    }
  }
  if (choice('feet', 'pedicure') === 'natural nails') omit('feet', 'pedicure_art', 'Natural nails takes priority over painted nail art.');
  if (!focus && croppedAboveFeet) for (const field of Object.keys(f)) {
    if (field !== 'composition_mode') omit('feet', field, 'Outside the selected crop. Choose a wider frame or Feet focus to show this detail.');
  }
  const bodyPose = lower(choice('pose','action'));
  const standing = /standing|walking|running|lunging|squatting|crouch/.test(bodyPose);
  const seated = /sitting|seated/.test(bodyPose);
  const stance = lower(f.foot_pose);
  if (focus && bodyPose) {
    const conflictingStance =
      (/walking|standing on tiptoe/.test(stance) && !/standing|walking|running/.test(bodyPose)) ||
      (/feet dangling/.test(stance) && !seated) ||
      (standing && /feet resting on a cushion|soles facing lens/.test(stance));
    if (conflictingStance) omit('feet', 'foot_pose', 'The main body pose controls stance. This foot pose is inactive until you choose a compatible body pose.');
    if (standing && /soles up|soles together|sole showcase|sole toward camera|both soles toward camera|crossed ankles soles visible/.test(lower(f.sole_presentation))) {
      omit('feet', 'sole_presentation', 'This sole presentation needs raised or repositioned feet. The standing or squatting body pose stays primary.');
    }
    if (standing && ['sole close-up', 'POV under foot', 'low angle sole', 'both soles in foreground'].includes(f.framing)) {
      omit('feet', 'framing', 'This under-sole framing conflicts with the weight-bearing pose. Choose a seated or lying pose, or another foot crop.');
    }
  }
  if (/feet dangling/.test(lower(f.foot_pose))) {
    omit('feet', 'ground_surface', 'Dangling feet do not rest on a surface. The scene still supplies the surroundings.');
  }
  if (focus && /toes pointed|toes flexed/.test(lower(f.foot_pose))) {
    const expected = stance === 'toes pointed' ? 'toe point' : 'toes flexed';
    if (list(f.toes).some(v => ['toe curl', 'toe spread', 'toe point', 'toes flexed'].includes(v) && v !== expected)) {
      f.toes = list(f.toes).filter(v => !['toe curl', 'toe spread', 'toe point', 'toes flexed'].includes(v));
      notes.push({ section: 'feet', field: 'toes', text: 'The selected foot pose controls toe position.' });
    }
  }
  if (['from above', 'from below'].includes(choice('pose','angle')) && ['eye-level', 'low', 'high', 'foot level', 'birds-eye'].includes(choice('camera','angle'))) omit('camera', 'angle', 'Pose & framing already controls camera height. The separate Camera height is inactive.');
  const hairStyle=lower(choice('hair','style')),hairLength=choice('hair','length');
  if (/\bbald\b|(?:fully )?shaved head|head (?:fully )?shaved/.test(hairStyle)) for (const field of ['length', 'texture', 'bangs','color']) omit('hair', field, 'The selected bald hairstyle replaces this hair detail.');
  if (/\bbuzz cut\b/.test(hairStyle)) omit('hair','bangs','A buzz cut has no separate bangs.');
  if (/\bbuzz cut\b/.test(hairStyle) && hairLength) omit('hair','length','The buzz cut controls hair length.');
  if (/\bpixie\b/.test(hairStyle) && hairLength && hairLength!=='pixie') omit('hair','length','The pixie haircut replaces the conflicting hair length.');
  if (/\bbob\b/.test(hairStyle) && hairLength==='pixie') omit('hair','length','The selected bob replaces the conflicting pixie length.');
  if (/bun|chignon|ponytail|updo|braid|locs|twists/i.test(hairStyle) && ['pixie', 'short bob'].includes(hairLength)) omit('hair', 'length', 'The selected tied or braided hairstyle replaces the conflicting short haircut.');
  if (/pixie|buzz|bob/i.test(hairStyle) && ['long', 'waist-length'].includes(hairLength)) omit('hair', 'length', 'The selected short hairstyle replaces the conflicting long hair length.');
  if (Number(dna.skin.glow) > 0 && ['matte', 'dewy', 'oiled', 'sweat-glistening', 'satin skin finish'].includes(choice('skin','texture'))) omit('skin', 'texture', 'The Glow slider controls skin finish; the competing finish preset is inactive.');
  if (choice('skin','freckles')==='none' && /\bfreckl(?:ed|es)\b/i.test([choice('skin','texture'),dna.skin.texture].join(' '))) omit('skin','texture','The separate Freckles selection overrides freckles bundled into the skin texture.');
  const environment = lower(choice('scene','environment'));
  const indoor = /bedroom|bathroom|studio|office|living room|kitchen|warehouse/.test(environment);
  const outdoor = /beach|forest|park|garden|street|desert|rooftop|alley/.test(environment);
  if ((indoor && choice('scene','indoor_outdoor') === 'outdoor') || (outdoor && choice('scene','indoor_outdoor') === 'indoor')) omit('scene', 'indoor_outdoor', 'The selected environment controls whether the scene is indoors or outdoors.');
  const surface = lower(choice('feet','ground_surface'));
  const indoorSurface = ['polished wood floor', 'tile floor', 'soft carpet', 'silk sheets', 'velvet cushion', 'marble floor'].includes(surface);
  const outdoorSurface = ['warm sand', 'wet sand', 'grass'].includes(surface);
  const inside = indoor || (!outdoor && choice('scene','indoor_outdoor') === 'indoor');
  const outside = outdoor || (!indoor && choice('scene','indoor_outdoor') === 'outdoor');
  if ((inside && outdoorSurface) || (outside && indoorSurface)) omit('feet', 'ground_surface', 'The selected scene takes priority over a conflicting indoor/outdoor surface under the feet.');
  return { dna, notes };
}

// Exact values survive each compiler's word budget. Numbers express a requested
// visual direction; they do not guarantee a measurable change in the image.
const sliders = [
  ['identity', 'age', 'age', 80], ['physique', 'muscularity', 'muscularity', 100],
  ['physique', 'bust_scale', 'bust size', 100], ['physique', 'implant_volume', 'implant visual size', 5000],
  ['physique', 'butt_scale', 'glute size', 300], ['physique', 'thigh_scale', 'thigh size', 100],
  ['physique', 'hip_scale', 'hip width', 100], ['physique', 'waist_scale', 'waist width', 100],
  ['skin', 'glow', 'skin glow', 100],
  ['scenario', 'explicit_level', 'scenario intensity', 100],
];
export function sliderPromptSignature(dna = {}, existing = "") {
  return sliders.flatMap(([section, key, label, max]) => {
    const raw = dna[section]?.[key];
    if (!Number.isFinite(Number(raw)) || raw === '' || raw === undefined || raw === null) return [];
    const value = Math.max(0, Math.min(max, Number(raw)));
    if (key !== 'age' && !value) return []; // 0 restores the preset.
    if (['bust_scale'].includes(key) && Number(dna.physique?.implant_volume) > 0) return [];
    if (key === 'implant_volume' && !value) return [];
    if (key === 'age') return new RegExp(`\\b${value}(?:-year-old|\\s*(?:years?\\b|yo\\b))`, 'i').test(existing) ? [] : [`age ${value} years`];
    return [`${label} ${value}/${max}`];
  }).join(', ');
}
