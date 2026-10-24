const {test}=require('node:test');
const assert=require('node:assert/strict');
const {createFixtures}=require('./fixtures.cjs');
test('character edits and renders remain inside the fixture',()=>{
  const fixture=createFixtures();
  const saved=fixture.response('POST','/characters',{name:'UI sample'}).body;
  assert.equal(fixture.response('GET',`/characters/${saved.id}`).body.name,'UI sample');
  assert.equal(fixture.response('POST','/renders/dispatch').body.status,'done');
  assert.equal(fixture.dispatches,1);
  assert.equal(createFixtures().dispatches,0);
});
test('unknown mutations fail closed',()=>{
  assert.equal(createFixtures().response('DELETE','/characters/real').status,501);
});
