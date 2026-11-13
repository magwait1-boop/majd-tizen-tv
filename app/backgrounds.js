// Two local image layers keep the outgoing picture visible during the fade.
export function createBackgrounds(root,initial,onError){
  var layers=root.querySelectorAll('.background-image');
  var dimmer=root.querySelector('.background-dimmer');
  var options=null,active=0,current=0,requested=0,requestId=0;
  var rotationTimer=null,fadeTimer=null;

  function finishFade(){
    clearTimeout(fadeTimer);fadeTimer=null;
    layers[active].style.transition='none';
    layers[active].style.opacity='1';
    layers[1-active].style.transition='none';
    layers[1-active].style.opacity='0';
  }

  function showImage(number){
    var token=++requestId;
    requested=number;
    finishFade();
    if(number===current)return;
    var image=new Image();
    image.onload=function(){
      if(token!==requestId)return;
      var next=1-active,layer=layers[next];
      var fade=options.backgroundFade&&current!==0&&!document.hidden;
      layer.style.transition='none';
      layer.style.opacity='0';
      layer.style.backgroundImage='url("'+image.src+'")';
      layer.style.zIndex='1';
      layers[active].style.zIndex='0';
      // Commit the transparent starting frame before enabling the transition.
      layer.offsetWidth;
      layer.style.transition=fade?'opacity 2s ease-in-out':'none';
      layer.style.opacity='1';
      active=next;current=number;
      if(fade)fadeTimer=setTimeout(finishFade,2000);
      else finishFade();
    };
    image.onerror=function(){if(token===requestId)onError(number);};
    image.src='assets/backgrounds/'+number+'.jpg';
  }

  function scheduleRotation(){
    clearTimeout(rotationTimer);rotationTimer=null;
    if(document.hidden||!options.backgroundAuto)return;
    rotationTimer=setTimeout(function(){
      showImage((requested||current||options.backgroundImage)%6+1);
      scheduleRotation();
    },options.backgroundMinutes*60000);
  }

  function apply(next){
    var restart=!options||next.backgroundAuto!==options.backgroundAuto||
      next.backgroundImage!==options.backgroundImage||next.backgroundMinutes!==options.backgroundMinutes;
    var select=!options||next.backgroundImage!==options.backgroundImage||next.backgroundAuto!==options.backgroundAuto;
    if(options&&next.backgroundFade!==options.backgroundFade)finishFade();
    options={backgroundAuto:next.backgroundAuto,backgroundImage:next.backgroundImage,
      backgroundMinutes:next.backgroundMinutes,backgroundFade:next.backgroundFade};
    dimmer.style.opacity=String(next.backgroundDim/100);
    if(select)showImage(options.backgroundImage);
    if(restart)scheduleRotation();
  }

  document.addEventListener('visibilitychange',function(){
    if(document.hidden)finishFade();
    scheduleRotation();
  });
  apply(initial);
  return {apply:apply};
}
