/**
 * Al-Mada Laboratory Information Management System (LIMS)
 * نظام إدارة معامل التحاليل الطبية والباثولوجيا الإكلينيكية المتكامل
 * 
 * Manages:
 * - Comprehensive Test Directory & Lab Profiles
 * - Sample Lifecycle, Phlebotomy & Barcode IDs
 * - Automated Result Evaluation, Normal Reference Ranges & Critical Panic Values
 * - Clinical AI Lab Result Summarizer & Interpretation
 * - Medical Review & Consultant Sign-Off
 * - Official Lab Reports with Anti-Fraud Verification QR
 * - Home Phlebotomy Sample Collection Management
 * - Laboratory Analyzers & Quality Control (QC)
 */

import { isDemoSession } from './session';

export type LabCategory =
  | 'hematology'
  | 'clinical_chemistry'
  | 'immunology_serology'
  | 'hormones'
  | 'microbiology'
  | 'parasitology_urinalysis'
  | 'molecular_genetics';

export type SampleTubeType =
  | 'edta_purple' // دم كامل - أنبوبة بنفسجية
  | 'serum_gel_yellow' // مصل - أنبوبة صفراء بالجل
  | 'serum_red' // مصل عادي - أنبوبة حمراء
  | 'citrate_blue' // سيترات الصوديوم للسيولة - أنبوبة زرقاء
  | 'fluoride_grey' // سكر الدم - أنبوبة رمادية
  | 'heparin_green' // بلازما هيبارين - أنبوبة خضراء
  | 'sterile_cup' // عينة بول / براز معقمة
  | 'swab_transport'; // مسحة في وسط نقل

export type TestParameter = {
  id: string;
  nameEn: string;
  nameAr: string;
  unit: string;
  refRangeText?: string;
  normalMin?: number;
  normalMax?: number;
  panicMin?: number;
  panicMax?: number;
  isNumeric: boolean;
};

export type LabTest = {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  category: LabCategory;
  categoryLabelAr: string;
  tubeType: SampleTubeType;
  tubeLabelAr: string;
  sampleTypeAr: string;
  fastingRequirementsAr: string;
  turnaroundTimeHours: number;
  priceEgp: number;
  parameters: TestParameter[];
  clinicalSignificanceAr: string;
};

export type LabResultEvaluation = 'normal' | 'high' | 'low' | 'critical_high' | 'critical_low' | 'positive' | 'negative';

export type LabResultValue = {
  parameterId: string;
  parameterNameEn: string;
  parameterNameAr: string;
  unit: string;
  value: string;
  evaluation: LabResultEvaluation;
  refRangeText: string;
  notes?: string;
};

export type LabOrderStatus =
  | 'pending_collection' // بانتظار السحب
  | 'collected'          // تم السحب والاستلام بالمعمل
  | 'in_processing'      // جاري التحليل على الأجهزة
  | 'pending_review'     // اكتمل التحليل بانتظار الاعتماد الطبي
  | 'approved'           // معتمد رسمياً ومتاح للطباعة
  | 'delivered';         // تم التسليم للمريض

export type LabOrder = {
  id: string;
  barcode: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientGender: 'male' | 'female';
  patientAge: number;
  referringDoctorName?: string;
  referringClinicName?: string;
  orderDate: string;
  sampleCollectionTime?: string;
  status: LabOrderStatus;
  isHomeVisit: boolean;
  homeVisitAddress?: string;
  homeVisitTime?: string;
  homeVisitPhlebotomistName?: string;
  testIds: string[];
  testNamesAr: string[];
  totalPriceEgp: number;
  paidAmountEgp: number;
  results: LabResultValue[];
  criticalAlertCount: number;
  consultantReviewerName?: string;
  consultantReviewedAt?: string;
  aiInterpretationAr?: string;
  technicalNotes?: string;
};

