/**
 * Al-Mada Healthcare Marketplace & Partner Ecosystem
 * 
 * Unifies the five key healthcare pillars:
 * 1. Pharmaceutical Companies (شركات الأدوية)
 * 2. Community & Hospital Pharmacies (الصيدليات المعتمدة)
 * 3. Diagnostic Clinical Laboratories (معامل التحاليل الطبية)
 * 4. Medical Imaging & Radiology Centers (مراكز ودور الأشعة)
 * 5. Medical Equipment & Supplies Vendors (مكاتب ومحلات المستلزمات والأجهزة الطبية)
 * 
 * Also powers the in-platform Healthcare Advertising & Promotion Engine.
 */

export type PartnerCategory = 'pharma' | 'pharmacy' | 'lab' | 'radiology' | 'medical_supplies';

export type HealthcarePartner = {
  id: string;
  name: string;
  category: PartnerCategory;
  categoryLabelAr: string;
  logo: string;
  rating: number;
  reviewsCount: number;
  phone: string;
  hotline?: string;
  branchesCount: number;
  coverageAreas: string[];
  isVerified: boolean;
  featuredBadge?: string;
  descriptionAr: string;
  servicesAr: string[];
  discountCode?: string;
  discountPercentage?: number;
};

export type MedicalOffer = {
  id: string;
  titleAr: string;
  partnerId: string;
  partnerName: string;
  category: PartnerCategory;
  badgeAr: string;
  originalPriceEgp: number;
  discountedPriceEgp: number;
  discountPercent: number;
  validUntil: string;
  featuresAr: string[];
  isSponsored: boolean;
  ctaTextAr: string;
};

export type HealthcareAd = {
  id: string;
  titleAr: string;
  subtitleAr: string;
  advertiserName: string;
  category: PartnerCategory;
  targetAudience: 'patient' | 'doctor' | 'clinic_owner' | 'all';
  bannerImageUrl?: string;
  badgeAr: string;
  actionUrl: string;
  callToActionAr: string;
  disclaimerAr?: string;
  isActive: boolean;
  impressions: number;
  clicks: number;
};

export type RecommendedDoctor = {
  id: string;
  name: string;
  specialtyAr: string;
  clinicName: string;
  areaAr: string;
  rating: number;
  consultationFeeEgp: number;
  availableSlot: string;
  avatar: string;
  reasonAr: string;
};

// ---------------------------------------------------------
// Verified Partner Network (Egyptian Market Top Providers)
// ---------------------------------------------------------

