export const radioURL='https://www.mp3quran.net/api/v3/radios';
export function stations(data){
  if(!data||!Array.isArray(data.radios))return [];
  return data.radios.filter(function(s){return s&&typeof s.name==='string'&&s.name.length<150&&typeof s.url==='string'&&/^https:\/\/(backup\.)?qurango\.net\/radio\/[a-z0-9_-]+$/i.test(s.url);}).slice(0,150);
}
export function player(report){
  var audio=null,timer=null;
  function stop(){clearTimeout(timer);timer=null;if(audio){audio.onplaying=audio.onerror=audio.onwaiting=audio.onended=null;audio.pause();audio.removeAttribute('src');audio.load();audio=null;}}
  return {stop:stop,play:function(s){
    stop();var current=document.createElement('audio');audio=current;current.preload='none';
    function fail(){if(audio!==current)return;stop();report('error',s.name);}
    current.onplaying=function(){if(audio!==current)return;clearTimeout(timer);timer=null;report('playing',s.name);};
    current.onerror=fail;current.onwaiting=function(){if(audio!==current)return;report('buffering',s.name);clearTimeout(timer);timer=setTimeout(fail,20000);};
    current.onended=function(){if(audio!==current)return;stop();report('stopped','');};
    current.src=s.url;report('buffering',s.name);timer=setTimeout(fail,20000);
    try{var p=current.play();if(p&&p.catch)p.catch(fail);}catch(e){fail();}
  }};
}
