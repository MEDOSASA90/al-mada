import {
  listFeatureFlags,
  isFeatureEnabled,
  setFeatureFlag,
} from '../lib/feature-flags';
import {
  calculatePregnancyDates,
  EGYPTIAN_MOH_VACCINATIONS,
  getRecommendedLaserPreset,
} from '../lib/specialty-packs';

describe('Phase 8 — Scale, Feature Flags & Specialty Packs Framework', () => {
  describe('1. Feature Flags & Safe Default Rollouts', () => {
    test('lists all feature flags with valid tiers and categories', () => {
      const flags = listFeatureFlags();
      expect(flags.length).toBeGreaterThanOrEqual(8);

      for (const flag of flags) {
        expect(flag.key).toBeDefined();
        expect(flag.labelAr).toBeDefined();
        expect(['basic', 'pro', 'enterprise']).toContain(flag.requiresTier);
      }
    });

    test('B2B Marketplace is disabled by default per blueprint §26.10 until demand is proven', () => {
      expect(isFeatureEnabled('feature_marketplace_supplies')).toBe(false);
    });

    test('toggles feature flag successfully', () => {
      const current = isFeatureEnabled('feature_marketplace_supplies');
      const updated = setFeatureFlag('feature_marketplace_supplies', !current);

      expect(updated).toBe(true);
      expect(isFeatureEnabled('feature_marketplace_supplies')).toBe(!current);

      // Revert back
      setFeatureFlag('feature_marketplace_supplies', false);
      expect(isFeatureEnabled('feature_marketplace_supplies')).toBe(false);
    });
  });

  describe('2. Specialty Packs — OB/GYN Pregnancy Calculator', () => {
    test('calculates EDD accurately using Naegele rule (LMP + 280 days)', () => {
      // 2026-01-01 + 280 days = 2026-10-08
      const res = calculatePregnancyDates('2026-01-01');

      expect(res.eddDate).toBe('2026-10-08');
      expect(res.gestationalWeeks).toBeGreaterThan(0);
      expect([1, 2, 3]).toContain(res.trimester);
      expect(res.recommendedUltrasounds.length).toBe(4);
    });

    test('throws error for invalid LMP date', () => {
      expect(() => calculatePregnancyDates('invalid-date')).toThrow('غير صالح');
    });
  });

  describe('3. Specialty Packs — Egyptian MOH Pediatric Vaccinations', () => {
    test('contains all 7 mandatory Egyptian ministry of health vaccination milestones', () => {
      expect(EGYPTIAN_MOH_VACCINATIONS.length).toBe(7);

      const birthDose = EGYPTIAN_MOH_VACCINATIONS[0];
      expect(birthDose.ageMilestone).toContain('الولادة');
      expect(birthDose.vaccines.some((v) => v.includes('BCG'))).toBe(true);

      const mmrDose = EGYPTIAN_MOH_VACCINATIONS.find((v) => v.ageMilestone.includes('12 شهر'));
      expect(mmrDose).toBeDefined();
      expect(mmrDose?.vaccines.some((v) => v.includes('MMR'))).toBe(true);
    });
  });

  describe('4. Specialty Packs — Dermatology & Aesthetic Laser Settings', () => {
    test('recommends Nd:YAG 1064nm with dynamic cooling for Egyptian/Mediterranean skin types IV-VI', () => {
      const presetType4 = getRecommendedLaserPreset(4);
      expect(presetType4.deviceType).toBe('Nd:YAG 1064nm');
      expect(presetType4.coolingSetting).toContain('DCD');

      const presetType2 = getRecommendedLaserPreset(2);
      expect(presetType2.deviceType).toBe('Alexandrite 755nm');
    });
  });
});
