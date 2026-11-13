import './polyfills.js';
import cities from './cities.json';
import verses from './quran-verses.json' with {type:'json'};
import {schedule,names,englishNames,methods,methodNames,civil,hijri} from './prayer.js';
import {validLocation,locationKey,cityLabel,legacyCity,fromGeo,fromIP,suggestedMethod,offsetAt,dayKey,clock,zones,tzVersion,currentTime} from './location.js';
import {migrate,KEY} from './preferences.js';
import {createBackgrounds} from './backgrounds.js';
import {jsonRequest,searchURL,ipURL} from './network.js';
import {weatherURL,normalizeWeather,validCache,isStale,temperature,sky,skyIcon,INTERVAL} from './weather.js';
import {radioURL,stations,player} from './radio.js';

var raw=null;try{raw=JSON.parse(localStorage.getItem(KEY)||'null');}catch(e){}
var prefs=migrate(raw),catalog=[],view=prefs.setup?'favorites':'location',selected=null;
var backgroundController=createBackgrounds(el('backgrounds'),prefs,function(number){status(tr('تعذر تحميل الخلفية المحلية رقم ','Could not load local background ')+number);});
var generation=0,loading=false,lastDay='',cached=null,painted='',notified={},lastNow=0;
var progressTarget=0,progressStart=0;
var settingsActive=false,settingsSection='location',settingsHistory=[],adjustmentIndex=0;
var settingsSections=[['location','الموقع والوقت','Location and time'],['prayer','مواقيت الصلاة','Prayer times'],['appearance','المظهر والخلفيات','Appearance and backgrounds'],['weather','الطقس','Weather'],['radio','الإذاعة','Radio'],['general','عام','General'],['advanced','إعدادات متقدمة','Advanced settings']];
var candidate=null,results=[],consentKind='',afterConsent=null,cancelRequest=null,networkBusy=false,lastSearch=0;
var weather=null,weatherBusy=false,weatherCancel=null,weatherAttempt=0,weatherError='',serviceLog={};
var manualDraft=null,zoneResults=[],lastWeatherPaint='',lastAutomatic=0,WEATHER_KEY='majd.tv.weather.v1';
var radioList=[],radioState='',radioPlayer=player(function(state,name){radioState=state+' · '+name;status((state==='playing'?tr('يعمل البث: ','Streaming: '):state==='buffering'?tr('تحميل الصوت: ','Buffering: '):tr('توقف البث أو تعذر تشغيله: ','Stream stopped or unavailable: '))+name);});
function loadRadio(){consent('radio',function(){navigate('radio');request(radioURL+'?language='+(prefs.language==='en'?'eng':'ar'),'MP3Quran',function(data){radioList=stations(data);render();focusFirst();if(!radioList.length)status(tr('لا توجد محطات HTTPS متوافقة.','No compatible HTTPS stations.'));});});}
try{var stored=JSON.parse(localStorage.getItem(WEATHER_KEY)||'null');if(validCache(stored,prefs.location))weather=stored;}catch(e){}
function el(id){return document.getElementById(id);}
function tr(ar,en){return prefs.language==='en'?en:ar;}
function prayerName(i){return (prefs.language==='en'?englishNames:names)[i]||'—';}
function methodLabel(id){return prefs.language==='en'?id:methodNames[methods.indexOf(id)];}
function status(text){el('status').textContent=text;}
function save(change){
  var next=JSON.parse(JSON.stringify(prefs));change(next);
  try{localStorage.setItem(KEY,JSON.stringify(next));prefs=next;backgroundController.apply(prefs);lastDay='';painted='';lastWeatherPaint='';return true;}
  catch(e){status(tr('تعذر الحفظ؛ لم تُغيّر الإعدادات السابقة.','Storage failed; previous settings retained.'));return false;}
}
function button(text,fn,cls){var b=document.createElement('button');b.textContent=text;b.onclick=fn;b.className=cls||'';return b;}
function focusFirst(){if(settingsActive&&view==='settings'){focusSection();return;}var b=view==='favorites'?el('settings-button'):el('panel').querySelector('button:not(:disabled),input')||(settingsActive?el('settings-menu').querySelector('[data-section="'+settingsSection+'"]'):el('nav').querySelector('button'));if(b)b.focus();}
function navigate(name){
  if(name==='settings'&&!settingsActive){settingsActive=true;settingsHistory=[];}
  else if(settingsActive){
    if(['favorites','apps','app','inputs'].indexOf(name)>=0){settingsActive=false;settingsHistory=[];}
    else if(name==='settings')settingsHistory=[];
    else if(name!==view){if(view==='consent')settingsHistory.pop();else settingsHistory.push(view);}
  }
  generation++;if(cancelRequest)cancelRequest();cancelRequest=null;networkBusy=false;view=name;render();el('panel').scrollTop=0;focusFirst();}
