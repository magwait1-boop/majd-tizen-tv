// XHR works on Chromium M47. No cookies, credentials, JSONP or insecure fallback.
export function jsonRequest(url,callback){
  var xhr=new XMLHttpRequest(),done=false;
  function finish(error,data){if(done)return;done=true;callback(error,data);}
  xhr.open('GET',url,true);xhr.timeout=15000;
  xhr.onload=function(){
    if(xhr.status<200||xhr.status>=300){finish(new Error('HTTP '+xhr.status));return;}
    var data;try{data=JSON.parse(xhr.responseText);if(!data||data.error)throw new Error('Service rejected request');}catch(e){finish(e);return;}finish(null,data);
  };
  xhr.onerror=function(){finish(new Error('HTTPS / CORS / network'));};
  xhr.ontimeout=function(){finish(new Error('timeout'));};
  try{xhr.send();}catch(e){finish(e);}
  return function(){done=true;xhr.abort();};
}
export function searchURL(query,language){return 'https://geocoding-api.open-meteo.com/v1/search?name='+encodeURIComponent(query)+'&count=12&language='+language+'&format=json';}
export const ipURL='https://api.ip.sb/geoip';
