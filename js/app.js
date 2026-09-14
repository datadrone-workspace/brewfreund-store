/* ==========================================================================
   Brewfreund — shared app logic
   ========================================================================== */

const BF_KEYS = {
  user: "bf_user",
  cart: "bf_cart",
  orders: "bf_orders",
  variant: "bf_variant",
  checkout: "bf_checkout_draft",
  accounts: "bf_accounts"
};

function bfGetAccounts() {
  try { return JSON.parse(localStorage.getItem(BF_KEYS.accounts)) || {}; } catch (e) { return {}; }
}
function bfSaveAccount(email, record) {
  var accounts = bfGetAccounts();
  accounts[email] = record;
  localStorage.setItem(BF_KEYS.accounts, JSON.stringify(accounts));
}
function bfFindAccount(email) {
  return bfGetAccounts()[email.trim().toLowerCase()];
}

/** Derives a clean display name from an email local part, e.g. john.doe23@x.com -> "John Doe". */
function bfNameFromEmail(email) {
  var local = String(email || "").split("@")[0];
  var words = local.replace(/[._+\-]+/g, " ").replace(/[0-9]+/g, " ").replace(/\s+/g, " ").trim().split(" ");
  return words.filter(Boolean).map(function (w) {
    return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
  }).join(" ");
}

(function handleOperatorControls() {
  if (bfParam("reset") === "1") {
    localStorage.clear();
    var url = new URL(window.location.href);
    url.searchParams.delete("reset");
    window.history.replaceState({}, "", url.toString());
  }
})();

function bfGetUser() {
  try { return JSON.parse(localStorage.getItem(BF_KEYS.user)); } catch (e) { return null; }
}
function bfSetUser(user) {
  localStorage.setItem(BF_KEYS.user, JSON.stringify(user));
}
function bfLogout() {
  localStorage.removeItem(BF_KEYS.user);
}

(function handleEmailLinkLanding() {
  var linked = bfParam("u");
  if (!linked) return;
  var email;
  try {
    email = decodeURIComponent(linked);
    if (!email.includes("@")) email = atob(linked);
  } catch (e) {
    email = linked;
  }
  email = email.trim().toLowerCase();
  var existing = bfGetUser();
  var name = (existing && existing.name) ? existing.name : bfNameFromEmail(email);
  bfSetUser({ email: email, name: name });
  bfIdentify(email, { email: email, name: name || undefined });
})();

const BF_EXPERIMENT_ID = "pdp_cta_ab";
const BF_EXPERIMENT_NAME = "PDP CTA Subscription vs Cart";

function bfGetVariant() {
  var forced = bfParam("v");
  if (forced === "A" || forced === "B") {
    localStorage.setItem(BF_KEYS.variant, forced);
    return forced;
  }
  var stored = localStorage.getItem(BF_KEYS.variant);
  if (stored === "A" || stored === "B") return stored;
  var assigned = Math.random() < 0.5 ? "A" : "B";
  localStorage.setItem(BF_KEYS.variant, assigned);
  return assigned;
}

function bfUuid() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    var r = Math.random() * 16 | 0, v = c === "x" ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
function bfGetCart() {
  try {
    var cart = JSON.parse(localStorage.getItem(BF_KEYS.cart));
    if (cart && cart.items) return cart;
  } catch (e) {}
  var fresh = { cartId: bfUuid(), items: [] };
  localStorage.setItem(BF_KEYS.cart, JSON.stringify(fresh));
  return fresh;
}
function bfSaveCart(cart) {
  localStorage.setItem(BF_KEYS.cart, JSON.stringify(cart));
}
function bfCartCount() {
  return bfGetCart().items.reduce(function (sum, i) { return sum + i.qty; }, 0);
}
function bfAddToCart(productId, qty) {
  var cart = bfGetCart();
  var existing = cart.items.find(function (i) { return i.productId === productId; });
  if (existing) existing.qty += qty;
  else cart.items.push({ productId: productId, qty: qty });
  bfSaveCart(cart);
  var product = bfGetProduct(productId);
  bfTrack("Product Added", {
    product_id: product.id, sku: product.sku, name: product.name,
    price: product.price, quantity: qty, cart_id: cart.cartId, currency: "EUR"
  });
  return cart;
}
function bfUpdateQty(productId, qty) {
  var cart = bfGetCart();
  var item = cart.items.find(function (i) { return i.productId === productId; });
  if (!item) return cart;
  if (qty <= 0) {
    cart.items = cart.items.filter(function (i) { return i.productId !== productId; });
  } else {
    item.qty = qty;
  }
  bfSaveCart(cart);
  return cart;
}
function bfRemoveFromCart(productId) { return bfUpdateQty(productId, 0); }
function bfCartLines() {
  var cart = bfGetCart();
  return cart.items.map(function (i) {
    var p = bfGetProduct(i.productId);
    return Object.assign({ qty: i.qty }, p);
  }).filter(function (l) { return l.id; });
}
function bfCartSubtotal() {
  return bfCartLines().reduce(function (sum, l) { return sum + l.price * l.qty; }, 0);
}
function bfClearCart() {
  localStorage.setItem(BF_KEYS.cart, JSON.stringify({ cartId: bfUuid(), items: [] }));
}

