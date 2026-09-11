/*
 * dataset.js — THE SOUL OF THE BREWFREUND DEMO (canonical source of truth)
 * -----------------------------------------------------------------------
 * One fictional German specialty-coffee store. 18 shoppers.
 * Lena Weber appears as 3 separate identities on purpose — the "lie".
 * A handful of shoppers convert on a desktop/direct session (Variant B)
 * after first arriving on mobile from an ad or email (Variant A). That
 * asymmetry is what makes the A/B verdict FLIP once identities are stitched.
 *
 * Nothing here is real customer data. Nothing is named after the prospect.
 * The internal codename "NoahCart" appears NOWHERE the audience can see.
 *
 * This file runs in Node (module.exports) and in the browser (window.BREWFREUND).
 */

var PRODUCTS = {
  ESP: { product_id: 'SIG-ESP-250', category: 'Espresso',      price: 14.90 },
  FIL: { product_id: 'FIL-HAUS-500', category: 'Filter',       price: 12.50 },
  EQ:  { product_id: 'EQ-GRIND-01',  category: 'Equipment',    price: 89.00 },
  SUB: { product_id: 'SUB-MONTH',    category: 'Subscription', price: 29.00 }
};

/*
 * Each shopper:
 *   human, name, email, city
 *   price_segment: 'Discount Seeker' | 'Regular' | 'Premium'
 *   subscription_status: 'subscribed' | 'none'
 *   product: one of PRODUCTS
 *   order_value: euros if they converted, else 0
 *   abandon_stage: 'shipping' | 'payment' | null
 *   firstTouch: { source, device, variant }  (journey-level, first identity)
 *   convertVia: identity id that fired Order Completed, or null
 *   userId: canonical id used to stitch this person's fragments (for merge scripts)
 *   identities: [ { id, kind:'anon'|'user', source, device, variant, events:[] } ]
 *
 * Event shorthand in `events`:
 *   'Ad Clicked', 'Email Link Clicked', 'Product Viewed', 'Pricing Viewed',
 *   'Wishlist Added', 'Cart Added', 'Checkout Started',
 *   'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment',
 *   'Order Completed', 'Checkout Abandoned'
 */
