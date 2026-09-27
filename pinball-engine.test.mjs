import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,createRace,stepRace,makeMap} from './dist/pinball-engine.mjs';
test('all three courses finish with unique, chronological results at 2 and 50 players',()=>{
  for(const map of MAPS)for(const size of [2,50])for(const length of ['short','standard','long']){
    const names=Array.from({length:size},(_,i)=>`Player ${i}`),race=createRace(names,map.id,length);
    for(let tick=0;tick<120*240&&!race.done;tick++)stepRace(race);
    assert.ok(race.done,`${map.id}/${size}/${length} did not finish`);
    assert.equal(new Set(race.finished.map(b=>b.name)).size,size);
    assert.deepEqual(race.finished.map(b=>b.name).sort(),[...names].sort());
    race.finished.forEach((ball,i)=>{assert.ok(Number.isFinite(ball.x)&&Number.isFinite(ball.y));assert.equal(ball.y,race.map.height);if(i)assert.ok(ball.finishTime>=race.finished[i-1].finishTime);});
    const time=race.time;stepRace(race);assert.equal(race.time,time);
  }
});
test('every compact course combines bumpers, slopes, rotors and boost pads without gates',()=>{
  for(const map of MAPS){const course=makeMap(map.id);assert.ok(course.circles.length>0);assert.ok(course.segments.length>0);assert.ok(course.rotors.length>0);assert.ok(course.pads.length>0);assert.ok(course.height<5000);assert.equal('gates' in course,false);}
  assert.ok(makeMap('garden','short').height<makeMap('garden','standard').height);assert.ok(makeMap('garden','standard').height<makeMap('garden','long').height);
  assert.throws(()=>createRace(['a'],'garden'));assert.throws(()=>createRace(['a','a'],'garden'));assert.throws(()=>createRace(['a','b'],'unknown'));assert.throws(()=>createRace(['a','b'],'garden','unknown'));
});
