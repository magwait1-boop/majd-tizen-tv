import {legacyCity,validLocation,suggestedMethod} from './location.js';
import {methods} from './prayer.js';
export const KEY='majd.tv.preferences.v1';
export function migrate(raw){
  var p={schema:2,city:'riyadh',location:legacyCity('riyadh'),setup:false,method:'UmmAlQura',hanafi:false,hijriOffset:0,night:false,favorites:[],reminders:false,language:'ar',unit:'c',weatherVisible:true,hour12:false,station:null,adjustments:[0,0,0,0,0,0],autoLocation:false,consent:{ip:false,search:false,weather:false,radio:false},lastIP:0};
  p.backgroundAuto=true;p.backgroundImage=1;p.backgroundMinutes=15;p.backgroundDim=45;p.backgroundFade=true;
  if(!raw||typeof raw!=='object'||Array.isArray(raw))return p;
  p.backgroundAuto=raw.backgroundAuto!==false;
  p.backgroundFade=raw.backgroundFade!==false;
  p.backgroundImage=[1,2,3,4,5,6].indexOf(raw.backgroundImage)>=0?raw.backgroundImage:1;
  p.backgroundMinutes=[5,15,30,60].indexOf(raw.backgroundMinutes)>=0?raw.backgroundMinutes:15;
  p.backgroundDim=typeof raw.backgroundDim==='number'&&isFinite(raw.backgroundDim)?Math.max(20,Math.min(70,Math.round(raw.backgroundDim))):45;
  p.city=typeof raw.city==='string'?raw.city:'riyadh';
  p.location=validLocation(raw.location)?raw.location:legacyCity(p.city);
  p.setup=raw.schema===2?raw.setup===true:true;
  var defMethod=suggestedMethod(p.location.code);
  p.method=methods.indexOf(raw.method)>=0?raw.method:(methods.indexOf(defMethod)>=0?defMethod:'UmmAlQura');
  ['hanafi','night','reminders','autoLocation','hour12'].forEach(function(k){p[k]=raw[k]===true;});
  p.hijriOffset=[-2,-1,0,1,2].indexOf(raw.hijriOffset)>=0?raw.hijriOffset:0;
  p.favorites=Array.isArray(raw.favorites)?raw.favorites.filter(function(x,i,a){return typeof x==='string'&&x.length<256&&a.indexOf(x)===i;}).slice(0,40):[];
  p.weatherVisible=raw.weatherVisible!==false;
  p.language=raw.language==='en'?'en':'ar';p.unit=raw.unit==='f'?'f':'c';
  if(Array.isArray(raw.adjustments))p.adjustments=p.adjustments.map(function(x,i){var n=raw.adjustments[i];return typeof n==='number'&&isFinite(n)&&Math.abs(n)<=60?Math.round(n):0;});
  if(raw.station&&typeof raw.station==='object'&&typeof raw.station.name==='string'&&raw.station.name.length>0&&raw.station.name.length<150&&typeof raw.station.url==='string'&&/^https:\/\/(backup\.)?qurango\.net\/radio\/[a-z0-9_-]+$/i.test(raw.station.url)){
    p.station={name:raw.station.name,url:raw.station.url};
  }
  if(raw.consent)['ip','search','weather','radio'].forEach(function(k){p.consent[k]=raw.consent[k]===true;});
  p.autoLocation=p.autoLocation&&p.consent.ip;
  p.lastIP=typeof raw.lastIP==='number'&&isFinite(raw.lastIP)?raw.lastIP:0;
  return p;
}
