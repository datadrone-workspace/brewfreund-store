/* ==========================================================================
   Brewfreund — Segment instrumentation
   ==========================================================================
   This is the ONLY file you need to touch to wire this site to Segment.
   Paste your web source Write Key below, then every event on the site will
   start flowing into Segment automatically.
   ========================================================================== */

const SEGMENT_WRITE_KEY = "gktZ2jGZHKWXJNg2Xy49aB7YXHYzbvlI"; // <-- put your Segment web source write key here

/* --------------------------------------------------------------------------
   1. Standard Segment analytics.js 2.0 loader snippet (unmodified pattern).
      This must run before any analytics.* calls elsewhere on the page, and
      it queues calls automatically, so load order of this file matters:
      load this file before app.js and before any page-level tracking code.
   -------------------------------------------------------------------------- */
!function () {
  var analytics = (window.analytics = window.analytics || []);
  if (!analytics.initialize)
    if (analytics.invoked) {
      window.console && console.error && console.error("Segment snippet included twice.");
    } else {
      analytics.invoked = !0;
      analytics.methods = [
        "trackSubmit", "trackClick", "trackLink", "trackForm", "pageview",
        "identify", "reset", "group", "track", "ready", "alias", "debug",
        "page", "once", "off", "on", "addSourceMiddleware", "addIntegrationMiddleware",
        "setAnonymousId", "addDestinationMiddleware", "register"
      ];
      analytics.factory = function (e) {
        return function () {
          if (window.analytics.initialized) return window.analytics[e].apply(window.analytics, arguments);
          var i = Array.prototype.slice.call(arguments);
          i.unshift(e);
          analytics.push(i);
          return analytics;
        };
      };
      for (var e = 0; e < analytics.methods.length; e++) {
        var key = analytics.methods[e];
        analytics[key] = analytics.factory(key);
      }
      analytics.load = function (key, i) {
        var t = document.createElement("script");
        t.type = "text/javascript";
        t.async = !0;
        t.src = "https://cdn.segment.com/analytics.js/v1/" + key + "/analytics.min.js";
        var n = document.getElementsByTagName("script")[0];
        n.parentNode.insertBefore(t, n);
        analytics._loadOptions = i;
      };
      analytics._writeKey = SEGMENT_WRITE_KEY;
      analytics.SNIPPET_VERSION = "4.16.1";
      if (SEGMENT_WRITE_KEY && SEGMENT_WRITE_KEY !== "gktZ2jGZHKWXJNg2Xy49aB7YXHYzbvlI") {
        analytics.load(SEGMENT_WRITE_KEY);
      }
    }
}();

/* --------------------------------------------------------------------------
   2. Small helpers used by every page. These wrap window.analytics so the
      rest of the site never has to think about write-key state, source
      attribution, or device labeling — it just calls bfTrack/bfIdentify/bfPage.
   -------------------------------------------------------------------------- */

/** Reads a query parameter from the current URL. */
function bfParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Resolves the "source" property: utm_source if present on the current URL,
 * else whatever was captured earlier this session, else "direct". Persisting
 * it means a channel simulated on the landing page (e.g. ?utm_source=instagram)
 * still labels events on pages the visitor clicks into afterwards.
 */
function bfSource() {
  var fromUrl = bfParam("utm_source");
  if (fromUrl) {
    localStorage.setItem("bf_session_source", fromUrl);
    return fromUrl;
  }
  return localStorage.getItem("bf_session_source") || "direct";
}

/** Resolves device_type: explicit ?device= override (persisted), else inferred from screen width. */
function bfDeviceType() {
  var override = bfParam("device");
  if (override === "mobile" || override === "desktop") {
    localStorage.setItem("bf_session_device", override);
    return override;
  }
  var stored = localStorage.getItem("bf_session_device");
  if (stored === "mobile" || stored === "desktop") return stored;
  return window.innerWidth <= 760 ? "mobile" : "desktop";
}

/** Fires analytics.page() — call once on every page load. */
function bfPage(category, name) {
  if (category) {
    window.analytics.page(category, name || document.title);
  } else {
    window.analytics.page();
  }
}

/** Fires analytics.identify() with a lowercased email as the userId. */
function bfIdentify(email, traits) {
  if (!email) return;
  var userId = email.trim().toLowerCase();
  window.analytics.identify(userId, Object.assign({ email: userId }, traits || {}));
  return userId;
}

/** Fires a track event, always. */
function bfTrack(event, properties) {
  window.analytics.track(event, properties || {});
}

/** Convenience: stamps source + device_type onto a properties object. */
function bfWithContext(properties) {
  return Object.assign({}, properties, {
    source: bfSource(),
    device_type: bfDeviceType()
  });
}
