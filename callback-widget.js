/* ANISEN: плавающая кнопка связи и форма обратного звонка.
   Заявка уходит на /api/lead/ строго по docs/SITE_LEAD_API_CONTRACT.md репозитория alster.
   Токена в браузере нет: его добавляет прокси. Телефон нигде не сохраняется и в Метрику не передаётся. */
(function(){
  'use strict';

  var SELF_SRC=document.currentScript?document.currentScript.src:'';
  var ENDPOINT='/api/lead/';
  var METRIKA_ID=112515743;
  var REQUEST_TIMEOUT_MS=15000;
  var DOC_VERSIONS={personal_data:'2026-11-17',advertising:'2026-11-17'};
  var HREF_PRIVACY='/privacy-policy/';
  var HREF_PERSONAL='/personal-data-consent/';
  var HREF_ADS='/advertising-consent/';

  /* Цели Метрики: lead_callback_<ключ>. Единственное место, где задаются идентификаторы. */
  var GOAL_BY_PAGE={
    '/':'home',
    '/sales-department/':'sales_department',
    '/sales-department-improvement/':'sales_improvement',
    '/external-rop/':'external_rop',
    '/sales-audit/':'sales_audit',
    '/call-center/':'call_center',
    '/amocrm/':'amocrm',
    '/individual-tasks/':'individual_tasks'
  };

  var ICON_CHAT='<svg class="cbw-ico-chat" viewBox="0 0 28 28" aria-hidden="true"><path fill="currentColor" d="M6 4h16a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H12.4l-5 4.1c-.7.6-1.8.1-1.8-.8V20.8A3 3 0 0 1 3 18V7a3 3 0 0 1 3-3Z"/><circle cx="9.5" cy="12" r="1.5" fill="#b8f36b"/><circle cx="14" cy="12" r="1.5" fill="#b8f36b"/><circle cx="18.5" cy="12" r="1.5" fill="#b8f36b"/></svg>';
  var ICON_CLOSE='<svg class="cbw-ico-close" viewBox="0 0 28 28" aria-hidden="true"><path d="M8 8l12 12M20 8L8 20" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>';
  var ICON_PHONE='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.4 21 3 13.6 3 4.9c0-.6.4-1 1-1h3.4c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8Z"/></svg>';
  var ICON_X='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>';
  var ICON_OK='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="#15251f" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>';

  function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}

  /* ---------- страница, метки, ключ заявки ---------- */

  function currentPage(){
    var p=(location.pathname||'/').replace(/index\.html$/,'');
    if(p.charAt(0)!=='/')p='/'+p;
    if(p.charAt(p.length-1)!=='/')p+='/';
    return p;
  }

  function newKey(){
    if(window.crypto&&typeof window.crypto.randomUUID==='function')return window.crypto.randomUUID();
    var b=new Uint8Array(16);
    if(window.crypto&&window.crypto.getRandomValues)window.crypto.getRandomValues(b);
    else for(var i=0;i<16;i++)b[i]=Math.floor(Math.random()*256);
    b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
    var h=Array.prototype.map.call(b,function(x){return ('0'+x.toString(16)).slice(-2);}).join('');
    return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
  }

  function readJson(key){try{return JSON.parse(window.sessionStorage.getItem(key)||'null');}catch(e){return null;}}
  function writeJson(key,val){try{window.sessionStorage.setItem(key,JSON.stringify(val));}catch(e){}}

  /* Рекламные метки: первое касание в рамках сессии, чтобы они переживали переходы между страницами. */
  function attribution(){
    var saved=readJson('anisen_attr')||{};
    var q=new URLSearchParams(location.search);
    var found=false;
    ['source','medium','campaign','content','term'].forEach(function(k){
      var v=q.get('utm_'+k);
      if(v){saved['utm_'+k]=v.slice(0,128);found=true;}
    });
    var y=q.get('yclid');
    if(y){saved.yclid=y.slice(0,64);found=true;}
    if(!saved.referrer&&document.referrer){saved.referrer=document.referrer.slice(0,512);found=true;}
    if(found)writeJson('anisen_attr',saved);
    return saved;
  }

  /* ---------- проверка номера: те же правила, что на сервере ---------- */

  function checkPhone(raw){
    var s=(raw||'').trim();
    if(!s)return {error:'Укажите номер телефона'};
    var plus=s.charAt(0)==='+';
    var body=plus?s.slice(1):s;
    var d=body.replace(/[\s()\-\u2010-\u2015]/g,'');
    if(!d||!/^\d+$/.test(d))return {error:'Номер может содержать только цифры, пробелы, скобки и дефисы'};
    if(plus&&d.charAt(0)!=='7')return {error:'Номер в международном формате должен начинаться с +7'};
    var example='Проверьте номер. Например: +7 929 123-45-67';
    if(d.length===10)d='7'+d;
    else if(d.length===11&&(d.charAt(0)==='7'||d.charAt(0)==='8'))d='7'+d.slice(1);
    else return {error:example};
    if('3489'.indexOf(d.charAt(1))<0)return {error:example};
    if(d.slice(1,4)==='800')return {error:'Номера 8-800 не принимаются, укажите обычный телефон'};
    var rest=d.slice(1),same=true;
    for(var i=1;i<rest.length;i++){if(rest.charAt(i)!==rest.charAt(0)){same=false;break;}}
    if(same)return {error:example};
    return {value:'+'+d};
  }

  /* ---------- Метрика ---------- */

  function sentGoals(){return readJson('anisen_lead_goals')||[];}

  /* Цель только после успешного ответа сервера, только для новой заявки, один раз на ключ.
     Если Метрика не загружена (нет согласия на cookie), цель молча пропускается. */
  function reachGoal(leadKey){
    var key=GOAL_BY_PAGE[currentPage()];
    if(!key)return;
    var done=sentGoals();
    if(done.indexOf(leadKey)>=0)return;
    done.push(leadKey);
    writeJson('anisen_lead_goals',done.slice(-20));
    if(typeof window.ym==='function'){
      try{window.ym(METRIKA_ID,'reachGoal','lead_callback_'+key);}catch(e){}
    }
  }

  /* ---------- состояние ---------- */

  var state={key:null,keyPhone:null,openedAt:0,sending:false,lastFocus:null};

  function ensureKey(phone){
    if(!state.key||(state.keyPhone&&state.keyPhone!==phone))state.key=newKey();
    state.keyPhone=phone;
    return state.key;
  }

  /* ---------- разметка ---------- */

  var root,fab,menu,overlay,dialog,form,phoneInput,phoneError,consentP,consentA,consentError,alertBox,submitBtn,successBox,trapInput;

  function messengerItems(){
    var urls=(typeof ANISEN_MESSENGER_URLS!=='undefined')?ANISEN_MESSENGER_URLS:null;
    var list=(typeof ANISEN_MESSENGERS!=='undefined')?ANISEN_MESSENGERS:null;
    if(!urls||!list)return '';
    return list.map(function(m){
      var url=urls[m.key];
      if(!url)return '';
      return '<a class="cbw-item" role="menuitem" href="'+esc(url)+'" target="_blank" rel="noopener noreferrer"><span class="cbw-item-ico">'+m.icon+'</span><span>'+esc(m.label)+'</span></a>';
    }).join('');
  }

  function build(){
    root=document.createElement('div');
    root.className='cbw';
    root.innerHTML=
      '<div class="cbw-menu" id="cbwMenu" role="menu" aria-label="Способы связи" hidden>'+
        messengerItems()+
        '<div class="cbw-sep" role="separator"></div>'+
        '<button type="button" class="cbw-item cbw-item-call" role="menuitem" data-cbw="open-form"><span class="cbw-item-ico">'+ICON_PHONE+'</span><span>Заказать обратный звонок</span></button>'+
      '</div>'+
      '<button type="button" class="cbw-fab" aria-label="Связаться" aria-haspopup="true" aria-expanded="false" aria-controls="cbwMenu">'+ICON_CHAT+ICON_CLOSE+'</button>';
    document.body.appendChild(root);
    fab=root.querySelector('.cbw-fab');
    menu=root.querySelector('.cbw-menu');

    overlay=document.createElement('div');
    overlay.className='cbw-overlay';
    overlay.hidden=true;
    overlay.innerHTML=
      '<div class="cbw-dialog" role="dialog" aria-modal="true" aria-labelledby="cbwTitle" tabindex="-1">'+
        '<button type="button" class="cbw-close" aria-label="Закрыть">'+ICON_X+'</button>'+
        '<form class="cbw-form" novalidate autocomplete="off">'+
          '<h2 class="cbw-title" id="cbwTitle">Заказать обратный звонок</h2>'+
          '<p class="cbw-lead">Оставьте номер телефона, и я перезвоню вам.</p>'+
          '<div class="cbw-alert" role="alert" hidden></div>'+
          '<label class="cbw-field">Номер телефона'+
            '<input type="tel" name="phone" inputmode="tel" autocomplete="tel" maxlength="32" placeholder="+7 929 123-45-67" aria-describedby="cbwPhoneError">'+
          '</label>'+
          '<p class="cbw-error" id="cbwPhoneError" role="alert" hidden></p>'+
          '<label class="cbw-check"><input type="checkbox" name="consent_personal" aria-describedby="cbwConsentError"><span>Даю <a href="'+HREF_PERSONAL+'" target="_blank" rel="noopener noreferrer">Согласие на обработку персональных данных</a> и ознакомлен(а) с <a href="'+HREF_PRIVACY+'" target="_blank" rel="noopener noreferrer">Политикой в отношении обработки персональных данных</a></span></label>'+
          '<p class="cbw-error cbw-error-check" id="cbwConsentError" role="alert" hidden></p>'+
          '<label class="cbw-check"><input type="checkbox" name="consent_ads"><span>Даю <a href="'+HREF_ADS+'" target="_blank" rel="noopener noreferrer">Согласие на получение рекламных и информационных сообщений</a></span></label>'+
          '<div class="cbw-trap" aria-hidden="true"><label>Компания<input type="text" name="company" tabindex="-1" autocomplete="off"></label></div>'+
          '<button type="submit" class="cbw-submit">Заказать звонок</button>'+
        '</form>'+
        '<div class="cbw-success" hidden>'+
          '<div class="cbw-mark">'+ICON_OK+'</div>'+
          '<h2 class="cbw-title" id="cbwDoneTitle">Заявка принята</h2>'+
          '<p class="cbw-lead">Я перезвоню вам по указанному номеру.</p>'+
          '<button type="button" class="cbw-done">Закрыть</button>'+
        '</div>'+
      '</div>';
    document.body.appendChild(overlay);

    dialog=overlay.querySelector('.cbw-dialog');
    form=overlay.querySelector('.cbw-form');
    phoneInput=form.elements.phone;
    phoneError=overlay.querySelector('#cbwPhoneError');
    consentP=form.elements.consent_personal;
    consentA=form.elements.consent_ads;
    consentError=overlay.querySelector('#cbwConsentError');
    alertBox=overlay.querySelector('.cbw-alert');
    submitBtn=overlay.querySelector('.cbw-submit');
    successBox=overlay.querySelector('.cbw-success');
    trapInput=form.elements.company;

    bind();
  }

  /* ---------- меню ---------- */

  function menuOpen(){return root.classList.contains('is-open');}

  function openMenu(){
    menu.hidden=false;
    window.requestAnimationFrame(function(){root.classList.add('is-open');});
    fab.setAttribute('aria-expanded','true');
    fab.setAttribute('aria-label','Закрыть меню связи');
  }

  function closeMenu(){
    root.classList.remove('is-open');
    fab.setAttribute('aria-expanded','false');
    fab.setAttribute('aria-label','Связаться');
    window.setTimeout(function(){if(!menuOpen())menu.hidden=true;},180);
  }

  /* ---------- форма ---------- */

  function showAlert(text){alertBox.textContent=text;alertBox.hidden=!text;}
  function setPhoneError(text){
    phoneError.textContent=text||'';
    phoneError.hidden=!text;
    if(text)phoneInput.setAttribute('aria-invalid','true');else phoneInput.removeAttribute('aria-invalid');
  }
  function setConsentError(text){
    consentError.textContent=text||'';
    consentError.hidden=!text;
    if(text)consentP.setAttribute('aria-invalid','true');else consentP.removeAttribute('aria-invalid');
  }
  function clearErrors(){showAlert('');setPhoneError('');setConsentError('');}

  function openForm(){
    closeMenu();
    state.lastFocus=fab;
    state.openedAt=Date.now();
    clearErrors();
    form.hidden=false;
    successBox.hidden=true;
    overlay.hidden=false;
    document.documentElement.classList.add('cbw-lock');
    window.requestAnimationFrame(function(){overlay.classList.add('is-shown');});
    window.setTimeout(function(){phoneInput.focus();},60);
  }

  function closeForm(){
    overlay.classList.remove('is-shown');
    document.documentElement.classList.remove('cbw-lock');
    window.setTimeout(function(){overlay.hidden=true;},180);
    if(state.lastFocus&&typeof state.lastFocus.focus==='function')state.lastFocus.focus();
  }

  function resetFormAfterSuccess(){
    form.reset();
    state.key=null;
    state.keyPhone=null;
  }

  function sendLead(phone){
    var attr=attribution();
    var utm={};
    ['source','medium','campaign','content','term'].forEach(function(k){if(attr['utm_'+k])utm[k]=attr['utm_'+k];});
    var body={
      lead_key:ensureKey(phone),
      phone:phone,
      page:currentPage(),
      consent_personal:true,
      consent_ads:!!consentA.checked,
      elapsed_ms:Math.max(0,Date.now()-state.openedAt),
      company:trapInput.value||'',
      utm:utm,
      yclid:attr.yclid||'',
      referrer:attr.referrer||'',
      doc_versions:DOC_VERSIONS
    };
    var ctrl=('AbortController' in window)?new AbortController():null;
    var timer=ctrl?window.setTimeout(function(){ctrl.abort();},REQUEST_TIMEOUT_MS):null;
    return fetch(ENDPOINT,{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      credentials:'omit',
      body:JSON.stringify(body),
      signal:ctrl?ctrl.signal:undefined
    }).then(function(res){
      if(timer)window.clearTimeout(timer);
      return res.json().catch(function(){return null;}).then(function(json){return {status:res.status,json:json,leadKey:body.lead_key};});
    },function(err){
      if(timer)window.clearTimeout(timer);
      throw err;
    });
  }

  var MSG_SERVER='Не удалось сохранить заявку. Попробуйте ещё раз или напишите в мессенджер.';
  var MSG_DISABLED='Заявки с сайта временно не принимаются. Напишите мне в мессенджер.';

  function handleResult(r){
    var j=r.json;
    if(r.status===200&&j&&j.ok===true){
      if(j.duplicate!==true)reachGoal(r.leadKey);
      resetFormAfterSuccess();
      form.hidden=true;
      successBox.hidden=false;
      overlay.querySelector('.cbw-done').focus();
      return;
    }
    var code=j&&j.code;
    var msg=j&&j.message;
    if(code==='invalid_phone'){setPhoneError(msg||'Проверьте номер телефона');phoneInput.focus();return;}
    if(code==='consent_required'){setConsentError(msg||'Нужно согласие на обработку персональных данных');consentP.focus();return;}
    if(code==='too_fast'||code==='rate_limited'){showAlert(msg||MSG_SERVER);return;}
    if(code==='disabled'||code==='unauthorized'){showAlert(MSG_DISABLED);return;}
    showAlert(MSG_SERVER);
  }

  function onSubmit(ev){
    ev.preventDefault();
    if(state.sending)return;
    clearErrors();
    var chk=checkPhone(phoneInput.value);
    var bad=false;
    if(chk.error){setPhoneError(chk.error);bad=true;}
    if(!consentP.checked){setConsentError('Для отправки нужно согласие на обработку персональных данных');bad=true;}
    if(bad){(chk.error?phoneInput:consentP).focus();return;}
    state.sending=true;
    submitBtn.disabled=true;
    submitBtn.textContent='Отправляю';
    sendLead(chk.value).then(handleResult,function(){showAlert(MSG_SERVER);}).then(function(){
      state.sending=false;
      submitBtn.disabled=false;
      submitBtn.textContent='Заказать звонок';
    });
  }

  /* ---------- события ---------- */

  function focusables(){
    return Array.prototype.filter.call(dialog.querySelectorAll('a[href],button:not([disabled]),input:not([disabled]):not([tabindex="-1"])'),function(el){return el.offsetParent!==null;});
  }

  function bind(){
    fab.addEventListener('click',function(){menuOpen()?closeMenu():openMenu();});
    root.querySelector('[data-cbw="open-form"]').addEventListener('click',openForm);

    document.addEventListener('click',function(ev){
      if(menuOpen()&&!root.contains(ev.target))closeMenu();
    });

    overlay.addEventListener('mousedown',function(ev){if(ev.target===overlay)closeForm();});
    overlay.querySelector('.cbw-close').addEventListener('click',closeForm);
    overlay.querySelector('.cbw-done').addEventListener('click',closeForm);
    form.addEventListener('submit',onSubmit);
    phoneInput.addEventListener('input',function(){if(phoneError.hidden===false)setPhoneError('');});
    consentP.addEventListener('change',function(){if(consentP.checked)setConsentError('');});

    document.addEventListener('keydown',function(ev){
      if(ev.key==='Escape'){
        if(!overlay.hidden){ev.preventDefault();closeForm();}
        else if(menuOpen()){closeMenu();fab.focus();}
        return;
      }
      if(ev.key==='Tab'&&!overlay.hidden){
        var f=focusables();
        if(!f.length)return;
        var first=f[0],last=f[f.length-1];
        if(ev.shiftKey&&document.activeElement===first){ev.preventDefault();last.focus();}
        else if(!ev.shiftKey&&document.activeElement===last){ev.preventDefault();first.focus();}
      }
    });

    liftAboveCookieBanner();
  }

  /* Баннер cookie может перекрыть кнопку: пока он виден, поднимаем кнопку над ним. */
  function liftAboveCookieBanner(){
    function sync(){
      var b=document.getElementById('anisenCookieBanner');
      var base=window.innerWidth<=640?14:20;
      var overlaps=false;
      if(b&&!b.hidden){
        /* Зона виджета: ширина меню плюс отступ справа. */
        overlaps=b.getBoundingClientRect().right>window.innerWidth-(272+base+8);
      }
      root.style.bottom=overlaps?(b.offsetHeight+base+base)+'px':'';
    }
    new MutationObserver(sync).observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['hidden']});
    window.addEventListener('resize',sync);
    sync();
  }

  /* ---------- запуск ---------- */

  function start(){
    if(document.querySelector('.cbw'))return;
    var link=document.createElement('link');
    link.rel='stylesheet';
    link.href=new URL('callback-widget.css?v=3',SELF_SRC||location.href).href;
    var built=false;
    function go(){if(built)return;built=true;build();}
    link.onload=go;
    link.onerror=go;
    document.head.appendChild(link);
    window.setTimeout(go,1500);
  }

  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){start();});
  else start();
})();