export const HEALTHCARE_PARTNERS: HealthcarePartner[] = [
  // Diagnostic Labs
  {
    id: 'lab-al-borg',
    name: 'معامل البرج (Al Borg Laboratories)',
    category: 'lab',
    categoryLabelAr: 'معمل تحاليل طبية معتمد',
    logo: '🧪',
    rating: 4.9,
    reviewsCount: 1420,
    phone: '19911',
    hotline: '19911',
    branchesCount: 220,
    coverageAreas: ['القاهرة', 'الجيزة', 'الإسكندرية', 'كافة المحافظات'],
    isVerified: true,
    featuredBadge: 'شريك معتمد رسمي',
    descriptionAr: 'أكبر شبكة معامل تحاليل طبية حاصلة على اعتمادات دولية (CAP & ISO 15189) في الشرق الأوسط.',
    servicesAr: ['تحاليل الدم الشاملة', 'تحاليل السكر التراكمي', 'دلالات الأورام', 'فحوصات الجينات والوراثة', 'خدمة السحب المنزلي مجاناً'],
    discountCode: 'MADA20',
    discountPercentage: 20,
  },
  {
    id: 'lab-al-mokhtabar',
    name: 'معامل المختبر (Al Mokhtabar)',
    category: 'lab',
    categoryLabelAr: 'معمل تحاليل طبية معتمد',
    logo: '🔬',
    rating: 4.8,
    reviewsCount: 1180,
    phone: '19014',
    hotline: '19014',
    branchesCount: 190,
    coverageAreas: ['القاهرة', 'الجيزة', 'الدلتا', 'الصعيد'],
    isVerified: true,
    featuredBadge: 'ربط نتائج رقمي فوري',
    descriptionAr: 'فحوصات معملية متطورة مع ربط رقمي فوري لنتائج التحاليل مع ملف المريض في المدى.',
    servicesAr: ['فحص وظائف الكبد والكلى', 'فحص الغدة الدرقية', 'تحاليل المناعة الذاتية', 'سحب عينات منزلي'],
    discountCode: 'MADA15',
    discountPercentage: 15,
  },

  // Radiology Centers
  {
    id: 'rad-cairo-scan',
    name: 'كايرو سكان للأشعة والتحاليل (Cairo Scan)',
    category: 'radiology',
    categoryLabelAr: 'مركز أشعة تشخيصية ورنين',
    logo: '🩻',
    rating: 4.9,
    reviewsCount: 960,
    phone: '19144',
    hotline: '19144',
    branchesCount: 28,
    coverageAreas: ['مدينة نصر', 'المهندسين', 'المعادي', 'التجمع الخامس', 'أكتوبر'],
    isVerified: true,
    featuredBadge: 'أعلى دقة تشخيصية',
    descriptionAr: 'رواد التصوير بالرنين المغناطيسي المغلق والمفتوح 3.0 Tesla، والأشعة المقطعية متعددة المقاطع.',
    servicesAr: ['رنين مغناطيسي MRI', 'أشعة مقطعية CT Scan', 'موجات صوتية وسونار دوبلر 4D', 'أشعة الثدي ماموجرام'],
    discountCode: 'MADASCAN',
    discountPercentage: 15,
  },
  {
    id: 'rad-al-borg-scan',
    name: 'البرج سكان للأشعة التشخيصية (Al Borg Scan)',
    category: 'radiology',
    categoryLabelAr: 'مركز تصوير طبي متكامل',
    logo: '📡',
    rating: 4.8,
    reviewsCount: 750,
    phone: '19911',
    hotline: '19911',
    branchesCount: 18,
    coverageAreas: ['القاهرة الكبرى', 'الإسكندرية', 'طنطا'],
    isVerified: true,
    featuredBadge: 'تكامل مع كارت الأمان',
    descriptionAr: 'مركز متكامل للتصوير الإشعاعي الرقمي مع إمكانية عرض صور الأشعة عبر بوابة مريض المدى.',
    servicesAr: ['أشعة سينية رقمية Digital X-Ray', 'مسح ذري PET/CT', 'فحص كثافة العظام DEXA', 'رنين مغناطيسي'],
    discountCode: 'SCAN15',
    discountPercentage: 15,
  },

  // Pharmacies
  {
    id: 'pharma-ezzabi',
    name: 'صيدليات العزبي (El Ezaby)',
    category: 'pharmacy',
    categoryLabelAr: 'سلسلة صيدليات معتمدة',
    logo: '💊',
    rating: 4.9,
    reviewsCount: 2300,
    phone: '19600',
    hotline: '19600',
    branchesCount: 260,
    coverageAreas: ['كافة أنحاء جمهورية مصر العربية'],
    isVerified: true,
    featuredBadge: 'صرف الروشتة الإلكترونية بضغطة زر',
    descriptionAr: 'صرف مباشر للروشتات الإلكترونية الصادرة من عيادات المدى مع فحص أمان الدواء وتوصيل سريع للمنزل.',
    servicesAr: ['صرف الروشتات الرقمية', 'توصيل دوائي 24/7', 'أدوية الأمراض المزمنة الشهرية', 'فيتامينات ومكملات غذائية أصلية'],
    discountPercentage: 10,
  },
  {
    id: 'pharma-19011',
    name: 'صيدليات رشدي (Roushdy Pharmacies)',
    category: 'pharmacy',
    categoryLabelAr: 'صيدلية مجتمعية مرخصة',
    logo: '🏪',
    rating: 4.7,
    reviewsCount: 880,
    phone: '19700',
    hotline: '19700',
    branchesCount: 140,
    coverageAreas: ['القاهرة', 'الجيزة', 'الإسكندرية'],
    isVerified: true,
    descriptionAr: 'خدمة توصيل أدوية معتمدة ومتابعة مواعيد تكرار الأدوية المزمنة للمرضى.',
    servicesAr: ['توصيل منزلي', 'استشارات صيدلانية إكلينيكية', 'أجهزة العناية المنزلية'],
  },

  // Medical Equipment & Supplies
  {
    id: 'supplies-medline',
    name: 'شركة المدى للمستلزمات والأجهزة الطبية (Al-Mada MedSupplies)',
    category: 'medical_supplies',
    categoryLabelAr: 'أجهزة ومستلزمات طبية معتمدة',
    logo: '🩺',
    rating: 4.9,
    reviewsCount: 520,
    phone: '01000000000',
    branchesCount: 12,
    coverageAreas: ['توصيل لكافة المحافظات'],
    isVerified: true,
    featuredBadge: 'ضمان استبدال مباشر',
    descriptionAr: 'توريد أجهزة السكر، قياس الضغط الرقمي، مستلزمات العناية بالجروح، وأجهزة الاستنشاق التنفسي بأسعار الجملة للأطباء والمرضى.',
    servicesAr: ['أجهزة قياس الضغط الرقمية من Omron', 'أجهزة قياس السكر وشرائط الفحص Accu-Chek', 'أجهزة نيبولايزر للاستنشاق', 'مستلزمات تعقيم وأقنعة طبية'],
    discountCode: 'DEVICES10',
    discountPercentage: 10,
  },

  // Pharmaceutical Companies
  {
    id: 'pharma-eva',
    name: 'إيفا فارما للأدوية (Eva Pharma)',
    category: 'pharma',
    categoryLabelAr: 'شريك صناعة وتطوير دوائي',
    logo: '🧬',
    rating: 5.0,
    reviewsCount: 340,
    phone: '16688',
    branchesCount: 1,
    coverageAreas: ['مصر والشرق الأوسط'],
    isVerified: true,
    featuredBadge: 'رعاية علمية وتوعية دوائية',
    descriptionAr: 'رعاية برامج التوعية بأمراض السكري والقلب، وتوفير أحدث الأدلة الإكلينيكية لأطباء شبكة المدى.',
    servicesAr: ['أدلة التداخلات الدوائية الإكلينيكية', 'برامج دعم مرضى السكري', 'أبحاث الأدوية المعتمدة'],
  },
];

