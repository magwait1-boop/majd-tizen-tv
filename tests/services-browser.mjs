import {chromium} from 'playwright';
import assert from 'node:assert/strict';
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
try{
 const page=await browser.newPage({viewport:{width:1920,height:1080}}),errors=[],calls=[];
 page.on('pageerror',e=>errors.push(e.message));
 const city={name:'القاهرة',country:'مصر',country_code:'EG',admin1:'القاهرة',latitude:30.0444,longitude:31.2357,timezone:'Africa/Cairo'};
 const now=Math.floor(Date.now()/1000),payload={current:{time:now,temperature_2m:25,apparent_temperature:26,relative_humidity_2m:45,wind_speed_10m:10,weather_code:0,is_day:1},hourly:{time:[now+3600,now+7200],temperature_2m:[27,28],weather_code:[1,3]},daily:{time:[now],temperature_2m_max:[30],temperature_2m_min:[18]}};
 await page.route(/^https:\/\//,async r=>{calls.push(r.request().url());let body=r.request().url().includes('geocoding-api')?{results:[city]}:r.request().url().includes('api.ip.sb')?{city:'London',region:'England',country:'United Kingdom',country_code:'GB',latitude:51.5,longitude:-.12,timezone:'Europe/London'}:payload;await r.fulfill({status:200,contentType:'application/json',body:JSON.stringify(body)});});
 await page.goto('http://127.0.0.1:4173');assert.match(await page.locator('#title').textContent(),/اختر موقعك/);assert.equal(calls.length,0);
 await page.getByRole('button',{name:'بحث عن مدينة بالعربية أو الإنجليزية',exact:true}).click();await page.locator('#query').fill('القاهرة');await page.getByRole('button',{name:'بحث',exact:true}).click();assert.equal(calls.length,0);
 await page.getByRole('button',{name:'أوافق وأتابع',exact:true}).click();await page.locator('.result').first().waitFor();assert.equal(calls.length,1);
 await page.locator('.result').first().click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('majd.tv.preferences.v1')).setup),false);
 await page.getByRole('button',{name:'تأكيد هذا الموقع وحفظه',exact:true}).click();assert.match(await page.locator('#city').textContent(),/القاهرة/);assert.equal(calls.length,1);
 await page.locator('#weather-card').click();await page.getByRole('button',{name:'الموافقة على خدمة الطقس',exact:true}).click();assert.equal(calls.length,1);await page.getByRole('button',{name:'أوافق وأتابع',exact:true}).click();await page.waitForFunction(()=>document.getElementById('weather-main').textContent.indexOf('25°C')>=0);assert.equal(calls.length,2);
 await page.keyboard.press('Escape');await page.screenshot({path:'.local/weather-preview.png'});
 // IP proposes only; it must not silently replace the saved Cairo location.
 await page.keyboard.press('3');await page.getByRole('button',{name:/^الموقع ·/}).click();await page.getByRole('button',{name:'تحديد الموقع تلقائيًا عبر IP.SB',exact:true}).click();assert.equal(calls.length,2);await page.getByRole('button',{name:'أوافق وأتابع',exact:true}).click();await page.getByRole('button',{name:'تأكيد هذا الموقع وحفظه',exact:true}).waitFor();assert.equal(calls.length,3);assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('majd.tv.preferences.v1')).location.name),'القاهرة');await page.getByRole('button',{name:'إلغاء؛ الاحتفاظ بالموقع السابق',exact:true}).click();
 // Network failure: stale cache remains explicit and prayer countdown continues.
 await page.evaluate(()=>{let w=JSON.parse(localStorage.getItem('majd.tv.weather.v1'));w.observed-=7200000;w.fetched-=7200000;localStorage.setItem('majd.tv.weather.v1',JSON.stringify(w));});
 await page.unroute(/^https:\/\//);await page.route(/^https:\/\//,r=>r.abort());await page.reload();await page.waitForFunction(()=>document.getElementById('weather-detail').textContent.indexOf('محفوظ')>=0);
 assert.match(await page.locator('#countdown').textContent(),/\d\d:\d\d:\d\d/);assert.equal(await page.locator('.prayer strong').count(),6);
 await page.keyboard.press('3');await page.getByRole('button',{name:'اللغة / Language · ar',exact:true}).click();assert.equal(await page.locator('html').getAttribute('dir'),'ltr');assert.equal(await page.getByRole('button',{name:'Favorites',exact:true}).count(),1);
 await page.keyboard.press('Escape');await page.screenshot({path:'.local/weather-english.png'});
 assert.deepEqual(errors,[]);console.log('PASS services UI: consent before all network, global search, explicit confirmation, IP candidate cancellation, offline stale cache/countdown, English language.');
}finally{await browser.close();}
