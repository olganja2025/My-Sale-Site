(function(){
  'use strict';

  var STORAGE_KEY='anisen_cookie_consent';
  var CONSENT_VERSION=1;
  var CONSENT_TTL_MS=365*24*60*60*1000; // ~12 months
  var METRIKA_ID=112515743;
  var PRIVACY_HREF='/privacy-policy/';

  function readConsent(){
    try{
      var raw=window.localStorage.getItem(STORAGE_KEY);
      if(!raw)return null;
      var data=JSON.parse(raw);
      if(!data||typeof data.analytics!=='boolean'||!data.timestamp)return null;
      if(data.version!==CONSENT_VERSION)return null;
      var savedAt=new Date(data.timestamp).getTime();
      if(isNaN(savedAt)||(Date.now()-savedAt)>CONSENT_TTL_MS)return null;
      return data;
    }catch(e){
      return null;
    }
  }

  function writeConsent(analytics){
    var data={analytics:!!analytics,timestamp:new Date().toISOString(),version:CONSENT_VERSION};
    try{
      window.localStorage.setItem(STORAGE_KEY,JSON.stringify(data));
    }catch(e){/* localStorage unavailable — consent just won't persist */}
    return data;
  }

  function deleteYandexMetrikaCookies(){
    try{
      var cookieNames=document.cookie.split(';').map(function(part){
        return part.trim().split('=')[0];
      }).filter(function(name){
        return name.indexOf('_ym_')===0;
      });
      if(!cookieNames.length)return;
      var host=location.hostname;
      var domains=[host,'.'+host.replace(/^www\./,''),''];
      cookieNames.forEach(function(name){
        domains.forEach(function(domain){
          var cookieStr=name+'=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'+(domain?'; domain='+domain:'');
          document.cookie=cookieStr;
        });
      });
    }catch(e){/* ignore */}
  }

  function loadYandexMetrika(){
    if(window.__anisenMetrikaLoaded)return;
    window.__anisenMetrikaLoaded=true;

    (function(m,e,t,r,i,k,a){
      m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
      m[i].l=1*new Date();
      for(var j=0;j<document.scripts.length;j++){if(document.scripts[j].src===r){return;}}
      k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a);
    })(window,document,'script','https://mc.yandex.ru/metrika/tag.js?id='+METRIKA_ID,'ym');

    window.ym(METRIKA_ID,'init',{
      ssr:true,
      webvisor:true,
      clickmap:true,
      ecommerce:'dataLayer',
      referrer:document.referrer,
      url:location.href,
      accurateTrackBounce:true,
      trackLinks:true
    });
  }

  var bannerEl=null;

  function buildBanner(){
    var el=document.createElement('div');
    el.className='cookie-consent-banner';
    el.id='anisenCookieBanner';
    el.setAttribute('role','dialog');
    el.setAttribute('aria-live','polite');
    el.setAttribute('aria-label','Настройки cookie');
    el.hidden=true;
    el.innerHTML=
      '<div class="cookie-consent-copy">'+
        '<h2>Файлы cookie и аналитика</h2>'+
        '<p>Мы используем файлы cookie и Яндекс Метрику для анализа посещаемости сайта и улучшения его работы. '+
        'Технически необходимые cookie обеспечивают базовую работу сайта и включены всегда. '+
        'Аналитические cookie (Яндекс Метрика) запускаются только с вашего согласия. '+
        'Подробнее в <a href="'+PRIVACY_HREF+'">Политике в отношении обработки персональных данных</a>.</p>'+
      '</div>'+
      '<div class="cookie-consent-actions">'+
        '<button type="button" class="cookie-consent-necessary" data-cookie-action="necessary">Только необходимые</button>'+
        '<button type="button" class="cookie-consent-accept" data-cookie-action="accept">Принять все</button>'+
      '</div>';
    document.body.appendChild(el);

    el.querySelector('[data-cookie-action="accept"]').addEventListener('click',function(){
      writeConsent(true);
      hideBanner();
      loadYandexMetrika();
    });
    el.querySelector('[data-cookie-action="necessary"]').addEventListener('click',function(){
      writeConsent(false);
      hideBanner();
      deleteYandexMetrikaCookies();
    });

    return el;
  }

  function getBanner(){
    if(!bannerEl){
      bannerEl=document.getElementById('anisenCookieBanner')||buildBanner();
    }
    return bannerEl;
  }

  function showBanner(){
    getBanner().hidden=false;
  }

  function hideBanner(){
    getBanner().hidden=true;
  }

  function bindSettingsTriggers(){
    var triggers=document.querySelectorAll('[data-cookie-settings]');
    for(var i=0;i<triggers.length;i++){
      triggers[i].addEventListener('click',function(ev){
        ev.preventDefault();
        showBanner();
      });
    }
  }

  function init(){
    var consent=readConsent();
    if(consent){
      if(consent.analytics){
        loadYandexMetrika();
      }
    }else{
      showBanner();
    }
    bindSettingsTriggers();
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',init);
  }else{
    init();
  }
})();