function bfGetOrders() {
  try {
    var orders = JSON.parse(localStorage.getItem(BF_KEYS.orders));
    return Array.isArray(orders) ? orders : [];
  } catch (e) { return []; }
}
function bfSaveOrder(order) {
  var orders = bfGetOrders();
  orders.unshift(order);
  localStorage.setItem(BF_KEYS.orders, JSON.stringify(orders));
}
function bfOrdersForCurrentUser() {
  var user = bfGetUser();
  if (!user) return [];
  return bfGetOrders().filter(function (o) { return o.email === user.email; });
}

function bfThumbStyle(imageUrl) {
  return "background-image:url(" + imageUrl + "), linear-gradient(155deg, #7A5638, #2A1912);";
}
function bfPrice(amount) { return "€" + amount.toFixed(2); }
function bfDate(iso) {
  var d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}
function bfUpdateCartBadge() {
  var badge = document.querySelector(".cart-count");
  if (badge) badge.textContent = bfCartCount();
}
function bfToast(message) {
  var el = document.querySelector(".toast");
  if (!el) {
    el = document.createElement("div");
    el.className = "toast";
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(window.__bfToastTimer);
  window.__bfToastTimer = setTimeout(function () { el.classList.remove("show"); }, 2600);
}

const BF_MARK_SVG = '<svg class="brand-mark" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
  '<path d="M16 3C10 3 6 8 6 14c0 7 4.5 12 10 15 5.5-3 10-8 10-15 0-6-4-11-10-11Z" fill="#A85B2A"/>' +
  '<path d="M16 8c-2.5 2-4 4.5-4 7.5 0 3.3 2 6 4 7 2-1 4-3.7 4-7 0-3-1.5-5.5-4-7.5Z" fill="#2A1912"/>' +
  '</svg>';

function bfRenderHeader(activePage) {
  var user = bfGetUser();
  var nav = [
    { href: "index.html", label: "Home", key: "home" },
    { href: "shop.html", label: "Shop", key: "shop" },
    { href: "subscription.html", label: "Subscription", key: "subscription" }
  ];
  var navHtml = nav.map(function (item) {
    return '<a href="' + item.href + '" class="' + (item.key === activePage ? "active" : "") + '">' + item.label + "</a>";
  }).join("");
  var accountHtml = user
    ? '<a class="icon-link" href="account.html">' + (user.name ? user.name.split(" ")[0] : "Account") + "</a>"
    : '<a class="icon-link" href="login.html">Log in</a>';
  var header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML =
    '<div class="header-inner">' +
      '<a href="index.html" class="brand">' + BF_MARK_SVG + "Brewfreund</a>" +
      '<button class="nav-toggle" aria-label="Toggle navigation" aria-expanded="false"><span></span></button>' +
      '<nav class="main-nav">' + navHtml + "</nav>" +
      '<div class="header-actions">' +
        accountHtml +
        '<a class="icon-link" href="cart.html">Cart<span class="cart-count">' + bfCartCount() + "</span></a>" +
      "</div>" +
    "</div>";
  document.body.insertBefore(header, document.body.firstChild);
  var toggle = header.querySelector(".nav-toggle");
  var menu = header.querySelector(".main-nav");
  toggle.addEventListener("click", function () {
    var open = menu.classList.toggle("open");
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
}

function bfRenderFooter() {
  var footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML =
    '<div class="container">' +
      '<div class="footer-grid">' +
        '<div class="footer-brand">' +
          '<a href="index.html" class="brand" style="color:inherit;margin-bottom:12px;">' + BF_MARK_SVG + "Brewfreund</a>" +
          "<p>Specialty coffee roasted in small batches in Freiburg, Germany. Sourced directly, roasted gently, shipped fresh.</p>" +
        "</div>" +
        '<div><h4>Shop</h4><ul>' +
          '<li><a href="shop.html?roast=all">All coffee</a></li>' +
          '<li><a href="shop.html?category=espresso">Espresso</a></li>' +
          '<li><a href="shop.html?category=filter">Filter</a></li>' +
          '<li><a href="subscription.html">Subscription</a></li>' +
        "</ul></div>" +
        '<div><h4>Account</h4><ul>' +
          '<li><a href="account.html">My account</a></li>' +
          '<li><a href="cart.html">Cart</a></li>' +
          '<li><a href="login.html">Log in</a></li>' +
          '<li><a href="signup.html">Sign up</a></li>' +
        "</ul></div>" +
        '<div><h4>Brewfreund</h4><ul>' +
          '<li><a href="index.html#story">Our story</a></li>' +
          '<li><a href="index.html#testimonials">Reviews</a></li>' +
          '<li><a href="shop.html">Roastery shop</a></li>' +
        "</ul></div>" +
      "</div>" +
      '<div class="footer-bottom">' +
        "<span>© " + new Date().getFullYear() + " Brewfreund GmbH, Freiburg im Breisgau, Germany</span>" +
        "<span>Roasted with care since 2016</span>" +
      "</div>" +
    "</div>";
  document.body.appendChild(footer);
}

function bfInitPage(options) {
  options = options || {};
  bfRenderHeader(options.active);
  document.addEventListener("DOMContentLoaded", function () {});
  bfRenderFooter();
  bfPage();
}
