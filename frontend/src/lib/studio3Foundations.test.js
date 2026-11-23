import {createLook3,applyLook3,compareLooks3} from './studio3WardrobeScenes';
import {directorPlan3,directorApplySuggestion3} from './studio3Director';
import {videoTimeline3,addVideoClip3,timelineDuration3} from './studio3VideoTimeline';
import {generationPreflight3} from './studio3GenerationPreflight';
import {STUDIO3_STEPS,nextStudio3Step} from './studio3Navigation';
test('look edits preserve original character and unrelated fields',()=>{
 const dna={identity:{name:'A'},wardrobe:{outfit:'dress'},scene:{location:'studio'}};
 const next=applyLook3(dna,createLook3({wardrobe:{outfit:'jacket'}}));
 expect(next.identity).toEqual(dna.identity);
 expect(next.scene.location).toBe('studio');
 expect(dna.wardrobe.outfit).toBe('dress');
 expect(compareLooks3(dna,next)).toContain('wardrobe.outfit');
});
test('director suggestion updates only one shot',()=>{
 const p=directorPlan3({shotCount:2});
 const next=directorApplySuggestion3(p,'director-1',{scene:{location:'loft'}});
 expect(next.shots[0].scene.location).toBe('loft');
 expect(next.shots[1].scene.location).toBeUndefined();
});
test('video timeline computes duration without modifying source',()=>{
 const t=videoTimeline3({fps:24});
 const next=addVideoClip3(t,{frames:48});
 expect(t.clips).toHaveLength(0);
 expect(timelineDuration3(next)).toBe(2);
});
test('preflight blocks wrong workflow and bad seed',()=>{
 expect(generationPreflight3({workflow:{id:'x',kind:'video'},seed:-1}).ready).toBe(false);
});
test('guided navigation is bounded',()=>{
 expect(nextStudio3Step('results',1)).toBe('results');
 expect(nextStudio3Step('start',-1)).toBe('start');
 expect(STUDIO3_STEPS.map(s=>s.id)).toContain('review');
});
