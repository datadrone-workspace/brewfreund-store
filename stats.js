/*
 * stats.js — compute the LIE and the TRUTH from the same event set.
 * Both computations are honest; the only difference is whether identities
 * are treated as separate (the lie) or stitched (the truth).
 *
 * Runs in Node and in the browser. Returns plain numbers the dashboard and
 * the seed script both display, so what is on screen always matches the data.
 */
(function (root, factory) {
  var mod = factory(
    (typeof require !== 'undefined')
      ? require('./dataset.js')
      : (root.BREWFREUND)
  );
  if (typeof module !== 'undefined' && module.exports) module.exports = mod;
  else root.BREWFREUND_STATS = mod;
})(typeof self !== 'undefined' ? self : this, function (BREWFREUND) {

  var SHOPPERS = BREWFREUND.SHOPPERS;

  function round(n) { return Math.round(n * 10) / 10; }

  function compute() {
    // ---- Identity counts -------------------------------------------------
    var profilesPre = 0;                 // every fragment counts as a "person"
    SHOPPERS.forEach(function (s) { profilesPre += s.identities.length; });
    var peoplePost = SHOPPERS.length;    // real humans after stitching
    var duplicateProfiles = profilesPre - peoplePost;
    var duplicateRatePct = round(100 * duplicateProfiles / profilesPre);
    var fragmentedShoppers = SHOPPERS.filter(function (s) { return s.identities.length > 1; }).length;

    // ---- Revenue by touchpoint ------------------------------------------
    // LIE: credit the converting SESSION's source.
    // TRUTH: credit the JOURNEY's first-touch source.
    var lie = { instagram: 0, email: 0, direct: 0, organic: 0 };
    var truth = { instagram: 0, email: 0, direct: 0, organic: 0 };
    var srcToBucket = { meta: 'instagram', klaviyo: 'email', direct: 'direct', organic: 'organic' };
    var totalRevenue = 0;

    SHOPPERS.forEach(function (s) {
      if (!s.convertVia) return;
      totalRevenue += s.order_value;
      var convId = s.identities.filter(function (i) { return i.id === s.convertVia; })[0];
      lie[srcToBucket[convId.source]] += s.order_value;
      truth[srcToBucket[s.firstTouch.source]] += s.order_value;
    });

    // Revenue that changed touchpoint between the two views.
    var moved = 0;
    ['instagram', 'email', 'direct', 'organic'].forEach(function (b) {
      var diff = truth[b] - lie[b];
      if (diff > 0) moved += diff;
    });
    var revMovedPct = round(100 * moved / totalRevenue);

    // ---- A/B test verdict -----------------------------------------------
    // LIE: count each conversion under its converting SESSION's variant.
    // TRUTH: count each conversion under its JOURNEY first-touch variant.
    var abSession = { A: 0, B: 0 };
    var abJourney = { A: 0, B: 0 };
    SHOPPERS.forEach(function (s) {
      if (!s.convertVia) return;
      var convId = s.identities.filter(function (i) { return i.id === s.convertVia; })[0];
      abSession[convId.variant] += 1;
      abJourney[s.firstTouch.variant] += 1;
    });
    var lieWinner = abSession.B >= abSession.A ? 'B' : 'A';
    var truthWinner = abJourney.A >= abJourney.B ? 'A' : 'B';

    // ---- Checkout funnel (cross-device, stitched) -----------------------
    var funnel = { cart: 0, checkout: 0, shipping: 0, payment: 0, ordered: 0 };
    var abandonByStage = { shipping: 0, payment: 0 };
    SHOPPERS.forEach(function (s) {
      var evs = [];
      s.identities.forEach(function (i) { evs = evs.concat(i.events); });
      if (evs.indexOf('Cart Added') > -1) funnel.cart += 1;
      if (evs.indexOf('Checkout Started') > -1) funnel.checkout += 1;
      if (evs.indexOf('Checkout Step Viewed:shipping') > -1) funnel.shipping += 1;
      if (evs.indexOf('Checkout Step Viewed:payment') > -1) funnel.payment += 1;
      if (evs.indexOf('Order Completed') > -1) funnel.ordered += 1;
      if (s.abandon_stage) abandonByStage[s.abandon_stage] += 1;
    });

    // ---- Audiences (computed traits) ------------------------------------
    var cartAbandonersPayment = SHOPPERS.filter(function (s) { return s.abandon_stage === 'payment'; });
    var discountSeekers = SHOPPERS.filter(function (s) { return s.price_segment === 'Discount Seeker'; });
    var premiumNoSub = SHOPPERS.filter(function (s) { return s.price_segment === 'Premium' && s.subscription_status === 'none'; });

    return {
      profilesPre: profilesPre,
      peoplePost: peoplePost,
      duplicateProfiles: duplicateProfiles,
      duplicateRatePct: duplicateRatePct,
      fragmentedShoppers: fragmentedShoppers,
      totalRevenue: totalRevenue,
      revenueLie: lie,
      revenueTruth: truth,
      revMovedPct: revMovedPct,
      abSession: abSession,
      abJourney: abJourney,
      lieWinner: lieWinner,
      truthWinner: truthWinner,
      funnel: funnel,
      abandonByStage: abandonByStage,
      audiences: {
        cartAbandonersPayment: cartAbandonersPayment.map(function (s) { return s.name; }),
        discountSeekers: discountSeekers.map(function (s) { return s.name; }),
        premiumNoSub: premiumNoSub.map(function (s) { return s.name; })
      }
    };
  }

  return { compute: compute };
});
