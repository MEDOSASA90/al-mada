import {
  generateClinicalDraft,
  generatePatientHistorySummary,
  askExecutiveAssistant,
  toggleAIStatus,
  getAIStatus,
} from '../lib/ai';

describe('Phase 6 — Clinical AI Scribe & Executive Copilot Framework', () => {
  beforeEach(() => {
    toggleAIStatus(true);
  });

  test('1. Extracts structured clinical draft, vitals, diagnosis, and Rx from Egyptian Arabic dictation', async () => {
    const rawNotes =
      'المريض جاي بيشتكي من صداع نصفي شديد بقاله يومين، الضغط 140/90 والنبض 84 bpm وحرارته 37.1، كتبنا له كونكور 5 قرص وبانادول اكسترا ومتابعة بعد أسبوع مع فحص قاع عين.';

    const draft = await generateClinicalDraft({
      rawNotes,
      appointmentId: 'test-appt-1',
      patientId: 'test-patient-1',
      doctorName: 'د. سارة الشريف',
    });

    expect(draft.status).toBe('draft_ready');
    expect(draft.confidence).toBeGreaterThanOrEqual(0.85);
    expect(draft.chiefComplaint).toContain('صداع');
    expect(draft.provisionalDiagnosis).toContain('صداع');
    expect(draft.vitals.bp).toBe('140/90');
    expect(draft.vitals.hr).toBe('84 bpm');
    expect(draft.vitals.temp).toBe('37.1');
    expect(draft.prescriptions.length).toBeGreaterThan(0);
    expect(draft.sections.length).toBeGreaterThanOrEqual(4);
  });

  test('2. Triggers safety alert when penicillin derivative is prescribed to penicillin-allergic patient', async () => {
    const rawNotes = 'المريض يعاني من نزلة معوية، كتبنا له اوجمنتين 1 جم قرص كل 12 ساعة لمدة أسبوع.';

    const draft = await generateClinicalDraft({
      rawNotes,
      appointmentId: 'test-appt-2',
      patientId: 'test-patient-2',
      patientAllergies: ['بنسلين (Penicillin Allergy)'],
    });

    expect(draft.safetyAlerts.length).toBeGreaterThan(0);
    const allergyAlert = draft.safetyAlerts.find((a) => a.severity === 'critical');
    expect(allergyAlert).toBeDefined();
    expect(allergyAlert?.claim).toContain('حساسية');
  });

  test('3. Summarizes patient clinical history, chronic conditions, and previous encounters', async () => {
    const summary = await generatePatientHistorySummary('33333333-3333-3333-3333-333333333331');

    expect(summary.totalEncounters).toBeGreaterThanOrEqual(0);
    expect(summary.summary).toContain('المريض');
    expect(Array.isArray(summary.allergies)).toBe(true);
    expect(Array.isArray(summary.chronicDiseases)).toBe(true);
  });

  test('4. Executive Copilot answers P&L and financial metrics accurately', async () => {
    const res = await askExecutiveAssistant('ما هو صافي أرباح العيادة اليوم؟');

    expect(res.answer).toContain('الإيرادات');
    expect(res.answer).toContain('صافي');
    expect(res.sourceUrl).toBe('/billing');
    expect(res.metrics?.['صافي الربح']).toBeDefined();
  });

  test('5. Executive Copilot answers inventory shortage inquiries', async () => {
    const res = await askExecutiveAssistant('ما هي نواقص المخزن الطبي الحرجة؟');

    expect(res.answer).toContain('صنف');
    expect(res.sourceUrl).toContain('/inventory');
  });

  test('6. Kill-Switch toggles AI system and blocks execution when disabled', async () => {
    toggleAIStatus(false);
    const status = getAIStatus();
    expect(status.isEnabled).toBe(false);

    await expect(
      generateClinicalDraft({
        rawNotes: 'كشف مريض',
        appointmentId: 'appt-1',
        patientId: 'patient-1',
      })
    ).rejects.toThrow('خدمة المساعد الذكي معطلة');

    toggleAIStatus(true);
    expect(getAIStatus().isEnabled).toBe(true);
  });
});
