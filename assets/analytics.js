/* Optional GA4 measurement. Cloudflare's existing beacon is independent. */
(function () {
  'use strict';
  var id = 'G-135T32RDCL';
  var host = 'nezahb-max.github.io';
  var choiceKey = 'nb-analytics-choice-v1';
  var lifetime = 180 * 24 * 60 * 60 * 1000;
  var hebrew = document.documentElement.lang === 'he';
  var loaded = false;
  var choice = readChoice();
  var banner;
  var settings;
  var returnFocus = false;
  var scriptURL = new URL(document.currentScript.src);
  var privacyURL = new URL(hebrew ? '../he/privacy.html' : '../privacy.html', scriptURL).href;
  var copy = hebrew ? {
    title: 'מדידת שימוש באתר',
    text: 'לאפשר ל־Google Analytics למדוד ביקורים, זמן מעורבות, גלילה ולחיצות על הורדות וקישורי קשר? המדידה משתמשת בעוגיות. אפשר לשנות את הבחירה בכל עת.',
    accept: 'לאפשר מדידה', decline: 'ללא Google Analytics',
    privacy: 'פרטיות', settings: 'העדפות מדידה'
  } : {
    title: 'Website analytics',
    text: 'Allow Google Analytics to measure visits, engagement time, scrolling, and clicks on downloads and contact links? This measurement uses cookies. You can change your choice at any time.',
    accept: 'Allow analytics', decline: 'Continue without Google Analytics',
    privacy: 'Privacy', settings: 'Analytics preferences'
  };

  function readChoice() {
    try {
      var saved = JSON.parse(localStorage.getItem(choiceKey));
      if (saved && (saved.value === 'granted' || saved.value === 'denied') &&
          typeof saved.time === 'number' && saved.time <= Date.now() && Date.now() - saved.time < lifetime) {
        return saved.value;
      }
    } catch (_) { /* Storage may be unavailable; default to no Google requests. */ }
    return null;
  }

  function cleanURL(value, originOnly) {
    try {
      var url = new URL(value);
      return /^https?:$/.test(url.protocol) ? url.origin + (originOnly ? '/' : url.pathname) : '';
    } catch (_) { return ''; }
  }

  function start() {
    if (loaded || choice !== 'granted' || location.hostname !== host || location.protocol !== 'https:') return;
    loaded = true;
    window['ga-disable-' + id] = false;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', {
      analytics_storage: 'granted', ad_storage: 'denied',
      ad_user_data: 'denied', ad_personalization: 'denied'
    });
    window.gtag('js', new Date());
    var config = {
      page_location: cleanURL(location.href),
      page_referrer: cleanURL(document.referrer, true),
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      cookie_domain: host,
      cookie_expires: 180 * 24 * 60 * 60,
      cookie_flags: 'SameSite=Lax;Secure'
    };
    // QA traffic is visible in DebugView and can be excluded by the developer filter.
    if (new URLSearchParams(location.search).get('analytics_test') === '1') config.debug_mode = true;
    window.gtag('config', id, config);
    var tag = document.createElement('script');
    tag.async = true;
    tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
    document.head.appendChild(tag);
  }

  function clearCookies() {
    document.cookie.split(';').forEach(function (cookie) {
      var name = cookie.split('=')[0].trim();
      if (!/^_ga(?:_|$)/.test(name)) return;
      ['', '; Domain=' + host, '; Domain=.' + host].forEach(function (domain) {
        document.cookie = name + '=; Max-Age=0; Path=/' + domain + '; SameSite=Lax; Secure';
      });
    });
  }

  function save(value) {
    choice = value;
    try { localStorage.setItem(choiceKey, JSON.stringify({value: value, time: Date.now()})); } catch (_) {}
    banner.hidden = true;
    document.body.classList.remove('analytics-choice-open');
    if (value === 'granted') start();
    else {
      window['ga-disable-' + id] = true;
      clearCookies();
      // Unload Google's library and timers when previously granted consent is withdrawn.
      if (loaded) { location.reload(); return; }
    }
    if (returnFocus) settings.focus();
  }

  function element(tag, text, className) {
    var node = document.createElement(tag);
    if (text) node.textContent = text;
    if (className) node.className = className;
    return node;
  }

  function render() {
    var footer = document.querySelector('footer .wrap') || document.querySelector('footer') || document.body;
    var links = element('div', '', 'analytics-links');
    var privacy = element('a', copy.privacy);
    privacy.href = privacyURL;
    settings = element('button', copy.settings, 'analytics-settings');
    settings.type = 'button';
    settings.addEventListener('click', function () {
      returnFocus = true;
      banner.hidden = false;
      document.body.classList.add('analytics-choice-open');
      banner.querySelector('h2').focus();
    });
    links.append(privacy, document.createTextNode(' · '), settings);
    footer.appendChild(links);

    banner = element('section', '', 'analytics-choice');
    banner.setAttribute('aria-labelledby', 'analytics-choice-title');
    banner.setAttribute('role', 'region');
    banner.dir = hebrew ? 'rtl' : 'ltr';
    var title = element('h2', copy.title);
    title.id = 'analytics-choice-title';
    title.tabIndex = -1;
    var text = element('p', copy.text);
    var details = element('a', copy.privacy);
    details.href = privacyURL;
    var actions = element('div', '', 'analytics-actions');
    var decline = element('button', copy.decline);
    decline.type = 'button';
    decline.addEventListener('click', function () { save('denied'); });
    var accept = element('button', copy.accept);
    accept.type = 'button';
    accept.addEventListener('click', function () { save('granted'); });
    actions.append(decline, accept, details);
    banner.append(title, text, actions);
    banner.hidden = choice !== null;
    document.body.appendChild(banner);
    if (!choice) document.body.classList.add('analytics-choice-open');
  }

  function event(name, parameters) {
    if (choice !== 'granted' || !loaded) return;
    window.gtag('event', name, parameters);
  }

  document.addEventListener('click', function (e) {
    var anchor = e.target.closest && e.target.closest('a[href]');
    if (!anchor) return;
    var url;
    try { url = new URL(anchor.href); } catch (_) { return; }
    // Do not send mail addresses, message subjects, message text, or telephone numbers.
    if (url.protocol === 'mailto:' || url.protocol === 'tel:') {
      event('contact_click', {contact_method: url.protocol === 'mailto:' ? 'email' : 'phone'});
    } else if (/^https?:$/.test(url.protocol)) {
      if (url.hostname === host && /\.mph$/i.test(url.pathname)) {
        event('file_download', {
          file_name: url.pathname.split('/').pop(), file_extension: 'mph',
          link_url: cleanURL(url.href)
        });
      } else if (url.hostname !== host && url.origin !== location.origin) {
        event('outbound_click', {link_domain: url.hostname});
      }
    }
  });

  window.addEventListener('storage', function (e) {
    if (e.key !== choiceKey) return;
    var next = readChoice();
    if (next === choice) return;
    choice = next;
    if (choice === 'granted') start();
    else {
      window['ga-disable-' + id] = true;
      clearCookies();
      if (loaded) { location.reload(); return; }
    }
    banner.hidden = choice !== null;
    document.body.classList.toggle('analytics-choice-open', choice === null);
  });

  render();
  if (choice === 'denied') clearCookies();
  start();
}());
