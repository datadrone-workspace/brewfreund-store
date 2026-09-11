/*
 * merge-lena.js — THE LIVE ACT. Run this ON CAMERA during the demo.
 * ----------------------------------------------------------------
 * Fires the two identify calls that link Lena's two anonymous phone
 * sessions to her known laptop account. Watch Unify collapse her
 * 3 profiles into 1 within a few seconds.
 *
 * Do NOT run this during seeding. The whole point is that it happens live.
 *
 * Usage:
 *   WRITE_KEY=your_write_key  node scripts/merge-lena.js
 */
var BREWFREUND = require('../dataset.js');
var seg = require('./_segment.js');

var lena = BREWFREUND.SHOPPERS.filter(function (s) { return s.human === 'lena'; })[0];

async function run() {
  var key = seg.writeKey();
  var traits = { email: lena.email, name: lena.name, city: lena.city };

  // link each anonymous session to Lena's known userId
  var anons = lena.identities.filter(function (i) { return i.kind === 'anon'; });
  for (var i = 0; i < anons.length; i++) {
    await seg.post('identify', key, {
      userId: lena.userId,
      anonymousId: anons[i].id,
      traits: traits
    });
    console.log('  linked ' + anons[i].id + '  ->  ' + lena.userId);
  }

  console.log('\nLena identify sent. Watch Unify: 3 profiles should become 1.');
  console.log('If it lags a few seconds, that is normal — the fallback recording covers it.\n');
}

run().catch(function (e) { console.error(e); process.exit(1); });
