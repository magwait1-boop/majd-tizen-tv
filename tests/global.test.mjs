import test from 'node:test';
import assert from 'node:assert/strict';
import {offsetAt,localParts,legacyCity,validLocation,fromGeo,fromIP,clock,cityLabel} from '../app/location.js';
import {migrate} from '../app/preferences.js';
import {schedule} from '../app/prayer.js';
import {normalizeWeather,isStale,temperature,validCache} from '../app/weather.js';
import reference from './prayer-reference.json' with {type:'json'};
test('independent AlAdhan reference for Riyadh and Cairo: within one minute',()=>{
 for(const r of reference){const l=legacyCity(r.city),s=schedule(new Date(r.date+'T00:00:00Z'),l,migrate({city:r.city,method:r.method}));
 const minute=v=>Number(v.slice(0,2))*60+Number(v.slice(3,5));s.times.forEach((t,i)=>assert.ok(Math.abs(minute(clock(t,l))-minute(r.reference[i]))<=1));}
});
test('IANA DST boundaries, half-hour zones and host-independent dates',()=>{
 const cases=[['Africa/Cairo','2026-04-23T21:59:00Z',2],['Africa/Cairo','2026-04-23T22:00:00Z',3],['Europe/London','2026-03-29T00:59:00Z',0],['Europe/London','2026-03-29T01:00:00Z',1],['America/New_York','2026-03-08T06:59:00Z',-5],['America/New_York','2026-03-08T07:00:00Z',-4],['Asia/Kolkata','2026-01-01T00:00:00Z',5.5],['Asia/Kathmandu','2026-01-01T00:00:00Z',5.75]];
 cases.forEach(([timezone,date,expected])=>assert.equal(offsetAt(new Date(date),{timezone}),expected));
 assert.equal(localParts(new Date('2026-01-01T23:00:00Z'),{timezone:'Asia/Riyadh'}).day,2);
});
test('migration preserves old city, method, favorites and theme without granting consent',()=>{
 const p=migrate({city:'cairo',method:'Egyptian',offset:2,night:true,favorites:['a','b','a'],hour12:true,station:{name:'إذاعة القرآن',url:'https://qurango.net/radio/tarateel'}});
 assert.equal(p.location.timezone,'Africa/Cairo');assert.equal(p.location.name,'القاهرة');assert.equal(p.method,'Egyptian');assert.deepEqual(p.favorites,['a','b']);assert.equal(p.night,true);assert.equal(p.hour12,true);assert.equal(p.station.name,'إذاعة القرآن');assert.equal(p.setup,true);assert.deepEqual(p.consent,{ip:false,search:false,weather:false,radio:false});assert.equal(migrate(null).setup,false);
 assert.equal(migrate({schema:2,autoLocation:true,consent:{ip:false}}).autoLocation,false);
});
test('reject missing coordinates, invalid zones, NaN and malformed service locations',()=>{
 assert.equal(validLocation({...legacyCity('cairo'),lat:NaN}),false);
 assert.equal(validLocation({...legacyCity('cairo'),timezone:'Bad/Zone'}),false);
 assert.equal(fromIP({country:'Unknown',latitude:null,longitude:0,timezone:'UTC'}),null);
 assert.equal(fromGeo({name:'Test',latitude:91,longitude:0,timezone:'UTC'}),null);
});
test('minute corrections applied to each prayer; astronomical instants independent of DST offset',()=>{
 const l=legacyCity('cairo'),p=migrate({city:'cairo',method:'Egyptian'}),date=new Date('2026-04-24T08:00:00Z');
 const a=schedule(date,l,p),b=schedule(date,l,{...p,adjustments:[1,-2,3,-4,5,6]});
 b.times.forEach((t,i)=>assert.equal(+t-+a.times[i],[1,-2,3,-4,5,6][i]*60000));
 assert.equal(clock(new Date('2026-04-24T09:00:00Z'),l),'12:00');
 assert.equal(clock(new Date('2026-04-24T12:00:00Z'),l,false,true,'ar'),'03:00 م');
 assert.equal(clock(new Date('2026-04-24T12:00:00Z'),l,false,true,'en'),'03:00 PM');
 assert.equal(cityLabel({name:'بريدة',region:'القصيم',country:'السعودية'}),'بريدة · القصيم · السعودية');
});
test('global offline locations including Southern Hemisphere and polar failure state',()=>{
 for(const [lat,lng,timezone] of [[-33.87,151.21,'Australia/Sydney'],[40.71,-74,'America/New_York'],[-6.2,106.8,'Asia/Jakarta'],[51.5,-.12,'Europe/London']]){
  const l={...legacyCity('riyadh'),lat,lng,timezone};const s=schedule(new Date('2026-11-11T08:00:00Z'),l,migrate({method:'MuslimWorldLeague'}));assert.ok(s.when>new Date('2026-11-11T08:00:00Z'));assert.ok(s.times.every(t=>isFinite(+t)));
 }
 const p=schedule(new Date('2026-06-21T08:00:00Z'),{...legacyCity('riyadh'),lat:89,lng:0,timezone:'UTC'},migrate(null));assert.equal(p.incomplete,true);
});
test('weather rejects missing data, caches by location and labels stale data',()=>{
 const now=Date.parse('2026-11-11T08:00:00Z'),l=legacyCity('riyadh');
 const data={current:{time:now/1000,temperature_2m:25,apparent_temperature:26,relative_humidity_2m:45,wind_speed_10m:10,weather_code:0,is_day:1},hourly:{time:[now/1000+3600],temperature_2m:[27],weather_code:[1]},daily:{time:[Date.parse('2026-11-10T21:00:00Z')/1000],temperature_2m_max:[30],temperature_2m_min:[18]}};
 const w=normalizeWeather(data,l,now);assert.equal(validCache(w,l),true);assert.equal(validCache(w,legacyCity('cairo')),false);assert.equal(isStale(w,now),false);assert.equal(isStale(w,now+3600000),true);assert.equal(temperature(0,'f'),'32°F');assert.throws(()=>normalizeWeather({...data,current:{...data.current,temperature_2m:null}},l,now));
});