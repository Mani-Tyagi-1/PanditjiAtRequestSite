# Analytics setup — GA4 + Google Ads + Meta

Everything in the **codebase** is done. This file covers what still has to be
clicked in Google's dashboards, plus the two environment variables that turn
server-side conversions on.

- **GTM container:** `GTM-MVRGQH4N`
- **GA4 measurement ID:** `G-GLFX9MEX7V` (stream "pjar", stream ID 15429080509)
- **Code entry points:** `frontend/src/utils/analytics.ts`, `server/src/utils/serverAnalytics.ts`

---

## 1. Environment variables — NOT part of the build

> **These do not deploy with the code.** `server/.env`, `.env.dev` and
> `.env.production` are all in `server/.gitignore` and are not tracked in git,
> so they never travel with a build. Shipping this branch will not create them.
> Someone with access to the live server has to add them by hand, once.

`server/src/config/loadEnv.ts` reads `.env` for a `MODE` selector and then
loads `.env.production` (when `MODE=production`) or `.env.dev`.

### Add to the live `server/.env.production`

```ini
GA4_MEASUREMENT_ID=G-GLFX9MEX7V
GA4_API_SECRET=<generate — see below>
```

`GA4_API_SECRET`: GA4 → Admin → Data Streams → **pjar** → *Measurement Protocol
API secrets* → **Create**. Copy the secret value, not the nickname.

Then **restart the Node process** (`pm2 restart …`, `systemctl restart …`, or a
redeploy). dotenv reads these files once at startup — editing the file on a
running server changes nothing until it restarts.

### Two other gates on the same code path

- **`PAYMENT_MODE`** must be `production`, or server purchases log
  `Skipped (PAYMENT_MODE != production)` and stop. This key already exists in
  `.env.production` — confirm its *value*. It gates the existing Meta CAPI the
  same way, so if Meta server events are already arriving, this is fine.
- **`GA4_DEBUG`** — leave unset. Setting it to `1` routes events to Google's
  validation endpoint, which reports why an event would be rejected and
  **records nothing**. Useful for one test, disastrous if left on.

### Verifying it took

After restart, make a real payment and check the server logs:

| Log line | Meaning |
|---|---|
| `[GA4][Puja] Purchase sent for order=order_XXX value=…` | Working |
| `[GA4] Skipped: GA4_MEASUREMENT_ID or GA4_API_SECRET is not set.` | Keys missing or process not restarted |
| `[GA4][Puja] Skipped (PAYMENT_MODE != production)` | `PAYMENT_MODE` is not `production` |

### Frontend (optional)

`VITE_GA4_MEASUREMENT_ID` defaults to `G-GLFX9MEX7V` in code, so set it only if
the measurement ID ever changes. Note it is a **build-time** value — Vite inlines
it, so changing it needs a rebuild, not just a restart.

---

## 2. Container state (verified)

Container `GTM-MVRGQH4N` was inspected on 2026-08-13: **no tags, no triggers,
no variables**. The GTM snippet has been live on the site loading an empty
container, which is why GA4 reports "no data received".

Consequence: build everything below from scratch. There is nothing to conflict
with and no double-counting risk.

The account-level "Google tags" list shows `pjar` → `G-GLFX9MEX7V`,
`GT-M6JN3S9R`. Those are two IDs for the same tag, created with the data
stream. Use `G-GLFX9MEX7V` below and **never add both** — that double-counts
every pageview.

---

## 3. The build — 1 trigger, 2 tags, 8 variables

The obvious approach is one trigger and one tag per event, which for this site
would be ~19 of each. Unnecessary: `utils/analytics.ts` already shapes every
payload correctly, so one pass-through tag handles all of them, and any event
added later is picked up with no GTM change at all.

Total: about fifteen minutes of clicking.

### 3a. Enable the `Event` built-in variable

**Variables → Configure** (top right of the Built-In Variables box) → tick
**Event** (under *Utilities*).

This is `{{Event}}` — the name of whatever `dataLayer` event fired. It is what
lets one tag serve every event.

### 3b. Data Layer Variables

**Variables → User-Defined Variables → New → Data Layer Variable.** Create
these eight. Name and *Data Layer Variable Name* are given separately — the
first is the GTM label, the second must match the code exactly.

