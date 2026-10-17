import {RANDOMIZER_SUITES,proposeRandomizer} from './randomizerSuites';
import {previewPerson} from './workspacePreview';
const person=()=>previewPerson();
test('offers a substantial suite library without duplicate IDs',()=>{
  expect(RANDOMIZER_SUITES.length).toBeGreaterThanOrEqual(25);
  expect(new Set(RANDOMIZER_SUITES.map(s=>s.id)).size).toBe(RANDOMIZER_SUITES.length);
});
test('preview never mutates the source, preserves identity by default, and varies selected fields only',()=>{
  const people=[person(),person()],before=JSON.stringify(people);
  const result=proposeRandomizer(people,'hair-color',{active:1});
  expect(result.issues).toEqual([]);expect(result.changes.length).toBeGreaterThan(0);
  expect(JSON.stringify(people)).toBe(before);expect(result.people[0]).toEqual(people[0]);
  expect(result.people[1].dna.identity).toEqual(people[1].dna.identity);
  expect(result.changes.every(c=>c.section==='hair' && c.field==='color')).toBe(true);
});
test('locked fields and sections survive whole setup suites; temporary keep locks are not persisted',()=>{
  const p=person();p.locks={hair:true};p.field_locks={face:{eye_color:true}};
  const result=proposeRandomizer([p],'whole',{keepBody:true});
  expect(result.issues).toEqual([]);expect(result.people[0].dna.hair).toEqual(p.dna.hair);
  expect(result.people[0].dna.physique).toEqual(p.dna.physique);
  expect(result.people[0].dna.face.eye_color).toBe(p.dna.face.eye_color);
  expect(result.people[0].locks).toEqual(p.locks);
});
test('shared scene suites coordinate everyone while keeping their identity and outfits',()=>{
  const people=[person(),person()];const result=proposeRandomizer(people,'city');
  expect(result.issues).toEqual([]);
  expect(result.people.every(p=>p.dna.scene.environment==='urban street' && p.dna.scene.indoor_outdoor==='outdoor')).toBe(true);
  expect(result.people[1].dna.camera).toEqual(result.people[0].dna.camera);
  result.people.forEach((p,i)=>expect(p.dna.wardrobe).toEqual(people[i].dna.wardrobe));
});
test('contradictory locked scene choices keep the original setup and return a reason',()=>{
  const p=person();p.dna.scene={...p.dna.scene,environment:'beach',indoor_outdoor:'indoor'};p.locks={scene:true};
  const result=proposeRandomizer([p],'city');expect(result.changes).toEqual([]);expect(result.issues.length).toBeGreaterThan(0);expect(result.people).toBeDefined();
});
test('all suites preserve cast count, notes and identity, and return consistent proposals',()=>{
  for(const s of RANDOMIZER_SUITES){const p=person();p.dna.scene.extra='Keep my backdrop note';const result=proposeRandomizer([p],s.id);
    expect(result.people).toHaveLength(1);expect(result.people[0].name).toBe(p.name);
    expect(result.people[0].dna.identity).toEqual(p.dna.identity);expect(result.people[0].dna.scene.extra).toBe('Keep my backdrop note');
    expect(result.issues.every(issue=>issue.includes('No unlocked choices'))).toBe(true);
  }
});
