# Brewfreund — Test Integrity Audit demo

A fake German specialty-coffee store used to show one thing: a store's own
analytics count one shopper (Lena) as three people, so its A/B test crowns the
wrong winner. Once identities are stitched, the verdict flips and the real
checkout leak (the payment step) shows up.

Everything here is fake demo data. Nothing is named after the prospect.

---

## What's in here

| File | What it is |
|------|-----------|
| `index.html` | The **coffee storefront** (what the audience sees). Has the product page, the chat widget, and the two recovery messages. |
| `dashboard.html` | The **analytics dashboard** with the **lie / truth toggle** — the screen you perform the demo on. |
| `dataset.js` | The 18 shoppers and their journeys. The single source of truth. |
| `stats.js` | Works out the lie and the truth numbers from that data. |
| `scripts/seed.js` | Loads all the shoppers into Segment. |
| `scripts/merge-lena.js` | The **live moment** — merges Lena's 3 identities into 1. Run this on camera. |
| `scripts/merge-cast.js` | Optional — stitches the rest of the store after Lena. |

---

## Step 1 — add your Write Key (the only thing you need to paste)

1. In Segment, open the **Brewfreund Store** source and copy its **Write Key**.
2. Open `index.html`, find this line near the bottom, and paste it in:

   ```js
   var SEGMENT_WRITE_KEY = "PASTE_YOUR_WRITE_KEY_HERE";
   ```

That's the only edit. The scripts take the key from the command line instead
(next section), so you don't paste it anywhere else.

---

## Step 2 — put the two pages online (GitHub Pages)

1. In this repo: **Settings → Pages**.
2. Under *Build and deployment*, set **Source: Deploy from a branch**,
   **Branch: `main`**, folder **`/ (root)`**, and Save.
3. Wait ~1 minute. Your two links will be:
   - Storefront: `https://datadrone-workspace.github.io/brewfreund-store/`
   - Dashboard: `https://datadrone-workspace.github.io/brewfreund-store/dashboard.html`

The dashboard works on its own — it doesn't need the Write Key.

---

## Step 3 — fire the test events (proves the source works)

Just open the storefront link in a browser:
- It fires a **Product Viewed** the moment the page loads.
- Click **Add to cart** and it fires a **Cart Added**.

Now open Segment → **Debugger** and you should see both events arrive. That's
the Step 1 evidence done.

---

## Step 4 — load the store (run once, before the demo)

You need Node 18+ installed. Then, from this folder:

```bash
WRITE_KEY=your_write_key node scripts/seed.js
```

- Want to see the numbers first without sending anything?
  `node scripts/seed.js --dry`

After it runs, open **Unify** in Segment: ~25 profiles, with **Lena as 3** of them.

---

## Step 5 — the live merge (do this on the call)

When you're ready for the reveal:

```bash
WRITE_KEY=your_write_key node scripts/merge-lena.js
```

Watch Unify collapse Lena's **3 profiles into 1**. If you also want the whole
store to show the stitched headcount afterwards:

```bash
WRITE_KEY=your_write_key node scripts/merge-cast.js
```

---

## The numbers to expect

These are computed from the data, so the dashboard always matches them. Read
the live figures off Segment on the call — they should line up.

- **25 profiles → 18 real people** (about **28%** were duplicates)
- **~27%** of revenue was credited to the wrong touchpoint
- A/B test: **Variant B** wins by session **→ flips to Variant A** by journey (7–3 both ways)
- Checkout leak: **4 shoppers drop at payment** vs 2 at shipping

---

## How the demo flows

1. Show the **dashboard** (lie state): 3 Lenas, desktop drives revenue, Variant B winning.
2. Run **merge-lena.js** live: 3 → 1, shame stats appear.
3. Flip the dashboard to **truth**: Variant A was the real winner.
4. Show the **funnel**: the leak is the payment step, across phone + laptop.
5. Show the **recovery** on the storefront (`?recovery=voucher` for Lena,
   `?recovery=reminder` for a premium buyer) and the pre-built
   **Premium · No Subscription** audience.
