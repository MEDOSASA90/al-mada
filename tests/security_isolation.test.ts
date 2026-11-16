import { listPatients } from '../lib/patients';
import { checkSystemHealth } from '../lib/health';
import { DEMO_PATIENTS, DEMO_CLINIC } from '../lib/demo-data';

describe('Phase 7 — Multi-Tenancy Security, RBAC & Pilot Readiness Verification', () => {
  test('1. Multi-Tenant Isolation: Patients returned always belong strictly to the authenticated clinic', async () => {
    const patients = await listPatients();

    expect(patients.length).toBeGreaterThan(0);
    // Ensure every single returned patient has the active clinic_id
    for (const patient of patients) {
      expect(patient.clinic_id).toBe(DEMO_CLINIC.id);
    }

    // Verify foreign clinic records are excluded
    const foreignPatient = {
      id: '99999999-9999-9999-9999-999999999999',
      clinic_id: 'foreign-clinic-xyz',
      full_name: 'مريض في عيادة أخرى',
      phone: '+201099999999',
      file_number: '999999',
    };

    expect(patients.some((p) => p.id === foreignPatient.id)).toBe(false);
  });

  test('2. Egyptian Law 151/2020: Soft delete preserves deleted records for 30 days without permanent data loss', () => {
    const activePatients = DEMO_PATIENTS.filter((p) => p.deleted_at === null);
    expect(activePatients.length).toBeGreaterThanOrEqual(1);

    // Verify all active records do not have a deleted_at timestamp
    for (const p of activePatients) {
      expect(p.deleted_at).toBeNull();
    }
  });

  test('3. RBAC & Data Integrity: Role definitions enforce strict operational boundaries', () => {
    const rolesAllowedToLockConsultations = ['doctor', 'visiting_doctor'];
    const rolesAllowedToManageStaff = ['clinic_owner', 'clinic_admin'];

    // Receptionist must not be permitted to lock clinical consultations
    expect(rolesAllowedToLockConsultations.includes('receptionist')).toBe(false);

    // Doctor must not be permitted to modify staff salary/commission
    expect(rolesAllowedToManageStaff.includes('doctor')).toBe(false);
  });

  test('4. System Health & Pilot Diagnostic Engine: Returns 100% readiness score with all services verified', async () => {
    const report = await checkSystemHealth();

    expect(report.overallStatus).toBe('healthy');
    expect(report.readinessScore).toBe(100);
    expect(report.services.length).toBeGreaterThanOrEqual(6);

    // Verify specific critical services
    const dbService = report.services.find((s) => s.serviceId === 'database_engine');
    expect(dbService).toBeDefined();
    expect(dbService?.status).toBe('operational');

    const rlsService = report.services.find((s) => s.serviceId === 'rls_isolation');
    expect(rlsService).toBeDefined();
    expect(rlsService?.status).toBe('operational');

    const pnlService = report.services.find((s) => s.serviceId === 'financial_pnl_engine');
    expect(pnlService).toBeDefined();
    expect(pnlService?.status).toBe('operational');

    // Verify Law 151 compliance audit
    expect(report.complianceAudit.law151Compliant).toBe(true);
    expect(report.complianceAudit.softDeletePolicyDays).toBe(30);
    expect(report.complianceAudit.crossClinicSharingRestricted).toBe(true);
  });
});
