import http from 'node:http';
import {readFileSync} from 'node:fs';
import path from 'node:path';
const root=path.resolve('dist/widget');
http.createServer((req,res)=>{
 const file=path.resolve(root,'.'+decodeURIComponent(req.url.split('?')[0]==='/'?'/index.html':req.url.split('?')[0]));
 if(!file.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 try{res.setHeader('Content-Type',file.endsWith('.css')?'text/css':file.endsWith('.js')?'application/javascript':file.endsWith('.html')?'text/html; charset=utf-8':'application/octet-stream');res.end(readFileSync(file));}
 catch{res.writeHead(404).end();}
}).listen(4173,'127.0.0.1',()=>console.log('http://127.0.0.1:4173'));
