/*
 * _segment.js — tiny shared helper for talking to the Segment HTTP API.
 * No dependencies. Needs Node 18+ (built-in fetch).
 */
var API = 'https://api.segment.io/v1';

function writeKey() {
  var key = process.env.WRITE_KEY || process.argv[2];
  if (!key || key === 'PASTE_YOUR_WRITE_KEY_HERE') {
    console.error('\n  ERROR: no Segment Write Key.\n' +
      '  Set it first, e.g.:  WRITE_KEY=xxxxxxxx node scripts/seed.js\n' +
      '  (Get it from the Brewfreund Store source in Segment.)\n');
    process.exit(1);
  }
  return key;
}

function authHeader(key) {
  return 'Basic ' + Buffer.from(key + ':').toString('base64');
}

// small delay so events land in a natural order, not one big burst
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

async function post(kind, key, body) {
  var res = await fetch(API + '/' + kind, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': authHeader(key) },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    var txt = await res.text();
    throw new Error('Segment ' + kind + ' failed: ' + res.status + ' ' + txt);
  }
  return true;
}

module.exports = { writeKey: writeKey, post: post, sleep: sleep };