function focusSection(){var b=el('settings-menu').querySelector('[data-section="'+settingsSection+'"]');if(b)b.focus();}
function settingsBack(){
  if(!settingsActive){navigate(prefs.setup?'favorites':'location');return;}
  if(view!=='settings'){
    if(view==='consent')afterConsent=null;
    var previous=settingsHistory.pop()||'settings';
    generation++;if(cancelRequest)cancelRequest();cancelRequest=null;networkBusy=false;view=previous;render();focusFirst();return;
  }
  if(el('panel').contains(document.activeElement)){focusSection();return;}
  navigate('favorites');
}
function renderSettingsMenu(){
  var menu=el('settings-menu');menu.textContent='';
  settingsSections.forEach(function(section){
    var b=button(tr(section[1],section[2]),function(){generation++;if(cancelRequest)cancelRequest();cancelRequest=null;networkBusy=false;settingsSection=section[0];settingsHistory=[];view='settings';render();el('panel').scrollTop=0;var first=el('panel').querySelector('button:not(:disabled),input');if(first)first.focus();else focusSection();},'settings-category');
    b.setAttribute('data-section',section[0]);b.setAttribute('aria-current',settingsSection===section[0]?'true':'false');menu.appendChild(b);
  });
}
function settingChange(change){if(save(change)){render();tick();}}
function unavailable(text){var b=button(text+' · '+tr('غير متاح حاليًا','Currently unavailable'),function(){},'row unavailable');b.disabled=true;el('panel').appendChild(b);}
function renderSettings(){
  var section=settingsSections.filter(function(item){return item[0]===settingsSection;})[0];el('title').textContent=tr(section[1],section[2]);
  if(settingsSection==='location'){
    add(tr('الدولة والمدينة · ','Country and city · ')+cityLabel(prefs.location),function(){navigate('location');});
    note(tr('المنطقة الزمنية المرتبطة بالمدينة · ','City timezone · ')+prefs.location.timezone);
    add(tr('تنسيق الساعة · ','Clock format · ')+(prefs.hour12?'12':'24')+tr(' ساعة',' hours'),function(){settingChange(function(p){p.hour12=!p.hour12;});});
  }else if(settingsSection==='prayer'){
    add(tr('طريقة الحساب · ','Calculation method · ')+methodLabel(prefs.method),function(){settingChange(function(p){p.method=methods[(methods.indexOf(p.method)+1)%methods.length];});});
    add(tr('مذهب العصر · ','Asr school · ')+(prefs.hanafi?tr('حنفي','Hanafi'):tr('شافعي','Shafi')),function(){settingChange(function(p){p.hanafi=!p.hanafi;});});
    add(tr('تصحيح التاريخ الهجري · ','Hijri date correction · ')+prefs.hijriOffset,function(){settingChange(function(p){p.hijriOffset=p.hijriOffset===2?-2:p.hijriOffset+1;});});
    names.forEach(function(name,i){add(prayerName(i)+' · '+prefs.adjustments[i]+tr(' دقيقة',' min'),function(){adjustmentIndex=i;navigate('minute');});});
  }else if(settingsSection==='appearance'){
    add(tr('الوضع الليلي · ','Night mode · ')+(prefs.night?tr('مفعّل','On'):tr('متوقف','Off')),function(){settingChange(function(p){p.night=!p.night;});});
    add(tr('التغيير التلقائي · ','Automatic backgrounds · ')+(prefs.backgroundAuto?tr('تشغيل','On'):tr('إيقاف','Off')),function(){settingChange(function(p){p.backgroundAuto=!p.backgroundAuto;});});
    add(tr('الصورة الثابتة · ','Fixed image · ')+prefs.backgroundImage+tr(' من 6',' of 6'),function(){settingChange(function(p){p.backgroundImage=p.backgroundImage%6+1;p.backgroundAuto=false;});});
    add(tr('مدة التغيير · ','Change interval · ')+prefs.backgroundMinutes+tr(' دقيقة',' minutes'),function(){settingChange(function(p){var durations=[5,15,30,60];p.backgroundMinutes=durations[(durations.indexOf(p.backgroundMinutes)+1)%durations.length];});});
    add(tr('التعتيم · ','Dimming · ')+prefs.backgroundDim+'%',function(){settingChange(function(p){p.backgroundDim=p.backgroundDim>=70?20:Math.min(70,p.backgroundDim+5);});});
    add(tr('الانتقال · ','Transition · ')+(prefs.backgroundFade?tr('تلاشي ناعم · ثانيتان','Soft fade · 2 seconds'):tr('مباشر','Direct')),function(){settingChange(function(p){p.backgroundFade=!p.backgroundFade;});});
  }else if(settingsSection==='weather'){
    add(tr('إظهار معلومات الطقس · ','Show weather information · ')+(prefs.weatherVisible?tr('مفعّل','On'):tr('متوقف','Off')),function(){settingChange(function(p){p.weatherVisible=!p.weatherVisible;});});
    add(tr('وحدة الحرارة · ','Temperature unit · ')+prefs.unit.toUpperCase(),function(){settingChange(function(p){p.unit=p.unit==='c'?'f':'c';});});
    add(tr('خدمة الطقس والموافقة والتحديث','Weather service, consent and refresh'),function(){navigate('weather');});
  }else if(settingsSection==='radio'){
    if(prefs.station)note(tr('المحطة المحفوظة · ','Saved station · ')+prefs.station.name);
    add(tr('فتح خيارات إذاعة القرآن الكريم','Open Quran radio options'),function(){navigate('radio');});
  }else if(settingsSection==='general'){
    note('MAJD TV · 0.2.0 · Samsung Tizen 3.0');note('تم التطوير بواسطة مجدي حويت');
    add('اللغة / Language · '+prefs.language,function(){if(save(function(p){p.language=p.language==='ar'?'en':'ar';})){buildNav();render();tick();}});
    unavailable(tr('استعادة الإعدادات الافتراضية','Restore default settings'));
  }else{
    add(tr('تنبيه مرئي داخل التطبيق · ','Visible-app prayer notice · ')+(prefs.reminders?tr('مفعّل','On'):tr('متوقف','Off')),function(){settingChange(function(p){p.reminders=!p.reminders;});});
    add(tr('الموقع التلقائي والبحث والإحداثيات اليدوية','Automatic location, search and manual coordinates'),function(){navigate('location');});
    add(tr('الموافقات والخصوصية','Consent and privacy'),function(){navigate('privacy');});
    add(tr('حالة الخدمات والتوافق','Services and compatibility status'),function(){navigate('diagnostics');});
  }
}
function note(text){var p=document.createElement('p');p.className='note';p.textContent=text;el('panel').appendChild(p);}
function add(text,fn,cls){el('panel').appendChild(button(text,fn,cls||'row'));}
function field(id,label,value){var wrap=document.createElement('label');wrap.className='field';wrap.textContent=label;var input=document.createElement('input');input.id=id;input.type='text';input.value=value==null?'':String(value);input.maxLength=120;input.setAttribute('aria-label',label);wrap.appendChild(input);el('panel').appendChild(wrap);return input;}
function serviceStatus(kind,error){serviceLog[kind]=error?'FAIL: '+error.message:'HTTPS / JSON OK';}
function request(url,kind,callback){
  if(networkBusy)return;networkBusy=true;var token=generation;status(tr('جارٍ الاتصال…','Connecting…'));
  cancelRequest=jsonRequest(url,function(error,data){if(token!==generation)return;networkBusy=false;cancelRequest=null;serviceStatus(kind,error);if(error){status(tr('تعذر الاتصال: ','Connection failed: ')+error.message);return;}status('');callback(data);});
}
function consent(kind,fn){if(prefs.consent[kind]){fn();return;}consentKind=kind;afterConsent=fn;navigate('consent');}
function detectIP(){consent('ip',function(){save(function(p){p.lastIP=Date.now();});request(ipURL,'IP.SB',function(data){var found=fromIP(data);if(!found){status(tr('الخدمة لم تُرجع موقعًا ومنطقة زمنية صالحة؛ استخدم البحث اليدوي.','No valid location/timezone; use manual search.'));return;}candidate=found;navigate('confirm');});});}
function searchCities(){
  var q=el('query').value.trim();if(q.length<2){status(tr('اكتب حرفين على الأقل.','Enter at least two characters.'));return;}
  if(Date.now()-lastSearch<1500)return;lastSearch=Date.now();
  consent('search',function(){navigate('search');el('query').value=q;request(searchURL(q,prefs.language),'GeoNames',function(data){results=(Array.isArray(data.results)?data.results:[]).map(fromGeo).filter(Boolean);render();el('query').value=q;var b=el('panel').querySelector('.result');if(b)b.focus();else status(tr('لا توجد نتائج. جرّب الاسم بالإنجليزية أو أقرب مدينة.','No matches; try English or a nearby city.'));});});
}
function acceptLocation(){
  if(!validLocation(candidate))return;var next=candidate;
  if(!save(function(p){p.location=next;p.city=next.id||'custom';p.setup=true;p.method=suggestedMethod(next.code);} ))return;
  if(weatherCancel)weatherCancel();weatherCancel=null;weatherBusy=false;weather=null;weatherAttempt=0;weatherError='';try{localStorage.removeItem(WEATHER_KEY);}catch(e){}
  candidate=null;navigate(settingsActive?'settings':'favorites');tick();refreshWeather(false);
}
function draft(){return {name:el('manual-name').value.trim(),country:el('country').value.trim(),code:el('code').value.trim().toUpperCase(),region:'',lat:el('lat').value.trim()?Number(el('lat').value):NaN,lng:el('lng').value.trim()?Number(el('lng').value):NaN,timezone:el('zone').value.trim(),source:'manual'};}
function readManual(){manualDraft=draft();if(!validLocation(manualDraft)){status(tr('تحقق من الاسم والإحداثيات والمنطقة الزمنية: العرض ±90 والطول ±180.','Check name, timezone, latitude ±90 and longitude ±180.'));return;}candidate=manualDraft;navigate('confirm');}
function refreshWeather(force){
  if(!prefs.consent.weather||!prefs.setup||document.hidden||weatherBusy)return;
  var now=Date.now(),retryWait=force?60000:(weatherError?300000:60000);
  if(!force&&weather&&now>=weather.fetched&&now-weather.fetched<INTERVAL)return;if(now>=weatherAttempt&&now-weatherAttempt<retryWait)return;weatherAttempt=now;weatherBusy=true;
  var location=prefs.location,key=locationKey(location);
  weatherCancel=jsonRequest(weatherURL(location),function(error,data){weatherBusy=false;weatherCancel=null;if(!prefs.consent.weather||locationKey(prefs.location)!==key)return;
    if(!error){try{weather=normalizeWeather(data,location,Date.now());try{localStorage.setItem(WEATHER_KEY,JSON.stringify(weather));}catch(e){status(tr('تعذر تخزين الطقس.','Could not cache weather.'));}}catch(e){error=e;}}
    serviceStatus('Open-Meteo',error);weatherError=error?error.message:'';lastWeatherPaint='';paintWeather();if(view==='weather')render();
  });
}
function weatherSummary(){
  if(!prefs.consent.weather)return tr('غير مفعّل','Not enabled');
  if(!weather)return weatherError?tr('غير متاح','Unavailable'):tr('جارٍ التحميل…','Loading…');
  return temperature(weather.temp,prefs.unit);
}
function paintWeather(){
  var now=Date.now(),key=Math.floor(now/60000)+'|'+prefs.unit+'|'+prefs.language+'|'+prefs.hour12+'|'+weatherError+'|'+prefs.consent.weather+'|'+(weather?weather.fetched:'none');if(key===lastWeatherPaint)return;lastWeatherPaint=key;
  el('weather-main').textContent=weatherSummary();el('weather-icon').textContent=weather&&prefs.consent.weather?skyIcon(weather.code):'';var detail='';
  var icon='unavailable';
  if(weather&&prefs.consent.weather){
    var code=weather.code;
    icon='cloud';
    if(code===0)icon='sun';
    else if(code<3)icon='partly';
    else if(code===45||code===48)icon='fog';
    else if(code>=95)icon='storm';
    else if((code>=71&&code<=77)||code===85||code===86)icon='snow';
    else if(code>=51)icon='rain';
  }
  el('weather-symbol').setAttribute('class','weather-'+icon);
  if(weather&&prefs.consent.weather){detail=tr('الرطوبة ','Humidity ')+Math.round(weather.humidity)+'%';
    detail+=' · '+(isStale(weather,now)||weatherError?tr('محفوظ؛ ليس حيًا','Cached; not live'):tr('تقدير حديث','Recent estimate'));
  }else detail=tr('اضغط لفتح إعدادات الطقس','Select to open weather settings');
  el('weather-detail').textContent=detail;
  el('weather-humidity').textContent=weather&&prefs.consent.weather?tr('الرطوبة ','Humidity ')+Math.round(weather.humidity)+'%':'';
  el('weather-hourly').textContent=prefs.consent.weather?'Open‑Meteo · CC BY 4.0':'';
}
function refreshApps(){
  if(loading)return;loading=true;var done=false,timer=setTimeout(function(){finish(new Error('timeout'));},20000);
  function finish(error,apps){if(done)return;done=true;clearTimeout(timer);loading=false;if(error){status(tr('تعذر جلب التطبيقات؛ افتح التطبيقات لإعادة المحاولة.','Could not load applications; open Apps to retry.'));return;}var self='';try{self=tizen.application.getCurrentApplication().appInfo.id;}catch(e){}catalog=apps.filter(function(a){return a.id!==self&&a.show===true;}).sort(function(a,b){return a.name.localeCompare(b.name);});if(view==='favorites'||view==='apps')render();}
  if(!window.tizen||!tizen.application){finish(new Error('preview'));return;}try{tizen.application.getAppsInfo(function(a){finish(null,a);},finish);}catch(e){finish(e);}
}
function launch(app){status(tr('جارٍ فتح ','Opening ')+app.name);try{tizen.application.launch(app.id,function(){status(tr('تم إرسال طلب الفتح','Launch accepted'));},function(e){status(tr('تعذر فتح التطبيق: ','Launch failed: ')+e.name);});}catch(e){status(tr('تشغيل التطبيقات متاح على التلفزيون','App launch is available on the TV'));}}
function appMenu(app){selected=app;navigate('app');}
function render(){
  document.body.className=(prefs.night?'night ':'')+(prefs.language==='en'?'english ':'')+(view==='favorites'?'home-screen':'')+(settingsActive?' settings-screen':'')+(!prefs.weatherVisible?' weather-hidden':'');document.documentElement.lang=prefs.language;document.documentElement.dir=prefs.language==='en'?'ltr':'rtl';
  var menuFocused=settingsActive&&el('settings-menu').contains(document.activeElement);
  if(settingsActive)renderSettingsMenu();
  el('next-label').textContent=tr('الصلاة القادمة','Next prayer');el('help').textContent=tr('الأسهم للتنقّل · OK للاختيار · رجوع للشاشة الرئيسية','Arrows to navigate · OK to select · Back to dashboard');
  el('settings-button').setAttribute('aria-label',tr('الإعدادات','Settings'));
  el('verse-text').textContent=verses[0].text;el('verse-reference').textContent=verses[0].surah+' · '+tr('الآية ','Ayah ')+verses[0].number;
  var panel=el('panel'),oldIndex=Array.prototype.indexOf.call(panel.querySelectorAll('button:not(:disabled),input'),document.activeElement);panel.textContent='';
  var titles={favorites:tr('تطبيقاتك المفضلة','Favorite applications'),apps:tr('التطبيقات المثبّتة','Installed applications'),settings:tr('الإعدادات','Settings'),location:tr('اختر موقعك','Choose your location'),cities:tr('مدن دون إنترنت','Offline cities'),app:selected?selected.name:'',inputs:'HDMI',search:tr('البحث العالمي','Global city search'),confirm:tr('تأكيد الموقع','Confirm location'),manual:tr('الإحداثيات والمنطقة الزمنية','Coordinates and timezone'),zones:tr('اختر المنطقة الزمنية','Choose timezone'),consent:tr('الخصوصية والخدمات','Privacy and services'),adjust:tr('تصحيح دقائق الصلاة','Prayer minute corrections'),weather:tr('الطقس','Weather'),privacy:tr('الخدمات والموافقات','Services and consent'),diagnostics:tr('حالة الخدمات','Service status'),radio:tr('إذاعة القرآن الكريم','Quran radio')};el('title').textContent=titles[view]||'';
  if(view==='favorites'){
    add(tr('الإذاعة','Radio'),function(){navigate('radio');},'app home-action');
    add(tr('تغيير الموقع','Change location'),function(){navigate('location');},'app home-action');
  }
  if(view==='favorites'||view==='apps'){
    var items=view==='apps'?catalog:prefs.favorites.map(function(id){return catalog.filter(function(a){return a.id===id;})[0];}).filter(Boolean);items.forEach(function(a){add(a.name,function(){appMenu(a);},'app');});
    if(!items.length)note(loading?tr('جارٍ قراءة التطبيقات…','Loading apps…'):tr('أضف تطبيقاتك من قسم التطبيقات.','Add favorites from Apps.'));if(view==='apps')add(tr('تحديث القائمة','Refresh list'),refreshApps);
  }else if(view==='app'){
    add(tr('فتح التطبيق','Launch application'),function(){launch(selected);});var index=prefs.favorites.indexOf(selected.id);
    add(index<0?tr('إضافة إلى المفضلة','Add to favorites'):tr('إزالة من المفضلة','Remove favorite'),function(){if(save(function(p){var i=p.favorites.indexOf(selected.id);if(i<0&&p.favorites.length<40)p.favorites.push(selected.id);else if(i>=0)p.favorites.splice(i,1);}))render();});
    function move(step){if(save(function(p){var a=p.favorites,tmp=a[index+step];a[index+step]=a[index];a[index]=tmp;}))render();}
    if(index>0)add(tr('نقل إلى الموضع السابق','Move earlier'),function(){move(-1);});if(index>=0&&index<prefs.favorites.length-1)add(tr('نقل إلى الموضع التالي','Move later'),function(){move(1);});
  }else if(view==='settings'){
    renderSettings();
  }else if(view==='minute'){
    el('title').textContent=prayerName(adjustmentIndex);
    note(tr('فرق الدقائق المحفوظ · ','Saved minute correction · ')+prefs.adjustments[adjustmentIndex]);
    [-1,1].forEach(function(step){var b=button(step<0?tr('إنقاص دقيقة','Decrease one minute'):tr('زيادة دقيقة','Increase one minute'),function(){settingChange(function(p){p.adjustments[adjustmentIndex]+=step;});},'row');b.disabled=Math.abs(prefs.adjustments[adjustmentIndex]+step)>60;panel.appendChild(b);});
    note(tr('يُحفظ كل تعديل تلقائيًا · المدى من -60 إلى 60 دقيقة','Each change saves automatically · Range -60 to 60 minutes'));
  }else if(view==='location'){
    note(tr('لن نرسل موقعًا أو بحثًا قبل موافقتك. موقع IP تقريبي وقد يشير إلى مزوّد الإنترنت أو VPN.','No location/search request before consent. IP location may reflect your ISP or VPN.'));
    add(tr('تحديد الموقع تلقائيًا عبر IP.SB','Detect approximate location via IP.SB'),detectIP);
    add(tr('بحث عن مدينة بالعربية أو الإنجليزية','Search cities in Arabic or English'),function(){results=[];navigate('search');});
    add(tr('إدخال الإحداثيات يدويًا دون اتصال','Enter coordinates offline'),function(){manualDraft=null;navigate('manual');});add(tr('اختيار مدينة محفوظة دون إنترنت','Choose an offline preset city'),function(){navigate('cities');});
    if(prefs.setup)add(tr('اقتراح تحديث الموقع يوميًا · ','Daily location suggestion · ')+(prefs.autoLocation?tr('مفعّل','On'):tr('متوقف','Off')),function(){if(prefs.autoLocation){save(function(p){p.autoLocation=false;});render();}else consent('ip',function(){save(function(p){p.autoLocation=true;});navigate('location');});});
    note(tr('الموقع الحالي: ','Current location: ')+(prefs.setup?cityLabel(prefs.location)+' · '+prefs.location.timezone:tr('لم يتم اختيار موقع بعد','Not selected yet')));
  }else if(view==='cities'){
    cities.forEach(function(c){add(c.country+' · '+c.name,function(){candidate=legacyCity(c.id);navigate('confirm');});});
  }else if(view==='search'){
    note(tr('بحث عند الضغط فقط؛ Open‑Meteo / GeoNames.','Search on demand; Open‑Meteo / GeoNames.'));field('query',tr('اسم المدينة','City name'),'');add(tr('بحث','Search'),searchCities);
    results.forEach(function(l){add(cityLabel(l),function(){candidate=l;navigate('confirm');},'row result');});
  }else if(view==='confirm'){
    if(candidate){note(cityLabel(candidate));note(candidate.lat.toFixed(4)+', '+candidate.lng.toFixed(4)+' · '+candidate.timezone);note(tr('المصدر: ','Source: ')+candidate.source+' · '+tr('طريقة مقترحة: ','Suggested method: ')+methodLabel(suggestedMethod(candidate.code)));
      if(candidate.source==='IP.SB')note(tr('هذا تقدير IP وليس GPS. تحقق من المدينة والإحداثيات قبل التأكيد.','IP estimate, not GPS. Check city and coordinates before confirming.'));
      add(tr('تأكيد هذا الموقع وحفظه','Confirm and save this location'),acceptLocation);add(tr('تعديل الإحداثيات أو المنطقة الزمنية','Edit coordinates or timezone'),function(){manualDraft=candidate;navigate('manual');});add(tr('إلغاء؛ الاحتفاظ بالموقع السابق','Cancel; keep previous location'),function(){candidate=null;navigate('location');});}
  }else if(view==='manual'){
    var l=manualDraft||prefs.location;field('manual-name',tr('اسم المكان','Place name'),l.name);field('country',tr('الدولة','Country'),l.country);field('code',tr('رمز الدولة مثل SA أو EG (اختياري)','Country code e.g. SA / EG (optional)'),l.code);field('lat',tr('خط العرض (-90 إلى 90)','Latitude (-90 to 90)'),l.lat);field('lng',tr('خط الطول (-180 إلى 180)','Longitude (-180 to 180)'),l.lng);field('zone',tr('منطقة IANA مثل Asia/Riyadh','IANA timezone e.g. Asia/Riyadh'),l.timezone);
    add(tr('البحث في المناطق الزمنية دون إنترنت','Search offline timezones'),function(){manualDraft=draft();zoneResults=[];navigate('zones');});add(tr('مراجعة الموقع','Review location'),readManual);note(tr('اختر منطقة التوقيت المحلية الصحيحة، فهي لا تُستنتج من خط الطول وحده.','Choose the correct local timezone; longitude alone does not determine it.'));
  }else if(view==='zones'){
    field('zone-query',tr('ابحث مثل Cairo أو London أو America','Search e.g. Cairo, London or America'),'');add(tr('بحث','Search'),function(){var q=el('zone-query').value.toLowerCase();zoneResults=zones.filter(function(z){return z.toLowerCase().indexOf(q)>=0;}).slice(0,50);render();});zoneResults.forEach(function(z){add(z,function(){manualDraft.timezone=z;navigate('manual');});});
  }else if(view==='consent'){
    var descriptions={ip:tr('الموافقة تتصل بـ IP.SB، الذي يرى عنوان الإنترنت لتقدير المدينة والدولة والإحداثيات والمنطقة الزمنية. لا نحتفظ بعنوان IP. بيانات MaxMind تقريبية. الخدمة المجانية للاستخدام الشخصي.','Connect to IP.SB, which sees your public IP to estimate city, country, coordinates and timezone. We do not store your IP. MaxMind location is approximate. Free service is for personal use.'),search:tr('الموافقة ترسل نص بحث المدينة وعنوان الإنترنت إلى Open‑Meteo / GeoNames. لا يُرسل موقعك المحفوظ. بيانات CC BY 4.0؛ استخدام شخصي غير تجاري.','Send city search text and your public IP to Open‑Meteo / GeoNames. Saved coordinates are not sent. CC BY 4.0; personal non-commercial use.'),weather:tr('الموافقة ترسل إحداثيات الموقع المؤكّد والمنطقة الزمنية وعنوان الإنترنت إلى Open‑Meteo كل 45 دقيقة أثناء ظهور التطبيق. الطقس تقدير نماذج؛ بيانات CC BY 4.0؛ استخدام شخصي غير تجاري.','Send confirmed coordinates, timezone and public IP to Open‑Meteo every 45 minutes while visible. Weather is a model estimate. CC BY 4.0; personal non-commercial use.')};
    descriptions.radio=tr('سيُرسل عنوان الإنترنت إلى MP3Quran لتحميل قائمة الإذاعات وإلى Qurango عند تشغيل محطة. لن نرسل الإحداثيات. البث يتوقف عند إخفاء التطبيق. حقوق المحتوى لأصحابه؛ لا نعيد توزيع التسجيلات.','Your public IP goes to MP3Quran for the station list and Qurango when playing. No coordinates are sent. Playback stops when the app is hidden. Content belongs to its owners; no recordings are redistributed.');
    note(descriptions[consentKind]);note(tr('يمكن سحب الموافقة من الإعدادات. الصلاة والساعة تعملان دون الخدمات.','Revoke consent in Settings. Clock and prayers work without these services.'));
    add(tr('أوافق وأتابع','Agree and continue'),function(){var fn=afterConsent;if(save(function(p){p.consent[consentKind]=true;})){afterConsent=null;if(!settingsActive)navigate('location');fn();}});add(tr('لا أوافق؛ العودة','Decline and return'),function(){afterConsent=null;if(settingsActive)settingsBack();else navigate('location');});
  }else if(view==='adjust'){
    names.forEach(function(n,i){field('adjust-'+i,prayerName(i)+' · '+tr('دقائق (-60 إلى 60)','minutes (-60 to 60)'),prefs.adjustments[i]);});
    add(tr('حفظ فروق الدقائق','Save minute corrections'),function(){var values=names.map(function(n,i){var s=el('adjust-'+i).value.trim();return s?Number(s):NaN;});if(values.some(function(v){return !isFinite(v)||Math.abs(v)>60||Math.round(v)!==v;})){status(tr('أدخل أعدادًا صحيحة بين -60 و60.','Enter integers from -60 to 60.'));return;}if(save(function(p){p.adjustments=values;})){navigate('settings');tick();}});
  }else if(view==='weather'){
    note(weatherSummary());if(!prefs.consent.weather)add(tr('الموافقة على خدمة الطقس','Enable weather service'),function(){consent('weather',function(){navigate('weather');refreshWeather(true);});});else add(tr('تحديث الآن (دقيقة على الأقل بين المحاولات)','Refresh now (one minute minimum interval)'),function(){refreshWeather(true);});
    if(weather){note((isStale(weather,Date.now())||weatherError?tr('محفوظ؛ ليس حيًا. ','Cached; not live. '):tr('تقدير حديث. ','Recent estimate. '))+tr('وقت البيانات: ','Data time: ')+new Date(weather.observed).toISOString()+' · '+tr('آخر جلب: ','Fetched: ')+new Date(weather.fetched).toISOString());weather.hourly.filter(function(h){return h.time>=Date.now();}).slice(0,6).forEach(function(h){note(clock(new Date(h.time),prefs.location,false,prefs.hour12,prefs.language)+' · '+temperature(h.temp,prefs.unit)+' · '+sky(h.code,prefs.language==='en'));});}note('Weather: Open‑Meteo · CC BY 4.0 · open-meteo.com');
  }else if(view==='privacy'){
    ['ip','search','weather','radio'].forEach(function(kind){add(kind+' · '+(prefs.consent[kind]?tr('مسموح — اضغط للإيقاف','Allowed — revoke'):tr('متوقف — اضغط للتفعيل','Off — enable')),function(){if(prefs.consent[kind]){if(save(function(p){p.consent[kind]=false;if(kind==='ip')p.autoLocation=false;})){if(kind==='radio'){radioPlayer.stop();radioState='';}if(kind==='weather'){if(weatherCancel)weatherCancel();weatherBusy=false;weatherCancel=null;}render();paintWeather();}}else consent(kind,function(){navigate('privacy');if(kind==='weather')refreshWeather(false);});});});
    note('IP.SB / MaxMind: ip.sb/api · ip.sb/pricing');note('Open‑Meteo / GeoNames: open-meteo.com/en/terms · CC BY 4.0');note(tr('لا مفاتيح سرية ولا تحليلات استخدام. الموقع والتفضيلات والطقس المحفوظ تبقى محليًا.','No secret keys or analytics. Location, preferences and cached weather stay local.'));
  }else if(view==='diagnostics'){
    note('MAJD TV 0.2.0 · tzdata '+tzVersion);note(navigator.userAgent);note(prefs.location.timezone+' · UTC '+offsetAt(new Date(),prefs.location));Object.keys(serviceLog).forEach(function(k){note(k+': '+serviceLog[k]);});if(!Object.keys(serviceLog).length)note(tr('لا طلبات شبكة في هذه الجلسة.','No network requests this session.'));note(tr('نجاح JSON يثبت HTTPS والوصول من التطبيق؛ دقة الموقع والصورة تحتاج تأكيد المستخدم.','JSON success verifies app HTTPS access; location accuracy and picture need user confirmation.'));
  }else if(view==='radio'){
    note('MP3Quran.net / Qurango · '+tr('بث مباشر أثناء ظهور التطبيق فقط','Live stream while the app is visible only'));
    if(prefs.station)add(tr('تشغيل المحطة المفضلة: ','Play favorite station: ')+prefs.station.name,function(){if(prefs.consent.radio)radioPlayer.play(prefs.station);else loadRadio();});
    add(tr('تحميل / تحديث الإذاعات','Load / refresh stations'),loadRadio);
    add(tr('إيقاف الصوت','Stop audio'),function(){radioPlayer.stop();radioState='';status(tr('تم إيقاف البث','Playback stopped'));});
    if(radioState)note(radioState);
    radioList.forEach(function(s){add(s.name,function(){if(prefs.consent.radio){save(function(p){p.station={name:s.name,url:s.url};});radioPlayer.play(s);}else loadRadio();});});
  }
  if(menuFocused){focusSection();}
  if(document.activeElement===document.body){var controls=panel.querySelectorAll('button:not(:disabled),input');var target=controls[Math.min(Math.max(oldIndex,0),controls.length-1)]||(settingsActive?el('settings-menu').querySelector('[data-section="'+settingsSection+'"]'):el('nav').querySelector('button'));if(target)target.focus();}
}
function readInputs(){
  navigate('inputs');var token=generation;if(!window.tizen||!tizen.systeminfo||!tizen.tvwindow){status(tr('واجهة HDMI غير متاحة','HDMI API unavailable'));return;}var done=false,timer=setTimeout(function(){if(token===generation)status(tr('انتهت مهلة HDMI','HDMI timed out'));done=true;},8000);
  try{tizen.systeminfo.getPropertyValue('VIDEOSOURCE',function(data){if(done||token!==generation)return;done=true;clearTimeout(timer);var seen={};(data.connected||[]).concat(data.disconnected||[]).forEach(function(src){if(src.type!=='HDMI'||seen[src.number])return;seen[src.number]=true;add('HDMI '+src.number,function(){try{tizen.tvwindow.setSource(src,function(){status(tr('تم اختيار المدخل؛ افتحه بزر Source','Source selected; view using Source'));},function(){status(tr('تعذر تبديل المدخل','Source change failed'));});}catch(e){status(e.name);}});});focusFirst();},function(){clearTimeout(timer);if(token===generation)status(tr('تعذرت قراءة HDMI','Could not read HDMI'));});}catch(e){clearTimeout(timer);status(e.name);}
}
function pad(n){return n<10?'0'+n:String(n);}
function tick(){
  if(document.hidden)return;var now=currentTime(),key=dayKey(now,prefs.location);
  if(key!==lastDay||!cached||+now<lastNow||cached.when&&now>=cached.when){cached=schedule(now,prefs.location,prefs);lastDay=key;}
  lastNow=+now;
  var homeClock=view==='favorites',clockText=clock(now,prefs.location,homeClock,homeClock||prefs.hour12,prefs.language).split(' '),digits=clockText[0].split(':');
  el('clock-main').textContent=digits[0]+':'+digits[1];
  el('clock-seconds').textContent=homeClock?':'+digits[2]:'';
  el('clock-period').textContent=homeClock?((clockText[1]==='PM'||clockText[1]==='م')?tr('مساءً','PM'):tr('صباحًا','AM')):(clockText[1]?' '+clockText[1]:'');
  el('city').textContent=prefs.setup?cityLabel(prefs.location):tr('اختر موقعك','Choose location');
  el('weekday').textContent=['الأحد','الاثنين','الثلاثاء','الأربعاء','الخميس','الجمعة','السبت'][cached.day.getDay()];
  var hd=civil(now,offsetAt(now,prefs.location));if(now>=cached.times[4])hd.setDate(hd.getDate()+1);var h=hijri(hd,prefs.hijriOffset);
  el('date').textContent=cached.day.getDate()+' / '+(cached.day.getMonth()+1)+' / '+cached.day.getFullYear();el('hijri').textContent=h.day+' / '+h.month+' / '+h.year+tr(' هـ · حسابي',' AH · arithmetic');
  el('next').textContent=prefs.setup?prayerName(cached.next)+(cached.when&&dayKey(cached.when,prefs.location)!==key?tr(' غدًا',' tomorrow'):''):tr('اختر موقعك','Choose location');var left=cached.when?Math.max(0,Math.ceil((cached.when-now)/1000)):null;
  el('countdown').textContent=prefs.setup&&left!==null?pad(Math.floor(left/3600))+':'+pad(Math.floor(left%3600/60))+':'+pad(left%60):'—';
  // Display-only progress uses the existing countdown and available prayer times.
  if(progressTarget!==+cached.when||+now<progressStart){
    progressTarget=+cached.when;progressStart=+now;
    var previous=0;
    cached.times.forEach(function(t,i){if(i!==1&&+t<=+now&&+t>previous)previous=+t;});
    if(previous)progressStart=previous;
  }
  var remaining=prefs.setup&&left!==null?Math.max(0,progressTarget-now):0;
  el('prayer-progress-fill').style.width=(remaining?Math.min(100,100*remaining/Math.max(1,progressTarget-progressStart)):0)+'%';
  el('prayer-next').className=prefs.setup&&left!==null&&left<=600?'prayer-soon':'';
  var pk=key+'|'+locationKey(prefs.location)+'|'+prefs.method+'|'+prefs.hanafi+'|'+prefs.hijriOffset+'|'+prefs.hour12+'|'+prefs.adjustments.join(',')+'|'+cached.next+'|'+prefs.language;
  if(pk!==painted){painted=pk;el('times').textContent='';cached.times.forEach(function(t,i){var cell=document.createElement('div');cell.className='prayer'+(i===cached.next?' upcoming':'');cell.textContent=prayerName(i);var strong=document.createElement('strong');strong.textContent=prefs.setup?clock(t,prefs.location,false,prefs.hour12,prefs.language):'—';cell.appendChild(strong);el('times').appendChild(cell);});}
  if(cached.incomplete)status(tr('بعض الأوقات غير قابلة للحساب في هذا الموقع/الموسم. ارجع للتقويم المحلي.','Some times cannot be calculated at this latitude/season. Consult a local timetable.'));
  cached.times.forEach(function(t,i){var id=key+'-'+i;if(prefs.reminders&&prefs.setup&&i!==1&&now-t>=0&&now-t<60000&&!notified[id]){notified[id]=true;status(tr('حان الآن موعد صلاة ','Prayer time: ')+prayerName(i));}});paintWeather();
}
function buildNav(){el('nav').textContent='';[[tr('المفضلة','Favorites'),function(){navigate('favorites');}],[tr('التطبيقات','Apps'),function(){navigate('apps');refreshApps();}],[tr('الإعدادات','Settings'),function(){navigate('settings');}],[tr('الإذاعة','Radio'),function(){navigate('radio');}],['HDMI',readInputs]].forEach(function(t){el('nav').appendChild(button(t[0],t[1]));});}
function backgroundTick(){if(document.hidden)return;refreshWeather(false);if(prefs.autoLocation&&prefs.consent.ip&&view==='favorites'&&Date.now()-Math.max(prefs.lastIP,lastAutomatic)>86400000){lastAutomatic=Date.now();detectIP();}}
document.addEventListener('tizenhwkey',function(e){if(e.keyName==='back'){e.preventDefault();settingsBack();}});
document.addEventListener('keydown',function(e){
  var active=document.activeElement;if(e.keyCode===10009||e.keyCode===27){e.preventDefault();settingsBack();return;}
  if(document.body.className.indexOf('home-screen')>=0&&(!active||active.tagName!=='INPUT')){var shortcut={49:'favorites',50:'apps',51:'settings',52:'radio',53:'inputs',403:'apps',404:'favorites',405:'settings',406:'radio'};if(shortcut[e.keyCode]){e.preventDefault();if(shortcut[e.keyCode]==='inputs')readInputs();else{navigate(shortcut[e.keyCode]);if(shortcut[e.keyCode]==='apps')refreshApps();}return;}}
  if(e.keyCode===13){if(active&&active.tagName==='BUTTON'){e.preventDefault();active.click();}return;}
  if(settingsActive&&[37,38,39,40].indexOf(e.keyCode)>=0){
    var inMenu=el('settings-menu').contains(active),inPanel=el('panel').contains(active);
    if(inMenu||inPanel){
      if(active.tagName==='INPUT'&&(e.keyCode===37||e.keyCode===39))return;
      e.preventDefault();
      if(inMenu&&e.keyCode===37){if(active.getAttribute('data-section')!==settingsSection){active.click();return;}var option=el('panel').querySelector('button:not(:disabled),input');if(option)option.focus();return;}
      if(inPanel&&e.keyCode===39){focusSection();return;}
      if(e.keyCode===38||e.keyCode===40){
        var container=inMenu?el('settings-menu'):el('panel'),items=container.querySelectorAll('button:not(:disabled),input'),index=Array.prototype.indexOf.call(items,active),next=items[index+(e.keyCode===38?-1:1)];
        if(next){next.focus();revealSetting(next,container);}
      }
      return;
    }
  }
  if([37,38,39,40].indexOf(e.keyCode)<0)return;if(active&&active.tagName==='INPUT'&&(e.keyCode===37||e.keyCode===39))return;e.preventDefault();var from=active.getBoundingClientRect(),best=null,score=Infinity;
  Array.prototype.forEach.call(document.querySelectorAll('button,input'),function(b){if(b===active||b.disabled)return;var r=b.getBoundingClientRect();if(!r.width||!r.height)return;var dx=r.left+r.width/2-from.left-from.width/2,dy=r.top+r.height/2-from.top-from.height/2;var forward=e.keyCode===37?-dx:e.keyCode===39?dx:e.keyCode===38?-dy:dy,cross=e.keyCode===37||e.keyCode===39?Math.abs(dy):Math.abs(dx);if(forward>3&&forward+cross*3<score){score=forward+cross*3;best=b;}});
  if(best){best.focus();var panel=el('panel');if(panel.contains(best)){var br=best.getBoundingClientRect(),pr=panel.getBoundingClientRect(),scale=Math.min(innerWidth/1920,innerHeight/1080);if(br.bottom>pr.bottom)panel.scrollTop+=(br.bottom-pr.bottom)/scale+8;if(br.top<pr.top)panel.scrollTop-=(pr.top-br.top)/scale+8;}}
});
function revealSetting(control,container){
  var rect=control.getBoundingClientRect(),bounds=container.getBoundingClientRect(),scale=Math.min(innerWidth/1920,innerHeight/1080);
  if(rect.bottom>bounds.bottom-12)container.scrollTop+=(rect.bottom-bounds.bottom)/scale+20;
  if(rect.top<bounds.top+12)container.scrollTop-=(bounds.top-rect.top)/scale+20;
}
el('panel').addEventListener('focusin',function(e){if(settingsActive)revealSetting(e.target,el('panel'));});
function fit(){el('stage').style.transform='scale('+Math.min(innerWidth/1920,innerHeight/1080)+')';}
el('settings-button').onclick=function(){navigate('settings');};
el('weather-card').onclick=function(){navigate('weather');};addEventListener('resize',fit);
document.addEventListener('visibilitychange',function(){if(document.hidden){radioPlayer.stop();radioState='';if(weatherCancel)weatherCancel();weatherCancel=null;weatherBusy=false;if(cancelRequest)cancelRequest();cancelRequest=null;networkBusy=false;generation++;}else{lastDay='';tick();refreshWeather(false);}});
fit();buildNav();render();focusFirst();tick();refreshWeather(false);setInterval(tick,1000);setInterval(backgroundTick,60000);
