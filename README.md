# Brewfreund — Test Integrity Audit demo

A fake German specialty-coffee store used to show one thing: a store's own
analytics count one shopper (Lena) as three people, so its A/B test crowns the
wrong winner. Once identities are stitched, the verdict flips and the real
checkout leak (the payment step) shows up.

**This is a plain HTML/CSS/JS site — nothing to install and nothing to run on a
server.** Host it on GitHub Pages and everything happens in the browser.

Everything here is fake demo data. Nothing is named after the prospect.

---

## The three pages

| Page | What it's for |
|------|---------------|
| `index.html` | The **coffee storefront** the audience sees. Product page, chat widget, recovery messages. |
| `dashboard.html` | The **analytics dashboard** with the **lie / truth toggle** — the screen you perform on. Works on its own, no key needed. |
| `seed.html` | The **operator console** — paste your Write Key and click buttons to load the data and do the live merge. Use it on your own machine, not the demo screen. |

`dataset.js` and `stats.js` are the shared data and the maths behind them.

---

## Step 1 — turn the site on (GitHub Pages)

1. In this repo: **Settings → Pages**.
2. Set **Source: Deploy from a branch**, **Branch: `main`**, folder **`/ (root)`**, Save.
3. Wait ~1 minute. Your links:
   - Storefront: `https://datadrone-workspace.github.io/brewfreund-store/`
   - Dashboard: `https://datadrone-workspace.github.io/brewfreund-store/dashboard.html`
   - Seeder: `https://datadrone-workspace.github.io/brewfreund-store/seed.html`

---

## Step 2 — add your Write Key to the storefront

So the storefront can fire live events, open `index.html`, find this line near
the bottom, and paste your key in:

```js
var SEGMENT_WRITE_KEY = "PASTE_YOUR_WRITE_KEY_HERE";
```

(The seeder page asks for the key in its own box — you don't edit any file for that.)

---

## Step 3 — fire the test events (proves the source works)

Open the storefront link:
- It fires a **Product Viewed** the moment the page loads.
- Click **Add to cart** → fires a **Cart Added**.

Open Segment → **Debugger** and you'll see both arrive. Step 1 evidence done.

---

## Step 4 — load the store (before the demo)

1. Open the **seeder** link (`seed.html`).
2. Paste your **Write Key** in the box.
3. Click **Load the store**. It sends ~18 shoppers' events, with Lena as 3 identities.
4. Open **Unify** in Segment: ~25 profiles, with **Lena as 3** of them.

The seeder also shows the exact numbers to expect, so you can sanity-check them.

---

## Step 5 — the live merge (on the call)

On the seeder page, when you're ready for the reveal, click
**▶ Merge Lena — 3 → 1**. Watch Unify collapse her three profiles into one.

Want the whole store stitched afterwards? Click **Merge the rest of the store**
(optional — leave Lena's moment to stand on its own first).

---

## The numbers to expect

Computed from the data, so the dashboard and seeder always match.

- **25 profiles → 18 real people** (about **28%** were duplicates)
- **~27%** of revenue was credited to the wrong touchpoint
- A/B test: **Variant B** wins by session **→ flips to Variant A** by journey (7–3 both ways)
- Checkout leak: **4 shoppers drop at payment** vs 2 at shipping

---

## How the demo flows

1. Show the **dashboard** (lie): 3 Lenas, desktop drives revenue, Variant B winning.
2. On the **seeder**, click **Merge Lena** live: 3 → 1, shame stats appear.
3. Flip the dashboard to **truth**: Variant A was the real winner.
4. Show the **funnel**: the leak is the payment step, across phone + laptop.
5. Show the **recovery** on the storefront (`?recovery=voucher` for Lena,
   `?recovery=reminder` for a premium buyer) and the pre-built
   **Premium · No Subscription** audience.
