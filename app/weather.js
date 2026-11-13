import {locationKey,dayKey} from './location.js';
export const INTERVAL=45*60000;
export function weatherURL(l){
  return 'https://api.open-meteo.com/v1/forecast?latitude='+l.lat.toFixed(4)+'&longitude='+l.lng.toFixed(4)+'&timezone='+encodeURIComponent(l.timezone)+'&timeformat=unixtime&forecast_days=2&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code&daily=temperature_2m_max,temperature_2m_min&temperature_unit=celsius&wind_speed_unit=kmh';
}
function number(v){return typeof v==='number'&&isFinite(v);}
export function normalizeWeather(data,l,now){
  var c=data&&data.current,h=data&&data.hourly,d=data&&data.daily;
  if(!c||!h||!d||!number(c.time)||!number(c.temperature_2m)||!number(c.apparent_temperature)||!number(c.relative_humidity_2m)||!number(c.wind_speed_10m)||!number(c.weather_code))throw new Error('Invalid current weather');
  if(c.time*1000>now+15*60000)throw new Error('Future weather timestamp');
  if(!Array.isArray(h.time)||!Array.isArray(d.time))throw new Error('Invalid forecast');
  var hourly=[];
  h.time.forEach(function(t,i){if(number(t)&&number(h.temperature_2m[i])&&number(h.weather_code[i]))hourly.push({time:t*1000,temp:h.temperature_2m[i],code:h.weather_code[i]});});
  var daily=[];d.time.forEach(function(t,i){if(number(t)&&number(d.temperature_2m_max[i])&&number(d.temperature_2m_min[i]))daily.push({day:dayKey(new Date(t*1000),l),high:d.temperature_2m_max[i],low:d.temperature_2m_min[i]});});
  if(!hourly.length||!daily.length)throw new Error('Empty forecast');
  return {key:locationKey(l),fetched:now,observed:c.time*1000,temp:c.temperature_2m,feels:c.apparent_temperature,humidity:c.relative_humidity_2m,wind:c.wind_speed_10m,code:c.weather_code,day:c.is_day===1,hourly:hourly,daily:daily};
}
export function validCache(w,l){return !!w&&w.key===locationKey(l)&&number(w.fetched)&&number(w.observed)&&number(w.temp)&&number(w.feels)&&number(w.humidity)&&number(w.wind)&&number(w.code)&&Array.isArray(w.hourly)&&Array.isArray(w.daily)&&w.hourly.every(function(h){return h&&number(h.time)&&number(h.temp)&&number(h.code);})&&w.daily.every(function(d){return d&&typeof d.day==='string'&&number(d.high)&&number(d.low);});}
export function isStale(w,now){return !w||now-w.observed>=3600000||now-w.fetched>=3600000||now<w.fetched||now<w.observed;}
export function temperature(c,unit){return number(c)?Math.round(unit==='f'?c*9/5+32:c)+'°'+(unit==='f'?'F':'C'):'—';}
export function sky(code,en){
  if(code===0)return en?'Clear':'صافٍ';
  if(code<=3)return en?'Cloudy':'غائم';
  if(code===45||code===48)return en?'Fog':'ضباب';
  if(code>=95)return en?'Thunderstorms':'عواصف رعدية';
  if((code>=71&&code<=77)||code===85||code===86)return en?'Snow':'ثلوج';
  if(code>=51&&code<=82)return en?'Rain':'أمطار';
  return en?'Unknown':'غير معروف';
}
// Original text/vector-like symbols; no external icon assets or fonts.
export function skyIcon(code){return code===0?'☀':code<=3?'☁':code===45||code===48?'≋':code>=95?'ϟ':code>=71&&code<=77?'❄':'☂';}
