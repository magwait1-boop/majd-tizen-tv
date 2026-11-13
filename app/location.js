import moment from 'moment-timezone';
import cities from './cities.json' with {type:'json'};

export const zones=moment.tz.names();
export const tzVersion=moment.tz.dataVersion;
export function currentTime(){
  try{
    if(typeof tizen!=='undefined'&&tizen.time){
      var t=tizen.time.getCurrentDateTime();
      // TZDate has UTC getters, but does not implement Date.getTime().
      var value=Date.UTC(t.getUTCFullYear(),t.getUTCMonth(),t.getUTCDate(),t.getUTCHours(),t.getUTCMinutes(),t.getUTCSeconds(),t.getUTCMilliseconds());
      if(isFinite(value))return new Date(value);
    }
  }catch(e){}
  return new Date();
}
export function validLocation(l){
  return !!l && typeof l.lat==='number' && isFinite(l.lat) && Math.abs(l.lat)<=90 &&
    typeof l.lng==='number' && isFinite(l.lng) && Math.abs(l.lng)<=180 &&
    typeof l.name==='string' && l.name.length>0 && l.name.length<=120 &&
    typeof l.country==='string' && typeof l.timezone==='string' && !!moment.tz.zone(l.timezone);
}
export function locationKey(l){return l.lat.toFixed(4)+','+l.lng.toFixed(4)+'|'+l.timezone;}
export function cityLabel(l){
  if(!l)return '';
  var parts=[l.name];
  if(l.region&&l.region!==l.name)parts.push(l.region);
  if(l.country&&l.country!==l.name&&l.country!==l.region)parts.push(l.country);
  return parts.join(' · ');
}
export function suggestedMethod(code){
  var map={SA:'UmmAlQura',EG:'Egyptian',PK:'Karachi',BD:'Karachi',IN:'Karachi',AE:'Dubai',KW:'Kuwait',QA:'Qatar',TR:'Turkey',US:'NorthAmerica',CA:'NorthAmerica',SG:'Singapore',MY:'Singapore'};
  return map[code]||'MuslimWorldLeague';
}
export function legacyCity(id){
  var c=cities.filter(function(x){return x.id===id;})[0]||cities.filter(function(x){return x.id==='riyadh';})[0];
  return {id:c.id,name:c.name,country:c.country,region:c.region||'',code:c.code||(c.offset===2?'EG':'SA'),lat:c.lat,lng:c.lng,timezone:c.timezone||(c.offset===2?'Africa/Cairo':'Asia/Riyadh'),source:'offline'};
}
export function fromGeo(r){
  if(!r||typeof r!=='object')return null;
  var l={name:String(r.name||'').slice(0,120),country:String(r.country||r.country_code||'').slice(0,120),region:String(r.admin1||'').slice(0,120),code:String(r.country_code||'').toUpperCase(),lat:r.latitude,lng:r.longitude,timezone:r.timezone,source:'GeoNames'};
  return validLocation(l)?l:null;
}
export function fromIP(r){
  if(!r||typeof r!=='object')return null;
  var l={name:String(r.city||r.region||r.country||'').slice(0,120),country:String(r.country||'').slice(0,120),region:String(r.region||'').slice(0,120),code:String(r.country_code||'').toUpperCase(),lat:r.latitude,lng:r.longitude,timezone:r.timezone,source:'IP.SB'};
  return validLocation(l)?l:null;
}
export function offsetAt(date,location){return -moment.tz.zone(location.timezone).utcOffset(+date)/60||0;}
export function localParts(date,location){
  var d=new Date(+date+offsetAt(date,location)*3600000);
  return {year:d.getUTCFullYear(),month:d.getUTCMonth(),day:d.getUTCDate(),hour:d.getUTCHours(),minute:d.getUTCMinutes(),second:d.getUTCSeconds()};
}
export function dayKey(date,location){var p=localParts(date,location);return p.year+'-'+(p.month+1)+'-'+p.day;}
export function clock(date,location,seconds,hour12,lang){
  if(!date||!isFinite(+date))return '—';
  var p=localParts(date,location);function pad(v){return v<10?'0'+v:String(v);}
  var h=p.hour,suffix='';
  if(hour12){
    suffix=h>=12?(lang==='en'?' PM':' م'):(lang==='en'?' AM':' ص');
    h=h%12||12;
  }
  return pad(h)+':'+pad(p.minute)+(seconds?':'+pad(p.second):'')+suffix;
}