export type HomePhlebotomyVisit = {
  id: string;
  orderId: string;
  patientName: string;
  patientPhone: string;
  addressAr: string;
  scheduledTime: string;
  phlebotomistName: string;
  status: 'scheduled' | 'en_route' | 'sample_collected' | 'delivered_to_lab';
  testsCount: number;
  collectedTubes: string[];
};

export type LabAnalyzer = {
  id: string;
  name: string;
  manufacturer: string;
  model: string;
  category: LabCategory;
  status: 'online' | 'processing' | 'maintenance' | 'qc_passed';
  lastQcDate: string;
  throughputPerHour: number;
  installedAt: string;
};

// --------------------------------------------------------------------------
// Standard Test Directory (Comprehensive Egyptian Diagnostic Catalog)
// --------------------------------------------------------------------------

export const LAB_TEST_DIRECTORY: LabTest[] = [
  {
    id: 'test-cbc',
    code: 'HEM-001',
    nameAr: 'صورة دم كاملة (Complete Blood Count - CBC)',
    nameEn: 'Complete Blood Count (CBC with Differential)',
    category: 'hematology',
    categoryLabelAr: 'علم الدم (Hematology)',
    tubeType: 'edta_purple',
    tubeLabelAr: 'أنبوبة بنفسجية (K3-EDTA)',
    sampleTypeAr: 'دم وريدي كامل Whole Blood',
    fastingRequirementsAr: 'لا يشترط الصيام',
    turnaroundTimeHours: 1,
    priceEgp: 180,
    clinicalSignificanceAr: 'تشخيص الأنيميا وفقر الدم، العدوى البكتيرية والفيروسية، ومراقبة الصفائح الدموية.',
    parameters: [
      { id: 'hb', nameEn: 'Hemoglobin (Hb)', nameAr: 'الهيموجلوبين', unit: 'g/dL', normalMin: 12.0, normalMax: 16.5, panicMin: 6.5, panicMax: 20.0, isNumeric: true },
      { id: 'rbc', nameEn: 'RBCs Count', nameAr: 'كرات الدم الحمراء', unit: 'x10^6/uL', normalMin: 4.0, normalMax: 5.5, isNumeric: true },
      { id: 'hct', nameEn: 'Hematocrit (PCV)', nameAr: 'الهيماتوكريت', unit: '%', normalMin: 36.0, normalMax: 50.0, isNumeric: true },
      { id: 'mcv', nameEn: 'MCV', nameAr: 'متوسط حجم الكرية الحمراء', unit: 'fL', normalMin: 80.0, normalMax: 98.0, isNumeric: true },
      { id: 'wbc', nameEn: 'Total WBCs Count', nameAr: 'كرات الدم البيضاء الكلية', unit: 'x10^3/uL', normalMin: 4.0, normalMax: 11.0, panicMin: 1.5, panicMax: 30.0, isNumeric: true },
      { id: 'plt', nameEn: 'Platelets Count', nameAr: 'الصفائح الدموية', unit: 'x10^3/uL', normalMin: 150, normalMax: 450, panicMin: 40, panicMax: 900, isNumeric: true },
    ],
  },
  {
    id: 'test-hba1c',
    code: 'CHM-010',
    nameAr: 'السكر التراكمي (HbA1c - Glycated Hemoglobin)',
    nameEn: 'Hemoglobin A1c (HbA1c)',
    category: 'clinical_chemistry',
    categoryLabelAr: 'الكيمياء الإكلينيكية (Clinical Chemistry)',
    tubeType: 'edta_purple',
    tubeLabelAr: 'أنبوبة بنفسجية (EDTA)',
    sampleTypeAr: 'دم وريدي كامل Whole Blood',
    fastingRequirementsAr: 'لا يشترط الصيام',
    turnaroundTimeHours: 2,
    priceEgp: 160,
    clinicalSignificanceAr: 'تقييم متوسط انضباط سكر الدم خلال آخر 3 أشهر وفق معايير جمعية السكري الأمريكية ADA.',
    parameters: [
      { id: 'hba1c_val', nameEn: 'HbA1c Level', nameAr: 'نسبة الهيموجلوبين السكري', unit: '%', normalMin: 4.0, normalMax: 5.6, panicMin: 3.5, panicMax: 12.0, isNumeric: true, refRangeText: 'طبيعي: < 5.7% | مرحلة ما قبل السكري: 5.7 - 6.4% | مريض سكري: >= 6.5%' },
    ],
  },
  {
    id: 'test-fbs',
    code: 'CHM-011',
    nameAr: 'سكر الدم الصائم (Fasting Blood Sugar - FBS)',
    nameEn: 'Fasting Blood Glucose (FBS)',
    category: 'clinical_chemistry',
    categoryLabelAr: 'الكيمياء الإكلينيكية (Clinical Chemistry)',
    tubeType: 'fluoride_grey',
    tubeLabelAr: 'أنبوبة رمادية (Sodium Fluoride)',
    sampleTypeAr: 'مصل / بلازما Serum',
    fastingRequirementsAr: 'صيام من 8 إلى 10 ساعات عن الطعام والشراب عدا الماء',
    turnaroundTimeHours: 1,
    priceEgp: 60,
    clinicalSignificanceAr: 'تشخيص داء السكري واعتلال التمثيل الغذائي للجلوكوز.',
    parameters: [
      { id: 'fbs_val', nameEn: 'Fasting Blood Glucose', nameAr: 'جلوكوز الدم الصائم', unit: 'mg/dL', normalMin: 70, normalMax: 100, panicMin: 45, panicMax: 450, isNumeric: true, refRangeText: 'طبيعي: 70 - 100 | اضطراب صائم: 101 - 125 | سكري: >= 126 mg/dL' },
    ],
  },
  {
    id: 'test-kidney-func',
    code: 'CHM-020',
    nameAr: 'وظائف الكلى الكاملة (Kidney Function Tests - KFT)',
    nameEn: 'Renal Function Panel (Creatinine & Urea)',
    category: 'clinical_chemistry',
    categoryLabelAr: 'الكيمياء الإكلينيكية (Clinical Chemistry)',
    tubeType: 'serum_gel_yellow',
    tubeLabelAr: 'أنبوبة صفراء جيل (SST)',
    sampleTypeAr: 'مصل دم Serum',
    fastingRequirementsAr: 'لا يشترط الصيام، يفضل تجنب اللحوم الحمراء الكثيفة عشية الفحص',
    turnaroundTimeHours: 2,
    priceEgp: 190,
    clinicalSignificanceAr: 'تقييم كفاءة الفلترة الكلوية واكتشاف القصور الكلوي الحاد والمزمن.',
    parameters: [
      { id: 'creat', nameEn: 'Serum Creatinine', nameAr: 'الكرياتينين في الدم', unit: 'mg/dL', normalMin: 0.6, normalMax: 1.2, panicMin: 0.3, panicMax: 5.0, isNumeric: true },
      { id: 'urea', nameEn: 'Blood Urea', nameAr: 'اليوريا في الدم', unit: 'mg/dL', normalMin: 15, normalMax: 45, panicMin: 8, panicMax: 150, isNumeric: true },
      { id: 'uric', nameEn: 'Uric Acid', nameAr: 'حمض البوليك (النقرس)', unit: 'mg/dL', normalMin: 3.5, normalMax: 7.2, isNumeric: true },
    ],
  },
  {
    id: 'test-liver-func',
    code: 'CHM-030',
    nameAr: 'وظائف الكبد الكاملة (Liver Function Tests - LFT)',
    nameEn: 'Comprehensive Liver Panel',
    category: 'clinical_chemistry',
    categoryLabelAr: 'الكيمياء الإكلينيكية (Clinical Chemistry)',
    tubeType: 'serum_gel_yellow',
    tubeLabelAr: 'أنبوبة صفراء جيل (SST)',
    sampleTypeAr: 'مصل دم Serum',
    fastingRequirementsAr: 'صيام 6 إلى 8 ساعات',
    turnaroundTimeHours: 2,
    priceEgp: 260,
    clinicalSignificanceAr: 'فحص التهابات خلايا الكبد، انسداد القنوات المرارية، وتصنيع البروتينات.',
    parameters: [
      { id: 'sgot', nameEn: 'AST (SGOT)', nameAr: 'إنزيم الكبد AST', unit: 'U/L', normalMin: 0, normalMax: 40, panicMax: 500, isNumeric: true },
      { id: 'sgpt', nameEn: 'ALT (SGPT)', nameAr: 'إنزيم الكبد ALT', unit: 'U/L', normalMin: 0, normalMax: 45, panicMax: 500, isNumeric: true },
      { id: 'tbili', nameEn: 'Total Bilirubin', nameAr: 'الصفراء الكلية', unit: 'mg/dL', normalMin: 0.2, normalMax: 1.2, panicMax: 12.0, isNumeric: true },
      { id: 'dbili', nameEn: 'Direct Bilirubin', nameAr: 'الصفراء المباشرة', unit: 'mg/dL', normalMin: 0.0, normalMax: 0.3, isNumeric: true },
      { id: 'alb', nameEn: 'Serum Albumin', nameAr: 'الألبومين', unit: 'g/dL', normalMin: 3.5, normalMax: 5.2, isNumeric: true },
    ],
  },
  {
    id: 'test-lipid-profile',
    code: 'CHM-040',
    nameAr: 'تحليل دهون الدم الكاملة (Lipid Profile)',
    nameEn: 'Lipid Profile Panel',
    category: 'clinical_chemistry',
    categoryLabelAr: 'الكيمياء الإكلينيكية (Clinical Chemistry)',
    tubeType: 'serum_gel_yellow',
    tubeLabelAr: 'أنبوبة صفراء جيل (SST)',
    sampleTypeAr: 'مصل دم Serum',
    fastingRequirementsAr: 'صيام من 10 إلى 12 ساعة كاملة (يسمح بالماء فقط)',
    turnaroundTimeHours: 2,
    priceEgp: 220,
    clinicalSignificanceAr: 'تقييم مخاطر تصلب الشرايين والجلطات القلبية والدماغية.',
    parameters: [
      { id: 'chol', nameEn: 'Total Cholesterol', nameAr: 'الكوليسترول الكلي', unit: 'mg/dL', normalMin: 120, normalMax: 200, isNumeric: true },
      { id: 'trig', nameEn: 'Triglycerides', nameAr: 'الدهون الثلاثية', unit: 'mg/dL', normalMin: 50, normalMax: 150, panicMax: 600, isNumeric: true },
      { id: 'hdl', nameEn: 'HDL Cholesterol (Good)', nameAr: 'الكوليسترول عالي الكثافة (الحميد)', unit: 'mg/dL', normalMin: 40, normalMax: 60, isNumeric: true },
      { id: 'ldl', nameEn: 'LDL Cholesterol (Bad)', nameAr: 'الكوليسترول منخفض الكثافة (الضار)', unit: 'mg/dL', normalMin: 50, normalMax: 100, isNumeric: true },
    ],
  },
  {
    id: 'test-tsh',
    code: 'HRM-001',
    nameAr: 'هرمون الغدة الدرقية (TSH)',
    nameEn: 'Thyroid Stimulating Hormone (TSH)',
    category: 'hormones',
    categoryLabelAr: 'الهرمونات ودلالات الأورام (Hormones)',
    tubeType: 'serum_gel_yellow',
    tubeLabelAr: 'أنبوبة صفراء جيل (SST)',
    sampleTypeAr: 'مصل دم Serum',
    fastingRequirementsAr: 'لا يشترط الصيام، يفضل صباحاً قبل أخذ جرعة الليفوثيروكسين',
    turnaroundTimeHours: 3,
    priceEgp: 180,
    clinicalSignificanceAr: 'فحص نشاط أو خمول الغدة الدرقية وتنظيم الجرعات الدوائية.',
    parameters: [
      { id: 'tsh_val', nameEn: 'TSH Level', nameAr: 'تركيز هرمون TSH', unit: 'uIU/mL', normalMin: 0.4, normalMax: 4.2, panicMin: 0.05, panicMax: 30.0, isNumeric: true },
    ],
  },
  {
    id: 'test-urine',
    code: 'PAR-001',
    nameAr: 'تحليل البول الكامل (Complete Urine Examination)',
    nameEn: 'Complete Urinalysis (Physical, Chemical & Microscopic)',
    category: 'parasitology_urinalysis',
    categoryLabelAr: 'فحص البول والبراز (Urinalysis & Parasitology)',
    tubeType: 'sterile_cup',
    tubeLabelAr: 'وعاء عينة معقم',
    sampleTypeAr: 'بول صباحي نظيف Clean Catch Midstream',
    fastingRequirementsAr: 'لا يشترط الصيام، يفضل أول بول صباحي بعد غسيل موضعي بالماء',
    turnaroundTimeHours: 1,
    priceEgp: 70,
    clinicalSignificanceAr: 'اكتشاف التهابات المسالك البولية، الزلال، وأملاح وحصوات الكلى.',
    parameters: [
      { id: 'urine_color', nameEn: 'Color', nameAr: 'اللون', unit: '', isNumeric: false, refRangeText: 'Yellow / Straw' },
      { id: 'urine_aspect', nameEn: 'Aspect', nameAr: 'المظهر والشفافية', unit: '', isNumeric: false, refRangeText: 'Clear' },
      { id: 'urine_ph', nameEn: 'Reaction (pH)', nameAr: 'الرقم الهيدروجيني', unit: '', normalMin: 5.0, normalMax: 7.5, isNumeric: true },
      { id: 'urine_pus', nameEn: 'Pus Cells (WBCs)', nameAr: 'خلايا الصديد', unit: '/HPF', normalMin: 0, normalMax: 5, panicMax: 80, isNumeric: true },
      { id: 'urine_rbc', nameEn: 'RBCs (Blood)', nameAr: 'كرات الدم الحمراء', unit: '/HPF', normalMin: 0, normalMax: 3, panicMax: 50, isNumeric: true },
      { id: 'urine_alb', nameEn: 'Albumin / Protein', nameAr: 'الزلال / البروتين', unit: '', isNumeric: false, refRangeText: 'Negative (سلبي)' },
    ],
  },
];

