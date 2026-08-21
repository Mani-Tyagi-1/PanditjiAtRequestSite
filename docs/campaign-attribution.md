# Campaign Attribution — Which Ad Produced Which Booking

Every booking made from the website now stores the campaign the devotee arrived on,
right on the booking document. This is how you answer "we spent ₹40,000 on the Savan
campaign last month — what did it actually book?" with one query, months later,
without opening an ads dashboard.

---

## 1. Why this exists alongside GA4 and Meta CAPI

The site already reports purchases to GA4, Google Ads and Meta (see
`docs/analytics-gtm-setup.md`). Those platforms report **aggregates**: "the Savan
campaign produced 14 conversions worth ₹52,000". What they can never tell you is
which campaign produced *a specific booking* — an ads report has no booking id in it
and never will.

There is also `AnalyticsAttribution`
(`server/src/model/analytics/analyticsAttribution.model.ts`). That is a different
thing and not a substitute: it parks cookie ids against a Razorpay order id so the
Razorpay webhook can report a purchase as the right *visitor*, and a TTL index
deletes every row after 30 days.

This is permanent, on the booking, and queryable forever.

---

## 2. The shape stored on a booking

```jsonc
{
  "devoteeName": "…",
  "amount": 4200,
  "attribution": {
    // The campaign that first brought this devotee to the site.
    "first": {
      "source": "facebook",
      "medium": "paid_social",
      "campaign": "savan_aug",
      "content": "reel_a",
      "referrer": "https://l.facebook.com/",
      "landingPage": "https://panditjiatrequest.com/savan-puja?utm_source=…",
      "at": "2026-08-01T10:00:00.000Z"
    },
    // The campaign they were on when they actually booked.
    "last": {
      "source": "google",
      "medium": "cpc",
      "campaign": "brand_search",
      "gclid": "Cj0KCQ…",
      "landingPage": "https://panditjiatrequest.com/puja/rudrabhishek?gclid=…",
      "at": "2026-08-20T10:00:00.000Z"
    }
  }
}
```

**Both touches are kept because they disagree, and the disagreement is the point.**
A Meta reel introduces someone to the site; a week later a branded Google search
brings them back and they pay. `last` matches what the ad platforms report. `first`
tells you which campaign is actually *acquiring* — the one that would be invisible if
you only ever credited the final click.

Every field is optional, and the whole `attribution` key is **absent** on a booking
that arrived without one (an app booking, an admin-created booking, a devotee who
typed the URL before this shipped). Nothing may assume it is there.

---

## 3. How it gets there

| Step | Where |
| --- | --- |
| 1. Capture on every page of every visit | `frontend/src/utils/attribution.ts` → `captureAttribution()`, mounted as `<AttributionCapture/>` in `frontend/src/App.tsx` |
| 2. Stored in `localStorage` (`pjar_attr_first`, `pjar_attr_last`) | first touch 180 days, last touch 30 days |
| 3. Attached to the checkout POST | `attributionPayload()` spread into the create-booking body |
| 4. Whitelisted and clipped server-side | `server/src/utils/marketingAttribution.ts` → `readAttribution(req)` |
| 5. Written to the booking | `attributionField` from `server/src/model/analytics/marketingAttribution.schema.ts` |

### Why the browser and not the server

By the time checkout POSTs, the `?utm_campaign=…` the devotee arrived on is several
navigations in the past and the `Referer` header reads as our own domain. The browser
is the only party that still remembers the ad.

### The capture rules

These are the same rules GA4 applies, and each one exists to stop a specific way of
lying to yourself:

- **A tagged URL (`utm_*` or a click id) is always a new last touch.** They just
  clicked an ad; that is the campaign to credit.
- **A click id counts on its own.** Google Ads auto-tagging appends `gclid` with *no*
  UTMs unless the campaign was manually tagged, so a UTM-only check would miss most
  paid clicks the site gets. A bare `gclid` is recorded as `google / cpc`.
- **Untagged pages are only considered on the first page of a session,** so browsing
  the site never overwrites how the session began.
- **A direct arrival never overwrites a stored campaign.** Someone who clicked an ad
  on Monday and typed the URL on Friday was still brought here by Monday's ad.
  Without this rule every return visit quietly launders paid traffic into `(direct)`.

UTM parameters are deliberately **not** stripped from the URL (unlike `?ref=`, which
`<ReferralCapture/>` does strip) — GA4 and the ad platforms read the same parameters
off the address bar.

### It survives the browser disappearing

For puja bookings, attribution is written to the **pending** row at order creation,
not at payment confirmation. `finalizePendingPoojaBooking` spreads the whole pending
document onto the final booking, so the campaign survives the case this matters most
in: the devotee pays, closes the tab, and the Razorpay webhook is what promotes the
booking.

---

## 4. Which collections carry it

