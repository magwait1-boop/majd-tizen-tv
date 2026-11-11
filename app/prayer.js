import { PrayerTimes, Coordinates, CalculationMethod, Madhab } from 'adhan';
export const names = ['الفجر','الشروق','الظهر','العصر','المغرب','العشاء'];
export const methods = ['UmmAlQura','Egyptian','MuslimWorldLeague','Karachi'];
export const methodNames = ['أم القرى','الهيئة المصرية للمساحة','رابطة العالم الإسلامي','كراتشي'];
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
  var day=civil(now,prefs.offset), params=CalculationMethod[prefs.method]();
  params.madhab=prefs.hanafi ? Madhab.Hanafi : Madhab.Shafi;
  var evening=new Date(day); evening.setDate(day.getDate()+1);
  if(prefs.method==='UmmAlQura' && hijri(evening,prefs.hijriOffset).month===9) params.ishaInterval=120;
  function at(d){var p=new PrayerTimes(new Coordinates(city.lat,city.lng),d,params);return [p.fajr,p.sunrise,p.dhuhr,p.asr,p.maghrib,p.isha];}
  var times=at(day), next=-1;
  times.forEach(function(t,i){if(next<0 && i!==1 && t>now) next=i;});
  var when=next>=0?times[next]:null;
  if(next<0){next=0;when=at(evening)[0];}
  var hd=new Date(day); if(now>=times[4]) hd.setDate(hd.getDate()+1);
  return {times:times,next:next,when:when,hijri:hijri(hd,prefs.hijriOffset),day:day};
}