var SHOPPERS = [
  {
    human: 'lena', name: 'Lena Weber', email: 'lena.weber@example.de', city: 'Freiburg',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 0, abandon_stage: 'payment',
    firstTouch: { source: 'meta', device: 'mobile', variant: 'A' },
    convertVia: null, userId: 'u_lena',
    identities: [
      { id: 'anon_lena_ig',    kind: 'anon', source: 'meta',    device: 'mobile',  variant: 'A', events: ['Ad Clicked', 'Product Viewed'] },
      { id: 'anon_lena_email', kind: 'anon', source: 'klaviyo', device: 'mobile',  variant: 'A', events: ['Email Link Clicked', 'Product Viewed'] },
      { id: 'u_lena',          kind: 'user', source: 'direct',  device: 'desktop', variant: 'B', events: ['Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Checkout Abandoned'] }
    ]
  },
  {
    human: 'jonas', name: 'Jonas Klein', email: 'jonas.k@gmail.com', city: 'Köln',
    price_segment: 'Premium', subscription_status: 'subscribed', product: PRODUCTS.FIL,
    order_value: 58, abandon_stage: null,
    firstTouch: { source: 'organic', device: 'desktop', variant: 'A' },
    convertVia: 'u_jonas', userId: 'u_jonas',
    identities: [
      { id: 'u_jonas', kind: 'user', source: 'organic', device: 'desktop', variant: 'A', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'marie', name: 'Marie Braun', email: 'marie.b@web.de', city: 'Berlin',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 0, abandon_stage: 'shipping',
    firstTouch: { source: 'meta', device: 'mobile', variant: 'A' },
    convertVia: null, userId: 'u_marie',
    identities: [
      { id: 'anon_marie_ig', kind: 'anon', source: 'meta',   device: 'mobile',  variant: 'A', events: ['Ad Clicked', 'Product Viewed'] },
      { id: 'u_marie',       kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Abandoned'] }
    ]
  },
  {
    human: 'felix', name: 'Felix Wagner', email: 'felix.w@gmx.de', city: 'München',
    price_segment: 'Premium', subscription_status: 'none', product: PRODUCTS.EQ,
    order_value: 24, abandon_stage: null,
    firstTouch: { source: 'direct', device: 'desktop', variant: 'B' },
    convertVia: 'u_felix', userId: 'u_felix',
    identities: [
      { id: 'u_felix', kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'sophie', name: 'Sophie Hartmann', email: 'sophie.h@gmail.com', city: 'Hamburg',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 22, abandon_stage: null,
    firstTouch: { source: 'meta', device: 'mobile', variant: 'A' },
    convertVia: 'anon_sophie_desk', userId: 'u_sophie',
    identities: [
      { id: 'anon_sophie_mob',  kind: 'anon', source: 'meta',   device: 'mobile',  variant: 'A', events: ['Ad Clicked', 'Product Viewed', 'Wishlist Added'] },
      { id: 'anon_sophie_desk', kind: 'anon', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'anna', name: 'Anna Bauer', email: 'anna.b@web.de', city: 'Nürnberg',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 15, abandon_stage: null,
    firstTouch: { source: 'meta', device: 'mobile', variant: 'A' },
    convertVia: 'u_anna', userId: 'u_anna',
    identities: [
      { id: 'anon_anna_ig', kind: 'anon', source: 'meta',   device: 'mobile',  variant: 'A', events: ['Ad Clicked', 'Product Viewed'] },
      { id: 'u_anna',       kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'lukas', name: 'Lukas Meyer', email: 'lukas.m@gmail.com', city: 'Bremen',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.FIL,
    order_value: 26, abandon_stage: null,
    firstTouch: { source: 'klaviyo', device: 'mobile', variant: 'A' },
    convertVia: 'u_lukas', userId: 'u_lukas',
    identities: [
      { id: 'anon_lukas_email', kind: 'anon', source: 'klaviyo', device: 'mobile',  variant: 'A', events: ['Email Link Clicked', 'Product Viewed'] },
      { id: 'u_lukas',          kind: 'user', source: 'direct',  device: 'desktop', variant: 'B', events: ['Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'emma', name: 'Emma Schulz', email: 'emma.s@web.de', city: 'Hannover',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 17, abandon_stage: null,
    firstTouch: { source: 'meta', device: 'mobile', variant: 'A' },
    convertVia: 'u_emma', userId: 'u_emma',
    identities: [
      { id: 'anon_emma_ig', kind: 'anon', source: 'meta',   device: 'mobile',  variant: 'A', events: ['Ad Clicked', 'Product Viewed', 'Wishlist Added'] },
      { id: 'u_emma',       kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'paul', name: 'Paul Richter', email: 'paul.r@gmail.com', city: 'Augsburg',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.FIL,
    order_value: 22, abandon_stage: null,
    firstTouch: { source: 'direct', device: 'desktop', variant: 'B' },
    convertVia: 'u_paul', userId: 'u_paul',
    identities: [
      { id: 'u_paul', kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'clara', name: 'Clara Fischer', email: 'clara.f@web.de', city: 'Dresden',
    price_segment: 'Premium', subscription_status: 'none', product: PRODUCTS.EQ,
    order_value: 35, abandon_stage: null,
    firstTouch: { source: 'organic', device: 'desktop', variant: 'A' },
    convertVia: 'u_clara', userId: 'u_clara',
    identities: [
      { id: 'u_clara', kind: 'user', source: 'organic', device: 'desktop', variant: 'A', events: ['Product Viewed', 'Wishlist Added', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'ben', name: 'Ben Hoffmann', email: 'ben.h@gmx.de', city: 'Leipzig',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 18, abandon_stage: null,
    firstTouch: { source: 'direct', device: 'desktop', variant: 'B' },
    convertVia: 'u_ben', userId: 'u_ben',
    identities: [
      { id: 'u_ben', kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'max', name: 'Max Brandt', email: 'max.b@gmail.com', city: 'Stuttgart',
    price_segment: 'Premium', subscription_status: 'subscribed', product: PRODUCTS.SUB,
    order_value: 58, abandon_stage: null,
    firstTouch: { source: 'organic', device: 'desktop', variant: 'A' },
    convertVia: 'u_max', userId: 'u_max',
    identities: [
      { id: 'u_max', kind: 'user', source: 'organic', device: 'desktop', variant: 'A', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Order Completed'] }
    ]
  },
  {
    human: 'nina', name: 'Nina Wolf', email: 'nina.w@gmx.de', city: 'Dortmund',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 0, abandon_stage: 'payment',
    firstTouch: { source: 'direct', device: 'desktop', variant: 'B' },
    convertVia: null, userId: 'u_nina',
    identities: [
      { id: 'u_nina', kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Checkout Abandoned'] }
    ]
  },
  {
    human: 'tom', name: 'Tom Kaiser', email: null, city: 'Kiel',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 0, abandon_stage: 'shipping',
    firstTouch: { source: 'meta', device: 'mobile', variant: 'A' },
    convertVia: null, userId: null,
    identities: [
      { id: 'anon_tom_ig', kind: 'anon', source: 'meta', device: 'mobile', variant: 'A', events: ['Ad Clicked', 'Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Abandoned'] }
    ]
  },
  {
    human: 'julia', name: 'Julia Peters', email: 'julia.p@web.de', city: 'Essen',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.FIL,
    order_value: 0, abandon_stage: 'payment',
    firstTouch: { source: 'direct', device: 'desktop', variant: 'B' },
    convertVia: null, userId: 'u_julia',
    identities: [
      { id: 'u_julia', kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Checkout Abandoned'] }
    ]
  },
  {
    human: 'david', name: 'David Lang', email: null, city: 'Mannheim',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.EQ,
    order_value: 0, abandon_stage: null,
    firstTouch: { source: 'organic', device: 'mobile', variant: 'A' },
    convertVia: null, userId: null,
    identities: [
      { id: 'anon_david_mob', kind: 'anon', source: 'organic', device: 'mobile', variant: 'A', events: ['Product Viewed', 'Pricing Viewed', 'Wishlist Added'] }
    ]
  },
  {
    human: 'sara', name: 'Sara Gruber', email: 'sara.g@gmail.com', city: 'Bonn',
    price_segment: 'Regular', subscription_status: 'none', product: PRODUCTS.ESP,
    order_value: 0, abandon_stage: 'payment',
    firstTouch: { source: 'direct', device: 'desktop', variant: 'B' },
    convertVia: null, userId: 'u_sara',
    identities: [
      { id: 'u_sara', kind: 'user', source: 'direct', device: 'desktop', variant: 'B', events: ['Product Viewed', 'Cart Added', 'Checkout Started', 'Checkout Step Viewed:shipping', 'Checkout Step Viewed:payment', 'Checkout Abandoned'] }
    ]
  },
  {
    human: 'lea', name: 'Lea Thomas', email: null, city: 'Wiesbaden',
    price_segment: 'Discount Seeker', subscription_status: 'none', product: PRODUCTS.FIL,
    order_value: 0, abandon_stage: null,
    firstTouch: { source: 'klaviyo', device: 'mobile', variant: 'A' },
    convertVia: null, userId: null,
    identities: [
      { id: 'anon_lea_email', kind: 'anon', source: 'klaviyo', device: 'mobile', variant: 'A', events: ['Email Link Clicked', 'Product Viewed', 'Pricing Viewed'] }
    ]
  }
];

var BREWFREUND = { PRODUCTS: PRODUCTS, SHOPPERS: SHOPPERS };

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BREWFREUND;
} else if (typeof window !== 'undefined') {
  window.BREWFREUND = BREWFREUND;
}