| GTM variable name | Data Layer Variable Name |
|---|---|
| `DLV - value` | `value` |
| `DLV - currency` | `currency` |
| `DLV - lead_type` | `lead_type` |
| `DLV - lead_method` | `lead_method` |
| `DLV - contact_method` | `contact_method` |
| `DLV - contact_context` | `contact_context` |
| `DLV - page_path` | `page_path` |
| `DLV - user_id` | `user_id` |

Ecommerce fields (`transaction_id`, `items`, purchase `value`) need no variables
— the tag reads the whole `ecommerce` object straight from the Data Layer.

### 3c. Trigger — "All Analytics Events"

**Triggers → New → Custom Event**

- Event name: `.*`
- Tick **Use regex matching**
- This trigger fires on: **Some Custom Events**
- Condition: `Event` → **does not match RegEx** → `^gtm\.`

The condition excludes GTM's own internal events (`gtm.js`, `gtm.dom`,
`gtm.load`). It has to be a trigger condition rather than a negative lookahead
in the pattern, because GTM's regex engine (RE2) does not support lookahead.

### 3d. Tag 1 — "Google Tag - GA4" (the base tag)

**Tags → New → Google Tag**

- Tag ID: `G-GLFX9MEX7V`
- Trigger: **All Pages**
- Configuration settings → add two rows:

| Parameter | Value |
|---|---|
| `send_page_view` | `false` |
| `user_id` | `{{DLV - user_id}}` |

`send_page_view = false` is not optional. The site is a single-page app: the
container loads once, so the built-in pageview would only ever record the
landing URL. `AnalyticsPageTracker` in `App.tsx` pushes a `page_view` event on
every route change instead, and tag 2 turns those into GA4 pageviews.

### 3e. Tag 2 — "GA4 - All Events"

**Tags → New → Google Analytics: GA4 Event**

- Measurement ID: `G-GLFX9MEX7V`
- Event Name: `{{Event}}`
- **More Settings → Ecommerce → tick "Send Ecommerce data" → Data source: Data Layer**
- Event Parameters:

| Parameter Name | Value |
|---|---|
| `value` | `{{DLV - value}}` |
| `currency` | `{{DLV - currency}}` |
| `lead_type` | `{{DLV - lead_type}}` |
| `lead_method` | `{{DLV - lead_method}}` |
| `contact_method` | `{{DLV - contact_method}}` |
| `contact_context` | `{{DLV - contact_context}}` |
| `page_path` | `{{DLV - page_path}}` |

- Trigger: **All Analytics Events** (from 3c)

`{{Event}}` passes the `dataLayer` event name through as the GA4 event name, so
`purchase` arrives as `purchase`, `generate_lead` as `generate_lead`, and so on.
Empty parameters are dropped automatically — a `page_view` carrying no `value`
simply sends no `value`.

**Ecommerce must be ticked** or the `items` arrays are silently discarded and
every product report stays empty. This is the single easiest thing to miss.

### 3f. Submit

**Submit** (top right) → name the version → **Publish**. Nothing above is live
until you do; "Workspace Changes" counts unpublished edits.

---

## 4. Events this produces

Sent automatically by the code — no per-event GTM work needed.

| GA4 event | Fires when |
|---|---|
| `page_view` | Every SPA route change |
| `view_item_list` | Catalog/listing rendered |
| `view_item` | Product detail opened |
| `select_item` | Product clicked out of a list |
| `add_to_cart` | Booking intent |
| `begin_checkout` | Checkout opened |
| `add_payment_info` | Razorpay sheet about to open |
| **`purchase`** | **Money captured — primary conversion** |
| **`generate_lead`** | **Enquiry / consultation submitted** |
| `contact` | WhatsApp / phone / chat tap |
| `checkout_details_filled` | Name + phone entered at checkout |
| `refund` | Booking refunded |
| `login`, `sign_up` | Account events |
| `search` | Catalog search |
| `puja_package_upgrade` | Upsell taken |
| `puja_prasad_box_toggle` | Add-on toggled |
| `prasad_nudge_accepted`, `puja_upgrade_nudge` | Nudge shown / converted |
| `consent_decision` | Cookie banner answered |

Plus anything routed through `analytics.metaBridge()`, which converts a Meta
event name to snake_case (`"App Download"` → `app_download`). The regex trigger
catches these with no extra configuration.

### Mark the conversions

GA4 → Admin → **Events** → toggle *Mark as key event*:

