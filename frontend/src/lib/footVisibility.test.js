import { footVisibility } from './footVisibility';
import { resolveBuilderControls } from './builderControlResolution';
import { compileModelPrompts } from './modelPromptCompilers';
test.each(['open-toe heels','peep-toe heels','strappy sandals'])('%s keeps toes and pedicure but hides soles', heel_type => {
  const source={wardrobe:{heel_type,footwear:'barefoot'},feet:{composition_mode:'feet focus',framing:'full body',pedicure:'painted red',sole_texture:'smooth soles',sole_presentation:'soles toward camera'},pose:{distance:'full body'}};
  const result=resolveBuilderControls(source);
  expect(result.dna.feet.pedicure).toBe('painted red');expect(result.dna.feet.sole_texture).toBe('');expect(result.dna.feet.sole_presentation).toBe('');
  expect(result.dna.wardrobe.footwear).toBe('');expect(source.wardrobe.footwear).toBe('barefoot');
  expect(result.notes.length).toBeGreaterThan(0);
});
test.each(['stiletto heels','kitten heels','platform heels','round-toe pumps','combat boots'])('%s does not assume exposed toes', footwear => {
  expect(footVisibility({footwear}).toesVisible).toBe(false);
  const dna={identity:{age:30,gender:'female'},wardrobe:{footwear},feet:{composition_mode:'feet focus',framing:'full body',pedicure:'painted red'},pose:{distance:'full body'}};
  expect(compileModelPrompts({promptStyle:'chroma',dna}).positive).not.toContain('painted red');
});
test('toeless hosiery exposes toes but covers sole; footless leaves the feet bare', () => {
  expect(footVisibility({hosiery_type:'toeless tights'})).toMatchObject({toesVisible:true,soleVisible:false,bare:false});
  expect(footVisibility({hosiery_type:'footless tights',footwear:'barefoot'})).toMatchObject({toesVisible:true,soleVisible:true,bare:true});
  expect(footVisibility({hosiery_type:'opaque tights'})).toMatchObject({toesVisible:false,soleVisible:false,bare:false});
});
