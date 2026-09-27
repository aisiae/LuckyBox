import {test} from 'node:test';
import assert from 'node:assert/strict';
import {MAPS,createRace,stepRace,makeMap,rotorSegment} from './dist/pinball-engine.mjs';
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
test('every dramatic course combines bumpers, slopes, rotors and shuffle zones without gates',()=>{
  for(const map of MAPS){const course=makeMap(map.id);assert.ok(course.circles.length>0);assert.ok(course.segments.length>0);assert.ok(course.rotors.length>0);assert.ok(course.pads.length>0);assert.ok(course.dramaZones.length>=6);assert.ok(course.height<7000);assert.equal('gates' in course,false);}
  assert.ok(makeMap('garden','short').height<makeMap('garden','standard').height);assert.ok(makeMap('garden','standard').height<makeMap('garden','long').height);
  assert.throws(()=>createRace(['a'],'garden'));assert.throws(()=>createRace(['a','a'],'garden'));assert.throws(()=>createRace(['a','b'],'unknown'));assert.throws(()=>createRace(['a','b'],'garden','unknown'));
});
test('recommended races last about a minute and repeatedly change leaders',()=>{
  for(const map of MAPS){
    const race=createRace(Array.from({length:8},(_,i)=>`Runner ${i}`),map.id,'standard');
    for(let tick=0;tick<120*100&&!race.done;tick++)stepRace(race);
    assert.ok(race.done,`${map.id} did not finish`);
    assert.ok(race.time>=48&&race.time<=95,`${map.id} duration was ${race.time}`);
    assert.ok(race.leadChanges>=3,`${map.id} changed leader only ${race.leadChanges} times`);
    assert.ok(race.finished[0].finishTime>=43,`${map.id} winner arrived too early`);
  }
});
test('an upward-moving rotor grabs a ball and carries it upward before release',()=>{
  const race=createRace(['A','B'],'garden','standard'),ball=race.balls[0],rotor=race.map.rotors[0],moving=rotorSegment(rotor,1/120);
  const contact=[[moving.ax,moving.ay],[moving.bx,moving.by]].map(([x,y])=>({x,y,vy:(x-rotor.x)*rotor.speed})).sort((a,b)=>a.vy-b.vy)[0];
  ball.x=contact.x;ball.y=contact.y;ball.vx=0;ball.vy=0;race.balls[1].x=50;race.balls[1].y=0;
  const startY=ball.y;let grabbed=false,minY=startY;
  for(let tick=0;tick<180;tick++){stepRace(race);grabbed||=Boolean(ball.grab);minY=Math.min(minY,ball.y);}
  assert.ok(grabbed);assert.ok(minY<startY-60);assert.ok(race.rotorLifts>=1);assert.equal(ball.grab,null);
});