- `purchase`
- `generate_lead`

Optionally `add_payment_info` as a secondary Ads optimisation target while
purchase volume is too thin for Smart Bidding to learn from.

---

## 5. Google Ads

1. **Link GA4 to Google Ads**: GA4 → Admin → Product links → Google Ads links.
2. **Import the conversions**: Ads → Goals → Conversions → New → *Import* →
   Google Analytics 4 → pick `purchase` and `generate_lead`.

Importing rather than adding a separate Ads conversion tag is deliberate: the
Ads conversion then inherits the server-side accuracy described in §7, and
there is one number to reconcile instead of two that will always disagree.

### Enhanced conversions (optional, recommended)

`analytics.identify()` pushes `user_data.sha256_email_address` and
`user_data.sha256_phone_number` — already SHA-256'd in the browser, so no raw
PII ever enters `dataLayer`.

In the Ads conversion action → Enhanced conversions → *Google Tag Manager*,
create a **User-Provided Data** variable in *code* mode reading `user_data`.

> **Do not** map `user_data` on the GA4 tags. Google Ads accepts hashed
> customer data; GA4 does not, and PII in a GA4 property is a Terms of Service
> violation that can get it suspended.
>
> `identify()` is currently **not called anywhere** — see the outstanding list.

---

## 6. Consent Mode v2

Already live in `frontend/index.html`, above the GTM snippet, plus a banner
(`ConsentBanner.tsx`).

- Outside the EEA/UK/Switzerland (i.e. nearly all traffic): storage **granted**
  by default, banner offers an opt-out. India's DPDP Act does not require prior
  opt-in.
- Inside the EEA/UK/CH: **denied** until accepted, with `wait_for_update: 500`.

Nothing to configure in GTM — Consent Mode is read automatically by Google
tags. If you add a non-Google tag, set its consent requirements manually in
GTM → Tag → Advanced Settings → Consent Settings.

To require opt-in everywhere, change the first `gtag('consent','default',…)`
call in `index.html` to `denied` and drop the region list from the second.

---

## 7. How server-side purchases work

The problem: the browser's `purchase` fires from the Razorpay success handler,
which does not always run. Tab closed, phone locked, mobile data dropped — the
money is captured, the conversion is not.

The flow now:

1. Checkout page calls `analytics.stashOrderAttribution(razorpayOrderId)` right
   before opening Razorpay. That POSTs the browser's `_ga` client id, session
   id, gclid, `_fbp`/`_fbc` and user agent to `/api/analytics/attribution`,
   keyed on the order id (`analyticsAttributions` collection, 30-day TTL).
2. Razorpay's webhook fires server-to-server and always arrives.
3. Each service's reconciler calls `reportServerPurchase(...)`, which reads the
   stashed identity back and sends a GA4 Measurement Protocol `purchase`.

**Double counting is prevented twice over:** `transaction_id` is the Razorpay
order id in both the browser event and the server event (GA4 dedupes on it),
*and* `reportServerPurchase` takes an atomic exactly-once claim per order.

Covered funnels: Puja, Puja balance payments, Chadhava, Live Mandir,
Consultation, Shop, Vedic Vivah.

### Watch this log line

```
[GA4][Chadhava] No stashed client id for order=order_XXX; reporting with a
synthetic id — this purchase will show as (direct).
```

A rising share of these means some checkout path is not calling
`stashOrderAttribution`. Revenue is still recorded; attribution is not.

---

## 8. Verifying it works

**Browser (5 min):**
1. Open the site, DevTools → Network → filter `collect`.
2. Requests to `google-analytics.com/g/collect` = GA4 is live.
3. GTM Preview mode: check `dataLayer` shows `page_view` on each route change,
   and `begin_checkout` with an `items` array when you open a checkout.
4. Meta Pixel Helper should show exactly the same events as before this change.

**Server (needs a real test payment):**
1. Set `GA4_DEBUG=1` temporarily, make a test purchase, watch the logs for
   `[GA4][debug]`. An empty `validationMessages` array means the event is valid.
2. **Unset `GA4_DEBUG` before going live** — the debug endpoint records nothing.
3. In GA4 → Reports → Realtime, confirm the purchase and its revenue appear.

GA4 takes up to 48 hours to leave the "no data received" state on a new
property, so do not panic on day one.
