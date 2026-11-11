import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {schedule,hijri,methods} from '../app/prayer.js';
const cities=JSON.parse(readFileSync(new URL('../app/cities.json',import.meta.url)));
const prefs={offset:3,method:'UmmAlQura',hanafi:false,hijriOffset:0};
const riyadh=cities.find(c=>c.id==='riyadh');
test('every supported city/method produces ordered finite times throughout the year',()=>{
 for(const city of cities)for(const method of methods)for(let m=0;m<12;m++){
  const p=schedule(new Date(Date.UTC(2026,m,15)),city,{...prefs,offset:city.offset,method});
  p.times.forEach((t,i)=>{assert.ok(Number.isFinite(+t));if(i)assert.ok(t>p.times[i-1]);});
  assert.ok(p.when>new Date(Date.UTC(2026,m,15)));
 }
});
test('sunrise is not the next prayer; after isha rolls to tomorrow fajr',()=>{
 const p=schedule(new Date('2026-11-11T00:00:00Z'),riyadh,prefs);
 assert.equal(schedule(new Date(+p.times[0]+1000),riyadh,prefs).next,2);
 const n=schedule(new Date(+p.times[5]+1000),riyadh,prefs);
 assert.equal(n.next,0);assert.ok(+n.when>+p.times[5]);
});
test('civil Hijri epoch and month boundaries',()=>{
 assert.deepEqual(hijri(new Date(2024,6,8,12),0),{year:1446,month:1,day:1});
 for(let d=0;d<730;d++){let h=hijri(new Date(2025,0,1+d),0);assert.ok(h.month>=1&&h.month<=12);assert.ok(h.day>=1&&h.day<=30);}
});
test('Hanafi afternoon is later; UmmAlQura Ramadan has two-hour isha',()=>{
 let n=new Date('2026-02-25T00:00:00Z');
 let p=schedule(n,riyadh,prefs),h=schedule(n,riyadh,{...prefs,hanafi:true});
 assert.ok(h.times[3]>p.times[3]);assert.equal((p.times[5]-p.times[4])/60000,120);
});
test('Egypt DST changes display offset, not the solar instant',()=>{
 let city=cities[0],n=new Date('2026-06-01T08:00:00Z');
 let a=schedule(n,city,{...prefs,method:'Egyptian',offset:2});
 let b=schedule(n,city,{...prefs,method:'Egyptian',offset:3});
 assert.deepEqual(a.times,b.times);
});
