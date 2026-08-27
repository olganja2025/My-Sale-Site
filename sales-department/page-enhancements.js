(() => {
  const heroContainer = document.querySelector('.system-hero > .container');

  if (heroContainer && !heroContainer.classList.contains('system-hero-grid')) {
    const copy = document.createElement('div');
    copy.className = 'system-hero-copy reveal';

    while (heroContainer.firstChild) {
      copy.appendChild(heroContainer.firstChild);
    }

    const facts = document.createElement('aside');
    facts.className = 'system-hero-facts reveal';
    facts.setAttribute('aria-label', 'Параметры проекта');
    facts.innerHTML = `
      <div><span>Срок проекта</span><strong>от 2 месяцев</strong></div>
      <div><span>Стоимость</span><strong>от 150 000 <span class="ruble-symbol" aria-label="рублей">₽</span> / месяц</strong></div>
      <div><span>Формат</span><strong>проект веду лично</strong></div>
      <div><span>Система</span><strong>под конкретный бизнес</strong></div>
    `;
    facts.style.transitionDelay = '.1s';

    heroContainer.classList.add('system-hero-grid');
    heroContainer.append(copy, facts);
  }

  const revealGroup = (selector, step = 0.07, maxDelay = 0.28) => {
    document.querySelectorAll(selector).forEach((element, index) => {
      element.classList.add('reveal');
      element.style.transitionDelay = `${Math.min(index * step, maxDelay)}s`;
    });
  };

  revealGroup('.system-results-section .section-head, .system-result-summary, .system-related-service');
  revealGroup('.system-result-grid article', 0.07, 0.28);
  revealGroup('.readiness-section .section-head, .readiness-column', 0.09, 0.18);
  revealGroup('.leads-copy, .leads-model-card, .leads-related-service', 0.1, 0.2);
  revealGroup('.process-route-section .section-head');
  revealGroup('.process-stage', 0.07, 0.28);
  revealGroup('.hiring-lead, .hiring-details, .hiring-note', 0.09, 0.18);
  revealGroup('.practice-case');
  revealGroup('.post-launch-answer-copy, .post-launch-answer-option', 0.1, 0.1);
  revealGroup('.pricing-summary > *', 0.05, 0.2);
  revealGroup('.sales-faq-layout > h2, .sales-faq-list', 0.1, 0.1);
  revealGroup('.final-system-cta-grid > *', 0.08, 0.16);
})();