// --------------------------------------------------------------------------
// Sample Lab Orders & Demonstrative Patient Test Runs
// --------------------------------------------------------------------------

export const DEMO_LAB_ORDERS: LabOrder[] = [
  {
    id: 'order-101',
    barcode: 'LAB-2026-0981',
    patientId: '33333333-3333-3333-3333-333333333331',
    patientName: 'محمد إبراهيم حسن',
    patientPhone: '01012345678',
    patientGender: 'male',
    patientAge: 48,
    referringDoctorName: 'د. أحمد مصطفى شريف',
    referringClinicName: 'عيادة المدى التخصصية',
    orderDate: new Date(Date.now() - 3600000 * 3).toISOString(),
    sampleCollectionTime: new Date(Date.now() - 3600000 * 2.5).toISOString(),
    status: 'pending_review',
    isHomeVisit: false,
    testIds: ['test-cbc', 'test-hba1c', 'test-kidney-func'],
    testNamesAr: ['صورة دم كاملة CBC', 'السكر التراكمي HbA1c', 'وظائف الكلى الكاملة KFT'],
    totalPriceEgp: 530,
    paidAmountEgp: 530,
    criticalAlertCount: 1,
    technicalNotes: 'تم سحب أنبوبة بنفسجية وأنبوبة جيل صفراء بدون تخثر. العينة نقية وخالية من التحلل.',
    aiInterpretationAr: 'تظهر النتائج ارتفاعاً ملحوظاً في السكر التراكمي (8.1%) مما يشير إلى عدم انضباط السكر خلال الأشهر الأخيرة ويستلزم مراجعة الطبيب لتعديل جرعات الميتفورمين. كفاءة الكلى طبيعية وهيموجلوبين الدم مستقر.',
    results: [
      { parameterId: 'hb', parameterNameEn: 'Hemoglobin (Hb)', parameterNameAr: 'الهيموجلوبين', unit: 'g/dL', value: '14.2', evaluation: 'normal', refRangeText: '12.0 - 16.5 g/dL' },
      { parameterId: 'wbc', parameterNameEn: 'WBCs Count', parameterNameAr: 'كرات الدم البيضاء', unit: 'x10^3/uL', value: '7.8', evaluation: 'normal', refRangeText: '4.0 - 11.0' },
      { parameterId: 'plt', parameterNameEn: 'Platelets Count', parameterNameAr: 'الصفائح الدموية', unit: 'x10^3/uL', value: '280', evaluation: 'normal', refRangeText: '150 - 450' },
      { parameterId: 'hba1c_val', parameterNameEn: 'HbA1c Level', parameterNameAr: 'السكر التراكمي', unit: '%', value: '8.1', evaluation: 'high', refRangeText: '< 5.7% (طبيعي)', notes: 'مرتفع - داء السكري غير منضبط' },
      { parameterId: 'creat', parameterNameEn: 'Serum Creatinine', parameterNameAr: 'الكرياتينين في الدم', unit: 'mg/dL', value: '0.95', evaluation: 'normal', refRangeText: '0.6 - 1.2 mg/dL' },
      { parameterId: 'urea', parameterNameEn: 'Blood Urea', parameterNameAr: 'اليوريا في الدم', unit: 'mg/dL', value: '32', evaluation: 'normal', refRangeText: '15 - 45 mg/dL' },
    ],
  },
  {
    id: 'order-102',
    barcode: 'LAB-2026-0982',
    patientId: '33333333-3333-3333-3333-333333333332',
    patientName: 'سارة عبد الله الشربيني',
    patientPhone: '01122334455',
    patientGender: 'female',
    patientAge: 32,
    referringDoctorName: 'د. منى عبد الرحمن السعدني',
    orderDate: new Date(Date.now() - 3600000 * 24).toISOString(),
    sampleCollectionTime: new Date(Date.now() - 3600000 * 23).toISOString(),
    status: 'approved',
    isHomeVisit: true,
    homeVisitAddress: 'عمارة 14 شارع النصر، المعادي، القاهرة - شقة 5',
    homeVisitTime: 'أمس الساعة 09:30 صباحاً',
    homeVisitPhlebotomistName: 'أ. طارق عبد المجيد (فني سحب متنقل)',
    testIds: ['test-tsh', 'test-cbc'],
    testNamesAr: ['هرمون الغدة الدرقية TSH', 'صورة دم كاملة CBC'],
    totalPriceEgp: 410,
    paidAmountEgp: 410,
    criticalAlertCount: 0,
    consultantReviewerName: 'أ.د. عصام الدين الفقي (استشاري الباثولوجيا الإكلينيكية)',
    consultantReviewedAt: new Date(Date.now() - 3600000 * 20).toISOString(),
    aiInterpretationAr: 'جميع نتائج الفحوصات في الحدود الطبيعية المستقرة؛ وظائف الغدة الدرقية وهيموجلوبين الدم ممتازان ولا توجد مؤشرات التهاب.',
    results: [
      { parameterId: 'hb', parameterNameEn: 'Hemoglobin (Hb)', parameterNameAr: 'الهيموجلوبين', unit: 'g/dL', value: '12.8', evaluation: 'normal', refRangeText: '12.0 - 15.5 g/dL' },
      { parameterId: 'wbc', parameterNameEn: 'WBCs Count', parameterNameAr: 'كرات الدم البيضاء', unit: 'x10^3/uL', value: '6.4', evaluation: 'normal', refRangeText: '4.0 - 11.0' },
      { parameterId: 'plt', parameterNameEn: 'Platelets Count', parameterNameAr: 'الصفائح الدموية', unit: 'x10^3/uL', value: '310', evaluation: 'normal', refRangeText: '150 - 450' },
      { parameterId: 'tsh_val', parameterNameEn: 'TSH Level', parameterNameAr: 'هرمون الغدة TSH', unit: 'uIU/mL', value: '2.4', evaluation: 'normal', refRangeText: '0.4 - 4.2 uIU/mL' },
    ],
  },
  {
    id: 'order-103',
    barcode: 'LAB-2026-0983',
    patientId: '33333333-3333-3333-3333-333333333333',
    patientName: 'محمود عزت الدسوقي',
    patientPhone: '01234567890',
    patientGender: 'male',
    patientAge: 62,
    referringDoctorName: 'د. طارق محمود المنشاوي',
    orderDate: new Date().toISOString(),
    status: 'in_processing',
    isHomeVisit: false,
    testIds: ['test-fbs', 'test-kidney-func', 'test-lipid-profile'],
    testNamesAr: ['سكر صائم FBS', 'وظائف كلى KFT', 'دهون دم كاملة Lipid'],
    totalPriceEgp: 470,
    paidAmountEgp: 470,
    criticalAlertCount: 1,
    technicalNotes: 'عينة دم صائم 12 ساعة، تم التوزيع على جهاز الكيمياء الآلي Cobas c311.',
    results: [
      { parameterId: 'fbs_val', parameterNameEn: 'Fasting Blood Glucose', parameterNameAr: 'سكر الدم الصائم', unit: 'mg/dL', value: '465', evaluation: 'critical_high', refRangeText: '70 - 100 mg/dL', notes: '🚨 قيمة حرجة مهددة للحياة (Severe Hyperglycemia) - استدعاء سريري فوري' },
      { parameterId: 'creat', parameterNameEn: 'Serum Creatinine', parameterNameAr: 'الكرياتينين', unit: 'mg/dL', value: '1.4', evaluation: 'high', refRangeText: '0.6 - 1.2 mg/dL' },
      { parameterId: 'urea', parameterNameEn: 'Blood Urea', parameterNameAr: 'اليوريا', unit: 'mg/dL', value: '54', evaluation: 'high', refRangeText: '15 - 45 mg/dL' },
    ],
  },
];

