import { PrayerTimes, Coordinates, CalculationMethod, Madhab } from 'adhan';
import {offsetAt,localParts} from './location.js';
export const names = ['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];
export const methods = ['UmmAlQura','Egyptian','MuslimWorldLeague','Karachi','NorthAmerica','Dubai','Kuwait','Qatar','Singapore','Turkey','MoonsightingCommittee'];
export const methodNames = ['أم القرى','الهيئة المصرية للمساحة','رابطة العالم الإسلامي','كراتشي','أمريكا الشمالية','دبي','الكويت','قطر','سنغافورة','تركيا','لجنة رؤية الهلال'];
export const englishNames=['Fajr','Sunrise','Dhuhr','Asr','Maghrib','Isha'];
export function civil(now, offset) {
  var d = new Date(now.getTime() + offset * 3600000);
  return new Date(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 12);
}
// Arithmetic civil Hijri calendar. Local moon sighting can differ.
export function hijri(date, adjustment) {
  var jd = Math.floor(Date.UTC(date.getFullYear(),date.getMonth(),date.getDate()) / 86400000) + 2440587.5 + adjustment;
  var year = Math.floor((30 * (jd - 1948439.5) + 10646) / 10631);
  function first(y,m){return 1 + Math.ceil(29.5*(m-1)) + (y-1)*354 + Math.floor((3+11*y)/30) + 1948439.5 - 1;}
  var month = Math.min(12, Math.ceil((jd - (29 + first(year,1))) / 29.5) + 1);
  return {year:year,month:month,day:Math.round(jd-first(year,month)+1)};
}
export function schedule(now, city, prefs) {
  var offset=city.timezone?offsetAt(now,city):prefs.offset;
  var day=civil(now,offset);
  var evening=new Date(day); evening.setDate(day.getDate()+1);
  function at(d){
    var params=CalculationMethod[prefs.method]();params.madhab=prefs.hanafi?Madhab.Hanafi:Madhab.Shafi;
    var hd=new Date(d);hd.setDate(hd.getDate()+1);
    if(prefs.method==='UmmAlQura'&&hijri(hd,prefs.hijriOffset).month===9)params.ishaInterval=120;
    var p=new PrayerTimes(new Coordinates(city.lat,city.lng),d,params);
    return [p.fajr,p.sunrise,p.dhuhr,p.asr,p.maghrib,p.isha].map(function(t,i){return new Date(+t+((prefs.adjustments||[])[i]||0)*60000);});
  }
  var times=at(day),next=-1,when=null;
  var previous=new Date(day);previous.setDate(previous.getDate()-1);
  [at(previous),times,at(evening)].forEach(function(list){list.forEach(function(t,i){if(i!==1&&isFinite(+t)&&t>now&&(!when||t<when)){next=i;when=t;}});});
  var hd=new Date(day); if(now>=times[4]) hd.setDate(hd.getDate()+1);
  return {times:times,next:next,when:when,hijri:hijri(hd,prefs.hijriOffset),day:day,incomplete:times.some(function(t){return !isFinite(+t);})};
}
