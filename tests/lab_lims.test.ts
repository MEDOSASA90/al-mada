import {
  LAB_TEST_DIRECTORY,
  listLabTests,
  getLabTestById,
  listLabOrders,
  getLabOrderById,
  evaluateLabResult,
  generateAILabInterpretation,
  listAnalyzers,
  TestParameter,
} from '@/lib/lab';

describe('Laboratory Information Management System (LIMS)', () => {
  it('loads the comprehensive diagnostic test directory', () => {
    const tests = listLabTests();
    expect(tests.length).toBeGreaterThanOrEqual(5);

    const categories = new Set(tests.map((t) => t.category));
    expect(categories.has('hematology')).toBe(true);
    expect(categories.has('clinical_chemistry')).toBe(true);
    expect(categories.has('hormones')).toBe(true);
    expect(categories.has('parasitology_urinalysis')).toBe(true);
  });

  it('correctly retrieves tests by ID and validates parameters', () => {
    const cbc = getLabTestById('test-cbc');
    expect(cbc).toBeDefined();
    expect(cbc?.tubeType).toBe('edta_purple');
    expect(cbc?.parameters.some((p) => p.id === 'hb')).toBe(true);

    const hba1c = getLabTestById('test-hba1c');
    expect(hba1c).toBeDefined();
    expect(hba1c?.turnaroundTimeHours).toBeGreaterThan(0);
  });

  it('evaluates normal, high, low, and critical panic values accurately', () => {
    const param: TestParameter = {
      id: 'fbs_val',
      nameEn: 'Fasting Blood Glucose',
      nameAr: 'سكر الدم الصائم',
      unit: 'mg/dL',
      normalMin: 70,
      normalMax: 100,
      panicMin: 45,
      panicMax: 450,
      isNumeric: true,
    };

    // Normal
    expect(evaluateLabResult(param, '88')).toBe('normal');

    // High
    expect(evaluateLabResult(param, '140')).toBe('high');

    // Low
    expect(evaluateLabResult(param, '60')).toBe('low');

    // Critical Panic High
    expect(evaluateLabResult(param, '480')).toBe('critical_high');

    // Critical Panic Low
    expect(evaluateLabResult(param, '40')).toBe('critical_low');
  });

  it('generates an urgent Clinical AI alert when panic values are present', () => {
    const order = getLabOrderById('order-103');
    expect(order).toBeDefined();
    if (order) {
      const summary = generateAILabInterpretation(order);
      expect(summary).toContain('تنبيه سريري عاجل');
    }
  });

  it('provides automated analyzers and quality control status', () => {
    const analyzers = listAnalyzers();
    expect(analyzers.length).toBeGreaterThanOrEqual(3);
    expect(analyzers.some((a) => a.name.includes('Sysmex'))).toBe(true);
    expect(analyzers.some((a) => a.name.includes('Cobas'))).toBe(true);
  });
});
