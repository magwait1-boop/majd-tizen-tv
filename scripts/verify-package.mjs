import {readFileSync} from 'node:fs';
import {unzipSync,strFromU8} from 'fflate';
import {createHash} from 'node:crypto';
const file=process.argv[2];
if(!file)throw new Error('Usage: node scripts/verify-package.mjs SIGNED.wgt');
const zip=unzipSync(readFileSync(file));
const config=strFromU8(zip['config.xml']);
if(!config.includes('id="SETZfpkE27.MajdTV"')||!config.includes('required_version="3.0"'))throw new Error('Unexpected manifest');
for(const name of ['author-signature.xml','signature1.xml']){
 if(!zip[name])throw new Error('Missing '+name+'; widget is not signed');
 const xml=strFromU8(zip[name]);
 if(!/<(?:\w+:)?SignatureValue>\s*\S/.test(xml))throw new Error('Missing signature value');
 let checked=0;
 for(const match of xml.matchAll(/<(?:\w+:)?Reference\b[^>]*URI="([^"]*)"[^>]*>([\s\S]*?)<\/(?:\w+:)?Reference>/g)){
  const uri=match[1];if(uri.startsWith('#'))continue;
  const entry=zip[decodeURIComponent(uri)];if(!entry)throw new Error('Missing signed entry '+uri);
  const algorithm=match[2].includes('#sha512')?'sha512':match[2].includes('#sha256')?'sha256':null;
  if(!algorithm)throw new Error('Unexpected digest algorithm');
  const digest=match[2].match(/<(?:\w+:)?DigestValue>([\s\S]*?)<\/(?:\w+:)?DigestValue>/)[1].replace(/\s/g,'');
  if(createHash(algorithm).update(entry).digest('base64')!==digest)throw new Error('Digest mismatch '+uri);
  checked++;
 }
 if(!checked)throw new Error('No payload references');
 console.log(name+': present; '+checked+' payload digests verified.');
}
console.log('Expected MAJD TV identity and Tizen 3.0 manifest verified.');
