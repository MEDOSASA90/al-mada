/**
 * Al-Mada Specialty Clinical Packs Engine (Phase 8 - Blueprint §26.9)
 *
 * Implements:
 * 1. OB/GYN Pregnancy Calculator (Naegele's EDD & Gestational Age).
 * 2. Egyptian MOH Pediatric Vaccination Schedule & Milestones.
 * 3. Dental FDI Interactive Notation Chart.
 * 4. Dermatology & Laser Procedural Parameters.
 */

// ==========================================
// 1. OB/GYN Pregnancy Calculator
// ==========================================
export type PregnancyDetails = {
  lmpDate: string;
  eddDate: string;
  gestationalWeeks: number;
  gestationalDays: number;
  trimester: 1 | 2 | 3;
  trimesterLabel: string;
  recommendedUltrasounds: string[];
};

export function calculatePregnancyDates(lmpDateStr: string): PregnancyDetails {
  const lmp = new Date(lmpDateStr);
  if (isNaN(lmp.getTime())) {
    throw new Error('تاريخ آخر دورة شهرية (LMP) غير صالح.');
  }

  // Naegele's rule: LMP + 280 days
  const edd = new Date(lmp.getTime() + 280 * 24 * 60 * 60 * 1000);

  const now = new Date();
  const diffTime = now.getTime() - lmp.getTime();
  const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)));

  const gestationalWeeks = Math.floor(diffDays / 7);
  const gestationalDays = diffDays % 7;

  let trimester: 1 | 2 | 3 = 1;
  let trimesterLabel = 'الثلث الأول (الأسبوع 1 - 13)';

  if (gestationalWeeks > 27) {
    trimester = 3;
    trimesterLabel = 'الثلث الثالث (الأسبوع 28 - 40)';
  } else if (gestationalWeeks > 13) {
    trimester = 2;
    trimesterLabel = 'الثلث الثاني (الأسبوع 14 - 27)';
  }

  const recommendedUltrasounds = [
    'سونار التأكيد الأولي والتأكد من نبض الجنين (الأسبوع 6 - 8)',
    'فحص شفافية عنق الجنين والمؤشرات الصبغية NT Scan (الأسبوع 11 - 13)',
    'السونار التفصيلي للتشوهات المورفولوجية Anomaly Scan (الأسبوع 18 - 22)',
    'سونار دوبلر للاطمئنان على نمو الجنين والمشيمة (الأسبوع 32 - 36)',
  ];

  return {
    lmpDate: lmpDateStr,
    eddDate: edd.toISOString().slice(0, 10),
    gestationalWeeks,
    gestationalDays,
    trimester,
    trimesterLabel,
    recommendedUltrasounds,
  };
}

// ==========================================
// 2. Egyptian MOH Pediatric Vaccinations
// ==========================================
export type VaccinationDose = {
  ageMilestone: string;
  vaccines: string[];
  route: string;
  notes: string;
};

