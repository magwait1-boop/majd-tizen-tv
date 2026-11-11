import {chromium} from 'playwright';
import assert from 'node:assert/strict';
import {mkdirSync} from 'node:fs';
const browser=await chromium.launch(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{});
try{
const page=await browser.newPage({viewport:{width:1920,height:1080}});
const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.addInitScript(()=>{
 Math.trunc=undefined;Math.sign=undefined;
 window.calls=[];
 window.tizen={application:{getCurrentApplication:()=>({appInfo:{id:'self'}}),getAppsInfo:ok=>ok([{id:'a',name:'تطبيق أول',show:true},{id:'b',name:'تطبيق ثانٍ',show:true},{id:'hidden',name:'Hidden',show:false},{id:'self',name:'MAJD TV',show:true}]),launch:(id,ok)=>{window.calls.push(id);ok();}}};
});
await page.goto('http://127.0.0.1:4173');
assert.equal(await page.locator('.prayer').count(),6);
await page.getByRole('button',{name:'التطبيقات',exact:true}).click();
assert.equal(await page.locator('.app').count(),2);
await page.getByRole('button',{name:'تطبيق أول',exact:true}).click();
await page.getByRole('button',{name:'إضافة إلى المفضلة',exact:true}).click();
await page.keyboard.press('Escape');
assert.equal(await page.locator('.app').count(),1);
await page.getByRole('button',{name:'التطبيقات',exact:true}).click();
await page.getByRole('button',{name:'تطبيق ثانٍ',exact:true}).click();
await page.getByRole('button',{name:'إضافة إلى المفضلة',exact:true}).click();
await page.getByRole('button',{name:'نقل إلى الموضع السابق',exact:true}).click();
await page.keyboard.press('Escape');
assert.equal(await page.locator('.app').first().textContent(),'تطبيق ثانٍ');
await page.locator('.app').first().click();
await page.getByRole('button',{name:'فتح التطبيق',exact:true}).click();
assert.deepEqual(await page.evaluate(()=>window.calls),['b']);
await page.keyboard.press('Escape');
await page.getByRole('button',{name:'الإعدادات',exact:true}).click();
await page.getByRole('button',{name:/الوضع الليلي/}).click();
assert.ok(await page.locator('body').evaluate(e=>e.className==='night'));
assert.match(await page.evaluate(()=>document.activeElement.textContent),/الوضع الليلي/);
await page.keyboard.press('ArrowUp');await page.keyboard.press('Enter');
assert.match(await page.evaluate(()=>document.activeElement.textContent),/تصحيح الهجري/);
await page.reload();
assert.equal(await page.locator('.app').count(),2);
assert.ok(await page.locator('body').evaluate(e=>e.className==='night'));
mkdirSync('.local',{recursive:true});await page.screenshot({path:'.local/preview.png'});
assert.deepEqual(errors,[]);
// Missing API and corrupt storage must retain a usable local clock/prayer UI.
await page.evaluate(()=>localStorage.setItem('majd.tv.preferences.v1','{bad'));
await page.reload();assert.equal(await page.locator('.prayer').count(),6);
assert.deepEqual(errors,[]);
console.log('PASS browser: ES5 fallbacks, Arabic layout, app filtering/launch mock, favorites/reorder/persistence, remote focus, corrupt preferences.');
}finally{await browser.close();}
