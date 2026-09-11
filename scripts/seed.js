/*
 * seed.js — load the whole Brewfreund store into Segment.
 * -------------------------------------------------------
 * Sends every shopper's events (a few hundred track calls across 18 shoppers).
 * Lena is seeded as THREE separate identities. NO identify calls are sent here
 * for anyone — the stitch is a live/manual act done by the merge scripts.
 *
 * Usage:
 *   WRITE_KEY=your_write_key  node scripts/seed.js
 *   node scripts/seed.js your_write_key
 *   node scripts/seed.js --dry        (compute + print the numbers, send nothing)
 *
 * After it runs, open Unify in Segment and you should see ~25 profiles,
 * with Lena present as 3 of them.
 */
var BREWFREUND = require('../dataset.js');
var STATS = require('../stats.js');
var seg = require('./_segment.js');

var DRY = process.argv.indexOf('--dry') > -1;

// spread events over the last ~14 days so the store looks lived-in
var DAY = 24 * 60 * 60 * 1000;
function ts(dayOffset, minute) {
  return new Date(Date.now() - dayOffset * DAY + minute * 60000).toISOString();
}

function pick(list, human) {
  var h = 0; for (var i = 0; i < human.length; i++) h += human.charCodeAt(i);
  return list[h % list.length];
}

function buildProps(shopper, identity, eventName, step) {
  var p = {
    product_id: shopper.product.product_id,
    category: shopper.product.category,
    price: shopper.product.price,
    source: identity.source,
    experiment_variant: identity.variant,
    consent_marketing: true
  };
  if (eventName === 'Ad Clicked') p.campaign = 'brewfreund_prospecting';
  if (step) p.step = step;
  if (eventName === 'Order Completed') {
    p.revenue = shopper.order_value;
    p.currency = 'EUR';
    p.payment_method = pick(['card', 'paypal', 'klarna'], shopper.human);
  }
  return p;
}

// expand one event shorthand into { event, step }
function parseEvent(shorthand) {
  var parts = shorthand.split(':');
  return { event: parts[0], step: parts[1] || null };
}

async function run() {
  // Always print the numbers this seed will produce.
  var s = STATS.compute();
  console.log('\n=== Brewfreund seed — the numbers this data produces ===');
  console.log('Profiles before stitch (the lie):  ' + s.profilesPre);
  console.log('Real people after stitch (truth):  ' + s.peoplePost);
  console.log('Duplicate-identity rate:           ' + s.duplicateRatePct + '%');
  console.log('Revenue misattributed:             ' + s.revMovedPct + '%');
  console.log('A/B by session (the lie):          A=' + s.abSession.A + '  B=' + s.abSession.B + '  -> winner ' + s.lieWinner);
  console.log('A/B by journey (the truth):        A=' + s.abJourney.A + '  B=' + s.abJourney.B + '  -> winner ' + s.truthWinner);
  console.log('Checkout abandons at payment:      ' + s.abandonByStage.payment + '   (shipping: ' + s.abandonByStage.shipping + ')');
  console.log('These are the numbers to expect on the dashboard. Read the real');
  console.log('workspace numbers on the call — they should match this shape.\n');

  if (DRY) { console.log('--dry: nothing sent.\n'); return; }

  var key = seg.writeKey();
  var sent = 0;

  for (var si = 0; si < BREWFREUND.SHOPPERS.length; si++) {
    var shopper = BREWFREUND.SHOPPERS[si];
    var dayOffset = 14 - si;            // older shoppers first, lumpy spread
    var minute = 0;

    for (var ii = 0; ii < shopper.identities.length; ii++) {
      var identity = shopper.identities[ii];
      for (var ei = 0; ei < identity.events.length; ei++) {
        var pe = parseEvent(identity.events[ei]);
        var body = {
          event: pe.event,
          properties: buildProps(shopper, identity, pe.event, pe.step),
          timestamp: ts(dayOffset, minute)
        };
        if (identity.kind === 'user') body.userId = identity.id;
        else body.anonymousId = identity.id;

        await seg.post('track', key, body);
        sent++;
        minute += 3;
        await seg.sleep(40);
      }
    }
    process.stdout.write('  seeded ' + shopper.name + ' (' + shopper.identities.length + ' identit' + (shopper.identities.length > 1 ? 'ies' : 'y') + ')\n');
  }

  console.log('\nDone. Sent ' + sent + ' events across ' + BREWFREUND.SHOPPERS.length + ' shoppers.');
  console.log('Open Unify -> you should see ~' + s.profilesPre + ' profiles, Lena among them as 3.\n');
}

run().catch(function (e) { console.error(e); process.exit(1); });