// ---------------------------------------------------------
// Active Medical Offers & Discount Packages
// ---------------------------------------------------------

export const ACTIVE_MEDICAL_OFFERS: MedicalOffer[] = [
  {
    id: 'offer-comprehensive-checkup',
    titleAr: 'باقة الفحص الدوري والاطمئنان الشامل (12 تحليلاً)',
    partnerId: 'lab-al-borg',
    partnerName: 'معامل البرج',
    category: 'lab',
    badgeAr: 'خصم 40% حصري لمرضى المدى',
    originalPriceEgp: 1850,
    discountedPriceEgp: 1100,
    discountPercent: 40,
    validUntil: '2026-12-31',
    featuresAr: [
      'صورة دم كاملة CBC مع كرات الدم البيضاء',
      'فحص وظائف الكبد الكاملة (SGOT, SGPT, Bilirubin)',
      'فحص وظائف الكلى (Creatinine & Urea)',
      'سكر صائم وتراكمي HbA1c',
      'دهون ثلاثية وكوليسترول كامل Lipid Profile',
      'سحب العينة مجاناً من المنزل أو في أقرب فرع',
    ],
    isSponsored: true,
    ctaTextAr: 'احجز العرض بكود MADA20',
  },
  {
    id: 'offer-cardiac-checkup',
    titleAr: 'باقة فحص صحة القلب والأوعية الدموية بالرنين والسونار',
    partnerId: 'rad-cairo-scan',
    partnerName: 'كايرو سكان للأشعة',
    category: 'radiology',
    badgeAr: 'عرض مميز',
    originalPriceEgp: 2400,
    discountedPriceEgp: 1800,
    discountPercent: 25,
    validUntil: '2026-12-15',
    featuresAr: [
      'أشعة موجات صوتية على القلب إيكو (Echo Doppler)',
      'رسم قلب رقمي بالمجهود أو الراحة (ECG)',
      'تقرير طبي معتمد من استشاري قلب وأشعة خلال ساعتين',
      'ربط النتيجة تلقائياً مع كارت سلامتك بالمنصة',
    ],
    isSponsored: true,
    ctaTextAr: 'احجز موعد الأشعة الآن',
  },
  {
    id: 'offer-bp-monitor',
    titleAr: 'جهاز قياس ضغط الدم الرقمي الذكي Omron M3 Comfort',
    partnerId: 'supplies-medline',
    partnerName: 'المدى للمستلزمات الطبية',
    category: 'medical_supplies',
    badgeAr: 'الأكثر طلباً لمرضى الضغط',
    originalPriceEgp: 2200,
    discountedPriceEgp: 1750,
    discountPercent: 20,
    validUntil: '2026-12-31',
    featuresAr: [
      'دقة سريرية موثقة وفق المعايير الأوروبية',
      'كف ذكي بزاوية 360 درجة لتقليل أخطاء القياس',
      'ذاكرة لمستخدمين مع مؤشر لضربات القلب غير المنتظمة',
      'ضمان شامل 3 سنوات واستبدال فوري من المدى',
    ],
    isSponsored: false,
    ctaTextAr: 'اطلب الجهاز وتوصيل خلال 24 ساعة',
  },
  {
    id: 'offer-derma-laser',
    titleAr: 'باقة نضارة البشرة وجلسات الليزر الطبية المتخصصة',
    partnerId: 'clinic-mada-derma',
    partnerName: 'عيادة الجلدية والليزر بالمدى',
    category: 'lab',
    badgeAr: 'عرض عيادات المدى',
    originalPriceEgp: 1500,
    discountedPriceEgp: 950,
    discountPercent: 36,
    validUntil: '2026-12-20',
    featuresAr: [
      'كشف سريري كامل مع استشاري الجلدية والتجميل',
      'جلسة هيدرافيشيل عميقة لتنظيف ونضارة البشرة',
      'خطة عناية وتوصيات دوائية موثقة على ملف المريض',
    ],
    isSponsored: false,
    ctaTextAr: 'احجز جلستك الآن',
  },
];

