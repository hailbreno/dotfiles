
// From: extension/chromeEnricher.js
"use strict";

function $feedly(msg) {
  window.console.log(msg);
}

try {
  document.body.setAttribute("data-enricher", "yes");

  document.body.addEventListener("feedlyEnrichmentRequest", askEnrich, false);
} catch (e) {
  window.console.log("[feedly] chrome enricher failed: " + e.name + " -- " + e.body);
}

function createCustomEvent(type, payload) {
  try {
    var evt = document.createEvent("CustomEvent");
    evt.initCustomEvent(type, false, false, payload);
    return evt;
  } catch (e) {
    return null;
  }
}

function askEnrich(event) {
  chrome.runtime.sendMessage(event.detail, function(response) {
    var feEvent = createCustomEvent("feedlyEnrichmentResponse", response);

    if (feEvent != null && document.body != null)
      document.body.dispatchEvent(feEvent);
  });
}

;