export const EGYPTIAN_MOH_VACCINATIONS: VaccinationDose[] = [
  {
    ageMilestone: 'عند الولادة (خلال 24 ساعة الأولى)',
    vaccines: ['الدرن (BCG)', 'الالتهاب الكبدي الوبائي ب (الجرعة الصفرية)', 'شلل الأطفال (سابين بالفم)'],
    route: 'حقن داخل الجلد بالكتف الأيسر + نقط بالفم',
    notes: 'إلزامي لتسجيل شهادة الميلاد بمكاتب الصحة المصرية.',
  },
  {
    ageMilestone: 'إتمام شهرين',
    vaccines: ['الخماسي (دفتيريا، تيتانوس، سعال ديكي، كبدي ب، هيموفيلس)', 'شلل الأطفال المعطل (سولك بالحقن)', 'شلل الأطفال (سابين بالفم)'],
    route: 'حقن بالعضل بالفخذ الأيمن والأيسر + نقط بالفم',
    notes: 'الجرعة الأولى من التطعيم الأساسي.',
  },
  {
    ageMilestone: 'إتمام 4 شهور',
    vaccines: ['الخماسي الجرعة الثانية', 'شلل الأطفال بالحقن (سولك)', 'شلل الأطفال بالفم (سابين)'],
    route: 'حقن بالعضل بالفخذ + نقط بالفم',
    notes: 'الجرعة الثانية المقررة.',
  },
  {
    ageMilestone: 'إتمام 6 شهور',
    vaccines: ['الخماسي الجرعة الثالثة', 'شلل الأطفال بالحقن (سولك)', 'شلل الأطفال بالفم (سابين)'],
    route: 'حقن بالعضل بالفخذ + نقط بالفم',
    notes: 'الجرعة الثالثة واستكمال التحصين الأساسي.',
  },
  {
    ageMilestone: 'إتمام 9 شهور',
    vaccines: ['شلل الأطفال بالفم (سابين)', 'كبسولة فيتامين (أ) 100 ألف وحدة دولية'],
    route: 'نقط بالفم',
    notes: 'لدعم المناعة ونمو الجهاز العصبي والبصري.',
  },
  {
    ageMilestone: 'إتمام 12 شهر (سنة)',
    vaccines: ['الثلاثي الفيروسي MMR (حصبة، نكاف، حصبة ألماني)', 'شلل الأطفال بالفم (سابين)'],
    route: 'حقن تحت الجلد بالذراع الأيمن + نقط بالفم',
    notes: 'الجرعة الأولى من تطعيم الـ MMR.',
  },
  {
    ageMilestone: 'إتمام 18 شهر (سنة ونصف)',
    vaccines: ['الجرعة المنشطة للثلاثي البكتيري DTP', 'الجرعة المنشطة لشلل الأطفال', 'الجرعة المنشطة لـ MMR', 'كبسولتان فيتامين (أ) 200 ألف وحدة'],
    route: 'حقن بالعضل بالكتف + نقط بالفم',
    notes: 'التطعيم المنشط النهائي لمرحلة الرضاعة.',
  },
];

// ==========================================
// 3. Dental Notation Chart (FDI System)
// ==========================================
export type ToothStatus = {
  toothNumber: number;
  quadrant: 1 | 2 | 3 | 4;
  arabicName: string;
  condition: 'healthy' | 'decayed' | 'filled' | 'missing' | 'root_canal' | 'crown';
};

export const DENTAL_QUADRANTS_AR = {
  1: 'الربع العلوي الأيمن (Upper Right)',
  2: 'الربع العلوي الأيسر (Upper Left)',
  3: 'الربع السفلي الأيسر (Lower Left)',
  4: 'الربع السفلي الأيمن (Lower Right)',
};

// ==========================================
// 4. Dermatology & Aesthetic Laser Settings
// ==========================================
export type LaserSessionParams = {
  area: string;
  deviceType: 'Alexandrite 755nm' | 'Nd:YAG 1064nm' | 'Diode 808nm' | 'Fractional CO2';
  spotSizeMm: number;
  fluenceJoules: number;
  pulseDurationMs: number;
  coolingSetting: string;
  passCount: number;
};

export function getRecommendedLaserPreset(skinTypeFitzpatrick: 1 | 2 | 3 | 4 | 5 | 6): Partial<LaserSessionParams> {
  // Fitzpatrick scale tuning for Mediterranean / Egyptian skin types
  if (skinTypeFitzpatrick >= 4) {
    return {
      deviceType: 'Nd:YAG 1064nm',
      spotSizeMm: 15,
      fluenceJoules: 14,
      pulseDurationMs: 20,
      coolingSetting: 'DCD 40/30 (تبريد ديناميكي لحماية البشرة السمراء)',
      passCount: 1,
    };
  }
  return {
    deviceType: 'Alexandrite 755nm',
    spotSizeMm: 18,
    fluenceJoules: 18,
    pulseDurationMs: 3,
    coolingSetting: 'DCD 30/20 (تبريد قياسي)',
    passCount: 1,
  };
}
