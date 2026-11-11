import './polyfills.js';
import cities from './cities.json';
import {schedule,names,methods,methodNames,civil,hijri} from './prayer.js';
var KEY='majd.tv.preferences.v1', prefs={city:'riyadh',method:'UmmAlQura',offset:3,hanafi:false,hijriOffset:0,night:false,favorites:[],reminders:false};
var catalog=[], view='favorites', selected=null, generation=0, lastDay='', cached, notified={}, loading=false, painted='';
function el(id){return document.getElementById(id);}
function status(text){el('status').textContent=text;}
try {var saved=JSON.parse(localStorage.getItem(KEY)||'null'); if(saved && typeof saved==='object') Object.keys(prefs).forEach(function(k){if(Object.prototype.hasOwnProperty.call(saved,k)) prefs[k]=saved[k];});} catch(e){status('تعذر قراءة الإعدادات؛ استُخدمت القيم الافتراضية');}
if(!cities.some(function(c){return c.id===prefs.city;})) prefs.city='riyadh';
if(methods.indexOf(prefs.method)<0) prefs.method='UmmAlQura';
if([2,3].indexOf(prefs.offset)<0) prefs.offset=3;
if(!Array.isArray(prefs.favorites)) prefs.favorites=[];
prefs.favorites=prefs.favorites.filter(function(id,i,a){return typeof id==='string' && a.indexOf(id)===i;}).slice(0,40);
if([-2,-1,0,1,2].indexOf(prefs.hijriOffset)<0) prefs.hijriOffset=0;
function save(change){
  var next=JSON.parse(JSON.stringify(prefs)); change(next);
  try {localStorage.setItem(KEY,JSON.stringify(next));prefs=next;lastDay='';return true;}
  catch(e){status('تعذر الحفظ. الإعداد السابق محفوظ.');return false;}
}
function button(text, action, className){
  var b=document.createElement('button');b.textContent=text;b.className=className||'';b.onclick=action;return b;
}
function navigate(name){view=name;generation++;render();var b=el('panel').querySelector('button')||el('nav').querySelector('button');if(b)b.focus();}
function currentCity(){return cities.filter(function(c){return c.id===prefs.city;})[0];}
function refreshApps(){
  if(loading)return;loading=true;var request=++generation,done=false;
  var timer=setTimeout(function(){finish(new Error('timeout'));},20000);
  function finish(error,apps){if(done)return;done=true;clearTimeout(timer);loading=false;
    if(error){status('تعذر جلب التطبيقات. افتح «التطبيقات» للمحاولة مجددًا.');return;}
    var self='';try{self=tizen.application.getCurrentApplication().appInfo.id;}catch(e){}
    catalog=apps.filter(function(a){return a.id!==self && a.show===true;}).sort(function(a,b){return a.name.localeCompare(b.name);});
    if(request===generation || view==='favorites' || view==='apps') render();
  }
  if(!window.tizen || !tizen.application){finish(new Error('preview'));return;}
  try{tizen.application.getAppsInfo(function(a){finish(null,a);},finish);}catch(e){finish(e);}
}
function launch(app){
  status('جارٍ فتح '+app.name);
  try{tizen.application.launch(app.id,function(){status('تم إرسال طلب فتح '+app.name);},function(){status('تعذر فتح التطبيق على هذا التلفزيون');});}
  catch(e){status('تشغيل التطبيقات متاح على التلفزيون');}
}
function appMenu(app){
  selected=app;view='app';render();el('panel').querySelector('button').focus();
}
function render(){
  document.body.className=prefs.night?'night':'';
  var panel=el('panel'),oldIndex=Array.prototype.indexOf.call(panel.querySelectorAll('button'),document.activeElement);panel.textContent='';
  var titles={favorites:'تطبيقاتك المفضلة',apps:'التطبيقات المثبّتة',settings:'الإعدادات',cities:'اختر المدينة',app:selected?selected.name:'التطبيق',inputs:'مداخل HDMI'};
  el('title').textContent=titles[view];
  function add(text,fn,cls){panel.appendChild(button(text,fn,cls));}
  if(view==='favorites'||view==='apps'){
    var items=view==='apps'?catalog:prefs.favorites.map(function(id){return catalog.filter(function(a){return a.id===id;})[0];}).filter(Boolean);
    items.forEach(function(app){add(app.name,function(){appMenu(app);},'app');});
    if(!items.length){var p=document.createElement('p');p.className='empty';p.textContent=loading?'جارٍ قراءة التطبيقات…':view==='favorites'?'أضف تطبيقاتك من قسم التطبيقات.':'لا توجد تطبيقات ظاهرة حاليًا.';panel.appendChild(p);}
    if(view==='apps')add('تحديث القائمة',refreshApps);
  } else if(view==='app'){
    add('فتح التطبيق',function(){launch(selected);},'row');
    var index=prefs.favorites.indexOf(selected.id);
    add(index<0?'إضافة إلى المفضلة':'إزالة من المفضلة',function(){
      if(save(function(p){var i=p.favorites.indexOf(selected.id);if(i<0 && p.favorites.length<40)p.favorites.push(selected.id);else if(i>=0)p.favorites.splice(i,1);}))render();
    },'row');
    if(index>0)add('نقل إلى الموضع السابق',function(){save(function(p){var a=p.favorites;var tmp=a[index-1];a[index-1]=a[index];a[index]=tmp;});render();},'row');
    if(index>=0 && index<prefs.favorites.length-1)add('نقل إلى الموضع التالي',function(){save(function(p){var a=p.favorites;var tmp=a[index+1];a[index+1]=a[index];a[index]=tmp;});render();},'row');
  } else if(view==='settings'){
    add('المدينة · '+currentCity().name,function(){navigate('cities');},'row');
    add('طريقة الحساب · '+methodNames[methods.indexOf(prefs.method)],function(){save(function(p){p.method=methods[(methods.indexOf(p.method)+1)%methods.length];});render();tick();},'row');
    add('التوقيت · UTC+'+prefs.offset+' — اضبط التوقيت الصيفي لمصر يدويًا',function(){save(function(p){p.offset=p.offset===2?3:2;});render();tick();},'row');
    add('العصر · '+(prefs.hanafi?'حنفي':'شافعي'),function(){save(function(p){p.hanafi=!p.hanafi;});render();tick();},'row');
    add('تصحيح الهجري · '+prefs.hijriOffset+' يوم — تقويم حسابي',function(){save(function(p){p.hijriOffset=p.hijriOffset===2?-2:p.hijriOffset+1;});render();tick();},'row');
    add('الوضع الليلي · '+(prefs.night?'مفعّل':'متوقف'),function(){save(function(p){p.night=!p.night;});render();},'row');
    add('تنبيه مرئي داخل التطبيق · '+(prefs.reminders?'مفعّل':'متوقف'),function(){save(function(p){p.reminders=!p.reminders;});render();},'row');
  } else if(view==='cities'){
    cities.forEach(function(c){add(c.country+' · '+c.name,function(){save(function(p){p.city=c.id;p.method=c.method;p.offset=c.offset;});navigate('settings');tick();},'row');});
  }
  // Re-rendering a settings row preserves remote focus by its position.
  if(!document.activeElement || document.activeElement===document.body){var buttons=panel.querySelectorAll('button');var first=buttons[Math.min(Math.max(oldIndex,0),buttons.length-1)]||el('nav').querySelector('button');if(first)first.focus();}
}
function readInputs(){
  navigate('inputs');var token=generation;status('جارٍ قراءة المداخل');
  if(!window.tizen || !tizen.systeminfo || !tizen.tvwindow){status('واجهة HDMI غير متاحة');return;}
  var done=false,timer=setTimeout(function(){if(token===generation)status('انتهت مهلة قراءة HDMI');done=true;},8000);
  try{tizen.systeminfo.getPropertyValue('VIDEOSOURCE',function(data){
    if(done||token!==generation)return;done=true;clearTimeout(timer);el('panel').textContent='';status('');
    var seen={};(data.connected||[]).concat(data.disconnected||[]).forEach(function(src){
      if(src.type!=='HDMI'||typeof src.number!=='number'||seen[src.number])return;seen[src.number]=true;
      el('panel').appendChild(button('HDMI '+src.number,function(){
        status('جارٍ اختيار HDMI '+src.number);
        try{tizen.tvwindow.setSource(src,function(){status('تم اختيار المدخل؛ افتحه بزر Source في الريموت');},function(){status('تعذر تبديل المدخل');});}catch(e){status('واجهة تبديل HDMI غير متاحة');}
      },'row'));
    });var b=el('panel').querySelector('button');if(b)b.focus();else status('لم يُرجع التلفزيون مداخل HDMI');
  },function(){clearTimeout(timer);if(token===generation)status('رفض التلفزيون قراءة المداخل');});}catch(e){clearTimeout(timer);status('واجهة HDMI غير متاحة');}
}
function pad(n){return n<10?'0'+n:String(n);}
function time(d){var x=new Date(d.getTime()+prefs.offset*3600000);return pad(x.getUTCHours())+':'+pad(x.getUTCMinutes());}
function tick(){
  if(document.hidden)return;
  var now=new Date(),key=new Date(now.getTime()+prefs.offset*3600000).toISOString().slice(0,10);
  if(key!==lastDay){cached=schedule(now,currentCity(),prefs);lastDay=key;}
  // Recompute next prayer at boundaries without re-running astronomy every second.
  if(now>=cached.when)cached=schedule(now,currentCity(),prefs);
  el('clock').textContent=time(now);el('city').textContent=currentCity().name+' · '+methodNames[methods.indexOf(prefs.method)];
  var hd=civil(now,prefs.offset);if(now>=cached.times[4])hd.setDate(hd.getDate()+1);cached.hijri=hijri(hd,prefs.hijriOffset);
  el('date').textContent=cached.day.getDate()+' / '+(cached.day.getMonth()+1)+' / '+cached.day.getFullYear();
  el('hijri').textContent=cached.hijri.day+' / '+cached.hijri.month+' / '+cached.hijri.year+' هـ · حسابي';
  el('next').textContent=names[cached.next];var left=Math.max(0,Math.ceil((cached.when-now)/1000));
  el('countdown').textContent=pad(Math.floor(left/3600))+':'+pad(Math.floor(left%3600/60))+':'+pad(left%60);
  var paintKey=key+'-'+prefs.city+'-'+prefs.method+'-'+prefs.offset+'-'+prefs.hanafi+'-'+prefs.hijriOffset+'-'+cached.next;
  var repaint=paintKey!==painted;if(repaint){el('times').textContent='';painted=paintKey;}
  cached.times.forEach(function(t,i){if(repaint){var cell=document.createElement('div');cell.className='prayer'+(i===cached.next?' upcoming':'');cell.textContent=names[i];var strong=document.createElement('strong');strong.textContent=time(t);cell.appendChild(strong);el('times').appendChild(cell);}
    var id=key+'-'+i;if(prefs.reminders&&i!==1&&now-t>=0&&now-t<60000&&!notified[id]){notified[id]=true;status('حان الآن موعد صلاة '+names[i]);}
  });
}
var tabs=[['المفضلة',function(){navigate('favorites');}],['التطبيقات',function(){navigate('apps');refreshApps();}],['الإعدادات',function(){navigate('settings');}],['HDMI',readInputs]];
tabs.forEach(function(t){el('nav').appendChild(button(t[0],t[1]));});
document.addEventListener('keydown',function(e){
  if(e.keyCode===10009 || e.keyCode===27){e.preventDefault();navigate('favorites');return;}
  if(e.keyCode===13){e.preventDefault();if(document.activeElement && document.activeElement.tagName==='BUTTON')document.activeElement.click();return;}
  if([37,38,39,40].indexOf(e.keyCode)<0)return;e.preventDefault();
  var active=document.activeElement,from=active.getBoundingClientRect(),best=null,score=Infinity;
  Array.prototype.forEach.call(document.querySelectorAll('button'),function(b){if(b===active)return;var r=b.getBoundingClientRect(),dx=(r.left+r.width/2)-(from.left+from.width/2),dy=(r.top+r.height/2)-(from.top+from.height/2);
    var forward=e.keyCode===37?-dx:e.keyCode===39?dx:e.keyCode===38?-dy:dy;
    var cross=(e.keyCode===37||e.keyCode===39)?Math.abs(dy):Math.abs(dx);
    if(forward>3 && forward+cross*3<score){score=forward+cross*3;best=b;}
  });if(best){best.focus();var panel=el('panel');if(panel.contains(best)){var br=best.getBoundingClientRect(),pr=panel.getBoundingClientRect(),scale=Math.min(innerWidth/1920,innerHeight/1080);if(br.bottom>pr.bottom)panel.scrollTop+=(br.bottom-pr.bottom)/scale+8;if(br.top<pr.top)panel.scrollTop-=(pr.top-br.top)/scale+8;}}
});
function fit(){el('stage').style.transform='scale('+Math.min(innerWidth/1920,innerHeight/1080)+')';}
addEventListener('resize',fit);document.addEventListener('visibilitychange',function(){if(!document.hidden){lastDay='';tick();}});
fit();render();tick();refreshApps();setInterval(tick,1000);
