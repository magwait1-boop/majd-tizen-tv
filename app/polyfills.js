// Minimal ES5 implementations needed by the bundled astronomy library.
if (!Math.trunc) Math.trunc=function(x){x=Number(x);return x<0?Math.ceil(x):Math.floor(x);};
if (!Math.sign) Math.sign=function(x){x=Number(x);return x===0||isNaN(x)?x:x>0?1:-1;};
