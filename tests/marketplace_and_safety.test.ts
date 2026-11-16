import {
  HEALTHCARE_PARTNERS,
  ACTIVE_MEDICAL_OFFERS,
  HEALTHCARE_ADS,
  RECOMMENDED_DOCTORS,
  getPartnersByCategory,
  getActiveOffers,
  getActiveAds,
  getRecommendedDoctorsForCondition,
} from '@/lib/marketplace';

describe('Healthcare Marketplace & Partner Ecosystem', () => {
  it('covers all 5 essential healthcare pillars', () => {
    const categories = new Set(HEALTHCARE_PARTNERS.map((p) => p.category));
    expect(categories.has('pharma')).toBe(true);
    expect(categories.has('pharmacy')).toBe(true);
    expect(categories.has('lab')).toBe(true);
    expect(categories.has('radiology')).toBe(true);
    expect(categories.has('medical_supplies')).toBe(true);
  });

  it('filters verified partners by category properly', () => {
    const labs = getPartnersByCategory('lab');
    expect(labs.length).toBeGreaterThanOrEqual(2);
    expect(labs.every((l) => l.category === 'lab')).toBe(true);
    expect(labs.some((l) => l.name.includes('البرج'))).toBe(true);

    const radiology = getPartnersByCategory('radiology');
    expect(radiology.length).toBeGreaterThanOrEqual(2);
    expect(radiology.some((r) => r.name.includes('كايرو سكان'))).toBe(true);
  });

  it('validates active medical offers and discount rates', () => {
    const offers = getActiveOffers();
    expect(offers.length).toBeGreaterThanOrEqual(3);

    for (const offer of offers) {
      expect(offer.discountedPriceEgp).toBeLessThan(offer.originalPriceEgp);
      expect(offer.discountPercent).toBeGreaterThan(0);
      expect(offer.featuresAr.length).toBeGreaterThanOrEqual(3);
    }
  });

  it('filters healthcare ads by audience target', () => {
    const patientAds = getActiveAds('patient');
    expect(patientAds.length).toBeGreaterThan(0);
    expect(patientAds.some((a) => a.targetAudience === 'patient' || a.targetAudience === 'all')).toBe(true);
  });

  it('provides condition-specific recommended doctors', () => {
    const docs = getRecommendedDoctorsForCondition(['diabetes', 'hypertension']);
    expect(docs.length).toBeGreaterThanOrEqual(3);
    expect(docs.some((d) => d.specialtyAr.includes('باطنة') || d.specialtyAr.includes('سكر'))).toBe(true);
  });
});
