import {addVideoClip3,queueableVideoClips3,videoTimeline3} from './studio3VideoTimeline';

test('builds stable ordered queue payloads from enabled clips',()=>{
 let timeline=videoTimeline3({name:'Night editorial',fps:30,workflowId:'wan-1'});
 timeline=addVideoClip3(timeline,{id:'clip-a',label:'Opening',frames:81,prompt:'A person enters',motion:'Slow tracking shot'});
 timeline=addVideoClip3(timeline,{id:'clip-b',label:'Skipped',enabled:false,frames:41,prompt:'Do not queue'});
 timeline=addVideoClip3(timeline,{id:'clip-c',label:'Close',frames:41,motion:'Gentle camera push'});
 expect(queueableVideoClips3(timeline,'sequence-1')).toEqual([
  {sequenceId:'sequence-1',sequenceLabel:'Night editorial',clipId:'clip-a',clipLabel:'Opening',clipIndex:0,instruction:'A person enters\nSlow tracking shot',frames:81,fps:30},
  {sequenceId:'sequence-1',sequenceLabel:'Night editorial',clipId:'clip-c',clipLabel:'Close',clipIndex:2,instruction:'Gentle camera push',frames:41,fps:30},
 ]);
});

test('does not queue empty or invalid timelines',()=>{
 const empty=videoTimeline3();
 expect(queueableVideoClips3(empty,'sequence-empty')).toEqual([]);
 const timeline=addVideoClip3(empty,{frames:41});
 expect(queueableVideoClips3(timeline,'sequence-invalid')).toEqual([]);
});