// --------------------------------------------------------------------------
// Lab Analyzers (Laboratory Instrumentation & Quality Control)
// --------------------------------------------------------------------------

export const LAB_ANALYZERS: LabAnalyzer[] = [
  {
    id: 'analyzer-sysmex-xn550',
    name: 'Sysmex XN-550 Automated Hematology Analyzer',
    manufacturer: 'Sysmex Corporation (Japan)',
    model: 'XN-550 5-Part Differential',
    category: 'hematology',
    status: 'qc_passed',
    lastQcDate: new Date().toISOString().slice(0, 10),
    throughputPerHour: 60,
    installedAt: '2024-03-15',
  },
  {
    id: 'analyzer-cobas-c311',
    name: 'Roche Cobas c311 Clinical Chemistry System',
    manufacturer: 'Roche Diagnostics (Germany)',
    model: 'Cobas c311 Photometric / ISE',
    category: 'clinical_chemistry',
    status: 'online',
    lastQcDate: new Date().toISOString().slice(0, 10),
    throughputPerHour: 300,
    installedAt: '2023-11-20',
  },
  {
    id: 'analyzer-elecsys-e411',
    name: 'Roche Cobas e411 Immuno-Hormone Analyzer',
    manufacturer: 'Roche Diagnostics (Germany)',
    model: 'e411 Electrochemiluminescence (ECLIA)',
    category: 'hormones',
    status: 'online',
    lastQcDate: new Date().toISOString().slice(0, 10),
    throughputPerHour: 86,
    installedAt: '2024-01-10',
  },
];