// ---------------------------------------------------------
// In-Platform Healthcare Advertising Placements
// ---------------------------------------------------------

export const HEALTHCARE_ADS: HealthcareAd[] = [
  {
    id: 'ad-pharma-diabetes-awareness',
    titleAr: 'حملة صحتك في ضبط سكرك: أحدث حلول متابعة النوع الثاني',
    subtitleAr: 'برعاية إيفا فارما · تجنب مضاعفات القدم السكرية واعتلال الشبكية بالفحص الدوري المعتمد.',
    advertiserName: 'إيفا فارما للأبحاث الدوائية',
    category: 'pharma',
    targetAudience: 'patient',
    badgeAr: 'إعلان توعوي معتمد',
    actionUrl: '#offers',
    callToActionAr: 'اقرأ الدليل العلاجي وباقات الفحص',
    disclaimerAr: 'محتوى توعوي خاضع للرقابة العلمية. راجع طبيبك المعالج دائماً قبل تغيير أي جرعة علاجية.',
    isActive: true,
    impressions: 12450,
    clicks: 890,
  },
  {
    id: 'ad-radiology-open-mri',
    titleAr: 'لا خوف بعد اليوم من الرنين المغناطيسي: جهاز الرنين المفتوح فائق الهدوء',
    subtitleAr: 'كايرو سكان تقدم أعلى جودة تصوير للمرضى الذين يعانون من رهاب الأماكن المغلقة والأطفال.',
    advertiserName: 'كايرو سكان للأشعة',
    category: 'radiology',
    targetAudience: 'all',
    badgeAr: 'رعاية مميزة',
    actionUrl: '#partners',
    callToActionAr: 'عرض الفروع المتاحة وحجز موعد',
    disclaimerAr: 'فروع المهندسين، مدينة نصر، والتجمع الخامس.',
    isActive: true,
    impressions: 8920,
    clicks: 640,
  },
  {
    id: 'ad-b2b-clinic-supplies',
    titleAr: 'تجهيز كامل للعيادات والمراكز الطبية بأفضل أسعار التوريد والتقسيط',
    subtitleAr: 'المدى للمستلزمات الطبية: توريد أجهزة الكشف، التعقيم، أسرة الفحص ومستهلكات العيادة.',
    advertiserName: 'المدى للمستلزمات الطبية',
    category: 'medical_supplies',
    targetAudience: 'clinic_owner',
    badgeAr: 'سوق العيادات B2B',
    actionUrl: '/settings/marketplace',
    callToActionAr: 'تصفح كتالوج تجهيز العيادات',
    isActive: true,
    impressions: 3410,
    clicks: 310,
  },
];

