# ADR-011 — Cross-clinic patient safety information

**Status:** Proposed design; owner asked to evaluate cross-clinic visibility.  
**Date:** 2026-11-15  
**Decision scope:** Clinical information needed to prevent harm when the same patient visits a different clinic.

## Context

The owner wants a doctor using Al-Mada to know about relevant conditions and medicines that may be unsafe for a patient, even when another Al-Mada clinic first recorded them. This is a patient-safety need. The current `patients` rows and clinical tables are tenant-scoped, so a clinic cannot see another clinic's records.

The owner also asked whether patient information should belong to the platform and be accessible to it. “Platform ownership” does not by itself define the legal roles or justify access. Egyptian Law 151/2020 defines health information as sensitive personal data and regulates collection, disclosure, and processing; the Personal Data Protection Center's consent guidance calls for consent to be explicit, informed, specific, freely given, and written for sensitive data. The intended controller/processor roles, lawful basis, license/permit requirements, and care-sharing workflow need Egyptian counsel/PDPC review before real data.

References:

- [Official Gazette — Law 151/2020](https://escc.gov.eg/assets/docs/law-151-2020.pdf)
- [Personal Data Protection Center — Data Subject Consent Guidelines](https://pdpc.gov.eg/assets/pdf-data/Guidelines/DSConsent.pdf?csrt=11082648485996809314)
- Product scope: `docs/spec-v2/00_BUILD_DIRECTIVE_AR.md`, `docs/spec-v2/ARCHITECTURE_AND_SECURITY.md`, and `docs/spec-v2/AI_ASSISTANTS_REQUIREMENTS.md`.

## Proposed design

1. Keep each clinic's full patient chart, visit notes, attachments, billing, and audit trail private to that clinic. The platform does not get routine human-readable access to those records.
2. Add a minimal cross-clinic patient identity/link so a patient can be matched across clinics without merging their clinic records.
3. Add an optional, separate, written and versioned sharing grant for a narrowly scoped **patient safety card**. The card may show relevant allergies, serious contraindications, and active medicines, each with source clinic, source record, author/verification status, and last-confirmed date.
4. A receiving clinician can view the card only when authenticated, actively assigned to the patient’s current care, and the sharing grant covers that clinic and purpose. Log every access, including who, which clinic, purpose, and which facts were shown. Allow the patient or authorized guardian to revoke future sharing.
5. Do not expose the whole longitudinal chart merely because the patient has a safety card. A clinician may request additional records through a separately consented workflow.
6. Do not let one clinic edit another clinic's source facts. A correction creates a new, attributed fact or a request to the source clinic; conflicting or stale facts remain visibly conflicting.
7. Keep emergency “break-glass” access disabled until its legal basis, clinical rules, patient notice, and post-access review are approved. Platform support access remains separate, exceptional, time-limited, and audited.
8. No AI-generated diagnosis, drug prohibition, or medication instruction becomes a confirmed fact. Safety facts need a clinician source and explicit verification state; drug alerts require an approved, current reference source.

## Why this matches the safety goal

It gives a treating doctor access to the small set of information that can prevent medication harm while limiting unrelated disclosure of sensitive history. Central identity is a matching mechanism; it is not an authorization rule.

## Gates before implementing cross-clinic disclosure

- Decide whether sharing is opt-in per patient, per clinic, or per care episode; default is **off** until approved.
- Confirm the consent wording, lawful basis, guardian rules, withdrawal behavior, retention obligations, and controller/processor roles with Egyptian counsel and applicable regulator guidance.
- Define identity matching and duplicate resolution to avoid attaching one patient's facts to another person.
- Obtain clinical review of the safety-card fields, freshness rules, and handling of disagreement between sources.
- Add tenant-isolation, authorization, revocation, and audit acceptance tests before enabling the feature flag.

## Alternatives considered

- **All platform staff and all clinics can read the full chart:** rejected as the default because it grants more access than needed for the safety objective and conflicts with least-privilege requirements.
- **No sharing between clinics:** safe for tenant isolation but does not address the stated continuity-of-care need.
- **Minimal cross-clinic safety card with explicit grant:** proposed; meets the safety objective with narrower, auditable access.
