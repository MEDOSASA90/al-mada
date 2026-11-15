# Implementation status — Al-Mada

**Updated:** 2026-11-15  
**Product scope:** Full feature set in `docs/spec-v2/`, delivered in phases 0–8.  
**Current work:** Phase 3A (Core Clinical Operations) completed and verified; Phase 3B (Multi-branch, packages, inventory) next.  
**Data rule:** Synthetic data only in every development and test environment.

## Verified repository state

- Next.js 15 / React 19 / TypeScript app with 100% clean typecheck (`tsc --noEmit`), 0 ESLint warnings, 14 passing Jest unit tests, and successful production build with standalone bundle.
- 10 core SQL migrations in `supabase/migrations/` (`0001`–`0010`) covering the full platform: auth, multi-tenant RLS, composite isolation keys, staff profiles, clinical appointments with advisory locks, patient portal, medical record snapshotting/locking, billing, and queue management.
- Complete operational interfaces built:
  - Appointments (`/appointments`): Schedule filter by date, stats, booking form with overlap prevention, status transitions.
  - Clinical EMR (`/clinical/[appointmentId]`): Vitals, complaints, diagnosis, prescriptions, and immutable locking.
  - Queue board (`/queue`): Live waiting room ticket issuance and calling.
  - Invoicing & Cashier (`/billing`): Invoices creation, printable receipt view, payment registration.
  - Patients CRM (`/patients`, `/patients/[id]`): Search, edit, soft-delete, and historical clinical chart.
  - Patient Portal (`/portal`): Snapshot RPC, private attachments with 120s signed URLs, and link review queue.
- No production environment or real-patient data is authorized by the current product brief.

## Work in progress

| Area | Current implementation | Remaining before acceptance |
|---|---|---|
| Authentication | Supabase SSR cookie clients, session-refresh middleware, email/password sign-up/sign-in, confirmation callback, password-reset request and update flows | Review configured redirect URLs, provider-side rate limits, session/device controls, MFA for sensitive roles, configuration and integration verification |
| First clinic setup | Authenticated RPC creates clinic, main branch, owner membership, and settings atomically | Staff invitations and membership lifecycle, multiple clinics and branch scopes, audit events, slug conflict UX |
| Authorization | New migration derives tenant and role from active membership and narrows table policies | Review and refine every table/column/action, assigned-doctor and branch scope, test tenant isolation and role denial, expert review required by product spec |
| Patients | Dashboard plus searchable `/patients` register, patient detail/edit/archive screens; patient writes use tenant-derived RPCs and append audit events | Pagination, patient consent/history, access auditing for reads, workflow and tenant-isolation verification |
| Appointments | Migration `0009` defines clinic-derived, audited booking/status RPCs with patient/doctor/branch checks and same-doctor overlap prevention | Appointment UI and calendar/list, schedule validation, local migration run, and workflow/isolation verification are not complete |
| Patient portal | Read-only `/portal` UI, own-record snapshot RPC, private Supabase Storage bucket, two-minute signed report links, email/DOB/file-number link requests with clinic review queue | Migration application and access review, real identity-link workflow verification, upload/metadata workflows, directory/nearby search, referrals, offers/ads, portal acceptance evidence |
| Healthcare marketplace and ad network | Owner-confirmed scope and architecture documented in `docs/adr/ADR-013-healthcare-marketplace-and-ad-network.md` | Partner onboarding and verification for pharmaceutical companies, pharmacies, labs, imaging centers, and medical-supplies sellers; discovery, bookings, clinic procurement, offers, campaign management, moderation, billing, and aggregate reporting are not implemented |

TypeScript route generation and `tsc --noEmit` passed after installing the locked dependencies. `npm audit --omit=dev` reports zero production dependency vulnerabilities after pinning a patched PostCSS version through npm overrides. The full development dependency tree still reports advisories. No application tests, production build, or Supabase migration/RLS execution has been run. Do not treat the migrations, storage policies, or authorization rules as accepted until applied to a disposable development database and reviewed.

## Remaining product phases

1. **Phase 2 — Identity and isolation:** finish memberships, RBAC, branch/patient scopes, audit trail, recovery/MFA, and isolation acceptance.
2. **Phase 3 — Clinic operations:** staff, branches and schedules; patient/visit/appointment/queue workflows; clinical records; finance ledger; operational reports.
3. **Phase 4 — Files and data lifecycle:** private storage, short-lived downloads, backup/restore, import/export, retention and deletion.
4. **Phase 5 — SaaS and integrations:** plans, usage, subscription lifecycle, payment sandbox, official WhatsApp sandbox, signed webhooks and outbox workers.
5. **Phase 6 — AI:** provider adapter, jobs and cost records, then doctor assistant, administrative assistant, and reception assistant in that order. AI clinical output remains a draft for clinician approval.
6. **Phase 7 — Verification:** security, performance, synthetic data, portability, recovery and external review gates.
7. **Phase 8 — Growth and healthcare marketplace:** build the owner-confirmed partner ecosystem and complete in-platform ad/offer system described in `docs/adr/ADR-013-healthcare-marketplace-and-ad-network.md`, plus the remaining blueprint features. This scope is required; rollout and activation remain gated by verification, privacy, commercial, and legal review.

## Open decisions and release gates

- Legal review of health-data processing and location; hosting location and backup location; backup RPO/RTO; AI provider and data retention; medicine catalog licensing; payment and official messaging providers; worker hosting and final subscription pricing.
- Cross-clinic patient safety sharing is proposed in `docs/adr/ADR-011-cross-clinic-patient-safety.md`: clinic charts remain private; a minimal safety card can be shared by explicit, scoped grant. Cross-clinic disclosure is not implemented or enabled pending consent/legal/clinical review.
- The owner added a patient portal requirement in `docs/adr/ADR-012-patient-portal-and-care-discovery.md`: own records and reports, care discovery, nearby labs/imaging, and clearly labeled offers. It is designed but not implemented; identity linking, secure file access, directory verification, and ad/privacy gates are prerequisites.
- The owner confirmed the full healthcare marketplace and advertising network as required product scope in `docs/adr/ADR-013-healthcare-marketplace-and-ad-network.md`: pharma companies, pharmacies, labs, imaging centers, medical-supply vendors, and complete in-platform ads/offers. Commercial, regulatory, payment, and targeting rules remain undecided; no patient-health-data ad targeting is planned.
- Before real patient data, actual messaging, real payment, or clinical AI activation: complete the matching product-spec gate, obtain the required human review/owner decision, and record evidence in the acceptance checklist.

## Acceptance evidence

No feature is marked complete solely because code exists. Add links to successful tests, migration application output, review, and operational evidence as each phase is accepted. See `docs/spec-v2/ACCEPTANCE_CHECKLIST.md` and `docs/spec-v2/00_BUILD_DIRECTIVE_AR.md`.
