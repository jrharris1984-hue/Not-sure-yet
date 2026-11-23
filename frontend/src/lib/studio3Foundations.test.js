import {createLook3,applyLook3,compareLooks3} from './studio3WardrobeScenes';
import {directorPlan3,directorApplySuggestion3,directorFramesFromPlan3,directorFramesToPlan3} from './studio3Director';
import {videoTimeline3,addVideoClip3,updateVideoClip3,removeVideoClip3,moveVideoClip3,timelineDuration3,validateVideoTimeline3} from './studio3VideoTimeline';
import {generationPreflight3,workflowCompatibility3} from './studio3GenerationPreflight';
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
test('director frames adapt to Studio 3 shots without changing disabled or unsupported controls',()=>{
 const plan={shots:[{id:'a',enabled:true,pose:'standing',subjectView:null,cameraAngle:null,outfit:null,scene:{environment:'studio'},lighting:{style:'soft'}},{id:'b',enabled:false,pose:'walking',scene:{},lighting:{}}]};
 expect(directorFramesFromPlan3(plan)).toHaveLength(1);
 const next=directorFramesToPlan3(plan,[{pose_action:'walking',view:'back',camera_height:'low',outfit_preset:'jacket',environment:'loft',lighting_source:'window'}],{choices:{poses:['walking'],views:['back'],cameras:['low'],outfits:['jacket']}});
 expect(next.shots[0]).toMatchObject({pose:'walking',subjectView:'back',cameraAngle:'low',outfit:'jacket',scene:{environment:'loft'},lighting:{style:'soft',source:'window'}});
 expect(next.shots[1]).toEqual(plan.shots[1]);
 expect(plan.shots[0].pose).toBe('standing');
});
test('video timeline computes duration without modifying source',()=>{
 const t=videoTimeline3({fps:24});
 const next=addVideoClip3(t,{frames:48});
 expect(t.clips).toHaveLength(0);
 expect(timelineDuration3(next)).toBe(2);
});
test('video timeline edits clips immutably and validates prompt and duration',()=>{
 const original=videoTimeline3({fps:24});const first=addVideoClip3(original,{prompt:'A woman walks',frames:48});const second=addVideoClip3(first,{motion:'Camera pans left',frames:24});
 const edited=updateVideoClip3(second,'clip-2',{prompt:'Camera pans left'});const moved=moveVideoClip3(edited,1,0);
 expect(timelineDuration3(moved)).toBe(3);
 expect(validateVideoTimeline3(moved)).toEqual([]);
 expect(original.clips).toHaveLength(0);
 expect(removeVideoClip3(moved,'clip-1').clips).toHaveLength(1);
 expect(validateVideoTimeline3(addVideoClip3(original))).toContain('Clip 1: add a prompt or motion description.');
});
test('preflight blocks wrong workflow and bad seed',()=>{
 expect(generationPreflight3({workflow:{id:'x',kind:'video'},seed:-1}).ready).toBe(false);
});
test('video workflow kinds are compatible only with video generation',()=>{
 expect(workflowCompatibility3({kind:'text_video'},'text-to-video').compatible).toBe(true);
 expect(workflowCompatibility3({kind:'video'},'i2v').compatible).toBe(true);
 expect(workflowCompatibility3({kind:'image'},'text_video').compatible).toBe(false);
 expect(workflowCompatibility3({id:'legacy'},'text_video').compatible).toBe(true);
 expect(generationPreflight3({workflow:{id:'i2v',kind:'video'},kind:'image-to-video'}).errors).toContain('Choose a starting image for image-to-video generation.');
 expect(generationPreflight3({workflow:{id:'i2v',kind:'video'},kind:'image-to-video',sourceImage:'input/start.png'}).ready).toBe(true);
});
test('blank seeds remain optional while nonnumeric seeds are rejected',()=>{
 expect(generationPreflight3({workflow:{id:'image',kind:'image'},seed:''}).ready).toBe(true);
 expect(generationPreflight3({workflow:{id:'image',kind:'image'},seed:'not-a-seed'}).errors).toContain('Seed must be a nonnegative integer.');
});
test('guided navigation is bounded',()=>{
 expect(nextStudio3Step('results',1)).toBe('results');
 expect(nextStudio3Step('start',-1)).toBe('start');
 expect(STUDIO3_STEPS.map(s=>s.id)).toContain('review');
});
