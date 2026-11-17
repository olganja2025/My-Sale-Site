/* ANISEN: exit-intent popup «Первичный разбор продаж».
   Показ: десктоп - курсор ушёл за верхнюю границу окна; мобильный - суммарно
   2 минуты на сайте (накапливается между страницами). Повторный показ подавлен
   на 7 дней после любого закрытия и навсегда после успешной заявки
   (метку anisen_lead_sent ставит callback-widget.js). Кнопка открывает
   существующую форму обратного звонка с source='exit-intent' - новой формы
   и новой системы заявок нет. Телефон и ПД никуда, кроме формы, не уходят. */
(function(){
  'use strict';

  var SELF_SRC=document.currentScript?document.currentScript.src:'';
  var SOURCE='exit-intent';
  var MOBILE_MS=120000;
  var MIN_PAGE_AGE_MS=5000;
  var SUPPRESS_DAYS=7;

  var ICON_X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';

  /* ---------- метки показа ---------- */

  function readLocal(){try{return JSON.parse(window.localStorage.getItem('anisen_exit')||'{}');}catch(e){return {};}}
  function writeShownAt(){
    try{window.localStorage.setItem('anisen_exit',JSON.stringify({shown_at:Date.now()}));}catch(e){}
  }
  function alreadySent(){try{return window.localStorage.getItem('anisen_lead_sent')==='1';}catch(e){return false;}}
  function suppressed(){
    if(alreadySent())return true;
    var at=readLocal().shown_at;
    return typeof at==='number'&&(Date.now()-at)<SUPPRESS_DAYS*24*60*60*1000;
  }

  /* ---------- условия окружения ---------- */

  function isTouch(){return window.matchMedia&&window.matchMedia('(pointer: coarse)').matches;}

  /* Форма звонка или меню открыты - не показываем; таймер мобильного не идёт,
     пока человек заполняет поле или работает в любой форме на странице. */
  function busy(){
    var ov=document.querySelector('.cbw-overlay');
    if(ov&&!ov.hidden)return true;
    var menu=document.querySelector('.cbw-menu');
    if(menu&&menu.hidden===false&&document.querySelector('.cbw.is-open'))return true;
    var a=document.activeElement;
    if(a&&a!==document.body&&(a.tagName==='INPUT'||a.tagName==='TEXTAREA'||a.tagName==='SELECT'||a.isContentEditable))return true;
    return false;
  }

  /* ---------- показ ---------- */

  var shown=false,closing=false,overlay=null;

  function build(){
    overlay=document.createElement('div');
    overlay.className='exp-overlay';
    overlay.hidden=true;
    overlay.innerHTML=
      '<div class="exp-card" role="dialog" aria-modal="true" aria-labelledby="expTitle" tabindex="-1">'+
        '<button type="button" class="exp-close" aria-label="Закрыть">'+ICON_X+'</button>'+
        '<p class="exp-eyebrow">Первичный разбор продаж</p>'+
        '<h2 class="exp-title" id="expTitle">Продажи есть. А где теряются деньги?</h2>'+
        '<p class="exp-text">Менеджеры работают, заявки поступают, CRM заполнена – но результат не радует?</p>'+
        '<p class="exp-text">Я разберу вашу ситуацию, помогу определить слабые места и понять, с чего начать изменения.</p>'+
        '<p class="exp-meta">Бесплатный первичный разбор на 10–15 минут. Без обязательств</p>'+
        '<button type="button" class="exp-btn">Записаться на первичный разбор</button>'+
      '</div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.exp-close').addEventListener('click',close);
    overlay.addEventListener('mousedown',function(ev){if(ev.target===overlay)close();});
    document.addEventListener('keydown',function(ev){
      if(ev.key==='Escape'&&overlay&&!overlay.hidden)close();
    });
    overlay.querySelector('.exp-btn').addEventListener('click',function(){
      writeShownAt();
      var api=window.CallbackWidget;
      hide(function(){if(api&&typeof api.open==='function')api.open({source:SOURCE});});
    });
  }

  function hide(after){
    if(closing)return;
    closing=true;
    overlay.classList.remove('is-shown');
    window.setTimeout(function(){
      overlay.hidden=true;
      closing=false;
      if(typeof after==='function')after();
    },180);
  }

  function close(){
    /* Любое закрытие (крестик, Esc, фон, кнопка) подавляет показ на 7 дней. */
    writeShownAt();
    hide(null);
  }

  function show(){
    if(shown||suppressed()||busy())return;
    if(!document.body)return;
    shown=true;
    if(!overlay)build();
    overlay.hidden=false;
    window.requestAnimationFrame(function(){overlay.classList.add('is-shown');});
    window.setTimeout(function(){overlay.querySelector('.exp-close').focus();},60);
  }

  /* ---------- триггеры ---------- */

  function desktopTrigger(){
    if(!isTouch()){
      document.addEventListener('mouseout',function(ev){
        if(shown||closing)return;
        if(ev.relatedTarget||ev.toElement)return;
        if(ev.clientY>0)return;
        show();
      });
    }
  }

  function mobileTimer(){
    if(!isTouch())return;
    var KEY='anisen_exit_time';
    var spent=0;
    try{spent=parseInt(window.sessionStorage.getItem(KEY)||'0',10)||0;}catch(e){}
    var last=Date.now();
    window.setInterval(function(){
      var now=Date.now();
      if(!busy())spent+=now-last;
      last=now;
      try{window.sessionStorage.setItem(KEY,String(spent));}catch(e){}
      if(spent>=MOBILE_MS&&!shown&&!closing&&!suppressed()&&!busy())show();
    },1000);
  }

  /* ---------- запуск ---------- */

  function start(){
    if(document.querySelector('.exp-overlay'))return;
    if(suppressed())return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href=new URL('exit-popup.css?v=1',SELF_SRC||location.href).href;
    document.head.appendChild(link);
    /* Первые 5 секунд после загрузки страницы popup не показывается. */
    window.setTimeout(function(){
      desktopTrigger();
      mobileTimer();
    },MIN_PAGE_AGE_MS);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){start();});
  else start();
})();