| Collection | Model |
| --- | --- |
| `pendingPoojaBookings` → `poojabookings` | `poojaBooking/pendingPoojaBooking.model.ts`, `poojaBooking/poojaBooking.model.ts` |
| `chadhavaBookings` | `userApp/chadhavaBookingModel.ts` |
| `liveMandirBookings` | `userApp/liveMandirBookingModel.ts` |
| `vedic_vivah_bookings` | `userApp/vedicVivahBookingModel.ts` |
| `consultancyLeads` | `userApp/consultancyLeadModel.ts` |
| `abandonedCarts` | `userApp/abandonedCartModel.ts` |

`poojabookings` and `vedic_vivah_bookings` carry a sparse index on
`attribution.last.campaign` + `createdAt`, because those are the two the revenue
report actually groups by.

### Unpaid attempts are attributed too

Attribution is written when the *attempt* starts, not when money lands, so three
collections carry it for bookings that were never paid:

- **`pendingPoojaBookings`** — written at order creation. This is also what makes the
  webhook path work: the pending row is spread onto the final booking, so the
  campaign survives the devotee closing the tab.
- **`abandonedCarts`** — written from the moment a valid mobile number is typed, and
  re-sent with every subsequent patch. This is the one report the ad platforms
  cannot produce at all: **which campaigns generate leads that never convert.** A
  campaign with a strong click-through rate and a cart full of abandoned rows is
  buying the wrong audience, and nothing else in the stack will tell you.
- **`chadhavaBookings`, `liveMandirBookings`, `vedic_vivah_bookings`,
  `consultancyLeads`** — the row is created before payment (`status: "pending"` /
  `"lead"`), so an unpaid attempt is attributed the same as a paid one.

Existing `abandonedCarts` rows created before this shipped pick the campaign up on
their next patch, because attribution goes in `$set` rather than `$setOnInsert`.

### Adding it to a new booking type

Three lines:

```ts
// model — alongside the other fields
import { attributionField } from "../analytics/marketingAttribution.schema";
//  …
attribution: attributionField,
```

```ts
// controller
import { readAttribution } from "../../utils/marketingAttribution";
const attribution = readAttribution(req);
await Thing.create({ ...fields, ...(attribution && { attribution }) });
```

```ts
// frontend checkout
import { attributionPayload } from "../utils/attribution";
body: JSON.stringify({ ...fields, ...attributionPayload() })
```

---

## 5. Queries you will actually run

**Revenue by campaign, last 30 days (last touch):**

```js
db.poojabookings.aggregate([
  { $match: { createdAt: { $gte: new Date(Date.now() - 30*24*60*60*1000) }, isPaymentDone: true } },
  { $group: {
      _id: { source: "$attribution.last.source", campaign: "$attribution.last.campaign" },
      bookings: { $sum: 1 },
      revenue:  { $sum: "$amount" },
  }},
  { $sort: { revenue: -1 } },
])
```

**Which campaigns *acquire* (first touch) vs which *close* (last touch):**

```js
db.poojabookings.aggregate([
  { $match: { "attribution.first.campaign": { $exists: true } } },
  { $group: {
      _id: { acquired: "$attribution.first.campaign", closed: "$attribution.last.campaign" },
      bookings: { $sum: 1 },
      revenue:  { $sum: "$amount" },
  }},
  { $sort: { revenue: -1 } },
])
```

**One booking — where did it come from?**

```js
db.poojabookings.findOne({ _id: ObjectId("…") }, { devoteeName: 1, amount: 1, attribution: 1 })
```

**Which campaigns generate leads that never convert** — the report nothing else in
the stack can produce:

```js
db.abandonedCarts.aggregate([
  { $group: {
      _id: { campaign: "$attribution.last.campaign", source: "$attribution.last.source" },
      abandoned: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } },
      converted: { $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] } },
  }},
  { $addFields: { conversionRate: {
      $cond: [
        { $eq: [{ $add: ["$abandoned", "$converted"] }, 0] },
        0,
        { $divide: ["$converted", { $add: ["$abandoned", "$converted"] }] },
      ],
  }}},
  { $sort: { abandoned: -1 } },
])
```

**Started but never paid, by campaign** (puja flows that reached Razorpay):

```js
db.pendingPoojaBookings.aggregate([
  { $group: { _id: "$attribution.last.campaign", stalled: { $sum: 1 } } },
  { $sort: { stalled: -1 } },
])
```

---

## 6. Verifying it works

1. Open the site with a tagged URL, e.g.
   `https://panditjiatrequest.com/?utm_source=test&utm_medium=cpc&utm_campaign=smoke_test`
2. In DevTools → Application → Local Storage, confirm `pjar_attr_first` and
   `pjar_attr_last` both hold the campaign.
3. Navigate to any puja and start a booking. In the Network tab the create-booking
   POST body carries `attribution` (the puja flows encrypt the body, so check the
   pending row instead).
4. `db.pendingPoojaBookings.findOne({}, { attribution: 1 })` — the campaign is there
   before payment is even attempted.

---

## 7. Privacy note

Nothing here is personal data. The stored fields are the campaign tags we put on our
own ad URLs, the click ids the ad platforms append, and the referring URL — the same
values already sitting in the address bar and in GA4. No cookie ids, no device
fingerprint, no PII is added by this system.
