(function () {

  'use strict';

  // Skip if there is no basic support.
  if (!document.querySelector) {
    return;
  }

  // Just in case, initialize the dataLayer.
  window.dataLayer = window.dataLayer || [];

  // This is the original language of the page. Change as appropriate.
  var baseLanguage = 'en';

  // Store recorded events to avoid recording the same ones.
  var events = {};

  // Get the current language for the page.
  function getCurrentLanguage() {
    return document.documentElement.getAttribute('lang') || baseLanguage;
  }

  // Check if the page is translated.
  function isTranslated() {
    return getCurrentLanguage() !== baseLanguage;
  }

  // Various methods to attempt to detect what tool or service was used for
  // the translation.
  function isGoogleTranslateTranslation() {
    return document.querySelector('meta[http-equiv="X-Translated-By"][content="Google"]');
  }
  function isChromeTranslation() {
    return document.querySelector('link[href^="https://translate.goog"]');
  }
  function isFirefoxTranslation() {
    return document.querySelector('title').hasAttribute('x-bergamot-translated');
  }
  function isEdgeTranslation() {
    return document.querySelector('title').hasAttribute('_msthash');
  }

  // Try to detect the tool or service used for the translation.
  function getTranslationService() {
    if (isGoogleTranslateTranslation()) {
      return 'translate.google.com';
    }
    else if (isChromeTranslation()) {
      return 'chrome';
    }
    else if (isFirefoxTranslation()) {
      return 'firefox';
    }
    else if (isEdgeTranslation()) {
      return 'edge';
    }
    return 'unknown';
  }

  // Determine how confident we are that a translation occured.
  function determineConfidence(language, service) {
    return (language !== baseLanguage ? 2 : 0) + (service !== 'unknown' ? 1 : 0);
  }

  // Record a translation event.
  function recordTranslationEvent() {
    var language = getCurrentLanguage();
    var service = getTranslationService();

    if (!events[language + '|' + service]) {
      // Some tools like firefox or edge translations don't change the HTML
      // language attribute and don't provide any mean to detect the target
      // language so this will be recorded as an event with the base language.
      var event = {
        'event': 'page_translated',
        'translation_language': language,
        'translation_service': service,
        'translation_confidence': determineConfidence(language, service)
      };

      window.dataLayer.push(event);
      events[language + '|' + service] = true;
    }
  }

  // Check if the page is already translated.
  if (isTranslated()) {
    recordTranslationEvent();
  }

  // Observe mutations on some attributes to detect translations.
  if (typeof window.MutationObserver !== 'undefined') {
    var observer = new MutationObserver(function (mutations) {
      recordTranslationEvent();
    });

    observer.observe(document.documentElement, {
      attributeFilter: ['lang']
    });

    observer.observe(document.querySelector('title'), {
      attributeFilter: ['x-bergamot-translated', '_msthash'],
      // We consider that changes to the page title's content is possibly due to
      // a translation. Set both attributes below to 'false' to disable.
      characterData: true,
      childList: true
    });
  }
})();
