(function (window, document) {
  "use strict";

  var defaults = {
    siteId: window.location.hostname,
    enabled: true,
    position: "bottom-right",
    delayMs: 5000,
    displayDurationMs: 6500,
    intervalMs: 7000,
    maxPerSession: 3,
    showCloseButton: true,
    messages: []
  };

  function merge(options) {
    var result = {};
    Object.keys(defaults).forEach(function (key) {
      result[key] = options && options[key] !== undefined ? options[key] : defaults[key];
    });
    return result;
  }

  function readNumber(key) {
    try { return Number(window.sessionStorage.getItem(key) || 0); } catch (_) { return 0; }
  }

  function writeSession(key, value) {
    try { window.sessionStorage.setItem(key, String(value)); } catch (_) {}
  }

  function addStyles() {
    if (document.getElementById("tmf-social-proof-styles")) return;
    var style = document.createElement("style");
    style.id = "tmf-social-proof-styles";
    style.textContent =
      ".tmf-proof{position:fixed;z-index:2147483000;width:min(390px,calc(100vw - 32px));display:flex;align-items:flex-start;gap:14px;padding:18px 46px 18px 19px;border:1px solid rgba(129,70,63,.22);border-radius:12px;background:rgba(250,247,242,.98);color:#2d2522;box-shadow:0 18px 48px rgba(75,54,45,.18);font-family:Mulish,Arial,sans-serif;opacity:0;transform:translateY(14px);transition:opacity .36s ease,transform .36s ease;box-sizing:border-box;pointer-events:none}" +
      ".tmf-proof[data-visible=true]{opacity:1;transform:translateY(0);pointer-events:auto}.tmf-proof[data-position=bottom-left]{left:16px;bottom:16px}.tmf-proof[data-position=bottom-right]{right:16px;bottom:16px}" +
      ".tmf-proof__mark{flex:0 0 auto;width:35px;height:35px;border-radius:50%;display:grid;place-items:center;background:#81463f;color:#fffdf9;font:600 17px 'Playfair Display',Georgia,serif}" +
      ".tmf-proof__content{min-width:0}.tmf-proof__title{display:block;margin:0 0 4px;font:800 11px/1.35 Mulish,Arial,sans-serif;letter-spacing:.13em;text-transform:uppercase;color:#81463f}.tmf-proof__text{margin:0;font:400 13px/1.5 Mulish,Arial,sans-serif;color:#514743}" +
      ".tmf-proof__close{position:absolute;right:10px;top:9px;width:30px;height:30px;border:0;background:transparent;color:#6e655f;font:400 21px/1 Arial,sans-serif;cursor:pointer;border-radius:50%}.tmf-proof__close:hover,.tmf-proof__close:focus-visible{background:rgba(129,70,63,.08);outline:2px solid transparent}" +
      "@media(max-width:560px){.tmf-proof{left:12px!important;right:12px!important;bottom:12px!important;width:auto;transform:translateY(14px)!important}.tmf-proof[data-visible=true]{transform:translateY(0)!important}}" +
      "@media(prefers-reduced-motion:reduce){.tmf-proof{transition:none}}";
    document.head.appendChild(style);
  }

  function init(options) {
    var config = merge(options);
    var messages = (Array.isArray(config.messages) ? config.messages : []).filter(function (message) {
      return message && message.enabled !== false && typeof message.text === "string" && message.text.trim();
    });
    if (!config.enabled || !messages.length) return;

    var storageRoot = "tmf_proof_stream_" + config.siteId;
    var shownCount = readNumber(storageRoot + "_count");
    var messageIndex = readNumber(storageRoot + "_index");
    if (shownCount >= config.maxPerSession || messageIndex >= messages.length) return;
    addStyles();

    var root = document.createElement("aside");
    root.className = "tmf-proof";
    root.dataset.position = config.position;
    root.dataset.visible = "false";
    root.setAttribute("role", "status");
    root.setAttribute("aria-live", "polite");
    root.setAttribute("aria-atomic", "true");
    root.innerHTML = '<span class="tmf-proof__mark" aria-hidden="true">M</span><div class="tmf-proof__content"><strong class="tmf-proof__title"></strong><p class="tmf-proof__text"></p></div>' +
      (config.showCloseButton ? '<button type="button" class="tmf-proof__close" aria-label="Hinweise schließen">×</button>' : '');
    document.body.appendChild(root);

    var showTimer = 0;
    var hideTimer = 0;
    var stopped = false;

    function stop() {
      stopped = true;
      window.clearTimeout(showTimer);
      window.clearTimeout(hideTimer);
      root.dataset.visible = "false";
      writeSession(storageRoot + "_count", config.maxPerSession);
    }

    function schedule(delay) {
      if (stopped || shownCount >= config.maxPerSession || messageIndex >= messages.length) return;
      showTimer = window.setTimeout(showWhenClear, delay);
    }

    function hide() {
      root.dataset.visible = "false";
      schedule(config.intervalMs);
    }

    function show() {
      var message = messages[messageIndex++];
      root.querySelector(".tmf-proof__title").textContent = message.title || "Eine Kundin schreibt";
      root.querySelector(".tmf-proof__text").textContent = message.text;
      root.dataset.visible = "true";
      shownCount += 1;
      writeSession(storageRoot + "_count", shownCount);
      writeSession(storageRoot + "_index", messageIndex);
      hideTimer = window.setTimeout(hide, config.displayDurationMs);
    }

    function showWhenClear() {
      var consentDialog = document.getElementById("tmf-consent");
      if (consentDialog && !consentDialog.hidden) {
        showTimer = window.setTimeout(showWhenClear, 750);
        return;
      }
      show();
    }

    var close = root.querySelector(".tmf-proof__close");
    if (close) close.addEventListener("click", stop);
    schedule(config.delayMs);
  }

  window.TMFSocialProof = { init: init };
})(window, document);