// --------------------------------------------------------------------------
// Helper Functions & Business Logic
// --------------------------------------------------------------------------

export function listLabTests(category?: LabCategory): LabTest[] {
  if (!category) return LAB_TEST_DIRECTORY;
  return LAB_TEST_DIRECTORY.filter((t) => t.category === category);
}

export function getLabTestById(id: string): LabTest | undefined {
  return LAB_TEST_DIRECTORY.find((t) => t.id === id);
}

export function listLabOrders(): LabOrder[] {
  return DEMO_LAB_ORDERS;
}

export function getLabOrderById(id: string): LabOrder | undefined {
  return DEMO_LAB_ORDERS.find((o) => o.id === id);
}

export function getLabOrderByBarcode(barcode: string): LabOrder | undefined {
  return DEMO_LAB_ORDERS.find((o) => o.barcode.toLowerCase() === barcode.trim().toLowerCase());
}

export function listAnalyzers(): LabAnalyzer[] {
  return LAB_ANALYZERS;
}

/**
 * Evaluates a numeric or textual lab parameter result against its reference intervals
 */
export function evaluateLabResult(param: TestParameter, value: string): LabResultEvaluation {
  if (!param.isNumeric) {
    const val = value.trim().toLowerCase();
    if (val.includes('pos') || val.includes('موجب')) return 'positive';
    return 'normal';
  }

  const num = parseFloat(value);
  if (Number.isNaN(num)) return 'normal';

  // Check Panic / Critical Values first
  if (param.panicMin !== undefined && num <= param.panicMin) return 'critical_low';
  if (param.panicMax !== undefined && num >= param.panicMax) return 'critical_high';

  // Check Normal Intervals
  if (param.normalMin !== undefined && num < param.normalMin) return 'low';
  if (param.normalMax !== undefined && num > param.normalMax) return 'high';

  return 'normal';
}

