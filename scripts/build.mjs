import {build} from 'esbuild';
import {transformAsync} from '@babel/core';
import {parse} from 'acorn';
import {mkdirSync,readFileSync,writeFileSync,cpSync,readdirSync,existsSync,rmSync} from 'node:fs';
import {zipSync} from 'fflate';
import path from 'node:path';
const result=await build({entryPoints:['app/main.js'],bundle:true,write:false,format:'iife',platform:'browser'});
const converted=await transformAsync(result.outputFiles[0].text,{presets:[['@babel/preset-env',{targets:{ie:'11'},modules:false}]],comments:true});
parse(converted.code,{ecmaVersion:5});
const widget=path.resolve('dist/widget');
if(widget!==path.join(process.cwd(),'dist','widget'))throw new Error('Unexpected output path');
if(existsSync(widget))rmSync(widget,{recursive:true});
mkdirSync(widget,{recursive:true});
cpSync('node_modules/adhan/LICENSE','licenses/Adhan-MIT.txt');
cpSync('node_modules/moment/LICENSE','licenses/Moment-MIT.txt');
cpSync('node_modules/moment-timezone/LICENSE','licenses/Moment-Timezone-MIT.txt');
for(const name of ['index.html','style.css','config.xml']) cpSync('app/'+name,'dist/widget/'+name);
cpSync('app/quran-verses.json','dist/widget/quran-verses.json');
cpSync('app/fonts','dist/widget/fonts',{recursive:true});
mkdirSync('dist/widget/assets/backgrounds',{recursive:true});
for(const number of [1,2,3,4,5,6]){
  cpSync('app/assets/backgrounds/'+number+'.jpg','dist/widget/assets/backgrounds/'+number+'.jpg');
}
// Explicit, private-only hardware probe. Never use this switch for public artifacts.
if(process.argv.includes('--diagnostics')){
  const probe=readFileSync('.local/device-probe.js','utf8');parse(probe,{ecmaVersion:5});
  const cfg=JSON.parse(readFileSync('.local/diagnostics.json','utf8'));
  if(!/^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d+$/.test(cfg.origin))throw new Error('Probe receiver must be private LAN');
  writeFileSync('dist/widget/probe.js',probe);
  writeFileSync('dist/widget/index.html',readFileSync('dist/widget/index.html','utf8').replace('</body>','<script src="probe.js"></script></body>'));
  writeFileSync('dist/widget/config.xml',readFileSync('dist/widget/config.xml','utf8').replace('<content src=','<access origin="'+cfg.origin+'" subdomains="false"/><content src='));
}
writeFileSync('dist/widget/main.js',converted.code);
cpSync('LICENSE','dist/widget/LICENSE');
cpSync('licenses','dist/widget/licenses',{recursive:true});
const files={};
function walk(dir){for(const item of readdirSync(dir,{withFileTypes:true})){const p=path.join(dir,item.name);if(item.isDirectory())walk(p);else files[path.relative('dist/widget',p).replaceAll('\\','/')]=readFileSync(p);}}
walk('dist/widget');
writeFileSync('dist/MAJD-TV-unsigned.wgt',zipSync(files));
console.log('Built ES5 bundle and unsigned WGT.');
