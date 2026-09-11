/*
 * merge-cast.js — OPTIONAL. Stitch the rest of the duplicate shoppers.
 * -------------------------------------------------------------------
 * The base is seeded fragmented on purpose (that is the lie). This script
 * resolves everyone EXCEPT Lena, so Unify shows the true, lower headcount
 * base-wide after you have made your point. Lena is handled separately by
 * merge-lena.js so her collapse stays the live moment.
 *
 * Run this only when you want the workspace itself to show the stitched
 * truth for the whole store (e.g. right after the live Lena merge).
 *
 * Usage:
 *   WRITE_KEY=your_write_key  node scripts/merge-cast.js
 */
var BREWFREUND = require('../dataset.js');
var seg = require('./_segment.js');

async function run() {
  var key = seg.writeKey();
  var merged = 0;

  for (var si = 0; si < BREWFREUND.SHOPPERS.length; si++) {
    var s = BREWFREUND.SHOPPERS[si];
    if (s.human === 'lena') continue;              // Lena is the live act
    if (s.identities.length < 2) continue;         // nothing to stitch
    if (!s.userId) continue;                        // needs a canonical id

    var traits = { email: s.email, name: s.name, city: s.city };
    var anons = s.identities.filter(function (i) { return i.kind === 'anon'; });
    for (var i = 0; i < anons.length; i++) {
      await seg.post('identify', key, {
        userId: s.userId,
        anonymousId: anons[i].id,
        traits: traits
      });
      await seg.sleep(40);
    }
    merged++;
    console.log('  stitched ' + s.name + ' (' + s.identities.length + ' -> 1)');
  }

  console.log('\nStitched ' + merged + ' shoppers. Unify headcount should now match the truth.\n');
}

run().catch(function (e) { console.error(e); process.exit(1); });