/**
 * Generate a Clinical AI Summary of a completed lab order
 */
export function generateAILabInterpretation(order: LabOrder): string {
  const abnormal = order.results.filter((r) => r.evaluation !== 'normal');
  if (abnormal.length === 0) {
    return 'جميع مؤشرات الفحص المعملي في الحدود الطبيعية المرجعية المعتمدة، ولا توجد مؤشرات تستدعي القلق السريري.';
  }

  const criticals = abnormal.filter((r) => r.evaluation.startsWith('critical'));
  if (criticals.length > 0) {
    return `⚠️ تنبيه سريري عاجل: توجد نتائج حرجة تتطلب تدخلاً طبياً فورياً (${criticals.map((c) => `${c.parameterNameAr}: ${c.value} ${c.unit}`).join('، ')}). يرجى مراجعة الطبيب المعالج أو أقرب طوارئ فوراً.`;
  }

  const summaryItems = abnormal.map((a) => {
    const statusText = a.evaluation === 'high' ? 'أعلى من المعدل' : 'أقل من المعدل';
    return `${a.parameterNameAr} (${a.value} ${a.unit} - ${statusText})`;
  });

  return `الفحوصات تظهر بعض القيم الخارجة عن المعدل الطبيعي: ${summaryItems.join('، ')}. يوصى بمراجعة الطبيب المعالج لتقييم الخطة العلاجية وضبط الجرعات.`;
}
