# Keyring — Renter Passport

**One-liner:** Reusable secure rental application profile.

## Startup thesis
Renters re-type their life story for every application while landlords get inconsistent data. A verified, reusable passport (identity, income, history) applied with one tap is the wedge; the network becomes the trust layer for rentals — screening, deposits, reviews.

## Architecture
Single index.html. Verified profile card with completeness score, 3 seeded listings, one-tap apply that advances application states (applied → under review on a timer), and a tracking tab with per-application timelines. Profile fields rendered as verified rows; share-link copy.

## Magic moment
One tap on 'Apply with Passport' — application sent, state tracked, landlord views logged. Three listings, three applications, zero forms.

## Monetization
Free for renters; landlords pay $25/screening for verified passport reports (cheaper + richer than legacy screeners); premium renter tier for priority placement.

## Known limitations
Verification is mocked (badges, not real ID/income checks); listings are seeded; no real landlord inbox or payment.

## Next 3 features
1. Real identity + income verification (Plaid, IDV vendors)
2. Landlord portal: receive, compare, approve applications
3. Portable reputation: on-time rent history across moves
