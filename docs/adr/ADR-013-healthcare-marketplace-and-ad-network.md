# ADR-013 — Healthcare marketplace and advertising network

**Status:** Owner-confirmed product scope; detailed commercial rules remain open.  
**Date:** 2026-11-15  
**Scope:** Multi-sided healthcare ecosystem around Al-Mada clinics, patients, and supply/service partners.

## Owner-confirmed goal

Al-Mada must connect and support:

- Clinics, medical centers, doctors, and patients.
- Pharmaceutical companies and pharmacies.
- Medical analysis laboratories and radiology/imaging centers.
- Medical equipment and supplies companies, wholesalers, and shops.
- A complete advertising and offers system inside the platform.

This expands the product from clinic-management SaaS into a healthcare operations, discovery, procurement, and advertising platform. These are core product requirements, not optional filler features. The existing feature seed already places several market features in Phase 8; the owner has now explicitly confirmed that the full ecosystem and ad system are in scope. Their exact rollout order will be represented in the implementation plan and feature inventory.

## Product areas

### 1. Partner marketplace and directory

- Partner onboarding, organization profile, contact/location/service areas, verification, status, and supporting credentials.
- Separate partner categories and controls for pharmaceutical suppliers, pharmacies, labs, imaging centers, and medical-supply vendors.
- Search by service, specialty, city/area, availability, and verified status.
- Patient-facing discovery and booking/request flows for clinics, labs, and imaging centers.
- Clinic-facing B2B supply catalog, price/quote request, purchase order, delivery/fulfillment, invoice, return/dispute, and settlement workflows where the business model supports them.
- Clear distinction among independent listing, clinician referral, sponsored listing, and paid advertisement.
- Partner dashboards for listings, incoming bookings/orders, offers, and basic performance.

### 2. Pharmaceutical and pharmacy directory

- Separate approved medicine reference content from commercial product listings and sponsored promotion.
- Preserve source, version, and license details for clinical medicine data. No commercial medicine catalog or safety claim is represented as authoritative without a verified source and rights to use it.
- Pharmacy products and offers may be discoverable. Prescription information and patient identity are not transmitted to pharmacies or manufacturers without a separate, valid patient-authorized workflow.
- Product advertisements cannot create, modify, or recommend a diagnosis, prescription, or treatment.

### 3. Advertising and offers system

- Advertiser organization, account roles, verification, campaign, creative, placement, audience rules, schedule, budget/bid, approval status, and campaign-level metrics.
- A moderation/approval queue, rejected-creative reasons, changes/re-review, pause/stop control, spending caps, dates, frequency controls, and fraud/invalid-traffic handling.
- Paid content always has a visible “إعلان” / “عرض ممول” label and sponsor identity. Sponsored results are visually separated from organic search, medical referrals, and clinical content.
- Audience selection may use declared business context such as city/area, clinic role, specialty, or the category currently being browsed, subject to user controls and policy review.
- Never use an individual's diagnosis, prescription, allergy, laboratory result, imaging, visit history, or inferred condition to target, price, rank, or report advertisements.
- Advertisers receive aggregate campaign performance only, with small-cell suppression and no patient-level conversion trail. They cannot query the patient directory, clinical tables, or one-to-one ad exposure tied to health facts.
- Offers have explicit terms, eligibility, validity dates, partner, redemption method, and service area.
- Medication advertising and any health claims stay disabled until applicable Egyptian regulatory, professional, and platform-review requirements are established.

## Role separation

- **Patient:** find care, request appointments/services, see offers, manage preferences, and view only their linked health records.
- **Clinic/provider:** manage clinic profile/referrals/appointments and source clinic records; request supplies.
- **Partner/provider organization:** manage its own catalog/listings, bookings/orders, and campaigns; no access to unrelated clinics' patient charts.
- **Advertiser:** manage approved campaigns and aggregate metrics; no clinical-data role.
- **Platform marketplace/ad operations:** verify and moderate listings/creatives and manage campaign metadata; no routine access to medical records.
- **Platform finance:** administer marketplace/ad settlements under separately defined permissions and auditable workflows.

## Technical boundaries

- Marketplace transactions, consent, campaign approval, billing, click/impression accounting, and rate limits are enforced by backend services and database constraints. AI and n8n cannot grant roles, set prices, settle money, or bypass tenant checks.
- Treat each partner organization as its own tenant. A partner's data is isolated from clinics, patients, and other partners.
- Ads and directory analytics use a dedicated, privacy-minimized event model. Do not pass medical request context into ad logs or third-party analytics.
- Payment and messaging providers remain behind adapters and in sandbox until their release gates are approved.
- Build contracts and feature flags so categories, promotions, checkout, and medicine content can be independently enabled/disabled.

## Decisions still open

- Marketplace commercial model: direct checkout, quote/request, subscription, commission, or a combination per category.
- Who is seller/merchant of record, who fulfills each order, returns/warranty responsibilities, tax treatment, invoicing, and settlement schedule.
- Whether pharmacies may accept patient prescription orders and the identity/prescription verification required.
- Advertiser eligibility, prohibited categories/claims, targeting granularity, auction versus fixed pricing, payment model, and measurement/attribution windows.
- Provider/partner licensing verification and update process.
- Lawful basis, disclosure, consent, children's data, and retention rules for patient-facing offers and advertising; obtain local legal review before activation.

## Delivery and release gates

1. Build partner and service-directory profiles with verification and no transaction/payment side effects.
2. Build clinic-to-supplier requests/orders using synthetic catalog data, with role controls, audit, idempotency, and sandbox payments only.
3. Build patient care discovery, referrals, lab/imaging booking, and safe result delivery after patient identity and private-file access are complete.
4. Build ad manager, approval tools, contextual/declared audience rules, aggregate reporting, and disabled-by-default placements.
5. Enable categories incrementally only after legal/commercial review, privacy review, tests, and owner approval for any real money, patient messaging, prescription workflow, or sensitive health advertising.
