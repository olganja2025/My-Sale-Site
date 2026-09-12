const ANISEN_MESSENGER_URLS=Object.freeze({
  telegram:'https://t.me/olganja',
  whatsapp:'https://wa.me/79293366428',
  max:'https://max.ru/u/f9LHodD0cOJNPDeCRrwAR5loipBVfarlvzP56lFlbND2lWRawLjgSXrMu4c'
});
const ANISEN_MAX_ICON_URL=new URL('assets/images/max-messenger-white.svg',document.currentScript.src).href;

const ANISEN_MESSENGERS=[
  {key:'telegram',label:'Telegram',icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.7 4.1 3.8 10.6c-1.2.5-1.2 1.2-.2 1.5l4.3 1.4 1.7 5.2c.2.6.1.8.7.8.5 0 .7-.2 1-.5l2.1-2 4.4 3.2c.8.5 1.4.3 1.6-.8l2.9-13.8c.3-1.3-.5-1.9-1.6-1.5ZM9.6 13.2l8.4-5.3c.4-.2.8-.1.5.2l-6.9 6.2-.3 3.1-1.7-4.2Z"/></svg>'},
  {key:'whatsapp',label:'WhatsApp',icon:'<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3a8.8 8.8 0 0 0-7.5 13.4L3.4 21l4.7-1.1A8.9 8.9 0 1 0 12 3Zm0 15.9a7 7 0 0 1-3.6-1l-.3-.2-2.8.7.7-2.7-.2-.3A7 7 0 1 1 12 18.9Zm3.9-5.2c-.2-.1-1.3-.6-1.5-.7-.2-.1-.4-.1-.5.1l-.7.8c-.1.2-.3.2-.5.1-1.3-.6-2.2-1.3-3-2.5-.2-.3.2-.4.6-1 .1-.2.1-.3 0-.5l-.7-1.7c-.2-.4-.4-.4-.5-.4h-.5c-.2 0-.5.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3.9 2.5 1.1 2.7.1.2 1.8 2.8 4.5 3.9 1.7.7 2.4.8 3.2.7 1-.2 1.9-.8 2.1-1.5.3-.7.3-1.3.2-1.5 0-.1-.2-.2-.4-.3Z"/></svg>'},
  {key:'max',label:'MAX',icon:`<img src="${ANISEN_MAX_ICON_URL}" alt="" aria-hidden="true">`}
];

document.querySelectorAll('[data-anisen-contact]').forEach((root)=>{
  const contactTitle=root.dataset.contactTitle||'Обсудить проект';
  const privacyHref=root.dataset.privacyHref||'privacy-policy/';
  const consentHref=root.dataset.consentHref||'personal-data-consent/';
  const links=ANISEN_MESSENGERS.map(({key,label,icon})=>{
    const url=ANISEN_MESSENGER_URLS[key];
    const content=`<span class="messenger-link-icon">${icon}</span><span>${label}</span>`;
    return url
      ? `<a class="messenger-link" href="${url}" target="_blank" rel="noopener noreferrer">${content}</a>`
      : `<span class="messenger-link messenger-link-placeholder" aria-disabled="true" data-messenger-placeholder="${key}">${content}</span>`;
  }).join('');

  root.innerHTML=`<div class="messenger-contact-head"><h3>${contactTitle}</h3><p>Напишите удобным способом</p></div><div class="messenger-links">${links}</div><p class="messenger-legal">Нажимая кнопку, вы подтверждаете, что ознакомились с <a href="${privacyHref}">Политикой в отношении обработки персональных данных</a> и даёте <a href="${consentHref}">Согласие на обработку персональных данных</a>.</p>`;
});

document.querySelectorAll('[data-anisen-footer-contacts]').forEach((contacts)=>{
  ANISEN_MESSENGERS.forEach(({key,label})=>{
    const url=ANISEN_MESSENGER_URLS[key];
    if(!url)return;
    const link=document.createElement('a');
    link.href=url;
    link.target='_blank';
    link.rel='noopener noreferrer';
    link.textContent=label;
    contacts.appendChild(link);
  });
});
