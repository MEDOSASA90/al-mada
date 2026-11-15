# ADR-012 — Patient portal and care discovery

**Status:** Proposed product design from owner request  
**Date:** 2026-11-15  
**Scope:** Patient-facing access to the patient's own health information and discovery of clinicians, clinics, laboratories, imaging centers, offers, and advertisements.

## Owner request

The patient should be able to view their own records, imaging, and lab results; discover doctors or clinics relevant to their needs; find nearby laboratories and imaging centers; and see current offers or advertisements.

This elevates the patient portal in the supplied product specification from its original Phase 8 position. It should be implemented after identity linking and tenant authorization are ready, with records access and directory discovery built in separate steps.

## Proposed patient experience

The patient portal lives separately from clinic staff workflows and uses a mobile-first Arabic RTL layout.

### Main navigation

1. **الرئيسية** — next appointment, recent results, and actions needing attention.
2. **ملفي الصحي** — visits, clinician-approved diagnoses and treatment documents, allergies and medicines, with clinic, author, and date shown for each item.
3. **التحاليل والأشعة** — reports and images, source lab/center, performed date, report date, and secure view/download action.
4. **ابحث عن رعاية** — clinician and clinic directory, patient-controlled specialty/category filters, and nearby labs/imaging centers.
5. **العروض** — offers and paid placements with explicit “إعلان” or “عرض ممول” labels, sponsor identity, dates, terms, and opt-out controls.
6. **الخصوصية والمشاركة** — connected clinics, active/revoked sharing grants, access history, guardian controls, and consent withdrawal.

### Discovery rules

- Start with patient-selected service or specialty, clinic referral, and broad city/area. Precise GPS is optional and requested only when the patient asks for “near me”.
- A “recommended” clinician must have a transparent basis: a clinician referral, the service/specialty the patient selected, or directory criteria. It must not imply diagnosis or treatment suitability based on hidden AI inference.
- Paid placement is visibly separate from organic results and clinical referrals. Advertisers receive no diagnosis, medical record, allergy, prescription, or individual health-profile data.
- Do not target offers from patient diagnoses, medication history, test results, or inferred health conditions. Contextual location/category placement requires separate product and legal review before activation.
- Directory data must be verified, have a last-verified date, and let the patient report incorrect listings.

## Data and authorization model

1. Link a patient login to existing clinic patient records only after strong identity verification. Names or phone-number similarity alone must never merge records. Any uncertain match goes to manual verification.
2. A patient may retrieve only records linked to that authenticated person. A server/database function derives the identity from the session; a patient ID supplied by the browser is never trusted for authorization.
3. Clinic charts remain separately attributed to their source clinic and clinician. The patient portal may aggregate the patient's own view across linked clinics, but it does not give one clinic access to another clinic's chart.
4. Show document metadata first and issue short-lived private-storage links only after an authorization check. Never return raw bucket paths or make clinical files public.
5. Every record view, report download, identity link, share, and consent change is auditable. Avoid logging diagnoses or report contents.
6. Support legal-guardian relationships for minors and authorized representatives; do not assume the patient account is always self-managed.

## Possible data structures to review before migration

- `patient_account_links`: verified link between an auth user and a patient record, method, verifier, timestamps, and status.
- `patient_guardians`: patient-to-guardian relationship, authority type, evidence/status, and expiry where applicable.
- `care_directory_listings`: verified clinic/provider/lab/imaging listing, services, public contact/address, approximate coordinates, opening hours, and review dates.
- `listing_promotions`: sponsor, creative, dates, explicit paid-placement flag, location/category criteria, terms, and active feature flag. No health-profile targeting fields.
- `patient_referrals`: clinician-authored referral linked to the source visit and destination service, visible to the patient with attribution.

These are design candidates, not approved production migrations. Reconcile them with the complete data model and feature inventory first.

## Security, privacy, and clinical rules

- Verify the patient's email/phone with an OTP and use step-up verification for sensitive account changes and new device access.
- Patient access is self-access; it is not equivalent to routine platform-employee access or cross-clinic staff access.
- A patient can revoke optional sharing for future requests. Preserve a record of the consent and revocation event without retaining an unnecessary duplicate of the shared clinical content.
- Show a report as uploaded/received unless a clinician has interpreted or approved it. Do not silently label an extracted or AI-generated interpretation as a confirmed diagnosis.
- Avoid emergency or clinical triage claims until reviewed by clinicians. Clearly direct emergencies to local emergency care.
- Ads, ranking, data-controller roles, consent/legal basis, retention, and the treatment of children's records require legal review before activation. Keep sponsored listings behind a feature flag disabled by default until those gates close.

## Delivery slices

1. Patient identity verification and account-to-record linking, with clinic isolation and audit.
2. Read-only portal for linked appointments and clinician-authored visit/report metadata; secure private-file delivery in the file/security phase.
3. Verified care directory and patient-initiated nearby search, with location permission.
4. Clinician-authored referrals and scoped cross-clinic safety card, each with separate authorization and consent rules.
5. Clearly labeled promotions/ads, consent controls, and privacy review; feature flag remains off until approved.

## Acceptance requirements

- A patient cannot read another patient's records by changing IDs, URLs, search filters, or clinic identifiers.
- A patient sees all and only their verified linked records, each with source clinic, date, and author where available.
- Revoked links/grants stop future access; previously issued file links expire quickly.
- Downloads are private, authorized, time-limited, and logged without exposing raw storage paths.
- No advertiser can query patient records or target by health facts; sponsored placement is labeled in every view.
- Location is optional; directory search works by manually chosen city/area if location is denied.
- Guardians can access only patients for whom their authority is verified.