// ---------------------------------------------------------
// Recommended Doctors & Clinics Matching Patient Condition
// ---------------------------------------------------------

export const RECOMMENDED_DOCTORS: RecommendedDoctor[] = [
  {
    id: 'doc-rec-1',
    name: 'أ.د. طارق محمود المنشاوي',
    specialtyAr: 'استشاري أمراض الباطنة والسكر والغدد الصماء',
    clinicName: 'مركز المدى التخصصي للباطنة',
    areaAr: 'الدقي، الجيزة',
    rating: 4.95,
    consultationFeeEgp: 450,
    availableSlot: 'غداً الساعة 05:30 مساءً',
    avatar: '👨‍⚕️',
    reasonAr: 'مرشح لحالتك لمتابعة انتظام قراءات السكر التراكمي وتعديل جرعات الميتفورمين.',
  },
  {
    id: 'doc-rec-2',
    name: 'د. منى عبد الرحمن السعدني',
    specialtyAr: 'استشاري القلب والأوعية الدموية وقسطرة الشرايين',
    clinicName: 'عيادات القلب والأوعية المعتمدة',
    areaAr: 'مصر الجديدة، القاهرة',
    rating: 4.9,
    consultationFeeEgp: 500,
    availableSlot: 'الأربعاء الساعة 06:00 مساءً',
    avatar: '👩‍⚕️',
    reasonAr: 'فحص وقائي موصى به لمرضى السكري لمتابعة ضغط الدم وصحة الأوعية التاجية.',
  },
  {
    id: 'doc-rec-3',
    name: 'د. حازم سمير الشناوي',
    specialtyAr: 'استشاري أمراض الصدر والحساسية والمناعة',
    clinicName: 'عيادة المدى لطب الجهاز التنفسي',
    areaAr: 'المعادي، القاهرة',
    rating: 4.88,
    consultationFeeEgp: 400,
    availableSlot: 'الخميس الساعة 04:00 عصراً',
    avatar: '👨‍⚕️',
    reasonAr: 'متابعة أمان أدوية الصدر ومراجعة حساسية البنسلين لتسجيلها رسمياً بكارت السلامة.',
  },
];

// ---------------------------------------------------------
// Helpers
// ---------------------------------------------------------

export function getPartnersByCategory(category?: PartnerCategory): HealthcarePartner[] {
  if (!category) return HEALTHCARE_PARTNERS;
  return HEALTHCARE_PARTNERS.filter((p) => p.category === category);
}

export function getActiveOffers(category?: PartnerCategory): MedicalOffer[] {
  if (!category) return ACTIVE_MEDICAL_OFFERS;
  return ACTIVE_MEDICAL_OFFERS.filter((o) => o.category === category);
}

export function getActiveAds(audience: 'patient' | 'doctor' | 'clinic_owner' | 'all' = 'all'): HealthcareAd[] {
  return HEALTHCARE_ADS.filter((ad) => ad.isActive && (ad.targetAudience === 'all' || ad.targetAudience === audience));
}

export function getRecommendedDoctorsForCondition(conditionKeywords?: string[]): RecommendedDoctor[] {
  return RECOMMENDED_DOCTORS;
}
